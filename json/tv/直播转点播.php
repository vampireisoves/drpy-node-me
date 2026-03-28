<?php
ini_set('memory_limit', '-1');
@set_time_limit(300);
define('BASE_SCAN_PATH', '/storage/emulated/0/VodPlus/wwwroot/直播转点播辅助文件/');
define('MAX_SCAN_DEPTH', 50);

header('Content-Type: application/json; charset=utf-8');

$ac = $_GET['ac'] ?? 'detail';
$t = $_GET['t'] ?? '';
$pg = $_GET['pg'] ?? '1';
$ids = $_GET['ids'] ?? '';
$wd = $_GET['wd'] ?? '';
$flag = $_GET['flag'] ?? '';
$id = $_GET['id'] ?? '';
$play = $_GET['play'] ?? '';

switch ($ac) {
    case 'detail':
        if (!empty($ids)) {
            $result = getDetail($ids);
        } elseif (!empty($t)) {
            $result = getCategory($t, $pg);
        } else {
            $result = getHome();
        }
        break;
    
    case 'search':
        $result = search($wd, $pg);
        break;
        
    case 'play':
        $result = getPlay($flag, $id);
        break;
    
    default:
        $result = ['error' => 'Unknown action: ' . $ac];
}

if (!empty($play)) {
    $result = directPlayUrl($play);
}

echo json_encode($result, JSON_UNESCAPED_UNICODE);

function directPlayUrl($playUrl) {
    $playUrl = urldecode($playUrl);
    
    return [
        'parse' => 0,
        'playUrl' => '',
        'url' => $playUrl,
        'header' => [
            'User-Agent' => 'okHttp/Mod-1.5.0.0'
        ],
        'type' => 'hls'
    ];
}

function scanDirectoryRecursive($directory, $currentDepth = 1) {
    $files = [];
    
    if (!is_dir($directory) || $currentDepth > MAX_SCAN_DEPTH) {
        return $files;
    }
    
    try {
        $items = @scandir($directory);
        if ($items === false) {
            return $files;
        }
        
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            
            $fullPath = rtrim($directory, '/') . '/' . $item;
            
            if (is_dir($fullPath)) {
                $subFiles = scanDirectoryRecursive($fullPath . '/', $currentDepth + 1);
                $files = array_merge($files, $subFiles);
            } else {
                $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
                if (in_array($extension, ['txt', 'm3u', 'm3u8'])) {
                    $files[] = [
                        'path' => $fullPath,
                        'name' => $item,
                        'filename' => pathinfo($item, PATHINFO_FILENAME),
                        'ext' => $extension,
                        'relative_path' => str_replace(BASE_SCAN_PATH, '', $fullPath)
                    ];
                }
            }
        }
    } catch (Exception $e) {
        return $files;
    }
    
    return $files;
}

function parseTxtFile($filePath) {
    $channels = [];
    $lines = @file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    if (!$lines) return $channels;
    
    $currentGroup = '';
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) continue;
        
        if (strpos($line, '#genre#') !== false) {
            $currentGroup = str_replace('#genre#', '', $line);
            continue;
        }
        
        $parts = explode(',', $line, 2);
        if (count($parts) === 2) {
            $channelName = trim($parts[0]);
            $channelUrl = trim($parts[1]);
            
            if (!empty($channelName) && !empty($channelUrl)) {
                $channels[] = [
                    'name' => $channelName,
                    'url' => $channelUrl,
                    'group' => $currentGroup ?: '未分类',
                    'logo' => '',
                    'type' => 'txt'
                ];
            }
        }
    }
    
    return $channels;
}

function parseM3uFile($filePath) {
    $channels = [];
    $content = @file_get_contents($filePath);
    
    if (!$content) return $channels;
    
    $lines = explode("\n", $content);
    $currentName = '';
    $currentLogo = '';
    $currentGroup = '';
    $currentUrl = '';
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) continue;
        
        if (strpos($line, '#EXTINF:') === 0) {
            $currentName = '';
            $currentLogo = '';
            $currentGroup = '';
            
            preg_match('/tvg-name="([^"]*)"/', $line, $nameMatch);
            preg_match('/tvg-logo="([^"]*)"/', $line, $logoMatch);
            preg_match('/group-title="([^"]*)"/', $line, $groupMatch);
            
            $currentName = $nameMatch[1] ?? '';
            $currentLogo = $logoMatch[1] ?? '';
            $currentGroup = $groupMatch[1] ?? '未分类';
            
            if (empty($currentName)) {
                $parts = explode(',', $line, 2);
                if (count($parts) > 1) {
                    $currentName = trim($parts[1]);
                }
            }
        } elseif (strpos($line, 'http') === 0 || strpos($line, 'rtmp') === 0 || strpos($line, 'rtsp') === 0) {
            $currentUrl = $line;
            
            if (!empty($currentName) && !empty($currentUrl)) {
                $channels[] = [
                    'name' => $currentName,
                    'url' => $currentUrl,
                    'logo' => $currentLogo,
                    'group' => $currentGroup,
                    'type' => 'm3u'
                ];
                
                $currentName = '';
                $currentUrl = '';
            }
        }
    }
    
    return $channels;
}

function getAllFilesWithChannels() {
    static $filesData = null;
    
    if ($filesData === null) {
        $filesData = [];
        
        if (!is_dir(BASE_SCAN_PATH)) {
            return $filesData;
        }
        
        $files = scanDirectoryRecursive(BASE_SCAN_PATH);
        
        foreach ($files as $file) {
            $channels = [];
            
            if ($file['ext'] === 'txt') {
                $channels = parseTxtFile($file['path']);
            } elseif (in_array($file['ext'], ['m3u', 'm3u8'])) {
                $channels = parseM3uFile($file['path']);
            }
            
            if (!empty($channels)) {
                $filesData[] = [
                    'file_info' => $file,
                    'channels' => $channels,
                    'channel_count' => count($channels)
                ];
            }
        }
    }
    
    return $filesData;
}

function getHome() {
    $filesData = getAllFilesWithChannels();
    
    $categoryList = [];
    
    foreach ($filesData as $index => $fileData) {
        $fileInfo = $fileData['file_info'];
        $categoryList[] = [
            'type_id' => 'file_' . $index,
            'type_name' => $fileInfo['filename'] . ' (' . $fileData['channel_count'] . '个频道)',
            'file_name' => $fileInfo['name'],
            'channel_count' => $fileData['channel_count']
        ];
    }
    
    if (empty($categoryList)) {
        $categoryList[] = [
            'type_id' => '1',
            'type_name' => '未找到直播源文件'
        ];
    }
    
    return ['class' => $categoryList];
}

function getCategory($categoryId, $page) {
    if (strpos($categoryId, 'file_') !== 0) {
        return [];
    }
    
    $fileIndex = intval(substr($categoryId, 5));
    $filesData = getAllFilesWithChannels();
    
    if (!isset($filesData[$fileIndex])) {
        return [];
    }
    
    $fileData = $filesData[$fileIndex];
    $fileInfo = $fileData['file_info'];
    $channels = $fileData['channels'];
    
    $playUrls = [];
    foreach ($channels as $channel) {
        $playUrls[] = $channel['name'] . '$' . $channel['url'];
    }
    $playUrlStr = implode('#', $playUrls);
    
    $vodList[] = [
        'vod_id' => 'file_' . $fileIndex,
        'vod_name' => $fileInfo['filename'],
        'vod_pic' => '',
        'vod_remarks' => count($channels) . '个频道',
        'vod_content' => '文件: ' . $fileInfo['name'] . "\n包含 " . count($channels) . " 个频道",
        'vod_play_from' => '直播转点播',
        'vod_play_url' => $playUrlStr
    ];
    
    return [
        'page' => 1,
        'pagecount' => 1,
        'limit' => 1,
        'total' => 1,
        'list' => $vodList,
        'category_name' => $fileInfo['filename']
    ];
}

function search($keyword, $page) {
    if (empty($keyword)) {
        return [];
    }
    
    $filesData = getAllFilesWithChannels();
    $searchResults = [];
    
    foreach ($filesData as $fileIndex => $fileData) {
        $fileInfo = $fileData['file_info'];
        
        if (stripos($fileInfo['filename'], $keyword) !== false) {
            $channels = $fileData['channels'];
            $playUrls = [];
            
            foreach ($channels as $channel) {
                $playUrls[] = $channel['name'] . '$' . $channel['url'];
            }
            $playUrlStr = implode('#', $playUrls);
            
            $searchResults[] = [
                'vod_id' => 'file_' . $fileIndex,
                'vod_name' => $fileInfo['filename'],
                'vod_pic' => '',
                'vod_remarks' => count($channels) . '个频道',
                'vod_content' => '文件: ' . $fileInfo['name'],
                'vod_play_from' => '频道列表',
                'vod_play_url' => $playUrlStr
            ];
        }
        
        foreach ($fileData['channels'] as $channelIndex => $channel) {
            if (stripos($channel['name'], $keyword) !== false) {
                $searchResults[] = [
                    'vod_id' => 'channel_' . $fileIndex . '_' . $channelIndex,
                    'vod_name' => $channel['name'],
                    'vod_pic' => $channel['logo'],
                    'vod_remarks' => $fileInfo['filename'] . ' · ' . $channel['group'],
                    'vod_content' => '来源文件: ' . $fileInfo['name'],
                    'vod_play_from' => '直播',
                    'vod_play_url' => $channel['name'] . '$' . $channel['url']
                ];
            }
        }
    }
    
    if (empty($searchResults)) {
        return [];
    }
    
    $pageSize = 20;
    $total = count($searchResults);
    $pageCount = ceil($total / $pageSize);
    $currentPage = intval($page);
    
    if ($currentPage < 1) $currentPage = 1;
    if ($currentPage > $pageCount) $currentPage = $pageCount;
    
    $start = ($currentPage - 1) * $pageSize;
    $pagedResults = array_slice($searchResults, $start, $pageSize);
    
    return [
        'page' => $currentPage,
        'pagecount' => $pageCount,
        'limit' => $pageSize,
        'total' => $total,
        'list' => $pagedResults
    ];
}

function getPlay($flag, $id) {
    $playId = urldecode($id);
    
    return [
        'parse' => 0,
        'playUrl' => '',
        'url' => $playId,
        'header' => ['User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'],
        'type' => 'hls'
    ];
}

function getDetail($videoId) {
    $idArray = explode(',', $videoId);
    $result = [];
    
    foreach ($idArray as $id) {
        if (strpos($id, 'file_') === 0) {
            $fileIndex = intval(substr($id, 5));
            $filesData = getAllFilesWithChannels();
            
            if (isset($filesData[$fileIndex])) {
                $fileData = $filesData[$fileIndex];
                $fileInfo = $fileData['file_info'];
                $channels = $fileData['channels'];
                
                $playUrls = [];
                foreach ($channels as $channel) {
                    $playUrls[] = $channel['name'] . '$' . $channel['url'];
                }
                $playUrlStr = implode('#', $playUrls);
                
                $result[] = [
                    'vod_id' => 'file_' . $fileIndex,
                    'vod_name' => $fileInfo['filename'],
                    'vod_pic' => '',
                    'vod_remarks' => count($channels) . '个频道',
                    'vod_content' => '文件: ' . $fileInfo['name'] . "\n包含 " . count($channels) . " 个频道",
                    'vod_play_from' => '直播转点播',
                    'vod_play_url' => $playUrlStr
                ];
            }
        } elseif (strpos($id, 'channel_') === 0) {
            $parts = explode('_', $id);
            if (count($parts) >= 3) {
                $fileIndex = intval($parts[1]);
                $channelIndex = intval($parts[2]);
                
                $filesData = getAllFilesWithChannels();
                
                if (isset($filesData[$fileIndex]) && isset($filesData[$fileIndex]['channels'][$channelIndex])) {
                    $fileData = $filesData[$fileIndex];
                    $fileInfo = $fileData['file_info'];
                    $channel = $fileData['channels'][$channelIndex];
                    
                    $result[] = [
                        'vod_id' => 'channel_' . $fileIndex . '_' . $channelIndex,
                        'vod_name' => $channel['name'],
                        'vod_pic' => $channel['logo'],
                        'vod_remarks' => $fileInfo['filename'],
                        'vod_content' => '分组: ' . $channel['group'] . "\n来源文件: " . $fileInfo['name'],
                        'vod_play_from' => '直播',
                        'vod_play_url' => $channel['name'] . '$' . $channel['url']
                    ];
                }
            }
        }
    }
    
    return ['list' => $result];
}
?>