import { useCallback, useEffect, useState } from 'react';
import { createId, clamp, todayKey } from '../annual/utils';
import type { Book, BookDraft } from './types';

const STORAGE_KEY = 'life-workbench:reading:v1';

const SAMPLE_BOOKS: Book[] = [
  {
    id: 'book-sample-1',
    title: '置身事内：中国政府与经济发展',
    author: '兰小欢',
    publisher: '上海人民出版社',
    category: '经济与管理',
    progress: 100,
    startDate: '2026-03-02',
    finishDate: '2026-04-18',
    note: '理解地方财政与土地经济的一本好书',
    createdAt: '2026-02-26',
    updatedAt: '2026-04-18',
  },
  {
    id: 'book-sample-2',
    title: '克拉拉与太阳',
    author: '石黑一雄',
    publisher: '上海译文出版社',
    category: '小说',
    progress: 45,
    startDate: '2026-08-01',
    createdAt: '2026-07-28',
    updatedAt: '2026-09-01',
  },
  {
    id: 'book-sample-3',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    publisher: '中信出版社',
    category: '历史',
    progress: 0,
    createdAt: '2026-07-28',
    updatedAt: '2026-07-28',
  },
  {
    id: 'book-sample-4',
    title: '代码整洁之道',
    author: 'Robert C. Martin',
    publisher: '人民邮电出版社',
    category: '计算机与编程',
    progress: 72,
    startDate: '2026-06-11',
    createdAt: '2026-06-10',
    updatedAt: '2026-08-20',
  },
];

function load(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { books?: Book[] };
      if (parsed && Array.isArray(parsed.books)) return parsed.books;
    }
  } catch (error) {
    console.warn('[阅读管理] 本地数据读取失败，已使用示例书单', error);
  }
  return SAMPLE_BOOKS;
}

/** 进度与时间联动：开始读自动记日期，读满自动记完成日期 */
function applyDates(book: Book): Book {
  const today = todayKey();
  const progress = clamp(Math.round(book.progress), 0, 100);
  let { startDate, finishDate } = book;
  if (progress > 0 && !startDate) startDate = today;
  if (progress >= 100) {
    if (!finishDate) finishDate = today;
  } else {
    finishDate = undefined;
  }
  return { ...book, progress, startDate, finishDate };
}

export function useReadingData() {
  const [books, setBooks] = useState<Book[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, books }));
    } catch (error) {
      console.warn('[阅读管理] 本地数据保存失败', error);
    }
  }, [books]);

  const addBook = useCallback((draft: BookDraft) => {
    const now = todayKey();
    const book: Book = {
      id: createId(),
      createdAt: now,
      updatedAt: now,
      ...draft,
    };
    setBooks((prev) => [applyDates(book), ...prev]);
  }, []);

  const updateBook = useCallback((id: string, patch: Partial<BookDraft>) => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === id
          ? applyDates({ ...book, ...patch, updatedAt: todayKey() })
          : book,
      ),
    );
  }, []);

  const setProgress = useCallback((id: string, progress: number) => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === id
          ? applyDates({ ...book, progress, updatedAt: todayKey() })
          : book,
      ),
    );
  }, []);

  const markDone = useCallback((id: string) => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === id
          ? applyDates({ ...book, progress: 100, updatedAt: todayKey() })
          : book,
      ),
    );
  }, []);

  const removeBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((book) => book.id !== id));
  }, []);

  return { books, addBook, updateBook, setProgress, markDone, removeBook };
}
