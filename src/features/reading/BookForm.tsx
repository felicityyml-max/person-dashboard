import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { BOOK_CATEGORIES, categoryColor, detectCategory } from './categories';
import type { Book, BookDraft } from './types';

interface BookFormProps {
  initial?: Book;
  onSubmit: (draft: BookDraft) => void;
  onCancel: () => void;
}

export default function BookForm({ initial, onSubmit, onCancel }: BookFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [publisher, setPublisher] = useState(initial?.publisher ?? '');
  const [category, setCategory] = useState(initial?.category ?? '其他');
  const [categoryLocked, setCategoryLocked] = useState(Boolean(initial));
  const [progress, setProgress] = useState(initial?.progress ?? 0);
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [finishDate, setFinishDate] = useState(initial?.finishDate ?? '');
  const [note, setNote] = useState(initial?.note ?? '');

  const autoCategory = useMemo(
    () => detectCategory(title, author, publisher),
    [title, author, publisher],
  );

  useEffect(() => {
    if (!categoryLocked) setCategory(autoCategory);
  }, [autoCategory, categoryLocked]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({
      title: trimmed,
      author: author.trim(),
      publisher: publisher.trim(),
      category: category || autoCategory,
      progress: Number(progress) || 0,
      startDate: startDate || undefined,
      finishDate: finishDate || undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="modal-mask" onClick={onCancel}>
      <div className="modal modal-book" onClick={(event) => event.stopPropagation()}>
        <header className="modal-head">
          <div>
            <div className="modal-date">{initial ? '编辑书籍' : '录入书籍'}</div>
            <div className="modal-sub">填写书名后会自动识别书籍类型，可手动调整</div>
          </div>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="关闭">
            ×
          </button>
        </header>

        <div className="modal-body">
          <label className="field">
            <span>书名 *</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：置身事内"
              autoFocus
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>作者</span>
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="例如：兰小欢"
              />
            </label>
            <label className="field">
              <span>出版社</span>
              <input
                value={publisher}
                onChange={(event) => setPublisher(event.target.value)}
                placeholder="例如：上海人民出版社"
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>书籍类型</span>
              <div className="select-wrap">
                <i className="cat-dot" style={{ background: categoryColor(category) }} />
                <select
                  value={category}
                  onChange={(event) => {
                    setCategoryLocked(true);
                    setCategory(event.target.value);
                  }}
                >
                  {BOOK_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <em className="field-hint">
                {categoryLocked ? '已手动指定' : `自动识别：${autoCategory}`}
              </em>
            </label>

            <label className="field">
              <span>阅读进度 {progress}%</span>
              <div className="progress-field">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={progress}
                  onChange={(event) => setProgress(Number(event.target.value))}
                />
              </div>
              <em className="field-hint">拖到 100% 会自动记录完成时间</em>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>开始阅读时间</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="field">
              <span>完成阅读时间</span>
              <input
                type="date"
                value={finishDate}
                onChange={(event) => setFinishDate(event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>备注 / 短评</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="可选：想读的原因、读后感受"
            />
          </label>
        </div>

        <footer className="modal-foot">
          <button type="button" className="btn ghost" onClick={onCancel}>
            取消
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={submit}
            style={{ opacity: title.trim() ? 1 : 0.5 } as CSSProperties}
          >
            {initial ? '保存修改' : '加入书单'}
          </button>
        </footer>
      </div>
    </div>
  );
}
