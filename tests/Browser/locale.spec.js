const path = require('node:path');
const kit = process.env.KIT_PATH || path.resolve(__dirname, '../../../dcat-admin-kit');
const { test, expect } = require(path.join(kit, 'node_modules/@playwright/test'));

for (const dark of [false, true]) {
    test(`Kit global styles preserve iframe spacing in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
        await page.goto('/admin/fixture?style=1&kit=1');
        await page.evaluate(dark => {
            document.body.classList.toggle('dark-mode', dark);
            $(document).trigger(dark ? 'dark-mode.shown' : 'dark-mode.hide');
            document.body.insertAdjacentHTML('beforeend', '<ul id="ordinary-pills" class="nav nav-pills"><li class="nav-item"><a class="nav-link">Ordinary tab</a></li></ul>');
        }, dark);
        await page.locator('.main-menu .nav-link').nth(1).click();
        const layout = await page.locator('#iframe-tab .nav-link').evaluateAll(nodes => nodes.map(node => {
            const bar = node.closest('#iframe-tab-container').getBoundingClientRect();
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return { top: rect.top - bar.top - 1, bottom: bar.bottom - rect.bottom - 1,
                marginBottom: style.marginBottom, paddingLeft: style.paddingLeft };
        }));
        for (const tab of layout) {
            expect(Math.abs(tab.top - tab.bottom)).toBeLessThanOrEqual(0.5);
            expect(tab.marginBottom).toBe('0px');
            expect(tab.paddingLeft).toBe('10px');
        }
        await expect(page.locator('#ordinary-pills .nav-link')).toHaveCSS('margin-bottom', '8px');
    });

    test(`tabs stay centered and compact with Bootstrap list spacing in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
        await page.goto('/admin/fixture?style=1');
        await page.evaluate(dark => {
            document.body.classList.toggle('dark-mode', dark);
            $(document).trigger(dark ? 'dark-mode.shown' : 'dark-mode.hide');
        }, dark);
        await page.locator('.main-menu .nav-link').nth(1).click();
        for (const width of [375, 768, 1280]) {
            await page.setViewportSize({width, height: 900});
            await page.locator('#iframe-tab-container').evaluate(async node => {
                await Promise.all(node.getAnimations().map(animation => animation.finished));
            });
            const layout = await page.locator('#iframe-tab').evaluate(list => {
                const bar = list.closest('#iframe-tab-container');
                const bounds = bar.getBoundingClientRect();
                return {
                    background: getComputedStyle(bar).backgroundColor,
                    marginBottom: getComputedStyle(list).marginBottom,
                    tabs: [...list.querySelectorAll('.nav-link')].map(node => {
                        const rect = node.getBoundingClientRect();
                        const icon = node.querySelector(':scope > i').getBoundingClientRect();
                        const text = node.querySelector('p').getBoundingClientRect();
                        return {top: rect.top - bounds.top - 1, bottom: bounds.bottom - rect.bottom - 1,
                            iconGap: text.left - icon.right, rightPadding: parseFloat(getComputedStyle(node).paddingRight)};
                    }),
                };
            });
            expect(layout.background).not.toBe('rgb(255, 255, 255)');
            expect(layout.marginBottom).toBe('0px');
            for (const tab of layout.tabs) {
                expect(Math.abs(tab.top - tab.bottom)).toBeLessThanOrEqual(0.5);
                expect(tab.top).toBeGreaterThanOrEqual(6);
                expect(tab.iconGap).toBeLessThanOrEqual(8.5);
                expect(tab.rightPadding).toBeLessThanOrEqual(26);
            }
        }
    });

    test(`long Help stays inside its iframe in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
        await page.goto('/admin/fixture?style=1');
        const child = page.frameLocator('#iframe-tabContent .tab-pane.active iframe');
        await child.locator('body').evaluate((body, dark) => body.classList.toggle('dark-mode', dark), dark);
        await child.locator('#fixture-help').hover();
        const tip = child.locator('.layui-layer-tips');
        await expect(tip).toBeVisible();
        const bounds = await tip.evaluate(async node => {
            await Promise.all(node.getAnimations().map(animation => animation.finished));
            const rect = node.getBoundingClientRect();
            return { top: rect.top, bottom: rect.bottom, height: window.innerHeight };
        });
        expect(bounds.top).toBeGreaterThanOrEqual(0);
        expect(bounds.bottom).toBeLessThanOrEqual(bounds.height);
        await child.locator('#child-title').hover();
        await expect(tip).toHaveCount(0);
    });

    test(`tab states have readable contrast and an active marker in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
        await page.goto('/admin/fixture?style=1');
        await page.evaluate(dark => {
            document.body.classList.toggle('dark-mode', dark);
            $(document).trigger(dark ? 'dark-mode.shown' : 'dark-mode.hide');
        }, dark);
        await page.locator('.main-menu .nav-link').nth(1).click();
        const tabs = page.locator('#iframe-tab .nav-link');
        await tabs.evaluateAll(async nodes => {
            await Promise.all(nodes.flatMap(node => node.getAnimations().map(animation => animation.finished)));
        });
        for (const headerColor of ['#ffffff', '#586cb1', '#1e1e2d']) {
            await page.locator('.navbar').evaluate((node, color) => node.style.backgroundColor = color, headerColor);
            const appearance = await tabs.evaluateAll(nodes => nodes.map(node => {
                const style = getComputedStyle(node);
                const textStyle = getComputedStyle(node.querySelector('p') || node);
                const bar = getComputedStyle(document.querySelector('#iframe-tab-container'));
                return { color: textStyle.color, background: style.backgroundColor, bar: bar.backgroundColor, border: style.borderColor };
            }));
            expect(appearance[1].background).not.toBe(appearance[0].background);
            expect(appearance[1].border).not.toBe(appearance[0].border);
            for (const state of appearance) {
                const luminance = color => {
                    const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
                        value /= 255;
                        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
                    });
                    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
                };
                const text = luminance(state.color);
                const background = luminance(state.background === 'rgba(0, 0, 0, 0)' ? state.bar : state.background);
                expect((Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05)).toBeGreaterThanOrEqual(4.5);
            }
        }
    });
}

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
    const reloaded = page.waitForEvent('framenavigated', frame => frame.url().endsWith('child=records'));
    await page.locator('.tab-refresh').click();
    await reloaded;
    expect(await current.locator('#child-title').evaluate(() => performance.timeOrigin)).not.toBe(currentTime);
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
