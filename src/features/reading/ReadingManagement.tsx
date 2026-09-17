import { useMemo, useState, type CSSProperties } from 'react';
import { BOOK_CATEGORIES, categoryColor } from './categories';
import BookForm from './BookForm';
import { useReadingData } from './storage';
import { STATUS_TEXT, bookStatus, type Book, type BookStatus } from './types';

const STATUS_ORDER: Record<BookStatus, number> = { reading: 0, todo: 1, done: 2 };

export default function ReadingManagement() {
  const { books, addBook, updateBook, setProgress, markDone, removeBook } = useReadingData();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | BookStatus>('all');
  const [category, setCategory] = useState('all');

  const currentYear = String(new Date().getFullYear());

  const stats = useMemo(() => {
    const counts: Record<BookStatus, number> = { todo: 0, reading: 0, done: 0 };
    let doneThisYear = 0;
    let progressSum = 0;
    for (const book of books) {
      const state = bookStatus(book);
      counts[state] += 1;
      progressSum += book.progress;
      if (book.finishDate && book.finishDate.startsWith(currentYear)) doneThisYear += 1;
    }
    return {
      total: books.length,
      ...counts,
      doneThisYear,
      avg: books.length ? Math.round(progressSum / books.length) : 0,
    };
  }, [books, currentYear]);

  const filtered = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return books
      .filter((book) => {
        if (status !== 'all' && bookStatus(book) !== status) return false;
        if (category !== 'all' && book.category !== category) return false;
        if (!key) return true;
        return [book.title, book.author, book.publisher, book.category]
          .join(' ')
          .toLowerCase()
          .includes(key);
      })
      .sort((a, b) => {
        const diff = STATUS_ORDER[bookStatus(a)] - STATUS_ORDER[bookStatus(b)];
        return diff !== 0 ? diff : b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [books, keyword, status, category]);

  return (
    <div className="reading">
      <header className="page-head">
        <div>
          <h1>阅读管理</h1>
          <p>维护待读书单，跟踪开始 / 完成时间与阅读进度</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setCreating(true)}>
          + 录入书籍
        </button>
      </header>

      <div className="stat-cards">
        <div className="stat-card">
          <span>书单总数</span>
          <b>{stats.total}</b>
        </div>
        <div className="stat-card">
          <span>在读</span>
          <b className="c-reading">{stats.reading}</b>
        </div>
        <div className="stat-card">
          <span>待读</span>
          <b className="c-todo">{stats.todo}</b>
        </div>
        <div className="stat-card">
          <span>已读完</span>
          <b className="c-done">{stats.done}</b>
        </div>
        <div className="stat-card">
          <span>{currentYear} 年读完</span>
          <b>{stats.doneThisYear}</b>
        </div>
        <div className="stat-card">
          <span>平均进度</span>
          <b>{stats.avg}%</b>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="search"
          value={keyword}
          placeholder="搜索书名、作者、出版社、类型"
          onChange={(event) => setKeyword(event.target.value)}
        />
        <select value={status} onChange={(event) => setStatus(event.target.value as 'all' | BookStatus)}>
          <option value="all">全部状态</option>
          <option value="todo">待读</option>
          <option value="reading">在读</option>
          <option value="done">已读完</option>
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">全部类型</option>
          {BOOK_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <span className="hint">共 {filtered.length} 本</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          {books.length === 0 ? '书单还是空的，点击「录入书籍」开始建立待读书单。' : '没有符合条件的书籍。'}
        </div>
      ) : (
        <div className="book-list">
          {filtered.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onProgress={(value) => setProgress(book.id, value)}
              onMarkDone={() => markDone(book.id)}
              onEdit={() => setEditing(book)}
              onRemove={() => {
                if (window.confirm(`从书单中移除《${book.title}》？`)) removeBook(book.id);
              }}
            />
          ))}
        </div>
      )}

      {creating && (
        <BookForm
          onSubmit={(draft) => {
            addBook(draft);
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {editing && (
        <BookForm
          initial={editing}
          onSubmit={(draft) => {
            updateBook(editing.id, draft);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

interface BookCardProps {
  book: Book;
  onProgress: (value: number) => void;
  onMarkDone: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function BookCard({ book, onProgress, onMarkDone, onEdit, onRemove }: BookCardProps) {
  const state = bookStatus(book);
  const color = categoryColor(book.category);

  return (
    <article className="book-card" style={{ '--c': color } as CSSProperties}>
      <div className="book-cover">{book.title.slice(0, 2)}</div>
      <div className="book-body">
        <div className="book-title">
          {book.title}
          <span className={`status s-${state}`}>{STATUS_TEXT[state]}</span>
        </div>
        <div className="book-meta">
          {book.author || '佚名'}
          {book.publisher ? ` · ${book.publisher}` : ''}
        </div>
        <div className="book-tags">
          <span className="tag cat">{book.category}</span>
          <span className="tag date">开始 {book.startDate || '未开始'}</span>
          <span className="tag date">完成 {book.finishDate || '未完成'}</span>
        </div>

        <div className="book-progress">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={book.progress}
            onChange={(event) => onProgress(Number(event.target.value))}
            aria-label={`《${book.title}》阅读进度`}
          />
          <div className="bar">
            <i style={{ width: `${book.progress}%` }} />
          </div>
          <b>{book.progress}%</b>
        </div>

        {book.note && <p className="book-note">{book.note}</p>}

        <div className="book-ops">
          {state !== 'done' && (
            <button type="button" onClick={onMarkDone}>
              标记读完
            </button>
          )}
          <button type="button" onClick={onEdit}>
            编辑
          </button>
          <button type="button" className="danger" onClick={onRemove}>
            移除
          </button>
        </div>
      </div>
    </article>
  );
}
