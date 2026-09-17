import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  NOTE_MAX_HEIGHT,
  NOTE_MAX_WIDTH,
  NOTE_MIN_HEIGHT,
  NOTE_MIN_WIDTH,
  countWords,
  formatTime,
  type Note,
  type NotePatch,
} from './types';

interface NoteCardProps {
  note: Note;
  onChange: (id: string, patch: NotePatch) => void;
  onRemove: (id: string) => void;
  /** stack：竖向堆叠（右侧面板）；free：自由画布，可拖位置 */
  mode?: 'stack' | 'free';
  onBringToFront?: (id: string) => void;
}

export default function NoteCard({
  note,
  onChange,
  onRemove,
  mode = 'stack',
  onBringToFront,
}: NoteCardProps) {
  const free = mode === 'free';
  const [editing, setEditing] = useState(!note.title && !note.content);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [size, setSize] = useState({ width: note.width, height: note.height });
  const [pos, setPos] = useState({ x: note.x, y: note.y });
  const [moving, setMoving] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const resizeRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const moveRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => setSize({ width: note.width, height: note.height }), [note.width, note.height]);
  useEffect(() => setPos({ x: note.x, y: note.y }), [note.x, note.y]);

  /** 可视范围：宽度上限、可拖动的边界 */
  const bounds = () => {
    const parent = cardRef.current?.parentElement;
    const pw = parent?.clientWidth ?? NOTE_MAX_WIDTH;
    const ph = parent?.clientHeight ?? 0;
    return {
      maxW: Math.min(NOTE_MAX_WIDTH, Math.max(NOTE_MIN_WIDTH, pw - 4)),
      maxX: Math.max(0, pw - size.width - 2),
      maxY: Math.max(0, ph - Math.min(size.height, ph) - 2),
    };
  };

  const startEdit = () => {
    setTitle(note.title);
    setContent(note.content);
    setEditing(true);
  };

  const cancelEdit = () => {
    setTitle(note.title);
    setContent(note.content);
    setEditing(false);
  };

  const save = () => {
    onChange(note.id, { title: title.trim(), content });
    setEditing(false);
  };

  const startResize = (event: React.PointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const { maxW } = bounds();
    resizeRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: size.width,
      height: size.height,
    };

    const onMove = (moveEvent: PointerEvent) => {
      const start = resizeRef.current;
      if (!start) return;
      setSize({
        width: clamp(start.width + moveEvent.clientX - start.x, NOTE_MIN_WIDTH, maxW),
        height: clamp(
          start.height + moveEvent.clientY - start.y,
          NOTE_MIN_HEIGHT,
          NOTE_MAX_HEIGHT,
        ),
      });
    };

    const onUp = (upEvent: PointerEvent) => {
      const start = resizeRef.current;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      if (!start) return;
      const next = {
        width: clamp(start.width + upEvent.clientX - start.x, NOTE_MIN_WIDTH, maxW),
        height: clamp(start.height + upEvent.clientY - start.y, NOTE_MIN_HEIGHT, NOTE_MAX_HEIGHT),
      };
      resizeRef.current = null;
      setSize(next);
      onChange(note.id, next);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  /** 按住卡片头部拖动位置（自由画布模式） */
  const startMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!free || editing) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, input, textarea, .nc-resize')) return;
    event.preventDefault();
    onBringToFront?.(note.id);
    const { maxX, maxY } = bounds();
    moveRef.current = { x: pos.x, y: pos.y, px: event.clientX, py: event.clientY };
    setMoving(true);

    const onMove = (moveEvent: PointerEvent) => {
      const start = moveRef.current;
      if (!start) return;
      setPos({
        x: clamp(start.x + moveEvent.clientX - start.px, 0, maxX),
        y: clamp(start.y + moveEvent.clientY - start.py, 0, maxY),
      });
    };

    const onUp = (upEvent: PointerEvent) => {
      const start = moveRef.current;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      moveRef.current = null;
      setMoving(false);
      if (!start) return;
      const next = {
        x: clamp(start.x + upEvent.clientX - start.px, 0, maxX),
        y: clamp(start.y + upEvent.clientY - start.py, 0, maxY),
      };
      setPos(next);
      onChange(note.id, next);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const words = countWords(editing ? content : note.content);
  const chars = (editing ? content : note.content).length;

  const style: CSSProperties = free
    ? {
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        zIndex: moving ? 999 : note.z,
      }
    : size;

  return (
    <article
      ref={cardRef}
      className={`note-card${editing ? ' is-editing' : ''}${free ? ' is-free' : ''}${
        moving ? ' is-moving' : ''
      }`}
      style={style}
    >
      <header className="nc-head" onPointerDown={startMove}>
        {free && !editing && (
          <span className="nc-grip" title="按住这里拖动卡片位置">
            ⠿
          </span>
        )}
        {editing ? (
          <input
            value={title}
            placeholder="笔记标题"
            onChange={(event) => setTitle(event.target.value)}
          />
        ) : (
          <h4 title={note.title}>{note.title || '未命名笔记'}</h4>
        )}
        <div className="nc-actions">
          {editing ? (
            <>
              <button type="button" className="is-primary" onClick={save}>
                保存
              </button>
              <button type="button" onClick={cancelEdit}>
                取消
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={startEdit}>
                编辑
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={() => {
                  if (window.confirm('删除这条笔记？该操作不可撤销。')) onRemove(note.id);
                }}
              >
                删除
              </button>
            </>
          )}
        </div>
      </header>

      {editing ? (
        <textarea
          className="nc-body"
          value={content}
          placeholder="写下你的想法…"
          onChange={(event) => setContent(event.target.value)}
        />
      ) : (
        <div className="nc-body" onDoubleClick={startEdit} title="双击编辑">
          {note.content || '（空白笔记，双击开始编辑）'}
        </div>
      )}

      <footer className="nc-foot">
        <span title={`含空格共 ${chars} 个字符`}>
          字数 <b>{words}</b>
        </span>
        <span>更新于 {formatTime(note.updatedAt)}</span>
      </footer>

      <span
        className="nc-resize"
        onPointerDown={startResize}
        title="拖拽调整卡片大小"
        role="presentation"
      />
    </article>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
