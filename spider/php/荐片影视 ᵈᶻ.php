<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $HOST;
    private $HEADERS;
    private $IMGHOST;
    
    public function init($extend = '') {
        $this->HOST = 'https://api.ztcgi.com';
        $this->HEADERS = ['User-Agent: Mozilla/5.0 (Linux; Android 9; V2196A Build/PQ3A.190705.08211809; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Mobile Safari/537.36'];
        $this->IMGHOST = 'https://img1.vbwus.com';
        $this->preprocess();
    }
    
    private function preprocess() {
        try {
            $res = json_decode($this->fetch($this->HOST . '/api/appAuthConfig', [], $this->HEADERS), true);
            if (isset($res['data']['imgDomain'])) {
                $this->IMGHOST = 'https://' . $res['data']['imgDomain'];
            }
        } catch (Exception $e) {
            // 忽略错误
        }
    }
    
    public function homeContent($filter) {
        // 生成分类列表
        $classNames = explode('&', '电影&电视剧&动漫&短剧&综艺');
        $classUrls = explode('&', '1&2&3&67&4');
        $classes = [];
        $filterObj = [];
        
        // 过滤器配置
        $filterConfig = [
            "1" => [
                ["key"=>"cateId","name"=>"分类","value"=>[["n"=>"全部","v"=>"1"],["n"=>"首推","v"=>"5"],["n"=>"动作","v"=>"6"],["n"=>"喜剧","v"=>"7"],["n"=>"战争","v"=>"8"],["n"=>"恐怖","v"=>"9"],["n"=>"剧情","v"=>"10"],["n"=>"爱情","v"=>"11"],["n"=>"科幻","v"=>"12"],["n"=>"动画","v"=>"13"]]],
                ["key"=>"area","name"=>"地區","value"=>[["n"=>"全部","v"=>"0"],["n"=>"国产","v"=>"1"],["n"=>"中国香港","v"=>"3"],["n"=>"中国台湾","v"=>"6"],["n"=>"美国","v"=>"5"],["n"=>"韩国","v"=>"18"],["n"=>"日本","v"=>"2"]]],
                ["key"=>"year","name"=>"年代","value"=>[["n"=>"全部","v"=>"0"],["n"=>"2025","v"=>"107"],["n"=>"2024","v"=>"119"],["n"=>"2023","v"=>"153"],["n"=>"2022","v"=>"101"],["n"=>"2021","v"=>"118"],["n"=>"2020","v"=>"16"],["n"=>"2019","v"=>"7"],["n"=>"2018","v"=>"2"],["n"=>"2017","v"=>"3"],["n"=>"2016","v"=>"22"]]],
                ["key"=>"sort","name"=>"排序","value"=>[["n"=>"热门","v"=>"hot"],["n"=>"评分","v"=>"rating"],["n"=>"更新","v"=>"update"]]]
            ],
            "2" => [
                ["key"=>"cateId","name"=>"分类","value"=>[["n"=>"全部","v"=>"2"],["n"=>"首推","v"=>"14"],["n"=>"国产","v"=>"15"],["n"=>"港台","v"=>"16"],["n"=>"日韩","v"=>"17"],["n"=>"海外","v"=>"18"]]],
                ["key"=>"area","name"=>"地區","value"=>[["n"=>"全部","v"=>"0"],["n"=>"国产","v"=>"1"],["n"=>"中国香港","v"=>"3"],["n"=>"中国台湾","v"=>"6"],["n"=>"美国","v"=>"5"],["n"=>"韩国","v"=>"18"],["n"=>"日本","v"=>"2"]]],
                ["key"=>"year","name"=>"年代","value"=>[["n"=>"全部","v"=>"0"],["n"=>"2025","v"=>"107"],["n"=>"2024","v"=>"119"],["n"=>"2023","v"=>"153"],["n"=>"2022","v"=>"101"],["n"=>"2021","v"=>"118"],["n"=>"2020","v"=>"16"],["n"=>"2019","v"=>"7"],["n"=>"2018","v"=>"2"],["n"=>"2017","v"=>"3"],["n"=>"2016","v"=>"22"]]],
                ["key"=>"sort","name"=>"排序","value"=>[["n"=>"热门","v"=>"hot"],["n"=>"评分","v"=>"rating"],["n"=>"更新","v"=>"update"]]]
            ],
            "3" => [
                ["key"=>"cateId","name"=>"分类","value"=>[["n"=>"全部","v"=>"3"],["n"=>"首推","v"=>"19"],["n"=>"海外","v"=>"20"],["n"=>"日本","v"=>"21"],["n"=>"国产","v"=>"22"]]],
                ["key"=>"area","name"=>"地區","value"=>[["n"=>"全部","v"=>"0"],["n"=>"国产","v"=>"1"],["n"=>"中国香港","v"=>"3"],["n"=>"中国台湾","v"=>"6"],["n"=>"美国","v"=>"5"],["n"=>"韩国","v"=>"18"],["n"=>"日本","v"=>"2"]]],
                ["key"=>"year","name"=>"年代","value"=>[["n"=>"全部","v"=>"0"],["n"=>"2025","v"=>"107"],["n"=>"2024","v"=>"119"],["n"=>"2023","v"=>"153"],["n"=>"2022","v"=>"101"],["n"=>"2021","v"=>"118"],["n"=>"2020","v"=>"16"],["n"=>"2019","v"=>"7"],["n"=>"2018","v"=>"2"],["n"=>"2017","v"=>"3"],["n"=>"2016","v"=>"22"]]],
                ["key"=>"sort","name"=>"排序","value"=>[["n"=>"热门","v"=>"hot"],["n"=>"评分","v"=>"rating"],["n"=>"更新","v"=>"update"]]]
            ],
            "4" => [
                ["key"=>"cateId","name"=>"分类","value"=>[["n"=>"全部","v"=>"4"],["n"=>"首推","v"=>"23"],["n"=>"国产","v"=>"24"],["n"=>"海外","v"=>"25"],["n"=>"港台","v"=>"26"]]],
                ["key"=>"area","name"=>"地區","value"=>[["n"=>"全部","v"=>"0"],["n"=>"国产","v"=>"1"],["n"=>"中国香港","v"=>"3"],["n"=>"中国台湾","v"=>"6"],["n"=>"美国","v"=>"5"],["n"=>"韩国","v"=>"18"],["n"=>"日本","v"=>"2"]]],
                ["key"=>"year","name"=>"年代","value"=>[["n"=>"全部","v"=>"0"],["n"=>"2025","v"=>"107"],["n"=>"2024","v"=>"119"],["n"=>"2023","v"=>"153"],["n"=>"2022","v"=>"101"],["n"=>"2021","v"=>"118"],["n"=>"2020","v"=>"16"],["n"=>"2019","v"=>"7"],["n"=>"2018","v"=>"2"],["n"=>"2017","v"=>"3"],["n"=>"2016","v"=>"22"]]],
                ["key"=>"sort","name"=>"排序","value"=>[["n"=>"热门","v"=>"hot"],["n"=>"评分","v"=>"rating"],["n"=>"更新","v"=>"update"]]]
            ],
            "67" => [
                ["key"=>"cateId","name"=>"分类","value"=>[["n"=>"全部","v"=>"67"],["n"=>"言情","v"=>"70"],["n"=>"爱情","v"=>"71"],["n"=>"战神","v"=>"72"],["n"=>"古代","v"=>"73"],["n"=>"萌娃","v"=>"74"],["n"=>"神医","v"=>"75"],["n"=>"玄幻","v"=>"76"],["n"=>"重生","v"=>"77"],["n"=>"激情","v"=>"79"],["n"=>"时尚","v"=>"82"],["n"=>"剧情演绎","v"=>"83"],["n"=>"影视","v"=>"84"],["n"=>"人文社科","v"=>"85"],["n"=>"二次元","v"=>"86"],["n"=>"明星八卦","v"=>"87"],["n"=>"随拍","v"=>"88"],["n"=>"个人管理","v"=>"89"],["n"=>"音乐","v"=>"90"],["n"=>"汽车","v"=>"91"],["n"=>"休闲","v"=>"92"],["n"=>"校园教育","v"=>"93"],["n"=>"游戏","v"=>"94"],["n"=>"科普","v"=>"95"],["n"=>"科技","v"=>"96"],["n"=>"时政社会","v"=>"97"],["n"=>"萌宠","v"=>"98"],["n"=>"体育","v"=>"99"],["n"=>"穿越","v"=>"80"],["n"=>"","v"=>"81"],["n"=>"闪婚","v"=>"112"]]],
                ["key"=>"sort","name"=>"排序","value"=>[["n"=>"全部","v"=>""],["n"=>"最新","v"=>"update"],["n"=>"最热","v"=>"hot"]]]
            ]
        ];

        for ($i = 0; $i < count($classNames); $i++) {
            $typeId = $classUrls[$i];
            $classes[] = [
                'type_id' => $typeId,
                'type_name' => $classNames[$i]
            ];
            
            if (isset($filterConfig[$typeId])) {
                $filterObj[$typeId] = $filterConfig[$typeId];
            }
        }
        
        // 获取首页推荐 (保持原有逻辑)
        $homeUrl = $this->HOST . '/api/dyTag/hand_data?category_id=88';
        $homeData = json_decode($this->fetch($homeUrl, [], $this->HEADERS), true);
        $list = [];
        
        if (isset($homeData['data']['20'])) {
            foreach ($homeData['data']['20'] as $item) {
                $list[] = [
                    'vod_id' => $item['id'],
                    'vod_name' => $item['title'],
                    'vod_pic' => $this->IMGHOST . $item['path'],
                    'vod_remarks' => $item['mask'] . ' ⭐' . $item['score']
                ];
            }
        }
        
        return [
            'class' => $classes,
            'filters' => $filterObj,
            'list' => $list
        ];
    }
    
    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        // 构建请求URL
        $url = $this->HOST . '/api/crumb/list?page=' . $pg . '&type=0&limit=24';
        
        // 处理过滤器
        $filterUrl = 'area=' . ($filter['area'] ?? '0') . '&sort=' . ($filter['sort'] ?? 'update') . '&year=' . ($filter['year'] ?? '0') . '&category_id=' . ($filter['cateId'] ?? $tid);
        $url .= '&' . $filterUrl;
        
        // 处理短剧特殊情况
        if ($tid == 67) {
            $url = str_replace('/api/crumb/list', '/api/crumb/shortList', $url);
        }
        
        $data = json_decode($this->fetch($url, [], $this->HEADERS), true);
        $list = [];
        $total = 0;
        
        if (isset($data['data'])) {
            // 检查API响应中是否包含total信息
            if (is_array($data['data']) && count($data['data']) > 0) {
                // 对于API没有直接返回total的情况，我们假设总共有大量数据
                // 这里使用一个较大的值来确保分页正常工作
                $total = 1000;
                
                foreach ($data['data'] as $item) {
                    $isShort = $tid == 67;
                    $imgUrl = $this->IMGHOST . ($isShort ? ($item['cover_image'] ?? $item['path']) : ($item['thumbnail'] ?? $item['path']));
                    
                    // 短剧需要在vod_id中附加类型信息，以便detailContent方法识别
                    $vodId = $isShort ? ($item['id'] . '@67') : $item['id'];
                    
                    $list[] = [
                        'vod_id' => $vodId,
                        'vod_name' => $item['title'],
                        'vod_pic' => $imgUrl,
                        'vod_remarks' => ($item['mask'] ?? '') . ' ⭐' . ($item['score'] ?? '0')
                    ];
                }
            }
        }
        
        return $this->pageResult($list, $pg, $total, 24);
    }
    
    public function detailContent($ids) {
        $id = is_array($ids) ? $ids[0] : $ids;
        $tid = '';
        if (strpos($id, '@') !== false) {
            list($id, $tid) = explode('@', $id);
        }
        
        $isShort = $tid == 67;
        $detailPath = $isShort ? '/api/detail?vid=' . $id : '/api/video/detailv2?id=' . $id;
        
        $detailUrl = $this->HOST . $detailPath;
        $data = json_decode($this->fetch($detailUrl, [], $this->HEADERS), true);
        $item = $data['data'];
        
        $playFrom = [];
        $playUrls = [];
        
        if ($isShort) {
            // 短剧可能有不同的数据结构，尝试多种方式获取播放列表
            $playlist = [];
            
            // 尝试从playlist字段获取
            if (isset($item['playlist']) && is_array($item['playlist'])) {
                $playlist = $item['playlist'];
            }
            // 尝试从video_list字段获取
            elseif (isset($item['video_list']) && is_array($item['video_list'])) {
                $playlist = $item['video_list'];
            }
            // 尝试从episodes字段获取
            elseif (isset($item['episodes']) && is_array($item['episodes'])) {
                $playlist = $item['episodes'];
            }
            
            if (count($playlist) > 0) {
                $playFrom[] = '短剧';
                $urls = [];
                foreach ($playlist as $ep) {
                    // 处理不同的数据结构
                    $title = $ep['title'] ?? $ep['episode_title'] ?? ($ep['episode'] ?? '第1集');
                    $url = $ep['url'] ?? $ep['video_url'] ?? $ep['play_url'] ?? '';
                    
                    // 过滤无效地址和ftp协议
                    if (!empty($url) && stripos($url, 'ftp://') !== 0) {
                        $urls[] = $title . '$' . $url;
                    }
                }
                if (!empty($urls)) {
                    $playUrls[] = implode('#', $urls);
                }
            } else {
                // 尝试直接从item中获取单个播放地址（针对单集短剧）
                $url = $item['url'] ?? $item['video_url'] ?? $item['play_url'] ?? '';
                if (!empty($url) && stripos($url, 'ftp://') !== 0) {
                    $playFrom[] = '短剧';
                    $playUrls[] = '全集$' . $url;
                }
            }
        } else {
            if (isset($item['source_list_source'])) {
                foreach ($item['source_list_source'] as $src) {
                    $name = $src['name'] == '常规线路' ? '边下边播线路' : $src['name'];
                    
                    $urls = [];
                    foreach ($src['source_list'] as $ep) {
                        $url = $ep['url'];
                        // 过滤ftp协议的地址，只保留http/https协议
                        if (stripos($url, 'ftp://') === 0) {
                            continue;
                        }
                        $urls[] = ($ep['source_name'] ?? $ep['weight']) . '$' . $url;
                    }
                    if (!empty($urls)) {
                        $playFrom[] = $name;
                        $playUrls[] = implode('#', $urls);
                    }
                }
            }
            
            // 尝试从source_list字段获取（备用方案）
            if (empty($playUrls) && isset($item['source_list'])) {
                foreach ($item['source_list'] as $src) {
                    $name = $src['name'] ?? '默认线路';
                    
                    $urls = [];
                    foreach ($src['source'] as $ep) {
                        $url = $ep['url'];
                        if (stripos($url, 'ftp://') !== 0) {
                            $urls[] = ($ep['name'] ?? $ep['title']) . '$' . $url;
                        }
                    }
                    if (!empty($urls)) {
                        $playFrom[] = $name;
                        $playUrls[] = implode('#', $urls);
                    }
                }
            }
        }
        
        return [
            'list' => [[
                'vod_id' => $id,
                'vod_name' => $item['title'],
                'vod_pic' => $this->IMGHOST . ($isShort ? ($item['cover_image'] ?? $item['path']) : ($item['thumbnail'] ?? $item['path'])),
                'vod_year' => $item['year'] ?? '',
                'vod_area' => $item['area'] ?? '',
                'vod_remarks' => $item['update_cycle'] ?? $item['mask'] ?? '',
                'vod_actor' => implode('/', array_column($item['actors'] ?? [], 'name')),
                'vod_director' => implode('/', array_column($item['directors'] ?? [], 'name')),
                'vod_content' => $item['description'] ?? '',
                'vod_play_from' => implode('$$$', $playFrom),
                'vod_play_url' => implode('$$$', $playUrls)
            ]]
        ];
    }
    
    public function searchContent($key, $quick = false, $pg = 1) {
        $searchUrl = $this->HOST . '/api/v2/search/videoV2?key=' . urlencode($key) . '&page=' . $pg;
        $data = json_decode($this->fetch($searchUrl, [], $this->HEADERS), true);
        $list = [];
        $total = 0;
        
        if (isset($data['data'])) {
            if (is_array($data['data']) && count($data['data']) > 0) {
                // 对于搜索结果，同样使用较大值确保分页正常
                $total = 1000;
                
                foreach ($data['data'] as $item) {
                    // 检查是否为短剧，根据category_id判断
                    $isShort = isset($item['category_id']) && $item['category_id'] == 67;
                    $vodId = $isShort ? ($item['id'] . '@67') : $item['id'];
                    
                    $list[] = [
                        'vod_id' => $vodId,
                        'vod_name' => $item['title'],
                        'vod_pic' => $this->IMGHOST . $item['thumbnail'],
                        'vod_remarks' => $item['mask'] . ' ⭐' . $item['score']
                    ];
                }
            }
        }
        
        return $this->pageResult($list, $pg, $total, 20);
    }
    
    public function playerContent($flag, $id, $vipFlags = []) {
        try {
            // 优化视频播放，使用更高效的处理方式
            // 检查是否为m3u8格式（流媒体格式）
            if (stripos($id, '.m3u8') !== false) {
                return [
                    'parse' => 0,
                    'url' => $id,
                    'header' => [
                        'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                        'Referer' => $id,
                        'Accept' => '*/*',
                        'Connection' => 'keep-alive',
                        'Origin' => parse_url($id, PHP_URL_SCHEME) . '://' . parse_url($id, PHP_URL_HOST)
                    ]
                ];
            }
            
            // 检查是否为mp4等直接视频格式
            $videoExtensions = ['mp4', 'flv', 'avi', 'wmv', 'mov', 'webm'];
            $path = parse_url($id, PHP_URL_PATH) ?? '';
            $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            
            if (in_array($extension, $videoExtensions)) {
                return [
                    'parse' => 0,
                    'url' => $id,
                    'header' => [
                        'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                        'Referer' => $id,
                        'Range' => 'bytes=0-', // 支持断点续传
                        'Accept-Ranges' => 'bytes'
                    ]
                ];
            }
            
            // 默认返回原始地址
            return [
                'parse' => 0,
                'url' => $id,
                'header' => [
                    'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                    'Referer' => $id
                ]
            ];
        } catch (Exception $e) {
            // 发生错误时返回原始地址
            return [
                'parse' => 0,
                'url' => $id,
                'header' => ['User-Agent' => 'Mozilla/5.0']
            ];
        }
    }
}

(new Spider())->run();