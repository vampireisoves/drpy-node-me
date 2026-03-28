<?php
/**
 * 七猫小说[书]
 * 移植自 JS 源 (e:\php_work\php\js\七猫小说[书].js)
 */
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private const HOST = 'https://www.qimao.com';
    private const LIST_URL_TEMPLATE = 'https://www.qimao.com/shuku/%s-%s-%s/';
    private const DETAIL_URL = 'https://api-ks.wtzw.com/api/v2/book/detail';
    private const SEARCH_URL = 'https://api-bc.wtzw.com/search/v1/words';
    private const CONTENT_URL = 'https://api-ks.wtzw.com/api/v1/chapter/content';
    
    // JS 源中的 Sign Key
    private const SIGN_KEY = 'd3dGiJc651gSQ8w1';
    private const AES_KEY_HEX = '32343263636238323330643730396531';

    private $startPage = 1;

    public function init($extend = '') {
        $this->startPage = 1;
    }

    public function homeContent($filter) {
        $classes = [
            ['type_id' => 'a', 'type_name' => '全部'],
            ['type_id' => '1', 'type_name' => '女生原创'],
            ['type_id' => '0', 'type_name' => '男生原创'],
            ['type_id' => '2', 'type_name' => '出版图书']
        ];
        
        $filters = [];
        // Filter URL pattern: {{fl.作品分类 or 'a'}}-a-{{fl.作品字数 or 'a'}}-{{fl.更新时间 or 'a'}}-a-{{fl.是否完结 or 'a'}}-{{fl.排序 or 'click'}}
        // 注意 URL 结构: /shuku/{class}-{filter}-{page}/
        // class 是 type_id.
        // filter string: type-a-word-time-a-status-sort
        
        $filterConfig = [
            'key' => 'filters',
            'name' => '筛选',
            'value' => [
                ['n' => '作品分类', 'v' => 'type', 'init' => 'a', 'list' => [
                    ['n' => '全部', 'v' => 'a'],
                    ['n' => '言情', 'v' => '7'],
                    ['n' => '都市', 'v' => '1'],
                    ['n' => '玄幻', 'v' => '8'],
                    ['n' => '战神', 'v' => '295'],
                    ['n' => '赘婿', 'v' => '298'],
                    ['n' => '神医', 'v' => '297'],
                    ['n' => '脑洞', 'v' => '253'],
                    ['n' => '悬疑', 'v' => '10'],
                    ['n' => '历史', 'v' => '2'],
                    ['n' => '武侠', 'v' => '4'],
                    ['n' => '游戏', 'v' => '5'],
                    ['n' => '科幻', 'v' => '6'],
                    ['n' => '现言', 'v' => '17'],
                    ['n' => '古言', 'v' => '13'],
                    ['n' => '穿越', 'v' => '23'],
                    ['n' => '重生', 'v' => '24'],
                    ['n' => '豪门', 'v' => '32'],
                    ['n' => '其他', 'v' => '11'],
                ]],
                ['n' => '作品字数', 'v' => 'word', 'init' => 'a', 'list' => [
                    ['n' => '全部', 'v' => 'a'],
                    ['n' => '30万字以下', 'v' => '1'],
                    ['n' => '30-50万字', 'v' => '2'],
                    ['n' => '50-100万字', 'v' => '3'],
                    ['n' => '100-200万字', 'v' => '4'],
                    ['n' => '200万字以上', 'v' => '5'],
                ]],
                ['n' => '更新时间', 'v' => 'time', 'init' => 'a', 'list' => [
                    ['n' => '全部', 'v' => 'a'],
                    ['n' => '3日内', 'v' => '1'],
                    ['n' => '7日内', 'v' => '2'],
                    ['n' => '半月内', 'v' => '3'],
                    ['n' => '一月内', 'v' => '4'],
                ]],
                ['n' => '是否完结', 'v' => 'status', 'init' => 'a', 'list' => [
                    ['n' => '全部', 'v' => 'a'],
                    ['n' => '连载中', 'v' => '1'],
                    ['n' => '已完结', 'v' => '2'],
                ]],
                ['n' => '排序', 'v' => 'sort', 'init' => 'click', 'list' => [
                    ['n' => '人气', 'v' => 'click'],
                    ['n' => '更新', 'v' => 'date'],
                    ['n' => '评分', 'v' => 'score'],
                ]]
            ]
        ];

        foreach ($classes as $class) {
            $filters[$class['type_id']] = [$filterConfig];
        }

        return [
            'class' => $classes,
            'filters' => (object)$filters
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        // Filter logic:
        // {{fl.作品分类 or 'a'}}-a-{{fl.作品字数 or 'a'}}-{{fl.更新时间 or 'a'}}-a-{{fl.是否完结 or 'a'}}-{{fl.排序 or 'click'}}
        $f_type = $extend['type'] ?? 'a';
        $f_word = $extend['word'] ?? 'a';
        $f_time = $extend['time'] ?? 'a';
        $f_status = $extend['status'] ?? 'a';
        $f_sort = $extend['sort'] ?? 'click';
        
        $filterStr = "{$f_type}-a-{$f_word}-{$f_time}-a-{$f_status}-{$f_sort}";
        
        // URL: /shuku/{class}-{filter}-{page}/
        $url = sprintf(self::LIST_URL_TEMPLATE, $tid, $filterStr, $pg);
        
        $html = $this->fetch($url);
        
        $videos = [];
        if ($html) {
            $items = $this->pdfa($html, 'ul.qm-cover-text&&li');
            foreach ($items as $itemHtml) {
                $video = [
                    'vod_id' => '',
                    'vod_name' => $this->pdfh($itemHtml, '.s-tit&&Text'),
                    'vod_pic' => $this->pd($itemHtml, 'img&&src', $url),
                    'vod_remarks' => $this->pdfh($itemHtml, '.s-author&&Text'),
                    'vod_content' => $this->pdfh($itemHtml, '.s-desc&&Text')
                ];
                
                $href = $this->pd($itemHtml, 'a&&href', $url);
                if (preg_match('/shuku\/(\d+)/', $href, $matches)) {
                    $video['vod_id'] = $matches[1];
                }
                
                if (!empty($video['vod_id'])) {
                    $videos[] = $video;
                }
            }
        }
        
        return $this->pageResult($videos, $pg);
    }

    public function detailContent($ids) {
        $id = $ids[0]; // This is book_id
        $url = self::HOST . "/shuku/$id/";
        
        // 1. Fetch Detail Page for basic info
        $html = $this->fetch($url);
        $vod = [
            'vod_id' => $id,
            'vod_name' => '',
            'vod_pic' => '',
            'vod_content' => '',
            'vod_remarks' => '',
            'vod_director' => '',
            'vod_play_from' => '七猫小说',
        ];

        if ($html) {
            $vod['vod_name'] = $this->pdfh($html, 'span.txt&&Text');
            $vod['vod_pic'] = $this->pd($html, '.wrap-pic&&img&&src', $url);
            $vod['vod_content'] = $this->pdfh($html, '.book-introduction-item&&.qm-with-title-tb&&Text');
            $vod['vod_director'] = $this->pdfh($html, '.sub-title&&span&&a&&Text');
            $vod['vod_remarks'] = $this->pdfh($html, '.qm-tag&&Text');
        }

        // 2. Fetch Chapter List via API
        // https://www.qimao.com/api/book/chapter-list?book_id=1699328
        $chapterUrl = self::HOST . "/api/book/chapter-list?book_id=$id";
        $json = $this->fetchJson($chapterUrl);
        
        $playList = [];
        if (isset($json['data']['chapters'])) {
            foreach ($json['data']['chapters'] as $ch) {
                $title = $ch['title'] ?? '';
                $cid = $ch['id'] ?? '';
                // Format: title$book_id@@chapter_id@@title
                $playList[] = "$title$$id@@$cid@@$title";
            }
        }
        
        $vod['vod_play_url'] = implode('#', $playList);
        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $params = [
            'extend' => '',
            'tab' => '0', // Missing in previous version
            'gender' => '0',
            'refresh_state' => '8', // Missing in previous version
            'page' => $pg,
            'wd' => $key,
            'is_short_story_user' => '0'
        ];
        
        // Calculate Sign
        $signStr = "";
        ksort($params);
        foreach ($params as $k => $v) {
            $signStr .= $k . "=" . $v;
        }
        $signStr .= self::SIGN_KEY;
        $params['sign'] = md5($signStr);
        
        $url = self::SEARCH_URL . '?' . http_build_query($params);
        // echo "DEBUG Search URL: $url\n";
        
        $headers = $this->getSignHeaders();
        // Use fetch to see raw response
        $raw = $this->fetch($url, ['headers' => $headers]);
        // echo "DEBUG Search Response: " . substr($raw, 0, 200) . "\n";
        $json = json_decode($raw, true);
        
        $videos = [];
        if (!empty($json['data']['books'])) {
            foreach ($json['data']['books'] as $item) {
                // Python filters by show_type == '0'
                if (isset($item['show_type']) && $item['show_type'] == '0') {
                    $videos[] = [
                        'vod_id' => $item['id'],
                        'vod_name' => $item['original_title'],
                        'vod_pic' => $item['image_link'] ?? '', 
                        'vod_remarks' => $item['author'] ?? '',
                        'vod_content' => $item['intro'] ?? ''
                    ];
                }
            }
        }
        return [
            'list' => $videos
        ];
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        // id format: title$book_id@@chapter_id@@title
        $parts = explode('@@', $id);
        
        // Use full ID part (Title$BookID) as in JS/Python source
        $bookId = $parts[0]; 
        $chapterId = $parts[1] ?? '';
        $title = $parts[2] ?? '';
        
        $params = [
            'id' => $bookId,
            'chapterId' => $chapterId
        ];

        // Calculate Sign
        $signStr = "";
        ksort($params);
        foreach ($params as $k => $v) {
            $signStr .= $k . "=" . $v;
        }
        $signStr .= self::SIGN_KEY;
        $params['sign'] = md5($signStr);
        
        // Debug info
        // echo "\nDEBUG Sign Str: $signStr\n";
        // echo "DEBUG Sign: " . $params['sign'] . "\n";
        
        // Manual URL construction to match Python's order: id, chapterId, sign
        // Although ksort is used for sign calculation, the request URL might need specific order
        $query = 'id=' . $bookId . '&chapterId=' . $chapterId . '&sign=' . $params['sign'];
        $url = self::CONTENT_URL . '?' . $query;
        // echo "DEBUG URL: $url\n";
        
        // Use BaseSpider fetch with specific options
        $options = [
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1, // Force HTTP/1.1 to match Python requests behavior
            'headers' => $this->getSignHeaders()
        ];
        
        $raw = $this->fetch($url, $options);
        
        // echo "DEBUG Response: " . substr($raw, 0, 100) . "\n";
        
        $json = json_decode($raw, true) ?: [];
        
        $content = '';
        if (isset($json['data']['content'])) {
            $content = $this->decodeContent($json['data']['content']);
        }
        
        if (empty($content)) {
            $msg = $json['msg'] ?? 'unknown error';
            $code = $json['code'] ?? 'unknown';
            $preview = substr($raw, 0, 100);
            return [
                'parse' => 0,
                'url' => 'novel://' . json_encode(['title' => "Error: $code - $msg ($preview)", 'content' => ''], JSON_UNESCAPED_UNICODE),
                'header' => (object)[]
            ];
        }
        
        return [
            'parse' => 0,
            'url' => 'novel://' . json_encode(['title' => $title, 'content' => $content], JSON_UNESCAPED_UNICODE),
            'header' => (object)[]
        ];
    }
    
    // ================== Helpers ==================
    
    private function getSign($params) {
        ksort($params);
        $str = "";
        foreach ($params as $k => $v) {
            $str .= $k . "=" . $v;
        }
        $str .= self::SIGN_KEY;
        // Debug: return raw string for checking if needed, but for now just MD5
        // To debug: throw exception or log
        return md5($str);
    }
    
    private function getSignHeaders() {
        return [
            "User-Agent" => "python-requests/2.31.0", // Mimic Python requests
            "Accept" => "*/*",
            "app-version" => "51110",
            "platform" => "android",
            "reg" => "0",
            "AUTHORIZATION" => "",
            "application-id" => "com.****.reader",
            "net-env" => "1",
            "channel" => "unknown",
            "qm-params" => "",
            "sign" => "fc697243ab534ebaf51d2fa80f251cb4"
        ];
    }
    
    private function decodeContent($base64Response) {
        // 1. Base64 Decode
        $bin = base64_decode($base64Response);
        if (!$bin) return '';
        
        // 2. Extract IV (First 16 bytes)
        // JS logic: txt = Base64.parse(resp).toString() (Hex string)
        // iv = txt.slice(0, 32) (16 bytes hex)
        // content = txt.slice(32)
        // So raw binary: first 16 bytes are IV.
        
        $iv = substr($bin, 0, 16);
        $data = substr($bin, 16);
        
        $key = hex2bin(self::AES_KEY_HEX);
        
        // 3. AES Decrypt
        $decrypted = openssl_decrypt($data, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return trim($decrypted);
    }
}

// 运行爬虫
(new Spider())->run();
