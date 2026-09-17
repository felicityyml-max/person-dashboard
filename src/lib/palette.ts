/** 计划/分类可用的高饱和色板，含黑色 */
export const PLAN_COLORS = [
  '#111111', // 墨黑
  '#374151', // 石墨灰
  '#b91c1c', // 深红
  '#ef4444', // 朱红
  '#f97316', // 亮橙
  '#f59e0b', // 琥珀
  '#eab308', // 明黄
  '#22c55e', // 翠绿
  '#10b981', // 青绿
  '#0d9488', // 墨绿
  '#06b6d4', // 青蓝
  '#2563eb', // 宝蓝
  '#6366f1', // 靛蓝
  '#8b5cf6', // 紫
  '#a855f7', // 亮紫
  '#d946ef', // 品红
  '#ec4899', // 玫红
  '#9f1239', // 酒红
];

/**
 * 柔和色板：低饱和高明度，适合需要「淡彩高亮」的视图（年度管理 V2）。
 * 全部为浅色，文字统一取深色，保证可读性。
 */
export const PLAN_SOFT_COLORS = [
  '#fff9e3', // 奶黄
  '#ffefd1', // 浅杏
  '#ffe6d9', // 浅陶
  '#ffe3e3', // 浅珊瑚
  '#fde6ef', // 浅粉
  '#f6e6ff', // 浅丁香
  '#eae5ff', // 浅紫
  '#e3ecff', // 浅蓝
  '#dff1fb', // 浅天蓝
  '#e0f4ef', // 浅青
  '#e6f6e2', // 浅绿
  '#f0f6e6', // 浅抹茶
  '#f2f0e6', // 浅米
  '#eceef2', // 浅雾灰
];

function channels(hex: string): [number, number, number] {
  const raw = hex.replace('#', '');
  const full = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw;
  const num = Number.parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 相对亮度（0 最暗，1 最亮） */
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 在饱和底色上仍然清晰可读的文字颜色 */
export function contrastText(hex: string): string {
  return luminance(hex) > 0.55 ? '#16181d' : '#ffffff';
}

export interface DayFill {
  background: string;
  color: string;
}

/**
 * 日历格高亮：单个计划用纯色块，多个计划用等分色块拼接。
 * 未安排计划的日期不加任何背景（保持纯白），与高亮态形成强对比。
 */
export function buildDayFill(colors: string[]): DayFill | null {
  if (colors.length === 0) return null;
  if (colors.length === 1) {
    return { background: colors[0], color: contrastText(colors[0]) };
  }
  const used = colors.slice(0, 3);
  const step = 100 / used.length;
  const stops = used.map((color, index) => `${color} ${index * step}% ${(index + 1) * step}%`);
  const lightest = used.reduce((a, b) => (luminance(a) > luminance(b) ? a : b));
  return {
    background: `linear-gradient(135deg, ${stops.join(', ')})`,
    color: contrastText(lightest),
  };
}
