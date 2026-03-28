<?php
/**
 * TVB云播 - T4 格式独立版
 * 基于哇哇影视模板格式修改
 */

header('Content-Type: application/json; charset=utf-8');
error_reporting(0);

// ================= 基础配置 =================
$HOST = 'http://www.viptv01.com';

// ================= 工具函数 =================
function fetch($url, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    $data = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode != 200) {
        return '';
    }
    return $data;
}

/**
 * 处理图片URL
 */
function processImageUrl($imgUrl, $baseHost = '') {
    if (empty($imgUrl)) {
        return '';
    }
    
    // 清理URL
    $imgUrl = trim($imgUrl);
    $imgUrl = html_entity_decode($imgUrl, ENT_QUOTES | ENT_HTML5);
    
    // 移除查询参数（如果有）
    $imgUrl = preg_replace('/\?.*$/', '', $imgUrl);
    
    // 处理相对路径
    if (!preg_match('/^https?:\/\//', $imgUrl)) {
        if (strpos($imgUrl, '//') === 0) {
            $imgUrl = 'http:' . $imgUrl;
        } elseif (strpos($imgUrl, '/') === 0) {
            $imgUrl = $baseHost . $imgUrl;
        } else {
            $imgUrl = $baseHost . '/' . $imgUrl;
        }
    }
    
    return $imgUrl;
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
    
    if (isset($playData['url'])) {
        $url = $playData['url'];
        $response = fetch($url);
        
        if (empty($response)) {
            echo json_encode([
                'parse' => 1,
                'url' => $url
            ]);
            exit;
        }
        
        // 尝试提取播放地址
        $playUrl = '';
        
        // 模式1: player_xxxx = { ... }
        if (preg_match('/player_[^=]*=\s*(\{[^;]+\});/s', $response, $playerMatch)) {
            try {
                $playerData = json_decode($playerMatch[1], true);
                
                if (isset($playerData['url'])) {
                    $playUrl = $playerData['url'];
                    
                    // 处理加密
                    if (isset($playerData['encrypt'])) {
                        if ($playerData['encrypt'] == '1') {
                            $playUrl = urldecode($playUrl);
                        } elseif ($playerData['encrypt'] == '2') {
                            $playUrl = base64_decode($playUrl);
                        }
                    }
                }
            } catch (Exception $e) {
                // 忽略JSON解析错误
            }
        }
        
        // 模式2: 直接查找视频URL
        if (empty($playUrl)) {
            $videoPatterns = [
                '/"url"\s*:\s*"([^"]+\.(?:m3u8|mp4)[^"]*)"/',
                '/"url":"([^"]+\.(?:m3u8|mp4)[^"]*)"/',
                '/src="([^"]+\.(?:m3u8|mp4)[^"]*)"/',
                '/file:\s*["\']([^"\']+\.(?:m3u8|mp4)[^"\']*)["\']/'
            ];
            
            foreach ($videoPatterns as $pattern) {
                if (preg_match($pattern, $response, $urlMatch)) {
                    $playUrl = $urlMatch[1];
                    break;
                }
            }
        }
        
        // 清理URL
        if (!empty($playUrl)) {
            // 解码HTML实体
            $playUrl = html_entity_decode($playUrl, ENT_QUOTES | ENT_HTML5);
            
            // 修复斜杠转义
            $playUrl = str_replace('\/', '/', $playUrl);
            $playUrl = trim($playUrl);
            
            // 如果是相对路径，转换为绝对路径
            if (!preg_match('/^https?:\/\//', $playUrl)) {
                if (strpos($playUrl, '//') === 0) {
                    $playUrl = 'http:' . $playUrl;
                } elseif (strpos($playUrl, '/') === 0) {
                    $playUrl = $HOST . $playUrl;
                } else {
                    $playUrl = $HOST . '/' . $playUrl;
                }
            }
            
            echo json_encode([
                'parse' => 0,
                'url' => $playUrl,
                'header' => [
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer' => $HOST
                ]
            ]);
            exit;
        }
        
        // 如果无法解析，返回原始页面
        echo json_encode([
            'parse' => 1,
            'url' => $url
        ]);
        exit;
    }
    
    echo json_encode([
        'parse' => 1,
        'url' => ''
    ]);
    exit;
}

// 2. 视频详情
if ($ids) {
    $url = $HOST . $ids;
    $response = fetch($url);
    
    if (empty($response)) {
        echo json_encode(['list' => []]);
        exit;
    }
    
    $vod = [
        'vod_id' => $ids,
        'vod_name' => '',
        'vod_pic' => '',
        'vod_type' => '',
        'vod_year' => '',
        'vod_area' => '',
        'vod_content' => '',
        'vod_remarks' => '',
        'vod_play_from' => '',
        'vod_play_url' => ''
    ];
    
    // 提取标题
    if (preg_match('/<h1[^>]*?class="[^"]*?title[^"]*?"[^>]*?>([^<]+)<\/h1>/', $response, $titleMatch)) {
        $vod['vod_name'] = htmlspecialchars_decode(trim($titleMatch[1]));
    }
    
    // 提取图片
    if (preg_match('/<img[^>]*?class="[^"]*?lazyload[^"]*?"[^>]*?data-original="([^"]+)"[^>]*?>/', $response, $picMatch)) {
        $vod['vod_pic'] = processImageUrl(trim($picMatch[1]), $HOST);
    }
    
    // 提取类型、年份、地区
    $dataPattern = '/<span[^>]*?class="[^"]*?data[^"]*?"[^>]*?>(.*?)<\/span>/s';
    if (preg_match_all($dataPattern, $response, $dataMatches, PREG_SET_ORDER)) {
        foreach ($dataMatches as $index => $dataMatch) {
            $dataHtml = $dataMatch[1];
            if (preg_match_all('/<a[^>]*?>([^<]+)<\/a>/', $dataHtml, $linkMatches)) {
                if ($index === 0 && isset($linkMatches[1][0])) {
                    $vod['vod_area'] = $linkMatches[1][0];
                }
                if ($index === 0 && isset($linkMatches[1][1])) {
                    $vod['vod_type'] = $linkMatches[1][1];
                }
                if ($index === 0 && isset($linkMatches[1][2])) {
                    $vod['vod_year'] = $linkMatches[1][2];
                }
            }
        }
    }
    
    // 提取剧情简介
    if (preg_match('/<div[^>]*?class="[^"]*?text-collapse[^"]*?"[^>]*?>.*?<span[^>]*?>(.*?)<\/span>/s', $response, $descMatch)) {
        $vod['vod_content'] = trim(strip_tags($descMatch[1]));
    }
    
    // 提取播放列表
    $playFrom = [];
    $playUrl = [];
    
    // 查找播放面板
    $panelPattern = '/<div[^>]*?class="[^"]*?myui-panel[^"]*?"[^>]*?>.*?<h3[^>]*?class="[^"]*?title[^"]*?"[^>]*?>([^<]+)<\/h3>.*?<ul[^>]*?class="[^"]*?myui-content__list[^"]*?"[^>]*?>(.*?)<\/ul>/s';
    
    if (preg_match_all($panelPattern, $response, $panelMatches, PREG_SET_ORDER)) {
        foreach ($panelMatches as $panelMatch) {
            $title = trim($panelMatch[1]);
            $listHtml = $panelMatch[2];
            
            // 排除非播放列表的面板
            if (strpos($title, '猜你喜欢') !== false || 
                strpos($title, '热播') !== false ||
                strpos($title, '剧情介绍') !== false ||
                strpos($title, '演员') !== false ||
                strpos($title, '角色') !== false) {
                continue;
            }
            
            // 提取剧集
            $episodes = [];
            if (preg_match_all('/<a[^>]*?href="([^"]+)"[^>]*?>([^<]+)<\/a>/', $listHtml, $epMatches, PREG_SET_ORDER)) {
                foreach ($epMatches as $epMatch) {
                    $epName = trim($epMatch[2]);
                    $epUrl = $epMatch[1];
                    $episodes[] = $epName . '$' . base64_encode(json_encode(['url' => $HOST . $epUrl]));
                }
            }
            
            if (!empty($episodes)) {
                // 清理标题
                $cleanTitle = preg_replace('/播放列表$|线路\d+$/', '', $title);
                $cleanTitle = trim($cleanTitle);
                
                if (empty($cleanTitle)) {
                    $cleanTitle = '线路' . (count($playFrom) + 1);
                }
                
                $playFrom[] = $cleanTitle;
                $playUrl[] = implode('#', $episodes);
            }
        }
    }
    
    if (!empty($playFrom)) {
        $vod['vod_play_from'] = implode('$$$', $playFrom);
        $vod['vod_play_url'] = implode('$$$', $playUrl);
    }
    
    echo json_encode(['list' => [$vod]], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. 搜索
if ($wd) {
    $encodedKey = urlencode($wd);
    $url = $HOST . "/vod/search/page/{$pg}?wd={$encodedKey}&submit=";
    
    $response = fetch($url);
    
    if (empty($response)) {
        echo json_encode(['list' => [], 'page' => $pg, 'pagecount' => 0, 'limit' => 20]);
        exit;
    }
    
    $list = [];
    
    // 使用与categoryContent相同的方法提取搜索结果
    $pattern = '/<li class="col-lg-8[^"]*">(.*?)<\/li>/s';
    
    if (preg_match_all($pattern, $response, $itemMatches, PREG_SET_ORDER)) {
        foreach ($itemMatches as $itemMatch) {
            $itemHtml = $itemMatch[1];
            
            // 提取链接
            if (preg_match('/<a[^>]*?class="[^"]*?myui-vodlist__thumb[^"]*?"[^>]*?href="([^"]+)"[^>]*?title="([^"]*?)"/s', $itemHtml, $linkMatch)) {
                $vod_id = $linkMatch[1];
                $vod_name = htmlspecialchars_decode($linkMatch[2]);
                
                // 检查是否包含搜索关键词
                if (stripos($vod_name, $wd) === false) {
                    continue;
                }
                
                // 提取图片
                $vod_pic = '';
                if (preg_match('/data-original="([^"]+)"/', $itemHtml, $imgMatch)) {
                    $vod_pic = trim($imgMatch[1]);
                }
                
                // 处理图片URL
                $vod_pic = processImageUrl($vod_pic, $HOST);
                
                // 提取备注
                $vod_remarks = '';
                if (preg_match('/<span[^>]*?class="[^"]*?tag[^"]*?"[^>]*?>([^<]+)<\/span>/', $itemHtml, $remarkMatch)) {
                    $vod_remarks = trim($remarkMatch[1]);
                }
                
                $list[] = [
                    'vod_id' => $vod_id,
                    'vod_name' => $vod_name,
                    'vod_pic' => $vod_pic,
                    'vod_remarks' => $vod_remarks
                ];
            }
        }
    }
    
    // 获取总页数
    $pagecount = intval($pg);
    if (preg_match_all('/<a[^>]*?href="[^"]*?\/page\/(\d+)[^"]*?"[^>]*?>\d+<\/a>/', $response, $pageMatches)) {
        if (!empty($pageMatches[1])) {
            $pagecount = max($pageMatches[1]);
        }
    }
    
    echo json_encode([
        'list' => $list,
        'page' => intval($pg),
        'pagecount' => $pagecount,
        'limit' => 20,
        'total' => count($list)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 4. 分类列表
if ($ac === 'detail' && $t) {
    $url = $HOST . "/vod/show/id/{$t}/page/{$pg}.html";
    $response = fetch($url);
    
    if (empty($response)) {
        echo json_encode(['list' => [], 'page' => $pg, 'pagecount' => 0, 'limit' => 20]);
        exit;
    }
    
    $list = [];
    
    // 根据实际HTML结构提取数据
    // 匹配每个视频项
    $pattern = '/<li class="col-lg-8[^"]*">(.*?)<\/li>/s';
    
    if (preg_match_all($pattern, $response, $itemMatches, PREG_SET_ORDER)) {
        foreach ($itemMatches as $itemMatch) {
            $itemHtml = $itemMatch[1];
            
            // 提取链接
            if (preg_match('/<a[^>]*?class="[^"]*?myui-vodlist__thumb[^"]*?"[^>]*?href="([^"]+)"[^>]*?title="([^"]*?)"/s', $itemHtml, $linkMatch)) {
                $vod_id = $linkMatch[1];
                $vod_name = htmlspecialchars_decode($linkMatch[2]);
                
                // 提取图片 - 从data-original属性中获取
                $vod_pic = '';
                if (preg_match('/data-original="([^"]+)"/', $itemHtml, $imgMatch)) {
                    $vod_pic = trim($imgMatch[1]);
                }
                
                // 如果data-original没有，尝试其他属性
                if (empty($vod_pic)) {
                    $imgAttrs = ['data-src', 'src'];
                    foreach ($imgAttrs as $attr) {
                        if (preg_match('/' . $attr . '="([^"]+)"/', $itemHtml, $altImgMatch)) {
                            $vod_pic = trim($altImgMatch[1]);
                            break;
                        }
                    }
                }
                
                // 处理图片URL
                $vod_pic = processImageUrl($vod_pic, $HOST);
                
                // 提取备注
                $vod_remarks = '';
                if (preg_match('/<span[^>]*?class="[^"]*?tag[^"]*?"[^>]*?>([^<]+)<\/span>/', $itemHtml, $remarkMatch)) {
                    $vod_remarks = trim($remarkMatch[1]);
                }
                
                $list[] = [
                    'vod_id' => $vod_id,
                    'vod_name' => $vod_name,
                    'vod_pic' => $vod_pic,
                    'vod_remarks' => $vod_remarks
                ];
            }
        }
    }
    
    // 备用方法：直接搜索所有详情链接和图片
    if (empty($list)) {
        // 查找所有包含data-original的图片和对应的链接
        $pattern = '/<a[^>]*?href="(\/vod\/detail[^"]+)"[^>]*?title="([^"]*?)"[^>]*?>.*?<img[^>]*?data-original="([^"]+)"[^>]*?>/s';
        
        if (preg_match_all($pattern, $response, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $vod_id = $match[1];
                $vod_name = htmlspecialchars_decode($match[2]);
                $vod_pic = trim($match[3]);
                $vod_pic = processImageUrl($vod_pic, $HOST);
                
                $list[] = [
                    'vod_id' => $vod_id,
                    'vod_name' => $vod_name,
                    'vod_pic' => $vod_pic,
                    'vod_remarks' => ''
                ];
            }
        }
    }
    
    // 获取总页数
    $pagecount = 999;
    $paginationPattern = '/<ul[^>]*?class="[^"]*?myui-pager[^"]*?"[^>]*?>(.*?)<\/ul>/s';
    
    if (preg_match($paginationPattern, $response, $paginationMatch)) {
        $paginationHtml = $paginationMatch[1];
        if (preg_match_all('/<li[^>]*?><a[^>]*?>(\d+)<\/a><\/li>/', $paginationHtml, $pageMatches)) {
            if (!empty($pageMatches[1])) {
                $pagecount = max($pageMatches[1]);
            }
        }
    }
    
    echo json_encode([
        'list' => $list,
        'page' => intval($pg),
        'pagecount' => $pagecount,
        'limit' => 20,
        'total' => count($list)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. 首页
$classes = [
    ['type_id' => '2', 'type_name' => '剧集'],
    ['type_id' => '1', 'type_name' => '电影'],
    ['type_id' => '3', 'type_name' => '综艺'],
    ['type_id' => '4', 'type_name' => '动漫'],
    ['type_id' => '5', 'type_name' => '短剧'],
    ['type_id' => '16', 'type_name' => '日韩剧'],
    ['type_id' => '13', 'type_name' => '国产剧'],
    ['type_id' => '15', 'type_name' => '欧美剧'],
    ['type_id' => '14', 'type_name' => '港台剧']
];

// 生成筛选条件（TVB云播无筛选，生成空筛选）
$filters = [];
foreach ($classes as $class) {
    $filters[$class['type_id']] = [];
}

echo json_encode([
    'class' => $classes,
    'filters' => $filters,
    'list' => [], // 首页推荐列表为空，如需可自行实现
    'page' => 1,
    'pagecount' => 1,
    'limit' => 20,
    'total' => 20
], JSON_UNESCAPED_UNICODE);