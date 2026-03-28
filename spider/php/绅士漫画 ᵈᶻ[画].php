<?php
/**
 * 绅士漫画 
 */
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    
    protected const HOST = 'https://www.wn06.ru';
    
    public function getName() {
        return "绅士漫画";
    }

    public function init($extend = "") {
        $this->headers['Referer'] = self::HOST . '/';
    }

    public function homeContent($filter) {
        $classes = [
            ["type_name" => "月榜", "type_id" => "rank_month"],
            ["type_name" => "周榜", "type_id" => "rank_week"],
            ["type_name" => "日榜", "type_id" => "rank_day"],
            ["type_name" => "同人志", "type_id" => "1"],
            ["type_name" => "韩漫", "type_id" => "20"],
            ["type_name" => "单行本", "type_id" => "9"],
            ["type_name" => "杂志&短篇", "type_id" => "10"]
        ];

        return ["class" => $classes, "filters" => (object)[]];
    }

    public function homeVideoContent() {
        return $this->categoryContent("rank_month", 1, [], []);
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        if ($tid == "rank_month") {
            $url = self::HOST . "/albums-favorite_ranking-page-{$pg}-type-month.html";
        } elseif ($tid == "rank_week") {
            $url = self::HOST . "/albums-favorite_ranking-page-{$pg}-type-week.html";
        } elseif ($tid == "rank_day") {
            $url = self::HOST . "/albums-favorite_ranking-page-{$pg}-type-day.html";
        } else {
            $url = self::HOST . "/albums-index-page-{$pg}-cate-{$tid}.html";
        }
        
        $html = $this->fetch($url);
        
        // Parse list items
        $items = $this->pdfa($html, '.gallary_wrap ul li');
        $videos = [];
        
        foreach ($items as $item) {
            $vid = $this->pd($item, '.info .title a&&href');
            $name = $this->pdfh($item, '.info .title a&&Text');
            $cover = $this->pd($item, '.pic_box img&&src');
            $info_text = $this->pdfh($item, '.info .info_col&&Text');
            $remark = "";
            if (preg_match('/(\d+)張圖片/', $info_text, $match)) {
                $remark = $match[1] . "页";
            }
            
            $videos[] = [
                "vod_id" => $vid,
                "vod_name" => $name,
                "vod_pic" => $cover,
                "vod_remarks" => $remark
            ];
        }
        
        return $this->pageResult($videos, $pg, 999999, 20);
    }

    public function detailContent($ids) {
        $vid = $ids[0];
        $url = (strpos($vid, 'http') === 0) ? $vid : self::HOST . $vid;
        
        $html = $this->fetch($url);
        
        // Title
        $name = $this->pdfh($html, 'h2&&Text');
        if (empty($name)) $name = "未知";
        
        // Cover
        $cover = $this->pd($html, '.uwthumb img&&src');
        if (empty($cover)) {
            $cover = $this->pd($html, '.cover img&&src');
        }
        
        // Desc
        $desc = $this->pdfh($html, '.uwconn p||.info p&&Text');
        
        // Pagination logic
        $max_page = 1;
        $aid = "";
        
        if (preg_match('/aid-(\d+)/', $url, $match)) {
            $aid = $match[1];
        }
        
        $paginator_links = $this->pdfa($html, '.paginator a');
        foreach ($paginator_links as $link) {
            $href = $this->pdfh($link, 'a&&href');
            
            if (!$aid && preg_match('/aid-(\d+)/', $href, $m)) {
                $aid = $m[1];
            }
            
            if (preg_match('/page-(\d+)/', $href, $m)) {
                $p = intval($m[1]);
                if ($p > $max_page) {
                    $max_page = $p;
                }
            }
        }
        
        $vod_play_url_list = [];
        if ($max_page == 1) {
            $vod_play_url_list[] = "第1页$" . $url;
        } else {
            for ($i = 1; $i <= $max_page; $i++) {
                if ($aid) {
                    $page_url = self::HOST . "/photos-index-page-{$i}-aid-{$aid}.html";
                    $vod_play_url_list[] = "第{$i}页$" . $page_url;
                } elseif ($i == 1) {
                    $vod_play_url_list[] = "第1页$" . $url;
                }
            }
        }
        
        $play_url_str = implode("#", $vod_play_url_list);
        
        return [
            "list" => [[
                "vod_id" => $vid,
                "vod_name" => $name,
                "vod_pic" => $cover,
                "type_name" => "漫画",
                "vod_year" => "",
                "vod_area" => "",
                "vod_remarks" => "共{$max_page}页",
                "vod_actor" => "",
                "vod_director" => "",
                "vod_content" => $desc,
                "vod_play_from" => '阅读',
                "vod_play_url" => $play_url_str
            ]]
        ];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $url = self::HOST . "/search/?q=" . urlencode($key) . "&f=_all&s=create_time_DESC&syn=yes&page={$pg}";
        $html = $this->fetch($url);
        
        $items = $this->pdfa($html, '.gallary_wrap ul li');
        $videos = [];
        
        foreach ($items as $item) {
            $vid = $this->pd($item, '.info .title a&&href');
            $name = $this->pdfh($item, '.info .title a&&Text');
            $cover = $this->pd($item, '.pic_box img&&src');
            
            $info_text = $this->pdfh($item, '.info .info_col&&Text');
            $remark = "";
            if (preg_match('/(\d+)張圖片/', $info_text, $match)) {
                $remark = $match[1] . "页";
            }
            
            $videos[] = [
                "vod_id" => $vid,
                "vod_name" => $name,
                "vod_pic" => $cover,
                "vod_remarks" => $remark
            ];
        }
        
        return ["list" => $videos];
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $url = $id;
        $headers = $this->headers;
        $headers['Referer'] = $url;
        
        $html = $this->fetch($url, ['headers' => $headers]);
        
        $items = $this->pdfa($html, '.gallary_wrap.tb ul li');
        $img_info_list = [];
        $prefix_url = "";
        
        foreach ($items as $item) {
            $seq = $this->pdfh($item, 'span.name.tb&&Text');
            $src = $this->pdfh($item, 'img&&src');
            
            if (!$src) continue;
            
            $ext = "jpg";
            $parts = explode('.', $src);
            if (count($parts) > 1) {
                $last = end($parts);
                $ext = explode('?', $last)[0];
            }
            
            if (!$prefix_url && strpos($src, "wnimg1") !== false) {
                $last_slash = strrpos($src, '/');
                if ($last_slash !== false) {
                    $prefix_url = substr($src, 0, $last_slash + 1);
                }
            }
            
            $img_info_list[] = [
                "name" => $seq,
                "ext" => $ext,
                "raw_src" => $src
            ];
        }
        
        // Sort
        usort($img_info_list, function($a, $b) {
            $na = is_numeric($a['name']) ? intval($a['name']) : 0;
            $nb = is_numeric($b['name']) ? intval($b['name']) : 0;
            return $na <=> $nb;
        });
        
        $final_images = [];
        foreach ($img_info_list as $item) {
            if ($prefix_url) {
                $full_url = "{$prefix_url}{$item['name']}.{$item['ext']}";
            } else {
                $full_url = $item['raw_src'];
            }
            
            if (strpos($full_url, "tu.petatt.cn") !== false) continue;
            
            if (strpos($full_url, '//') === 0) {
                $full_url = 'https:' . $full_url;
            }

            $final_images[] = $full_url;
        }
        
        $novel_data = implode("&&", $final_images);
        
        return [
            "parse" => 0,
            "playUrl" => "",
            "url" => "pics://{$novel_data}",
            "header" => ""
        ];
    }
}

// 自动运行
(new Spider())->run();
