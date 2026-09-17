import { NOTE_DEFAULT_HEIGHT, NOTE_DEFAULT_WIDTH, type Note } from './types';

export const NOTE_GAP = 14;

export interface Spot {
  x: number;
  y: number;
}

function rect(note: Note): { left: number; top: number; right: number; bottom: number } {
  return {
    left: note.x,
    top: note.y,
    right: note.x + note.width,
    bottom: note.y + note.height,
  };
}

function overlaps(a: Note, spot: Spot, width: number, height: number): boolean {
  const box = rect(a);
  return !(
    spot.x + width <= box.left ||
    spot.x >= box.right ||
    spot.y + height <= box.top ||
    spot.y >= box.bottom
  );
}

/** 为新卡片找一个不重叠的空位，找不到就层叠摆放 */
export function findFreeSpot(
  notes: Note[],
  width = NOTE_DEFAULT_WIDTH,
  height = NOTE_DEFAULT_HEIGHT,
  canvasWidth = 1200,
): Spot {
  const step = 28;
  const usable = Math.max(width + step, canvasWidth);
  for (let y = 20; y < 6000; y += step) {
    for (let x = 20; x + width <= usable; x += step) {
      if (!notes.some((note) => overlaps(note, { x, y }, width, height))) return { x, y };
    }
  }
  return { x: 20 + (notes.length % 8) * step, y: 20 + (notes.length % 8) * step };
}

/** 自动整理：按行从左到右、从上到下排列 */
export function autoLayout(notes: Note[], canvasWidth: number): Spot[] {
  const usable = Math.max(NOTE_MIN_LAYOUT_WIDTH, canvasWidth);
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  return notes.map((note) => {
    const width = note.width || NOTE_DEFAULT_WIDTH;
    const height = note.height || NOTE_DEFAULT_HEIGHT;
    if (x > 0 && x + width > usable) {
      x = 0;
      y += rowHeight + NOTE_GAP;
      rowHeight = 0;
    }
    const spot: Spot = { x, y };
    x += width + NOTE_GAP;
    rowHeight = Math.max(rowHeight, height);
    return spot;
  });
}

const NOTE_MIN_LAYOUT_WIDTH = 320;
