<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $HOST = 'https://www.mqtv.cc';
    private $KEY = 'Mcxos@mucho!nmme';
    private $UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

    /**
     * 对应 JS 中的 encodeData 和 decodeData (XOR + Base64)
     */
    private function mq_xor_codec($data, $key, $is_decode = false) {
        if ($is_decode) {
            $data = base64_decode($data);
        } else {
            $data = json_encode($data, JSON_UNESCAPED_UNICODE);
            $data = base64_encode($data);
        }

        $res = '';
        $keyLen = strlen($key);
        for ($i = 0; $i < strlen($data); $i++) {
            $res .= $data[$i] ^ $key[$i % $keyLen];
        }

        if ($is_decode) {
            return json_decode(base64_decode($res), true);
        } else {
            return urlencode(base64_encode($res));
        }
    }

    private function getHeaders($referer = '/') {
        return [
            'User-Agent: ' . $this->UA,
            'Referer: ' . $this->HOST . $referer,
            'X-Requested-With: XMLHttpRequest'
        ];
    }

    // 获取页面 PageID 并生成 Token
    private function getToken($path, $ref = '/') {
        $html = $this->fetch($this->HOST . $path, [], $this->getHeaders($ref));
        preg_match("/window\.pageid\s?=\s?'(.*?)';/i", $html, $m);
        $pageId = $m[1] ?? "";
        return $this->mq_xor_codec($pageId, $this->KEY);
    }

    public function homeContent($filter) {
        // 5. 首页 (homeVod)
        $token = $this->getToken('/');
        $apiUrl = $this->HOST . "/libs/VodList.api.php?home=index&token=$token";
        $resp = json_decode($this->fetch($apiUrl, [], $this->getHeaders()), true);
        $list = [];
        if (isset($resp['data']['movie'])) {
            foreach ($resp['data']['movie'] as $section) {
                foreach ($section['show'] as $v) {
                    $list[] = [
                        'vod_id' => $v['url'],
                        'vod_name' => $v['title'],
                        'vod_pic' => $v['img'],
                        'vod_remarks' => $v['remark']
                    ];
                }
            }
        }
        
        return [
            'class' => [
                ['type_id' => '/type/movie', 'type_name' => '电影'],
                ['type_id' => '/type/tv', 'type_name' => '电视剧'],
                ['type_id' => '/type/va', 'type_name' => '综艺'],
                ['type_id' => '/type/ct', 'type_name' => '动漫']
            ],
            'list' => array_slice($list, 0, 30)
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $typeKey = explode('/', trim($tid, '/'))[1] ?? 'movie';
        $token = $this->getToken($tid);
        $apiUrl = $this->HOST . "/libs/VodList.api.php?type=$typeKey&rank=rankhot&page=$pg&token=$token";
        
        $resp = json_decode($this->fetch($apiUrl, [], $this->getHeaders($tid)), true);
        $list = [];
        if (isset($resp['data'])) {
            foreach ($resp['data'] as $v) {
                $list[] = [
                    'vod_id' => $v['url'],
                    'vod_name' => $v['title'],
                    'vod_pic' => $v['img'],
                    'vod_remarks' => $v['remark']
                ];
            }
        }
        return $this->pageResult($list, $pg);
    }

    public function detailContent($ids) {
        $id = is_array($ids) ? $ids[0] : $ids;
        $pathParts = explode('/', trim($id, '/'));
        $realId = end($pathParts);
        $token = $this->getToken($id);
        
        $apiUrl = $this->HOST . "/libs/VodInfo.api.php?type=ct&id=$realId&token=$token";
        $json = json_decode($this->fetch($apiUrl, [], $this->getHeaders($id)), true);
        $data = $json['data'];

        // 处理解析线路
        $parsesArr = [];
        foreach (($data['playapi'] ?? []) as $p) {
            if (isset($p['url'])) {
                $parsesArr[] = (strpos($p['url'], '//') === 0) ? "https:" . $p['url'] : $p['url'];
            }
        }
        $parsesStr = implode(',', $parsesArr);

        $playFrom = [];
        $playUrls = [];
        foreach (($data['playinfo'] ?? []) as $site) {
            $playFrom[] = $site['cnsite'];
            $urls = [];
            foreach ($site['player'] as $ep) {
                // 将解析接口封装在 URL 后面，供 play 阶段调用
                $urls[] = $ep['no'] . '$' . $ep['url'] . '@' . $parsesStr;
            }
            $playUrls[] = implode('#', $urls);
        }

        $vod = [
            'vod_id' => $id,
            'vod_name' => $data['title'],
            'vod_pic' => $data['img'],
            'vod_remarks' => $data['remark'],
            'vod_year' => $data['year'],
            'vod_area' => $data['area'],
            'vod_actor' => $data['actor'],
            'vod_director' => $data['director'],
            'vod_content' => $data['content'] ?? '',
            'vod_play_from' => implode('$$$', $playFrom),
            'vod_play_url' => implode('$$$', $playUrls)
        ];

        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $path = '/search/' . urlencode($key);
        $token = $this->getToken($path);
        $apiUrl = $this->HOST . "/libs/VodList.api.php?search=" . urlencode($key) . "&token=$token";
        
        $resp = json_decode($this->fetch($apiUrl, [], $this->getHeaders($path)), true);
        $data = $this->mq_xor_codec($resp['data'], $this->KEY, true); // 搜索数据需要解密
        
        $list = [];
        if (isset($data['vod_all'])) {
            foreach ($data['vod_all'] as $item) {
                foreach ($item['show'] as $v) {
                    $list[] = [
                        'vod_id' => $v['url'],
                        'vod_name' => $v['title'],
                        'vod_pic' => $v['img'],
                        'vod_remarks' => $v['remark']
                    ];
                }
            }
        }
        return $this->pageResult($list, $pg);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $parts = explode('@', $id);
        $rawUrl = $parts[0];
        $parses = isset($parts[1]) ? explode(',', $parts[1]) : [];
        
        // 默认返回第一个解析地址配合嗅探，模拟 JS 中的逻辑
        $finalUrl = $rawUrl;
        if (!empty($parses)) {
            $finalUrl = $parses[0] . $rawUrl;
        }

        return [
            'parse' => 1,
            'url' => $finalUrl,
            'header' => ['User-Agent' => $this->UA]
        ];
    }
}

(new Spider())->run();
