<?php
// crawler_bridge.php
// Bridge script for Python to call PHP Spider methods and get JSON output.
// Usage: php crawler_bridge.php <spider_path> <method> [args...]

ini_set('display_errors', 0); // Disable error printing to stdout
error_reporting(E_ALL);
date_default_timezone_set('Asia/Shanghai');

header('Content-Type: application/json');

$output = ['status' => 'error', 'data' => null, 'message' => ''];

try {
    if ($argc < 3) {
        throw new Exception("Usage: php crawler_bridge.php <spider_path> <method> [args...]");
    }

    $spiderPath = $argv[1];
    $method = $argv[2];
    $args = array_slice($argv, 3);

    if (!file_exists($spiderPath)) {
        throw new Exception("Spider file not found: $spiderPath");
    }

    // Capture any output during include
    ob_start();
    require_once $spiderPath;
    ob_end_clean();

    if (!class_exists('Spider')) {
        throw new Exception("Class 'Spider' not found in $spiderPath");
    }

    $spider = new Spider();
    if (method_exists($spider, 'init')) {
        $spider->init();
    }

    if (!method_exists($spider, $method)) {
        throw new Exception("Method '$method' not found in Spider class");
    }

    // Call method with args
    // Note: Args passed from CLI are strings. Some methods might expect specific types.
    // However, PHP is loosely typed, so it usually works. 
    // Special handling for extend field or complex structures might be needed if passed via CLI,
    // but standard DrPy methods usually take simple scalars (tid, page, filter) or arrays.
    // For complex args (like filter array), we might need to decode JSON passed as string.
    
    $methodArgs = [];
    foreach ($args as $arg) {
        // Try to decode JSON args if they look like JSON
        $decoded = json_decode($arg, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $methodArgs[] = $decoded;
        } else {
            $methodArgs[] = $arg;
        }
    }

    $result = call_user_func_array([$spider, $method], $methodArgs);

    $output['status'] = 'success';
    $output['data'] = $result;

} catch (Exception $e) {
    $output['message'] = $e->getMessage();
    $output['trace'] = $e->getTraceAsString();
}

echo json_encode($output, JSON_UNESCAPED_UNICODE);
