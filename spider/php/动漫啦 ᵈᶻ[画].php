<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {

    public function getName() {
        return "动漫啦";
    }

    public function init($extend = "") {
        // pass
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
            "Referer" => "https://www.dongman.la/",
            "Connection" => "keep-alive"
        ];
    }

    private function fetchHtml($url) {
        // 忽略 SSL 验证
        $options = [
            'headers' => $this->getHeader()
        ];
        return $this->fetch($url, $options);
    }

    public function homeContent($filter) {
        $cats = [];
        try {
            $html = $this->fetchHtml("https://www.dongman.la/");
            if (preg_match('/<div class="cy_subnav">(.*?)<\/div>/s', $html, $matches)) {
                if (preg_match_all('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/s', $matches[1], $links, PREG_SET_ORDER)) {
                    foreach ($links as $link) {
                        $href = $link[1];
                        $title = trim($link[2]);
                        if (strpos($title, "首页") !== false) continue;
                        
                        $typeId = trim(str_replace("https://www.dongman.la", "", $href), "/");
                        $cats[] = ["type_name" => $title, "type_id" => $typeId];
                    }
                }
            }
        } catch (Exception $e) {
            // pass
        }

        if (empty($cats)) {
            $cats = [
                ["type_name" => "连载中", "type_id" => "manhua/list/lianzai"],
                ["type_name" => "已完结", "type_id" => "manhua/list/wanjie"],
                ["type_name" => "热血", "type_id" => "manhua/list/rexue"],
                ["type_name" => "恋爱", "type_id" => "manhua/list/lianai"],
                ["type_name" => "冒险", "type_id" => "manhua/list/maoxian"],
                ["type_name" => "搞笑", "type_id" => "manhua/list/gaoxiao"]
            ];
        }

        return ["class" => $cats, "filters" => []];
    }

    public function homeVideoContent() {
        return $this->categoryContent("manhua/list/lianzai", 1, [], []);
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $tid = trim($tid, '/');
        $url = "https://www.dongman.la/{$tid}/{$pg}.html";
        return $this->getPostListByRegex($url, $pg);
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $url = "https://www.dongman.la/manhua/so/{$key}/{$pg}.html";
        return $this->getPostListByRegex($url, $pg);
    }

    private function getPostListByRegex($url, $pg) {
        try {
            $html = $this->fetchHtml($url);
            if (!$html) return ["list" => []];
            
            $vlist = [];
            $listHtml = "";
            
            // 提取列表容器
            if (preg_match('/(?:class=["\']cy_list_mh["\']|id=["\']contaner["\'])[^>]*>(.*?)<div class="cy_page/s', $html, $match)) {
                $listHtml = $match[1];
            } else {
                $listHtml = $html;
            }

            if (preg_match_all('/<li[^>]*>(.*?)<\/li>/s', $listHtml, $items)) {
                foreach ($items[1] as $item) {
                    if (strpos($item, 'class="title"') === false && strpos($item, 'class="pic"') === false) continue;
                    
                    if (!preg_match('/href=["\']([^"\']+)["\']/', $item, $hrefMatch)) continue;
                    $href = $hrefMatch[1];
                    
                    if (strpos($href, "javascript") !== false || in_array($href, ["/", "#"])) continue;
                    
                    // 提取名称
                    $name = "";
                    if (preg_match('/<b>(.*?)<\/b>/s', $item, $bMatch)) {
                        $name = trim($bMatch[1]);
                    } elseif (preg_match('/class=["\']pic["\'][^>]*title=["\']([^"\']+)["\']/', $item, $tMatch)) {
                        $name = $tMatch[1];
                    } elseif (preg_match('/alt=["\']([^"\']+)["\']/', $item, $altMatch)) {
                        $name = trim($altMatch[1]);
                    }
                    
                    $name = trim(strip_tags($name));
                    $name = str_replace(["漫画", "在线观看"], "", $name);
                    if (!$name) continue;
                    
                    // 提取图片
                    $pic = "";
                    if (preg_match('/(?:data-src|src)=["\']([^"\']+)["\']/', $item, $imgMatch)) {
                        $pic = $imgMatch[1];
                        if (strpos($pic, "//") === 0) $pic = "https:" . $pic;
                    }
                    
                    // 提取备注
                    $remark = "";
                    if (preg_match('/<p[^>]*>(.*?)<\/p>/s', $item, $pMatch)) {
                        // 确保不是 title 里的部分
                        $tempItem = explode($pMatch[0], $item)[0];
                        if (strpos($tempItem, 'title') === false) {
                            $remark = trim(strip_tags($pMatch[1]));
                        }
                    }
                    
                    if (!$remark && preg_match('/class=["\']tt["\'][^>]*>(.*?)<\/span>/', $item, $ttMatch)) {
                        $remark = trim($ttMatch[1]);
                    }
                    
                    $vlist[] = [
                        'vod_id' => $href,
                        'vod_name' => $name,
                        'vod_pic' => $pic,
                        'vod_remarks' => $remark
                    ];
                }
            }
            
            return ["list" => $vlist, "page" => $pg, "pagecount" => 9999, "limit" => 30, "total" => 999999];
        } catch (Exception $e) {
            return ["list" => []];
        }
    }

    public function detailContent($ids) {
        $vid = $ids[0];
        $url = (strpos($vid, 'http') === 0) ? $vid : "https://www.dongman.la{$vid}";
        
        try {
            $html = $this->fetchHtml($url);
            
            $name = "";
            if (preg_match('/<h1[^>]*>(.*?)<\/h1>/s', $html, $h1Match)) {
                $name = trim(strip_tags($h1Match[1]));
            }
            
            if (!$name && preg_match('/<title>(.*?)<\/title>/s', $html, $titleMatch)) {
                $parts = explode('-', $titleMatch[1]);
                $parts = explode('_', $parts[0]);
                $name = trim($parts[0]);
            }
            
            $name = trim(str_replace(["漫画", "在线观看", "免费阅读"], "", $name)) ?: "未知漫画";
            
            $cover = "";
            if (preg_match('/<img[^>]*class=["\'](?:detail-info-cover|pic)["\'][^>]*src=["\']([^"\']+)["\']/', $html, $coverMatch) || 
                preg_match('/<img[^>]*src=["\']([^"\']+)["\'][^>]*class=["\'](?:detail-info-cover|pic)["\']/', $html, $coverMatch)) {
                $cover = $coverMatch[1];
                if (strpos($cover, "//") === 0) $cover = "https:" . $cover;
            }
            
            $desc = "";
            if (preg_match('/id="comic-description"[^>]*>(.*?)<\/div>/s', $html, $descMatch)) {
                $desc = trim(strip_tags($descMatch[1]));
                $desc = str_replace(["&nbsp;", "详细简介↓", "收起↑"], [" ", "", ""], $desc);
                $desc = preg_replace('/\s+/', ' ', $desc);
            }
            
            // 提取章节
            $linksSource = $html;
            if (preg_match_all('/<(?:ul|ol)[^>]*class=["\'].*?list.*?["\'][^>]*>(.*?)<\/(?:ul|ol)>/s', $html, $listContainers)) {
                $linksSource = implode("", $listContainers[1]);
            }
            
            $chapterList = [];
            $uniqueChapters = [];
            
            if (preg_match_all('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/s', $linksSource, $rawLinks, PREG_SET_ORDER)) {
                foreach ($rawLinks as $link) {
                    $href = $link[1];
                    $text = $link[2];
                    
                    if (strpos($href, "/chapter/") === false && !preg_match('/\d+\.html/', $href)) continue;
                    if (strpos($href, "detail") !== false) continue;
                    
                    $title = trim(strip_tags($text));
                    if (!$title || strpos($title, "在线阅读") !== false || strpos($title, "开始阅读") !== false) continue;
                    
                    if (!in_array($href, $uniqueChapters)) {
                        $uniqueChapters[] = $href;
                        $chapterList[] = "{$title}\${$href}";
                    }
                }
            }
            
            $chapterList = array_reverse($chapterList);
            $playUrl = implode("#", $chapterList);
            
            return [
                "list" => [[
                    "vod_id" => $vid,
                    "vod_name" => $name,
                    "vod_pic" => $cover,
                    "type_name" => "漫画",
                    "vod_content" => $desc,
                    "vod_play_from" => '动漫啦', 
                    "vod_play_url" => $playUrl
                ]]
            ];
        } catch (Exception $e) {
            return ["list" => []];
        }
    }

    private function extractImgs($htmlText) {
        $found = [];
        // RE_PLAY_IMGS
        if (preg_match_all('/(?:data-original|data-src|src)=["\']([^"\']+\.(?:jpg|png|jpeg|webp))[^"\']*["\']/i', $htmlText, $matches)) {
            foreach ($matches[1] as $src) {
                if (preg_match('/(logo|icon|cover|banner|\.gif|loading)/', $src)) continue;
                
                if (strpos($src, "//") === 0) {
                    $src = "https:" . $src;
                } elseif (strpos($src, "/") === 0) {
                    $src = "https://www.dongman.la" . $src;
                } elseif (strpos($src, "http") !== 0) {
                    continue;
                }
                
                if (!in_array($src, $found)) {
                    $found[] = $src;
                }
            }
        }
        return $found;
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $url = (strpos($id, 'http') === 0) ? $id : "https://www.dongman.la{$id}";
        
        $cleanUrl = rtrim(str_replace('.html', '', $url), '/');
        $allUrl = "{$cleanUrl}/all.html";
        
        $imgList = [];
        
        // 1. 尝试 all.html
        try {
            $html = $this->fetchHtml($allUrl);
            if ($html) {
                $imgList = $this->extractImgs($html);
            }
        } catch (Exception $e) {
            // pass
        }
        
        // 2. 失败则循环抓取 (限制前40页)
        if (empty($imgList)) {
            $imageMap = [];
            // PHP 串行抓取
            for ($i = 1; $i < 40; $i++) {
                $targetUrl = ($i == 1) ? $url : "{$cleanUrl}/{$i}.html";
                try {
                    $resHtml = $this->fetchHtml($targetUrl);
                    if ($resHtml) {
                        $imgs = $this->extractImgs($resHtml);
                        if (!empty($imgs)) {
                            $imageMap[$i] = $imgs[0];
                        } else {
                             // 如果某一页抓不到图片，可能就是结束了，或者反爬，这里可以考虑 break
                             // 但是为了保险起见，Python 是并发抓取所有，这里我们也继续尝试
                        }
                    } else {
                        // 404 or error likely means end of chapter
                        break; 
                    }
                } catch (Exception $e) {
                    break;
                }
            }
            
            for ($i = 1; $i < 40; $i++) {
                if (isset($imageMap[$i])) {
                    $imgList[] = $imageMap[$i];
                }
            }
        }

        if (empty($imgList)) {
            // webview fallback
            return ['parse' => 1, 'url' => $url, 'header' => json_encode($this->getHeader())];
        }

        $novelData = implode("&&", $imgList);
        
        return [
            "parse" => 0,
            "playUrl" => "",
            "url" => "pics://{$novelData}",
            "header" => ""
        ];
    }
}

(new Spider())->run();
