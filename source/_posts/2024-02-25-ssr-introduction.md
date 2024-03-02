---
title: 服务端渲染的原理与实现
date: 2024-02-25 15:02:07
tags:
---

## 服务端渲染（Server-Side Rendering）的由来

服务端渲染（Server-Side Rendering, SSR），是指从服务端渲染出前端页面的内容后，直接下发给前端进行展示的渲染过程；与之相对的是客户端渲染（Client-Side Rendering, CSR），是指浏览器负责了页面中大部分内容渲染工作的过程，服务端往往只负责简单的静态资源加载的功能。

从前端发展至今，经历了 SSR -> CSR -> CSR+SSR 的转变过程，也对应了前后端一体 -> 前后端分离 -> BFF(Backend For Frontend) 趋势。我是从 2018 年左右开始接触前端的，这时候 React/Vue 已经很流行了，甚至很多人以为学习前端就是学好 React/Vue 这些框架就好了，其实不然。在最早期的时候，前后端还没有分离，网页内容完全是由服务端渲染的，当时 PHP、JSP (Java Server Pages) 等类似的技术还非常流行，可以根据前端每次请求返回不同的前端 Html 页面内容，前端的 JS 逻辑相对比较简单。后面 JS 逻辑越来越重，出现了 jQuery 这样的前端库，前端也越来越复杂。后面逐渐出现了 Angular、React、Vue、Svelte 这样的前端框架，和 Webpack 等前端构建工具并行发展，前端代码可以组件化、虚拟 DOM 也提升了直接操作 DOM 的性能，jQuery 逐渐退出历史舞台，「前端工程师」的角色也是在这个时候越来越重要了。于是越来越多的逻辑被写在前端代码里，服务端只是负责把 JS, Html, CSS 这些资源下发给浏览器，这也就是客户端渲染（Client-Side Rendering）的模式。

<!-- more -->

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

### 数据预取（Data fetching/Prefetch）、脱水（Dehydration）和水合（Hydration）

传统的 CSR 流程如下图所示：

![20240302221129](https://raw.githubusercontent.com/upupming/paste/master/picgo/20240302221129.png)

SSR 流程如下图所示：

![20240302221147](https://raw.githubusercontent.com/upupming/paste/master/picgo/20240302221147.png)

服务端负责数据预取、脱水，浏览器负责水合。

- 数据预取：服务端获取前端组件加载所需的必要数据，常常是以组件 Props 的形式传递给页面根组件 App。
- 脱水：服务端调用前端框架接口，在服务端完成页面渲染，将框架组件渲染成 Html，并将预取的数据注入以 JS 脚本注入到 Html 中，往往直接挂在 window 全局变量之下。
- 水合：客户端加载完 Html 之后，页面能够直接展示内容，与 CSR 的差异是 CSR 还需在浏览器走一遍数据预取和渲染过程。从 window 中拿到预取的数据，调用前端框架的水合函数，将 DOM 元素与页面根组件 App 一一匹配并完成前端框架应用的挂载（生命周期、前端组件和 DOM 元素的关系等）。

下表列出了各个前端框架的 SSR 相关 API：

|              | Angular | Vue 3 | React 18 | Svelte |
| ------------ | ------- | ----- | -------- | ------ |
| 服务端脱水 | [`new AngularSSR.CommonEngine().render()`](https://github.com/angular/universal/blob/e798d256de5e4377b704e63d993dc56ea35df97d/modules/common/engine/src/engine.ts#L64), `AngularPlatformBrowser.bootstrapApplication()` with [`provideServerRendering`](https://angular.io/api/platform-server/provideServerRendering) | [`VueServerRenderer.renderToString()`](https://github.com/vuejs/core/blob/f66a75ea75c8aece065b61e2126b4c5b2338aa6e/packages/server-renderer/src/renderToString.ts#L50) | [`ReactDOMServer.renderToString()`](https://github.com/facebook/react/blob/30ae0baed1cfe670dea41d7c7abdc375c9a4859a/packages/react-dom/src/server/ReactDOMLegacyServerNode.js#L22) | [`Component.render()`](https://github.com/sveltejs/svelte/blob/c4473dff7c3fd98500b4e609539ba89ddbcbb489/packages/svelte/src/internal/server/index.js#L187) |
| 客户端直接渲染 | [`AngularPlatformBrowser.bootstrapApplication()`](https://github.com/angular/angular/blob/66d78a7dcc397369ab53248639526cdea8315633/packages/platform-browser/src/browser.ts#L94) | [`Vue.createApp().mount()`](https://vuejs.org/api/application.html#createapp) | [`ReactDOM.createRoot().render()`](https://react.dev/reference/react-dom/client/createRoot) | [`new Component()`](https://svelte.dev/docs/client-side-component-api) |
| 客户端水合 | `AngularPlatformBrowser.bootstrapApplication()` with [`provideClientHydration`](https://angular.io/api/platform-browser/provideClientHydration) | [`Vue.createSSRApp().mount()`](https://vuejs.org/api/application.html#createssrapp) | [`ReactDOM.hydrateRoot()`](https://react.dev/reference/react-dom/client/hydrateRoot) | `new Component({ hydrate: true })` |

注：各个框架的最小 SSR Demo 可参考：https://github.com/upupming/ssr-minimal-examples

<!-- ### 注意运行时差异

在服务端渲染中，同一个前端组件会同时在服务端运行时和客户端运行时都进行渲染。因此会出现一些 -->

## 与构建工具的关系——从 0 到 1 实现一个简单的服务端渲染框架

工欲善其事，必先利其器。Node.js 的流行使得 CommonJS 模块化逐渐流行，前端从最开始的手写单文件 Html、JS、CSS 的年代，逐渐引入了 Webpack、Rollup、Parcel 等构建工具，使得前端代码可以模块化、组件化、打包压缩、代码分割、懒加载等等。ES6 标准中的 ES Module 模块化目前也逐渐在替换 CommonJS，越来越多的 npm 包也开始提供 ES Module 版本的代码，甚至设置为 ES Module Only（例如[前端大神 Sindre Sorhus](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)），浏览器的 ES Module 的支持也使得 Vite 这种 On-Demand 的构建工具逐渐流行起来，以极快开发体验为优势迅速占领市场。

由于构建工具本身就是运行在 Node.js 环境下，在服务端渲染中可以承担服务器的角色。因此构建工具往往都会提供底层的服务端渲染能力，开发者可在其基础上做一些开发支持各种前端框架的服务端渲染，例如 Vite 就有 SSR 的底层能力，可以参考[文档](https://vitejs.dev/guide/ssr)。更上层的 Meta Framework 则是专门基于已有的构建工具做的开箱即用的相对 opinionated 的框架，例如 React 的 Next.js 和 Vue 的 Nuxt.js 等。

我们这里介绍一下从 0 到 1 实现一个服务端渲染框架的过程。这里我们选用社区目前比较新的构建工具 Rspack，Rspack 大量参考了 Webpack 并利用 Rust 重写，目前还没有发布 1.0。由于 Rspack 本身对 SSR 还没有提供支持，我们这里演示一下，如何对其进行拓展以支持 SSR。本次实现的代码已经放在了 GitHub 上开源：https://github.com/upupming/rspack-ssr-examples 。

### 代码整体结构

代码结构如下：

```bash
.
├── README.md
├── package.json
├── rspack.config.js
├── scripts
│   ├── build.js
│   ├── dev.js
│   ├── preview.js
│   ├── preview.vercel.js
│   └── util.js
├── src
│   ├── App.css
│   ├── App.jsx
│   ├── entry-client.jsx
│   ├── entry-server.jsx
│   ├── index.css
│   ├── index.jsx
│   └── logo.svg
└── vercel.json
```

其中 `entry-server.jsx` 和 `entry-client.jsx` 分别表示服务端和客户端的入口 JS 代码。`scripts` 文件夹下包含了我们对 Rspack CLI 的拓展，`dev`, `build` 及 `preview` 命令分别表示本地开发、代码编译、编译后产物的托管。`vercel.json` 是我们最终部署到 Vercel 的配置文件。下面我们分别介绍各部分实现。`rspack.config.js` 本来是 Rspack 的配置文件，但是由于我们自己写了 CLI 脚本，我们在我们的不同脚本里面以这个配置为基础做一些适配性修改以支持各个命令。

`package.json` 中定义了三个脚本的执行命令，可通过 `pnpm dev` 等直接执行对应的脚本：

```json
// ...
  "scripts": {
    "dev": "tsx scripts/dev.js",
    "serve": "tsx scripts/dev.js",
    "build": "tsx scripts/build.js",
    "preview": "tsx scripts/preview.js",
// ...
```

### 服务端及客户端代码

`App.tsx` 中是我们的 App，这里是一个最简单的 React App，取自官方 Demo。

`entry-server.jsx` 是我们的服务端代码，我们约定服务端代码中需要导出一个 `render` 函数，负责将 `App.jsx` 渲染成 Html 字符串。这里我们使用了 `ReactDOMServer.renderToString` 函数。

```jsx
import React from 'react'
import App from './App';
import { renderToString } from 'react-dom/server';

export async function render() {
  const html = renderToString(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  return html;
}

```

`entry-client.jsx` 是我们的客户端代码，我们约定客户端代码可直接执行，负责将服务端渲染的 Html 字符串与客户端的 React App 进行水合，这里我们使用了 `ReactDOM.hydrateRoot` 函数。

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.hydrateRoot(
  document.getElementById('root'),
  <React.StrictMode>
     <App />
   </React.StrictMode>
)
```

大功告成，我们设置好了我们的约定，那么接下来就是构建工具需要去加载并执行这些代码了，并把整个 SSR 流程完美的串起来。

### `dev` 命令的实现

#### 多 Entry 构建

与纯客户端代码构建不同，我们现在要构建两套代码了，一套代码是运行在 Node.js 上作为服务端代码，一套代码是运行在浏览器上作为客户端代码。我们可以利用 Rspack 的多 Entry 构建能力来实现这一点，`rspack` 是一个工厂函数，一般咱们都是传一个构建配置，但是我们这里传入包含两个构建配置的数组，分别用于服务端和客户端代码的构建。

```js
import { rspack } from '@rspack/core';
import config from '../rspack.config';

const compiler = rspack([
    {
      ...config,
      name: 'Client',
      entry: {
        client: './src/entry-client.jsx',
      },
      mode: 'development',
      devtool: 'cheap-module-source-map',
      builtins: { noEmitAssets: false },
      stats: { preset: 'errors-warnings', timings: true, colors: true },
      target: 'web',
    },
    {
      ...config,
      name: 'Server',
      entry: {
        server: './src/entry-server.jsx',
      },
      mode: 'development',
      devtool: 'cheap-module-source-map',
      builtins: { noEmitAssets: false },
      stats: { preset: 'errors-warnings', timings: true, colors: true },
      target: 'node',
      output: {
        library: {
          // 这里将服务端代码编译成 CommonJS，Node.js 可直接 require 引入
          type: 'commonjs-module',
        },
      },
    },
  ]);
```

这里我们将 `entry-client.jsx` 构建出产物 `client.js`，将 `entry-server.jsx` 构建出产物 `server.js`。指定了 `server.js` 的产物格式为 CommonJS 以便咱们后面直接 require 引入，以使用其中定义的 `render` 函数。

#### 服务端代码的执行

接下来我们需要使用 `RspackDevServer` 来开启 Rspack 的开发服务器，Rspack 在开发环境下会监听文件变化并自动重新构建，构建产物会被缓存到内存中，而不会写入为文件，我们可以通过 Rspack 提供的虚拟文件 API 访问对应的产物代码。

```js
const devServer = new RspackDevServer(
    {
        ...(config.devServer ?? {}),
    },
    compiler,
);
await devServer.start();
```

`RspackDevServer` 内部使用了 [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) 来实现构建产物的缓存和访问，我们可以对其进行拓展来支持 SSR 逻辑。我们在 `RspackDevServer` 的配置中传入 `setupMiddlewares` 函数，添加一个中间件对浏览器的请求做处理，当浏览器请求 Html 文件时，我们调用产物 `server.js` 中导出的 `render` 函数，执行服务端渲染逻辑，将渲染好的 Html 字符串返回给浏览器。

```js
const devServer = new RspackDevServer(
    {
        ...(config.devServer ?? {}),
        setupMiddlewares(middlewares, devServer) {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }

        middlewares.push(async (req, res) => {
          const { devMiddleware } = res.locals.webpack;
          const outputFileSystem = devMiddleware.outputFileSystem;
          const jsonWebpackStats = devMiddleware.stats.toJson();
          // jsonWebpackStats =
          const jsonWebpackStatsClient = jsonWebpackStats.children[0];
          const jsonWebpackStatsServer = jsonWebpackStats.children[1];
          const { assetsByChunkName, outputPath } = jsonWebpackStatsClient;

          if (req.originalUrl === '/') {
            let render = () => '';

            const serverChunkPath = path.join(
              jsonWebpackStatsServer.outputPath,
              jsonWebpackStatsServer.assetsByChunkName.server[
                jsonWebpackStatsServer.assetsByChunkName.server.length - 1
              ],
            );
            const serverChunkString = outputFileSystem
              .readFileSync(serverChunkPath)
              .toString();
            if (!serverChunkString) {
              throw new Error('Server entry compilation result is null!');
            }
            try {
              // TODO: get chunk hash from rspack directly
              render =
                requireFromString(
                  serverChunkString,
                  `${serverChunkPath}?hash=${hash(serverChunkString)}`,
                ).render || render;
            } catch (e) {
              throw new Error(
                'Load server entry compilation result failed',
                // @ts-ignore
                e?.message,
              );
            }

            // Then use `assetsByChunkName` for server-side rendering
            // For example, if you have only one main chunk:
            res.send(
              `
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${normalizeAssets(jsonWebpackStatsServer.assetsByChunkName.server)
      .filter((path) => path.endsWith('.css'))
      .map((path) => `<link rel="stylesheet" href="${path}">`)
      .join('\n')}
    ${normalizeAssets(assetsByChunkName.client)
      .filter((path) => path.endsWith('.css'))
      .map((path) => `<link rel="stylesheet" href="${path}">`)
      .join('\n')}
    ${normalizeAssets(assetsByChunkName.client)
      .filter((path) => path.endsWith('.js'))
      .map((path) => `<script src="${path}" defer></script>`)
      .join('\n')}
  </head>
  <body>
    <div id="root">${await render()}</div>
  </body>
</html>
      `.trim(),
            );
          }
        });

        return middlewares;
      },
    },
    compiler,
);
```

其中关键的数据结构是 `jsonWebpackStats`，它是 Rspack 构建产物的统计信息，包含了构建产物的路径、文件名、文件大小等信息。我们可以从中获取到服务端代码的产物路径，读取并执行其中的 `render` 函数，将渲染好的 Html 字符串返回给浏览器。`jsonWebpackStats` 内容如下：

```json
{
  "children": [
    {
      "name": "Client",
      "logging": {},
      "hash": "f7bd1a9a22f82f2334ed",
      "version": "5.75.0",
      "rspackVersion": "0.4.2",
      "time": 653,
      "builtAt": 1709395064950,
      "publicPath": "auto",
      "outputPath": "/Users/upupming/projects/rspack-ssr-examples/packages/react/dist",
      "assetsByChunkName": {
        "client": [
          "client.css",
          "client.js"
        ]
      },
      // ....
    },
    {
      "name": "Server",
      "logging": {},
      "hash": "fd2ebd840c10f4393ac1",
      "version": "5.75.0",
      "rspackVersion": "0.4.2",
      "time": 381,
      "builtAt": 1709395064684,
      "publicPath": "",
      "outputPath": "/Users/upupming/projects/rspack-ssr-examples/packages/react/dist",
      "assetsByChunkName": {
        "server": [
          "server.css",
          "server.js"
        ]
      }
      // ...
    }
  ],
  "hash": "f7bd1a9a22f82f2334edfd2ebd840c10f4393ac1",
  "errors": [],
  "warnings": [],
  "errorsCount": 0,
  "warningsCount": 0
}

```

浏览器响应的 Html 最终如下：

```html

<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="server.css">
    <link rel="stylesheet" href="client.css">
    <script src="client.js" defer></script>
  </head>
  <body>
    <div id="root"><div class="App"><header class="App-header"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4NDEuOSA1OTUuMyI+PGcgZmlsbD0iIzYxREFGQiI+PHBhdGggZD0iTTY2Ni4zIDI5Ni41YzAtMzIuNS00MC43LTYzLjMtMTAzLjEtODIuNCAxNC40LTYzLjYgOC0xMTQuMi0yMC4yLTEzMC40LTYuNS0zLjgtMTQuMS01LjYtMjIuNC01LjZ2MjIuM2M0LjYgMCA4LjMuOSAxMS40IDIuNiAxMy42IDcuOCAxOS41IDM3LjUgMTQuOSA3NS43LTEuMSA5LjQtMi45IDE5LjMtNS4xIDI5LjQtMTkuNi00LjgtNDEtOC41LTYzLjUtMTAuOS0xMy41LTE4LjUtMjcuNS0zNS4zLTQxLjYtNTAgMzIuNi0zMC4zIDYzLjItNDYuOSA4NC00Ni45Vjc4Yy0yNy41IDAtNjMuNSAxOS42LTk5LjkgNTMuNi0zNi40LTMzLjgtNzIuNC01My4yLTk5LjktNTMuMnYyMi4zYzIwLjcgMCA1MS40IDE2LjUgODQgNDYuNi0xNCAxNC43LTI4IDMxLjQtNDEuMyA0OS45LTIyLjYgMi40LTQ0IDYuMS02My42IDExLTIuMy0xMC00LTE5LjctNS4yLTI5LTQuNy0zOC4yIDEuMS02Ny45IDE0LjYtNzUuOCAzLTEuOCA2LjktMi42IDExLjUtMi42Vjc4LjVjLTguNCAwLTE2IDEuOC0yMi42IDUuNi0yOC4xIDE2LjItMzQuNCA2Ni43LTE5LjkgMTMwLjEtNjIuMiAxOS4yLTEwMi43IDQ5LjktMTAyLjcgODIuMyAwIDMyLjUgNDAuNyA2My4zIDEwMy4xIDgyLjQtMTQuNCA2My42LTggMTE0LjIgMjAuMiAxMzAuNCA2LjUgMy44IDE0LjEgNS42IDIyLjUgNS42IDI3LjUgMCA2My41LTE5LjYgOTkuOS01My42IDM2LjQgMzMuOCA3Mi40IDUzLjIgOTkuOSA1My4yIDguNCAwIDE2LTEuOCAyMi42LTUuNiAyOC4xLTE2LjIgMzQuNC02Ni43IDE5LjktMTMwLjEgNjItMTkuMSAxMDIuNS00OS45IDEwMi41LTgyLjN6bS0xMzAuMi02Ni43Yy0zLjcgMTIuOS04LjMgMjYuMi0xMy41IDM5LjUtNC4xLTgtOC40LTE2LTEzLjEtMjQtNC42LTgtOS41LTE1LjgtMTQuNC0yMy40IDE0LjIgMi4xIDI3LjkgNC43IDQxIDcuOXptLTQ1LjggMTA2LjVjLTcuOCAxMy41LTE1LjggMjYuMy0yNC4xIDM4LjItMTQuOSAxLjMtMzAgMi00NS4yIDItMTUuMSAwLTMwLjItLjctNDUtMS45LTguMy0xMS45LTE2LjQtMjQuNi0yNC4yLTM4LTcuNi0xMy4xLTE0LjUtMjYuNC0yMC44LTM5LjggNi4yLTEzLjQgMTMuMi0yNi44IDIwLjctMzkuOSA3LjgtMTMuNSAxNS44LTI2LjMgMjQuMS0zOC4yIDE0LjktMS4zIDMwLTIgNDUuMi0yIDE1LjEgMCAzMC4yLjcgNDUgMS45IDguMyAxMS45IDE2LjQgMjQuNiAyNC4yIDM4IDcuNiAxMy4xIDE0LjUgMjYuNCAyMC44IDM5LjgtNi4zIDEzLjQtMTMuMiAyNi44LTIwLjcgMzkuOXptMzIuMy0xM2M1LjQgMTMuNCAxMCAyNi44IDEzLjggMzkuOC0xMy4xIDMuMi0yNi45IDUuOS00MS4yIDggNC45LTcuNyA5LjgtMTUuNiAxNC40LTIzLjcgNC42LTggOC45LTE2LjEgMTMtMjQuMXpNNDIxLjIgNDMwYy05LjMtOS42LTE4LjYtMjAuMy0yNy44LTMyIDkgLjQgMTguMi43IDI3LjUuNyA5LjQgMCAxOC43LS4yIDI3LjgtLjctOSAxMS43LTE4LjMgMjIuNC0yNy41IDMyem0tNzQuNC01OC45Yy0xNC4yLTIuMS0yNy45LTQuNy00MS03LjkgMy43LTEyLjkgOC4zLTI2LjIgMTMuNS0zOS41IDQuMSA4IDguNCAxNiAxMy4xIDI0IDQuNyA4IDkuNSAxNS44IDE0LjQgMjMuNHpNNDIwLjcgMTYzYzkuMyA5LjYgMTguNiAyMC4zIDI3LjggMzItOS0uNC0xOC4yLS43LTI3LjUtLjctOS40IDAtMTguNy4yLTI3LjguNyA5LTExLjcgMTguMy0yMi40IDI3LjUtMzJ6bS03NCA1OC45Yy00LjkgNy43LTkuOCAxNS42LTE0LjQgMjMuNy00LjYgOC04LjkgMTYtMTMgMjQtNS40LTEzLjQtMTAtMjYuOC0xMy44LTM5LjggMTMuMS0zLjEgMjYuOS01LjggNDEuMi03Ljl6bS05MC41IDEyNS4yYy0zNS40LTE1LjEtNTguMy0zNC45LTU4LjMtNTAuNiAwLTE1LjcgMjIuOS0zNS42IDU4LjMtNTAuNiA4LjYtMy43IDE4LTcgMjcuNy0xMC4xIDUuNyAxOS42IDEzLjIgNDAgMjIuNSA2MC45LTkuMiAyMC44LTE2LjYgNDEuMS0yMi4yIDYwLjYtOS45LTMuMS0xOS4zLTYuNS0yOC0xMC4yek0zMTAgNDkwYy0xMy42LTcuOC0xOS41LTM3LjUtMTQuOS03NS43IDEuMS05LjQgMi45LTE5LjMgNS4xLTI5LjQgMTkuNiA0LjggNDEgOC41IDYzLjUgMTAuOSAxMy41IDE4LjUgMjcuNSAzNS4zIDQxLjYgNTAtMzIuNiAzMC4zLTYzLjIgNDYuOS04NCA0Ni45LTQuNS0uMS04LjMtMS0xMS4zLTIuN3ptMjM3LjItNzYuMmM0LjcgMzguMi0xLjEgNjcuOS0xNC42IDc1LjgtMyAxLjgtNi45IDIuNi0xMS41IDIuNi0yMC43IDAtNTEuNC0xNi41LTg0LTQ2LjYgMTQtMTQuNyAyOC0zMS40IDQxLjMtNDkuOSAyMi42LTIuNCA0NC02LjEgNjMuNi0xMSAyLjMgMTAuMSA0LjEgMTkuOCA1LjIgMjkuMXptMzguNS02Ni43Yy04LjYgMy43LTE4IDctMjcuNyAxMC4xLTUuNy0xOS42LTEzLjItNDAtMjIuNS02MC45IDkuMi0yMC44IDE2LjYtNDEuMSAyMi4yLTYwLjYgOS45IDMuMSAxOS4zIDYuNSAyOC4xIDEwLjIgMzUuNCAxNS4xIDU4LjMgMzQuOSA1OC4zIDUwLjYtLjEgMTUuNy0yMyAzNS42LTU4LjQgNTAuNnpNMzIwLjggNzguNHoiLz48Y2lyY2xlIGN4PSI0MjAuOSIgY3k9IjI5Ni41IiByPSI0NS43Ii8+PHBhdGggZD0iTTUyMC41IDc4LjF6Ii8+PC9nPjwvc3ZnPg==" class="App-logo" alt="logo"/><p>Edit <code>src/App.js</code> and save to reload.</p><a class="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">Learn React</a></header></div></div>
  </body>
</html>
```

浏览器拿到的 Html 有实际内容，并不需要完成 JS 加载就能直接展示，这样就加快了首屏速度也优化了 SEO。我们在 head 中插入了构建出的 `client.js` 文件，浏览器拿到 Html 之后会自动加载并执行 `client.js`，由于 `client.js` 由 `entry-client.jsx` 构建而来，包含水合过程的代码逻辑，其执行完就会完成 React 事件和功能的加载，React 逻辑正常生效。

### `build` 及 `preview` 命令的实现

`build` 构建的代码最终会被部署到生产环境，由 `preview` 命令启动的服务器并监听端口并提供服务，因此两者需要互相配合。

`build` 只需要负责构建产物，`rspack` 工厂函数使用的配置保持和 `dev` 一样，DevServer 相关逻辑替换成对代码进行构建的逻辑，可使用 `compile.run()` API 来执行构建。

```js
await compiler.run((error, stats) => {
  if (error) {
    console.error(error);
    process.exit(2);
  }
  if (stats && stats.hasErrors()) {
    console.log('stats', stats.toString({}));
    process.exitCode = 1;
  }
  if (!compiler || !stats) {
    return;
  }
});
```

构建后产物结构如下所示：

```bash
dist
├── client.css
├── client.css.map
├── client.js
├── client.js.map
├── server.css
├── server.css.map
├── server.js
└── server.js.map
```

`preview` 命令则负责将 `dist` 目录下的产物正确地加载并相应浏览器的请求，基本上逻辑和 `dev` 命令中的 `DevServer` 一样，但是不需要 `rspack` 参与构建了，而是直接加载文件并进行处理。我们可以自己写一个原生的 Node.js 服务器，也可以使用 `express`、`koa` 等框架。但是这里为了简单起见，我们还是直接使用 rspack 提供的 `RspackDevServer` 来做这个产物的加载。

```js
const compiler = rspack({ entry: {} });
const devServer = new RspackDevServer(
  {
    static: {
      directory: './dist',
      publicPath: '/',
    },
    devMiddleware: { serverSideRender: true },
    // Allow CodeSandbox to access dev server
    allowedHosts: 'all',
    setupMiddlewares(middlewares, devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      middlewares.unshift(async (req, res, next) => {
        if (req.originalUrl === '/') {
          let render = () => '';

          // TODO: read from some meta file
          const serverChunkPath = path.join(process.cwd(), 'dist/server.js');
          try {
            render = require(serverChunkPath).render || render;
          } catch (e) {
            throw new Error(
              'Load server entry compilation result failed',
              // @ts-ignore
              e?.message,
            );
          }

          // Then use `assetsByChunkName` for server-side rendering
          // For example, if you have only one main chunk:
          res.send(
            `
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="server.css">
  <link rel="stylesheet" href="client.css">
  <script src="client.js" defer></script>
</head>
<body>
  <div id="root">${await render()}</div>
</body>
</html>
    `.trim(),
          );
        } else {
          next();
        }
      });

      return middlewares;
    },
  },
  compiler,
);

await devServer.start();
```

大功告成！这里我们就实现了一个最简单的服务端渲染框架，如果将这三个指令内置到 Rspack CLI 中，Rspack 就能原生支持 SSR 应用的开发和部署了。

### Serverless 部署

Serverless 是一种新的云计算服务模式，它将应用的部署和运维交给云服务商，开发者只需要关心自己的业务逻辑，不需要关心服务器的运维和扩容。目前市面上有很多 Serverless 服务商，例如 AWS、Azure、Google Cloud、Vercel、Netlify 等等。我们这里简单演示一下如何将我们的 SSR 应用部署到 Vercel 的 Node.js Serverless 环境上。

配置 `vercel.json` 文件内容：

```json
{
  "version": 2,
  "public": false,
  "github": {
    "enabled": false
  },
  "builds": [
    {
      "src": "./scripts/preview.vercel.js",
      "use": "@vercel/node",
      "config": {
        "//": "https://github.com/vercel/vercel/issues/1788#issuecomment-485629244",
        "includeFiles": [
          "dist/**/*",
          "scripts/**/*"
        ],
        "bundle": false,
        "maxLambdaSize": "50mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/scripts/preview.vercel.js"
    }
  ]
}

```

运行 `vercel --prod`，日志如下：

```bash
Vercel CLI 32.6.1
🔍  Inspect: https://vercel.com/upupming/rspack-react-example/D14o3HLcaJvdKZBZq5zjdCnJ58t7 [4s]
✅  Production: https://rspack-react-example-gs7qft41n-upupming.vercel.app [4s]
⠇ Building
```

构建完就可以访问啦！

作为一个服务端渲染框架，往往要支持不同的 Serverless 环境，Serverless 环境并不完全都是 Node.js，例如 [Cloudflare Workers](https://workers.cloudflare.com/) 就是一个包含原生 `fetch` API 的 JavaScript 运行时，而且不支持 `fs`, `path` 等这些 Node.js 才有的模块。因此服务端框架往往有很大一部分的工作要放在部署环境的适配上，例如 Remix 就有专门的 [Server Adapters](https://remix.run/docs/en/main/other-api/adapter) 来适配不同的 Serverless 环境，让其代码能够再更多的服务器环境下部署，以吸引更多的用户。目前还有 [hattip](https://github.com/hattipjs/hattip) 和 [Hono](https://hono.dev/) 这样的服务端框架，一次书写适配各种 JS 运行时（号称「Runs on any JavaScript runtime.」），我们的 `preview` 命令如果用这些工具来实现的话，就可以轻松实现各个 Serverless 平台的适配，而免去了造各种 Adapter 的烦恼。

### 数据预取

服务端渲染框架往往还需要支持数据预取，例如 Next.js 就有 `getServerSideProps` 函数来支持服务端渲染的数据预取。假设主页要请求完一个接口才能展示，我们可以在服务端完成数据拉取，使用数据完成带内容的 Html 生成，将数据也塞到 Html 中，不需要等到客户端加载完再去拉取数据。

大致实现如下：

`entry-server.jsx`：

```jsx
export async function render() {
  const data = await fetchData();
  const html = renderToString(
    <React.StrictMode>
      <App data={data} />
    </React.StrictMode>
  );
  return {
    html,
    data
  };
}
```

我们的服务器会把 `data` 作为全局变量挂载在 `window` 下，客户端可以直接加载，省去了请求接口的过程：

`entry-client.jsx`：

```jsx
const data = window.__DATA__;
ReactDOM.hydrateRoot(
  document.getElementById('root'),
  <React.StrictMode>
     <App data={data} />
   </React.StrictMode>
)
```

### 路由、SSG、客户端降级、NSR

这里我们只是实现了一个最简单的服务端渲染框架，但是实际的服务端渲染框架往往还要支持路由、客户端降级、SSG 等功能。例如 Next.js 就有专门的路由系统，可以通过文件系统来定义路由，还有 `getServerSideProps` 和 `getStaticProps` 等函数来支持服务端渲染和静态生成。我们的框架还需要支持这些功能，这里就不展开了。

- 路由：服务端需也需要支持路由，对于前端不同的地址，服务端需要返回不同页面对于组件的 Html 字符串。服务端对于路由的处理和浏览器不同，因此需要做一些处理来匹配。有非常 opinionated 的框架会使用文件夹的组织方式作为路由，例如 Next.js；而有一些框架会使用配置文件来定义路由，给你更多的灵活度，例如 Vike。常见的有 MPA (Multi-Page Application) 和 SPA (Single-Page Application) 两种思路去维护路由。
- SSG (Server-Side Generating) 是指在服务端生成静态页面，然后将静态页面返回给浏览器。SSG 和 SSR 的差异是 SSR 是每次请求都会重新生成页面，而 SSG 是在构建时生成页面，然后将页面缓存起来，每次请求都直接返回缓存的页面。SSG 可以大大提高页面的加载速度，因为不需要每次请求都重新生成页面。例如 Next.js 就有 `getStaticProps` 和 `getStaticPaths` 函数来支持 SSG。SSG 适用于博客这种构建时就确定了内容，不会变化的网页；SSR 适用于内容会变化的网页，例如电商主页，可能每时每刻点进去都有新的内容。
- 客户端降级：服务端渲染框架往往还需要支持客户端降级，如果服务端因为每种原因不可用了，浏览器即使是拉到了 CDN 的静态资源，也需要能够正常运行。在大公司，业务场景中客户端降级是非常有要的。
- NSR (Native-Side Rendering)：NSR 是指在客户端渲染的基础上，使用原生 App 的渲染能力来渲染页面。例如美团 App 提供 NSR 能力，可以减轻服务器的压力，利用 App 的能力完成数据预取、初始 Html 生成，提高页面的加载速度。

### 页面性能指标

实现完 SSR 之后，往往需要衡量 SSR 与 CSR 的性能，计算收益，需要关注到页面性能指标。

- W3C 的 Performance API: [Performance API | PerformanceTiming (Deprecated)](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceTiming)、[Performance API | PerformanceNavigationTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming)
- 开源：[Google Web Vitals](https://web.dev/explore/learn-core-web-vitals)
    ![20240303013250](https://raw.githubusercontent.com/upupming/paste/master/picgo/20240303013250.png)
- 美团内部：<!-- [前端质量监控系列-Web性能指标篇](https://km.sankuai.com/page/298159863)， --> 常用指标：
    - 首字节时间（responseStart）：指浏览器接收到 HTML 文档第一个字节的时间。此时间点之前，浏览器需要经过 DNS解析、重定向(若有)、建立 TCP/SSL 连接、服务器响应等过程。
    - DOM 构建完成时间（domInteractive）：HTML 解析器完成 DOM 树构建的时间。此时间点之前，浏览器需要经过同步静态资源加载、内联 JavaScript 脚本运行、HTML 解析器生成 DOM 树的过程。
    - DOM Ready 时间（DOMContentLoadedEventEnd）：CSS树和DOM树合并渲染树后，并执行完成同步 JavaScript 脚本的时间。此时间点之前，包含了DOM树构建的过程、CSS树构建的过程、以及同步 JavaScript 脚本执行的时间。
    - 首屏时间（自定义算法：MutationObserver监听一定时间内没有再监听到首屏内 DOM 变化）：网页布局和绘制的完成，将用户设备视窗范围内的DOM节点渲染完成的时间。若首屏中包含异步请求才能完成渲染的内容，则需要包含等待异步请求和页面重绘的时间。
    - 页面完全加载时间（loadEventStart）：所有处理完成，并且网页上的所有资源（图像等）都已下载完毕的时间。此时会触发浏览器 onload 事件。
    <!-- - [MRN 秒开率](https://km.sankuai.com/page/1578976223)：秒开率 = 页面打开时间小于等于1秒的次数 / 页面打开的总次数 × 100% ；页面打开时间 = 页面打开结束时间点 - 页面打开开始时间点。 -->

## Meta Framework——越来越「卷」的服务端渲染框架

Meta Framework 可以理解为框架的框架，在 Vue 的基础上包一层就成了 Nuxt，在 React 的基础上包一成就成了 Next.js，这些框架对于初学者来说可以省去各种配置文件的烦恼，对于有经验的开发者来说可以提供一些最佳实践，让开发者不需要从零开始搭建项目。这些框架往往还会提供一些高级功能，例如路由、SSG、SSR、Store、数据库、CSS 预编译等等。这些框架的出现，让服务端渲染框架的开发变得越来越「卷」，因为它们需要支持的功能越来越多，而且还需要支持不同的 Serverless 环境，这些框架的开发成本也越来越高。

我们这里列出一些框架及其 SSR 实现的相关 API：

- Next.js (React)：`getServerSideProps`、`getStaticProps`、`getStaticPaths`。
- Remix (React)：在 Remix 中，路由和数据预取是通过 `loader` 函数来实现的，在客户端通过 `useLoaderData` 进行获取。Modern.js 的 SSR [也参考了此设计](https://modernjs.dev/en/guides/advanced-features/ssr/usage.html#ssr-data-fetch)。
- Nuxt (Vue)：`fetch` 在服务端、客户端都可以被调用，可通过 `fetchOnServer` 来控制是否在服务端调用。
- Vike (React & Vue): `data` 及 `useData` 函数。

<!-- ## 公司内部的 SSR 框架

- Web 端：公司内 Nest Serverless 平台支持目前已有 [Node SSR](https://km.sankuai.com/collabpage/1540182088) 解决方案，支持 Nuxt.js、Next.js 等框架。利用 WebStatic 存储构建产物，在 Nest 的 Node 环境上跑 SSR 服务器。
- 养车/用车团队的叶爽同学，对比了 MRN Web 在 CSR 和 SSR 的场景下的性能，CSR 秒开率为 0.62%，SSR 秒开率为 74.95%，大大提升。他们放弃了原来的纯 MRN CSR，改为了 MRN Web SSR，虽然从纯 MRN 到 MRN Web 可能会损失性能，但是 SSR 的优势让页面加载更快了。
- 纯 MRN 环境下的 SSR，有一篇可以公开搜到的[文档](https://km.sankuai.com/page/324772275)，首屏时间可以提升 22.8%。MRN 与浏览器需要的 Html 不同，依赖 MRN Operation 进行试图渲染，服务端负责 Operation 的生成，客户端负责 Operation 的水合。由于年代久远，MRN 的最新文档中也未作说明，未做深入研究。

思考：点餐的首页加载速度很慢，用户体验不好，可以考虑使用 SSR 来提升页面加载速度。老页面改造可能比较困难，新 Bundle 可以考虑去探索 MRN Web SSR 的使用。 -->

<!-- ## 参考资料

- [React Server Components: the Good, the Bad, and the Ugly](https://www.mayank.co/blog/react-server-components/)
- https://angular.io/guide/ssr
- https://blog.openreplay.com/server-side-rendering-in-react/ -->
