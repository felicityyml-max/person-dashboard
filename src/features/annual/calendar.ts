import { Solar } from 'lunar-javascript';
import { getHoliday, type HolidayInfo } from './holidays';
import { toDateKey } from './utils';

/** 公历类法定节日：在放假首日直接显示节日名 */
const SOLAR_HOLIDAY_LABELS = ['元旦', '劳动节', '国庆节'];

export const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
export const MONTH_LABELS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

export interface BaseDayInfo {
  /** YYYY-MM-DD */
  date: string;
  year: number;
  month: number;
  day: number;
  /** 0 = 星期日 */
  weekday: number;
  isWeekend: boolean;
  isToday: boolean;
  /** 单元格第二行文本：农历节日 > 节气 > 农历日 */
  label: string;
  labelKind: 'festival' | 'jieqi' | 'lunar';
  jieqi: string;
  solarFestivals: string[];
  lunarFestivals: string[];
  lunarText: string;
  ganzhi: string;
  shengxiao: string;
  holiday?: HolidayInfo;
}

export interface DayInfo extends BaseDayInfo {
  /** 是否属于当前展示的月份 */
  inMonth: boolean;
}

const cache = new Map<string, BaseDayInfo>();

export function getTodayKey(): string {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function compute(year: number, month: number, day: number): BaseDayInfo {
  const date = toDateKey(year, month, day);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();

  const jieqi = lunar.getJieQi() || '';
  const lunarFestivals = lunar.getFestivals();
  const solarFestivals = solar.getFestivals();
  const lunarDay = lunar.getDayInChinese();
  const lunarMonth = lunar.getMonthInChinese();
  const isLeap = lunar.getMonth() < 0;

  let label = lunarDay;
  let labelKind: BaseDayInfo['labelKind'] = 'lunar';
  const holiday = getHoliday(date);
  const holidayName = holiday ? holiday.name.split(' / ')[0] : '';
  if (lunarFestivals.length > 0) {
    label = lunarFestivals[0];
    labelKind = 'festival';
  } else if (jieqi) {
    label = jieqi;
    labelKind = 'jieqi';
  } else if (holiday && !holiday.isWorkday && holiday.isStart && SOLAR_HOLIDAY_LABELS.includes(holidayName)) {
    label = holidayName;
    labelKind = 'festival';
  } else if (lunarDay === '初一') {
    label = `${isLeap ? '闰' : ''}${lunarMonth}月`;
  }

  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return {
    date,
    year,
    month,
    day,
    weekday,
    isWeekend: weekday === 0 || weekday === 6,
    isToday: false,
    label,
    labelKind,
    jieqi,
    solarFestivals,
    lunarFestivals,
    lunarText: `农历${isLeap ? '闰' : ''}${lunarMonth}月${lunarDay}`,
    ganzhi: lunar.getYearInGanZhi(),
    shengxiao: lunar.getYearShengXiao(),
    holiday,
  };
}

function getBaseDay(year: number, month: number, day: number): BaseDayInfo {
  const key = toDateKey(year, month, day);
  const hit = cache.get(key);
  if (hit) return hit;
  const info = compute(year, month, day);
  cache.set(key, info);
  return info;
}

function shift(year: number, month: number, day: number, delta: number): BaseDayInfo {
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return getBaseDay(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** 生成某个月的日历（按周补齐前后相邻月份） */
export function buildMonthWeeks(year: number, month: number, todayKey = getTodayKey()): DayInfo[][] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: DayInfo[] = [];

  for (let i = firstWeekday; i > 0; i -= 1) {
    cells.push({ ...shift(year, month, 1, -i), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ ...getBaseDay(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    cells.push({ ...shift(last.year, last.month, last.day, 1), inMonth: false });
  }

  const weeks: DayInfo[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(
      cells.slice(i, i + 7).map((cell) => ({ ...cell, isToday: cell.date === todayKey })),
    );
  }
  return weeks;
}
