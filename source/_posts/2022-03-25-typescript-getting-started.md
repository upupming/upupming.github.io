---
title: 我眼中的 TypeScript（入门级别介绍）
date: 2022-03-25 22:32:37
tags:
- frontend
categories:
- 前端
- 基础知识
---

在现在的前端生态中，TypeScript 已经成为了非常重要的一位成员，很多用 JS 新写的库往往会直接使用 TS 来编写，提供 first class 的类型支持（例如 `vue@3`, `windicss`, `vite` 等等）。以前用 JS 的旧项目，只要是比较火的，基本上都在 [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) 有了来自社区的 `.d.ts` 类型定义（例如 `express`, `koa`, `lodash` 等等）。TypeScript 一直都作为社区生态而不是 JS 语言自身的标准存在，前段时间 TypeScript 团队主推了「Types as Comments」提案，将在 2022 年 3 月底的 TC39 会议上讨论，受到了广泛关注，可以参考知乎 [如何看待 TS 团队发起的 「JS 类型标注」提案 Types as Comments？](https://www.zhihu.com/question/521070005/answer/2383132269) 和 [TypeScript 官方推特](https://twitter.com/typescript/status/1501634547921801216?s=20&t=fTehXi-l3W5IBsYKTjBLzw)，Types as Comments 提案意味着浏览器可以直接运行经过 TypeScript 代码（但是会跳过类型检查），这就省去了繁重的编译工具，可以提升开发效率。

<!-- more -->

## TypeScript 是什么?

简单来说，TypeScript 是 JavaScript 的超集，但是 TS 在 JS 的基础上加入了类型支持。你可以简单地将 `.js` 文件直接修改为 `.ts` 文件，然后就可以开始写 TS 代码了（虽然可能会遇到一些类型报错，但是后续可以一点点修复）。因此在学习 TS 之前，你应该对 JS 有一定的使用经验。

### 编译时 (compile-time) vs 运行时 (run-time)

如果你学过一门静态编程语言，就会对 TS 是什么有更深刻的理解。例如在强类型语言 C++ 中，我们初始化一个 `int` 变量，并尝试将一个字符串赋值给它，这个时候在你进行编译的时候编译器就会报错。

```cpp
int a = "this is a string";
```

当你使用 g++ 等编译工具尝试将此段 C++ 代码编译成二进制的可执行文件的时候，编译器会报错不允许将字符串类型（`const char [17]`）赋值给整数类型 `int`。

```bash
test.cpp:2:9: error: cannot initialize a variable of type 'int' with an lvalue of type 'const char [17]'
    int a = "this is a string";
        ^   ~~~~~~~~~~~~~~~~~~
1 error generated.
```

很多编辑器能够在你写代码的时刻就告知你这个语法错误，例如 VSCode 提醒你这段有语法错误：

![20220325231533](https://s2.loli.net/2022/03/25/WKmeXa8GLVrJjil.png)

这个过程是发生在你写代码的时刻的，也就是说你还没有执行你的代码，编译器就已经发现了你的代码有问题，因此这个过程也叫做**静态类型检查**，是在**编译时**完成的。

C++ 作为编译型语言，能够在编译时就做好这些类型检查，因此如果你有一个好的编辑器，编辑器也能给你很好的自动补全。

JS 的不同之处在于，它本身是只有**运行时**的，最常见的两个运行时是浏览器（当然有各种不同的内核实现）和用于服务端的 Node.js（新出的还有 Deno，但是目前用的人还不多）。JS 本身不存在一个编译过程，因此你的代码将会直接在运行时中一行一行地运行，在运行的时候做类型检查是非常没有必要且耗时的，而且 JS 从设计之初就是为了简单起见，也没有添加强的类型限制和类型语法（比如现在提出的 Type as Comments 语法）。这样一段代码在 JS 运行时中执行，不会有任何报错：

```js
let cnt = 1
cnt = 'this is a string'
cnt = [1, 2, 3]
```

虽然弱类型让 JS 具有非常强的灵活性，在很多时候能够少写很多代码，或者让一个复杂的实现变得简单，但是实践证明对类型进行强的限制是明智的，引入一个编译时并且在编译时给变量定义类型，通过类型检查能够提前规避很多类型问题。TypeScript 就实现了一个编译器，可以将 TS 代码编译成 JS 代码，在编译的过程中可以顺带做一下类型检查告诉你代码有哪些问题，同时将类型擦除变成纯粹的可以在 JS 运行时中执行的 JS 代码。上面这段代码改成 TS 代码你就会发现 TS 编译器会报错：

```ts
let cnt = 1
cnt = 2
cnt = 'this is a string' // Type 'string' is not assignable to type 'number'.ts(2322)
cnt = [1, 2, 3] // Type 'number[]' is not assignable to type 'number'.ts(2322)
```

在上面这段代码中，在初始化 `cnt` 的时候，TypeScript 会自动推断出 `cnt` 的类型是 `number`，因此后面只能将 `number` 类型的值赋给 `cnt`，尝试将其他的类型赋给 `cnt` 都会报错。

> 在前端生态中，编译工具无处不在，最早的应该是 Browserify 尝试将 Node.js 代码编译到浏览器中去执行，后来是 Webpack, Rollup 打包工具帮助你打包大型项目和 Babel 这种将新版本的 ES 代码转换成旧版本 ES 代码的工具。到了现在，使用 go 语言写的构建工具 esbuild 和 rust 写的编译工具 swc 逐渐流行起来，带动了社区的 Native 化，很多 JS 工具用原生语言重写，基于 esbuild 的 Vite 也发展迅猛。

> 推荐阅读官方文档: [TypeScript for the New Programmer](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)

<!-- - JavaScript 的超集，最终会编译成 JavaScript
    - 编译型语言和解释型语言
    - 前端编译无处不在，最早的 Browserify，Webpack, Rollup, Babel，到现在的 Esbuild, SWC, Vite，发展非常地迅猛
    - 类型检查和类型擦除
- 无论是迁移旧项目还是新建一个严格的新项目都非常方便，通过 `tsconfig.json` 可以控制得和 JS 一模一样，也可以控制的最严格。
- DefinitelyTyped
- 可以和各种前端框架结合，在 babel 中配置，在 webpack 中配置，在 vite 中配置类型检查等等。
- TypeChallenges 练习，里面的题目还是比较难的
- TypeScript Playground -->

## 为什么要学习 TypeScript

从我个人体验上，我觉得使用 TS 的好处有：

- 代码即文档，不论是自己写代码，还是使用别人写的库，都更加轻松
- 自动补全，不用再手敲一大串的函数名称或者一直复制粘贴函数名称
- 类型错误往往意味着自己的代码有问题，我们能够提早发现错误并规避这些问题
- 代码重构时的类型时报错，能够提早发现潜在 Bug

在后面的例子中我会一一体现这几个优点。

另外值得一提的是，TS 是微软开发的 JS 类型检查工具，2012 年发布，Facebook 在 2014 年推出了 Flow.js 作为 JS 的类型检查工具，后来由于 VSCode 的流行和 VSCode 在 TS 代码补全上优势，以及 TS 社区的快速迭代和发展，在生态方面完全战胜了 Flow.js，Vue 2 最初也是用 Flow.js 进行部分的类型检查保持代码的健壮性，但是 Vue 3 已经全部使用 TypeScript 重写，当下基础库为用户提供良好的 TypeScript 支持已经成为非常重要的考虑因素。可以参考尤雨溪的知乎回答 [Vue 2.0 为什么选用 Flow 进行静态代码检查而不是直接使用 TypeScript？](https://www.zhihu.com/question/46397274/answer/101193678)以及贺老的回答[为什么 React 源码不用 TypeScript 来写？](https://www.zhihu.com/question/378470381/answer/1073922938)。

## TypeScript 基础知识

只是简单加入一些自己的看法，具体的细节由于官方文档的 [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) 已经介绍的非常好，推荐直接进行阅读。我自己也给 TS 文档提过 PR（虽然很小）: https://github.com/microsoft/TypeScript-Website/pull/1761

### 原始类型

JS 中有七个原始类型 (primitives)，原始类型在赋值的时候会新建一个全新的值，存在新的内存空间里面，而非原始类型在赋值的时候只是按引用赋值，指向同一段内存空间。

原始类型

- number
- string
- boolean
- null
- undefined
- Symbol
- undefined

推荐直接阅读官方文档 [Everyday types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)，讲得非常清晰。

### 其他常用类型

- Array
- Tuple, 可以理解为更加精细化的 Array
- 函数类型 [](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- 对象类型，主要用的就是 `interface` 类型，直接参考[官方文档 Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)

### unknown, never 和 any

TS 的类型有点类似集合的概念，unknown 是全集，never 是空集，any 则是完全禁用类型检查，不管怎么用都不包类型错误，也没有自动补全了。

详细的介绍可以参考这篇非常好的[博客文章](https://blog.logrocket.com/when-to-use-never-and-unknown-in-typescript-5e4d6c5799ad/)。截取他的图片放在这里，看一下集合关系：

![20220326154156](https://s2.loli.net/2022/03/26/hOtLDkymaKugrNV.png)

### 联合（Union）和收窄

联合的语法是 `|`，`string | number` 表示可以是 `string` 也可以是 `number`。

联合会让类型变得更加宽泛，同时会让类型补全更加无力，可以通过 `if` 判断收窄或者通过自己实现的类型守卫（Type Guard）来收窄类型，来获取更好的类型提示。

```ts
function printStringOrNumber(a: string | number) {
  if (typeof a === 'number') {
    // 这里 TS 能够知道 a 一定是 number 类型
    console.log(a.toFixed(2))
  } else {
    // 这里 TS 能够知道 a 一定是 string 类型
    console.log(a.toLowerCase())
  }
}

```

另外还有 `instanceof` 和自定义的类型守卫等等，直接参考官方文档: [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

### TS 内置的辅助类型（Utility types）

参考: https://www.typescriptlang.org/docs/handbook/utility-types.html

### 继承和交叉类型

`type` 主要使用交叉类型，`interface` 主要是用继承 `extends`。

### tsconfig.json 和 tsc

全局安装 TypeScript 就可以使用 `tsc` 命令了，使用 `tsc` 命令可以编译单个 TS 文件或者 `tsconfig.json` 表示的整个项目。

```bash
npm i -g typescript
```

## 动手操作

将 React 官方文档中的 tic-tac-toe 改造为 TS 版本:

- https://reactjs.org/tutorial/tutorial.html
- https://codepen.io/gaearon/pen/gWWZgR?editors=0110

<!-- ### 当你接触一个新项目时，类型帮助你使用代码而不需要看文档

### 当你写完一个功能时，迁移代码时类型检查能够帮助你避免漏掉一些潜在的 Bug -->

### JSDoc/TSDoc

- JSDoc: https://jsdoc.app/
- TSDoc: https://tsdoc.org/

## 项目模板

- https://github.com/egoist/ts-lib-starter

## 高级类型（类型体操）

- https://github.com/type-challenges/type-challenges
- [用 TypeScript 类型运算实现一个中国象棋程序](https://zhuanlan.zhihu.com/p/426966480)
- [TypeScript 类型体操天花板，用类型运算写一个 Lisp 解释器](https://zhuanlan.zhihu.com/p/427309936)

### TypeScript Compiler API

参看 GitHub 上的 Wiki 页面，内置的 API 比较晦涩难懂，可以结合第三方生态来看，可以看用 TS API 写的一些工具库的源码。

https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

## 一些想法

- 很多时候一个类型调不好，会花很多时间去想解决办法，但是其实直接 any 会更简单，到底改什么时候使用 any，是值得思考的，不和自己过意不去，也不要成为 anyboy，将 TypeScript 用成了 AnyScript。
- 见过比较复杂的类型，比如 `rematch`、`@vue/runtime-core` 和 `element-plus` 的 `buildProps` 等等，喜欢类型体操的同学可以看一下。
- [TypeScript playground](https://www.typescriptlang.org/play) 有点类似于 Babel Repl 和 Rollup Repl，直接在浏览器中运行 TypeScript。
