---
title: 服务端渲染的原理与实现
date: 2024-02-25 15:02:07
tags:
---

<!-- more -->

## 服务端渲染（Server-Side Rendering）的由来

服务端渲染（Server-Side Rendering, SSR），是指从服务端渲染出前端页面的内容后，直接下发给前端进行展示的渲染过程；与之相对的是客户端渲染（Client-Side Rendering, CSR），是指浏览器负责了页面中大部分内容渲染工作的过程，服务端往往只负责简单的静态资源加载的功能。

从前端发展至今，经历了 SSR -> CSR -> CSR+SSR 的转变过程，也对应了前后端一体 -> 前后端分离 -> BFF(Backend For Frontend) 趋势。我是从 2018 年左右开始接触前端的，这时候 React/Vue 已经很流行了，甚至很多人以为学习前端就是学好 React/Vue 这些框架就好了，其实不然。在最早期的时候，前后端还没有分离，网页内容完全是由服务端渲染的，当时 PHP、JSP (Java Server Pages) 等类似的技术还非常流行，可以根据前端每次请求返回不同的前端 Html 页面内容，前端的 JS 逻辑相对比较简单。后面 JS 逻辑越来越重，出现了 jQuery 这样的前端库，前端也越来越复杂。后面逐渐出现了 Angular、React、Vue、Svelte 这样的前端框架，和 Webpack 等前端构建工具并行发展，前端代码可以组件化、虚拟 DOM 也提升了直接操作 DOM 的性能，jQuery 逐渐退出历史舞台，「前端工程师」的角色也是在这个时候越来越重要了。于是越来越多的逻辑被写在前端代码里，服务端只是负责把 JS, Html, CSS 这些资源下发给浏览器，这也就是客户端渲染（Client-Side Rendering）的模式。

纯的客户端渲染主要有两个问题:

1. 拿到前端页面代码之后，一般页面往往需要从后端获取数据才能展示页面内容，导致白屏时间长，会影响页面的各项性能指标。
2. SEO 不友好，搜索引擎爬虫可以立即看到渲染好的页面。（现在 Google 和 Bing 已经能够抓取带**同步请求**的 JS 应用，但是如果页面展示一个 Loading 图标并异步请求数据，Google 和 Bing 也不会等待这个异步请求结束，索引结果是一个加载中的页面。）

这样 SSR 又逐渐流行起来，以弥补 CSR 的缺点，如今各个前端框架都有设计自己的 SSR 接口，接口的设计也都相差不多，基于这些前端框架封装了开箱即用的 SSR 能力的 Meta Framework 也是层出不穷。SSR 的主要优缺点如下：

优点：

- 提升首屏性能及页面的 [Core Web Vitals 指标](https://web.dev/explore/learn-core-web-vitals?hl=zh-cn)
- 提升页面 SEO，就算浏览器关闭了 JavaScript 执行能力，仍能正常展示页面内容
- 开发体验好，前后端代码可以合在一起写。

缺点：

- 开发成本高，需要注意服务端和浏览器端两种运行时，写代码时会需要注意各端限制、更容易引入 Bug、Bug 也更难排查
- 维护成本高 ，需要维护 Node.js/Deno/Bun 等服务端

## 服务端渲染的原理

### 数据预取（Data fetching/Prefetch）、脱水（Hydration）和水合（Rehydration）

传统的 CSR 流程如下图所示：

![20240225164141](https://raw.githubusercontent.com/upupming/paste/master/picgo/20240225164141.png)

SSR 流程如下图所示：

![20240225165101](https://raw.githubusercontent.com/upupming/paste/master/picgo/20240225165101.png)

服务端负责数据预取、脱水，浏览器负责水合。

- 数据预取：服务端获取前端组件加载所需的必要数据，常常是以组件 Props 的形式传递给页面根组件 App。
- 脱水：服务端调用前端框架接口，在服务端完成页面渲染，将框架组件渲染成 Html，并将预取的数据注入以 JS 脚本注入到 Html 中，往往直接挂在 window 全局变量之下。
- 水合：客户端加载完 Html 之后，页面能够直接展示内容，与 CSR 的差异是 CSR 还需在浏览器走一遍数据预取和渲染过程。从 window 中拿到预取的数据，调用前端框架的水合函数，将 DOM 元素与页面根组件 App 一一匹配并完成前端框架应用的挂载（生命周期、前端组件和 DOM 元素的关系等）。

下表列出了各个前端框架的 SSR 相关 API：

|              | Angular | Vue 3 | React 18 | Svelte |
| ------------ | ------- | ----- | -------- | ------ |
| 脱水         |         |       |          |
| CSR 直接渲染 |         |       |          |
| SSR 水合     |         |       |          |

### 运行时

Node.js/Deno/Bun 和浏览器

## 与构建工具的关系——从 0 到 1 实现一个简单的服务端框架

## Meta Framework——越来越「卷」的服务端渲染框架

与前端框架的关系？

前端技术层出不穷，服务端渲染的花样也是越玩越多。

MPA SPA

## NSR —— Native-Side Rendering

## 与 Serverless 的关系

## 对我们的启发

### 公司内部的 SSR 框架

## 参考资料

- [React Server Components: the Good, the Bad, and the Ugly](https://www.mayank.co/blog/react-server-components/)
- https://angular.io/guide/ssr
