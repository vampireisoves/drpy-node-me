<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    
    private const AES_KEY = '242ccb8230d709e1';
    private const SIGN_KEY = 'd3dGiJc651gSQ8w1';
    private const APP_ID = 'com.kmxs.reader';
    
    private const BASE_HEADERS = [
        "app-version" => "51110",
        "platform" => "android",
        "reg" => "0",
        "AUTHORIZATION" => "",
        "application-id" => self::APP_ID, 
        "net-env" => "1",
        "channel" => "unknown",
        "qm-params" => ""
    ];

    public function init($extend = "") {
        parent::init($extend);
    }

    public function getName() {
        return "阅读助手";
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

    private function getHeaders($params) {
        $headers = self::BASE_HEADERS;
        $headers['sign'] = $this->getSign($params);
        return $headers;
    }
    
    private function getApiUrl($path, &$params, $domainType = "bc") {
        $baseUrl = ($domainType == "bc") ? "https://api-bc.wtzw.com" : "https://api-ks.wtzw.com";
        if (strpos($path, "search") !== false) {
            $baseUrl = "https://api-bc.wtzw.com";
        }
        
        // PHP headers logic is separate from URL params in fetch
        // But the sign is calculated on params.
        // And requests in Python sends params in query string.
        // So we need to construct URL with query string.
        // Also sign must be in headers.
        
        // Wait, Python code:
        // params['sign'] = self.get_sign(params) -> This adds sign to params!
        // headers['sign'] = self.get_sign(headers) -> This adds sign to headers (based on headers)!
        
        // Let's re-read Python code carefully.
        /*
        def get_sign(self, params):
             # sorts params and md5
        
        def get_headers(self):
            headers = self.BASE_HEADERS.copy()
            headers['sign'] = self.get_sign(headers)  <-- Sign of HEADERS
            return headers

        def get_api_url(self, path, params, domain_type="bc"):
            params['sign'] = self.get_sign(params)    <-- Sign of PARAMS
            ...
            return url, params
        */
        
        // So we have TWO signatures: one in params (signing params) and one in headers (signing headers).
        
        // Params signing
        $params['sign'] = $this->getSign($params);
        
        // Build query string
        $queryString = http_build_query($params);
        
        return "{$baseUrl}{$path}?{$queryString}";
    }
    
    private function getRequestHeaders() {
        // Headers signing
        $headers = self::BASE_HEADERS;
        $headers['sign'] = $this->getSign($headers);
        $headers['User-Agent'] = "okhttp/3.12.1";
        
        // Format for fetch
        // fetch expects array Key => Value
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
            
            // aes-128-cbc
            $decrypted = openssl_decrypt($ciphertext, 'aes-128-cbc', self::AES_KEY, OPENSSL_RAW_DATA, $iv);
            
            if ($decrypted === false) {
                return "解密失败";
            }
            
            return trim($decrypted);
        } catch (Exception $e) {
            return "解密错误: " . $e->getMessage();
        }
    }

    public function homeContent($filter = []) {
        $cats = [
            ["type_name" => "玄幻奇幻", "type_id" => "1|202"],
            ["type_name" => "都市人生", "type_id" => "1|203"],
            ["type_name" => "武侠仙侠", "type_id" => "1|205"],
            ["type_name" => "历史军事", "type_id" => "1|56"],
            ["type_name" => "科幻末世", "type_id" => "1|64"],
            ["type_name" => "游戏竞技", "type_id" => "1|75"],
            ["type_name" => "现代言情", "type_id" => "2|1"],
            ["type_name" => "古代言情", "type_id" => "2|2"],
            ["type_name" => "幻想言情", "type_id" => "2|4"],
            ["type_name" => "婚恋情感", "type_id" => "2|6"],
            ["type_name" => "悬疑推理", "type_id" => "3|262"]
        ];
        return ['class' => $cats, 'filters' => (object)[]];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $parts = explode("|", $tid);
        $gender = $parts[0] ?? "1";
        $catId = $parts[1] ?? "202";
        
        $params = [
            'gender' => $gender, 
            'category_id' => $catId, 
            'need_filters' => '1', 
            'page' => $pg, 
            'need_category' => '1'
        ];
        
        $url = $this->getApiUrl("/api/v4/category/get-list", $params, "bc");
        $headers = $this->getRequestHeaders();
        
        try {
            $json = $this->fetchJson($url, ['headers' => $headers]);
            
            $bookList = [];
            if (isset($json['data']['books'])) {
                $bookList = $json['data']['books'];
            } elseif (isset($json['books'])) {
                $bookList = $json['books'];
            }
            
            $videos = [];
            foreach ($bookList as $book) {
                $pic = $book['image_link'] ?? '';
                if (strpos($pic, 'http://') === 0) {
                    $pic = str_replace('http://', 'https://', $pic);
                }
                
                $videos[] = [
                    "vod_id" => (string)($book['id'] ?? ''),
                    "vod_name" => $book['title'] ?? '',
                    "vod_pic" => $pic,
                    "vod_remarks" => $book['author'] ?? ''
                ];
            }
            
            return ['list' => $videos, 'page' => $pg, 'pagecount' => 999, 'limit' => 20, 'total' => 9999];
            
        } catch (Exception $e) {
            return ['list' => []];
        }
    }

    public function detailContent($ids) {
        $bid = $ids[0];
        $headers = $this->getRequestHeaders();
        
        $detailParams = ['id' => $bid, 'imei_ip' => '2937357107', 'teeny_mode' => '0'];
        $detailUrl = $this->getApiUrl("/api/v4/book/detail", $detailParams, "bc");
        
        $vod = ["vod_id" => $bid, "vod_name" => "获取中...", "vod_play_from" => "阅读助手"];
        
        try {
            $json = $this->fetchJson($detailUrl, ['headers' => $headers]);
            
            if (isset($json['data']['book'])) {
                $bookInfo = $json['data']['book'];
                $vod["vod_name"] = $bookInfo['title'] ?? '';
                
                $pic = $bookInfo['image_link'] ?? '';
                if (strpos($pic, 'http://') === 0) {
                    $pic = str_replace('http://', 'https://', $pic);
                }
                $vod["vod_pic"] = $pic;
                
                $vod["type_name"] = $bookInfo['category_name'] ?? '';
                $vod["vod_remarks"] = ($bookInfo['words_num'] ?? '') . "字";
                $vod["vod_actor"] = $bookInfo['author'] ?? '';
                $vod["vod_content"] = $bookInfo['intro'] ?? '';
            }
            
            // Get Chapters
            $chapterParams = ['id' => $bid];
            $chapterUrl = $this->getApiUrl("/api/v1/chapter/chapter-list", $chapterParams, "ks");
            
            $jsonC = $this->fetchJson($chapterUrl, ['headers' => $headers]);
            
            $lists = [];
            if (isset($jsonC['data']['chapter_lists'])) {
                $lists = $jsonC['data']['chapter_lists'];
            }
            
            $chapterList = [];
            foreach ($lists as $item) {
                $cid = (string)$item['id'];
                $cname = str_replace(["@@", "$"], ["-", ""], $item['title']);
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
        $params = ['gender' => '3', 'imei_ip' => '2937357107', 'page' => $pg, 'wd' => $key];
        $url = $this->getApiUrl("/api/v5/search/words", $params, "bc");
        $headers = $this->getRequestHeaders();
        
        try {
            $json = $this->fetchJson($url, ['headers' => $headers]);
            
            $videos = [];
            if (isset($json['data']['books'])) {
                foreach ($json['data']['books'] as $book) {
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
            $url = $this->getApiUrl("/api/v1/chapter/content", $params, "ks");
            $headers = $this->getRequestHeaders();
            
            $json = $this->fetchJson($url, ['headers' => $headers]);
            
            $content = "";
            if (isset($json['data']['content'])) {
                if (!$title && isset($json['data']['title'])) {
                    $title = $json['data']['title'];
                }
                $content = $this->decryptContent($json['data']['content']);
            } else {
                $msg = $json['msg'] ?? '未知错误';
                $content = "加载失败: {$msg}";
            }
            
            if (!$title) $title = "章节正文";
            
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
