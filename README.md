# the fork of arknights site

明日方舟官网的纯前端本地展示版本。保留页面动画与本地交互，已移除下载、账号、充值及站外服务入口。

原站：<https://ak.hypergryph.com/>

页面和内容快照日期：2026-11-11。

## 打开页面

需要 Node.js 20.19+ 或 22.12+。首次从仓库克隆后，在根目录执行：

```powershell
npm ci --prefix site
npm run build --prefix site
node server.mjs
```

构建后可双击当前文件夹的 `start.cmd`，浏览器会打开 <http://127.0.0.1:4173/>。运行期间保留启动窗口；关闭窗口即可停止。本地已有构建结果时，无需重复安装依赖。

若端口已被占用，可以在 PowerShell 中运行：

```powershell
$env:PORT = '4174'
node server.mjs
```

然后打开 <http://127.0.0.1:4174/>。不要直接双击 `index.html`，浏览器的本地文件限制会影响字体、视频和脚本加载。

## 已保留的内容

- 首页背景视频、顶部导航、背景音乐开关。
- 情报轮播及最新、公告、活动、新闻分类。
- 六名干员的立绘、切换、精英化展示和语音。
- 六项世界观设定、粒子背景、展开与返回。
- 泰拉万象的本地图集和视频目录。
- 集成战略、生息演算等更多内容展示。
- 桌面布局、手机布局和手机导航菜单。

首页背景视频、图片、字体、样式、脚本和角色语音均在本地。按本次选择，20 部大型宣传片、玩法视频以一个 12 秒本地循环片段占位，播放器标有“循环演示”，原封面和目录保留。主要展示页面可离线运行。

已移除 PC／手机／模拟器下载、下载二维码、适龄说明入口、登录注册、充值、客服、社交平台、活动官网、动画和漫画站点入口。新闻和轮播图保留静态内容及分类／滑动交互，不再跳转新闻详情。媒体页只保留本地图集和视频入口。

新闻和目录是采集当天的快照，不会自动更新。页面仅请求同源静态资源，不依赖业务后端；本地 Node 服务仅用于提供文件，构建产物也可部署到普通静态托管服务。

## 文件结构

| 路径 | 用途 |
| --- | --- |
| `start.cmd` | Windows 双击启动入口 |
| `server.mjs` | 仅监听本机的静态服务，支持视频 Range 请求 |
| `site/index.html` | 本地化后的官网页面入口 |
| `site/src/local-runtime.js` | 不联网的旧 SDK 兼容与视频占位适配 |
| `site/src/frontend-only.css` | 清理服务入口后的布局调整 |
| `site/src/footer.html` | 无外链的静态素材署名 |
| `site/public/vendor/` | 官网公开前端脚本、样式、字体、图片、语音和首页视频 |
| `site/public/data/videos.json` | 视频目录的静态 JSON 数据 |
| `site/public/local-preview.mp4` | 12 秒循环演示视频 |
| `site/dist/client/` | 可直接运行的构建结果 |
| `source.html` | 原始官网 HTML 快照 |
| `.capture/assemble.py` | 从原始素材组装本地页面，同时清理首屏 HTML |
| `.capture/frontend-only.mjs` | 按组件修改已编译代码，移除服务入口和外部跳转 |
| `.capture/assets/` | 重建所需的原始公开资源；保留输入以便重复组装 |
| `.capture/frontend-regression.mjs` | 桌面与手机纯前端回归检查 |
| `design-qa.md` | 页面对照与功能验证记录 |

本项目使用公开交付的前端资源进行本地化，保留原版结构和效果。`vendor` 中的 JavaScript 是原站编译后的文件，目前尚未重写为常规的 React 组件源码。`site/src/App.jsx` 等模板文件不是当前页面的渲染入口。可以在此基础上逐步拆出导航、首页、情报、干员、设定和媒体组件。

## 开发和重建

```powershell
cd site
npm install
npm run dev
```

修改 `site/src/local-runtime.js`、`frontend-only.css`、`footer.html` 或组件清理逻辑后，在根目录重建：

```powershell
python -m pip install -r .capture/requirements.txt
python -X utf8 .capture/assemble.py
npm run build --prefix site
```

组装脚本只读取已采集资源。占位视频已纳入仓库；仅在重新生成该视频时需要 FFmpeg。运行页面不需要 Python。

回归检查使用本机 Chrome，先启动本地服务，再运行：

```powershell
npm ci --prefix .capture
node .capture/frontend-regression.mjs
```

依赖目录、构建产物、临时截图和日志不纳入版本控制。

原站图像、音视频及品牌素材的权利归原权利人所有。
