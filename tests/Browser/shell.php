<!doctype html>
<html lang="<?= e($locale) ?>"><head><meta charset="utf-8"><title><?= e($title) ?></title>
<link rel="stylesheet" href="/assets/dcat/plugins/vendors.min.css">
<script src="/assets/dcat/plugins/vendors.min.js"></script>
<script>window.Dcat = {success: message => document.querySelector('#message').textContent = message, error: message => document.querySelector('#message').textContent = message};</script>
</head><body>
<div class="navbar"><?= $switcher ?></div><p id="message"></p>
<?php if ($child): ?>
<h1 id="child-title"><?= e($record) ?></h1>
<script>window.fixtureReady = true;</script>
<?php else: ?>
<nav class="main-menu"><div class="main-menu-content"><ul class="sidebar">
<li><a class="nav-link" href="/admin/fixture?child=home"><?= e($title) ?></a></li>
<li><a class="nav-link" href="/admin/fixture?child=records"><?= e($record) ?></a></li>
</ul></div></nav>
<input id="iframe_tab_cache" value="1" type="hidden"><input id="iframe_tab_lazy_load" value="1" type="hidden"><input id="use_id" value="fixture" type="hidden">
<div class="mouse-click-menu"><ul>
<?php foreach (['close_all' => 'close-all', 'close_other' => 'close-other', 'refresh' => 'refresh', 'clear_cache' => 'clear-cache', 'copy_link' => 'copy-link', 'open_link' => 'open-link'] as $key => $class): ?>
<li><a href="javascript:;" class="menu-item tab-<?= $class ?>"><?= e($messages[$key]) ?></a></li>
<?php endforeach ?>
</ul></div>
<div id="iframe-tab-container"><div class="swiper-container"><ul id="iframe-tab" class="nav nav-pills swiper-wrapper"></ul></div></div>
<div id="iframe-tabContent" style="position:relative; height:400px"></div>
<script type="application/json" id="iframe-tab-i18n" data-locale="<?= e($locale) ?>"><?= $json ?></script>
<script src="/iframe-assets/js/md5.js"></script><script src="/iframe-assets/js/swiper.min.js"></script>
<script src="/iframe-assets/js/compress/base.js"></script>
<script src="/iframe-assets/js/compress/extend.js"></script>
<?php endif ?>
</body></html>
