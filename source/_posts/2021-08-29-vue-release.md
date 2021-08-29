---
title: Vue 3 发版流程源码分析
date: 2021-08-29 13:43:52
tags:
- frontend
categories:
- 前端
- 源码阅读
---

原文链接: https://github.com/upupming/vue-next-analysis/blob/master/md/release/README-upupming.md

## 准备工作

第一次阅读参与源码共读活动，看了上期的工具函数的总结，学习到很多，感觉跟着若川大哥学下去肯定会收获满满。

这次要阅读的源码在: https://github1s.com/vuejs/vue-next/blob/HEAD/scripts/release.js 。

<!-- more -->

仓库克隆下来，运行 `yarn` 安装好依赖。

在 `package.json` 中有一个 `release` script 用来运行这个文件：

```json
"release": "node scripts/release.js",
```

按照川哥的说明，可以加个 `--dry`（空跑） 参数，不执行测试和编译，不执行 git 推送等操作。

然后就可以直接在 `package.json` 文件的 `scripts` 上方按 Debug 按钮开始调试。

首先运行一遍看看效果：

![2021-08-20](https://i.loli.net/2021/08/20/uLG1rcOtKo5J4CH.png)
![2021-08-20](https://i.loli.net/2021/08/20/wGRuBLor34W9jcN.png)
![2021-08-20](https://i.loli.net/2021/08/20/TrMPWb5ZoGRSIqC.png)

可以看到测试和 build 直接跳过了，commit 和 push 部分都是 `[dryrun]`，说明也是直接跳过了（只打印了一下如果不是 dryrun 会运行啥）。

运行完之后，会发现 `CHANGELOG.md` 加上了自上一个 release 以来所有的 commit （但是 chore 这种用户不关心的 commit 的被忽略掉了）:

![2021-08-20](https://i.loli.net/2021/08/20/6DgLVNRpBhzCnP5.png)

因为整个项目是一个是 monorepo，所有 package 的 `package.json` 中自身的版本号和其依赖的内部包的版本号都被正确更新了：

![2021-08-20](https://i.loli.net/2021/08/20/NB5SFeKwtZk1uME.png)

接下来我们来分析源代码。

## 依赖包

前面几行是脚本依赖的所有包，下面分别详细了解一下。

```js
const args = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const semver = require('semver')
const currentVersion = require('../package.json').version
const { prompt } = require('enquirer')
const execa = require('execa')
```

### minimist

https://www.npmjs.com/package/minimist

主要用来解析命令行参数。

```js
var argv = require('minimist')(process.argv.slice(2));
console.log(argv);
```

```bash
$ node example/parse.js -a beep -b boop
{ _: [], a: 'beep', b: 'boop' }

$ node example/parse.js -x 3 -y 4 -n5 -abc --beep=boop foo bar baz
{ _: [ 'foo', 'bar', 'baz' ],
  x: 3,
  y: 4,
  n: 5,
  a: true,
  b: true,
  c: true,
  beep: 'boop' }
```

可以看到返回值 `argv` 中，`_` 为所有不是 option 的输入组成的数组，而 option 的输入都是用 `argv['option']=value` 的形式保存。

类似的包还有 [yargs](https://www.npmjs.com/package/yargs)

### chalk

https://www.npmjs.com/package/chalk

主要用来给字符串加上颜色修饰。

```js
const chalk = require('chalk');

// 套一个 chalk.blue 打印出来就是蓝色的了
console.log(chalk.blue('Hello world!'));
```

### semver

https://www.npmjs.com/package/semver

[语义化版本（Semantic Versioning）](https://semver.org/)辅助包，有一些版本号的一些判断和处理逻辑。

```js
const semver = require('semver')

semver.valid('1.2.3') // '1.2.3'
semver.valid('a.b.c') // null
semver.clean('  =v1.2.3   ') // '1.2.3'
semver.satisfies('1.2.3', '1.x || >=2.5.0 || 5.0.0 - 7.2.3') // true
semver.gt('1.2.3', '9.8.7') // false
semver.lt('1.2.3', '9.8.7') // true
semver.minVersion('>=1.0.0') // '1.0.0'
// coerce 用来将输入强制转换为 semver 对象
semver.valid(semver.coerce('v2')) // '2.0.0'
semver.valid(semver.coerce('42.6.7.9.3-alpha')) // '42.6.7'
```

### enquirer

https://www.npmjs.com/package/enquirer

主要用来进行命令行的交互式输入。

```js
const { prompt } = require('enquirer');

const response = await prompt({
  type: 'input',
  name: 'username',
  message: 'What is your username?'
});

console.log(response); // { username: 'jonschlinkert' }
```

### execa

https://www.npmjs.com/package/execa

跟 nodejs 自带的 [`child_process`](https://nodejs.org/api/child_process.html) 包功能差不多，但是更加易用。

```js
const execa = require('execa');

(async () => {
    const {stdout} = await execa('echo', ['unicorns']);
    console.log(stdout);
    //=> 'unicorns'
})();
```

### 获取配置信息

```js
const currentVersion = require('../package.json').version
// semver.prerelease('1.2.3-alpha.1') -> ['alpha', 1]
const preId =
  args.preid ||
  (semver.prerelease(currentVersion) && semver.prerelease(currentVersion)[0])
const isDryRun = args.dry
const skipTests = args.skipTests
const skipBuild = args.skipBuild
// 获取所有子 package 的名称，过滤掉 .ts 文件和隐藏文件
const packages = fs
  .readdirSync(path.resolve(__dirname, '../packages'))
  .filter(p => !p.endsWith('.ts') && !p.startsWith('.'))

// 跳过的包，这里写死成了空数组，后面也没有增加，应该没用
const skippedPackages = []

// 后续交互式输入的时候可供选择的升级选项
const versionIncrements = [
  'patch',
  'minor',
  'major',
  ...(preId ? ['prepatch', 'preminor', 'premajor', 'prerelease'] : [])
]

// 下面都是一些辅助函数了
// inc 函数给定发布类型，返回新的版本号
// semver.inc('1.2.3', 'prerelease', 'beta') -> '1.2.4-beta.0'
const inc = i => semver.inc(currentVersion, i, preId)
const bin = name => path.resolve(__dirname, '../node_modules/.bin/' + name)
// 运行任意可执行文件
const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts })
// 空跑：打印一下运行参数，不实际运行
const dryRun = (bin, args, opts = {}) =>
  console.log(chalk.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts)
const runIfNotDry = isDryRun ? dryRun : run
const getPkgRoot = pkg => path.resolve(__dirname, '../packages/' + pkg)
const step = msg => console.log(chalk.cyan(msg))
```

### main 主流程

主流程分为以下步骤：

- 确定要发布的新版本号 `targetVersion`
    - 命令行指定
    - 用户选择 `versionIncrements` 中的一种得到新版本号
    - 用户自行输入
- 运行测试
- 调用 `updateVersions` 函数更新所有子 package 的版本号，以及相互依赖关系
- build 所有 package
- 运行 `yarn changelog` 生成 changelog
- 如果文件有改动，git commit 所有更改
- 对每个 package 分别调用 `publishPackage` 函数进行发布
    - 另外可以注意到项目根目录对应的包不会被发布，而且其 `package.json` 根本也没有 `name` 字段，可以认为它只是一个 monorepo 配置
- 推送到 GitHub

这里调用了两个函数 `updateVersions` 和 `publishPackage`，我们后面可以看看具体逻辑。

```js
async function main() {
  let targetVersion = args._[0]

  if (!targetVersion) {
    // no explicit version, offer suggestions
    const { release } = await prompt({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices: versionIncrements.map(i => `${i} (${inc(i)})`).concat(['custom'])
    })

    if (release === 'custom') {
      targetVersion = (
        await prompt({
          type: 'input',
          name: 'version',
          message: 'Input custom version',
          initial: currentVersion
        })
      ).version
    } else {
      targetVersion = release.match(/\((.*)\)/)[1]
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`)
  }

  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `Releasing v${targetVersion}. Confirm?`
  })

  if (!yes) {
    return
  }

  // run tests before release
  step('\nRunning tests...')
  if (!skipTests && !isDryRun) {
    await run(bin('jest'), ['--clearCache'])
    await run('yarn', ['test', '--bail'])
  } else {
    console.log(`(skipped)`)
  }

  // update all package versions and inter-dependencies
  step('\nUpdating cross dependencies...')
  updateVersions(targetVersion)

  // build all packages with types
  step('\nBuilding all packages...')
  if (!skipBuild && !isDryRun) {
    await run('yarn', ['build', '--release'])
    // test generated dts files
    step('\nVerifying type declarations...')
    await run('yarn', ['test-dts-only'])
  } else {
    console.log(`(skipped)`)
  }

  // generate changelog
  await run(`yarn`, ['changelog'])

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step('\nCommitting changes...')
    await runIfNotDry('git', ['add', '-A'])
    await runIfNotDry('git', ['commit', '-m', `release: v${targetVersion}`])
  } else {
    console.log('No changes to commit.')
  }

  // publish packages
  step('\nPublishing packages...')
  for (const pkg of packages) {
    await publishPackage(pkg, targetVersion, runIfNotDry)
  }

  // push to GitHub
  step('\nPushing to GitHub...')
  await runIfNotDry('git', ['tag', `v${targetVersion}`])
  await runIfNotDry('git', ['push', 'origin', `refs/tags/v${targetVersion}`])
  await runIfNotDry('git', ['push'])

  if (isDryRun) {
    console.log(`\nDry run finished - run git diff to see package changes.`)
  }

  if (skippedPackages.length) {
    console.log(
      chalk.yellow(
        `The following packages are skipped and NOT published:\n- ${skippedPackages.join(
          '\n- '
        )}`
      )
    )
  }
  console.log()
}

main().catch(err => {
  console.error(err)
})
```

### `updateVersions` 函数

`updateVersions` 只接收一个 `version` 参数，因为每一次发布所有 package 的版本号都保持一致，这样简化了处理逻辑，不过即使某个包没有任何更新，也会被更新版本号而发布。

对于根目录和所有的子 package，均使用 `updatePackage` 函数更新 `package.json` 文件，会更新 `version`, `dependencies` 和 `peerDependencies` 字段。

```js
function updateVersions(version) {
  // 1. update root package.json
  updatePackage(path.resolve(__dirname, '..'), version)
  // 2. update all packages
  packages.forEach(p => updatePackage(getPkgRoot(p), version))
}

function updatePackage(pkgRoot, version) {
  const pkgPath = path.resolve(pkgRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.version = version
  updateDeps(pkg, 'dependencies', version)
  updateDeps(pkg, 'peerDependencies', version)
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

function updateDeps(pkg, depType, version) {
  const deps = pkg[depType]
  if (!deps) return
  Object.keys(deps).forEach(dep => {
    if (
      dep === 'vue' ||
      (dep.startsWith('@vue') && packages.includes(dep.replace(/^@vue\//, '')))
    ) {
      console.log(
        chalk.yellow(`${pkg.name} -> ${depType} -> ${dep}@${version}`)
      )
      deps[dep] = version
    }
  })
}
```

### `publishPackage` 函数

`publishPackage` 用来发布单个 package。

现在 `npm i vue` 的时候还是默认安装 vue 2，因为从这里可以看到 vue 3 是用的 `next` 标签来发布的，需要 `npm i vue@next`。

如果报错已经发过同版本号的包，就跳过。

```js
async function publishPackage(pkgName, version, runIfNotDry) {
  if (skippedPackages.includes(pkgName)) {
    return
  }
  const pkgRoot = getPkgRoot(pkgName)
  const pkgPath = path.resolve(pkgRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  if (pkg.private) {
    return
  }

  // For now, all 3.x packages except "vue" can be published as
  // `latest`, whereas "vue" will be published under the "next" tag.
  let releaseTag = null
  if (args.tag) {
    releaseTag = args.tag
  } else if (version.includes('alpha')) {
    releaseTag = 'alpha'
  } else if (version.includes('beta')) {
    releaseTag = 'beta'
  } else if (version.includes('rc')) {
    releaseTag = 'rc'
  } else if (pkgName === 'vue') {
    // TODO remove when 3.x becomes default
    releaseTag = 'next'
  }

  // TODO use inferred release channel after official 3.0 release
  // const releaseTag = semver.prerelease(version)[0] || null

  step(`Publishing ${pkgName}...`)
  try {
    await runIfNotDry(
      'yarn',
      [
        'publish',
        '--new-version',
        version,
        ...(releaseTag ? ['--tag', releaseTag] : []),
        '--access',
        'public'
      ],
      {
        cwd: pkgRoot,
        stdio: 'pipe'
      }
    )
    console.log(chalk.green(`Successfully published ${pkgName}@${version}`))
  } catch (e) {
    if (e.stderr.match(/previously published/)) {
      console.log(chalk.red(`Skipping already published: ${pkgName}`))
    } else {
      throw e
    }
  }
}
```

### 自动生成 GitHub Release

在 git push 之后，根据项目的 [GitHub Action 配置](https://github.com/vuejs/vue-next/blob/4d9b651d82d240b5b521b478bb3aabe6b30e37f5/.github/workflows/release-tag.yml)，还会自动根据 tag 标签生成对应的 release 出来，例如 [release: v3.2.4](https://github.com/vuejs/vue-next/runs/3352769524?check_suite_focus=true) 得到的 GitHub Release 如下：

![2021-08-20](https://i.loli.net/2021/08/20/1XztB2ap3wWuQK9.png)

### 总结

- 感觉代码逻辑非常清晰，善于抽取工具函数，例如 `runIfNotDry`, `getPkgRoot` 这些，可以减少代码量
- 学会了如何使用 `semver` 包自动生成新的版本号，以后尽量不要再手动地取版本号名称了。
- 一个 monorepo 下所有子 package 保持统一版本号，操作起来更加简单
