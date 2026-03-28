<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $HOST = "http://106.53.107.16"; // 默认起始地址
    private $UA = 'Dart/3.9 (dart:io)';

    protected function getHeaders() {
        return [
            'User-Agent: ' . $this->UA,
            'Accept-Encoding: gzip',
            'Content-Type: application/json'
        ];
    }

    /**
     * 初始化：检测有效域名
     */
    private function getValidHost() {
        // 如果 extend 传入了不同地址，可以在此处动态修改 $this->HOST
        // 此处还原 Python 中的检测逻辑
        $checkUrl = rtrim($this->HOST, '/') . '/success.txt';
        try {
            // 简单的存活性检测
            $res = $this->fetch($checkUrl, [CURLOPT_TIMEOUT => 5], $this->getHeaders());
            if ($res) {
                return rtrim($this->HOST, '/');
            }
        } catch (Exception $e) {}
        return rtrim($this->HOST, '/');
    }

    public function homeContent($filter) {
        $host = $this->getValidHost();
        $classes = [];

        // 1. 获取常规分类
        $res1 = $this->fetch($host . '/api.php/type/get_list', [], $this->getHeaders());
        $data1 = json_decode($res1, true);
        if (isset($data1['info']['rows'])) {
            foreach ($data1['info']['rows'] as $row) {
                if ($row['type_status'] == 1 && !in_array($row['type_name'], ['漫画', '小说'])) {
                    $classes[] = ['type_id' => $row['type_id'], 'type_name' => $row['type_name']];
                }
            }
        }

        // 2. 获取短视频分类
        try {
            $res2 = $this->fetch($host . '/addons/getstar/api.index/shortVideoCategory', [], $this->getHeaders());
            $data2 = json_decode($res2, true);
            if (isset($data2['data'])) {
                foreach ($data2['data'] as $row) {
                    $classes[] = ['type_id' => $row['id'], 'type_name' => $row['name']];
                }
            }
        } catch (Exception $e) {}

        return ['class' => $classes];
    }

    public function homeVideoContent() {
        $host = $this->getValidHost();
        $url = $host . '/index.php/ajax/data?mid=1&limit=100&page=1&level=7';
        $res = $this->fetch($url, [], $this->getHeaders());
        return json_decode($res, true);
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $host = $this->getValidHost();
        $year = date("Y");
        $url = "{$host}/index.php/ajax/data?mid=1&limit=20&page={$pg}&tid={$tid}&year={$year}";
        $res = $this->fetch($url, [], $this->getHeaders());
        $json = json_decode($res, true);
        $list = $json['list'] ?? [];
        $total = $json['total'] ?? 0;
        return $this->pageResult($list, $pg, $total, 20);
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $host = $this->getValidHost();
        $url = "{$host}/index.php/ajax/data?mid=1&limit=20&page={$pg}&wd=" . urlencode($key);
        $res = $this->fetch($url, [], $this->getHeaders());
        $json = json_decode($res, true);
        $list = $json['list'] ?? [];
        $total = $json['total'] ?? 0;
        return $this->pageResult($list, $pg, $total, 20);
    }

    public function detailContent($ids) {
        $host = $this->getValidHost();
        $id = is_array($ids) ? $ids[0] : $ids;

        // 1. 获取解析配置 (PlayerParse)
        $playerConfigs = [];
        try {
            $pRes = $this->fetch($host . '/addons/getstar/api.index/getPlayerParse', [], $this->getHeaders());
            $pData = json_decode($pRes, true);
            if (isset($pData['data']) && is_array($pData['data'])) {
                $playerConfigs = $pData['data'];
            }
        } catch (Exception $e) {}

        // 2. 获取视频详情
        $res = $this->fetch($host . "/api.php/vod/get_detail?vod_id={$id}", [], $this->getHeaders());
        $json = json_decode($res, true);
        $data = $json['info'][0];

        if (!empty($data['vod_play_from']) && !empty($data['vod_play_url'])) {
            $froms = explode('$$$', $data['vod_play_from']);
            $urls = explode('$$$', $data['vod_play_url']);
            
            $newFroms = [];
            $newUrls = [];

            foreach ($froms as $key => $show) {
                $parseUrl = '';
                $isOpen = false;

                // 匹配解析器
                foreach ($playerConfigs as $pConf) {
                    if ($pConf['code'] == $show) {
                        $isOpen = true;
                        $name = $pConf['name'] ?? '';
                        if ($name && $name != $show) {
                            $show = "{$name} ({$show})";
                        }
                        $parseUrl = $pConf['url'] ?? '';
                        break;
                    }
                }

                if (!$isOpen) continue;

                $episodeParts = explode('#', $urls[$key]);
                $formattedEpisodes = [];
                foreach ($episodeParts as $part) {
                    if (empty($part)) continue;
                    $temp = explode('$', $part, 2);
                    $epName = $temp[0];
                    $epUrl = $temp[1] ?? '';
                    
                    // 将解析地址附加到 URL 后，供 playContent 使用
                    $suffix = $parseUrl ? "@{$parseUrl}" : "";
                    $formattedEpisodes[] = "{$epName}\${$epUrl}{$suffix}";
                }

                $newFroms[] = $show;
                $newUrls[] = implode('#', $formattedEpisodes);
            }

            $data['vod_play_from'] = implode('$$$', $newFroms);
            $data['vod_play_url'] = implode('$$$', $newUrls);
        }

        return ['list' => [$data]];
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $rawUrl = $id;
        $url = "";
        $jx = 0;

        // 处理带 @ 的自定义解析
        if (strpos($id, '@') !== false) {
            list($rawUrl, $parse) = explode('@', $id, 2);
            $headers = [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ];
            try {
                $res = $this->fetch($parse . $rawUrl, [], $headers);
                $json = json_decode($res, true);
                if (!empty($json['url']) && $json['url'] != $rawUrl) {
                    $url = $json['url'];
                }
            } catch (Exception $e) {}
        }

        if (empty($url)) {
            $url = $rawUrl;
            // 匹配大站链接开启嗅探
            if (preg_match('/(?:www\.iqiyi|v\.qq|v\.youku|www\.mgtv|www\.bilibili)\.com/', $rawUrl)) {
                $jx = 1;
            }
        }

        return [
            'jx' => $jx,
            'parse' => 0,
            'url' => $url,
            'header' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Connection' => 'Keep-Alive'
            ]
        ];
    }
}

// 运行
(new Spider())->run();
