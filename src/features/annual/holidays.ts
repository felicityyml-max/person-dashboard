import { Solar } from 'lunar-javascript';
import { pad2, toDateKey } from './utils';

export interface FestivalRange {
  name: string;
  /** YYYY-MM-DD，含当天 */
  start: string;
  /** YYYY-MM-DD，含当天 */
  end: string;
}

export interface YearSchedule {
  festivals: FestivalRange[];
  /** 调休补班日 */
  workdays: string[];
}

/**
 * 国务院办公厅公布的放假安排。
 * 未录入的年份会退化为「法定节日」标记（只标节日当天，不含调休）。
 */
export const HOLIDAY_SCHEDULES: Record<number, YearSchedule> = {
  2025: {
    festivals: [
      { name: '元旦', start: '2025-01-01', end: '2025-01-01' },
      { name: '春节', start: '2025-01-28', end: '2025-02-04' },
      { name: '清明节', start: '2025-04-04', end: '2025-04-06' },
      { name: '劳动节', start: '2025-05-01', end: '2025-05-05' },
      { name: '端午节', start: '2025-05-31', end: '2025-06-02' },
      { name: '国庆节 / 中秋节', start: '2025-10-01', end: '2025-10-08' },
    ],
    workdays: ['2025-01-26', '2025-02-08', '2025-04-27', '2025-09-28', '2025-10-11'],
  },
  2026: {
    festivals: [
      { name: '元旦', start: '2026-01-01', end: '2026-01-03' },
      { name: '春节', start: '2026-02-15', end: '2026-02-23' },
      { name: '清明节', start: '2026-04-04', end: '2026-04-06' },
      { name: '劳动节', start: '2026-05-01', end: '2026-05-05' },
      { name: '端午节', start: '2026-06-19', end: '2026-06-21' },
      { name: '中秋节', start: '2026-09-25', end: '2026-09-27' },
      { name: '国庆节', start: '2026-10-01', end: '2026-10-07' },
    ],
    workdays: ['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10'],
  },
};

export interface HolidayInfo {
  /** 假期名称，补班日为「调休」 */
  name: string;
  /** true 表示节假日调休需要上班 */
  isWorkday: boolean;
  /** 该假期第一天（放假首日），用于在日历上标注节日名 */
  isStart: boolean;
}

const yearCache = new Map<number, Map<string, HolidayInfo>>();

function buildYearMap(year: number): Map<string, HolidayInfo> {
  const map = new Map<string, HolidayInfo>();
  const schedule = HOLIDAY_SCHEDULES[year];

  if (schedule) {
    for (const festival of schedule.festivals) {
      const start = new Date(`${festival.start}T00:00:00Z`);
      const end = new Date(`${festival.end}T00:00:00Z`);
      for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
        const d = new Date(t);
        map.set(toDateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()), {
          name: festival.name,
          isWorkday: false,
          isStart: t === start.getTime(),
        });
      }
    }
    for (const workday of schedule.workdays) {
      map.set(workday, { name: '调休', isWorkday: true, isStart: false });
    }
    return map;
  }

  // 未录入年份：只标记法定节日本身
  const add = (month: number, day: number, name: string) => {
    map.set(toDateKey(year, month, day), { name, isWorkday: false, isStart: true });
  };
  add(1, 1, '元旦');
  add(5, 1, '劳动节');
  add(10, 1, '国庆节');
  add(10, 2, '国庆节');
  add(10, 3, '国庆节');

  for (let month = 1; month <= 12; month += 1) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const lunar = Solar.fromYmd(year, month, day).getLunar();
      const lunarMonth = lunar.getMonth();
      const lunarDay = lunar.getDay();
      if (lunarMonth === 1 && lunarDay <= 3) add(month, day, '春节');
      if (lunarMonth === 5 && lunarDay === 5) add(month, day, '端午节');
      if (lunarMonth === 8 && lunarDay === 15) add(month, day, '中秋节');
      if (lunar.getJieQi() === '清明') add(month, day, '清明节');
    }
  }
  return map;
}

function getYearMap(year: number): Map<string, HolidayInfo> {
  let map = yearCache.get(year);
  if (!map) {
    map = buildYearMap(year);
    yearCache.set(year, map);
  }
  return map;
}

export function getHoliday(dateKey: string): HolidayInfo | undefined {
  const year = Number.parseInt(dateKey.slice(0, 4), 10);
  return getYearMap(year).get(dateKey);
}

export function getHolidaySource(year: number): string {
  return HOLIDAY_SCHEDULES[year]
    ? '放假安排：国务院办公厅通知'
    : '放假安排：仅标记法定节日（该年调休安排未录入）';
}

export function formatRange(start: string, end: string): string {
  const [, sm, sd] = start.split('-');
  const [, em, ed] = end.split('-');
  if (start === end) return `${Number(sm)}月${Number(sd)}日`;
  return `${Number(sm)}月${Number(sd)}日 - ${Number(em)}月${Number(ed)}日`;
}

export function weekdayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const week = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][week];
}

export function keyToLabel(dateKey: string): string {
  const [, m, d] = dateKey.split('-');
  return `${pad2(Number(m))}-${pad2(Number(d))}`;
}
