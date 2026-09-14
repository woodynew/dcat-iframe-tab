# 多语言开发指南

本指南对应 `1.3.0` 起的能力，`1.2.1` 及更早版本不包含多语言文案与缓存处理。iframe 扩展不依赖 Kit，文案跟随 Laravel 当前语言；Kit 只提供可选的语言切换入口和 Session 偏好。

## 文案与语言包

语言包位于 `src/resource/lang/<locale>/iframe.php`，当前维护 `zh_CN`、`zh_TW`、`en`。新增按钮、右键菜单项、工具提示或操作反馈时，为三个语言包添加相同键：

```php
// 例如在 en/iframe.php 中新增
'rename' => 'Rename tab',
```

Blade 使用 `{{ trans('iframe-tab::iframe.rename') }}`。`IframeTabProvider` 通过 `loadTranslationsFrom` 注册 `iframe-tab` 命名空间。应用可在 Laravel 实际语言目录的 `vendor/iframe-tab/<locale>/iframe.php` 覆盖文案；实际根目录以 `app()->langPath()` 为准。

## JavaScript 文案

`src/resource/views/vertical.blade.php` 将当前语言的消息放到 `iframe-tab-i18n` JSON 数据块，并使用 `data-locale` 标记语言。`base.js` 从中读取关闭按钮及操作提示，不应新增写死的中文。

服务端 JSON 使用 `JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT` 编码；属性值通过 Blade 转义，动态按钮标题使用 DOM 属性赋值。新增前端文案时，语言包和 JS 读取逻辑要一起更新。

菜单来源和记录标题仍由宿主应用翻译。iframe 扩展无法自动翻译来自业务代码或数据库的任意文本。

## 切换与缓存

标签缓存保存的是 HTML，其中包含当时的语言文案。`syncLocaleCache()` 对比当前语言与缓存语言标记：首次升级的无标记缓存或其他语言缓存会被清除，同语言刷新沿用原有缓存恢复行为。缓存写入前也会检查语言。

切换语言后应刷新整个同源顶层框架，使导航、右键菜单和 iframe 页面重新生成。当前策略会重置已打开标签并重新打开首个菜单页面；切换前先保存编辑内容。不要只刷新当前 iframe 而保留旧语言的外层菜单。

使用 Kit 时由它完成语言偏好保存和顶层刷新。宿主自己实现切换器时，需在 Session 启动后、后台渲染前设置 Laravel locale；跨域页面需要宿主另行协调，不属于现有同源刷新逻辑。

## 资源更新

开发源文件为 `src/assets/js/base.js`，实际发布文件为 `src/assets/js/compress/base.js`。当前这两个文件使用相同源码，修改时必须同步；无需额外压缩工具：

```bash
cp src/assets/js/base.js src/assets/js/compress/base.js
```

在消费应用内发布：

```bash
php artisan vendor:publish --tag=iframe-tab --force
```

应用若曾覆盖 `resources/views/vendor/iframe-tab/vertical.blade.php`，需手工合并翻译调用和 JSON 数据块，不能仅更新 JS。避免为更新语言功能覆盖整份业务配置。

## 联动测试

在相邻 `dcat-admin-kit` 仓库安装 Composer 和 npm 开发依赖后，从本仓库执行：

```bash
PHP_BINARY=php node ../dcat-admin-kit/node_modules/@playwright/test/cli.js test --config tests/Browser/playwright.config.js
```

`PHP_BINARY` 使用项目兼容的 PHP；本机测试默认使用 Chrome，CI 使用已安装的 Playwright Chromium。Kit 位于其他目录时设置 `KIT_PATH`。测试使用独立页面和临时 Session，不连接 Demo 或业务数据库。

回归覆盖主页面及 iframe 内语言切换、同语言标签恢复、旧语言缓存失效、关闭按钮翻译和 CSRF。宿主应用还应验证真实侧栏、标题、字段及长文案布局；测试页面通过不等同于所有消费项目已验收。
