<?php
header('Content-Type: application/json');

$columns = [
    ["type_name" => "今日说法", "type_id" => "TOPC1451464665008914"],
    ["type_name" => "新闻联播", "type_id" => "TOPC1451528971114112"],
    ["type_name" => "百家讲坛", "type_id" => "TOPC1451557052519584"],
    ["type_name" => "焦点访谈", "type_id" => "TOPC1451558976694518"],
    ["type_name" => "开讲啦", "type_id" => "TOPC1451464884159276"],
    ["type_name" => "故事里的中国", "type_id" => "TOPC1601362002656197"],
    ["type_name" => "经济半小时", "type_id" => "TOPC1451533652476962"],
    ["type_name" => "经济大讲堂", "type_id" => "TOPC1514182710380601"],
    ["type_name" => "对话", "type_id" => "TOPC1451530382483536"],
    ["type_name" => "天网", "type_id" => "TOPC1451543228296920"],
    ["type_name" => "新闻调查", "type_id" => "TOPC1451558819463311"],
    ["type_name" => "新闻周刊", "type_id" => "TOPC1451559180488841"],
    ["type_name" => "动物世界", "type_id" => "TOPC1451378967257534"],
    ["type_name" => "走进科学", "type_id" => "TOPC1451558190239536"],
    ["type_name" => "新闻30分", "type_id" => "TOPC1451559097947700"],
    ["type_name" => "是真的吗", "type_id" => "TOPC1451534366388377"],
    ["type_name" => "星光大道", "type_id" => "TOPC1451467630488780"],
    ["type_name" => "探索发现", "type_id" => "TOPC1451557893544236"],
    ["type_name" => "军事报道", "type_id" => "TOPC1451527941788652"],
    ["type_name" => "新闻1+1", "type_id" => "TOPC1451559066181661"],
    ["type_name" => "等着我", "type_id" => "TOPC1451378757637200"],
    ["type_name" => "我爱发明", "type_id" => "TOPC1569314345479107"],
    ["type_name" => "我爱发明2021", "type_id" => "TOPC1451557970755294"],
    ["type_name" => "自然传奇", "type_id" => "TOPC1451558150787467"],
    ["type_name" => "地理中国", "type_id" => "TOPC1451557421544786"],
    ["type_name" => "人与自然", "type_id" => "TOPC1451525103989666"],
    ["type_name" => "远方的家", "type_id" => "TOPC1451541349400938"],
    ["type_name" => "动画大放映", "type_id" => "TOPC1451559025546574"],
    ["type_name" => "海峡两岸", "type_id" => "TOPC1451540328102649"],
    ["type_name" => "今日关注", "type_id" => "TOPC1451540389082713"],
    ["type_name" => "今日亚洲", "type_id" => "TOPC1451540448405749"],
    ["type_name" => "防务新观察", "type_id" => "TOPC1451526164984187"],
    ["type_name" => "共同关注", "type_id" => "TOPC1451558858788377"],
    ["type_name" => "深度国际", "type_id" => "TOPC1451540709098112"],
    ["type_name" => "环球视线", "type_id" => "TOPC1451558926200436"],
    ["type_name" => "世界周刊", "type_id" => "TOPC1451558687534149"],
    ["type_name" => "东方时空", "type_id" => "TOPC1451558532019883"],
    ["type_name" => "讲武堂", "type_id" => "TOPC1451526241359341"],
    ["type_name" => "国宝发现", "type_id" => "TOPC1571034869935436"],
    ["type_name" => "国宝档案", "type_id" => "TOPC1451540268188575"],
    ["type_name" => "天下财经", "type_id" => "TOPC1451531385787654"],
    ["type_name" => "解码科技史", "type_id" => "TOPC1570876640457386"],
    ["type_name" => "法律讲堂", "type_id" => "TOPC1451542824484472"],
    ["type_name" => "名家书场", "type_id" => "TOPC1579401761622774"],
    ["type_name" => "非常6+1", "type_id" => "TOPC1451467940101208"],
    ["type_name" => "中国节拍", "type_id" => "TOPC1570025984977611"],
    ["type_name" => "一鸣惊人", "type_id" => "TOPC1451558692971175"],
    ["type_name" => "金牌喜剧班", "type_id" => "TOPC1611826337610628"],
    ["type_name" => "九州大戏台", "type_id" => "TOPC1451558399948678"],
    ["type_name" => "乡村大舞台", "type_id" => "TOPC1563179546003162"],
    ["type_name" => "家庭幽默大赛", "type_id" => "TOPC1451375222891702"],
    ["type_name" => "综艺盛典", "type_id" => "TOPC1451985071887935"],
    ["type_name" => "环球综艺", "type_id" => "TOPC1571300682556971"],
    ["type_name" => "中国好歌曲", "type_id" => "TOPC1451984949453678"],
    ["type_name" => "广场舞金曲", "type_id" => "TOPC1528685010104859"],
    ["type_name" => "曲苑杂谈", "type_id" => "TOPC1451984417763860"],
    ["type_name" => "锦绣梨园", "type_id" => "TOPC1451558363250650"],
    ["type_name" => "梨园周刊", "type_id" => "TOPC1574909786070351"],
    ["type_name" => "外国人在中国", "type_id" => "TOPC1451541113743615"],
    ["type_name" => "华人世界", "type_id" => "TOPC1451539822927345"],
    ["type_name" => "武林大会", "type_id" => "TOPC1451551891055866"],
    ["type_name" => "棋牌乐", "type_id" => "TOPC1451550531682936"],
    ["type_name" => "动物传奇", "type_id" => "TOPC1451984181884527"],
    ["type_name" => "美食中国", "type_id" => "TOPC1571034804976375"],
    ["type_name" => "田间示范秀", "type_id" => "TOPC1563178908227191"],
    ["type_name" => "三农群英会", "type_id" => "TOPC1600745974233265"],
    ["type_name" => "乡村振兴面对面", "type_id" => "TOPC1568966531726705"],
    ["type_name" => "超级新农人", "type_id" => "TOPC1597627647957699"],
    ["type_name" => "印象乡村", "type_id" => "TOPC1563178734372977"]
];

// 获取参数
$t = $_GET['t'] ?? null;
$pg = $_GET['pg'] ?? 1;
$ids = $_GET['ids'] ?? null;
$flag = $_GET['flag'] ?? null;
$play = $_GET['play'] ?? null;

// ✅ 新增 play 参数优先级最高判断
if ($flag !== null && $play !== null) {
    $output = array(
        "header" => array(
            "User-Agent" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        ),
        "url" => $play,
        "parse" => 0,
        "jx" => 0
    );

    echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// ✅ 以下为原逻辑
if ($ids) {
    $parts = explode('@', $ids, 2);
    $guid = $parts[0];

    $result = [
        [
            "vod_id" => $ids,
            "vod_remarks" => $parts[1],
            "vod_play_url" => "http://hls.cntv.lxdns.com/asp/hls/main/0303000a/3/default/{$guid}/main.m3u8?maxbr=2048",
            "vod_play_from" => "央视频道"
        ]
    ];
    echo json_encode(["list" => $result], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// 无栏目参数时返回栏目菜单
if (!$t) {
    echo json_encode(["class" => $columns], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// 有栏目参数时获取视频列表
$apiUrl = "http://api.cntv.cn/NewVideo/getVideoListByColumn?id={$t}&n=30&sort=desc&p={$pg}&mode=0&serviceId=tvcctv";

$opts = [
    "http" => [
        "method" => "GET",
        "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n" .
                    "Referer: http://tv.cctv.com/\r\n"
    ]
];
$context = stream_context_create($opts);
$response = file_get_contents($apiUrl, false, $context);

$data = json_decode($response, true);
$vod = [];

if (!empty($data['data']['list'])) {
    foreach ($data['data']['list'] as $item) {
        $id = $item['guid'];
        $length = $item['length'] ?? '';
        $vod_id_raw = "{$id}@{$length}";

        $vod[] = [
            "vod_id" => $vod_id_raw,
            "vod_name" => $item['title'],
            "vod_remarks" => $length,
            "vod_pic" => $item['image'],
            "vod_play_url" => "http://hls.cntv.lxdns.com/asp/hls/main/0303000a/3/default/{$id}/main.m3u8?maxbr=2048",
            "vod_play_from" => "央视频道"
        ];
    }
}

echo json_encode(["list" => $vod], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);