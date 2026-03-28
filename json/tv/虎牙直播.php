<?php
/**
 * 虎牙直播 PHP 接口 - TVBox 兼容版
 * 支持：分类获取、列表抓取、搜索、播放地址解析
 */

error_reporting(0);
header('Content-Type: application/json; charset=utf-8');

class HuyaApp {
    private $host = "https://www.huya.com";
    private $ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1";
    
    // 分类定义
    private $categories = [
        'movie' => ['name' => '虎牙电影', 'tmpId' => 2067, 'libId' => 2213],
        'tv' => ['name' => '虎牙电视剧', 'tmpId' => 2079, 'libId' => 2227],
        'new' => ['name' => '虎牙最新', 'tmpId' => 6871, 'libId' => 6767],
        'up' => ['name' => '虎牙UP主', 'tmpId' => 6879, 'libId' => 6775],
        'variety' => ['name' => '虎牙综艺', 'tmpId' => 1011, 'libId' => 1137],
        'anime' => ['name' => '虎牙动漫', 'tmpId' => 6861, 'libId' => 6761],
    ];
    
    // 获取分类
    public function getClasses() {
        $classes = [];
        foreach ($this->categories as $k => $v) {
            $classes[] = [
                "type_id" => "{$v['tmpId']}_{$v['libId']}", 
                "type_name" => $v['name']
            ];
        }
        return ["class" => $classes];
    }
    
    // 获取分类列表
    public function getCategoryList($tid, $pg = 1) {
        list($tmpId, $libId) = explode('_', $tid);
        $url = "https://live.huya.com/liveHttpUI/getTmpLiveList?iTmpId={$tmpId}&iPageNo={$pg}&iPageSize=20&iLibId={$libId}&iGid=2135";
        
        $json = $this->curl($url);
        $data = json_decode($json, true);
        
        $list = [];
        if (isset($data['vList'])) {
            foreach ($data['vList'] as $item) {
                $list[] = [
                    "vod_id" => $item['lProfileRoom'],
                    "vod_name" => $item['sIntroduction'],
                    "vod_pic" => $item['sScreenshot'],
                    "vod_remarks" => "🔥" . $item['lTotalCount'] . " | " . $item['sNick'],
                    "style" => ["type" => "rect", "ratio" => 1.33]
                ];
            }
        }
        
        return [
            "page" => (int)$pg,
            "pagecount" => 5,
            "limit" => 20,
            "total" => $data['iTotal'] ?? 100,
            "list" => $list
        ];
    }
    
    // 搜索功能
    public function search($wd, $pg = 1) {
        $url = "https://search.huya.com/?m=Search&do=getSearchContent&q=" . urlencode($wd) . "&uid=0&v=4&typ=-5&livestate=0&rows=20&start=" . (($pg-1)*20);
        $json = $this->curl($url);
        $data = json_decode($json, true);
        
        $list = [];
        if (isset($data['response']['docs'])) {
            foreach ($data['response']['docs'] as $item) {
                if (isset($item['room_id']) && $item['room_id'] > 0) {
                    $list[] = [
                        "vod_id" => $item['room_id'],
                        "vod_name" => $item['introduction'],
                        "vod_pic" => $item['screenshot'],
                        "vod_remarks" => $item['nick']
                    ];
                }
            }
        }
        
        return ["list" => $list];
    }
    
    // 获取详情
    public function getDetail($id) {
        return [
            "list" => [[
                "vod_id" => $id,
                "vod_name" => "虎牙直播间: " . $id,
                "vod_play_from" => "Huya",
                "vod_play_url" => "点击播放$" . $id
            ]]
        ];
    }
    
    // 获取播放地址
    public function getPlayUrl($roomId) {
        $url = "https://mp.huya.com/cache.php?m=Live&do=profileRoom&roomid=$roomId";
        $data = $this->curl($url);
        $data = json_decode($data, true)['data'];
        
        if (!$data) {
            return ["url" => ""];
        }
        
        $uid = $data['profileInfo']['uid'];
        $streamName = $data['stream']['baseSteamInfoList'][0]['sStreamName'];
        $baseUrl = "http://al.flv.huya.com/src/$streamName.flv";
        
        // 生成签名
        $seqid = strval(intval($uid) . time());
        $ss = md5("{$seqid}|huya_adr|102");
        $wsTime = dechex(time() + 21600);
        $wsSecret = md5("DWq8BcJ3h6DJt6TY_{$uid}_{$streamName}_{$ss}_{$wsTime}");
        
        $playurl = "$baseUrl?wsSecret=$wsSecret&wsTime=$wsTime&ctype=huya_adr&seqid=$seqid&uid=$uid&fs=bgct&ver=1&t=102";
        
        return [
            "parse" => 0,
            "url" => $playurl,
            "header" => [
                "User-Agent" => "Mozilla/5.0",
                "Referer" => "https://www.huya.com/"
            ]
        ];
    }
    
    private function curl($url, $ref = "", $post = null) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_USERAGENT => $this->ua,
            CURLOPT_TIMEOUT => 10
        ]);
        if ($ref) curl_setopt($ch, CURLOPT_REFERER, $ref);
        if ($post) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
        }
        $res = curl_exec($ch);
        curl_close($ch);
        return $res;
    }
}

// 路由控制
$api = new HuyaApp();
$ac = $_GET['ac'] ?? '';
$t = $_GET['t'] ?? '';
$pg = $_GET['pg'] ?? 1;
$wd = $_GET['wd'] ?? '';
$ids = $_GET['ids'] ?? '';
$play = $_GET['play'] ?? '';

if ($play) {
    echo json_encode($api->getPlayUrl($play));
} elseif ($ids) {
    echo json_encode($api->getDetail($ids));
} elseif ($wd) {
    echo json_encode($api->search($wd, $pg));
} elseif ($t) {
    echo json_encode($api->getCategoryList($t, $pg));
} else {
    echo json_encode($api->getClasses());
}