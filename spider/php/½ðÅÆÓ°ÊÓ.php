<?php
/**
 * 金牌动漫 - PHP 适配版
 * 1. [核心] 参照 cat_金牌.js 逻辑，实现 MD5+SHA1 嵌套签名
 * 2. [适配] 完整支持分类、筛选、详情、搜索及播放
 * 3. [架构] 采用“嗷呜动漫”模板结构
 */

header('Content-Type: application/json; charset=utf-8');
error_reporting(0);

// ================= 全局配置 =================
$HOST = 'https://m.jiabaide.cn';
$UA = 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36';

// ================= 工具函数 =================

/**
 * 核心签名算法：sha1(md5(query_string))
 */
function getHeaders($params) {
    global $UA, $HOST;
    $t = (string)(time() * 1000); // 毫秒时间戳
    $params['key'] = 'cb808529bae6b6be45ecfab29a4889bc';
    $params['t'] = $t;
    
    // 构建 QueryString
    $query = [];
    foreach ($params as $k => $v) {
        $query[] = "$k=$v";
    }
    $queryStr = implode('&', $query);
    
    // 签名逻辑：SHA1(MD5(str))
    $sign = sha1(md5($queryStr));
    
    return [
        'User-Agent: ' . $UA,
        'Referer: ' . $HOST,
        't: ' . $t,
        'sign: ' . $sign
    ];
}

function fetch($url, $headers = []) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $data = curl_exec($ch);
    curl_close($ch);
    return $data;
}

// ================= 参数接收 =================
$ac = $_GET['ac'] ?? null;
$t = $_GET['t'] ?? null;
$pg = $_GET['pg'] ?? '1';
$ids = $_GET['ids'] ?? null;
$wd = $_GET['wd'] ?? null;
$play = $_GET['play'] ?? null;
$ext = $_GET['ext'] ?? null;

// ================= 路由逻辑 =================

// 1. 播放解析
if ($play !== null) {
    // 格式: vodId@nid
    list($sid, $nid) = explode('@', $play);
    $params = [
        'clientType' => '3',
        'id' => $sid,
        'nid' => $nid
    ];
    $apiUrl = $HOST . '/api/mw-movie/anonymous/v2/video/episode/url?' . http_build_query($params);
    $res = fetch($apiUrl, getHeaders($params));
    $json = json_decode($res, true);
    
    $playUrl = "";
    if (!empty($json['data']['list'])) {
        // 取第一个清晰度的 URL
        $playUrl = $json['data']['list'][0]['url'];
    }

    echo json_encode([
        'parse' => 0,
        'url' => $playUrl,
        'header' => ['User-Agent' => $UA]
    ]);
    exit;
}

// 2. 视频详情
if (!empty($ids)) {
    $params = ['id' => $ids];
    $apiUrl = $HOST . '/api/mw-movie/anonymous/video/detail?' . http_build_query($params);
    $res = fetch($apiUrl, getHeaders($params));
    $json = json_decode($res, true);
    $kvod = $json['data'];

    $episodes = [];
    if (!empty($kvod['episodeList'])) {
        foreach ($kvod['episodeList'] as $it) {
            // 存入格式：名字$ID@NID
            $episodes[] = $it['name'] . '$' . $kvod['vodId'] . '@' . $it['nid'];
        }
    }

    $vod = [
        'vod_id' => $kvod['vodId'],
        'vod_name' => $kvod['vodName'],
        'vod_pic' => $kvod['vodPic'],
        'type_name' => $kvod['vodClass'],
        'vod_remarks' => $kvod['vodRemarks'],
        'vod_content' => trim(strip_tags($kvod['vodContent'])),
        'vod_play_from' => '金牌线路',
        'vod_play_url' => implode('#', $episodes)
    ];

    echo json_encode(['list' => [$vod]], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. 搜索
if (!empty($wd)) {
    $params = [
        'keyword' => $wd,
        'pageNum' => $pg,
        'pageSize' => '30'
    ];
    $apiUrl = $HOST . '/api/mw-movie/anonymous/video/searchByWordPageable?' . http_build_query($params);
    $res = fetch($apiUrl, getHeaders($params));
    $json = json_decode($res, true);
    
    $list = [];
    foreach ($json['data']['list'] as $it) {
        $list[] = [
            'vod_id' => $it['vodId'],
            'vod_name' => $it['vodName'],
            'vod_pic' => $it['vodPic'],
            'vod_remarks' => $it['vodRemarks']
        ];
    }

    echo json_encode([
        'list' => $list,
        'page' => intval($pg),
        'pagecount' => 10,
        'limit' => 30,
        'total' => 300
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 4. 分类列表
if ($ac === 'detail' && !empty($t)) {
    $extend = [];
    if (!empty($ext)) {
        $decoded = json_decode(base64_decode($ext), true);
        if ($decoded) $extend = $decoded;
    }

    $params = [
        'area' => $extend['area'] ?? '',
        'lang' => $extend['lang'] ?? '',
        'pageNum' => $pg,
        'pageSize' => '30',
        'sort' => $extend['by'] ?? '1',
        'sortBy' => '1',
        'type' => $extend['type'] ?? '',
        'type1' => $t,
        'v_class' => $extend['class'] ?? '',
        'year' => $extend['year'] ?? '',
    ];

    $apiUrl = $HOST . '/api/mw-movie/anonymous/video/list?' . http_build_query($params);
    $res = fetch($apiUrl, getHeaders($params));
    $json = json_decode($res, true);

    $list = [];
    foreach ($json['data']['list'] as $it) {
        $list[] = [
            'vod_id' => $it['vodId'],
            'vod_name' => $it['vodName'],
            'vod_pic' => $it['vodPic'],
            'vod_remarks' => $it['vodRemarks'] . '_' . $it['vodDoubanScore']
        ];
    }

    echo json_encode([
        'list' => $list,
        'page' => intval($pg),
        'pagecount' => 99,
        'limit' => 30,
        'total' => 3000
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. 首页 (获取分类与筛选)
$typeUrl = $HOST . '/api/mw-movie/anonymous/get/filer/type';
$typeRes = fetch($typeUrl, getHeaders([]));
$typeArr = json_decode($typeRes, true)['data'] ?? [];

$classes = [];
foreach ($typeArr as $item) {
    $classes[] = ['type_id' => (string)$item['typeId'], 'type_name' => $item['typeName']];
}

// 获取筛选
$filterUrl = $HOST . '/api/mw-movie/anonymous/v1/get/filer/list';
$filterRes = fetch($filterUrl, getHeaders([]));
$filterData = json_decode($filterRes, true)['data'] ?? [];

$filters = [];
$nameMap = [
    'typeList' => ['key' => 'type', 'name' => '类型'],
    'plotList' => ['key' => 'class', 'name' => '剧情'],
    'districtList' => ['key' => 'area', 'name' => '地区'],
    'languageList' => ['key' => 'lang', 'name' => '语言'],
    'yearList' => ['key' => 'year', 'name' => '年份']
];

foreach ($classes as $cls) {
    $tid = $cls['type_id'];
    $fRow = [];
    foreach ($nameMap as $apiKey => $cfg) {
        if (!isset($filterData[$tid][$apiKey])) continue;
        $values = [['n' => '全部', 'v' => '']];
        foreach ($filterData[$tid][$apiKey] as $v) {
            $values[] = [
                'n' => $v['itemText'],
                'v' => ($apiKey === 'typeList') ? $v['itemValue'] : $v['itemText']
            ];
        }
        $fRow[] = ['key' => $cfg['key'], 'name' => $cfg['name'], 'value' => $values];
    }
    // 增加排序
    $fRow[] = [
        'key' => 'by', 'name' => '排序', 
        'value' => [
            ['n' => '最近更新', 'v' => '1'],
            ['n' => '添加时间', 'v' => '2'],
            ['n' => '人气高低', 'v' => '3'],
            ['n' => '评分高低', 'v' => '4']
        ]
    ];
    $filters[$tid] = $fRow;
}

// 首页推荐
$hotUrl = $HOST . '/api/mw-movie/anonymous/home/hotSearch';
$hotRes = fetch($hotUrl, getHeaders([]));
$hotVods = json_decode($hotRes, true)['data'] ?? [];
$list = [];
foreach (array_slice($hotVods, 0, 20) as $it) {
    $list[] = [
        'vod_id' => $it['vodId'],
        'vod_name' => $it['vodName'],
        'vod_pic' => $it['vodPic'],
        'vod_remarks' => $it['vodRemarks']
    ];
}

echo json_encode([
    'class' => $classes,
    'filters' => $filters,
    'list' => $list
], JSON_UNESCAPED_UNICODE);
exit;
