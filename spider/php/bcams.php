<?php
$id = isset($_GET['id']) ? $_GET['id'] : '';

$e_fb = "aHR0cHM6Ly9jZG4uanNlbGl2ci5uZXQvZ2gvamVyYWlubHZqaW5nL3R2bGl2ZUBkZW1vL2JhbmdvY2Ftcy5tcDQ=";
$e_api = "aHR0cHM6Ly9ib25nYWNhbXMuY29tL3Rvb2xzL2FtZi5waHA=";

$fallback = base64_decode($e_fb);
$api_url = base64_decode($e_api);

if (empty($id)) {
    header("Location: " . $fallback);
    exit;
}

$postData = http_build_query([
    'method' => 'getRoomData',
    'args[]' => $id
]);

$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n" .
                     "X-Requested-With: XMLHttpRequest\r\n" .
                     "Accept-Encoding: gzip\r\n" . 
                     "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36\r\n",
        'content' => $postData
    ]
];

$context  = stream_context_create($options);
$response = @file_get_contents($api_url, false, $context);

if ($response && bin2hex(substr($response, 0, 2)) == '1f8b') {
    $response = gzdecode($response);
}

if (!$response) {
    header("Location: " . $fallback);
    exit;
}

$data = json_decode($response, true);
$p = isset($data['performerData']) ? $data['performerData'] : null;

if ($p && 
    $p['isOnline'] === true && 
    $p['isAway'] === false && 
    $p['showType'] === 'public') {
    
    $serverUrl = ltrim($data['localData']['videoServerUrl'], '/'); 
    $username = $p['username'];
    
    $chunks_url = "https://" . $serverUrl . "/hls/stream_" . $username . "/public-aac/stream_" . $username . "/chunks.m3u8";
    
    header("Location: " . $chunks_url);
} else {
    header("Location: " . $fallback);
}
exit;
?>