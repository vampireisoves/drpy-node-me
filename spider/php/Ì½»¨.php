<?php
// 设置Content-Type为application/json
header('Content-Type: application/json');

// 设置数据库文件路径
$dbFilePath = '/storage/emulated/0/VodPlus/lz/db/ys.db';

function connectDatabase($dbFilePath) {
    try {
        // 连接SQLite数据库
        $db = new PDO("sqlite:$dbFilePath");
        // 设置错误模式
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $db;
    } catch (PDOException $e) {
        // 捕获异常并输出错误信息
        echo json_encode(array("error" => "Database error: " . $e->getMessage()), JSON_UNESCAPED_UNICODE);
        exit();
    }
}

function fetchCategories() {
    // 直接定义类别
    $result = [
        ["type_id" => "传媒", "type_name" => "传媒"],
        ["type_id" => "FC2", "type_name" => "FC2"],
        ["type_id" => "PPV", "type_name" => "PPV"],
        ["type_id" => "巨乳", "type_name" => "巨乳"],
        ["type_id" => "人妻", "type_name" => "人妻"],
        ["type_id" => "美女", "type_name" => "美女"],
        ["type_id" => "性爱", "type_name" => "性爱"],
        ["type_id" => "妻子", "type_name" => "妻子"],
        ["type_id" => "性感", "type_name" => "性感"],
        ["type_id" => "姐姐", "type_name" => "姐姐"],
        ["type_id" => "极品", "type_name" => "极品"],
        ["type_id" => "探花", "type_name" => "探花"],
        ["type_id" => "女孩", "type_name" => "女孩"],
        ["type_id" => "女友", "type_name" => "女友"],
        ["type_id" => "高潮", "type_name" => "高潮"],
        ["type_id" => "少妇", "type_name" => "少妇"],
        ["type_id" => "做爱", "type_name" => "做爱"],
        ["type_id" => "中出", "type_name" => "中出"],
        ["type_id" => "妹妹", "type_name" => "妹妹"],
        ["type_id" => "蜜桃", "type_name" => "蜜桃"],
        ["type_id" => "可爱", "type_name" => "可爱"],
        ["type_id" => "91", "type_name" => "91"],
        ["type_id" => "射精", "type_name" => "射精"],
        ["type_id" => "淫荡", "type_name" => "淫荡"],
        ["type_id" => "内射", "type_name" => "内射"],
        ["type_id" => "诱惑", "type_name" => "诱惑"],
        ["type_id" => "拍摄", "type_name" => "拍摄"],
        ["type_id" => "少女", "type_name" => "少女"],
        ["type_id" => "星空", "type_name" => "星空"],
        ["type_id" => "美少女", "type_name" => "美少女"],
        ["type_id" => "黑丝", "type_name" => "黑丝"],
        ["type_id" => "老公", "type_name" => "老公"],
        ["type_id" => "罩杯", "type_name" => "罩杯"],
        ["type_id" => "大学生", "type_name" => "大学生"],
        ["type_id" => "男人", "type_name" => "男人"],
        ["type_id" => "调教", "type_name" => "调教"],
        ["type_id" => "一个", "type_name" => "一个"],
        ["type_id" => "勾引", "type_name" => "勾引"],
        ["type_id" => "酒店", "type_name" => "酒店"],
        ["type_id" => "男友", "type_name" => "男友"],
        ["type_id" => "NTR", "type_name" => "NTR"],
        ["type_id" => "身材", "type_name" => "身材"],
        ["type_id" => "爆操", "type_name" => "爆操"],
        ["type_id" => "学生", "type_name" => "学生"],
        ["type_id" => "肉棒", "type_name" => "肉棒"],
        ["type_id" => "无码", "type_name" => "无码"],
        ["type_id" => "精液", "type_name" => "精液"],
        ["type_id" => "口交", "type_name" => "口交"],
        ["type_id" => "女子", "type_name" => "女子"]
    ];

    // 创建JSON结构
    $output = ["class" => $result];

    // 输出JSON
    echo json_encode($output, JSON_UNESCAPED_UNICODE);
}
function fetchContent($db, $typeId, $page) {
    // 默认每页记录数
    $limit = 20;

    try {
        // 查询总记录数 (模糊匹配 vod_name)
        $countQuery = "SELECT COUNT(*) AS total_count FROM cj WHERE vod_name LIKE :typeId";
        $countStmt = $db->prepare($countQuery);
        $countStmt->bindValue(':typeId', '%' . $typeId . '%', PDO::PARAM_STR);
        $countStmt->execute();
        $totalCount = $countStmt->fetchColumn();

        // 计算偏移量
        $offset = ($page - 1) * $limit;

        // 查询数据 (模糊匹配 vod_name，没有排序)
        $dataQuery = "
            SELECT vod_id, vod_name, vod_pic, vod_remarks 
            FROM cj 
            WHERE vod_name LIKE :typeId 
            LIMIT :limit OFFSET :offset
        ";
        $stmt = $db->prepare($dataQuery);
        $stmt->bindValue(':typeId', '%' . $typeId . '%', PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 计算总页数
        $pageCount = ceil($totalCount / $limit);

        // 创建JSON结构
        $output = [
            "code" => 1,
            "msg" => "数据列表",
            "page" => $page,
            "pagecount" => $pageCount,
            "limit" => $limit,
            "total" => $totalCount,
            "list" => $result
        ];

        // 输出JSON
        echo json_encode($output, JSON_UNESCAPED_UNICODE);

    } catch (PDOException $e) {
        echo json_encode(["error" => "Database error: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
}
function fetchSingleContent($db, $ids, $includeHme = true) {
    try {
        // 查询单条数据
        $stmt = $db->prepare("SELECT * FROM cj WHERE vod_id = :ids");
        $stmt->bindParam(':ids', $ids, PDO::PARAM_STR);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result) {
            // 创建JSON结构
            $output = array(
                "list" => array($result), // 将结果放入数组中
                "parse" => 0,
                "jx" => 0
            );


            // 输出JSON
            echo json_encode($output, JSON_UNESCAPED_UNICODE);
        } else {
            // 没有找到记录
            echo json_encode(array("error" => "No record found for vod_id: $ids"), JSON_UNESCAPED_UNICODE);
        }

    } catch (PDOException $e) {
        // 捕获异常并输出错误信息
        echo json_encode(array("error" => "Database error: " . $e->getMessage()), JSON_UNESCAPED_UNICODE);
    }
}

function searchByName($db, $wd) {
    try {
        // 构建查询，只按 vod_name 搜索，不排序
        $query = "SELECT * FROM cj WHERE vod_name LIKE :wd";
        $params = [':wd' => "%$wd%"];

        // 执行查询
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 获取记录数
        $totalRecords = count($result);

        // 构建输出 JSON
        $output = array(
            "total" => $totalRecords,
            "limit" => $totalRecords,
            "pagecount" => 1,
            "page" => 1,
            "list" => $result,
            "parse" => 0,
            "jx" => 0
        );

        // 输出 JSON
        echo json_encode($output, JSON_UNESCAPED_UNICODE);

    } catch (PDOException $e) {
        // 捕获异常并输出错误信息
        echo json_encode(array("error" => "Database error: " . $e->getMessage()), JSON_UNESCAPED_UNICODE);
    }
}
// 获取URL参数，设置默认值
$typeId = isset($_GET['t']) ? $_GET['t'] : null;
$page = isset($_GET['pg']) ? intval($_GET['pg']) : 1;
$ids = isset($_GET['ids']) ? $_GET['ids'] : null;
$flag = isset($_GET['flag']) ? $_GET['flag'] : null;
$play = isset($_GET['play']) ? $_GET['play'] : null;
$wd = isset($_GET['wd']) ? $_GET['wd'] : null;
$f = isset($_GET['f']) ? $_GET['f'] : null;
$ext = isset($_GET['ext']) ? $_GET['ext'] : null;

// 替换t参数的值
$replaceMap = array(1 => 6, 2 => 13, 3 => 60, 4 => 38, 27 => 52);
if ($typeId !== null && array_key_exists($typeId, $replaceMap)) {
    $typeId = $replaceMap[$typeId];
}

// 处理f参数（如果有需要的操作）
if ($f !== null) {
    // 这里可以根据需要进行处理，例如解析JSON等操作
    // 示例：解析JSON字符串
    $f_data = json_decode($f, true);
    if ($f_data !== null) {
        // 对$f_data进行进一步操作，例如赋值给$typeId等
        if (isset($f_data['cid'])) {
            $typeId = intval($f_data['cid']);
        }
    }
}

// 连接数据库
$db = connectDatabase($dbFilePath);

// 判断并解密ext参数
if ($ext !== null) {
    $ext = base64_decode($ext);
    $ext = json_decode($ext, true);
    if (isset($ext['cid'])) {
        $typeId = intval($ext['cid']);
    }
}

// 根据参数执行不同的操作
if ($flag !== null && $play !== null) {
    // 如果有flag和play参数，生成指定数组并输出
    $output = array(
        "header" => array("User-Agent" => "okhttp/3.12.0"),
 //       "url" => "https://py.doube.eu.org/del_ads_heimuer?url=" . $play,
        "url" => $play,
        "parse" => 0,
        "jx" => 0
    );
    echo json_encode($output, JSON_UNESCAPED_UNICODE);
} elseif ($ids !== null) {
    fetchSingleContent($db, $ids);
} elseif ($wd !== null && !isset($_GET['pg'])) {
    searchByName($db, $wd);
} elseif ($typeId === null) {
    fetchCategories();
} else {
    fetchContent($db, $typeId, $page);
}
?>
        
        
        
        
        
        
        