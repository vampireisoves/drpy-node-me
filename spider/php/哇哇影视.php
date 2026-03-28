<?php
/**
 * 哇哇视频 - PHP 适配版
 * 1. 自动生成全部分类筛选 (Filters)
 * 2. 实时 RSA 签名与 AES 解密
 */

header('Content-Type: application/json; charset=utf-8');
error_reporting(0);

// ================= 核心加解密类 =================
class WawaCrypto {
    public static function decrypt($encrypted_data) {
        $key = base64_decode('Crm4FXWkk5JItpYirFDpqg=='); //
        $data = hex2bin(base64_decode($encrypted_data)); //
        return openssl_decrypt($data, 'AES-128-ECB', $key, OPENSSL_RAW_DATA);
    }

    public static function sign($message, $privateKey) {
        $key = "-----BEGIN PRIVATE KEY-----\n" . wordwrap($privateKey, 64, "\n", true) . "\n-----END PRIVATE KEY-----";
        $res = openssl_get_privatekey($key);
        openssl_sign($message, $signature, $res, OPENSSL_ALGO_SHA256); // 使用 SHA256 签名
        return base64_encode($signature);
    }

    public static function uuid() {
        return sprintf('%04x%04x%04x%04x%04x%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}

// ================= 工具函数 =================
function fetch($url, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $data = curl_exec($ch);
    curl_close($ch);
    return $data;
}

// 获取基础配置
function getBaseInfo() {
    $uid = WawaCrypto::uuid();
    $t = (string)(time() * 1000);
    $sign = md5("appKey=3bbf7348cf314874883a18d6b6fcf67a&uid=$uid&time=$t"); //
    
    $url = 'https://gitee.com/api/v5/repos/aycapp/openapi/contents/wawaconf.txt?access_token=74d5879931b9774be10dee3d8c51008e';
    $res = json_decode(fetch($url, ["User-Agent: okhttp/4.9.3", "uid: $uid", "time: $t", "sign: $sign"]), true);
    return json_decode(WawaCrypto::decrypt($res['content']), true);
}

$CONF = getBaseInfo();
$HOST = $CONF['baseUrl'];
$APP_KEY = $CONF['appKey'];
$RSA_KEY = $CONF['appSecret'];

function getWawaHeaders() {
    global $APP_KEY, $RSA_KEY;
    $uid = WawaCrypto::uuid();
    $t = (string)(time() * 1000);
    $sign = WawaCrypto::sign("appKey=$APP_KEY&time=$t&uid=$uid", $RSA_KEY); //
    return [
        'User-Agent: okhttp/4.9.3',
        "uid: $uid",
        "time: $t",
        "appKey: $APP_KEY",
        "sign: $sign"
    ];
}

// ================= 路由逻辑 =================
$ac = $_GET['ac'] ?? null;
$t = $_GET['t'] ?? null;
$pg = $_GET['pg'] ?? '1';
$ids = $_GET['ids'] ?? null;
$wd = $_GET['wd'] ?? null;
$play = $_GET['play'] ?? null;

// 1. 播放解析
if ($play) {
    $playData = json_decode(base64_decode($play), true);
    echo json_encode([
        'parse' => 1,
        'url' => $playData['url'],
        'header' => ['User-Agent' => 'dart:io']
    ]);
    exit;
}

// 2. 视频详情
if ($ids) {
    $res = json_decode(fetch("$HOST/api.php/zjv6.vod/detail?vod_id=$ids&rel_limit=10", getWawaHeaders()), true);
    $item = $res['data'];
    $playFrom = []; $playUrls = [];
    foreach ($item['vod_play_list'] as $list) {
        $playFrom[] = $list['player_info']['show'];
        $urls = [];
        foreach ($list['urls'] as $u) {
            $u['parse'] = $list['player_info']['parse2'];
            $urls[] = $u['name'] . '$' . base64_encode(json_encode($u));
        }
        $playUrls[] = implode('#', $urls);
    }
    echo json_encode(['list' => [[
        'vod_id' => $item['vod_id'],
        'vod_name' => $item['vod_name'],
        'vod_pic' => $item['vod_pic'],
        'vod_remarks' => $item['vod_remarks'],
        'vod_content' => $item['vod_content'],
        'vod_play_from' => implode('$$$', $playFrom),
        'vod_play_url' => implode('$$$', $playUrls)
    ]]], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. 搜索
if ($wd) {
    $res = json_decode(fetch("$HOST/api.php/zjv6.vod?page=$pg&limit=20&wd=".urlencode($wd), getWawaHeaders()), true);
    echo json_encode(['list' => $res['data']['list'] ?: [], 'page' => $pg]);
    exit;
}

// 4. 分类列表 (含筛选)
if ($ac === 'detail' && $t) {
    $ext = !empty($_GET['ext']) ? json_decode(base64_decode($_GET['ext']), true) : [];
    $query = http_build_query([
        'type' => $t, 'page' => $pg, 'limit' => '12',
        'class' => $ext['class'] ?? '', 'area' => $ext['area'] ?? '',
        'year' => $ext['year'] ?? '', 'by' => $ext['by'] ?? ''
    ]);
    $res = json_decode(fetch("$HOST/api.php/zjv6.vod?$query", getWawaHeaders()), true);
    echo json_encode([
        'list' => $res['data']['list'] ?: [],
        'page' => $pg, 'pagecount' => 999, 'limit' => 12, 'total' => 9999
    ]);
    exit;
}

// 5. 首页 (精选 + 自动生成筛选配置)
$typeData = json_decode(fetch("$HOST/api.php/zjv6.vod/types", getWawaHeaders()), true);
$classes = []; $filters = [];
$dy = ["class" => "类型", "area" => "地区", "lang" => "语言", "year" => "年份", "letter" => "字母", "by" => "排序"];
$sl = ['按更新' => 'time', '按播放' => 'hits', '按评分' => 'score', '按收藏' => 'store_num'];

foreach ($typeData['data']['list'] as $item) {
    $classes[] = ['type_id' => $item['type_id'], 'type_name' => $item['type_name']];
    $tid = (string)$item['type_id'];
    $filters[$tid] = [];
    $item['type_extend']['by'] = '按更新,按播放,按评分,按收藏'; // 强制注入排序

    foreach ($dy as $key => $name) {
        if (!empty($item['type_extend'][$key])) {
            $values = explode(',', $item['type_extend'][$key]);
            $value_array = [];
            foreach ($values as $v) {
                if (empty($v)) continue;
                $value_array[] = ["n" => $v, "v" => ($key == "by" ? ($sl[$v] ?? $v) : $v)];
            }
            $filters[$tid][] = ["key" => $key, "name" => $name, "value" => $value_array];
        }
    }
}

$homeList = json_decode(fetch("$HOST/api.php/zjv6.vod/vodPhbAll", getWawaHeaders()), true);
echo json_encode([
    'class' => $classes,
    'filters' => $filters,
    'list' => $homeList['data']['list'][0]['vod_list'] ?: [],
    'page' => 1, 'pagecount' => 1, 'limit' => 20, 'total' => 20
], JSON_UNESCAPED_UNICODE);
