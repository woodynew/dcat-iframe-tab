const path = require('node:path');
const kit = process.env.KIT_PATH || path.resolve(__dirname, '../../../dcat-admin-kit');
const { defineConfig } = require(path.join(kit, 'node_modules/@playwright/test'));

module.exports = defineConfig({
    testDir: __dirname,
    testMatch: 'locale.spec.js',
    outputDir: '../../test-results',
    workers: 1,
    use: {
        baseURL: 'http://127.0.0.1:18087',
        channel: process.env.CI ? 'chromium' : 'chrome',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: (process.env.PHP_BINARY || 'php') + ' -S 127.0.0.1:18087 "' + path.join(__dirname, 'router.php') + '"',
        url: 'http://127.0.0.1:18087/admin/fixture',
        reuseExistingServer: false,
    },
});
