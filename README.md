# 生活工作台（Person Dashboard）

集成式个人管理工作台：年度管理（一月一行年历 · 法定节假日 · 计划安排）、阅读管理、笔记管理（自由画布卡片）。数据全部保存在浏览器 localStorage，不上传服务器。

## 本地启动

```bash
npm install
npm run dev      # http://127.0.0.1:5173/
```

其它命令：

```bash
npm run build    # 类型检查 + 生产构建，输出 dist/
npm run preview  # 本地预览构建产物
```

环境要求：Node.js 18+（推荐 20）。

## 功能模块

| 模块 | 说明 |
| --- | --- |
| 年度管理 | 12 行一月一行年历；法定假期浅红底、双休日 `#fff9e3`；计划项可配色/聚焦；月度休假建议 |
| 阅读管理 | 书单、阅读进度与起止时间 |
| 笔记管理 | 自由画布笔记卡片：按住标题栏拖动位置、右下角调整大小、字数统计、搜索、置顶与一键整理排列 |

## 换一台电脑使用

```bash
git clone https://github.com/felicityyml-max/person-dashboard.git
cd person-dashboard
npm install
npm run dev
```

打开 `http://127.0.0.1:5173/` 即可；后续更新用 `git pull` 拉取。

> 说明：仓库内置 `.github/workflows/ci.yml`，每次推送会自动做类型检查 + 构建，保证代码可运行。若要把页面直接挂到公网（GitHub Pages），需要仓库为 public 且套餐支持 Pages，届时在 **Settings → Pages → Source** 选择 **GitHub Actions** 并新增部署流程即可。

## 数据存储

所有数据（年度计划、书单、笔记）保存在当前浏览器本地，换电脑或换浏览器不会同步；如需迁移，可在页面中使用浏览器开发者工具导出 `localStorage` 中 `life-workbench:*` 开头的键。
