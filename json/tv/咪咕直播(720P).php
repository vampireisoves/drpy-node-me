<?php
//本PHP首发于直播源论坛：https://bbs.livecodes.vip/
function migu_cache_dir(): string
{
    $dir = __DIR__ . '/migucache';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    return $dir;
}

function cache_path($key)
{
    return migu_cache_dir() . "/migu_cache_" . md5($key) . ".json";
}

function get_migu_cache($key)
{
    $p = cache_path($key);
    if (!is_file($p)) return [null, false];
    $d = json_decode(@file_get_contents($p), true);
    if (!$d) return [null, false];
    if (time() - intval($d['time']) > intval($d['ttl'])) {
        @unlink($p);
        return [null, false];
    }
    return [$d['url'], true];
}

function set_migu_cache($key, $url, $ttl_seconds)
{
    $p = cache_path($key);
    @file_put_contents($p, json_encode(['url' => $url, 'time' => time(), 'ttl' => $ttl_seconds], JSON_UNESCAPED_SLASHES));
}

function get_sign_config($contId)
{
    $appVersion = '2600033500';
    $saltValue = '16d4328df21a4138859388418bd252c2';
    $timestampMs = (string)round(microtime(true) * 1000);
    $ver8 = substr($appVersion, 0, 8);
    $md5string = md5($timestampMs . $contId . $ver8);
    $prefix = random_int(0, 999999);
    $salt = sprintf('%06d80', $prefix);
    $text = $md5string . $saltValue . 'migu' . substr($salt, 0, 4);
    $sign = md5($text);
    return [$timestampMs, [$salt, $sign]];
}

function send_get_request($url, $headers)
{
    $ch = curl_init($url);
    $h = [];
    foreach ($headers as $k => $v) $h[] = $k . ": " . $v;
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => false,
        CURLOPT_HTTPHEADER => $h,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT => 10,
    ]);
    $body = curl_exec($ch);
    $err = curl_errno($ch);
    curl_close($ch);
    if ($err) return null;
    return $body;
}

function migu_encrypted_url(string $rawUrl): string
{
    $factorOfEncryption = [8, 3, 7, 6, 6];

    $parsed = parse_url($rawUrl);
    if ($parsed === false) {
        return $rawUrl;
    }

    $queryString = isset($parsed['query']) ? $parsed['query'] : '';
    $queryParams = [];
    if ($queryString !== '') {
        parse_str($queryString, $queryParams);
    }

    $puData = $queryParams['puData'] ?? '';
    if ($puData === '') {
        return $rawUrl;
    }

    $paramsToAppend = [];

    $ddCalcuExists = isset($queryParams['ddCalcu']) && $queryParams['ddCalcu'] !== '';
    if (!$ddCalcuExists) {
        $userid = (isset($queryParams['userid']) && $queryParams['userid'] !== '')
            ? $queryParams['userid'] : 'eeeeeeeee';

        $timestamp = (isset($queryParams['timestamp']) && $queryParams['timestamp'] !== '')
            ? $queryParams['timestamp'] : 'tttttttttttttt';

        $programId = (isset($queryParams['ProgramID']) && $queryParams['ProgramID'] !== '')
            ? $queryParams['ProgramID'] : 'ccccccccc';

        $channelId = (isset($queryParams['Channel_ID']) && $queryParams['Channel_ID'] !== '')
            ? $queryParams['Channel_ID'] : 'nnnnnnnnnnnnnnnn';

        $useridChars = preg_split('//u', $userid, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $timestampChars = preg_split('//u', $timestamp, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $programIdChars = preg_split('//u', $programId, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $channelIdChars = preg_split('//u', $channelId, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        $ddCalcu = '';

        $puLen = strlen($puData);
        $halfLen = (int)($puLen / 2);

        for ($i = 0; $i < $halfLen; $i++) {
            $ddCalcu .= $puData[$puLen - 1 - $i];
            $ddCalcu .= $puData[$i];

            if ($i === 1) {
                $idx = $factorOfEncryption[0] - 1; 
                $charToEncrypt = 'e';
                if (isset($useridChars[$idx])) {
                    $charToEncrypt = $useridChars[$idx];
                }

                $codePoint = 0;
                if ($charToEncrypt !== '') {
                    if (function_exists('mb_ord')) {
                        $codePoint = mb_ord($charToEncrypt, 'UTF-8');
                    } else {
                        $u = mb_convert_encoding($charToEncrypt, 'UCS-4BE', 'UTF-8');
                        $tmp = unpack('N', $u);
                        $codePoint = $tmp[1];
                    }
                }
                $encryptedVal = $codePoint ^ $factorOfEncryption[4];
                $encryptedVal %= 26;
                $encryptedVal += 97; 
                $ddCalcu .= chr($encryptedVal);
            } elseif ($i === 2) {
                $idx = $factorOfEncryption[1] - 1;
                $charToEncrypt = 't';
                if (isset($timestampChars[$idx])) {
                    $charToEncrypt = $timestampChars[$idx];
                }

                $codePoint = 0;
                if ($charToEncrypt !== '') {
                    if (function_exists('mb_ord')) {
                        $codePoint = mb_ord($charToEncrypt, 'UTF-8');
                    } else {
                        $u = mb_convert_encoding($charToEncrypt, 'UCS-4BE', 'UTF-8');
                        $tmp = unpack('N', $u);
                        $codePoint = $tmp[1];
                    }
                }
                $encryptedVal = $codePoint ^ $factorOfEncryption[4];
                $encryptedVal %= 26;
                $encryptedVal += 97;
                $ddCalcu .= chr($encryptedVal);
            } elseif ($i === 3) {
                $idx = $factorOfEncryption[2] - 1;
                $charToEncrypt = 'c';
                if (isset($programIdChars[$idx])) {
                    $charToEncrypt = $programIdChars[$idx];
                }

                $codePoint = 0;
                if ($charToEncrypt !== '') {
                    if (function_exists('mb_ord')) {
                        $codePoint = mb_ord($charToEncrypt, 'UTF-8');
                    } else {
                        $u = mb_convert_encoding($charToEncrypt, 'UCS-4BE', 'UTF-8');
                        $tmp = unpack('N', $u);
                        $codePoint = $tmp[1];
                    }
                }
                $encryptedVal = $codePoint ^ $factorOfEncryption[4];
                $encryptedVal %= 26;
                $encryptedVal += 97;
                $ddCalcu .= chr($encryptedVal);
            } elseif ($i === 4) {
                $idx = $factorOfEncryption[3] - 1;
                $charToEncrypt = 'n';
                if (isset($channelIdChars[$idx])) {
                    $charToEncrypt = $channelIdChars[$idx];
                }

                $codePoint = 0;
                if ($charToEncrypt !== '') {
                    if (function_exists('mb_ord')) {
                        $codePoint = mb_ord($charToEncrypt, 'UTF-8');
                    } else {
                        $u = mb_convert_encoding($charToEncrypt, 'UCS-4BE', 'UTF-8');
                        $tmp = unpack('N', $u);
                        $codePoint = $tmp[1];
                    }
                }
                $encryptedVal = $codePoint ^ $factorOfEncryption[4];
                $encryptedVal %= 26;
                $encryptedVal += 97;
                $ddCalcu .= chr($encryptedVal);
            }
        }

        if ($puLen % 2 === 1) {
            $ddCalcu .= $puData[$halfLen];
        }

        $paramsToAppend[] = 'ddCalcu=' . $ddCalcu;
    }

    $sv = $queryParams['sv'] ?? '';
    if ($sv === '') {
        $paramsToAppend[] = 'sv=10004';
    }

    $ct = $queryParams['ct'] ?? '';
    if ($ct === '') {
        $paramsToAppend[] = 'ct=android';
    }

    if (!empty($paramsToAppend)) {
        $finalUrl = $rawUrl;

        if (strpos($rawUrl, '?') !== false) {
            $lastChar = substr($rawUrl, -1);
            if ($lastChar !== '?' && $lastChar !== '&') {
                $finalUrl .= '&';
            }
        } else {
            $finalUrl .= '?';
        }

        $finalUrl .= implode('&', $paramsToAppend);
        return $finalUrl;
    }

    return $rawUrl;
}


function handle_migu_main_request($id)
{
    [$cached, $hit] = get_migu_cache($id);
    if ($hit) return $cached;

    [$tm, $saltSign] = get_sign_config($id);
    $salt = $saltSign[0];
    $sign = $saltSign[1];

    $url = sprintf(
        "https://play.miguvideo.com/playurl/v1/play/playurl?contId=%s&dolby=true&isMultiView=true&xh265=true&os=13&ott=false&rateType=3&salt=%s&sign=%s&timestamp=%s&ua=oneplus-12&vr=true",
        $id, $salt, $sign, $tm
    );

    $headers = [
        "Host" => "play.miguvideo.com",
        "appId" => "miguvideo",
        "terminalId" => "android",
        "User-Agent" => "Dalvik/2.1.0+(Linux;+U;+Android+13;+oneplus-13+Build/TP1A.220624.014)",
        "MG-BH" => "true",
        "appVersionName" => "6.3.35",
        "appVersion" => "2600033500",
        "Phone-Info" => "oneplus-13|13",
        "X-UP-CLIENT-CHANNEL-ID" => "2600033500-99000-201600010010028",
        "APP-VERSION-CODE" => "260335005",
        "Accept" => "*/*",
        "Connection" => "keep-alive",
    ];

    $body = send_get_request($url, $headers);
    if ($body === null) return null;

    $json = json_decode($body, true);
    if (!is_array($json)) return null;
    $rawUrl = "";
    if (isset($json["body"]["urlInfo"]["url"])) $rawUrl = (string)$json["body"]["urlInfo"]["url"];

    $ottUrl = migu_encrypted_url($rawUrl);
    if (trim($ottUrl) === "") return null;

    set_migu_cache($id, $ottUrl, 1800);
    return $ottUrl;
}


// 获取当前访问的URL和文件名
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$scriptPath = $_SERVER['SCRIPT_NAME'];
$baseUrl = $protocol . '://' . $host . $scriptPath;

// 频道列表数据
function get_channel_list() {
    return [
        ['name' => 'CCTV1', 'id' => '608807420'],
        ['name' => 'CCTV2', 'id' => '631780532'],
        ['name' => 'CCTV3', 'id' => '624878271'],
        ['name' => 'CCTV4', 'id' => '631780421'],
        ['name' => 'CCTV5', 'id' => '641886683'],
        ['name' => 'CCTV5+', 'id' => '641886773'],
        ['name' => 'CCTV6', 'id' => '624878396'],
        ['name' => 'CCTV7', 'id' => '673168121'],
        ['name' => 'CCTV8', 'id' => '624878356'],
        ['name' => 'CCTV9', 'id' => '673168140'],
        ['name' => 'CCTV10', 'id' => '624878405'],
        ['name' => 'CCTV11', 'id' => '667987558'],
        ['name' => 'CCTV12', 'id' => '673168185'],
        ['name' => 'CCTV13', 'id' => '608807423'],
        ['name' => 'CCTV14', 'id' => '624878440'],
        ['name' => 'CCTV15', 'id' => '673168223'],
        ['name' => 'CCTV17', 'id' => '673168256'],
        ['name' => 'CCTV4欧洲', 'id' => '608807419'],
        ['name' => 'CCTV4美洲', 'id' => '608807416'],
        ['name' => 'CGTN外语纪录', 'id' => '609006487'],
        ['name' => 'CGTN阿拉伯语', 'id' => '609154345'],
        ['name' => 'CGTN西班牙语', 'id' => '609006450'],
        ['name' => 'CGTN法语', 'id' => '609006476'],
        ['name' => 'CGTN俄语', 'id' => '609006446'],
        ['name' => '老故事', 'id' => '884121956'],
        ['name' => '中学生', 'id' => '708869532'],
        ['name' => 'CGTN', 'id' => '609017205'],
        ['name' => '东方卫视', 'id' => '651632648'],
        ['name' => '江苏卫视', 'id' => '623899368'],
        ['name' => '广东卫视', 'id' => '608831231'],
        ['name' => '江西卫视', 'id' => '783847495'],
        ['name' => '河南卫视', 'id' => '790187291'],
        ['name' => '陕西卫视', 'id' => '738910838'],
        ['name' => '大湾区卫视', 'id' => '608917627'],
        ['name' => '湖北卫视', 'id' => '947472496'],
        ['name' => '吉林卫视', 'id' => '947472500'],
        ['name' => '青海卫视', 'id' => '947472506'],
        ['name' => '东南卫视', 'id' => '849116810'],
        ['name' => '海南卫视', 'id' => '947472502'],
        ['name' => '海峡卫视', 'id' => '849119120'],
        ['name' => '中国农林卫视', 'id' => '956904896'],
        ['name' => '兵团卫视', 'id' => '956923145'],
        ['name' => '辽宁卫视', 'id' => '630291707'],
        ['name' => '上海新闻综合', 'id' => '651632657'],
        ['name' => '上视东方影视', 'id' => '617290047'],
        ['name' => '南京新闻综合频道', 'id' => '838109047'],
        ['name' => '南京教科频道', 'id' => '838153729'],
        ['name' => '南京十八频道', 'id' => '838151753'],
        ['name' => '江苏城市频道', 'id' => '626064714'],
        ['name' => '江苏国际', 'id' => '626064674'],
        ['name' => '江苏教育', 'id' => '628008321'],
        ['name' => '江苏影视频道', 'id' => '626064697'],
        ['name' => '江苏综艺频道', 'id' => '626065193'],
        ['name' => '公共新闻频道', 'id' => '626064693'],
        ['name' => '盐城新闻综合', 'id' => '639731825'],
        ['name' => '淮安新闻综合', 'id' => '639731826'],
        ['name' => '泰州新闻综合', 'id' => '639731818'],
        ['name' => '连云港新闻综合', 'id' => '639731715'],
        ['name' => '宿迁新闻综合', 'id' => '639731832'],
        ['name' => '徐州新闻综合', 'id' => '639731747'],
        ['name' => '优漫卡通频道', 'id' => '626064703'],
        ['name' => '江阴新闻综合', 'id' => '955227979'],
        ['name' => '南通新闻综合', 'id' => '955227985'],
        ['name' => '宜兴新闻综合', 'id' => '955227996'],
        ['name' => '溧水新闻综合', 'id' => '639737327'],
        ['name' => '陕西银龄频道', 'id' => '956909362'],
        ['name' => '陕西都市青春频道', 'id' => '956909358'],
        ['name' => '陕西体育休闲频道', 'id' => '956909356'],
        ['name' => '陕西秦腔频道', 'id' => '956909303'],
        ['name' => '陕西新闻资讯频道', 'id' => '956909289'],
        ['name' => '财富天下', 'id' => '956923159'],
        ['name' => '经典香港电影', 'id' => '625703337'],
        ['name' => '抗战经典影片', 'id' => '617432318'],
        ['name' => '新片放映厅', 'id' => '619495952'],
        ['name' => 'CHC影迷电影', 'id' => '952383261'],
        ['name' => '和美乡途轮播台', 'id' => '713591450'],
        ['name' => '高清大片', 'id' => '629943678'],
        ['name' => '南方影视', 'id' => '614961829'],
        ['name' => '血色山河·抗日战争影像志', 'id' => '713600957'],
        ['name' => '熊猫频道01高清', 'id' => '609158151'],
        ['name' => '熊猫频道1', 'id' => '608933610'],
        ['name' => '熊猫频道2', 'id' => '608933640'],
        ['name' => '熊猫频道3', 'id' => '608934619'],
        ['name' => '熊猫频道4', 'id' => '608934721'],
        ['name' => '熊猫频道5', 'id' => '608935104'],
        ['name' => '熊猫频道6', 'id' => '608935797'],
        ['name' => '熊猫频道7', 'id' => '609169286'],
        ['name' => '熊猫频道8', 'id' => '609169287'],
        ['name' => '熊猫频道9', 'id' => '609169226'],
        ['name' => '熊猫频道10', 'id' => '609169285'],
        ['name' => '最强综艺趴', 'id' => '629942228'],
        ['name' => '嘉佳卡通', 'id' => '614952364'],
        ['name' => '经典动画大集合', 'id' => '629942219'],
        ['name' => '新动力量创一流', 'id' => '713589837'],
        ['name' => '环球旅游', 'id' => '958475356'],
        ['name' => '钱塘江', 'id' => '647370520'],
        ['name' => '五环传奇', 'id' => '707671890'],
        ['name' => '赛事最经典', 'id' => '646596895'],
        ['name' => '掼蛋精英赛', 'id' => '631354620'],
        ['name' => '体坛名栏汇', 'id' => '629943305'],
        ['name' => '四海钓鱼', 'id' => '637444975'],
        ['name' => '咪咕24小时体育台', 'id' => '654102378'],
        ['name' => '24小时城市联赛轮播台', 'id' => '915512915'],
        ['name' => '武术世界', 'id' => '958475359'],
        ['name' => 'CETV1', 'id' => '923287154'],
        ['name' => 'CETV2', 'id' => '923287211'],
        ['name' => 'CETV4', 'id' => '923287339'],
        ['name' => '山东教育', 'id' => '609154353'],
    ];
}

// 判断是否有id参数
if (!isset($_GET['id']) || $_GET['id'] === '') {
    // 输出频道列表
    header('Content-Type: text/plain; charset=utf-8');
    $channels = get_channel_list();
    foreach ($channels as $channel) {
        echo $channel['name'] . ',' . $baseUrl . '?id=' . $channel['id'] . "\n";
    }
    exit;
}

// 有id参数，执行原有逻辑
$id = (string)$_GET['id'];
$res = handle_migu_main_request($id);
if ($res) {
    header('location:' . $res);
} else {
    http_response_code(404);
    echo "Stream not found";
}
