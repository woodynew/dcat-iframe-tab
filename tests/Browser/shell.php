<!doctype html>
<html lang="<?= e($locale) ?>"><head><meta charset="utf-8"><title><?= e($title) ?></title>
<link rel="stylesheet" href="/assets/dcat/plugins/vendors.min.css">
<?php $styleFixture = $request->query('style') === '1'; ?>
<?php if ($styleFixture): ?>
<link rel="stylesheet" href="/assets/adminlte/adminlte.css">
<link rel="stylesheet" href="/assets/dcat/css/dcat-app.css">
<?php if ($request->query('kit') === '1'): ?>
<link rel="stylesheet" href="/kit-assets/css/global.css">
<?php endif ?>
<style>
    .main-menu { position: absolute; top: 100px; width: 260px; }
    .navbar { height: 60px; margin-left: 260px; }
    #message { display: none; }
    body.full-page .navbar { display: none; }
    #fixture-help { display: inline-block; margin: 110px 0 0 200px; }
</style>
<?php endif ?>
<link rel="stylesheet" href="/iframe-assets/css/swiper.min.css">
<link rel="stylesheet" href="/iframe-assets/css/style.css">
<script src="/assets/dcat/plugins/vendors.min.js"></script>
<?php if ($styleFixture): ?><script src="/assets/dcat/plugins/layer/layer.js"></script><?php endif ?>
<script>window.Dcat = {ready: callback => $(callback), success: message => document.querySelector('#message').textContent = message, error: message => document.querySelector('#message').textContent = message};</script>
</head><body class="<?= $styleFixture ? 'sidebar-mini '.($child ? 'full-page' : 'layout-fixed') : '' ?>">
<div class="navbar navbar-light"><?= $switcher ?></div><p id="message"></p>
<?php if ($child): ?>
<h1 id="child-title"><?= e($record) ?></h1>
<?php if ($styleFixture): ?>
<a id="fixture-help" href="javascript:;">专家管理员 ⓘ</a>
<?php
    $tooltip = \Dcat\Admin\Widgets\Tooltip::make('#fixture-help')
        ->title(str_repeat('按专家授权，影响该专家的直播及所属群聊；<br>', 8));
    $placement = $request->query('placement', 'top');
    $tooltip->placement($placement)->render();
    echo \Dcat\Admin\Admin::asset()->scriptToHtml();
?>
<?php endif ?>
<script>window.fixtureReady = true;</script>
<?php else: ?>
<nav class="main-menu"><div class="main-menu-content"><ul class="sidebar">
<li><a class="nav-link" href="/admin/fixture?child=home<?= $styleFixture ? '&style=1' : '' ?>"><i class="fa fa-fw fa-bar-chart"></i>
<p><?= e($title) ?></p></a></li>
<li><a class="nav-link" href="/admin/fixture?child=records<?= $styleFixture ? '&style=1' : '' ?>"><i class="fa fa-fw feather icon-menu"></i>
<p><?= e($record) ?></p></a></li>
<li><a class="nav-link" href="/admin/fixture?child=tools<?= $styleFixture ? '&style=1' : '' ?>"><p>Tools</p></a></li>
</ul></div></nav>
<input id="iframe_tab_cache" value="<?= $request->query('cache') === '0' ? 0 : 1 ?>" type="hidden"><input id="iframe_tab_lazy_load" value="<?= $request->query('lazy') === '0' ? 0 : 1 ?>" type="hidden"><input id="use_id" value="fixture" type="hidden">
<div class="mouse-click-menu"><ul>
<?php foreach (['close_all' => 'close-all', 'close_other' => 'close-other', 'refresh' => 'refresh', 'clear_cache' => 'clear-cache', 'copy_link' => 'copy-link', 'open_link' => 'open-link'] as $key => $class): ?>
<li><a href="javascript:;" class="menu-item tab-<?= $class ?>"><?= e($messages[$key]) ?></a></li>
<?php endforeach ?>
</ul></div>
<div id="iframe-tab-container" class="<?= $styleFixture ? 'iframe-tab-container' : '' ?>"><div class="swiper-container"><ul id="iframe-tab" class="nav nav-pills mb-3 swiper-wrapper" role="tablist"></ul></div>
<div class="swiper-button-prev"><i class="fa fa-angle-double-left"></i></div><div class="swiper-button-next"><i class="fa fa-angle-double-right"></i></div></div>
<div class="<?= $styleFixture ? 'content-wrapper iframe-tab-wrapper' : '' ?>"><div id="iframe-tabContent" style="position:relative; height:600px"></div></div>
<script type="application/json" id="iframe-tab-i18n" data-locale="<?= e($locale) ?>"><?= $json ?></script>
<script src="/iframe-assets/js/md5.js"></script><script src="/iframe-assets/js/swiper.min.js"></script>
<script src="/iframe-assets/js/compress/base.js"></script>
<script src="/iframe-assets/js/compress/extend.js"></script>
<?php endif ?>
</body></html>
