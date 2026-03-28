<?php
// batch_test.php
// 批量测试目录下所有 Spider 插件
// 访问: http://127.0.0.1:9980/batch_test.php
// 参数: ?format=json 返回 JSON 格式, 否则返回可读文本

ini_set('display_errors', 1);
error_reporting(E_ALL);
date_default_timezone_set('Asia/Shanghai');

// 输出格式
$format = $_GET['format'] ?? 'text';
$isJson = $format === 'json';

// 排除的系统文件
$excludeFiles = [
    'index.php',
    'config.php', 
    'spider.php',
    'example_t4.php',
    'test_runner.php',
    'batch_test.php'
];

// 获取当前目录下所有 PHP 文件
$dir = __DIR__;
$files = scandir($dir);
$spiderFiles = [];

foreach ($files as $file) {
    if (pathinfo($file, PATHINFO_EXTENSION) !== 'php') continue;
    if (in_array($file, $excludeFiles)) continue;
    $spiderFiles[] = $file;
}

// 测试结果
$results = [];
$summary = [
    'total' => count($spiderFiles),
    'passed' => 0,
    'failed' => 0,
    'skipped' => 0,
    'start_time' => date('Y-m-d H:i:s'),
];

if (!$isJson) {
    header('Content-Type: text/plain; charset=utf-8');
    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║           PHP Spider 批量测试工具 v1.0                       ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n\n";
    echo "📁 扫描目录: $dir\n";
    echo "📄 发现 " . count($spiderFiles) . " 个待测试文件\n";
    echo "⏰ 开始时间: " . $summary['start_time'] . "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
}

foreach ($spiderFiles as $index => $file) {
    $filePath = $dir . DIRECTORY_SEPARATOR . $file;
    $testResult = [
        'file' => $file,
        'status' => 'unknown',
        'tests' => [],
        'error' => null,
        'total_time' => 0,
    ];
    
    $fileStartTime = microtime(true);
    
    if (!$isJson) {
        $num = $index + 1;
        echo "┌─────────────────────────────────────────────────────────────┐\n";
        echo "│ [$num/" . count($spiderFiles) . "] 测试文件: $file\n";
        echo "└─────────────────────────────────────────────────────────────┘\n";
    }
    
    try {
        // 使用输出缓冲捕获 require 过程中的输出
        ob_start();
        
        // 使用独立的命名空间避免类冲突
        $tempFile = $dir . DIRECTORY_SEPARATOR . '.temp_test_' . uniqid() . '.php';
        $wrapperCode = '<?php
namespace TestNS' . uniqid() . ';
' . file_get_contents($filePath) . '
';
        // 由于命名空间会影响类名，我们改用不同的方法
        // 直接 require，但先检查 Spider 类是否已存在
        ob_end_clean();
        
        // 简单处理：如果 Spider 类已存在，跳过
        if (class_exists('Spider', false)) {
            // 重新定义类会报错，所以需要在新进程中测试
            // 这里我们通过 HTTP 调用每个脚本的首页接口来测试
            $testResult['status'] = 'http_test';
            
            // 通过 HTTP 请求测试
            $host = $_SERVER['HTTP_HOST'] ?? '127.0.0.1:9980';
            $testUrl = "http://$host/$file?filter=true";
            
            if (!$isJson) {
                echo "  📡 使用 HTTP 模式测试...\n";
                echo "  🔗 URL: $testUrl\n";
            }
            
            // 测试首页接口
            $ctx = stream_context_create([
                'http' => [
                    'timeout' => 15,
                    'ignore_errors' => true,
                ]
            ]);
            
            $startTime = microtime(true);
            $response = @file_get_contents($testUrl, false, $ctx);
            $cost = round((microtime(true) - $startTime) * 1000, 2);
            
            if ($response !== false) {
                $data = json_decode($response, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $classes = $data['class'] ?? [];
                    $list = $data['list'] ?? [];
                    
                    $testResult['tests']['home'] = [
                        'status' => !empty($classes) ? 'pass' : 'warn',
                        'time' => $cost,
                        'classes' => count($classes),
                        'list' => count($list),
                    ];
                    
                    if (!$isJson) {
                        if (!empty($classes)) {
                            echo "  ✅ 首页接口: 通过 (分类: " . count($classes) . ", 耗时: {$cost}ms)\n";
                        } else {
                            echo "  ⚠️ 首页接口: 无分类 (list: " . count($list) . ", 耗时: {$cost}ms)\n";
                        }
                    }
                    
                    // 如果有分类，继续测试分类接口
                    if (!empty($classes)) {
                        $tid = $classes[0]['type_id'] ?? null;
                        if ($tid) {
                            $catUrl = "http://$host/$file?t=$tid&ac=detail&pg=1";
                            $startTime = microtime(true);
                            $catResponse = @file_get_contents($catUrl, false, $ctx);
                            $catCost = round((microtime(true) - $startTime) * 1000, 2);
                            
                            if ($catResponse !== false) {
                                $catData = json_decode($catResponse, true);
                                $catList = $catData['list'] ?? [];
                                
                                $testResult['tests']['category'] = [
                                    'status' => !empty($catList) ? 'pass' : 'fail',
                                    'time' => $catCost,
                                    'count' => count($catList),
                                ];
                                
                                if (!$isJson) {
                                    if (!empty($catList)) {
                                        echo "  ✅ 分类接口: 通过 (数据: " . count($catList) . " 条, 耗时: {$catCost}ms)\n";
                                    } else {
                                        echo "  ❌ 分类接口: 无数据 (耗时: {$catCost}ms)\n";
                                    }
                                }
                                
                                // 如果有数据，继续测试详情接口
                                if (!empty($catList)) {
                                    $vodId = $catList[0]['vod_id'] ?? null;
                                    if ($vodId) {
                                        $detailUrl = "http://$host/$file?ac=detail&ids=" . urlencode($vodId);
                                        $startTime = microtime(true);
                                        $detailResponse = @file_get_contents($detailUrl, false, $ctx);
                                        $detailCost = round((microtime(true) - $startTime) * 1000, 2);
                                        
                                        if ($detailResponse !== false) {
                                            $detailData = json_decode($detailResponse, true);
                                            $detailList = $detailData['list'] ?? [];
                                            $hasPlayUrl = !empty($detailList[0]['vod_play_url'] ?? '');
                                            
                                            $testResult['tests']['detail'] = [
                                                'status' => !empty($detailList) ? ($hasPlayUrl ? 'pass' : 'warn') : 'fail',
                                                'time' => $detailCost,
                                                'has_play_url' => $hasPlayUrl,
                                            ];
                                            
                                            if (!$isJson) {
                                                if (!empty($detailList)) {
                                                    $name = $detailList[0]['vod_name'] ?? '未知';
                                                    if ($hasPlayUrl) {
                                                        echo "  ✅ 详情接口: 通过 ($name, 耗时: {$detailCost}ms)\n";
                                                    } else {
                                                        echo "  ⚠️ 详情接口: 无播放链接 ($name, 耗时: {$detailCost}ms)\n";
                                                    }
                                                } else {
                                                    echo "  ❌ 详情接口: 无数据 (耗时: {$detailCost}ms)\n";
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    $testResult['status'] = 'pass';
                    $summary['passed']++;
                } else {
                    $testResult['status'] = 'fail';
                    $testResult['error'] = 'JSON 解析失败: ' . json_last_error_msg();
                    $summary['failed']++;
                    
                    if (!$isJson) {
                        echo "  ❌ 响应解析失败: " . json_last_error_msg() . "\n";
                    }
                }
            } else {
                $testResult['status'] = 'fail';
                $testResult['error'] = 'HTTP 请求失败';
                $summary['failed']++;
                
                if (!$isJson) {
                    echo "  ❌ HTTP 请求失败\n";
                }
            }
        } else {
            // Spider 类不存在，直接 require 测试
            ob_start();
            require_once $filePath;
            ob_end_clean();
            
            if (!class_exists('Spider')) {
                throw new Exception("未找到 Spider 类");
            }
            
            $spider = new Spider();
            $spider->init();
            
            // 测试首页
            $startTime = microtime(true);
            $home = $spider->homeContent(true);
            $cost = round((microtime(true) - $startTime) * 1000, 2);
            
            $classes = $home['class'] ?? [];
            $testResult['tests']['home'] = [
                'status' => !empty($classes) ? 'pass' : 'warn',
                'time' => $cost,
                'classes' => count($classes),
            ];
            
            if (!$isJson) {
                if (!empty($classes)) {
                    echo "  ✅ 首页接口: 通过 (分类: " . count($classes) . ", 耗时: {$cost}ms)\n";
                } else {
                    echo "  ⚠️ 首页接口: 无分类 (耗时: {$cost}ms)\n";
                }
            }
            
            $testResult['status'] = 'pass';
            $summary['passed']++;
        }
        
    } catch (Throwable $e) {
        $testResult['status'] = 'error';
        $testResult['error'] = $e->getMessage();
        $summary['failed']++;
        
        if (!$isJson) {
            echo "  ⛔ 错误: " . $e->getMessage() . "\n";
        }
    }
    
    $testResult['total_time'] = round((microtime(true) - $fileStartTime) * 1000, 2);
    $results[] = $testResult;
    
    if (!$isJson) {
        echo "  ⏱️ 总耗时: " . $testResult['total_time'] . "ms\n";
        echo "\n";
    }
}

$summary['end_time'] = date('Y-m-d H:i:s');

if ($isJson) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'summary' => $summary,
        'results' => $results,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} else {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "📊 测试汇总\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "  📄 总文件数: " . $summary['total'] . "\n";
    echo "  ✅ 通过: " . $summary['passed'] . "\n";
    echo "  ❌ 失败: " . $summary['failed'] . "\n";
    echo "  ⏭️ 跳过: " . $summary['skipped'] . "\n";
    echo "  ⏰ 结束时间: " . $summary['end_time'] . "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
}


