<?php
/**
 * B站视频爬虫 - PHP 适配版 (道长重构)
 * 按照 BaseSpider 结构重写
 */

require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    
    private $cookie = [];

    public function init($extend = '') {
        $this->headers['Referer'] = "https://www.bilibili.com";
        // 配置初始 Cookie
        // 实际使用时，建议通过 ext 传入 cookie
        $configCookie = 'buvid3=xxxx; SESSDATA=xxxx;';
        
        // 尝试从 extend 获取 cookie (假设 extend 是 JSON 字符串或直接是 cookie 字符串)
        // 这里简化处理：如果 extend 包含 SESSDATA，则认为是 cookie
        if (!empty($extend)) {
            if (strpos($extend, 'SESSDATA') !== false) {
                $configCookie = $extend;
            } elseif (is_array($extend) && isset($extend['cookie'])) {
                $configCookie = $extend['cookie'];
            } else {
                // 尝试解析 json
                $json = json_decode($extend, true);
                if (isset($json['cookie'])) {
                    $configCookie = $json['cookie'];
                }
            }
        }
        
        $this->cookie = $this->parseCookie($configCookie);
    }
    
    private function parseCookie($cookieStr) {
        if (empty($cookieStr)) return [];
        $cookies = [];
        $pairs = explode(';', $cookieStr);
        foreach ($pairs as $pair) {
            $pair = trim($pair);
            if (strpos($pair, '=') !== false) {
                list($name, $value) = explode('=', $pair, 2);
                $cookies[trim($name)] = trim($value);
            }
        }
        return $cookies;
    }
    
    private function buildCookieString() {
        $pairs = [];
        foreach ($this->cookie as $name => $value) {
            $pairs[] = $name . '=' . $value;
        }
        return implode('; ', $pairs);
    }
    
    // 覆盖父类 fetch 以自动添加 cookie
    protected function fetch($url, $options = [], $headers = []) {
        if (!isset($options['cookie'])) {
            $cookieStr = $this->buildCookieString();
            if (!empty($cookieStr)) {
                $options['cookie'] = $cookieStr;
            }
        }
        return parent::fetch($url, $options, $headers);
    }

    public function homeContent($filter = []) {
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

    public function homeVideoContent() {
        $url = 'https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1';
        $data = json_decode($this->fetch($url), true);
        
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

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $page = max(1, intval($pg));
        
        $url = 'https://api.bilibili.com/x/web-interface/search/type';
        $params = [
            'search_type' => 'video',
            'keyword' => $tid,
            'page' => $page
        ];
        $url .= '?' . http_build_query($params);
        
        $data = json_decode($this->fetch($url), true);
        
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
        
        return $this->pageResult($videos, $page, $total, 20);
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        return $this->categoryContent($key, $pg);
    }

    public function detailContent($ids) {
        if (empty($ids)) return ['list' => []];
        $vid = $ids[0];
        
        $url = 'https://api.bilibili.com/x/web-interface/view?aid=' . $vid;
        $data = json_decode($this->fetch($url), true);
        
        if (!isset($data['data'])) {
            return ['list' => []];
        }
        
        $video = $data['data'];
        
        // 构建播放列表
        $playUrl = '';
        foreach ($video['pages'] as $index => $page) {
            $part = $page['part'] ?: '第' . ($index + 1) . '集';
            // 构造 playId: avid_cid
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

    public function playerContent($flag, $id, $vipFlags = []) {
        if (strpos($id, '_') !== false) {
            list($avid, $cid) = explode('_', $id);
        } else {
            return ['parse' => 0, 'url' => '', 'error' => '无效的视频ID格式'];
        }
        
        $url = 'https://api.bilibili.com/x/player/playurl';
        $params = [
            'avid' => $avid,
            'cid' => $cid,
            'qn' => 112, // 原画质量
            'fnval' => 0,
        ];
        $url .= '?' . http_build_query($params);
        
        $data = json_decode($this->fetch($url), true);
        
        if (!isset($data['data']) || $data['code'] !== 0) {
             return ['parse' => 0, 'url' => '', 'error' => '获取播放地址失败'];
        }
        
        // 直接返回第一个播放地址
        if (isset($data['data']['durl'][0]['url'])) {
            $playUrl = $data['data']['durl'][0]['url'];
            
            $headers = $this->headers;
            $headers['Referer'] = 'https://www.bilibili.com/video/av' . $avid;
            $headers['Origin'] = 'https://www.bilibili.com';
            
            return [
                'parse' => 0,
                'url' => $playUrl,
                'header' => $headers,
                'danmaku' => "https://api.bilibili.com/x/v1/dm/list.so?oid={$cid}"
            ];
        }
        
        return ['parse' => 0, 'url' => '', 'error' => '无法获取播放地址'];
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
}

(new Spider())->run();
