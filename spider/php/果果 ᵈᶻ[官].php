<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $host = 'https://www.mgtv.com';
    
    protected function getHeaders() {
        return [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Referer' => 'https://www.mgtv.com/',
            'Accept' => 'application/json, text/plain, */*',
            'Accept-Language' => 'zh-CN,zh;q=0.9,en;q=0.8',
            'Connection' => 'keep-alive'
        ];
    }

    public function homeContent($filter) {
        $classes = [
            ['type_id' => '3', 'type_name' => '电影'],
            ['type_id' => '2', 'type_name' => '电视剧'],
            ['type_id' => '1', 'type_name' => '综艺'],
            ['type_id' => '50', 'type_name' => '动漫'],
            ['type_id' => '51', 'type_name' => '纪录片'],
            ['type_id' => '115', 'type_name' => '教育'],
            ['type_id' => '10', 'type_name' => '少儿']
        ];

        $filters = [
            '3' => [
                [
                    'key' => 'year', 'name' => '年份', 'value' => [
                        ['n' => '全部', 'v' => 'all'], ['n' => '2025', 'v' => '2025'], ['n' => '2024', 'v' => '2024'],
                        ['n' => '2023', 'v' => '2023'], ['n' => '2022', 'v' => '2022'], ['n' => '2021', 'v' => '2021'],
                        ['n' => '2020', 'v' => '2020'], ['n' => '2019', 'v' => '2019'], ['n' => '2010-2019', 'v' => '2010-2019'],
                        ['n' => '2000-2009', 'v' => '2000-2009']
                    ]
                ],
                [
                    'key' => 'sort', 'name' => '排序', 'value' => [
                        ['n' => '综合', 'v' => 'c1'], ['n' => '最新', 'v' => 'c2'], ['n' => '最热', 'v' => 'c4']
                    ]
                ]
            ],
            '2' => [
                [
                    'key' => 'year', 'name' => '年份', 'value' => [
                        ['n' => '全部', 'v' => 'all'], ['n' => '2025', 'v' => '2025'], ['n' => '2024', 'v' => '2024'],
                        ['n' => '2023', 'v' => '2023'], ['n' => '2022', 'v' => '2022'], ['n' => '2021', 'v' => '2021'],
                        ['n' => '2020', 'v' => '2020']
                    ]
                ],
                [
                    'key' => 'sort', 'name' => '排序', 'value' => [
                        ['n' => '综合', 'v' => 'c1'], ['n' => '最新', 'v' => 'c2'], ['n' => '最热', 'v' => 'c4']
                    ]
                ]
            ],
            '1' => [
                [
                    'key' => 'sort', 'name' => '排序', 'value' => [
                        ['n' => '综合', 'v' => 'c1'], ['n' => '最新', 'v' => 'c2'], ['n' => '最热', 'v' => 'c4']
                    ]
                ]
            ],
            '50' => [
                [
                    'key' => 'sort', 'name' => '排序', 'value' => [
                        ['n' => '综合', 'v' => 'c1'], ['n' => '最新', 'v' => 'c2'], ['n' => '最热', 'v' => 'c4']
                    ]
                ]
            ]
        ];

        return [
            'class' => $classes,
            'filters' => $filters
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $page = max(1, intval($pg));
        $baseUrl = 'https://pianku.api.mgtv.com/rider/list/pcweb/v3';

        $params = [
            'platform' => 'pcweb',
            'channelId' => $tid,
            'pn' => $page,
            'pc' => '20',
            'hudong' => '1',
            '_support' => '10000000',
            'kind' => 'a1',
            'area' => 'a1'
        ];

        if (!empty($extend)) {
            if (isset($extend['year']) && $extend['year'] !== 'all') {
                $params['year'] = $extend['year'];
            }
            if (isset($extend['sort'])) {
                $params['sort'] = $extend['sort'];
            }
            if (isset($extend['chargeInfo'])) {
                $params['chargeInfo'] = $extend['chargeInfo'];
            }
        }

        $url = $baseUrl . '?' . http_build_query($params);
        $response = $this->fetch($url, [], $this->getHeaders());
        $json = json_decode($response, true);
        
        $videos = [];
        if (isset($json['data']['hitDocs']) && is_array($json['data']['hitDocs'])) {
            foreach ($json['data']['hitDocs'] as $item) {
                $videos[] = [
                    'vod_id' => $item['playPartId'] ?? '',
                    'vod_name' => $item['title'] ?? '',
                    'vod_pic' => $item['img'] ?? '',
                    'vod_remarks' => $item['updateInfo'] ?? ($item['rightCorner']['text'] ?? '')
                ];
            }
        }

        $totalHit = $json['data']['totalHit'] ?? 0;
        return $this->pageResult($videos, $page, $totalHit, 20);
    }

    public function detailContent($ids) {
        $videoId = is_array($ids) ? $ids[0] : $ids;

        // 获取视频基本信息
        $infoUrl = "https://pcweb.api.mgtv.com/video/info?video_id={$videoId}";
        $infoResponse = $this->fetch($infoUrl, [], $this->getHeaders());
        $infoJson = json_decode($infoResponse, true);
        $infoData = $infoJson['data']['info'] ?? [];

        $vod = [
            'vod_id' => $videoId,
            'vod_name' => $infoData['title'] ?? '',
            'type_name' => $infoData['root_kind'] ?? '',
            'vod_actor' => '',
            'vod_year' => $infoData['release_time'] ?? '',
            'vod_content' => $infoData['desc'] ?? '',
            'vod_remarks' => $infoData['time'] ?? '',
            'vod_pic' => $infoData['img'] ?? '',
            'vod_play_from' => '芒果TV',
            'vod_play_url' => ''
        ];

        // 分页获取所有剧集
        $pageSize = 50;
        $allEpisodes = [];

        // 获取第一页
        $firstPageUrl = "https://pcweb.api.mgtv.com/episode/list?video_id={$videoId}&page=1&size={$pageSize}";
        $firstResponse = $this->fetch($firstPageUrl, [], $this->getHeaders());
        $firstJson = json_decode($firstResponse, true);
        $firstData = $firstJson['data'] ?? [];

        if (isset($firstData['list']) && is_array($firstData['list'])) {
            $allEpisodes = array_merge($allEpisodes, $firstData['list']);
            $totalPages = $firstData['total_page'] ?? 1;

            if ($totalPages > 1) {
                for ($i = 2; $i <= $totalPages; $i++) {
                    $pageUrl = "https://pcweb.api.mgtv.com/episode/list?video_id={$videoId}&page={$i}&size={$pageSize}";
                    // 简单串行获取，避免并发复杂性
                    $resp = $this->fetch($pageUrl, [], $this->getHeaders());
                    $data = json_decode($resp, true);
                    if (isset($data['data']['list']) && is_array($data['data']['list'])) {
                        $allEpisodes = array_merge($allEpisodes, $data['data']['list']);
                    }
                }
            }
        }

        $playUrls = [];
        if (!empty($allEpisodes)) {
            // 过滤
            $validEpisodes = array_filter($allEpisodes, function($item) {
                return isset($item['isIntact']) && ($item['isIntact'] === "1" || $item['isIntact'] === 1);
            });

            // 排序
            usort($validEpisodes, function($a, $b) {
                return intval($a['order'] ?? 0) - intval($b['order'] ?? 0);
            });

            foreach ($validEpisodes as $item) {
                $name = $item['t4'] ?? ($item['t3'] ?? ($item['title'] ?? ("第" . ($item['order'] ?? '?') . "集")));
                $playLink = isset($item['url']) ? "https://www.mgtv.com{$item['url']}" : '';

                if ($playLink) {
                    $playUrls[] = "{$name}\${$playLink}";
                }
            }
        }

        $vod['vod_play_url'] = implode('#', $playUrls);

        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $page = max(1, intval($pg));
        $searchUrl = "https://mobileso.bz.mgtv.com/msite/search/v2?q=" . urlencode($key) . "&pn={$page}&pc=20";

        $response = $this->fetch($searchUrl, [], $this->getHeaders());
        $json = json_decode($response, true);
        $data = $json['data'] ?? [];

        $videos = [];
        if (isset($data['contents']) && is_array($data['contents'])) {
            foreach ($data['contents'] as $group) {
                if (($group['type'] ?? '') === 'media' && isset($group['data']) && is_array($group['data'])) {
                    foreach ($group['data'] as $item) {
                        if (($item['source'] ?? '') === 'imgo') {
                            if (preg_match('/\/(\d+)\.html/', $item['url'], $match)) {
                                $videos[] = [
                                    'vod_id' => $match[1],
                                    'vod_name' => isset($item['title']) ? str_replace(['<B>', '</B>'], '', $item['title']) : '',
                                    'vod_pic' => $item['img'] ?? '',
                                    'vod_remarks' => isset($item['desc']) ? implode(' ', $item['desc']) : ''
                                ];
                            }
                        }
                    }
                }
            }
        }

        return $this->pageResult($videos, $page, count($videos) * 10, 20);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        // 壳子超级解析格式
        return [
            'parse' => 1,
            'jx' => 1,
            'play_parse' => true,
            'parse_type' => '壳子超级解析',
            'parse_source' => '芒果TV2',
            'url' => $id,
            'header' => json_encode([
                'User-Agent' => $this->getHeaders()['User-Agent'],
                'Referer' => 'https://www.mgtv.com',
                'Origin' => 'https://www.mgtv.com'
            ], JSON_UNESCAPED_UNICODE)
        ];
    }
}

(new Spider())->run();
