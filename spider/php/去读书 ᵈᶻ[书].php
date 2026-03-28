<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private const AES_KEY = '242ccb8230d709e1';
    private const SIGN_KEY = 'd3dGiJc651gSQ8w1';
    private const APP_ID = 'com.kmxs.reader';

    private $baseHeaders = [
        "app-version" => "51110",
        "platform" => "android",
        "reg" => "0",
        "AUTHORIZATION" => "",
        "application-id" => self::APP_ID,
        "net-env" => "1",
        "channel" => "unknown",
        "qm-params" => ""
    ];

    public function getName() {
        return "去读书";
    }

    public function init($extend = "") {
        // pass
    }

    public function isVideoFormat($url) {
        return false;
    }

    public function manualVideoCheck() {
        // pass
    }

    private function getSign($params) {
        ksort($params);
        $signStr = "";
        foreach ($params as $k => $v) {
            $signStr .= "{$k}={$v}";
        }
        $signStr .= self::SIGN_KEY;
        return md5($signStr);
    }

    private function getHeaders() {
        $headers = $this->baseHeaders;
        $headers['sign'] = $this->getSign($headers);
        $headers['User-Agent'] = 'okhttp/3.12.1';
        return $headers;
    }

    private function decryptContent($base64Content) {
        try {
            $encryptedBytes = base64_decode($base64Content);
            if (strlen($encryptedBytes) < 16) {
                return "数据长度不足";
            }
            $iv = substr($encryptedBytes, 0, 16);
            $ciphertext = substr($encryptedBytes, 16);
            
            $decrypted = openssl_decrypt(
                $ciphertext, 
                'AES-128-CBC', 
                self::AES_KEY, 
                OPENSSL_RAW_DATA, 
                $iv
            );

            if ($decrypted === false) {
                return "解密失败";
            }
            return trim($decrypted);
        } catch (Exception $e) {
            return "解密错误: " . $e->getMessage();
        }
    }

    private function getApiUrl($path, $params, $domainType = "bc") {
        $params['sign'] = $this->getSign($params);
        $baseUrl = ($domainType == "bc") ? "https://api-bc.wtzw.com" : "https://api-ks.wtzw.com";
        if (strpos($path, "search") !== false) {
            $baseUrl = "https://api-bc.wtzw.com";
        }
        
        $queryString = http_build_query($params);
        return ["{$baseUrl}{$path}?{$queryString}", $params];
    }

    public function homeContent($filter) {
        $cats = [
            ["n" => "玄幻奇幻", "v" => "1|202"], ["n" => "都市人生", "v" => "1|203"], ["n" => "武侠仙侠", "v" => "1|205"],
            ["n" => "历史军事", "v" => "1|56"], ["n" => "科幻末世", "v" => "1|64"], ["n" => "游戏竞技", "v" => "1|75"],
            ["n" => "现代言情", "v" => "2|1"], ["n" => "古代言情", "v" => "2|2"], ["n" => "幻想言情", "v" => "2|4"],
            ["n" => "婚恋情感", "v" => "2|6"], ["n" => "悬疑推理", "v" => "3|262"]
        ];
        
        $classes = [];
        foreach ($cats as $cat) {
            $classes[] = ["type_name" => $cat['n'], "type_id" => $cat['v']];
        }
        return ['class' => $classes, 'filters' => []];
    }

    public function homeVideoContent() {
        return ['list' => []];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $parts = explode("|", $tid);
        $gender = $parts[0] ?? "1";
        $catId = $parts[1] ?? "202";

        $path = "/api/v4/category/get-list";
        $params = ['gender' => $gender, 'category_id' => $catId, 'need_filters' => '1', 'page' => $pg, 'need_category' => '1'];
        $headers = $this->getHeaders();
        list($url, $signedParams) = $this->getApiUrl($path, $params, "bc");

        try {
            $j = $this->fetchJson($url, ['headers' => $headers]);
            $videos = [];
            $bookList = [];
            
            if (isset($j['data']['books'])) {
                $bookList = $j['data']['books'];
            } elseif (isset($j['books'])) {
                $bookList = $j['books'];
            }

            foreach ($bookList as $book) {
                $videos[] = [
                    "vod_id" => (string)$book['id'],
                    "vod_name" => $book['title'],
                    "vod_pic" => $book['image_link'],
                    "vod_remarks" => $book['author']
                ];
            }
            return ['list' => $videos, 'page' => $pg, 'pagecount' => 999, 'limit' => 20, 'total' => 9999];
        } catch (Exception $e) {
            return ['list' => []];
        }
    }

    public function detailContent($ids) {
        $bid = $ids[0];
        $headers = $this->getHeaders();
        
        $detailParams = ['id' => $bid, 'imei_ip' => '2937357107', 'teeny_mode' => '0'];
        list($detailUrl, $detailSignedParams) = $this->getApiUrl("/api/v4/book/detail", $detailParams, "bc");
        
        $vod = ["vod_id" => $bid, "vod_name" => "获取中...", "vod_play_from" => "去读书"];

        try {
            $j = $this->fetchJson($detailUrl, ['headers' => $headers]);
            if (isset($j['data']['book'])) {
                $bookInfo = $j['data']['book'];
                $vod["vod_name"] = $bookInfo['title'];
                $vod["vod_pic"] = $bookInfo['image_link'];
                $vod["type_name"] = $bookInfo['category_name'] ?? '';
                $vod["vod_remarks"] = ($bookInfo['words_num'] ?? '') . "字";
                $vod["vod_actor"] = $bookInfo['author'];
                $vod["vod_content"] = $bookInfo['intro'];
            }
            
            // 获取目录
            $chapterParams = ['id' => $bid];
            list($chapterUrl, $chapterSignedParams) = $this->getApiUrl("/api/v1/chapter/chapter-list", $chapterParams, "ks");
            
            $jc = $this->fetchJson($chapterUrl, ['headers' => $headers]);
            
            $chapterList = [];
            $lists = [];
            if (isset($jc['data']['chapter_lists'])) {
                $lists = $jc['data']['chapter_lists'];
            }
            
            foreach ($lists as $item) {
                $cid = (string)$item['id'];
                $cname = str_replace(["@@", "$"], ["-", ""], (string)$item['title']);
                $urlCode = "{$bid}@@{$cid}@@{$cname}";
                $chapterList[] = "{$cname}\${$urlCode}";
            }
            
            $vod['vod_play_url'] = implode("#", $chapterList);
            return ["list" => [$vod]];
        } catch (Exception $e) {
            $vod["vod_content"] = "Error: " . $e->getMessage();
            return ["list" => [$vod]];
        }
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $path = "/api/v5/search/words";
        $params = ['gender' => '3', 'imei_ip' => '2937357107', 'page' => $pg, 'wd' => $key];
        $headers = $this->getHeaders();
        list($url, $signedParams) = $this->getApiUrl($path, $params, "bc");
        
        try {
            $j = $this->fetchJson($url, ['headers' => $headers]);
            $videos = [];
            if (isset($j['data']['books'])) {
                foreach ($j['data']['books'] as $book) {
                    $videos[] = [
                        "vod_id" => (string)$book['id'],
                        "vod_name" => $book['original_title'],
                        "vod_pic" => $book['image_link'],
                        "vod_remarks" => $book['original_author']
                    ];
                }
            }
            return ['list' => $videos, 'page' => $pg];
        } catch (Exception $e) {
            return ['list' => [], 'page' => $pg];
        }
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        try {
            $parts = explode("@@", $id);
            $bid = $parts[0];
            $cid = $parts[1];
            $title = isset($parts[2]) ? $parts[2] : "";
            
            $params = ['id' => $bid, 'chapterId' => $cid];
            $headers = $this->getHeaders();
            list($url, $signedParams) = $this->getApiUrl("/api/v1/chapter/content", $params, "ks");
            
            $j = $this->fetchJson($url, ['headers' => $headers]);
            
            $content = "";
            if (isset($j['data']['content'])) {
                if (empty($title) && isset($j['data']['title'])) {
                    $title = $j['data']['title'];
                }
                $content = $this->decryptContent($j['data']['content']);
            } else {
                $content = "加载失败: " . ($j['msg'] ?? '未知错误');
            }
            
            if (empty($title)) {
                $title = "章节正文";
            }

            $resultData = [
                'title' => $title,
                'content' => $content
            ];
            
            $ret = json_encode($resultData, JSON_UNESCAPED_UNICODE);
            $finalUrl = "novel://{$ret}";
            
            return [
                "parse" => 0,
                "playUrl" => "",
                "url" => $finalUrl,
                "header" => ""
            ];
        } catch (Exception $e) {
            $errData = [
                'title' => "错误",
                'content' => "发生异常: " . $e->getMessage()
            ];
            return [
                "parse" => 0,
                "playUrl" => "",
                "url" => "novel://" . json_encode($errData, JSON_UNESCAPED_UNICODE),
                "header" => ""
            ];
        }
    }
}

(new Spider())->run();
