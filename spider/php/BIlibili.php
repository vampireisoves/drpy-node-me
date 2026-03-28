<?php
// B站视频爬虫 - 简洁可用版（移除search相关代码）
header('Content-Type: application/json; charset=utf-8');

class BiliBiliSpider {
    private $extendDict = [];
    private $cookie = [];
    private $header = [
        "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.54 Safari/537.36",
        "Referer" => "https://www.bilibili.com"
    ];
    
    public function __construct() {
        $this->extendDict = $this->getExtendDict();
        $this->cookie = $this->getCookie();
    }
    
    private function getExtendDict() {
        return [
            'cookie' => $this->getConfigCookie(),
            'thread' => '0'
        ];
    }
    
    private function getConfigCookie() {
        // 配置您的B站Cookie
        return 'buvid3=xxxx; SESSDATA=xxxx;';
    }
    
    private function getCookie() {
        $cookie = $this->extendDict['cookie'] ?? '';
        if (empty($cookie)) return [];
        
        $cookies = [];
        $pairs = explode(';', $cookie);
        foreach ($pairs as $pair) {
            $pair = trim($pair);
            if (strpos($pair, '=') !== false) {
                list($name, $value) = explode('=', $pair, 2);
                $cookies[trim($name)] = trim($value);
            }
        }
        return $cookies;
    }
    
    private function httpRequest($url, $params = []) {
        $ch = curl_init();
        
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        $headers = [];
        foreach ($this->header as $key => $value) {
            $headers[] = $key . ': ' . $value;
        }
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_COOKIE => $this->buildCookieString(),
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_FOLLOWLOCATION => true
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true) ?: [];
    }
    
    private function buildCookieString() {
        $pairs = [];
        foreach ($this->cookie as $name => $value) {
            $pairs[] = $name . '=' . $value;
        }
        return implode('; ', $pairs);
    }
    
    // homeContent - 首页分类
    public function homeContent() {
        $classes = [
            ["type_id" => "沙雕仙逆", "type_name" => "傻屌仙逆"],
            ["type_id" => "沙雕动画", "type_name" => "沙雕动画"],
            ["type_id" => "纪录片超清", "type_name" => "纪录片"],
            ["type_id" => "演唱会超清", "type_name" => "演唱会"],
            ["type_id" => "音乐超清", "type_name" => "流行音乐"],
            ["type_id" => "美食超清", "type_name" => "美食"],
            ["type_id" => "食谱", "type_name" => "食谱"],
            ["type_id" => "体育超清", "type_name" => "体育"],
            ["type_id" => "球星", "type_name" => "球星"],
            ["type_id" => "中小学教育", "type_name" => "教育"],
            ["type_id" => "幼儿教育", "type_name" => "幼儿教育"],
            ["type_id" => "旅游", "type_name" => "旅游"],
            ["type_id" => "风景4K", "type_name" => "风景"],
            ["type_id" => "说案", "type_name" => "说案"],
            ["type_id" => "知名UP主", "type_name" => "知名UP主"],
            ["type_id" => "探索发现超清", "type_name" => "探索发现"],
            ["type_id" => "鬼畜", "type_name" => "鬼畜"],
            ["type_id" => "搞笑超清", "type_name" => "搞笑"],
            ["type_id" => "儿童超清", "type_name" => "儿童"],
            ["type_id" => "动物世界超清", "type_name" => "动物世界"],
            ["type_id" => "相声小品超清", "type_name" => "相声小品"],
            ["type_id" => "戏曲", "type_name" => "戏曲"],
            ["type_id" => "解说", "type_name" => "解说"],
            ["type_id" => "演讲", "type_name" => "演讲"],
            ["type_id" => "小姐姐超清", "type_name" => "小姐姐"],
            ["type_id" => "荒野求生超清", "type_name" => "荒野求生"],
            ["type_id" => "健身", "type_name" => "健身"],
            ["type_id" => "帕梅拉", "type_name" => "帕梅拉"],
            ["type_id" => "太极拳", "type_name" => "太极拳"],
            ["type_id" => "广场舞", "type_name" => "广场舞"],
            ["type_id" => "舞蹈", "type_name" => "舞蹈"],
            ["type_id" => "音乐", "type_name" => "音乐"],
            ["type_id" => "歌曲", "type_name" => "歌曲"],
            ["type_id" => "MV4K", "type_name" => "MV"],
            ["type_id" => "舞曲超清", "type_name" => "舞曲"],
            ["type_id" => "4K", "type_name" => "4K"],
            ["type_id" => "电影", "type_name" => "电影"],
            ["type_id" => "电视剧", "type_name" => "电视剧"],
            ["type_id" => "白噪音超清", "type_name" => "白噪音"],
            ["type_id" => "考公考证", "type_name" => "考公考证"],
            ["type_id" => "平面设计教学", "type_name" => "平面设计教学"],
            ["type_id" => "软件教程", "type_name" => "软件教程"],
            ["type_id" => "Windows", "type_name" => "Windows"]
        ];
        
        return ['class' => $classes];
    }
    
    // homeVideoContent - 首页推荐视频
    public function homeVideoContent() {
        $url = 'https://api.bilibili.com/x/web-interface/popular';
        $data = $this->httpRequest($url, ['ps' => 20, 'pn' => 1]);
        
        $videos = [];
        if (isset($data['data']['list'])) {
            foreach ($data['data']['list'] as $item) {
                $videos[] = [
                    'vod_id' => $item['aid'],
                    'vod_name' => strip_tags($item['title']),
                    'vod_pic' => $item['pic'],
                    'vod_remarks' => $this->formatDuration($item['duration'])
                ];
            }
        }
        
        return ['list' => $videos];
    }
    
    // categoryContent - 分类内容（使用搜索API）
    public function categoryContent($tid, $page, $filters = []) {
        $page = max(1, intval($page));
        
        $url = 'https://api.bilibili.com/x/web-interface/search/type';
        $params = [
            'search_type' => 'video',
            'keyword' => $tid,
            'page' => $page
        ];
        
        $data = $this->httpRequest($url, $params);
        
        $videos = [];
        if (isset($data['data']['result'])) {
            foreach ($data['data']['result'] as $item) {
                if ($item['type'] !== 'video') continue;
                
                $videos[] = [
                    'vod_id' => $item['aid'],
                    'vod_name' => strip_tags($item['title']),
                    'vod_pic' => 'https:' . $item['pic'],
                    'vod_remarks' => $this->formatSearchDuration($item['duration'])
                ];
            }
        }
        
        $pageCount = $data['data']['numPages'] ?? 1;
        $total = $data['data']['numResults'] ?? count($videos);
        
        return [
            'list' => $videos,
            'page' => $page,
            'pagecount' => $pageCount,
            'limit' => 20,
            'total' => $total
        ];
    }
    
    // detailContent - 视频详情
    public function detailContent($vid) {
        $url = 'https://api.bilibili.com/x/web-interface/view';
        $data = $this->httpRequest($url, ['aid' => $vid]);
        
        if (!isset($data['data'])) {
            return ['list' => []];
        }
        
        $video = $data['data'];
        
        // 构建播放列表
        $playUrl = '';
        foreach ($video['pages'] as $index => $page) {
            $part = $page['part'] ?: '第' . ($index + 1) . '集';
            $duration = $this->formatDuration($page['duration']);
            $playUrl .= "{$part}\${$vid}_{$page['cid']}#";
        }
        
        $vod = [
            "vod_id" => $vid,
            "vod_name" => strip_tags($video['title']),
            "vod_pic" => $video['pic'],
            "vod_content" => $video['desc'],
            "vod_play_from" => "B站视频",
            "vod_play_url" => rtrim($playUrl, '#')
        ];
        
        return ['list' => [$vod]];
    }
    
    // playContent - 播放地址（高清优化）
    public function playContent($vid) {
        if (strpos($vid, '_') !== false) {
            list($avid, $cid) = explode('_', $vid);
        } else {
            return $this->errorResponse('无效的视频ID格式');
        }
        
        // 使用高质量参数
        $url = 'https://api.bilibili.com/x/player/playurl';
        $params = [
            'avid' => $avid,
            'cid' => $cid,
            'qn' => 112, // 原画质量
            'fnval' => 0,
        ];
        
        $data = $this->httpRequest($url, $params);
        
        if (!isset($data['data']) || $data['code'] !== 0) {
            return $this->errorResponse('获取播放地址失败');
        }
        
        // 直接返回第一个播放地址
        if (isset($data['data']['durl'][0]['url'])) {
            $playUrl = $data['data']['durl'][0]['url'];
            
            $headers = $this->header;
            $headers['Referer'] = 'https://www.bilibili.com/video/av' . $avid;
            $headers['Origin'] = 'https://www.bilibili.com';
            
            return [
                'parse' => 0,
                'url' => $playUrl,
                'header' => $headers,
                'danmaku' => "https://api.bilibili.com/x/v1/dm/list.so?oid={$cid}"
            ];
        }
        
        return $this->errorResponse('无法获取播放地址');
    }
    
    // 工具函数
    private function formatDuration($seconds) {
        if ($seconds <= 0) return '00:00';
        $minutes = floor($seconds / 60);
        $secs = $seconds % 60;
        return sprintf('%02d:%02d', $minutes, $secs);
    }
    
    private function formatSearchDuration($duration) {
        $parts = explode(':', $duration);
        if (count($parts) === 2) {
            return $duration;
        }
        return '00:00';
    }
    
    private function errorResponse($message) {
        return [
            'parse' => 0,
            'url' => '',
            'error' => $message
        ];
    }
}

// 主处理逻辑
$ac = $_GET['ac'] ?? 'detail';
$t = $_GET['t'] ?? '';
$pg = $_GET['pg'] ?? '1';
$f = $_GET['f'] ?? '';
$ids = $_GET['ids'] ?? '';
$id = $_GET['id'] ?? '';

$spider = new BiliBiliSpider();

try {
    switch ($ac) {
        case 'detail':
            if (!empty($ids)) {
                echo json_encode($spider->detailContent($ids));
            } elseif (!empty($t)) {
                $filters = !empty($f) ? json_decode($f, true) : [];
                echo json_encode($spider->categoryContent($t, $pg, $filters));
            } else {
                $result = $spider->homeContent();
                $videoResult = $spider->homeVideoContent();
                $result['list'] = $videoResult['list'];
                echo json_encode($result);
            }
            break;
            
        case 'play':
            echo json_encode($spider->playContent($id));
            break;
            
        default:
            echo json_encode(['error' => '未知操作: ' . $ac]);
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
