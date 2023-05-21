---
title: Speedy SSR 功能的实现原理和经验总结
date: 2023-05-21 17:21:17
tags:
- frontend
categories:
- 前端
- 基础知识
---

<!--
是个啥
有啥用
技术难点
趋势
 -->

在 2022 年，字节实习的那段时间里，我参与了 Speedy 的开发，主要的任务是为 Speedy 实现服务端渲染的能力，本文介绍一下实现原理。

![20230521221623](https://s2.loli.net/2023/05/21/h6rf7PRjOlKEZHA.png)

<!-- more -->

## 什么是服务端渲染

服务端渲染（Server Side Rendering, SSR），就是指从服务端渲染出前端页面的内容。在以往早期的时候，前后端还没有分离，网页内容完全是由服务端渲染的，例如用 PHP 做后端生成好网页内容之后返回给前端负责显示，我了解到还有 JSP (Java Server Pages), ASP.NET (Active Server Pages Network Enabled Technologies) 等。但是随着前端越来越复杂，前后端开始分离，逐渐出现了各种前端框架，如 React (2013), Vue (2014), Angular (2016), Svelte (2016) 等等。前后端开始分工明确，客户端渲染（Client Side Rendering, CSR）大行其道，这种模式下面所有页面内容都由客户端动态渲染而来。

纯的客户端渲染主要有两个问题:

1. 拿到前端页面代码之后，一般页面往往需要从后端获取数据才能展示页面，导致白屏时间长。
2. SEO 不友好，搜索引擎拿到页面之后往往不会继续请求数据，这样抓取到的页面可能会是只带 JS 文件的空白 HTML。

这样 SSR 又逐渐流行起来，以弥补 CSR 的缺点。SSR 主要的方法是前端框架实现一套服务端渲染的 API，支持对组件进行脱水（hydrate）和水合（de-hydrate）。服务端（Node.js）负责将前端组件进行脱水得到 HTML 内容，这样浏览器请求之后的页面是有内容的，不用再重复请求数据；浏览器拿到数据和 HTML 之后进行水合，继续以前端组件的形式完成渲染，支持前端组件的生命周期和对应的 API。这样 CSR 和 SSR 的优点就结合了起来，使得开发体验更好的同时首屏得以保证，当然需要维护额外的 Node.js 服务器，以及构建工具需要对服务端渲染做一些支持，这是额外的成本投入，这也是我这次要讲的内容~

## Speedy 中服务端渲染的实现

https://github.com/upupming/speedy-ssr-examples 给出了 Speedy 的 SSR 的一些 DEMO。以 [`basic`](https://github.com/upupming/speedy-ssr-examples/tree/main/examples/basic) 项目为例，在 `speedy.config.ts` 中定义了四个路由，分别解释如下:

```js
{
  // ...
  ssr: {
    pages: [
      // SSG 路由
      {
        path: '/ssg',
        name: 'ssg',
      },
      // SSR 路由
      {
        path: '/ssr',
        name: 'ssr',
      },
      // 没有服务端渲染的纯静态页面
      {
        path: '/static',
        name: 'static',
      },
      // 支持参数的页面
      {
        path: '/params/:id/:name',
        name: 'params',
      },
    ],
  },
}

```

这里 `name` 就是代码所处的文件夹，`path` 是最终产物的 URL 路径。每一个页面的组织形式都是文件夹包含两个文件 `index.tsx` 和 `prefetch.ts` 形式，其中 `index.tsx` 是页面组件，`prefetch` 是数据预取函数。我们借鉴了 Next.js 的思路，根据 `prefetch` 中导出的函数名确定当前页面是 SSR 还是 SSG (Server Side Generating, 服务端生成)。与 SSR 不同，SSG 只在构建的时候生成一次数据，然后在前端访问时每次都获取构建时的数据，这种比较适用于构建时内容就确定了的页面，例如个人博客。

`prefetch` 中的数据会作为 `props` 喂给 `index.tsx` 中的组件，然后渲染成当前页面，主要用来解决首屏数据请求耗时造成白屏的问题，要求导出的函数名称必须为 `getStaticProps` 或者 `getServerSideProps`，前者是 SSG，后者是 SSR。

以 `/ssr` 页面为例，后端会直接返回带内容的 HTML，并且将 `prefetch` 中预取到的数据挂在全局变量 `__CONTEXT__.routeData` 之下，以供前端继续水合，将 HTML 变成绑定了事件和生命周期的 React 组件。

![20230521194101](https://s2.loli.net/2023/05/21/a4HzbSqZ1K7VoBx.png)
![20230521194138](https://s2.loli.net/2023/05/21/7UlhG8MIa9PzZ1T.png)

我们使用 `@speedy-js/universal` 包来支持 SSR，其封装了 `@speedy-js/core`，在其基础上增加了 SSR 和 SSG 的能力。`@speedy-js/universal` 的主要贡献有:

- 实现了一个 `BaseBundler` 类，包含 `serverBundler` 和 `clientBundler`。实现了 `ReactBundler` 来实现对 React 框架代码的编译，用户可以通过配置 `ssr.framework` 来配置当前使用的框架。
    - 在 Speedy 中存在子编译器的概念，也是借鉴于 Webpack，我们通过将 `serverBundler` 作为 `clientBundler` 的子编译器，这样在开发模式下只有一个 watcher，代码发生修改时，`clientBundler` 会通知 `serverBundler`。
    - `serverBundler` 负责编译服务端代码，产物是 CJS 格式。编译产物代码存在两个导出函数，分别是 `Component` 和 `getServerSideProps`，其中 `Component` 是服务端代码的 React 组件，`getServerSideProps` 是对应的 `prefetch.ts` 中的数据预取函数。
        - 脱水逻辑已经封装在 bundler 内部，后面的 Server 会负责将 `Component` 脱水并处理前端请求。
    - `clientBundler` 负责编译客户端代码，产物是 SystemJS 格式（利用 SystemJS 支持分包）。同样包含两个导出，分别是 `default` 和 `getServerSideProps`。`default` 是客户端代码的 React 组件，`getServerSideProps` 是对应的 `prefetch.ts` 中的数据预取函数。`getServerSideProps` 在客户端代码中仍然存在是为了进行 CSR 降级，在服务端挂掉时仍然能够进行数据请求。
        - 只靠这两个导出，无法页面正常运行，因此我们的 Server 还会增加 JS 文件，利用这两个导出，在对应的时机进行水合，使页面正常工作。
- 实现了一个 `BaseServer` 类，可以通过 `createServer` 函数来创建其子类 `DevServer`（功能类似 `vite dev`） 或者 `ProdServer`（功能类似 `vite preview`）,其返回结果类似于 [NextServer](https://github.com/vercel/next.js/blob/cfa8ab9cbfb8818408654e223aa9253be619879e/packages/next/server/next.ts#L25), 使用例子参考 [Next.js | Custom Server](https://nextjs.org/docs/advanced-features/custom-server)。并且与之对应有一个 `createHttpServer` 函数来创建 Server 的同时绑定到端口让前端直接访问。
    - 采用了 Connect 中间件实现内部的请求处理逻辑，方便拓展和复用。
- 支持了不同的 Adapter，来实现将产物部署到不同的 Serverless 环境。支持了 Vercel 和 Cloudflare Worker。

### Bundler 实现

`BaseBundler` 包含一些通用逻辑，具体不同框架的实现由对应的子类去实现，我们可以抽象出一些 Bundler 需要做的事情：

- 包含 `clientBundler` 和 `serverBundler` 分别编译客户端代码和服务端代码。
- 在构建时进行 SSG 生成，调用对应语言的 `SSGRunner` 来生成 JSON 数据到产物中。

`ReactBundler` 包含具体的实现，下面是初始化 `clientBundler` 和 `serverBundler` 的逻辑：

```ts
this.clientBundler = await SpeedyBundler.create(
  {
    ...config,
    target: 'es6',
    root,
    mode: dev ? 'development' : 'production',
    input: {
      // Client-side-only entries
      ...config?.input,
      // SSR client entries，我们对每个页面都生成了一个虚拟入口文件，这样能够对用户编写的文件进行 import，在用户代码的基础上做一些封装；virtual entry 的思路在构建工具中很常见
      ...Object.fromEntries(appContext.normalizedPages.map(({ name }) => [name, getVirtualEntry(name)])),
      // virtual entry，这里的虚拟入口的代码也就是驱动客户端代码进行水合的那部分模板代码
      // VIRTUAL_ROOT_NAME === '__ROOT__'
      [VIRTUAL_ROOT_NAME]: getVirtualEntry(VIRTUAL_ROOT_NAME),
    },
    output: {
      format: 'system',
      splitting: true,
      ...config?.output,
      path: OUTPUT_FOLDER,
      entryNames: dev ? 'client/[name]' : 'client/[name]-[hash]',
      chunkNames: 'client/[name].[hash]',
    },
    define: {
      __BROWSER__: 'true',
      global: 'globalThis',
    },
    command: dev ? 'serve' : 'build',
    watch: dev,
    configFile: false,
    platform: 'browser',
    plugins: [
      ...(config?.plugins ?? []),
      resolvePlugin({ root }),
      // clientPlugin 里面包含了对 virtual entry 的处理逻辑和对应应该生成的代码。
      clientPlugin({
        appContext: this.appContext,
      }),
      // 进度条插件，并行展示 Client 代码的进度条
      progressPlugin({ id: 'Client', quietOnDev: false }),
    ],
  },
  'universal.client'
);

const serverPlatform = environment === 'node' ? 'node' : 'browser';

this.serverBundler = await this.clientBundler.createChildCompiler(
  {
    ...config,
    root,
    input: Object.fromEntries(appContext.normalizedPages.map(({ name }) => [name, getVirtualEntry(name)])),
    output: {
      splitting: true,
      ...config?.output,
      format: 'cjs',
      path: OUTPUT_FOLDER,
      entryNames: 'server/[name]',
      chunkNames: 'server/[name].[hash]',
    },
    html: false,
    mode: dev ? 'development' : 'production',
    minify: false,
    command: 'build',
    watch: dev,
    configFile: false,
    define: {
      __BROWSER__: 'false',
    },
    platform: serverPlatform,
    plugins: [
      ...(config?.plugins ?? []),
      resolvePlugin({ root, external: true }),
      externalPlugin(externalOptions),
      // serverPlugin 里面包含了对 virtual entry 的处理逻辑和对应应该生成的代码。
      serverPlugin({ root, appContext }),
      // 进度条插件，并行展示 Server 代码的进度条
      progressPlugin({ id: 'Server', quietOnDev: false }),
    ],
  },
  'universal.server'
);
```

这里最核心的是对生成产物的代码的控制，其实现逻辑在 `clientPlugin` 中。Speedy 中插件均是通过 Tapable 的 hook 来实现了，也是借鉴了 Webpack 的插件体系。我们来看 `clientPlugin` 中比较核心的代码生成逻辑：

```tsx
// packages/universal/src/bundler/react/plugins/virtual-entry/client.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Browser, loadRouteModules } from '@speedy-js/universal/components';

async function init() {
  const data = JSON.parse(document.getElementById('__SPEEDY_DATA__')?.textContent ?? '{}');
  window.__SPEEDY__ = data;

  const root = document.getElementById('root');
  if (!root) {
    throw new Error('🔥 Hmm, cannot find `#root` to mount the component.');
  }

  if (!data.__SSR__) {
    ReactDOM.render(<Browser />, root);
  } else {
    const { assetsMeta, matchedPage } = data.__CONTEXT__;

    const { assets, module } = assetsMeta[matchedPage.name];
    const routeModule = await loadRouteModules(assets, module, matchedPage.name);
    data.__CONTEXT__.routeModules[matchedPage.name] = routeModule;

    ReactDOM.hydrate(<Browser />, root);
  }

  window.__SPEEDY_APP_LOADED__ = true;
}

init();

```

```ts
import clientVirtualEntryCode from './virtual-entry/client?raw';

export const clientPlugin = ({ appContext }: { appContext: AppContext }): SpeedyPlugin => {
  compiler.hooks.load.tapPromise(CLIENT_PLUGIN_NAME, async (args) => {
    if (!new RegExp(VIRTUAL_ENTRY_SUFFIX).test(args.path)) {
      return;
    }

    const { query } = resolvePathAndQuery(args.path);

    const pageName = query[QUERY_PAGE_NAME];

    if (!pageName) {
      return;
    }

    if (pageName === VIRTUAL_ROOT_NAME) {
      // 把模板代码作为字符串返回给 speedy 进行编译，实现了对用户代码的封装
      const entryHelper = new EntryHelper(clientVirtualEntryCode);

      return {
        loader: 'tsx',
        resolveDir: root,
        contents: entryHelper.toString(),
      };
    }

    const page = appContext.getPageByName(pageName)!;

    const prefetchPath = page.prefetch;
    const relativePrefetchPath = prefetchPath && path.relative(root, prefetchPath);

    const entryPath = page.entry;
    const relativeEntryPath = path.relative(root, entryPath);
    const entryHelper = new EntryHelper(`export { default } from './${relativeEntryPath}'`);

    if (prefetchPath && fs.existsSync(prefetchPath)) {
      const entryPoints: Record<string, string> = {
        prefetch: prefetchPath,
      };
      const buildResult = esbuild.buildSync({
        absWorkingDir: root,
        entryPoints,
        outdir: root,
        metafile: true,
        write: false,
      });
      const prefetchExportedNames = buildResult.metafile?.outputs?.['prefetch.js']?.exports;

      const isSSG = prefetchExportedNames?.includes('getStaticProps');
      const isSSR = prefetchExportedNames?.includes('default');

      if (isSSG) {
        prefetchTypeMap[pageName] = PREFETCH_TYPE.SSG;
      } else if (isSSR) {
        prefetchTypeMap[pageName] = PREFETCH_TYPE.SSR;

        entryHelper.addReExport({
          exportName: 'default as getServerSideProps',
          filepath: `./${relativePrefetchPath}`,
        });
      }
    }

    return {
      loader: 'tsx',
      resolveDir: root,
      contents: entryHelper.toString(),
    };
  });
}
```

下面是 `basic` 为例子生成的 `__ROOT__.js` 和 `client/ssr.js` 的简化版本:

```js
// __ROOT__.js
function init() {
  //...
}
// 水合逻辑
init()
```

```js
// React 组件
function App() {}
export default App
// 数据预取函数
export function getServerSideProps(){}
```

另外 `clientPlugin` 在后处理 HTML 文件的时候，会加入一些元信息（manifest），后续可供使用：

```ts
compiler.hooks.processAssets.tapPromise(
  {
    name: CLIENT_PLUGIN_NAME,
    stage: compiler.STAGE.PROCESS_ASSETS_MODIFY_GENERATED_HTML,
  },
  async (bundles, manifest) => {
    // ...
    for (const [chunkName, chunk] of compiler.outputChunk.entries()) {
      // ...
      // Append root.js to all html outputs
      if (chunkName.endsWith('.html')) {
        // add manifest to all pages
        chunk.contents = chunk.contents.toString().replace(
          '</body>',
          `
          <script id="${__SPEEDY_DATA_ID__}" type="application/json">
          ${serializeState<SpeedyData>({
            __CONTEXT__: {
              basename: ssrOptions.baseUrl,
              matchedPage,
              pages: ssrOptions.pages,
              isModule,
              assetsMeta,
              routeData: {},
              routeModules: {},
              getServerDataMeta: {},
            },
            __SSR__: false,
          })}
          </script>
          </body>
          `.trim()
      }
  }
```

再来看 `serverPlugin` 的核心代码：

```tsx
// packages/universal/src/bundler/react/plugins/virtual-entry/server.tsx
import React from 'react';
import { Server } from '@speedy-js/universal/components';
import type { ServerSideRenderContext } from '@speedy-js/universal/interface';
// @ts-ignore, __ENTRY_PATH__ 要被替换为实际的路径才能实现封装
import Entry from '__ENTRY_PATH__';

export const Component: React.FC<ServerSideRenderContext> = (props) => {
  return (
    <Server {...props}>
      <Entry />
    </Server>
  );
};

```

```ts
import serverVirtualEntryCode from './virtual-entry/server?raw';
export const serverPlugin = ({ appContext, root }: ServerPluginOptions): SpeedyPlugin => {
  return {
    name: SERVER_PLUGIN_NAME,
    apply(compiler) {
      // ...
      compiler.hooks.load.tapPromise(SERVER_PLUGIN_NAME, async (args) => {
        // ...
        if (!new RegExp(VIRTUAL_ENTRY_SUFFIX).test(args.path)) {
          return;
        }

        const { query } = resolvePathAndQuery(args.path);

        const pageName = query[QUERY_PAGE_NAME];

        if (!pageName) {
          return;
        }

        const page = appContext.getPageByName(pageName)!;

        const entryPath = page.entry;
        const prefetchPath = page.prefetch;

        const entryPoints: Record<string, string> = {
          server: entryPath,
        };

        if (prefetchPath) {
          entryPoints.prefetch = prefetchPath;
        }

        const buildResult = esbuild.buildSync({
          absWorkingDir: root,
          entryPoints,
          outdir: root,
          metafile: true,
          write: false,
        });

        const entryExportedNames = buildResult.metafile?.outputs['server.js'].exports;

        const relativeEntryPath = path.relative(root, entryPath);
        if (!entryExportedNames?.includes('default')) {
          throw new Error(`The component should be exported by default, file: ${relativeEntryPath}`);
        }

        const prefetchExportedNames = buildResult.metafile?.outputs?.['prefetch.js']?.exports;

        const hasPrefetch = !!prefetchExportedNames;
        const isSSG = prefetchExportedNames?.includes('getStaticProps');
        const isSSR = prefetchExportedNames?.includes('default');

        const relativePrefetchPath = prefetchPath && path.relative(root, prefetchPath);
        if (hasPrefetch) {
          if (isSSG && isSSR) {
            throw new Error(
              `Cannot export both 'getStaticProps' and 'default' at the same time in prefetch entry, please remove one of them, file: ${relativePrefetchPath}`
            );
          }
          if (!isSSG && !isSSR && prefetchExportedNames) {
            throw new Error(
              `Should export one of 'getStaticProps' or 'default' in prefetch entry, file: ${relativePrefetchPath}`
            );
          }
        }

        const entryHelper = new EntryHelper(serverVirtualEntryCode);

        entryHelper.replace(__ENTRY_PATH__, `./${relativeEntryPath}`);
        if (hasPrefetch) {
          entryHelper.addReExport({
            exportName: isSSR ? 'default as getServerSideProps' : 'getStaticProps',
            filepath: `./${relativePrefetchPath}`,
          });
        }

        return {
          loader: 'tsx',
          resolveDir: root,
          contents: entryHelper.toString(),
        };
      })
```

下面是 `basic` 为例子生成的 `server/ssr.js` 的简化版本:

```js
// server/ssr.js
// React 组件
export function Component() {}
// 数据预取函数
export function getServerSideProps(){}
```

### Server 实现

`BaseServer` 中也是包含了一些通用逻辑，开发模式和生产模式分别实现子类。通用逻辑有：

- 初始化一些 Polyfill ，这些 Polyfill 用于 Node.js 中运行一些浏览器常用的 API，例如 `atob`, `btoa`, fetch API 的 `Headers`, `Request` 和 `Response` 等，参考了 remix-node 进行实现。
- 定义一个 Connect 实例 `middlewares`，负责串联服务器的所有逻辑，用户可以通过向 `middlewares` 中 `push` 新的处理函数来自定义服务器的行为。
- `prepare` 函数，供 Server 内部执行一些异步函数，确保异步函数执行完之后再调用 Server 的具体方法。
- `handleStatic` 处理静态资源的逻辑。
- `handleServerSideRequest` 处理服务端请求。包含 SSR 请求时，服务端的逻辑，会执行 server 产物中的数据预取函数并完成脱水流程。

    ```ts
    export abstract class BaseServer {
      // ...
      handleServerSideRequest = async (req: IncomingMessage, res: ServerResponse) => {
          const { framework, pages, baseUrl } = this.ssrOptions;
          const { dev, root } = this.options;

          if (!req.url) {
            return;
          }

          const url = new URL(req.url, `http://${req.headers.host}`);

          const matchedPage = matchPage({
            pages,
            pathname: url.pathname,
            baseUrl,
          });

          const { prefetchTypeMap } = this.manifest;

          if (matchedPage?.name) {
            // production, serve page as static files
            if (prefetchTypeMap[matchedPage.name] === PREFETCH_TYPE.SSG && !dev) {
              return;
            }

            const template = fs.readFileSync(getHtmlPath(this.dist, matchedPage.name), 'utf-8');

            if (url.searchParams.has('csr')) {
              return res.end(template);
            }

            // should not cache html files in browser
            // https://nextjs.org/docs/going-to-production#caching
            res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');

            if (framework === 'react') {
              // Renderer 内部会根据当前请求页面是 SSR 还是 SSG 去进行不同的渲染逻辑；可以直接根据构建产物的 export 名称来判断
              const renderer = new Renderer({
                baseUrl,
                dist: this.dist,
                matchedPage,
                name: matchedPage.name,
                template,
                pages,
                root,
                dev,
                pageMeta: this.manifest.entryMeta[matchedPage.name],
                assetsMeta: this.manifest.assetsMeta ?? {},
                isModule: this.manifest.format === 'esm',
              });
              // 借鉴了 Remix 的思想，将所有请求转化为 fetch API req/res 来进行处理，renderer 只需考虑 fetch API 即可
              const response = await withFetchAPI(req, res, async (request) => {
                return renderer.render(request);
              });
              return response;
            }
            throw new Error(`universal server for framework ${framework} has not been implemented`);
          }
        };
    }
    ```

`DevServer` 需要增加 `handleStatic` 函数的逻辑，由于 Speedy 内部已经实现了对静态资源的 server，直接对其进行代理即可：

```ts
class DevServer {
  // ...
  handleRequest: SimpleHandleFunction = async (req: IncomingMessage, res: ServerResponse) => {
      this.setHttpProxyHandler(req);
      try {
        const resp = await this.handleServerSideRequest(req, res);
        if (resp) {
          return;
        }
      } catch (e) {
        console.log(e);
      }

      if (path.parse(req.url ?? '/').ext) {
        return this.handleStatic(req, res);
      }

      return res.end(renderNotFound());
    };
  handleStatic: SimpleHandleFunction = (req, res) => {
    const httpProxy = this.getHttpProxy();
    // https://nextjs.org/docs/going-to-production#caching
    res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    httpProxy.web(req, res);
  };
  // ...
}
```

对于 `ProdServer`，则有不同的 `handleStatic` 逻辑，从产物中进行 serve:

```ts
handleStatic: Connect.SimpleHandleFunction = (req, res) => {
  const { url: reqUrl = '' } = req;
  const publicPath = getPublicPath(this.manifest.publicPath);
  const { baseUrl } = this.ssrOptions;
  const name = reqUrl
    .split('?')[0]
    .replace(/.html?$/, '')
    .replace(baseUrl, '')
    .slice(baseUrl === '/' ? 0 : 1);

  const filename = getFilenameFromUrl(`/${name ?? ''}`, [
    {
      publicPath,
      outputPath: this.dist,
    },
  ]);

  if (!filename || !fs.existsSync(filename) || fs.lstatSync(filename).isDirectory()) {
    res.statusCode = 404;
    res.end('Page Not Found');
    return;
  }

  const reqPath = decodeURI(url.parse(reqUrl).pathname || '');

  const mimeType = lookup(reqPath) || lookup(filename);
  if (mimeType) {
    res.setHeader('Content-Type', mimeType);
  }

  res.statusCode = 200;
  // https://developers.google.com/web/fundamentals/performance/webpack/use-long-term-caching
  // https://nextjs.org/docs/going-to-production#caching
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  fs.createReadStream(filename).pipe(res);
};
```

然后我们实现了 `universal` 这个脚本，添加 `universal dev` 和 `universal build` 分别来进行开发和构建，可以用 `universal start` 来启动 `ProdServer`。

### Adapter 实现

为了让我们的代码不仅能在 Node.js 环境下面通过 `universal` CLI 来部署，还想在 Vercel 和 CloudFlare 以及公司内的其他 Serverless 或者 Edge 上部署，我们参考了 [Remix Adapter](https://remix.run/docs/en/main/other-api/adapter) 的思想来支持不同的适配器，实现不同环境部署。

例如 Vercel Adapter 实现如下:

```ts
// packages/universal/src/adapters/vercel/index.ts
import type { IncomingMessage, ServerResponse } from 'http';
import { ProdServer } from '../../server/prod-server';

export interface VercelAdapterOptions {
  root?: string;
}

export function createVercelHandler({ root = process.cwd() }: VercelAdapterOptions = {}): (
  req: IncomingMessage,
  res: ServerResponse
) => void {
  const server = new ProdServer({ root });

  return async (req: IncomingMessage, res: ServerResponse) => {
    await server.prepare();

    const handler = server.getRequestHandler();
    return handler(req, res);
  };
}

```

在项目根目录创建 `server.vercel.js`:

```js
// server.vercel.js
// @ts-check

const { createVercelHandler } = require('@speedy-js/universal/adapters/vercel');

module.exports = createVercelHandler();
```

`vercel.json`:

```json
{
  "version": 2,
  "public": false,
  "github": {
    "enabled": false
  },
  "builds": [
    {
      "src": "./server.vercel.js",
      "use": "@vercel/node",
      "config": {
        "//": "https://github.com/vercel/vercel/issues/1788#issuecomment-485629244",
        "includeFiles": ["./.universal/**"],
        "bundle": false,
        "maxLambdaSize": "50mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.vercel.js"
    }
  ]
}

```

运行 `vercel --prod` 即可部署到 Vercel。

---

CF Worker 的 Adapter 实现也很简单:

```js
/// <reference lib="dom.iterable"/>

import { getAssetFromKV, MethodNotAllowedError, NotFoundError } from '@cloudflare/kv-asset-handler';
import type { CloudflareBuildManifest } from './interface';
import { PREFETCH_TYPE } from '../../interface';
import { renderToHTML } from '../../helpers/render';
import { getQuery } from '../../helpers/getQuery';
import { matchPage, PageMatch } from '../../helpers/matchPage';
import { FetchEvent } from '../../../client';

export * from './interface';

export interface CloudflareWorkerAdapterOptions {
  dev?: boolean;
  root?: string;
  manifest: CloudflareBuildManifest;
}

export interface CloudflareWorkerServerOptions extends CloudflareWorkerAdapterOptions {
  event: FetchEvent;
}

class CloudflareWorkerServer {
  options: CloudflareWorkerServerOptions;

  pathname: string;

  origin: string;

  url: URL;

  matchedPage: PageMatch | undefined;

  constructor(options: CloudflareWorkerServerOptions) {
    this.options = options;

    const { event } = this.options;
    this.url = new URL(event.request.url);
    this.pathname = this.url.pathname;
    this.origin = this.url.origin;
    this.matchedPage = this.matchPageName(this.pathname)!;
  }

  async handleAssets(): Promise<Response> {
    const { pathname } = this;
    try {
      return await getAssetFromKV(this.options.event, {
        mapRequestToAsset: (request) => {
          // 这里使用了 manifest 文件
          const { baseUrl } = this.options.manifest.ssrOptions;
          if (pathname.startsWith(baseUrl)) {
            if (this.matchedPage?.name) {
              return new Request(new URL(`${this.matchedPage.name}.html`, this.origin).href);
            }
            return new Request(new URL(pathname.replace(baseUrl, ''), this.origin).href);
          }
          return request;
        },
      });
    } catch (e) {
      if (e instanceof NotFoundError) {
        return new Response('NotFoundError', { status: 404 });
      }
      if (e instanceof MethodNotAllowedError) {
        return new Response('MethodNotAllowedError', { status: 500 });
      }
      return new Response('An unexpected error occurred', { status: 500 });
    }
  }

  async getAsset(url: string): Promise<string> {
    const res = await getAssetFromKV({
      request: new Request(new URL(url, this.origin).href),
      waitUntil: () => {},
    });
    return res.text();
  }

  async handleSSRRequest(): Promise<Response> {
    const {
      manifest,
      event: { request },
    } = this.options;
    const { pathname, search } = this.url;
    if (!this.matchedPage) return new Response('No matched SSR page', { status: 404 });

    const templateHtmlPath = `/${this.matchedPage.name}.html`;
    const template = await this.getAsset(templateHtmlPath);

    const { Component, getServerSideProps } = manifest.exportsMap[this.matchedPage.name].server;
    const response = new Response();
    try {
      const html = await renderToHTML({
        Component,
        getServerSideProps,
        assetsMeta: manifest.assetsMeta,
        basename: manifest.ssrOptions.baseUrl,
        template,
        pages: manifest.ssrOptions.pages,
        matchedPage: this.matchedPage,
        context: {
          request,
          response,
          pathname,
          query: getQuery(search),
        },
        isModule: manifest.format === 'esm',
      });
      return new Response(html, {
        ...response,
        headers: { ...Object.fromEntries(response.headers.entries()), 'Content-Type': 'text/html' },
      });
    } catch (err: any) {
      throw new Error(`Error when calling render function of server file: ${templateHtmlPath}`);
    }
  }

  matchPageName(pathname: string) {
    const { ssrOptions } = this.options.manifest;
    const match = matchPage({ pages: ssrOptions.pages, pathname, baseUrl: ssrOptions.baseUrl });
    return match;
  }

  async handleRequest() {
    const { request } = this.options.event;
    const { ssrOptions, prefetchTypeMap, exportsMap } = this.options.manifest;
    const { framework } = ssrOptions;

    const { searchParams } = this.url;
    if (searchParams.get('__data')) {
      if (!this.matchedPage) {
        return new Response('No matched SSR page for data', { status: 404 });
      }
      const { getServerSideProps } = exportsMap[this.matchedPage.name].server;
      if (!getServerSideProps) {
        return new Response('No matched SSR export getServerSideProps for data', { status: 404 });
      }
      const response = new Response();
      const data = await getServerSideProps({
        request,
        response,
        pathname: this.pathname ?? '/',
        query: searchParams,
      });
      return new Response(JSON.stringify(data), {
        ...response,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Content-Type': 'application/json',
        },
      });
    }

    if (this.matchedPage?.name) {
      if (prefetchTypeMap[this.matchedPage.name] === PREFETCH_TYPE.SSR) {
        if (framework === 'react') {
          return this.handleSSRRequest();
        }
        throw new Error(`universal server for framework ${framework} has not been implemented`);
      }
    }
    // 其他情况的话是静态资源，使用 CF Worker 的 KV 存储处理，构建产物需要上传到 KV 存储
    return this.handleAssets();
  }
}

// 给的是 fetchAPI Request，我们要返回 fetchAPI Response
// TODO: proxy the web socket connection when developing
export function createCloudflareWorkerHandler(options: CloudflareWorkerAdapterOptions): (event: FetchEvent) => void {
  return (event) => {
    const server = new CloudflareWorkerServer({
      ...options,
      event,
    });
    event.respondWith(server.handleRequest());
  };
}

```

其中用到了 manifest 文件来实现导入对应页面的代码，manifest 是由 `clientPlugin` 生成的:

![manifest](https://s2.loli.net/2023/05/21/WAzLY2lEGQxvdft.png)

配置 `wrangler.toml`:

```toml
name = "ssr-react-example"
type = "javascript"

zone_id = ""
account_id = ""
route = ""
workers_dev = true

[site]
# These two settings are necessary to save the assets to CF KV storage
# https://developers.cloudflare.com/workers/cli-wrangler/commands#kvkey
# https://developers.cloudflare.com/workers/cli-wrangler/configuration#site
bucket = ".universal"
entry-point = "."

[build]
command = "pnpm build:cf-worker"
watch_dir = "src"

[build.upload]
format="service-worker"

```

部署的话运行 `wrangler publish` 即可。

## 总结与思考

本文介绍的是 Speedy 的 SSR 实现，在实现 Speedy SSR 的过程中参考了 Vite、Next.js 和 Remix。其实业界的 SSR 实现总体思路都是基本上一致的，主要的点有：

- 一份代码，两份产物，实现客户端和服务端复用
- 开发体验，API 设计简洁，可拓展性强，开发速度快
- 部署到不同的环境的支持
- 性能提升，最终的目标是提升页面的首屏性能，达到秒开的目的。

Speedy 最终以失败而告终，去年已经逐渐不再维护了，主要还是 esbuild 的关注点和其他构建工具不一样，例如 HMR、拆包等就做的很不好；Rspack 成为了团队新推的构建工具，两者都借鉴了 Webpack 的插件体系，想做的东西也很类似，就是提升大家的开发效率，不过我没有参与过 Rspack 的开发，就不是很熟悉了。

## 参考资料

1. https://github.com/upupming/speedy-ssr-examples
2. [SSR与当年的JSP、PHP有什么区别？](http://www.ayqy.net/blog/diference-between-ssr-and-jsp-php/)
3. https://vitejs.dev/guide/ssr.html
4. https://github.com/vitejs/vite/tree/main/packages/playground
5. https://github.com/frandiox/vite-ssr
6. https://vitedge.js.org/
6. https://vercel.com/guides/using-express-with-vercel
7. https://blog.cloudflare.com/serverless-rendering-with-cloudflare-workers/
8. https://next-code-elimination.vercel.app/
