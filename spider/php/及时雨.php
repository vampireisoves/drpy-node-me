<?php
// 设置Content-Type为application/json
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

class XpgApi {
    private $host = 'http://box.9box.xyz';
    private $headers = [
        "User-Agent" => "okhttp/3.12.11"
    ];
    
    private function fetch($url, $params = []) {
        $ch = curl_init();
        
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $this->buildHeaders(),
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200 || !$response) {
            return ['code' => 0, 'msg' => '请求失败'];
        }
        
        return json_decode($response, true);
    }
    
    private function buildHeaders() {
        $headers = [];
        foreach ($this->headers as $key => $value) {
            $headers[] = "$key: $value";
        }
        return $headers;
    }
    
    private function getList($data) {
        $videos = [];
        foreach ($data as $vod) {
            $remarks = '';
            if (isset($vod['updateInfo']) && !empty($vod['updateInfo'])) {
                $remarks = "更新至{$vod['updateInfo']}";
            } elseif (isset($vod['score']) && !empty($vod['score'])) {
                $remarks = $vod['score'];
            }
            
            $videos[] = [
                "vod_id" => $vod['id'] ?? '',
                "vod_name" => $vod['name'] ?? '',
                "vod_pic" => $vod['pic'] ?? '',
                "vod_remarks" => $remarks
            ];
        }
        return $videos;
    }

    // 首页
    public function homeContent() {
        // 获取分类
        $rsp = $this->fetch("{$this->host}/api.php/v2.vod/androidtypes");
        
        if (!isset($rsp['data'])) {
            return json_encode(["code" => 0, "msg" => "获取分类失败"]);
        }
        
        $dy = [
            "classes" => "类型",
            "areas" => "地区", 
            "years" => "年份",
            "sortby" => "排序",
        ];
        
        $filters = [];
        $classes = [];
        
        foreach ($rsp['data'] as $item) {
            $has_non_empty_field = false;
            foreach ($dy as $key => $value) {
                if (isset($item[$key]) && !empty($item[$key]) && count($item[$key]) > 1) {
                    $has_non_empty_field = true;
                    break;
                }
            }
            
            $item['sortby'] = ['updatetime', 'hits', 'score'];
            $demos = ['时间', '人气', '评分'];
            $classes[] = ["type_name" => $item["type_name"], "type_id" => strval($item["type_id"])];
            
            if ($has_non_empty_field) {
                $filters[strval($item["type_id"])] = [];
                foreach ($dy as $dkey => $dvalue) {
                    if (isset($item[$dkey]) && !empty($item[$dkey]) && count($item[$dkey]) > 1) {
                        $values = $item[$dkey];
                        $value_array = [];
                        
                        foreach ($values as $idx => $value) {
                            if (!empty(trim($value))) {
                                if ($dkey == "sortby") {
                                    $value_array[] = ["n" => $demos[$idx] ?? $value, "v" => trim($value)];
                                } else {
                                    $value_array[] = ["n" => trim($value), "v" => trim($value)];
                                }
                            }
                        }
                        
                        if (!empty($value_array)) {
                            $filters[strval($item["type_id"])][] = [
                                "key" => $dkey,
                                "name" => $dy[$dkey],
                                "value" => $value_array
                            ];
                        }
                    }
                }
            }
        }
        
        // 获取首页推荐视频
        $videoRsp = $this->fetch("{$this->host}/api.php/v2.main/androidhome");
        $videos = [];
        if (isset($videoRsp['data']['list'])) {
            foreach ($videoRsp['data']['list'] as $i) {
                $videos = array_merge($videos, $this->getList($i['list']));
            }
        }
        
        return json_encode([
            "class" => $classes,
            "filters" => $filters,
            "list" => $videos
        ]);
    }

    // 分类内容
    public function categoryContent($t, $pg, $ext) {
        // 解析ext参数
        $extend = [];
        if (!empty($ext)) {
            $extData = base64_decode($ext);
            parse_str($extData, $extend);
        }
        
        $params = [
            "page" => $pg,
            "type" => $t,
            "area" => $extend['area'] ?? '',
            "year" => $extend['year'] ?? '',
            "sortby" => $extend['sortby'] ?? '',
            "class" => $extend['class'] ?? ''
        ];
        
        // 过滤空参数
        $params = array_filter($params, function($value) {
            return $value !== '';
        });
        
        $rsp = $this->fetch("{$this->host}/api.php/v2.vod/androidfilter10086", $params);
        
        if (!isset($rsp['data'])) {
            return json_encode(["code" => 0, "msg" => "获取分类内容失败"]);
        }
        
        return json_encode([
            'list' => $this->getList($rsp['data']),
            'page' => intval($pg),
            'pagecount' => 9999,
            'limit' => 90,
            'total' => 999999
        ]);
    }

    // 详情内容
    public function detailContent($ids) {
        $rsp = $this->fetch("{$this->host}/api.php/v3.vod/androiddetail2", ["vod_id" => $ids]);
        
        if (!isset($rsp['data'])) {
            return json_encode(["code" => 0, "msg" => "获取详情失败"]);
        }
        
        $v = $rsp['data'] ?? [];
        $urls = $v['urls'] ?? [];
        $play_items = [];
        
        $allowed_chinese_keywords = [
            '蓝光', '超清', '高清', '标清', '枪版', '全清',
            '全集', '全', '完整版', '正片', '预告', '花絮'
        ];
        
        foreach ($urls as $i) {
            $key = trim($i['key'] ?? $i['name'] ?? "");
            $url = trim($i['url'] ?? "");
            
            if ($key && $url) {
                if (in_array($key, $allowed_chinese_keywords)) {
                    $play_items[] = "{$key}\${$url}";
                } else {
                    $matched = false;
                    
                    // 纯数字
                    if (preg_match('/^\d+$/', $key)) $matched = true;
                    // 数字范围
                    elseif (preg_match('/^\d+-\d+$/', $key)) $matched = true;
                    // 第X集/期/话/节
                    elseif (preg_match('/^第\d+[集期话节]$/', $key)) $matched = true;
                    // 第X季
                    elseif (preg_match('/^第\d+季$/', $key)) $matched = true;
                    // 集X/期X/话X
                    elseif (preg_match('/^[集期话]?\d+$/', $key)) $matched = true;
                    // EP1/E01
                    elseif (preg_match('/^E[P]?\d+$/i', $key)) $matched = true;
                    // 分辨率
                    elseif (preg_match('/^\d+[PpKk]$/', $key)) $matched = true;
                    // HD/FHD/UHD
                    elseif (preg_match('/^[Hh][Dd]$/', $key)) $matched = true;
                    elseif (preg_match('/^[Ff][Hh][Dd]$/', $key)) $matched = true;
                    elseif (preg_match('/^[Uu][Hh][Dd]$/', $key)) $matched = true;
                    
                    if ($matched) {
                        $play_items[] = "{$key}\${$url}";
                    }
                }
            }
        }
        
        $play_url = implode("#", $play_items);
        
        $vod = [
            'vod_id' => $v['id'] ?? '',
            'vod_name' => $v['name'] ?? '',
            'vod_pic' => $v['pic'] ?? '',
            'vod_year' => $v['year'] ?? '',
            'vod_area' => $v['area'] ?? '',
            'vod_lang' => $v['lang'] ?? '',
            'type_name' => $v['className'] ?? '',
            'vod_actor' => $v['actor'] ?? '未知',
            'vod_director' => $v['director'] ?? '未知',
            'vod_content' => $v['content'] ?? '暂无简介',
            'vod_play_from' => '及时雨',
            'vod_play_url' => $play_url
        ];
        
        return json_encode(['list' => [$vod]]);
    }

    // 搜索内容 - 修复搜索功能
    public function searchContent($wd, $quick, $pg = '1') {
        $rsp = $this->fetch("{$this->host}/api.php/v2.vod/androidsearch10086", [
            "page" => $pg,
            "wd" => $wd
        ]);
        
        if (!isset($rsp['data'])) {
            return json_encode(["code" => 0, "msg" => "搜索失败"]);
        }
        
        $videos = [];
        if (isset($rsp['data']) && is_array($rsp['data'])) {
            $videos = $this->getList($rsp['data']);
        }
        
        return json_encode([
            'list' => $videos,
            'page' => intval($pg),
            'pagecount' => 9999,
            'limit' => 90,
            'total' => 999999
        ]);
    }

    // 播放内容
    public function playerContent($play, $flag) {
        $header = [
            'user_id' => 'JSYBOX',
            'token2' => 'fXk3sAyqkwgwRm8DRSqFMKdUGqn28BZUoPc4m0HPZtp3Dnsusxc8mfRSg98=',
            'version' => 'JSYBOX com.phoenix.jsy.box1.0.5',
            'hash' => 'fcb9',
            'screenx' => '2568',
            'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            'token' => 'UkVQvnKFg387f2pSex23Ar1fPfD4ww8ju9BplAu/ZoNfM0o1kgZH2vZNxN9EUFS+BiEyB/fGa4cPNZkOZQJqe/ApC3U9wm2iHVNDYpliWyJdpXsGUF1phi27iSLuL2FdkIUxFzlzRrfs7EEYUDcn7ay0UW0I+CiJsirsUJHwBSLjXl9+W1dmHUogbL59VrqTWSnVhg==',
        'token2' => 'fXk3sAyqkwgwRm8DRSqFMKdUGqn28BZUoPc4m0HPZtp3Dnsusxc8mfRSg98=',
            'timestamp' => '1765796961',
            'screeny' => '1184',
        ];
        
        $id = $play;
        if (strpos($id, 'http') === false) {
            $id = "http://c.xpgtv.net/m3u8/{$id}.m3u8";
        }
        
        return json_encode([
            "parse" => 0, 
            "url" => $id, 
            "header" => $header
        ]);
    }

    public function handleRequest() {
        $ac = $_GET['ac'] ?? '';
        $t = $_GET['t'] ?? '';
        $pg = $_GET['pg'] ?? '1';
        $ids = $_GET['ids'] ?? '';
        $wd = $_GET['wd'] ?? '';
        $quick = $_GET['quick'] ?? false;
        $filter = $_GET['filter'] ?? '';
        $ext = $_GET['ext'] ?? '';
        $play = $_GET['play'] ?? '';
        $flag = $_GET['flag'] ?? '';

        if ($filter === 'true') {
            // 首页
            echo $this->homeContent();
        } elseif ($ac === 'detail' && !empty($t)) {
            // 分类
            echo $this->categoryContent($t, $pg, $ext);
        } elseif ($ac === 'detail' && !empty($ids)) {
            // 详情
            echo $this->detailContent($ids);
        } elseif (!empty($play)) {
            // 播放
            echo $this->playerContent($play, $flag);
        } elseif (!empty($wd)) {
            // 搜索 - 修复搜索判断条件
            echo $this->searchContent($wd, $quick, $pg);
        } else {
            // 默认首页
            echo $this->homeContent();
        }
    }
}

// 启动应用
try {
    $api = new XpgApi();
    $api->handleRequest();
} catch (Exception $e) {
    echo json_encode(["code" => 0, "msg" => "系统错误: " . $e->getMessage()]);
}
?>