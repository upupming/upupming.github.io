---
title: 用 Flexbox 实现简单的 CSS Grid 布局
date: 2020-07-22 22:03:49
tags:
- frontend
- css
categories:
- 前端
- CSS
---

在实际的开发过程中遇到这样的问题：在一个父元素中有很多子元素，希望这些子元素按行展示，每一行 2 （或者 n）个，还要求每一行的两个子元素之间有固定的间距。这种时候最简单的实现方式就是 grid，但是由于兼容性问题，本文介绍了一种只使用 flex 的实现。具体效果如下图所示：

![Grid 布局，每行元素间固定间距](https://picgo-1256492673.cos.ap-chengdu.myqcloud.com/20200722225001.png)

<!-- more -->

## Grid 实现

使用 grid 进行实现主要是使用了 `grid-template-columns` 和 `gap` 两个属性。

<p class="codepen" data-height="462" data-theme-id="light" data-default-tab="css,result" data-user="upupming" data-slug-hash="dyGadZm" style="height: 462px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="grid实现">
  <span>See the Pen <a href="https://codepen.io/upupming/pen/dyGadZm">
  grid实现</a> by Li Yiming (<a href="https://codepen.io/upupming">@upupming</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

Windows XP 上能安装的 Chrome 的最高版本是 49，根据 [caniuse](https://caniuse.com/) 的数据，Chrome 49 是不支持 `grid-template-columns` 和 `gap` 的。这样我们只能另找其他办法来实现，很容易就想到了 grid 的亲兄弟 flex。

## Flexbox 实现

用 Flexbox 实现，对于父元素主要用到的是 `flex-wrap`，容纳不下的时候就换行。对于子元素主要用到的是 `flex-basis`、`flex-grow` 两个属性，`flex-basis` 将基础宽度先定为一个百分比，使得每行只能容纳两个元素，然后再利用 `flex-grow` 使每行的两个元素均匀地占满一行。

<p class="codepen" data-height="637" data-theme-id="light" data-default-tab="css,result" data-user="upupming" data-slug-hash="YzwBexL" style="height: 637px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;" data-pen-title="flexbox实现">
  <span>See the Pen <a href="https://codepen.io/upupming/pen/YzwBexL">
  flexbox实现</a> by Li Yiming (<a href="https://codepen.io/upupming">@upupming</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

注：其实使用 [`calc`](https://www.w3schools.com/cssref/func_calc.asp) 可以明确地规定每个元素的宽度为 `calc(50% - 12px)`，这样也就不需要使用 flex 属性了。然后每一行第 1 个元素加右 margin，第二个元素加左 margin，也是可以的，但是 `calc` 这种计算函数个人不是特别倾向于去使用，因为可能会造成 postcss 的 px2rem 失效。
