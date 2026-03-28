<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $host = 'http://ldys.sq1005.top';
    private $publicKey = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCoYt0BP77U+DM08BiI/QbSRIfxijXo85BTPqIM1Ow8BNwhLETzRIZ+dEwdWDbydG/PspgBAfRpGaYVdJYtvaC2JnoO8+Ik6qMWojfEJxSFLa0Pb0A892tun4gsxoEMjcreZ+YGyaBxAfqX0BSMfdrOgIYaZQjYrw9TRLlUT31QoQIDAQAB\n-----END PUBLIC KEY-----";
    private $privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCquQQ5r6+yJI8CDFkXRp8vUsdD45ov8EP12ooLs56ca2DQXaSNGS9910bAPVA9chkp0mKIvKqjAsHz5Tl9EeNPblarGEeJUIxpxZtiSqNTpvtiD/TjhpzuHYic7RAfQ/h7p/ypE8ymU42pYjsB5t26Mv6XgkLV+jzrSf73HlCuS0iMyLmt6zz3Mw9izM13EpB8iFLtfbbYymycKTx4RAmPQLwhNGex/AlUIYxXP4R2yyaa4W6mEtc6aME2QuzJFxPgP3HJ9NBx/LWVn4skxWjZ7zg+VRQRHnjyVaSLu3Z5gN5ITWCyE32qaHJa6WBahZj5jWhRyAG1bQ+xKJa8lBL5AgMBAAECggEAUwv9SjJ0PSwbhNuM2w23kcWquROWhYtTA91zGY4esehqB/IFgb2mpIh8Gje5OKqwIu/8jpd4SiOlRYdUF8sD0DfUYRZGdj2AkFNX6tBz8tVfo6wvbB6naA1lzzBij1L5JO3qsjS3cJFkb+kg2yP66AC2Z+0tpfk8eRhdtshAZwfcd1DEGt1uAvYL1eaUK9HRvpt9lPeGcHERDl2hBd4uyaF0K1O+zF9y59nYbTySWPxRZq3sFEE85xRMlstD7YZi7W2gKvMFRD4/FKmrZ3m7aKJRITtyKOyyPcYmepNv3Qv7kk59Pg38n2WWQ0Ra/bCH3E48YNCnQvZMpitkTfJhoQKBgQDbnROOYTP8OTJ6f/qhoGjxeO3x1VOaOp8l0x7b0SCfoqNGS0Cyiqj72BmJtPMPqSTjn6MmNzqbg1KOdhXyzNozs+i5ccW1M56j96mr5I/Z0FpE3oyIHNfDDBlf9M8YQqEF9oYxniYYft9oapO7cRQkHER6qpvnHTavwlv4m78CXwKBgQDHAjs2YlpKDdI1lcbZJCc7TwtH+Pd2bUki8YXafWNcPhITQHbOZjr310eK1QJC6GJncjkOqbX7yv3ivvTO35FZTQhuA1xEG1P00FG8bE0tHYPIwQHi9y0eA5cieMdo8E6XYria1mw/3fqSQEsfZyJlR32JQIoGAipM8iO1X2nZpwKBgDkMFIhnt5lNQk+P7wsNIDWZtDWdtJnboHuy29E+Abt2A/O+mI/IdRz2hau/1WO8DFkUnszOi+rZshhPlGP90rCbi1igtTrcrdjp/KkqNjPea5R4OwkgdOu1uOG0NheXNzzVTQaWjk7Opjn5dWa7eP/oV+GFb/oZHJuLYVizHGsBAoGADA7rjZEKDYCm4w5PPSr+oY5ZjaPdQrS+gLqHtMRyN82fBMGcMUdqfUfzEstzVqCEDeaS5HuOBlK3bXzKkppjUTjksN3NQmcxgBz7RuJ9DqXCLXDcb2cwuafYCYOt+YLOEEgwDVm+t2P44dG5e46hO+fICH/7nP+WlpD5buz4GfMCgYB57r3g/6hi9WUDnfc7ZAzWMqR0EhJVYKYy+KFEtdIPzhkkIHq5RASe88E9kzoGoZFdb3tIjvGZWcHerirrqWkMsuQtP/Qi0zjieid5tAPj+r4kbiCVTw0E0jnmPBzGInQi7lpeTTKnG1fbyS5lBS+WmHfIuzpECgCkxhaT+LJJkg==\n-----END PRIVATE KEY-----";
    
    private $deviceId = '';
    private $token = '';

    protected function getHeaders() {
        if (empty($this->deviceId)) {
            $this->deviceId = $this->generateDid();
        }
        if (empty($this->token)) {
            $this->token = $this->getToken();
        }

        return [
            'User-Agent' => 'okhttp/4.12.0',
            'client' => 'app',
            'deviceType' => 'Android',
            'deviceId' => $this->deviceId,
            'token' => $this->token,
            'Content-Type' => 'application/json'
        ];
    }

    private function generateDid() {
        $hex = '0123456789abcdef';
        $did = '';
        for ($i = 0; $i < 16; $i++) {
            $did .= $hex[mt_rand(0, 15)];
        }
        return $did;
    }

    private function getToken() {
        $url = $this->host . '/api/v1/app/user/visitorInfo';
        $headers = [
            'User-Agent' => 'okhttp/4.12.0',
            'client' => 'app',
            'deviceType' => 'Android',
            'deviceId' => $this->deviceId
        ];
        
        $jsonStr = $this->fetch($url, [], $headers);
        $json = json_decode($jsonStr, true);
        
        if (isset($json['code']) && $json['code'] === 200 && isset($json['data']['token'])) {
            return $json['data']['token'];
        }
        return '';
    }

    private function rsaEncrypt($data) {
        if (openssl_public_encrypt($data, $encrypted, $this->publicKey, OPENSSL_PKCS1_PADDING)) {
            return base64_encode($encrypted);
        }
        return '';
    }

    private function rsaDecrypt($data) {
        $decoded = base64_decode($data);
        
        $keyRes = openssl_pkey_get_private($this->privateKey);
        $details = openssl_pkey_get_details($keyRes);
        $keySize = ceil($details['bits'] / 8); // 128 for 1024 bit
        
        $result = '';
        $chunks = str_split($decoded, $keySize);
        
        foreach ($chunks as $chunk) {
            if (openssl_private_decrypt($chunk, $decrypted, $this->privateKey, OPENSSL_PKCS1_PADDING)) {
                $result .= $decrypted;
            } else {
                // error_log("Decrypt failed for chunk");
            }
        }
        
        return $result;
    }

    public function homeContent($filter) {
        $url = $this->host . '/api/v1/app/screen/screenType';
        $jsonStr = $this->fetch($url, [
            CURLOPT_POST => 1,
            CURLOPT_HTTPHEADER => $this->formatHeaders($this->getHeaders())
        ]);
        
        $json = json_decode($jsonStr, true);
        $classes = [];
        $filterObj = [];

        if (isset($json['data'])) {
            foreach ($json['data'] as $mainCate) {
                $typeId = (string)$mainCate['id'];
                $classes[] = [
                    'type_id' => $typeId,
                    'type_name' => $mainCate['name']
                ];

                $filters = [];
                if (isset($mainCate['children'])) {
                    foreach ($mainCate['children'] as $subCate) {
                        $filterType = '';
                        switch ($subCate['name']) {
                            case '类型': $filterType = 'type'; break;
                            case '地区': $filterType = 'area'; break;
                            case '年份': $filterType = 'year'; break;
                        }

                        if ($filterType) {
                            $values = [['n' => '全部', 'v' => '']];
                            foreach ($subCate['children'] as $item) {
                                $values[] = ['n' => $item['name'], 'v' => $item['name']];
                            }
                            $filters[] = [
                                'key' => $filterType,
                                'name' => $subCate['name'],
                                'value' => $values
                            ];
                        }
                    }
                }
                
                $filters[] = [
                    'key' => 'sort',
                    'name' => '排序',
                    'value' => [
                        ['n' => '最新', 'v' => 'NEWEST'],
                        ['n' => '人气', 'v' => 'POPULARITY'],
                        ['n' => '评分', 'v' => 'COLLECT'],
                        ['n' => '热搜', 'v' => 'HOT']
                    ]
                ];
                
                $filterObj[$typeId] = $filters;
            }
        }

        return [
            'class' => $classes,
            'filters' => $filterObj
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        $url = $this->host . '/api/v1/app/screen/screenMovie';
        
        $condition = [
            'classify' => $extend['type'] ?? '',
            'region' => $extend['area'] ?? '',
            'sreecnTypeEnum' => $extend['sort'] ?? 'NEWEST',
            'typeId' => $tid,
            'year' => $extend['year'] ?? ''
        ];
        
        $params = [
            'condition' => $condition,
            'pageNum' => (int)$pg,
            'pageSize' => 40
        ];

        $jsonStr = $this->fetch($url, [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($params),
            CURLOPT_HTTPHEADER => $this->formatHeaders($this->getHeaders())
        ]);

        $json = json_decode($jsonStr, true);
        $videos = [];
        
        if (isset($json['data']['records'])) {
            foreach ($json['data']['records'] as $item) {
                $videos[] = [
                    'vod_id' => $item['id'] . '*' . $item['typeId'],
                    'vod_name' => $item['name'],
                    'vod_pic' => $item['cover'],
                    'vod_remarks' => $item['totalEpisode'] ?? ''
                ];
            }
        }

        $total = $json['data']['total'] ?? 0;
        return $this->pageResult($videos, $pg, $total, 40);
    }

    public function detailContent($ids) {
        $id = is_array($ids) ? $ids[0] : $ids;
        $parts = explode('*', $id);
        $vodId = (int)$parts[0];
        $typeId = $parts[1] ?? '';

        // 1. 获取基本详情
        $detailUrl = $this->host . '/api/v1/app/play/movieDesc';
        $detailParams = ['id' => $vodId, 'typeId' => $typeId];
        
        $detailRes = $this->fetch($detailUrl, [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($detailParams),
            CURLOPT_HTTPHEADER => $this->formatHeaders($this->getHeaders())
        ]);
        
        $detailJson = json_decode($detailRes, true);
        $detailData = $detailJson['data'] ?? [];

        // 2. 获取播放列表 (加密)
        $playReqPayload = json_encode([
            'id' => $vodId,
            'source' => 0,
            'typeId' => $typeId
        ]);
        
        $playParams = ['key' => $this->rsaEncrypt($playReqPayload)];
        
        $playDataRes = $this->fetch($this->host . '/api/v1/app/play/movieDetails', [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($playParams),
            CURLOPT_HTTPHEADER => $this->formatHeaders($this->getHeaders())
        ]);
        
        $playJson = json_decode($playDataRes, true);
        $playDataEnc = $playJson['data'] ?? '';
        
        $decryptedDataStr = $this->rsaDecrypt($playDataEnc);
        
        $decryptedData = json_decode($decryptedDataStr, true);
        
        $shows = [];
        $playUrls = [];
        
        if (isset($decryptedData['moviePlayerList'])) {
            foreach ($decryptedData['moviePlayerList'] as $player) {
                // 3. 获取具体集数 (加密)
                $episodePayload = json_encode([
                    'id' => $vodId,
                    'source' => 0,
                    'typeId' => $typeId,
                    'playerId' => $player['id']
                ]);
                
                $episodeParams = ['key' => $this->rsaEncrypt($episodePayload)];
                
                $episodeRes = $this->fetch($this->host . '/api/v1/app/play/movieDetails', [
                    CURLOPT_POST => 1,
                    CURLOPT_POSTFIELDS => json_encode($episodeParams),
                    CURLOPT_HTTPHEADER => $this->formatHeaders($this->getHeaders())
                ]);
                
                $episodeJson = json_decode($episodeRes, true);
                $episodeDataEnc = $episodeJson['data'] ?? '';
                
                $episodeDecStr = $this->rsaDecrypt($episodeDataEnc);
                $episodeDecData = json_decode($episodeDecStr, true);
                
                $urls = [];
                if (isset($episodeDecData['episodeList'])) {
                    foreach ($episodeDecData['episodeList'] as $ep) {
                        $param = [
                            'id' => $vodId,
                            'typeId' => $typeId,
                            'playerId' => $player['id'],
                            'episodeId' => $ep['id']
                        ];
                        // 封装参数到URL中
                        $urls[] = $ep['episode'] . '$' . json_encode($param);
                    }
                }
                
                if (!empty($urls)) {
                    $shows[] = $player['moviePlayerName'];
                    $playUrls[] = implode('#', $urls);
                }
            }
        }

        $vod = [
            'vod_id' => $id,
            'vod_name' => $detailData['name'] ?? '',
            'vod_pic' => $detailData['cover'] ?? '',
            'vod_year' => $detailData['year'] ?? '',
            'vod_area' => $detailData['area'] ?? '',
            'vod_remarks' => $detailData['totalEpisode'] ?? '',
            'vod_actor' => $detailData['star'] ?? '',
            'vod_content' => $detailData['introduce'] ?? '',
            'vod_play_from' => implode('$$$', $shows),
            'vod_play_url' => implode('$$$', $playUrls)
        ];

        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        $url = $this->host . '/api/v1/app/search/searchMovie';
        $params = [
            'condition' => ['value' => $key],
            'pageNum' => (int)$pg,
            'pageSize' => 40
        ];

        $jsonStr = $this->fetch($url, [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($params),
            CURLOPT_HTTPHEADER => $this->formatHeaders($this->getHeaders())
        ]);

        $json = json_decode($jsonStr, true);
        $videos = [];
        
        if (isset($json['data']['records'])) {
            foreach ($json['data']['records'] as $item) {
                $videos[] = [
                    'vod_id' => $item['id'] . '*' . $item['typeId'],
                    'vod_name' => $item['name'],
                    'vod_pic' => $item['cover'],
                    'vod_remarks' => $item['totalEpisode'] ?? ''
                ];
            }
        }
        
        $total = $json['data']['total'] ?? 0;
        return $this->pageResult($videos, $pg, $total, 40);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        // $id 是 detailContent 中封装的 JSON 参数
        $param = json_decode($id, true);
        
        $urlPayload = json_encode([
            'id' => $param['id'],
            'source' => 0,
            'typeId' => $param['typeId'],
            'playerId' => $param['playerId'],
            'episodeId' => $param['episodeId']
        ]);
        
        $urlParams = ['key' => $this->rsaEncrypt($urlPayload)];
        
        $postData = $this->fetch($this->host . '/api/v1/app/play/movieDetails', [
            CURLOPT_POST => 1,
            CURLOPT_POSTFIELDS => json_encode($urlParams),
            CURLOPT_HTTPHEADER => $this->formatHeaders($this->getHeaders())
        ]);
        
        $json = json_decode($postData, true);
        $encryptedUrl = $json['data'] ?? '';
        
        $decryptedUrlDataStr = $this->rsaDecrypt($encryptedUrl);
        $playerUrlData = json_decode($decryptedUrlDataStr, true);
        $playerUrl = $playerUrlData['url'] ?? '';
        
        // 最后一步分析 URL
        $analysisUrl = $this->host . '/api/v1/app/play/analysisMovieUrl?playerUrl=' . urlencode($playerUrl) . '&playerId=' . $param['playerId'];
        
        $analysisRes = $this->fetch($analysisUrl, [
            CURLOPT_HTTPHEADER => $this->formatHeaders($this->getHeaders())
        ]);
        
        $analysisJson = json_decode($analysisRes, true);
        $finalUrl = $analysisJson['data'] ?? '';

        return [
            'parse' => 0,
            'url' => $finalUrl,
            'header' => [
                'User-Agent' => 'okhttp/4.12.0'
            ]
        ];
    }

    // 辅助方法：将关联数组 headers 转换为 curl 需要的格式
    private function formatHeaders($headers) {
        $formatted = [];
        foreach ($headers as $k => $v) {
            $formatted[] = "$k: $v";
        }
        return $formatted;
    }
}

// 运行爬虫
(new Spider())->run();
