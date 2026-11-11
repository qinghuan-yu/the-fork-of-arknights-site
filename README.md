# the fork of arknights site

明日方舟官网的纯前端本地展示项目，现已迁移为 React + Vite 源码。页面由独立组件、本地 JSON 数据和静态素材组成，不再加载原站的 Next.js 编译包或业务 SDK。

**当前是源码拆分的阶段性检查点，尚未完成全部视觉验收。** 接手开发先阅读 [HANDOFF.md](HANDOFF.md)，验证结果与已知问题见 [design-qa.md](design-qa.md)。

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

UI 测试使用本机 Google Chrome，覆盖桌面 1440 × 900 与手机 390 × 844。测试会启动静态服务，或复用 4173 端口已有服务；测试前须确保该端口提供当前构建。无 Chrome 时需要安装浏览器或调整 `site/playwright.config.mjs`。

当前构建通过，托管测试 4/4 通过，UI 测试 17/18 通过。手机主题按钮遮挡及图集等视觉问题尚待修复，详见交接文档。旧版本“84 项检查通过”不代表本次源码重写已全部通过。

原站图像、字体、音视频及品牌素材的权利归原权利人所有。
