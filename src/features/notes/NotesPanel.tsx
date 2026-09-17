import { useMemo, useState } from 'react';
import NoteCard from './NoteCard';
import { useNotes } from './storage';
import { countWords } from './types';

interface NotesPanelProps {
  onClose: () => void;
}

export default function NotesPanel({ onClose }: NotesPanelProps) {
  const { notes, addNote, updateNote, removeNote } = useNotes();
  const [keyword, setKeyword] = useState('');

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

  return (
    <aside className="notes-dock">
      <header className="nd-head">
        <div>
          <h2>笔记管理</h2>
          <p>
            共 {notes.length} 条 · 累计 {totalWords} 字
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={onClose} aria-label="收起笔记管理">
          收起
        </button>
      </header>

      <div className="nd-tools">
        <input
          value={keyword}
          placeholder="搜索标题或内容"
          onChange={(event) => setKeyword(event.target.value)}
        />
        <button type="button" className="btn" onClick={() => addNote({ title: '', content: '' })}>
          新建
        </button>
      </div>

      <div className="nd-list">
        {filtered.map((note) => (
          <NoteCard key={note.id} note={note} onChange={updateNote} onRemove={removeNote} />
        ))}
        {filtered.length === 0 && (
          <p className="nd-empty">{notes.length === 0 ? '还没有笔记，点「新建」开始记录' : '没有匹配的笔记'}</p>
        )}
      </div>
    </aside>
  );
}
