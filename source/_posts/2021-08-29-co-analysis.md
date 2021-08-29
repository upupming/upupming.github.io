---
title: co 源码分析、迭代器、生成器、async/wait 对比
date: 2021-08-29 13:48:03
tags:
- frontend
categories:
- 前端
- 源码阅读
---

## 准备工作

### 迭代器和生成器

关于迭代器和生成器，我看的是《深入理解 ES6》，里面讲的很好，如果有不理解的同学，可以先补一补，英文版是开源的，在[这里](https://github.com/nzakas/understandinges6/blob/master/manuscript/08-Iterators-And-Generators.md)。

<!-- more -->

关于迭代器和生成器几点简单的总结：

- 迭代器: **Iterators** are just objects with a specific interface designed for iteration. All iterator objects have a `next()` method that returns a result object.
- 生成器: A **generator** is a function that returns an iterator.
- 可迭代对象: Closely related to iterators, an **iterable** is an object with a `Symbol.iterator` property.

### 相关代码

为了便于源码分析，我把 [`co` 源码](../co)和它的类型定义 [`@types/co`](../DefinitelyTyped/types/co) 都拉取下来了，并且使用 yarn workspace 管理依赖，并且将我的一些测试代码写在了 [test/co.spec.ts](./test/co.spec.ts) 和 [test/co.type.spec.d.ts](test/co.type.spec.d.ts) 中。所有源代码均可在 https://github.com/upupming/koa-analysis/ 获取，原文链接在: https://github.com/upupming/koa-analysis/tree/master/co-analysis/README.md 。

## co 源码分析

co 最新版是 v4.6.0，是 2015-07-09 发布的，距今已经 6 年多了，可见已经比较稳定，或者说现在基于 async/await 编程的话，根本是不需要 `co` 这个东西的。他的 README.md 也说了，对于 `co@4.0.0` 「It is a stepping stone towards the [async/await proposal](https://github.com/lukehoban/ecmascript-asyncawait).」，返回类型用 Promise 替代了原来的 "thunk"。类型定义 `@types/co` 最后一次更新是在 2019-06-05，比较老旧。

我先从使用方法入手，然后深入源码逐一分析。

### 从 TS 类型入手

熟悉代码之前，我们先熟悉 TS 类型，搞清楚 `co` 的传入参数，返回值都是什么类型的。

> 看完 `@types/co` 的源码之后，觉得他在 generator 返回值类型的抽取定义可能稍微不太准确。我提了一个 PR 优化 `co` 的 `ExtractType` 类型: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/55440
>
> 不过确实 JS 是比较动态的语言，`co` 的逻辑比较复杂，能够处理的情况比较多，但是 TS 要精确表达每一种情况下的输入输出类型情况比较麻烦。

#### `ExtractType` —— 抽取可迭代对象的 return 值

```ts
/**
 * 传入一个可迭代对象类型 `I`，返回这个可迭代对象最终的 return 类型
 * 如果 `I` 不是可迭代对象：
 * 如果是函数，则返回函数的返回值
 * 如果是别的类型，直接返回 I 本身
 * 关于迭代器和生成器的类型使用方法详见: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-6.html
 */

type ExtractType<I> = I extends { [Symbol.iterator]: () => Iterator<any, infer TReturn, any> } ? TReturn :
  I extends (...args: any[]) => any ? ReturnType<I> : I

// 注意 TS 里面的 Generator 继承自 Iterator，本质上还是一个可迭代对象，GeneratorFunction 才是生成函数的类型定义
// yield number, return string, next boolean
type A = ExtractType<Generator<number, string, boolean>>
// yield number, no return, next boolean
type B = ExtractType<Generator<number, undefined, boolean>>
// no yield number, return string, next boolean
type C = ExtractType<Generator<undefined, string, boolean>>

export type extractTypeCases = [
  // 可以看到 ExtractType 拿出来的都是 TReturn 类型
  Expect<Equal<A, string>>,
  Expect<Equal<B, undefined>>,
  Expect<Equal<C, string>>,
]
```

#### `Co` —— 传入生成器函数返回一个 Promise

```ts
/**
 * 接下来是 co 自己的类型声明，是一个函数，有泛型 `F`
 * 传入 `fn` 的的类型 `F` 是一个返回 Iterator 的函数，所以很自然地可以是 Generator Function
 * 传入的参数 `args` 是 `F` 的参数类型
 * 返回一个 Promise，Promise 的返回值是 `F` 返回的 Generator 的 `ExtractType` 结果
 */
// type Co<F extends (...args: any[]) => Iterator<any>> = (fn: F, ...args: Parameters<F>) => Promise<ExtractType<ReturnType<F>>>

type Co<F extends (...args: any[]) => Iterator<any, any, any>> = (fn: F, ...args: Parameters<F>) => Promise<ExtractType<ReturnType<F>>>

function * d (x: number, y: string, z: boolean): Generator<boolean, string, number> {
  const ret = yield false
  console.log('a', ret)
  return '1'
}

type D = typeof d
// 把 D 作为参数传给 Co 的时候，看一下返回类型
type E = ReturnType<Co<D>>

type F = () => Generator<boolean, undefined, number>
type G = ReturnType<Co<F>>
type H = () => Generator<undefined, string, number>
type I = ReturnType<Co<H>>
// 可以看到最终 Co 函数的返回类型就是 Promise<yield | return>
export type coCases = [
  Expect<Equal<E, Promise<string>>>,
  Expect<Equal<G, Promise<undefined>>>,
  Expect<Equal<I, Promise<string>>>,
]

/**
 * Co['wrap'] 的话类型和 Co 是一模一样的，只是柯里化了一下，就不做介绍了
 */
wrap: <F extends (...args: any[]) => Iterator<any, any, any>>(fn: F) => (...args: Parameters<F>) => Promise<ExtractType<ReturnType<F>>>;
```

### 从使用例子入手分析 `co` 的实现

#### Eg. 1: `co(*gen)`

##### Eg. 1.1: 普通使用

###### 使用方法

```js
it('should work as documented', async () => {
  function * gen (a: number, b: string, c: boolean): Generator<Promise<boolean>, boolean, boolean> {
    expect(a).toEqual(1)
    expect(b).toEqual('2')
    expect(c).toEqual(true)
    const r1 = yield Promise.resolve(false)
    expect(r1).toEqual(false)
    const r2 = yield Promise.resolve(true)
    expect(r2).toEqual(true)
    return r2
  }
  await co(gen, 1, '2', true)
    .then(function (value) {
      expect(value).toEqual(true)
    }, function (err) {
      console.error(err.stack)
    })
})
```

其实上面的代码等价于：

```js
it('should same as async/await', async () => {
  const fun = async (a: number, b: string, c: boolean): Promise<boolean> => {
    expect(a).toEqual(1)
    expect(b).toEqual('2')
    expect(c).toEqual(true)
    const r1 = await Promise.resolve(false)
    expect(r1).toEqual(false)
    const r2 = await Promise.resolve(true)
    expect(r2).toEqual(true)
    return r2
  }
  await fun(1, '2', true)
    .then(function (value) {
      expect(value).toEqual(true)
    }, function (err) {
      console.error(err.stack)
    })
})
```

简单来说，在 `co` 包裹的 generator 内部连续使用 `yield` 的语法跟在 `async` 函数中连续使用 `await` 是一样的，async/await 是在 [2017 年也就是 ES2017 (ES8) 正式发布的](https://github.com/tc39/proposals/blob/master/finished-proposals.md)，比 `co` 出现还是晚很久（`co` 刚开始应该 Promise 都还没出来，用的是文档里面提到的 "thunk" 函数，就是一个带回调的函数 `function (callback) {...}`，这个可以参考《深入理解 ES6》的「异步任务执行器」一节的回调的代码模式）。所以可以理解为 generator function + co + promise = async/await。

`co` 会使用传入的生成器函数创建一个迭代器，然后遍历这个迭代器，每次拿到迭代器 yield 出来的值 `ret`，就调用迭代器的 `.next(ret)` 将 `ret` 赋值给上面样例代码中的 `r1/r2`（可以参考《深入理解 ES6》的「给迭代器传递参数」和「向任务执行器传递数据」 这两节，这个逻辑和书上的样例是一模一样的）。迭代器结束的（`done=true`）时候，得到的值（也就是生成器函数里的 `return` 语句）作为 Promise 最后 resolve 的值。

###### `co` 实现代码

`co` 函数只有 60 行左右，非常简单，我加了一些注释：

```js
function co(gen) {
  // 保存 this 指针
  var ctx = this;
  // 保存 gen 后面所有参数
  var args = slice.call(arguments, 1);

  // we wrap everything in a promise to avoid promise chaining,
  // which leads to memory leak errors.
  // see https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
    // 如果 gen 是函数（注意 typeof generator function === 'function'），则执行这个函数
    // 显然对于 gen 是 generator function 的场景，赋值之后 gen 就变成了一个可迭代对象，后续可以和 yield 交互了
    // 如果传入的 gen 是一个普通函数，赋值之后 gen 就变成了这个函数的返回值
    if (typeof gen === 'function') gen = gen.apply(ctx, args);
    // !gen 或者 gen.next 不是函数（也就是说 gen 不是一个可迭代对象的情况），直接 resolve gen
    // 其实我觉得这里更准确的方法应该是判断 typeof gen[Symbol.iterator] !== 'function'，因为生成器返回的迭代器（既是一个迭代器(有 `next` 方法)、又是一个可迭代对象(有 `Symbol.iterator` 属性)）一定都有 `Symbol.iterator` 属性，参考 https://stackoverflow.com/a/32538867/8242705
    // 其实也可以看 TS 类型定义 `Generator` 继承了 `Iterator`，并在其基础上多了一个 `Symbol.iterator` 属性
    if (!gen || typeof gen.next !== 'function') return resolve(gen);

    // 第一次调用 onFulfilled 不传参数，因为 gen.next(res) 第一次的传参没有意义，因为还没有执行任何 yield，第一次 next 的传参总是会被生成器忽略。具体的解释可以参考《深入理解 ES6》「给迭代器传递参数一节」
    onFulfilled();

    /**
     * @param {Mixed} res
     * @return {Promise}
     * @api private
     */

    function onFulfilled(res) {
      var ret;
      try {
        // 给生成器传参 res，拿到 yield 出来的 ret 值
        ret = gen.next(res);
      } catch (e) {
        // 如果发生预期外错误，最外层的 Promise 就 reject
        return reject(e);
      }
      // 将 yield 出来的值传给 next，在我们的实例代码中，第一次这里 ret 就是一个 { value: Promise<1>, done: false }
      next(ret);
      return null;
    }

    /**
     * @param {Error} err
     * @return {Promise}
     * @api private
     */
    // 就是调用 gen.throw 向生成器抛出错误的一个辅助函数
    // 可以参考《深入理解 ES6》「在迭代器中抛出错误」一节
    function onRejected(err) {
      var ret;
      try {
        ret = gen.throw(err);
      } catch (e) {
        // 如果发生预期外错误，最外层的 Promise 就 reject
        return reject(e);
      }
      next(ret);
    }

    /**
     * Get the next value in the generator,
     * return a promise.
     *
     * @param {Object} ret
     * @return {Promise}
     * @api private
     */

    function next(ret) {
      // 如果生成器到达 return 语句，最外层 Promise resolve，从这里可以看出 co 总是 resolve 为生成器最终的返回值
      if (ret.done) return resolve(ret.value);
      // ret.val 可能是原生数据类型、Promise、数组、对象、或者这些东西的嵌套，这里有一层 toPromise 转换
      var value = toPromise.call(ctx, ret.value);
      // 转换成 promise 之后继续调用 onFulfilled, onRejected
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
      // 如果转换出来不是 Promise 说明传了 co 不支持的类型，需要向生成器抛出错误
      return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
    }
  });
}
// 有 then 函数就视为 promise
function isPromise(obj) {
  return 'function' == typeof obj.then;
}
```

##### Eg. 1.2: yield Promise 数组

###### 使用方法

另外 `co` 还支持传入数组，表现类似 [`Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)，[这里](https://codereview.stackexchange.com/a/134230)有 `Promise.all` 的实现方法。

```js
co(function * () {
  // resolve multiple promises in parallel
  const a = Promise.resolve(1)
  const b = Promise.resolve(2)
  const c = Promise.resolve(3)
  const res = yield [a, b, c]
  return res
}).then(value => {
  expect(value).toEqual([1, 2, 3])
})
```

会发现上面的代码等价于：

```js
const a = Promise.resolve(1)
const b = Promise.resolve(2)
const c = Promise.resolve(3)
Promise.all([a, b, c]).then(value => {
  expect(value).toEqual([1, 2, 3])
})
```

###### `co` 实现代码

其实主要体现在 `co` 对 yield 出来的值应用 `toPromise` 变换的方法，代码如下：

```js
function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  // 这里调用了 arrayToPromise
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}
// 发现内部就是用的 Promise.all，对于数组中每个元素，递归调用 toPromise，这个递归太秀了，这样就可以很好地支持数组、对象的嵌套了，以后可以借鉴
function arrayToPromise(obj) {
  return Promise.all(obj.map(toPromise, this));
}
```

##### Eg. 1.3: 错误处理

###### 使用方法

`Promise` 的错误也是直接抛给了 generator function 自己。

```js
co(function * () {
  try {
    yield Promise.reject(new Error('boom'))
  } catch (err) {
    expect(err.message).toEqual('boom')
  }
})
```

这一点跟 async/await 的 try-catch 语法基本上是一样的：

```js
try {
  await Promise.reject(new Error('boom'))
} catch (err) {
  expect(err.message).toEqual('boom')
}
```

###### `co` 实现代码

其实这个的实现就体现在调用 `gen.throw` 的那些地方：

```js
function onRejected(err) {
  var ret;
  try {
    // onRejected 封装了 gen.throw
    ret = gen.throw(err);
  } catch (e) {
    return reject(e);
  }
  next(ret);
}
function next(ret) {
    // ...
    // 如果 yield 出来的 promise reject 了的话，调用 onRejected
    if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
    // yield 出来的类型不对也调用 onRejected
    return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
}
```

##### Eg. 1.4: 对象处理

###### 使用方法

对一个对象的所有 values 都是 Promise 的情况，能够异步执行，最终返回一个 values 都是 Promise resolve 之后的值。

```js
co(function * () {
  const res = yield {
    1: Promise.resolve(1),
    2: Promise.resolve(2)
  }
  return res
}).then(res => {
  expect(res).toEqual({ 1: 1, 2: 2 })
})
```

这个用 `Promise.all` 和 `Object.fromEntries` 也很容易实现:

```js
const obj = {
  1: Promise.resolve(1),
  2: Promise.resolve(2)
}
// 这里利用了 Object.keys 和 Object.values 顺序保持一致的特性: https://stackoverflow.com/a/52706191/8242705
const tmp = await Promise.all(Object.values(obj))
const res = Object.fromEntries(Object.keys(obj).map((key, idx) => [key, tmp[idx]]))
expect(res).toEqual({ 1: 1, 2: 2 })
```

###### `co` 实现代码

和传数组类似，代码主要体现在 `toPromise` 如何处理对象类型的数据。他这里没有使用我上面的方法，而还是用了 `Object.keys` 和 `Promise.all` 以及闭包结合来实现。

```js
function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  // 这里调用 objectToPromise
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}
function objectToPromise(obj){
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  // 按 keys 顺序存成一个 promises 数组，后续传给 Promise.all 异步执行
  var promises = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    // 这里又是对 obj[key] 递归调用 toPromise 来转换为 Promise，值得借鉴
    var promise = toPromise.call(this, obj[key]);
    // 如果是一个 Promise，等其 resolve 之后将结果放入 results 对象
    if (promise && isPromise(promise)) defer(promise, key);
    // 否则直接放入 results 对象
    else results[key] = obj[key];
  }
  return Promise.all(promises).then(function () {
    return results;
  });

  // 等 promise resolve 之后将其结果放入 results[key] 中
  function defer(promise, key) {
    // predefine the key in the result
    results[key] = undefined;
    promises.push(promise.then(function (res) {
      results[key] = res;
    }));
  }
}
```

#### Eg.2: `co.wrap(*gen)`

`co.wrap` 就是 `co` 本身的一层简单封装，不像 `co` 那样直接把参数传给 generator function 了，而是拿到一个函数可以多次执行，每次执行的时候再传参，其实就是简单地柯里化一下。

```js
const fn = co.wrap(function * (val) {
  return yield Promise.resolve(val)
})

fn(true).then(function (val) {
  expect(val).toEqual(true)
})
```

一个 `async` 函数本身就可以被以不同的参数调用多次，所以 `wrap` 应该不需要 `async` 下的等价形式。

```ts
const fn = async (val): Promise<any> => {
  return await Promise.resolve(val)
}
fn(true).then(function (val) {
  expect(val).toEqual(true)
})
```

下面是他的实现源码，非常简单，常规的柯里化操作，返回一个函数，每次调用这个函数都相当于用一次 `co(fn, arguments)`：

```js
co.wrap = function (fn) {
  return createPromise() {
    return co.call(this, fn.apply(this, arguments));
  }
};
```

## 总结

传统的基于回调函数的异步模式写起来很不好，容易造成回调地狱，`co` 相当于一种语法糖，并且如作者所说，「It is a stepping stone towards the [async/await proposal](https://github.com/lukehoban/ecmascript-asyncawait).」。`co` 利用 generator function 中的 `yield` 和 `next` 可以让异步代码编写起来非常自然，当如今 `Promise` 和 `async/await` 加入 ES 新标准多年，都已经非常成熟了，`co` 也就逐渐不怎么需要了，但是我们从中可以看到 `async/await` 其实是可以用 generator function 来做 polyfill 的。

`co` 里面最主要的工具函数主要是递归的实现 `toPromise`，对嵌套对象可以进行递归转换，以后有需要可以借鉴。

所有的测试用例和代码均放在 https://github.com/upupming/koa-analysis ，可以 clone 下来看看 [co.spec.ts](test/co.spec.ts) 和 [co.type.spec.d.ts](test/co.type.spec.d.ts)，原文链接在: https://github.com/upupming/koa-analysis/tree/master/co-analysis/README.md
