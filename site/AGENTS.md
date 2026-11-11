# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## 用户已确认的范围

- 页面只保留前端展示和本地交互，不恢复下载、登录、充值、客服、社交平台或其他站外服务入口。
- 大型宣传片使用本地循环片段占位，保留图集、角色语音、世界观粒子动画和主题展示。
- 当前以原站编译资源为基础；服务入口清理必须同时更新首屏 HTML 与客户端组件，并能通过 `.capture/assemble.py` 重建。
- 仓库名称为 `the-fork-of-arknights-site`，用户已明确选择公开仓库。
