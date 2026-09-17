import { useMemo, useState } from 'react';
import type { DayInfo } from './calendar';
import { getHolidaySource } from './holidays';
import { useAnnualData } from './storage';
import DayDialog from './DayDialog';
import MonthInsights from './MonthInsights';
import MonthRows from './MonthRows';
import { buildMonthInsights, summarizeYear } from './monthInsight';
import PlanPanel from './PlanPanel';
import { clamp, isLeapYear } from './utils';
import { PLAN_COLORS, PLAN_SOFT_COLORS } from '../../lib/palette';

const MIN_YEAR = 1950;
const MAX_YEAR = 2050;
const YEAR_OPTIONS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
const ALL_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
/** 每年年假额度，上一年度额度在次年 8/30 过期 */
const ANNUAL_LEAVE = 10;

export default function AnnualManagement() {
  const { data, addPlan, updatePlan, removePlan, toggleDayPlan, setDayNote, clearDay, resetAll } =
    useAnnualData();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [mode, setMode] = useState<'year' | 'month'>('year');
  const [selected, setSelected] = useState<DayInfo | null>(null);
  const [focusPlanId, setFocusPlanId] = useState<string | null>(null);

  const actual = useMemo(() => {
    const result: Record<string, number> = {};
    for (const plan of data.plans) result[plan.id] = 0;
    const prefix = `${year}-`;
    for (const [key, mark] of Object.entries(data.marks)) {
      if (!key.startsWith(prefix)) continue;
      for (const id of mark.planIds) {
        if (result[id] !== undefined) result[id] += 1;
      }
    }
    return result;
  }, [data.plans, data.marks, year]);

  const markedDays = useMemo(
    () =>
      Object.entries(data.marks).filter(
        ([key, mark]) => key.startsWith(`${year}-`) && mark.planIds.length > 0,
      ).length,
    [data.marks, year],
  );

  const totalDone = useMemo(
    () => Object.values(actual).reduce((sum, value) => sum + value, 0),
    [actual],
  );

  const daysInYear = isLeapYear(year) ? 366 : 365;

  const yearSummary = useMemo(() => summarizeYear(year), [year]);

  const monthInsights = useMemo(() => buildMonthInsights(year, ANNUAL_LEAVE), [year]);

  const shiftYear = (delta: number) => setYear((prev) => clamp(prev + delta, MIN_YEAR, MAX_YEAR));

  const shiftMonth = (delta: number) => {
    let nextMonth = month + delta;
    let nextYear = year;
    while (nextMonth < 1) {
      nextMonth += 12;
      nextYear -= 1;
    }
    while (nextMonth > 12) {
      nextMonth -= 12;
      nextYear += 1;
    }
    if (nextYear < MIN_YEAR || nextYear > MAX_YEAR) return;
    setYear(nextYear);
    setMonth(nextMonth);
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  return (
    <div className="annual">
      <header className="page-head">
        <div>
          <h1>年度管理</h1>
          <p>把一年的计划铺在 {daysInYear} 天里 —— 农历、节气、法定节假日与调休一目了然</p>
        </div>
        <div className="year-switch">
          <button type="button" onClick={() => shiftYear(-1)} aria-label="上一年">
            ‹
          </button>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {YEAR_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item} 年
              </option>
            ))}
          </select>
          <button type="button" onClick={() => shiftYear(1)} aria-label="下一年">
            ›
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="view-switch">
            <button
              type="button"
              className={mode === 'year' ? 'is-active' : ''}
              onClick={() => setMode('year')}
            >
              年视图
            </button>
            <button
              type="button"
              className={mode === 'month' ? 'is-active' : ''}
              onClick={() => setMode('month')}
            >
              月视图
            </button>
          </div>
          {mode === 'month' && (
            <div className="month-switch">
              <button type="button" onClick={() => shiftMonth(-1)} aria-label="上个月">
                ‹
              </button>
              <span>{month} 月</span>
              <button type="button" onClick={() => shiftMonth(1)} aria-label="下个月">
                ›
              </button>
            </div>
          )}
          <span className="hint">{getHolidaySource(year)}</span>
        </div>

        <div className="toolbar-right">
          <div className="stats">
            <span>
              本年 <b>{yearSummary.totalDays}</b> 天
            </span>
            <span>
              工作日 <b>{yearSummary.workdays}</b> 天
            </span>
            <span>
              法定假日 <b>{yearSummary.holidayDays}</b> 天
            </span>
            <span>
              周六日 <b>{yearSummary.weekendDays}</b> 天
              {yearSummary.makeUpDays > 0 && <em>补班 {yearSummary.makeUpDays}</em>}
            </span>
            <span>
              已安排 <b>{markedDays}</b> 天
            </span>
            <span>
              计划项 <b>{data.plans.length}</b> 个
            </span>
            <span>
              累计完成 <b>{totalDone}</b> 次
            </span>
          </div>
          <button type="button" className="btn ghost" onClick={goToday}>
            回到今天
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              if (window.confirm('清空全部计划项与日历安排？该操作不可撤销。')) resetAll();
            }}
          >
            重置数据
          </button>
        </div>
      </div>

      <PlanPanel
        year={year}
        plans={data.plans}
        actual={actual}
        focusPlanId={focusPlanId}
        palette={[...PLAN_COLORS, ...PLAN_SOFT_COLORS]}
        softFrom={PLAN_COLORS.length}
        onFocus={setFocusPlanId}
        onAdd={addPlan}
        onUpdate={updatePlan}
        onRemove={removePlan}
      />

      <div className="legend">
        <span className="lg">
          <i className="sw" style={{ background: '#e5484d' }} />
          法定假期
        </span>
        <span className="lg">
          <i className="sw" style={{ background: '#8a90a6' }} />
          调休补班
        </span>
        <span className="lg">
          <i className="sw" style={{ background: '#0f9960' }} />
          节气
        </span>
        <span className="lg">
          <i className="sw" style={{ background: '#d6336c' }} />
          农历节日
        </span>
        <span className="lg">
          <i className="sw" style={{ background: '#4f46e5' }} />
          今日
        </span>
        <span className="lg">
          <i className="sw" style={{ background: '#fdecec', boxShadow: 'inset 0 0 0 1px #f0c9c9' }} />
          法定假期底色
        </span>
        <span className="lg">
          <i className="sw" style={{ background: '#fff9e3', boxShadow: 'inset 0 0 0 1px #ecdca8' }} />
          双休日底色
        </span>
        <span className="lg muted">点击日期即可安排计划，颜色对应不同计划项</span>
      </div>

      <MonthRows
        year={year}
        months={mode === 'year' ? ALL_MONTHS : [month]}
        plans={data.plans}
        marks={data.marks}
        focusPlanId={focusPlanId}
        onSelect={setSelected}
      />

      <MonthInsights year={year} insights={monthInsights} quota={ANNUAL_LEAVE} />

      {selected && (
        <DayDialog
          day={selected}
          plans={data.plans}
          mark={data.marks[selected.date]}
          onToggle={(planId) => toggleDayPlan(selected.date, planId)}
          onNoteChange={(note) => setDayNote(selected.date, note)}
          onClear={() => clearDay(selected.date)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
