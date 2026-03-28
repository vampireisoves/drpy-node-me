<?php
require_once __DIR__ . '/lib/spider.php';

class Spider extends BaseSpider {
    private $db;
    private $dbPath;

    public function getName() {
        return "74P福利(本地库)";
    }

    public function init($extend = "") {
        // 数据库文件位于当前目录 (与本文件同名，后缀为 .db)
        $dbName = str_replace('.php', '.db', basename(__FILE__));
        $this->dbPath = __DIR__ . '/' . $dbName;
        
        // 尝试查找对应的数据库文件 (如果当前文件名不匹配，尝试查找原版爬虫名对应的db)
        if (!file_exists($this->dbPath)) {
            $originName = '74P福利图 ᵈᶻ[画].db';
            if (file_exists(__DIR__ . '/' . $originName)) {
                $this->dbPath = __DIR__ . '/' . $originName;
            }
        }

        try {
            $this->db = new SQLite3($this->dbPath);
            $this->db->busyTimeout(5000);
        } catch (Exception $e) {
            // 数据库连接失败，可能是文件不存在
        }
    }

    public function isVideoFormat($url) {
        return false;
    }

    public function manualVideoCheck() {
        return false;
    }

    public function homeContent($filter) {
        if (!$this->db) return ['class' => []];

        $classes = [];
        $res = $this->db->query("SELECT tid, name FROM categories");
        while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
            $classes[] = [
                "type_id" => $row['tid'],
                "type_name" => $row['name']
            ];
        }
        return ['class' => $classes, 'filters' => []];
    }

    public function homeVideoContent() {
        return ['list' => []];
    }

    public function categoryContent($tid, $pg = 1, $filter = [], $extend = []) {
        if (!$this->db) return ['list' => [], 'page' => $pg, 'pagecount' => 0, 'limit' => 20, 'total' => 0];

        $limit = 20;
        $offset = ($pg - 1) * $limit;

        // 获取总数
        $countStmt = $this->db->prepare("SELECT COUNT(*) as total FROM vods WHERE type_id = :tid");
        $countStmt->bindValue(':tid', $tid, SQLITE3_TEXT);
        $countRes = $countStmt->execute();
        $total = 0;
        if ($row = $countRes->fetchArray(SQLITE3_ASSOC)) {
            $total = $row['total'];
        }

        $stmt = $this->db->prepare("SELECT * FROM vods WHERE type_id = :tid ORDER BY crawled_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':tid', $tid, SQLITE3_TEXT);
        $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);
        $stmt->bindValue(':offset', $offset, SQLITE3_INTEGER);
        
        $res = $stmt->execute();
        $vlist = [];
        while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
            $vlist[] = [
                'vod_id' => $row['vod_id'],
                'vod_name' => $row['vod_name'],
                'vod_pic' => $row['vod_pic'],
                'vod_remarks' => $row['vod_remarks'],
                'style' => ["type" => "rect", "ratio" => 1.33]
            ];
        }

        $pageCount = ceil($total / $limit);
        
        return ['list' => $vlist, 'page' => $pg, 'pagecount' => $pageCount, 'limit' => $limit, 'total' => $total];
    }

    public function detailContent($ids) {
        if (!$this->db) return ['list' => []];
        
        $vod_id = $ids[0];
        
        // 1. 获取视频详情 (关联 categories 获取 type_name)
        $stmt = $this->db->prepare("
            SELECT v.*, c.name as type_name 
            FROM vods v 
            LEFT JOIN categories c ON v.type_id = c.tid 
            WHERE v.vod_id = :vod_id
        ");
        $stmt->bindValue(':vod_id', $vod_id, SQLITE3_TEXT);
        $res = $stmt->execute();
        $vod_row = $res->fetchArray(SQLITE3_ASSOC);
        
        if (!$vod_row) return ['list' => []];

        $vod = [
            'vod_id' => $vod_row['vod_id'],
            'vod_name' => $vod_row['vod_name'],
            'vod_pic' => $vod_row['vod_pic'],
            'type_name' => $vod_row['type_name'],
            'vod_content' => $vod_row['vod_content'],
            'vod_play_from' => '',
            'vod_play_url' => ''
        ];
        $vod_pk = $vod_row['id'];

        // 2. 获取剧集列表 (关联 play_sources 获取 play_from)
        $stmt_ep = $this->db->prepare("
            SELECT e.*, s.name as play_from 
            FROM episodes e 
            LEFT JOIN play_sources s ON e.sid = s.id 
            WHERE e.vod_pk = :vod_pk
        ");
        $stmt_ep->bindValue(':vod_pk', $vod_pk, SQLITE3_INTEGER);
        $res_ep = $stmt_ep->execute();
        
        $episodes_map = []; // play_from => [ "name$url" ]

        while ($row = $res_ep->fetchArray(SQLITE3_ASSOC)) {
            $play_from = $row['play_from'];
            $name = $row['name'];
            // 优先使用已解析的 URL，如果没有则使用原始 URL
            $url = !empty($row['resolved_url']) ? $row['resolved_url'] : $row['raw_url'];
            
            if (!isset($episodes_map[$play_from])) {
                $episodes_map[$play_from] = [];
            }
            $episodes_map[$play_from][] = "{$name}\${$url}";
        }
        
        $play_from_list = [];
        $play_url_list = [];
        
        foreach ($episodes_map as $from => $eps) {
            $play_from_list[] = $from;
            $play_url_list[] = implode("#", $eps);
        }
        
        $vod['vod_play_from'] = implode("$$$", $play_from_list);
        $vod['vod_play_url'] = implode("$$$", $play_url_list);
        
        return ['list' => [$vod]];
    }

    public function searchContent($key, $quick = false, $pg = 1) {
        if (!$this->db) return ['list' => [], 'page' => $pg];

        $limit = 20;
        $offset = ($pg - 1) * $limit;
        
        // 获取总数
        $countStmt = $this->db->prepare("SELECT COUNT(*) as total FROM vods WHERE vod_name LIKE :key");
        $countStmt->bindValue(':key', "%$key%", SQLITE3_TEXT);
        $countRes = $countStmt->execute();
        $total = 0;
        if ($row = $countRes->fetchArray(SQLITE3_ASSOC)) {
            $total = $row['total'];
        }

        $stmt = $this->db->prepare("SELECT * FROM vods WHERE vod_name LIKE :key ORDER BY crawled_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':key', "%$key%", SQLITE3_TEXT);
        $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);
        $stmt->bindValue(':offset', $offset, SQLITE3_INTEGER);
        
        $res = $stmt->execute();
        $vlist = [];
        while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
            $vlist[] = [
                'vod_id' => $row['vod_id'],
                'vod_name' => $row['vod_name'],
                'vod_pic' => $row['vod_pic'],
                'vod_remarks' => $row['vod_remarks'],
                'style' => ["type" => "rect", "ratio" => 1.33]
            ];
        }
        
        $pageCount = ceil($total / $limit);
        return ['list' => $vlist, 'page' => $pg, 'pagecount' => $pageCount, 'limit' => $limit, 'total' => $total];
    }

    public function playerContent($flag, $id, $vipFlags = []) {
        // id 已经是 detailContent 中返回的 url
        // 如果是已解析的 pics:// 链接，直接返回
        // 如果是原始链接，说明爬取时未解析成功，这里直接返回原始链接让客户端尝试处理（虽然本地模式下通常无法处理网络请求，但保持一致性）
        return [
            "parse" => 0,
            "playUrl" => "",
            "url" => $id,
            "header" => ""
        ];
    }
}
