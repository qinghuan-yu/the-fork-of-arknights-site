# the fork of arknights site

明日方舟官网的纯前端本地展示项目，现已迁移为 React + Vite 源码。页面由独立组件、本地 JSON 数据和静态素材组成，不再加载原站的 Next.js 编译包或业务 SDK。

**已完成交接清单中的响应式与媒体交互修复。** 开发背景见 [HANDOFF.md](HANDOFF.md)，当前验证结果、验收步骤和剩余限制见 [design-qa.md](design-qa.md)。

在线预览：<https://arknights-replica.pages.dev/>。个人网页的内容与品牌定制尚未开始。

原站：<https://ak.hypergryph.com/>。页面内容快照日期：2026-11-11。

## 启动开发

需要 Node.js 20.19+ 或 22.12+（本次使用 Node.js 24）和 npm。在仓库根目录执行：

```sh
npm ci --prefix site
npm run dev --prefix site
```

打开 <http://127.0.0.1:4173/>。修改 `site/src/` 即可开发，无需 Python、采集脚本、原站服务或环境密钥。

生产构建与本地预览：

```sh
npm run build --prefix site
node server.mjs
```

构建后也可在 Windows 双击 `start.cmd`。开发服务器和静态预览共用 4173 端口，请勿同时启动。不要直接双击 `index.html`。

## 文件结构

| 路径 | 用途 |
| --- | --- |
| `site/index.html`、`site/src/main.jsx` | Vite 页面入口与 React 挂载 |
| `site/src/App.jsx` | 六个主分区、导航状态与页面装饰 |
| `site/src/sections/` | 首页、情报、干员、设定、媒体、更多内容 |
| `site/src/components/` | 导航、图集、视频、主题、弹窗、语音、粒子画布 |
| `site/src/hooks/` | 分区导航、响应式状态、HLS 视频加载 |
| `site/src/animations/ParticleScene.js` | Three.js 粒子渲染、模型变形与指针交互 |
| `site/src/data/` | 新闻、角色、世界观、图集、视频和主题数据 |
| `site/src/styles/`、`site/src/styles.css` | 分区样式与全局布局 |
| `site/public/assets/` | 图片、字体、音频、视频和粒子模型 |
| `site/tests/` | 页面测试与静态托管适配测试 |
| `server.mjs`、`start.cmd` | 本机静态预览与 Windows 启动入口 |
| `site/worker/`、`site/.openai/`、`site/scripts/` | 可选的 Sites 静态托管适配，不是业务后端 |

依赖清单和锁文件纳入仓库；`node_modules/`、`site/dist/`、截图、日志及本地采集档案不提交。运行所需媒体素材直接包含在仓库中。

## 展示功能

- 首页背景视频、背景音乐、桌面导航、手机菜单与分区切换。
- 新闻轮播与分类，六名干员的立绘、精英化和语音。
- 六项世界观及粒子模型切换，本地图集、视频目录和主题展示。

已移除下载、登录注册、充值、客服、社交平台及其他站外服务入口。页面只读取同源静态文件，不依赖业务 API。新闻和目录不会自动更新。

首页横竖屏背景视频为本地 HLS；20 部大型宣传片和玩法视频使用一个 12 秒本地循环片段占位，保留封面和目录。图片、字体、音频和粒子模型均在本地。

## 验证

先完成构建，再执行：

```sh
npm run test:sites --prefix site
npm run test:ui --prefix site
```

UI 测试默认使用本机 Google Chrome，覆盖桌面 1440 × 900、手机 390 × 844，并额外检查 1280 × 720 和 320 × 568 的主题详情。测试会启动当前生产构建的静态服务；4173 已被占用时明确报错，避免误测旧服务。

在 `site` 目录可执行 `npx playwright install chromium`，再以 `PLAYWRIGHT_BROWSER_CHANNEL=chromium npm run test:ui` 使用 Playwright 自带的 Chromium（Linux/macOS shell）。已有 Chromium 可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定。

`PLAYWRIGHT_BASE_URL` 可指向部署地址；指定后不启动本地服务器，浏览器测试仍只允许访问该同源地址。此模式仍需先完成本地构建：入口静态检查读取本地 `site/dist/client/index.html`，不代替远端产物核验。

当前构建通过，托管测试 4/4、UI 回归 22/22 通过。Cloudflare Pages 每次手动部署会先运行同一套构建与回归检查，失败时不会发布。Git 推送自动部署仍关闭。具体环境、覆盖边界与未完成事项见验证记录；这些检查不等于所有设备和浏览器的完整视觉验收。

原站图像、字体、音视频及品牌素材的权利归原权利人所有。
