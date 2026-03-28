<?php
/**
 * 番茄漫画 ᵈᶻ.php
 * 对应源: 番茄漫画[画].js
 */

require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private const HOST = 'https://qkfqapi.vv9v.cn';
    private const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

    private $startPage = 1;

    public function init($extend = '') {
        $this->startPage = 1;
    }

    public function homeContent($filter = []) {
        $url = self::HOST . '/api/discover/style?tab=漫画';
        $json = $this->fetchJson($url);
        
        $classes = [];
        if (isset($json['data']) && is_array($json['data'])) {
            foreach ($json['data'] as $item) {
                if (isset($item['url']) && trim($item['url'])) {
                    $classes[] = [
                        'type_id' => $item['url'], // URL作为ID
                        'type_name' => $item['title'] ?? '未知分类',
                    ];
                }
            }
        }
        
        return [
            'class' => $classes,
            'filters' => (object)[]
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        // tid 是类似 /api/discover?tab=漫画&type=7...&page=1 的URL
        // 需要替换 page 参数
        $url = self::HOST . $tid;
        if (strpos($tid, 'http') === 0) {
            $url = $tid;
        }

        // 简单的页码替换逻辑：假设URL中包含 page=1
        // 如果包含 page=x，替换为 page=$pg
        if (preg_match('/page=\d+/', $url)) {
            $url = preg_replace('/page=\d+/', 'page=' . $pg, $url);
        } else {
            // 如果没有page参数，追加
            $sep = (strpos($url, '?') !== false) ? '&' : '?';
            $url .= $sep . 'page=' . $pg;
        }

        $json = $this->fetchJson($url);
        $list = $this->parseList($json);
        
        return $this->pageResult($list, $pg, 0, 10); // limit 10
    }

    public function detailContent($ids) {
        $id = $ids[0];
        $url = self::HOST . "/api/book?book_id=$id";
        $json = $this->fetchJson($url);
        
        $vod = [
            'vod_id' => $id,
            'vod_name' => '',
            'vod_pic' => '',
            'type_name' => '',
            'vod_year' => '',
            'vod_area' => '',
            'vod_remarks' => '',
            'vod_actor' => '',
            'vod_director' => '',
            'vod_content' => '',
        ];

        if (isset($json['data']['data'])) {
            $data = $json['data']['data'];
            $vod['vod_name'] = $data['book_name'] ?? '';
            $vod['type_name'] = $data['category'] ?? '';
            $vod['vod_pic'] = $data['thumb_url'] ?? '';
            $vod['vod_content'] = $data['abstract'] ?? '';
            $vod['vod_remarks'] = $data['sub_info'] ?? '';
            $vod['vod_director'] = $data['author'] ?? '';
            
            // 章节列表
            // 这里需要获取章节列表，JS中使用了 jsonStr.parseX.data.data.chapterListWithVolume
            // 假设API返回结构一致
            $chapters = [];
            if (isset($data['chapterListWithVolume'])) {
                // 可能是嵌套数组，需要扁平化
                foreach ($data['chapterListWithVolume'] as $volume) {
                    if (is_array($volume)) {
                        foreach ($volume as $chapter) {
                            $chapters[] = $chapter;
                        }
                    }
                }
            }
            
            // 如果扁平化失败，尝试直接读取（视API返回而定）
            if (empty($chapters) && isset($data['chapter_list'])) {
                $chapters = $data['chapter_list'];
            }

            $playUrls = [];
            foreach ($chapters as $ch) {
                $title = $ch['title'] ?? '未知章节';
                $itemId = $ch['itemId'] ?? $ch['item_id'] ?? '';
                $playUrls[] = "$title$$itemId@$title";
            }
            
            $vod['vod_play_from'] = '番茄漫画';
            $vod['vod_play_url'] = implode('#', $playUrls);
        }
        
        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $offset = ($pg - 1) * 10;
        $url = self::HOST . "/api/search?key=" . urlencode($key) . "&tab_type=8&offset=$offset";
        $json = $this->fetchJson($url);
        
        $list = [];
        if (isset($json['data']['search_tabs'][3]['data'])) {
            $items = $json['data']['search_tabs'][3]['data'];
            foreach ($items as $it) {
                if (isset($it['book_data'][0])) {
                    $book = $it['book_data'][0];
                    $list[] = [
                        'vod_id' => $book['book_id'] ?? '',
                        'vod_name' => $book['book_name'] ?? '',
                        'vod_pic' => $book['thumb_url'] ?? '',
                        'vod_remarks' => $book['author'] ?? '',
                        'vod_content' => $book['book_abstract'] ?? $book['abstract'] ?? '',
                    ];
                }
            }
        }
        
        return $this->pageResult($list, $pg, 0, 10);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        // id: itemId@title
        $parts = explode('@', $id);
        $itemId = $parts[0];
        
        $url = self::HOST . "/api/content?tab=漫画&item_id=$itemId&show_html=0";
        $cookie = $this->getFqCookie();
        $json = $this->fetchJson($url, ['headers' => ['Cookie' => $cookie]]);
        
        $pics = [];
        if (isset($json['data']['images'])) {
            $images = $json['data']['images'];
            if (is_string($images)) {
                if (preg_match_all('/<img[^>]+src=[\'"]([^\'"]+)[\'"]/i', $images, $matches)) {
                    $pics = $matches[1];
                }
            } elseif (is_array($images)) {
                foreach ($images as $img) {
                    if (isset($img['src'])) {
                        $pics[] = $img['src'];
                    } elseif (isset($img['url'])) {
                        $pics[] = $img['url'];
                    }
                }
            }
        }
        
        if (empty($pics)) {
            return ['parse' => 0, 'url' => '', 'header' => (object)[]];
        }
        
        // 漫画通常使用 pics:// 协议
        return ['parse' => 0, 'url' => 'pics://' . implode('&&', $pics), 'header' => (object)[]];
    }

    // 辅助方法：解析列表
    private function parseList($json) {
        $list = [];
        $data = $json['data'] ?? [];
        if (isset($data['data'])) {
            $data = $data['data'];
        }
        
        if (is_array($data)) {
            foreach ($data as $item) {
                if ($item && (isset($item['book_name']) || isset($item['title']))) {
                    $list[] = [
                        'vod_id' => $item['book_id'] ?? $item['id'] ?? '',
                        'vod_name' => $item['book_name'] ?? $item['title'] ?? '',
                        'vod_pic' => $item['thumb_url'] ?? $item['cover'] ?? '',
                        'vod_remarks' => $item['author'] ?? $item['category'] ?? '',
                        'vod_content' => $item['abstract'] ?? $item['description'] ?? '',
                    ];
                }
            }
        }
        return $list;
    }

    private function getFqCookie() {
        $cookies = [
            'novel_web_id=78444872394737941004',
            'novel_web_id=69258894393744181011',
            'novel_web_id=77130880221809081001',
            'novel_web_id=64945771562463261001',
            'novel_web_id=78444872394737941004',
            'novel_web_id=0000000000004011402',
            'novel_web_id=0000000303614711402',
            'novel_web_id=0144211303614711401',
            'novel_web_id=0144211303614711402',
            'novel_web_id=0144211303614711403',
            'novel_web_id=0144211303614711406',
            'novel_web_id=7357767624615331361',
            'novel_web_id=7357767624615331362',
            'novel_web_id=7357767624615331365',
        ];
        return $cookies[array_rand($cookies)];
    }
}

// 运行爬虫
(new Spider())->run();
