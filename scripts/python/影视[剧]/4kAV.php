<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider
{
    private $HOST = 'https://zh.xhamster.com';
    private $UA   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

    // 静态分类
    private $classMap = [
        '4k'          => '4k',
        'chinese'     => '国产',
        'japanese'    => '日本',
        '18-year-old' => '18',
        'singaporean' => '新加坡',
        'asian'       => '亚洲',
        'russian'     => '俄罗斯',
        'taiwanese'   => '中国台湾',
        'college'     => '大学生',
        'cumshot'     => '射液',
        'orgasm'      => '高潮',
        'teen'        => '青少年',
    ];

    public function init($extend = '')
    {
        $this->headers = [
            'User-Agent'      => $this->UA,
            'Accept'          => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language' => 'zh-CN,zh;q=0.9',
            'Referer'         => $this->HOST . '/',
        ];
    }

    public function homeContent($filter)
    {
        $classes = [];
        foreach ($this->classMap as $id => $name) {
            $classes[] = ['type_id' => $id, 'type_name' => $name];
        }

        $filters = [];
        foreach (array_keys($this->classMap) as $tid) {
            $filters[$tid] = [[
                'key'   => 'sort',
                'name'  => '排序',
                'value' => [
                    ['n' => '默认', 'v' => ''],
                    ['n' => '趋势', 'v' => 'trending'],
                    ['n' => '最新', 'v' => 'newest'],
                    ['n' => '最佳', 'v' => 'best'],
                ]
            ]];
        }

        return [
            'class'   => $classes,
            'filters' => $filters
        ];
    }

    public function homeVideoContent()
    {
        $ret = $this->categoryContent('4k', 1, [], []);
        return ['list' => $ret['list'] ?? []];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = [])
    {
        $pg = max(1, intval($pg));
        $url = $this->buildCategoryUrl($tid, $pg, $extend);

        $html = $this->fetch($url);
        $list = $this->parseVideoItems($html);

        return $this->pageResult($list, $pg, 0, 30);
    }

    public function detailContent($ids)
    {
        $id = is_array($ids) ? ($ids[0] ?? '') : $ids;
        if (!$id) return ['list' => []];

        $url  = $this->normalizeUrl($id);
        $html = $this->fetch($url);

        $title = $this->matchOne($html, '/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i');
        $pic   = $this->matchOne($html, '/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i');
        $desc  = $this->matchOne($html, '/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i');

        $playUrls = $this->parsePlayUrls($html);

        // 防止无播放
        if (empty($playUrls)) {
            $vod = [
                'vod_id'        => $url,
                'vod_name'      => $title ?: '4kkav',
                'vod_pic'       => $this->normalizeImg($pic),
                'type_name'     => '视频',
                'vod_remarks'   => '',
                'vod_content'   => trim($desc),
                'vod_play_from' => 'XSP',
                'vod_play_url'  => '原网页$' . $url
            ];
            return ['list' => [$vod]];
        }

        $vod = [
            'vod_id'        => $url,
            'vod_name'      => $title ?: '4kkav',
            'vod_pic'       => $this->normalizeImg($pic),
            'type_name'     => '视频',
            'vod_remarks'   => '',
            'vod_content'   => trim($desc),
            'vod_play_from' => 'XSP',
            'vod_play_url'  => implode('#', $playUrls)
        ];

        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1)
    {
        $pg = max(1, intval($pg));
        $kw = rawurlencode($key);

        $url  = $this->HOST . '/search/' . $kw . '?quality=2160p&page=' . $pg;
        $html = $this->fetch($url);
        $list = $this->parseVideoItems($html);

        return $this->pageResult($list, $pg, 0, 30);
    }

    public function playerContent($flag, $id, $vipFlags = [])
    {
        // 详情里一般已经给直链
        if (preg_match('/^https?:\/\//i', $id)) {
            if (strpos($id, '.m3u8') !== false || strpos($id, '.mp4') !== false) {
                return [
                    'parse'  => 0,
                    'url'    => $id,
                    'header' => [
                        'User-Agent' => $this->UA,
                        'Referer'    => $this->HOST . '/',
                    ]
                ];
            }
            // 不是直链，交给解析（比如详情兜底给的是网页）
            return [
                'parse'  => 1,
                'url'    => $id,
                'header' => [
                    'User-Agent' => $this->UA,
                    'Referer'    => $this->HOST . '/',
                ]
            ];
        }

        return ['parse' => 1, 'url' => $id, 'header' => []];
    }

    // ---------------- 内部方法 ----------------

    private function buildCategoryUrl($tid, $pg, $extend = [])
    {
        $sort = $extend['sort'] ?? '';

        if ($tid === '4k') {
            if ($pg == 1) return $this->HOST . '/4k?formatFrozen=1';
            return $this->HOST . '/4k/' . $pg;
        }

        $base = $this->HOST . '/categories/' . $tid;

        // 站点排序更偏向路径风格
        if (in_array($sort, ['trending', 'newest', 'best'], true)) {
            $base .= '/' . $sort;
        }

        if ($pg == 1) return $base;
        return $base . '/' . $pg;
    }

// 替换原 parseVideoItems
private function parseVideoItems($html)
{
    $out = [];

    // 1) JSON 路径优先
    $data  = $this->extractInitialsData($html);
    $paths = [
        ['pagesIndexFormatComponent', 'trendingVideoListProps', 'videoThumbProps'],
        ['pagesCategoryComponent', 'trendingVideoListProps', 'videoThumbProps'],
        ['searchResult', 'videoThumbProps'],
        ['videoThumbProps'],
    ];

    foreach ($paths as $path) {
        $items = $this->arrGet($data, $path, []);
        if (!is_array($items) || empty($items)) continue;

        foreach ($items as $it) {
            $u = $this->normalizeUrl($it['pageURL'] ?? '');
            $t = trim((string)($it['title'] ?? ''));
            // 兼容多个缩略图字段
            $p = $this->normalizeImg(
                $it['thumbURL']
                ?? $it['thumbUrl']
                ?? $it['thumbURL169']
                ?? $it['posterURL']
                ?? ''
            );
            $r = trim((string)($it['duration'] ?? ''));

            if ($u && $t && strpos($u, '/videos/') !== false) {
                $out[$u] = [
                    'vod_id'      => $u,
                    'vod_name'    => html_entity_decode($t, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                    'vod_pic'     => $p,
                    'vod_remarks' => $r,
                ];
            }
        }
    }

    // 2) 从 JSON 字符串片段里抓 pageURL/title/thumbURL
    if (empty($out)) {
        $reg = '/"pageURL":"(\/[^"]*?)".*?"title":"((?:\\\\.|[^"\\\\])*)".*?"thumbURL(?:169)?":"((?:\\\\.|[^"\\\\])*)"/is';
        if (preg_match_all($reg, $html, $m, PREG_SET_ORDER)) {
            foreach ($m as $x) {
                $u = $this->normalizeUrl(stripslashes($x[1]));
                $t = html_entity_decode(stripslashes($x[2]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $p = $this->normalizeImg(str_replace('\\/', '/', stripslashes($x[3])));

                if ($u && $t && strpos($u, '/videos/') !== false) {
                    $out[$u] = [
                        'vod_id'      => $u,
                        'vod_name'    => trim($t),
                        'vod_pic'     => $p,
                        'vod_remarks' => '',
                    ];
                }
            }
        }
    }

    // 3) HTML 卡片兜底：href + 内部 img/source/poster
    if (empty($out)) {
        $regA = '/<a[^>]+href="(\/videos\/[^"]+|https?:\/\/[^"]+\/videos\/[^"]+)"[^>]*>(.*?)<\/a>/is';
        if (preg_match_all($regA, $html, $am, PREG_SET_ORDER)) {
            foreach ($am as $a) {
                $u = $this->normalizeUrl(html_entity_decode($a[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                $block = $a[2];

                $title = '';
                if (preg_match('/title="([^"]+)"/i', $a[0], $tm)) {
                    $title = html_entity_decode($tm[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                }
                if (!$title) {
                    $title = trim(strip_tags($block));
                }

                $img = $this->extractImgFromHtmlBlock($block);

                if ($u && $title) {
                    $out[$u] = [
                        'vod_id'      => $u,
                        'vod_name'    => mb_substr($title, 0, 80),
                        'vod_pic'     => $img,
                        'vod_remarks' => '',
                    ];
                }
            }
        }
    }

    return array_values($out);
}

// 新增：从一个 HTML 块里提图
private function extractImgFromHtmlBlock($block)
{
    // 常见顺序：data-src > src > poster > srcset
    $regs = [
        '/<(?:img|source)[^>]+data-src="([^"]+)"/i',
        '/<(?:img|source)[^>]+src="([^"]+)"/i',
        '/<(?:img|video)[^>]+poster="([^"]+)"/i',
        '/<(?:img|source)[^>]+srcset="([^"]+)"/i',
    ];

    foreach ($regs as $reg) {
        if (preg_match($reg, $block, $m)) {
            $raw = html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');

            // srcset 取第一个 URL
            if (strpos($raw, ',') !== false) {
                $raw = trim(explode(',', $raw)[0]);
            }
            if (strpos($raw, ' ') !== false) {
                $raw = trim(explode(' ', $raw)[0]);
            }

            $raw = str_replace('\\/', '/', $raw);
            return $this->normalizeImg($raw);
        }
    }
    return '';
}

    // 播放地址解析：JSON优先，正则兜底
    private function parsePlayUrls($html)
    {
        $urls = [];
        $uniq = [];

        // A) 从 initials JSON 拿 xplayerSettings
        $data = $this->extractInitialsData($html);
        $sources = $this->arrGet($data, ['xplayerSettings', 'sources', 'standard', 'h264'], []);
        if (!is_array($sources) || empty($sources)) {
            $sources = $this->arrGet($data, ['xplayerSettings', 'sources', 'h264'], []);
        }

        if (is_array($sources)) {
            foreach ($sources as $it) {
                $q = trim((string)($it['quality'] ?? ''));
                $u = trim((string)($it['url'] ?? ''));
                $f = trim((string)($it['fallback'] ?? ''));

                if ($u !== '' && !isset($uniq[$u])) {
                    $name = $q ?: '播放';
                    if ($q === 'auto' && $f) {
                        $urls[] = '4k①$' . $u;
                        if (!isset($uniq[$f])) {
                            $urls[] = '4k②$' . $f;
                            $uniq[$f] = 1;
                        }
                        $uniq[$u] = 1;
                        continue;
                    }
                    $urls[] = $name . '$' . $u;
                    $uniq[$u] = 1;
                }
            }
        }

        // B) 正则兜底（抓 quality/url）
        if (empty($urls)) {
            $reg = '/"quality":"([^"]+)".*?"url":"(https?:\\\\?\/\\\\?\/[^"]+)"/is';
            if (preg_match_all($reg, $html, $mm, PREG_SET_ORDER)) {
                foreach ($mm as $x) {
                    $q = $x[1];
                    $u = str_replace('\/', '/', $x[2]);
                    $u = stripslashes($u);
                    if (!isset($uniq[$u])) {
                        $urls[] = $q . '$' . $u;
                        $uniq[$u] = 1;
                    }
                }
            }
        }

        return $urls;
    }

    private function extractInitialsData($html)
    {
        if (!$html) return [];

        $script = '';

        // 优先 id=initials-script
        if (preg_match('/<script[^>]*id=["\']initials-script["\'][^>]*>(.*?)<\/script>/is', $html, $m)) {
            $script = trim($m[1]);
        }

        // 备选 window.xxx = {...}
        if ($script === '' && preg_match('/window\.[a-zA-Z0-9_]+\s*=\s*(\{.*?\})\s*;?\s*<\/script>/is', $html, $m2)) {
            $script = trim($m2[1]);
        }

        if ($script === '') return [];

        $script = html_entity_decode($script, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $script = preg_replace('/^\s*window\.[a-zA-Z0-9_]+\s*=\s*/', '', $script);
        $script = preg_replace('/;\s*$/', '', $script);

        // 页面偶发混入标签
        $script = preg_replace('/<div[^>]*>.*?<\/div>/is', '', $script);
        $script = preg_replace('/<span[^>]*>.*?<\/span>/is', '', $script);

        $l = strpos($script, '{');
        $r = strrpos($script, '}');
        if ($l !== false && $r !== false && $r > $l) {
            $script = substr($script, $l, $r - $l + 1);
        }

        $json = json_decode($script, true);
        return is_array($json) ? $json : [];
    }

    private function normalizeUrl($url)
    {
        $url = trim((string)$url);
        if ($url === '') return '';
        if (strpos($url, 'http') === 0) return $url;
        if (strpos($url, '/') !== 0) $url = '/' . $url;
        return $this->HOST . $url;
    }

    private function normalizeImg($img)
    {
        $img = trim((string)$img);
        if ($img === '') return '';
        if (strpos($img, '//') === 0) return 'https:' . $img;
        if (strpos($img, 'http') === 0) return $img;
        if (strpos($img, '/') === 0) return $this->HOST . $img;
        return $img;
    }

    private function arrGet($arr, $path, $default = null)
    {
        $cur = $arr;
        foreach ($path as $k) {
            if (!is_array($cur) || !array_key_exists($k, $cur)) {
                return $default;
            }
            $cur = $cur[$k];
        }
        return $cur;
    }

    private function matchOne($html, $reg, $idx = 1)
    {
        if (preg_match($reg, $html, $m)) {
            return html_entity_decode(trim($m[$idx]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        return '';
    }
}

(new Spider())->run();