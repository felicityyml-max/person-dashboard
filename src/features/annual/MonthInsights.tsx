import { MONTH_LABELS } from './calendar';
import type { MonthInsight } from './monthInsight';

interface MonthInsightsProps {
  year: number;
  insights: MonthInsight[];
  quota: number;
}

export default function MonthInsights({ year, insights, quota }: MonthInsightsProps) {
  const used = insights.reduce((sum, item) => sum + item.suggestLeave, 0);

  return (
    <section className="insights">
      <header className="insights-head">
        <div>
          <h2>{year} 年月度休假建议</h2>
          <p>
            年假 <b>{quota}</b> 天（上一年度额度在次年 8/30 过期）· 优先拼在法定假期前后，单次只请
            1～2 天，用最少请假天数换最长连休，减少请假心理负担
          </p>
        </div>
        <div className="insights-sum">
          <b>{used}</b>
          <span>已规划年假 / {quota} 天</span>
        </div>
      </header>

      <div className="insight-list">
        {insights.map((item) => (
          <article key={item.month} className={`insight-card${item.suggestLeave > 0 ? ' is-key' : ''}`}>
            <div className="ic-head">
              <h3>{MONTH_LABELS[item.month - 1]}</h3>
              <span className="ic-tag">{item.monthGanzhi}月</span>
            </div>

            <div className="ic-stats">
              <div>
                <b>{item.holidayDays}</b>
                <span>法定节假日</span>
              </div>
              <div>
                <b>{item.weekendDays}</b>
                <span>周六日</span>
                {item.makeUpDays > 0 && <em>补班 {item.makeUpDays} 天</em>}
              </div>
              <div>
                <b>{item.workdays}</b>
                <span>工作日</span>
              </div>
              <div className="is-leave">
                <b>{item.suggestLeave}</b>
                <span>建议休假</span>
              </div>
            </div>

            {(item.holidayNames.length > 0 || item.jieqi.length > 0) && (
              <div className="ic-chips">
                {item.holidayNames.map((name) => (
                  <span key={name} className="chip holiday">
                    {name}
                  </span>
                ))}
                {item.jieqi.map((name) => (
                  <span key={name} className="chip jieqi">
                    {name}
                  </span>
                ))}
              </div>
            )}

            <p className="ic-reason">{item.leaveReason}</p>
            <p className="ic-fortune">
              <span>本月适合</span>
              {item.fortune}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
