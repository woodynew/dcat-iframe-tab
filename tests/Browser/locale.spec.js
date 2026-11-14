const path = require('node:path');
const kit = process.env.KIT_PATH || path.resolve(__dirname, '../../../dcat-admin-kit');
const { test, expect } = require(path.join(kit, 'node_modules/@playwright/test'));

test('reload preserves tab order and current page, including home and adjacent tabs after closing', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/admin/fixture');
    const tabs = page.locator('#iframe-tab .nav-link');
    const active = page.locator('#iframe-tab .nav-link.active');
    const pane = page.locator('#iframe-tabContent .tab-pane.active');
    const menu = page.locator('.main-menu .nav-link');
    await menu.nth(1).click();
    await menu.nth(2).click();
    await tabs.nth(1).click();
    const order = await tabs.evaluateAll(nodes => nodes.map(node => node.id));
    const selected = await active.getAttribute('id');

    for (let i = 0; i < 2; i++) {
        await page.reload();
        expect(await tabs.evaluateAll(nodes => nodes.map(node => node.id))).toEqual(order);
        await expect(active).toHaveCount(1);
        await expect(active).toHaveAttribute('id', selected);
        await expect(pane).toHaveCount(1);
        await expect(pane.locator('iframe')).toHaveAttribute('src', '/admin/fixture?child=records');
        await expect(page.frameLocator('#iframe-tabContent .tab-pane.active iframe').locator('#child-title')).toBeVisible();
        await expect(page.locator('#iframe-tabContent iframe')).toHaveCount(1);
    }

    await tabs.first().click();
    await page.reload();
    await expect(active).toHaveAttribute('data-first', '1');
    await expect(pane.locator('iframe')).toHaveAttribute('src', '/admin/fixture?child=home');
    await expect(tabs).toHaveCount(3);

    // Closing a restored, unloaded tab must not lose the remaining page content.
    await tabs.nth(2).hover();
    await tabs.nth(2).locator('.iframe-tab-close-btn').click();
    await tabs.nth(1).click();
    await active.hover();
    await active.locator('.iframe-tab-close-btn').click();
    await page.reload();
    await expect(tabs).toHaveCount(1);
    await expect(active).toHaveAttribute('data-first', '1');
    await expect(pane.locator('iframe')).toHaveAttribute('src', '/admin/fixture?child=home');
    expect(errors).toEqual([]);
});

test('right-click refresh reloads only its target iframe', async ({ page }) => {
    await page.goto('/admin/fixture');
    const home = page.frameLocator('#iframe-tabContent .tab-pane.active iframe');
    const homeTime = await home.locator('#child-title').evaluate(() => performance.timeOrigin);
    const homeFrame = page.frames().find(frame => frame.url().endsWith('child=home'));
    await page.locator('.main-menu .nav-link').nth(1).click();
    const current = page.frameLocator('#iframe-tabContent .tab-pane.active iframe');
    const currentTime = await current.locator('#child-title').evaluate(() => performance.timeOrigin);
    await page.locator('#iframe-tab .nav-link.active').click({ button: 'right' });
    await page.locator('.tab-refresh').click();
    await expect.poll(() => current.locator('#child-title').evaluate(() => performance.timeOrigin)).not.toBe(currentTime);
    expect(await homeFrame.evaluate(() => performance.timeOrigin)).toBe(homeTime);
    await expect(page.locator('#iframe-tab .nav-link')).toHaveCount(2);
    await expect(page.locator('#iframe-tabContent .tab-pane.active')).toHaveCount(1);
});

test('right-click refresh loads restored background tabs and home without changing selection', async ({ page }) => {
    await page.goto('/admin/fixture');
    const tabs = page.locator('#iframe-tab .nav-link');
    await page.locator('.main-menu .nav-link').nth(1).click();
    await page.locator('.main-menu .nav-link').nth(2).click();
    await tabs.nth(1).click();
    await page.reload();
    const current = page.locator('#iframe-tab .nav-link.active');
    const selected = await current.getAttribute('id');
    const time = await page.frameLocator('#iframe-tabContent .tab-pane.active iframe')
        .locator('#child-title').evaluate(() => performance.timeOrigin);
    const frame = page.frames().find(frame => frame.url().endsWith('child=records'));

    for (const [index, child] of [[2, 'tools'], [0, 'home']]) {
        const href = await tabs.nth(index).getAttribute('href');
        await expect(page.locator(href)).toHaveCount(0);
        await tabs.nth(index).click({ button: 'right' });
        const loaded = page.waitForResponse(response => response.url().endsWith(`child=${child}`)
            && response.request().resourceType() === 'document');
        await page.locator('.tab-refresh').click();
        await expect(page.locator(`${href} iframe`)).toHaveCount(1);
        expect((await loaded).ok()).toBe(true);
        await expect(page.frameLocator(`${href} iframe`).locator('#child-title')).toBeAttached();
        await expect(current).toHaveCount(1);
        await expect(current).toHaveAttribute('id', selected);
        await expect(page.locator('#iframe-tabContent .tab-pane.active')).toHaveCount(1);
        expect(await frame.evaluate(() => performance.timeOrigin)).toBe(time);
    }
});

test('legacy selection, missing active IDs and corrupt caches recover without blank pages', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/admin/fixture');
    await page.locator('.main-menu .nav-link').nth(1).click();
    await page.evaluate(() => localStorage.removeItem(window.iframeTabParent.iframeTab.TAB_STORAGE_KEY + '_active'));
    await page.reload();
    await expect(page.locator('#iframe-tabContent .tab-pane.active iframe')).toHaveAttribute('src', '/admin/fixture?child=records');

    await page.evaluate(() => localStorage.setItem(window.iframeTabParent.iframeTab.TAB_STORAGE_KEY + '_active', 'missing-tab'));
    await page.reload();
    await expect(page.locator('#iframe-tab .nav-link.active')).toHaveAttribute('data-first', '1');
    await expect(page.locator('#iframe-tab .nav-link')).toHaveCount(2);

    for (const value of ['{broken', 'null', '[]', '{"broken":{}}']) {
        await page.evaluate(value => localStorage.setItem(window.iframeTabParent.iframeTab.TAB_STORAGE_KEY, value), value);
        await page.reload();
        await expect(page.locator('#iframe-tab .nav-link')).toHaveCount(1);
        await expect(page.locator('#iframe-tabContent .tab-pane.active iframe')).toHaveAttribute('src', '/admin/fixture?child=home');
    }
    expect(errors).toEqual([]);
});

test('cache disabled keeps the default page on reload; eager mode restores all pages', async ({ page }) => {
    await page.goto('/admin/fixture?cache=0');
    await page.locator('.main-menu .nav-link').nth(1).click();
    await page.reload();
    await expect(page.locator('#iframe-tab .nav-link')).toHaveCount(1);
    await expect(page.locator('#iframe-tabContent .tab-pane.active iframe')).toHaveAttribute('src', '/admin/fixture?child=home');

    await page.goto('/admin/fixture?lazy=0');
    await page.locator('.main-menu .nav-link').nth(1).click();
    await page.reload();
    await expect(page.locator('#iframe-tab .nav-link')).toHaveCount(2);
    await expect(page.locator('#iframe-tabContent iframe')).toHaveCount(2);
    await expect(page.locator('#iframe-tabContent .tab-pane.active')).toHaveCount(1);
    await expect(page.locator('#iframe-tabContent .tab-pane.active iframe')).toHaveAttribute('src', '/admin/fixture?child=records');
});

test('Kit switches shell and child languages; iframe preserves same-locale tabs and invalidates old HTML', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/admin/fixture');
    await expect(page.locator('.dcat-kit-locale')).toHaveValue('zh_CN');
    await expect(page.locator('#iframe-tabContent .iframe-tab-loader-card')).toHaveCount(1);
    await expect(page.locator('#iframe-tabContent .iframe-tab-loader-card')).toContainText('正在打开页面');
    await expect(page.locator('#iframe-tab .nav-link')).toHaveCount(1);
    await page.locator('.main-menu .nav-link').nth(1).click();
    await expect(page.locator('#iframe-tab .nav-link')).toHaveCount(2);
    await expect(page.locator('.iframe-tab-close-btn')).toHaveAttribute('title', '关闭标签页');
    await page.reload();
    await expect(page.locator('#iframe-tab .nav-link')).toHaveCount(2);

    await page.locator('.dcat-kit-locale').selectOption('en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#iframe-tab .nav-link')).toHaveCount(1);
    await expect(page.locator('#iframe-tab')).toContainText('Home');
    await expect(page.locator('.tab-close-all')).toHaveText('Close all tabs');
    await page.locator('.main-menu .nav-link').nth(1).click();
    await expect(page.locator('.iframe-tab-close-btn')).toHaveAttribute('title', 'Close tab');
    const child = page.frameLocator('#iframe-tabContent .tab-pane.active iframe');
    await expect(child.locator('#child-title')).toHaveText('Records');

    // Changing language inside an iframe must reload the top shell as well.
    await child.locator('.dcat-kit-locale').selectOption('zh_TW');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh_TW');
    await expect(page.locator('#iframe-tab .nav-link')).toHaveCount(1);
    await expect(page.locator('#iframe-tab')).toContainText('首頁');
    await expect(page.locator('.tab-close-all')).toHaveText('關閉所有分頁');
    expect(errors).toEqual([]);
});

test('switch uses CSRF-protected POST and rejects unknown locales', async ({ page, request }) => {
    await page.goto('/admin/fixture');
    const invalidCsrf = await request.post('/admin/kit/locale', { data: { locale: 'en' } });
    expect(invalidCsrf.status()).toBe(419);
    const response = page.waitForResponse(r => r.url().endsWith('/admin/kit/locale'));
    await page.locator('.dcat-kit-locale').selectOption('en');
    const changed = await response;
    expect(changed.request().method()).toBe('POST');
    expect(new URLSearchParams(changed.request().postData()).get('_token')).toBeTruthy();
    expect(changed.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const rejected = await page.request.post('/admin/kit/locale', {
        form: {locale: 'fr', _token: new URLSearchParams(changed.request().postData()).get('_token')},
    });
    expect(rejected.status()).toBe(422);
    await page.reload();
    await expect(page.locator('.dcat-kit-locale')).toHaveValue('en');
});
