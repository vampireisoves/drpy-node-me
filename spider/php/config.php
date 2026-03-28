<?php
/**
 * Copyright 道长所有
 * Date: 2026/01/23
 */
header('Content-Type: application/json; charset=utf-8');
// http://127.0.0.1:9980/config.php
// ==================
// 1. 生成 sites
// ==================
// 动态获取服务器地址
$isHttps = (isset($_SERVER['HTTPS']) && ($_SERVER['HTTPS'] === 'on' || $_SERVER['HTTPS'] == 1))
    || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
$scheme = $isHttps ? 'https://' : 'http://';
$host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_ADDR'] ?? '127.0.0.1';

// 处理路径（适配子目录部署）
$path = dirname($_SERVER['SCRIPT_NAME']);
if ($path === '/' || $path === '\\') {
    $path = '';
}
$path = str_replace('\\', '/', $path); // 统一转为 /

$baseUrl = $scheme . $host . $path;

$dir  = __DIR__;
$self = basename(__FILE__);
$files = scandir($dir);

$sites = [];

foreach ($files as $file) {
    if (pathinfo($file, PATHINFO_EXTENSION) !== 'php') {
        continue;
    }

    // 排除特定文件：
    // 1. 系统/框架文件 (index.php, spider.php 等)
    // 2. 当前文件 ($self)
    // 3. 以 _ 开头的文件 (如 _backup.php)
    // 4. config 开头的文件 (如 config_old.php)
    if (in_array($file, ['index.php', 'spider.php', 'example_t4.php', 'test_runner.php']) ||
        $file === $self ||
        strpos($file, '_') === 0 ||
        fnmatch('config*.php', $file) ||
        stripos($file, 'test') !== false ||
        stripos($file, 'bridge') !== false) {
        continue;
    }

    $filename = pathinfo($file, PATHINFO_FILENAME);

    $site = [
        "key"          => "php_" . $filename,
        "name"         => $filename . "(PHP)",
        "type"         => 4,
        "api"          => $baseUrl . "/" . $filename . ".php",
        "searchable"   => 1,
        "quickSearch"  => 1,
        "changeable"   => 0
    ];

    if (strpos($filename, '[书]') !== false) {
        $site['类型'] = '小说';
    } elseif (strpos($filename, '[画]') !== false) {
        $site['类型'] = '漫画';
    }

    $sites[] = $site;
}

// ==================
// 2. 尝试加载 index.json (同级) 或 ../drpy-node/index.json 或 ../../drpy-node/index.json
// ==================
$possiblePaths = [
    $dir . '/config.json',
    $dir . '/index.json',
    $dir . '/../drpy-node/index.json',
    $dir . '/../../drpy-node/index.json'
];

$indexJsonPath = false;
foreach ($possiblePaths as $path) {
    $realPath = realpath($path);
    if ($realPath && is_file($realPath)) {
        $indexJsonPath = $realPath;
        break;
    }
}

if ($indexJsonPath && is_file($indexJsonPath)) {
    $content = file_get_contents($indexJsonPath);
    $json = json_decode($content, true);

    // JSON 合法并且是数组
    if (is_array($json)) {
        // 替换 sites
        $json['sites'] = $sites;

        echo json_encode(
            $json,
            JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
        );
        exit;
    }
}

// ==================
// 3. 找不到或失败，回退只返回 sites
// ==================
echo json_encode(
    ["sites" => $sites],
    JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
);

