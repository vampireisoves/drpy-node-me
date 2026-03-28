<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $HOST = 'https://m.jiabaide.cn';
    private $UA = 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36';

    /**
     * 核心签名算法：sha1(md5(query_string))
     */
    private function getSignedHeaders($params) {
        $t = (string)(time() * 1000); // 毫秒时间戳
        $params['key'] = 'cb808529bae6b6be45ecfab29a4889bc';
        $params['t'] = $t;
        
        // 构建 QueryString
        $query = [];
        foreach ($params as $k => $v) {
            $query[] = "$k=$v";
        }
        $queryStr = implode('&', $query);
        
        // 签名逻辑：SHA1(MD5(str))
        $sign = sha1(md5($queryStr));
        
        return [
            'User-Agent: ' . $this->UA,
            'Referer: ' . $this->HOST,
            't: ' . $t,
            'sign: ' . $sign
        ];
    }

    public function homeContent($filter) {
        // 5. 首页 (获取分类与筛选)
        $typeUrl = $this->HOST . '/api/mw-movie/anonymous/get/filer/type';
        $typeRes = $this->fetch($typeUrl, [], $this->getSignedHeaders([]));
        $typeArr = json_decode($typeRes, true)['data'] ?? [];

        $classes = [];
        foreach ($typeArr as $item) {
            $classes[] = ['type_id' => (string)$item['typeId'], 'type_name' => $item['typeName']];
        }

        // 获取筛选
        $filterUrl = $this->HOST . '/api/mw-movie/anonymous/v1/get/filer/list';
        $filterRes = $this->fetch($filterUrl, [], $this->getSignedHeaders([]));
        $filterData = json_decode($filterRes, true)['data'] ?? [];

        $filters = [];
        $nameMap = [
            'typeList' => ['key' => 'type', 'name' => '类型'],
            'plotList' => ['key' => 'class', 'name' => '剧情'],
            'districtList' => ['key' => 'area', 'name' => '地区'],
            'languageList' => ['key' => 'lang', 'name' => '语言'],
            'yearList' => ['key' => 'year', 'name' => '年份']
        ];

        foreach ($classes as $cls) {
            $tid = $cls['type_id'];
            $fRow = [];
            foreach ($nameMap as $apiKey => $cfg) {
                if (!isset($filterData[$tid][$apiKey])) continue;
                $values = [['n' => '全部', 'v' => '']];
                foreach ($filterData[$tid][$apiKey] as $v) {
                    $values[] = [
                        'n' => $v['itemText'],
                        'v' => ($apiKey === 'typeList') ? $v['itemValue'] : $v['itemText']
                    ];
                }
                $fRow[] = ['key' => $cfg['key'], 'name' => $cfg['name'], 'value' => $values];
            }
            // 增加排序
            $fRow[] = [
                'key' => 'by', 'name' => '排序', 
                'value' => [
                    ['n' => '最近更新', 'v' => '1'],
                    ['n' => '添加时间', 'v' => '2'],
                    ['n' => '人气高低', 'v' => '3'],
                    ['n' => '评分高低', 'v' => '4']
                ]
            ];
            $filters[$tid] = $fRow;
        }

        // 首页推荐
        $hotUrl = $this->HOST . '/api/mw-movie/anonymous/home/hotSearch';
        $hotRes = $this->fetch($hotUrl, [], $this->getSignedHeaders([]));
        $hotVods = json_decode($hotRes, true)['data'] ?? [];
        $list = [];
        foreach (array_slice($hotVods, 0, 20) as $it) {
            $list[] = [
                'vod_id' => $it['vodId'],
                'vod_name' => $it['vodName'],
                'vod_pic' => $it['vodPic'],
                'vod_remarks' => $it['vodRemarks']
            ];
        }

        return [
            'class' => $classes,
            'filters' => $filters,
            'list' => $list
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $params = [
            'area' => $extend['area'] ?? '',
            'lang' => $extend['lang'] ?? '',
            'pageNum' => $pg,
            'pageSize' => '30',
            'sort' => $extend['by'] ?? '1',
            'sortBy' => '1',
            'type' => $extend['type'] ?? '',
            'type1' => $tid,
            'v_class' => $extend['class'] ?? '',
            'year' => $extend['year'] ?? '',
        ];
    
        $apiUrl = $this->HOST . '/api/mw-movie/anonymous/video/list?' . http_build_query($params);
        $res = $this->fetch($apiUrl, [], $this->getSignedHeaders($params));
        $json = json_decode($res, true);
    
        $list = [];
        if (isset($json['data']['list'])) {
            foreach ($json['data']['list'] as $it) {
                $list[] = [
                    'vod_id' => $it['vodId'],
                    'vod_name' => $it['vodName'],
                    'vod_pic' => $it['vodPic'],
                    'vod_remarks' => $it['vodRemarks'] . '_' . $it['vodDoubanScore']
                ];
            }
        }
        
        $total = $json['data']['total'] ?? 0;
        return $this->pageResult($list, $pg, $total, 30);
    }

    public function detailContent($ids) {
        $id = is_array($ids) ? $ids[0] : $ids;
        $params = ['id' => $id];
        $apiUrl = $this->HOST . '/api/mw-movie/anonymous/video/detail?' . http_build_query($params);
        $res = $this->fetch($apiUrl, [], $this->getSignedHeaders($params));
        $json = json_decode($res, true);
        $kvod = $json['data'] ?? null;

        if (!$kvod) {
            return ['list' => []];
        }
    
        $episodes = [];
        if (!empty($kvod['episodeList'])) {
            foreach ($kvod['episodeList'] as $it) {
                // 存入格式：名字$ID@NID
                $episodes[] = $it['name'] . '$' . $kvod['vodId'] . '@' . $it['nid'];
            }
        }
    
        $vod = [
            'vod_id' => $kvod['vodId'],
            'vod_name' => $kvod['vodName'],
            'vod_pic' => $kvod['vodPic'],
            'type_name' => $kvod['vodClass'],
            'vod_remarks' => $kvod['vodRemarks'],
            'vod_content' => trim(strip_tags($kvod['vodContent'] ?? '')),
            'vod_play_from' => '金牌线路',
            'vod_play_url' => implode('#', $episodes)
        ];
    
        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $page = max(1, intval($pg));
        $params = [
            'keyword' => $key,
            'pageNum' => $pg,
            'pageSize' => '30'
        ];
        $apiUrl = $this->HOST . '/api/mw-movie/anonymous/video/searchByWordPageable?' . http_build_query($params);
        $res = $this->fetch($apiUrl, [], $this->getSignedHeaders($params));
        $json = json_decode($res, true);
        
        $list = [];
        if (isset($json['data']['list'])) {
            foreach ($json['data']['list'] as $it) {
                $list[] = [
                    'vod_id' => $it['vodId'],
                    'vod_name' => $it['vodName'],
                    'vod_pic' => $it['vodPic'],
                    'vod_remarks' => $it['vodRemarks']
                ];
            }
        }
        
        $total = $json['data']['total'] ?? 0;
        return $this->pageResult($list, $pg, $total, 30);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        // 格式: vodId@nid
        list($sid, $nid) = explode('@', $id);
        $params = [
            'clientType' => '3',
            'id' => $sid,
            'nid' => $nid
        ];
        $apiUrl = $this->HOST . '/api/mw-movie/anonymous/v2/video/episode/url?' . http_build_query($params);
        $res = $this->fetch($apiUrl, [], $this->getSignedHeaders($params));
        $json = json_decode($res, true);
        
        $playUrl = "";
        if (!empty($json['data']['list'])) {
            // 取第一个清晰度的 URL
            $playUrl = $json['data']['list'][0]['url'];
        }
    
        return [
            'parse' => 0,
            'url' => $playUrl,
            'header' => ['User-Agent' => $this->UA]
        ];
    }
}

(new Spider())->run();
