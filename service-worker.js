/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

// DO NOT EDIT THIS GENERATED OUTPUT DIRECTLY!
// This file should be overwritten as part of your build process.
// If you need to extend the behavior of the generated service worker, the best approach is to write
// additional code and include it using the importScripts option:
//   https://github.com/GoogleChrome/sw-precache#importscripts-arraystring
//
// Alternatively, it's possible to make changes to the underlying template file and then use that as the
// new base for generating output, via the templateFilePath option:
//   https://github.com/GoogleChrome/sw-precache#templatefilepath-string
//
// If you go that route, make sure that whenever you update your sw-precache dependency, you reconcile any
// changes made to this original template file with your modified copy.

// This generated service worker JavaScript will precache your site's resources.
// The code needs to be saved in a .js file at the top-level of your site, and registered
// from your pages in order to be used. See
// https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js
// for an example of how you can register this script and handle various service worker events.

/* eslint-env worker, serviceworker */
/* eslint-disable indent, no-unused-vars, no-multiple-empty-lines, max-nested-callbacks, space-before-function-paren, quotes, comma-spacing */
'use strict';

var precacheConfig = [["/2018/02/28/build-hexo/Force-HTTPS.png","b117ab9b09cb99f20605ffc3230c0d92"],["/2018/02/28/build-hexo/OAuth-App.png","88bf31ef5f24225bc0cc86e41ab67eed"],["/2018/02/28/build-hexo/SSL-Full.png","b26cbcceab3ff4ebc906615094287c6f"],["/2018/02/28/build-hexo/index.html","85950f1a2895abff374855675bb21944"],["/2018/03/05/blurring-disciplinary-boundaries/index.html","2672e7b83f9648579fd5ded0988d80ff"],["/2018/03/12/the-nature-of-research/focs_1.jpg","7d80f43f9512d373c8177ac356471aef"],["/2018/03/12/the-nature-of-research/focs_hdr.jpg","b1ed57c3501ad4c27e2e7e1c82010901"],["/2018/03/12/the-nature-of-research/index.html","ff18992f6f61b61f01235729aaba64a9"],["/2018/03/26/java-equals-type-safety/index.html","552c3063af44b746c2812581feb9e3df"],["/2018/03/26/java-equals-type-safety/java.png","7b7786621d805ee5e9d27d89fe8fce68"],["/2018/04/03/gradle-travis/Gradle-Project-Builder.png","eb139a2cf539553f18c58d2099c8a3e9"],["/2018/04/03/gradle-travis/index.html","4af9387216c1c9f470b9f72f1f7e4378"],["/2018/04/03/gradle-travis/install-buildship.png","ce33be56b7eb2354993e8fd0d53bc2ae"],["/2018/04/03/gradle-travis/java-builders.png","c788501725500bfb7b19fde03d97e35f"],["/2018/04/03/gradle-travis/java-to-gradle.png","14406b6603c2d9b32efeb3d01604c77a"],["/2018/04/03/gradle-travis/new-java-project.png","135720a9992b1c25b3783402c031c189"],["/2018/04/03/gradle-travis/refresh-dependency.png","e80d2bf0923ae5ba08b6904caacf3f4f"],["/2018/04/08/beautify-hexo-SEO-travis/@-dns.png","972b600a70753365aa1bd5ce08fcc1ad"],["/2018/04/08/beautify-hexo-SEO-travis/A-records.png","9c7d788dfa6714f93383180324a23de4"],["/2018/04/08/beautify-hexo-SEO-travis/GitHub-System-Status-2015.png","a40b5417665b61169137b8b1079ca4c6"],["/2018/04/08/beautify-hexo-SEO-travis/add-to-home.png","687245515353b90326b38e9b317b2bb8"],["/2018/04/08/beautify-hexo-SEO-travis/android-chrome.jpg","c25b9cc7bed975d182d5d4a639de13d0"],["/2018/04/08/beautify-hexo-SEO-travis/android-pwa.jpg","6edb7ac72d1173cc0e8a77c22ca24e08"],["/2018/04/08/beautify-hexo-SEO-travis/baidu-100.png","0b4705b1de07f95d0fca471519051251"],["/2018/04/08/beautify-hexo-SEO-travis/baidu-ok.png","f9d754ff0fc1bfce07e77096101729e5"],["/2018/04/08/beautify-hexo-SEO-travis/baidusitemap-ok.png","5758e3299f089100923c90934a71137d"],["/2018/04/08/beautify-hexo-SEO-travis/blog-dns.png","ab2072d9439cafd5ac36d73f96bc72ed"],["/2018/04/08/beautify-hexo-SEO-travis/chrome-app.png","aeb5d6be4c7d37a0a58644ebc02220f9"],["/2018/04/08/beautify-hexo-SEO-travis/cloudflare-cache.png","42488dab5560be8bb3b7b6d47883024f"],["/2018/04/08/beautify-hexo-SEO-travis/custom-fav.png","ffc1b2d00d043ec5a16cfc01a35e7afb"],["/2018/04/08/beautify-hexo-SEO-travis/fav-checker.png","8ca2616c4533588d863d0eaf1555d777"],["/2018/04/08/beautify-hexo-SEO-travis/git-page-ci.png","03d2da3d44a3369335119983e4084929"],["/2018/04/08/beautify-hexo-SEO-travis/gitlab-succeed.png","a34eb667e7ba8d2afcda9a7577f8221b"],["/2018/04/08/beautify-hexo-SEO-travis/gitlab-token.png","6694325a815cca433f5e46cbe7873148"],["/2018/04/08/beautify-hexo-SEO-travis/index.html","5a370b2dfd218ac6d69b8383d0616ebd"],["/2018/04/08/beautify-hexo-SEO-travis/remove-fork.png","a11b851da8d559698f3c4cc39cc192f1"],["/2018/04/08/beautify-hexo-SEO-travis/travis-setting.png","69cdd2405cbb8448b1c4bc9fdaf50c75"],["/2018/04/08/beautify-hexo-SEO-travis/youpai-CNAME.png","f836935cf27651e2d6ed55b5ce41b716"],["/2018/04/08/beautify-hexo-SEO-travis/youpai-config.png","eeab7bafb97030c8760b31bf098aab3d"],["/2018/05/07/java-try-catch-examples/finally_block_does_not_complete_normally.png","b52c2d31e9f87824e1ab51ec7c8f1e4d"],["/2018/05/07/java-try-catch-examples/index.html","d5c97dcbbb69090ead8fea90acc418b0"],["/2018/05/10/cloudflare-subdomain-SSL/index.html","f9a22a33ea817190673d7b68023afe59"],["/2018/05/10/cloudflare-subdomain-SSL/subdomain-not-covered.png","012c7dc4a027c87b2b3c7285adbbea2f"],["/2018/05/31/git-submodules/fixed.png","f7d5f9cb6d0a144ae969953744929382"],["/2018/05/31/git-submodules/index.html","90927b4f31805e1d6a112984279cff50"],["/2018/05/31/git-submodules/submodule-cannot-be-opened.png","8f7c6c5e0e4f6046dbd77a0c426c2684"],["/2018/06/04/java-UML/aggregation.png","70d82a028d5399faef00a9dab2a33c63"],["/2018/06/04/java-UML/association.png","d0533026f4dca5017bc5eaa9b4bdace0"],["/2018/06/04/java-UML/composition.png","0d7bc27cbf54f428dacd1d7b3658d3cc"],["/2018/06/04/java-UML/customer_account.png","1b22a73987a8db4b302ba8113384097b"],["/2018/06/04/java-UML/dependency.png","b5f5840a75022ab2f524e1422ae6e307"],["/2018/06/04/java-UML/example_class.png","2355fbbbfbd76ef39fe77e34a89c896c"],["/2018/06/04/java-UML/example_class.svg","617dbf6f1aaf9bc63350c3ff66657ca3"],["/2018/06/04/java-UML/generalization.png","63c292f482f1ae8487cbcf90ca512c66"],["/2018/06/04/java-UML/index.html","9e1ca0541306dcb3b89bb9b1f5dba1ec"],["/2018/06/04/java-UML/note.png","39b15572714471a0ef712373340d3bd2"],["/2018/06/04/java-UML/player_achievement.png","53c148a855d604c5d8caec40ede9d459"],["/2018/06/04/java-UML/realization.png","7df2a41166fc024fa1555d0df15e2a0f"],["/2018/06/14/6.031-concurrency/index.html","a20678c29b789683e769b0e1fba86f74"],["/2018/06/14/6.031-concurrency/message-passing-bank-account.png","7fcc578cc783d010176f77517cffe612"],["/2018/06/14/6.031-concurrency/message-passing-race-condition.png","e2dc8158b035c356025caf8160645aba"],["/2018/06/14/6.031-concurrency/message-passing.png","fb0b4ab0f90e1926a7667ab98aa741d8"],["/2018/06/14/6.031-concurrency/shared-memory-bank-account.png","29480f47a80fd8fe08acc25c16f78030"],["/2018/06/14/6.031-concurrency/shared-memory.png","f813c55964fe062ce196d502a26419f9"],["/2018/06/14/6.031-concurrency/time-slicing.png","cfbf984b2ca815614b659f8e140ee468"],["/2018/06/14/6.031-thread-safety/clear-insert-race.png","5a845868d7dcef3cc7909fd5024dd6fe"],["/2018/06/14/6.031-thread-safety/confinement-0.png","94c713f1d8eec893767e52dad8e938cb"],["/2018/06/14/6.031-thread-safety/confinement-1.png","df38df866b0a01612ebe966180228bf2"],["/2018/06/14/6.031-thread-safety/confinement-2.png","9ac121a6b286b4a150c4385e6d032f4f"],["/2018/06/14/6.031-thread-safety/confinement-3.png","23d2f6a68fbd2bab61f4036443de776c"],["/2018/06/14/6.031-thread-safety/confinement-4.png","52aca0823a6cb776293b20f806216e6b"],["/2018/06/14/6.031-thread-safety/index.html","3176ab8f794b65fc104e82c44336a465"],["/2018/06/14/6.031-thread-safety/insert-followed-by-clear.png","eb7d9e4b748c4c5ce691645d031e0b71"],["/2018/06/15/6.031-locks-and-synchronization/deadlock.png","7308e875713487bee9b5c02aaebaa948"],["/2018/06/15/6.031-locks-and-synchronization/index.html","55229578855ef05115e62c094252b6da"],["/2018/06/15/6.031-locks-and-synchronization/locks-bank-account.png","17948c051fe5b7f47e23b865c3196f3f"],["/2018/06/15/6.031-locks-and-synchronization/shared-memory-bank-account.png","4bdb2a1931a66d89626697757f86cae0"],["/2018/06/18/java-design-patterns-1/added-adapter.png","d21f561db8a64b66b74f97f0e4c0b4ed"],["/2018/06/18/java-design-patterns-1/before-change.png","6ec835bf52e98a49c2500540cb7d7f13"],["/2018/06/18/java-design-patterns-1/change-incompatible.png","ebe4fc5c5578503b7442099eb0776aed"],["/2018/06/18/java-design-patterns-1/decorator-uml.png","f9d2a69b3f82d4b9d3407772d5088418"],["/2018/06/18/java-design-patterns-1/facade-uml.png","4b4c70662eac01f6c086e3f103c7bf2b"],["/2018/06/18/java-design-patterns-1/index.html","275011e99b390a569c69c59ac3a07dae"],["/2018/06/18/java-design-patterns-1/iterator-uml.png","42d36a5af9eb4fc85d0c8dbc8cd616d5"],["/2018/06/18/java-design-patterns-1/list-of-patterns.png","097cd8513af0d4454f58eda9fce0c47a"],["/2018/06/18/java-design-patterns-1/template-uml.png","59ae856512d4c2ec30baf4443aa8a7f7"],["/2018/06/19/java-design-patterns-2/abstract-factory-uml.png","ba06f3a3122eba79b5506857a717b64f"],["/2018/06/19/java-design-patterns-2/after-mediator.png","01438356c03a92697a31b817eefa2f87"],["/2018/06/19/java-design-patterns-2/before-mediator.png","599363d74ccf7f0e54cf314e0a462607"],["/2018/06/19/java-design-patterns-2/bridge-car-uml.png","d1492de3cd9c2c77fa266a173531d631"],["/2018/06/19/java-design-patterns-2/bridge-uml.png","b845aacceddcb9c9f297e93d6fabe7d4"],["/2018/06/19/java-design-patterns-2/bridge.png","d7223b32682562843655bb45b302b97a"],["/2018/06/19/java-design-patterns-2/builder-uml.png","35cc6e2689e4636c063a50c22a39fd54"],["/2018/06/19/java-design-patterns-2/chain-of-responsibility-uml.png","acf73cc8df228cac9702bda86501ca35"],["/2018/06/19/java-design-patterns-2/command-uml.png","d9a8fb8a47154f3085f0cca2f4428014"],["/2018/06/19/java-design-patterns-2/composite-and-leaf.png","96b0993048fb93d5aa118885ba6dbd03"],["/2018/06/19/java-design-patterns-2/composite-uml.png","f213e90e18f8ebc4c6913600892b43d0"],["/2018/06/19/java-design-patterns-2/creational-patterns.png","7f75cc9e16b88643d1237475acf23551"],["/2018/06/19/java-design-patterns-2/factory-method-uml.png","b6d2d146ac5a6f89898a91896f9f9b43"],["/2018/06/19/java-design-patterns-2/index.html","58fa3fba40e5248532187f005bd2afa9"],["/2018/06/19/java-design-patterns-2/mediator-uml.png","52055a78b7652840e56db5be5fb11911"],["/2018/06/19/java-design-patterns-2/observer-impl-uml.png","8083ad6d02b2469fc0a4c6ff888d341b"],["/2018/06/19/java-design-patterns-2/observer-uml.png","ec992bf95b9d43cd6994f5f84fa2aeb6"],["/2018/06/19/java-design-patterns-2/proxy-uml.png","a08398e48288a10157ae42fbb05780a8"],["/2018/06/19/java-design-patterns-2/strategy.png","33402dd0ef8e7b3a5388564e7c755f57"],["/2018/06/19/java-design-patterns-2/visitor-uml.png","226dfc1e1df53145bd9fe0aac3c98ba9"],["/2018/06/22/abstraction-functions-and-rep-invariants/index.html","095ddffb6ec3cb73b6cdcfa863926521"],["/2018/06/22/multi-dimensional-software-views/ci.png","ec3b969ae786f36674ddbf1e2dc80542"],["/2018/06/22/multi-dimensional-software-views/component-diagram.png","3e649405c2658744e8254f1153cdacac"],["/2018/06/22/multi-dimensional-software-views/deployment-diagram.png","9fe6b4a49de4f1e52cf60151551fcd50"],["/2018/06/22/multi-dimensional-software-views/github-diff.png","7d1b65d5d7d1f2c2a494b292f4c2a53c"],["/2018/06/22/multi-dimensional-software-views/index.html","e7844f2d0f7f2c78145f89154681d78e"],["/2018/06/22/multi-dimensional-software-views/node-files.png","a2a49436dcf5f9b19c73cf70ab6ac7d3"],["/2018/06/22/multi-dimensional-software-views/proxy-uml.png","a08398e48288a10157ae42fbb05780a8"],["/2018/06/22/multi-dimensional-software-views/snapshot.png","371bf906da587c6091fd46e12d6f5620"],["/2018/06/27/information-security-intro-review/index.html","f165f30572886f86cb20c8ca4b152e3b"],["/2018/06/27/information-security-intro-review/snort.png","186c60f13f89c822c60babbdbbd94c3d"],["/2018/06/27/information-security-intro-review/windows-network-authentication.jpg","9c5a45f1e4bc38ac827515ef684e4c1c"],["/2018/07/23/mini-program-i18n/index.gif","9c2e2c8dd3e0297b162dbc8ed204b4f5"],["/2018/07/23/mini-program-i18n/index.html","a910dd6fae2bca52b796a958cb0ae0dd"],["/2018/07/23/mini-program-i18n/tabbar-and-title.gif","d5e447689ab2080a07e44002d997d981"],["/2018/07/23/mini-program-i18n/work.gif","109ccb616e4119300001e0dbf1487d1f"],["/2018/09/11/mini-program-developing/first-commit.png","577882f3a13b086560055c6776b50b22"],["/2018/09/11/mini-program-developing/index.html","678c8e9a606e04e09a4cdd1c07990046"],["/2018/10/18/katex-test/index.html","8d0d82052cdba07c437728e79e7b79de"],["/2018/10/27/logistic-regression/images/equation-30.png","d89ad2d934b8cfeeb5a2a24bcdca119d"],["/2018/10/27/logistic-regression/images/gradient-ascent-20-0.0.png","a9bf5202fdab6db40fb1f846e708c835"],["/2018/10/27/logistic-regression/images/gradient-ascent-20-1.2.png","48236c6c19237c84bf25411ded7713d9"],["/2018/10/27/logistic-regression/images/gradient-ascent-200-0.0.png","48fe7d4ff10f3caca6cfa6bbe664ed24"],["/2018/10/27/logistic-regression/images/gradient-ascent-200-1.2.png","e7b6ae94c824d4c66ba8e21d991387f1"],["/2018/10/27/logistic-regression/images/newton-method-20-0.0.png","6f90aa5b85bfa75c46b59083967708f2"],["/2018/10/27/logistic-regression/images/newton-method-20-1.2.png","453ef32983893193ae77dacf2d437d13"],["/2018/10/27/logistic-regression/images/newton-method-200-0.0.png","f49dba14d93fa79db969b70d7df270a9"],["/2018/10/27/logistic-regression/images/newton-method-200-1.2.png","21bc04da5200301259c0aaabe99a969b"],["/2018/10/27/logistic-regression/images/newton-method-400-0.0.png","fdfd507a9be640f8eb41ed0f11746b63"],["/2018/10/27/logistic-regression/images/newton-method-400-1.2.png","026a9db972bd480b017130d568ade58f"],["/2018/10/27/logistic-regression/images/newton-method-42-0.0.png","7335f3d1adc3fe8ea9549aa77c5d49ef"],["/2018/10/27/logistic-regression/index.html","5b3cbf9e48fbaa4d37302bcd43e34ccc"],["/2018/12/27/fourier-transform/index.html","a59736752f17ce8d1e9a8835e42a5c81"],["/2018/12/31/eigenvalues-and-eigenvectors/index.html","e8d47838ccdb573215da8d7f994127ed"],["/2019/01/01/determinant/index.html","2e861aa8e71eaa2a35308c52c254ba01"],["/2019/01/05/probability-basis/index.html","3c6341cfc2104a200579aa2674602cde"],["/2019/03/20/inequality-in-randomized-algorithm/index.html","1807efbe1c4b01d74e57978c735457b3"],["/2019/03/20/las-vegas-monte-carlo-yao-etc/index.html","a62308d47d1ce8e3964e5eb7be662979"],["/2019/03/30/arithmetic-coding/index.html","10d819d5fe4c3169b2d493aae35b23c7"],["/2019/04/30/chernoff-bound-and-martingle/index.html","21ef15a7c363c5fa3f48375bc1881c9d"],["/2019/05/04/randomized-algorithm-ex2/index.html","0325c940c66f891d7a1ea064b91980c8"],["/2019/05/09/git-ssh-socks-proxy/index.html","eb6fbf3538721263fa88675d4207ac97"],["/2019/05/18/hit-compilers-exam-2019/index.html","7d2242c381cb0d404b01da7c3dd0b9e2"],["/2019/06/17/weibo-emoji-dataset/index.html","e0bc7d474d0fa9dd46082253ac23f480"],["/2019/06/23/info-hide/index.html","95d206d9d662dfedb69bb50c82146932"],["/2019/06/29/random-algorithm-review/index.html","9c3f6667d7f991c8bdd7c692e7f5760f"],["/2019/11/12/front-end-interview-preparation/index.html","3f19a0f31fb51fb6cd6c8bf54e4b2242"],["/2020/06/19/kick-start-2020-round-a/index.html","8991adb982aca7469aa2cb65f7ce0df0"],["/2020/06/24/kick-start-2020-round-b/index.html","016554b0ae922ac1021557f2cfffa692"],["/2020/07/22/implement-css-grid-using-grid/index.html","b9c4ff174165c7c8593e073f49e3c472"],["/2021/03/18/kick-start-2020-round-g/index.html","72d5d1b11815370fc5bef476ac301f92"],["/2021/03/19/kick-start-2020-round-e/index.html","8823156985adc6a1819f49a88bd155be"],["/2021/03/21/kick-start-2021-round-a/index.html","5d6d6f603268248a48e0b9f07014f61f"],["/2021/04/03/vcpkg-best-practice/index.html","64aef080f28b4453c63478bc21861f31"],["/2021/05/11/kick-start-2021-round-b/index.html","111799be116dbbaf660611cb70dadd6b"],["/2021/06/05/kick-start-2021-round-c/index.html","0fcc7c48efdc023759a6427c15fa99ef"],["/2021/08/29/co-analysis/index.html","ef9680989788a73b32ed516c2efbe2f4"],["/2021/08/29/vue-release/index.html","08d6d10bebce8fee681a2b1f6adde889"],["/2021/10/11/create-vue-learning/index.html","1c0332f439b5c8a37123ae39d64812ac"],["/2022/03/25/typescript-getting-started/index.html","fb4eff1b810b5717a25d9f47ab87a0e2"],["/2023/05/21/bundler-ssr/index.html","3f9c8ca0f07e003e6c923aa1f3df1c96"],["/2024/02/25/ssr-introduction/index.html","c6afacc53127f43facf25c75f26c4f4c"],["/404.html","33aed18af2328befc547732db2d0b39a"],["/about/index.html","269fbcf561ffd901667b5f721b891228"],["/apple-touch-icon.png","492fcef54e344440dde254d6b9be38d9"],["/archives/2018/02/index.html","435877fa2e7913cc2e4d50afad6a2671"],["/archives/2018/03/index.html","994a760085b37844c9d869d7ab924ede"],["/archives/2018/04/index.html","b20c61b3af6289c9c8ade1b0dae2f496"],["/archives/2018/05/index.html","5563fc368ad0524efe51b21af3c15b82"],["/archives/2018/06/index.html","5c44ccb046c0deb271b69768be955efb"],["/archives/2018/07/index.html","77a6725486612262d535c91f38dd12ec"],["/archives/2018/09/index.html","2bcec0bdd58b79933ed6f2a42b38e09c"],["/archives/2018/10/index.html","f38d22f2b8504537c18055d6d4d2055f"],["/archives/2018/12/index.html","19ea43a72dc6f8048f753906b123b36e"],["/archives/2018/index.html","8287645f585cc6f03bed8ba15944645c"],["/archives/2019/01/index.html","d96f91e17094cfaba256d457b998b72d"],["/archives/2019/03/index.html","aedf992a8129cb6145a72d1ff8584716"],["/archives/2019/04/index.html","c1bd98bb016cd515b04d94492b6d0000"],["/archives/2019/05/index.html","f4aeb816c1b37d98cce43d93ac239165"],["/archives/2019/06/index.html","e2bd292794722d172e22361de34b83bb"],["/archives/2019/11/index.html","50c33b6f7758894dd15b53fabc8cddcf"],["/archives/2019/index.html","8f1e9ee7015165018a055addd182cf1c"],["/archives/2020/06/index.html","5dd33034761b5f3dd780c0ba5a3838fa"],["/archives/2020/07/index.html","a69fa1764c17e0f3e1804b4bf9710f53"],["/archives/2020/index.html","9006da63f138d5f90011dd466158bfa1"],["/archives/2021/03/index.html","3a0caa369747edab70e8386984964bd8"],["/archives/2021/04/index.html","94cb1ac646333ab0cfe9bcc8e8e7705e"],["/archives/2021/05/index.html","3d2947960220ad023bc89bc2801534ff"],["/archives/2021/06/index.html","10e5e8b4152f821e0351c70c124d6d3e"],["/archives/2021/08/index.html","5dadfbfd725c891ff5aa627cba509a79"],["/archives/2021/10/index.html","fe4e2e50dffcbce2a1b99d8eddcc290f"],["/archives/2021/index.html","33fa0506ceef1ff146aa129f7abd164a"],["/archives/2022/03/index.html","6f729b77daa59db92a44d8a28a30e6aa"],["/archives/2022/index.html","0ec2a09aa6494050b582052771369aa2"],["/archives/2023/05/index.html","60e59a7a40955ae39154042d5b50c5c2"],["/archives/2023/index.html","3a2334498782f4f37a4aba417a0baa25"],["/archives/2024/02/index.html","ad57feb41b91d0933aff49cc922c3f8c"],["/archives/2024/index.html","2060f629449f1eb7d1451897f6fb6005"],["/archives/index.html","5f9eae39ec3b75a357bb88c948e2d131"],["/categories/C/index.html","c2c417d5d7c568039895a9806b0912e5"],["/categories/index.html","6252d6daa04f96c6618c22cbeb90a179"],["/categories/信息安全/index.html","0f3a9db99081f8507f9f2e09711b1e47"],["/categories/前端/CSS/index.html","5741cbf0a79357c3f45efbe2b186c2cc"],["/categories/前端/index.html","f798fa5845793084e0e099a71c1d3c68"],["/categories/前端/基础知识/index.html","d60ab7777f4454ae167e0f8181323b08"],["/categories/前端/源码阅读/index.html","f0cc5a2697d1e8769a10b1272b43363f"],["/categories/工具/Git/index.html","c5f9e48697b9465ccc0fb9897ff22221"],["/categories/工具/index.html","2513eec65593fe26c50d34a2c63cb4fa"],["/categories/折腾/Hexo-博客/index.html","52ec1a0f1fbe2df1076e3fcb44841acf"],["/categories/折腾/index.html","b7d55a9461dec7732f690ba5228217bf"],["/categories/数学/index.html","2c4cf353a310f3e7242d5cd9b2e3decf"],["/categories/数学/概率论/index.html","bc5752be565491b125730de0ea3b5c48"],["/categories/机器学习/index.html","c7427719c6766cfbc098a83b1cbd48ef"],["/categories/机器学习/分类算法/index.html","8d9ee9bb6ff751967fb73f0ca38a8339"],["/categories/算法/Kick-Start/index.html","f8d268e906e21ee75c48b4336db1546f"],["/categories/算法/index.html","ce7370e2c6fc18d7dd90c9162697f8b6"],["/categories/算法/信息隐藏/index.html","c7191e71fa58901cf0d5dba35c5c9c53"],["/categories/算法/随机算法/index.html","46ed10de35dbf6d661554e8c4d086b84"],["/categories/编程语言/Java/index.html","2ae168215dfdc2f5d741f095723ce147"],["/categories/编程语言/index.html","a4dda8a5d4964a3126658091d6831ded"],["/categories/编译原理/index.html","97784a865265f6ed9243d4e246b854fe"],["/categories/阅读/English/index.html","a95bf8dc5fe9e0745a7da9aae4b9744c"],["/categories/阅读/index.html","0ffb5ecd7824bcc41dddc6f504354af2"],["/categories/项目/Node-js/index.html","2f294974ec334f1dc110a4c26bdd2491"],["/categories/项目/index.html","d14ef47e083b07c6377ac0e12fa5326c"],["/categories/项目/微信小程序/index.html","f9f2b4da20ea00ff3ca798baaee34857"],["/categories/项目/爬虫/index.html","b6d0f4c3f27bcc69c21970ea39633a3d"],["/css/404.css","b1bb50e1fabe41adcec483f6427fb3aa"],["/css/index.css","e5c40e6dd94aff8a10ddb423b2a74cf8"],["/css/var.css","d41d8cd98f00b204e9800998ecf8427e"],["/favicon-16x16.png","abf82e206a80781533851acbd2b6908e"],["/favicon-32x32.png","e5b33e74e08b71be1a5be38beb08857b"],["/images/icons/icon-128x128.png","fa840cb2190782b027e8ba88de7f6fe8"],["/images/icons/icon-144x144.png","d2fab2789a1fdd7c76ddcbe63bf4343f"],["/images/icons/icon-152x152.png","3ec123f662b0727bf75858bbdc5b6900"],["/images/icons/icon-192x192.png","d314e42cb2cf1a5bb650830ce45ec5cd"],["/images/icons/icon-384x384.png","dc518e1b5a41e1e419ed65554a935b84"],["/images/icons/icon-512x512.png","cf97d70d266466bed324e4253684b92a"],["/images/icons/icon-72x72.png","edb42a0b625279a68c64fbe771b2f286"],["/images/icons/icon-96x96.png","f843ab9b2296c039c74afa456fc0a8ac"],["/img/algolia.svg","fd40b88ac5370a5353a50b8175c1f367"],["/img/avatar.png","6cc4a809d23e3d8946a299ae4ce4e4cd"],["/img/background.png","e7ba4d6737d73fb2d31a122e416f7e2f"],["/index.html","eb1131d4047f0589af4b8908b0e9a0aa"],["/js/copy.js","45aae54bf2e43ac27ecc41eb5e0bacf7"],["/js/fancybox.js","f84d626654b9bbc05720952b3effe062"],["/js/fireworks.js","35933ce61c158ef9c33b5e089fe757ac"],["/js/head.js","347edd99f8e3921b45fa617e839d8182"],["/js/hexo-theme-melody.js","d41d8cd98f00b204e9800998ecf8427e"],["/js/katex.js","d971ba8b8dee1120ef66744b89cfd2b1"],["/js/scroll.js","e2433ba220e56fa03095f6164bac719e"],["/js/search/algolia.js","53160985d32d6fd66d98aa0e05b081ac"],["/js/search/local-search.js","1565b508bd866ed6fbd724a3858af5d8"],["/js/sidebar.js","d24db780974e661198eeb2e45f20a28f"],["/js/third-party/anime.min.js","9b4bbe6deb700e1c3606eab732f5eea5"],["/js/third-party/canvas-ribbon.js","09c181544ddff1db701db02ac30453e0"],["/js/third-party/jquery.fancybox.min.js","3c9fa1c1199cd4f874d855ecb1641335"],["/js/third-party/jquery.min.js","c9f5aeeca3ad37bf2aa006139b935f0a"],["/js/third-party/reveal/head.min.js","aad121203010122e05f1766d92385214"],["/js/third-party/reveal/highlight.min.js","44594243bec43813a16371af8fe7e105"],["/js/third-party/reveal/markdown.min.js","7ec4cef5a7fe3f0bf0eb4dc6d7bca114"],["/js/third-party/reveal/marked.min.js","c2a88705e206d71dc21fdc4445349127"],["/js/third-party/reveal/math.min.js","0a278fee2e57c530ab07f7d2d9ea8d96"],["/js/third-party/reveal/notes.min.js","89a0dfae4d706f9c75b317f686c3aa14"],["/js/third-party/reveal/reveal.min.js","8988419d67efb5fe93e291a357e26ec9"],["/js/third-party/reveal/zoom.min.js","9791f96e63e7d534cba2b67d4bda0419"],["/js/third-party/velocity.min.js","64da069aba987ea0512cf610600a56d1"],["/js/third-party/velocity.ui.min.js","c8ca438424a080620f7b2f4ee4b0fff1"],["/js/transition.js","911db4268f0f6621073afcced9e1bfef"],["/js/utils.js","3ff3423d966a1c351e9867813b3f6d36"],["/mstile-150x150.png","9e5dd32ade6169358a4955253716151d"],["/rss/feed-reader.png","d520b5b074d95c3bc796e007d10087f3"],["/rss/index.html","22d32b0574c14e2ebed7b2d2ed2f1672"],["/rss/partnerapp-description-feedly.png","1fe402e10a68079af3c9131f5f978d3a"],["/safari-pinned-tab.svg","2872f85e12066633bd05d37e59fd75a1"],["/tags/C/index.html","9154416b7683bbc31ed19ed14abfe590"],["/tags/CMake/index.html","f957c647bd5ff75ac2c49bf9f0ba3a4a"],["/tags/Fourier-transform/index.html","eb1d8ac2627b032ce0d92c186656746a"],["/tags/HITMers/index.html","fa470aa3b47cc40fcf0c588c95cca097"],["/tags/Information-hide/index.html","6729e068844971006985744cd519929f"],["/tags/MIT-6-031/index.html","9ba7e91a665b04e8abb477ab969f4dd5"],["/tags/Machine-Learning/index.html","77bc659716990065647ba84a17d6099e"],["/tags/Python/index.html","6500ae395210016c2c5cfde6021012bf"],["/tags/QML/index.html","96140cb9c66094cc8e34958903e2e0f9"],["/tags/Qt/index.html","8c5ed05c7fa198d6709e4d635161b738"],["/tags/Random-computering/index.html","94aee220a6c0878f3bbc69b75a4946c9"],["/tags/UML/index.html","f8143d5d563480a30c82a8a644c8f243"],["/tags/algorithm/index.html","e58d633e1bcbb9d13bc9ccdb6ab225a5"],["/tags/arithmetic-coding/index.html","62c265a3cd27d4c7e22a284f73935a81"],["/tags/automata/index.html","aa97bd0a0083614dc955b29d9bd0403b"],["/tags/compilers/index.html","e7f84eb7a78b1ababf3bb6225c01dded"],["/tags/css/index.html","1d93fd29e24391df742eecef6d04ae43"],["/tags/delegation/index.html","1887521ba454c31d4e8e02d9c430b23b"],["/tags/design-patterns/index.html","53fa3e26946596a3da2689cdea3fc9ab"],["/tags/english/index.html","a371197e844c56c28c9073464d379497"],["/tags/frontend/index.html","e8fc95a0ac042f73fed581ffa5f25374"],["/tags/gfw/index.html","53820b0bd5d794085b5916e5a549dcb4"],["/tags/git/index.html","d1d38c6fc90ab799690c2f6f379b27fa"],["/tags/github/index.html","54dfe4bbb5d72d8cace9e21fdb473552"],["/tags/gitlab/index.html","36506d70318af07cede1ae821c727630"],["/tags/gradle/index.html","e9ad72abee660a978d0cbc3e84e78099"],["/tags/hexo/index.html","d2afbe040ee529d91ad34360db580f89"],["/tags/index.html","3733fcd795f7e75d5f5de3b24c2c0a77"],["/tags/java/index.html","ab19a8ab59829a77160cd69dc323221d"],["/tags/melody/index.html","cb71576b1aa75782100f9968827dbafa"],["/tags/randomized-algorithm/index.html","e37ed33288fbb34e00ed22c473cf5375"],["/tags/research/index.html","8c7316dd3872c36d6c5dc52be3dd292f"],["/tags/socks/index.html","804c7f893a4b22f52318a114c257933c"],["/tags/software-construction/index.html","85a96a6a77d110d1235e9556053e8a7b"],["/tags/travis-ci/index.html","daefd3da17f550c36b5cdd98338c3e32"],["/tags/vcpkg/index.html","21726afda1a8796aaddfc31cb12fe8a7"],["/tags/信息安全/index.html","e848538afa1988f839635e4a8b19d6c4"],["/tags/傅里叶变换/index.html","780e2d7368d3bed078e52de9a804fa0d"],["/tags/微博/index.html","af7658bc78a259f6e485e11467e73c2d"],["/tags/机器学习/index.html","c9b542b7c521ded4e0102aef1b783e33"],["/tags/概率论/index.html","e0def6090af30441296e5dce067743c1"],["/tags/爬虫/index.html","5e4419122394fde0a320004ddaef6fae"],["/tags/特征向量/index.html","475030e72acba334d87cf78bc88593a4"],["/tags/线性代数/index.html","31492b670533d6536e7fb6b55e4a169e"],["/tags/行列式/index.html","42adfa30a75c77067e3e50fd322d6ac0"]];
var cacheName = 'sw-precache-v3--' + (self.registration ? self.registration.scope : '');


var ignoreUrlParametersMatching = [/^utm_/];



var addDirectoryIndex = function(originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
      url.pathname += index;
    }
    return url.toString();
  };

var cleanResponse = function(originalResponse) {
    // If this is not a redirected response, then we don't have to do anything.
    if (!originalResponse.redirected) {
      return Promise.resolve(originalResponse);
    }

    // Firefox 50 and below doesn't support the Response.body stream, so we may
    // need to read the entire body to memory as a Blob.
    var bodyPromise = 'body' in originalResponse ?
      Promise.resolve(originalResponse.body) :
      originalResponse.blob();

    return bodyPromise.then(function(body) {
      // new Response() is happy when passed either a stream or a Blob.
      return new Response(body, {
        headers: originalResponse.headers,
        status: originalResponse.status,
        statusText: originalResponse.statusText
      });
    });
  };

var createCacheKey = function(originalUrl, paramName, paramValue,
                           dontCacheBustUrlsMatching) {
    // Create a new URL object to avoid modifying originalUrl.
    var url = new URL(originalUrl);

    // If dontCacheBustUrlsMatching is not set, or if we don't have a match,
    // then add in the extra cache-busting URL parameter.
    if (!dontCacheBustUrlsMatching ||
        !(url.pathname.match(dontCacheBustUrlsMatching))) {
      url.search += (url.search ? '&' : '') +
        encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
    }

    return url.toString();
  };

var isPathWhitelisted = function(whitelist, absoluteUrlString) {
    // If the whitelist is empty, then consider all URLs to be whitelisted.
    if (whitelist.length === 0) {
      return true;
    }

    // Otherwise compare each path regex to the path of the URL passed in.
    var path = (new URL(absoluteUrlString)).pathname;
    return whitelist.some(function(whitelistedPathRegex) {
      return path.match(whitelistedPathRegex);
    });
  };

var stripIgnoredUrlParameters = function(originalUrl,
    ignoreUrlParametersMatching) {
    var url = new URL(originalUrl);
    // Remove the hash; see https://github.com/GoogleChrome/sw-precache/issues/290
    url.hash = '';

    url.search = url.search.slice(1) // Exclude initial '?'
      .split('&') // Split into an array of 'key=value' strings
      .map(function(kv) {
        return kv.split('='); // Split each 'key=value' string into a [key, value] array
      })
      .filter(function(kv) {
        return ignoreUrlParametersMatching.every(function(ignoredRegex) {
          return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
        });
      })
      .map(function(kv) {
        return kv.join('='); // Join each [key, value] array into a 'key=value' string
      })
      .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

    return url.toString();
  };


var hashParamName = '_sw-precache';
var urlsToCacheKeys = new Map(
  precacheConfig.map(function(item) {
    var relativeUrl = item[0];
    var hash = item[1];
    var absoluteUrl = new URL(relativeUrl, self.location);
    var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, false);
    return [absoluteUrl.toString(), cacheKey];
  })
);

function setOfCachedUrls(cache) {
  return cache.keys().then(function(requests) {
    return requests.map(function(request) {
      return request.url;
    });
  }).then(function(urls) {
    return new Set(urls);
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return setOfCachedUrls(cache).then(function(cachedUrls) {
        return Promise.all(
          Array.from(urlsToCacheKeys.values()).map(function(cacheKey) {
            // If we don't have a key matching url in the cache already, add it.
            if (!cachedUrls.has(cacheKey)) {
              var request = new Request(cacheKey, {credentials: 'same-origin'});
              return fetch(request).then(function(response) {
                // Bail out of installation unless we get back a 200 OK for
                // every request.
                if (!response.ok) {
                  throw new Error('Request for ' + cacheKey + ' returned a ' +
                    'response with status ' + response.status);
                }

                return cleanResponse(response).then(function(responseToCache) {
                  return cache.put(cacheKey, responseToCache);
                });
              });
            }
          })
        );
      });
    }).then(function() {
      
      // Force the SW to transition from installing -> active state
      return self.skipWaiting();
      
    })
  );
});

self.addEventListener('activate', function(event) {
  var setOfExpectedUrls = new Set(urlsToCacheKeys.values());

  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.keys().then(function(existingRequests) {
        return Promise.all(
          existingRequests.map(function(existingRequest) {
            if (!setOfExpectedUrls.has(existingRequest.url)) {
              return cache.delete(existingRequest);
            }
          })
        );
      });
    }).then(function() {
      
      return self.clients.claim();
      
    })
  );
});


self.addEventListener('fetch', function(event) {
  if (event.request.method === 'GET') {
    // Should we call event.respondWith() inside this fetch event handler?
    // This needs to be determined synchronously, which will give other fetch
    // handlers a chance to handle the request if need be.
    var shouldRespond;

    // First, remove all the ignored parameters and hash fragment, and see if we
    // have that URL in our cache. If so, great! shouldRespond will be true.
    var url = stripIgnoredUrlParameters(event.request.url, ignoreUrlParametersMatching);
    shouldRespond = urlsToCacheKeys.has(url);

    // If shouldRespond is false, check again, this time with 'index.html'
    // (or whatever the directoryIndex option is set to) at the end.
    var directoryIndex = 'index.html';
    if (!shouldRespond && directoryIndex) {
      url = addDirectoryIndex(url, directoryIndex);
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond is still false, check to see if this is a navigation
    // request, and if so, whether the URL matches navigateFallbackWhitelist.
    var navigateFallback = '';
    if (!shouldRespond &&
        navigateFallback &&
        (event.request.mode === 'navigate') &&
        isPathWhitelisted([], event.request.url)) {
      url = new URL(navigateFallback, self.location).toString();
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond was set to true at any point, then call
    // event.respondWith(), using the appropriate cache key.
    if (shouldRespond) {
      event.respondWith(
        caches.open(cacheName).then(function(cache) {
          return cache.match(urlsToCacheKeys.get(url)).then(function(response) {
            if (response) {
              return response;
            }
            throw Error('The cached response that was expected is missing.');
          });
        }).catch(function(e) {
          // Fall back to just fetch()ing the request if some unexpected error
          // prevented the cached response from being valid.
          console.warn('Couldn\'t serve response for "%s" from cache: %O', event.request.url, e);
          return fetch(event.request);
        })
      );
    }
  }
});







