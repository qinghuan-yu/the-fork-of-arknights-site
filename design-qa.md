# 源码拆分检查点验证

验证日期：2026-11-12。当前为阶段性提交，尚未全部验收。

## 本次结果

| 检查 | 结果 |
| --- | --- |
| `npm run build --prefix site` | 通过；Three.js、HLS 分块有超过 500 KB 的体积警告 |
| `npm run test:sites --prefix site` | 4/4 通过 |
| `npm run test:ui --prefix site` | 17/18 通过；桌面 9/9，手机 8/9 |

UI 测试文件：`site/tests/frontend.spec.mjs`。环境为本机 Chrome、桌面 1440 × 900、手机 390 × 844，执行前重新构建当前源码。

通过项包括六分区与图片加载、无横向溢出、无外站链接和业务控件、新闻分类与轮播、干员/精英化/语音、六个粒子模型与反复进入、图集年月和弹窗、循环视频播放器、导航菜单/背景音乐/历史记录、生产入口无旧 Next.js 编译包和 SDK。所有用例的请求和控制台检查未报告外站请求、旧运行包请求或浏览器错误。

早期源码回归为 15/18，其中两个横向溢出失败已由 `.page-sections { overflow: hidden; }` 修复，本次复测通过。

## 未通过项

手机端 `主题切换与本地视频` 在 45 秒后超时。复现：更多内容 → 集成战略 → 第一个主题 → 视频操作按钮。主题信息和底部返回按钮覆盖，操作按钮无法正常命中。

优先检查 `site/src/styles/topic.css` 的 `.topic-topicInfo`、`.topic-back`、`.topic-action`，以及 `site/src/components/TopicView.jsx`。修复后验证集成战略与生息演算，并重跑完整回归。

可单独复现：

```sh
npm run test:ui --prefix site -- --project=mobile --grep "主题切换与本地视频"
```

## 尚待视觉复核

- 图集和视频缩略图使用的 `gallery-fadeOut`、`video-fadeOut` 缺少 keyframes，选中项可能残留白色覆盖。
- 桌面图集关闭大图后曾观察到封面空白/偏暗，需要检查动画时序和布局。
- 手机图集月份条较拥挤，主题详情的垂直间距仍需调整。
- 六个主分区和详情页仍需完整视觉对照；功能检查不能代替视觉验收。
- 未完成所有浏览器、键盘及屏幕阅读器兼容性验收。

本地测试生成的截图和错误上下文在 `site/test-results/`，早期截图在 `.capture/evidence/`。这些文件不提交，接手环境运行测试即可生成当前证据。

旧编译资源版本的 84 项回归结果不适用于此 React 源码检查点。完整交接及开发顺序见 [HANDOFF.md](HANDOFF.md)。
