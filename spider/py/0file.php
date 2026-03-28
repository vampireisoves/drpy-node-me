<?php
ini_set('memory_limit', '512M');

/**
 * TVBox T4 本地影视壳 - 优化完整版（可直接覆盖）
 * 功能：
 * - 本地目录浏览
 * - m3u/txt/json/db 虚拟目录
 * - 本地图片单图/相册（pics://）
 * - SQLite 数据库读取（兼容常见 vod 表结构）
 * - vdir/vitem/ialbum/url 统一 b64u 编码
 * - 兼容 legacy base64 解码
 * - 新增：当前目录所有本地视频连播（最小改动，不影响原功能）
 */

// ==================== HtmlParser ====================
class HtmlParser {
    public function pdfa($html, $rule) {
        if ($html === '' || $rule === '') return [];
        $doc = $this->getDom($html);
        $xpath = new DOMXPath($doc);
        $q = $this->parseRuleToXpath($rule);
        $nodes = $xpath->query($q);
        $res = [];
        if ($nodes) {
            foreach ($nodes as $node) {
                $res[] = $doc->saveHTML($node);
            }
        }
        return $res;
    }

    public function pdfh($html, $rule, $baseUrl = '') {
        if ($html === '' || $rule === '') return '';
        $doc = $this->getDom($html);
        $xpath = new DOMXPath($doc);

        $option = '';
        if (strpos($rule, '&&') !== false) {
            $parts = explode('&&', $rule);
            $option = array_pop($parts);
            $rule = implode('&&', $parts);
        }

        $q = $this->parseRuleToXpath($rule);
        $nodes = $xpath->query($q);
        if (!$nodes || $nodes->length <= 0) return '';

        if ($option === 'Text') {
            $txt = '';
            foreach ($nodes as $node) $txt .= $node->textContent;
            return $this->parseText($txt);
        }

        $node = $nodes->item(0);
        if ($option === 'Html') return $doc->saveHTML($node);
        if ($option !== '') return $node->getAttribute($option);
        return $doc->saveHTML($node);
    }

    public function pd($html, $rule, $baseUrl = '') {
        return $this->urlJoin($baseUrl, $this->pdfh($html, $rule, $baseUrl));
    }

    private function parseText($text) {
        $text = preg_replace('/[\s]+/u', "\n", (string)$text);
        $text = preg_replace('/\n+/', "\n", $text);
        return str_replace("\n", ' ', trim($text));
    }

    private function parseRuleToXpath($rule) {
        $rule = str_replace('&&', ' ', $rule);
        $parts = explode(' ', $rule);
        $xp = [];
        foreach ($parts as $p) {
            if ($p === '') continue;
            $xp[] = $this->transSingleSelector($p);
        }
        return '//' . implode('//', $xp);
    }

    private function transSingleSelector($selector) {
        $position = null;
        if (preg_match('/:eq\((-?\d+)\)/', $selector, $m)) {
            $idx = intval($m[1]);
            $selector = str_replace($m[0], '', $selector);
            if ($idx >= 0) $position = $idx + 1;
            else {
                $off = abs($idx) - 1;
                $position = 'last()' . ($off > 0 ? "-{$off}" : '');
            }
        }

        $tag = '*';
        $conds = [];

        if (preg_match('/#([\w-]+)/', $selector, $m)) {
            $conds[] = '@id="' . $m[1] . '"';
            $selector = str_replace($m[0], '', $selector);
        }

        if (preg_match_all('/\.([\w-]+)/', $selector, $m)) {
            foreach ($m[1] as $cls) {
                $conds[] = 'contains(concat(" ", normalize-space(@class), " "), " ' . $cls . ' ")';
            }
            $selector = preg_replace('/\.[\w-]+/', '', $selector);
        }

        if ($selector !== '') $tag = $selector;

        $xp = $tag;
        if (!empty($conds)) $xp .= '[' . implode(' and ', $conds) . ']';
        if ($position !== null) $xp .= '[' . $position . ']';
        return $xp;
    }

    private function getDom($html) {
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        if (mb_detect_encoding($html, 'UTF-8', true) === false) {
            $html = mb_convert_encoding($html, 'UTF-8', 'GBK, BIG5, ISO-8859-1');
        }
        $html = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' . $html;
        $doc->loadHTML($html);
        libxml_clear_errors();
        return $doc;
    }

    private function urlJoin($baseUrl, $relativeUrl) {
        if ($relativeUrl === '') return '';
        if (preg_match('#^https?://#i', $relativeUrl)) return $relativeUrl;
        if ($baseUrl === '') return $relativeUrl;

        $parts = parse_url($baseUrl);
        $scheme = isset($parts['scheme']) ? ($parts['scheme'] . '://') : 'http://';
        $host = $parts['host'] ?? '';
        if ($host === '') return $relativeUrl;

        if (substr($relativeUrl, 0, 1) === '/') return $scheme . $host . $relativeUrl;

        $path = $parts['path'] ?? '/';
        $dir = rtrim(dirname($path), '/\\');
        if ($dir === '/' || $dir === '\\') $dir = '';
        return $scheme . $host . $dir . '/' . $relativeUrl;
    }
}

// ==================== BaseSpider ====================
abstract class BaseSpider {
    protected $headers = [
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language' => 'zh-CN,zh;q=0.9'
    ];
    
    protected $htmlParser;

    public function __construct() {
        $this->htmlParser = new HtmlParser();
    }

    public function init($extend = '') {}
    public function homeContent($filter) { return ['class' => []]; }
    public function homeVideoContent() { return ['list' => []]; }
    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        return ['list' => [], 'page' => intval($pg), 'pagecount' => 1, 'limit' => 20, 'total' => 0];
    }
    public function detailContent($ids) { return ['list' => []]; }
    public function searchContent($key, $quick = false, $pg = 1) { return ['list' => []]; }
    public function playerContent($flag, $id, $vipFlags = []) { return ['parse' => 0, 'url' => '', 'header' => []]; }
    public function localProxy($params) { return null; }
    public function action($action, $value) { return ''; }

    protected function fetch($url, $options = [], $headers = []) {
        if (isset($options['headers']) && is_array($options['headers'])) {
            $headers = array_merge($headers, $options['headers']);
            unset($options['headers']);
        }

        $ch = curl_init();
        $customHeaders = [];

        foreach ($headers as $k => $v) {
            if (is_numeric($k)) {
                $parts = explode(':', $v, 2);
                if (count($parts) === 2) $customHeaders[trim($parts[0])] = trim($parts[1]);
            } else {
                $customHeaders[$k] = $v;
            }
        }

        $merged = array_merge($this->headers, $customHeaders);
        $rawHeaders = [];
        foreach ($merged as $k => $v) {
            $rawHeaders[] = ($v === '') ? ($k . ';') : ($k . ': ' . $v);
        }

        $curlOpt = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_ENCODING => '',
            CURLOPT_HTTPHEADER => $rawHeaders
        ];

        if (isset($options['body'])) {
            $curlOpt[CURLOPT_POST] = true;
            $curlOpt[CURLOPT_POSTFIELDS] = $options['body'];
            unset($options['body']);
        }
        if (isset($options['cookie'])) {
            $curlOpt[CURLOPT_COOKIE] = $options['cookie'];
            unset($options['cookie']);
        }

        foreach ($options as $k => $v) $curlOpt[$k] = $v;
        curl_setopt_array($ch, $curlOpt);

        $res = curl_exec($ch);
        curl_close($ch);
        return $res;
    }

    protected function fetchJson($url, $options = []) {
        $txt = $this->fetch($url, $options);
        $arr = json_decode($txt, true);
        return is_array($arr) ? $arr : [];
    }

    protected function safeJson($data) {
        return json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function run() {
        $ac = $_GET['ac'] ?? '';
        $t = $_GET['t'] ?? '';
        $pg = intval($_GET['pg'] ?? 1);
        $wd = $_GET['wd'] ?? '';
        $ids = $_GET['ids'] ?? '';
        $play = $_GET['play'] ?? '';
        $flag = $_GET['flag'] ?? '';
        $filter = isset($_GET['filter']) && $_GET['filter'] === 'true';
        $extend = $_GET['ext'] ?? '';
        $action = $_GET['action'] ?? '';
        $value = $_GET['value'] ?? '';

        if (is_string($extend) && $extend !== '') {
            $decoded = json_decode(base64_decode($extend), true);
            if (is_array($decoded)) $extend = $decoded;
        }

        $this->init($extend);

        try {
            if ($ac === 'action') {
                echo $this->safeJson($this->action($action, $value));
                return;
            }

            if ($ac === 'play' || $play !== '') {
                $playId = $play !== '' ? $play : ($_GET['id'] ?? '');
                echo $this->safeJson($this->playerContent($flag, $playId));
                return;
            }

            if ($wd !== '') {
                echo $this->safeJson($this->searchContent($wd, false, $pg));
                return;
            }

            if ($ids !== '' && $ac !== '') {
                echo $this->safeJson($this->detailContent(explode(',', $ids)));
                return;
            }

            if ($t !== '' && $ac !== '') {
                echo $this->safeJson($this->categoryContent($t, $pg, [], is_array($extend) ? $extend : []));
                return;
            }

            $homeData = $this->homeContent($filter);
            $videoData = $this->homeVideoContent();
            $res = ['class' => $homeData['class'] ?? []];
//            if (isset($videoData['list'])) $res['list'] = $videoData['list'];
            if (isset($homeData['list']) && !empty($homeData['list'])) $res['list'] = $homeData['list'];
            if (isset($homeData['filters'])) $res['filters'] = $homeData['filters'];

            echo $this->safeJson($res);
        } catch (Throwable $e) {
            echo $this->safeJson(['code' => 500, 'msg' => $e->getMessage()]);
        }
    }
}

// ==================== DatabaseReader ====================
class DatabaseReader {
    private $cache = [];

    public function readSQLite($dbPath, $limit = 500) {
        $key = $dbPath . '_' . intval($limit);
        if (isset($this->cache[$key])) return $this->cache[$key];
        $out = [];

        if (!is_file($dbPath) || !is_readable($dbPath)) {
            $this->cache[$key] = [];
            return [];
        }

        try {
            $pdo = new PDO('sqlite:' . $dbPath);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

            $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%'")
                ->fetchAll(PDO::FETCH_COLUMN);

            foreach ($tables as $table) {
                if (in_array($table, ['android_metadata', 'db_config', 'meta', 'crawl_state', 'sqlite_sequence'], true)) continue;
                $items = $this->parseTable($pdo, $table, $limit);
                if (!empty($items)) $out = array_merge($out, $items);
                if (count($out) >= $limit) {
                    $out = array_slice($out, 0, $limit);
                    break;
                }
            }
        } catch (Throwable $e) {}

        $this->cache[$key] = $out;
        return $out;
    }

    private function parseTable(PDO $pdo, $table, $limit) {
        $res = [];
        try {
            $stmt = $pdo->query("PRAGMA table_info(`{$table}`)");
            $cols = $stmt->fetchAll();
            $names = array_column($cols, 'name');

            $titleField = $this->findBestMatch($names, ['vod_name', 'name', 'title']);
            $urlField = $this->findBestMatch($names, ['play_url', 'vod_play_url', 'vod_url', 'url']);
            $picField = $this->findBestMatch($names, ['image', 'vod_pic', 'pic']);
            $remarksField = $this->findBestMatch($names, ['vod_remarks', 'remarks']);
            $fromField = $this->findBestMatch($names, ['vod_play_from', 'type_name']);

            $actorField = $this->findBestMatch($names, ['vod_actor', 'actor']);
            $directorField = $this->findBestMatch($names, ['vod_director', 'director']);
            $contentField = $this->findBestMatch($names, ['vod_content', 'content']);
            $yearField = $this->findBestMatch($names, ['vod_year', 'year']);
            $areaField = $this->findBestMatch($names, ['vod_area', 'area']);

            if (!$titleField || !$urlField) return [];

            $rows = $pdo->query("SELECT * FROM `{$table}` WHERE `{$urlField}` IS NOT NULL AND `{$urlField}` != '' LIMIT " . intval($limit))->fetchAll();
            foreach ($rows as $row) {
                $playUrlRaw = trim((string)($row[$urlField] ?? ''));
                if ($playUrlRaw === '') continue;

                $title = trim((string)($row[$titleField] ?? '未命名'));
                $isMulti = (strpos($playUrlRaw, '$') !== false || strpos($playUrlRaw, '#') !== false || strpos($playUrlRaw, '$$$') !== false);

                $res[] = [
                    'name' => $title,
                    'url' => $isMulti ? '' : $playUrlRaw,
                    'play_url' => $isMulti ? $playUrlRaw : '',
                    'pic' => $picField ? ($row[$picField] ?? '') : '',
                    'remarks' => $remarksField ? ($row[$remarksField] ?? '') : '',
                    'from' => $fromField ? ($row[$fromField] ?? '默认线路') : '默认线路',
                    'actor' => $actorField ? ($row[$actorField] ?? '') : '',
                    'director' => $directorField ? ($row[$directorField] ?? '') : '',
                    'content' => $contentField ? ($row[$contentField] ?? '') : '',
                    'year' => $yearField ? ($row[$yearField] ?? '') : '',
                    'area' => $areaField ? ($row[$areaField] ?? '') : ''
                ];
            }
        } catch (Throwable $e) {}
        return $res;
    }

    private function findBestMatch($columnNames, $candidates) {
        $cands = is_array($candidates) ? $candidates : [$candidates];
        foreach ($cands as $c) {
            foreach ($columnNames as $col) {
                if (strcasecmp($col, $c) === 0) return $col;
            }
        }
        foreach ($cands as $c) {
            foreach ($columnNames as $col) {
                if (stripos($col, $c) !== false) return $col;
            }
        }
        return null;
    }

    public function isPlayableUrl($url) {
        $u = strtolower(trim((string)$url));
        if ($u === '') return false;
        if (
            strpos($u, 'http://') === 0 ||
            strpos($u, 'https://') === 0 ||
            strpos($u, 'rtmp://') === 0 ||
            strpos($u, 'rtsp://') === 0 ||
            strpos($u, 'udp://') === 0 ||
            strpos($u, 'rtp://') === 0 ||
            strpos($u, 'file://') === 0 ||
            strpos($u, 'pics://') === 0
        ) return true;

        $exts = ['.mp4', '.mkv', '.avi', '.rmvb', '.mov', '.wmv', '.flv', '.m3u8', '.ts', '.mp3', '.m4a', '.aac', '.flac', '.wav'];
        foreach ($exts as $e) {
            if (strpos($u, $e) !== false) return true;
        }
        return false;
    }

    public function countVodEpisodes($playUrlRaw) {
        $raw = trim((string)$playUrlRaw);
        if ($raw === '') return 0;
        $groups = array_values(array_filter(array_map('trim', explode('$$$', $raw))));
        if (empty($groups)) $groups = [$raw];
        $total = 0;
        foreach ($groups as $g) {
            $eps = array_values(array_filter(array_map('trim', explode('#', $g))));
            $total += count($eps);
        }
        return max(1, $total);
    }
}

// ==================== Spider ====================
class Spider extends BaseSpider {
    private $ROOT = [
        '/storage/emulated/0/Pictures/',
        '/storage/emulated/0/DCIM/',
        '/storage/emulated/0/Movies/',
        '/storage/emulated/0/peekpili/',
        '/storage/emulated/0/download/',
        '/storage/emulated/0/'
    ];
    private $FILTER_CONFIG = [
        'hide_dot_files' => true,  // 隐藏以点号开头的文件和目录
    ];
    private $V_DIR_PREFIX = 'vdir://';
    private $V_ITEM_PREFIX = 'vitem://';
    private $I_ALBUM_PREFIX = 'ialbum://';
    private $URL_B64U_PREFIX = 'b64u://';
    private $V_ALL_PREFIX = 'vall://'; // 新增：当前目录视频连播

    private $MEDIA_EXTS = ['mp4', 'mkv', 'mp3', 'flv', 'avi', 'rmvb', 'mov', 'wmv', 'm4v', 'ts', 'm3u8', 'm4a', 'aac', 'flac', 'wav'];
    private $IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'ico', 'svg'];
    private $DB_EXTS = ['db', 'sqlite', 'sqlite3'];

    private $dbReader;

    public function init($extend = '') {
        if (!empty($extend)) {
            if (is_array($extend)) {
                $tmp = [];
                foreach ($extend as $p) {
                    $p = rtrim((string)$p, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
                    if ($p !== DIRECTORY_SEPARATOR && is_dir($p)) $tmp[] = $p;
                }
                if (!empty($tmp)) $this->ROOT = $tmp;
            } else {
                $p = rtrim((string)$extend, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
                if (is_dir($p)) $this->ROOT = [$p];
            }
        }

        $normalized = [];
        foreach ($this->ROOT as $r) {
            $real = realpath($r);
            if ($real !== false && is_dir($real)) $normalized[] = rtrim($real, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        }
        if (!empty($normalized)) $this->ROOT = array_values(array_unique($normalized));

        $this->dbReader = new DatabaseReader();
    }

    public function homeContent($filter = []) {
        $class = [];
        foreach ($this->ROOT as $i => $root) {
            $name = basename(rtrim($root, DIRECTORY_SEPARATOR));
            if ($name === '') $name = $root;
            $class[] = ['type_id' => 'root_' . $i, 'type_name' => $name];
        }
        return ['class' => $class];
    }

    public function homeVideoContent() {
        $list = [];
        foreach ($this->ROOT as $i => $root) {
            $res = $this->categoryContent('root_' . $i, 1);
            if (!empty($res['list']) && is_array($res['list'])) {
                $list = array_merge($list, array_slice($res['list'], 0, 10));
            }
        }
        return ['list' => $list];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $pg = max(1, intval($pg));

        // 列表虚拟目录
        if ($this->isVirtualDir($tid)) return $this->buildVirtualDirCategory($tid, $pg);

        // 本目录看图
        if ($this->isImageAlbum($tid)) return $this->buildImageAlbumCategory($tid, $pg);

        // 兼容返回标记
        if (strpos($tid, 'back_dir_') === 0) $tid = substr($tid, 9);

        // 根目录
        if (preg_match('/^root_(\d+)$/', $tid, $m)) {
            $idx = intval($m[1]);
            if (!isset($this->ROOT[$idx])) return ['list' => []];
            $path = $this->ROOT[$idx];
        } else {
            $path = $tid;
        }

        $path = rtrim((string)$path, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        $realPath = realpath($path);
        if ($realPath === false || !is_dir($realPath)) return ['list' => []];
        if (!$this->isPathUnderRoots($realPath)) return ['list' => []];

        $itemsPerPage = 50;
        $offset = ($pg - 1) * $itemsPerPage;

        $files = $this->scanDirNatural($realPath . DIRECTORY_SEPARATOR);
        $totalFiles = count($files);
        $pageFiles = array_slice($files, $offset, $itemsPerPage);

        $list = [];
        $rootIndex = $this->getRootIndex($realPath);
        $realRoot = $rootIndex !== null ? realpath($this->ROOT[$rootIndex]) : null;

        if ($rootIndex !== null && $realRoot !== false && $realPath !== $realRoot && $realPath !== '/') {
            $parent = dirname($realPath);
            $targetId = (strlen($parent) < strlen($realRoot)) ? ('root_' . $rootIndex) : $parent;
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

        if ($pg === 1) {
            $videos = $this->collectVideosInDir($realPath);
            if (!empty($videos)) {
                $playId = $this->encodeVideoAll($realPath);
                $list[] = [
                    'vod_id' => $playId,
                    'vod_name' => '🎬 本目录连播',
                    'vod_pic' => $this->getIcon('mp4', ''),
                    'style' => ['type' => 'list'],
                    'vod_remarks' => count($videos) . ' 个视频'
                ];
            }

            $images = $this->collectImagesInDir($realPath);
            if (!empty($images)) {
                $albumId = $this->encodeImageAlbum($realPath);
                $list[] = [
                    'vod_id' => $albumId,
                    'type_id' => $albumId,
                    'vod_tag' => 'folder',
                    'vod_name' => '🖼️ 本目录看图',
                    'vod_pic' => $images[0],
                    'style' => ['type' => 'list'],
                    'vod_remarks' => count($images) . ' 张图片'
                ];
            }
        }

    foreach ($pageFiles as $file) {
        $full = $realPath . DIRECTORY_SEPARATOR . $file;
        $real = realpath($full) ?: $full;
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    
        if (is_dir($real)) {
            $list[] = [
                'vod_id' => $real,
                'type_id' => $real,
                'vod_tag' => 'folder',
                'vod_name' => '📁 ' . $file,
                'vod_pic' => $this->getIcon('dir', $real),
                'style' => ['type' => 'list'],
                'vod_remarks' => '进入目录'
            ];
            continue;
        }
    
        if (in_array($ext, array_merge(['m3u', 'txt', 'json'], $this->DB_EXTS), true)) {
            $vdir = $this->encodeVirtualDir($real);
            $iconType = $ext;
            $remarks = '进入列表';
            if (in_array($ext, $this->DB_EXTS, true)) {
                $iconType = 'database';
                $remarks = '数据库文件';
            } elseif ($ext === 'json') {
                $iconType = 'json';
                $remarks = 'JSON数据';
            }
    
            $list[] = [
                'vod_id' => $vdir,
                'type_id' => $vdir,
                'vod_tag' => 'folder',
                'vod_name' => '📂 ' . $file,
                'vod_pic' => $this->getIcon($iconType, $real),
                'style' => ['type' => 'list'],
                'vod_remarks' => $remarks
            ];
            continue;
        }
    
        if (in_array($ext, $this->MEDIA_EXTS, true)) {
            $list[] = [
                'vod_id' => $real,
                'vod_name' => '📄 ' . $file,
                'vod_pic' => $this->getIcon($ext, $real),
                'style' => ['type' => 'list'],
                'vod_remarks' => strtoupper($ext)
            ];
            continue;
        }
    }


        $pagecount = intval(ceil(max(1, $totalFiles) / $itemsPerPage));
        return [
            'page' => $pg,
            'pagecount' => $pagecount,
            'limit' => $itemsPerPage,
            'total' => $totalFiles,
            'list' => $list
        ];
    }

    public function detailContent($ids) {
        $id = $ids[0] ?? '';
        if ($id === '') return ['list' => []];

        // 新增：当前目录视频连播详情
        if ($this->isVideoAll($id)) return $this->buildVideoAllDetail($id);

        // 直接 b64u 播放
        if (strpos($id, $this->URL_B64U_PREFIX) === 0) {
            $decoded = $this->b64uDecode(substr($id, strlen($this->URL_B64U_PREFIX)));
            $from = $this->detectUrlType((string)$decoded);
            return ['list' => [[
                'vod_id' => $id,
                'vod_name' => '播放',
                'vod_play_from' => $from,
                'vod_play_url' => '立即播放$' . $id
            ]]];
        }

        if ($this->isVirtualDir($id)) return $this->categoryContent($id, 1);
        if ($this->isImageAlbum($id)) return $this->buildImageAlbumDetail($id);

        if ($this->isVirtualItem($id)) {
            $item = $this->decodeVirtualItem($id);
            if (!$item) return ['list' => []];

            $title = trim((string)($item['name'] ?? '未命名'));
            $pic = (string)($item['pic'] ?? '');
            $playUrlRaw = trim((string)($item['play_url'] ?? ''));
            $url = trim((string)($item['url'] ?? ''));

            if ($playUrlRaw !== '') {
                $playData = $this->buildSafeVodPlay($item['from'] ?? '默认线路', $playUrlRaw, $title);
                return ['list' => [[
                    'vod_id' => $id,
                    'vod_name' => $title,
                    'vod_pic' => $pic,
                    'vod_play_from' => $playData['vod_play_from'],
                    'vod_play_url' => $playData['vod_play_url']
                ]]];
            }

            if ($url !== '') {
                $safe = $this->URL_B64U_PREFIX . $this->b64uEncode($url);
                return ['list' => [[
                    'vod_id' => $id,
                    'vod_name' => $title,
                    'vod_pic' => $pic,
                    'vod_play_from' => $this->detectUrlType($url),
                    'vod_play_url' => $title . '$' . $safe
                ]]];
            }

            return ['list' => []];
        }

        if (strpos($id, 'back_dir_') === 0) {
            $target = substr($id, 9);
            return $this->categoryContent($target, 1);
        }

        if (preg_match('/^root_(\d+)$/', $id)) return $this->categoryContent($id, 1);

        if ($this->isLocalPath($id) && is_dir($id)) {
            $real = realpath($id);
            if ($real === false || !$this->isPathUnderRoots($real)) return ['list' => []];
            return $this->categoryContent($real, 1);
        }

        $name = basename($id);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        if (in_array($ext, $this->IMAGE_EXTS, true)) {
            $payload = 'pics://' . 'file://' . $id;
            $safe = $this->URL_B64U_PREFIX . $this->b64uEncode($payload);
            return ['list' => [[
                'vod_id' => $id,
                'vod_name' => $name,
                'vod_pic' => 'file://' . $id,
                'vod_play_from' => '本地看图',
                'vod_play_url' => '查看图片$' . $safe
            ]]];
        }

        return ['list' => [[
            'vod_id' => $id,
            'vod_name' => $name,
            'vod_play_from' => $this->detectUrlType($id),
            'vod_play_url' => '本地播放$file://' . $id
        ]]];
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $u = trim((string)$id);

        if (strpos($u, 'file://' . $this->URL_B64U_PREFIX) === 0) $u = substr($u, 7);

        if (strpos($u, $this->URL_B64U_PREFIX) === 0) {
            $raw = substr($u, strlen($this->URL_B64U_PREFIX));
            $decoded = $this->b64uDecode($raw);
            if (is_string($decoded) && $decoded !== '') $u = $decoded;
        }

        if ($this->isLocalPath($u)) {
            $real = realpath($u);
            if ($real !== false && $this->isPathUnderRoots($real)) $u = 'file://' . $real;
            else $u = 'file://' . $u;
        }

        return [
            'parse' => 0,
            'url' => $u,
            'header' => ['User-Agent' => 'Mozilla/5.0']
        ];
    }

    // ---------- 图片相册 ----------
    private function isImageAlbum($tid) {
        return strpos((string)$tid, $this->I_ALBUM_PREFIX) === 0;
    }

    private function encodeImageAlbum($dirPath) {
        return $this->I_ALBUM_PREFIX . $this->b64uEncode($dirPath);
    }

    private function decodeImageAlbum($tid) {
        $raw = substr((string)$tid, strlen($this->I_ALBUM_PREFIX));
        $path = $this->b64uDecode($raw);
        if (!is_string($path) || $path === '') $path = base64_decode($raw, true);
        return is_string($path) ? $path : '';
    }

    private function buildImageAlbumCategory($tid, $pg = 1) {
        if ($pg > 1) return ['page' => $pg, 'pagecount' => 0, 'list' => []];

        $dir = $this->decodeImageAlbum($tid);
        $real = realpath($dir);
        if ($real === false || !is_dir($real) || !$this->isPathUnderRoots($real)) return ['list' => []];

        $images = $this->collectImagesInDir($real);
        $list = [];

        $list[] = [
            'vod_id' => 'back_dir_' . $real,
            'type_id' => $real,
            'vod_tag' => 'folder',
            'vod_name' => '⬅️ 返回文件目录',
            'vod_pic' => $this->getIcon('back', ''),
            'style' => ['type' => 'grid', 'cols' => 4, 'ratio' => 1.5],
            'vod_remarks' => '返回目录'
        ];

        if (!empty($images)) {
            $payload = 'pics://' . implode('&&', $images);
            $safe = $this->URL_B64U_PREFIX . $this->b64uEncode($payload);

            $list[] = [
                'vod_id' => $safe,
                'vod_name' => '🎞️ 幻灯播放（全部）',
                'vod_pic' => $images[0],
                'style' => ['type' => 'grid', 'ratio' => 1],
                'vod_remarks' => count($images) . ' 张'
            ];

            foreach ($images as $img) {
                $base = basename(parse_url($img, PHP_URL_PATH) ?? $img);
                $single = $this->URL_B64U_PREFIX . $this->b64uEncode('pics://' . $img);
                $list[] = [
                    'vod_id' => $single,
                    'vod_name' => '🖼️ ' . $base,
                    'vod_pic' => $img,
                    'style' => ['type' => 'grid', 'ratio' => 1],
                    'vod_remarks' => '单图查看'
                ];
            }
        }

        return [
            'page' => 1,
            'pagecount' => 1,
            'limit' => count($list),
            'total' => count($list),
            'list' => $list
        ];
    }

    private function buildImageAlbumDetail($id) {
        $dir = $this->decodeImageAlbum($id);
        $real = realpath($dir);
        if ($real === false || !is_dir($real) || !$this->isPathUnderRoots($real)) return ['list' => []];

        $images = $this->collectImagesInDir($real);
        if (empty($images)) return ['list' => []];

        $payload = 'pics://' . implode('&&', $images);
        $safe = $this->URL_B64U_PREFIX . $this->b64uEncode($payload);

        return ['list' => [[
            'vod_id' => $id,
            'vod_name' => '本目录看图 - ' . basename($real),
            'vod_pic' => $images[0],
            'vod_play_from' => '本地看图',
            'vod_play_url' => '幻灯播放（' . count($images) . '张）$' . $safe
        ]]];
    }

    // ---------- 虚拟目录 ----------
    private function isVirtualDir($tid) {
        return strpos((string)$tid, $this->V_DIR_PREFIX) === 0;
    }

    private function encodeVirtualDir($listFilePath) {
        return $this->V_DIR_PREFIX . $this->b64uEncode($listFilePath);
    }

    private function decodeVirtualDir($tid) {
        $raw = substr((string)$tid, strlen($this->V_DIR_PREFIX));
        $path = $this->b64uDecode($raw);
        if (!is_string($path) || $path === '') $path = base64_decode($raw, true);
        return is_string($path) ? $path : '';
    }

    private function buildVirtualDirCategory($tid, $pg = 1) {
        if ($pg > 1) return ['page' => $pg, 'pagecount' => 0, 'list' => []];

        $listFile = $this->decodeVirtualDir($tid);
        $real = realpath($listFile);
        if ($real === false || !is_file($real) || !$this->isPathUnderRoots($real)) return ['list' => []];

        $ext = strtolower(pathinfo($real, PATHINFO_EXTENSION));
        $items = [];
        if ($ext === 'm3u') $items = $this->parseM3uToItems($real);
        elseif ($ext === 'txt') $items = $this->parseTxtToItems($real);
        elseif ($ext === 'json') $items = $this->parseJsonToItems($real);
        elseif (in_array($ext, $this->DB_EXTS, true)) $items = $this->parseDbToItems($real);

        $list = [];
        $parent = dirname($real);
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
            $title = trim((string)($it['name'] ?? '未命名'));
            $url = trim((string)($it['url'] ?? ''));
            $playUrlRaw = trim((string)($it['play_url'] ?? ''));
            $pic = (string)($it['pic'] ?? '');
            $remarks = (string)($it['remarks'] ?? '');
            $from = (string)($it['from'] ?? '');

            if ($url === '' && $playUrlRaw === '') continue;

            $iconType = $url !== '' ? $this->getIconTypeFromUrl($url) : 'link';
            $remarksText = $remarks;
            if ($remarksText === '') {
                if ($playUrlRaw !== '') {
                    $epCount = $this->dbReader->countVodEpisodes($playUrlRaw);
                    $remarksText = $epCount > 1 ? ('共' . $epCount . '集') : '剧集';
                } else {
                    $remarksText = $this->getRemarksFromUrl($url);
                }
            }

            $list[] = [
                'vod_id' => $this->encodeVirtualItem($title, $url, $pic, [
                    'play_url' => $playUrlRaw,
                    'from' => $from,
                    'remarks' => $remarks
                ]),
                'vod_name' => '🎬 ' . $title,
                'vod_pic' => $pic !== '' ? $pic : $this->getIcon($iconType, ''),
                'style' => ['type' => 'grid', 'cols' => 4, 'ratio' => 1.5],
                'vod_remarks' => $remarksText
            ];
        }

        return [
            'page' => 1,
            'pagecount' => 1,
            'limit' => count($list),
            'total' => count($list),
            'list' => $list
        ];
    }

    private function parseM3uToItems($path) {
        $out = [];
        $fp = @fopen($path, 'r');
        if (!$fp) return $out;

        $currentTitle = '';
        $idx = 1;
        $lineCount = 0;
        while (($line = fgets($fp)) !== false) {
            $lineCount++;
            if ($lineCount > 50000) break; // 防止超大文件拖死
            $line = trim($line);
            if ($line === '') continue;

            if (stripos($line, '#EXTINF:') === 0) {
                if (preg_match('/,\s*(.+)$/', $line, $m)) $currentTitle = trim($m[1]);
                elseif (preg_match('/tvg-name="([^"]+)"/i', $line, $m2)) $currentTitle = trim($m2[1]);
                else $currentTitle = '线路' . $idx;
                continue;
            }

            if ($line[0] === '#') continue;

            if ($this->isPlayableUrl($line)) {
                $out[] = ['name' => ($currentTitle !== '' ? $currentTitle : ('线路' . $idx)), 'url' => $line];
                $currentTitle = '';
                $idx++;
            }
        }

        fclose($fp);
        return $out;
    }

    private function parseTxtToItems($path) {
        $out = [];
        $fp = @fopen($path, 'r');
        if (!$fp) return $out;

        $idx = 1;
        $lineCount = 0;
        while (($line = fgets($fp)) !== false) {
            $lineCount++;
            if ($lineCount > 50000) break;
            $line = trim($line);
            if ($line === '') continue;
            if ($line[0] === '#') continue;
            if (strpos($line, '#genre#') !== false) continue;

            $name = '';
            $url = '';

            // 只切第一处逗号
            if (strpos($line, ',') !== false) {
                $pos = strpos($line, ',');
                $name = trim(substr($line, 0, $pos));
                $url = trim(substr($line, $pos + 1));
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

    private function parseJsonToItems($path) {
        $out = [];
        $content = @file_get_contents($path, false, null, 0, 30 * 1024 * 1024); // 最大读 30MB
        if (!is_string($content) || $content === '') return $out;
    
        $data = json_decode($content, true);
        if (!is_array($data)) return $out;
    
        // 支持三种顶层键：list / vod / videos
        $items = [];
        $containerType = 'unknown';
    
        if (isset($data['list']) && is_array($data['list'])) {
            $items = $data['list'];
            $containerType = 'list';
        } elseif (isset($data['vod']) && is_array($data['vod'])) {
            $items = $data['vod'];
            $containerType = 'vod';
        } elseif (isset($data['videos']) && is_array($data['videos'])) {
            $items = $data['videos'];
            $containerType = 'videos';
        } elseif (array_keys($data) === range(0, count($data) - 1)) {
            // 顶层本身就是数组
            $items = $data;
            $containerType = 'array';
        }
    
        foreach ($items as $item) {
            if (!is_array($item)) continue;
    
            // 1) 兼容 videos 简化格式：{title, cover, play_url, play_source, ...}
            if (
                $containerType === 'videos' ||
                (isset($item['title']) && (isset($item['play_url']) || isset($item['url'])))
            ) {
                $name = trim((string)($item['title'] ?? '未命名'));
                $play = trim((string)($item['play_url'] ?? ''));
                $url  = trim((string)($item['url'] ?? ''));
    
                if ($play === '' && $url === '') continue;
    
                $actors = $item['actors'] ?? '';
                if (is_array($actors)) $actors = implode(' / ', array_map('strval', $actors));
                else $actors = (string)$actors;
    
                $remarks = '';
                if (!empty($item['type'])) $remarks .= (string)$item['type'];
                if (!empty($item['year'])) $remarks .= ($remarks !== '' ? ' · ' : '') . (string)$item['year'];
                if ($remarks === '' && !empty($item['source'])) $remarks = (string)$item['source'];
    
                $out[] = [
                    'name' => $name,
                    'url' => $url,                 // 单链接可走 url
                    'play_url' => $play,           // 剧集串走 play_url
                    'pic' => $item['cover'] ?? ($item['pic'] ?? ''),
                    'remarks' => $remarks,
                    'from' => $item['play_source'] ?? ($item['source'] ?? '默认线路'),
                    // 扩展信息（当前流程即使不用，也可保留）
                    'actor' => $actors,
                    'director' => (string)($item['director'] ?? ''),
                    'content' => (string)($item['description'] ?? ''),
                    'year' => (string)($item['year'] ?? ''),
                    'area' => (string)($item['area'] ?? '')
                ];
                continue;
            }
    
            // 2) 标准 VOD：{vod_name, vod_play_url, ...}
            if (isset($item['vod_name']) && isset($item['vod_play_url'])) {
                $name = trim((string)($item['vod_name'] ?? '未命名'));
                $play = trim((string)($item['vod_play_url'] ?? ''));
                if ($play === '') continue;
    
                $out[] = [
                    'name' => $name,
                    'url' => '',
                    'play_url' => $play,
                    'pic' => $item['vod_pic'] ?? '',
                    'remarks' => $item['vod_remarks'] ?? '',
                    'from' => $item['vod_play_from'] ?? '默认线路',
                    'actor' => $item['vod_actor'] ?? '',
                    'director' => $item['vod_director'] ?? '',
                    'content' => $item['vod_content'] ?? '',
                    'year' => $item['vod_year'] ?? '',
                    'area' => $item['vod_area'] ?? ''
                ];
                continue;
            }
    
            // 3) 通用：{name,url}
            if (isset($item['name']) && isset($item['url'])) {
                $out[] = [
                    'name' => (string)$item['name'],
                    'url' => (string)$item['url'],
                    'pic' => $item['pic'] ?? ($item['image'] ?? ''),
                    'remarks' => $item['remarks'] ?? '',
                    'from' => $item['from'] ?? '默认线路'
                ];
                continue;
            }
    
            // 4) 数组： [name,url,pic,remarks]
            if (array_keys($item) === range(0, count($item) - 1) && count($item) >= 2) {
                $out[] = [
                    'name' => (string)($item[0] ?? '未命名'),
                    'url' => (string)($item[1] ?? ''),
                    'pic' => (string)($item[2] ?? ''),
                    'remarks' => (string)($item[3] ?? ''),
                    'from' => '默认线路'
                ];
            }
        }
    
        return $out;
    }

    private function parseDbToItems($path) {
        return $this->dbReader->readSQLite($path, 500);
    }

    // ---------- 虚拟条目 ----------
    private function isVirtualItem($id) {
        return strpos((string)$id, $this->V_ITEM_PREFIX) === 0;
    }

    private function encodeVirtualItem($name, $url = '', $pic = '', $extra = []) {
        $payload = array_merge(['name' => $name, 'url' => $url, 'pic' => $pic], is_array($extra) ? $extra : []);
        return $this->V_ITEM_PREFIX . $this->b64uEncode(json_encode($payload, JSON_UNESCAPED_UNICODE));
    }

    private function decodeVirtualItem($id) {
        $raw = substr((string)$id, strlen($this->V_ITEM_PREFIX));
        $json = $this->b64uDecode($raw);
        if (!is_string($json) || $json === '') $json = base64_decode($raw, true);
        if (!is_string($json) || $json === '') return null;

        $arr = json_decode($json, true);
        if (!is_array($arr)) return null;

        $url = trim((string)($arr['url'] ?? ''));
        $play = trim((string)($arr['play_url'] ?? ''));
        if ($url === '' && $play === '') return null;

        return $arr;
    }

    private function buildSafeVodPlay($fromRaw, $playUrlRaw, $fallbackTitle = '播放') {
        $fromArr = array_values(array_filter(array_map('trim', explode('$$$', (string)$fromRaw))));
        $groupArr = array_values(array_filter(array_map('trim', explode('$$$', (string)$playUrlRaw))));
        if (empty($groupArr) && trim((string)$playUrlRaw) !== '') $groupArr = [trim((string)$playUrlRaw)];

        $safeFrom = [];
        $safeGroups = [];

        foreach ($groupArr as $i => $group) {
            $lineName = $fromArr[$i] ?? ('线路' . ($i + 1));
            $episodes = array_values(array_filter(array_map('trim', explode('#', $group))));
            $safeEps = [];

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
                $safeEps[] = $epName . '$' . $this->URL_B64U_PREFIX . $this->b64uEncode($epUrl);
            }

            if (!empty($safeEps)) {
                $safeFrom[] = $lineName;
                $safeGroups[] = implode('#', $safeEps);
            }
        }

        if (empty($safeGroups)) {
            return [
                'vod_play_from' => '默认线路',
                'vod_play_url' => $fallbackTitle . '$' . $this->URL_B64U_PREFIX . $this->b64uEncode((string)$playUrlRaw)
            ];
        }

        return [
            'vod_play_from' => implode('$$$', $safeFrom),
            'vod_play_url' => implode('$$$', $safeGroups)
        ];
    }

    // ---------- 当前目录视频连播 ----------
    private function isVideoAll($id) {
        return strpos((string)$id, $this->V_ALL_PREFIX) === 0;
    }

    private function encodeVideoAll($dirPath) {
        return $this->V_ALL_PREFIX . $this->b64uEncode($dirPath);
    }

    private function decodeVideoAll($id) {
        $raw = substr((string)$id, strlen($this->V_ALL_PREFIX));
        $path = $this->b64uDecode($raw);
        if (!is_string($path) || $path === '') $path = base64_decode($raw, true);
        return is_string($path) ? $path : '';
    }

    private function buildVideoAllDetail($id) {
        $dir = $this->decodeVideoAll($id);
        $real = realpath($dir);
        if ($real === false || !is_dir($real) || !$this->isPathUnderRoots($real)) return ['list' => []];

        $videos = $this->collectVideosInDir($real);
        if (empty($videos)) return ['list' => []];

        $eps = [];
        foreach ($videos as $i => $v) {
            $name = basename($v);
            $safe = $this->URL_B64U_PREFIX . $this->b64uEncode('file://' . $v);
            $eps[] = ($i + 1) . '. ' . $name . '$' . $safe;
        }

        return ['list' => [[
            'vod_id' => $id,
            'vod_name' => '本目录连播 - ' . basename($real),
            'vod_pic' => $this->getIcon('mp4', ''),
            'vod_play_from' => '本地连播',
            'vod_play_url' => implode('#', $eps)
        ]]];
    }

    // ---------- 工具 ----------
    private function b64uEncode($str) {
        return rtrim(strtr(base64_encode((string)$str), '+/', '-_'), '=');
    }

    private function b64uDecode($str) {
        $str = strtr((string)$str, '-_', '+/');
        $pad = strlen($str) % 4;
        if ($pad > 0) $str .= str_repeat('=', 4 - $pad);
        return base64_decode($str, true);
    }

    private function detectUrlType($url) {
        $u = strtolower((string)$url);
        if (strpos($u, 'pics://') === 0) return '本地看图';
        if (strpos($u, 'file://') === 0) return '本地文件';
        if (strpos($u, 'http://') === 0 || strpos($u, 'https://') === 0) return '在线视频';
        return '默认线路';
    }

    private function getIconTypeFromUrl($url) {
        $u = strtolower((string)$url);
        if (strpos($u, '.m3u8') !== false) return 'm3u8';
        if (strpos($u, '.mp4') !== false) return 'mp4';
        return 'link';
    }

    private function getRemarksFromUrl($url) {
        $u = strtolower((string)$url);
        if (strpos($u, '.m3u8') !== false) return 'M3U8';
        if (strpos($u, '.mp4') !== false) return 'MP4';
        return '链接项';
    }

    private function getRootIndex($path) {
        $realPath = realpath($path);
        if ($realPath === false) return null;
        foreach ($this->ROOT as $i => $root) {
            $realRoot = realpath($root);
            if ($realRoot !== false && strpos($realPath, $realRoot) === 0) return $i;
        }
        return null;
    }

    private function isPathUnderRoots($path) {
        $realPath = realpath($path);
        if ($realPath === false) return false;
        foreach ($this->ROOT as $root) {
            $realRoot = realpath($root);
            if ($realRoot !== false && strpos($realPath, $realRoot) === 0) return true;
        }
        return false;
    }

    private function isPlayableUrl($url) {
        return $this->dbReader->isPlayableUrl($url) || $this->isLocalPath($url);
    }

    private function isLocalPath($p) {
        $p = trim((string)$p);
        return $p !== '' && strpos($p, '://') === false && strpos($p, '/') === 0;
    }

    private function scanDirNatural($path) {
        $arr = @scandir($path);
        if (!is_array($arr)) return [];
    
        $arr = array_values(array_filter($arr, function ($x) {
            return $x !== '.' && $x !== '..';
        }));
    
        if ($this->FILTER_CONFIG['hide_dot_files']) {
            $arr = array_values(array_filter($arr, function ($x) {
                return substr($x, 0, 1) !== '.';
            }));
        }
    
        $meta = [];
        $vdirExts = array_merge(['m3u', 'txt', 'json'], $this->DB_EXTS);
    
        foreach ($arr as $name) {
            $full = rtrim($path, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $name;
            $real = realpath($full) ?: $full;
            $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    
            // 分组优先级：子目录(1) -> 模拟目录(2) -> 文件(3) -> 其他(9)
            if (is_dir($real)) {
                $group = 1;
            } elseif (in_array($ext, $vdirExts, true)) {
                $group = 2;
            } elseif (in_array($ext, $this->MEDIA_EXTS, true)) {
                $group = 3;
            } else {
                $group = 9; // 不展示项放最后，避免干扰前面分页
            }
    
            // “创建时间”：Linux/Android 上 filectime 实际是 inode change time，不一定是真创建时间
            $ctime = @filectime($real);
            if ($ctime === false || $ctime <= 0) $ctime = @filemtime($real);
            if ($ctime === false || $ctime <= 0) $ctime = 0;
    
            $meta[$name] = ['group' => $group, 'ctime' => (int)$ctime];
        }
    
        usort($arr, function ($a, $b) use ($meta) {
            $ga = $meta[$a]['group'] ?? 9;
            $gb = $meta[$b]['group'] ?? 9;
            if ($ga !== $gb) return $ga <=> $gb;              // 先按分组
    
            $ta = $meta[$a]['ctime'] ?? 0;
            $tb = $meta[$b]['ctime'] ?? 0;
            if ($ta !== $tb) return $tb <=> $ta;              // 同组按时间：新 -> 旧
    
            return strnatcasecmp($a, $b);                     // 最后按名称兜底
        });
    
        return $arr;
    }
   
    // 新增：收集目录内视频（不递归，仅当前目录）
    private function collectVideosInDir($dir) {
        $out = [];
        $files = $this->scanDirNatural($dir);
        $audioExts = ['mp3', 'm4a', 'aac', 'flac', 'wav'];

        foreach ($files as $f) {
            $full = rtrim($dir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $f;
            $real = realpath($full);
            if ($real === false || !is_file($real)) continue;
            $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));

            if (in_array($ext, $this->MEDIA_EXTS, true) && !in_array($ext, $audioExts, true)) {
                $out[] = $real;
            }
        }
        return $out;
    }

    private function collectImagesInDir($dir) {
        $out = [];
        $files = $this->scanDirNatural($dir);
        foreach ($files as $f) {
            $full = rtrim($dir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $f;
            $real = realpath($full);
            if ($real === false || !is_file($real)) continue;
            $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
            if (in_array($ext, $this->IMAGE_EXTS, true)) $out[] = 'file://' . $real;
        }
        return $out;
    }

    public function getIcon($ext, $path) {
        $iconName = 'video-file';
        if ($ext === 'dir' || is_dir($path)) $iconName = 'folder-invoices';
        elseif ($ext === 'json') $iconName = 'json';
        elseif ($ext === 'txt') $iconName = 'txt';
        elseif ($ext === 'm3u') $iconName = 'm3u';
        elseif ($ext === 'm3u8') $iconName = 'm3u8';
        elseif ($ext === 'database' || $ext === 'db') $iconName = 'database';
        elseif ($ext === 'back') $iconName = 'back';
        elseif ($ext === 'album') $iconName = 'image-file';
        elseif (in_array($ext, $this->IMAGE_EXTS, true)) $iconName = 'image-file';
        elseif (in_array($ext, $this->MEDIA_EXTS, true)) $iconName = 'video-file';

        $scheme = (!empty($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME'] : 'http');
        $host = $_SERVER['HTTP_HOST'] ?? ('0.0.0.0:' . ($_SERVER['SERVER_PORT'] ?? '8901'));
        return $scheme . '://' . $host . '/icon/' . $iconName . '.png';
    }
}

// ==================== Run ====================
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}
error_reporting(E_ALL);
ini_set('display_errors', '0'); // 避免污染 JSON 输出

(new Spider())->run();
?>
