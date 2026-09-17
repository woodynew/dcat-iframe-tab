<?php
if (!function_exists('mosi_iframeTabBodyClass')){
    function mosi_iframeTabBodyClass($body_class){
        if (!empty($body_class)) {
            if (!is_array($body_class)) {
                $body_class = explode(' ', $body_class);
            }
            $iframe_body_class = array_reduce($body_class, function ($result, $item) {
                return $result . ' iframe-tab-' . $item;
            });
        } else {
            $iframe_body_class='';
        }
        return $iframe_body_class;
    }
}

if (!function_exists('mosi_iframeTabAsset')) {
    /**
     * iframe-tab 静态资源地址：拼上文件修改时间做版本号。
     * 发布出来的 style.css/base.js 不带版本号时，浏览器会一直用缓存里的旧文件，
     * 改了样式也看不到效果。文件不存在时退回原地址。
     */
    function mosi_iframeTabAsset($path)
    {
        $file = public_path(ltrim($path, '/'));

        return is_file($file) ? asset($path).'?v='.filemtime($file) : asset($path);
    }
}
