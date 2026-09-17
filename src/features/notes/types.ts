export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  /** 卡片尺寸，可拖拽调整 */
  width: number;
  height: number;
  /** 卡片在自由画布上的位置（左上角坐标） */
  x: number;
  y: number;
  /** 叠放层级，越大越靠前 */
  z: number;
}

export type NoteDraft = Pick<Note, 'title' | 'content'>;
export type NotePatch = Partial<NoteDraft & Pick<Note, 'width' | 'height' | 'x' | 'y' | 'z'>>;

export const NOTE_MIN_WIDTH = 200;
export const NOTE_MAX_WIDTH = 760;
export const NOTE_MIN_HEIGHT = 120;
export const NOTE_MAX_HEIGHT = 900;
export const NOTE_DEFAULT_WIDTH = 340;
export const NOTE_DEFAULT_HEIGHT = 180;

/** 中英文混排字数：中文按字计，英文/数字按词计 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const matches = trimmed.match(/[一-龥]|[A-Za-z0-9_'-]+/g);
  return matches ? matches.length : 0;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getMonth() + 1}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
