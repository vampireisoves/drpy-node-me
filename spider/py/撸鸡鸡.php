<?php
/**
 * T4 爬虫 - 撸鸡鸡标准修复版
 * 修复：type cast 错误 (List/Map 兼容性)
 * 适配：2026年1月新版测试器
 */

header('Content-Type: application/json; charset=utf-8');

$site = [
    'domain'     => 'https://lujjs.com', 
    'ua'         => 'Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36',
    'referer'    => 'https://lujjs.com/',
    'page_size'  => 20,
];

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

// 参数解析
$ac     = $_GET['ac']    ?? '';
$t      = $_GET['t']     ?? null;
$pg     = (int)($_GET['pg'] ?? 1);
$ids    = $_GET['ids']   ?? null;
$wd     = $_GET['wd']    ?? null;
$flag   = $_GET['flag']  ?? null;
$play   = $_GET['play']  ?? null;

// ============================================================================
// 1. 首页分类 & 筛选 (?filter=true 或 初始化)
// ============================================================================
if (empty($ac) && empty($wd) && empty($play)) {
    echo json_encode([
        'class' => [
            ['type_id' => '1',  'type_name' => '国产精品'],
            ['type_id' => '2',  'type_name' => '亚洲综合'],
            ['type_id' => '13', 'type_name' => '日本有码'],
            ['type_id' => '14', 'type_name' => '日本无码'],
            ['type_id' => '22', 'type_name' => '国产乱伦'],
            ['type_id' => '24', 'type_name' => '日韩主播'],
            ['type_id' => '30', 'type_name' => 'SM调教'],
            ['type_id' => '40', 'type_name' => '制服丝袜'],
            ['type_id' => '42', 'type_name' => '网红流出'],
            ['type_id' => '51', 'type_name' => '少女破处'],
            ['type_id' => '7',  'type_name' => '国产原创'],
            ['type_id' => '9',  'type_name' => '主播网红'],
            ['type_id' => '20', 'type_name' => '国产自拍'],
            ['type_id' => '21', 'type_name' => '偷拍偷窥'],
            ['type_id' => '23', 'type_name' => '抖阴短片'],
            ['type_id' => '35', 'type_name' => '漫改系列'],
            ['type_id' => '46', 'type_name' => '韩国御姐'],
        ],
        'filters' => (object)[] // 必须是对象 {}
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 2. 分类列表 (?ac=detail&t=xx&pg=1)
// ============================================================================
if ($ac === 'detail' && $t !== null && $ids === null) {
    $url = "{$site['domain']}/index.php/vod/type/id/$t.html?page=$pg";
    $html = fetch($url);

    preg_match_all('/<li class="stui-vodlist__item">.*?<a.*?href="\/index\.php\/vod\/detail\/id\/(\d+)\.html".*?title="([^"]+)".*?data-original="([^"]+)"/s', $html, $matches, PREG_SET_ORDER);

    $list = [];
    foreach ($matches as $m) {
        $list[] = [
            'vod_id'      => $m[1],
            'vod_name'    => trim(html_entity_decode($m[2])),
            'vod_pic'     => strpos($m[3], 'http') === 0 ? $m[3] : "https:" . $m[3],
            'vod_remarks' => 'HD',
        ];
    }

    preg_match('/<a href="[^"]*page=(\d+)"[^>]*>尾页<\/a>/', $html, $last);
    $pagecount = !empty($last[1]) ? (int)$last[1] : 50;

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
// 3. 详情接口 (?ac=detail&ids=xxx)
// ============================================================================
if ($ac === 'detail' && $ids !== null) {
    $url = "{$site['domain']}/index.php/vod/detail/id/$ids.html";
    $html = fetch($url);

    preg_match('/<title>(.*?)在线播放--撸鸡鸡<\/title>/', $html, $tm);
    $vod_name = trim($tm[1] ?? "视频 $ids");

    preg_match('/data-original="([^"]+\.(?:png|jpg|jpeg|webp))"/', $html, $pm);
    $vod_pic = !empty($pm[1]) ? (strpos($pm[1], 'http') === 0 ? $pm[1] : "https:" . $pm[1]) : '';

    $play_url = "/index.php/vod/play/id/$ids/sid/1/nid/1.html";

    echo json_encode([
        'list' => [[
            'vod_id'        => $ids,
            'vod_name'      => $vod_name,
            'vod_pic'       => $vod_pic,
            'vod_play_from' => 'iframe',
            'vod_play_url'  => $play_url,
            'vod_content'   => '撸鸡鸡源 - 视频详情',
        ]]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 4. 搜索接口 (?wd=关键词)
// ============================================================================
if ($wd !== null) {
    $url = "{$site['domain']}/index.php/vod/search/wd/" . urlencode($wd) . ".html";
    $html = fetch($url);

    preg_match_all('/<li class="stui-vodlist__item">.*?<a.*?href="\/index\.php\/vod\/detail\/id\/(\d+)\.html".*?title="([^"]+)".*?data-original="([^"]+)"/s', $html, $matches, PREG_SET_ORDER);

    $list = [];
    foreach ($matches as $m) {
        $list[] = [
            'vod_id'      => $m[1],
            'vod_name'    => trim(html_entity_decode($m[2])),
            'vod_pic'     => strpos($m[3], 'http') === 0 ? $m[3] : "https:" . $m[3],
            'vod_remarks' => 'HD',
        ];
    }

    echo json_encode(['list' => $list], JSON_UNESCAPED_UNICODE);
    exit;
}

// ============================================================================
// 5. 播放解析 (?flag=iframe&play=路径)
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

