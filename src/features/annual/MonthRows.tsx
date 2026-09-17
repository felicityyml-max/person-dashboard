import { useMemo, type CSSProperties } from 'react';
import { MONTH_LABELS, buildMonthWeeks, type DayInfo } from './calendar';
import type { DayMark, PlanItem } from './types';
import { buildDayFill } from '../../lib/palette';

interface MonthRowsProps {
  year: number;
  months: number[];
  plans: PlanItem[];
  marks: Record<string, DayMark>;
  focusPlanId: string | null;
  onSelect: (day: DayInfo) => void;
}

const MAX_COLUMNS = 31;

/** 底色：法定假期飘浅红，周六日飘奶黄（调休补班按工作日处理，不着色） */
const TINT_BG = {
  rest: '#fdecec',
  weekend: '#fff9e3',
} as const;

/** 已安排计划时，底色被计划色覆盖，改用底部色条提示当日属性 */
const TINT_STRIP = {
  rest: '#e5484d',
  weekend: '#dfc264',
} as const;

type Tint = keyof typeof TINT_BG;

/** 年度管理 V2：每个月一行，横向 1～31 号 */
export default function MonthRows({
  year,
  months,
  plans,
  marks,
  focusPlanId,
  onSelect,
}: MonthRowsProps) {
  return (
    <div className="rows-calendar">
      <div className="rows-grid">
        <div className="rows-head">
          <span className="rows-corner">月份</span>
          {Array.from({ length: MAX_COLUMNS }, (_, index) => (
            <span key={index} className="rows-day">
              {index + 1}
            </span>
          ))}
        </div>

        {months.map((month) => (
          <MonthRow
            key={month}
            year={year}
            month={month}
            plans={plans}
            marks={marks}
            focusPlanId={focusPlanId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

interface MonthRowProps {
  year: number;
  month: number;
  plans: PlanItem[];
  marks: Record<string, DayMark>;
  focusPlanId: string | null;
  onSelect: (day: DayInfo) => void;
}

function MonthRow({ year, month, plans, marks, focusPlanId, onSelect }: MonthRowProps) {
  const days = useMemo(
    () => buildMonthWeeks(year, month).flat().filter((day) => day.inMonth),
    [year, month],
  );
  const markedCount = days.filter((day) => (marks[day.date]?.planIds.length ?? 0) > 0).length;

  return (
    <div className="rows-row">
      <div className="rows-label">
        <b>{MONTH_LABELS[month - 1]}</b>
        <span>{markedCount > 0 ? `${markedCount} 天已安排` : ''}</span>
      </div>

      {Array.from({ length: MAX_COLUMNS }, (_, index) => {
        const day = days[index];
        if (!day) return <span key={index} className="row-cell-empty" />;
        return (
          <RowCell
            key={day.date}
            day={day}
            plans={plans}
            mark={marks[day.date]}
            focusPlanId={focusPlanId}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}

interface RowCellProps {
  day: DayInfo;
  plans: PlanItem[];
  mark?: DayMark;
  focusPlanId: string | null;
  onSelect: (day: DayInfo) => void;
}

function RowCell({ day, plans, mark, focusPlanId, onSelect }: RowCellProps) {
  const dayPlans = mark ? plans.filter((plan) => mark.planIds.includes(plan.id)) : [];
  const isRest = Boolean(day.holiday && !day.holiday.isWorkday);
  const isMakeUp = Boolean(day.holiday?.isWorkday);
  const dimmed = focusPlanId ? !dayPlans.some((plan) => plan.id === focusPlanId) : false;

  const fill = buildDayFill(dayPlans.map((plan) => plan.color));

  const tint: Tint | null = isRest ? 'rest' : day.isWeekend && !isMakeUp ? 'weekend' : null;

  const style: CSSProperties = fill
    ? { background: fill.background, color: fill.color }
    : tint
      ? { background: TINT_BG[tint] }
      : {};
  if (tint && fill) (style as Record<string, string>)['--strip'] = TINT_STRIP[tint];

  const classNames = ['day-cell', 'is-row'];
  if (day.isWeekend) classNames.push('is-weekend');
  if (isRest) classNames.push('is-rest');
  if (isMakeUp) classNames.push('is-makeup');
  if (day.isToday) classNames.push('is-today');
  if (dayPlans.length > 0) classNames.push('has-plan');
  if (fill?.color === '#ffffff') classNames.push('is-light-text');
  if (dimmed) classNames.push('is-dimmed');
  if (tint) classNames.push(`tint-${tint}`);
  if (tint && fill) classNames.push('has-tint-strip');

  const tooltip = [
    `${day.month}月${day.day}日 星期${'日一二三四五六'[day.weekday]} ${day.lunarText}`,
    day.jieqi ? `节气：${day.jieqi}` : '',
    day.holiday ? (day.holiday.isWorkday ? '调休补班' : `${day.holiday.name}假期`) : '',
    dayPlans.length > 0 ? `计划：${dayPlans.map((plan) => plan.name).join('、')}` : '',
    mark?.note ? `备注：${mark.note}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      style={style}
      title={tooltip}
      onClick={() => onSelect(day)}
    >
      <span className="day-num">{day.day}</span>
      <span className={`day-label kind-${day.labelKind}`}>{day.label}</span>
      {dayPlans.length > 0 && (
        <span className="day-dots">
          {dayPlans.slice(0, 4).map((plan) => (
            <i key={plan.id} style={{ background: plan.color }} />
          ))}
          {dayPlans.length > 4 && <em>+{dayPlans.length - 4}</em>}
        </span>
      )}
      {isRest && <span className="day-badge rest">休</span>}
      {isMakeUp && <span className="day-badge work">班</span>}
      {mark?.note && <span className="day-note" />}
    </button>
  );
}
