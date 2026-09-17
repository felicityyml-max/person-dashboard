import { useState } from 'react';
import AnnualManagement from './features/annual/AnnualManagement';
import NotesPage from './features/notes/NotesPage';
import NotesPanel from './features/notes/NotesPanel';
import ReadingManagement from './features/reading/ReadingManagement';

type NavId = 'annual-v2' | 'reading' | 'notes' | 'month' | 'habit' | 'ledger';

const NAV: { id: NavId; name: string; desc: string; soon?: boolean }[] = [
  { id: 'annual-v2', name: '年度管理', desc: '一月一行 · 12 行年历' },
  { id: 'reading', name: '阅读管理', desc: '书单 · 进度 · 起止时间' },
  { id: 'notes', name: '笔记管理', desc: '卡片 · 字数 · 可拖拽' },
  { id: 'month', name: '月度计划', desc: '按周拆解目标', soon: true },
  { id: 'habit', name: '习惯打卡', desc: '每日坚持记录', soon: true },
  { id: 'ledger', name: '家庭账本', desc: '收支与预算', soon: true },
];

const ICONS: Record<NavId, string> = {
  'annual-v2': 'M3 6h14M3 10h14M3 14h14M6 4v3M14 4v3',
  month: 'M3 4h14v12H3zM3 8h14M8 8v8M12 8v8',
  habit: 'M4 10l3 3 5-6M3 4h14v12H3z',
  ledger: 'M3 6h14v10H3zM3 9h14M13 13h2',
  reading: 'M4 5h5v11H4zM11 5h5v11h-5z',
  notes: 'M5 3h7l3 3v11H5zM8 8h4M8 11h4M8 14h2',
};

export default function App() {
  const [active, setActive] = useState<NavId>('annual-v2');
  const [notesOpen, setNotesOpen] = useState(true);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">生</span>
          <span>
            生活工作台
            <em>集成式个人管理</em>
          </span>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item${active === item.id ? ' is-active' : ''}`}
              disabled={item.soon}
              onClick={() => setActive(item.id)}
            >
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                <path
                  d={ICONS[item.id]}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="nav-text">
                {item.name}
                <em>{item.desc}</em>
              </span>
              {item.soon && <span className="soon">规划中</span>}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className={`nav-item nav-notes${notesOpen ? ' is-active' : ''}`}
          onClick={() => setNotesOpen((prev) => !prev)}
        >
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path
              d="M5 3h7l3 3v11H5zM8 8h4M8 11h4M8 14h2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="nav-text">
            笔记面板
            <em>右侧速记 · 可收起</em>
          </span>
        </button>
        <div className="sidebar-foot">数据仅保存在本机浏览器，不上传任何服务器。</div>
      </aside>

      <main className="main">
        {active === 'annual-v2' && <AnnualManagement />}
        {active === 'reading' && <ReadingManagement />}
        {active === 'notes' && <NotesPage />}
      </main>

      {notesOpen && <NotesPanel onClose={() => setNotesOpen(false)} />}
    </div>
  );
}
