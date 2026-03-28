<?php
/**
 * T4 爬蟲 - 吉利猫成人网站 (gckgg.com / child 路徑)
 * 適配修正：解決 JSON 類型不匹配導致的測試失敗
 * 2026年1月修復版
 */

header('Content-Type: application/json; charset=utf-8');

// 站點配置
$site = [
    'domain'     => 'https://gckgg.com',  
    'base_path'  => '/child',             
    'ua'         => 'Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36',
    'referer'    => 'https://gckgg.com/',
    'page_size'  => 20,
];

// 通用 fetch
function fetch($url) {
    global $site;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_FOLLOWLOCATION => 1,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_USERAGENT      => $site['ua'],
        CURLOPT_REFERER        => $site['referer'],
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $html = curl_exec($ch);
    curl_close($ch);
    return $html ?: '';
}

// 參數獲取
$ac   = $_GET['ac']   ?? '';
$t    = $_GET['t']    ?? null;
$pg   = (int)($_GET['pg'] ?? 1);
$ids  = $_GET['ids']  ?? null;
$wd   = $_GET['wd']   ?? null;
$flag = $_GET['flag'] ?? null;
$play = $_GET['play'] ?? null;

// ============================================================================
// 1. 分類接口 (?filter=true) - 已修正類型錯誤
// ============================================================================
if (isset($_GET['filter'])) {
    echo json_encode([
        'class' => [
            ['type_id' => '26', 'type_name' => '色情主播'],
            ['type_id' => '1',  'type_name' => '国产av'],
            ['type_id' => '2',  'type_name' => '91精选'],
            ['type_id' => '10', 'type_name' => '日韩自拍'],
            ['type_id' => '11', 'type_name' => '日本无码'],
            ['type_id' => '12', 'type_name' => '中文字幕'],
            ['type_id' => '13', 'type_name' => '色情动漫'],
            ['type_id' => '16', 'type_name' => '无码字幕'],
            ['type_id' => '18', 'type_name' => '欧美av'],
            ['type_id' => '33', 'type_name' => '18禁重口味'],
            ['type_id' => '29', 'type_name' => '偷拍偷窥'],
            ['type_id' => '27', 'type_name' => '网爆吃瓜'],
            ['type_id' => '28', 'type_name' => '传媒a片'],
            ['type_id' => '25', 'type_name' => '探花约炮'],
            ['type_id' => '31', 'type_name' => '三级伦理'],
            ['type_id' => '30', 'type_name' => 'av解说'],
        ],
        'filters' => (object)[]  // 關鍵修復：強制輸出 {} 而非 []
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 2. 分類列表 (?ac=detail&t=xx&pg=1)
// ============================================================================
if ($ac === 'detail' && $t !== null && $ids === null) {
    $url = "{$site['domain']}{$site['base_path']}/index.php/vod/type/id/$t.html?page=$pg";
    $html = fetch($url);

    // 解析影片列表 - 增加容錯性
    preg_match_all('/<div class="item">.*?href="([^"]+\/id\/(\d+)[^"]*)".*?title="([^"]+)".*?data-src="([^"]+)"/s', $html, $matches, PREG_SET_ORDER);

    $list = [];
    foreach ($matches as $m) {
        $list[] = [
            'vod_id'      => $m[2],
            'vod_name'    => trim(html_entity_decode($m[3])),
            'vod_pic'     => (strpos($m[4], 'http') === 0) ? $m[4] : "https:" . $m[4],
            'vod_remarks' => 'HD',
        ];
    }

    // 解析分頁 (嘗試從 HTML 提取最後一頁)
    $pagecount = $pg;
    if (preg_match('/page=(\d+)">尾页/', $html, $pm)) {
        $pagecount = (int)$pm[1];
    } elseif (count($list) >= $site['page_size']) {
        $pagecount = $pg + 1; // 簡單估計
    }

    echo json_encode([
        'page'      => $pg,
        'pagecount' => $pagecount,
        'limit'     => $site['page_size'],
        'total'     => $pagecount * $site['page_size'],
        'list'      => $list
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 3. 詳情接口 (?ac=detail&ids=xxx)
// ============================================================================
if ($ac === 'detail' && $ids !== null) {
    $url = "{$site['domain']}{$site['base_path']}/index.php/vod/detail/id/$ids.html";
    $html = fetch($url);

    preg_match('/<h1 class="title">(.*?)<\/h1>/', $html, $tm) || preg_match('/<title>(.*?)<\/title>/', $html, $tm);
    $vod_name = trim(html_entity_decode($tm[1] ?? "视频 $ids"));

    preg_match('/<meta property="og:image" content="([^"]+)"/', $html, $pm) || preg_match('/data-src="([^"]+\.(?:jpg|webp|png))"/', $html, $pm);
    $vod_pic = !empty($pm[1]) ? (strpos($pm[1], 'http') === 0 ? $pm[1] : "https:" . $pm[1]) : '';

    // 播放路徑
    $play_url = "{$site['base_path']}/index.php/vod/play/id/$ids/sid/1/nid/1.html";

    echo json_encode([
        'list' => [[
            'vod_id'        => $ids,
            'vod_name'      => $vod_name,
            'vod_pic'       => $vod_pic,
            'vod_year'      => '2026',
            'vod_area'      => '海外',
            'vod_content'   => '吉利猫提供，請注意網絡安全。',
            'vod_play_from' => 'iframe',
            'vod_play_url'  => $play_url,
        ]]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 4. 搜索接口 (?wd=關鍵詞)
// ============================================================================
if ($wd !== null) {
    $url = "{$site['domain']}{$site['base_path']}/index.php/vod/search/wd/" . urlencode($wd) . ".html";
    $html = fetch($url);

    preg_match_all('/<div class="item">.*?href="([^"]+\/id\/(\d+)[^"]*)".*?title="([^"]+)".*?data-src="([^"]+)"/s', $html, $matches, PREG_SET_ORDER);

    $list = [];
    foreach ($matches as $m) {
        $list[] = [
            'vod_id'      => $m[2],
            'vod_name'    => trim(html_entity_decode($m[3])),
            'vod_pic'     => (strpos($m[4], 'http') === 0) ? $m[4] : "https:" . $m[4],
            'vod_remarks' => '搜索結果',
        ];
    }

    echo json_encode([
        'page'      => 1,
        'pagecount' => 1,
        'limit'     => count($list),
        'total'     => count($list),
        'list'      => $list
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 5. 播放解析 (?flag=iframe&play=路徑)
// ============================================================================
if ($flag === 'iframe' && $play) {
    echo json_encode([
        'parse'  => 1,
        'url'    => $site['domain'] . $play,
        'header' => [
            'Referer'    => $site['referer'],
            'User-Agent' => $site['ua']
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 默認返回（主頁信息）
echo json_encode([
    'code' => 1,
    'msg'  => '吉利猫 T4 接口運行中',
    'info' => [
        'name' => '吉利猫',
        'ver'  => '1.1.0'
    ]
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

