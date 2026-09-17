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

## 在线访问（GitHub Pages）

仓库已内置 `.github/workflows/deploy-pages.yml`：推送到 `main` 分支后自动构建并发布到 GitHub Pages。

开启方式：仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。发布后访问地址为：

```
https://felicityyml-max.github.io/person-dashboard/
```

## 数据存储

所有数据（年度计划、书单、笔记）保存在当前浏览器本地，换电脑或换浏览器不会同步；如需迁移，可在页面中使用浏览器开发者工具导出 `localStorage` 中 `life-workbench:*` 开头的键。
