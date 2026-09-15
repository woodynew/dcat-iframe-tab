# dcat-iframe-tab

## 介绍

这个扩展包基于laravel框架和dcat-admin框架，为解决dcat-admin没有自带兼容iframe架构。使用此扩展包可以构建出一个iframe架构并带有标签页管理的后台框架。

## 功能

支持简中、繁中、英文文案，并在语言变化时清除旧语言标签缓存。开发和接入说明见[多语言开发指南](docs/localization.md)；升级后需要重新发布静态资源（见下方发布命令）。

1. 双击关闭标签页
2. 当标签页过多时，可通过鼠标滚轮选择或者按住鼠标拖动
3. 支持右键操作（目前支持的操作有：关闭所有标签、关闭其他标签、刷新当前标签、复制标签页链接）

## 安装

运行以下命令：

```
$ composer require woodynew/z-dcat-iframe-tab
```

然后运行：

```
# 发布扩展必备文件
$ php artisan vendor:publish --tag=iframe-tab
# 发布扩展配置文件
$ php artisan vendor:publish --tag=iframe-tab.config
# 发布扩展的视图文件(如想自定义某些内容可发布出去，建议不要使用)
$ php artisan vendor:publish --tag=iframe-tab.view
```

`php artisan vendor:publish --tag=iframe-tab` 会将css和js发布`public/vendor/iframe-tab`

## 更新
相关更新内容请关注github的`tag`，里面有每个版本详细的更新：[https://github.com/woodynew/z-dcat-iframe-tab/releases](https://github.com/woodynew/z-dcat-iframe-tab/releases)

基本迭代更新命令：
```apacheconfig
composer remove woodynew/z-dcat-iframe-tab
composer require woodynew/z-dcat-iframe-tab:版本号
php artisan vendor:publish --tag=iframe-tab --force
```

其他文件覆盖更新：
```
$ php artisan vendor:publish --tag=iframe-tab --force
$ php artisan vendor:publish --tag=iframe-tab.config --force
```

上述命令会把 css、js 覆盖到 `public/vendor/iframe-tab`；带 `--force` 时配置文件也会被覆盖，配置文件可按需选择是否强制覆盖。

## 配置

### 多语言

扩展内置 `zh_CN`、`zh_TW`、`en` 语言包，右键菜单、关闭按钮和操作提示跟随 Laravel 当前语言。无需安装 Kit 也能通过 `app()->setLocale()` 使用；如需界面语言选择器，可启用 Dcat Admin Kit 的 `features.locale_switcher`。

翻译键使用 `iframe-tab::iframe.*`。应用可在 Laravel 语言目录的 `vendor/iframe-tab/<语言>/iframe.php` 中覆盖文案。

更新后执行 `php artisan vendor:publish --tag=iframe-tab --force` 发布 JS。如果应用覆盖过 `resources/views/vendor/iframe-tab/vertical.blade.php`，还需要手工合并新视图的翻译调用和 `iframe-tab-i18n` JSON 数据块。

缓存包含标签的 HTML。首次升级或当前语言变化时会清除旧标签缓存并重新打开首页，防止恢复旧语言标题；同语言刷新保留原有缓存行为。切换语言前请先保存编辑内容。Kit 的选择器会刷新同源顶层页面；使用自己的切换器时也需要刷新顶层框架。业务菜单及页面标题的翻译由应用负责。

### 联动回归测试

测试使用相邻 `dcat-admin-kit` 仓库的 Composer 和 Playwright 开发依赖（先在 Kit 中完成 `composer install`、`npm ci`）。不需要启动 Demo 或连接业务数据库：

```bash
PHP_BINARY=php node ../dcat-admin-kit/node_modules/@playwright/test/cli.js test --config tests/Browser/playwright.config.js
```

默认使用本机 Chrome；CI 可设置 `CI=1` 使用已安装的 Playwright Chromium。Kit 位于其他位置时设置 `KIT_PATH`。测试覆盖 Session、CSRF、三种语言、主页面与 iframe 内切换、同语言缓存恢复及旧语言缓存失效。

`src/assets/js/compress/base.js` 是实际发布文件，与 `src/assets/js/base.js` 保持同步；本次使用相同源码，避免依赖额外的压缩工具。

### 配置项

配置文件在 `config/iframe_tab.php`下dcat-Iframe-tab可提供的配置并不多，根据自己的需要去配置：

```php
return [
    # 是否开启iframe_tab
    'enable'                => env('START_IFRAME_TAB', true),
    # 底部设置
    'footer_setting'        => [
        'copyright'         => env('APP_NAME', ''),
        'app_version'       => env('APP_VERSION', ''),
        # 是否将底部置于菜单下
        'use_menu'          => false
    ],
    # 是否开启标签页缓存
    'cache'                 => env('IFRAME_TAB_CACHE', false),
    # 更改dialog表单默认宽高
    'dialog_area_width'     => env('IFRAME_TAB_DIALOG_AREA_WIDTH', '50%'),
    'dialog_area_height'    => env('IFRAME_TAB_DIALOG_AREA_HEIGHT', '90vh'),
    # iframe-tab占用的路由 默认 '/'
    'router'                => '/',
    'domain'                => null,
    # 是否开启懒加载模式
    'lazy_load'              => true
];
```

## 新增扩展接口和扩展功能

1. 用户可以在子页面引入 `public/vendor/iframe-tab/js/extend.js`文件，或者通过调用`window.iframeTabParent`全局对象来调用父级页面的iframe-tab
2. 引入新功能：超链接监听打开新页面加入iframe-tab：用户可自行定义超链接按钮，以此来打开新标签页页面，通过添加`iframe-extends=true` 和 `iframe-tab=true` 两个属性
```html
<a iframe-extends=true iframe-tab=true href="https://github.com/woodynew/z-dcat-iframe-tab">添加新的标签页</a>
```
    
