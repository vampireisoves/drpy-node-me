<?php
// test_runner.php
// 这是一个用于测试 Spider 插件接口的脚本
// 用法: php test_runner.php [插件文件路径]

ini_set('display_errors', 1);
error_reporting(E_ALL);

// 设置默认时区，避免时间相关函数警告
date_default_timezone_set('Asia/Shanghai');

$file = $argv[1] ?? '';
if (!$file || !file_exists($file)) {
    die("错误: 未找到文件 '$file'\n用法: php test_runner.php [插件文件路径]\n");
}

echo "==================================================\n";
echo "正在测试文件: $file\n";
echo "==================================================\n";

try {
    // 使用输出缓冲捕获 require 过程中可能的输出（如 (new Spider())->run()）
    // 防止污染后续的测试输出
    ob_start();
    require_once $file;
    ob_end_clean();

    if (!class_exists('Spider')) {
        die("错误: 在文件 '$file' 中未找到 'Spider' 类\n");
    }

    echo "[初始化] 实例化 Spider 类...\n";
    $spider = new Spider();
    $spider->init(); 
    echo "[初始化] 完成\n\n";

    // --- 1. 测试首页接口 (Home Interface) ---
    echo ">>> [1/5] 测试首页接口 (homeContent)\n";
    $startTime = microtime(true);
    $home = $spider->homeContent(true);
    $cost = round((microtime(true) - $startTime) * 1000, 2);
    
    $classes = $home['class'] ?? [];
    $filters = $home['filters'] ?? [];
    
    if (!empty($classes)) {
        echo "    ✅ 通过 (耗时: {$cost}ms)\n";
        echo "    - 获取到 " . count($classes) . " 个分类\n";
        
        // 打印前几个分类名称作为示例
        $classNames = array_column(array_slice($classes, 0, 5), 'type_name');
        echo "    - 分类示例: " . implode(', ', $classNames) . (count($classes) > 5 ? ' ...' : '') . "\n";
        
        if (!empty($filters)) {
            $filterCount = is_object($filters) ? count(get_object_vars($filters)) : count($filters);
            echo "    - 包含筛选配置 (Filters): " . $filterCount . " 组\n";
        }
    } else {
        echo "    ⚠️ 警告: 未获取到分类列表 (class 为空)\n";
    }

    // 确定用于测试分类接口的 type_id
    $tid = $classes[0]['type_id'] ?? null;
    $tname = $classes[0]['type_name'] ?? '未知分类';
    
    if (!$tid && !empty($filters)) {
         // 如果 class 为空但有 filters，尝试从 filters 获取 key
         foreach ($filters as $key => $val) {
             $tid = $key; 
             $tname = "FilterKey:$key";
             break;
         }
    }

    echo "\n";

    // --- 2. 测试分类接口 (Category Interface) ---
    $vodId = null;
    $vodName = null; // 用于搜索测试
    if ($tid) {
        echo ">>> [2/5] 测试分类接口 (categoryContent) - 测试分类: [$tname] (ID: $tid)\n";
        $startTime = microtime(true);
        // 模拟传入 filter 参数为空
        $cat = $spider->categoryContent($tid, 1, false, []);
        $cost = round((microtime(true) - $startTime) * 1000, 2);

        $list = $cat['list'] ?? [];
        if (!empty($list)) {
            echo "    ✅ 通过 (耗时: {$cost}ms)\n";
            echo "    - 获取到 " . count($list) . " 个资源\n";
            
            $firstItem = $list[0];
            $vodId = $firstItem['vod_id'] ?? null;
            $vodName = $firstItem['vod_name'] ?? '未知名称';
            echo "    - 第一条数据: [$vodName] (ID: $vodId)\n";
        } else {
            echo "    ❌ 失败: 未返回资源列表 (list 为空)\n";
        }
    } else {
        echo ">>> [2/5] 测试分类接口: ⏭️ 跳过 (未找到有效的分类ID)\n";
    }

    echo "\n";

    // --- 3. 测试详情接口 (Detail Interface) ---
    $playUrl = null;
    $playFrom = null;
    
    if ($vodId) {
        echo ">>> [3/5] 测试详情接口 (detailContent) - 测试资源ID: $vodId\n";
        $startTime = microtime(true);
        $detail = $spider->detailContent([$vodId]);
        $cost = round((microtime(true) - $startTime) * 1000, 2);

        $detailList = $detail['list'] ?? [];
        
        if (!empty($detailList)) {
            $vod = $detailList[0];
            $name = $vod['vod_name'] ?? '未知';
            // 更新 vodName，详情页的名称通常更准确
            if ($name && $name !== '未知') {
                $vodName = $name;
            }
            $playUrl = $vod['vod_play_url'] ?? '';
            $playFrom = $vod['vod_play_from'] ?? '';
            $pic = $vod['vod_pic'] ?? '';
            $desc = $vod['vod_content'] ?? '';
            
            echo "    ✅ 通过 (耗时: {$cost}ms)\n";
            echo "    - 资源名称: $name\n";
            echo "    - 封面图片: " . ($pic ? $pic : "⚠️ 未获取到封面") . "\n";
            echo "    - 播放源 (vod_play_from): $playFrom\n";
            
            // 检查播放地址
            if (!empty($playUrl)) {
                $urlCount = substr_count($playUrl, '$');
                // 粗略估计集数，通常每集是 名称$url
                $episodeCount = $urlCount > 0 ? ($urlCount + 1) / 2 : 1; 
                // 或者直接按 # 分割统计播放列表数
                $playlistCount = substr_count($playFrom, '$$$') + 1;
                
                echo "    - 播放列表数据长度: " . strlen($playUrl) . " 字符\n";
                // 简单展示部分播放链接
                $previewUrl = mb_substr($playUrl, 0, 50) . '...';
                echo "    - 播放链接预览: $previewUrl\n";
            } else {
                echo "    ⚠️ 警告: vod_play_url 为空!\n";
            }

            if (!empty($desc)) {
                echo "    - 简介长度: " . mb_strlen($desc) . " 字\n";
            }

        } else {
            echo "    ❌ 失败: 未返回详情数据\n";
        }
    } else {
        echo ">>> [3/5] 测试详情接口: ⏭️ 跳过 (未找到有效的资源ID)\n";
    }

    echo "\n";

    // --- 4. 测试搜索接口 (Search Interface) ---
    // 使用之前获取到的 vodName 进行搜索，如果没有则使用默认关键词 "爱"
    $searchKey = $vodName ?: "爱";
    echo ">>> [4/5] 测试搜索接口 (searchContent) - 关键词: [$searchKey]\n";
    
    try {
        $startTime = microtime(true);
        $searchRes = $spider->searchContent($searchKey, false, 1);
        $cost = round((microtime(true) - $startTime) * 1000, 2);
        
        $searchList = $searchRes['list'] ?? [];
        if (!empty($searchList)) {
            echo "    ✅ 通过 (耗时: {$cost}ms)\n";
            echo "    - 搜索到 " . count($searchList) . " 个结果\n";
            $firstSearch = $searchList[0];
            echo "    - 第一条结果: " . ($firstSearch['vod_name'] ?? '未知') . "\n";
        } else {
            echo "    ⚠️ 警告: 搜索未返回结果 (但这不代表接口错误)\n";
        }
    } catch (Throwable $e) {
        echo "    ⚠️ 异常: 搜索接口调用失败 (允许失败)\n";
        echo "    错误信息: " . $e->getMessage() . "\n";
    }

    echo "\n";

    // --- 5. 测试播放接口 (Player Interface) ---
    if ($playUrl && $playFrom) {
        // 解析播放链接，取第一组的第一个链接
        // 格式通常是: 播放源1$$$集数1$链接1#集数2$链接2...$$$播放源2...
        // 或者是: 集数1$链接1#集数2$链接2...
        
        // 简单处理：先按 $$$ 分割取第一个播放源对应的链接串
        $playUrls = explode('$$$', $playUrl);
        $currentUrlBlock = $playUrls[0] ?? '';
        
        // 再按 # 分割取第一集
        $episodes = explode('#', $currentUrlBlock);
        $firstEp = $episodes[0] ?? '';
        
        // 再按 $ 分割取链接 (通常是 名称$链接)
        $parts = explode('$', $firstEp);
        $targetUrl = end($parts); // 取最后一部分作为链接
        
        // 播放源flag
        $playFroms = explode('$$$', $playFrom);
        $flag = $playFroms[0] ?? 'default';

        echo ">>> [5/5] 测试播放接口 (playerContent) - Flag: [$flag]\n";
        echo "    - 目标链接: $targetUrl\n";

        try {
            $startTime = microtime(true);
            // $flag, $id, $vipFlags
            $playerRes = $spider->playerContent($flag, $targetUrl, []); 
            $cost = round((microtime(true) - $startTime) * 1000, 2);
            
            if (!empty($playerRes)) {
                echo "    ✅ 通过 (耗时: {$cost}ms)\n";
                // 打印返回的关键字段
                $parse = $playerRes['parse'] ?? 'N/A';
                $url = $playerRes['url'] ?? 'N/A';
                $header = $playerRes['header'] ?? 'N/A';
                
                echo "    - Parse: $parse\n";
                echo "    - PlayUrl: $url\n";
                if (is_array($header)) {
                    echo "    - Header: " . json_encode($header, JSON_UNESCAPED_UNICODE) . "\n";
                }
            } else {
                echo "    ⚠️ 警告: 播放接口返回为空\n";
            }
        } catch (Throwable $e) {
            echo "    ⚠️ 异常: 播放接口调用失败 (允许失败)\n";
            echo "    错误信息: " . $e->getMessage() . "\n";
        }
    } else {
        echo ">>> [5/5] 测试播放接口: ⏭️ 跳过 (未获取到有效的播放链接或播放源信息)\n";
    }

} catch (Throwable $e) {
    echo "\n⛔ 严重错误 (CRITICAL ERROR):\n";
    echo "    信息: " . $e->getMessage() . "\n";
    echo "    位置: " . $e->getFile() . " 第 " . $e->getLine() . " 行\n";
    echo "    堆栈:\n" . $e->getTraceAsString() . "\n";
}

echo "==================================================\n";
echo "测试结束\n";
