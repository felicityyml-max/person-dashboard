import { Solar } from 'lunar-javascript';
import { buildMonthWeeks, type DayInfo } from './calendar';

export interface MonthInsight {
  month: number;
  totalDays: number;
  /** 法定节假日放假天数 */
  holidayDays: number;
  /** 周六日总数（含调休补班） */
  weekendDays: number;
  /** 调休补班天数 */
  makeUpDays: number;
  /** 法定工作日 */
  workdays: number;
  holidayNames: string[];
  jieqi: string[];
  yearGanzhi: string;
  monthGanzhi: string;
  /** 建议休假天数 */
  suggestLeave: number;
  /** 拼假方案说明 */
  leaveReason: string;
  /** 本月适合（玄学一句话） */
  fortune: string;
}

/* ---------------------------------- 基础统计 --------------------------------- */

function isRestDay(day: DayInfo): boolean {
  const holiday = day.holiday;
  if (holiday?.isWorkday) return false;
  if (holiday) return true;
  return day.isWeekend;
}

function holidayNameOf(day: DayInfo): string {
  return day.holiday ? day.holiday.name.split(' / ')[0] : '';
}

function daysInMonth(year: number, month: number): DayInfo[] {
  return buildMonthWeeks(year, month).flat().filter((day) => day.inMonth);
}

/* ---------------------------------- 全年概览 --------------------------------- */

export interface YearSummary {
  totalDays: number;
  /** 法定工作日（已扣除法定假期与周末，调休补班计入工作） */
  workdays: number;
  /** 法定假期放假天数 */
  holidayDays: number;
  /** 周六日总数（含调休补班） */
  weekendDays: number;
  makeUpDays: number;
}

export function summarizeYear(year: number): YearSummary {
  let totalDays = 0;
  let holidayDays = 0;
  let weekendDays = 0;
  let makeUpDays = 0;
  let restDays = 0;

  for (let month = 1; month <= 12; month += 1) {
    for (const day of daysInMonth(year, month)) {
      totalDays += 1;
      if (day.holiday?.isWorkday) makeUpDays += 1;
      if (day.holiday && !day.holiday.isWorkday) holidayDays += 1;
      if (day.isWeekend) weekendDays += 1;
      if (isRestDay(day)) restDays += 1;
    }
  }

  return { totalDays, workdays: totalDays - restDays, holidayDays, weekendDays, makeUpDays };
}

/* ---------------------------------- 玄学文案 --------------------------------- */

const BRANCH_ELEMENT: Record<string, string> = {
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
  子: '水',
  丑: '土',
};

const BRANCH_ORGAN: Record<string, string> = {
  木: '肝胆',
  火: '心与小肠',
  土: '脾胃',
  金: '肺与大肠',
  水: '肾与膀胱',
};

/** 按月支（节气月）给出的本月宜忌 */
const BRANCH_TRAIT: Record<string, string> = {
  寅: '阳气初生，宜把一年的计划立起来、舒展筋骨早睡早起，忌久坐郁怒',
  卯: '木气最旺，宜踏青疏肝、开始新习惯，忌熬夜耗血',
  辰: '湿土司令，宜健脾祛湿、给年度目标做第一次复盘，忌思虑过度',
  巳: '火气渐长，宜养心安神、推进对外合作与表达，忌急躁争执',
  午: '火旺至极，宜午间小憩、借离火之势做品牌与输出，忌烈日下硬撑',
  未: '土燥当令，宜清补脾胃、安排本地游与亲子时间，忌贪凉伤阳',
  申: '金气初起，宜润肺收敛、把上半年项目收口，忌悲秋伤感',
  酉: '金气清肃，宜润燥养肺、做成果盘点与收纳整理，忌过度操劳',
  戌: '燥土当令，宜温补脾胃、储备过冬资源，忌口舌是非',
  亥: '水气始凝，宜早卧晚起、养肾藏精并起草明年规划，忌过度消耗',
  子: '水气极盛，宜静养闭藏、泡脚温肾、读书沉淀，忌大动干戈',
  丑: '寒土收尾，宜结账复盘、温养脾胃、陪伴家人，忌冒进开工',
};

/** 九紫离火运（2024—2043）下的五行应对 */
const ELEMENT_LIHUO: Record<string, string> = {
  木: '九紫离火运中木生火，想法宜公开表达、落到内容与作品',
  火: '九紫离火当运，火气通心，名利易显，更需防心浮气躁',
  土: '离火生土，宜沉淀资源、做长期资产的布局',
  金: '火克金，宜收敛锋芒、以柔克刚，把锋利留给执行',
  水: '水火既济，宜以静制动、暗中蓄力',
};

function buildFortune(yearGanzhi: string, monthGanzhi: string): string {
  const branch = monthGanzhi.slice(-1);
  const element = BRANCH_ELEMENT[branch] ?? '土';
  const organ = BRANCH_ORGAN[element];
  const trait = BRANCH_TRAIT[branch] ?? '宜顺势而为、稳中求进';
  const lihuo = ELEMENT_LIHUO[element];
  return `${yearGanzhi}年${monthGanzhi}月，${element}气当令、主${organ}：${trait}；${lihuo}。`;
}

/* ---------------------------------- 拼假规划 --------------------------------- */

interface RestRun {
  start: number;
  end: number;
  len: number;
  anchor: string;
}

interface BridgeOption {
  /** 需要请假的天数 */
  k: number;
  /** 请假后可连休的总天数 */
  span: number;
  /** 建议请假的日期（YYYY-MM-DD） */
  dates: string[];
  anchor: string;
}

const MAX_LEAVE_PER_MONTH = 2;
/** 请假 1 天至少换来 3 天连休，才值得开口 */
const MIN_RATIO = 3;

function buildRuns(days: DayInfo[]): RestRun[] {
  const runs: RestRun[] = [];
  let start = -1;
  days.forEach((day, index) => {
    if (isRestDay(day)) {
      if (start === -1) start = index;
      return;
    }
    if (start !== -1) {
      runs.push(makeRun(days, start, index - 1));
      start = -1;
    }
  });
  if (start !== -1) runs.push(makeRun(days, start, days.length - 1));
  return runs;
}

function makeRun(days: DayInfo[], start: number, end: number): RestRun {
  let anchor = '';
  for (let i = start; i <= end && !anchor; i += 1) anchor = holidayNameOf(days[i]);
  return { start, end, len: end - start + 1, anchor: anchor || '周末' };
}

/** 找出每个休息块向前/向后借 k 个工作日可拼出的连休方案 */
function bridgeOptions(days: DayInfo[], runs: RestRun[]): Map<number, BridgeOption[]> {
  const result = new Map<number, BridgeOption[]>();

  runs.forEach((run, index) => {
    const prev = index > 0 ? runs[index - 1] : null;
    const next = index < runs.length - 1 ? runs[index + 1] : null;
    const gapBefore = prev ? run.start - prev.end - 1 : run.start;
    const gapAfter = next ? next.start - run.end - 1 : days.length - 1 - run.end;

    for (let k = 1; k <= 3; k += 1) {
      // 向前借：把假期前面 k 个工作日请掉
      if (run.start - k >= 0 && gapBefore >= k) {
        const merged = prev && gapBefore === k ? prev.len + k + run.len : k + run.len;
        push(result, k, {
          k,
          span: merged,
          dates: days.slice(run.start - k, run.start).map((day) => day.date),
          anchor: run.anchor,
        });
      }
      // 向后借：把假期后面 k 个工作日请掉
      if (run.end + k < days.length && gapAfter >= k) {
        const merged = next && gapAfter === k ? run.len + k + next.len : k + run.len;
        push(result, k, {
          k,
          span: merged,
          dates: days.slice(run.end + 1, run.end + 1 + k).map((day) => day.date),
          anchor: run.anchor,
        });
      }
    }
  });

  return result;
}

function push(map: Map<number, BridgeOption[]>, k: number, option: BridgeOption) {
  const list = map.get(k) ?? [];
  list.push(option);
  map.set(k, list);
}

function formatDates(dates: string[]): string {
  return dates.map((date) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`).join('、');
}

interface MonthCandidate {
  month: number;
  score: number;
  /** k 天 -> 最优方案 */
  options: Map<number, BridgeOption>;
  holidayDays: number;
}

/** 出行舒适度：春秋最佳，夏季适合远途，冬季偏静养 */
const SEASON_BONUS = [0.3, 0.3, 0.8, 1, 0.9, 0.5, 0.5, 0.6, 0.8, 1, 0.9, 0.2];

export function buildMonthInsights(year: number, quota = 10): MonthInsight[] {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const allDays = months.flatMap((month) => daysInMonth(year, month));

  const stats = months.map((month) => {
    const days = daysInMonth(year, month);
    const holidaySet = new Set<string>();
    const jieqi: string[] = [];
    let holidayDays = 0;
    let weekendDays = 0;
    let makeUpDays = 0;
    let restDays = 0;

    for (const day of days) {
      if (day.holiday?.isWorkday) makeUpDays += 1;
      if (day.holiday && !day.holiday.isWorkday) {
        holidayDays += 1;
        const name = holidayNameOf(day);
        if (name) holidaySet.add(name);
      }
      if (day.isWeekend) weekendDays += 1;
      if (isRestDay(day)) restDays += 1;
      if (day.jieqi) jieqi.push(day.jieqi);
    }

    // 月干支与年干支都按节气划分，取月中那天为准（正月/腊月仍属上一干支年）
    const lunar = Solar.fromYmd(year, month, 15).getLunar();
    const mid = lunar.getMonthInGanZhi();
    const ganzhiYear = lunar.getYearInGanZhi();
    return {
      month,
      totalDays: days.length,
      holidayDays,
      weekendDays,
      makeUpDays,
      workdays: days.length - restDays,
      holidayNames: [...holidaySet],
      jieqi,
      yearGanzhi: ganzhiYear,
      monthGanzhi: mid,
      suggestLeave: 0,
      leaveReason: '',
      fortune: buildFortune(ganzhiYear, mid),
    } satisfies MonthInsight;
  });

  /* ------------------------------ 年假分配 ------------------------------ */
  const runs = buildRuns(allDays);
  const globalOptions = bridgeOptions(allDays, runs);

  const candidates: MonthCandidate[] = months.map((month) => {
    const stat = stats[month - 1];
    const options = new Map<number, BridgeOption>();
    for (const [k, list] of globalOptions) {
      const inMonth = list.filter((option) =>
        option.dates.some((date) => Number(date.slice(5, 7)) === month),
      );
      if (inMonth.length === 0) continue;
      const best = inMonth.reduce((a, b) => (b.span > a.span ? b : a));
      if (best.span >= MIN_RATIO * k) options.set(k, best);
    }

    const bestSpan = [...options.values()].reduce((max, option) => Math.max(max, option.span), 0);
    // 假期多、拼假收益高、季节适宜、且上半年优先消化即将在 8/30 过期的旧额度
    const score =
      stat.holidayDays * 1.2 + bestSpan * 1 + SEASON_BONUS[month - 1] + (month <= 8 ? 0.6 : 0);

    return { month, score, options, holidayDays: stat.holidayDays };
  });

  const order = [...candidates].sort((a, b) => b.score - a.score);
  let remaining = quota;
  let progress = true;
  while (remaining > 0 && progress) {
    progress = false;
    for (const candidate of order) {
      if (remaining === 0) break;
      const stat = stats[candidate.month - 1];
      const next = stat.suggestLeave + 1;
      if (next > MAX_LEAVE_PER_MONTH) continue;
      const option = candidate.options.get(next);
      if (!option) continue;
      stat.suggestLeave = next;
      remaining -= 1;
      progress = true;
    }
  }

  // 额度没用完（可拼假期不足）时，补给得分最高的月份
  for (const candidate of order) {
    if (remaining === 0) break;
    const stat = stats[candidate.month - 1];
    const add = Math.min(remaining, MAX_LEAVE_PER_MONTH);
    const option = candidate.options.get(add) ?? candidate.options.get(add - 1);
    if (!option) continue;
    stat.suggestLeave = add;
    remaining -= add;
  }

  for (const candidate of candidates) {
    const stat = stats[candidate.month - 1];
    if (stat.suggestLeave === 0) {
      stat.leaveReason =
        stat.holidayDays > 0
          ? `本月已有 ${stat.holidayDays} 天法定假期，额度留给更值得拼的月份`
          : '本月无假期可拼，建议把年假留给假期集中的月份';
      continue;
    }
    const option = candidate.options.get(stat.suggestLeave);
    if (!option) continue;
    stat.leaveReason = `请 ${option.k} 天（${formatDates(option.dates)}）拼${option.anchor}，可连休 ${option.span} 天`;
  }

  return stats;
}
