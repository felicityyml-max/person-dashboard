import { useEffect, useState, type CSSProperties } from 'react';
import { contrastText } from '../../lib/palette';
import type { DayInfo } from './calendar';
import type { DayMark, PlanItem } from './types';

interface DayDialogProps {
  day: DayInfo;
  plans: PlanItem[];
  mark?: DayMark;
  onToggle: (planId: string) => void;
  onNoteChange: (note: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const WEEK_TEXT = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export default function DayDialog({
  day,
  plans,
  mark,
  onToggle,
  onNoteChange,
  onClear,
  onClose,
}: DayDialogProps) {
  const [note, setNote] = useState(mark?.note ?? '');

  useEffect(() => {
    setNote(mark?.note ?? '');
  }, [day.date, mark?.note]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const selected = mark?.planIds ?? [];

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <header className="modal-head">
          <div>
            <div className="modal-date">
              {day.year} 年 {day.month} 月 {day.day} 日
              <span className="modal-week">{WEEK_TEXT[day.weekday]}</span>
            </div>
            <div className="modal-sub">
              {day.lunarText}
              {day.jieqi && <span className="tag jieqi">节气 · {day.jieqi}</span>}
              {day.lunarFestivals.map((item) => (
                <span key={item} className="tag festival">
                  {item}
                </span>
              ))}
              {day.solarFestivals.map((item) => (
                <span key={item} className="tag festival">
                  {item}
                </span>
              ))}
              {day.holiday && (
                <span className={`tag ${day.holiday.isWorkday ? 'work' : 'rest'}`}>
                  {day.holiday.isWorkday ? `${day.holiday.name} · 补班` : `${day.holiday.name} · 假期`}
                </span>
              )}
              <span className="tag ganzhi">
                {day.ganzhi}年 · {day.shengxiao}
              </span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <div className="modal-body">
          <div className="modal-section-title">安排计划（再次点击可取消）</div>
          {plans.length === 0 ? (
            <p className="modal-empty">还没有计划项，请先在上方「新增计划项」。</p>
          ) : (
            <div className="chip-list">
              {plans.map((plan) => {
                const on = selected.includes(plan.id);
                return (
                  <button
                    key={plan.id}
                    type="button"
                    className={`plan-chip${on ? ' is-on' : ''}`}
                    style={{ '--c': plan.color, '--on-c': contrastText(plan.color) } as CSSProperties}
                    onClick={() => onToggle(plan.id)}
                  >
                    <i className="chip-dot" />
                    {plan.name}
                    {on && <span className="chip-check">已安排</span>}
                  </button>
                );
              })}
            </div>
          )}

          <div className="modal-section-title">备注</div>
          <textarea
            value={note}
            placeholder="例如：瑜伽 60 分钟 / 三亚 5 天 / 植物园半日"
            onChange={(event) => {
              setNote(event.target.value);
              onNoteChange(event.target.value);
            }}
          />
        </div>

        <footer className="modal-foot">
          <button type="button" className="btn ghost danger" onClick={onClear}>
            清空当天
          </button>
          <button type="button" className="btn primary" onClick={onClose}>
            完成
          </button>
        </footer>
      </div>
    </div>
  );
}
