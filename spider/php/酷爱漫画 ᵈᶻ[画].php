<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    
    public function getName() {
        return "酷爱漫画";
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
            "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.203 Safari/537.36",
            "Referer" => "https://www.kuimh.com/"
        ];
    }

    public function homeContent($filter) {
        $classes = [
            ["type_name" => "国产", "type_id" => "1"],
            ["type_name" => "日本", "type_id" => "2"],
            ["type_name" => "韩国", "type_id" => "3"],
            ["type_name" => "欧美", "type_id" => "5"],
            ["type_name" => "其他", "type_id" => "7"],
            ["type_name" => "日韩", "type_id" => "8"]
        ];
        
        $tags = ["全部", "恋爱", "古风", "校园", "奇幻", "大女主", "治愈", "穿越", "励志", "爆笑", "萌系", "玄幻", "日常", "都市", "彩虹", "灵异", "悬疑", "少年"];
        $tagValues = [];
        foreach ($tags as $t) {
            $tagValues[] = ["n" => $t, "v" => $t];
        }
        $filterConfig = [
            "key" => "tag",
            "name" => "题材",
            "value" => $tagValues
        ];
        
        $statusConfig = [
            "key" => "end",
            "name" => "状态",
            "value" => [
                ["n" => "全部", "v" => "-1"],
                ["n" => "连载", "v" => "0"],
                ["n" => "完结", "v" => "1"]
            ]
        ];
        
        $filters = [];
        foreach ($classes as $c) {
            $filters[$c['type_id']] = [$filterConfig, $statusConfig];
        }

        return ["class" => $classes, "filters" => $filters];
    }

    public function homeVideoContent() {
        return $this->categoryContent("1", 1, [], []);
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $tag = urlencode($extend['tag'] ?? '全部');
        $end = $extend['end'] ?? '-1';
        $url = "https://www.kuimh.com/booklist?tag={$tag}&area={$tid}&end={$end}&page={$pg}";
        
        try {
            $html = $this->fetch($url, ['headers' => $this->getHeader()]);
            $items = $this->pdfa($html, '.mh-item');
            
            $videos = [];
            foreach ($items as $item) {
                $vid = $this->pd($item, 'a&&href');
                $style = $this->pd($item, 'p&&style');
                $cover = "";
                if (preg_match('/url\((.*?)\)/', $style, $matches)) {
                    $cover = $matches[1];
                }
                
                // 尝试提取名称，Python逻辑是取第二个a标签，这里简化
                $name = $this->pd($item, 'a:eq(1)&&Text');
                if (!$name) {
                    $name = $this->pd($item, '.title a&&Text');
                }
                if (!$name) {
                    $name = $this->pd($item, 'a&&title');
                }
                if (!$name) {
                    $name = $this->pd($item, 'Text');
                }

                $videos[] = [
                    "vod_id" => $vid,
                    "vod_name" => trim($name),
                    "vod_pic" => $cover,
                    "vod_remarks" => ""
                ];
            }
            
            return [
                "list" => $videos,
                "page" => $pg,
                "pagecount" => 9999,
                "limit" => 30,
                "total" => 999999
            ];
        } catch (Exception $e) {
            return ["list" => []];
        }
    }

    public function detailContent($ids) {
        $vid = $ids[0];
        $url = (strpos($vid, 'http') === 0) ? $vid : "https://www.kuimh.com{$vid}";
        
        try {
            $html = $this->fetch($url, ['headers' => $this->getHeader()]);
            
            $name = $this->pd($html, '.info h1&&Text');
            $cover = $this->pd($html, '.cover img&&src');
            $desc = $this->pd($html, '.content p&&Text');
            
            $chapterList = $this->pdfa($html, '.mCustomScrollBox li a');
            if (empty($chapterList)) {
                $chapterList = $this->pdfa($html, '#detail-list-select li a');
            }
            
            $vodPlayUrlList = [];
            foreach ($chapterList as $chapter) {
                $chapterName = $this->pd($chapter, 'a&&Text');
                $chapterHref = $this->pd($chapter, 'a&&href');
                
                if (!$chapterHref) continue;
                
                $vodPlayUrlList[] = "{$chapterName}\${$chapterHref}";
            }
            
            $playUrlStr = implode("#", $vodPlayUrlList);
            
            return [
                "list" => [[
                    "vod_id" => $vid,
                    "vod_name" => $name,
                    "vod_pic" => $cover,
                    "type_name" => "漫画",
                    "vod_year" => "",
                    "vod_area" => "",
                    "vod_remarks" => "",
                    "vod_actor" => "",
                    "vod_director" => "",
                    "vod_content" => $desc,
                    "vod_play_from" => '阅读', 
                    "vod_play_url" => $playUrlStr
                ]]
            ];
        } catch (Exception $e) {
            return ["list" => []];
        }
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $key = urlencode($key);
        $url = "https://www.kuimh.com/search?keyword={$key}&page={$pg}";
        
        try {
            $html = $this->fetch($url, ['headers' => $this->getHeader()]);
            $items = $this->pdfa($html, '.mh-item');
            
            $videos = [];
            foreach ($items as $item) {
                $vid = $this->pd($item, 'a&&href');
                $style = $this->pd($item, 'p&&style');
                $cover = "";
                if (preg_match('/url\((.*?)\)/', $style, $matches)) {
                    $cover = $matches[1];
                }
                
                $name = $this->pd($item, '.title a&&title');
                if (!$name) $name = $this->pd($item, 'a&&title');
                if (!$name) $name = $this->pd($item, 'Text');

                $videos[] = [
                    "vod_id" => $vid,
                    "vod_name" => trim($name),
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
        $url = (strpos($id, 'http') === 0) ? $id : "https://www.kuimh.com{$id}";
        $headers = $this->getHeader();
        $headers['Referer'] = $url;
        
        try {
            $html = $this->fetch($url, ['headers' => $headers]);
            
            $imageList = [];
            
            // 1. DOM 解析
            $imgs = $this->pdfa($html, '.comicpage img');
            if (empty($imgs)) {
                $imgs = $this->pdfa($html, '.comiclist img');
            }
            
            foreach ($imgs as $img) {
                $src = $this->pd($img, 'data-echo');
                if (!$src) $src = $this->pd($img, 'data-src');
                if (!$src) $src = $this->pd($img, 'data-original');
                if (!$src) $src = $this->pd($img, 'src');
                
                if ($src) $imageList[] = $src;
            }
            
            // 2. data-echo 全局查找
            if (empty($imageList)) {
                $allLazyImgs = $this->pdfa($html, 'img[data-echo]');
                foreach ($allLazyImgs as $img) {
                    $src = $this->pd($img, 'data-echo');
                    if ($src && !in_array($src, $imageList)) {
                        $imageList[] = $src;
                    }
                }
            }
            
            // 3. 正则兜底
            if (empty($imageList)) {
                if (preg_match_all('/(https?:\/\/[^"\'\\\\]+\.(?:jpg|png|jpeg|webp))/', $html, $matches)) {
                    foreach ($matches[1] as $m) {
                        $imageList[] = $m;
                    }
                }
            }
            
            // 4. 过滤与去重
            $uniqueImages = [];
            foreach ($imageList as $i) {
                if (in_array($i, $uniqueImages)) continue;
                if (strpos($i, "grey.gif") !== false) continue;
                if (strpos($i, "logo") !== false) continue;
                if (strpos($i, "icon") !== false) continue;
                if (strpos($i, "tu.petatt.cn") !== false) continue;
                
                $uniqueImages[] = $i;
            }
            
            $novelData = implode("&&", $uniqueImages);
            
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
