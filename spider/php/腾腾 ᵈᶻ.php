<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $host = 'https://v.qq.com';
    private $apiHost = 'https://pbaccess.video.qq.com';
    
    public function homeContent($filter) {
        $classes = [
            ['type_id' => '100173', 'type_name' => '电影'],
            ['type_id' => '100113', 'type_name' => '电视剧'],
            ['type_id' => '100109', 'type_name' => '综艺'],
            ['type_id' => '100105', 'type_name' => '纪录片'],
            ['type_id' => '100119', 'type_name' => '动漫'],
            ['type_id' => '100150', 'type_name' => '少儿'],
            ['type_id' => '110755', 'type_name' => '短剧']
        ];

        $filters = [
            '100173' => [
                [
                    'key' => 'iyear', 'name' => '年份', 'value' => [
                        ['n' => '全部', 'v' => '-1'], ['n' => '2025', 'v' => '2025'], ['n' => '2024', 'v' => '2024'],
                        ['n' => '2023', 'v' => '2023'], ['n' => '2022', 'v' => '2022'], ['n' => '2021', 'v' => '2021'],
                        ['n' => '2020', 'v' => '2020']
                    ]
                ],
                [
                    'key' => 'sort', 'name' => '排序', 'value' => [
                        ['n' => '综合', 'v' => '75'], ['n' => '最新', 'v' => '76'], ['n' => '最热', 'v' => '74']
                    ]
                ]
            ],
            '100113' => [
                [
                    'key' => 'iyear', 'name' => '年份', 'value' => [
                        ['n' => '全部', 'v' => '-1'], ['n' => '2025', 'v' => '2025'], ['n' => '2024', 'v' => '2024'],
                        ['n' => '2023', 'v' => '2023'], ['n' => '2022', 'v' => '2022'], ['n' => '2021', 'v' => '2021'],
                        ['n' => '2020', 'v' => '2020']
                    ]
                ],
                [
                    'key' => 'sort', 'name' => '排序', 'value' => [
                        ['n' => '综合', 'v' => '75'], ['n' => '最新', 'v' => '76'], ['n' => '最热', 'v' => '74']
                    ]
                ]
            ],
            '100109' => [
                [
                    'key' => 'sort', 'name' => '排序', 'value' => [
                        ['n' => '综合', 'v' => '75'], ['n' => '最新', 'v' => '76'], ['n' => '最热', 'v' => '74']
                    ]
                ]
            ],
            '100119' => [
                [
                    'key' => 'sort', 'name' => '排序', 'value' => [
                        ['n' => '综合', 'v' => '75'], ['n' => '最新', 'v' => '76'], ['n' => '最热', 'v' => '74']
                    ]
                ]
            ]
        ];

        return [
            'class' => $classes,
            'filters' => $filters
        ];
    }

    public function homeVideoContent() {
        return ['list' => []];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $page = max(1, intval($pg));
        $offset = ($page - 1) * 21;
        
        // 构建列表页URL（使用原始的页面URL结构）
        $url = $this->host . '/x/bu/pagesheet/list';
        $params = [
            '_all' => '1',
            'append' => '1',
            'channel' => $this->getChannelByTid($tid),
            'listpage' => '1',
            'offset' => $offset,
            'pagesize' => '21',
            'iarea' => '-1'
        ];
        
        // 添加排序参数
        if (isset($extend['sort']) && $extend['sort'] !== '-1') {
            $params['sort'] = $extend['sort'];
        } else {
            $params['sort'] = '75'; // 默认综合排序
        }
        
        // 添加其他筛选参数
        if (isset($extend['iyear']) && $extend['iyear'] !== '-1') {
            $params['iyear'] = $extend['iyear'];
        }
        
        $fullUrl = $url . '?' . http_build_query($params);
        
        // 使用新的PHP解析逻辑
        $videos = $this->parseListPage($fullUrl);
        
        return $this->pageResult($videos, $page, 99999, 21);
    }
    
    /**
     * 根据类型ID获取频道名称
     */
    private function getChannelByTid($tid) {
        $map = [
            '100173' => 'movie',      // 电影
            '100113' => 'tv',         // 电视剧
            '100109' => 'variety',    // 综艺
            '100105' => 'doco',       // 纪录片
            '100119' => 'cartoon',    // 动漫
            '100150' => 'child',      // 少儿
            '110755' => 'choice'      // 短剧（用精选代替）
        ];
        
        return $map[$tid] ?? 'movie';
    }
    
    /**
     * 解析列表页（使用新的PHP逻辑）
     */
    private function parseListPage($url) {
        $result = [];
        
        try {
            // 1. 获取网页内容
            $html = $this->fetch($url);
            
            // 2. 使用DOMDocument解析HTML
            libxml_use_internal_errors(true);
            $dom = new DOMDocument();
            @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
            $xpath = new DOMXPath($dom);
            
            // 3. 查找所有列表项
            $listItems = $xpath->query('//div[contains(@class, "list_item")]');
            
            foreach ($listItems as $item) {
                // 提取标题 (img的alt属性)
                $imgElements = $xpath->query('.//img', $item);
                $title = '';
                if ($imgElements->length > 0) {
                    $node = $imgElements->item(0);
                    if ($node instanceof DOMElement) {
                        $title = $node->getAttribute('alt');
                        $title = html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                    }
                }
                
                // 提取图片 (img的src属性)
                $pic = '';
                if ($imgElements->length > 0) {
                    $node = $imgElements->item(0);
                    if ($node instanceof DOMElement) {
                        $pic = $node->getAttribute('src');
                        // 确保图片URL完整
                        if ($pic && !preg_match('/^https?:\/\//', $pic)) {
                            $pic = $this->urlJoin($url, $pic);
                        }
                    }
                }
                
                // 提取描述 (a标签的文本)
                $aElements = $xpath->query('.//a', $item);
                $desc = '';
                if ($aElements->length > 0) {
                    $desc = trim($aElements->item(0)->textContent);
                    $desc = html_entity_decode($desc, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                }
                
                // 提取链接 (a标签的data-float属性)
                $link = '';
                if ($aElements->length > 0) {
                    $node = $aElements->item(0);
                    if ($node instanceof DOMElement) {
                        $link = $node->getAttribute('data-float');
                        // 处理链接，获取CID
                        if ($link) {
                            $cid = $this->extractCidFromUrl($link);
                            if ($cid) {
                                $link = $cid;
                            }
                        }
                    }
                }
                
                // 如果链接为空，尝试从其他属性提取
                if (empty($link) && $aElements->length > 0) {
                    $node = $aElements->item(0);
                    if ($node instanceof DOMElement) {
                        $href = $node->getAttribute('href');
                        if ($href) {
                            $cid = $this->extractCidFromUrl($href);
                            if ($cid) {
                                $link = $cid;
                            }
                        }
                    }
                }
                
                // 添加到结果数组
                if (!empty($link) && !empty($title)) {
                    $result[] = [
                        'vod_id' => $link,
                        'vod_name' => $this->cleanText($title),
                        'vod_pic' => $pic,
                        'vod_remarks' => $this->cleanText($desc)
                    ];
                }
            }
            
            // 如果DOM解析失败，尝试使用正则表达式
            if (empty($result)) {
                $result = $this->parseListWithRegex($html, $url);
            }
            
        } catch (\Exception $e) {
            error_log("解析列表页失败: " . $e->getMessage() . " URL: " . $url);
            // 尝试备用方法
            $result = $this->parseListWithRegex($html ?? '', $url);
        }
        
        return $result;
    }
    
    /**
     * 使用正则表达式解析列表页（备用方法）
     */
    private function parseListWithRegex($html, $baseUrl) {
        $result = [];
        
        // 匹配列表项
        $pattern = '/<div[^>]*class="[^"]*list_item[^"]*"[^>]*>(.*?)<\/div>/is';
        preg_match_all($pattern, $html, $itemMatches, PREG_SET_ORDER);
        
        foreach ($itemMatches as $item) {
            $itemHtml = $item[1];
            
            // 提取标题
            preg_match('/<img[^>]*alt="([^"]*)"[^>]*>/i', $itemHtml, $titleMatch);
            $title = $titleMatch[1] ?? '';
            $title = html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            
            // 提取图片
            preg_match('/<img[^>]*src="([^"]*)"[^>]*>/i', $itemHtml, $picMatch);
            $pic = $picMatch[1] ?? '';
            if ($pic && !preg_match('/^https?:\/\//', $pic)) {
                $pic = $this->urlJoin($baseUrl, $pic);
            }
            
            // 提取链接
            preg_match('/<a[^>]*data-float="([^"]*)"[^>]*>/i', $itemHtml, $linkMatch);
            $link = $linkMatch[1] ?? '';
            if (empty($link)) {
                preg_match('/<a[^>]*href="([^"]*)"[^>]*>/i', $itemHtml, $hrefMatch);
                $link = $hrefMatch[1] ?? '';
            }
            
            // 提取CID
            $cid = '';
            if ($link) {
                $cid = $this->extractCidFromUrl($link);
            }
            
            // 提取描述
            preg_match('/<a[^>]*>(.*?)<\/a>/is', $itemHtml, $descMatch);
            $desc = $descMatch[1] ?? '';
            $desc = strip_tags($desc);
            $desc = html_entity_decode($desc, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            
            if (!empty($cid) && !empty($title)) {
                $result[] = [
                    'vod_id' => $cid,
                    'vod_name' => $this->cleanText($title),
                    'vod_pic' => $pic,
                    'vod_remarks' => $this->cleanText($desc)
                ];
            }
        }
        
        return $result;
    }
    
    /**
     * 从URL中提取CID
     */
    private function extractCidFromUrl($url) {
        // 处理多种URL格式
        $patterns = [
            '/\/cover\/([a-zA-Z0-9]+)\.html/',        // /cover/CID.html
            '/\/([a-zA-Z0-9]+)\.html$/',              // /CID.html
            '/cid=([a-zA-Z0-9]+)/',                   // cid=CID
            '/\/([a-zA-Z0-9]+)\//',                   // /CID/
            '/\/detail\/m\/([a-zA-Z0-9]+)\.html/'     // /detail/m/CID.html
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                return $matches[1];
            }
        }
        
        return '';
    }
    
    /**
     * URL拼接辅助函数
     */
    private function urlJoin($baseUrl, $relativePath) {
        if (empty($relativePath)) {
            return $relativePath;
        }
        
        if (preg_match('/^https?:\/\//', $relativePath)) {
            return $relativePath;
        }
        
        $baseParts = parse_url($baseUrl);
        $basePath = isset($baseParts['path']) ? dirname($baseParts['path']) : '/';
        
        if (strpos($relativePath, '/') === 0) {
            // 绝对路径
            return $baseParts['scheme'] . '://' . $baseParts['host'] . $relativePath;
        } else {
            // 相对路径
            $newPath = rtrim($basePath, '/') . '/' . ltrim($relativePath, '/');
            return $baseParts['scheme'] . '://' . $baseParts['host'] . $newPath;
        }
    }
    
    /**
     * 清理文本，移除多余空格和换行
     */
    private function cleanText($text) {
        if (empty($text)) {
            return '';
        }
        
        $text = trim($text);
        $text = preg_replace('/\s+/', ' ', $text); // 替换多个空格为单个空格
        $text = preg_replace('/[\r\n]+/', ' ', $text); // 移除换行
        return $text;
    }

    // ================== 以下是原有的搜索逻辑，完全保持不变 ==================

    public function detailContent($ids) {
        $videoId = is_array($ids) ? $ids[0] : $ids;

        // 获取视频基本信息
        $infoUrl = $this->apiHost . '/trpc.universal_backend_service.page_server_rpc.PageServer/GetPageData';
        
        $infoBody = [
            "page_params" => [
                "req_from" => "web",
                "cid" => $videoId,
                "vid" => "",
                "lid" => "",
                "page_type" => "detail_operation",
                "page_id" => "detail_page_introduction"
            ],
            "has_cache" => 1
        ];
        
        $infoResponse = $this->fetch($infoUrl . '?video_appid=3000010&vplatform=2&vversion_name=8.2.96', [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($infoBody),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer: ' . $this->host . '/',
                'Origin: ' . $this->host
            ]
        ]);
        
        $infoJson = json_decode($infoResponse, true);
        $infoData = $infoJson['data'] ?? [];

        // 提取视频详情
        $vod = [
            'vod_id' => $videoId,
            'vod_name' => '',
            'type_name' => '',
            'vod_actor' => '',
            'vod_year' => '',
            'vod_content' => '',
            'vod_remarks' => '',
            'vod_pic' => '',
            'vod_play_from' => '腾讯视频',
            'vod_play_url' => ''
        ];

        // 提取基本信息
        if (isset($infoData['module_list_datas'][0]['module_datas'][0]['item_data_lists']['item_datas'][0])) {
            $detailData = $infoData['module_list_datas'][0]['module_datas'][0]['item_data_lists']['item_datas'][0];
            $itemParams = $detailData['item_params'] ?? [];
            
            $vod['vod_name'] = $itemParams['title'] ?? '';
            $vod['type_name'] = $itemParams['sub_genre'] ?? '';
            $vod['vod_year'] = $itemParams['year'] ?? '';
            $vod['vod_content'] = $itemParams['cover_description'] ?? '';
            $vod['vod_remarks'] = $itemParams['holly_online_time'] ?? $itemParams['hotval'] ?? '';
            $vod['vod_pic'] = $itemParams['image_url'] ?? '';
            
            // 提取演员信息
            if (isset($detailData['sub_items']['star_list']['item_datas'])) {
                $actors = [];
                foreach ($detailData['sub_items']['star_list']['item_datas'] as $star) {
                    $actors[] = $star['item_params']['name'] ?? '';
                }
                $vod['vod_actor'] = implode(',', $actors);
            }
        }

        // 方法1：使用分页获取所有剧集
        $playUrls = $this->getAllEpisodes($videoId);
        
        // 方法2：如果方法1失败，尝试备用方法
        if (empty($playUrls)) {
            $playUrls = $this->getEpisodesByTab($videoId);
        }
        
        // 方法3：如果还是没有剧集，可能是电影
        if (empty($playUrls) && !empty($videoId)) {
            $playUrls[] = "正片\${$videoId}";
        }

        $vod['vod_play_url'] = implode('#', $playUrls);

        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $page = max(1, intval($pg));
        $videos = [];
        
        // 使用原有的搜索逻辑
        $searchData = $this->vodSearch($key, $page - 1); // JavaScript代码中页码从0开始
        
        if (!empty($searchData)) {
            foreach ($searchData as $item) {
                $videos[] = [
                    'vod_id' => $item['id'] ?? '',
                    'vod_name' => $item['title'] ?? '',
                    'vod_pic' => $item['img'] ?? '',
                    'vod_remarks' => $item['desc'] ?? ''
                ];
            }
        }
        
        // 计算总页数（假设每页30条）
        $total = count($videos) > 0 ? 999 : 0;
        $limit = 30;
        
        return $this->pageResult($videos, $page, $total, $limit);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        // 解析播放地址格式：cid@vid 或 cid
        if (strpos($id, '@') !== false) {
            $parts = explode('@', $id);
            $cid = $parts[0];
            $vid = $parts[1];
            $url = "{$this->host}/x/cover/{$cid}/{$vid}.html";
        } else {
            // 只有cid，可能是电影
            $url = "{$this->host}/x/cover/{$id}.html";
        }
        
        return [
            'parse' => 1,
            'jx' => 1,
            'play_parse' => true,
            'parse_type' => '壳子超级解析',
            'parse_source' => '腾讯视频',
            'url' => $url,
            'header' => json_encode([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer' => $this->host,
                'Origin' => $this->host
            ], JSON_UNESCAPED_UNICODE)
        ];
    }

    /**
     * 执行搜索（原有的搜索逻辑）
     */
    private function vodSearch($keyword, $page = 0) {
        $url = 'https://pbaccess.video.qq.com/trpc.videosearch.mobile_search.MultiTerminalSearch/MbSearch?vplatform=2';
        
        $body = json_encode([
            "version" => "25042201",
            "clientType" => 1,
            "filterValue" => "",
            "uuid" => "B1E50847-D25F-4C4B-BBA0-36F0093487F6",
            "retry" => 0,
            "query" => $keyword,
            "pagenum" => $page,
            "isPrefetch" => true,
            "pagesize" => 30,
            "queryFrom" => 0,
            "searchDatakey" => "",
            "transInfo" => "",
            "isneedQc" => true,
            "preQid" => "",
            "adClientInfo" => "",
            "extraInfo" => [
                "isNewMarkLabel" => "1",
                "multi_terminal_pc" => "1",
                "themeType" => "1",
                "sugRelatedIds" => "{}",
                "appVersion" => ""
            ]
        ]);
        
        $response = $this->fetch($url, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.139 Safari/537.36',
                'Content-Type: application/json',
                'Origin: https://v.qq.com',
                'Referer: https://v.qq.com/'
            ]
        ]);
        
        return $this->parseSearchResult($response);
    }
    
    /**
     * 解析搜索结果（原有的搜索逻辑）
     */
    private function parseSearchResult($html) {
        $d = [];
        $seenIds = [];
        
        try {
            $json = json_decode($html, true);
            
            // 处理normalList
            if (isset($json['data']['normalList']['itemList'])) {
                $this->processItemList($json['data']['normalList']['itemList'], $d, $seenIds);
            }
            
            // 处理areaBoxList
            if (isset($json['data']['areaBoxList'])) {
                foreach ($json['data']['areaBoxList'] as $box) {
                    if (isset($box['itemList'])) {
                        $this->processItemList($box['itemList'], $d, $seenIds);
                    }
                }
            }
        } catch (\Exception $e) {
            error_log("搜索解析出错: " . $e->getMessage());
        }
        
        return $d;
    }
    
    /**
     * 处理项目列表（原有的搜索逻辑）
     */
    private function processItemList($itemList, &$d, &$seenIds) {
        $nonMainContentKeywords = [
            '：', '#', '特辑', '"', '剪辑', '片花', '独家', '专访', '纯享',
            '制作', '幕后', '宣传', 'MV', '主题曲', '插曲', '彩蛋',
            '精彩', '集锦', '盘点', '回顾', '解说', '评测', '反应', 'reaction'
        ];
        
        foreach ($itemList as $it) {
            if (isset($it['doc']['id'], $it['videoInfo']['title'])) {
                $itemId = $it['doc']['id'];
                $videoInfo = $it['videoInfo'];
                $title = $videoInfo['title'] ?? '';
                
                // 检查是否主要内容
                if (!$this->isMainContent($title, $nonMainContentKeywords)) {
                    continue;
                }
                
                // 检查是否为QQ平台
                if (!$this->isQQPlatform($videoInfo['playSites'] ?? [])) {
                    continue;
                }
                
                // 去重检查
                if (in_array($itemId, $seenIds)) {
                    continue;
                }
                
                $seenIds[] = $itemId;
                
                $d[] = [
                    'id' => $itemId,
                    'title' => $title,
                    'img' => $videoInfo['imgUrl'] ?? '',
                    'desc' => $videoInfo['secondLine'] ?? ''
                ];
            }
        }
    }
    
    /**
     * 检查是否主要内容（原有的搜索逻辑）
     */
    private function isMainContent($title, $nonMainContentKeywords) {
        if (empty($title)) {
            return false;
        }
        
        // 检查是否包含HTML标签（如<em>）
        if (strpos($title, '<') !== false) {
            return false;
        }
        
        // 检查是否包含非主要内容关键词
        foreach ($nonMainContentKeywords as $keyword) {
            if (strpos($title, $keyword) !== false) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 检查是否为QQ平台（原有的搜索逻辑）
     */
    private function isQQPlatform($playSites) {
        if (empty($playSites) || !is_array($playSites)) {
            return true; // 如果没有平台信息，默认保留
        }
        
        foreach ($playSites as $site) {
            if (isset($site['enName']) && strtolower($site['enName']) === 'qq') {
                return true;
            }
        }
        
        return false;
    }

    // ================== 其他辅助方法保持不变 ==================

    private function buildFilterParams($params) {
        $result = [];
        foreach ($params as $key => $value) {
            if ($value !== '-1' && $value !== '' && $value !== null) {
                $result[] = "{$key}={$value}";
            }
        }
        return empty($result) ? 'sort=75' : implode('&', $result);
    }
    
    /**
     * 方法1：分页获取所有剧集
     */
    private function getAllEpisodes($videoId) {
        $allEpisodes = [];
        $pageSize = 50;
        $pageNum = 1;
        $hasMore = true;
        
        while ($hasMore) {
            $episodeUrl = $this->apiHost . '/trpc.video_detail_svr.video_detail_svr.VideoDetail/GetEpisodeList';
            
            $episodeBody = [
                "cid" => $videoId,
                "vid" => "",
                "req_from" => "web",
                "page_context" => "",
                "page_size" => $pageSize,
                "page_num" => $pageNum,
                "order" => 1
            ];
            
            $episodeResponse = $this->fetch($episodeUrl . '?video_appid=3000010&vplatform=2&vversion_name=8.2.96', [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($episodeBody),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer: ' . $this->host . '/',
                    'Origin: ' . $this->host
                ]
            ]);
            
            $episodeJson = json_decode($episodeResponse, true);
            $episodeData = $episodeJson['data'] ?? [];
            
            if (isset($episodeData['item_data_lists']['item_datas'])) {
                $episodes = $episodeData['item_data_lists']['item_datas'];
                
                if (!empty($episodes)) {
                    foreach ($episodes as $item) {
                        $itemId = $item['item_id'] ?? '';
                        $itemParams = $item['item_params'] ?? [];
                        
                        if (!empty($itemId)) {
                            $title = $itemParams['title'] ?? $itemParams['subtitle'] ?? "第" . ($itemParams['order'] ?? '?') . "集";
                            $allEpisodes[] = "{$title}\${$videoId}@{$itemId}";
                        }
                    }
                    
                    // 检查是否还有更多页
                    $hasMore = isset($episodeData['has_more']) && $episodeData['has_more'] == 1;
                    $pageNum++;
                } else {
                    $hasMore = false;
                }
            } else {
                $hasMore = false;
            }
            
            // 防止无限循环
            if ($pageNum > 20) {
                break;
            }
        }
        
        return $allEpisodes;
    }
    
    /**
     * 方法2：通过tab标签获取所有剧集
     */
    private function getEpisodesByTab($videoId) {
        $allEpisodes = [];
        
        $tabUrl = $this->apiHost . '/trpc.universal_backend_service.page_server_rpc.PageServer/GetPageData';
        
        $tabBody = [
            "page_params" => [
                "req_from" => "web_vsite",
                "page_id" => "vsite_episode_list",
                "page_type" => "detail_operation",
                "id_type" => "1",
                "cid" => $videoId,
                "vid" => "",
                "lid" => "",
                "page_context" => "",
                "detail_page_type" => "1"
            ],
            "has_cache" => 1
        ];
        
        $tabResponse = $this->fetch($tabUrl . '?video_appid=3000010&vplatform=2&vversion_name=8.2.96', [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($tabBody),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer: ' . $this->host . '/',
                'Origin: ' . $this->host
            ]
        ]);
        
        $tabJson = json_decode($tabResponse, true);
        $tabData = $tabJson['data'] ?? [];
        
        if (isset($tabData['module_list_datas'])) {
            foreach ($tabData['module_list_datas'] as $module) {
                if (isset($module['module_datas'])) {
                    foreach ($module['module_datas'] as $moduleData) {
                        // 获取tab信息
                        $moduleParams = $moduleData['module_params'] ?? [];
                        $tabsJson = $moduleParams['tabs'] ?? '[]';
                        $tabs = json_decode($tabsJson, true) ?: [];
                        
                        // 处理每个tab的剧集
                        foreach ($tabs as $tab) {
                            $tabContext = $tab['page_context'] ?? '';
                            if (!empty($tabContext)) {
                                $tabEpisodes = $this->getEpisodesByTabContext($videoId, $tabContext);
                                $allEpisodes = array_merge($allEpisodes, $tabEpisodes);
                            }
                        }
                        
                        // 同时获取当前tab的剧集
                        if (isset($moduleData['item_data_lists']['item_datas'])) {
                            foreach ($moduleData['item_data_lists']['item_datas'] as $item) {
                                $itemId = $item['item_id'] ?? '';
                                $itemParams = $item['item_params'] ?? [];
                                
                                if (!empty($itemId)) {
                                    $title = $itemParams['union_title'] ?? $itemParams['title'] ?? "第" . ($itemParams['order'] ?? '?') . "集";
                                    $allEpisodes[] = "{$title}\${$videoId}@{$itemId}";
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return $allEpisodes;
    }
    
    /**
     * 获取指定tab上下文的所有剧集
     */
    private function getEpisodesByTabContext($videoId, $pageContext) {
        $episodes = [];
        
        $url = $this->apiHost . '/trpc.universal_backend_service.page_server_rpc.PageServer/GetPageData';
        
        $body = [
            "page_params" => [
                "req_from" => "web_vsite",
                "page_id" => "vsite_episode_list",
                "page_type" => "detail_operation",
                "id_type" => "1",
                "cid" => $videoId,
                "vid" => "",
                "lid" => "",
                "page_context" => $pageContext,
                "detail_page_type" => "1"
            ],
            "has_cache" => 1
        ];
        
        $response = $this->fetch($url . '?video_appid=3000010&vplatform=2&vversion_name=8.2.96', [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($body),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer: ' . $this->host . '/',
                'Origin: ' . $this->host
            ]
        ]);
        
        $json = json_decode($response, true);
        $data = $json['data'] ?? [];
        
        if (isset($data['module_list_datas'])) {
            foreach ($data['module_list_datas'] as $module) {
                if (isset($module['module_datas'])) {
                    foreach ($module['module_datas'] as $moduleData) {
                        if (isset($moduleData['item_data_lists']['item_datas'])) {
                            foreach ($moduleData['item_data_lists']['item_datas'] as $item) {
                                $itemId = $item['item_id'] ?? '';
                                $itemParams = $item['item_params'] ?? [];
                                
                                if (!empty($itemId)) {
                                    $title = $itemParams['union_title'] ?? $itemParams['title'] ?? "第" . ($itemParams['order'] ?? '?') . "集";
                                    $episodes[] = "{$title}\${$videoId}@{$itemId}";
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return $episodes;
    }
}

(new Spider())->run();