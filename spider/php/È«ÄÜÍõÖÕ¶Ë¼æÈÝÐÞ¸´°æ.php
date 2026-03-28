<?php
/**
 * TVBox PHP 爬虫脚本 - 磁力增强版 + 全数据库兼容
 * 支持JSON/TXT/M3U/DB文件格式 + 磁力链接 + ed2k链接
 * 完整磁力文件夹扫描和智能命名功能
 * 增强数据库兼容：支持市面上大多数数据库格式
 * 特别优化：兼容cjcj表结构数据库
 */
ini_set('memory_limit', '-1');

// ==================== 数据库兼容配置 ====================
define('DB_COMPAT_MODE', true);
define('MAX_DB_RESULTS', 5000); // 最大数据库结果数
define('DB_SCAN_DEPTH', 10);    // 数据库扫描深度

// 支持的数据库表名模式（正则表达式）
$SUPPORTED_DB_TABLES = [
    'video' => '/^(videos?|film|movie|tv|series|影视|视频|cj)/i',
    'category' => '/^(categor(y|ies)|type|分类|类型)/i',
    'magnet' => '/^(magnet|bt|torrent|种子|磁力)/i',
    'channel' => '/^(channel|tv_channel|live|频道|直播)/i'
];

// 数据库字段映射配置 - 增强cjcj表支持
$DB_FIELD_MAPPING = [
    'id' => ['id', 'vid', 'video_id', 'film_id', 'vod_id'],
    'name' => ['name', 'title', 'video_name', 'film_name', 'vod_name'],
    'url' => ['url', 'link', 'play_url', 'video_url', 'vod_url'],
    'magnet' => ['magnet', 'magnet_url', 'magnet_link', 'bt_url'],
    'image' => ['image', 'pic', 'cover', 'poster', 'vod_pic'],
    'category' => ['category', 'type', 'class', 'vod_type', 'type_name'],
    'year' => ['year', 'vod_year', 'vod_pubdate'],
    'area' => ['area', 'region', 'vod_area'],
    'actor' => ['actor', 'star', 'vod_actor'],
    'director' => ['director', 'vod_director'],
    'content' => ['content', 'desc', 'description', 'vod_content'],
    'remarks' => ['remarks', 'vod_remarks']
];
// ==================== 数据库兼容配置结束 ====================

// 获取请求参数
$操作类型 = $_GET['ac'] ?? 'detail';
$分类标识 = $_GET['t'] ?? '';
$页码 = $_GET['pg'] ?? '1';
$视频标识 = $_GET['ids'] ?? '';
$搜索关键词 = $_GET['wd'] ?? '';
$播放标志 = $_GET['flag'] ?? '';
$播放标识 = $_GET['id'] ?? '';
$播放URL = $_GET['play'] ?? ''; // 新增 play 参数

// 设置响应头为 JSON
header('Content-Type: application/json; charset=utf-8');

// 性能优化 - 增加超时时间
@set_time_limit(120);
// 根据不同 action 返回数据
switch ($操作类型) {
    case 'detail':
        if (!empty($视频标识)) {
            $结果 = 获取详情($视频标识);
        } elseif (!empty($分类标识)) {
            $结果 = 获取分类($分类标识, $页码);
        } else {
            $结果 = 获取首页();
        }
        break;
    
    case 'search':
        $结果 = 搜索($搜索关键词, $页码);
        break;
        
    case 'play':
        $结果 = 获取播放($播放标志, $播放标识);
        break;
    
    default:
        $结果 = ['错误' => '未知操作: ' . $操作类型];
}

// 新增：直接播放URL的处理
if (!empty($播放URL)) {
    $结果 = 直接播放URL($播放URL);
}

echo json_encode($结果, JSON_UNESCAPED_UNICODE);

/**
 * 直接播放URL - 新增函数
 * 返回文件播放头格式的数据，url字段值为play参数值
 */
function 直接播放URL($播放URL) {
    // 解码URL
    $播放URL = urldecode($播放URL);
    
    // 根据URL类型确定播放方式
    $播放类型 = 'video';
    $是否需要解析 = 0; // 0表示不解析，直接播放
    
    // 判断链接类型
    if (strpos($播放URL, 'magnet:') === 0) {
        $播放类型 = 'magnet';
        $是否需要解析 = 0;
    } elseif (strpos($播放URL, 'ed2k://') === 0) {
        $播放类型 = 'ed2k';
        $是否需要解析 = 0;
    } elseif (strpos($播放URL, '.m3u8') !== false) {
        $播放类型 = 'hls';
        $是否需要解析 = 0;
    } elseif (strpos($播放URL, '.mp4') !== false || 
              strpos($播放URL, '.avi') !== false ||
              strpos($播放URL, '.mkv') !== false) {
        $播放类型 = 'video';
        $是否需要解析 = 0;
    }
    
    // 返回文件播放头格式
    return [
        'parse' => $是否需要解析,
        'playUrl' => '',
        'url' => $播放URL, // url字段的值就是play参数值
        'header' => [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer' => parse_url($播放URL, PHP_URL_SCHEME) . '://' . parse_url($播放URL, PHP_URL_HOST)
        ],
        'type' => $播放类型
    ];
}
/**
 * 递归扫描目录 - 支持无限级子文件夹
 */
function 递归扫描目录($目录, $文件类型, $当前深度 = 0, $最大深度 = 20) {
    $文件列表 = [];
    
    if (!is_dir($目录)) {
        return $文件列表;
    }
    
    if ($当前深度 > $最大深度) {
        return $文件列表;
    }
    
    $目录项 = @scandir($目录);
    if ($目录项 === false) {
        return $文件列表;
    }
    
    foreach ($目录项 as $项目) {
        if ($项目 === '.' || $项目 === '..') continue;
        
        $路径 = $目录 . $项目;
        
        if (is_dir($路径)) {
            $子文件 = 递归扫描目录($路径 . '/', $文件类型, $当前深度 + 1, $最大深度);
            $文件列表 = array_merge($文件列表, $子文件);
        } else {
            $扩展名 = strtolower(pathinfo($路径, PATHINFO_EXTENSION));
            if (in_array($扩展名, $文件类型)) {
                $相对路径 = str_replace('/storage/emulated/0/lz/', '', $路径);
                
                // 检查是否为磁力文件夹
                $是磁力文件夹 = (strpos($路径, '/lz/wj/bt/') !== false);
                
                $文件列表[] = [
                    'type' => $扩展名,
                    'path' => $路径,
                    'name' => $项目,
                    'filename' => pathinfo($项目, PATHINFO_FILENAME),
                    'relative_path' => $相对路径,
                    'depth' => $当前深度,
                    'is_magnet_folder' => $是磁力文件夹
                ];
            }
        }
    }
    
    return $文件列表;
}

/**
 * 获取所有文件列表 - 增强磁力文件夹和数据库支持
 */
function 获取所有文件() {
    static $所有文件 = null;
    
    if ($所有文件 === null) {
        $所有文件 = [];
        
        $JSON文件 = 递归扫描目录('/storage/emulated/0/江湖/json/影视/', ['json']);
        $TXT文件 = 递归扫描目录('/storage/emulated/0/江湖/wj/', ['txt']);
        $M3U文件 = array_merge(
            递归扫描目录('/storage/emulated/0/江湖/json/影视/', ['m3u']),
            递归扫描目录('/storage/emulated/0/江湖/wj/', ['m3u'])
        );
        
        // 增强数据库文件扫描，包含所有可能的数据库路径
        $数据库文件 = array_merge(
            递归扫描目录('/storage/emulated/0/江湖/json/影视/', ['db', 'sqlite', 'sqlite3', 'db3']),
            递归扫描目录('/storage/emulated/0/江湖/wj/', ['db', 'sqlite', 'sqlite3', 'db3']),
            递归扫描目录('/storage/emulated/0/江湖/db/', ['db', 'sqlite', 'sqlite3', 'db3']),
            递归扫描目录('/storage/emulated/0/江湖/wj/bt/', ['db', 'sqlite', 'sqlite3', 'db3']),
            递归扫描目录('/storage/emulated/0/江湖/data/', ['db', 'sqlite', 'sqlite3', 'db3']),
            递归扫描目录('/storage/emulated/0/江湖/数据库/', ['db', 'sqlite', 'sqlite3', 'db3'])
        );
        
        $所有文件 = array_merge($JSON文件, $TXT文件, $M3U文件, $数据库文件);
        
        // 按路径排序
        usort($所有文件, function($甲, $乙) {
            return strcmp($甲['relative_path'], $乙['relative_path']);
        });
    }
    
    return $所有文件;
}

/**
 * 估算文件中的视频数量（快速估算，不实际解析）
 */
function 估算文件视频数量($文件) {
    $路径 = $文件['path'];
    $类型 = $文件['type'];
    
    if (!file_exists($路径)) {
        return 0;
    }
    
    $文件大小 = filesize($路径);
    
    // 根据文件类型和大小快速估算
    switch ($类型) {
        case 'json':
            $数量 = $文件大小 > 1024 ? intval($文件大小 / 1024) : 1;
            break;
        case 'txt':
            $行数 = $文件大小 > 100 ? intval($文件大小 / 100) : 1;
            $数量 = min($行数, 10000);
            break;
        case 'm3u':
            $行数 = $文件大小 > 200 ? intval($文件大小 / 200) : 1;
            $数量 = min($行数, 5000);
            break;
        case 'db':
        case 'sqlite':
        case 'sqlite3':
        case 'db3':
            $数量 = $文件大小 > 500 ? intval($文件大小 / 500) : 1;
            break;
        default:
            $数量 = 0;
    }
    
    return $数量;
}
/**
 * 获取分类列表
 */
function 获取分类列表() {
    static $分类列表 = null;
    
    if ($分类列表 === null) {
        $所有文件 = 获取所有文件();
        $分类列表 = [];
        
        // 新增热门推荐分类
        $总文件数 = count($所有文件);
        $分类列表[] = [
            'type_id' => 'hot',
            'type_name' => '🔥热门推荐 (' . $总文件数 . '个文件)',
            'type_file' => 'hot_recommend',
            'source_path' => 'hot',
            'source_type' => 'hot'
        ];
        
        // 用于去重的数组
        $已处理文件 = [];
        
        // 文件分类（显示所有文件）
        foreach ($所有文件 as $索引 => $文件) {
            // 去重：基于文件路径和名称
            $文件标识 = $文件['path'] . '|' . $文件['name'];
            if (in_array($文件标识, $已处理文件)) {
                continue;
            }
            $已处理文件[] = $文件标识;
            
            $文件类型 = '';
            $类型图标 = '';
            $数量显示 = '';
            
            switch ($文件['type']) {
                case 'json':
                    $文件类型 = '[JSON] ';
                    $类型图标 = '📊 ';
                    break;
                case 'txt':
                    $文件类型 = '[TXT] ';
                    $类型图标 = '📄 ';
                    break;
                case 'm3u':
                    $文件类型 = '[M3U] ';
                    $类型图标 = '📺 ';
                    break;
                case 'db':
                case 'sqlite':
                case 'sqlite3':
                case 'db3':
                    $文件类型 = '[数据库] ';
                    $类型图标 = '🗃️ ';
                    
                    // 尝试获取数据库中的表数量
                    try {
                        if (file_exists($文件['path']) && extension_loaded('pdo_sqlite')) {
                            $数据库 = new PDO("sqlite:" . $文件['path']);
                            $表列表 = $数据库->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
                            $表数量 = count($表列表);
                            $数据库 = null;
                            
                            $数量显示 = ' (' . $表数量 . '个表)';
                        } else {
                            $数量显示 = ' (数据库)';
                        }
                    } catch (Exception $e) {
                        $数量显示 = ' (数据库)';
                    }
                    break;
            }
            
            // 如果没有数量显示，使用估算的视频数量
            if (empty($数量显示)) {
                $视频数量 = 估算文件视频数量($文件);
                $数量显示 = $视频数量 > 0 ? ' (' . number_format($视频数量) . '个视频)' : '';
            }
            
            // 磁力文件夹标识
            if ($文件['is_magnet_folder']) {
                $类型图标 = '🧲 ';
                $文件类型 = '[磁力] ';
            }
            
            // 显示文件夹路径
            $文件夹信息 = '';
            if (strpos($文件['relative_path'], '/') !== false) {
                $文件夹路径 = dirname($文件['relative_path']);
                $文件夹信息 = ' 📁 ' . $文件夹路径;
            }
            
            $分类列表[] = [
                'type_id' => (string)($索引 + 1),
                'type_name' => $类型图标 . $文件类型 . $文件['filename'] . $数量显示 . $文件夹信息,
                'type_file' => $文件['name'],
                'source_path' => $文件['path'],
                'source_type' => $文件['type'],
                'video_count' => 估算文件视频数量($文件),
                'is_magnet_folder' => $文件['is_magnet_folder']
            ];
        }
        
        if (empty($所有文件)) {
            $分类列表[] = [
                'type_id' => '1',
                'type_name' => '❓ 未找到媒体文件',
                'type_file' => 'empty',
                'source_path' => 'empty',
                'source_type' => 'empty'
            ];
        }
    }
    
    return $分类列表;
}

/**
 * 获取热门推荐视频 - 从所有分类中随机获取
 */
function 获取热门视频($页码, $每页数量 = 15) {
    static $所有热门视频 = null;
    static $已使用视频标识 = [];
    
    if ($页码 == 1) {
        $已使用视频标识 = [];
    }
    
    if ($所有热门视频 === null) {
        $所有热门视频 = [];
        $所有文件 = 获取所有文件();
        
        foreach ($所有文件 as $文件) {
            if (!file_exists($文件['path'])) {
                continue;
            }
            
            $视频列表 = [];
            switch ($文件['type']) {
                case 'json':
                    $视频列表 = 解析JSON文件($文件['path']);
                    break;
                case 'txt':
                    $视频列表 = 解析TXT文件($文件['path']);
                    break;
                case 'm3u':
                    $视频列表 = 解析M3U文件($文件['path']);
                    break;
                case 'db':
                case 'sqlite':
                case 'sqlite3':
                case 'db3':
                    $视频列表 = 解析数据库文件($文件['path']);
                    break;
            }
            
            if (isset($视频列表['错误'])) {
                continue;
            }
            
            if (count($视频列表) > 100) {
                $视频列表 = array_slice($视频列表, 0, 100);
            }
            
            $所有热门视频 = array_merge($所有热门视频, $视频列表);
            
            if (count($所有热门视频) > 1000) {
                break;
            }
        }
    }
    
    if (empty($所有热门视频)) {
        return [];
    }
    
    $可用视频 = [];
    foreach ($所有热门视频 as $视频) {
        $视频标识 = $视频['vod_id'] ?? '';
        if (!in_array($视频标识, $已使用视频标识)) {
            $可用视频[] = $视频;
        }
    }
    
    if (empty($可用视频)) {
        $已使用视频标识 = [];
        $可用视频 = $所有热门视频;
    }
    
    $选中视频 = [];
    $需要数量 = min($每页数量, count($可用视频));
    
    if ($需要数量 > 0) {
        $随机键 = array_rand($可用视频, $需要数量);
        if (!is_array($随机键)) {
            $随机键 = [$随机键];
        }
        
        foreach ($随机键 as $键) {
            $选中视频项 = $可用视频[$键];
            $选中视频[] = $选中视频项;
            $已使用视频标识[] = $选中视频项['vod_id'] ?? '';
        }
    }
    
    return $选中视频;
}

/**
 * 首页数据
 */
function 获取首页() {
    $分类列表 = 获取分类列表();
    
    if (empty($分类列表)) {
        return ['错误' => '未找到任何文件'];
    }
    
    return [
        'class' => $分类列表
    ];
}
/**
 * 增强版数据库解析 - 支持市面上大多数数据库格式
 */
function 解析数据库文件($文件路径) {
    global $SUPPORTED_DB_TABLES, $DB_FIELD_MAPPING;
    
    if (!file_exists($文件路径)) {
        return ['错误' => '数据库文件不存在: ' . basename($文件路径)];
    }
    
    $文件大小 = filesize($文件路径);
    $可读 = is_readable($文件路径);
    
    if ($文件大小 === 0) {
        return ['错误' => '数据库文件为空: ' . basename($文件路径)];
    }
    
    if (!$可读) {
        return ['错误' => '数据库文件不可读: ' . basename($文件路径)];
    }
    
    if (!extension_loaded('pdo_sqlite')) {
        return ['错误' => 'PDO_SQLite扩展不可用，无法读取数据库文件'];
    }
    
    try {
        $数据库 = new PDO("sqlite:" . $文件路径);
        $数据库->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // 获取所有表
        $表列表 = $数据库->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
        
        if (empty($表列表)) {
            return ['错误' => '数据库中未找到任何数据表'];
        }
        
        // 特别处理：检查是否有cjcj表
        if (in_array('cj', $表列表)) {
            return 解析CJCJ数据库($数据库, $文件路径);
        }
        
        // 智能识别数据库类型并解析
        $数据库类型 = 识别数据库类型($表列表, $数据库);
        
        switch ($数据库类型) {
            case 'video_category':
                return 解析视频分类数据库($数据库, $文件路径);
            case 'magnet_database':
                return 解析磁力数据库($数据库, $文件路径);
            case 'live_channel':
                return 解析直播频道数据库($数据库, $文件路径);
            case 'universal_video':
                return 解析通用视频数据库($数据库, $文件路径);
            default:
                return 解析自动识别数据库($数据库, $文件路径, $表列表);
        }
        
    } catch (PDOException $异常) {
        return ['错误' => '数据库读取失败: ' . $异常->getMessage()];
    }
}

/**
 * 智能识别数据库类型
 */
function 识别数据库类型($表列表, $数据库) {
    global $SUPPORTED_DB_TABLES;
    
    // 检查是否是视频分类数据库
    if (in_array('videos', $表列表) && in_array('categories', $表列表)) {
        return 'video_category';
    }
    
    // 检查是否是磁力数据库
    foreach ($表列表 as $表名) {
        if (preg_match($SUPPORTED_DB_TABLES['magnet'], $表名)) {
            return 'magnet_database';
        }
    }
    
    // 检查是否是直播频道数据库
    foreach ($表列表 as $表名) {
        if (preg_match($SUPPORTED_DB_TABLES['channel'], $表名)) {
            return 'live_channel';
        }
    }
    
    // 检查是否是通用视频数据库
    foreach ($表列表 as $表名) {
        if (preg_match($SUPPORTED_DB_TABLES['video'], $表名)) {
            return 'universal_video';
        }
    }
    
    return 'auto_detect';
}
/**
 * 专门解析CJCJ表结构的数据库
 */
function 解析CJCJ数据库($数据库, $文件路径) {
    $视频列表 = [];
    
    try {
        // 查询cj表中的所有数据
        $查询SQL = "SELECT * FROM cj LIMIT " . MAX_DB_RESULTS;
        $语句 = $数据库->query($查询SQL);
        $结果集 = $语句->fetchAll(PDO::FETCH_ASSOC);
        
        $默认图片 = [
            'https://www.252035.xyz/imgs?t=1335527662',
            'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2640235365.jpg',
            'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2640235366.jpg'
        ];
        
        foreach ($结果集 as $索引 => $行数据) {
            // 提取视频信息
            $视频名称 = $行数据['vod_name'] ?? $行数据['vod_id'] ?? '未知视频';
            $播放链接 = '';
            $播放来源 = 'CJCJ数据库';
            
            // 解析播放URL
            $播放数据 = $行数据['vod_play_url'] ?? '';
            if (!empty($播放数据)) {
                // 处理播放URL格式：播放源$播放链接
                if (strpos($播放数据, '$') !== false) {
                    $播放部分 = explode('$', $播放数据);
                    if (count($播放部分) >= 2) {
                        $播放链接 = trim($播放部分[1]);
                    }
                } else {
                    $播放链接 = $播放数据;
                }
            }
            
            if (empty($播放链接)) {
                continue;
            }
            
            // 确定播放来源
            if (strpos($播放链接, 'magnet:') === 0) {
                $播放来源 = '🧲磁力链接';
            } elseif (strpos($播放链接, 'ed2k://') === 0) {
                $播放来源 = '⚡电驴链接';
            } elseif (strpos($播放链接, 'http') === 0) {
                $播放来源 = $行数据['vod_play_from'] ?? '在线播放';
            }
            
            // 构建视频信息
            $视频封面 = $行数据['vod_pic'] ?? $默认图片[$索引 % count($默认图片)];
            $视频描述 = $行数据['vod_content'] ?? $视频名称 . '的精彩内容';
            $视频年份 = $行数据['vod_year'] ?? $行数据['vod_pubdate'] ?? date('Y');
            $视频地区 = $行数据['vod_area'] ?? '中国大陆';
            $演员 = $行数据['vod_actor'] ?? '';
            $导演 = $行数据['vod_director'] ?? '';
            $备注 = $行数据['vod_remarks'] ?? '高清';
            $分类 = $行数据['type_name'] ?? '';
            
            // 生成唯一ID
            $视频ID = 'cj_' . md5($文件路径) . '_' . $索引;
            
            $视频列表[] = [
                'vod_id' => $视频ID,
                'vod_name' => $视频名称,
                'vod_pic' => $视频封面,
                'vod_remarks' => $备注,
                'vod_year' => $视频年份,
                'vod_area' => $视频地区,
                'vod_actor' => $演员,
                'vod_director' => $导演,
                'vod_content' => $视频描述,
                'vod_play_from' => $播放来源 . ($分类 ? ' · ' . $分类 : ''),
                'vod_play_url' => '正片$' . $播放链接
            ];
            
            if (count($视频列表) >= MAX_DB_RESULTS) {
                break;
            }
        }
        
    } catch (PDOException $异常) {
        return ['错误' => 'CJCJ数据库解析失败: ' . $异常->getMessage()];
    }
    
    $数据库 = null;
    return $视频列表;
}

/**
 * 解析视频分类数据库 - 专门处理分类视频数据
 */
function 解析视频分类数据库($数据库, $文件路径) {
    $视频列表 = [];
    
    // 获取分类信息
    $分类映射 = [];
    $分类结果 = $数据库->query("SELECT id, name FROM categories")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($分类结果 as $分类) {
        $分类映射[$分类['id']] = $分类['name'];
    }
    
    // 获取视频数据
    $视频结果 = $数据库->query("SELECT id, category_id, name, image, actor, director, remarks, pubdate, area, year, content, play_url FROM videos LIMIT " . MAX_DB_RESULTS)->fetchAll(PDO::FETCH_ASSOC);
    
    $默认图片 = [
        'https://www.252035.xyz/imgs?t=1335527662',
        'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2640235365.jpg',
        'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2640235366.jpg'
    ];
    
    foreach ($视频结果 as $索引 => $视频数据) {
        $视频名称 = $视频数据['name'] ?? '未知视频';
        $播放链接 = $视频数据['play_url'] ?? '';
        
        if (empty($播放链接)) {
            continue;
        }
        
        // 处理播放链接格式
        $播放来源 = '视频源';
        $播放地址 = $播放链接;
        
        // 检查链接类型
        if (strpos($播放链接, 'magnet:') === 0) {
            $播放来源 = '🧲磁力链接';
        } elseif (strpos($播放链接, 'ed2k://') === 0) {
            $播放来源 = '⚡电驴链接';
        } elseif (strpos($播放链接, 'http') === 0) {
            $播放来源 = '在线播放';
        }
        
        // 获取分类名称
        $分类名称 = $分类映射[$视频数据['category_id']] ?? '未知分类';
        
        $视频列表[] = [
            'vod_id' => 'video_' . $视频数据['id'],
            'vod_name' => $视频名称,
            'vod_pic' => $视频数据['image'] ?? $默认图片[$索引 % count($默认图片)],
            'vod_remarks' => $视频数据['remarks'] ?? '高清',
            'vod_year' => $视频数据['year'] ?? '',
            'vod_area' => $视频数据['area'] ?? '中国大陆',
            'vod_actor' => $视频数据['actor'] ?? '',
            'vod_director' => $视频数据['director'] ?? '',
            'vod_content' => $视频数据['content'] ?? $视频名称 . '的精彩内容',
            'vod_play_from' => $播放来源 . ' · ' . $分类名称,
            'vod_play_url' => '正片$' . $播放地址
        ];
        
        if (count($视频列表) >= MAX_DB_RESULTS) {
            break;
        }
    }
    
    return $视频列表;
}
/**
 * 解析磁力数据库 - 原来的磁力数据库解析逻辑
 */
function 解析磁力数据库($数据库, $文件路径) {
    $视频列表 = [];
    
    $表列表 = $数据库->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($表列表)) {
        return ['错误' => '数据库中未找到任何数据表'];
    }
    
    $默认图片 = [
        'https://www.252035.xyz/imgs?t=1335527662',
        'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2640235365.jpg',
        'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2640235366.jpg'
    ];
    
    foreach ($表列表 as $表名) {
        if (strpos($表名, 'sqlite_') === 0) continue;
        
        $字段列表 = $数据库->query("PRAGMA table_info($表名)")->fetchAll(PDO::FETCH_ASSOC);
        $字段名称 = array_column($字段列表, 'name');
        
        // 特殊处理：如果表有data字段，假设它包含JSON数据
        if (in_array('data', $字段名称)) {
            $结果集 = $数据库->query("SELECT data FROM $表名 LIMIT " . MAX_DB_RESULTS)->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($结果集 as $索引 => $json数据) {
                if (empty($json数据)) continue;
                
                $视频数据 = json_decode($json数据, true);
                if ($视频数据 && is_array($视频数据)) {
                    // 正确提取视频信息
                    $视频名称 = $视频数据['title'] ?? $视频数据['name'] ?? '未知视频';
                    $视频链接 = '';
                    $播放来源 = '数据库源';
                    
                    // 优先使用磁力链接
                    if (isset($视频数据['magnet']) && !empty($视频数据['magnet'])) {
                        $视频链接 = $视频数据['magnet'];
                        $播放来源 = '🧲磁力链接';
                    } elseif (isset($视频数据['torrent']) && !empty($视频数据['torrent'])) {
                        $视频链接 = $视频数据['torrent'];
                        $播放来源 = '🔗种子链接';
                    }
                    
                    if (empty($视频链接)) {
                        continue;
                    }
                    
                    // 生成视频封面
                    $视频封面 = $默认图片[$索引 % count($默认图片)];
                    
                    // 提取其他信息
                    $视频描述 = $视频数据['title'] ?? '《' . $视频名称 . '》的精彩内容';
                    $视频年份 = $视频数据['year'] ?? date('Y');
                    $视频地区 = '欧美'; // 根据实际数据调整
                    
                    // 生成唯一ID
                    $视频ID = 'db_' . md5($文件路径) . '_' . $表名 . '_' . $索引;
                    
                    $视频列表[] = [
                        'vod_id' => $视频ID,
                        'vod_name' => $视频名称,
                        'vod_pic' => $视频封面,
                        'vod_remarks' => '高清',
                        'vod_year' => $视频年份,
                        'vod_area' => $视频地区,
                        'vod_content' => $视频描述,
                        'vod_play_from' => $播放来源,
                        'vod_play_url' => '正片$' . $视频链接
                    ];
                    
                    if (count($视频列表) >= MAX_DB_RESULTS) {
                        break 2;
                    }
                }
            }
        } else {  
            $名称字段 = null;
            $链接字段 = null;
            $磁力字段 = null;
            $电驴字段 = null;
            $图片字段 = null;
            $描述字段 = null;
            $年份字段 = null;
            $地区字段 = null;
            $JSON字段 = null;
            
            foreach ($字段名称 as $字段) {
                $小写字段 = strtolower($字段);
                if (in_array($小写字段, ['name', 'title', 'vod_name', 'filename', 'video_name'])) {
                    $名称字段 = $字段;
                }
                if (in_array($小写字段, ['url', 'link', 'vod_url', 'play_url', 'video_url', 'torrent'])) {
                    $链接字段 = $字段;
                }
                if (in_array($小写字段, ['magnet', 'magnet_url', 'magnet_link'])) {
                    $磁力字段 = $字段;
                }
                if (in_array($小写字段, ['ed2k', 'ed2k_url', 'ed2k_link'])) {
                    $电驴字段 = $字段;
                }
                if (in_array($小写字段, ['pic', 'image', 'cover', 'vod_pic', 'poster'])) {
                    $图片字段 = $字段;
                }
                if (in_array($小写字段, ['desc', 'description', 'content', 'vod_content'])) {
                    $描述字段 = $字段;
                }
                if (in_array($小写字段, ['year', 'vod_year'])) {
                    $年份字段 = $字段;
                }
                if (in_array($小写字段, ['area', 'region', 'vod_area'])) {
                    $地区字段 = $字段;
                }
                if (in_array($小写字段, ['json', 'data', 'vod_data'])) {
                    $JSON字段 = $字段;
                }
            }
            
            if ($名称字段) {
                $选择字段 = [$名称字段];
                if ($链接字段) $选择字段[] = $链接字段;
                if ($磁力字段) $选择字段[] = $磁力字段;
                if ($电驴字段) $选择字段[] = $电驴字段;
                if ($图片字段) $选择字段[] = $图片字段;
                if ($描述字段) $选择字段[] = $描述字段;
                if ($年份字段) $选择字段[] = $年份字段;
                if ($地区字段) $选择字段[] = $地区字段;
                if ($JSON字段) $选择字段[] = $JSON字段;
                
                $查询SQL = "SELECT " . implode(', ', $选择字段) . " FROM $表名 LIMIT " . MAX_DB_RESULTS;
                
                $语句 = $数据库->query($查询SQL);
                $结果集 = $语句->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($结果集 as $索引 => $行数据) {
                    $视频名称 = $行数据[$名称字段] ?? '未知视频';
                    
                    if ($JSON字段 && !empty($行数据[$JSON字段])) {
                        $json数据 = json_decode($行数据[$JSON字段], true);
                        if ($json数据 && is_array($json数据)) {
                            if (isset($json数据['name']) && empty($视频名称)) {
                                $视频名称 = $json数据['name'];
                            }
                        }
                    }
                    
                    $视频链接 = '';
                    $播放来源 = '数据库源';
                    
                    if ($磁力字段 && !empty($行数据[$磁力字段])) {
                        $视频链接 = $行数据[$磁力字段];
                        $播放来源 = '🧲磁力链接';
                    } elseif ($电驴字段 && !empty($行数据[$电驴字段])) {
                        $视频链接 = $行数据[$电驴字段];
                        $播放来源 = '⚡电驴链接';
                    } elseif ($链接字段 && !empty($行数据[$链接字段])) {
                        $视频链接 = $行数据[$链接字段];
                        if (strpos($视频链接, 'magnet:') === 0) {
                            $播放来源 = '🧲磁力链接';
                        } elseif (strpos($视频链接, 'ed2k://') === 0) {
                            $播放来源 = '⚡电驴链接';
                        }
                    }
                    
                    if (empty($视频链接)) {
                        continue;
                    }
                    
                    $视频封面 = $行数据[$图片字段] ?? $默认图片[$索引 % count($默认图片)];
                    $视频描述 = $行数据[$描述字段] ?? '《' . $视频名称 . '》的精彩内容';
                    $视频年份 = $行数据[$年份字段] ?? date('Y');
                    $视频地区 = $行数据[$地区字段] ?? '中国大陆';
                    
                    $有效协议 = ['http://', 'https://', 'rtmp://', 'rtsp://', 'udp://', 'magnet:', 'ed2k://'];
                    $有有效协议 = false;
                    foreach ($有效协议 as $协议) {
                        if (stripos($视频链接, $协议) === 0) {
                            $有有效协议 = true;
                            break;
                        }
                    }
                    
                    if (!$有有效协议) {
                        continue;
                    }
                    
                    $视频列表[] = [
                        'vod_id' => 'db_' . md5($文件路径) . '_' . $表名 . '_' . $索引,
                        'vod_name' => $视频名称,
                        'vod_pic' => $视频封面,
                        'vod_remarks' => '高清',
                        'vod_year' => $视频年份,
                        'vod_area' => $视频地区,
                        'vod_content' => $视频描述,
                        'vod_play_from' => $播放来源,
                        'vod_play_url' => '正片$' . $视频链接
                    ];
                    
                    if (count($视频列表) >= MAX_DB_RESULTS) {
                        break 2;
                    }
                }
            }
        }
    }
    
    $数据库 = null;
    
    return $视频列表;
}

/**
 * 解析通用视频数据库 - 支持大多数视频数据库格式
 */
function 解析通用视频数据库($数据库, $文件路径) {
    global $DB_FIELD_MAPPING;
    
    $视频列表 = [];
    $表列表 = $数据库->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
    
    $默认图片 = [
        'https://www.252035.xyz/imgs?t=1335527662',
        'https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2640235365.jpg',
        'https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2640235366.jpg'
    ];
    
    foreach ($表列表 as $表名) {
        if (strpos($表名, 'sqlite_') === 0) continue;
        
        // 获取表结构
        $字段信息 = $数据库->query("PRAGMA table_info($表名)")->fetchAll(PDO::FETCH_ASSOC);
        $字段名称 = array_column($字段信息, 'name');
        
        // 映射字段
        $映射字段 = [];
        foreach ($DB_FIELD_MAPPING as $标准字段 => $可能字段) {
            foreach ($可能字段 as $候选字段) {
                if (in_array($候选字段, $字段名称)) {
                    $映射字段[$标准字段] = $候选字段;
                    break;
                }
            }
        }
        
        if (empty($映射字段['name']) || (empty($映射字段['url']) && empty($映射字段['magnet']))) {
            continue; // 跳过没有名称和链接的表
        }
        
        // 构建查询
        $选择字段 = array_values($映射字段);
        $查询SQL = "SELECT " . implode(', ', $选择字段) . " FROM $表名 LIMIT " . MAX_DB_RESULTS;
        
        try {
            $语句 = $数据库->query($查询SQL);
            $结果集 = $语句->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($结果集 as $索引 => $行数据) {
                $视频名称 = $行数据[$映射字段['name']] ?? '未知视频';
                $视频链接 = '';
                $播放来源 = '数据库源';
                
                // 优先使用磁力链接
                if (!empty($映射字段['magnet']) && !empty($行数据[$映射字段['magnet']])) {
                    $视频链接 = $行数据[$映射字段['magnet']];
                    $播放来源 = '🧲磁力链接';
                } elseif (!empty($映射字段['url']) && !empty($行数据[$映射字段['url']])) {
                    $视频链接 = $行数据[$映射字段['url']];
                    if (strpos($视频链接, 'magnet:') === 0) {
                        $播放来源 = '🧲磁力链接';
                    } elseif (strpos($视频链接, 'ed2k://') === 0) {
                        $播放来源 = '⚡电驴链接';
                    } elseif (strpos($视频链接, 'http') === 0) {
                        $播放来源 = '在线播放';
                    }
                }
                
                if (empty($视频链接)) {
                    continue;
                }
                
                // 构建视频信息
                $视频封面 = '';
                if (!empty($映射字段['image']) && !empty($行数据[$映射字段['image']])) {
                    $视频封面 = $行数据[$映射字段['image']];
                } else {
                    $视频封面 = $默认图片[$索引 % count($默认图片)];
                }
                
                $视频信息 = [
                    'vod_id' => 'db_' . md5($文件路径) . '_' . $表名 . '_' . $索引,
                    'vod_name' => $视频名称,
                    'vod_pic' => $视频封面,
                    'vod_remarks' => '高清',
                    'vod_year' => !empty($映射字段['year']) ? ($行数据[$映射字段['year']] ?? date('Y')) : date('Y'),
                    'vod_area' => !empty($映射字段['area']) ? ($行数据[$映射字段['area']] ?? '中国大陆') : '中国大陆',
                    'vod_content' => !empty($映射字段['content']) ? ($行数据[$映射字段['content']] ?? $视频名称 . '的精彩内容') : $视频名称 . '的精彩内容',
                    'vod_play_from' => $播放来源,
                    'vod_play_url' => '正片$' . $视频链接
                ];
                
                // 添加可选字段
                if (!empty($映射字段['actor']) && !empty($行数据[$映射字段['actor']])) {
                    $视频信息['vod_actor'] = $行数据[$映射字段['actor']];
                }
                
                if (!empty($映射字段['director']) && !empty($行数据[$映射字段['director']])) {
                    $视频信息['vod_director'] = $行数据[$映射字段['director']];
                }
                
                $视频列表[] = $视频信息;
                
                if (count($视频列表) >= MAX_DB_RESULTS) {
                    break 2;
                }
            }
        } catch (Exception $e) {
            // 跳过有问题的表
            continue;
        }
    }
    
    $数据库 = null;
    return $视频列表;
}
/**
 * 解析直播频道数据库
 */
function 解析直播频道数据库($数据库, $文件路径) {
    $视频列表 = [];
    $表列表 = $数据库->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
    
    $默认图片 = [
        'https://www.252035.xyz/imgs?t=1335527662'
    ];
    
    foreach ($表列表 as $表名) {
        if (strpos($表名, 'sqlite_') === 0) continue;
        
        $字段信息 = $数据库->query("PRAGMA table_info($表名)")->fetchAll(PDO::FETCH_ASSOC);
        $字段名称 = array_column($字段信息, 'name');
        
        $名称字段 = null;
        $链接字段 = null;
        $分组字段 = null;
        $图标字段 = null;
        
        foreach ($字段名称 as $字段) {
            $小写字段 = strtolower($字段);
            if (in_array($小写字段, ['name', 'title', 'channel_name', 'channel_title'])) {
                $名称字段 = $字段;
            } elseif (in_array($小写字段, ['url', 'link', 'channel_url', 'play_url'])) {
                $链接字段 = $字段;
            } elseif (in_array($小写字段, ['group', 'category', 'type'])) {
                $分组字段 = $字段;
            } elseif (in_array($小写字段, ['logo', 'icon', 'image'])) {
                $图标字段 = $字段;
            }
        }
        
        if (!$名称字段 || !$链接字段) {
            continue;
        }
        
        $选择字段 = [$名称字段, $链接字段];
        if ($分组字段) $选择字段[] = $分组字段;
        if ($图标字段) $选择字段[] = $图标字段;
        
        $查询SQL = "SELECT " . implode(', ', $选择字段) . " FROM $表名 LIMIT 1000";
        
        try {
            $语句 = $数据库->query($查询SQL);
            $结果集 = $语句->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($结果集 as $索引 => $行数据) {
                $频道名称 = $行数据[$名称字段] ?? '未知频道';
                $频道链接 = $行数据[$链接字段] ?? '';
                $频道分组 = $分组字段 ? ($行数据[$分组字段] ?? '直播频道') : '直播频道';
                $频道图标 = $图标字段 ? ($行数据[$图标字段] ?? '') : '';
                
                if (empty($频道链接)) {
                    continue;
                }
                
                $视频封面 = $频道图标 ?: $默认图片[$索引 % count($默认图片)];
                
                $视频列表[] = [
                    'vod_id' => 'live_' . md5($文件路径) . '_' . $表名 . '_' . $索引,
                    'vod_name' => $频道名称,
                    'vod_pic' => $视频封面,
                    'vod_remarks' => '直播',
                    'vod_year' => date('Y'),
                    'vod_area' => '中国大陆',
                    'vod_content' => $频道名称 . '直播频道',
                    'vod_play_from' => $频道分组,
                    'vod_play_url' => '直播$' . $频道链接
                ];
                
                if (count($视频列表) >= 1000) {
                    break 2;
                }
            }
        } catch (Exception $e) {
            continue;
        }
    }
    
    $数据库 = null;
    return $视频列表;
}

/**
 * 自动识别并解析数据库
 */
function 解析自动识别数据库($数据库, $文件路径, $表列表) {
    $视频列表 = [];
    
    // 尝试多种解析方式
    foreach ($表列表 as $表名) {
        if (strpos($表名, 'sqlite_') === 0) continue;
        
        // 方法1: 检查是否有常见的视频字段
        $视频列表 = array_merge($视频列表, 尝试解析通用表($数据库, $文件路径, $表名));
        
        // 方法2: 检查是否有JSON数据字段
        $视频列表 = array_merge($视频列表, 尝试解析JSON表($数据库, $文件路径, $表名));
        
        if (count($视频列表) >= MAX_DB_RESULTS) {
            break;
        }
    }
    
    $数据库 = null;
    return $视频列表;
}

/**
 * 尝试解析通用表结构
 */
function 尝试解析通用表($数据库, $文件路径, $表名) {
    $视频列表 = [];
    
    try {
        $字段信息 = $数据库->query("PRAGMA table_info($表名)")->fetchAll(PDO::FETCH_ASSOC);
        $字段名称 = array_column($字段信息, 'name');
        
        // 查找可能的名称和链接字段
        $可能名称字段 = [];
        $可能链接字段 = [];
        
        foreach ($字段名称 as $字段) {
            $小写字段 = strtolower($字段);
            if (strpos($小写字段, 'name') !== false || strpos($小写字段, 'title') !== false) {
                $可能名称字段[] = $字段;
            }
            if (strpos($小写字段, 'url') !== false || strpos($小写字段, 'link') !== false || 
                strpos($小写字段, 'magnet') !== false) {
                $可能链接字段[] = $字段;
            }
        }
        
        if (empty($可能名称字段) || empty($可能链接字段)) {
            return $视频列表;
        }
        
        $名称字段 = $可能名称字段[0];
        $链接字段 = $可能链接字段[0];
        
        $查询SQL = "SELECT $名称字段, $链接字段 FROM $表名 LIMIT 500";
        $语句 = $数据库->query($查询SQL);
        $结果集 = $语句->fetchAll(PDO::FETCH_ASSOC);
        
        $默认图片 = ['https://www.252035.xyz/imgs?t=1335527662'];
        
        foreach ($结果集 as $索引 => $行数据) {
            $视频名称 = $行数据[$名称字段] ?? '未知视频';
            $视频链接 = $行数据[$链接字段] ?? '';
            
            if (empty($视频链接)) {
                continue;
            }
            
            $播放来源 = '数据库源';
            if (strpos($视频链接, 'magnet:') === 0) {
                $播放来源 = '🧲磁力链接';
            } elseif (strpos($视频链接, 'ed2k://') === 0) {
                $播放来源 = '⚡电驴链接';
            }
            
            $视频列表[] = [
                'vod_id' => 'auto_' . md5($文件路径) . '_' . $表名 . '_' . $索引,
                'vod_name' => $视频名称,
                'vod_pic' => $默认图片[$索引 % count($默认图片)],
                'vod_remarks' => '高清',
                'vod_year' => date('Y'),
                'vod_area' => '中国大陆',
                'vod_content' => $视频名称 . '的精彩内容',
                'vod_play_from' => $播放来源,
                'vod_play_url' => '正片$' . $视频链接
            ];
        }
    } catch (Exception $e) {
        // 跳过解析失败的表
    }
    
    return $视频列表;
}

/**
 * 尝试解析JSON表
 */
function 尝试解析JSON表($数据库, $文件路径, $表名) {
    $视频列表 = [];
    
    try {
        $字段信息 = $数据库->query("PRAGMA table_info($表名)")->fetchAll(PDO::FETCH_ASSOC);
        $字段名称 = array_column($字段信息, 'name');
        
        // 查找可能的JSON字段
        $JSON字段 = null;
        foreach ($字段名称 as $字段) {
            $小写字段 = strtolower($字段);
            if (in_array($小写字段, ['json', 'data', 'info', 'content'])) {
                $JSON字段 = $字段;
                break;
            }
        }
        
        if (!$JSON字段) {
            return $视频列表;
        }
        
        $查询SQL = "SELECT $JSON字段 FROM $表名 LIMIT 300";
        $语句 = $数据库->query($查询SQL);
        $结果集 = $语句->fetchAll(PDO::FETCH_COLUMN);
        
        $默认图片 = ['https://www.252035.xyz/imgs?t=1335527662'];
        
        foreach ($结果集 as $索引 => $json数据) {
            if (empty($json数据)) continue;
            
            $视频数据 = json_decode($json数据, true);
            if (!$视频数据 || !is_array($视频数据)) continue;
            
            $视频名称 = $视频数据['title'] ?? $视频数据['name'] ?? '未知视频';
            $视频链接 = $视频数据['url'] ?? $视频数据['magnet'] ?? $视频数据['link'] ?? '';
            
            if (empty($视频链接)) continue;
            
            $播放来源 = '数据库源';
            if (strpos($视频链接, 'magnet:') === 0) {
                $播放来源 = '🧲磁力链接';
            } elseif (strpos($视频链接, 'ed2k://') === 0) {
                $播放来源 = '⚡电驴链接';
            }
            
            $视频列表[] = [
                'vod_id' => 'json_' . md5($文件路径) . '_' . $表名 . '_' . $索引,
                'vod_name' => $视频名称,
                'vod_pic' => $视频数据['image'] ?? $视频数据['pic'] ?? $视频数据['cover'] ?? $默认图片[$索引 % count($默认图片)],
                'vod_remarks' => '高清',
                'vod_year' => $视频数据['year'] ?? date('Y'),
                'vod_area' => $视频数据['area'] ?? '中国大陆',
                'vod_content' => $视频数据['desc'] ?? $视频数据['description'] ?? $视频数据['content'] ?? $视频名称 . '的精彩内容',
                'vod_play_from' => $播放来源,
                'vod_play_url' => '正片$' . $视频链接
            ];
            
            if (count($视频列表) >= 300) {
                break;
            }
        }
    } catch (Exception $e) {
        // 跳过解析失败的表
    }
    
    return $视频列表;
}
/**
 * 解析JSON文件内容 - 完整加载
 */
function 解析JSON文件($文件路径) {
    if (!file_exists($文件路径)) {
        return ['错误' => 'JSON文件不存在: ' . basename($文件路径)];
    }
    
    $JSON内容 = @file_get_contents($文件路径);
    if ($JSON内容 === false) {
        return ['错误' => '无法读取JSON文件: ' . basename($文件路径)];
    }
    
    if (substr($JSON内容, 0, 3) == "\xEF\xBB\xBF") {
        $JSON内容 = substr($JSON内容, 3);
    }
    
    $数据 = json_decode($JSON内容, true);
    if (!$数据) {
        return ['错误' => 'JSON格式无效: ' . basename($文件路径)];
    }
    
    if (!isset($数据['list']) || !is_array($数据['list'])) {
        return ['错误' => 'JSON格式无效或缺少list字段: ' . basename($文件路径)];
    }
    
    return $数据['list'];
}

/**
 * 智能生成视频名称
 */
function 生成视频名称($链接, $默认名称 = '未知视频') {
    if (strpos($链接, 'magnet:?xt=urn:btih:') === 0) {
        if (preg_match('/&dn=([^&]+)/i', $链接, $匹配)) {
            $名称 = urldecode($匹配[1]);
            return $名称 ?: '磁力资源';
        }
        return '磁力资源';
    }
    
    if (strpos($链接, 'ed2k://') === 0) {
        if (preg_match('/\|file\|([^\|]+)\|/i', $链接, $匹配)) {
            $名称 = urldecode($匹配[1]);
            return $名称 ?: '电驴资源';
        }
        return '电驴资源';
    }
    
    return $默认名称;
}

/**
 * 解析TXT文件内容 - 增强磁力链接和纯链接支持
 */
function 解析TXT文件($文件路径) {
    if (!file_exists($文件路径)) {
        return ['错误' => 'TXT文件不存在: ' . basename($文件路径)];
    }
    
    $句柄 = @fopen($文件路径, 'r');
    if (!$句柄) {
        return ['错误' => '无法打开TXT文件: ' . basename($文件路径)];
    }
    
    $视频列表 = [];
    $视频数量 = 0;
    $行号 = 0;
    
    $默认图片 = [
        'https://www.252035.xyz/imgs?t=1335527662'
    ];
    
    $首行 = fgets($句柄);
    rewind($句柄);
    $有BOM = (substr($首行, 0, 3) == "\xEF\xBB\xBF");
    if ($有BOM) {
        fseek($句柄, 3);
    }
    
    $内存限制 = 50 * 1024 * 1024;
    $起始内存 = memory_get_usage();
    
    while (($行 = fgets($句柄)) !== false) {
        $行号++;
        $行 = trim($行);
        
        if ($行 === '' || $行[0] === '#' || $行[0] === ';') {
            continue;
        }
        
        if (strpos($行, 'magnet:') === 0 || strpos($行, 'ed2k://') === 0) {
            $链接 = $行;
            $名称 = 生成视频名称($链接);
        } else {
            $分隔符 = [',', "\t", '|', '$', '#'];
            $分隔符位置 = false;
            
            foreach ($分隔符 as $分隔) {
                $位置 = strpos($行, $分隔);
                if ($位置 !== false) {
                    $分隔符位置 = $位置;
                    break;
                }
            }
            
            if ($分隔符位置 === false) {
                $链接 = $行;
                $名称 = 生成视频名称($链接);
            } else {
                $名称 = trim(substr($行, 0, $分隔符位置));
                $链接 = trim(substr($行, $分隔符位置 + 1));
            }
        }
        
        if (empty($名称) || empty($链接)) {
            continue;
        }
        
        $有效协议 = ['http://', 'https://', 'rtmp://', 'rtsp://', 'udp://', 'magnet:', 'ed2k://'];
        $有有效协议 = false;
        foreach ($有效协议 as $协议) {
            if (stripos($链接, $协议) === 0) {
                $有有效协议 = true;
                break;
            }
        }
        
        if (!$有有效协议) {
            continue;
        }
        
        $图片索引 = $视频数量 % count($默认图片);
        
        $播放来源 = '在线播放';
        if (strpos($链接, 'magnet:') === 0) {
            $播放来源 = '🧲磁力链接';
        } elseif (strpos($链接, 'ed2k://') === 0) {
            $播放来源 = '⚡电驴链接';
        }
        
        $视频列表[] = [
            'vod_id' => 'txt_' . md5($文件路径) . '_' . $行号,
            'vod_name' => $名称,
            'vod_pic' => $默认图片[$图片索引],
            'vod_remarks' => '高清',
            'vod_year' => date('Y'),
            'vod_area' => '中国大陆',
            'vod_content' => '《' . $名称 . '》的精彩内容',
            'vod_play_from' => $播放来源,
            'vod_play_url' => '正片$' . $链接
        ];
        
        $视频数量++;
        
        if ($视频数量 % 100 === 0) {
            $当前内存 = memory_get_usage() - $起始内存;
            if ($当前内存 > $内存限制) {
                break;
            }
            gc_collect_cycles();
        }
        
        if ($视频数量 >= 10000) {
            break;
        }
    }
    
    fclose($句柄);
    
    return $视频列表;
}
/**
 * 解析M3U文件内容 - 增强磁力链接支持
 */
function 解析M3U文件($文件路径) {
    if (!file_exists($文件路径)) {
        return ['错误' => 'M3U文件不存在: ' . basename($文件路径)];
    }
    
    $句柄 = @fopen($文件路径, 'r');
    if (!$句柄) {
        return ['错误' => '无法打开M3U文件: ' . basename($文件路径)];
    }
    
    $视频列表 = [];
    $视频数量 = 0;
    $当前名称 = '';
    $当前图标 = '';
    $当前分组 = '';
    $行号 = 0;
    
    $默认图片 = [
        'https://www.252035.xyz/imgs?t=1335527662'
    ];
    
    $首行 = fgets($句柄);
    rewind($句柄);
    $有BOM = (substr($首行, 0, 3) == "\xEF\xBB\xBF");
    if ($有BOM) {
        fseek($句柄, 3);
    }
    
    while (($行 = fgets($句柄)) !== false) {
        $行号++;
        $行 = trim($行);
        if ($行 === '') continue;
        
        if (strpos($行, '#EXTM3U') === 0) {
            continue;
        }
        
        if (strpos($行, '#EXTINF:') === 0) {
            $当前名称 = '';
            $当前图标 = '';
            $当前分组 = '';
            
            $部分 = explode(',', $行, 2);
            if (count($部分) > 1) {
                $当前名称 = trim($部分[1]);
            }
            
            if (preg_match('/tvg-logo="([^"]*)"/i', $行, $图标匹配)) {
                $当前图标 = trim($图标匹配[1]);
            }
            
            if (preg_match('/group-title="([^"]*)"/i', $行, $分组匹配)) {
                $当前分组 = trim($分组匹配[1]);
            }
            continue;
        }
        
        $有效协议 = ['http://', 'https://', 'rtmp://', 'rtsp://', 'udp://', 'magnet:', 'ed2k://'];
        $有有效协议 = false;
        foreach ($有效协议 as $协议) {
            if (stripos($行, $协议) === 0) {
                $有有效协议 = true;
                break;
            }
        }
        
        if ($有有效协议 && !empty($当前名称)) {
            $图片索引 = $视频数量 % count($默认图片);
            
            $视频封面 = $当前图标;
            if (empty($视频封面) || !filter_var($视频封面, FILTER_VALIDATE_URL)) {
                $视频封面 = $默认图片[$图片索引];
            }
            
            $播放来源 = '直播源';
            if (!empty($当前分组)) {
                $播放来源 = $当前分组;
            }
            
            if (strpos($行, 'magnet:') === 0) {
                $播放来源 = '🧲磁力链接';
            } elseif (strpos($行, 'ed2k://') === 0) {
                $播放来源 = '⚡电驴链接';
            }
            
            $视频列表[] = [
                'vod_id' => 'm3u_' . md5($文件路径) . '_' . $行号,
                'vod_name' => $当前名称,
                'vod_pic' => $视频封面,
                'vod_remarks' => '直播',
                'vod_year' => date('Y'),
                'vod_area' => '中国大陆',
                'vod_content' => $当前名称 . '直播频道',
                'vod_play_from' => $播放来源,
                'vod_play_url' => '直播$' . $行
            ];
            
            $视频数量++;
            
            $当前名称 = '';
            $当前图标 = '';
            $当前分组 = '';
            
            if ($视频数量 >= 5000) {
                break;
            }
        }
    }
    
    fclose($句柄);
    
    return $视频列表;
}

/**
 * 分类列表
 */
function 获取分类($分类标识, $页码) {
    $分类列表 = 获取分类列表();
    
    if (empty($分类列表)) {
        return ['错误' => '未找到任何分类'];
    }
    
    if ($分类标识 === 'hot') {
        $当前页码 = intval($页码);
        if ($当前页码 < 1) $当前页码 = 1;
        
        $热门视频 = 获取热门视频($当前页码, 15);
        
        if (empty($热门视频)) {
            return [
                'page' => $当前页码,
                'pagecount' => 9999,
                'limit' => 15,
                'total' => 0,
                'list' => []
            ];
        }
        
        $格式化视频 = [];
        foreach ($热门视频 as $视频) {
            $格式化视频[] = 格式化视频项($视频);
        }
        
        return [
            'page' => $当前页码,
            'pagecount' => 9999,
            'limit' => 15,
            'total' => 999999,
            'list' => $格式化视频
        ];
    }
    
    $目标分类 = null;
    foreach ($分类列表 as $分类) {
        if ($分类['type_id'] === $分类标识) {
            $目标分类 = $分类;
            break;
        }
    }
    
    if (!$目标分类) {
        return ['错误' => '分类未找到: ' . $分类标识];
    }
    
    if ($目标分类['source_type'] === 'empty') {
        return [
            'page' => 1,
            'pagecount' => 1,
            'limit' => 10,
            'total' => 0,
            'list' => []
        ];
    }
    
    $分类视频 = [];
    
    if (file_exists($目标分类['source_path'])) {
        switch ($目标分类['source_type']) {
            case 'json':
                $分类视频 = 解析JSON文件($目标分类['source_path']);
                break;
            case 'txt':
                $分类视频 = 解析TXT文件($目标分类['source_path']);
                break;
            case 'm3u':
                $分类视频 = 解析M3U文件($目标分类['source_path']);
                break;
            case 'db':
            case 'sqlite':
            case 'sqlite3':
            case 'db3':
                $分类视频 = 解析数据库文件($目标分类['source_path']);
                break;
        }
    }
    
    if (isset($分类视频['错误'])) {
        return ['错误' => $分类视频['错误']];
    }
    
    if (empty($分类视频)) {
        return ['错误' => '在文件中未找到视频: ' . $目标分类['type_name']];
    }
    
    $每页大小 = 10;
    $总数 = count($分类视频);
    $总页数 = ceil($总数 / $每页大小);
    $当前页码 = intval($页码);
    
    if ($当前页码 < 1) $当前页码 = 1;
    if ($当前页码 > $总页数) $当前页码 = $总页数;
    
    $起始位置 = ($当前页码 - 1) * $每页大小;
    $分页视频 = array_slice($分类视频, $起始位置, $每页大小);
    
    $格式化视频 = [];
    foreach ($分页视频 as $视频) {
        $格式化视频[] = 格式化视频项($视频);
    }
    
    return [
        'page' => $当前页码,
        'pagecount' => $总页数,
        'limit' => $每页大小,
        'total' => $总数,
        'list' => $格式化视频
    ];
}

/**
 * 格式化视频项
 */
function 格式化视频项($视频) {
    return [
        'vod_id' => $视频['vod_id'] ?? '',
        'vod_name' => $视频['vod_name'] ?? '未知视频',
        'vod_pic' => $视频['vod_pic'] ?? 'https://www.252035.xyz/imgs?t=1335527662',
        'vod_remarks' => $视频['vod_remarks'] ?? '高清',
        'vod_year' => $视频['vod_year'] ?? '',
        'vod_area' => $视频['vod_area'] ?? '中国大陆'
    ];
}
/**
 * 视频详情
 */
function 获取详情($视频标识) {
    $标识数组 = explode(',', $视频标识);
    $结果 = [];
    
    foreach ($标识数组 as $标识) {
        $视频 = 按标识查找视频($标识);
        if ($视频) {
            $结果[] = 格式化视频详情($视频);
        } else {
            $结果[] = [
                'vod_id' => $标识,
                'vod_name' => '视频 ' . $标识,
                'vod_pic' => 'https://www.252035.xyz/imgs?t=1335527662',
                'vod_remarks' => '高清',
                'vod_content' => '视频详情内容',
                'vod_play_from' => '在线播放',
                'vod_play_url' => '正片$https://example.com/video'
            ];
        }
    }
    
    return ['list' => $结果];
}

/**
 * 按标识查找视频
 */
function 按标识查找视频($标识) {
    $所有文件 = 获取所有文件();
    
    // 特别处理CJCJ数据库的视频
    if (strpos($标识, 'cj_') === 0) {
        $部分 = explode('_', $标识);
        if (count($部分) >= 3) {
            $文件哈希 = $部分[1];
            $视频索引 = $部分[2];
            
            foreach ($所有文件 as $文件) {
                if (in_array($文件['type'], ['db', 'sqlite', 'sqlite3', 'db3']) && md5($文件['path']) === $文件哈希) {
                    return 按索引查找CJ视频($文件['path'], $视频索引);
                }
            }
        }
    } elseif (strpos($标识, 'txt_') === 0) {
        $部分 = explode('_', $标识);
        if (count($部分) >= 3) {
            $文件哈希 = $部分[1];
            $行号 = $部分[2];
            
            foreach ($所有文件 as $文件) {
                if ($文件['type'] === 'txt' && md5($文件['path']) === $文件哈希) {
                    return 按行查找TXT视频($文件['path'], $行号);
                }
            }
        }
    } elseif (strpos($标识, 'm3u_') === 0) {
        $部分 = explode('_', $标识);
        if (count($部分) >= 3) {
            $文件哈希 = $部分[1];
            $行号 = $部分[2];
            
            foreach ($所有文件 as $文件) {
                if ($文件['type'] === 'm3u' && md5($文件['path']) === $文件哈希) {
                    return 按行查找M3U视频($文件['path'], $行号);
                }
            }
        }
    } elseif (strpos($标识, 'db_') === 0) {
        $部分 = explode('_', $标识);
        if (count($部分) >= 4) {
            $文件哈希 = $部分[1];
            $表名 = $部分[2];
            $视频索引 = $部分[3];
            
            foreach ($所有文件 as $文件) {
                if (in_array($文件['type'], ['db', 'sqlite', 'sqlite3', 'db3']) && md5($文件['path']) === $文件哈希) {
                    return 按索引查找数据库视频($文件['path'], $表名, $视频索引);
                }
            }
        }
    } elseif (strpos($标识, 'video_') === 0) {
        // 视频分类数据库的视频查找
        $视频ID = substr($标识, 6); // 去掉 'video_' 前缀
        return 按ID查找分类视频($视频ID);
    } elseif (strpos($标识, 'auto_') === 0) {
        // 自动识别数据库的视频查找
        $部分 = explode('_', $标识);
        if (count($部分) >= 4) {
            $文件哈希 = $部分[1];
            $表名 = $部分[2];
            $视频索引 = $部分[3];
            
            foreach ($所有文件 as $文件) {
                if (in_array($文件['type'], ['db', 'sqlite', 'sqlite3', 'db3']) && md5($文件['path']) === $文件哈希) {
                    return 按索引查找数据库视频($文件['path'], $表名, $视频索引);
                }
            }
        }
    } elseif (strpos($标识, 'json_') === 0) {
        // JSON数据库的视频查找
        $部分 = explode('_', $标识);
        if (count($部分) >= 4) {
            $文件哈希 = $部分[1];
            $表名 = $部分[2];
            $视频索引 = $部分[3];
            
            foreach ($所有文件 as $文件) {
                if (in_array($文件['type'], ['db', 'sqlite', 'sqlite3', 'db3']) && md5($文件['path']) === $文件哈希) {
                    return 按索引查找数据库视频($文件['path'], $表名, $视频索引);
                }
            }
        }
    } elseif (strpos($标识, 'live_') === 0) {
        // 直播数据库的视频查找
        $部分 = explode('_', $标识);
        if (count($部分) >= 4) {
            $文件哈希 = $部分[1];
            $表名 = $部分[2];
            $视频索引 = $部分[3];
            
            foreach ($所有文件 as $文件) {
                if (in_array($文件['type'], ['db', 'sqlite', 'sqlite3', 'db3']) && md5($文件['path']) === $文件哈希) {
                    return 按索引查找数据库视频($文件['path'], $表名, $视频索引);
                }
            }
        }
    } else {
        foreach ($所有文件 as $文件) {
            if ($文件['type'] === 'json') {
                $视频列表 = 解析JSON文件($文件['path']);
                foreach ($视频列表 as $视频) {
                    if (isset($视频['vod_id']) && $视频['vod_id'] == $标识) {
                        return $视频;
                    }
                }
            }
        }
    }
    
    return null;
}

/**
 * 按索引查找CJCJ视频
 */
function 按索引查找CJ视频($文件路径, $视频索引) {
    if (!file_exists($文件路径) || !extension_loaded('pdo_sqlite')) {
        return null;
    }
    
    try {
        $数据库 = new PDO("sqlite:" . $文件路径);
        $数据库->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // 查询指定行的数据
        $查询SQL = "SELECT * FROM cj LIMIT 1 OFFSET " . intval($视频索引);
        $语句 = $数据库->query($查询SQL);
        $行数据 = $语句->fetch(PDO::FETCH_ASSOC);
        
        if ($行数据) {
            $默认图片 = ['https://www.252035.xyz/imgs?t=1335527662'];
            
            // 提取视频信息
            $视频名称 = $行数据['vod_name'] ?? $行数据['vod_id'] ?? '未知视频';
            $播放链接 = '';
            $播放来源 = 'CJCJ数据库';
            
            // 解析播放URL
            $播放数据 = $行数据['vod_play_url'] ?? '';
            if (!empty($播放数据)) {
                // 处理播放URL格式：播放源$播放链接
                if (strpos($播放数据, '$') !== false) {
                    $播放部分 = explode('$', $播放数据);
                    if (count($播放部分) >= 2) {
                        $播放链接 = trim($播放部分[1]);
                    }
                } else {
                    $播放链接 = $播放数据;
                }
            }
            
            if (empty($播放链接)) {
                $数据库 = null;
                return null;
            }
            
            // 确定播放来源
            if (strpos($播放链接, 'magnet:') === 0) {
                $播放来源 = '🧲磁力链接';
            } elseif (strpos($播放链接, 'ed2k://') === 0) {
                $播放来源 = '⚡电驴链接';
            } elseif (strpos($播放链接, 'http') === 0) {
                $播放来源 = $行数据['vod_play_from'] ?? '在线播放';
            }
            
            // 构建视频信息
            $视频封面 = $行数据['vod_pic'] ?? $默认图片[0];
            $视频描述 = $行数据['vod_content'] ?? $视频名称 . '的精彩内容';
            $视频年份 = $行数据['vod_year'] ?? $行数据['vod_pubdate'] ?? date('Y');
            $视频地区 = $行数据['vod_area'] ?? '中国大陆';
            $演员 = $行数据['vod_actor'] ?? '';
            $导演 = $行数据['vod_director'] ?? '';
            $备注 = $行数据['vod_remarks'] ?? '高清';
            $分类 = $行数据['type_name'] ?? '';
            
            $视频 = [
                'vod_id' => 'cj_' . md5($文件路径) . '_' . $视频索引,
                'vod_name' => $视频名称,
                'vod_pic' => $视频封面,
                'vod_remarks' => $备注,
                'vod_year' => $视频年份,
                'vod_area' => $视频地区,
                'vod_actor' => $演员,
                'vod_director' => $导演,
                'vod_content' => $视频描述,
                'vod_play_from' => $播放来源 . ($分类 ? ' · ' . $分类 : ''),
                'vod_play_url' => '正片$' . $播放链接
            ];
            
            $数据库 = null;
            return $视频;
        }
        
        $数据库 = null;
        return null;
        
    } catch (PDOException $异常) {
        return null;
    }
}

/**
 * 按ID查找分类视频
 */
function 按ID查找分类视频($视频ID) {
    $所有文件 = 获取所有文件();
    
    foreach ($所有文件 as $文件) {
        if (in_array($文件['type'], ['db', 'sqlite', 'sqlite3', 'db3'])) {
            if (!file_exists($文件['path']) || !extension_loaded('pdo_sqlite')) {
                continue;
            }
            
            try {
                $数据库 = new PDO("sqlite:" . $文件['path']);
                $数据库->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // 检查是否是视频分类数据库
                $表列表 = $数据库->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
                
                if (in_array('videos', $表列表) && in_array('categories', $表列表)) {
                    // 查询指定视频
                    $查询SQL = "SELECT v.*, c.name as category_name FROM videos v LEFT JOIN categories c ON v.category_id = c.id WHERE v.id = ?";
                    $语句 = $数据库->prepare($查询SQL);
                    $语句->execute([$视频ID]);
                    $视频数据 = $语句->fetch(PDO::FETCH_ASSOC);
                    
                    if ($视频数据) {
                        $默认图片 = ['https://www.252035.xyz/imgs?t=1335527662'];
                        
                        $播放来源 = '视频源';
                        $播放链接 = $视频数据['play_url'] ?? '';
                        
                        if (strpos($播放链接, 'magnet:') === 0) {
                            $播放来源 = '🧲磁力链接';
                        } elseif (strpos($播放链接, 'ed2k://') === 0) {
                            $播放来源 = '⚡电驴链接';
                        } elseif (strpos($播放链接, 'http') === 0) {
                            $播放来源 = '在线播放';
                        }
                        
                        $视频 = [
                            'vod_id' => 'video_' . $视频数据['id'],
                            'vod_name' => $视频数据['name'] ?? '未知视频',
                            'vod_pic' => $视频数据['image'] ?? $默认图片[0],
                            'vod_remarks' => $视频数据['remarks'] ?? '高清',
                            'vod_year' => $视频数据['year'] ?? '',
                            'vod_area' => $视频数据['area'] ?? '中国大陆',
                            'vod_actor' => $视频数据['actor'] ?? '',
                            'vod_director' => $视频数据['director'] ?? '',
                            'vod_content' => $视频数据['content'] ?? ($视频数据['name'] ?? '未知视频') . '的精彩内容',
                            'vod_play_from' => $播放来源 . ' · ' . ($视频数据['category_name'] ?? '未知分类'),
                            'vod_play_url' => '正片$' . $播放链接
                        ];
                        
                        $数据库 = null;
                        return $视频;
                    }
                }
                
                $数据库 = null;
            } catch (PDOException $异常) {
                continue;
            }
        }
    }
    
    return null;
}
/**
 * 在TXT文件中按行号查找视频 - 增强磁力链接支持
 */
function 按行查找TXT视频($文件路径, $目标行号) {
    if (!file_exists($文件路径)) {
        return null;
    }
    
    $句柄 = @fopen($文件路径, 'r');
    if (!$句柄) {
        return null;
    }
    
    $当前行 = 0;
    $视频 = null;
    
    $默认图片 = [
        'https://www.252035.xyz/imgs?t=1335527662'
    ];
    
    $首行 = fgets($句柄);
    rewind($句柄);
    $有BOM = (substr($首行, 0, 3) == "\xEF\xBB\xBF");
    if ($有BOM) {
        fseek($句柄, 3);
    }
    
    while (($行 = fgets($句柄)) !== false) {
        $当前行++;
        $行 = trim($行);
        
        if ($行 === '' || $行[0] === '#' || $行[0] === ';') continue;
        
        if ($当前行 == $目标行号) {
            if (strpos($行, 'magnet:') === 0 || strpos($行, 'ed2k://') === 0) {
                $链接 = $行;
                $名称 = 生成视频名称($链接);
            } else {
                $分隔符 = [',', "\t", '|', '$', '#'];
                $分隔符位置 = false;
                
                foreach ($分隔符 as $分隔) {
                    $位置 = strpos($行, $分隔);
                    if ($位置 !== false) {
                        $分隔符位置 = $位置;
                        break;
                    }
                }
                
                if ($分隔符位置 !== false) {
                    $名称 = trim(substr($行, 0, $分隔符位置));
                    $链接 = trim(substr($行, $分隔符位置 + 1));
                } else {
                    $链接 = $行;
                    $名称 = 生成视频名称($链接);
                }
            }
            
            if (!empty($名称) && !empty($链接)) {
                $图片索引 = $当前行 % count($默认图片);
                
                $播放来源 = '在线播放';
                if (strpos($链接, 'magnet:') === 0) {
                    $播放来源 = '🧲磁力链接';
                } elseif (strpos($链接, 'ed2k://') === 0) {
                    $播放来源 = '⚡电驴链接';
                }
                
                $视频 = [
                    'vod_id' => 'txt_' . md5($文件路径) . '_' . $当前行,
                    'vod_name' => $名称,
                    'vod_pic' => $默认图片[$图片索引],
                    'vod_remarks' => '高清',
                    'vod_year' => date('Y'),
                    'vod_area' => '中国大陆',
                    'vod_content' => '《' . $名称 . '》的精彩内容',
                    'vod_play_from' => $播放来源,
                    'vod_play_url' => '正片$' . $链接
                ];
            }
            break;
        }
    }
    
    fclose($句柄);
    
    return $视频;
}

/**
 * 在M3U文件中按行号查找视频
 */
function 按行查找M3U视频($文件路径, $目标行号) {
    if (!file_exists($文件路径)) {
        return null;
    }
    
    $句柄 = @fopen($文件路径, 'r');
    if (!$句柄) {
        return null;
    }
    
    $当前行 = 0;
    $视频 = null;
    $当前名称 = '';
    $当前图标 = '';
    $当前分组 = '';
    
    $默认图片 = [
        'https://www.252035.xyz/imgs?t=1335527662'
    ];
    
    $首行 = fgets($句柄);
    rewind($句柄);
    $有BOM = (substr($首行, 0, 3) == "\xEF\xBB\xBF");
    if ($有BOM) {
        fseek($句柄, 3);
    }
    
    while (($行 = fgets($句柄)) !== false) {
        $当前行++;
        $行 = trim($行);
        if ($行 === '') continue;
        
        if (strpos($行, '#EXTM3U') === 0) {
            continue;
        }
        
        if (strpos($行, '#EXTINF:') === 0) {
            $当前名称 = '';
            $当前图标 = '';
            $当前分组 = '';
            
            $部分 = explode(',', $行, 2);
            if (count($部分) > 1) {
                $当前名称 = trim($部分[1]);
            }
            
            if (preg_match('/tvg-logo="([^"]*)"/i', $行, $图标匹配)) {
                $当前图标 = trim($图标匹配[1]);
            }
            
            if (preg_match('/group-title="([^"]*)"/i', $行, $分组匹配)) {
                $当前分组 = trim($分组匹配[1]);
            }
            continue;
        }
        
        if ((strpos($行, 'http') === 0 || strpos($行, 'rtmp') === 0 || 
             strpos($行, 'rtsp') === 0 || strpos($行, 'udp') === 0 ||
             strpos($行, 'magnet:') === 0 || strpos($行, 'ed2k://') === 0) && 
            !empty($当前名称)) {
            
            if ($当前行 == $目标行号) {
                $图片索引 = $当前行 % count($默认图片);
                
                $视频封面 = $当前图标;
                if (empty($视频封面) || !filter_var($视频封面, FILTER_VALIDATE_URL)) {
                    $视频封面 = $默认图片[$图片索引];
                }
                
                $播放来源 = '直播源';
                if (!empty($当前分组)) {
                    $播放来源 = $当前分组;
                }
                
                if (strpos($行, 'magnet:') === 0) {
                    $播放来源 = '🧲磁力链接';
                } elseif (strpos($行, 'ed2k://') === 0) {
                    $播放来源 = '⚡电驴链接';
                }
                
                $视频 = [
                    'vod_id' => 'm3u_' . md5($文件路径) . '_' . $当前行,
                    'vod_name' => $当前名称,
                    'vod_pic' => $视频封面,
                    'vod_remarks' => '直播',
                    'vod_year' => date('Y'),
                    'vod_area' => '中国大陆',
                    'vod_content' => $当前名称 . '直播频道',
                    'vod_play_from' => $播放来源,
                    'vod_play_url' => '直播$' . $行
                ];
                break;
            }
            
            $当前名称 = '';
            $当前图标 = '';
            $当前分组 = '';
        }
    }
    
    fclose($句柄);
    
    return $视频;
}

/**
 * 在数据库文件中按索引查找视频 - 增强磁力链接支持
 */
function 按索引查找数据库视频($文件路径, $表名, $视频索引) {
    if (!file_exists($文件路径) || !extension_loaded('pdo_sqlite')) {
        return null;
    }
    
    try {
        $数据库 = new PDO("sqlite:" . $文件路径);
        $数据库->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // 查询指定行的data字段
        $查询SQL = "SELECT * FROM $表名 LIMIT 1 OFFSET " . intval($视频索引);
        $语句 = $数据库->query($查询SQL);
        $行数据 = $语句->fetch(PDO::FETCH_ASSOC);
        
        if ($行数据) {
            $默认图片 = ['https://www.252035.xyz/imgs?t=1335527662'];
            
            // 尝试多种字段组合
            $视频名称 = $行数据['name'] ?? $行数据['title'] ?? $行数据['vod_name'] ?? '未知视频';
            $视频链接 = $行数据['magnet'] ?? $行数据['url'] ?? $行数据['link'] ?? $行数据['play_url'] ?? '';
            $播放来源 = '数据库源';
            
            if (strpos($视频链接, 'magnet:') === 0) {
                $播放来源 = '🧲磁力链接';
            } elseif (strpos($视频链接, 'ed2k://') === 0) {
                $播放来源 = '⚡电驴链接';
            }
            
            if (empty($视频链接)) {
                $数据库 = null;
                return null;
            }
            
            $视频封面 = $行数据['image'] ?? $行数据['pic'] ?? $行数据['cover'] ?? $行数据['vod_pic'] ?? $默认图片[intval($视频索引) % count($默认图片)];
            $视频描述 = $行数据['content'] ?? $行数据['desc'] ?? $行数据['description'] ?? $行数据['vod_content'] ?? $视频名称 . '的精彩内容';
            $视频年份 = $行数据['year'] ?? $行数据['vod_year'] ?? date('Y');
            $视频地区 = $行数据['area'] ?? $行数据['region'] ?? $行数据['vod_area'] ?? '中国大陆';
            
            $视频 = [
                'vod_id' => 'db_' . md5($文件路径) . '_' . $表名 . '_' . $视频索引,
                'vod_name' => $视频名称,
                'vod_pic' => $视频封面,
                'vod_remarks' => '高清',
                'vod_year' => $视频年份,
                'vod_area' => $视频地区,
                'vod_content' => $视频描述,
                'vod_play_from' => $播放来源,
                'vod_play_url' => '正片$' . $视频链接
            ];
            
            $数据库 = null;
            return $视频;
        }
        
        $数据库 = null;
        return null;
        
    } catch (PDOException $异常) {
        return null;
    }
}
/**
 * 智能搜索匹配函数
 */
function 搜索匹配($文本, $关键词) {
    if (empty($文本) || empty($关键词)) {
        return false;
    }
    
    $文本 = strtolower(trim($文本));
    $关键词 = strtolower(trim($关键词));
    
    // 完全匹配
    if (strpos($文本, $关键词) !== false) {
        return true;
    }
    
    // 中文分词匹配（简单版本）
    $关键词长度 = mb_strlen($关键词, 'UTF-8');
    if ($关键词长度 > 1) {
        // 对长关键词进行分词匹配
        for ($i = 0; $i < $关键词长度; $i++) {
            $字符 = mb_substr($关键词, $i, 1, 'UTF-8');
            if (mb_strpos($文本, $字符, 0, 'UTF-8') === false) {
                return false;
            }
        }
        return true;
    }
    
    return false;
}

/**
 * 搜索 - 修复版
 */
function 搜索($关键词, $页码) {
    if (empty($关键词)) {
        return ['错误' => '请输入搜索关键词'];
    }
    
    $搜索结果 = [];
    $所有文件 = 获取所有文件();
    
    // 放宽搜索限制，增加搜索文件数量
    $搜索限制 = 10; // 从3增加到10
    $已搜索文件 = 0;
    
    // 记录搜索过程用于调试
    $搜索日志 = [];
    
    foreach ($所有文件 as $文件索引 => $文件) {
        if ($已搜索文件 >= $搜索限制) {
            break;
        }
        
        $搜索日志[] = "搜索文件: " . $文件['name'] . " (类型: " . $文件['type'] . ")";
        
        // 跳过可能的大文件或问题文件
        if (!file_exists($文件['path'])) {
            $搜索日志[] = "文件不存在，跳过";
            continue;
        }
        
        // 检查文件大小，避免处理过大文件
        $文件大小 = filesize($文件['path']);
        if ($文件大小 > 10 * 1024 * 1024) { // 超过10MB跳过
            $搜索日志[] = "文件过大(" . round($文件大小/1024/1024, 2) . "MB)，跳过";
            continue;
        }
        
        $视频列表 = [];
        try {
            switch ($文件['type']) {
                case 'json':
                    $视频列表 = 解析JSON文件($文件['path']);
                    break;
                case 'txt':
                    $视频列表 = 解析TXT文件($文件['path']);
                    break;
                case 'm3u':
                    $视频列表 = 解析M3U文件($文件['path']);
                    break;
                case 'db':
                case 'sqlite':
                case 'sqlite3':
                case 'db3':
                    $视频列表 = 解析数据库文件($文件['path']);
                    break;
                default:
                    continue 2; // 跳过未知类型
            }
        } catch (Exception $e) {
            $搜索日志[] = "文件解析失败: " . $e->getMessage();
            continue;
        }
        
        // 检查解析结果
        if (isset($视频列表['错误'])) {
            $搜索日志[] = "解析错误: " . $视频列表['错误'];
            continue;
        }
        
        if (!is_array($视频列表) || empty($视频列表)) {
            $搜索日志[] = "无视频数据";
            continue;
        }
        
        $文件匹配数 = 0;
        foreach ($视频列表 as $视频索引 => $视频) {
            // 更宽松的匹配条件
            $视频名称 = $视频['vod_name'] ?? '';
            if (empty($视频名称)) {
                continue;
            }
            
            // 使用更智能的搜索匹配
            if (搜索匹配($视频名称, $关键词)) {
                $格式化视频 = 格式化视频项($视频);
                $搜索结果[] = $格式化视频;
                $文件匹配数++;
                
                // 限制单个文件的搜索结果数量
                if ($文件匹配数 >= 20) {
                    break;
                }
                
                // 总结果数量限制
                if (count($搜索结果) >= 50) {
                    break 2;
                }
            }
        }
        
        $搜索日志[] = "在本文件找到 " . $文件匹配数 . " 个匹配结果";
        $已搜索文件++;
    }
    
    // 如果没有结果，返回调试信息
    if (empty($搜索结果)) {
        return [
            '错误' => '未找到相关视频内容',
            '调试信息' => [
                '关键词' => $关键词,
                '搜索文件数' => $已搜索文件,
                '总文件数' => count($所有文件),
                '搜索日志' => $搜索日志
            ]
        ];
    }
    
    // 去重结果
    $去重结果 = [];
    $已存在标识 = [];
    foreach ($搜索结果 as $视频) {
        $视频标识 = $视频['vod_id'] ?? $视频['vod_name'];
        if (!in_array($视频标识, $已存在标识)) {
            $去重结果[] = $视频;
            $已存在标识[] = $视频标识;
        }
    }
    $搜索结果 = $去重结果;
    
    // 分页处理
    $每页大小 = 10;
    $总数 = count($搜索结果);
    $总页数 = ceil($总数 / $每页大小);
    $当前页码 = intval($页码);
    
    if ($当前页码 < 1) $当前页码 = 1;
    if ($当前页码 > $总页数) $当前页码 = $总页数;
    
    $起始位置 = ($当前页码 - 1) * $每页大小;
    $分页结果 = array_slice($搜索结果, $起始位置, $每页大小);
    
    return [
        'page' => $当前页码,
        'pagecount' => $总页数,
        'limit' => $每页大小,
        'total' => $总数,
        'list' => $分页结果
    ];
}

/**
 * 格式化视频详情
 */
function 格式化视频详情($视频) {
    return [
        'vod_id' => $视频['vod_id'] ?? '',
        'vod_name' => $视频['vod_name'] ?? '未知视频',
        'vod_pic' => $视频['vod_pic'] ?? 'https://www.252035.xyz/imgs?t=1335527662',
        'vod_remarks' => $视频['vod_remarks'] ?? '高清',
        'vod_year' => $视频['vod_year'] ?? '',
        'vod_area' => $视频['vod_area'] ?? '中国大陆',
        'vod_director' => $视频['vod_director'] ?? '',
        'vod_actor' => $视频['vod_actor'] ?? '',
        'vod_content' => $视频['vod_content'] ?? '视频详情内容',
        'vod_play_from' => $视频['vod_play_from'] ?? 'default',
        'vod_play_url' => $视频['vod_play_url'] ?? ''
    ];
}
/**
 * 获取播放地址 - 增强磁力链接支持
 */
function 获取播放($标志, $标识) {
    // 解码URL参数
    $播放标识 = urldecode($标识);
    
    // 直接返回播放地址，TVBox播放器会处理磁力链接
    return [
        'parse' => 0, // 0表示不解析，直接播放
        'playUrl' => '',
        'url' => $播放标识,
        'header' => [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ],
        'type' => 'video'
    ];
}
?>