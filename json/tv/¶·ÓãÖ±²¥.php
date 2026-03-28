<?php
/**
 * 斗鱼直播 PHP 接口 - 适配 TVBox T4 架构
 * 包含：分类获取、列表抓取、搜索、以及核心的播放地址解析
 */

error_reporting(0);
header('Content-Type: application/json; charset=utf-8');

class DouyuApp {
    private $host = "https://m.douyu.com";
    private $ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1";

    // 1. 定义分类映射 (对应 JS 中的 filter_def)
    private $categories = [
        'yl' => ['name' => '娱乐天地', 'id' => 'yqk'],
        'PCgame' => ['name' => '网游竞技', 'id' => 'LOL'],
        'djry' => ['name' => '单机热游', 'id' => 'TVgame'],
        'syxx' => ['name' => '手游休闲', 'id' => 'wzry'],
        'yz' => ['name' => '颜值', 'id' => 'yz'],
        'kjwh' => ['name' => '科技文化', 'id' => 'smkj'],
        'yp' => ['name' => '语音互动', 'id' => 'yiqiwan'],
        'voice' => ['name' => '语音直播', 'id' => 'yyzs'],
        'znl' => ['name' => '正能量', 'id' => 'znl']
    ];

    // 获取分类
    public function getClasses() {
        $classes = [];
        foreach ($this->categories as $k => $v) {
            $classes[] = ["type_id" => $v['id'], "type_name" => $v['name']];
        }
        return ["class" => $classes];
    }

    // 2. 获取列表 (根据分类抓取)
    public function getCategoryList($tid, $pg = 1) {
        $url = "https://m.douyu.com/api/room/list?page={$pg}&type={$tid}";
        $json = $this->curl($url);
        $data = json_decode($json, true);
        
        $list = [];
        if (isset($data['data']['list'])) {
            foreach ($data['data']['list'] as $item) {
                $list[] = [
                    "vod_id" => $item['rid'],
                    "vod_name" => $item['roomName'],
                    "vod_pic" => $item['roomSrc'],
                    "vod_remarks" => "🔥" . $item['hn'] . " | " . $item['nickname'],
                    "style" => ["type" => "rect", "ratio" => 1.33]
                ];
            }
        }
        return [
            "page" => (int)$pg,
            "pagecount" => 99,
            "limit" => 20,
            "total" => 999,
            "list" => $list
        ];
    }

    // 3. 搜索功能
    public function search($wd, $pg = 1) {
        $offset = ($pg - 1) * 20;
        $url = "https://m.douyu.com/api/search/liveRoom?sk=" . urlencode($wd) . "&offset={$offset}&limit=20&did=10000000000000000000000000001501";
        $json = $this->curl($url);
        $data = json_decode($json, true);
        
        $list = [];
        if (isset($data['data']['list'])) {
            foreach ($data['data']['list'] as $item) {
                $list[] = [
                    "vod_id" => $item['rid'],
                    "vod_name" => $item['roomName'],
                    "vod_pic" => $item['roomSrc'],
                    "vod_remarks" => $item['nickname']
                ];
            }
        }
        return ["list" => $list];
    }

    // 4. 获取详情
    public function getDetail($id) {
        return [
            "list" => [[
                "vod_id" => $id,
                "vod_name" => "直播间: " . $id,
                "vod_play_from" => "Douyu",
                "vod_play_url" => "点击播放$" . $id
            ]]
        ];
    }

    // 5. 核心逻辑：解析播放地址 (包含签名算法)
    public function getPlayUrl($roomId) {
        $did = "10000000000000000000000000001501";
        $tt = time();

        // A. 获取动态加密脚本参数
        $encRes = $this->curl("https://www.douyu.com/wgapi/livenc/liveweb/websec/getEncryption?did=$did", "https://www.douyu.com/$roomId");
        $encData = json_decode($encRes, true);
        
        if (!$encData || $encData['error'] !== 0) return ["url" => ""];

        $sec = $encData['data'];
        
        // B. PHP 实现斗鱼 MD5 签名逻辑 (对应原 JS 的计算)
        $current = $sec['rand_str'];
        for ($i = 0; $i < $sec['enc_time']; $i++) {
            $current = md5($current . $sec['key']);
        }
        $auth = md5($current . $sec['key'] . $roomId . $tt);

        // C. 请求真实 H5 流地址
        $postData = [
            'v' => '22032021',
            'did' => $did,
            'tt' => $tt,
            'auth' => $auth,
            'enc_data' => $sec['enc_data']
        ];

        $streamUrl = "https://www.douyu.com/lapi/live/getH5PlayV1/" . $roomId;
        $streamRes = $this->curl($streamUrl, "https://www.douyu.com/$roomId", http_build_query($postData));
        $streamData = json_decode($streamRes, true);

        if (!$streamData || $streamData['error'] !== 0) return ["url" => ""];

        $url = $streamData['data']['rtmp_url'] . '/' . $streamData['data']['rtmp_live'];
        
        return [
            "parse" => 0,
            "url" => $url,
            "header" => ["User-Agent" => "Mozilla/5.0", "Referer" => "https://www.douyu.com/"]
        ];
    }

    private function curl($url, $ref = "", $post = null) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, $this->ua);
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
$api = new DouyuApp();
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
