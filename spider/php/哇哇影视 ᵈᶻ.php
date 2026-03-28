<?php
require_once __DIR__ . '/lib/spider.php';

// ================= 核心加解密类 =================
class WawaCrypto {
    public static function decrypt($encrypted_data) {
        $key = base64_decode('Crm4FXWkk5JItpYirFDpqg=='); //
        $data = hex2bin(base64_decode($encrypted_data)); //
        return openssl_decrypt($data, 'AES-128-ECB', $key, OPENSSL_RAW_DATA);
    }

    public static function sign($message, $privateKey) {
        $key = "-----BEGIN PRIVATE KEY-----\n" . wordwrap($privateKey, 64, "\n", true) . "\n-----END PRIVATE KEY-----";
        $res = openssl_get_privatekey($key);
        openssl_sign($message, $signature, $res, OPENSSL_ALGO_SHA256); // 使用 SHA256 签名
        return base64_encode($signature);
    }

    public static function uuid() {
        return sprintf('%04x%04x%04x%04x%04x%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}

class Spider extends BaseSpider {
    private $HOST;
    private $APP_KEY;
    private $RSA_KEY;
    private $CONF;

    public function init($extend = '') {
        $this->initConf();
    }

    private function initConf() {
        $uid = WawaCrypto::uuid();
        $t = (string)(time() * 1000);
        $sign = md5("appKey=3bbf7348cf314874883a18d6b6fcf67a&uid=$uid&time=$t"); 
        
        $url = 'https://gitee.com/api/v5/repos/aycapp/openapi/contents/wawaconf.txt?access_token=74d5879931b9774be10dee3d8c51008e';
        $res = json_decode($this->fetch($url, [], ["User-Agent: okhttp/4.9.3", "uid: $uid", "time: $t", "sign: $sign"]), true);
        
        $this->CONF = json_decode(WawaCrypto::decrypt($res['content']), true);
        $this->HOST = $this->CONF['baseUrl'];
        $this->APP_KEY = $this->CONF['appKey'];
        $this->RSA_KEY = $this->CONF['appSecret'];
    }

    private function getWawaHeaders() {
        $uid = WawaCrypto::uuid();
        $t = (string)(time() * 1000);
        $sign = WawaCrypto::sign("appKey={$this->APP_KEY}&time=$t&uid=$uid", $this->RSA_KEY); 
        return [
            'User-Agent: okhttp/4.9.3',
            "uid: $uid",
            "time: $t",
            "appKey: {$this->APP_KEY}",
            "sign: $sign"
        ];
    }

    public function homeContent($filter) {
        $typeData = json_decode($this->fetch("{$this->HOST}/api.php/zjv6.vod/types", [], $this->getWawaHeaders()), true);
        $classes = []; 
        $filters = [];
        $dy = ["class" => "类型", "area" => "地区", "lang" => "语言", "year" => "年份", "letter" => "字母", "by" => "排序"];
        $sl = ['按更新' => 'time', '按播放' => 'hits', '按评分' => 'score', '按收藏' => 'store_num'];
        
        if (isset($typeData['data']['list'])) {
            foreach ($typeData['data']['list'] as $item) {
                $classes[] = ['type_id' => $item['type_id'], 'type_name' => $item['type_name']];
                $tid = (string)$item['type_id'];
                $filters[$tid] = [];
                $item['type_extend']['by'] = '按更新,按播放,按评分,按收藏'; // 强制注入排序
            
                foreach ($dy as $key => $name) {
                    if (!empty($item['type_extend'][$key])) {
                        $values = explode(',', $item['type_extend'][$key]);
                        $value_array = [];
                        foreach ($values as $v) {
                            if (empty($v)) continue;
                            $value_array[] = ["n" => $v, "v" => ($key == "by" ? ($sl[$v] ?? $v) : $v)];
                        }
                        $filters[$tid][] = ["key" => $key, "name" => $name, "value" => $value_array];
                    }
                }
            }
        }
        
        $homeList = json_decode($this->fetch("{$this->HOST}/api.php/zjv6.vod/vodPhbAll", [], $this->getWawaHeaders()), true);
        $list = $homeList['data']['list'][0]['vod_list'] ?: [];

        return [
            'class' => $classes,
            'filters' => $filters,
            'list' => $list
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $query = http_build_query([
            'type' => $tid, 'page' => $pg, 'limit' => '12',
            'class' => $extend['class'] ?? '', 'area' => $extend['area'] ?? '',
            'year' => $extend['year'] ?? '', 'by' => $extend['by'] ?? ''
        ]);
        $res = json_decode($this->fetch("{$this->HOST}/api.php/zjv6.vod?$query", [], $this->getWawaHeaders()), true);
        
        $list = $res['data']['list'] ?: [];
        // 哇哇影视未返回总数，估算分页
        return $this->pageResult($list, $pg, 0, 12);
    }

    public function detailContent($ids) {
        $id = is_array($ids) ? $ids[0] : $ids;
        $res = json_decode($this->fetch("{$this->HOST}/api.php/zjv6.vod/detail?vod_id=$id&rel_limit=10", [], $this->getWawaHeaders()), true);
        $item = $res['data'];
        $playFrom = []; $playUrls = [];
        
        if (isset($item['vod_play_list'])) {
            foreach ($item['vod_play_list'] as $list) {
                $playFrom[] = $list['player_info']['show'];
                $urls = [];
                foreach ($list['urls'] as $u) {
                    $u['parse'] = $list['player_info']['parse2'];
                    $urls[] = $u['name'] . '$' . base64_encode(json_encode($u));
                }
                $playUrls[] = implode('#', $urls);
            }
        }
        
        return ['list' => [[
            'vod_id' => $item['vod_id'],
            'vod_name' => $item['vod_name'],
            'vod_pic' => $item['vod_pic'],
            'vod_remarks' => $item['vod_remarks'],
            'vod_content' => $item['vod_content'] ?? '',
            'vod_play_from' => implode('$$$', $playFrom),
            'vod_play_url' => implode('$$$', $playUrls)
        ]]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $res = json_decode($this->fetch("{$this->HOST}/api.php/zjv6.vod?page=$pg&limit=20&wd=".urlencode($key), [], $this->getWawaHeaders()), true);
        $list = $res['data']['list'] ?: [];
        return $this->pageResult($list, $pg, 0, 20);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        $playData = json_decode(base64_decode($id), true);
        return [
            'parse' => 1,
            'url' => $playData['url'],
            'header' => ['User-Agent' => 'dart:io']
        ];
    }
}

(new Spider())->run();
