# Arknights Site

基于 React + Vite 的明日方舟官网前端复刻，包含响应式导航、新闻轮播、干员语音、Three.js 粒子场景、图集与主题展示。

纯前端，素材与数据均在本地，无业务 API 或账号系统。内容为 2026-11-11 的静态快照；大型宣传片使用短循环视频占位。下载、登录、充值、客服及社交入口已移除。

## 运行

需要 Node.js 20.19+ 或 22.12+。

```sh
npm ci
npm run dev
```

打开 <http://127.0.0.1:4173/>。

```sh
npm run build    # 构建至 dist/
npm run preview  # 本地预览构建，支持音视频 Range 请求
npm run format   # 格式化源码
```

开发与预览服务均监听本机；运行预览前先停止占用 4173 端口的开发服务。

## 目录

```text
src/         # 组件、分区、动画、hooks、样式和 JSON 数据
public/      # 图片、字体、音视频和粒子模型
scripts/     # 本地静态预览服务
index.html   # 应用入口
```

依赖 `node_modules/` 与构建产物 `dist/` 不提交到仓库。

## 素材

页面内容、样式及品牌素材来源于[明日方舟官网](https://ak.hypergryph.com/)，相关权利归原权利人所有。公开源码不代表对第三方素材的使用或再分发授权。
