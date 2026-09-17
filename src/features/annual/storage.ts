import { useCallback, useEffect, useState } from 'react';
import type { AnnualData, DayMark, PlanDraft, PlanItem } from './types';
import { createId } from './utils';

const STORAGE_KEY = 'life-workbench:annual:v1';

export const DEFAULT_PLANS: PlanItem[] = [
  { id: 'plan-yoga', name: '练瑜伽', color: '#8b5cf6', target: 60 },
  { id: 'plan-long-trip', name: '远途旅行', color: '#2563eb', target: 4 },
  { id: 'plan-local-trip', name: '本地游', color: '#10b981', target: 12 },
  { id: 'plan-family-trip', name: '亲子游', color: '#f97316', target: 8 },
];

function load(): AnnualData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AnnualData;
      if (parsed && Array.isArray(parsed.plans)) {
        return { version: 1, plans: parsed.plans, marks: parsed.marks ?? {} };
      }
    }
  } catch (error) {
    console.warn('[年度管理] 本地数据读取失败，已使用默认数据', error);
  }
  return { version: 1, plans: DEFAULT_PLANS, marks: {} };
}

export function useAnnualData() {
  const [data, setData] = useState<AnnualData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('[年度管理] 本地数据保存失败', error);
    }
  }, [data]);

  const addPlan = useCallback((draft: PlanDraft) => {
    setData((prev) => ({
      ...prev,
      plans: [...prev.plans, { id: createId(), ...draft }],
    }));
  }, []);

  const updatePlan = useCallback((id: string, patch: Partial<PlanDraft>) => {
    setData((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)),
    }));
  }, []);

  const removePlan = useCallback((id: string) => {
    setData((prev) => {
      const marks: Record<string, DayMark> = {};
      for (const [key, mark] of Object.entries(prev.marks)) {
        const planIds = mark.planIds.filter((pid) => pid !== id);
        if (planIds.length > 0 || mark.note) marks[key] = { ...mark, planIds };
      }
      return { ...prev, plans: prev.plans.filter((plan) => plan.id !== id), marks };
    });
  }, []);

  const toggleDayPlan = useCallback((dateKey: string, planId: string) => {
    setData((prev) => {
      const current = prev.marks[dateKey]?.planIds ?? [];
      const planIds = current.includes(planId)
        ? current.filter((id) => id !== planId)
        : [...current, planId];
      const marks = { ...prev.marks };
      const note = prev.marks[dateKey]?.note;
      if (planIds.length === 0 && !note) {
        delete marks[dateKey];
      } else {
        marks[dateKey] = { ...prev.marks[dateKey], planIds };
      }
      return { ...prev, marks };
    });
  }, []);

  const setDayNote = useCallback((dateKey: string, note: string) => {
    setData((prev) => {
      const marks = { ...prev.marks };
      const planIds = prev.marks[dateKey]?.planIds ?? [];
      const trimmed = note.trim();
      if (planIds.length === 0 && !trimmed) {
        delete marks[dateKey];
      } else {
        marks[dateKey] = { planIds, note: trimmed || undefined };
      }
      return { ...prev, marks };
    });
  }, []);

  const clearDay = useCallback((dateKey: string) => {
    setData((prev) => {
      const marks = { ...prev.marks };
      delete marks[dateKey];
      return { ...prev, marks };
    });
  }, []);

  const resetAll = useCallback(() => {
    setData({ version: 1, plans: DEFAULT_PLANS, marks: {} });
  }, []);

  return { data, addPlan, updatePlan, removePlan, toggleDayPlan, setDayNote, clearDay, resetAll };
}
