import { Fragment, useState, type CSSProperties } from 'react';
import { PLAN_COLORS } from '../../lib/palette';
import type { PlanDraft, PlanItem } from './types';

interface PlanPanelProps {
  year: number;
  plans: PlanItem[];
  actual: Record<string, number>;
  focusPlanId: string | null;
  /** 可选色板，默认使用饱和色板 PLAN_COLORS */
  palette?: string[];
  /** 色板中淡彩分组的起始下标，用于分组展示 */
  softFrom?: number;
  onFocus: (id: string | null) => void;
  onAdd: (draft: PlanDraft) => void;
  onUpdate: (id: string, patch: Partial<PlanDraft>) => void;
  onRemove: (id: string) => void;
}

export default function PlanPanel({
  year,
  plans,
  actual,
  focusPlanId,
  palette = PLAN_COLORS,
  softFrom,
  onFocus,
  onAdd,
  onUpdate,
  onRemove,
}: PlanPanelProps) {
  const [editing, setEditing] = useState<PlanItem | null>(null);
  const [creating, setCreating] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
  };

  return (
    <div className="plan-panel">
      <div className="plan-panel-head">
        <div className="plan-panel-title">
          <h2>{year} 年计划项</h2>
          <p>点击任意日期 → 勾选计划项即可安排；点击计划卡片可在日历中单独高亮该项</p>
        </div>
        <div className="plan-panel-actions">
          {focusPlanId && (
            <button type="button" className="btn ghost" onClick={() => onFocus(null)}>
              取消高亮
            </button>
          )}
          <button type="button" className="btn primary" onClick={openCreate}>
            + 新增计划项
          </button>
        </div>
      </div>

      <div className="plan-list">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            done={actual[plan.id] ?? 0}
            focused={focusPlanId === plan.id}
            onFocus={onFocus}
            onEdit={() => {
              setCreating(false);
              setEditing(plan);
            }}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
        {plans.length === 0 && <p className="plan-empty">还没有计划项，先添加一个吧。</p>}
      </div>

      {(creating || editing) && (
        <PlanForm
          initial={editing ?? undefined}
          palette={palette}
          softFrom={softFrom}
          defaultColor={palette[plans.length % palette.length]}
          onSubmit={(draft) => {
            if (editing) onUpdate(editing.id, draft);
            else onAdd(draft);
            closeForm();
          }}
          onCancel={closeForm}
        />
      )}
    </div>
  );
}

interface PlanCardProps {
  plan: PlanItem;
  done: number;
  focused: boolean;
  onFocus: (id: string | null) => void;
  onEdit: () => void;
  onUpdate: (id: string, patch: Partial<PlanDraft>) => void;
  onRemove: (id: string) => void;
}

function PlanCard({ plan, done, focused, onFocus, onEdit, onUpdate, onRemove }: PlanCardProps) {
  const percent = plan.target > 0 ? Math.min(100, Math.round((done / plan.target) * 100)) : 0;

  return (
    <div
      className={`plan-card${focused ? ' is-focus' : ''}`}
      style={{ '--c': plan.color } as CSSProperties}
    >
      <button
        type="button"
        className="plan-top"
        onClick={() => onFocus(focused ? null : plan.id)}
        title={focused ? '取消高亮' : '在日历中高亮该计划'}
      >
        <span className="plan-dot" />
        <span className="plan-name">{plan.name}</span>
      </button>

      <div className="plan-nums">
        <div className="plan-num actual">
          <b>{done}</b>
          <span>实际完成</span>
        </div>
        <div className="plan-num target">
          <button
            type="button"
            className="step"
            onClick={() => onUpdate(plan.id, { target: Math.max(0, plan.target - 1) })}
            aria-label="减少计划次数"
          >
            −
          </button>
          <b>{plan.target}</b>
          <button
            type="button"
            className="step"
            onClick={() => onUpdate(plan.id, { target: plan.target + 1 })}
            aria-label="增加计划次数"
          >
            +
          </button>
          <span>计划次数</span>
        </div>
      </div>

      <div className="plan-bar">
        <i style={{ width: `${percent}%` }} />
      </div>
      <div className="plan-foot">
        <span className="plan-percent">{percent}%</span>
        <span className="plan-ops">
          <button type="button" onClick={onEdit}>
            编辑
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (window.confirm(`删除计划项「${plan.name}」？日历中已安排的记录也会一并移除。`)) {
                onRemove(plan.id);
              }
            }}
          >
            删除
          </button>
        </span>
      </div>
    </div>
  );
}

interface PlanFormProps {
  initial?: PlanItem;
  palette: string[];
  softFrom?: number;
  defaultColor: string;
  onSubmit: (draft: PlanDraft) => void;
  onCancel: () => void;
}

function PlanForm({
  initial,
  palette,
  softFrom,
  defaultColor,
  onSubmit,
  onCancel,
}: PlanFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? defaultColor);
  const [target, setTarget] = useState(String(initial?.target ?? 12));

  return (
    <form
      className="plan-form"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        onSubmit({ name: trimmed, color, target: Math.max(0, Number(target) || 0) });
      }}
    >
      <div className="plan-form-row">
        <label>
          <span>名称</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：练瑜伽 / 远途旅行"
            autoFocus
          />
        </label>
        <label className="narrow">
          <span>计划次数</span>
          <input
            type="number"
            min={0}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          />
        </label>
      </div>
      <div className="plan-form-row colors">
        <span>高亮颜色</span>
        <div className="color-options">
          {palette.map((item, index) => (
            <Fragment key={item}>
              {softFrom !== undefined && index === softFrom && (
                <span className="color-tag">淡彩</span>
              )}
              <button
                type="button"
                className={`color-dot${item === color ? ' is-active' : ''}`}
                style={{ background: item }}
                onClick={() => setColor(item)}
                aria-label={`选择颜色 ${item}`}
              />
            </Fragment>
          ))}
        </div>
      </div>
      <div className="plan-form-foot">
        <button type="button" className="btn ghost" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn primary">
          {initial ? '保存修改' : '添加计划项'}
        </button>
      </div>
    </form>
  );
}
