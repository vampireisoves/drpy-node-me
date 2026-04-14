<?php
/**
 * 裤佬.php - 影视+专属全网聚合
 * 完全独立版本，不依赖外部文件
 */

error_reporting(0);
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}

// ==================== HtmlParser 类 ====================
class HtmlParser {
    
    /**
     * Parse HTML and return array of OuterHTML strings
     */
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

    /**
     * Parse HTML and return single value (Text, Html, or Attribute)
     */
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
    
    /**
     * Parse HTML and return URL (auto joined)
     */
    public function pd($html, $rule, $baseUrl = '') {
        $res = $this->pdfh($html, $rule, $baseUrl);
        return $this->urlJoin($baseUrl, $res);
    }

    // --- Helper Methods ---

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

// ==================== BaseSpider 抽象类 ====================
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
    public function homeContent($filter) { return ['class' => []]; }
    public function homeVideoContent() { return ['list' => []]; }
    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        return ['list' => [], 'page' => $pg, 'pagecount' => 1, 'limit' => 20, 'total' => 0];
    }
    public function detailContent($ids) { return ['list' => []]; }
    public function searchContent($key, $quick = false, $pg = 1) { return ['list' => []]; }
    public function playerContent($flag, $id, $vipFlags = []) { return ['parse' => 0, 'url' => '', 'header' => []]; }
    public function localProxy($params) { return null; }
    public function action($action, $value) { return ''; }

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
                if (!empty($val)) return $val;
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
        if (is_resource($ch)) curl_close($ch);
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
            if (is_array($decoded)) $extend = $decoded;
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
            $result = ['class' => $homeData['class'] ?? []];
            if (isset($videoData['list'])) $result['list'] = $videoData['list'];
            if (isset($homeData['list']) && !empty($homeData['list'])) $result['list'] = $homeData['list'];
            if (isset($homeData['filters'])) $result['filters'] = $homeData['filters'];

            echo json_encode($result, JSON_UNESCAPED_UNICODE);

        } catch (Exception $e) {
            echo json_encode(['code' => 500, 'msg' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        } catch (Throwable $e) {
            echo json_encode(['code' => 500, 'msg' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    }
}

// ==================== Spider 类 ====================
class Spider extends BaseSpider {
    private const SOURCES = [
       's1' => ['name' => '🔞滴滴', 'api' => 'https://api.ddapi.cc/api.php/provide/vod'],
's2' => ['name' => '🔞鸡坤', 'api' => 'https://jkunzyapi.com/api.php/provide/vod'],
's3' => ['name' => '🔞TG资源', 'api' => 'https://tgzyz.pp.ua/api.php/provide/vod'],
's4' => ['name' => '🔞越南', 'api' => 'https://vnzyz.com/api.php/provide/vod'],
's5' => ['name' => '🔞奥斯卡', 'api' => 'https://aosikazy4.com/api.php/provide/vod'],
's6' => ['name' => '🔞X细胞', 'api' => 'https://www.xxibaozyw.com/api.php/provide/vod'],
's7' => ['name' => '🔞大奶子', 'api' => 'https://apidanaizi.com/api.php/provide/vod'],
's8' => ['name' => '🔞精品X', 'api' => 'https://www.jingpinx.com/api.php/provide/vod'],
's9' => ['name' => '🔞老色p', 'api' => 'https://apilsbzy1.com/api.php/provide/vod'],
's10' => ['name' => '🔞番号', 'api' => 'http://fhapi9.com/api.php/provide/vod'],
's11' => ['name' => '🔞黄色仓库', 'api' => 'https://hsckzy888.com/api.php/provide/vod/from/hsckm3u8/at/json'],
's12' => ['name' => '🔞百花', 'api' => 'https://bhziyuan.com/api.php/provide/vod/'],
's13' => ['name' => '🔞辣椒', 'api' => 'https://apilj.com/api.php/provide/vod'],
's14' => ['name' => '🔞155', 'api' => 'https://155api.com/api.php/provide/vod'],
's15' => ['name' => '🔞杏吧', 'api' => 'https://xingba111.com/api.php/provide/vod/'],
's16' => ['name' => '🔞玉兔', 'api' => 'https://apiyutu.com/api.php/provide/vod'],
's17' => ['name' => '🔞AIvin', 'api' => 'http://lbapiby.com/api.php/provide/vod/at/json'],
's18' => ['name' => '🔞乐播', 'api' => 'https://lbapi9.com/api.php/provide/vod'],
's19' => ['name' => '🔞奶香香', 'api' => 'https://naixxzy.com/api.php/provide/vod'],
's20' => ['name' => '🔞森林', 'api' => 'https://slapibf.com/api.php/provide/vod'],
's21' => ['name' => '🔞番茄', 'api' => 'https://fqzy.me//api.php/provide/vod/'],
's22' => ['name' => '🔞鲨鱼', 'api' => 'https://shayuapi.com/api.php/provide/vod'],
's23' => ['name' => '🔞91麻豆', 'api' => 'http://91md.me/api.php/provide/vod'],
's24' => ['name' => '🔞CK百货', 'api' => 'https://ckbh1.xyz/api.php/provide/vod/'],
's25' => ['name' => '🔞桃花', 'api' => 'https://thzy1.me/api.php/provide/vod/'],
's26' => ['name' => '🔞豆豆', 'api' => 'https://doudouzy.com/api.php/provide/vod/'],
's27' => ['name' => '🔞色猫', 'api' => 'https://api.maozyapi.com/inc/apijson_vod.php'],
's28' => ['name' => '🔞黑料X', 'api' => 'https://www.heiliaozyapi.com/api.php/provide/vod/'],
's29' => ['name' => '🔞香蕉', 'api' => 'https://www.xiangjiaozyw.com/api.php/provide/vod/'],
's30' => ['name' => '🔞百万', 'api' => 'https://api.bwzyz.com/api.php/provide/vod/at/json'],
's31' => ['name' => '🔞souav', 'api' => 'https://api.souavzy.vip/api.php/provide/vod'],
's32' => ['name' => '🔞淫水机', 'api' => 'https://www.xrbsp.com/api/json.php'],
's33' => ['name' => '🔞白嫖', 'api' => 'https://www.kxgav.com/api/json.php'],
's34' => ['name' => '🔞美少女', 'api' => 'https://www.msnii.com/api/json.php'],
's35' => ['name' => '🔞色南国', 'api' => 'https://api.sexnguon.com/api.php/provide/vod'],
's36' => ['name' => '🔞香奶儿', 'api' => 'https://www.gdlsp.com/api/json.php'],
's37' => ['name' => '🔞黄AV', 'api' => 'https://www.pgxdy.com/api/json.php'],
's38' => ['name' => '🇹极速', 'api' => 'https://jszyapi.com/api.php/provide/vod'],
's39' => ['name' => '📺红牛3', 'api' => 'https://www.hongniuzy3.com/api.php/provide/vod'],
's40' => ['name' => '🌊海洋', 'api' => 'http://www.seacms.org/api.php/provide/vod']
    ];

    public function getName() { return "影视+专属全网聚合"; }
    public function init($extend = "") {}

    private function buildUrl($url, $query) {
        return strpos($url, '?') !== false ? $url . '&' . $query : $url . '?' . $query;
    }

    private function setCurlOpts($ch, $url, $timeout = 10) {
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_ENCODING, '');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    }

    private function cleanItem($item, $sourceKey, $sourceName, $isDetail = false) {
        if (!$isDetail) {
            $item['vod_id'] = $sourceKey . '@@' . $item['vod_id'];
        }
        $item['vod_remarks'] = $sourceName . " | " . ($item['vod_remarks'] ?? '');

        if (!empty($item['vod_play_from'])) {
            $froms = explode('$$$', $item['vod_play_from']);
            foreach ($froms as &$f) {
                $f = $sourceName . '-' . $f; 
            }
            $item['vod_play_from'] = implode('$$$', $froms);
        }

        unset($item['vod_down_from']);
        unset($item['vod_down_url']);
        return $item;
    }

    public function homeContent($filter = []) {
        $classes = [];
        $filters = [];
        $mh = curl_multi_init();
        $ch_list = [];
        
        foreach (self::SOURCES as $key => $source) {
            $classes[] = ['type_id' => $key, 'type_name' => $source['name']];
            $ch = curl_init();
            $this->setCurlOpts($ch, $this->buildUrl($source['api'], "ac=list"), 4);
            curl_multi_add_handle($mh, $ch);
            $ch_list[$key] = $ch;
        }

        $active = null;
        do { $mrc = curl_multi_exec($mh, $active); } while ($mrc == CURLM_CALL_MULTI_PERFORM);
        while ($active && $mrc == CURLM_OK) {
            if (curl_multi_select($mh) != -1) {
                do { $mrc = curl_multi_exec($mh, $active); } while ($mrc == CURLM_CALL_MULTI_PERFORM);
            }
        }

        foreach ($ch_list as $key => $ch) {
            $response = curl_multi_getcontent($ch);
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
            
            $res = json_decode($response, true);
            $filterValues = [['n' => '全部(最新)', 'v' => '']];
            
            if (isset($res['class'])) {
                foreach ($res['class'] as $c) {
                    $filterValues[] = ['n' => $c['type_name'], 'v' => $c['type_id']];
                }
            }
            $filters[$key] = [['key' => 'cateId', 'name' => '分类', 'value' => $filterValues]];
        }
        curl_multi_close($mh);
        return ['class' => $classes, 'filters' => $filters, 'list' => []];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        if (!isset(self::SOURCES[$tid])) return ['list' => []];
        $source = self::SOURCES[$tid];
        if (!is_array($extend)) $extend = [];
        $realTid = isset($extend['cateId']) ? $extend['cateId'] : '';
        
        $query = "ac=detail&pg={$pg}";
        if ($realTid !== '') $query .= "&t={$realTid}";
        
        $ch = curl_init();
        $this->setCurlOpts($ch, $this->buildUrl($source['api'], $query), 10);
        $html = curl_exec($ch);
        curl_close($ch);
        
        $res = json_decode($html, true);
        $list = [];
        if (isset($res['list'])) {
            foreach ($res['list'] as $item) {
                $list[] = $this->cleanItem($item, $tid, $source['name'], false);
            }
        }
        return ['list' => $list, 'page' => $res['page'] ?? $pg, 'pagecount' => $res['pagecount'] ?? 0, 'limit' => $res['limit'] ?? 20, 'total' => $res['total'] ?? 0];
    }

    public function detailContent($ids) {
        $id = is_array($ids) ? $ids[0] : $ids;
        if (strpos($id, '@@') === false) return ['list' => []];
        
        list($sourceKey, $realId) = explode('@@', $id);
        if (!isset(self::SOURCES[$sourceKey])) return ['list' => []];

        $source = self::SOURCES[$sourceKey];
        $ch = curl_init();
        $this->setCurlOpts($ch, $this->buildUrl($source['api'], "ac=detail&ids={$realId}"), 10);
        $html = curl_exec($ch);
        curl_close($ch);

        $res = json_decode($html, true);
        $list = [];
        if (isset($res['list'])) {
            foreach ($res['list'] as $item) {
                $cleaned = $this->cleanItem($item, $sourceKey, $source['name'], true);
                $cleaned['vod_id'] = $id;
                $list[] = $cleaned;
            }
        }
        return ['list' => $list];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $keyword = urlencode($key);
        $list = [];
        $maxPageCount = 0;
        
        $mh = curl_multi_init();
        $ch_list = [];
        foreach (self::SOURCES as $sourceKey => $source) {
            $ch = curl_init();
            $this->setCurlOpts($ch, $this->buildUrl($source['api'], "ac=detail&wd={$keyword}&pg={$pg}"), 6);
            curl_multi_add_handle($mh, $ch);
            $ch_list[$sourceKey] = $ch;
        }

        $active = null;
        do { $mrc = curl_multi_exec($mh, $active); } while ($mrc == CURLM_CALL_MULTI_PERFORM);
        while ($active && $mrc == CURLM_OK) {
            if (curl_multi_select($mh) != -1) {
                do { $mrc = curl_multi_exec($mh, $active); } while ($mrc == CURLM_CALL_MULTI_PERFORM);
            }
        }

        foreach ($ch_list as $sourceKey => $ch) {
            $response = curl_multi_getcontent($ch);
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
            
            $source = self::SOURCES[$sourceKey];
            $res = json_decode($response, true);
            if (isset($res['list'])) {
                foreach ($res['list'] as $item) {
                    $list[] = $this->cleanItem($item, $sourceKey, $source['name'], false);
                }
                if (isset($res['pagecount']) && $res['pagecount'] > $maxPageCount) {
                    $maxPageCount = $res['pagecount'];
                }
            }
        }
        curl_multi_close($mh);
        return ['list' => $list, 'page' => $pg, 'pagecount' => $maxPageCount ?: $pg, 'limit' => 40, 'total' => 9999];
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        return [
            "parse" => 0, 
            "url" => $id,
            "header" => [
                "User-Agent" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            ]
        ];
    }
}

// 运行
(new Spider())->run();