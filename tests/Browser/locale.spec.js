const path = require('node:path');
const kit = process.env.KIT_PATH || path.resolve(__dirname, '../../../dcat-admin-kit');
const { test, expect } = require(path.join(kit, 'node_modules/@playwright/test'));

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
