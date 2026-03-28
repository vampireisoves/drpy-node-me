<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {

    public function getName() {
        return "包子漫画";
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
            "Referer" => "https://cn.bzmanga.com/"
        ];
    }

    public function homeContent($filter) {
        $classes = [
            ["type_name" => "最新上架", "type_id" => "new"],
            ["type_name" => "全部漫画", "type_id" => "all"],
            ["type_name" => "地区", "type_id" => "region"],
            ["type_name" => "进度", "type_id" => "status"],
            ["type_name" => "题材", "type_id" => "type"]
        ];
        
        $filters = [];
        $filters['region'] = [["key" => "val", "name" => "地区", "value" => [["n" => "国漫", "v" => "cn"],["n" => "日本", "v" => "jp"],["n" => "欧美", "v" => "en"]]]];
        $filters['status'] = [["key" => "val", "name" => "进度", "value" => [["n" => "连载中", "v" => "serial"],["n" => "已完结", "v" => "pub"]]]];
        
        $types = [
            ["n" => "都市", "v" => "dushi"], ["n" => "冒险", "v" => "mouxian"],
            ["n" => "热血", "v" => "rexie"], ["n" => "爱情", "v" => "aiqing"],
            ["n" => "恋爱", "v" => "lianai"], ["n" => "耽美", "v" => "danmei"],
            ["n" => "武侠", "v" => "wuxia"], ["n" => "格斗", "v" => "gedou"],
            ["n" => "科幻", "v" => "kehuan"], ["n" => "魔幻", "v" => "mohuan"],
            ["n" => "侦探", "v" => "zhentan"], ["n" => "推理", "v" => "tuili"],
            ["n" => "玄幻", "v" => "xuanhuan"], ["n" => "日常", "v" => "richang"],
            ["n" => "生活", "v" => "shenghuo"], ["n" => "搞笑", "v" => "gaoxiao"],
            ["n" => "校园", "v" => "xiaoyuan"], ["n" => "奇幻", "v" => "qihuan"]
        ];
        $filters['type'] = [["key" => "val", "name" => "类型", "value" => $types]];
        
        return ["class" => $classes, "filters" => $filters];
    }

    public function homeVideoContent() {
        return $this->categoryContent("new", 1, [], []);
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        if ($tid == "new") {
            $url = ($pg == 1) ? "https://cn.bzmanga.com/list/new/" : "https://cn.bzmanga.com/list/new/?page={$pg}";
        } elseif ($tid == "all") {
            $url = "https://cn.bzmanga.com/classify?page={$pg}";
        } else {
            $val = $extend['val'] ?? '';
            if (!$val) {
                if ($tid == "region") $val = "cn";
                elseif ($tid == "status") $val = "serial";
                elseif ($tid == "type") $val = "dushi";
            }
            
            $paramKey = $tid;
            if ($tid == "status") $paramKey = "state";
            
            $url = "https://cn.bzmanga.com/classify?{$paramKey}={$val}&page={$pg}";
        }

        try {
            $html = $this->fetch($url, ['headers' => $this->getHeader()]);
            $items = $this->pdfa($html, '.comics-card');
            
            $videos = [];
            foreach ($items as $item) {
                $vid = $this->pd($item, 'a.comics-card__poster&&href');
                if (!$vid) continue;
                
                $cover = $this->pd($item, 'amp-img&&src');
                if (strpos($cover, ".w=") !== false) {
                    $cover = explode('.w=', $cover)[0];
                }
                
                $name = $this->pd($item, '.comics-card__title&&Text');
                
                $videos[] = [
                    "vod_id" => $vid,
                    "vod_name" => $name,
                    "vod_pic" => $cover,
                    "vod_remarks" => ""
                ];
            }
            
            return [
                "list" => $videos,
                "page" => $pg,
                "pagecount" => 9999,
                "limit" => 36,
                "total" => 999999
            ];
        } catch (Exception $e) {
            return ["list" => []];
        }
    }

    public function detailContent($ids) {
        $vid = $ids[0];
        $url = (strpos($vid, 'http') === 0) ? $vid : "https://cn.bzmanga.com{$vid}";
        
        try {
            $html = $this->fetch($url, ['headers' => $this->getHeader()]);
            
            $name = $this->pd($html, '.comics-detail__title&&Text') ?: "未知";
            $author = $this->pd($html, '.comics-detail__author&&Text');
            $desc = $this->pd($html, '.comics-detail__desc&&Text');
            
            $cover = $this->pd($html, 'amp-img&&src');
            if (strpos($cover, ".w=") !== false) {
                $cover = explode('.w=', $cover)[0];
            }

            $chapterItems = $this->pdfa($html, '.comics-chapters__item');
            
            $rawUrlList = [];
            foreach ($chapterItems as $item) {
                $aTag = $this->pd($item, 'a', true); // get element
                if (!$aTag && strpos($item, '<a') === 0) { // simple check if item itself is a tag
                    // HtmlParser doesn't fully support item itself as root sometimes, depend on implementation
                    // Let's assume pdfa returns inner HTML or node. 
                    // BaseSpider pdfa returns array of strings (html fragments) usually.
                    // So we can re-parse item
                }
                
                $chapterName = $this->pd($item, 'a&&Text');
                if (!$chapterName) $chapterName = $this->pd($item, 'Text'); // fallback if item is 'a'
                
                $rawHref = $this->pd($item, 'a&&href');
                if (!$rawHref) $rawHref = $this->pd($item, 'href');

                if (!$chapterName || !$rawHref) continue;

                $realChapterUrl = "";
                
                if (preg_match('/comic_id=(\d+).*chapter_slot=(\d+)/', $rawHref, $matches)) {
                    $cId = $matches[1];
                    $cSlot = $matches[2];
                    $realChapterUrl = "https://cn.dzmanga.com/comic/chapter/{$cId}/0_{$cSlot}.html";
                } else {
                    if (strpos($rawHref, "/") === 0) {
                        $realChapterUrl = "https://cn.dzmanga.com{$rawHref}";
                    } elseif (strpos($rawHref, "http") !== false) {
                        $realChapterUrl = str_replace("cn.bzmanga.com", "cn.dzmanga.com", $rawHref);
                    } else {
                        $realChapterUrl = "https://cn.dzmanga.com/{$rawHref}";
                    }
                }
                
                $rawUrlList[] = "{$chapterName}\${$realChapterUrl}";
            }
            
            $descList = $rawUrlList;
            $ascList = array_reverse($rawUrlList);
            
            $strDesc = implode("#", $descList);
            $strAsc = implode("#", $ascList);
            
            return [
                "list" => [[
                    "vod_id" => $vid,
                    "vod_name" => $name,
                    "vod_pic" => $cover,
                    "type_name" => "漫画",
                    "vod_year" => "",
                    "vod_area" => "",
                    "vod_remarks" => $author,
                    "vod_actor" => "",
                    "vod_director" => "",
                    "vod_content" => $desc,
                    "vod_play_from" => '正序$$$倒序', 
                    "vod_play_url" => "{$strAsc}$$$" . $strDesc
                ]]
            ];
        } catch (Exception $e) {
            return ["list" => []];
        }
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $url = "https://cn.bzmanga.com/search?q={$key}";
        try {
            $html = $this->fetch($url, ['headers' => $this->getHeader()]);
            $items = $this->pdfa($html, '.comics-card');
            
            $videos = [];
            foreach ($items as $item) {
                $vid = $this->pd($item, 'a.comics-card__poster&&href');
                if (!$vid) continue;
                
                $cover = $this->pd($item, 'amp-img&&src');
                if (strpos($cover, ".w=") !== false) {
                    $cover = explode('.w=', $cover)[0];
                }
                
                $name = $this->pd($item, '.comics-card__title&&Text');
                
                $videos[] = [
                    "vod_id" => $vid,
                    "vod_name" => $name,
                    "vod_pic" => $cover,
                    "vod_remarks" => ""
                ];
            }
            return ['list' => $videos];
        } catch (Exception $e) {
            return ['list' => []];
        }
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $url = $id;
        $headers = $this->getHeader();
        $headers['Referer'] = $url;
        
        try {
            $html = $this->fetch($url, ['headers' => $headers]);
            
            $imgList = [];
            
            // 策略A：DOM解析
            $container = $this->pd($html, '.comic-contain', true);
            if (!$container) {
                // simple body check, or just parse whole html
                // HtmlParser usually handles whole html if no selector matched for subset
            }
            
            $imgs = [];
            if ($container) {
                // If we had a specific object for container, we'd use it. 
                // But base spider pd/pdfa usually works on string.
                // So let's just search in html
            }
            
            // Use regex for specific container if possible, but here we can just try global selector on html
            // but restricted by container class if we could.
            // Simplified: Global search with selector
            $imgs = $this->pdfa($html, '.comic-contain amp-img');
            if (empty($imgs)) {
                $imgs = $this->pdfa($html, '.comic-contain img');
            }
            // If still empty, try body (global)
            if (empty($imgs)) {
                 $imgs = $this->pdfa($html, 'amp-img');
                 if (empty($imgs)) $imgs = $this->pdfa($html, 'img');
            }
            
            foreach ($imgs as $img) {
                $src = $this->pd($img, 'src');
                if (!$src) $src = $this->pd($img, 'data-src');
                
                if ($src) {
                    if (strpos($src, "next_chapter") !== false || strpos($src, "prev_chapter") !== false || strpos($src, "icon") !== false || strpos($src, "logo") !== false) {
                        continue;
                    }
                    if (strpos($src, "//") === 0) {
                        $src = "https:" . $src;
                    }
                    $imgList[] = $src;
                }
            }
            
            // 策略B：暴力正则
            if (count($imgList) < 2) {
                if (preg_match_all('/(https?:\/\/[^"\'\s]+static[^"\'\s]+\.(?:jpg|png|webp|jpeg)(?:\?[^"\'\s]*)?)/', $html, $matches)) {
                    foreach ($matches[1] as $m) {
                        if (!in_array($m, $imgList)) {
                            if (strpos($m, "cover") !== false) continue;
                            if (strpos($m, "icon") !== false) continue;
                            if (strpos($m, "logo") !== false) continue;
                            if (strpos($m, "bg") !== false) continue;
                            $imgList[] = $m;
                        }
                    }
                }
            }
            
            $uniqueImgs = array_unique($imgList);
            $novelData = implode("&&", $uniqueImgs);
            
            return [
                "parse" => 0,
                "playUrl" => "",
                "url" => "pics://{$novelData}",
                "header" => ""
            ];
        } catch (Exception $e) {
            return ["parse" => 0, "url" => "", "header" => ""];
        }
    }
}

(new Spider())->run();
