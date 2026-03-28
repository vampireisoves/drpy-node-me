<?php
/**
 * 麻雀视频 - PHP 适配版
 * 1. 核心：实现了 JS 源码中的 XOR + Base64 算法 (Token 生成与数据解密)
 * 2. 播放：集成了 JS 中的解密逻辑及多线路解析
 * 3. 搜索：支持 Token 验证的搜索接口
 */

header('Content-Type: application/json; charset=utf-8');
error_reporting(0);

// ================= 全局配置 =================
$HOST = 'https://www.mqtv.cc';
$KEY = 'Mcxos@mucho!nmme';
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

// ================= 核心加解密函数 =================

/**
 * 对应 JS 中的 encodeData 和 decodeData (XOR + Base64)
 */
function mq_xor_codec($data, $key, $is_decode = false) {
    if ($is_decode) {
        $data = base64_decode($data);
    } else {
        $data = json_encode($data, JSON_UNESCAPED_UNICODE);
        $data = base64_encode($data);
    }

    $res = '';
    $keyLen = strlen($key);
    for ($i = 0; $i < strlen($data); $i++) {
        $res .= $data[$i] ^ $key[$i % $keyLen];
    }

    if ($is_decode) {
        return json_decode(base64_decode($res), true);
    } else {
        return urlencode(base64_encode($res));
    }
}

function fetch($url, $referer = '/') {
    global $UA, $HOST;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: ' . $UA,
        'Referer: ' . $HOST . $referer,
        'X-Requested-With: XMLHttpRequest'
    ]);
    $data = curl_exec($ch);
    curl_close($ch);
    return $data;
}

// 获取页面 PageID 并生成 Token
function getToken($path, $ref = '/') {
    global $HOST, $KEY;
    $html = fetch($HOST . $path, $ref);
    preg_match("/window\.pageid\s?=\s?'(.*?)';/i", $html, $m);
    $pageId = $m[1] ?? "";
    return mq_xor_codec($pageId, $KEY);
}

// ================= 路由逻辑 =================

$ac = $_GET['ac'] ?? null;
$t = $_GET['t'] ?? null; // 类型，如 /type/movie
$pg = $_GET['pg'] ?? '1';
$wd = $_GET['wd'] ?? null;
$ids = $_GET['ids'] ?? null;
$play = $_GET['play'] ?? null; // 格式: url@parse1,parse2

// 1. 播放解析
if ($play !== null) {
    $parts = explode('@', $play);
    $rawUrl = $parts[0];
    $parses = isset($parts[1]) ? explode(',', $parts[1]) : [];
    
    // 默认返回第一个解析地址配合嗅探，模拟 JS 中的逻辑
    $finalUrl = $rawUrl;
    if (!empty($parses)) {
        $finalUrl = $parses[0] . $rawUrl;
    }

    echo json_encode([
        'parse' => 1,
        'url' => $finalUrl,
        'header' => ['User-Agent' => $UA]
    ]);
    exit;
}

// 2. 视频详情 (detail)
if (!empty($ids)) {
    $pathParts = explode('/', trim($ids, '/'));
    $realId = end($pathParts);
    $token = getToken($ids);
    
    $apiUrl = $HOST . "/libs/VodInfo.api.php?type=ct&id=$realId&token=$token";
    $json = json_decode(fetch($apiUrl, $ids), true);
    $data = $json['data'];

    // 处理解析线路
    $parsesArr = [];
    foreach (($data['playapi'] ?? []) as $p) {
        if (isset($p['url'])) {
            $parsesArr[] = (strpos($p['url'], '//') === 0) ? "https:" . $p['url'] : $p['url'];
        }
    }
    $parsesStr = implode(',', $parsesArr);

    $playFrom = [];
    $playUrls = [];
    foreach (($data['playinfo'] ?? []) as $site) {
        $playFrom[] = $site['cnsite'];
        $urls = [];
        foreach ($site['player'] as $ep) {
            // 将解析接口封装在 URL 后面，供 play 阶段调用
            $urls[] = $ep['no'] . '$' . $ep['url'] . '@' . $parsesStr;
        }
        $playUrls[] = implode('#', $urls);
    }

    $vod = [
        'vod_id' => $ids,
        'vod_name' => $data['title'],
        'vod_pic' => $data['img'],
        'vod_remarks' => $data['remark'],
        'vod_year' => $data['year'],
        'vod_area' => $data['area'],
        'vod_actor' => $data['actor'],
        'vod_director' => $data['director'],
        'vod_content' => $data['content'] ?? '',
        'vod_play_from' => implode('$$$', $playFrom),
        'vod_play_url' => implode('$$$', $playUrls)
    ];

    echo json_encode(['list' => [$vod]], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. 搜索 (search)
if (!empty($wd)) {
    $path = '/search/' . urlencode($wd);
    $token = getToken($path);
    $apiUrl = $HOST . "/libs/VodList.api.php?search=" . urlencode($wd) . "&token=$token";
    
    $resp = json_decode(fetch($apiUrl, $path), true);
    $data = mq_xor_codec($resp['data'], $KEY, true); // 搜索数据需要解密
    
    $list = [];
    if (isset($data['vod_all'])) {
        foreach ($data['vod_all'] as $item) {
            foreach ($item['show'] as $v) {
                $list[] = [
                    'vod_id' => $v['url'],
                    'vod_name' => $v['title'],
                    'vod_pic' => $v['img'],
                    'vod_remarks' => $v['remark']
                ];
            }
        }
    }
    echo json_encode(['list' => $list, 'page' => $pg], JSON_UNESCAPED_UNICODE);
    exit;
}

// 4. 分类列表 (category)
if (!empty($t)) {
    $typeKey = explode('/', trim($t, '/'))[1] ?? 'movie';
    $token = getToken($t);
    $apiUrl = $HOST . "/libs/VodList.api.php?type=$typeKey&rank=rankhot&page=$pg&token=$token";
    
    $resp = json_decode(fetch($apiUrl, $t), true);
    $list = [];
    foreach (($resp['data'] ?? []) as $v) {
        $list[] = [
            'vod_id' => $v['url'],
            'vod_name' => $v['title'],
            'vod_pic' => $v['img'],
            'vod_remarks' => $v['remark']
        ];
    }
    echo json_encode(['list' => $list, 'page' => intval($pg)], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. 首页 (homeVod)
$token = getToken('/');
$apiUrl = $HOST . "/libs/VodList.api.php?home=index&token=$token";
$resp = json_decode(fetch($apiUrl), true);
$list = [];
if (isset($resp['data']['movie'])) {
    foreach ($resp['data']['movie'] as $section) {
        foreach ($section['show'] as $v) {
            $list[] = [
                'vod_id' => $v['url'],
                'vod_name' => $v['title'],
                'vod_pic' => $v['img'],
                'vod_remarks' => $v['remark']
            ];
        }
    }
}

echo json_encode([
    'class' => [
        ['type_id' => '/type/movie', 'type_name' => '电影'],
        ['type_id' => '/type/tv', 'type_name' => '电视剧'],
        ['type_id' => '/type/va', 'type_name' => '综艺'],
        ['type_id' => '/type/ct', 'type_name' => '动漫']
    ],
    'list' => array_slice($list, 0, 30)
], JSON_UNESCAPED_UNICODE);
