<?php
/**
 * J91 / 91PORN - PHP T4 接口 v5 (图片代理修正版)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

define('UA', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
define('FALLBACK_HOST', 'https://pta.9a07g.com');
define('PUBLISH_JS', 'https://lib.kingslord.com/dizhi/publish.js?20221020');
define('HOST_CACHE', sys_get_temp_dir() . '/j91host.cache');
define('CACHE_TTL', 3600); // 1小时

// ── 1. 图片服务器代理逻辑 ──────────────────────────────────────
// 如果 URL 中带有 img_proxy 参数，则进入代理模式抓取图片并输出
if (isset($_GET['img_proxy'])) {
    $img_url = $_GET['img_proxy'];
    if (empty($img_url)) exit;

    $ch = curl_init($img_url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'User-Agent: ' . UA,
            'Referer: https://91porn.com/' // 关键：伪造来源绕过防盗链
        ],
    ]);
    $data = curl_exec($ch);
    $type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    header("Content-Type: " . $type);
    echo $data;
    exit;
}

/**
 * 将原始图片 URL 转换为当前服务器代理 URL
 */
function proxy_pic($url) {
    if (!$url) return '';
    // 获取当前脚本的完整 URL 地址
    $self = (isset($_SERVER['HTTPS']) ? "https://" : "http://") . $_SERVER['HTTP_HOST'] . explode('?', $_SERVER['REQUEST_URI'])[0];
    return $self . '?img_proxy=' . urlencode($url);
}

// ── 自动获取最新域名 ─────────────────────────────────────────
function getHost() {
    if (file_exists(HOST_CACHE) && time() - filemtime(HOST_CACHE) < CACHE_TTL) {
        $cached = trim(file_get_contents(HOST_CACHE));
        if ($cached) return $cached;
    }

    // 先尝试已知可用域名
    $known = ['https://91porny.com', 'https://9lporn.com'];
    $exclude = ['kingslord.com', 'googletagmanager.com', 'google.com', 'jquery.com', 'dizhi9'];

    foreach ($known as $url) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url . '/video/category/latest/1',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER     => ['User-Agent: ' . UA],
        ]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code === 200 && strpos($body, 'video-elem') !== false) {
            file_put_contents(HOST_CACHE, $url);
            return $url;
        }
    }

    // 降级：从发布页抓域名
    $pub_pages = ['https://d2.dizhi931.com/', 'https://d2.dizhi932.com/'];
    foreach ($pub_pages as $pub) {
        $html = bare_get($pub);
        if (!$html) continue;
        preg_match_all('#(https?://[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,10})#', $html, $m);
        foreach (array_unique($m[1]) as $url) {
            foreach ($exclude as $ex) {
                if (strpos($url, $ex) !== false) continue 2;
            }
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL            => $url . '/video/category/latest/1',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT        => 8,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_HTTPHEADER     => ['User-Agent: ' . UA],
            ]);
            $body = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($code === 200 && strpos($body, 'video-elem') !== false) {
                file_put_contents(HOST_CACHE, $url);
                return $url;
            }
        }
    }

    file_put_contents(HOST_CACHE, FALLBACK_HOST);
    return FALLBACK_HOST;
}

function bare_get($url) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_HTTPHEADER     => ['User-Agent: ' . UA],
    ]);
    $data = curl_exec($ch);
    curl_close($ch);
    return $data ?: '';
}

$HOST = getHost();

$CLASSES = [
    ['type_id' => 'latest',          'type_name' => '最近更新'],
    ['type_id' => 'hd',              'type_name' => '高清视频'],
    ['type_id' => 'recent-favorite', 'type_name' => '最近加精'],
    ['type_id' => 'hot-list',        'type_name' => '当前最热'],
    ['type_id' => 'recent-rating',   'type_name' => '最近得分'],
    ['type_id' => 'nonpaid',         'type_name' => '非付费'],
    ['type_id' => 'ori',             'type_name' => '91原创'],
    ['type_id' => 'long-list',       'type_name' => '10分钟以上'],
    ['type_id' => 'longer-list',     'type_name' => '20分钟以上'],
    ['type_id' => 'month-discuss',   'type_name' => '本月讨论'],
    ['type_id' => 'top-favorite',    'type_name' => '本月收藏'],
    ['type_id' => 'most-favorite',   'type_name' => '收藏最多'],
    ['type_id' => 'top-list',        'type_name' => '本月最热'],
    ['type_id' => 'top-last',        'type_name' => '上月最热'],
    ['type_id' => 'swag',            'type_name' => 'SWAG'],
    ['type_id' => 'madou',           'type_name' => '麻豆'],
];

function http_get($url) {
    global $HOST;
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_HTTPHEADER     => [
            'User-Agent: ' . UA,
            'Accept: text/html,application/xhtml+xml,*/*;q=0.9',
            'Accept-Language: zh-CN,zh;q=0.9',
            'Referer: ' . $HOST . '/',
        ],
    ]);
    $body = curl_exec($ch);
    curl_close($ch);
    return $body ?: '';
}

// ── 播放解析逻辑 (保持不变) ───────────────────────────────────
function extract_embed_m3u8($html) {
    if (preg_match('/data-src="(https:\/\/[^"]+index\.m3u8[^"]*)"/i', $html, $m)) return html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    if (preg_match('/data-src="(https:\/\/[^"]+\.m3u8[^"]*)"/i', $html, $m)) return html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    return '';
}
function extract_mse_url($html) {
    if (preg_match('/id="mse"[^>]*data-url="([^"]+)"/i', $html, $m)) return html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    return '';
}
function extract_data_src($html) {
    if (!preg_match('/<video\b[^>]*>/i', $html, $vm)) return '';
    $videoTag = $vm[0];
    if (stripos($videoTag, 'muted') !== false && stripos($videoTag, 'loop') !== false) return '';
    if (preg_match('/\bdata-src="([^"]+)"/i', $videoTag, $m)) return html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    return '';
}
function extract_m3u8($html) {
    if (preg_match('/(https?:\/\/[^\s"\'<>]+\.m3u8[^\s"\'<>]*)/i', $html, $m)) return html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
    return '';
}
function extract_mp4_from_scripts($html) {
    preg_match_all('/<script\b[^>]*>(.*?)<\/script>/is', $html, $scripts);
    $patterns = [
        '/strencode2\s*=\s*["\']([^"\']+\.mp4[^"\']*)/i',
        '/video_url\s*[:=]\s*["\']([^"\']+\.mp4[^"\']*)/i',
        '/["\']src["\']\s*:\s*["\']([^"\']+\.mp4[^"\']*)/i',
        '/(https?:\/\/[^\s"\']+cdn77\.org[^\s"\']+\.mp4[^\s"\']*)/i',
    ];
    foreach ($scripts[1] as $script) {
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $script, $m)) return html_entity_decode($m[1], ENT_QUOTES, 'UTF-8');
        }
    }
    return '';
}

function extract_play_url($html) {
    return extract_mse_url($html) ?: extract_embed_m3u8($html) ?: extract_data_src($html) ?: extract_mp4_from_scripts($html) ?: extract_m3u8($html);
}

function detail_url($vod_id) {
    global $HOST;
    if (strpos($vod_id, 'vs:') === 0) return $HOST . '/videos/view/' . substr($vod_id, 3) . '/';
    if (strpos($vod_id, 'hd:') === 0) return $HOST . '/video/view/' . substr($vod_id, 3);
    $hash = strpos($vod_id, 'v:') === 0 ? substr($vod_id, 2) : $vod_id;
    return $HOST . '/video/view/' . $hash;
}
function get_hash($vod_id) { return strpos($vod_id, ':') !== false ? substr($vod_id, strpos($vod_id, ':') + 1) : $vod_id; }
function get_type($vod_id) {
    if (strpos($vod_id, 'vs:') === 0) return 'videos';
    if (strpos($vod_id, 'hd:') === 0) return 'viewhd';
    return 'view';
}

// ── 解析列表 (加入图片代理) ─────────────────────────────────────
function parse_video_list($html) {
    $list   = [];
    $blocks = explode('video-elem', $html);
    array_shift($blocks);
    foreach ($blocks as $block) {
        if (!preg_match('#href="(/(video/view(?:hd)?|videos/view)/[^"]+)"#', $block, $hm)) continue;
        $href  = $hm[1];
        $parts = array_values(array_filter(explode('/', $href)));
        if ($parts[0] === 'videos') {
            $vod_id = 'vs:' . ($parts[2] ?? '') . '/' . ($parts[3] ?? '');
        } elseif (isset($parts[1]) && $parts[1] === 'viewhd') {
            $vod_id = 'hd:' . ($parts[2] ?? '');
        } else {
            $vod_id = 'v:' . ($parts[2] ?? '');
        }
        if (strlen($vod_id) <= 3) continue;

        $pic = '';
        if (preg_match("/background-image:\s*url\(['\"]?([^'\")\s]+)['\"]?\)/i", $block, $pm)) {
            $pic = $pm[1];
            if (stripos($pic, '.gif') !== false) continue;
            if (strpos($pic, '//') === 0) $pic = 'https:' . $pic;
            // 使用代理函数包装图片 URL
            $pic = proxy_pic($pic);
        }
        if (!preg_match('/class="[^"]*\btitle\b[^"]*"[^>]*>([^<]+)</i', $block, $tm)) continue;
        $title = trim($tm[1]);
        if (!$title) continue;

        $remarks = '';
        if (preg_match('/class="layer">\s*([^<]+)</i', $block, $lm)) $remarks = trim($lm[1]);
        $list[] = ['vod_id' => $vod_id, 'vod_name' => $title, 'vod_pic' => $pic, 'vod_remarks' => $remarks];
    }
    return $list;
}

function parse_page_count($html, $cur) {
    $max = $cur;
    preg_match_all('/[?&]page=(\d+)/i', $html, $m);
    foreach ($m[1] as $p) { $p = (int)$p; if ($p > $max && $p < 9999) $max = $p; }
    return $max ?: $cur;
}

// ── 核心逻辑 ─────────────────────────────────────────────────
function do_home() {
    global $CLASSES, $HOST;
    $html = http_get($HOST);
    $list = $html ? parse_video_list($html) : [];
    return ['class' => $CLASSES, 'filters' => new stdClass(), 'list' => $list];
}

function do_category($type_id, $page) {
    global $HOST;
    $pg = max(1, (int)$page);
    $url = in_array($type_id, ['swag', 'madou', 'videos', 'premium']) ? $HOST . '/' . $type_id . '?page=' . $pg : $HOST . '/video/category/' . $type_id . '/' . $pg;
    $html = http_get($url);
    if (!$html) return ['list' => [], 'page' => $pg, 'pagecount' => 1];
    $list = parse_video_list($html);
    return ['list' => $list, 'page' => $pg, 'pagecount' => $pg + 1, 'limit' => 20, 'total' => 9999];
}

function do_search($wd, $page) {
    global $HOST;
    $pg  = max(1, (int)$page);
    $url = $HOST . '/search?keywords=' . urlencode($wd) . ($pg > 1 ? '&page=' . $pg : '');
    $html = http_get($url);
    if (!$html) return ['list' => [], 'page' => $pg, 'pagecount' => 1];
    $list = parse_video_list($html);
    return ['list' => $list, 'page' => $pg, 'pagecount' => $pg + 1, 'limit' => 20];
}

function do_detail($ids) {
    global $HOST;
    $results = [];
    foreach ($ids as $vod_id) {
        $vod_id = trim($vod_id);
        if (!$vod_id) continue;
        $html = http_get(detail_url($vod_id));
        if (!$html) continue;

        $title = '未知';
        if (preg_match('/<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) $title = trim($m[1]);
        
        $pic = '';
        if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
            // 使用代理函数包装详情页图片 URL
            $pic = proxy_pic($m[1]);
        }
        
        $actor = '';
        if (preg_match('#href="/author/([^"]+)"#i', $html, $am)) $actor = urldecode($am[1]);

        // 提取播放地址
        $hash = get_hash($vod_id);
        $type = get_type($vod_id);
        $play_url = '';
        $embed_urls = $type === 'viewhd' ? [$HOST . '/video/embedhd/' . $hash, $HOST . '/video/embed/' . $hash] : [$HOST . '/video/embed/' . $hash];

        foreach ($embed_urls as $ep) {
            $ehtml = http_get($ep);
            if (!$ehtml) continue;
            $play_url = extract_embed_m3u8($ehtml);
            if ($play_url) break;
        }
        if (!$play_url) $play_url = extract_play_url($html);

        $results[] = [
            'vod_id'        => $vod_id,
            'vod_name'      => $title,
            'vod_pic'       => $pic,
            'vod_actor'     => $actor,
            'vod_play_from' => 'J91',
            'vod_play_url'  => '播放$' . $play_url,
        ];
    }
    return ['list' => $results];
}

function do_play($url) {
    global $HOST;
    return [
        'parse'  => 0,
        'url'    => html_entity_decode($url, ENT_QUOTES, 'UTF-8'),
        'header' => ['User-Agent' => UA, 'Referer' => $HOST . '/'],
    ];
}

// ── 路由控制 ──────────────────────────────────────────────────
$ac   = $_GET['ac']   ?? '';
$t    = $_GET['t']    ?? '';
$pg   = $_GET['pg']   ?? '1';
$ids  = $_GET['ids']  ?? '';
$play = $_GET['play'] ?? '';
$wd   = $_GET['wd']   ?? '';

try {
    if ($play) { echo json_encode(do_play($play),    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
    if ($wd)   { echo json_encode(do_search($wd, $pg), JSON_UNESCAPED_UNICODE); exit; }
    if (!$ac)  { echo json_encode(do_home(),            JSON_UNESCAPED_UNICODE); exit; }
    if ($ac === 'detail') {
        if ($t)   { echo json_encode(do_category($t, $pg), JSON_UNESCAPED_UNICODE); exit; }
        if ($ids) {
            $id_list = array_filter(array_map('trim', explode(',', $ids)));
            echo json_encode(do_detail($id_list), JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
} catch (Exception $e) {
    echo json_encode(['code' => 500, 'msg' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}