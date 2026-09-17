import { useSyncExternalStore } from 'react';
import { autoLayout, findFreeSpot } from './layout';
import {
  NOTE_DEFAULT_HEIGHT,
  NOTE_DEFAULT_WIDTH,
  type Note,
  type NoteDraft,
  type NotePatch,
} from './types';

const STORAGE_KEY = 'life-workbench:notes:v1';

function createId(): string {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function seed(): Note[] {
  const now = Date.now();
  return [
    {
      id: createId(),
      title: '使用说明',
      content:
        '1. 点「新建」添加笔记卡片；\n2. 卡片右下角可拖拽调整大小；\n3. 卡片底部实时统计字数；\n4. 双击卡片正文可进入编辑。',
      createdAt: now,
      updatedAt: now,
      width: NOTE_DEFAULT_WIDTH,
      height: NOTE_DEFAULT_HEIGHT,
      x: 20,
      y: 20,
      z: 1,
    },
  ];
}

/** 补齐旧数据缺失的尺寸 / 位置 / 层级字段 */
function normalize(list: Note[]): Note[] {
  const spots = autoLayout(list, 1200);
  return list.map((note, index) => ({
    ...note,
    width: note.width || NOTE_DEFAULT_WIDTH,
    height: note.height || NOTE_DEFAULT_HEIGHT,
    x: Number.isFinite(note.x) ? note.x : spots[index].x,
    y: Number.isFinite(note.y) ? note.y : spots[index].y,
    z: Number.isFinite(note.z) ? note.z : index,
  }));
}

function load(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Note[];
      if (Array.isArray(parsed)) return normalize(parsed);
    }
  } catch (error) {
    console.warn('[笔记管理] 本地数据读取失败，已重置', error);
  }
  return seed();
}

function maxZ(): number {
  return state.reduce((max, note) => Math.max(max, note.z ?? 0), 0);
}

function persist(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.warn('[笔记管理] 本地数据保存失败', error);
  }
}

/** 全局共享的笔记仓库：右侧面板与笔记管理页面共用同一份数据 */
let state: Note[] = load();
const listeners = new Set<() => void>();

function setState(next: Note[]) {
  state = next;
  persist(state);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function addNote(draft: NoteDraft, canvasWidth = 1200) {
  const now = Date.now();
  const spot = findFreeSpot(state, NOTE_DEFAULT_WIDTH, NOTE_DEFAULT_HEIGHT, canvasWidth);
  setState([
    {
      id: createId(),
      title: draft.title,
      content: draft.content,
      createdAt: now,
      updatedAt: now,
      width: NOTE_DEFAULT_WIDTH,
      height: NOTE_DEFAULT_HEIGHT,
      x: spot.x,
      y: spot.y,
      z: maxZ() + 1,
    },
    ...state,
  ]);
}

function updateNote(id: string, patch: NotePatch) {
  setState(
    state.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note)),
  );
}

function removeNote(id: string) {
  setState(state.filter((note) => note.id !== id));
}

/** 把某张卡片提到最上层 */
function bringToFront(id: string) {
  const z = maxZ() + 1;
  if (state.every((note) => note.id !== id || note.z >= z)) return;
  setState(state.map((note) => (note.id === id ? { ...note, z } : note)));
}

/** 一键整理：按行自动排布所有卡片 */
function tidyNotes(canvasWidth: number) {
  const ordered = [...state].sort((a, b) => a.y - b.y || a.x - b.x || b.z - a.z);
  const spots = autoLayout(ordered, canvasWidth);
  const map = new Map(ordered.map((note, index) => [note.id, spots[index]]));
  setState(
    state.map((note) => {
      const spot = map.get(note.id);
      return spot ? { ...note, x: spot.x, y: spot.y } : note;
    }),
  );
}

export function useNotes() {
  const notes = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { notes, addNote, updateNote, removeNote, bringToFront, tidyNotes };
}
