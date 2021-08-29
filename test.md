# 腾讯面试 2021.08.26

不会的问题有下面:

- CSS 如何让两个 div 高度保持一致，宽度自适应
    - 答的是都用 100%，但哪知用 flex 就行了（默认行为就是高度一致），脑子短路了
    - https://codesandbox.io/s/keen-bird-qb788?file=/index.html
- CSS 如何自动换行
    - https://segmentfault.com/a/1190000017016392
    - https://stackoverflow.com/questions/17259916/difference-between-overflow-wrap-and-word-break

    ![2021-08-26](https://i.loli.net/2021/08/26/unKtaQf9F4dqiB3.png)

- Undefined, Undeclared, Null 区别
    - 听到 Undeclared 懵了，直接说没有听说过
- React 和 Vue 的本质区别
    - 说到了响应式更新的原理，但是不知道 React 是怎么实现的，懵了
    - 参考: https://zhuanlan.zhihu.com/p/100228073#:~:text=%E8%80%8CVue%E6%98%AF%E9%80%9A%E8%BF%87%E4%B8%80,%E7%9A%84%EF%BC%8C%E6%9B%B4%E5%8A%A0%E7%BA%AF%E7%B2%B9%E6%9B%B4%E5%8A%A0%E5%8E%9F%E7%94%9F%E3%80%82
    - 监听数据变化的实现原理不同
        - Vue: getter/setter (Vue 2), proxy (Vue 3)，使用的是可变数据
        - React: 比较引用，强调数据的不可变
    - 数据流
        - Vue: 父子组件 props 单项绑定，组件与 DOM 使用 v-model 双向绑定
        - React: onChange/setState 模式
    - Hoc 和 mixins
        - Vue: 通过 mixin 组合不同功能，无法用 HoC，因为 Vue 创建组件实例的时候做了很多隐式的事情
        - React: 最早也是使用 mixin，但是认为对组件入侵太强会导致很多问题，转向了 HoC。高阶组件本质上就是高阶函数，React 组件是一个纯粹的函数，高阶函数很好写
    - 组件通信
        - Vue: 父子通过 props 传值和回调、通过事件发送消息（倾向于事件而不是回调）、provide/inject 实现数据注入（跨级）
        - React: 父子通过 props 传值和回调、Context 跨级通信  （不支持事件）
    - 模板渲染方式
        - React: JSX（当然最终还是编译成了 JS，也可以直接写 JS），if 直接用原生 JS 就行
        - Vue: 扩展的 HTML 语法，if 需要 v-if 在 HTML 上
    - 渲染过程不同
        - Vue: 更快地计算 Virtual DOM 的差异，渲染中跟踪每一个组件的依赖关系，不需要重新渲染整个组件树
        - React: 状态改变时，全部子组件重新渲染（调用 render 方法）。通过 shouldComponentUpdate 这个生命周期方法可以进行控制，但 Vue 将此视为默认的优化
        - 渲染指的是运行一次 JS 的渲染，最终进行 DOM 操作又有一层优化的，尽量更新少的数据
    - 框架本质
        - Vue: MVVM 框架，由 MVC 发展而来
        - React: 前端组件化框架，有后端组件化发展而来
    - SSR?
    - Vuex 和 Redux 的区别
        - Vuex: `$store` 直接注入到组件内；可以 dispatch 和 commit
        - Redux: 需要调用 `connect` 类似 HoC 的东西；只能 dispatch，不能使用 reducer 进行修改
- 页面渲染流程
    - 懵了，说不就是先加载 HTML 再 CSS, JS 嘛，唉，还是太菜了
    - https://segmentfault.com/a/1190000039691877

策略上失误了，应该主动引导面试官弹我擅长的东西，例如 React 和 Vue 的区别，显然写法上的区别就是一个。
