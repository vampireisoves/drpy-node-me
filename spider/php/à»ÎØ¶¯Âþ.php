<?php
/**
 * 嗷呜动漫 - T4 Android 最终适配版
 * 1. [核心] 分类接口使用 POST 请求 /index.php/ds_api/vod (解决无数据问题)
 * 2. [修改] 播放逻辑：删除解密，直接嗅探 (parse:1)
 * 3. [新增] 筛选功能 (剧情、年份、排序) 支持
 */

header('Content-Type: application/json; charset=utf-8');
error_reporting(0);

// ================= 全局配置 =================
$HOST = 'https://www.aowu.tv';
// 使用手机 UA 防止拦截
$UA = 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36';

$HEADERS = [
    'User-Agent: ' . $UA,
    'Referer: ' . $HOST
];

// ================= 工具函数 =================

function fetch($url, $method = 'GET', $postData = [], $customHeaders = []) {
    global $HEADERS;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_ENCODING, 'gzip, deflate');
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $finalHeaders = array_merge($HEADERS, $customHeaders);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $finalHeaders);

    if (strtoupper($method) === 'POST') {
        curl_setopt($ch, CURLOPT_POST, 1);
        if (is_array($postData)) {
            $postData = http_build_query($postData);
        }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    }

    $data = curl_exec($ch);
    curl_close($ch);
    return $data;
}

function fixUrl($url) {
    global $HOST;
    if (empty($url)) return '';
    if (strpos($url, '//') === 0) return 'https:' . $url;
    if (strpos($url, '/') === 0) return $HOST . $url;
    if (strpos($url, 'http') !== 0) return $HOST . '/' . $url;
    return $url;
}

// 筛选配置 (参照 JS 源码配置)
function getFilters() {
    $classes = ['搞笑','恋爱','校园','后宫','治愈','日常','原创','战斗','百合','BL','卖肉','漫画改','游戏改','异世界','泡面番','轻小说改','OVA','OAD','京阿尼','芳文社','A-1Pictures','CloverWorks','J.C.STAFF','动画工房','SUNRISE','Production.I.G','MADHouse','BONES','P.A.WORKS','SHAFT','MAPPA','ufotable','TRIGGER','WITSTUDIO'];
    
    $years = [];
    for ($i = 2026; $i >= 1990; $i--) $years[] = (string)$i;
    
    // 构建筛选结构
    $classValues = [['n' => '全部', 'v' => '']];
    foreach ($classes as $c) $classValues[] = ['n' => $c, 'v' => $c];
    
    $yearValues = [['n' => '全部', 'v' => '']];
    foreach ($years as $y) $yearValues[] = ['n' => $y, 'v' => $y];
    
    $sortValues = [
        ['n' => '按最新', 'v' => 'time'],
        ['n' => '按最热', 'v' => 'hits'],
        ['n' => '按评分', 'v' => 'score']
    ];

    $rules = [
        ['key' => 'class', 'name' => '剧情', 'value' => $classValues],
        ['key' => 'year', 'name' => '年份', 'value' => $yearValues],
        ['key' => 'by', 'name' => '排序', 'value' => $sortValues]
    ];

    // 应用到所有分类
    return [
        '20' => $rules,
        '21' => $rules,
        '22' => $rules
    ];
}

// 解析 HTML 列表 (首页/搜索用)
function parseHtmlList($html, $isSearch = false) {
    $videos = [];
    if (!$html) return $videos;

    $pattern = $isSearch 
        ? '/<div class="search-list[^"]*">(.*?)<div class="right">/is' 
        : '/<div class="public-list-box[^"]*">(.*?)<\/div>\s*<\/div>/is';
        
    preg_match_all($pattern, $html, $matches);
    
    if (!empty($matches[1])) {
        foreach ($matches[1] as $itemHtml) {
            if (!preg_match('/href="([^"]+)"/', $itemHtml, $m)) continue;
            $href = $m[1];
            
            $title = '';
            if (preg_match('/alt="([^"]+)"/', $itemHtml, $m)) $title = $m[1];
            elseif (preg_match('/title="([^"]+)"/', $itemHtml, $m)) $title = $m[1];
            
            $pic = '';
            if (preg_match('/data-src="([^"]+)"/', $itemHtml, $m)) $pic = $m[1];
            elseif (preg_match('/src="([^"]+)"/', $itemHtml, $m)) $pic = $m[1];
            
            $remarks = '';
            if (preg_match('/<span class="public-list-prb[^"]*">([^<]+)<\/span>/', $itemHtml, $m)) {
                $remarks = strip_tags($m[1]);
            } elseif (preg_match('/<span class="public-prt"[^>]*>([^<]+)<\/span>/', $itemHtml, $m)) {
                $remarks = strip_tags($m[1]);
            }

            if ($title) {
                $videos[] = [
                    'vod_id' => fixUrl($href),
                    'vod_name' => trim($title),
                    'vod_pic' => fixUrl($pic),
                    'vod_remarks' => trim($remarks)
                ];
            }
        }
    }
    return $videos;
}

// ================= 参数接收 =================
$ac = $_GET['ac'] ?? null;
$t = $_GET['t'] ?? null;
$pg = $_GET['pg'] ?? '1';
$ids = $_GET['ids'] ?? null;
$wd = $_GET['wd'] ?? null;
$play = $_GET['play'] ?? null;
$flag = $_GET['flag'] ?? null;
$ext = $_GET['ext'] ?? null;

// ================= 路由逻辑 =================

// 1. 播放解析 (直接嗅探)
if ($play !== null || $flag !== null) {
    $url = $play ?: $flag;
    if (strpos($url, 'http') === false) $url = fixUrl($url);

    echo json_encode([
        'parse' => 1, // 开启嗅探
        'url' => $url,
        'header' => [
            'User-Agent' => $UA,
            'Referer' => $HOST . '/'
        ]
    ]);
    exit;
}

// 2. 视频详情
if (!empty($ids)) {
    $url = (strpos($ids, 'http') === 0) ? $ids : fixUrl($ids);
    $html = fetch($url);

    $vod = [
        'vod_id' => $ids, 'vod_name' => '', 'vod_pic' => '', 
        'vod_content' => '', 'vod_play_from' => '', 'vod_play_url' => ''
    ];

    if ($html) {
        if (preg_match('/<title>(.*?)<\/title>/', $html, $m)) 
            $vod['vod_name'] = trim(preg_replace('/\s*-\s*嗷呜动漫.*$/', '', $m[1]));
        
        if (preg_match('/data-original="([^"]+)"/', $html, $m)) $vod['vod_pic'] = fixUrl($m[1]);
        elseif (preg_match('/class="detail-pic"[^>]*src="([^"]+)"/', $html, $m)) $vod['vod_pic'] = fixUrl($m[1]);
        
        if (preg_match('/class="text cor3"[^>]*>(.*?)<\/div>/is', $html, $m)) 
            $vod['vod_content'] = trim(strip_tags($m[1]));

        $playFrom = [];
        preg_match('/<div class="anthology-tab[^"]*">(.*?)<\/div>/is', $html, $tabHtml);
        if (!empty($tabHtml[1])) {
            preg_match_all('/<a[^>]*>([^<]+)<\/a>/', $tabHtml[1], $tabNames);
            if (!empty($tabNames[1])) {
                foreach($tabNames[1] as $idx => $name) {
                    $name = trim(preg_replace('/&nbsp;/', '', $name));
                    $playFrom[] = $name ?: "线路".($idx+1);
                }
            }
        }

        $playUrls = [];
        preg_match_all('/<div class="anthology-list-play[^"]*">(.*?)<\/div>\s*<\/div>/is', $html, $listBoxes);
        if (empty($listBoxes[1])) preg_match_all('/<ul class="anthology-list-play[^"]*">(.*?)<\/ul>/is', $html, $listBoxes);

        if (!empty($listBoxes[1])) {
            foreach ($listBoxes[1] as $listHtml) {
                preg_match_all('/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/is', $listHtml, $links);
                $episodes = [];
                if (!empty($links[1])) {
                    foreach ($links[1] as $k => $href) {
                        $episodes[] = trim(strip_tags($links[2][$k])) . '$' . fixUrl($href);
                    }
                }
                $playUrls[] = implode('#', $episodes);
            }
        }
        
        if (empty($playFrom) && !empty($playUrls)) {
            for($i=0; $i<count($playUrls); $i++) $playFrom[] = "线路".($i+1);
        }

        if (count($playFrom) >= 3) {
            array_shift($playFrom);
            array_shift($playUrls);
        }

        $vod['vod_play_from'] = implode('$$$', $playFrom);
        $vod['vod_play_url'] = implode('$$$', $playUrls);
    }

    echo json_encode(['list' => [$vod]], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. 搜索
if (!empty($wd)) {
    $url = $HOST . '/search/' . urlencode($wd) . '----------' . $pg . '---.html';
    $html = fetch($url);
    $list = parseHtmlList($html, true);
    
    echo json_encode([
        'list' => $list,
        'page' => intval($pg),
        'pagecount' => count($list) > 0 ? intval($pg) + 1 : intval($pg),
        'limit' => 30,
        'total' => count($list) * 30
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 4. 分类列表 (POST API + 筛选支持)
if ($ac === 'detail' && !empty($t)) {
    // 解析筛选参数 (ext 是 Base64 编码的 JSON)
    $extend = [];
    if (!empty($ext)) {
        $decoded = json_decode(base64_decode($ext), true);
        if (!$decoded) $decoded = json_decode($ext, true);
        if ($decoded) $extend = $decoded;
    }

    $apiUrl = $HOST . '/index.php/ds_api/vod';
    
    // 构建 POST 数据
    $postParams = [
        'type' => $t,
        'class' => $extend['class'] ?? '',
        'year' => $extend['year'] ?? '',
        'by' => $extend['by'] ?? 'time', // 默认按最新
        'page' => $pg
    ];
    
    // 发送 POST 请求 (必须带上 content-type)
    $jsonStr = fetch($apiUrl, 'POST', $postParams, [
        'Content-Type: application/x-www-form-urlencoded; charset=utf-8'
    ]);
    
    $jsonObj = json_decode($jsonStr, true);
    $list = [];

    if ($jsonObj && isset($jsonObj['list']) && is_array($jsonObj['list'])) {
        foreach ($jsonObj['list'] as $it) {
            $list[] = [
                'vod_id' => fixUrl($it['url']),
                'vod_name' => $it['vod_name'],
                'vod_pic' => fixUrl($it['vod_pic']),
                'vod_remarks' => $it['vod_remarks']
            ];
        }
    }
    
    $total = $jsonObj['total'] ?? 0;
    $limit = $jsonObj['limit'] ?? 30;
    $pagecount = $jsonObj['pagecount'] ?? 1;

    echo json_encode([
        'list' => $list,
        'page' => intval($pg),
        'pagecount' => intval($pagecount),
        'limit' => intval($limit),
        'total' => intval($total)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. 首页 (精选 + 筛选配置)
$html = fetch($HOST . '/');
$list = parseHtmlList($html, false);
$list = array_slice($list, 0, 20);

// 获取筛选规则
$filters = getFilters();

echo json_encode([
    'class' => [
        ['type_id' => '20', 'type_name' => '🔥 当季新番'],
        ['type_id' => '21', 'type_name' => '🎬 番剧'],
        ['type_id' => '22', 'type_name' => '🎥 剧场']
    ],
    'filters' => $filters, // 返回筛选配置
    'list' => $list,
    'page' => 1,
    'pagecount' => 1,
    'limit' => 20,
    'total' => count($list)
], JSON_UNESCAPED_UNICODE);
exit;
?>
