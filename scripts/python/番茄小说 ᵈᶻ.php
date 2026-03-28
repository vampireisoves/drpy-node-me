<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private const HOST = 'https://fanqienovel.com';
    private const API_HOST = 'https://qkfqapi.vv9v.cn';
    private const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
    
    private $startPage = 1;

    public function init($extend = '') {
        $this->startPage = 1;
    }

    public function homeContent($filter = []) {
        $url = self::HOST . '/api/author/book/category_list/v0/';
        $json = $this->fetchJson($url);
        
        $classes = [];
        $filters = [];
        
        // 默认"全部"分类
        $classes[] = [
            'type_name' => '全部',
            'type_id' => '-1'
        ];
        
        if (isset($json['data'])) {
            $grouped = [];
            foreach ($json['data'] as $item) {
                $label = $item['label'];
                if (!isset($grouped[$label])) {
                    $grouped[$label] = ['names' => [], 'ids' => []];
                }
                $grouped[$label]['names'][] = $item['name'];
                $grouped[$label]['ids'][] = $item['category_id'];
            }
            
            foreach ($grouped as $label => $data) {
                $classes[] = [
                    'type_name' => $label,
                    'type_id' => $label
                ];
                
                $filterItems = [];
                foreach ($data['names'] as $index => $name) {
                    $filterItems[] = ['n' => $name, 'v' => $data['ids'][$index]];
                }
                
                $filters[$label] = [
                    [
                        'key' => 'category_id',
                        'name' => '筛选',
                        'value' => $filterItems
                    ]
                ];
            }
        }
        
        return [
            'class' => $classes,
            'filters' => (object)$filters
        ];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        // url: /api/author/library/book_list/v0/?page_count=18&page_index=(fypage-1)&gender=1&category_id=fyclass&creation_status=-1&word_count=-1&book_type=-1&sort=0#fyfilter
        
        $categoryId = $extend['category_id'] ?? '';
        
        // 如果 tid 是 '-1' (全部)，且没有选筛选，则可能需要默认值或者不做筛选
        // JS 逻辑：if (MY_CATE !== '-1') ... else input = input.split('#')[0]
        // 这里简化：构建 API 参数
        
        $params = [
            'page_count' => 18,
            'page_index' => $pg - 1,
            'gender' => 1,
            'category_id' => $categoryId ?: '-1', // 默认 -1 ? JS 中如果是全部，input直接去掉了 category_id 参数? 
            // 观察 JS: 
            // if (MY_CATE !== '-1') { category_id = input.split('#')[1]; replace... }
            // 意思是如果不是全部，必须选筛选？
            // 实际上 API 支持 category_id 参数。
            'creation_status' => -1,
            'word_count' => -1,
            'book_type' => -1,
            'sort' => 0
        ];
        
        // 如果 tid 不是 '-1' 且没有 category_id (即直接点了一级分类但没点筛选)
        // JS 中 filters 定义了 value 是 category_id。
        // 如果用户只点了大类（如“都市”），tid="都市"。
        // 但 API 需要具体的 category_id（数字）。
        // JS 逻辑里 filters 的 key 是 '筛选'，value 是数字 ID。
        // 如果 tid 是 '全部'，category_id 应该传什么？
        // 抓包看：全部 -> category_id 不传或 -1。
        // 
        // 修正：DS源里 filter_url 是 '{{fl.筛选}}'，即 category_id 直接取值。
        // 如果 $categoryId 为空，且 $tid 不是 -1，说明用户只选了大类没选子类。
        // 这时应该怎么办？看 JS：
        // JS 的 filters 是必须选的吗？
        // 让我们假设如果 $tid 不是 -1，但 $categoryId 为空，我们可能无法请求，或者默认取该大类下的第一个？
        // 这里的 filters 构造里，value 就是 category_id。
        
        if ($tid !== '-1' && empty($categoryId)) {
             // 尝试获取该分类下的第一个 ID？或者 API 支持直接传 label? 
             // 实际上 fanqienovel API 需要数字 ID。
             // 简单起见，如果未选筛选，默认 -1 (全部)
             $params['category_id'] = -1;
        }

        $url = self::HOST . '/api/author/library/book_list/v0/?' . http_build_query($params);
        $json = $this->fetchJson($url);
        
        $videos = [];
        if (isset($json['data']['book_list'])) {
            foreach ($json['data']['book_list'] as $item) {
                $videos[] = [
                    'vod_id' => $item['book_id'],
                    'vod_name' => $this->decodeText($item['book_name']),
                    'vod_pic' => 'http://p6-novel.byteimg.com/large/' . $item['thumb_uri'],
                    'vod_remarks' => $this->decodeText($item['author']),
                ];
            }
        }
        
        return $this->pageResult($videos, $pg, 18, 18); // total 未知，假设无限
    }

    public function detailContent($ids) {
        $id = $ids[0];
        $url = self::HOST . "/page/$id";
        
        // 模拟 PC UA
        $html = $this->fetch($url, ['headers' => ['User-Agent' => self::UA]]);
        
        // 提取 window.__INITIAL_STATE__=
        if (preg_match('/window\.__INITIAL_STATE__=(.+?);<\/script>/s', $html, $matches) || 
            preg_match('/window\.__INITIAL_STATE__=(.+?)(?:;|$)/s', $html, $matches)) {
            $jsonStr = $matches[1];
            // 替换 undefined 为 null
            $jsonStr = str_replace('undefined', 'null', $jsonStr);
            $json = json_decode($jsonStr, true);
            
            if (isset($json['page'])) {
                $info = $json['page'];
                $bookInfo = $info['bookInfo'] ?? $info; // 结构可能变动
                
                // 书名等信息
                $vod = [
                    'vod_id' => $id,
                    'vod_name' => $info['bookName'] ?? '',
                    'vod_pic' => $info['thumbUri'] ?? '',
                    'vod_content' => $info['abstract'] ?? '',
                    'vod_remarks' => $info['lastChapterTitle'] ?? '',
                    'vod_director' => $info['author'] ?? '',
                    'vod_play_from' => '番茄小说',
                ];
                
                // 章节列表
                $playList = [];
                $chapters = $info['chapterListWithVolume'] ?? [];
                
                // chapterListWithVolume 是个二维数组 [[章节...], [章节...]]
                foreach ($chapters as $volume) {
                    foreach ($volume as $chapter) {
                        $title = $chapter['title'];
                        $itemId = $chapter['itemId'];
                        $playList[] = "$title$" . $itemId . '@' . $title;
                    }
                }
                
                $vod['vod_play_url'] = implode('#', $playList);
                return ['list' => [$vod]];
            }
        }
        return ['list' => []];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        // URL: /api/search?key=**&tab_type=3&offset=((fypage-1)*10)
        // HOST: API_HOST
        $offset = ($pg - 1) * 10;
        $url = self::API_HOST . "/api/search?key=" . urlencode($key) . "&tab_type=3&offset=$offset";
        
        $json = $this->fetchJson($url);
        
        $videos = [];
        // 寻找 search_tabs[5] -> tab_type=3 ? JS 中是 search_tabs[5] 但 API 参数是 tab_type=3
        // 遍历寻找 tab_type = 3 的 tab
        $targetData = [];
        if (isset($json['data']['search_tabs'])) {
            foreach ($json['data']['search_tabs'] as $tab) {
                // JS 取下标 5，我们严谨点判断
                // 或者 API 返回的结构里 tab_type 字段
                // 假设结构类似
                if (isset($tab['data'])) {
                    // 检查第一条数据是否有 book_data 且是小说
                    // 简单粗暴：合并所有 tab 的 data? 不，JS 明确是小说 tab
                    // 暂时取第一个包含 book_data 的
                    if (!empty($tab['data']) && isset($tab['data'][0]['book_data'])) {
                        $targetData = $tab['data'];
                        break;
                    }
                }
            }
        }
        
        foreach ($targetData as $item) {
            if (isset($item['book_data'][0])) {
                $book = $item['book_data'][0];
                $videos[] = [
                    'vod_id' => $book['book_id'],
                    'vod_name' => $book['book_name'],
                    'vod_pic' => $book['thumb_url'],
                    'vod_remarks' => $book['author'],
                    'vod_content' => $book['book_abstract'] ?? $book['abstract'] ?? ''
                ];
            }
        }
        
        return $this->pageResult($videos, $pg, 10, 10);
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        // id: itemId@title
        $parts = explode('@', $id);
        $itemId = $parts[0];
        $title = $parts[1] ?? '';
        
        $url = self::API_HOST . "/api/content?tab=小说&item_id=$itemId";
        
        // 随机 Cookie
        $cookie = $this->getFqCookie();
        $json = $this->fetchJson($url, ['headers' => ['Cookie' => $cookie]]);
        
        $content = '';
        if (isset($json['data']['content'])) {
            $content = $json['data']['content'];
        }
        
        // 构造 novel:// 协议返回，或者直接文本
        // DZ 风格播放器可能不支持 novel://，通常直接返回文本或 html
        // 如果是小说，通常返回 parse=0, url=text...
        // 这里模仿 JS 返回：novel://json_string
        // 还是直接返回文本内容比较通用？
        // 为了兼容，我们返回文本内容，如果客户端支持 novel:// 最好，不支持就直接显示
        // 现在的 PHP 爬虫通常返回 content-type: text/plain
        // 但 playerContent 需要返回标准结构
        
        // 构造响应
        return [
            'parse' => 0,
            'playUrl' => '',
            'url' => $url, // 仅作记录
            'header' => (object)[],
            // 如果客户端支持直接显示文本内容，通常放在 header 或其他字段？
            // 实际上，播放接口返回 content 可能需要客户端特殊处理
            // 这里我们返回一个 data url 或者 模拟的 html
            // 参考 JS: return {parse: 0, url: 'novel://' + ret}
            'url' => 'novel://' . json_encode(['title' => $title, 'content' => $content], JSON_UNESCAPED_UNICODE)
        ];
    }
    
    private function getFqCookie() {
        $cookies = [
            'novel_web_id=78444872394737941004',
            'novel_web_id=69258894393744181011',
            'novel_web_id=77130880221809081001',
            'novel_web_id=64945771562463261001',
            'novel_web_id=78444872394737941004',
            'novel_web_id=0000000000004011402',
            'novel_web_id=0000000303614711402',
            'novel_web_id=0144211303614711401',
            'novel_web_id=0144211303614711402',
            'novel_web_id=0144211303614711403',
            'novel_web_id=0144211303614711406',
            'novel_web_id=7357767624615331361',
            'novel_web_id=7357767624615331362',
            'novel_web_id=7357767624615331365',
        ];
        return $cookies[array_rand($cookies)];
    }

    // 解密函数
    private function decodeText($text, $type = 0) {
        $charset = [];
        if ($type === 0) {
            // ... 巨大的数组 ...
            $charset = ['体', 'y', '十', '现', '快', '便', '话', '却', '月', '物', '水', '的', '放', '知', '爱', '万', '', '表', '风', '理', 'O', '老', '也', 'p', '常', '克', '平', '几', '最', '主', '她', 's', '将', '法', '情', 'o', '光', 'a', '我', '呢', 'J', '员', '太', '每', '望', '受', '教', 'w', '利', '军', '已', 'U', '人', '如', '变', '得', '要', '少', '斯', '门', '电', 'm', '男', '没', 'A', 'K', '国', '时', '中', '走', '么', '何', '口', '小', '向', '问', '轻', 'T', 'd', '神', '下', '间', '车', 'f', 'G', '度', 'D', '又', '大', '面', '远', '就', '写', 'j', '给', '通', '起', '实', 'E', '', '它', '去', 'S', '到', '道', '数', '吃', '们', '加', 'P', '是', '无', '把', '事', '西', '多', '界', '', '发', '新', '外', '活', '解', '孩', '只', '作', '前', 'Y', '尔', '经', '', 'u', '心', '告', '父', '等', 'Q', '民', '全', '这', '9', '果', '安', '', 'i', '母', '8', 'r', '说', '任', '先', '和', '地', 'C', '张', '战', '场', 'g', '像', 'c', 'q', '你', '使', '', '样', '总', '目', 'x', '性', '处', '音', '头', '', '应', '乐', '关', '能', '花', 'l', '当', '名', '手', '4', '重', '字', '声', '力', '友', '然', '生', '代', '内', '里', '本', '回', '真', '入', '师', '象', '', '0', '点', 'R', '亲', 'V', '种', '动', '英', '命', 'Z', 'h', 'X', '做', '特', '边', '高', '有', 'B', '为', '期', '自', '年', '马', '认', '出', '接', '至', 'H', '正', '方', '感', '所', '明', '者', '稜', 'F', '住', '学', '还', '分', '意', '更', '其', 'n', '但', '比', '觉', '以', '由', '死', '家', '让', '失', '士', 'L', '2', 'I', '金', '叫', '身', '报', '听', 'W', '再', '原', '山', '海', '白', '很', '见', '5', '直', '位', '第', '工', '个', '开', '岁', '好', '用', '都', '于', '可', '同', '3', '次', '四', '', '日', '信', '与', '女', '笑', '满', '并', '部', '什', '不', '从', '或', '机', '此', '', '了', '记', '三', 'e', '些', 'b', 'N', '夫', '会', '才', '儿', '眼', '两', '美', '被', '一', '公', '来', '立', 'z', '长', '对', '己', '看', 'k', '许', '因', '相', '色', '后', '往', '打', '结', '格', '过', '世', '气', '7', '子', '条', '在', '书', '之', '定', 'v', '拉', '成', '进', '带', '着', '东', '上', '想', '天', '他', '妈', '1', '文', '而', '路', '那', '别', '德', '6', 'M', 't', '行', '候', '难'];
        } else if ($type === 1) {
            $charset = ['', 's', '', '作', '口', '在', '他', '能', '并', 'B', '士', '4', 'U', '克', '才', '正', '们', '字', '声', '高', '全', '尔', '活', '者', '动', '其', '主', '报', '多', '望', '放', 'h', 'w', '次', '年', '', '中', '3', '特', '于', '十', '入', '要', '男', '同', 'G', '面', '分', '方', 'K', '什', '再', '教', '本', '己', '结', '1', '等', '世', 'N', '', '说', 'g', 'u', '期', 'Z', '外', '美', 'M', '行', '给', '9', '文', '将', '两', '许', '张', '友', '0', '英', '应', '向', '像', '此', '白', '安', '少', '何', '打', '气', '常', '定', '间', '花', '见', '孩', '它', '直', '风', '数', '使', '道', '第', '水', '已', '女', '山', '解', 'd', 'P', '的', '通', '关', '性', '叫', '儿', 'L', '妈', '问', '回', '神', '来', 'S', '', '四', '里', '前', '国', '些', 'O', 'v', 'l', 'A', '心', '平', '自', '无', '军', '光', '代', '是', '好', '却', 'c', '得', '种', '就', '意', '先', '立', 'z', '子', '过', 'Y', 'j', '表', '', '么', '所', '接', '了', '名', '金', '受', 'J', '满', '眼', '没', '部', '那', 'm', '每', '车', '度', '可', 'R', '斯', '经', '现', '门', '明', 'V', '如', '走', '命', 'y', '6', 'E', '战', '很', '上', 'f', '月', '西', '7', '长', '夫', '想', '话', '变', '海', '机', 'x', '到', 'W', '一', '成', '生', '信', '笑', '但', '父', '开', '内', '东', '马', '日', '小', '而', '后', '带', '以', '三', '几', '为', '认', 'X', '死', '员', '目', '位', '之', '学', '远', '人', '音', '呢', '我', 'q', '乐', '象', '重', '对', '个', '被', '别', 'F', '也', '书', '稜', 'D', '写', '还', '因', '家', '发', '时', 'i', '或', '住', '德', '当', 'o', 'I', '比', '觉', '然', '吃', '去', '公', 'a', '老', '亲', '情', '体', '太', 'b', '万', 'C', '电', '理', '', '失', '力', '更', '拉', '物', '着', '原', '她', '工', '实', '色', '感', '记', '看', '出', '相', '路', '大', '你', '候', '2', '和', '', '与', 'p', '样', '新', '只', '便', '最', '不', '进', 'T', 'r', '做', '格', '母', '总', '爱', '身', '师', '轻', '知', '往', '加', '从', '', '天', 'e', 'H', '', '听', '场', '由', '快', '边', '让', '把', '任', '8', '条', '头', '事', '至', '起', '点', '真', '手', '这', '难', '都', '界', '用', '法', 'n', '处', '下', '又', 'Q', '告', '地', '5', 'k', 't', '岁', '有', '会', '果', '利', '民'];
        } else if ($type === 2) {
            $charset = ['D', '在', '主', '特', '家', '军', '然', '表', '场', '4', '要', '只', 'v', '和', '?', '6', '别', '还', 'g', '现', '儿', '岁', '?', '?', '此', '象', '月', '3', '出', '战', '工', '相', 'o', '男', '直', '失', '世', 'F', '都', '平', '文', '什', 'V', 'O', '将', '真', 'T', '那', '当', '?', '会', '立', '些', 'u', '是', '十', '张', '学', '气', '大', '爱', '两', '命', '全', '后', '东', '性', '通', '被', '1', '它', '乐', '接', '而', '感', '车', '山', '公', '了', '常', '以', '何', '可', '话', '先', 'p', 'i', '叫', '轻', 'M', '士', 'w', '着', '变', '尔', '快', 'l', '个', '说', '少', '色', '里', '安', '花', '远', '7', '难', '师', '放', 't', '报', '认', '面', '道', 'S', '?', '克', '地', '度', 'I', '好', '机', 'U', '民', '写', '把', '万', '同', '水', '新', '没', '书', '电', '吃', '像', '斯', '5', '为', 'y', '白', '几', '日', '教', '看', '但', '第', '加', '候', '作', '上', '拉', '住', '有', '法', 'r', '事', '应', '位', '利', '你', '声', '身', '国', '问', '马', '女', '他', 'Y', '比', '父', 'x', 'A', 'H', 'N', 's', 'X', '边', '美', '对', '所', '金', '活', '回', '意', '到', 'z', '从', 'j', '知', '又', '内', '因', '点', 'Q', '三', '定', '8', 'R', 'b', '正', '或', '夫', '向', '德', '听', '更', '?', '得', '告', '并', '本', 'q', '过', '记', 'L', '让', '打', 'f', '人', '就', '者', '去', '原', '满', '体', '做', '经', 'K', '走', '如', '孩', 'c', 'G', '给', '使', '物', '?', '最', '笑', '部', '?', '员', '等', '受', 'k', '行', '一', '条', '果', '动', '光', '门', '头', '见', '往', '自', '解', '成', '处', '天', '能', '于', '名', '其', '发', '总', '母', '的', '死', '手', '入', '路', '进', '心', '来', 'h', '时', '力', '多', '开', '已', '许', 'd', '至', '由', '很', '界', 'n', '小', '与', 'Z', '想', '代', '么', '分', '生', '口', '再', '妈', '望', '次', '西', '风', '种', '带', 'J', '?', '实', '情', '才', '这', '?', 'E', '我', '神', '格', '长', '觉', '间', '年', '眼', '无', '不', '亲', '关', '结', '0', '友', '信', '下', '却', '重', '己', '老', '2', '音', '字', 'm', '呢', '明', '之', '前', '高', 'P', 'B', '目', '太', 'e', '9', '起', '稜', '她', '也', 'W', '用', '方', '子', '英', '每', '理', '便', '四', '数', '期', '中', 'C', '外', '样', 'a', '海', '们', '任'];
        }
        
        // JS: _decodeText2
        // text = text.replace(reg, ($0, $1) => z[('0x' + $1) - 1000]);
        // reg = /%uE([0-9a-fA-F]{3})/gi
        // 58344 (decimal) = E3E8 (hex)
        // CODE_ST = 58344
        // index = charCode - 58344
        // JS charset array index logic:
        // z[('0x' + $1) - 1000] ??? 
        // JS code: z[('0x' + $1) - 1000]
        // If $1 is '3E8' (1000), then index is 0. 
        // 'E3E8' -> $1='3E8'. 0x3E8 = 1000. 1000 - 1000 = 0.
        // So offset is indeed related to 0xE3E8.
        
        // PHP Logic:
        // Iterate string, find characters in range [0xE3E8, 0xE55B] (approx)
        // Or use regex like JS.
        // In PHP, unicode characters can be matched or we can convert string to unicode code points.
        // 
        // Better to use preg_replace_callback with unicode escape sequence?
        // But the input text might be normal UTF-8 string, not escaped %uXXXX.
        // JS's `_decodeText2` first calls `escape(text)`.
        // So we should do similar: convert string to unicode hex entities or iterate chars.
        
        $result = '';
        $len = mb_strlen($text, 'UTF-8');
        for ($i = 0; $i < $len; $i++) {
            $char = mb_substr($text, $i, 1, 'UTF-8');
            $code = mb_ord($char, 'UTF-8');
            
            // CODE_ST = 58344 (0xE3E8)
            // CODE_ED = 58715 (0xE55B)
            if ($code >= 58344 && $code <= 58715) {
                $index = $code - 58344;
                if (isset($charset[$index])) {
                    $result .= $charset[$index];
                } else {
                    $result .= $char;
                }
            } else {
                $result .= $char;
            }
        }
        return $result;
    }
}

// 运行爬虫
(new Spider())->run();
