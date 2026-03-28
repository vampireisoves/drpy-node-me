<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $HOST = 'https://api.drama.9ddm.com';
    private $UA = 'okhttp/3.12.11';

    protected function getHeaders() {
        return [
            'User-Agent: ' . $this->UA,
            'Content-Type: application/json;charset=utf-8'
        ];
    }

    public function homeContent($filter) {
        // 获取分类标签 (对应原 JS class_parse)
        $html = $this->fetch($this->HOST . '/drama/home/shortVideoTags', [], $this->getHeaders());
        $data = json_decode($html, true);
        
        $classes = [];
        $filterObj = [];

        if (isset($data['audiences'])) {
            foreach ($data['audiences'] as $audience) {
                $classes[] = ['type_id' => $audience, 'type_name' => $audience];
                
                // 构建筛选 (标签)
                $tagValues = [['n' => '全部', 'v' => '']];
                if (isset($data['tags'])) {
                    foreach ($data['tags'] as $tag) {
                        $tagValues[] = ['n' => $tag, 'v' => $tag];
                    }
                }
                
                $filterObj[$audience] = [
                    ['key' => 'tag', 'name' => '标签', 'value' => $tagValues]
                ];
            }
        }

        return [
            'class' => $classes,
            'filters' => $filterObj,
            'list' => [] // 首页展示可留空或调用 categoryContent
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $apiUrl = $this->HOST . '/drama/home/search';
        
        $postData = [
            "audience" => $tid,
            "page" => (int)$pg,
            "pageSize" => 30,
            "searchWord" => "",
            "subject" => $extend['tag'] ?? ""
        ];

        $jsonStr = $this->fetch($apiUrl, [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($postData),
            CURLOPT_HTTPHEADER => $this->getHeaders()
        ]);

        $response = json_decode($jsonStr, true);
        $list = [];

        if (isset($response['data']) && is_array($response['data'])) {
            foreach ($response['data'] as $it) {
                $list[] = [
                    'vod_id' => $it['oneId'],
                    'vod_name' => $it['title'],
                    'vod_pic' => $it['vertPoster'],
                    'vod_remarks' => "集数:{$it['episodeCount']} 播放:{$it['viewCount']}",
                    'vod_year' => (string)($it['publishDate'] ?? '')
                ];
            }
        }

        return $this->pageResult($list, $pg, 999, 30);
    }

    public function detailContent($ids) {
        $id = is_array($ids) ? $ids[0] : $ids;
        // 详情接口地址
        $url = $this->HOST . "/drama/home/shortVideoDetail?oneId={$id}&page=1&pageSize=1000";
        
        $html = $this->fetch($url, [], $this->getHeaders());
        $response = json_decode($html, true);
        $data = $response['data'] ?? [];
        
        if (empty($data)) return ['list' => []];

        $first = $data[0];
        $vod = [
            'vod_id' => $id,
            'vod_name' => $first['title'],
            'vod_pic' => $first['vertPoster'],
            'vod_remarks' => "共" . count($data) . "集",
            'vod_content' => "播放量:{$first['collectionCount']} 评论:{$first['commentCount']} " . ($first['description'] ?? ""),
            'vod_play_from' => '围观短剧'
        ];

        $playUrls = [];
        foreach ($data as $episode) {
            // 原 JS 逻辑：将整个 playSetting JSON 存入 URL，在 lazy/playContent 中解析
            $playUrls[] = "第{$episode['playOrder']}集$" . $episode['playSetting'];
        }

        $vod['vod_play_url'] = implode('#', $playUrls);

        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $apiUrl = $this->HOST . '/drama/home/search';
        $postData = [
            "audience" => "",
            "page" => (int)$pg,
            "pageSize" => 30,
            "searchWord" => $key,
            "subject" => ""
        ];

        $jsonStr = $this->fetch($apiUrl, [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($postData),
            CURLOPT_HTTPHEADER => $this->getHeaders()
        ]);

        $response = json_decode($jsonStr, true);
        $list = [];
        if (isset($response['data'])) {
            foreach ($response['data'] as $it) {
                $list[] = [
                    'vod_id' => $it['oneId'],
                    'vod_name' => $it['title'],
                    'vod_pic' => $it['vertPoster'],
                    'vod_remarks' => $it['description']
                ];
            }
        }
        return $this->pageResult($list, $pg, 0, 30);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        // id 此时是 detailContent 传过来的 playSetting JSON 字符串
        $playSetting = json_decode($id, true);
        
        // 优先级：高清 > 普通 > 流畅
        $videoUrl = $playSetting['high'] ?? $playSetting['normal'] ?? $playSetting['super'] ?? '';

        return [
            'parse' => 0, // 短剧通常是直链，无需嗅探
            'url' => $videoUrl,
            'header' => [
                'User-Agent' => $this->UA
            ]
        ];
    }
}

// 运行爬虫
(new Spider())->run();
