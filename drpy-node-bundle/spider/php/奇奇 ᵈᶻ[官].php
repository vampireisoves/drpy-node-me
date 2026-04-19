<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $host = 'https://www.iqiyi.com';
    
    protected function getHeaders() {
        return [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer' => 'https://www.iqiyi.com',
            'Accept' => 'application/json, text/plain, */*',
            'Accept-Language' => 'zh-CN,zh;q=0.9,en;q=0.8',
            'Connection' => 'keep-alive'
        ];
    }

    public function homeContent($filter) {
        $classes = [
            ['type_id' => '1', 'type_name' => '电影'],
            ['type_id' => '2', 'type_name' => '电视剧'],
            ['type_id' => '6', 'type_name' => '综艺'],
            ['type_id' => '4', 'type_name' => '动漫'],
            ['type_id' => '3', 'type_name' => '纪录片'],
            ['type_id' => '5', 'type_name' => '音乐'],
            ['type_id' => '16', 'type_name' => '网络电影']
        ];

        $filters = [
            '1' => [[
                'key' => 'year',
                'name' => '年代',
                'value' => [['n' => '全部', 'v' => ''], ['n' => '2025', 'v' => '2025'], ['n' => '2024', 'v' => '2024'], ['n' => '2023', 'v' => '2023']]
            ]],
            '2' => [[
                'key' => 'year',
                'name' => '年代',
                'value' => [['n' => '全部', 'v' => ''], ['n' => '2025', 'v' => '2025'], ['n' => '2024', 'v' => '2024'], ['n' => '2023', 'v' => '2023']]
            ]]
        ];

        return [
            'class' => $classes,
            'filters' => $filters
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $channelId = $tid;
        $dataType = 1;
        $extraParams = "";
        $page = max(1, intval($pg));

        if ($tid === "16") {
            $channelId = "1";
            $extraParams = "&three_category_id=27401";
        } else if ($tid === "5") {
            $dataType = 2;
        }

        // 处理筛选条件
        if (!empty($extend)) {
            if (isset($extend['year'])) {
                $extraParams .= "&market_release_date_level={$extend['year']}";
            }
        }

        $url = "https://pcw-api.iqiyi.com/search/recommend/list?channel_id={$channelId}&data_type={$dataType}&page_id={$page}&ret_num=20{$extraParams}";

        $jsonStr = $this->fetch($url, [], $this->getHeaders());
        $jsonData = json_decode($jsonStr, true);
        
        $videos = [];
        if (isset($jsonData['data']['list'])) {
            foreach ($jsonData['data']['list'] as $item) {
                $vid = "{$item['channelId']}\${$item['albumId']}";
                $remarks = "";

                if ($item['channelId'] == 1) {
                    $remarks = isset($item['score']) ? "{$item['score']}分" : "";
                } else if ($item['channelId'] == 2 || $item['channelId'] == 4) {
                    if (isset($item['latestOrder']) && isset($item['videoCount'])) {
                        $remarks = ($item['latestOrder'] == $item['videoCount']) ?
                            "{$item['latestOrder']}集全" :
                            "更新至{$item['latestOrder']}集";
                    } else {
                        $remarks = $item['focus'] ?? "";
                    }
                } else {
                    $remarks = $item['period'] ?? ($item['focus'] ?? "");
                }

                $pic = isset($item['imageUrl']) ? str_replace(".jpg", "_390_520.jpg", $item['imageUrl']) : "";

                $videos[] = [
                    'vod_id' => $vid,
                    'vod_name' => $item['name'],
                    'vod_pic' => $pic,
                    'vod_remarks' => $remarks
                ];
            }
        }

        return $this->pageResult($videos, $page, 999999, 20);
    }

    private function getPlaylists($channelId, $albumId, $data) {
        $playlists = [];
        $cid = intval($channelId ?: ($data['channelId'] ?? 0));

        if ($cid === 1 || $cid === 5) {
            // 电影或音乐
            if (isset($data['playUrl'])) {
                $playlists[] = ['title' => $data['name'] ?? '正片', 'url' => $data['playUrl']];
            }
        } else if ($cid === 6 && isset($data['period'])) {
            // 综艺
            $qs = explode("-", (string)$data['period'])[0];
            $listUrl = "https://pcw-api.iqiyi.com/album/source/svlistinfo?cid=6&sourceid={$albumId}&timelist={$qs}";
            
            $listResp = $this->fetch($listUrl, [], $this->getHeaders());
            $listJson = json_decode($listResp, true);
            
            if (isset($listJson['data'][$qs])) {
                foreach ($listJson['data'][$qs] as $it) {
                    $title = $it['shortTitle'] ?? ($it['period'] ?? ($it['focus'] ?? "期{$it['order']}"));
                    $playlists[] = [
                        'title' => $title,
                        'url' => $it['playUrl']
                    ];
                }
            }
        } else {
            // 电视剧、动漫等
            $listUrl = "https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid={$albumId}&size=100&page=1";
            $listResp = $this->fetch($listUrl, [], $this->getHeaders());
            $listJson = json_decode($listResp, true);

            if (isset($listJson['data']['epsodelist'])) {
                foreach ($listJson['data']['epsodelist'] as $item) {
                    $title = $item['shortTitle'] ?? ($item['title'] ?? (isset($item['order']) ? "第{$item['order']}集" : "集{$item['timelist']}"));
                    $playlists[] = [
                        'title' => $title,
                        'url' => $item['playUrl'] ?? ($item['url'] ?? '')
                    ];
                }

                // 处理分页
                $total = $listJson['data']['total'] ?? 0;
                if ($total > 100) {
                    $totalPages = ceil($total / 100);
                    for ($i = 2; $i <= $totalPages; $i++) {
                        $nextUrl = "https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid={$albumId}&size=100&page={$i}";
                        $nextResp = $this->fetch($nextUrl, [], $this->getHeaders());
                        $nextJson = json_decode($nextResp, true);
                        
                        if (isset($nextJson['data']['epsodelist'])) {
                            foreach ($nextJson['data']['epsodelist'] as $item) {
                                $title = $item['shortTitle'] ?? ($item['title'] ?? (isset($item['order']) ? "第{$item['order']}集" : "集{$item['timelist']}"));
                                $playlists[] = [
                                    'title' => $title,
                                    'url' => $item['playUrl'] ?? ($item['url'] ?? '')
                                ];
                            }
                        }
                    }
                }
            }
        }
        return $playlists;
    }

    public function detailContent($ids) {
        $id = is_array($ids) ? $ids[0] : $ids;
        $channelId = "";
        $albumId = $id;

        if (strpos($id, '$') !== false) {
            $parts = explode('$', $id);
            $channelId = $parts[0];
            $albumId = $parts[1];
        }

        // 获取视频基本信息
        $infoUrl = "https://pcw-api.iqiyi.com/video/video/videoinfowithuser/{$albumId}?agent_type=1&authcookie=&subkey={$albumId}&subscribe=1";
        $infoResp = $this->fetch($infoUrl, [], $this->getHeaders());
        $infoJson = json_decode($infoResp, true);
        $data = $infoJson['data'] ?? [];

        // 获取播放列表
        $playlists = $this->getPlaylists($channelId, $albumId, $data);

        // 构建播放地址
        $playUrls = [];
        foreach ($playlists as $item) {
            if (!empty($item['url'])) {
                $playUrls[] = "{$item['title']}\${$item['url']}";
            }
        }

        $typeName = '';
        if (isset($data['categories'])) {
            $names = array_map(function($it) { return $it['name']; }, $data['categories']);
            $typeName = implode(',', $names);
        }

        $area = '';
        if (isset($data['areas'])) {
            $names = array_map(function($it) { return $it['name']; }, $data['areas']);
            $area = implode(',', $names);
        }

        $actors = '';
        if (isset($data['people']['main_charactor'])) {
            $names = array_map(function($it) { return $it['name']; }, $data['people']['main_charactor']);
            $actors = implode(',', $names);
        }

        $director = '';
        if (isset($data['people']['director'])) {
            $names = array_map(function($it) { return $it['name']; }, $data['people']['director']);
            $director = implode(',', $names);
        }
        
        $remarks = "";
        if (isset($data['latestOrder'])) {
            $remarks = "更新至{$data['latestOrder']}集";
        } else {
            $remarks = isset($data['period']) || count($playlists) > 0 ? count($playlists)."集" : "";
        }

        $vod = [
            'vod_id' => $id,
            'vod_name' => $data['name'] ?? '未知标题',
            'type_name' => $typeName,
            'vod_year' => $data['formatPeriod'] ?? '',
            'vod_area' => $area,
            'vod_remarks' => $remarks,
            'vod_actor' => $actors,
            'vod_director' => $director,
            'vod_content' => $data['description'] ?? '暂无简介',
            'vod_pic' => isset($data['imageUrl']) ? str_replace(".jpg", "_480_270.jpg", $data['imageUrl']) : '',
            'vod_play_from' => count($playUrls) > 0 ? '爱奇艺视频' : '',
            'vod_play_url' => implode('#', $playUrls)
        ];

        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $page = max(1, intval($pg));
        $url = "https://search.video.iqiyi.com/o?if=html5&key=" . urlencode($key) . "&pageNum={$page}&pos=1&pageSize=20&site=iqiyi";

        $response = $this->fetch($url, [], $this->getHeaders());
        $jsonData = json_decode($response, true);
        
        $videos = [];
        if (isset($jsonData['data']['docinfos'])) {
            foreach ($jsonData['data']['docinfos'] as $item) {
                if (isset($item['albumDocInfo'])) {
                    $doc = $item['albumDocInfo'];
                    $channelId = isset($doc['channel']) ? explode(',', $doc['channel'])[0] : '0';
                    $videos[] = [
                        'vod_id' => "{$channelId}\${$doc['albumId']}",
                        'vod_name' => $doc['albumTitle'] ?? '',
                        'vod_pic' => $doc['albumVImage'] ?? '',
                        'vod_remarks' => $doc['tvFocus'] ?? ($doc['year'] ?? '')
                    ];
                }
            }
        }

        return $this->pageResult($videos, $page, count($videos) * 10, 20); // 搜索无法获取总数，简单估算
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $playUrl = $id;
        if (strpos($id, '$') !== false) {
            $playUrl = explode('$', $id)[1];
        }

        // 壳子超级解析格式
        return [
            'parse' => 1,
            'jx' => 1,
            'play_parse' => true,
            'parse_type' => '壳子超级解析',
            'parse_source' => '爱奇艺视频',
            'url' => $playUrl,
            'header' => json_encode([
                'User-Agent' => $this->getHeaders()['User-Agent'],
                'Referer' => 'https://www.iqiyi.com',
                'Origin' => 'https://www.iqiyi.com'
            ], JSON_UNESCAPED_UNICODE)
        ];
    }
}

(new Spider())->run();
