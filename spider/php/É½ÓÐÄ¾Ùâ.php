<?php
/**
 * 山有木兮 - PHP 适配版
 * 按照麻雀视频的结构重写
 */

header('Content-Type: application/json; charset=utf-8');
error_reporting(0);

// ================= 全局配置 =================
$HOST = 'https://film.symx.club';
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36';

// ================= 核心函数 =================

function fetch($url, $referer = '/') {
    global $HOST, $UA;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: ' . $UA,
        'Accept: application/json, text/plain, */*',
        'Accept-Language: zh-CN,zh;q=0.9',
        'Cache-Control: no-cache',
        'Pragma: no-cache',
        'Sec-Ch-Ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'Sec-Ch-Ua-Mobile: ?0',
        'Sec-Ch-Ua-Platform: "Windows"',
        'Sec-Fetch-Dest: empty',
        'Sec-Fetch-Mode: cors',
        'Sec-Fetch-Site: same-origin',
        'X-Platform: web',
        'Referer: ' . $HOST . $referer
    ]);
    $data = curl_exec($ch);
    curl_close($ch);
    return $data;
}

// ================= 路由逻辑 =================

$ac = $_GET['ac'] ?? null;
$t = $_GET['t'] ?? null; // 分类ID
$pg = $_GET['pg'] ?? '1';
$wd = $_GET['wd'] ?? null;
$ids = $_GET['ids'] ?? null;
$play = $_GET['play'] ?? null; // 格式: lineId

// 1. 播放解析 (对应JS的play函数)
if ($play !== null) {
    $lineId = $play;
    $url = $HOST . "/api/line/play/parse?lineId=" . urlencode($lineId);
    $data = fetch($url, '/');
    $json = json_decode($data, true);
    
    $playUrl = $json['data'] ?? '';
    
    echo json_encode([
        'parse' => 0,
        'url' => $playUrl,
        'header' => ['User-Agent' => $UA]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. 视频详情 (对应JS的detail函数)
if (!empty($ids)) {
    $id = $ids;
    $url = $HOST . "/api/film/detail?id=" . urlencode($id);
    $data = fetch($url, '/');
    $json = json_decode($data, true);
    
    if (!isset($json['data'])) {
        echo json_encode(['list' => []], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $data = $json['data'];
    $shows = [];
    $play_urls = [];
    
    // 处理播放线路
    foreach ($data['playLineList'] as $line) {
        $shows[] = $line['playerName'];
        $urls = [];
        foreach ($line['lines'] as $episode) {
            $urls[] = $episode['name'] . '$' . $episode['id'];
        }
        $play_urls[] = implode('#', $urls);
    }
    
    $vod = [
        'vod_id' => $ids,
        'vod_name' => $data['name'],
        'vod_pic' => $data['cover'],
        'vod_year' => $data['year'],
        'vod_area' => $data['other'],
        'vod_actor' => $data['actor'],
        'vod_director' => $data['director'],
        'vod_content' => $data['blurb'],
        'vod_score' => $data['doubanScore'],
        'vod_play_from' => implode('$$$', $shows),
        'vod_play_url' => implode('$$$', $play_urls),
        'type_name' => $data['vod_class'] ?? ''
    ];
    
    echo json_encode(['list' => [$vod]], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. 搜索 (对应JS的search函数)
if (!empty($wd)) {
    $pageNum = intval($pg);
    if ($pageNum < 1) $pageNum = 1;
    
    $url = $HOST . "/api/film/search?keyword=" . urlencode($wd) . "&pageNum={$pageNum}&pageSize=10";
    $data = fetch($url, '/');
    $json = json_decode($data, true);
    
    $list = [];
    if (isset($json['data']['list'])) {
        foreach ($json['data']['list'] as $item) {
            $list[] = [
                'vod_id' => strval($item['id']),
                'vod_name' => $item['name'],
                'vod_pic' => $item['cover'],
                'vod_remarks' => $item['updateStatus'],
                'vod_year' => $item['year'],
                'vod_area' => $item['area'],
                'vod_director' => $item['director']
            ];
        }
    }
    
    echo json_encode(['list' => $list, 'page' => $pageNum], JSON_UNESCAPED_UNICODE);
    exit;
}

// 4. 分类列表 (对应JS的category函数)
if (!empty($t)) {
    $tid = $t;
    $pageNum = intval($pg);
    if ($pageNum < 1) $pageNum = 1;
    
    $url = $HOST . "/api/film/category/list?area=&categoryId={$tid}&language=&pageNum={$pageNum}&pageSize=15&sort=updateTime&year=";
    $data = fetch($url, '/');
    $json = json_decode($data, true);
    
    $list = [];
    if (isset($json['data']['list'])) {
        foreach ($json['data']['list'] as $item) {
            $list[] = [
                'vod_id' => strval($item['id']),
                'vod_name' => $item['name'],
                'vod_pic' => $item['cover'],
                'vod_remarks' => $item['updateStatus']
            ];
        }
    }
    
    echo json_encode(['list' => $list, 'page' => $pageNum], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. 首页推荐 (对应JS的homeVod函数)
if ($ac === 'homeVod') {
    $url = $HOST . "/api/film/category";
    $data = fetch($url, '/');
    $json = json_decode($data, true);
    
    $list = [];
    foreach ($json['data'] as $category) {
        $filmList = $category['filmList'] ?? [];
        foreach ($filmList as $film) {
            $list[] = [
                'vod_id' => strval($film['id']),
                'vod_name' => $film['name'],
                'vod_pic' => $film['cover'],
                'vod_remarks' => $film['doubanScore'] ?? ''
            ];
        }
    }
    
    // 限制数量
    $list = array_slice($list, 0, 30);
    
    echo json_encode(['list' => $list], JSON_UNESCAPED_UNICODE);
    exit;
}

// 6. 首页分类 (对应JS的home函数)
if ($ac === 'home') {
    $url = $HOST . "/api/category/top";
    $data = fetch($url, '/');
    $json = json_decode($data, true);
    
    $classes = [];
    foreach ($json['data'] as $item) {
        $classes[] = [
            'type_id' => strval($item['id']),
            'type_name' => $item['name']
        ];
    }
    
    echo json_encode(['class' => $classes], JSON_UNESCAPED_UNICODE);
    exit;
}

// 7. 初始化 (对应JS的init函数)
if ($ac === 'init') {
    $ext = $_GET['ext'] ?? '';
    if (!empty($ext) && strpos($ext, 'http') === 0) {
        $HOST = rtrim($ext, '/');
    }
    
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

// 8. 默认首页 (返回分类和推荐)
$url = $HOST . "/api/category/top";
$data = fetch($url, '/');
$json = json_decode($data, true);

$classes = [];
foreach ($json['data'] as $item) {
    $classes[] = [
        'type_id' => strval($item['id']),
        'type_name' => $item['name']
    ];
}

// 获取推荐视频
$url2 = $HOST . "/api/film/category";
$data2 = fetch($url2, '/');
$json2 = json_decode($data2, true);

$list = [];
foreach ($json2['data'] as $category) {
    $filmList = $category['filmList'] ?? [];
    foreach ($filmList as $film) {
        $list[] = [
            'vod_id' => strval($film['id']),
            'vod_name' => $film['name'],
            'vod_pic' => $film['cover'],
            'vod_remarks' => $film['doubanScore'] ?? ''
        ];
    }
}

$list = array_slice($list, 0, 30);

echo json_encode([
    'class' => $classes,
    'list' => $list
], JSON_UNESCAPED_UNICODE);