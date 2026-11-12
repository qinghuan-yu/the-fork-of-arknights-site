# 官网复刻视觉与交互验收

验收日期：2026-11-12。目标：[明日方舟官网](https://ak.hypergryph.com/)。实现：本地 React + Vite 项目，预览地址 `http://127.0.0.1:4173/`。

## 范围与对照条件

覆盖六个分区、全部六位干员及精英化/语言选择、六个世界观详情、媒体入口、图集年月与放大、视频目录与全屏、两组主题及视频弹窗、手机菜单、页面前进/后退和关键动画中间态。

桌面 CSS 视口 1440×900、截图 1440×900 px；手机 CSS 视口 390×844、截图 390×844 px。均使用本机 Chrome、`deviceScaleFactor: 1`，无需密度换算。另验证 1280×720、320×568 短屏和 844×390 横屏。未把桌面浏览器模拟等同于真实手机或 Safari 验收。

以下差异来自用户已确认的纯前端范围，不属于待修复项：下载、登录、充值、客服、社交及站外跳转被移除；大型宣传片和玩法视频使用短循环占位；更多页面保留两张本地主题卡。为保持标题和返回控件位置，删除站外按钮后保留必要留白。背景音乐需用户点击，截图中关闭状态的短波形与官网开启状态的长波形不能直接比较。

## 证据位置

工作区根目录为 `D:/项目/明日方舟官网复刻`。以下路径均相对于根目录，截图、录像、HTML 和采集数据按照用户要求留在忽略目录，不提交到 Git。

| 证据 | 路径 |
| --- | --- |
| 官网六区原图 | `.capture/fidelity/source-{desktop,mobile}-{index,information,operator,world,media,more}.png` |
| 最终本地六区原图 | `.capture/fidelity/local-{desktop,mobile}-{index,information,operator,world,media,more}.png` |
| 六区组合对照 | `.capture/fidelity/contact-final-{desktop,mobile}-sections.png`，以及 `compare-final-{desktop,mobile}-{分区}.png` |
| 详情原图 | `.capture/fidelity/source-{desktop,mobile}-{状态}.png` 与 `local-after-{desktop,mobile}-{状态}.png` |
| 详情组合对照 | `.capture/fidelity/contact-final-{desktop,mobile}-details.png` |
| 固定视频帧 | `.capture/fidelity/compare-final-{desktop,mobile}-home-frame.png`，两侧约第 7.1 秒 |
| 动画组合对照 | `.capture/fidelity/compare-motion-{desktop,mobile}-{动作}.png`、`contact-motion-{desktop,mobile}.png` |
| 动画逐帧记录 | `.capture/fidelity/motion-source.json`、`motion-local.json`，记录实际时间、位置、尺寸、透明度和变换 |
| 放大细节对照 | `.capture/fidelity/focus-desktop-operator.png`、`focus-mobile-information.png`、`focus-mobile-gallery.png`、`focus-desktop-topic-集成战略.png`、`focus-desktop-video-full.png` |

所有判断来自将 source 与 local 放入同一张组合图后的检查；没有把分开打开两张图片当作并排比较。组合图保留原始尺寸，联系表仅用于整体构图检查，字体、间距与画质另看上述原尺寸裁切。

动画采样在操作后约 320–343ms 请求中间帧，并继续采样至稳定状态。新闻轮播在比较前固定到同一条目。首页官网由 Canvas 绘制视频，暂停后直接 seek 不会刷新 Canvas；最终对照先 seek、短暂播放再暂停，避免把旧帧误判为视频缺失。粒子与火花的随机初始状态不作逐像素相等判定。

主题弹窗最终按“沉沦者的黑流树海”名称固定状态，视频完成加载后核对：桌面 1080×607.5px，手机 351×197.4375px。官网主题列表在不同采集中出现过相反顺序；本地保留初次快照顺序，未把列表序号当作主题身份。

## 发现、修复与复核历史

| 级别 | 发现及影响 | 修复 | 复核证据 |
| --- | --- | --- | --- |
| P1，已修复 | 原重写版缺少揭幕、先退后入、世界观分段文字、悬停形变，静态相似但动态不一致。 | 恢复宽度揭幕、共用切换器、原粒子公式、文字时间线及 RGB 网格形变。 | `motion-source.json` / `motion-local.json`；`compare-motion-*-section-forward.png`、`operator-switch.png`、`world-open.png`、`world-switch.png`。 |
| P1，已修复 | 第一轮恢复时全局网格盖住立绘和文字。 | 移除建立错误叠层的裁切方式，固定子内容宽度并恢复原层级。 | 早期 `compare-desktop-operator.png`；修复后 `compare-final-desktop-operator.png` 与 `focus-desktop-operator.png`。 |
| P1，已修复 | 1920px 背景曾缩到 960px，2048px 立绘曾缩到 1200px，放大明显发糊。 | 从本地原素材重新生成高清 WebP，保留独立小缩略图；提高明确的图片预算。 | 干员、图集及主题的最终组合图；图片尺寸与元数据测试通过。 |
| P1，已修复 | 全屏图集、视频和主题弹窗共用旧通用框，丢失原来的背景、说明和手机布局。 | 恢复独立全屏层、模糊背景、说明、箭头、返回按钮与主题缩放弹窗。 | `compare-final-*-gallery-full.png`、`video-full.png`、`topic-modal.png`。 |
| P2，已修复 | 删除站外按钮后主题标题下移并遮住返回按钮。 | 保留原按钮占位高度，恢复标题位置；手机不显示桌面英文浮动标题。 | 早期 `local-after-*-topic-*` 采集发现；最终 `focus-desktop-topic-集成战略.png`、手机主题组合图及短屏回归。 |
| P2，已修复 | 手机图集月份布局、两行列表和默认刻度位置不同。 | 恢复左侧月份、上方年份、右侧两行缩略图及默认从 01 开始的桌面刻度。 | `compare-final-*-gallery.png`、`focus-mobile-gallery.png`。 |
| P2，已修复 | 日期空格、行内 time 元素和按钮基线导致文字换行与对齐偏差；UTC 日期少一天。 | 恢复日期空格和块级布局，修正按钮基线，日期采用上海时区。 | `focus-mobile-information.png`、`focus-desktop-operator.png`、`focus-desktop-video-full.png`。 |
| P2，已修复 | 图集内容与遮罩同时出现，世界观返回按钮突然出现，首页漏掉 2s 缩放。 | 图集内容延迟 300ms 入场；返回按钮持续挂载；恢复首页 1.68→1.4 缩放。 | 修复后 `compare-motion-*-gallery-open.png`、`world-open.png`；首页固定帧和动画样式检查。 |
| P2，已修复 | 桌面图集初始焦点落到禁用的上一张按钮，Escape 无法关闭。 | 优先聚焦关闭按钮，关闭动画结束后恢复原焦点。 | 桌面/手机图集、重复开关、快速切换与键盘测试通过。 |

## 五项视觉表面

- **字体与排版：** 沿用本地原站 WOFF2：Novecentosanswide、SourceHanSans、Bender、Oswald 等；默认中文回退恢复为 sans-serif。已核对新闻换行、干员信息、主题标题、播放器标题和日期。放大裁切中主要文本位置、行高及字重对齐。
- **间距与布局：** 六区构图、右侧坐标线、底部标记、干员信息、世界观标题、图集月份和弹窗尺寸完成对照。动画结束后的关键元素矩形在两种视口下对齐；删除服务入口造成的卡片数量变化单独列为授权差异。
- **颜色与透明度：** 恢复青色 `#18d1ff`、原网格 `#272727`、暗色纹理、蓝色遮罩和灰色返回按钮。主题遮罩为 60% 黑色；全屏背景沿用原模糊和遮罩参数。
- **图像与素材：** 使用实际原站图像、图标、字体和粒子贴图，无手绘替代标记；立绘/主题/全屏图集恢复高清。首页原生视频呈现比原站低分辨率 Canvas 更清晰，裁切与内容相同。大型视频占位属于已批准差异。
- **文案与内容：** 本地数据维持 2026-11-11 静态快照；原标题、介绍、栏目和日期均保留，修复时区与日期空格。静态网址文本不触发站外跳转。

## 交互与工程验证

- 最终构建成功；14 项 Node.js 检查、34 项 Chrome 桌面/手机回归全部通过。
- 测试覆盖六区、历史记录、菜单、新闻分类/轮播、六位干员/精英化/语言/语音、六个粒子模型、图集年月、全屏切换、视频循环、两组主题、重复开关、焦点恢复、短屏、快速切换及动画中间态。
- 验证原生 HLS 与轻量 HLS 回退均可完整播放并循环 18.125s；离开页面暂停，返回恢复；隐藏分区不启动视频。
- 无运行时异常、404、旧运行包或外站请求。WebGL 降级测试刻意触发的上下文创建失败信息被单独声明并断言，未屏蔽其他错误；降级图和文字保持可用。
- 初始 JavaScript 约 211.95 KB，预算 230 KB；HLS light gzip 约 119.18 KB，预算 125 KB。图片约 23.04 MB，预算 25 MB、单图 800 KB、最长边 2048px；缩略图不超过 480px。
- `scripts/capture-fidelity.mjs` 已实际运行成功，生成六区、关键动作的截图/时间线以及 `comparison.html`。依赖、构建产物、截图及缓存不纳入提交。

## 后续精修与边界

没有未解决的 P0/P1/P2 发现。P3：不同浏览器的字体抗锯齿、原生视频控制条、随机火花/粒子初始状态和少量动画采样帧差异仍会造成像素差异；不能据此宣称所有设备逐像素相等。真实 iOS/Android、Safari/Firefox 与不同 GPU 尚未进行设备验收。

已完成清单：静态组合对照、关键动画中间帧、原尺寸细节裁切、受影响交互复测、完整最终回归、源码/素材预算检查、交接说明。继续迭代时先读取 `ANIMATION_MAP.md`，再执行 README 的采集命令。

final result: passed
