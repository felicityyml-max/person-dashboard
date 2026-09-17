export interface PlanItem {
  id: string;
  /** 计划项名称，如「练瑜伽」 */
  name: string;
  /** 高亮色，十六进制 */
  color: string;
  /** 本年计划次数 */
  target: number;
}

export interface DayMark {
  planIds: string[];
  note?: string;
}

export interface AnnualData {
  version: number;
  plans: PlanItem[];
  /** key 为 YYYY-MM-DD */
  marks: Record<string, DayMark>;
}

export interface PlanDraft {
  name: string;
  color: string;
  target: number;
}
