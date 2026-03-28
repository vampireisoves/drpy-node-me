<?php

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
error_reporting(0);

// ================= 配置区域 =================
define('DEBUG_MODE', false); 
define('LOG_FILE', 'debug_log.txt');

define('SITE_URL', 'https://52tvdy.com');
// 精简 UA，稍微缩短一点请求包
define('UA', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/142.0.0.0 Safari/537.36');
// ===========================================

function write_log($msg) {
    if (!DEBUG_MODE) return;
    if (file_exists(LOG_FILE) && filesize(LOG_FILE) > 2 * 1024 * 1024) {
        file_put_contents(LOG_FILE, "--- Log Cleared (Size Limit) ---\n");
    }
    $time = date('Y-m-d H:i:s');
    $content = is_array($msg) || is_object($msg) ? json_encode($msg, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $msg;
    file_put_contents(LOG_FILE, "[$time] $content\n", FILE_APPEND);
}

$ac  = isset($_GET['ac']) ? $_GET['ac'] : '';
$t   = isset($_GET['t']) ? $_GET['t'] : '';
$pg  = isset($_GET['pg']) ? $_GET['pg'] : '1';
$wd  = isset($_GET['wd']) ? $_GET['wd'] : '';
$ids = isset($_GET['ids']) ? $_GET['ids'] : '';
$play_url = isset($_GET['play_url']) ? $_GET['play_url'] : '';
$play = isset($_GET['play']) ? $_GET['play'] : ''; 

$current_script = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[PHP_SELF]";

if ($ac == 'play' || !empty($play)) {
    if (empty($play_url) && !empty($play)) {
        $play_url = $play;
    }
    render_play($play_url);
} 
elseif ($ac == 'detail' && !empty($ids)) {
    render_detail($ids, $current_script);
} 
elseif (!empty($wd)) {
    render_search($wd, $pg);
} 
elseif (!empty($t)) {
    render_category($t, $pg);
} 
else {
    render_home();
}

// ================= 业务逻辑 =================

function render_home() {
    $html = get_web_content(SITE_URL);
    $list = parse_video_list_robust($html);
    $data = [
        "class" => [
            ["type_id" => "tv", "type_name" => "剧集"],
            ["type_id" => "movies", "type_name" => "电影"],
            ["type_id" => "varietyshow", "type_name" => "综艺"],
            ["type_id" => "anime", "type_name" => "动漫"],
            ["type_id" => "shortdrama", "type_name" => "短剧"]
        ],
        "list" => $list,
        "filters" => new stdClass() 
    ];
    echo_json($data);
}

function render_category($tid, $pg) {
    $url = SITE_URL . '/' . $tid;
    if ($pg > 1) $url .= '/page/' . $pg;
    $html = get_web_content($url);
    $list = parse_video_list_robust($html);
    if (empty($list)) $list = [];
    echo_json([
        "page" => intval($pg),
        "pagecount" => 999,
        "limit" => 20,
        "total" => 999,
        "list" => $list
    ]);
}

function render_search($wd, $pg) {
    $url = SITE_URL . '/search/video/w/' . urlencode($wd);
    if ($pg > 1) $url .= '/page/' . $pg;
    $html = get_web_content($url);
    $list = parse_search_results($html, $wd);
    echo_json([
        "page" => intval($pg),
        "list" => $list
    ]);
}

function render_detail($ids, $script_url) {
    $url = SITE_URL . '/detail/' . $ids;
    $html = get_web_content($url);

    preg_match('/<h2 class="slide-info-title">(.*?)<\/h2>/', $html, $m_title);
    $title = $m_title[1] ?? '未知';
    
    $pic = '';
    if (preg_match('/class="detail-pic[^"]*".*?z-image-loader-url="(.*?)"/s', $html, $m_z)) {
        $pic = str_replace('`', '', $m_z[1]);
    }
    if (empty($pic) && preg_match('/class="detail-pic[^"]*".*?src="(.*?)"/s', $html, $m_p)) {
        $pic = $m_p[1];
    }
    if (!empty($pic) && strpos($pic, 'http') === false) {
        if (strpos($pic, '//') === 0) $pic = 'https:' . $pic;
        else $pic = SITE_URL . $pic;
    }

    preg_match('/class="check desc-text selected">\s*(.*?)\s*<\/div>/s', $html, $m_desc);
    $desc = strip_tags($m_desc[1] ?? '');

    $vod_play_from = [];
    $vod_play_url = [];

    preg_match_all('/<ul class="anthology-list-play size">([\s\S]*?)<\/ul>/', $html, $matches_ul);
    
    $i = 1;
    foreach ($matches_ul[1] as $ul_content) {
        $urls = [];
        preg_match_all('/<a.*?href="(.*?)".*?>(.*?)<\/a>/', $ul_content, $matches_li);
        
        foreach ($matches_li[1] as $k => $href) {
            $name = strip_tags($matches_li[2][$k]);
            $target = $script_url . '?ac=play&play=' . urlencode($href);
            $urls[] = $name . '$' . $target;
        }

        if (!empty($urls)) {
            $line_name = "52TV直连" . (count($matches_ul[1]) > 1 ? $i : '');
            $vod_play_from[] = $line_name;
            $vod_play_url[] = implode('#', $urls);
            $i++;
        }
    }

    echo_json([
        "list" => [[
            "vod_id" => $ids,
            "vod_name" => $title,
            "vod_pic" => $pic,
            "vod_content" => $desc,
            "vod_play_from" => implode('$$$', $vod_play_from),
            "vod_play_url" => implode('$$$', $vod_play_url)
        ]]
    ]);
}

function render_play($path) {
    $path = urldecode($path);
    
    // 防死锁
    if (strpos($path, 'play=') !== false) {
        $parts = parse_url($path);
        if (isset($parts['query'])) {
            parse_str($parts['query'], $query);
            if (isset($query['play'])) {
                $inner_play = urldecode($query['play']);
                if (!empty($inner_play) && strpos($inner_play, 'http') !== 0) {
                    $path = $inner_play;
                }
            }
        }
    }

    if (strpos($path, 'http') === 0) {
        $url = $path;
    } else {
        if (strpos($path, 'play') === false && preg_match('/^\d+-\d+-\d+/', $path)) {
            $path = '/play/' . $path;
        }
        if (substr($path, 0, 1) !== '/') {
            $path = '/' . $path;
        }
        $url = SITE_URL . $path;
    }

    $html = get_web_content($url);
    $real_url = '';

    if (preg_match('/data-m3u8="(.*?)"/', $html, $matches)) {
        $real_url = $matches[1];
    } 
    
    if (empty($real_url)) {
        if (preg_match_all('/"url":"(.*?)"/', $html, $matches)) {
            foreach ($matches[1] as $val) {
                $val = str_replace('\\/', '/', $val);
                if (strpos($val, 'http') === 0 || strpos($val, '/') === 0) {
                    $real_url = $val;
                    break; 
                }
            }
        }
    }

    if (empty($real_url)) {
        if (preg_match('/(http[s]?:\/\/[\w\.\/\-]+\.m3u8[\w\-\.\?=&]+)/', $html, $matches)) {
            $real_url = $matches[1];
        }
    }

    if (!empty($real_url)) {
        $real_url = htmlspecialchars_decode($real_url);
        $data = [
            "parse" => 0, 
            "playUrl" => "",
            "url" => $real_url,
            "header" => [
                "User-Agent" => UA,
                "Origin" => SITE_URL,
                "Referer" => SITE_URL . "/"
            ]
        ];
    } else {
        $data = [
            "parse" => 1, 
            "playUrl" => "",
            "url" => $url,
            "header" => [
                "User-Agent" => UA
            ]
        ];
    }
    echo_json($data);
}

function echo_json($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function parse_search_results($html, $wd = '') {
    $list = [];
    $blocks = explode('class="search-box', $html);
    array_shift($blocks); 

    foreach ($blocks as $block) {
        preg_match('/href="\/detail\/(\d+)/', $block, $m_id);
        $vid = $m_id[1] ?? '';
        if (empty($vid)) continue;

        preg_match('/class="thumb-txt[^"]*">([^<]+)</', $block, $m_title);
        $name = trim($m_title[1] ?? '');
        if (empty($name)) {
            preg_match('/title="([^"]+)"/', $block, $m_title_alt);
            $name = $m_title_alt[1] ?? '未知';
        }

        // 关键词过滤
        if (!empty($wd)) {
            $keyword = urldecode($wd);
            if (mb_stripos($name, $keyword) === false) {
                continue; 
            }
        }

        $pic = '';
        if (preg_match('/src="(http[^"]+)"/', $block, $m_pic)) {
            $pic = $m_pic[1];
        }
        $pic = htmlspecialchars_decode($pic);

        preg_match('/class="public-list-prb[^"]*">([^<]+)</', $block, $m_rem);
        $remark = trim($m_rem[1] ?? '');

        $list[] = [
            "vod_id" => $vid,
            "vod_name" => $name,
            "vod_pic" => $pic,
            "vod_remarks" => $remark
        ];
    }
    return $list;
}

function parse_video_list_robust($html) {
    $list = [];
    $blocks = explode('class="public-list-box', $html);
    array_shift($blocks); 
    foreach ($blocks as $block) {
        preg_match('/href="\/detail\/(\d+)"/', $block, $m_id);
        if (empty($m_id[1])) continue;
        $vid = $m_id[1];
        preg_match('/title="([^"]+)"/', $block, $m_title);
        $name = $m_title[1] ?? '未知';
        $pic = '';
        if (preg_match('/z-image-loader-url="([^"]+)"/', $block, $m_zimg)) {
            $pic = str_replace('`', '', $m_zimg[1]);
        }
        if (empty($pic) && preg_match('/src="([^"]+)"/', $block, $m_src)) {
            $pic = $m_src[1];
        }
        if (!empty($pic) && strpos($pic, 'http') === false) {
            if (strpos($pic, '//') === 0) $pic = 'https:' . $pic;
            else $pic = SITE_URL . $pic;
        }
        $pic = htmlspecialchars_decode($pic);
        
        preg_match('/class="[^"]*public-list-prb[^"]*">([\s\S]*?)<\/span>/', $block, $m_rem);
        $remark = trim(strip_tags($m_rem[1] ?? ''));
        $list[] = [
            "vod_id" => $vid,
            "vod_name" => $name,
            "vod_pic" => $pic,
            "vod_remarks" => $remark
        ];
    }
    return $list;
}

function get_web_content($url) {
    if (DEBUG_MODE) write_log("CURL Fetching: $url");
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    
    // 1. 开启 GZIP 压缩 (性能提升关键)
    // 允许服务器返回 gzip 压缩的数据，curl 会自动解压
    curl_setopt($ch, CURLOPT_ENCODING, ''); 
    
    // 2. 强制 IPv4
    // 避免 IPv6 解析超时或失败，通常 IPv4 响应更快
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

    // 3. 优化超时时间
    // 连接超时 3秒，总超时 10秒
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_USERAGENT, UA);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    
    $data = curl_exec($ch);
    
    if (DEBUG_MODE) {
        if ($data === false) {
            write_log("CURL Error: " . curl_error($ch));
        } else {
            write_log("CURL Success: Got " . strlen($data) . " bytes");
        }
    }
    
    curl_close($ch);
    return $data;
}
?>
