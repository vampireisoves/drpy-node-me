<?php
/**
 * PHP 服务状态检测 - Android 版本
 */
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'status' => 'ok',
    'message' => 'PHP 服务运行正常',
    'version' => PHP_VERSION,
    'platform' => 'Android',
    'time' => date('Y-m-d H:i:s'),
    'extensions' => get_loaded_extensions()
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);


