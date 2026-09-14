<?php

// Isolated browser fixture. Uses the sibling Kit's test dependencies and real
// Laravel session/CSRF middleware; never opens the Demo or a business database.
$root = dirname(__DIR__, 2);
$kit = getenv('KIT_PATH') ?: dirname($root).'/dcat-admin-kit';
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$mounts = [
    '/assets/' => $kit.'/vendor/woodynew/dcat-laravel-admin/resources/dist',
    '/iframe-assets/' => $root.'/src/assets',
];
foreach ($mounts as $prefix => $directory) {
    if (strpos($path, $prefix) !== 0) continue;
    $base = realpath($directory);
    $file = realpath($directory.'/'.substr($path, strlen($prefix)));
    if (! $file || strpos($file, $base.DIRECTORY_SEPARATOR) !== 0 || ! is_file($file)) {
        http_response_code(404);
        exit;
    }
    header('Content-Type: '.(substr($file, -3) === '.js' ? 'application/javascript' : 'text/css'));
    readfile($file);
    exit;
}
require $kit.'/vendor/autoload.php';

class LocaleFixtureApplication extends \Orchestra\Testbench\Foundation\Application
{
    protected function resolveApplicationConfiguration($app)
    {
        parent::resolveApplicationConfiguration($app);
        $kit = getenv('KIT_PATH') ?: dirname(__DIR__, 3).'/dcat-admin-kit';
        $app['config']->set('admin', require $kit.'/vendor/woodynew/dcat-laravel-admin/config/admin.php');
        $app['config']->set('admin.auth.enable', false);
        $app['config']->set('admin.permission.enable', false);
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('f', 32)));
        $app['config']->set('app.locale', 'zh_CN');
        $app['config']->set('session.driver', 'file');
        $sessions = sys_get_temp_dir().'/dcat-iframe-locale-fixture';
        if (! is_dir($sessions)) mkdir($sessions, 0700, true);
        $app['config']->set('session.files', $sessions);
        $app['config']->set('session.cookie', 'dcat_iframe_locale_fixture');
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
        $app['config']->set('dcat-admin-kit.features.locale_switcher', true);
    }
}
$app = LocaleFixtureApplication::create(null, null, ['extra' => ['providers' => [
    \Dcat\Admin\AdminServiceProvider::class,
    \Woodynew\DcatAdminKit\DcatAdminKitServiceProvider::class,
], 'dont-discover' => ['*']]]);
$app->make(\Woodynew\DcatAdminKit\DcatAdminKitServiceProvider::class)->init();
$app['translator']->addNamespace('iframe-tab', $root.'/src/resource/lang');
$app['router']->middleware(['web', \Woodynew\DcatAdminKit\Http\Middleware\SetLocale::class])
    ->get('admin/fixture', function (\Illuminate\Http\Request $request) use ($root) {
        $locale = app()->getLocale();
        $title = ['zh_CN' => '首页', 'zh_TW' => '首頁', 'en' => 'Home'][$locale];
        $record = ['zh_CN' => '记录', 'zh_TW' => '記錄', 'en' => 'Records'][$locale];
        $switcher = \Dcat\Admin\Admin::navbar()->render();
        $messages = trans('iframe-tab::iframe');
        $json = json_encode($messages, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
        $child = $request->query('child');
        ob_start();
        require $root.'/tests/Browser/shell.php';
        return response(ob_get_clean());
    });
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$request = \Illuminate\Http\Request::capture();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
