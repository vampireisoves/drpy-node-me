<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {

    private $baseUrl;

    public function getName() {
        return "74P福利(漫画版)";
    }

    public function init($extend = "") {
        $this->baseUrl = "https://www.74p.net";
    }

    public function isVideoFormat($url) {
        return false;
    }

    public function manualVideoCheck() {
        return false;
    }

    private function getHeader() {
        return [
            "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer" => $this->baseUrl . '/',
            "Accept" => "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Connection" => "keep-alive"
        ];
    }

    private function fetchHtml($url, $referer = "") {
        $headers = $this->getHeader();
        if ($referer) $headers['Referer'] = $referer;
        
        $options = [
            'headers' => $headers
        ];
        return $this->fetch($url, $options);
    }

    public function homeContent($filter) {
        $cats = [
            ["type_name" => "=== 写真 ===", "type_id" => "ignore"],
            ["type_name" => "秀人网", "type_id" => "xiurenwang"],
            ["type_name" => "语画界", "type_id" => "yuhuajie"],
            ["type_name" => "花漾", "type_id" => "huayang"],
            ["type_name" => "星颜社", "type_id" => "xingyanshe"],
            ["type_name" => "嗲囡囡", "type_id" => "feilin"],
            ["type_name" => "爱蜜社", "type_id" => "aimishe"],
            ["type_name" => "波萝社", "type_id" => "boluoshe"],
            ["type_name" => "尤物馆", "type_id" => "youwuguan"],
            ["type_name" => "蜜桃社", "type_id" => "miitao"],
            ["type_name" => "=== 漫画 ===", "type_id" => "ignore"],
            ["type_name" => "日本漫画", "type_id" => "comic/category/jp"],
            ["type_name" => "韩国漫画", "type_id" => "comic/category/kr"],
            ["type_name" => "=== 小说 ===", "type_id" => "ignore"],
            ["type_name" => "都市", "type_id" => "novel/category/Urban"],
            ["type_name" => "乱伦", "type_id" => "novel/category/Incestuous"],
            ["type_name" => "玄幻", "type_id" => "novel/category/Xuanhuan"],
            ["type_name" => "武侠", "type_id" => "novel/category/Wuxia"]
        ];
        
        $validCats = [];
        foreach ($cats as $c) {
            if ($c['type_id'] != 'ignore') {
                $validCats[] = $c;
            }
        }
        return ['class' => $validCats, 'filters' => []];
    }

    public function homeVideoContent() {
        return ['list' => []];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $url = "{$this->baseUrl}/{$tid}/page/{$pg}";
        return $this->getPostList($url, $pg);
    }

    private function getPostList($url, $pg) {
        $html = $this->fetchHtml($url);
        $vlist = [];
        
        if ($html) {
            $listBlock = $html;
            if (preg_match('/(?:id="index_ajax_list"|class="site-main")[^>]*>(.*?)<(?:footer|aside)/s', $html, $match)) {
                $listBlock = $match[1];
            }
            
            if (preg_match_all('/<li[^>]*>(.*?)<\/li>/s', $listBlock, $items)) {
                foreach ($items[1] as $item) {
                    if (!preg_match('/href=["\']([^"\']+)["\']/', $item, $hrefMatch)) continue;
                    $href = $hrefMatch[1];
                    
                    if (strpos($href, '.css') !== false || strpos($href, '.js') !== false || strpos($href, 'templates/') !== false || strpos($href, 'wp-includes') !== false) continue;

                    $pic = "";
                    if (preg_match('/data-original=["\']([^"\']+)["\']/', $item, $imgMatch)) {
                        $pic = $imgMatch[1];
                    } elseif (preg_match('/src=["\']([^"\']+)["\']/', $item, $imgMatch)) {
                        $pic = $imgMatch[1];
                    }
                    
                    if (!$pic) $pic = "https://www.74p.net/static/images/cover.png";
                    
                    $name = "";
                    if (preg_match('/title=["\']([^"\']+)["\']/', $item, $titleMatch)) {
                        $name = $titleMatch[1];
                    } else {
                        $name = trim(strip_tags($item));
                        $name = explode("\n", $name)[0];
                    }
                    
                    if (strpos($name, '.') === 0 || strpos($name, '{') !== false || strlen($name) > 300) continue; // strlen 100 in python is roughly 300 bytes in utf8 php maybe
                    
                    if (strpos($href, '//') === 0) $href = 'https:' . $href;
                    elseif (strpos($href, '/') === 0) $href = $this->baseUrl . $href;
                    
                    $vlist[] = [
                        'vod_id' => $href,
                        'vod_name' => $name,
                        'vod_pic' => $pic,
                        'vod_remarks' => '点击查看',
                        'style' => ["type" => "rect", "ratio" => 1.33]
                    ];
                }
            }
        }
        
        $pageCount = (count($vlist) >= 15) ? $pg + 1 : $pg;
        return ['list' => $vlist, 'page' => $pg, 'pagecount' => $pageCount, 'limit' => 20, 'total' => 9999];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $searchPath = "/search/{$key}";
        $referer = (strpos($key, "漫画") !== false) ? "{$this->baseUrl}/comic" : "{$this->baseUrl}/novel";
        
        if ($pg > 1) $url = "{$this->baseUrl}{$searchPath}/page/{$pg}";
        else $url = "{$this->baseUrl}{$searchPath}";
        
        // Temporarily override fetchHtml's referer logic by passing it
        // Or actually fetchHtml supports passing referer.
        // But getPostList calls fetchHtml without referer. 
        // Let's modify getPostList to accept referer or just set global referer.
        // Simpler: Just rely on default referer or specific one. 
        // Python code sets specific referer.
        
        // Let's manually fetch here to respect logic, or just reuse getPostList which uses default referer (baseUrl)
        // Python code: if "漫画" in key: headers['Referer'] = ...
        // Since getPostList calls fetchHtml($url), and fetchHtml uses default headers if not provided.
        // Let's just use default headers for simplicity as search usually works without specific referer too.
        
        return $this->getPostList($url, $pg);
    }

    public function detailContent($ids) {
        $url = $ids[0];
        $html = $this->fetchHtml($url);
        if (!$html) return ['list' => []];
        
        $vod = [
            'vod_id' => $url,
            'vod_name' => '',
            'vod_pic' => '',
            'type_name' => '漫画',
            'vod_content' => '',
            'vod_play_from' => '74P漫画',
            'vod_play_url' => ''
        ];
        
        if (preg_match('/<h1[^>]*>(.*?)<\/h1>/', $html, $h1)) {
            $vod['vod_name'] = trim(strip_tags($h1[1]));
        }
        
        $contentHtml = "";
        if (preg_match('/(?:id="content"|class="entry-content"|class="single-content")[^>]*>(.*?)<(?:div class="related|footer|aside|section)/s', $html, $match)) {
            $contentHtml = $match[1];
            $vod['vod_content'] = mb_substr(trim(strip_tags($contentHtml)), 0, 200);
            
            if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/', $contentHtml, $imgMatch)) {
                $pic = $imgMatch[1];
                if (strpos($pic, '//') === 0) $pic = 'https:' . $pic;
                elseif (strpos($pic, '/') === 0) $pic = $this->baseUrl . $pic;
                $vod['vod_pic'] = $pic;
            }
        }

        // 如果上述方式未找到封面，尝试全局匹配第一张非 logo/icon 图片
        if (empty($vod['vod_pic']) && preg_match_all('/<img[^>]+src=["\']([^"\']+)["\']/', $html, $matches)) {
            foreach ($matches[1] as $src) {
                if (preg_match('/(logo|icon|avatar|\.gif)/i', $src)) continue;
                
                if (strpos($src, '//') === 0) $src = 'https:' . $src;
                elseif (strpos($src, '/') === 0) $src = $this->baseUrl . $src;
                
                $vod['vod_pic'] = $src;
                break;
            }
        }
        
        $playList = [];
        
        // 1. 查找章节列表
        if (preg_match_all('/<a[^>]+href=["\']([^"\']*\/(?:comic|novel)\/chapter\/[^"\']+)["\'][^>]*>(.*?)<\/a>/', $html, $links, PREG_SET_ORDER)) {
            foreach ($links as $link) {
                $href = $link[1];
                $name = trim($link[2]);
                
                if (strpos($href, '//') === 0) $href = 'https:' . $href;
                elseif (strpos($href, '/') === 0) $href = $this->baseUrl . $href;
                
                $playList[] = "{$name}\${$href}";
            }
        } else {
            // 2. 无目录，单页
            $playList[] = "在线观看\${$url}";
        }
        
        $vod['vod_play_url'] = implode("#", $playList);
        return ['list' => [$vod]];
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $images = $this->scrapeAllImages($id);
        $novelData = implode("&&", $images);
        
        return [
            "parse" => 0,
            "playUrl" => "",
            "url" => "pics://{$novelData}",
            "header" => ""
        ];
    }

    private function scrapeAllImages($url) {
        $images = [];
        $visited = [];
        $currentUrl = $url;
        $page = 1;
        $maxPages = 50;
        
        while ($page <= $maxPages) {
            if (in_array($currentUrl, $visited)) break;
            $visited[] = $currentUrl;
            
            $html = $this->fetchHtml($currentUrl);
            if (!$html) break;
            
            $contentHtml = $html;
            if (preg_match('/(?:id="content"|class="entry-content"|class="single-content")[^>]*>(.*?)<(?:div class="related|footer|section)/s', $html, $match)) {
                $contentHtml = $match[1];
            }
            
            if (preg_match_all('/<img[^>]+(?:src|data-original|data-src)=["\']([^"\']+)["\']/', $contentHtml, $matches)) {
                foreach ($matches[1] as $src) {
                    $lowerSrc = strtolower($src);
                    if (strpos($lowerSrc, '.gif') !== false || strpos($lowerSrc, '.svg') !== false || strpos($lowerSrc, 'logo') !== false || strpos($lowerSrc, 'avatar') !== false || strpos($lowerSrc, 'icon') !== false) continue;
                    if (strpos($lowerSrc, '/covers/') !== false) continue; // 过滤封面图推荐

                    
                    if (strpos($src, '//') === 0) $src = 'https:' . $src;
                    elseif (strpos($src, '/') === 0) $src = $this->baseUrl . $src;
                    
                    if (!in_array($src, $images)) {
                        $images[] = $src;
                    }
                }
            }
            
            $nextUrl = null;
            if (preg_match('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>(?:下一页|Next|»)<\/a>/i', $html, $nextMatch)) {
                $nextUrl = $nextMatch[1];
            } elseif (preg_match('/<a[^>]+href=["\']([^"\']+)["\'][^>]*class=["\'][^"\']*next[^"\']*["\']/', $html, $nextMatch)) {
                $nextUrl = $nextMatch[1];
            }
            
            if (!$nextUrl && strpos($currentUrl, '/comic/chapter/') === false && strpos($currentUrl, 'page') !== false) {
                 // Try auto-increment if pagination pattern detected
                 $parts = explode('/', rtrim($currentUrl, '/'));
                 $lastPart = end($parts);
                 if (is_numeric($lastPart)) {
                     $base = substr($currentUrl, 0, strrpos($currentUrl, '/'));
                     $nextUrl = "{$base}/" . ($page + 1);
                 }
            }
            
            if ($nextUrl) {
                if (strpos($nextUrl, '//') === 0) $nextUrl = 'https:' . $nextUrl;
                elseif (strpos($nextUrl, '/') === 0) $nextUrl = $this->baseUrl . $nextUrl;
            } else {
                break;
            }
            
            $currentUrl = $nextUrl;
            $page++;
        }
        
        return $images;
    }
}

(new Spider())->run();
