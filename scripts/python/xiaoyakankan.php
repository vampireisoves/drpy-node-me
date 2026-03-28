<?php
// ═══════════════════════════════════════════════════════════════
//                    小鸭看看 - PHP T4源 (小聋人crazy)
// ═══════════════════════════════════════════════════════════════
// 更新日志:
// - 修复分类ID和筛选器配置
// - 修正分页URL拼接逻辑 (/cat/id-pg.html)
// - 优化无数据问题
//
// 版本: 3.5.0

error_reporting(0);
header('Content-Type: application/json; charset=utf-8');

$config = array(
    'host' => 'https://xiaoyakankan.com',
    'timeout' => 15,
    'ua' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);

// 1. 主分类列表
$categories = array(
    array('type_id' => '10', 'type_name' => '电影'),
    array('type_id' => '11', 'type_name' => '连续剧'),
    array('type_id' => '12', 'type_name' => '综艺'),
    array('type_id' => '13', 'type_name' => '动漫'),
    array('type_id' => '15', 'type_name' => '福利')
);

// 2. 子分类配置 (基于真实网页结构)
$filters = array(
    '10' => array(
        array(
            'key' => 'class',
            'name' => '分类',
            'value' => array(
                array('n' => '全部', 'v' => '10'),
                array('n' => '动作片', 'v' => '1001'),
                array('n' => '喜剧片', 'v' => '1002'),
                array('n' => '爱情片', 'v' => '1003'),
                array('n' => '科幻片', 'v' => '1004'),
                array('n' => '恐怖片', 'v' => '1005'),
                array('n' => '剧情片', 'v' => '1006'),
                array('n' => '战争片', 'v' => '1007'),
                array('n' => '纪录片', 'v' => '1008'),
                array('n' => '微电影', 'v' => '1009'),
                array('n' => '动漫电影', 'v' => '1010'),
                array('n' => '奇幻片', 'v' => '1011'),
                array('n' => '动画片', 'v' => '1013'),
                array('n' => '犯罪片', 'v' => '1014'),
                array('n' => '悬疑片', 'v' => '1016'),
                array('n' => '欧美片', 'v' => '1017'),
                array('n' => '邵氏电影', 'v' => '1019'),
                array('n' => '同性片', 'v' => '1021'),
                array('n' => '歌舞片', 'v' => '1022'),
                array('n' => '家庭片', 'v' => '1024'),
                array('n' => '古装片', 'v' => '1025'),
                array('n' => '历史片', 'v' => '1026'),
                array('n' => '4K电影', 'v' => '1027')
            )
        )
    ),
    '11' => array(
        array(
            'key' => 'class',
            'name' => '地区',
            'value' => array(
                array('n' => '全部', 'v' => '11'),
                array('n' => '国产剧', 'v' => '1101'),
                array('n' => '香港剧', 'v' => '1102'),
                array('n' => '韩国剧', 'v' => '1103'),
                array('n' => '欧美剧', 'v' => '1104'),
                array('n' => '台湾剧', 'v' => '1105'),
                array('n' => '日本剧', 'v' => '1106'),
                array('n' => '海外剧', 'v' => '1107'),
                array('n' => '泰国剧', 'v' => '1108'),
                array('n' => '港台剧', 'v' => '1110'),
                array('n' => '日韩剧', 'v' => '1111'),
                array('n' => '东南亚剧', 'v' => '1112')
            )
        )
    ),
    '12' => array(
        array(
            'key' => 'class',
            'name' => '分类',
            'value' => array(
                array('n' => '全部', 'v' => '12'),
                array('n' => '内地综艺', 'v' => '1201'),
                array('n' => '港台综艺', 'v' => '1202'),
                array('n' => '日韩综艺', 'v' => '1203'),
                array('n' => '欧美综艺', 'v' => '1204'),
                array('n' => '国外综艺', 'v' => '1205')
            )
        )
    ),
    '13' => array(
        array(
            'key' => 'class',
            'name' => '分类',
            'value' => array(
                array('n' => '全部', 'v' => '13'),
                array('n' => '国产动漫', 'v' => '1301'),
                array('n' => '日韩动漫', 'v' => '1302'),
                array('n' => '欧美动漫', 'v' => '1303'),
                array('n' => '海外动漫', 'v' => '1305'),
                array('n' => '里番', 'v' => '1307')
            )
        )
    ),
    '15' => array(
        array(
            'key' => 'class',
            'name' => '分类',
            'value' => array(
                array('n' => '全部', 'v' => '15'),
                array('n' => '韩国', 'v' => '1551'),
                array('n' => '日本', 'v' => '1552'),
                array('n' => '香港', 'v' => '1553'),
                array('n' => '台湾', 'v' => '1554'),
                array('n' => '大陆', 'v' => '1555'),
                array('n' => '美国', 'v' => '1556'),
                array('n' => '欧洲', 'v' => '1557'),
                array('n' => '印度', 'v' => '1558'),
                array('n' => '东南亚', 'v' => '1559'),
                array('n' => '其它', 'v' => '1550')
            )
        )
    )
);

// ════════════ 工具函数 ════════════

function safe_json_encode($data)
{
    return json_encode($data, JSON_UNESCAPED_UNICODE);
}

function httpGet($url)
{
    global $config;
    if (!function_exists('curl_init'))
        return '';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_TIMEOUT, $config['timeout']);
    curl_setopt($ch, CURLOPT_USERAGENT, $config['ua']);
    // 自动重定向
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    $res = curl_exec($ch);
    curl_close($ch);
    return $res;
}

function fixPicUrl($pic)
{
    global $config;
    if (!$pic)
        return '';
    if (strpos($pic, '//') === 0)
        return 'https:' . $pic;
    if (strpos($pic, '/') === 0)
        return $config['host'] . $pic;
    return $pic;
}

function get_sub_string($str, $start, $end)
{
    $pos_start = strpos($str, $start);
    if ($pos_start === false)
        return '';
    $pos_end = strpos($str, $end, $pos_start + strlen($start));
    if ($pos_end === false)
        return '';
    return substr($str, $pos_start + strlen($start), $pos_end - $pos_start - strlen($start));
}

function parseVideoList($html)
{
    $videos = array();
    // 兼容多种HTML结构
    $items = explode('class="item"', $html);
    if (count($items) <= 1) {
        // 尝试备用分割符 (如果有变动)
        $items = explode('<div class="item">', $html);
    }

    array_shift($items); // 移除第一个非item部分

    foreach ($items as $item) {
        $vodId = get_sub_string($item, 'href="/post/', '.html"');

        // 尝试获取标题
        $title = '';
        if (strpos($item, 'class="title"') !== false) {
            $p1 = strpos($item, 'class="title"');
            $p2 = strpos($item, '>', $p1);
            $p3 = strpos($item, '</a>', $p2);
            if ($p2 !== false && $p3 !== false) {
                $title = strip_tags(substr($item, $p2 + 1, $p3 - $p2 - 1));
            }
        }

        // 兜底标题
        if (!$title) {
            $t1 = get_sub_string($item, 'title="', '"');
            if ($t1)
                $title = $t1;
        }

        $pic = get_sub_string($item, 'data-src="', '"');
        if (!$pic)
            $pic = get_sub_string($item, 'src="', '"');

        $remarks = '';
        if (strpos($item, 'badge') !== false) {
            $remarks = strip_tags(get_sub_string($item, 'class="badge">', '</span>'));
        }
        if (!$remarks && strpos($item, 'tag2') !== false) {
            $remarks = strip_tags(get_sub_string($item, 'class="tag2">', '</span>'));
        }
        // 如果还没有备注，尝试从text获取 (例如 "1080p 动作片 / 2025")
        if (!$remarks) {
            preg_match('/div class="text">([^<]+)/', $item, $mT);
            if (isset($mT[1])) {
                $remarks = trim($mT[1]);
                // 简化备注
                $parts = explode('/', $remarks);
                if (count($parts) > 1)
                    $remarks = trim(end($parts));
            }
        }

        if ($vodId && $title) {
            $title = trim($title);
            $videos[] = array(
                'vod_id' => $vodId,
                'vod_name' => $title,
                'vod_pic' => fixPicUrl($pic),
                'vod_remarks' => trim($remarks)
            );
        }
    }
    return $videos;
}

function parseVideoDetail($html, $vodId)
{
    $title = get_sub_string($html, '<title>', '</title>');
    $title = preg_replace('/- 小鸭看看.*/', '', $title);

    $pic = get_sub_string($html, 'class="m4-detail"', '>');
    $pic = get_sub_string($html, 'data-src="', '"');
    if (!$pic)
        $pic = get_sub_string($html, 'src="', '"');

    $desc = get_sub_string($html, 'name="description" content="', '"');

    $playFrom = array();
    $playUrl = array();

    // 尝试解析 pp 数据变量
    if (preg_match('/var pp=(\{.*?\});/s', $html, $m)) {
        $data = json_decode($m[1], true);
        if ($data && isset($data['lines'])) {
            foreach ($data['lines'] as $line) {
                $playFrom[] = isset($line[1]) ? $line[1] : '线路';
                $eps = array();
                if (isset($line[3]) && is_array($line[3])) {
                    foreach ($line[3] as $k => $u) {
                        $eps[] = '第' . ($k + 1) . '集$' . $u;
                    }
                }
                $playUrl[] = implode('#', $eps);
            }
        }
    }

    // HTML解析兜底
    if (empty($playFrom)) {
        $sources = explode('class="source"', $html);
        array_shift($sources);
        foreach ($sources as $k => $src) {
            $name = strip_tags(get_sub_string($src, 'class="name">', '</span>'));
            if (!$name)
                $name = '线路' . ($k + 1);

            $eps = array();
            preg_match_all('/<a[^>]*>(.*?)<\/a>/', $src, $ams);
            if (isset($ams[0])) {
                foreach ($ams[0] as $idx => $aTag) {
                    $epName = strip_tags($aTag);
                    preg_match('/data-play="([^"]+)"/', $aTag, $pm);
                    $playId = isset($pm[1]) ? $pm[1] : '';
                    if (!$playId) {
                        $playId = $vodId . '_' . $k . '_' . $idx;
                    }
                    $eps[] = $epName . '$' . $playId;
                }
            }
            if (!empty($eps)) {
                $playFrom[] = $name;
                $playUrl[] = implode('#', $eps);
            }
        }
    }

    return array(
        'vod_id' => $vodId,
        'vod_name' => trim($title),
        'vod_pic' => fixPicUrl($pic),
        'vod_content' => $desc,
        'vod_play_from' => implode('$$$', $playFrom),
        'vod_play_url' => implode('$$$', $playUrl)
    );
}

// ════════════ 主入口 ════════════

$t = isset($_GET['t']) ? $_GET['t'] : '10';
$pg = isset($_GET['pg']) ? $_GET['pg'] : 1;
if ($pg < 1)
    $pg = 1;
$wd = isset($_GET['wd']) ? $_GET['wd'] : '';
$ids = isset($_GET['ids']) ? $_GET['ids'] : '';

// 筛选器参数解析 (支持 ext/class)
// 逻辑: 如果传入筛选器ID (如1001)，直接覆盖主分类ID，因为网站结构是 /cat/1001.html
if (isset($_GET['ext'])) {
    $ext = $_GET['ext'];
    if (is_numeric($ext)) {
        $t = $ext;
    } else {
        $b64 = base64_decode($ext);
        if ($b64) {
            $j = json_decode($b64, true);
            if ($j && (isset($j['class']) || isset($j['cateId']))) {
                $t = isset($j['class']) ? $j['class'] : $j['cateId'];
            }
        }
    }
}
if (isset($_GET['class'])) {
    $t = $_GET['class'];
}
if (isset($_GET['filter'])) { // 兼容部分壳子
    $t = $_GET['filter'];
}

// 1. 播放解析
if (isset($_GET['play'])) {
    echo safe_json_encode(array(
        'parse' => (strpos($_GET['play'], 'http') === 0) ? 0 : 1,
        'url' => $_GET['play'],
        'header' => array('User-Agent' => $config['ua'])
    ));
    exit;
}

// 2. 详情
if ($ids) {
    $html = httpGet($config['host'] . '/post/' . $ids . '.html');
    $list = array();
    if ($html) {
        $list[] = parseVideoDetail($html, $ids);
    }
    echo safe_json_encode(array('list' => $list));
    exit;
}

// 3. 搜索
if ($wd) {
    // 搜索暂时遍历主要分类 (网站无公开搜索接口防CF)
    $cats = array('10', '11', '13');
    $list = array();
    foreach ($cats as $cid) {
        if (count($list) >= 20)
            break;
        $html = httpGet($config['host'] . '/cat/' . $cid . '.html');
        if ($html) {
            $tmp = parseVideoList($html);
            foreach ($tmp as $v) {
                if (stripos($v['vod_name'], $wd) !== false) {
                    $list[] = $v;
                }
            }
        }
    }
    echo safe_json_encode(array('list' => $list));
    exit;
}

// 4. 列表 (分类/筛选)
// 构造URL: /cat/10.html 或 /cat/10-2.html
$url = $config['host'] . '/cat/' . $t;
if ($pg > 1) {
    $url .= '-' . $pg;
}
$url .= '.html';

$html = httpGet($url);
$list = array();
$totalPage = $pg;

if ($html) {
    $list = parseVideoList($html);

    // 解析总页数
    // 格式: .../cat/10-13.html">13</a> <a href="...">»</a>
    if (preg_match_all('/\/cat\/\d+-(\d+)\.html/', $html, $matches)) {
        if (isset($matches[1]) && is_array($matches[1])) {
            $maxP = 1;
            foreach ($matches[1] as $p) {
                if (intval($p) > $maxP)
                    $maxP = intval($p);
            }
            if ($maxP > $totalPage)
                $totalPage = $maxP;
        }
    }

    // 另一种尝试: 尾页
    if (preg_match('/-(\d+)\.html"[^>]*>尾页/', $html, $m)) {
        $totalPage = $m[1];
    }
}

// 确保 infinite scroll 能触发 (只要有数据，且列表满，就假设还有下一页，或者限制最大页)
if (count($list) >= 15 && $totalPage == $pg) {
    // 如果无法精确获取总页数，但当前页满了，人工+1让客户端能翻页
    $totalPage = $pg + 1;
}

// 防止 "No Data" - 如果没拿到数据，返回空数组而不是错误
echo safe_json_encode(array(
    'class' => $categories,
    'filters' => $filters,
    'list' => $list,
    'page' => $pg,
    'pagecount' => $totalPage,
    'limit' => 20,
    'total' => $totalPage * 20
));

