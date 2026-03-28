<?php
/**
 * T4 爬虫示例脚本 - Android 版本
 * 
 * 演示 T4 类型爬虫的标准接口实现
 * 这是一个模板，您可以基于此开发自己的爬虫
 */

header('Content-Type: application/json; charset=utf-8');

// 获取请求参数
$filter = $_GET['filter'] ?? null;
$ac = $_GET['ac'] ?? null;
$t = $_GET['t'] ?? null;
$pg = $_GET['pg'] ?? '1';
$ids = $_GET['ids'] ?? null;
$wd = $_GET['wd'] ?? null;
$flag = $_GET['flag'] ?? null;
$play = $_GET['play'] ?? null;
$ext = $_GET['ext'] ?? null;

// 解码 ext 参数（Base64 编码的 JSON）
$extData = [];
if ($ext) {
    $extJson = base64_decode($ext);
    if ($extJson) {
        $extData = json_decode($extJson, true) ?: [];
    }
}

// ============================================================================
// 首页/分类接口
// ============================================================================
if ($filter !== null) {
    echo json_encode([
        'class' => [
            ['type_id' => '1', 'type_name' => '电影'],
            ['type_id' => '2', 'type_name' => '电视剧'],
            ['type_id' => '3', 'type_name' => '综艺'],
            ['type_id' => '4', 'type_name' => '动漫'],
        ],
        'filters' => [
            '1' => [
                [
                    'key' => 'year',
                    'name' => '年份',
                    'value' => [
                        ['n' => '全部', 'v' => ''],
                        ['n' => '2024', 'v' => '2024'],
                        ['n' => '2023', 'v' => '2023'],
                        ['n' => '2022', 'v' => '2022'],
                    ]
                ],
                [
                    'key' => 'area',
                    'name' => '地区',
                    'value' => [
                        ['n' => '全部', 'v' => ''],
                        ['n' => '大陆', 'v' => '大陆'],
                        ['n' => '香港', 'v' => '香港'],
                        ['n' => '美国', 'v' => '美国'],
                    ]
                ]
            ]
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 分类列表
// ============================================================================
if ($ac === 'detail' && $t !== null) {
    $page = (int)$pg;
    $pageSize = 20;
    
    // 模拟数据
    $list = [];
    for ($i = 1; $i <= $pageSize; $i++) {
        $id = ($page - 1) * $pageSize + $i;
        $list[] = [
            'vod_id' => (string)$id,
            'vod_name' => "示例影片 $id",
            'vod_pic' => 'https://via.placeholder.com/300x400',
            'vod_remarks' => '第' . rand(1, 20) . '集',
            'vod_year' => (string)(2020 + rand(0, 4)),
        ];
    }
    
    echo json_encode([
        'page' => $page,
        'pagecount' => 10,
        'limit' => $pageSize,
        'total' => 200,
        'list' => $list
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 详情接口
// ============================================================================
if ($ac === 'detail' && $ids !== null) {
    echo json_encode([
        'list' => [
            [
                'vod_id' => $ids,
                'vod_name' => '示例电影',
                'vod_pic' => 'https://via.placeholder.com/300x400',
                'vod_year' => '2024',
                'vod_area' => '中国',
                'vod_director' => '导演名',
                'vod_actor' => '演员A,演员B,演员C',
                'vod_content' => '这是一部精彩的示例电影，讲述了一个引人入胜的故事...',
                'vod_play_from' => '线路一$$$线路二$$$线路三',
                'vod_play_url' => implode('$$$', [
                    '第1集$https://example.com/ep1.m3u8#第2集$https://example.com/ep2.m3u8#第3集$https://example.com/ep3.m3u8',
                    '第1集$https://backup1.com/ep1.m3u8#第2集$https://backup1.com/ep2.m3u8#第3集$https://backup1.com/ep3.m3u8',
                    '第1集$https://backup2.com/ep1.m3u8#第2集$https://backup2.com/ep2.m3u8#第3集$https://backup2.com/ep3.m3u8',
                ])
            ]
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 搜索接口
// ============================================================================
if ($wd !== null) {
    $results = [];
    for ($i = 1; $i <= 10; $i++) {
        $results[] = [
            'vod_id' => (string)(1000 + $i),
            'vod_name' => "搜索结果: $wd ($i)",
            'vod_pic' => 'https://via.placeholder.com/300x400',
            'vod_remarks' => 'HD',
            'vod_year' => '2024',
        ];
    }
    
    echo json_encode([
        'page' => 1,
        'pagecount' => 1,
        'list' => $results
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 播放解析
// ============================================================================
if ($flag !== null && $play !== null) {
    // 这里可以实现实际的解析逻辑
    // 例如：调用第三方解析接口、提取真实播放地址等
    
    echo json_encode([
        'parse' => 0,  // 0=直链, 1=需要解析
        'url' => $play,  // 直接返回原始 URL
        'header' => [
            'User-Agent' => 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
            'Referer' => 'https://example.com/'
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 默认响应
// ============================================================================
echo json_encode([
    'error' => '未知请求',
    'params' => $_GET,
    'info' => [
        'name' => 'T4 示例爬虫',
        'version' => '1.0.0',
        'platform' => 'Android',
        'php_version' => PHP_VERSION
    ]
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);


