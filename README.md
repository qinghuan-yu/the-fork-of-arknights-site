# Arknights Site

基于 React + Vite 的明日方舟官网前端复刻，只做本地开发和预览。包含响应式导航、新闻轮播、干员语音、Three.js 粒子场景、图集与主题展示。

纯前端，无业务 API、账号系统或环境密钥。内容为 2026-11-11 的静态快照；宣传片使用 12 秒本地循环视频占位。下载、登录、充值、客服及社交入口已移除。

## 快速开始

需要 Node.js 20.19+ 或 22.12+，以及 npm。

```sh
git clone --depth 1 https://github.com/qinghuan-yu/the-fork-of-arknights-site.git
cd the-fork-of-arknights-site
npm ci
npm run dev
```

打开 <http://127.0.0.1:4173/>。所有命令均在仓库根目录执行；`npm start` 也可启动开发服务。开发和预览服务仅监听本机。

浅克隆只下载最新版本，适合日常本地开发；需要完整提交历史时运行 `git fetch --unshallow`。

## 常用命令

```sh
npm run dev       # 开发服务，修改源码后自动更新
npm run build     # 标准 Vite 构建，输出至 dist/
npm run preview   # 本地预览构建，支持音视频 Range 请求
npm test          # 本地服务、素材、粒子和性能预算检查，需先构建
npm run test:ui   # Playwright 桌面与手机交互回归，需先构建
npm run check     # 构建 + Node.js 检查 + UI 回归
npm run format    # 格式化前端源码与 UI 测试
```

UI 测试默认使用本机 Google Chrome；使用 Playwright Chromium 时：

```sh
npx playwright install chromium
PLAYWRIGHT_BROWSER_CHANNEL=chromium npm run check
```

也可用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定本机浏览器路径。环境变量示例适用于 Linux/macOS shell。UI 测试自动启动本地预览，请先停止占用 4173 端口的服务；日常预览可通过 `PORT` 改端口。

## 项目结构

```text
src/         # React 组件、分区、hooks、样式及本地 JSON 数据
public/      # 小尺寸图片、字体、音视频和粒子模型
tests/       # Node.js 检查与 Playwright 回归
scripts/     # 本地静态预览与可选的视频维护工具
index.html   # 应用入口
package.json # npm 脚本与依赖
```

日常只修改源码和素材，不编辑 `dist/`。依赖、构建产物、测试输出及采集缓存不纳入版本控制。仓库不包含托管适配器或部署步骤。

## 素材维护

图片使用按展示用途缩小的 WebP，并保留透明通道。图集列表使用最长边 480 px 的独立缩略图，放大预览不超过 1600 px，干员立绘不超过 1200 px；小图标不放大，矢量图标保持 SVG。新图片请先缩小、压缩再加入仓库，避免提交原始大图和重复素材。

运行 `npm run check` 验证素材引用、体积预算和实际交互。图片体积减少不会自动移除 Git 旧提交中的原图。默认保留历史；不要为清理体积直接强制推送或删除旧分支。

## 已知限制与贡献

- 新闻和目录不会自动更新，大型视频为占位内容。
- Three.js 分块较大，但仅在进入世界观时加载；真实手机、Safari/Firefox 和完整无障碍体验仍需专项验证。
- 欢迎提交 Issue 或 Pull Request。修改后请执行 `npm run check`，保持纯前端、同源素材与现有交互范围。

## 素材与许可

页面内容、部分样式及图像、字体、音视频、品牌素材来源于[明日方舟官网](https://ak.hypergryph.com/)，相关权利归原权利人所有。仓库尚未声明代码开源许可证，公开源码不代表对第三方素材的使用或再分发授权；复用前请确认相应许可。
