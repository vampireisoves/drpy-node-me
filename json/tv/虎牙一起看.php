<?php
// 虎牙直播PHP独立版 - 更新版
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('PRC');

class HuYaLive
{
    private $userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15';
    private $referer = 'https://m.huya.com/';
    
    // 更新后的分类列表（包含所有分类）
    private $classes = [
        ['type_id' => '1', 'type_name' => '英雄联盟'],
        ['type_id' => '9449', 'type_name' => '三角洲行动'],
        ['type_id' => '6101', 'type_name' => '鹅鸭杀'],
        ['type_id' => '862', 'type_name' => 'CS2'],
        ['type_id' => '2336', 'type_name' => '王者荣耀'],
        ['type_id' => '2165', 'type_name' => '户外'],
        ['type_id' => '2356', 'type_name' => '体育'],
        ['type_id' => '2135', 'type_name' => '一起看'],
        ['type_id' => '2793', 'type_name' => '天天吃鸡'],
        ['type_id' => '1663', 'type_name' => '星秀'],
        ['type_id' => '5937', 'type_name' => '无畏契约'],
        ['type_id' => '5485', 'type_name' => 'lol云顶之弈'],
        ['type_id' => '4', 'type_name' => '穿越火线'],
        ['type_id' => '100032', 'type_name' => '主机游戏'],
        ['type_id' => '3203', 'type_name' => '和平精英'],
        ['type_id' => '2633', 'type_name' => '二次元'],
        ['type_id' => '100043', 'type_name' => '暴雪专区'],
        ['type_id' => '4079', 'type_name' => '交友'],
        ['type_id' => '7', 'type_name' => 'DOTA2'],
        ['type_id' => '135', 'type_name' => '逆战'],
        ['type_id' => '7185', 'type_name' => '金铲铲之战'],
        ['type_id' => '100022', 'type_name' => '娱乐'],
        ['type_id' => '100004', 'type_name' => '手游休闲'],
        ['type_id' => '100023', 'type_name' => '网游竞技'],
        ['type_id' => '6613', 'type_name' => '一起玩'],
        ['type_id' => '9283', 'type_name' => '摸了个鱼'],
        ['type_id' => '100044', 'type_name' => '吃喝玩乐'],
        ['type_id' => '100052', 'type_name' => '新游广场'],
        ['type_id' => '5367', 'type_name' => '互动组队'],
        ['type_id' => '100002', 'type_name' => '单机热游'],
        ['type_id' => '6861', 'type_name' => '原创'],
        ['type_id' => '5907', 'type_name' => '互动点播'],
        ['type_id' => '100141', 'type_name' => '射击综合游戏'],
        ['type_id' => '4089', 'type_name' => '虎牙文化'],
        ['type_id' => '1732', 'type_name' => '我的世界'],
        ['type_id' => '100273', 'type_name' => 'MMORPG'],
        ['type_id' => '6111', 'type_name' => '黑神话：悟空'],
        ['type_id' => '100197', 'type_name' => '动作游戏'],
        ['type_id' => '100029', 'type_name' => '综合手游'],
        ['type_id' => '5489', 'type_name' => '原神'],
        ['type_id' => '6203', 'type_name' => '英雄联盟手游'],
        ['type_id' => '100301', 'type_name' => '棋牌休闲'],
        ['type_id' => '7575', 'type_name' => '逆战：未来'],
        ['type_id' => '2', 'type_name' => '地下城与勇士'],
        ['type_id' => '100133', 'type_name' => '军事游戏'],
        ['type_id' => '8363', 'type_name' => '明日方舟：终末地'],
        ['type_id' => '802', 'type_name' => '坦克世界'],
        ['type_id' => '1997', 'type_name' => '方舟'],
        ['type_id' => '100305', 'type_name' => '桌游'],
        ['type_id' => '897', 'type_name' => '剑灵'],
        ['type_id' => '393', 'type_name' => '炉石传说'],
        ['type_id' => '983', 'type_name' => '传奇'],
        ['type_id' => '2243', 'type_name' => '冒险岛'],
        ['type_id' => '6219', 'type_name' => '永劫无间'],
        ['type_id' => '8', 'type_name' => '魔兽世界'],
        ['type_id' => '683', 'type_name' => '彩虹岛Online'],
        ['type_id' => '1669', 'type_name' => '三国杀'],
        ['type_id' => '100091', 'type_name' => '二次元手游'],
        ['type_id' => '9', 'type_name' => 'QQ飞车'],
        ['type_id' => '1646', 'type_name' => '诛仙3'],
        ['type_id' => '8019', 'type_name' => '燕云十六声'],
        ['type_id' => '9455', 'type_name' => '魔兽弧光大作战'],
        ['type_id' => '1830', 'type_name' => '英魂之刃'],
        ['type_id' => '9453', 'type_name' => '恐怖游戏'],
        ['type_id' => '3115', 'type_name' => '第五人格'],
        ['type_id' => '1749', 'type_name' => '欢乐斗地主'],
        ['type_id' => '5751', 'type_name' => '炉石战棋'],
        ['type_id' => '4615', 'type_name' => '魔兽争霸3'],
        ['type_id' => '2413', 'type_name' => 'CF手游'],
        ['type_id' => '6437', 'type_name' => '幻塔'],
        ['type_id' => '3841', 'type_name' => 'JJ斗地主'],
        ['type_id' => '2168', 'type_name' => '颜值'],
        ['type_id' => '6', 'type_name' => 'DOTA1'],
        ['type_id' => '387', 'type_name' => '热血江湖'],
        ['type_id' => '9385', 'type_name' => '荣耀远征'],
        ['type_id' => '2408', 'type_name' => '科技'],
        ['type_id' => '7177', 'type_name' => '英雄联盟电竞经理'],
        ['type_id' => '1751', 'type_name' => '欢乐麻将'],
        ['type_id' => '107', 'type_name' => '问道'],
        ['type_id' => '8127', 'type_name' => '王者万象棋'],
        ['type_id' => '6909', 'type_name' => '蛋仔派对'],
        ['type_id' => '100049', 'type_name' => '狼人杀手游'],
        ['type_id' => '4921', 'type_name' => 'DNF手游'],
        ['type_id' => '2429', 'type_name' => '火影忍者手游'],
        ['type_id' => '100125', 'type_name' => '怀旧游戏'],
        ['type_id' => '3793', 'type_name' => '音乐'],
        ['type_id' => '7209', 'type_name' => '暗区突围'],
        ['type_id' => '1318', 'type_name' => '部落：上升'],
        ['type_id' => '6053', 'type_name' => '失落之魂'],
        ['type_id' => '71827', 'type_name' => '和平精英模拟器'],
        ['type_id' => '7579', 'type_name' => '永劫无间手游'],
        ['type_id' => '7725', 'type_name' => '逆水寒手游'],
        ['type_id' => '2327', 'type_name' => '彩虹六号'],
        ['type_id' => '6791', 'type_name' => '旅游'],
        ['type_id' => '6945', 'type_name' => '新天龙八部手游'],
        ['type_id' => '3493', 'type_name' => '逃离塔科夫'],
        ['type_id' => '1671', 'type_name' => '中国象棋'],
        ['type_id' => '4997', 'type_name' => '天天象棋'],
        ['type_id' => '6055', 'type_name' => '虚拟偶像'],
        ['type_id' => '2774', 'type_name' => '天天狼人'],
        ['type_id' => '65907', 'type_name' => '虎牙全明星'],
        ['type_id' => '1612', 'type_name' => '起凡：群雄逐鹿'],
        ['type_id' => '489', 'type_name' => '梦三国'],
        ['type_id' => '446', 'type_name' => '永恒之塔'],
        ['type_id' => '70953', 'type_name' => '失控进化-RUST'],
        ['type_id' => '1661', 'type_name' => '武林外传一世琴缘'],
        ['type_id' => '10963', 'type_name' => '暗区突围：无限'],
        ['type_id' => '939', 'type_name' => '全球使命'],
        ['type_id' => '5883', 'type_name' => '趣分享'],
        ['type_id' => '779', 'type_name' => '天翼决'],
        ['type_id' => '7449', 'type_name' => '战争冲突'],
        ['type_id' => '62639', 'type_name' => '无畏契约：源能行动'],
        ['type_id' => '6919', 'type_name' => '互动剧游'],
        ['type_id' => '72253', 'type_name' => '全明星觉醒'],
        ['type_id' => '1123', 'type_name' => '暗黑破坏神'],
        ['type_id' => '1947', 'type_name' => '战舰世界'],
        ['type_id' => '485', 'type_name' => '植物大战僵尸'],
        ['type_id' => '2928', 'type_name' => 'QQ飞车手游'],
        ['type_id' => '3719', 'type_name' => 'SKY光遇'],
        ['type_id' => '5495', 'type_name' => '俄罗斯钓鱼4'],
        ['type_id' => '2683', 'type_name' => '迷你世界'],
        ['type_id' => '74', 'type_name' => '饥荒'],
        ['type_id' => '5771', 'type_name' => '罗布乐思'],
        ['type_id' => '4137', 'type_name' => '逃跑吧！少年'],
        ['type_id' => '2688', 'type_name' => '英雄杀'],
        ['type_id' => '6385', 'type_name' => '暗黑破坏神：不朽'],
        ['type_id' => '9521', 'type_name' => '元梦之星'],
        ['type_id' => '4929', 'type_name' => '武侠乂手游'],
        ['type_id' => '7101', 'type_name' => '怪物猎人物语'],
        ['type_id' => '6479', 'type_name' => '怪物猎人：崛起'],
        ['type_id' => '7537', 'type_name' => '决胜巅峰'],
        ['type_id' => '7107', 'type_name' => '雀魂麻将'],
        ['type_id' => '772', 'type_name' => '夺宝传世'],
        ['type_id' => '8005', 'type_name' => '冒险岛：枫之传说'],
        ['type_id' => '7601', 'type_name' => 'Dread Hunger'],
        ['type_id' => '2765', 'type_name' => '铁甲雄兵'],
        ['type_id' => '2174', 'type_name' => '守望先锋'],
        ['type_id' => '8037', 'type_name' => '鸣潮'],
        ['type_id' => '2785', 'type_name' => '狼人杀'],
        ['type_id' => '7759', 'type_name' => '一起买'],
        ['type_id' => '2568', 'type_name' => '御龙在天手游'],
        ['type_id' => '7859', 'type_name' => '卧龙：苍天陨落'],
        ['type_id' => '6163', 'type_name' => 'Among Us'],
        ['type_id' => '7529', 'type_name' => '虎牙领主争霸'],
        ['type_id' => '6571', 'type_name' => '鬼谷八荒'],
        ['type_id' => '6079', 'type_name' => 'CFHD'],
        ['type_id' => '4783', 'type_name' => '骑马与砍杀系列'],
        ['type_id' => '7349', 'type_name' => '崩坏：星穹铁道'],
        ['type_id' => '100139', 'type_name' => '育碧游戏'],
        ['type_id' => '100299', 'type_name' => '格斗游戏'],
        ['type_id' => '5', 'type_name' => '星际争霸'],
        ['type_id' => '734', 'type_name' => '寻仙'],
        ['type_id' => '5901', 'type_name' => '全面战争：竞技场'],
        ['type_id' => '7857', 'type_name' => '星空'],
        ['type_id' => '2598', 'type_name' => '阴阳师'],
        ['type_id' => '5801', 'type_name' => '艾尔登法环'],
        ['type_id' => '73759', 'type_name' => '流放之路：降临'],
        ['type_id' => '1877', 'type_name' => '黑色沙漠'],
        ['type_id' => '10199', 'type_name' => '完蛋！我被美女包围了！'],
        ['type_id' => '2566', 'type_name' => '无人深空'],
        ['type_id' => '624', 'type_name' => '战争雷霆'],
        ['type_id' => '5097', 'type_name' => '海贼王 寻秘世界'],
        ['type_id' => '900', 'type_name' => '剑网3'],
        ['type_id' => '2477', 'type_name' => '问道手游'],
        ['type_id' => '554', 'type_name' => '星球大战系列'],
        ['type_id' => '2953', 'type_name' => '全球使命3'],
        ['type_id' => '3069', 'type_name' => '其他单机'],
        ['type_id' => '69017', 'type_name' => '怪物猎人：荒野'],
        ['type_id' => '2760', 'type_name' => '英魂之刃口袋版'],
        ['type_id' => '6225', 'type_name' => '掼蛋'],
        ['type_id' => '1962', 'type_name' => '刺客信条'],
        ['type_id' => '5795', 'type_name' => '仁王2'],
        ['type_id' => '162', 'type_name' => '跑跑卡丁车'],
        ['type_id' => '4249', 'type_name' => '漫威蜘蛛侠'],
        ['type_id' => '3483', 'type_name' => '明日之后'],
        ['type_id' => '7943', 'type_name' => '森林之子'],
        ['type_id' => '4041', 'type_name' => '忍者必须死3'],
        ['type_id' => '3116', 'type_name' => '奇迹MU：觉醒'],
        ['type_id' => '9543', 'type_name' => '拉轰西游'],
        ['type_id' => '2715', 'type_name' => '征途'],
        ['type_id' => '627', 'type_name' => '星际战甲'],
        ['type_id' => '6745', 'type_name' => '斗罗大陆：魂师对决'],
        ['type_id' => '7881', 'type_name' => '霍格沃茨之遗'],
        ['type_id' => '475', 'type_name' => '欧洲卡车模拟'],
        ['type_id' => '69105', 'type_name' => '天国：拯救2'],
        ['type_id' => '6737', 'type_name' => '双人成行'],
        ['type_id' => '4505', 'type_name' => '只狼：影逝二度'],
        ['type_id' => '7363', 'type_name' => '明末：渊虚之羽'],
        ['type_id' => '2634', 'type_name' => '极限竞速：地平线'],
        ['type_id' => '1111', 'type_name' => 'FF14'],
        ['type_id' => '3521', 'type_name' => '全面战争'],
        ['type_id' => '6047', 'type_name' => '三国战纪'],
        ['type_id' => '2891', 'type_name' => '魔力宝贝'],
        ['type_id' => '1918', 'type_name' => '反恐精英Online'],
        ['type_id' => '1125', 'type_name' => 'DayZ独立版'],
        ['type_id' => '100135', 'type_name' => '体育游戏'],
        ['type_id' => '3185', 'type_name' => '荒野行动PC版'],
        ['type_id' => '6679', 'type_name' => '恐惧之间'],
        ['type_id' => '5619', 'type_name' => '三国志战略版'],
        ['type_id' => '3061', 'type_name' => '风云'],
        ['type_id' => '4769', 'type_name' => 'COD手游'],
        ['type_id' => '432', 'type_name' => '洛奇英雄传'],
        ['type_id' => '5671', 'type_name' => '新天龙八部'],
        ['type_id' => '3227', 'type_name' => '神武4电脑版'],
        ['type_id' => '8239', 'type_name' => '大话西游：归来'],
        ['type_id' => '73363', 'type_name' => '橙光阅读器'],
        ['type_id' => '3943', 'type_name' => '航海王：燃烧意志'],
        ['type_id' => '3101', 'type_name' => '海底大作战'],
        ['type_id' => '2817', 'type_name' => '热血江湖手游'],
        ['type_id' => '62603', 'type_name' => '冰汽时代2'],
        ['type_id' => '70355', 'type_name' => '双影奇境'],
        ['type_id' => '7883', 'type_name' => '塞尔达传说：王国之泪'],
        ['type_id' => '3641', 'type_name' => '盗贼之海'],
        ['type_id' => '7915', 'type_name' => '塔瑞斯·世界'],
        ['type_id' => '6399', 'type_name' => '火炬之光：无限'],
        ['type_id' => '10943', 'type_name' => '神域纪元'],
        ['type_id' => '6007', 'type_name' => '妄想山海'],
        ['type_id' => '10013', 'type_name' => '反转21克'],
        ['type_id' => '2471', 'type_name' => '生死狙击'],
        ['type_id' => '7771', 'type_name' => '战神：诸神黄昏'],
        ['type_id' => '2777', 'type_name' => '单机手游'],
        ['type_id' => '9421', 'type_name' => '极品飞车：集结'],
        ['type_id' => '10567', 'type_name' => '剑星'],
        ['type_id' => '6739', 'type_name' => '甜蜜之家'],
        ['type_id' => '2761', 'type_name' => '音乐游戏'],
        ['type_id' => '2853', 'type_name' => '过山车之星'],
        ['type_id' => '6149', 'type_name' => '刺客信条：英灵殿'],
        ['type_id' => '3058', 'type_name' => '命运方舟'],
        ['type_id' => '3679', 'type_name' => '狼人杀官方'],
        ['type_id' => '3741', 'type_name' => '实况足球'],
        ['type_id' => '2680', 'type_name' => '蛇蛇争霸'],
        ['type_id' => '1599', 'type_name' => '真三国无双'],
        ['type_id' => '5011', 'type_name' => 'Apex英雄'],
        ['type_id' => '6129', 'type_name' => '死亡之夜'],
        ['type_id' => '66203', 'type_name' => '群星纪元'],
        ['type_id' => '10821', 'type_name' => '不祥之夜：回魂'],
        ['type_id' => '4629', 'type_name' => '一拳超人：最强之男'],
        ['type_id' => '4245', 'type_name' => 'SCUM'],
        ['type_id' => '4451', 'type_name' => '游戏王：决斗链接'],
        ['type_id' => '2270', 'type_name' => '三国志'],
        ['type_id' => '3331', 'type_name' => '武林外传手游'],
        ['type_id' => '7609', 'type_name' => '拳皇15'],
        ['type_id' => '1878', 'type_name' => 'QQ华夏'],
        ['type_id' => '1966', 'type_name' => '天堂'],
        ['type_id' => '6091', 'type_name' => '生死狙击2'],
        ['type_id' => '1797', 'type_name' => '部落冲突'],
        ['type_id' => '5809', 'type_name' => '最终幻想7：重制版'],
        ['type_id' => '10919', 'type_name' => '中国式网游'],
        ['type_id' => '2502', 'type_name' => '巅峰战舰'],
        ['type_id' => '1009', 'type_name' => '九阴真经'],
        ['type_id' => '1090', 'type_name' => 'QQ三国'],
        ['type_id' => '68167', 'type_name' => '界外狂潮'],
        ['type_id' => '4359', 'type_name' => '坦克大战'],
        ['type_id' => '3677', 'type_name' => '猎杀：对决'],
        ['type_id' => '7925', 'type_name' => '原子之心'],
        ['type_id' => '5947', 'type_name' => '马里奥赛车8'],
        ['type_id' => '3016', 'type_name' => '战锤40K：暗潮'],
        ['type_id' => '5981', 'type_name' => '摩尔庄园'],
        ['type_id' => '7581', 'type_name' => '消逝的光芒2'],
        ['type_id' => '878', 'type_name' => '千年3'],
        ['type_id' => '7749', 'type_name' => '诛仙世界'],
        ['type_id' => '8301', 'type_name' => '逃生：试炼'],
        ['type_id' => '6147', 'type_name' => '博德之门3'],
        ['type_id' => '6231', 'type_name' => '渡神记'],
        ['type_id' => '7215', 'type_name' => '指尖四川麻将'],
        ['type_id' => '861', 'type_name' => '反恐行动online'],
        ['type_id' => '9961', 'type_name' => '幻兽帕鲁'],
        ['type_id' => '2444', 'type_name' => '腾讯桌球'],
        ['type_id' => '7905', 'type_name' => 'Dark and Darker'],
        ['type_id' => '2303', 'type_name' => '漫漫长夜'],
        ['type_id' => '3901', 'type_name' => '火影忍者OL'],
        ['type_id' => '2952', 'type_name' => '逆水寒'],
        ['type_id' => '708', 'type_name' => '帝国时代系列'],
        ['type_id' => '4835', 'type_name' => '帝国时代4'],
        ['type_id' => '4337', 'type_name' => '斗破苍穹手游'],
        ['type_id' => '7505', 'type_name' => '白荆回廊'],
        ['type_id' => '7745', 'type_name' => 'Stray'],
        ['type_id' => '675', 'type_name' => '御龙在天'],
        ['type_id' => '5953', 'type_name' => '口袋觉醒'],
        ['type_id' => '74169', 'type_name' => '雾影猎人'],
        ['type_id' => '6307', 'type_name' => '火影忍者：忍者新世代'],
        ['type_id' => '1888', 'type_name' => 'FIFA足球'],
        ['type_id' => '1046', 'type_name' => '上古世纪'],
        ['type_id' => '2639', 'type_name' => '崩坏3'],
        ['type_id' => '4017', 'type_name' => '无畏'],
        ['type_id' => '3959', 'type_name' => 'NBA2KOL系列'],
        ['type_id' => '1026', 'type_name' => '丝路传说2'],
        ['type_id' => '1597', 'type_name' => '天下'],
        ['type_id' => '677', 'type_name' => '征途2'],
        ['type_id' => '2794', 'type_name' => '幽灵行动：荒野'],
        ['type_id' => '4413', 'type_name' => '红警OL'],
        ['type_id' => '2621', 'type_name' => '剑侠情缘手游'],
        ['type_id' => '5977', 'type_name' => '云上城之歌'],
        ['type_id' => '514', 'type_name' => '极光世界 弑神传'],
        ['type_id' => '15', 'type_name' => '龙之谷'],
        ['type_id' => '1112', 'type_name' => 'F1赛车明星'],
        ['type_id' => '74059', 'type_name' => '无主之地4'],
        ['type_id' => '6979', 'type_name' => '巅峰极速'],
        ['type_id' => '2691', 'type_name' => '率土之滨'],
        ['type_id' => '496', 'type_name' => '枪神纪'],
        ['type_id' => '401', 'type_name' => '火炬之光2'],
        ['type_id' => '2282', 'type_name' => '领地人生'],
        ['type_id' => '6131', 'type_name' => '黎明觉醒：生机'],
        ['type_id' => '6831', 'type_name' => '未来之役'],
        ['type_id' => '2369', 'type_name' => '忍者村大战2'],
        ['type_id' => '10889', 'type_name' => '火柴人联盟3'],
        ['type_id' => '2585', 'type_name' => '石油骚动'],
        ['type_id' => '89', 'type_name' => '霹雳墨香'],
        ['type_id' => '3189', 'type_name' => '无限法则'],
        ['type_id' => '5669', 'type_name' => '新笑傲江湖'],
        ['type_id' => '71459', 'type_name' => '好游鉴赏'],
        ['type_id' => '6509', 'type_name' => '仙剑奇侠传七'],
        ['type_id' => '591', 'type_name' => '斗战神'],
        ['type_id' => '46', 'type_name' => '鹰击长空'],
        ['type_id' => '3215', 'type_name' => '奇迹：最强者'],
        ['type_id' => '68657', 'type_name' => '遮天世界'],
        ['type_id' => '6259', 'type_name' => '新剑侠情缘手游'],
        ['type_id' => '6169', 'type_name' => '曙光英雄'],
        ['type_id' => '560', 'type_name' => '无限试驾：法拉利竞速传奇'],
        ['type_id' => '69373', 'type_name' => '诸神竞技场'],
        ['type_id' => '6815', 'type_name' => '造梦西游OL'],
        ['type_id' => '6609', 'type_name' => '英灵神殿'],
        ['type_id' => '6491', 'type_name' => '饥困荒野'],
        ['type_id' => '2843', 'type_name' => '卧虎藏龙2'],
        ['type_id' => '4867', 'type_name' => '了不起的修仙模拟器'],
        ['type_id' => '6065', 'type_name' => '禁闭求生'],
        ['type_id' => '6621', 'type_name' => '神将三国'],
        ['type_id' => '2979', 'type_name' => '寻仙手游'],
        ['type_id' => '8261', 'type_name' => 'KARDS'],
        ['type_id' => '5257', 'type_name' => '纸人'],
        ['type_id' => '1804', 'type_name' => 'PPSSPP模拟器'],
        ['type_id' => '2531', 'type_name' => '神泣'],
        ['type_id' => '1085', 'type_name' => 'QQ音速'],
        ['type_id' => '3671', 'type_name' => '孤岛惊魂'],
        ['type_id' => '5995', 'type_name' => '四海兄弟'],
        ['type_id' => '5853', 'type_name' => '港诡实录'],
        ['type_id' => '10619', 'type_name' => '航海王壮志雄心'],
        ['type_id' => '75359', 'type_name' => 'PUBG：黑域撤离'],
        ['type_id' => '70261', 'type_name' => '矩阵：零日危机'],
        ['type_id' => '5869', 'type_name' => '碧蓝幻想：Versus'],
        ['type_id' => '2650', 'type_name' => '文明6'],
        ['type_id' => '7133', 'type_name' => '斗斗堂'],
        ['type_id' => '6155', 'type_name' => '看门狗：军团'],
        ['type_id' => '4759', 'type_name' => '风暴魔域'],
        ['type_id' => '2443', 'type_name' => '星露谷物语'],
        ['type_id' => '6103', 'type_name' => '足球小将'],
        ['type_id' => '2646', 'type_name' => '永恒纪元：戒'],
        ['type_id' => '6049', 'type_name' => '三国战纪2'],
        ['type_id' => '8013', 'type_name' => '生化危机4重制版'],
        ['type_id' => '7217', 'type_name' => '完美世界：诸神之战'],
        ['type_id' => '6845', 'type_name' => '沉浮'],
        ['type_id' => '2694', 'type_name' => '围棋'],
        ['type_id' => '5023', 'type_name' => '全境封锁2'],
        ['type_id' => '4035', 'type_name' => '方舟手游'],
        ['type_id' => '6083', 'type_name' => '糖豆人：终极淘汰赛'],
        ['type_id' => '436', 'type_name' => '泰坦之旅系列'],
        ['type_id' => '10961', 'type_name' => '解限机'],
        ['type_id' => '915', 'type_name' => '刀剑英雄'],
        ['type_id' => '74371', 'type_name' => '名将杀'],
        ['type_id' => '6463', 'type_name' => '王牌竞速'],
        ['type_id' => '6821', 'type_name' => '帝国神话'],
        ['type_id' => '7869', 'type_name' => '最终幻想16'],
        ['type_id' => '4237', 'type_name' => '完美世界手游'],
        ['type_id' => '6153', 'type_name' => '哈迪斯'],
        ['type_id' => '6039', 'type_name' => '对马岛之魂'],
        ['type_id' => '73095', 'type_name' => '命运扳机'],
        ['type_id' => '5743', 'type_name' => '霓虹深渊'],
        ['type_id' => '6165', 'type_name' => '猛兽派对'],
        ['type_id' => '4865', 'type_name' => '环世界'],
        ['type_id' => '7711', 'type_name' => '绝区零'],
        ['type_id' => '3160', 'type_name' => '新游推荐'],
        ['type_id' => '2748', 'type_name' => '幻想全明星'],
        ['type_id' => '5835', 'type_name' => '哈利波特：魔法觉醒'],
        ['type_id' => '11043', 'type_name' => '洛克王国：世界'],
        ['type_id' => '7669', 'type_name' => '幽灵线：东京'],
        ['type_id' => '5699', 'type_name' => '王者模拟战'],
        ['type_id' => '4779', 'type_name' => '边境'],
        ['type_id' => '6151', 'type_name' => '恶魔之魂'],
        ['type_id' => '2455', 'type_name' => '瑞奇与叮当'],
        ['type_id' => '7269', 'type_name' => '米加小镇'],
        ['type_id' => '7653', 'type_name' => '最终幻想：起源'],
        ['type_id' => '6205', 'type_name' => '恐鬼症'],
        ['type_id' => '583', 'type_name' => '新挑战'],
        ['type_id' => '2096', 'type_name' => '魔法门之英雄无敌系列'],
        ['type_id' => '618', 'type_name' => '战地之王'],
        ['type_id' => '593', 'type_name' => '文明5'],
        ['type_id' => '4319', 'type_name' => '荒野大镖客2'],
        ['type_id' => '4613', 'type_name' => '荒野乱斗'],
        ['type_id' => '2868', 'type_name' => '决斗之城'],
        ['type_id' => '5133', 'type_name' => '多多自走棋'],
        ['type_id' => '1715', 'type_name' => '天天酷跑']
    ];
    
    /**
     * 发起HTTP请求
     */
    private function httpRequest($url, $timeout = 10)
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_USERAGENT, $this->userAgent);
        curl_setopt($ch, CURLOPT_REFERER, $this->referer);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json, text/plain, */*',
            'Accept-Language: zh-CN,zh;q=0.9',
            'Cache-Control: no-cache',
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            curl_close($ch);
            return ['error' => curl_error($ch)];
        }
        
        curl_close($ch);
        
        if ($httpCode == 200) {
            return json_decode($response, true);
        }
        
        return ['error' => 'HTTP错误: ' . $httpCode];
    }
    
    /**
     * 首页数据
     */
    public function home()
    {
        return [
            'class' => $this->classes,
            'filters' => new stdClass()
        ];
    }
    
    /**
     * 分类数据
     */
    public function category($id, $page = 1)
    {
        $url = "https://www.huya.com/cache.php?m=LiveList&do=getLiveListByPage&gameId={$id}&tagAll=0&page={$page}";
        $result = $this->httpRequest($url);
        
        if (isset($result['error'])) {
            return [
                'page' => $page,
                'pagecount' => 0,
                'limit' => 0,
                'total' => 0,
                'list' => []
            ];
        }
        
        $data = $result['data'] ?? [];
        $rooms = $data['datas'] ?? [];
        
        // 如果没有数据，尝试使用tagAll=1
        if (empty($rooms) && $page == 1) {
            $url2 = "https://www.huya.com/cache.php?m=LiveList&do=getLiveListByPage&gameId={$id}&tagAll=1&page={$page}";
            $result2 = $this->httpRequest($url2);
            
            if (!isset($result2['error'])) {
                $data = $result2['data'] ?? [];
                $rooms = $data['datas'] ?? [];
            }
        }
        
        $list = [];
        foreach ($rooms as $room) {
            $list[] = [
                'vod_id' => $room['profileRoom'] ?? '',
                'vod_name' => $room['roomName'] ?? ($room['nick'] ?? '虎牙直播'),
                'vod_pic' => $room['screenshot'] ?? '',
                'vod_remarks' => ($room['totalCount'] ?? 0) . '人在线'
            ];
        }
        
        return [
            'page' => $data['page'] ?? $page,
            'pagecount' => $data['totalPage'] ?? 999,
            'limit' => count($list),
            'total' => count($list) > 0 ? 9999 : 0,
            'list' => $list
        ];
    }
    
    /**
     * 详情数据
     */
    public function detail($id)
    {
        $roomId = is_array($id) ? $id[0] : $id;
        
        return [
            'list' => [
                [
                    'vod_id' => $roomId,
                    'vod_name' => '虎牙直播',
                    'vod_pic' => '',
                    'vod_play_from' => '虎牙直播',
                    'vod_play_url' => '直播$' . $roomId
                ]
            ]
        ];
    }
    
    /**
     * 播放地址解析
     */
    public function play($id)
    {
        try {
            // 获取房间信息
            $api = "https://mp.huya.com/cache.php?m=Live&do=profileRoom&roomid={$id}";
            $result = $this->httpRequest($api);
            
            if (isset($result['error']) || !isset($result['data']) || !isset($result['data']['stream'])) {
                // 尝试使用备用接口
                $api2 = "https://m.huya.com/{$id}";
                $result2 = $this->httpRequest($api2);
                
                if (isset($result2['error'])) {
                    return [
                        'parse' => 0,
                        'url' => '',
                        'header' => [
                            'User-Agent' => 'Mozilla/5.0',
                            'Referer' => 'https://www.huya.com/'
                        ]
                    ];
                }
                
                // 从HTML页面中提取流信息
                $html = is_string($result2) ? $result2 : json_encode($result2);
                
                // 尝试提取直播流信息
                preg_match('/stream: ({.*?}),/', $html, $matches);
                if (empty($matches)) {
                    return [
                        'parse' => 0,
                        'url' => '',
                        'header' => [
                            'User-Agent' => 'Mozilla/5.0',
                            'Referer' => 'https://www.huya.com/'
                        ]
                    ];
                }
                
                $streamData = json_decode($matches[1], true);
                if (!$streamData || !isset($streamData['data'][0]['gameLiveInfo']['profileRoom'])) {
                    return [
                        'parse' => 0,
                        'url' => '',
                        'header' => [
                            'User-Agent' => 'Mozilla/5.0',
                            'Referer' => 'https://www.huya.com/'
                        ]
                    ];
                }
                
                // 使用从HTML提取的信息
                $uid = $streamData['data'][0]['gameLiveInfo']['uid'] ?? '0';
                $sStreamName = $streamData['data'][0]['gameStreamInfoList'][0]['sStreamName'] ?? '';
                
                if (empty($sStreamName)) {
                    return [
                        'parse' => 0,
                        'url' => '',
                        'header' => [
                            'User-Agent' => 'Mozilla/5.0',
                            'Referer' => 'https://www.huya.com/'
                        ]
                    ];
                }
            } else {
                $data = $result['data'];
                $uid = $data['profileInfo']['uid'] ?? '0';
                
                // 获取第一个FLV线路
                $streamInfo = $data['stream']['baseSteamInfoList'][0] ?? null;
                if (!$streamInfo) {
                    return [
                        'parse' => 0,
                        'url' => '',
                        'header' => [
                            'User-Agent' => 'Mozilla/5.0',
                            'Referer' => 'https://www.huya.com/'
                        ]
                    ];
                }
                
                $sStreamName = $streamInfo['sStreamName'] ?? '';
            }
            
            // 核心算法
            $seqid = strval(intval($uid) + intval(microtime(true) * 1000));
            $ctype = "huya_adr";
            $t = "102";
            
            // 过期时间设为6小时后
            $wsTime = dechex(time() + 21600);
            
            // 第一层哈希：ss = md5(seqid|ctype|t)
            $ss = md5("{$seqid}|{$ctype}|{$t}");
            
            // 第二层哈希
            $wsSecret = md5("DWq8BcJ3h6DJt6TY_{$uid}_{$sStreamName}_{$ss}_{$wsTime}");
            
            // 拼接最终地址：强制 ratio=0 (原画)
            $playUrl = "https://al.flv.huya.com/src/{$sStreamName}.flv?wsSecret={$wsSecret}&wsTime={$wsTime}&ctype={$ctype}&seqid={$seqid}&uid={$uid}&fs=bgct&ver=1&t={$t}&ratio=0";
            
            return [
                'parse' => 0,
                'url' => $playUrl,
                'header' => [
                    'User-Agent' => 'Mozilla/5.0',
                    'Referer' => 'https://www.huya.com/'
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'parse' => 0,
                'url' => '',
                'header' => [
                    'User-Agent' => 'Mozilla/5.0',
                    'Referer' => 'https://www.huya.com/'
                ]
            ];
        }
    }
    
    /**
     * 搜索功能（新增）
     */
    public function search($keyword, $page = 1)
    {
        $url = "https://search.huya.com/?m=Search&do=getSearchContent&q={$keyword}&uid=0&v=4&typ=-5&livestate=0&rows=20&start=" . (($page - 1) * 20);
        $result = $this->httpRequest($url);
        
        if (isset($result['error'])) {
            return [
                'page' => $page,
                'pagecount' => 0,
                'limit' => 0,
                'total' => 0,
                'list' => []
            ];
        }
        
        $list = [];
        if (isset($result['response']['1']['docs'])) {
            foreach ($result['response']['1']['docs'] as $doc) {
                if (isset($doc['room_id']) && $doc['live_source_type'] == 0) {
                    $list[] = [
                        'vod_id' => $doc['room_id'],
                        'vod_name' => $doc['room_name'] ?? '',
                        'vod_pic' => $doc['screenshot'] ?? '',
                        'vod_remarks' => ($doc['total_count'] ?? 0) . '人在线'
                    ];
                }
            }
        }
        
        return [
            'page' => $page,
            'pagecount' => 999,
            'limit' => count($list),
            'total' => count($list) > 0 ? 9999 : 0,
            'list' => $list
        ];
    }
    
    /**
     * 处理请求路由
     */
    public function handleRequest()
    {
        $ac = $_GET['ac'] ?? '';
        $t = $_GET['t'] ?? '';
        $pg = $_GET['pg'] ?? '1';
        $wd = $_GET['wd'] ?? ''; // 搜索关键词
        $ids = $_GET['ids'] ?? '';
        $play = $_GET['play'] ?? '';
        
        // 播放地址请求
        if (!empty($play)) {
            return $this->play($play);
        }
        
        // 搜索请求
        if (!empty($wd)) {
            return $this->search($wd, intval($pg));
        }
        
        // 首页请求
        if (empty($ac)) {
            return $this->home();
        }
        
        // 详情/分类请求
        if ($ac === 'detail') {
            if (!empty($t)) {
                return $this->category($t, intval($pg));
            }
            if (!empty($ids)) {
                $idArray = explode(',', $ids);
                return $this->detail($idArray);
            }
        }
        
        // 参数错误
        return [
            'code' => 400,
            'msg' => '参数错误'
        ];
    }
}

// 运行实例
$huya = new HuYaLive();
$result = $huya->handleRequest();
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);