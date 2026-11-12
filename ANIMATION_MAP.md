# 动画实现与交接

本次恢复以 2026-11-12 采集的官网桌面、手机画面及原始行为为依据。运行入口是 `src/App.jsx`，构建不依赖旧编译包、Next 运行时或 HG SDK。

## 模块与时序

| 部分 | 源文件 | 实现与时序 |
| --- | --- | --- |
| 页面加载 | `src/components/LoadingScreen.jsx` | 预载背景与字体，进度以 1000ms 二次缓动追赶真实完成比例；满载后等待 300ms，再淡出加载页。 |
| 六区切换 | `src/App.jsx`、`src/hooks/useSectionNavigation.js`、`src/styles.css` | 固定宽度的内容置于宽度变化的容器内，按前进/后退方向锚定边缘；桌面 1000ms、竖屏 600ms。不能改成同时淡入，否则会丢失原站揭幕和叠层关系。 |
| 章节编号、坐标、网格、火花 | `src/components/SceneChrome.jsx`、`src/styles/scene.css` | 编号先退后入，300ms 动画并错开 100ms；Canvas 绘制原网格和火花。滚动提示保留循环运动。 |
| 首页 | `src/sections/HomeSection.jsx`、`src/hooks/useHlsVideo.js` | 背景视频保留完整 18.125s 循环；原生 HLS 优先，轻量 HLS 回退。可见视频的 1.68→1.4 缩放等效于原站 Canvas 的 1.4 倍裁切与外层 1.2→1 入场缩放。两块蓝色遮罩延迟 2s、2.3s 出现。 |
| 共用内容切换 | `src/components/ContentTransition.jsx` | 旧内容退出 300ms 后替换，再进入 300ms。支持水平、垂直、反向与 600ms 慢速模式；快速连点最终显示最后一次选择。纯淡入不覆盖元素自带的缩放。 |
| 干员 | `src/sections/OperatorSection.jsx`、`BorderText.jsx`、`CharacterVoice.jsx` | 立绘/信息与剪影反向切换，立绘保留 10s 漂移；英文描边由 Canvas 生成。语言下拉、语音播放与白色到青色的波形均由前端驱动。 |
| 世界观粒子 | `src/animations/ParticleScene.js`、`particleMath.js` | 10000 点、透视相机、原粒子贴图及模型；位置、深度、RGBA 逐帧收敛，包含鼠标斥力。离开时随机散开并淡出，2s 后停止循环。模型请求有缓存及过期请求保护。 |
| 鼠标悬停形变 | `src/animations/WorldHover.js` | 100×100 细分平面追随鼠标；追随速度驱动顶点弯曲及 RGB 采样偏移。 |
| 世界观文字 | `src/components/WorldDetail.jsx` | 标题、副标题、正文分别延迟 600/800/1000ms 展开，持续 600ms。切换设定时，三组文字按 100ms 间隔退出，500ms 后替换并进入。 |
| 媒体、图集、主题 | `src/sections/MediaSection.jsx`、`MoreSection.jsx`、`GalleryView.jsx`、`TopicView.jsx` | 子页面持续挂载，保留退出动画和用户选择；媒体上下滑入，主题背景 1.1→1 缩放，文字先退后入。图集恢复年月刻度、两行手机缩略图与拖动滚动条。 |
| 图集/视频全屏 | `ArtworkViewer.jsx`、`VideoFullViewer.jsx`、`src/hooks/useViewerMotion.js` | 独立模糊背景与说明层，图集遮罩 300ms、视频全屏 600ms；首次内容延迟 300ms 再淡入。关闭先播放退出动画再卸载，保留焦点陷阱、Escape 和焦点恢复。 |
| 主题视频弹窗 | `Modal.jsx` | 60% 黑色遮罩，300ms 淡入并从 .88 缩放至 1，关闭时反向。点击遮罩或 Escape 关闭；播放器宽度桌面 75%、手机 90%。 |

## 状态和资源规则

- `active` 控制播放及场景循环，`visible` 控制子页面进入/退出。不要在刚变为不可见时直接卸载，否则退出动画会再次消失。
- 图集和视频全屏通过 Portal 放入根节点。打开期间背景不可交互，背景音乐暂停；关闭后恢复原状态。
- 粒子层放在全局 `#world-effects`，页面揭幕容器不能新增会改变全局叠层的 `clip-path` 或 `isolation`。
- 默认音乐关闭，点击后播放，遵循浏览器自动播放限制。`prefers-reduced-motion` 缩短过渡并停止粒子运动；WebGL 不可用时显示静态设定图。
- 大型宣传片使用循环占位，但首页背景、语音、图集、字体、图标及粒子模型都从本地加载。运行时不请求官网业务接口。

## 继续修改时

先运行 `npm ci`，使用 `npm run dev`。逻辑、组件、样式、数据分别位于 `src/animations`、`src/components`/`src/sections`、`src/styles`、`src/data`。图像画质预算和运行命令见 README。

提交前执行 `npm run check`，再按 `scripts/capture-fidelity.mjs` 采集相同视口、相同内容和操作的动画。单张静态截图不能证明动画完整。随机粒子、火花和视频不同播放位置不能直接作为像素差异评分；需要核对时间线、裁切、颜色和运动规律。

用户已明确要求删除服务入口，继续修改时不要恢复下载、登录、充值、客服、社交或外站跳转。删除的入口保留必要布局空间，使标题和返回按钮位置维持原站构图。更多页面因只保留两项本地主题，卡片分为两列/两行。
