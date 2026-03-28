<?php
ini_set('memory_limit', '-1');
/**
 * 本地浏览 + 列表文件虚拟目录 + 本地看图增强版
 * - m3u/txt/json/db 在分类页显示为“目录”
 * - 进入后展示链接项，点击链接项才播放
 * - 支持本地图片单张查看
 * - 支持“本目录看图”（pics:// 多图聚合）
 * - 支持数据库文件(db)
 * - vdir/vitem/ialbum 与播放URL使用 b64u 编码，避免特殊字符壳解析错误
 * - 兼容旧版 base64 的 vdir/vitem/ialbum
 * - 完全独立运行，内置 HtmlParser 和 BaseSpider
 */

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
    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) { return ['list' => [], 'page' => $pg, 'pagecount' => 1, 'limit' => 20, 'total' => 0]; }
    public function detailContent($ids) { return ['list' => []]; }
    public function searchContent($key, $quick = false, $pg = 1) { return ['list' => []]; }
    public function playerContent($flag, $id, $vipFlags = []) { return ['parse' => 0, 'url' => '', 'header' => []]; }
    public function localProxy($params) { return null; }
    public function action($action, $value) { return ''; }

    protected function pdfa($html, $rule) { return $this->htmlParser->pdfa($html, $rule); }
    protected function pdfh($html, $rule, $baseUrl = '') { return $this->htmlParser->pdfh($html, $rule, $baseUrl); }
    
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
                if (PHP_VERSION_ID < 80100) $prop->setAccessible(true);
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

// ==================== YouTube解析器类 ====================
class YouTubeParser {
    
    public function getPlaylistVideos($playlistId) {
        $videos = [];
        $videos = $this->getPlaylistVideosViaWeb($playlistId);
        if (empty($videos)) {
            $videos = $this->getPlaylistVideosViaService($playlistId);
        }
        return $videos;
    }
    
    private function getPlaylistVideosViaWeb($playlistId) {
        $videos = [];
        $url = "https://www.youtube.com/playlist?list=" . $playlistId;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $html = curl_exec($ch);
        curl_close($ch);
        
        if ($html) {
            if (preg_match('/var ytInitialData = ({.+?});/', $html, $matches)) {
                $data = json_decode($matches[1], true);
                if ($data) {
                    $videos = $this->extractVideosFromData($data);
                }
            }
            
            if (empty($videos)) {
                preg_match_all('/watch\?v=([a-zA-Z0-9_-]{11})/', $html, $matches);
                $videoIds = array_unique($matches[1]);
                foreach ($videoIds as $index => $videoId) {
                    $videos[] = [
                        'id' => $videoId,
                        'title' => '视频 ' . ($index + 1),
                        'url' => 'https://www.youtube.com/watch?v=' . $videoId
                    ];
                }
            }
        }
        
        return $videos;
    }
    
    private function extractVideosFromData($data) {
        $videos = [];
        
        try {
            if (isset($data['contents']['twoColumnBrowseResultsRenderer']['tabs'][0]['tabRenderer']['content']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][0]['playlistVideoListRenderer']['contents'])) {
                $items = $data['contents']['twoColumnBrowseResultsRenderer']['tabs'][0]['tabRenderer']['content']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][0]['playlistVideoListRenderer']['contents'];
                
                foreach ($items as $item) {
                    if (isset($item['playlistVideoRenderer'])) {
                        $video = $item['playlistVideoRenderer'];
                        $videoId = $video['videoId'] ?? '';
                        $title = $video['title']['runs'][0]['text'] ?? '未知标题';
                        
                        $videos[] = [
                            'id' => $videoId,
                            'title' => $title,
                            'url' => 'https://www.youtube.com/watch?v=' . $videoId
                        ];
                    }
                }
            }
        } catch (Exception $e) {}
        
        return $videos;
    }
    
    private function getPlaylistVideosViaService($playlistId) {
        $videos = [];
        
        $services = [
            "https://invidio.us/api/v1/playlists/" . $playlistId,
            "https://yewtu.be/api/v1/playlists/" . $playlistId,
            "https://inv.riverside.rocks/api/v1/playlists/" . $playlistId
        ];
        
        foreach ($services as $url) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $response = curl_exec($ch);
            curl_close($ch);
            
            if ($response) {
                $data = json_decode($response, true);
                if ($data && isset($data['videos'])) {
                    foreach ($data['videos'] as $video) {
                        $videos[] = [
                            'id' => $video['videoId'] ?? '',
                            'title' => $video['title'] ?? '未知标题',
                            'url' => 'https://www.youtube.com/watch?v=' . ($video['videoId'] ?? '')
                        ];
                    }
                    break;
                }
            }
        }
        
        return $videos;
    }
    
    public function encodeVideoList($videos, $playlistTitle) {
        $items = [];
        foreach ($videos as $index => $video) {
            $items[] = [
                'name' => ($index + 1) . '. ' . $video['title'],
                'url' => $video['url']
            ];
        }
        
        $payload = json_encode([
            'title' => $playlistTitle,
            'videos' => $items
        ], JSON_UNESCAPED_UNICODE);
        
        return 'b64u://' . $this->b64uEncode($payload);
    }
    
    private function b64uEncode($str) {
        return rtrim(strtr(base64_encode($str), '+/', '-_'), '=');
    }
}

// ==================== 数据库读取类（根据截图字段名准确优化）====================
class DatabaseReader {
    
    private $dbCache = [];
    
    public function readSQLite($dbPath, $limit = 1000) {
        $cacheKey = $dbPath . '_' . $limit;
        if (isset($this->dbCache[$cacheKey])) return $this->dbCache[$cacheKey];
        
        $result = [];
        
        if (!file_exists($dbPath) || !is_readable($dbPath)) return $result;
        
        try {
            $pdo = new PDO('sqlite:' . $dbPath);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%'")->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($tables as $table) {
                if (in_array($table, ['android_metadata', 'db_config', 'meta', 'crawl_state', 'sqlite_sequence'])) {
                    continue;
                }
                
                $items = $this->parseTable($pdo, $table, $limit);
                $result = array_merge($result, $items);
                
                if (count($result) >= $limit) {
                    $result = array_slice($result, 0, $limit);
                    break;
                }
            }
            
        } catch (Exception $e) {}
        
        $this->dbCache[$cacheKey] = $result;
        return $result;
    }
    
    private function parseTable($pdo, $table, $limit) {
        $result = [];
        
        try {
            $stmt = $pdo->query("PRAGMA table_info(`{$table}`)");
            $columns = $stmt->fetchAll();
            $columnNames = array_column($columns, 'name');
            
            // 根据截图中的实际字段名精确定义
            // 从截图看到字段有: id, name, image, remarks, content, play_url, year, area, vod_name, vod_pic, type_name, vod_actor, vod_director, vod_content, vod_play_from, vod_play_url, vodremarks, vod_year, vod_area
            
            // 识别标题字段 - 截图显示有 name 和 vod_name
            $titleField = null;
            foreach (['name', 'vod_name'] as $field) {
                if (in_array($field, $columnNames)) {
                    $titleField = $field;
                    break;
                }
            }
            
            // 识别URL字段 - 截图显示有 play_url 和 vod_play_url
            $urlField = null;
            foreach (['play_url', 'vod_play_url'] as $field) {
                if (in_array($field, $columnNames)) {
                    $urlField = $field;
                    break;
                }
            }
            
            // 识别图片字段 - 截图显示有 image 和 vod_pic
            $picField = null;
            foreach (['image', 'vod_pic'] as $field) {
                if (in_array($field, $columnNames)) {
                    $picField = $field;
                    break;
                }
            }
            
            // 识别备注字段 - 截图显示有 remarks 和 vodremarks
            $remarksField = null;
            foreach (['remarks', 'vodremarks'] as $field) {
                if (in_array($field, $columnNames)) {
                    $remarksField = $field;
                    break;
                }
            }
            
            // 识别来源字段 - 截图显示有 vod_play_from
            $fromField = in_array('vod_play_from', $columnNames) ? 'vod_play_from' : null;
            
            // 识别年份字段 - 截图显示有 year 和 vod_year
            $yearField = null;
            foreach (['year', 'vod_year'] as $field) {
                if (in_array($field, $columnNames)) {
                    $yearField = $field;
                    break;
                }
            }
            
            // 识别地区字段 - 截图显示有 area 和 vod_area
            $areaField = null;
            foreach (['area', 'vod_area'] as $field) {
                if (in_array($field, $columnNames)) {
                    $areaField = $field;
                    break;
                }
            }
            
            // 识别演员字段 - 截图显示有 actor 和 vod_actor
            $actorField = null;
            foreach (['actor', 'vod_actor'] as $field) {
                if (in_array($field, $columnNames)) {
                    $actorField = $field;
                    break;
                }
            }
            
            // 识别导演字段 - 截图显示有 director 和 vod_director
            $directorField = null;
            foreach (['director', 'vod_director'] as $field) {
                if (in_array($field, $columnNames)) {
                    $directorField = $field;
                    break;
                }
            }
            
            // 识别内容字段 - 截图显示有 content 和 vod_content
            $contentField = null;
            foreach (['content', 'vod_content'] as $field) {
                if (in_array($field, $columnNames)) {
                    $contentField = $field;
                    break;
                }
            }
            
            // 必须有标题和URL字段才能提取数据
            if (!$titleField || !$urlField) {
                return $result;
            }
            
            $query = "SELECT * FROM `{$table}` WHERE `{$urlField}` IS NOT NULL AND `{$urlField}` != '' LIMIT {$limit}";
            $rows = $pdo->query($query)->fetchAll();
            
            foreach ($rows as $row) {
                $playUrlRaw = trim($row[$urlField] ?? '');
                if ($playUrlRaw === '') continue;
                
                $title = trim($row[$titleField] ?? '');
                if ($title === '') {
                    // 如果标题为空，尝试从内容字段提取
                    if ($contentField && !empty($row[$contentField])) {
                        $title = mb_substr(trim($row[$contentField]), 0, 30);
                    } else {
                        $title = '未命名';
                    }
                }
                
                // 检查是否有多集格式
                $isMultiEpisode = (strpos($playUrlRaw, '$') !== false || 
                                   strpos($playUrlRaw, '#') !== false || 
                                   strpos($playUrlRaw, '$$$') !== false);
                
                // 构建基本信息
                $item = [
                    'name' => $title,
                    'url' => $isMultiEpisode ? '' : $playUrlRaw,
                    'play_url' => $isMultiEpisode ? $playUrlRaw : '',
                    'pic' => $picField ? ($row[$picField] ?? '') : '',
                    'remarks' => $remarksField ? ($row[$remarksField] ?? '') : '',
                    'from' => $fromField ? ($row[$fromField] ?? '默认线路') : '默认线路',
                ];
                
                // 添加额外信息
                if ($actorField) $item['actor'] = $row[$actorField] ?? '';
                if ($directorField) $item['director'] = $row[$directorField] ?? '';
                if ($contentField) $item['content'] = $row[$contentField] ?? '';
                if ($yearField) $item['year'] = $row[$yearField] ?? '';
                if ($areaField) $item['area'] = $row[$areaField] ?? '';
                
                $result[] = $item;
            }
            
        } catch (Exception $e) {}
        
        return $result;
    }
    
    public function parseVodPlayUrl($playUrl) {
        $result = [];
        
        if (empty($playUrl)) return $result;
        
        // 处理多线路分隔符
        $lines = explode('$$$', $playUrl);
        
        foreach ($lines as $lineIndex => $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            // 处理多集分隔符
            $episodes = explode('#', $line);
            
            foreach ($episodes as $ep) {
                $ep = trim($ep);
                if (empty($ep)) continue;
                
                // 处理名称和URL分隔符
                $parts = explode('$', $ep, 2);
                if (count($parts) == 2) {
                    $name = trim($parts[0]);
                    $url = trim($parts[1]);
                    
                    if (empty($url)) continue;
                    
                    if (count($lines) > 1) {
                        $lineName = '线路' . ($lineIndex + 1);
                        $result[] = [
                            'name' => $lineName . ' - ' . $name,
                            'url' => $url
                        ];
                    } else {
                        $result[] = [
                            'name' => $name,
                            'url' => $url
                        ];
                    }
                } else {
                    $url = $ep;
                    if (empty($url)) continue;
                    
                    $result[] = [
                        'name' => '播放' . (count($result) + 1),
                        'url' => $url
                    ];
                }
            }
        }
        
        return $result;
    }
    
    public function isPlayableUrl($url) {
        $url = strtolower(trim($url));
        
        if (strpos($url, 'http://') === 0 || 
            strpos($url, 'https://') === 0 || 
            strpos($url, 'rtmp://') === 0 || 
            strpos($url, 'rtsp://') === 0 || 
            strpos($url, 'udp://') === 0 || 
            strpos($url, 'rtp://') === 0 ||
            strpos($url, 'file://') === 0 || 
            strpos($url, 'pics://') === 0) {
            return true;
        }
        
        $videoExts = ['.mp4', '.mkv', '.avi', '.rmvb', '.mov', '.wmv', '.flv', '.m3u8', '.ts', '.mp3', '.m4a', '.aac', '.flac', '.wav'];
        foreach ($videoExts as $ext) {
            if (strpos($url, $ext) !== false) return true;
        }
        
        return false;
    }
    
    public function countVodEpisodes($playUrlRaw) {
        $playUrlRaw = trim((string)$playUrlRaw);
        if ($playUrlRaw === '') return 0;
        
        $groups = array_values(array_filter(array_map('trim', explode('$$$', $playUrlRaw))));
        if (empty($groups)) $groups = [$playUrlRaw];
        
        $total = 0;
        foreach ($groups as $g) {
            $eps = array_values(array_filter(array_map('trim', explode('#', $g))));
            if (empty($eps)) continue;
            $total += count($eps);
        }
        
        return max(1, $total);
    }
}

// ==================== Spider 主类 ====================
class Spider extends BaseSpider
{
    /* 定义管理器的初始目录 */
    private $ROOT = [
        '/storage/emulated/0/Telegram_Mount/',
        '/storage/emulated/0/peekpili/php-scripts/',
        '/storage/emulated/0/Download/Telegram/'
    ];

    private $V_DIR_PREFIX = 'vdir://';
    private $V_ITEM_PREFIX = 'vitem://';
    private $I_ALBUM_PREFIX = 'ialbum://';
    private $URL_B64U_PREFIX = 'b64u://';
    private $YOUTUBE_PLAYLIST_PREFIX = 'ytpl://';

    private $MEDIA_EXTS = ['mp4', 'mkv', 'mp3', 'flv', 'avi', 'rmvb', 'mov', 'wmv', 'm4v', 'ts', 'm3u8', 'm4a', 'aac', 'flac', 'wav'];
    private $IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'ico', 'svg'];
    private $MAGNET_EXTS = []; // 清空磁力扩展名
    private $DB_EXTS = ['db', 'sqlite', 'sqlite3'];

    private $dbReader;
    private $youtubeParser;

    public function init($extend = '')
    {
        if (!empty($extend)) {
            if (is_array($extend)) {
                $this->ROOT = $extend;
            } else {
                $this->ROOT = [rtrim($extend, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR];
            }
        }
        $this->dbReader = new DatabaseReader();
        $this->youtubeParser = new YouTubeParser();
    }

    public function homeContent($filter = [])
    {
        $class = [];
        foreach ($this->ROOT as $index => $root) {
            $name = basename(rtrim($root, DIRECTORY_SEPARATOR));
            $class[] = [
                'type_id' => 'root_' . $index,
                'type_name' => $name
            ];
        }
        return ['class' => $class];
    }

    public function homeVideoContent()
    {
        $list = [];
        foreach ($this->ROOT as $index => $root) {
            $content = $this->categoryContent('root_' . $index, 1);
            if (isset($content['list'])) {
                $list = array_merge($list, array_slice($content['list'], 0, 10));
            }
        }
        return ['list' => $list];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = [])
    {
        // YouTube播放列表目录
        if ($this->isYouTubePlaylist($tid)) {
            return $this->buildYouTubePlaylistCategory($tid, $pg);
        }

        // 虚拟目录（m3u/txt/json/db）
        if ($this->isVirtualDir($tid)) {
            return $this->buildVirtualDirCategory($tid, $pg);
        }

        // 图片聚合目录（本目录看图）
        if ($this->isImageAlbum($tid)) {
            return $this->buildImageAlbumCategory($tid, $pg);
        }

        // 根目录选择
        if (preg_match('/^root_(\d+)$/', $tid, $matches)) {
            $index = intval($matches[1]);
            if (isset($this->ROOT[$index])) {
                $path = $this->ROOT[$index];
            } else {
                return ['list' => []];
            }
        } else {
            $path = $tid;
        }
        $path = rtrim($path, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;

        if (strpos($path, 'back_dir_') === 0) {
            $path = substr($path, 9);
        }

        if (!is_dir($path)) return ['list' => []];
        
        $itemsPerPage = 50;
        $offset = ($pg - 1) * $itemsPerPage;

        $list = [];

        $realPath = realpath($path);
        $rootIndex = $this->getRootIndex($path);
        $realRoot = ($rootIndex !== null) ? realpath($this->ROOT[$rootIndex]) : null;

        // 返回上一级（只在第一页显示）
        if ($pg == 1 && $rootIndex !== null && $realPath !== $realRoot && $realPath !== '/') {
            $parentPath = dirname($realPath);
            $targetId = (strlen($parentPath) < strlen($realRoot)) ? 'root_' . $rootIndex : $parentPath;

            $list[] = [
                'vod_id' => 'back_dir_' . $targetId,
                'type_id' => $targetId,
                'vod_tag' => 'folder',
                'vod_name' => '⬅️ 返回上一级',
                'vod_pic' => $this->getIcon('back', ''),
                'style' => ['type' => 'grid', 'spancount' => 4, 'ratio' => 2, 'titletextsize' => 13],
                'vod_remarks' => '点击回到上层'
            ];
        }

        // 当前目录图片集合（用于“本目录看图”入口）- 只在第一页显示
        if ($pg == 1) {
            $imageFiles = $this->collectImagesInDir($path);
            if (!empty($imageFiles)) {
                $cover = $imageFiles[0];
                $albumId = $this->encodeImageAlbum($realPath ?: $path);
                $list[] = [
                    'vod_id' => $albumId,
                    'type_id' => $albumId,
                    'vod_tag' => 'folder',
                    'vod_name' => '🖼️ 本目录看图',
                    'vod_pic' => $cover,
                    'style' => ['type' => 'list'],
                    'vod_remarks' => count($imageFiles) . ' 张图片'
                ];
            }
        }

        $files = $this->scanDirNatural($path);
        $totalFiles = count($files);
        $files = array_slice($files, $offset, $itemsPerPage);
        
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;

            $fullPath = $path . $file;
            $realFullPath = realpath($fullPath) ?: $fullPath;
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));

            if (is_dir($realFullPath)) {
                $list[] = [
                    'vod_id' => $realFullPath,
                    'type_id' => $realFullPath,
                    'vod_tag' => 'folder',
                    'vod_name' => '📁 ' . $file,
                    'vod_pic' => $this->getIcon('dir', $realFullPath),
                    'style' => ['type' => 'list'],
                    'vod_remarks' => '进入目录'
                ];
            } elseif (in_array($ext, array_merge(['m3u', 'txt', 'json'], $this->DB_EXTS))) {
                // 列表文件 -> 模拟目录
                $vdir = $this->encodeVirtualDir($realFullPath);
                $iconType = $ext;
                $remarks = '进入列表';
                
                if ($ext === 'db' || $ext === 'sqlite' || $ext === 'sqlite3') {
                    $remarks = '数据库文件';
                    $iconType = 'database';
                } elseif ($ext === 'json') {
                    $remarks = 'JSON数据';
                    $iconType = 'json';
                }
                
                $list[] = [
                    'vod_id' => $vdir,
                    'type_id' => $vdir,
                    'vod_tag' => 'folder',
                    'vod_name' => '📂 ' . $file,
                    'vod_pic' => $this->getIcon($iconType, $realFullPath),
                    'style' => ['type' => 'list'],
                    'vod_remarks' => $remarks
                ];
            } elseif (in_array($ext, $this->MEDIA_EXTS)) {
                $list[] = [
                    'vod_id' => $realFullPath,
                    'vod_name' => '📄 ' . $file,
                    'vod_pic' => $this->getIcon($ext, $realFullPath),
                    'style' => ['type' => 'list'],
                    'vod_remarks' => strtoupper($ext)
                ];
            } elseif (in_array($ext, $this->IMAGE_EXTS)) {
                $list[] = [
                    'vod_id' => $realFullPath,
                    'vod_name' => '🖼️ ' . $file,
                    'vod_pic' => 'file://' . $realFullPath,
                    'style' => ['type' => 'list'],
                    'vod_remarks' => strtoupper($ext)
                ];
            }
        }

        return [
            'page' => intval($pg),
            'pagecount' => ceil($totalFiles / $itemsPerPage),
            'limit' => $itemsPerPage,
            'total' => $totalFiles,
            'list' => $list
        ];
    }

    // =========================
    // YouTube播放列表处理
    // =========================
    
    private function isYouTubePlaylist($tid) {
        return strpos($tid, $this->YOUTUBE_PLAYLIST_PREFIX) === 0;
    }
    
    private function buildYouTubePlaylistCategory($tid, $pg = 1) {
        if ($pg > 1) return ['page' => $pg, 'pagecount' => 0, 'list' => []];
        
        $playlistId = $this->decodeYouTubePlaylist($tid);
        if (empty($playlistId)) return ['list' => []];
        
        $list = [];
        
        $list[] = [
            'vod_id' => 'back_dir_' . dirname($tid),
            'type_id' => dirname($tid),
            'vod_tag' => 'folder',
            'vod_name' => '⬅️ 返回上一级',
            'vod_pic' => $this->getIcon('back', ''),
            'style' => ['type' => 'grid', 'cols' => 4, 'ratio' => 1.5],
            'vod_remarks' => '返回'
        ];
        
        $videos = $this->youtubeParser->getPlaylistVideos($playlistId);
        
        if (empty($videos)) {
            $list[] = [
                'vod_id' => $this->encodeVirtualItem('加载播放列表', 'https://www.youtube.com/playlist?list=' . $playlistId),
                'vod_name' => '🎬 点击加载播放列表',
                'vod_pic' => $this->getIcon('youtube', ''),
                'style' => ['type' => 'grid', 'cols' => 4, 'ratio' => 1.5],
                'vod_remarks' => '需要网络连接'
            ];
        } else {
            $encodedList = $this->youtubeParser->encodeVideoList($videos, 'YouTube播放列表');
            
            $list[] = [
                'vod_id' => $encodedList,
                'vod_name' => '🎞️ 播放全部 (' . count($videos) . '个视频)',
                'vod_pic' => $this->getIcon('youtube', ''),
                'style' => ['type' => 'grid', 'ratio' => 1.1],
                'vod_remarks' => '顺序播放'
            ];
            
            foreach ($videos as $index => $video) {
                $safeUrl = $this->URL_B64U_PREFIX . $this->b64uEncode($video['url']);
                
                $list[] = [
                    'vod_id' => $safeUrl,
                    'vod_name' => ($index + 1) . '. ' . $video['title'],
                    'vod_pic' => 'https://img.youtube.com/vi/' . $video['id'] . '/default.jpg',
                    'style' => ['type' => 'grid', 'cols' => 4, 'ratio' => 1.5],
                    'vod_remarks' => 'YouTube'
                ];
            }
        }
        
        return [
            'page' => 1,
            'pagecount' => 0,
            'limit' => count($list),
            'total' => count($list),
            'list' => $list
        ];
    }
    
    private function decodeYouTubePlaylist($tid) {
        $raw = substr($tid, strlen($this->YOUTUBE_PLAYLIST_PREFIX));
        return $this->b64uDecode($raw);
    }

    public function detailContent($ids)
    {
        $id = $ids[0] ?? '';

        // 直接可播放的 b64u 链接
        if (strpos($id, $this->URL_B64U_PREFIX) === 0) {
            $decoded = $this->b64uDecode(substr($id, strlen($this->URL_B64U_PREFIX)));
            $from = $this->detectUrlType($decoded);

            return [
                'list' => [[
                    'vod_id' => $id,
                    'vod_name' => '播放',
                    'vod_play_from' => $from,
                    'vod_play_url' => '立即播放$' . $id
                ]]
            ];
        }

        // YouTube播放列表
        if ($this->isYouTubePlaylist($id)) {
            return $this->categoryContent($id, 1);
        }

        // 虚拟目录
        if ($this->isVirtualDir($id)) {
            return $this->categoryContent($id, 1);
        }

        // 图片聚合目录
        if ($this->isImageAlbum($id)) {
            return $this->buildImageAlbumDetail($id);
        }

        // 虚拟条目
        if ($this->isVirtualItem($id)) {
            $item = $this->decodeVirtualItem($id);
            if (!$item) return ['list' => []];

            $title = trim($item['name'] ?? '未命名');
            $pic = $item['pic'] ?? '';
            $playUrlRaw = trim($item['play_url'] ?? '');
            $url = trim($item['url'] ?? '');

            if ($playUrlRaw !== '') {
                $playData = $this->buildSafeVodPlay(
                    $item['from'] ?? '默认线路',
                    $playUrlRaw,
                    $title
                );

                return [
                    'list' => [[
                        'vod_id' => $id,
                        'vod_name' => $title,
                        'vod_pic' => $pic,
                        'vod_play_from' => $playData['vod_play_from'],
                        'vod_play_url' => $playData['vod_play_url']
                    ]]
                ];
            }

            if ($url !== '') {
                $safeUrl = $this->URL_B64U_PREFIX . $this->b64uEncode($url);
                $from = $this->detectUrlType($url);

                return [
                    'list' => [[
                        'vod_id' => $id,
                        'vod_name' => $title,
                        'vod_pic' => $pic,
                        'vod_play_from' => $from,
                        'vod_play_url' => $title . '$' . $safeUrl
                    ]]
                ];
            }

            return ['list' => []];
        }

        // 返回上一级
        if (strpos($id, 'back_dir_') === 0) {
            $targetPath = substr($id, 9);
            if (preg_match('/^root_(\d+)$/', $targetPath, $matches)) {
                return $this->categoryContent($targetPath, 1);
            }
            return $this->categoryContent($targetPath, 1);
        }

        // 根目录选择
        if (preg_match('/^root_(\d+)$/', $id, $matches)) {
            return $this->categoryContent($id, 1);
        }

        // 本地目录
        if ($this->isLocalPath($id) && is_dir($id)) {
            return $this->categoryContent($id, 1);
        }

        // YouTube视频
        if (strpos($id, 'youtube.com/watch?v=') !== false || strpos($id, 'youtu.be/') !== false) {
            $safeUrl = $this->URL_B64U_PREFIX . $this->b64uEncode($id);
            return [
                'list' => [[
                    'vod_id' => $id,
                    'vod_name' => 'YouTube视频',
                    'vod_play_from' => 'YouTube',
                    'vod_play_url' => '播放$' . $safeUrl
                ]]
            ];
        }

        // 本地媒体/图片文件
        $name = basename($id);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        if (in_array($ext, $this->IMAGE_EXTS)) {
            $picsPayload = 'pics://' . 'file://' . $id;
            $safePayload = $this->URL_B64U_PREFIX . $this->b64uEncode($picsPayload);

            return [
                'list' => [[
                    'vod_id' => $id,
                    'vod_name' => $name,
                    'vod_pic' => 'file://' . $id,
                    'vod_play_from' => '本地看图',
                    'vod_play_url' => '查看图片$' . $safePayload
                ]]
            ];
        }

        // 普通文件
        $from = $this->detectUrlType($id);
        return [
            'list' => [[
                'vod_id' => $id,
                'vod_name' => $name,
                'vod_play_from' => $from,
                'vod_play_url' => '本地播放$file://' . $id
            ]]
        ];
    }

    public function playerContent($flag, $id, $vipFlags = [])
    {
        $u = trim($id);

        if (strpos($u, 'file://' . $this->URL_B64U_PREFIX) === 0) {
            $u = substr($u, 7);
        }

        if (strpos($u, $this->URL_B64U_PREFIX) === 0) {
            $raw = substr($u, strlen($this->URL_B64U_PREFIX));
            $decoded = $this->b64uDecode($raw);
            if ($decoded !== false && $decoded !== null && $decoded !== '') {
                $u = $decoded;
            }
        }

        // YouTube视频
        if (strpos($u, 'youtube.com/watch?v=') !== false || strpos($u, 'youtu.be/') !== false) {
            return [
                'parse' => 0,
                'url' => $u,
                'header' => ['User-Agent' => 'Mozilla/5.0']
            ];
        }

        // YouTube播放列表
        if (strpos($u, 'youtube.com/playlist?list=') !== false) {
            return [
                'parse' => 0,
                'url' => $u,
                'header' => ['User-Agent' => 'Mozilla/5.0']
            ];
        }

        // 本地绝对路径补 file://
        if ($this->isLocalPath($u) && strpos($u, 'file://') !== 0) {
            $u = 'file://' . $u;
        }

        return [
            'parse' => 0,
            'url' => $u,
            'header' => ['User-Agent' => 'Mozilla/5.0']
        ];
    }

    // =========================
    // 工具方法
    // =========================
    
    private function detectUrlType($url) {
        if (strpos($url, 'youtube.com') !== false) return 'YouTube';
        if (strpos($url, 'youtu.be') !== false) return 'YouTube';
        if (strpos($url, 'bilibili.com') !== false) return 'B站';
        if (strpos($url, 'pics://') === 0) return '本地看图';
        if (strpos($url, 'file://') === 0) return '本地文件';
        if (strpos($url, 'http://') === 0 || strpos($url, 'https://') === 0) return '在线视频';
        return '默认线路';
    }

    // =========================
    // 图片聚合目录
    // =========================
    private function buildImageAlbumCategory($tid, $pg = 1)
    {
        if ($pg > 1) return ['page' => $pg, 'pagecount' => 0, 'list' => []];

        $dir = $this->decodeImageAlbum($tid);
        if ($dir === '' || !is_dir($dir)) return ['list' => []];

        $images = $this->collectImagesInDir($dir);
        $list = [];

        $parent = realpath($dir) ?: $dir;
        $list[] = [
            'vod_id' => 'back_dir_' . $parent,
            'type_id' => $parent,
            'vod_tag' => 'folder',
            'vod_name' => '⬅️ 返回文件目录',
            'vod_pic' => $this->getIcon('back', ''),
            'style' => ['type' => 'grid', 'cols' => 4, 'ratio' => 1.5],
            'vod_remarks' => '返回目录'
        ];

        if (!empty($images)) {
            $payload = 'pics://' . implode('&&', $images);
            $safePayload = $this->URL_B64U_PREFIX . $this->b64uEncode($payload);

            $list[] = [
                'vod_id' => $safePayload,
                'vod_name' => '🎞️ 幻灯播放（全部）',
                'vod_pic' => $images[0],
                'style' => ['type' => 'grid', 'ratio' => 1.1],
                'vod_remarks' => count($images) . ' 张'
            ];

            foreach ($images as $img) {
                $basename = basename(parse_url($img, PHP_URL_PATH) ?? $img);
                $singlePayload = 'pics://' . $img;
                $singleSafe = $this->URL_B64U_PREFIX . $this->b64uEncode($singlePayload);

                $list[] = [
                    'vod_id' => $singleSafe,
                    'vod_name' => '🖼️ ' . $basename,
                    'vod_pic' => $img,
                    'style' => ['type' => 'grid', 'cols' => 4, 'ratio' => 1.5],
                    'vod_remarks' => '单图查看'
                ];
            }
        }

        return [
            'page' => 1,
            'pagecount' => 0,
            'limit' => count($list),
            'total' => count($list),
            'list' => $list
        ];
    }

    private function buildImageAlbumDetail($id)
    {
        $dir = $this->decodeImageAlbum($id);
        if ($dir === '' || !is_dir($dir)) return ['list' => []];

        $images = $this->collectImagesInDir($dir);
        if (empty($images)) return ['list' => []];

        $payload = 'pics://' . implode('&&', $images);
        $safePayload = $this->URL_B64U_PREFIX . $this->b64uEncode($payload);

        $title = '本目录看图 - ' . basename(rtrim($dir, DIRECTORY_SEPARATOR));
        $vod = [
            'vod_id' => $id,
            'vod_name' => $title,
            'vod_pic' => $images[0],
            'vod_play_from' => '本地看图',
            'vod_play_url' => '幻灯播放（' . count($images) . '张）$' . $safePayload
        ];

        return ['list' => [$vod]];
    }

    private function encodeImageAlbum($dirPath)
    {
        return $this->I_ALBUM_PREFIX . $this->b64uEncode($dirPath);
    }

    private function decodeImageAlbum($tid)
    {
        $raw = substr($tid, strlen($this->I_ALBUM_PREFIX));

        $path = $this->b64uDecode($raw);
        if ($path === false || $path === null || $path === '') {
            $path = base64_decode($raw, true);
        }

        return $path ?: '';
    }

    private function isImageAlbum($tid)
    {
        return strpos($tid, $this->I_ALBUM_PREFIX) === 0;
    }

    // =========================
    // 虚拟目录构建（增强版）
    // =========================
    private function buildVirtualDirCategory($tid, $pg = 1)
    {
        if ($pg > 1) return ['page' => $pg, 'pagecount' => 0, 'list' => []];

        $listFile = $this->decodeVirtualDir($tid);
        if ($listFile === '' || !is_file($listFile)) return ['list' => []];

        $ext = strtolower(pathinfo($listFile, PATHINFO_EXTENSION));
        $items = [];

        if ($ext === 'm3u') {
            $items = $this->parseM3uToItems($listFile);
        } elseif ($ext === 'txt') {
            $items = $this->parseTxtToItems($listFile);
        } elseif ($ext === 'json') {
            $items = $this->parseJsonToItems($listFile);
        } elseif (in_array($ext, $this->DB_EXTS)) {
            $items = $this->parseDbToItems($listFile);
        }

        $list = [];

        $parent = dirname(realpath($listFile) ?: $listFile);
        $list[] = [
            'vod_id' => 'back_dir_' . $parent,
            'type_id' => $parent,
            'vod_tag' => 'folder',
            'vod_name' => '⬅️ 返回上一级',
            'vod_pic' => $this->getIcon('back', ''),
            'style' => ['type' => 'grid', 'cols' => 4, 'ratio' => 1.5],
            'vod_remarks' => '返回文件目录'
        ];

        foreach ($items as $it) {
            $title = trim($it['name'] ?? '');
            $url = trim($it['url'] ?? '');
            $playUrlRaw = trim($it['play_url'] ?? '');
            $pic = $it['pic'] ?? '';
            $remarks = $it['remarks'] ?? '';
            $from = $it['from'] ?? '';
            
            if ($url === '' && $playUrlRaw === '') continue;

            $iconType = $url !== '' ? $this->getIconTypeFromUrl($url) : 'link';
            
            if ($playUrlRaw !== '') {
                $epCount = $this->dbReader->countVodEpisodes($playUrlRaw);
                $remarksText = $remarks ?: ($epCount > 1 ? ('共' . $epCount . '集') : '剧集');
            } else {
                $remarksText = $remarks ?: ($url !== '' ? $this->getRemarksFromUrl($url) : '链接项');
            }

            $list[] = [
                'vod_id' => $this->encodeVirtualItem(
                    $title !== '' ? $title : '未命名',
                    $url,
                    $pic,
                    [
                        'play_url' => $playUrlRaw,
                        'from' => $from,
                        'remarks' => $remarks
                    ]
                ),
                'vod_name' => '🎬 ' . ($title !== '' ? $title : '未命名'),
                'vod_pic' => $pic ?: $this->getIcon($iconType, ''),
                'style' => ['type' => 'grid', 'cols' => 4, 'ratio' => 1.5],
                'vod_remarks' => $remarksText
            ];
        }

        return [
            'page' => 1,
            'pagecount' => 0,
            'limit' => count($list),
            'total' => count($list),
            'list' => $list
        ];
    }

    private function getIconTypeFromUrl($url) {
        if (strpos($url, 'youtube.com') !== false) return 'youtube';
        if (strpos($url, 'youtu.be') !== false) return 'youtube';
        if (strpos($url, 'bilibili.com') !== false) return 'bilibili';
        if (strpos($url, '.m3u8') !== false) return 'm3u8';
        if (strpos($url, '.mp4') !== false) return 'mp4';
        return 'link';
    }

    private function getRemarksFromUrl($url) {
        if (strpos($url, 'youtube.com') !== false) return 'YouTube';
        if (strpos($url, 'youtu.be') !== false) return 'YouTube';
        if (strpos($url, 'bilibili.com') !== false) return 'B站';
        if (strpos($url, '.m3u8') !== false) return 'M3U8';
        if (strpos($url, '.mp4') !== false) return 'MP4';
        return '链接项';
    }

    // =========================
    // 解析器
    // =========================
    private function parseM3uToItems($path)
    {
        $out = [];
        $fp = @fopen($path, 'r');
        if (!$fp) return $out;

        $currentTitle = '';
        $idx = 1;

        while (($line = fgets($fp)) !== false) {
            $line = trim($line);
            if ($line === '') continue;

            if (stripos($line, '#EXTINF:') === 0) {
                if (preg_match('/,\s*(.+)$/', $line, $m)) {
                    $currentTitle = trim($m[1]);
                } elseif (preg_match('/tvg-name="([^"]+)"/i', $line, $m2)) {
                    $currentTitle = trim($m2[1]);
                } else {
                    $currentTitle = '线路' . $idx;
                }
                continue;
            }

            if ($line[0] === '#') continue;

            $url = $line;
            if ($this->isPlayableUrl($url)) {
                $name = ($currentTitle !== '') ? $currentTitle : ('线路' . $idx);
                $out[] = ['name' => $name, 'url' => $url];
                $currentTitle = '';
                $idx++;
            }
        }

        fclose($fp);
        return $out;
    }

    private function parseTxtToItems($path)
    {
        $out = [];
        $fp = @fopen($path, 'r');
        if (!$fp) return $out;

        $idx = 1;
        while (($line = fgets($fp)) !== false) {
            $line = trim($line);
            if ($line === '') continue;
            if ($line[0] === '#') continue;
            if (strpos($line, '#genre#') !== false) continue;

            $name = '';
            $url = '';

            if (strpos($line, ',') !== false) {
                list($n, $u) = explode(',', $line, 2);
                $name = trim($n);
                $url = trim($u);
            } else {
                $name = '线路' . $idx;
                $url = $line;
            }

            if ($this->isPlayableUrl($url)) {
                $out[] = ['name' => ($name !== '' ? $name : ('线路' . $idx)), 'url' => $url];
                $idx++;
            }
        }

        fclose($fp);
        return $out;
    }

    private function parseJsonToItems($path)
    {
        $out = [];
        $content = @file_get_contents($path);
        if ($content === false || $content === '') return $out;

        $data = json_decode($content, true);
        if (!is_array($data)) return $out;

        $items = (isset($data['list']) && is_array($data['list'])) ? $data['list'] : $data;

        foreach ($items as $item) {
            if (is_array($item)) {
                // 标准VOD格式
                if (isset($item['vod_name']) && isset($item['vod_play_url'])) {
                    $name = trim($item['vod_name'] ?? '未命名');
                    $playUrlRaw = trim($item['vod_play_url'] ?? '');
                    if ($playUrlRaw === '') continue;
                    
                    $out[] = [
                        'name' => $name,
                        'url' => '',
                        'play_url' => $playUrlRaw,
                        'pic' => $item['vod_pic'] ?? '',
                        'remarks' => $item['vod_remarks'] ?? '',
                        'from' => $item['vod_play_from'] ?? '默认线路'
                    ];
                }
                // 简单格式 {name, url}
                elseif (isset($item['name']) && isset($item['url'])) {
                    $out[] = [
                        'name' => $item['name'],
                        'url' => $item['url'],
                        'pic' => $item['pic'] ?? $item['image'] ?? '',
                        'remarks' => $item['remarks'] ?? '',
                        'from' => $item['from'] ?? '默认线路'
                    ];
                }
                // 索引数组 [name, url, pic, remarks]
                elseif (is_array($item) && count($item) >= 2) {
                    $out[] = [
                        'name' => $item[0] ?? '未命名',
                        'url' => $item[1] ?? '',
                        'pic' => $item[2] ?? '',
                        'remarks' => $item[3] ?? '',
                        'from' => '默认线路'
                    ];
                }
            }
        }

        return $out;
    }

    private function parseDbToItems($path)
    {
        return $this->dbReader->readSQLite($path, 500);
    }

    // =========================
    // 编码/解码
    // =========================
    private function b64uEncode($str)
    {
        return rtrim(strtr(base64_encode($str), '+/', '-_'), '=');
    }

    private function b64uDecode($str)
    {
        $str = strtr($str, '-_', '+/');
        $pad = strlen($str) % 4;
        if ($pad > 0) $str .= str_repeat('=', 4 - $pad);
        return base64_decode($str, true);
    }

    private function isVirtualDir($tid)
    {
        return strpos($tid, $this->V_DIR_PREFIX) === 0;
    }

    private function isVirtualItem($id)
    {
        return strpos($id, $this->V_ITEM_PREFIX) === 0;
    }

    private function encodeVirtualDir($listFilePath)
    {
        return $this->V_DIR_PREFIX . $this->b64uEncode($listFilePath);
    }

    private function decodeVirtualDir($tid)
    {
        $raw = substr($tid, strlen($this->V_DIR_PREFIX));

        $path = $this->b64uDecode($raw);
        if ($path === false || $path === null || $path === '') {
            $path = base64_decode($raw, true);
        }

        return $path ?: '';
    }

    private function encodeVirtualItem($name, $url = '', $pic = '', $extra = [])
    {
        $payload = array_merge([
            'name' => $name,
            'url' => $url,
            'pic' => $pic
        ], is_array($extra) ? $extra : []);

        return $this->V_ITEM_PREFIX . $this->b64uEncode(
            json_encode($payload, JSON_UNESCAPED_UNICODE)
        );
    }

    private function decodeVirtualItem($id)
    {
        $raw = substr($id, strlen($this->V_ITEM_PREFIX));

        $json = $this->b64uDecode($raw);
        if ($json === false || $json === null || $json === '') {
            $json = base64_decode($raw, true);
        }
        if (!$json) return null;

        $arr = json_decode($json, true);
        if (!is_array($arr)) return null;

        $url = trim($arr['url'] ?? '');
        $playUrl = trim($arr['play_url'] ?? '');

        if ($url === '' && $playUrl === '') return null;

        return $arr;
    }

    private function buildSafeVodPlay($fromRaw, $playUrlRaw, $fallbackTitle = '播放')
    {
        $fromArr = array_values(array_filter(array_map('trim', explode('$$$', (string)$fromRaw))));
        $groupArr = array_values(array_filter(array_map('trim', explode('$$$', (string)$playUrlRaw))));

        if (empty($groupArr) && trim($playUrlRaw) !== '') {
            $groupArr = [trim($playUrlRaw)];
        }

        $safeFrom = [];
        $safeGroups = [];

        foreach ($groupArr as $i => $group) {
            $lineName = isset($fromArr[$i]) && !empty($fromArr[$i]) ? $fromArr[$i] : ('线路' . ($i + 1));
            $episodes = array_values(array_filter(array_map('trim', explode('#', $group))));
            $safeEp = [];

            foreach ($episodes as $j => $ep) {
                $parts = explode('$', $ep, 2);
                if (count($parts) === 2) {
                    $epName = trim($parts[0]) !== '' ? trim($parts[0]) : ('第' . ($j + 1) . '集');
                    $epUrl = trim($parts[1]);
                } else {
                    $epName = '第' . ($j + 1) . '集';
                    $epUrl = trim($ep);
                }

                if ($epUrl === '') continue;

                $safe = $this->URL_B64U_PREFIX . $this->b64uEncode($epUrl);
                $safeEp[] = $epName . '$' . $safe;
            }

            if (!empty($safeEp)) {
                $safeFrom[] = $lineName;
                $safeGroups[] = implode('#', $safeEp);
            }
        }

        if (empty($safeGroups)) {
            $safe = $this->URL_B64U_PREFIX . $this->b64uEncode($playUrlRaw);
            return [
                'vod_play_from' => '默认线路',
                'vod_play_url' => $fallbackTitle . '$' . $safe
            ];
        }

        return [
            'vod_play_from' => implode('$$$', $safeFrom),
            'vod_play_url' => implode('$$$', $safeGroups)
        ];
    }

    // =========================
    // 工具
    // =========================
    private function getRootIndex($path)
    {
        $realPath = realpath($path);
        if ($realPath === false) return null;
        
        foreach ($this->ROOT as $index => $root) {
            $realRoot = realpath($root);
            if ($realRoot !== false && strpos($realPath, $realRoot) === 0) {
                return $index;
            }
        }
        return null;
    }

    private function isPlayableUrl($url)
    {
        return $this->dbReader->isPlayableUrl($url) || $this->isLocalPath($url);
    }

    private function isLocalPath($p)
    {
        $p = trim((string)$p);
        if ($p === '') return false;
        return (strpos($p, '://') === false) && (strpos($p, '/') === 0);
    }

    private function scanDirNatural($path)
    {
        $arr = @scandir($path);
        if (!$arr) return [];

        $arr = array_values(array_filter($arr, function ($x) {
            return $x !== '.' && $x !== '..';
        }));

        usort($arr, function ($a, $b) {
            return strnatcasecmp($a, $b);
        });

        return $arr;
    }

    private function collectImagesInDir($dir)
    {
        $out = [];
        $files = $this->scanDirNatural($dir);

        foreach ($files as $file) {
            $full = rtrim($dir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $file;
            $real = realpath($full) ?: $full;
            if (!is_file($real)) continue;

            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if (in_array($ext, $this->IMAGE_EXTS)) {
                $out[] = 'file://' . $real;
            }
        }

        return $out;
    }

    public function getIcon($ext, $path)
    {
        $port = $_SERVER['SERVER_PORT'] ?? '8901';
        $iconBase = 'http://0.0.0.0:' . $port . '/icon/';
        $iconName = 'video-file';

        if ($ext === 'dir' || is_dir($path)) $iconName = 'folder-invoices';
        elseif ($ext === 'json') $iconName = 'json';
        elseif ($ext === 'txt') $iconName = 'txt';
        elseif ($ext === 'm3u') $iconName = 'm3u';
        elseif ($ext === 'm3u8') $iconName = 'm3u8';
        elseif ($ext === 'database' || $ext === 'db') $iconName = 'database';
        elseif ($ext === 'youtube') $iconName = 'youtube';
        elseif ($ext === 'bilibili') $iconName = 'bilibili';
        elseif ($ext === 'back') $iconName = 'back';
        elseif ($ext === 'link') $iconName = 'video-file';
        elseif ($ext === 'album') $iconName = 'image-file';
        elseif (in_array($ext, $this->MEDIA_EXTS)) $iconName = 'video-file';
        elseif (in_array($ext, $this->IMAGE_EXTS)) $iconName = 'image-file';

        return $iconBase . $iconName . '.png';
    }
}

// 运行
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}
error_reporting(E_ALL);
ini_set('display_errors', '1');

(new Spider())->run();
?>