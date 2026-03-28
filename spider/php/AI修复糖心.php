<?php
/**
 * 糖心次元 (txsp.my) 2026 逆向去套娃补丁版
 * 原理：利用环境自动套壳的特性，裸发核心数据
 */

header('Content-Type: application/json; charset=utf-8');

$ac   = $_GET['ac'] ?? '';
$t    = $_GET['t'] ?? '';
$pg   = $_GET['pg'] ?? '1';
$ids  = $_GET['ids'] ?? '';
$id   = $_GET['id'] ?? '';
$play = $_GET['play'] ?? ''; 

$spider = new TangXinSpider();

// --- 1. 播放逻辑：这里我们不再手动包 {"success":true, "data":...} ---
if (!empty($play) || $ac === 'play') {
    $videoUrl = !empty($play) ? $play : $id;
    
    // 逆向补丁：只输出核心对象。如果你的环境会自动套壳，它会变成你要的结构。
    $coreData = [
        "parse"  => 0,
        "url"    => trim($videoUrl),
        "header" => [
            "User-Agent" => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            "Referer"    => "https://www.txsp.my/",
            "Origin"     => "https://www.txsp.my"
        ]
    ];
    
    // 如果你的环境会自动套 success/data，那我们就不能再手动 encode 整个数组
    // 我们先尝试直接输出这个对象
    echo json_encode($coreData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
} 

// --- 2. 其他逻辑保持不变 ---
if (!empty($ids)) {
    $res = $spider->getDetailContent(explode(',', $ids)[0]);
    echo json_encode($res, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} elseif (!empty($t)) {
    $res = $spider->getCategoryContent($t, $pg);
    echo json_encode($res, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode($spider->getHomeContent(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
exit;

class TangXinSpider {
    private $base = "https://www.txsp.my";

    private function fetch($url) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_ENCODING => 'gzip',
            CURLOPT_HTTPHEADER => ['User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36']
        ]);
        $res = curl_exec($ch);
        curl_close($ch);
        return $res ?: "";
    }

    public function getHomeContent() {
        $m = ["1"=>"传媒系列","2"=>"AV系列","5"=>"麻豆传媒","6"=>"糖心传媒","7"=>"精东影业","8"=>"蜜桃传媒","9"=>"果冻传媒","10"=>"星空无限","11"=>"天美传媒","12"=>"抠抠传媒","13"=>"星杏吧传媒","14"=>"性视界传媒","15"=>"SA国际传媒","16"=>"其他传媒","17"=>"国产自拍","18"=>"探花网红","19"=>"日韩字幕","20"=>"日本无码","21"=>"日本有码","22"=>"东京热","23"=>"动漫番","24"=>"变态同性","25"=>"欧美无码","27"=>"韩国AV"];
        $classes = [];
        foreach ($m as $k => $v) $classes[] = ['type_id' => $k, 'type_name' => $v];
        return ['class' => $classes];
    }

    public function getCategoryContent($tid, $pg) {
        $url = "{$this->base}/index.php/vod/show/id/{$tid}/page/{$pg}.html";
        $html = $this->fetch($url);
        preg_match_all('/<li class="mb15">.*?href="(\/index\.php\/vod\/play\/id\/.*?)".*?title="(.*?)"/s', $html, $m);
        $videos = [];
        if (!empty($m[1])) {
            foreach ($m[1] as $k => $v) {
                $videos[] = ['vod_id' => $v, 'vod_name' => trim($m[2][$k]), 'vod_pic' => "", 'vod_remarks' => '高清'];
            }
        }
        return ['list' => $videos];
    }

    public function getDetailContent($id) {
        $playUrl = "";
        if (strpos($id, 'http') === 0) {
            $playUrl = $id;
        } else {
            $html = $this->fetch($this->base . $id);
            if (preg_match('/player_aaaa\s*=\s*(\{.*?\})/i', $html, $m)) {
                $playUrl = json_decode($m[1], true)['url'] ?? "";
            }
            if (empty($playUrl) && preg_match('/(https?[:\\\\\/]+[^"\'\s]+\.m3u8[^"\'\s]*)/i', $html, $m)) {
                $playUrl = str_replace('\\/', '/', $m[1]);
            }
        }
        return ['list' => [[
            'vod_id' => $id, 
            'vod_name' => "糖心播放",
            'vod_play_from' => 'm3u8', 
            'vod_play_url' => '正片$' . trim($playUrl)
        ]]];
    }
}