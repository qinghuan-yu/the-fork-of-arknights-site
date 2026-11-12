# Dot 开发交接

交接日期：2026-11-12。用户要求先提交推送当前进度，通过仓库在 GPT 的 Dot 继续工作。本文件及其所在提交是交接依据，无需原对话、原电脑缓存或额外压缩包。


## 源码与性能接续

2026-11-12 复核确认 `13606c6` 已是可维护的编译前 React 项目，不需要反编译或回退。现有性能改动与基线测量见 [performance.md](performance.md)。原始视频大分片可从该 Git 检查点恢复；新分片逐帧无损，普通构建无需 ffmpeg。

## 后续修复状态

原始交接检查点为 `27c1b710d171894f4b79d9706d95631e3e7c5984`，下方保留其开发背景。后续已修复手机主题视频操作与返回按钮遮挡、图集/视频缩略图淡出、手机图集月份布局，并将桌面图集和主题返回按钮移至标题区之外。增加了窄短屏、重复弹窗关闭、图片恢复、焦点恢复和指示条样式回归。

当前验收记录与剩余事项以 [design-qa.md](design-qa.md) 为准。已验证构建、13 项默认检查及 30 项 UI 回归；不再将历史 17/18 结果当作当前状态。尚未开始个人网页的内容与品牌替换，素材版权仍属原权利人。

## 仓库和目标

- 公开仓库：<https://github.com/qinghuan-yu/the-fork-of-arknights-site>
- 分支：`main`；`git log -1 --oneline` 可获取当前提交。
- 原电脑目录：`D:\项目\明日方舟官网复刻`，其他环境可克隆到任意目录。
- 目标：将本地复刻整理成常规、可维护的纯前端项目，保留主要视觉和交互，便于后续改成个人网页。
- 已确认：移除登录、下载、充值、客服、社交和其他站外服务入口；大型视频循环占位；公开仓库只提交源码、素材、配置和依赖清单，不提交依赖目录或打包产物。
- 个人网页的内容与品牌替换尚未开始，不是本次检查点的完成条件。

## 接手启动

```sh
git clone https://github.com/qinghuan-yu/the-fork-of-arknights-site.git
cd the-fork-of-arknights-site
npm ci --prefix site
npm run dev --prefix site
```

访问 <http://127.0.0.1:4173/>。需要 Node.js 20.19+ 或 22.12+；本次环境为 Node.js 24、Windows、Google Chrome。

验证生产版本时，先停止占用 4173 端口的开发服务器，再执行：

```sh
npm run build --prefix site
npm run test:sites --prefix site
npm run test:ui --prefix site
```

Playwright 使用本机 Chrome，并自动启动 `server.mjs`。也可手动执行 `node server.mjs` 预览。测试不复用 4173 端口上的旧服务；浏览器选择和部署验证参数见 README。无 Chrome 时安装浏览器或调整 `site/playwright.config.mjs`，不要将浏览器缺失误判为应用错误。

## 已完成的源码迁移

入口已从约 230 KB 的原站 SSR/RSC HTML 改为 Vite HTML 与 React 根节点。`site/src/` 是实际运行源码，不再只是模板。以下路径相对于 `site/src/`：

| 模块 | 入口与职责 |
| --- | --- |
| 框架 | `App.jsx`、`components/Header.jsx`、`hooks/useSectionNavigation.js`：hash、滚轮、滑动、键盘和历史记录 |
| 首页 | `sections/HomeSection.jsx`、`hooks/useHlsVideo.js`：横竖屏本地 HLS，动态导入 hls.js |
| 情报 | `sections/NewsSection.jsx`：Swiper 轮播与本地分类 |
| 干员 | `sections/OperatorSection.jsx`、`components/CharacterVoice.jsx`：六名干员、精英化、语言与音频 |
| 世界观 | `sections/WorldSection.jsx`、`components/ParticleCanvas.jsx`、`animations/ParticleScene.js`：Three.js 模型与指针交互 |
| 媒体 | `sections/MediaSection.jsx`、`components/GalleryView.jsx`、`components/VideoView.jsx`：图集年月和本地视频 |
| 更多 | `sections/MoreSection.jsx`、`components/TopicView.jsx`：集成战略、生息演算及视频预览 |
| 通用 | `components/Modal.jsx`、`VideoPlayer.jsx`、`BackButton.jsx`、`Icon.jsx`：弹窗、播放器、返回与图标 |

数据在 `data/`，样式按分区放在 `styles/`；`styles.css` 负责导入与全局覆盖。部分 CSS 从原站样式整理而来，仍有可精简规则。

粒子为独立编写的 Three.js 场景：`Float32Array` 保存当前/目标点位，逐帧插值并更新 `BufferGeometry`；shader 绘制柔边粒子；模型点阵来自原站静态数据。场景退出时清理监听器、动画循环和 GPU 对象，支持减少动态效果偏好及页面隐藏暂停。不要重新加入 `renderer.forceContextLoss()`：此前复用同一 canvas 再进入场景时会导致 WebGL 初始化异常。

## 素材和交接边界

运行素材已包含在 `site/public/assets/`：

- `images/`：插画、封面、图集、背景、图标和 `icons.svg`。
- `fonts/`：本地字体，样式优先使用 WOFF2。
- `audio/`：背景音乐及角色语音。
- `video/`：横竖屏首页 HLS 清单及分片；`preview.mp4` 为 12 秒循环占位。
- `particles/`：粒子模型 JSON。

素材通过 `/assets/…` 引用，默认部署在站点根目录；部署到子路径需统一适配。图像、字体、音视频及品牌素材权利归原权利人所有。

旧 `site/public/vendor/`、官网 JS/CSS 编译包、SDK 适配、原 SSR HTML 和采集脚本不属于当前应用。原电脑保留忽略的 `.capture/legacy-public/`、`.capture/legacy-source/` 等档案，克隆构建不需要这些文件；不要运行旧组装脚本，否则会恢复旧页面。

旧版本可在 Git 历史 `a55258d58c8edd720a74b7477fe6e790f58065e3` 查阅。此检查点移除旧文件的当前跟踪，不重写历史。`node_modules/`、`site/dist/`、测试结果、截图和日志由接手环境重建。

保留 `site/.openai/hosting.json`、`site/worker/index.js`、`site/scripts/prepare-sites-build.mjs`、`site/tests/sites-worker.test.mjs`，用于可选的 Sites 静态托管，不提供业务 API。应用不需要密钥、环境变量或业务后端。

## 原始检查点质量与交接顺序（历史记录）

最新结果：构建通过；静态托管测试 4/4 通过；UI 测试 17/18 通过（桌面 9/9，手机 8/9）。详见 [design-qa.md](design-qa.md)。这是开发检查点，不能宣称视觉和源码拆分已全部验收。

1. **修复手机主题按钮遮挡。** 390 × 844，更多 → 集成战略 → 第一个主题 → 视频按钮，测试超时。`styles/topic.css` 的 `.topic-topicInfo` 与 `.topic-back` 在底部覆盖，检查命中区域和堆叠层级；也验证生息演算。对应测试 `主题切换与本地视频`。
2. **补齐缩略图淡出。** `gallery-fadeOut`、`video-fadeOut` 缺少 keyframes，选中项可能残留白色覆盖。已修复的 `operator-fadeOut` 可作参考。
3. **视觉复核。** 桌面图集关闭大图后曾出现封面空白/偏暗，检查动画与布局；手机月份条拥挤，主题纵向间距需调整。
4. **完整验收。** 桌面/手机六个主分区及图集、视频、主题详情逐一检查，保持无外站请求与业务按钮；修复后重跑 18 项 UI 和 4 项托管测试。
5. **后续整理。** 可按引用清理未用图片、旧字体格式和多余样式。目录中仍有未渲染的服务图标。Three.js/HLS 懒加载分块超过 500 KB，有体积警告，可后续优化。

检查点已包含横向溢出修复（`.page-sections { overflow: hidden; }`），本次复测通过；也包含角色语音与视频卸载时暂停的清理逻辑。早期 15/18 或旧版 84 项结果均不能替代本次结果。

## 原始交接任务摘要（历史记录）

继续维护本仓库 `main` 的 React 源码。先读 `site/AGENTS.md` 和 `design-qa.md`，安装依赖并复现手机主题按钮遮挡，完成以上待办。保留纯前端、同源素材、循环视频；不要重新引入官网编译 JS、SDK、登录或下载。不要提交依赖、构建产物或截图。当前检查点尚未完成最终验收；个人网页定制留待用户后续要求。
