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

$id = isset($_GET['id']) ? (string)$_GET['id'] : "608807420";
$res = handle_migu_main_request($id);
header('location:' . $res);