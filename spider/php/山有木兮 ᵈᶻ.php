<?php
/**
 * 山有木兮 - PHP 适配版 (道长重构)
 * 按照 BaseSpider 结构重写
 */

require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {

    private $HOST = 'https://film.symx.club';
    
    public function init($extend = '') {
        $this->headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36';
        $this->headers['Sec-Ch-Ua'] = '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"';
        $this->headers['Sec-Ch-Ua-Mobile'] = '?0';
        $this->headers['Sec-Ch-Ua-Platform'] = '"Windows"';
        $this->headers['Sec-Fetch-Dest'] = 'empty';
        $this->headers['Sec-Fetch-Mode'] = 'cors';
        $this->headers['Sec-Fetch-Site'] = 'same-origin';
        $this->headers['X-Platform'] = 'web';
        $this->headers['Accept'] = 'application/json, text/plain, */*';
        
        if (!empty($extend) && strpos($extend, 'http') === 0) {
            $this->HOST = rtrim($extend, '/');
        }
    }

    private function getHeaders($referer = '/') {
        $headers = $this->headers;
        $headers['Referer'] = $this->HOST . $referer;
        return $headers;
    }

    public function homeContent($filter = []) {
        $url = $this->HOST . "/api/category/top";
        $data = json_decode($this->fetch($url, [], $this->getHeaders()), true);
        
        $classes = [];
        if (isset($data['data'])) {
            foreach ($data['data'] as $item) {
                $classes[] = [
                    'type_id' => strval($item['id']),
                    'type_name' => $item['name']
                ];
            }
        }
        return ['class' => $classes];
    }

    public function homeVideoContent() {
        $url = $this->HOST . "/api/film/category";
        $data = json_decode($this->fetch($url, [], $this->getHeaders()), true);
        
        $list = [];
        if (isset($data['data'])) {
            foreach ($data['data'] as $category) {
                $filmList = $category['filmList'] ?? [];
                foreach ($filmList as $film) {
                    $list[] = [
                        'vod_id' => strval($film['id']),
                        'vod_name' => $film['name'],
                        'vod_pic' => $film['cover'],
                        'vod_remarks' => $film['doubanScore'] ?? ''
                    ];
                }
            }
        }
        return ['list' => array_slice($list, 0, 30)];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $pageNum = max(1, intval($pg));
        $url = $this->HOST . "/api/film/category/list?area=&categoryId={$tid}&language=&pageNum={$pageNum}&pageSize=15&sort=updateTime&year=";
        $data = json_decode($this->fetch($url, [], $this->getHeaders()), true);
        
        $list = [];
        if (isset($data['data']['list'])) {
            foreach ($data['data']['list'] as $item) {
                $list[] = [
                    'vod_id' => strval($item['id']),
                    'vod_name' => $item['name'],
                    'vod_pic' => $item['cover'],
                    'vod_remarks' => $item['updateStatus']
                ];
            }
        }
        
        $total = $data['data']['total'] ?? 0;
        return $this->pageResult($list, $pageNum, $total, 15);
    }

    public function detailContent($ids) {
        if (empty($ids)) return ['list' => []];
        $id = $ids[0]; // 只处理第一个ID
        
        $url = $this->HOST . "/api/film/detail?id=" . urlencode($id);
        $data = json_decode($this->fetch($url, [], $this->getHeaders()), true);
        
        if (!isset($data['data'])) {
            return ['list' => []];
        }
        
        $info = $data['data'];
        $shows = [];
        $play_urls = [];
        
        if (isset($info['playLineList'])) {
            foreach ($info['playLineList'] as $line) {
                $shows[] = $line['playerName'];
                $urls = [];
                if (isset($line['lines'])) {
                    foreach ($line['lines'] as $episode) {
                        $urls[] = $episode['name'] . '$' . $episode['id'];
                    }
                }
                $play_urls[] = implode('#', $urls);
            }
        }
        
        $vod = [
            'vod_id' => $id,
            'vod_name' => $info['name'],
            'vod_pic' => $info['cover'],
            'vod_year' => $info['year'],
            'vod_area' => $info['other'],
            'vod_actor' => $info['actor'],
            'vod_director' => $info['director'],
            'vod_content' => $info['blurb'],
            'vod_score' => $info['doubanScore'],
            'vod_play_from' => implode('$$$', $shows),
            'vod_play_url' => implode('$$$', $play_urls),
            'type_name' => $info['vod_class'] ?? ''
        ];
        
        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $pageNum = max(1, intval($pg));
        $url = $this->HOST . "/api/film/search?keyword=" . urlencode($key) . "&pageNum={$pageNum}&pageSize=10";
        $data = json_decode($this->fetch($url, [], $this->getHeaders()), true);
        
        $list = [];
        if (isset($data['data']['list'])) {
            foreach ($data['data']['list'] as $item) {
                $list[] = [
                    'vod_id' => strval($item['id']),
                    'vod_name' => $item['name'],
                    'vod_pic' => $item['cover'],
                    'vod_remarks' => $item['updateStatus'],
                    'vod_year' => $item['year'],
                    'vod_area' => $item['area'],
                    'vod_director' => $item['director']
                ];
            }
        }
        return $this->pageResult($list, $pageNum);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $url = $this->HOST . "/api/line/play/parse?lineId=" . urlencode($id);
        $data = json_decode($this->fetch($url, [], $this->getHeaders()), true);
        
        $playUrl = $data['data'] ?? '';
        
        return [
            'parse' => 0,
            'url' => $playUrl,
            'header' => ['User-Agent' => $this->headers['User-Agent']]
        ];
    }
}

// 运行爬虫
(new Spider())->run();
