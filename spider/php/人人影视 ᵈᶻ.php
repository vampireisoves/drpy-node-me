<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $HOST = 'https://rrsp-api.kejiqianxian.com:60425';
    private $UA = 'rrsp.wang';

    protected function getHeaders($isJson = true) {
        $headers = [
            'User-Agent: ' . $this->UA,
            'Origin: *',
            'Referer: https://docs.qq.com/',
            'Accept: application/json, text/plain, */*',
            'Accept-Language: zh-CN'
        ];
        if ($isJson) {
            $headers[] = 'Content-Type: application/json';
        }
        return $headers;
    }

    public function homeContent($filter) {
        $classes = [
            ['type_id' => '1', 'type_name' => '电影'],
            ['type_id' => '2', 'type_name' => '电视剧'],
            ['type_id' => '3', 'type_name' => '综艺'],
            ['type_id' => '5', 'type_name' => '动漫'],
            ['type_id' => '4', 'type_name' => '纪录片'],
            ['type_id' => '6', 'type_name' => '短剧'],
            ['type_id' => '7', 'type_name' => '特别节目'],
            ['type_id' => '8', 'type_name' => '少儿内容']
        ];
        
        // 初始首页内容（空分类调用第一页数据）
        $data = $this->categoryContent('', 1);
        
        return [
            'class' => $classes,
            'list' => $data['list'] ?? [],
            'filters' => (object)[]
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $apiUrl = $this->HOST . '/api.php/main_program/moviesAll/';
        
        $payload = [
            'type' => (string)$tid,
            'sort' => 'vod_time',
            'area' => '',
            'style' => '',
            'time' => '',
            'pay' => '',
            'page' => $pg,
            'limit' => '60'
        ];

        $jsonStr = $this->fetch($apiUrl, [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => $this->getHeaders(),
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false // 补全SSL校验关闭，避免HTTPS请求失败
        ]);

        $jsonObj = json_decode($jsonStr ?: '{}', true);
        $list = [];

        if (isset($jsonObj['data']['list']) && is_array($jsonObj['data']['list'])) {
            $list = $this->arr2vods($jsonObj['data']['list']);
        }
        // 补全total参数，适配分页逻辑
        $total = isset($jsonObj['data']['pagecount']) ? $jsonObj['data']['pagecount'] * 60 : 0;

        return $this->pageResult($list, $pg, $total, 60);
    }

    public function detailContent($ids) {
        $id = is_array($ids) ? ($ids[0] ?? '') : $ids;
        if (empty($id)) return ['list' => []]; // 空ID容错
        
        $apiUrl = $this->HOST . '/api.php/player/details/';
        
        $payload = ['id' => (string)$id];
        
        $jsonStr = $this->fetch($apiUrl, [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => $this->getHeaders(),
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false
        ]);

        $jsonObj = json_decode($jsonStr ?: '{}', true);
        $vod = [];

        if (isset($jsonObj['detailData']) && is_array($jsonObj['detailData'])) {
            $d = $jsonObj['detailData'];
            $vod = [
                'vod_id' => $d['vod_id'] ?? '',
                'vod_name' => $d['vod_name'] ?? '未知影片',
                'vod_pic' => $d['vod_pic'] ?? '',
                'vod_remarks' => $d['vod_remarks'] ?? '',
                'vod_year' => $d['vod_year'] ?? '',
                'vod_area' => $d['vod_area'] ?? '',
                'vod_actor' => $d['vod_actor'] ?? '',
                'vod_director' => $d['vod_director'] ?? '',
                'vod_content' => $d['vod_content'] ?? '暂无影片介绍',
                'vod_play_from' => $d['vod_play_from'] ?? '',
                'vod_play_url' => $d['vod_play_url'] ?? '',
                'type_name' => $d['vod_class'] ?? ''
            ];
        }

        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        if (empty($key) || $pg > 1) return $this->pageResult([], $pg, 0);

        $apiUrl = $this->HOST . '/api.php/search/syntheticalSearch/';
        $payload = ['keyword' => $key];

        $jsonStr = $this->fetch($apiUrl, [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => $this->getHeaders(),
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false
        ]);

        $jsonObj = json_decode($jsonStr ?: '{}', true);
        $videos = [];

        if (isset($jsonObj['data']) && is_array($jsonObj['data'])) {
            $data = $jsonObj['data'];
            if (!empty($data['chasingFanCorrelation']) && is_array($data['chasingFanCorrelation'])) {
                $videos = array_merge($videos, $this->arr2vods($data['chasingFanCorrelation']));
            }
            if (!empty($data['moviesCorrelation']) && is_array($data['moviesCorrelation'])) {
                $videos = array_merge($videos, $this->arr2vods($data['moviesCorrelation']));
            }
        }

        return $this->pageResult($videos, $pg, count($videos));
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $apiUrl = $this->HOST . '/api.php/player/payVideoUrl/';
        $payload = ['url' => $id];
        
        $jsonStr = $this->fetch($apiUrl, [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => $this->getHeaders(),
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false
        ]);

        $jsonObj = json_decode($jsonStr, true);
        $url = $id;
        $jx = 0;

        if (isset($jsonObj['data']['url']) && strpos($jsonObj['data']['url'], 'http') === 0) {
            $url = $jsonObj['data']['url'];
        }

        // 匹配第三方大站开启解析
        if (preg_match('/(?:www\.iqiyi|v\.qq|v\.youku|www\.mgtv|www\.bilibili)\.com/', $url)) {
            $jx = 1;
        }

        return [
            'jx' => $jx,
            'parse' => 0,
            'url' => $url,
            'header' => [
                'User-Agent' => $this->UA,
                'Referer' => 'https://docs.qq.com/'
            ]
        ];
    }

    private function arr2vods($arr) {
        $videos = [];
        foreach ($arr as $i) {
            // 修复符号错误
            $remarks = ($i['vod_serial'] == '1') 
                ? $i['vod_serial'] . '集' 
                : '评分' . ($i['vod_score'] ?? $i['vod_douban_score'] ?? '0');

            $videos[] = [
                'vod_id' => $i['vod_id'] ?? '',
                'vod_name' => $i['vod_name'] ?? '',
                'vod_pic' => $i['vod_pic'] ?? '',
                'vod_remarks' => $remarks ?? ''
            ];
        }
        return $videos;
    }
}

// 运行爬虫
(new Spider())->run();
