export interface Book {
  id: string;
  /** 书名 */
  title: string;
  author: string;
  publisher: string;
  /** 书籍类型（自动识别，可手动修改） */
  category: string;
  /** 阅读进度 0-100 */
  progress: number;
  /** 开始阅读时间 YYYY-MM-DD */
  startDate?: string;
  /** 完成阅读时间 YYYY-MM-DD */
  finishDate?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookDraft {
  title: string;
  author: string;
  publisher: string;
  category: string;
  progress: number;
  startDate?: string;
  finishDate?: string;
  note?: string;
}

export type BookStatus = 'todo' | 'reading' | 'done';

export const STATUS_TEXT: Record<BookStatus, string> = {
  todo: '待读',
  reading: '在读',
  done: '已读完',
};

export function bookStatus(book: Book): BookStatus {
  if (book.progress >= 100 || book.finishDate) return 'done';
  if (book.progress > 0 || book.startDate) return 'reading';
  return 'todo';
}
