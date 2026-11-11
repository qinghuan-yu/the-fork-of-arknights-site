# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## 用户已确认的范围

- 页面只保留前端展示和本地交互，不恢复下载、登录、充值、客服、社交平台或其他站外服务入口。
- 大型宣传片使用本地循环片段占位，保留图集、角色语音、世界观粒子动画和主题展示。
- 当前入口为 `index.html` → `src/main.jsx` → `src/App.jsx`，直接维护 React 组件、分区样式和本地 JSON 数据。不得重新引入原站编译包、业务 SDK 或旧的 `.capture/assemble.py` 组装流程。
- 仓库名称为 `the-fork-of-arknights-site`，用户已明确选择公开仓库。
- 只提交前端源码、运行素材、依赖清单、锁文件、配置和必要文档；不提交 `node_modules/`、`dist/`、打包文件、截图或采集缓存。
- 2026-11-12 按用户要求先推送源码拆分检查点，供 GPT 的 Dot 接手。先阅读根目录 `HANDOFF.md` 和 `design-qa.md`，不要将阶段性提交描述为全部完成。
