<?php
/**
 * 麻衣AV T4 接口脚本 (适配 MacCMS 架构)
 * 功能：分类、列表、搜索、详情、解密播放
 */

header('Content-Type: application/json; charset=utf-8');

// --- 配置区 ---
$host = "https://tellnf.com"; 
$ua = 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36';

/**
 * 通用网络请求函数
 */
function fetch($url, $ua, $referer = "") {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, $ua);
    if ($referer) curl_setopt($ch, CURLOPT_REFERER, $referer);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    $output = curl_exec($ch);
    curl_close($ch);
    return $output;
}

/**
 * 列表解析核心 (正则适配)
 */
function parse_vod_list($html) {
    $vods = [];
    // 匹配模板中的视频卡片
    preg_match_all('/videoListStyle.*?id\/(\d+)\.html".*?src="([^"]+)".*?title">(.*?)<\/p>/s', $html, $matches, PREG_SET_ORDER);
    
    foreach ($matches as $m) {
        $vods[] = [
            "vod_id" => $m[1],
            "vod_name" => trim(strip_tags($m[3])),
            "vod_pic" => $m[2],
            "vod_remarks" => "" 
        ];
    }
    return $vods;
}

// --- 参数获取 ---
$ac = $_GET['ac'] ?? null;
$t = $_GET['t'] ?? null;
$pg = $_GET['pg'] ?? '1';
$ids = $_GET['ids'] ?? null;
$wd = $_GET['wd'] ?? null;
$play = $_GET['play'] ?? null;
$filter = $_GET['filter'] ?? null;

// ============================================================================
// 1. 分类/筛选定义 (T4 标准)
// ============================================================================
if ($filter !== null) {
    echo json_encode([
        'class' => [
            ['type_id' => '1', 'type_name' => '国产AV'],
            ['type_id' => '41', 'type_name' => '日韩AV'],
            ['type_id' => '3', 'type_name' => '欧美AV'],
            ['type_id' => '23', 'type_name' => '国产精品'],
            ['type_id' => '45', 'type_name' => '91精选'],
            ['type_id' => '47', 'type_name' => '乱伦系列'],
            ['type_id' => '48', 'type_name' => '探花约炮'],
            ['type_id' => '49', 'type_name' => '主播诱惑'],
            ['type_id' => '50', 'type_name' => '网曝吃瓜'],
            ['type_id' => '51', 'type_name' => '传媒剧情'],
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 2. 列表与搜索接口
// ============================================================================
if (($ac === 'detail' && $t !== null) || $wd !== null) {
    if ($wd) {
        // 搜索逻辑
        $url = "$host/index.php/vod/search/wd/" . urlencode($wd) . "/page/$pg.html";
    } else {
        // 分类逻辑
        $url = "$host/index.php/vod/type/id/$t/page/$pg.html";
    }
    
    $html = fetch($url, $ua);
    $vods = parse_vod_list($html);
    
    echo json_encode([
        'page' => (int)$pg,
        'pagecount' => (int)$pg + 1,
        'list' => $vods
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 3. 详情接口 (获取播放列表)
// ============================================================================
if ($ac === 'detail' && $ids !== null) {
    $detail_url = "$host/index.php/vod/detail/id/$ids.html";
    $html = fetch($detail_url, $ua);
    
    preg_match('/<title>(.*?)<\/title>/', $html, $title_match);
    // 提取封面图
    preg_match('/van-image__img".*?src="([^"]+)"/', $html, $pic_match);
    
    // 构造 MacCMS 默认播放链接
    $play_url = "立即播放$" . "$host/index.php/vod/play/id/$ids/sid/1/nid/1.html";

    echo json_encode([
        'list' => [[
            "vod_id" => $ids,
            "vod_name" => $title_match[1] ?? "未知视频",
            "vod_pic" => $pic_match[1] ?? "",
            "vod_play_from" => "麻衣专线",
            "vod_play_url" => $play_url
        ]]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 4. 播放解密接口 (破解 player_aaaa 加密)
// ============================================================================
if ($play !== null) {
    // $play 此时是播放页 URL
    $html = fetch($play, $ua);
    
    // 匹配页面中的 player_aaaa 变量
    if (preg_match('/player_aaaa\s*=\s*(\{.*?\});/', $html, $matches)) {
        $config = json_decode($matches[1], true);
        $video_raw = $config['url'] ?? '';
        $encrypt = $config['encrypt'] ?? '0';

        // 核心解密逻辑：对应 MacPlayer.Init 中的逻辑
        if ($encrypt == '1') {
            // 类型 1: 直接 unescape (PHP 中使用 urldecode)
            $final_url = urldecode($video_raw);
        } elseif ($encrypt == '2') {
            // 类型 2: Base64 解码后再 unescape
            $final_url = urldecode(base64_decode($video_raw));
        } else {
            // 类型 0: 无加密
            $final_url = $video_raw;
        }

        // 补全相对路径
        if (!empty($final_url) && strpos($final_url, 'http') !== 0) {
            $final_url = $host . $final_url;
        }

        echo json_encode([
            'parse' => 0,          // 直链输出
            'url' => $final_url,
            'header' => [
                'User-Agent' => $ua,
                'Referer' => $host // 必须带上来源，否则视频服务器会 403
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // 兜底返回原链接
    echo json_encode(['parse' => 1, 'url' => $play]);
    exit;
}

// 默认说明
echo json_encode(['status' => 'MayiAV T4 API Running']);

