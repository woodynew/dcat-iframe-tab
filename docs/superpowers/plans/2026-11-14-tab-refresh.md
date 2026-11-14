# iframe 标签刷新恢复实施计划

> **For agentic workers:** 使用 superpowers:executing-plans 在当前会话执行，完成后统一复核。

**Goal:** Demo 刷新后保留标签顺序、当前选择，并重新加载当前页面。

**Architecture:** 沿用扩展的 localStorage 标签缓存和懒加载；单独保存当前标签 ID，恢复时统一激活状态。Demo 开启缓存，通过本地 Docker 覆盖挂载相邻扩展源码和静态资源，不更改正式包版本。

**Tech Stack:** JavaScript、PHP/Laravel、Playwright、Docker Compose。

**Spec:** 本次聊天已批准的“启用缓存并修复恢复逻辑”方案。

## Global Constraints

- 首轮仅本地实现与验收；用户验收通过后已授权发布补丁版本 1.3.4。
- 不保留未提交表单；语言变化继续清空旧语言标签缓存。
- 懒加载时只恢复当前 iframe，其余标签点击后加载；保持 cache=false 的现有语义。
- base.js 与实际发布的 compress/base.js 同步。

## Review Focus

- 当前选择为首页、关闭当前页、关闭恢复后尚未加载的页。
- 连续刷新、标签顺序、唯一 active、懒加载内容不被空值覆盖。
- 右键刷新不重载其他 iframe。
- 旧缓存没有活动 ID 时兼容；损坏缓存不阻止页面打开。
- 本地 Demo PHP 与 Web 实际使用同一份新扩展代码和资源。

## Task 1: 扩展恢复逻辑

**Files:** src/assets/js/base.js、src/assets/js/compress/base.js、tests/Browser/locale.spec.js、tests/Browser/shell.php。

- [x] 先增加多标签、首页和关闭后的刷新用例，观察行为失败：恢复后期望 1 个 iframe，实际 2 个。
- [x] 最小修复活动 ID、缓存恢复及懒加载内容保存，运行扩展浏览器套件。
- [x] 补充右键刷新、旧缓存/损坏缓存场景，扩展浏览器套件 7 项通过。

## Task 2: Demo 本地集成

**Files:** Demo config/iframe_tab.php、tests/Browser/demo.spec.js；本地 compose.override.yaml、LOCAL_KIT.md。

- [x] 开启缓存，补充 Demo 真实刷新回归；修改前期望恢复 3 标签，实际只剩 1 标签。
- [x] 使用独立本地演示卷启动 PHP 8.4/Nginx；本地源码、容器内文件、HTTP JS SHA-256 一致。
- [x] Demo iframe 2 项、多语言 1 项通过；JS/PHP 语法与 diff 检查通过。保留 localhost:18085 服务。

## 本地执行记录

- 扩展夹具使用已有 Herd PHP 8.3 和项目内安装的 Kit 测试依赖；Demo 使用 Docker PHP 8.4，不改变系统默认 PHP。
- 首轮两个改动仓库均在 codex/preserve-iframe-tabs，未提交或发布，正式 composer.json/lock 与版本号保持原状。
- Compose 覆盖仅由 Demo .git/info/exclude 忽略，重建普通生产镜像不会自动包含本地扩展修复。
- 只读复核发现未加载标签右键刷新无效；新增用例先观察 0 iframe 失败，再复用 loadTabContent 修复。最终扩展 7 项、Demo iframe/多语言 3 项通过；复核关闭该 P2，无其他确认的 P1/P2。
