<?php
/*
* 2025.11.06 虎牙一起看实时 id 列表,可播 by duboy
* 本php 首发于 https://bbs.livecodes.vip
* 获取一起看全部id
* 可对房间名进行过滤删除或替换，并将替换的房间放在分类的前面
* 增加列表缓存时间8分钟，播放缓存时间5分钟
* 生成的列表 可直接播放。如播放代码失效，解决办法见下面：
* 自行找到可用 php代码 或 他人的代里，如：http://123.456.cc/huya/11342414 或http://789.cc/huya?id=11342414
  1.将可用代码放在本代码同一文件夹，加尾巴OK  ?url=可用的文件名.php 
  2.代里无 ?号，url=http://123.456.cc/huya/  **注意就是一定要以 /号结束
  3.代里有 ?号，url=http://789.cc/huya.php   
  **上面2 3，可省略输入http://, 自动会添加
  理论上，本列表 永久有效
*/
error_reporting(0);
header('Content-Type: text/plain; charset=utf-8');
date_default_timezone_set("Asia/Shanghai");
$php = $_GET['url']; //url=huya.php 指定当前目录下的 php**文件
$id = $_GET['id']; 
$cache_ttl = 1; // 列表缓存时间（分钟）
$cache_id_ttl = 5; // **播放缓存时间（分钟）

define('LF', "\n");
$cache_dir = __DIR__ . '/cache';
if (!is_dir($cache_dir)) mkdir($cache_dir, 0755, true);
$cache_file = $cache_dir . '/huyaList.tmp';

if (is_numeric($id)){ 
    $cache_file = $cache_dir . '/huyaID.json';
    if (file_exists($cache_file)) {
        $j = json_decode(file_get_contents($cache_file), 1);
        if ($j[$id] && time() - $j[$id][0] < $cache_id_ttl*60){
            header('Location:'.$j[$id][1]);
            die;
        }
    }
    die(huya_play($id, $cache_file)); 
};

if (empty($php) || preg_match('/^[^\/]+\.php/', $php, $m)){
    $php_s = ($_SERVER['HTTPS']==='on'?"https":"http")."://".$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF'];
    if ($php){ $php_s = rtrim(preg_replace('/[^\/]+\.php$/i', $php, $php_s), '/'); }
    $php = preg_replace('/\/index\.php$/i', '', $php_s);
}else{
    if (!preg_match('/^\s*https?:\/\//i', $php)) $php = "http://".trim($php);
}

if (file_exists($cache_file) && (time() - filemtime($cache_file) < $cache_ttl*60)) {
    $data = file_get_contents($cache_file);
    if (substr($php,-1) == '/'){ $data = preg_replace('/,.*?:\/\/.*[\/|=]/ui', ",$php", $data); }
    else { $data = preg_replace('/,.*?:\/\/.*[\/|=]/ui', ",$php?id=", $data); }    
    die($data);
}

// 需要过滤的房间名称（直接在此添加/删除过滤项）
$filterNames = [
    '欢迎来到我的直播间',
    '我是一颗小虎牙'
];

// 替换规则：键为目标名称，值为需要匹配的关键词列表（新增规则直接加一行）
$replaceRules = [
    '周星驰' => ['星爷', '周星驰', '周星星'],
    '林正英' => ['英叔', '林正英'],
    '王晶' => ['王晶'],
    '周润发' => ['发哥', '周润发'],
    '刘德华' => ['华仔', '刘德华'],
    '成龙' => ['成龙'],
    '007电影' => ['邦德'],
    '梁家辉' => ['梁家辉'],
    '洪金宝' => ['洪金宝·'],
];

// API分类列表（需要调整分类或链接时直接修改此处）
$apis = [
    //1 => [2067, 2213, "虎牙.电影"],     
    //2 => [2079, 2227, "虎牙.电视剧"], 
    //3 => [6871, 6767, "虎牙.最新"], 
    //4 => [6879, 6775, "虎牙.up主"], 
    //5 => [1011, 1137, "虎牙.综艺s"], 
    //6 => [6861, 6761, "虎牙.动漫"],  
    //7 => [4061, 4149, "虎牙.TVB剧场"], 
    //1 => [7273, 7233, "星秀.星舞杯S3"],     
    2 => [116, 122, "星秀.舞蹈"], 
    3 => [7085, 6943, "星秀.聊天"], 
    4 => [115, 121, "星秀.好声音"], 
    5 => [7087, 6945, "星秀.高颜"], 
    6 => [3595, 3697, "星秀.女团"],
    7 => [27, 29, "星秀.新秀"],
];

// 启用输出缓冲，优化输出处理
ob_start();

echo "-=☆☆☆☆☆ 更新于 ".date('Y-m-d H:i:s')." ◎ 间隔 $cache_ttl 分钟更新 ☆☆☆☆☆=-".LF.LF.
     "虎牙一起看,#group#".LF.LF;
//foreach ($apis as $genre => $url) {
foreach ($apis as $key => $ids) {
    $i=0;
    $out = '';
    do{
        $i++;
        $url = "https://live.huya.com/liveHttpUI/getTmpLiveList?iTmpId={$ids[0]}&iPageNo={$i}&iPageSize=120&iLibId={$ids[1]}&iGid=1663";
        $response = get($url);
        if (!$response) {
            continue;
        }
        
        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE || !isset($data['vList'])) {
            continue;
        }
       
        // 输出分类标题（格式：分类名,#genre#）
        if ($i==1) echo "{$ids[2]},#genre#" . LF.LF;
       
        // 遍历每个房间数据
        foreach ($data['vList'] as $item) {
            // 确保必要字段存在
            if (isset($item['sIntroduction'], $item['lProfileRoom'])) {
                $roomName = $item['sNick']; // 原始房间名
                $profileRoom = (string)$item['lProfileRoom']; // 房间ID
                
                // 根据替换规则处理房间名
                $roomNameR = '';
                foreach ($replaceRules as $target => $keywords) {
                    // 生成正则模式（匹配任意关键词，忽略大小写）
                    $pattern = '/(' . implode('|', array_map('preg_quote', $keywords)) . ')/i';
                    
                    // 匹配到则替换为目标名称，并跳出循环（避免重复替换）
                    if (preg_match($pattern, $roomName)) {
                        //$roomName = $target;
                        $roomNameR = $target;
                        break;
                    }
                }
                
                // 过滤不需要的房间名
                if (in_array($roomName, $filterNames)) {
                    continue;
                }
                
                // 生成房间链接并输出（格式：房间名,链接）
                //$link = "$php?id=$profileRoom";
                $link = (substr($php,-1)=='/') ? $php.$profileRoom : "$php?id=$profileRoom";
                
                //echo "$roomName,$link" . LF;
                if (!empty($roomNameR)) $out = "$roomNameR,$link".LF. $out;
                else $out .= "$roomName,$link" . LF;
            }
        }
       
        // 分类间用空行分隔
        //echo LF;   
        $out .= LF; 
    }while (!empty($data['vList']) && $data['iTotal']!=0 && $i<5);
    echo $out;
}

// 处理输出：去除末尾多余换行后再补一个
$output = ob_get_clean();
file_put_contents($cache_file, $output);
echo trim($output, LF) . LF;

function get($url){
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true, 
        CURLOPT_TIMEOUT => 10, 
        CURLOPT_SSL_VERIFYPEER => false, 
        CURLOPT_SSL_VERIFYHOST => false
    ]);
    $response = curl_exec($ch);
    //$error = curl_error($ch);
    curl_close($ch); 
    return $response;
}

function huya_play($id, $file){
    $url = "https://mp.huya.com/cache.php?m=Live&do=profileRoom&roomid=$id";
    $data = get($url);
    $data = json_decode($data, true)['data'];
    if (!$data) { die("$id id错误或未开播"); }
        
    $uid = $data['profileInfo']['uid'];
    $streamName =$data['stream']['baseSteamInfoList'][0]['sStreamName'];
    $Url = "http://al.flv.huya.com/src/$streamName.flv";
    $seqid = strval(intval($uid) . time());
    $ss = md5("{$seqid}|huya_adr|102");
    $wsTime = dechex(time()+21600);
    $wsSecret = md5("DWq8BcJ3h6DJt6TY_{$uid}_{$streamName}_{$ss}_{$wsTime}");
    $playurl = "$Url?wsSecret=$wsSecret&wsTime=$wsTime&ctype=huya_adr&seqid=$seqid&uid=$uid&fs=bgct&ver=1&t=102";
    $j = [];
    if (file_exists($file)) $j = json_decode(file_get_contents($file), 1);
    $j[$id] = [time(), $playurl];    
    file_put_contents($file, json_encode($j, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));
    header('Location:'.$playurl);
    exit;
}
?>