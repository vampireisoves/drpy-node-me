<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $HOST = 'https://www.aowu.tv';
    // 使用手机 UA 防止拦截
    private $UA = 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36';

    protected function getHeaders() {
        return [
            'User-Agent: ' . $this->UA,
            'Referer: ' . $this->HOST
        ];
    }

    private function fixUrl($url) {
        if (empty($url)) return '';
        if (strpos($url, '//') === 0) return 'https:' . $url;
        if (strpos($url, '/') === 0) return $this->HOST . $url;
        if (strpos($url, 'http') !== 0) return $this->HOST . '/' . $url;
        return $url;
    }

    // 解析 HTML 列表 (首页/搜索用)
    private function parseHtmlList($html, $isSearch = false) {
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
                        'vod_id' => $this->fixUrl($href),
                        'vod_name' => trim($title),
                        'vod_pic' => $this->fixUrl($pic),
                        'vod_remarks' => trim($remarks)
                    ];
                }
            }
        }
        return $videos;
    }

    public function homeContent($filter) {
        // 首页 (精选 + 筛选配置)
        $html = $this->fetch($this->HOST . '/', [], $this->getHeaders());
        $list = $this->parseHtmlList($html, false);
        $list = array_slice($list, 0, 20);

        $classes = [
            ['type_id' => '20', 'type_name' => '🔥 当季新番'],
            ['type_id' => '21', 'type_name' => '🎬 番剧'],
            ['type_id' => '22', 'type_name' => '🎥 剧场']
        ];
        
        // 筛选配置
        $filters = $this->getFilters();

        return [
            'class' => $classes,
            'filters' => $filters,
            'list' => $list
        ];
    }

    // 筛选配置 (参照 JS 源码配置)
    private function getFilters() {
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

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $apiUrl = $this->HOST . '/index.php/ds_api/vod';
    
        // 构建 POST 数据
        $postParams = [
            'type' => $tid,
            'class' => $extend['class'] ?? '',
            'year' => $extend['year'] ?? '',
            'by' => $extend['by'] ?? 'time', // 默认按最新
            'page' => $pg
        ];
        
        // 发送 POST 请求 (必须带上 content-type)
        $headers = array_merge($this->getHeaders(), [
            'Content-Type: application/x-www-form-urlencoded; charset=utf-8'
        ]);
        
        $jsonStr = $this->fetch($apiUrl, [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => http_build_query($postParams),
            CURLOPT_HTTPHEADER => $headers
        ]);
        
        $jsonObj = json_decode($jsonStr, true);
        $list = [];

        if ($jsonObj && isset($jsonObj['list']) && is_array($jsonObj['list'])) {
            foreach ($jsonObj['list'] as $it) {
                $list[] = [
                    'vod_id' => $this->fixUrl($it['url']),
                    'vod_name' => $it['vod_name'],
                    'vod_pic' => $this->fixUrl($it['vod_pic']),
                    'vod_remarks' => $it['vod_remarks']
                ];
            }
        }
        
        $total = $jsonObj['total'] ?? 0;
        $limit = $jsonObj['limit'] ?? 30;
        
        return $this->pageResult($list, $pg, $total, $limit);
    }

    public function detailContent($ids) {
        $id = is_array($ids) ? $ids[0] : $ids;
        $url = (strpos($id, 'http') === 0) ? $id : $this->fixUrl($id);
        $html = $this->fetch($url, [], $this->getHeaders());

        $vod = [
            'vod_id' => $id, 'vod_name' => '', 'vod_pic' => '', 
            'vod_content' => '', 'vod_play_from' => '', 'vod_play_url' => ''
        ];

        if ($html) {
            if (preg_match('/<title>(.*?)<\/title>/', $html, $m)) 
                $vod['vod_name'] = trim(preg_replace('/\s*-\s*嗷呜动漫.*$/', '', $m[1]));
            
            if (preg_match('/data-original="([^"]+)"/', $html, $m)) $vod['vod_pic'] = $this->fixUrl($m[1]);
            elseif (preg_match('/class="detail-pic"[^>]*src="([^"]+)"/', $html, $m)) $vod['vod_pic'] = $this->fixUrl($m[1]);
            
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
                            $episodes[] = trim(strip_tags($links[2][$k])) . '$' . $this->fixUrl($href);
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

        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $url = $this->HOST . '/search/' . urlencode($key) . '----------' . $pg . '---.html';
        $html = $this->fetch($url, [], $this->getHeaders());
        $list = $this->parseHtmlList($html, true);
        
        return $this->pageResult($list, $pg, 0, 30);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $url = $id;
        if (strpos($url, 'http') === false) $url = $this->fixUrl($url);

        return [
            'parse' => 1, // 开启嗅探
            'url' => $url,
            'header' => [
                'User-Agent' => $this->UA,
                'Referer' => $this->HOST . '/'
            ]
        ];
    }
}

// 运行爬虫
(new Spider())->run();
