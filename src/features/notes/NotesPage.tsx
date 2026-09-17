import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NoteCard from './NoteCard';
import { useNotes } from './storage';
import { countWords } from './types';

const CANVAS_MIN_HEIGHT = 620;

export default function NotesPage() {
  const { notes, addNote, updateNote, removeNote, bringToFront, tidyNotes } = useNotes();
  const [keyword, setKeyword] = useState('');
  const [canvasWidth, setCanvasWidth] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => setCanvasWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(key) || note.content.toLowerCase().includes(key),
    );
  }, [notes, keyword]);

  const totalWords = useMemo(
    () => notes.reduce((sum, note) => sum + countWords(note.content), 0),
    [notes],
  );

  /** 画布高度随卡片位置增长，保证总能往下拖 */
  const canvasHeight = useMemo(() => {
    const bottom = notes.reduce((max, note) => Math.max(max, note.y + note.height), 0);
    return Math.max(CANVAS_MIN_HEIGHT, bottom + 80);
  }, [notes]);

  /** 窗口变窄时把越界卡片收回可视范围（只影响显示，不改写存储） */
  const visible = useMemo(() => {
    if (!canvasWidth) return filtered;
    return filtered.map((note) => ({
      ...note,
      x: Math.min(note.x, Math.max(0, canvasWidth - note.width)),
    }));
  }, [filtered, canvasWidth]);

  const createNote = useCallback(() => {
    addNote({ title: '', content: '' }, canvasWidth || 1200);
  }, [addNote, canvasWidth]);

  const tidy = useCallback(() => {
    tidyNotes(canvasWidth || 1200);
  }, [tidyNotes, canvasWidth]);

  return (
    <div className="notes-page">
      <header className="page-head">
        <div>
          <h1>笔记管理</h1>
          <p>
            共 {notes.length} 条笔记，累计 {totalWords} 字 —— 按住卡片标题栏可随意拖动位置，右下角可调整大小
          </p>
        </div>
        <div className="np-tools">
          <input
            value={keyword}
            placeholder="搜索标题或内容"
            onChange={(event) => setKeyword(event.target.value)}
          />
          <button type="button" className="btn ghost" onClick={tidy}>
            整理排列
          </button>
          <button type="button" className="btn" onClick={createNote}>
            新建笔记
          </button>
        </div>
      </header>

      <div
        className="np-canvas"
        ref={canvasRef}
        style={{ height: canvasHeight }}
      >
        {visible.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            mode="free"
            onChange={updateNote}
            onRemove={removeNote}
            onBringToFront={bringToFront}
          />
        ))}
        {visible.length === 0 && (
          <p className="np-empty">
            {notes.length === 0 ? '还没有笔记，点右上角「新建笔记」开始记录' : '没有匹配的笔记'}
          </p>
        )}
      </div>
    </div>
  );
}
