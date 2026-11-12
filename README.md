# Arknights Site

基于 React + Vite 的明日方舟官网前端复刻，使用本地数据和静态素材，保留响应式导航、新闻轮播、干员语音、Three.js 粒子场景、图集与主题展示。

[在线预览](https://arknights-replica.pages.dev/) · [原站](https://ak.hypergryph.com/)

纯前端，无业务 API、账号系统或环境密钥。内容为 2026-11-11 的静态快照；大型宣传片使用 12 秒本地循环视频占位。下载、登录、充值、客服及社交入口已移除。

## 快速开始

需要 Node.js 20.19+ 或 22.12+，以及 npm。

```sh
git clone https://github.com/qinghuan-yu/the-fork-of-arknights-site.git
cd the-fork-of-arknights-site
npm ci
npm run dev
```

打开 <http://127.0.0.1:4173/>。所有命令均在仓库根目录执行；`npm start` 也可启动开发服务。

## 常用命令

```sh
npm run build     # 生产构建，静态文件输出至 dist/client
npm run preview   # 本地预览生产构建
npm test          # 托管、粒子计算和构建/视频预算检查，需先构建
npm run test:ui   # Playwright 桌面与手机交互回归，需先构建
npm run format   # 格式化前端源码与 UI 测试
```

UI 测试默认使用本机 Google Chrome；使用 Playwright Chromium 时：

```sh
npx playwright install chromium
PLAYWRIGHT_BROWSER_CHANNEL=chromium npm run test:ui
```

环境变量示例适用于 Linux/macOS shell。也可用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定浏览器路径，或用 `PLAYWRIGHT_BASE_URL` 检查已部署站点（仍需本地构建）。本地 UI 测试自动启动静态服务，请先停止占用 4173 端口的服务。

## 项目结构

```text
src/         # React 组件、分区、hooks、样式及本地 JSON 数据
public/      # 图片、字体、音视频和粒子模型
tests/       # Node.js 检查与 Playwright 回归
scripts/     # 静态预览、构建打包与可选的视频维护工具
worker/      # Sites 静态托管适配
.openai/     # Sites 打包配置
index.html   # 应用入口
package.json # npm 脚本与依赖
```

日常开发直接修改 `src/`，不编辑构建产物。依赖目录、`dist/`、测试输出及采集缓存不纳入版本控制。`test:sites` 保留为 `npm test` 的兼容入口。

## 部署

在仓库根目录执行构建与测试后，将 `dist/client/` 上传至静态托管服务。资源使用 `/assets/` 绝对路径，默认部署在域名根目录；子路径部署需要适配资源路径。无需业务后端。

Cloudflare Pages 的构建根目录为仓库根目录（留空），输出目录为 `dist/client`。现有项目手动部署前会执行构建、Node.js 检查和 UI 回归；Git 推送自动部署关闭。Sites 所需的 `dist/server/` 和 `dist/.openai/` 由构建脚本同时生成，普通静态托管只需 `dist/client/`。

## 已知限制与贡献

- 新闻和目录不会自动更新，大型视频为占位内容。
- Three.js 分块较大，但仅在进入世界观时加载；真实手机、Safari/Firefox 和完整无障碍体验仍需专项验证。
- 欢迎提交 Issue 或 Pull Request。修改后请执行构建、`npm test` 和 UI 回归，保持纯前端、同源素材与现有交互范围。

## 素材与许可

页面内容、部分样式及图像、字体、音视频、品牌素材来源于明日方舟官网，相关权利归原权利人所有。仓库尚未声明代码开源许可证，公开源码不代表对第三方素材的使用或再分发授权；复用前请确认相应许可。
