<?php
/**
 * HtmlParser - 解析 HTML 的工具类
 */
class HtmlParser {
    
    public function pdfa($html, $rule) {
        if (empty($html) || empty($rule)) return [];
        $doc = $this->getDom($html);
        $xpath = new DOMXPath($doc);
        
        $xpathQuery = $this->parseRuleToXpath($rule);
        $nodes = $xpath->query($xpathQuery);
        
        $res = [];
        if ($nodes) {
            foreach ($nodes as $node) {
                $res[] = $doc->saveHTML($node);
            }
        }
        return $res;
    }

    public function pdfh($html, $rule, $baseUrl = '') {
        if (empty($html) || empty($rule)) return '';
        $doc = $this->getDom($html);
        $xpath = new DOMXPath($doc);

        $option = '';
        if (strpos($rule, '&&') !== false) {
            $parts = explode('&&', $rule);
            $option = array_pop($parts);
            $rule = implode('&&', $parts);
        }

        $xpathQuery = $this->parseRuleToXpath($rule);
        $nodes = $xpath->query($xpathQuery);
        
        if ($nodes && $nodes->length > 0) {
            if ($option === 'Text') {
                $text = '';
                foreach ($nodes as $node) {
                    $text .= $node->textContent;
                }
                return $this->parseText($text);
            }
            
            $node = $nodes->item(0);
            return $this->formatOutput($doc, $node, $option, $baseUrl);
        }
        return '';
    }
    
    public function pd($html, $rule, $baseUrl = '') {
        $res = $this->pdfh($html, $rule, $baseUrl);
        return $this->urlJoin($baseUrl, $res);
    }

    private function parseText($text) {
        $text = preg_replace('/[\s]+/u', "\n", $text);
        $text = preg_replace('/\n+/', "\n", $text);
        $text = trim($text);
        $text = str_replace("\n", ' ', $text);
        return $text;
    }

    private function parseRuleToXpath($rule) {
        $rule = str_replace('&&', ' ', $rule);
        $parts = explode(' ', $rule);
        $xpathParts = [];
        
        foreach ($parts as $part) {
            if (empty($part)) continue;
            $xpathParts[] = $this->transSingleSelector($part);
        }
        
        return '//' . implode('//', $xpathParts);
    }

    private function transSingleSelector($selector) {
        $position = null;
        if (preg_match('/:eq\((-?\d+)\)/', $selector, $matches)) {
            $idx = intval($matches[1]);
            $selector = str_replace($matches[0], '', $selector);
            if ($idx >= 0) {
                $position = $idx + 1;
            } else {
                $offset = abs($idx) - 1;
                $position = "last()" . ($offset > 0 ? "-$offset" : ""); 
            }
        }
        
        $tag = '*';
        $conditions = [];
        
        if (preg_match('/#([\w-]+)/', $selector, $m)) {
            $conditions[] = '@id="' . $m[1] . '"';
            $selector = str_replace($m[0], '', $selector);
        }
        
        if (preg_match_all('/\.([\w-]+)/', $selector, $m)) {
            foreach ($m[1] as $cls) {
                $conditions[] = 'contains(concat(" ", normalize-space(@class), " "), " ' . $cls . ' ")';
            }
            $selector = preg_replace('/\.[\w-]+/', '', $selector);
        }
        
        if (!empty($selector)) {
            $tag = $selector;
        }
        
        $xpath = $tag;
        if (!empty($conditions)) {
            $xpath .= '[' . implode(' and ', $conditions) . ']';
        }
        if ($position !== null) {
            $xpath .= '[' . $position . ']';
        }
        
        return $xpath;
    }

    private function formatOutput($doc, $node, $option, $baseUrl) {
        if ($option === 'Text') {
            return $this->parseText($node->textContent);
        } elseif ($option === 'Html') {
            return $doc->saveHTML($node);
        } elseif ($option) {
            return $node->getAttribute($option);
        }
        return $doc->saveHTML($node);
    }

    private function getDom($html) {
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        if (!empty($html) && mb_detect_encoding($html, 'UTF-8', true) === false) {
             $html = mb_convert_encoding($html, 'UTF-8', 'GBK, BIG5'); 
        }
        $html = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' . $html;
        
        $doc->loadHTML($html);
        libxml_clear_errors();
        return $doc;
    }

    private function urlJoin($baseUrl, $relativeUrl) {
        if (empty($relativeUrl)) return '';
        if (preg_match('#^https?://#', $relativeUrl)) return $relativeUrl;
        
        if (empty($baseUrl)) return $relativeUrl;

        $parts = parse_url($baseUrl);
        $scheme = isset($parts['scheme']) ? $parts['scheme'] . '://' : 'http://';
        $host = isset($parts['host']) ? $parts['host'] : '';
        
        if (substr($relativeUrl, 0, 1) == '/') {
            return $scheme . $host . $relativeUrl;
        }
        
        $path = isset($parts['path']) ? $parts['path'] : '/';
        $dir = rtrim(dirname($path), '/\\');
        if ($dir === '/' || $dir === '\\') $dir = '';
        
        return $scheme . $host . $dir . '/' . $relativeUrl;
    }
}

/**
 * BaseSpider - 爬虫基类
 */
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}
error_reporting(E_ALL);
ini_set('display_errors', '1');

abstract class BaseSpider {
    
    protected $headers = [
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language' => 'zh-CN,zh;q=0.9',
    ];

    protected $htmlParser;

    public function __construct() {
        $this->htmlParser = new HtmlParser();
    }

    public function init($extend = '') {}

    public function homeContent($filter) {
        return ['class' => []];
    }

    public function homeVideoContent() {
        return ['list' => []];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        return ['list' => [], 'page' => $pg, 'pagecount' => 1, 'limit' => 20, 'total' => 0];
    }

    public function detailContent($ids) {
        return ['list' => []];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        return ['list' => []];
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        return ['parse' => 0, 'url' => '', 'header' => []];
    }

    public function localProxy($params) {
        return null;
    }

    public function action($action, $value) {
        return '';
    }

    protected function pdfa($html, $rule) {
        return $this->htmlParser->pdfa($html, $rule);
    }
    
    protected function pdfh($html, $rule, $baseUrl = '') {
        return $this->htmlParser->pdfh($html, $rule, $baseUrl);
    }
    
    protected function pd($html, $rule, $baseUrl = '') {
        if (empty($baseUrl)) {
            $baseUrl = $this->tryGetHost();
        }
        return $this->htmlParser->pd($html, $rule, $baseUrl);
    }

    private function tryGetHost() {
        try {
            $ref = new ReflectionClass($this);
            if ($ref->hasProperty('HOST')) {
                $prop = $ref->getProperty('HOST');
                if (PHP_VERSION_ID < 80100) {
                    $prop->setAccessible(true);
                }
                $val = $prop->getValue($this);
                if (!empty($val)) {
                    return $val;
                }
            }
            if ($ref->hasConstant('HOST')) {
                return $ref->getConstant('HOST');
            }
        } catch (Exception $e) {}
        return '';
    }

    protected function pageResult($list, $pg, $total = 0, $limit = 20) {
        $pg = max(1, intval($pg));
        $count = count($list);
        
        if ($total > 0) {
            $pagecount = ceil($total / $limit);
        } else {
            if ($count < $limit) {
                $pagecount = $pg;
                $total = ($pg - 1) * $limit + $count;
            } else {
                $pagecount = 9999;
                $total = 99999;
            }
        }
        
        return [
            'list' => $list,
            'page' => $pg,
            'pagecount' => intval($pagecount),
            'limit' => intval($limit),
            'total' => intval($total)
        ];
    }

    protected function fetch($url, $options = [], $headers = []) {
        if (isset($options['headers'])) {
            $headers = array_merge($headers, $options['headers']);
            unset($options['headers']);
        }

        $ch = curl_init();
        
        $customHeaders = [];
        foreach ($headers as $k => $v) {
            if (is_numeric($k)) {
                $parts = explode(':', $v, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    $value = trim($parts[1]);
                    $customHeaders[$key] = $value;
                }
            } else {
                $customHeaders[$k] = $v;
            }
        }

        $finalHeadersMap = array_merge($this->headers, $customHeaders);
        $mergedHeaders = [];
        foreach ($finalHeadersMap as $k => $v) {
            if ($v === "") {
                $mergedHeaders[] = $k . ";";
            } else {
                $mergedHeaders[] = "$k: $v";
            }
        }

        $defaultOptions = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_ENCODING => '',
            CURLOPT_HTTPHEADER => $mergedHeaders,
        ];

        if (isset($options['body'])) {
            $defaultOptions[CURLOPT_POST] = true;
            $defaultOptions[CURLOPT_POSTFIELDS] = $options['body'];
            unset($options['body']);
        }
        
        if (isset($options['cookie'])) {
            $defaultOptions[CURLOPT_COOKIE] = $options['cookie'];
            unset($options['cookie']);
        }

        foreach ($options as $k => $v) {
            $defaultOptions[$k] = $v;
        }

        curl_setopt_array($ch, $defaultOptions);
        $result = curl_exec($ch);
        
        if (is_resource($ch)) {
            curl_close($ch);
        }
        
        return $result;
    }

    protected function fetchJson($url, $options = []) {
        $resp = $this->fetch($url, $options);
        return json_decode($resp, true) ?: [];
    }

    public function run() {
        $ac = $_GET['ac'] ?? '';
        $t = $_GET['t'] ?? '';
        $pg = $_GET['pg'] ?? '1';
        $wd = $_GET['wd'] ?? '';
        $ids = $_GET['ids'] ?? '';
        $play = $_GET['play'] ?? '';
        $flag = $_GET['flag'] ?? '';
        $filter = isset($_GET['filter']) && $_GET['filter'] === 'true';
        $extend = $_GET['ext'] ?? '';
        if (!empty($extend) && is_string($extend)) {
            $decoded = json_decode(base64_decode($extend), true);
            if (is_array($decoded)) {
                $extend = $decoded;
            }
        }
        $action = $_GET['action'] ?? '';
        $value = $_GET['value'] ?? '';

        $this->init($extend);

        try {
            if ($ac === 'action') {
                echo json_encode($this->action($action, $value), JSON_UNESCAPED_UNICODE);
                return;
            }

            if ($ac === 'play' || !empty($play)) {
                $playId = !empty($play) ? $play : ($_GET['id'] ?? '');
                echo json_encode($this->playerContent($flag, $playId), JSON_UNESCAPED_UNICODE);
                return;
            }

            if (!empty($wd)) {
                echo json_encode($this->searchContent($wd, false, $pg), JSON_UNESCAPED_UNICODE);
                return;
            }

            if (!empty($ids) && !empty($ac)) {
                $idList = explode(',', $ids);
                echo json_encode($this->detailContent($idList), JSON_UNESCAPED_UNICODE);
                return;
            }

            if ($t !== '' && !empty($ac)) {
                $filterData = [];
                echo json_encode($this->categoryContent($t, $pg, $filterData, $extend), JSON_UNESCAPED_UNICODE);
                return;
            }

            $homeData = $this->homeContent($filter);
            $videoData = $this->homeVideoContent();
            
            $result = [
                'class' => $homeData['class'] ?? [],
            ];
            
            if (isset($videoData['list'])) {
                $result['list'] = $videoData['list'];
            }
            if (isset($homeData['list']) && !empty($homeData['list'])) {
                $result['list'] = $homeData['list'];
            }
            if (isset($homeData['filters'])) {
                $result['filters'] = $homeData['filters'];
            }

            echo json_encode($result, JSON_UNESCAPED_UNICODE);

        } catch (Exception $e) {
            echo json_encode(['code' => 500, 'msg' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        } catch (Throwable $e) {
            echo json_encode(['code' => 500, 'msg' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    }
}

/**
 * 星星短剧 Spider
 */
class Spider extends BaseSpider {
    private $HOST = 'http://read.api.duodutek.com';
    private $UA = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36';
    
    private $COMMON_PARAMS = [
        "productId" => "2a8c14d1-72e7-498b-af23-381028eb47c0",
        "vestId" => "2be070e0-c824-4d0e-a67a-8f688890cadb",
        "channel" => "oppo19",
        "osType" => "android",
        "version" => "20",
        "token" => "202509271001001446030204698626"
    ];

    protected function getHeaders() {
        return [
            'User-Agent: ' . $this->UA
        ];
    }

    public function homeContent($filter) {
        $classes = [
            ["type_id" => "1287", "type_name" => "甜宠"],
            ["type_id" => "1288", "type_name" => "逆袭"],
            ["type_id" => "1289", "type_name" => "热血"],
            ["type_id" => "1290", "type_name" => "现代"],
            ["type_id" => "1291", "type_name" => "古代"]
        ];

        $list = $this->categoryContent('1287', 1)['list'];
        $list = array_slice($list, 0, 12);

        return [
            'class' => $classes,
            'list' => $list,
            'filters' => (object)[]
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $apiUrl = $this->HOST . '/novel-api/app/pageModel/getResourceById';
        
        $params = array_merge($this->COMMON_PARAMS, [
            "resourceId" => $tid,
            "pageNum" => (string)$pg,
            "pageSize" => "10"
        ]);

        $url = $apiUrl . '?' . http_build_query($params);
        $jsonStr = $this->fetch($url, [], $this->getHeaders());
        $jsonObj = json_decode($jsonStr, true);
        
        $list = [];
        if ($jsonObj && isset($jsonObj['data']['datalist'])) {
            foreach ($jsonObj['data']['datalist'] as $vod) {
                $list[] = [
                    'vod_id' => $vod['id'] . '@@' . $vod['name'] . '@@' . ($vod['introduction'] ?? ''),
                    'vod_name' => $vod['name'],
                    'vod_pic' => $vod['icon'],
                    'vod_remarks' => $vod['heat'] . '万播放'
                ];
            }
        }

        return $this->pageResult($list, $pg, 999, 10);
    }

    public function detailContent($ids) {
        $did = is_array($ids) ? $ids[0] : $ids;
        $parts = explode('@@', $did);
        if (count($parts) >= 2) {
            $bookId = $parts[0];
            $bookName = $parts[1];
            $intro = $parts[2] ?? '';
        } else {
            $parts = explode('@', $did);
            $bookId = $parts[0];
            $bookName = '';
            $intro = $parts[1] ?? '';
        }

        $apiUrl = $this->HOST . '/novel-api/basedata/book/getChapterList';
        $params = array_merge($this->COMMON_PARAMS, [
            "bookId" => $bookId
        ]);

        $url = $apiUrl . '?' . http_build_query($params);
        $jsonStr = $this->fetch($url, [], $this->getHeaders());
        $jsonObj = json_decode($jsonStr, true);

        $playUrls = [];
        if ($jsonObj && isset($jsonObj['data'])) {
            $chapters = $jsonObj['data'];
            foreach ($chapters as $index => $chapter) {
                if (isset($chapter['shortPlayList'][0]['chapterShortPlayVoList'][0]['shortPlayUrl'])) {
                    $vUrl = $chapter['shortPlayList'][0]['chapterShortPlayVoList'][0]['shortPlayUrl'];
                    $epName = "第" . ($index + 1) . "集";
                    $playUrls[] = $epName . '$' . $vUrl;
                }
            }
        }

        $vod = [
            'vod_id' => $did,
            'vod_name' => $bookName,
            'vod_content' => $intro,
            'vod_play_from' => '短剧专线',
            'vod_play_url' => implode('#', $playUrls)
        ];

        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        return $this->pageResult([], $pg);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        return [
            'parse' => 0,
            'url' => $id,
            'header' => [
                'User-Agent' => $this->UA
            ]
        ];
    }
}

(new Spider())->run();