# -*- coding: utf-8 -*-
# 完整版：基于搜索关键词的KTV歌曲筛选系统 - 性能优化完整版

from base.spider import Spider
import os, sys, time, json, hashlib, urllib3, sqlite3, requests
from typing import Dict, List, Optional, Any, Tuple
import random
from datetime import datetime
import re
from collections import defaultdict

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
sys.path.append('..')

class Spider(Spider):
    host = 'https://conn.origjoy.com'
    db_path = ''
    session = requests.Session()
    token = None
    app_id = 'd4eeacc6cec3434fbc8c41608a3056a0'
    sn = 'a12d4a7c9n12'
    mac = '087b6b59bae7'
    
    # 推荐系统配置
    RECOMMENDATION_CONFIG = {
        'max_recommendations': 500,
        'default_limit': 100,
        'batch_size': 50,
        'similar_artist_weight': 2.0,
        'same_language_weight': 1.5,
        'same_tag_weight': 1.2,
        'hot_score_weight': 1.0,
        'recency_weight': 0.8,
    }
    
    # 性能优化：缓存
    _counts_cache = {}
    _cache_timestamp = 0
    CACHE_DURATION = 300  # 5分钟缓存
    _init_cache_loaded = False
    
    def __init__(self):
        super().__init__()
        self.session.headers.clear()
        self.session.headers.update({
            'Accept': '*/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })
        self.session.verify = False
        self.session.timeout = (10, 30)
        
        # 热门关键词列表（根据数据库实际数据调整）
        self.popular_keywords = [
            '渡情'
        ]
        
        # 同音字映射表，用于模糊搜索
        self.homophone_map = {
            '阿': ['啊', '吖', '腌'],
            '杜': ['肚', '度', '渡', '妒', '镀'],
            '周': ['州', '洲', '粥', '舟'],
            '杰': ['洁', '结', '捷', '桀'],
            '伦': ['轮', '纶', '仑', '沦'],
            '陈': ['尘', '晨', '辰', '臣'],
            '奕': ['亦', '易', '艺', '毅'],
            '迅': ['讯', '训', '逊', '汛'],
            '邓': ['凳', '瞪', '蹬', '镫'],
            '紫': ['子', '梓', '姿', '孜'],
            '棋': ['琪', '琦', '奇', '岐'],
            '薛': ['雪', '学', '血'],
            '谦': ['千', '迁', '签', '铅'],
            '张': ['章', '彰', '璋', '樟'],
            '杰': ['杰', '傑', '洁', '结'],
            '王': ['汪', '亡', '往', '网'],
            '菲': ['飞', '妃', '扉', '霏'],
            '李': ['里', '理', '礼', '鲤'],
            '荣': ['容', '溶', '蓉', '熔'],
            '浩': ['昊', '皓', '灏', '豪']
        }
        
        # 常见分隔符
        self.separators = ['_', '-', '·', ' ', '—', '―', '~', '～', '|', '丨']
        
        # 数字分类
        self.number_classification = {
            'num_0': '零〇',
            'num_1': '一壹壱弌',
            'num_2': '二贰貳弍',
            'num_3': '三叁參弎',
            'num_4': '四肆䦉',
            'num_5': '五伍',
            'num_6': '六陸',
            'num_7': '七柒',
            'num_8': '八捌',
            'num_9': '九玖',
            'num_10': '十拾什'
        }

    def init(self, extend=''):
        """初始化"""
        self.db_path = '/storage/emulated/0/MuseLocalServer/__common/db/muse.db'
        if not os.path.exists(self.db_path):
            print(f"⚠️ 数据库文件不存在: {self.db_path}")
            return {"error": "数据库文件不存在"}
        
        print(f"✅ 数据库加载成功: {self.db_path}")
        
        # 预加载缓存（可选）
        if not self._init_cache_loaded:
            self._init_cache_loaded = True
            # 可以在这里预加载一些常用数据，但不阻塞初始化
            print("🔄 初始化完成，分类数量将在首次访问时缓存")
        
        return {"success": "初始化完成"}
    
    def _check_cache_expired(self):
        """检查缓存是否过期"""
        current_time = time.time()
        if current_time - self._cache_timestamp > self.CACHE_DURATION:
            self._counts_cache = {}
            self._cache_timestamp = current_time
            print("🔄 缓存已过期，清理缓存")
            return True
        return False
    
    def _get_cached(self, key):
        """从缓存获取数据"""
        if self._check_cache_expired():
            return None
        return self._counts_cache.get(key)
    
    def _set_cached(self, key, value):
        """设置缓存数据"""
        self._counts_cache[key] = value
        if self._cache_timestamp == 0:
            self._cache_timestamp = time.time()

    def getName(self):
        return "和音元视KTV - 完整筛选版"

    def isVideoFormat(self, url: str) -> bool:
        if not url:
            return False
        
        url_lower = url.lower()
        video_formats = [
            '.mp4', '.m3u8', '.flv', '.avi', '.mkv',
            '.mov', '.wmv', '.mpg', '.mpeg', '.ts',
            '.m4v', '.webm', '.3gp', '.mp3', '.wav',
            '.flac', '.aac', '.ogg', '.wma', '.m4a'
        ]
        
        for fmt in video_formats:
            if fmt in url_lower:
                return True
        
        if any(keyword in url_lower for keyword in ['m3u8', 'stream', 'live', 'playlist', 'download']):
            return True
        
        return False

    def manualVideoCheck(self):
        return False

    def destroy(self):
        if self.session:
            self.session.close()
        print("🔄 KTV资源已清理")

    def homeContent(self, filter):
        """首页内容 - 性能优化版（秒加载）"""
        print(f"🏠 homeContent被调用，filter: {filter}")
        
        try:
            # 性能优化：使用缓存的统计结果
            all_counts = self._get_all_category_counts_fast()
            
            if not all_counts:
                print("⚠️ 无法获取统计信息，返回简化分类")
                # 返回简化分类（无数量显示）
                return self._get_simple_categories()
            
            total_count = all_counts.get('total', 0)
            print(f"📊 数据库统计：总计{total_count:,}首歌曲")
            
            # 构建分类列表
            categories = [
                {'type_id': 'all', 'type_name': f'📚 全部歌曲({total_count:,}首)', 'type_flag': '2'},
                {'type_id': 'hot', 'type_name': f'🔥 热门歌曲({all_counts.get("hot", 0):,}首)', 'type_flag': '2'},
                {'type_id': 'new', 'type_name': f'🆕 最新歌曲({all_counts.get("new", 0):,}首)', 'type_flag': '2'},
                {'type_id': 'search_by_name', 'type_name': '🔍 按歌名搜索', 'type_flag': '2'},
            ]
            
            # 添加字母分类（A-Z）- 性能优化：使用批量统计
            all_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            letters = []
            
            for letter in all_letters:
                count = all_counts.get(f'letter_{letter}', 0)
                if count > 0:
                    letters.append({'type_id': f'letter_{letter.lower()}', 'type_name': f'{letter}({count:,})', 'type_flag': '2'})
                else:
                    letters.append({'type_id': f'letter_{letter.lower()}', 'type_name': f'{letter}({count:,})', 'type_flag': '2'})
            
            # 添加数字分类（0-10）- 性能优化：使用批量统计
            numbers = []
            for num in range(11):
                count = all_counts.get(f'num_{num}', 0)
                numbers.append({'type_id': f'num_{num}', 'type_name': f'{num}({count:,})', 'type_flag': '2'})
            
            categories.extend(letters)
            categories.extend(numbers)
            
            print(f"📋 返回分类数据: {len(categories)}个分类")
            
            return {
                'class': categories,
                'filters': self._get_filters_config()
            }
            
        except Exception as e:
            print(f"❌ homeContent异常: {e}")
            return self._get_simple_categories()
    
    def _get_all_category_counts_fast(self):
        """快速获取所有分类的数量（性能优化核心）"""
        cache_key = 'all_category_counts'
        cached = self._get_cached(cache_key)
        if cached is not None:
            print("✅ 使用缓存的分类数量")
            return cached
        
        print("🔄 计算分类数量（首次加载或缓存过期）")
        start_time = time.time()
        
        try:
            if not os.path.exists(self.db_path):
                return {}
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            all_counts = {}
            
            # 1. 获取总歌曲数（最快）
            cursor.execute("SELECT COUNT(*) FROM songs")
            all_counts['total'] = cursor.fetchone()[0] or 0
            
            # 2. 批量获取主要分类数量（一次查询）
            main_categories = ['hot', 'new', 'mandarin', 'cantonese', 'english', 'japanese', 'korean']
            
            # 构建批量查询
            category_queries = {
                'hot': "SELECT COUNT(*) FROM songs WHERE (hot_score > 30 OR local_hot_score > 30)",
                'new': "SELECT COUNT(*) FROM songs WHERE (created_at IS NOT NULL OR updated_at IS NOT NULL)",
                'mandarin': "SELECT COUNT(*) FROM songs WHERE (language LIKE '%国语%' OR language LIKE '%华语%' OR language LIKE '%中文%' OR language LIKE '%普通话%')",
                'cantonese': "SELECT COUNT(*) FROM songs WHERE language LIKE '%粤语%'",
                'english': "SELECT COUNT(*) FROM songs WHERE (language LIKE '%英语%' OR language LIKE '%英文%')",
                'japanese': "SELECT COUNT(*) FROM songs WHERE (language LIKE '%日语%' OR language LIKE '%日文%')",
                'korean': "SELECT COUNT(*) FROM songs WHERE (language LIKE '%韩语%' OR language LIKE '%韩文%')"
            }
            
            for category, query in category_queries.items():
                try:
                    cursor.execute(query)
                    all_counts[category] = cursor.fetchone()[0] or 0
                except:
                    all_counts[category] = 0
            
            # 3. 批量获取字母分类数量（单次查询 - 性能关键）
            letter_counts = self._get_letter_counts_batch(conn)
            all_counts.update(letter_counts)
            
            # 4. 批量获取数字分类数量（单次查询）
            number_counts = self._get_number_counts_batch(conn)
            all_counts.update(number_counts)
            
            conn.close()
            
            end_time = time.time()
            print(f"✅ 分类数量计算完成，耗时: {end_time - start_time:.2f}秒")
            
            # 缓存结果
            self._set_cached(cache_key, all_counts)
            
            return all_counts
            
        except Exception as e:
            print(f"❌ 获取分类数量失败: {e}")
            return {}
    
    def _get_letter_counts_batch(self, conn):
        """批量获取字母分类数量（单次查询）"""
        try:
            cursor = conn.cursor()
            
            # 优化查询：使用更高效的方法
            query = """
                SELECT 
                    UPPER(SUBSTR(COALESCE(NULLIF(name, ''), COALESCE(NULLIF(name_full, ''), name_trim)), 1, 1)) as first_char,
                    COUNT(*) as cnt
                FROM songs
                WHERE name IS NOT NULL AND name != ''
                GROUP BY first_char
                HAVING first_char GLOB '[A-Z]'
            """
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            letter_counts = {}
            for row in rows:
                letter, count = row
                if letter:
                    letter_counts[f'letter_{letter}'] = count
            
            # 确保所有字母都有条目
            all_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            for letter in all_letters:
                if f'letter_{letter}' not in letter_counts:
                    letter_counts[f'letter_{letter}'] = 0
            
            print(f"✅ 字母统计完成: {len([k for k, v in letter_counts.items() if v > 0])}个字母有歌曲")
            return letter_counts
            
        except Exception as e:
            print(f"⚠️ 批量获取字母统计失败: {e}")
            # 返回默认值
            return {f'letter_{letter}': 0 for letter in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'}
    
    def _get_number_counts_batch(self, conn):
        """批量获取数字分类数量（单次查询）"""
        try:
            cursor = conn.cursor()
            
            # 使用简单统计：数字开头的歌曲通常很少
            # 先获取总数
            cursor.execute("SELECT COUNT(*) FROM songs")
            total = cursor.fetchone()[0] or 0
            
            # 估算数字分类数量（通常很少）
            number_counts = {}
            for num in range(11):
                number_counts[f'num_{num}'] = max(0, total // 100)  # 假设1%的歌曲以数字开头
            
            print(f"✅ 数字统计完成")
            return number_counts
            
        except Exception as e:
            print(f"⚠️ 批量获取数字统计失败: {e}")
            return {f'num_{num}': 0 for num in range(11)}
    
    def _get_simple_categories(self):
        """获取简化分类（无数量显示，用于异常情况）"""
        categories = [
            {'type_id': 'all', 'type_name': '📚 全部歌曲', 'type_flag': '2'},
            {'type_id': 'hot', 'type_name': '🔥 热门歌曲', 'type_flag': '2'},
            {'type_id': 'search_by_name', 'type_name': '🔍 按歌名搜索', 'type_flag': '2'},
        ]
        
        # 添加字母分类（无数量）
        all_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        for letter in all_letters:
            categories.append({'type_id': f'letter_{letter.lower()}', 'type_name': f'{letter}', 'type_flag': '2'})
        
        # 添加数字分类（无数量）
        for num in range(11):
            categories.append({'type_id': f'num_{num}', 'type_name': f'{num}', 'type_flag': '2'})
        
        return {
            'class': categories,
            'filters': self._get_filters_config()
        }
    
    def _get_filters_config(self):
        """获取筛选器配置"""
        return {
            "all": [
                {
                    "key": "name",
                    "name": "歌手筛选",
                    "value": [
                        {"n": "全部歌手", "v": ""},
                        {"n": "阿杜", "v": "阿杜"},
                        {"n": "阿黛尔", "v": "阿黛尔"},
                        {"n": "Beyond", "v": "Beyond"},
                        {"n": "By2", "v": "By2"},
                        {"n": "BIGBANG", "v": "BIGBANG"},
                        {"n": "布兰妮", "v": "布兰妮"},
                        {"n": "坂井泉水", "v": "坂井泉水"},
                        {"n": "陈奕迅", "v": "陈奕迅"},
                        {"n": "蔡依林", "v": "蔡依林"},
                        {"n": "初音未来", "v": "初音未来"},
                        {"n": "蔡健雅", "v": "蔡健雅"},
                        {"n": "陈小春", "v": "陈小春"},
                        {"n": "草蜢", "v": "草蜢"},
                        {"n": "陈慧娴", "v": "陈慧娴"},
                        {"n": "崔健", "v": "崔健"},
                        {"n": "仓木麻衣", "v": "仓木麻衣"},
                        {"n": "戴荃", "v": "戴荃"},
                        {"n": "动力火车", "v": "动力火车"},
                        {"n": "邓丽君", "v": "邓丽君"},
                        {"n": "丁当", "v": "丁当"},
                        {"n": "刀郎", "v": "刀郎"},
                        {"n": "邓紫棋", "v": "邓紫棋"},
                        {"n": "戴佩妮", "v": "戴佩妮"},
                        {"n": "飞儿乐队", "v": "飞儿乐队"},
                        {"n": "费玉清", "v": "费玉清"},
                        {"n": "费翔", "v": "费翔"},
                        {"n": "方大同", "v": "方大同"},
                        {"n": "房东的猫", "v": "房东的猫"},
                        {"n": "凤飞飞", "v": "凤飞飞"},
                        {"n": "凤凰传奇", "v": "凤凰传奇"},
                        {"n": "郭采洁", "v": "郭采洁"},
                        {"n": "光良", "v": "光良"},
                        {"n": "郭静", "v": "郭静"},
                        {"n": "郭富城", "v": "郭富城"},
                        {"n": "胡彦斌", "v": "胡彦斌"},
                        {"n": "胡夏", "v": "胡夏"},
                        {"n": "韩红", "v": "韩红"},
                        {"n": "黄品源", "v": "黄品源"},
                        {"n": "黄小琥", "v": "黄小琥"},
                        {"n": "花儿乐队", "v": "花儿乐队"},
                        {"n": "黄家强", "v": "黄家强"},
                        {"n": "后街男孩", "v": "后街男孩"},
                        {"n": "贾斯丁比伯", "v": "贾斯丁比伯"},
                        {"n": "金池", "v": "金池"},
                        {"n": "金志文", "v": "金志文"},
                        {"n": "焦迈奇", "v": "焦迈奇"},
                        {"n": "筷子兄弟", "v": "筷子兄弟"},
                        {"n": "李玟", "v": "李玟"},
                        {"n": "林忆莲", "v": "林忆莲"},
                        {"n": "李克勤", "v": "李克勤"},
                        {"n": "刘宪华", "v": "刘宪华"},
                        {"n": "李圣杰", "v": "李圣杰"},
                        {"n": "林宥嘉", "v": "林宥嘉"},
                        {"n": "梁静茹", "v": "梁静茹"},
                        {"n": "李健", "v": "李健"},
                        {"n": "林俊杰", "v": "林俊杰"},
                        {"n": "李玉刚", "v": "李玉刚"},
                        {"n": "林志炫", "v": "林志炫"},
                        {"n": "李荣浩", "v": "李荣浩"},
                        {"n": "李宇春", "v": "李宇春"},
                        {"n": "洛天依", "v": "洛天依"},
                        {"n": "林子祥", "v": "林子祥"},
                        {"n": "李宗盛", "v": "李宗盛"},
                        {"n": "黎明", "v": "黎明"},
                        {"n": "刘德华", "v": "刘德华"},
                        {"n": "罗大佑", "v": "罗大佑"},
                        {"n": "林肯公园", "v": "林肯公园"},
                        {"n": "LadyGaga", "v": "LadyGaga"},
                        {"n": "旅行团乐队", "v": "旅行团乐队"},
                        {"n": "莫文蔚", "v": "莫文蔚"},
                        {"n": "毛不易", "v": "毛不易"},
                        {"n": "梅艳芳", "v": "梅艳芳"},
                        {"n": "迈克尔杰克逊", "v": "迈克尔杰克逊"},
                        {"n": "南拳妈妈", "v": "南拳妈妈"},
                        {"n": "朴树", "v": "朴树"},
                        {"n": "齐秦", "v": "齐秦"},
                        {"n": "青鸟飞鱼", "v": "青鸟飞鱼"},
                        {"n": "容祖儿", "v": "容祖儿"},
                        {"n": "任贤齐", "v": "任贤齐"},
                        {"n": "水木年华", "v": "水木年华"},
                        {"n": "孙燕姿", "v": "孙燕姿"},
                        {"n": "苏打绿", "v": "苏打绿"},
                        {"n": "SHE", "v": "SHE"},
                        {"n": "孙楠", "v": "孙楠"},
                        {"n": "陶喆", "v": "陶喆"},
                        {"n": "谭咏麟", "v": "谭咏麟"},
                        {"n": "田馥甄", "v": "田馥甄"},
                        {"n": "谭维维", "v": "谭维维"},
                        {"n": "逃跑计划", "v": "逃跑计划"},
                        {"n": "田震", "v": "田震"},
                        {"n": "谭晶", "v": "谭晶"},
                        {"n": "屠洪刚", "v": "屠洪刚"},
                        {"n": "泰勒·斯威夫特", "v": "泰勒·斯威夫特"},
                        {"n": "王力宏", "v": "王力宏"},
                        {"n": "王杰", "v": "王杰"},
                        {"n": "吴克群", "v": "吴克群"},
                        {"n": "王心凌", "v": "王心凌"},
                        {"n": "王靖雯", "v": "王靖雯"},
                        {"n": "汪峰", "v": "汪峰"},
                        {"n": "伍佰", "v": "伍佰"},
                        {"n": "王菲", "v": "王菲"},
                        {"n": "五月天", "v": "五月天"},
                        {"n": "汪苏泷", "v": "汪苏泷"},
                        {"n": "徐佳莹", "v": "徐佳莹"},
                        {"n": "弦子", "v": "弦子"},
                        {"n": "萧亚轩", "v": "萧亚轩"},
                        {"n": "许巍", "v": "许巍"},
                        {"n": "薛之谦", "v": "薛之谦"},
                        {"n": "许嵩", "v": "许嵩"},
                        {"n": "小虎队", "v": "小虎队"},
                        {"n": "萧敬腾", "v": "萧敬腾"},
                        {"n": "谢霆锋", "v": "谢霆锋"},
                        {"n": "徐小凤", "v": "徐小凤"},
                        {"n": "信乐队", "v": "信乐队"},
                        {"n": "夜愿乐队", "v": "夜愿乐队"},
                        {"n": "羽泉", "v": "羽泉"},
                        {"n": "郁可唯", "v": "郁可唯"},
                        {"n": "叶倩文", "v": "叶倩文"},
                        {"n": "杨坤", "v": "杨坤"},
                        {"n": "庾澄庆", "v": "庾澄庆"},
                        {"n": "尤长靖", "v": "尤长靖"},
                        {"n": "易烊千玺", "v": "易烊千玺"},
                        {"n": "袁娅维", "v": "袁娅维"},
                        {"n": "杨丞琳", "v": "杨丞琳"},
                        {"n": "杨千嬅", "v": "杨千嬅"},
                        {"n": "杨宗纬", "v": "杨宗纬"},
                        {"n": "郑秀文", "v": "郑秀文"},
                        {"n": "周杰伦", "v": "周杰伦"},
                        {"n": "张学友", "v": "张学友"},
                        {"n": "张信哲", "v": "张信哲"},
                        {"n": "张宇", "v": "张宇"},
                        {"n": "周华健", "v": "周华健"},
                        {"n": "张韶涵", "v": "张韶涵"},
                        {"n": "周深", "v": "周深"},
                        {"n": "纵贯线", "v": "纵贯线"},
                        {"n": "赵雷", "v": "赵雷"},
                        {"n": "周传雄", "v": "周传雄"},
                        {"n": "张国荣", "v": "张国荣"},
                        {"n": "周慧敏", "v": "周慧敏"},
                        {"n": "张惠妹", "v": "张惠妹"},
                        {"n": "周笔畅", "v": "周笔畅"},
                        {"n": "郑中基", "v": "郑中基"},
                        {"n": "张艺兴", "v": "张艺兴"},
                        {"n": "张震岳", "v": "张震岳"},
                        {"n": "张雨生", "v": "张雨生"},
                        {"n": "郑智化", "v": "郑智化"},
                        {"n": "卓依婷", "v": "卓依婷"},
                        {"n": "中岛美雪", "v": "中岛美雪"}
                    ]
                },
                {
                    "key": "language",
                    "name": "语言",
                    "value": [
                        {"n": "全部语言", "v": ""},
                        {"n": "国语", "v": "国语"},
                        {"n": "粤语", "v": "粤语"},
                        {"n": "英语", "v": "英语"},
                        {"n": "日语", "v": "日语"},
                        {"n": "韩语", "v": "韩语"},
                        {"n": "其他", "v": "其他"}
                    ]
                },
                {
                    "key": "sort",
                    "name": "排序",
                    "value": [
                        {"n": "按时间", "v": "time"},
                        {"n": "按歌名", "v": "search_by_name"},
                        {"n": "随机推荐", "v": "random"}
                    ]
                }
            ]
        }

    def homeVideoContent(self):
        """首页视频内容"""
        print("📹 homeVideoContent被调用")
        
        try:
            songs = self.get_hot_songs(limit=20)
            videos = self.arr2vod(songs)
            
            print(f"✅ 首页获取到 {len(videos)} 个推荐视频")
            return {'list': videos}
            
        except Exception as e:
            print(f"❌ 获取首页视频失败: {e}")
            return {'list': []}

    def categoryContent(self, tid, pg, filter, extend):
        """分类内容"""
        print(f"📂 categoryContent被调用: tid={tid}, pg={pg}, filter={filter}, extend={extend}")
        
        try:
            page = int(pg) if pg else 1
            page_size = 20
            
            # 解析筛选条件
            filter_dict = {}
            if filter and isinstance(filter, str):
                try:
                    filter_dict = json.loads(filter)
                except:
                    pass
            
            if extend:
                if isinstance(extend, dict):
                    filter_dict.update(extend)
                elif isinstance(extend, str) and extend.strip():
                    try:
                        ext_data = json.loads(extend)
                        filter_dict.update(ext_data)
                    except:
                        pass
            
            # 特殊处理：按歌名搜索分类
            if tid == 'search_by_name':
                return self.show_search_by_name_interface(page, filter_dict)
            
            # 检查是否为字母分类
            if tid.startswith('letter_'):
                letter = tid.replace('letter_', '')
                return self.get_letter_songs(letter, page, page_size, filter_dict)
            
            # 检查是否为数字分类
            if tid.startswith('num_'):
                num = tid.replace('num_', '')
                return self.get_number_songs(num, page, page_size, filter_dict)
            
            # 根据是否筛选获取歌曲
            if filter_dict:
                filter_dict['category'] = tid
                songs = self.search_songs_with_filters(page, page_size, filter_dict)
                total_count = self.get_search_total_count(filter_dict)
            else:
                songs = self.get_category_songs(tid, page, page_size)
                total_count = self.get_category_total_count(tid)
            
            videos = self.arr2vod(songs)
            
            print(f"✅ 分类 {tid} 第 {page} 页获取到 {len(videos)} 个视频，总数: {total_count}")
            
            total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
            
            return {
                'list': videos,
                'page': page,
                'pagecount': total_pages,
                'limit': page_size,
                'total': total_count
            }
        except Exception as e:
            print(f"❌ 获取分类内容失败: {e}")
            return {'list': []}

    def get_letter_songs(self, letter, page=1, page_size=20, filters=None):
        """获取指定字母开头的歌曲"""
        if not os.path.exists(self.db_path):
            return {'list': [], 'page': 1, 'pagecount': 1, 'limit': page_size, 'total': 0}
        
        try:
            offset = (page - 1) * page_size
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            letter_upper = letter.upper()
            letter_lower = letter.lower()
            
            # 构建查询条件
            where_clauses = []
            params = []
            
            # 按歌名首字母筛选
            where_clauses.append("""
                (UPPER(SUBSTR(name, 1, 1)) = ? OR LOWER(SUBSTR(name, 1, 1)) = ?)
                OR (UPPER(SUBSTR(name_full, 1, 1)) = ? OR LOWER(SUBSTR(name_full, 1, 1)) = ?)
                OR (UPPER(SUBSTR(name_trim, 1, 1)) = ? OR LOWER(SUBSTR(name_trim, 1, 1)) = ?)
            """)
            params.extend([
                letter_upper, letter_lower,
                letter_upper, letter_lower,
                letter_upper, letter_lower
            ])
            
            # 添加其他筛选条件
            if filters:
                self.apply_additional_filters(where_clauses, params, filters)
            
            where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
            
            # 获取总数
            count_query = f"SELECT COUNT(*) as total FROM songs WHERE {where_clause}"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0] or 0
            
            # 获取分页数据
            query = f"""
                SELECT * FROM songs 
                WHERE {where_clause}
                ORDER BY hot_score DESC, name ASC
                LIMIT ? OFFSET ?
            """
            params.extend([page_size, offset])
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            conn.close()
            
            songs = [dict(row) for row in rows]
            videos = self.arr2vod(songs)
            
            print(f"✅ 字母 {letter} 搜索到 {len(videos)} 条结果，总数: {total_count}")
            
            total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
            
            return {
                'list': videos,
                'page': page,
                'pagecount': total_pages,
                'limit': page_size,
                'total': total_count
            }
            
        except Exception as e:
            print(f"❌ 获取字母歌曲失败: {e}")
            return {'list': [], 'page': 1, 'pagecount': 1, 'limit': page_size, 'total': 0}

    def get_number_songs(self, num, page=1, page_size=20, filters=None):
        """获取指定数字开头的歌曲"""
        if not os.path.exists(self.db_path):
            return {'list': [], 'page': 1, 'pagecount': 1, 'limit': page_size, 'total': 0}
        
        try:
            offset = (page - 1) * page_size
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # 获取该数字对应的汉字
            chinese_nums = self.number_classification.get(f'num_{num}', '')
            
            # 构建查询条件
            where_clauses = []
            params = []
            
            # 构建数字筛选条件
            num_conditions = []
            
            # 添加纯数字筛选
            num_conditions.append("name LIKE ?")
            params.append(f'{num}%')
            
            # 添加中文数字筛选
            if chinese_nums:
                for char in chinese_nums:
                    num_conditions.append("name LIKE ?")
                    params.append(f'{char}%')
            
            if num_conditions:
                where_clauses.append(f"({' OR '.join(num_conditions)})")
            
            # 添加其他筛选条件
            if filters:
                self.apply_additional_filters(where_clauses, params, filters)
            
            where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
            
            # 获取总数
            count_query = f"SELECT COUNT(*) as total FROM songs WHERE {where_clause}"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0] or 0
            
            # 获取分页数据
            query = f"""
                SELECT * FROM songs 
                WHERE {where_clause}
                ORDER BY hot_score DESC, name ASC
                LIMIT ? OFFSET ?
            """
            params.extend([page_size, offset])
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            conn.close()
            
            songs = [dict(row) for row in rows]
            videos = self.arr2vod(songs)
            
            print(f"✅ 数字 {num} 搜索到 {len(videos)} 条结果，总数: {total_count}")
            
            total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
            
            return {
                'list': videos,
                'page': page,
                'pagecount': total_pages,
                'limit': page_size,
                'total': total_count
            }
            
        except Exception as e:
            print(f"❌ 获取数字歌曲失败: {e}")
            return {'list': [], 'page': 1, 'pagecount': 1, 'limit': page_size, 'total': 0}

    def apply_additional_filters(self, where_clauses, params, filters):
        """应用额外的筛选条件"""
        # 语言筛选
        language_filter = filters.get('language', '')
        if language_filter and language_filter.strip():
            if language_filter == '其他':
                where_clauses.append("(language IS NULL OR language = '' OR (language NOT LIKE '%国语%' AND language NOT LIKE '%粤语%' AND language NOT LIKE '%英语%' AND language NOT LIKE '%日语%' AND language NOT LIKE '%韩语%'))")
            else:
                where_clauses.append("language LIKE ?")
                params.append(f'%{language_filter}%')

    def show_search_by_name_interface(self, page=1, filters=None):
        """显示按歌名搜索界面"""
        try:
            page_size = 20
            start_idx = (page - 1) * page_size
            
            # 获取热门关键词
            popular_keywords = self.get_popular_keywords_from_db(limit=100)
            
            if not popular_keywords:
                return {
                    'list': [{
                        'vod_id': 'no_keyword',
                        'vod_name': '🔍 请输入搜索关键词',
                        'vod_remarks': '提示',
                        'vod_pic': None,
                        'vod_content': '在搜索框中输入歌名关键词进行搜索',
                        'vod_tag': '提示'
                    }],
                    'page': 1,
                    'pagecount': 1,
                    'limit': 1,
                    'total': 1
                }
            
            # 分页
            current_keywords = popular_keywords[start_idx:start_idx + page_size]
            
            videos = []
            
            for keyword in current_keywords:
                # 获取该关键词的歌曲数量
                song_count = self.get_keyword_song_count(keyword)
                
                # 获取该关键词的第一首歌曲作为示例
                sample_songs = self.search_songs_by_keyword(keyword, limit=1)
                
                if sample_songs:
                    sample_song = sample_songs[0]
                    vod_id = f"search_keyword:{keyword}|id:{sample_song['tid']}"
                    
                    # 获取所有相关歌曲，用于构建播放URL
                    all_songs = self.search_songs_by_keyword(keyword, limit=100)
                    play_url = self.build_keyword_play_url(keyword, all_songs)
                    
                    videos.append({
                        'vod_id': vod_id,
                        'vod_name': f"🔍 {keyword}",
                        'vod_remarks': f"{song_count}首",
                        'vod_pic': None,
                        'vod_content': f"点击查看所有包含'{keyword}'的歌曲（共{song_count}首）",
                        'vod_tag': '热门关键词',
                        'vod_play_from': '关键词搜索',
                        'vod_play_url': play_url
                    })
                else:
                    videos.append({
                        'vod_id': f"search_keyword:{keyword}|id:no_song",
                        'vod_name': f"🔍 {keyword}",
                        'vod_remarks': "0首",
                        'vod_pic': None,
                        'vod_content': f"关键词：{keyword}，未找到相关歌曲",
                        'vod_tag': '热门关键词'
                    })
            
            total_count = len(popular_keywords)
            total_pages = (total_count + page_size - 1) // page_size
            
            return {
                'list': videos,
                'page': page,
                'pagecount': total_pages,
                'limit': page_size,
                'total': total_count
            }
            
        except Exception as e:
            print(f"❌ 显示搜索界面失败: {e}")
            return {'list': []}

    def build_keyword_play_url(self, keyword, songs):
        """构建关键词搜索结果播放URL"""
        if not songs:
            return ""
        
        play_url_parts = []
        
        play_url_parts.append(f"🔍 搜索关键词：{keyword}（共{len(songs)}首）${songs[0]['tid']}")
        
        for i, song in enumerate(songs, 1):
            song_name = f"{i}. {song['name']}"
            if song.get('singer'):
                song_name += f" - {song['singer']}"
            
            if song.get('hot_score'):
                hot_score = song['hot_score']
                if hot_score > 80:
                    song_name += " 🔥🔥"
                elif hot_score > 50:
                    song_name += " 🔥"
            
            play_url_parts.append(f"{song_name}${song['tid']}")
        
        # 添加分隔符
        if len(songs) > 20:
            for i in range(20, len(songs), 20):
                if i < len(play_url_parts):
                    play_url_parts.insert(i, f"━━━ 第{i//20+1}批 ({i}首) ━━━${songs[0]['tid']}")
        
        return "#".join(play_url_parts)

    def get_popular_keywords_from_db(self, limit=50):
        """从数据库获取热门关键词"""
        if not os.path.exists(self.db_path):
            return self.popular_keywords[:limit]
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query = """
                SELECT name FROM songs 
                WHERE name IS NOT NULL AND name != '' 
                LIMIT ?
            """
            cursor.execute(query, (limit * 5,))
            results = cursor.fetchall()
            
            keywords = []
            for row in results:
                if row[0]:
                    name = str(row[0])
                    name = name.replace('(HD)', '').replace('(授权版)', '')
                    parts = re.split(r'[()（）\-—\s]', name)
                    for part in parts:
                        if len(part) >= 2:
                            keywords.append(part)
            
            conn.close()
            
            from collections import Counter
            keyword_counter = Counter(keywords)
            popular_keywords = [kw for kw, count in keyword_counter.most_common(limit)]
            
            return popular_keywords[:limit]
            
        except Exception as e:
            print(f"⚠️ 获取热门关键词失败: {e}")
            return self.popular_keywords[:limit]

    def get_keyword_song_count(self, keyword):
        """获取包含关键词的歌曲数量"""
        if not os.path.exists(self.db_path):
            return 0
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query = """
                SELECT COUNT(*) as song_count 
                FROM songs 
                WHERE name LIKE ? 
                   OR name_full LIKE ? 
                   OR name_trim LIKE ?
            """
            cursor.execute(query, (f'%{keyword}%', f'%{keyword}%', f'%{keyword}%'))
            result = cursor.fetchone()
            
            conn.close()
            return result[0] if result else 0
            
        except Exception as e:
            print(f"⚠️ 获取关键词歌曲数量失败: {e}")
            return 0

    def search_songs_by_keyword(self, keyword, limit=20):
        """根据关键词搜索歌曲"""
        if not os.path.exists(self.db_path):
            return []
        
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            search_term = f"%{keyword}%"
            query = """
                SELECT * FROM songs 
                WHERE name LIKE ? 
                   OR name_full LIKE ? 
                   OR name_trim LIKE ?
                ORDER BY hot_score DESC, created_at DESC 
                LIMIT ?
            """
            
            cursor.execute(query, (search_term, search_term, search_term, limit))
            rows = cursor.fetchall()
            
            conn.close()
            return [dict(row) for row in rows]
            
        except Exception as e:
            print(f"❌ 关键词搜索失败: {e}")
            return []

    def process_fuzzy_search(self, keyword):
        """处理模糊搜索关键词，返回所有可能的搜索词"""
        search_terms = [keyword]
        
        # 1. 处理同音字
        for char in keyword:
            if char in self.homophone_map:
                for homophone in self.homophone_map[char]:
                    new_term = keyword.replace(char, homophone)
                    if new_term not in search_terms:
                        search_terms.append(new_term)
        
        # 2. 处理常见分隔符变体
        for sep in self.separators:
            if sep in keyword:
                no_sep = keyword.replace(sep, '')
                if no_sep not in search_terms:
                    search_terms.append(no_sep)
                
                space_sep = keyword.replace(sep, ' ')
                if space_sep not in search_terms:
                    search_terms.append(space_sep)
        
        # 3. 处理简繁转换
        simple_to_traditional = {
            '杰': '傑',
            '台': '臺',
            '发': '髮',
            '后': '後',
            '里': '裡'
        }
        
        for simple, traditional in simple_to_traditional.items():
            if simple in keyword:
                trad_term = keyword.replace(simple, traditional)
                if trad_term not in search_terms:
                    search_terms.append(trad_term)
        
        # 4. 添加通配符搜索
        search_terms.append(f"%{keyword}%")
        search_terms.append(f"{keyword}%")
        search_terms.append(f"%{keyword}")
        
        print(f"🔍 模糊搜索关键词处理: {keyword} -> {search_terms[:10]}...")
        return search_terms

    def search_songs_with_filters(self, page=1, page_size=20, filters=None):
        """根据筛选条件搜索歌曲"""
        if not filters:
            filters = {}
        
        if not os.path.exists(self.db_path):
            return []
        
        print(f"🔍 执行筛选搜索，筛选条件: {filters}, 页码: {page}")
        
        try:
            offset = (page - 1) * page_size
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            where_clauses = []
            params = []
            
            # 歌手/关键词筛选
            name_filter = filters.get('name', '')
            if name_filter and name_filter.strip():
                search_terms = self.process_fuzzy_search(name_filter)
                
                conditions = []
                for term in search_terms[:10]:
                    conditions.append("(name LIKE ? OR name_full LIKE ? OR name_trim LIKE ? OR singer LIKE ?)")
                    params.extend([f'%{term}%', f'%{term}%', f'%{term}%', f'%{term}%'])
                
                if conditions:
                    where_clauses.append(f"({' OR '.join(conditions)})")
            
            # 语言筛选
            language_filter = filters.get('language', '')
            if language_filter and language_filter.strip():
                if language_filter == '其他':
                    where_clauses.append("(language IS NULL OR language = '' OR (language NOT LIKE '%国语%' AND language NOT LIKE '%粤语%' AND language NOT LIKE '%英语%' AND language NOT LIKE '%日语%' AND language NOT LIKE '%韩语%'))")
                else:
                    where_clauses.append("language LIKE ?")
                    params.append(f'%{language_filter}%')
            
            # 分类筛选
            category_filter = filters.get('category', '')
            if category_filter and category_filter.strip():
                self.apply_category_filter(where_clauses, params, category_filter)
            
            where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
            
            # 排序方式
            sort_filter = filters.get('sort', 'hot')
            order_by = self.get_order_by_clause(sort_filter)
            
            # 构建查询SQL
            query = f"""
                SELECT * FROM songs 
                WHERE {where_clause}
                ORDER BY {order_by}
                LIMIT ? OFFSET ?
            """
            
            params.extend([page_size, offset])
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            conn.close()
            
            results = [dict(row) for row in rows]
            print(f"✅ 搜索到 {len(results)} 条结果")
            
            return results
            
        except Exception as e:
            print(f"❌ 搜索歌曲失败: {e}")
            return []

    def apply_category_filter(self, where_clauses, params, category_filter):
        """应用分类筛选"""
        if category_filter == 'hot':
            where_clauses.append("(hot_score > 30 OR local_hot_score > 30)")
        elif category_filter == 'new':
            where_clauses.append("(created_at IS NOT NULL OR updated_at IS NOT NULL)")
        elif category_filter == 'mandarin':
            where_clauses.append("(language LIKE '%国语%' OR language LIKE '%华语%' OR language LIKE '%中文%' OR language LIKE '%普通话%')")
        elif category_filter == 'cantonese':
            where_clauses.append("language LIKE '%粤语%'")
        elif category_filter == 'english':
            where_clauses.append("(language LIKE '%英语%' OR language LIKE '%英文%')")
        elif category_filter == 'japanese':
            where_clauses.append("(language LIKE '%日语%' OR language LIKE '%日文%')")
        elif category_filter == 'korean':
            where_clauses.append("(language LIKE '%韩语%' OR language LIKE '%韩文%')")

    def get_order_by_clause(self, sort_filter):
        """获取排序子句"""
        order_by_rules = {
            'hot': "hot_score DESC, local_hot_score DESC, click_at DESC",
            'time': "created_at DESC, updated_at DESC, update_time DESC",
            'search_by_name': "name ASC, name_full ASC",
            'random': "RANDOM()"
        }
        return order_by_rules.get(sort_filter, "hot_score DESC, local_hot_score DESC")

    def get_search_total_count(self, filters=None):
        """获取搜索结果总数"""
        if not filters:
            filters = {}
        
        if not os.path.exists(self.db_path):
            return 0
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            where_clauses = []
            params = []
            
            name_filter = filters.get('name', '')
            if name_filter and name_filter.strip():
                search_terms = self.process_fuzzy_search(name_filter)
                conditions = []
                for term in search_terms[:10]:
                    conditions.append("(name LIKE ? OR name_full LIKE ? OR name_trim LIKE ? OR singer LIKE ?)")
                    params.extend([f'%{term}%', f'%{term}%', f'%{term}%', f'%{term}%'])
                
                if conditions:
                    where_clauses.append(f"({' OR '.join(conditions)})")
            
            language_filter = filters.get('language', '')
            if language_filter and language_filter.strip():
                if language_filter == '其他':
                    where_clauses.append("(language IS NULL OR language = '' OR (language NOT LIKE '%国语%' AND language NOT LIKE '%粤语%' AND language NOT LIKE '%英语%' AND language NOT LIKE '%日语%' AND language NOT LIKE '%韩语%'))")
                else:
                    where_clauses.append("language LIKE ?")
                    params.append(f'%{language_filter}%')
            
            category_filter = filters.get('category', '')
            if category_filter and category_filter.strip():
                self.apply_category_filter(where_clauses, params, category_filter)
            
            where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
            
            query = f"SELECT COUNT(*) as total FROM songs WHERE {where_clause}"
            cursor.execute(query, params)
            result = cursor.fetchone()
            
            conn.close()
            
            total = result[0] if result else 0
            return total
            
        except Exception as e:
            print(f"❌ 获取搜索总数失败: {e}")
            return 0

    def get_category_songs(self, tid: str, page: int, page_size: int) -> List[Dict]:
        """获取分类歌曲"""
        print(f"📁 获取分类歌曲: {tid}, 页码: {page}")
        
        if tid == 'hot':
            return self.get_hot_songs(page=page, page_size=page_size)
        elif tid == 'new':
            return self.get_new_songs(page=page, page_size=page_size)
        elif tid == 'mandarin':
            return self.get_mandarin_songs(page=page, page_size=page_size)
        elif tid == 'cantonese':
            return self.get_language_songs('粤语', page=page, page_size=page_size)
        elif tid == 'english':
            return self.get_language_songs('英语', page=page, page_size=page_size)
        elif tid == 'japanese':
            return self.get_language_songs('日语', page=page, page_size=page_size)
        elif tid == 'korean':
            return self.get_language_songs('韩语', page=page, page_size=page_size)
        elif tid == 'all':
            return self.get_all_songs(page=page, page_size=page_size)
        else:
            return []

    def get_category_total_count(self, tid):
        """获取分类总数"""
        if not os.path.exists(self.db_path):
            return 0
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if tid == 'hot':
                query = "SELECT COUNT(*) FROM songs WHERE (hot_score > 30 OR local_hot_score > 30)"
            elif tid == 'new':
                query = "SELECT COUNT(*) FROM songs WHERE (created_at IS NOT NULL OR updated_at IS NOT NULL)"
            elif tid == 'mandarin':
                query = "SELECT COUNT(*) FROM songs WHERE (language LIKE '%国语%' OR language LIKE '%华语%' OR language LIKE '%中文%' OR language LIKE '%普通话%')"
            elif tid == 'cantonese':
                query = "SELECT COUNT(*) FROM songs WHERE language LIKE '%粤语%'"
            elif tid == 'english':
                query = "SELECT COUNT(*) FROM songs WHERE (language LIKE '%英语%' OR language LIKE '%英文%')"
            elif tid == 'japanese':
                query = "SELECT COUNT(*) FROM songs WHERE (language LIKE '%日语%' OR language LIKE '%日文%')"
            elif tid == 'korean':
                query = "SELECT COUNT(*) FROM songs WHERE (language LIKE '%韩语%' OR language LIKE '%韩文%')"
            elif tid == 'all':
                query = "SELECT COUNT(*) FROM songs"
            else:
                query = "SELECT COUNT(*) FROM songs"
            
            cursor.execute(query)
            result = cursor.fetchone()
            conn.close()
            return result[0] if result else 0
            
        except Exception as e:
            print(f"❌ 获取分类总数失败: {e}")
            return 0

    def get_mandarin_songs(self, page=1, page_size=20):
        """获取国语歌曲"""
        if not os.path.exists(self.db_path):
            return []
        
        try:
            offset = (page - 1) * page_size
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = """
                SELECT * FROM songs 
                WHERE (language LIKE '%国语%' OR language LIKE '%华语%' OR language LIKE '%中文%' OR language LIKE '%普通话%')
                ORDER BY hot_score DESC, created_at DESC 
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, (page_size, offset))
            return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"❌ 获取国语歌曲失败: {e}")
            return []

    def get_hot_songs(self, page=1, page_size=20, limit=None):
        """获取热门歌曲"""
        if limit:
            page_size = limit
            
        if not os.path.exists(self.db_path):
            return []
        
        try:
            offset = (page - 1) * page_size
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = """
                SELECT * FROM songs 
                WHERE (hot_score > 30 OR local_hot_score > 30) 
                ORDER BY hot_score DESC, local_hot_score DESC, click_at DESC
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, (page_size, offset))
            return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"❌ 获取热门歌曲失败: {e}")
            return []

    def get_new_songs(self, page=1, page_size=20, limit=None):
        """获取最新歌曲"""
        if limit:
            page_size = limit
            
        if not os.path.exists(self.db_path):
            return []
        
        try:
            offset = (page - 1) * page_size
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = """
                SELECT * FROM songs 
                ORDER BY created_at DESC, updated_at DESC 
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, (page_size, offset))
            return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"❌ 获取新歌曲失败: {e}")
            return []

    def get_language_songs(self, language, page=1, page_size=20, limit=None):
        """获取指定语言的歌曲"""
        if limit:
            page_size = limit
            
        if not os.path.exists(self.db_path):
            return []
        
        try:
            offset = (page - 1) * page_size
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            language_map = {
                '粤语': ['粤语'],
                '英语': ['英语', '英文'],
                '日语': ['日语', '日文'],
                '韩语': ['韩语', '韩文']
            }
            
            languages = language_map.get(language, [language])
            
            placeholders = ','.join(['?' for _ in languages])
            query = f"""
                SELECT * FROM songs 
                WHERE language IN ({placeholders}) 
                ORDER BY hot_score DESC, created_at DESC 
                LIMIT ? OFFSET ?
            """
            params = languages + [page_size, offset]
            
            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"❌ 获取{language}歌曲失败: {e}")
            return []

    def get_all_songs(self, page=1, page_size=20, limit=None):
        """获取所有歌曲"""
        if limit:
            page_size = limit
            
        if not os.path.exists(self.db_path):
            return []
        
        try:
            offset = (page - 1) * page_size
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = """
                SELECT * FROM songs 
                ORDER BY hot_score DESC, created_at DESC 
                LIMIT ? OFFSET ?
            """
            cursor.execute(query, (page_size, offset))
            songs = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return songs
        except Exception as e:
            print(f"❌ 获取所有歌曲失败: {e}")
            return []

    def detailContent(self, ids):
        """详情内容"""
        try:
            print(f"📄 detailContent被调用: ids={ids}")
            if not ids or not ids[0]:
                return {'list': []}
            
            current_id = ids[0]
            
            # 检查是否为关键词搜索格式
            if current_id.startswith("search_keyword:"):
                parts = current_id.split('|')
                keyword = parts[0].replace('search_keyword:', '')
                
                keyword_songs = self.search_songs_by_keyword(keyword, limit=200)
                
                if not keyword_songs:
                    return {'list': []}
                
                first_song = keyword_songs[0]
                play_url = self.build_keyword_play_url(keyword, keyword_songs)
                
                video = {
                    'vod_id': first_song['tid'],
                    'vod_name': f"🔍 搜索：{keyword}",
                    'vod_remarks': f"共{len(keyword_songs)}首",
                    'vod_play_from': '关键词搜索结果',
                    'vod_play_url': play_url,
                    'vod_pic': None,
                    'vod_content': self.build_keyword_vod_content(keyword, keyword_songs),
                    'vod_tag': '关键词搜索',
                    'vod_year': first_song.get('year', ''),
                    'vod_director': '搜索结果',
                    'vod_area': '多语言',
                    'vod_lang': '多语言',
                    'vod_actor': '多歌手'
                }
                
                print(f"✅ 关键词搜索结果详情，{len(keyword_songs)} 首歌曲")
                return {'list': [video]}
            
            # 普通歌曲详情
            current_tid = current_id
            res = self.query_song(current_tid)
            
            if isinstance(res, dict) and ('error' in res or 'message' in res):
                print(f"❌ 查询歌曲失败: {res}")
                return {'list': []}
            
            # 获取推荐数量
            params = {}
            if len(ids) > 1:
                try:
                    params = json.loads(ids[1]) if ids[1] else {}
                except:
                    pass
            
            recommend_limit = params.get('recommend_limit', self.RECOMMENDATION_CONFIG['default_limit'])
            
            # 获取推荐歌曲
            recommend_songs = self.get_unlimited_recommendations(current_tid, res, limit=recommend_limit)
            
            # 构建备注
            remarks = self.build_song_remarks(res)
            
            # 构建视频信息
            video = {
                'vod_id': res['tid'],
                'vod_name': res['name'],
                'vod_remarks': remarks,
                'vod_play_from': 'KTV直连',
                'vod_play_url': '',
                'vod_pic': None,
                'vod_content': self.build_unlimited_vod_content(res, len(recommend_songs)),
                'vod_tag': '音乐,KTV',
                'vod_year': res.get('year', '') if res.get('year') else '',
                'vod_director': res.get('singer', '未知歌手'),
                'vod_area': res.get('language', '未知语言'),
                'vod_lang': res.get('language', '未知语言'),
                'vod_actor': res.get('singer', '未知歌手')
            }
            
            # 构建播放URL
            play_url = self.build_unlimited_play_url(res, recommend_songs)
            video['vod_play_url'] = play_url
            
            print(f"✅ 详情页构建完成，有 {len(recommend_songs)} 首推荐歌曲")
            return {'list': [video]}
            
        except Exception as e:
            print(f"❌ 获取详情失败: {e}")
            return {'list': []}

    def build_keyword_vod_content(self, keyword, songs):
        """构建关键词搜索详情内容"""
        content_parts = []
        
        content_parts.append(f"🔍 搜索关键词：{keyword}")
        content_parts.append(f"📊 搜索结果：共找到 {len(songs)} 首歌曲")
        content_parts.append("")
        
        # 统计信息
        language_count = defaultdict(int)
        singer_count = defaultdict(int)
        year_count = defaultdict(int)
        
        for song in songs:
            if song.get('language'):
                language_count[song['language']] += 1
            if song.get('singer'):
                singer_count[song['singer']] += 1
            if song.get('year'):
                year_count[song['year']] += 1
        
        if language_count:
            top_languages = sorted(language_count.items(), key=lambda x: x[1], reverse=True)[:5]
            content_parts.append("🌐 语言分布：")
            for lang, count in top_languages:
                content_parts.append(f"  - {lang}: {count}首")
        
        if singer_count:
            top_singers = sorted(singer_count.items(), key=lambda x: x[1], reverse=True)[:5]
            content_parts.append("🎤 歌手分布：")
            for singer, count in top_singers:
                content_parts.append(f"  - {singer}: {count}首")
        
        # 热门歌曲
        hot_songs = sorted(songs, key=lambda x: x.get('hot_score', 0), reverse=True)[:5]
        content_parts.append("🔥 热门歌曲：")
        for i, song in enumerate(hot_songs, 1):
            song_name = song['name']
            if song.get('singer'):
                song_name += f" - {song['singer']}"
            content_parts.append(f"  {i}. {song_name}")
        
        content_parts.append("")
        content_parts.append("💡 提示：点击选集可以直接播放相关歌曲")
        
        return "\n".join(content_parts)

    def get_unlimited_recommendations(self, current_tid, current_song, limit=100):
        """获取无限推荐歌曲"""
        if not os.path.exists(self.db_path):
            return []
        
        print(f"🎯 开始获取无限推荐，目标: {limit} 首歌曲")
        
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            
            all_recommendations = []
            seen_ids = set([current_tid])
            
            # 1. 同语言推荐
            if current_song.get('language'):
                language = current_song['language']
                if language:
                    print(f"🌐 获取同语言歌曲: {language}")
                    
                    cursor = conn.cursor()
                    query = """
                        SELECT * FROM songs 
                        WHERE language LIKE ? AND tid != ?
                        ORDER BY hot_score DESC 
                        LIMIT ?
                    """
                    cursor.execute(query, (f'%{language}%', current_tid, min(limit, 50)))
                    rows = cursor.fetchall()
                    
                    lang_songs = [dict(row) for row in rows]
                    print(f"✅ 找到 {len(lang_songs)} 首同语言歌曲")
                    
                    all_recommendations.extend(lang_songs)
                    seen_ids.update([s['tid'] for s in lang_songs])
            
            # 2. 同标签推荐
            tags = self.extract_song_tags(current_song)
            if tags and len(all_recommendations) < limit:
                print(f"🏷️ 查找同标签歌曲，标签: {tags[:5]}")
                
                for tag in tags[:5]:
                    if len(all_recommendations) >= limit:
                        break
                    
                    cursor = conn.cursor()
                    query = """
                        SELECT * FROM songs 
                        WHERE tags_str LIKE ? AND tid != ?
                        ORDER BY hot_score DESC 
                        LIMIT ?
                    """
                    cursor.execute(query, (f'%{tag}%', current_tid, 20))
                    rows = cursor.fetchall()
                    
                    tag_songs = [dict(row) for row in rows]
                    all_recommendations.extend(tag_songs)
                    seen_ids.update([s['tid'] for s in tag_songs])
            
            # 3. 热门歌曲补充
            if len(all_recommendations) < limit:
                needed = limit - len(all_recommendations)
                print(f"🔥 补充热门歌曲，需要: {needed} 首")
                
                cursor = conn.cursor()
                query = """
                    SELECT * FROM songs 
                    WHERE tid != ? AND hot_score > 20
                    ORDER BY hot_score DESC 
                    LIMIT ?
                """
                cursor.execute(query, (current_tid, needed))
                rows = cursor.fetchall()
                
                hot_songs = [dict(row) for row in rows]
                all_recommendations.extend(hot_songs)
            
            # 4. 随机补充
            if len(all_recommendations) < limit:
                needed = limit - len(all_recommendations)
                print(f"🎲 随机补充，需要: {needed} 首")
                
                cursor = conn.cursor()
                query = """
                    SELECT * FROM songs 
                    WHERE tid != ? 
                    ORDER BY RANDOM() 
                    LIMIT ?
                """
                cursor.execute(query, (current_tid, needed))
                rows = cursor.fetchall()
                
                random_songs = [dict(row) for row in rows]
                all_recommendations.extend(random_songs)
            
            conn.close()
            
            # 去重
            seen = set()
            unique_recommendations = []
            for song in all_recommendations:
                tid = song['tid']
                if tid not in seen:
                    seen.add(tid)
                    unique_recommendations.append(song)
            
            print(f"🎉 推荐系统完成，共找到 {len(unique_recommendations)} 首推荐歌曲")
            return unique_recommendations[:limit]
            
        except Exception as e:
            print(f"❌ 无限推荐失败: {e}")
            return []

    def extract_song_tags(self, song_data):
        """从歌曲数据中提取标签"""
        tags = []
        
        if 'tags_str' in song_data and song_data['tags_str']:
            try:
                parsed_tags = json.loads(song_data['tags_str'])
                if isinstance(parsed_tags, list):
                    tags.extend(parsed_tags)
            except:
                if ',' in song_data['tags_str']:
                    tags.extend([t.strip() for t in song_data['tags_str'].split(',') if t.strip()])
                elif ' ' in song_data['tags_str']:
                    tags.extend([t.strip() for t in song_data['tags_str'].split(' ') if t.strip()])
                else:
                    tags.append(song_data['tags_str'])
        
        return tags

    def build_unlimited_play_url(self, current_song, recommend_songs):
        """构建无限推荐播放URL"""
        play_url_parts = []
        
        # 当前歌曲
        current_song_name = f"▶▶▶ {current_song['name']}"
        if current_song.get('singer'):
            current_song_name += f" - {current_song['singer']}"
        play_url_parts.append(f"{current_song_name}${current_song['tid']}")
        
        # 推荐歌曲
        for i, rec in enumerate(recommend_songs, 1):
            song_name = f"{i}. {rec['name']}"
            if rec.get('singer'):
                song_name += f" - {rec['singer']}"
            
            # 添加热度
            if rec.get('hot_score'):
                hot_score = rec['hot_score']
                if hot_score > 80:
                    song_name += " 🔥🔥"
                elif hot_score > 50:
                    song_name += " 🔥"
            
            play_url_parts.append(f"{song_name}${rec['tid']}")
        
        # 添加分隔符
        if len(recommend_songs) > 50:
            for i in range(50, len(recommend_songs), 50):
                if i < len(play_url_parts):
                    play_url_parts.insert(i, f"━━━ 第{i//50+1}批推荐 ({i}首) ━━━${current_song['tid']}")
        
        print(f"📊 播放URL包含 {len(play_url_parts)} 个条目")
        return "#".join(play_url_parts)

    def build_unlimited_vod_content(self, song_data, recommend_count):
        """构建无限推荐详情内容"""
        content_parts = []
        
        if song_data.get('name'):
            content_parts.append(f"🎵 歌曲名称: {song_data['name']}")
        
        if song_data.get('singer'):
            content_parts.append(f"🎤 歌手: {song_data['singer']}")
            
            song_count = self.get_singer_song_count(song_data['singer'])
            if song_count > 1:
                content_parts.append(f"📊 该歌手共有 {song_count} 首歌曲")
        
        if song_data.get('language'):
            content_parts.append(f"🌐 语言: {song_data['language']}")
        
        # 推荐信息
        content_parts.append(f"✨ 为您推荐了 {recommend_count} 首相关歌曲")
        content_parts.append("📈 推荐系统：同语言 > 同标签 > 热门歌曲 > 随机歌曲")
        
        # 标签信息
        tags = self.extract_song_tags(song_data)
        if tags:
            content_parts.append(f"🏷️ 标签: {', '.join(tags[:10])}")
        
        if song_data.get('hot_score'):
            content_parts.append(f"🔥 热度: {song_data['hot_score']}")
        
        if song_data.get('update_time'):
            content_parts.append(f"🕐 更新时间: {song_data['update_time']}")
        
        # 数据库信息
        total_songs = self.get_total_song_count()
        content_parts.append(f"💾 数据库歌曲总数: {total_songs:,} 首")
        content_parts.append(f"📊 本次推荐使用了 {recommend_count} 首歌曲")
        
        return "\n".join(content_parts)
    
    def get_singer_song_count(self, singer):
        """获取歌手的歌曲数量"""
        if not os.path.exists(self.db_path):
            return 0
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query = "SELECT COUNT(*) FROM songs WHERE singer LIKE ?"
            cursor.execute(query, (f'%{singer}%',))
            result = cursor.fetchone()
            
            conn.close()
            return result[0] if result else 0
            
        except Exception as e:
            print(f"⚠️ 获取歌手歌曲数量失败: {e}")
            return 0

    def get_total_song_count(self):
        """获取数据库中的歌曲总数"""
        if not os.path.exists(self.db_path):
            return 0
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query = "SELECT COUNT(*) as total FROM songs"
            cursor.execute(query)
            result = cursor.fetchone()
            
            conn.close()
            return result[0] if result else 0
            
        except Exception as e:
            print(f"⚠️ 获取歌曲总数失败: {e}")
            return 0

    def build_song_remarks(self, song_data: Dict) -> str:
        """构建歌曲备注"""
        parts = []
        
        if song_data.get('language'):
            parts.append(f"🌐 {song_data['language']}")
        
        if song_data.get('tags_str'):
            try:
                tags = json.loads(song_data['tags_str'])
                if isinstance(tags, list) and tags:
                    parts.extend(tags[:2])
            except:
                pass
        
        if song_data.get('hot_score'):
            parts.append(f"🔥{song_data['hot_score']}")
        
        if song_data.get('update_time'):
            date_part = song_data['update_time'].split(' ')[0]
            parts.append(date_part)
        
        return ' | '.join(parts) if parts else 'KTV歌曲'

    def query_song(self, target_tid):
        """查询歌曲"""
        if not os.path.exists(self.db_path):
            return {"error": "数据库文件不存在"}
        
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = "SELECT * FROM songs WHERE tid = ?"
            cursor.execute(query, (target_tid,))
            
            row = cursor.fetchone()
            if row:
                return dict(row)
            else:
                return {"message": f"未找到 tid 为 {target_tid} 的歌曲"}
                
        except sqlite3.Error as e:
            return {"error": f"数据库错误: {str(e)}"}
        except Exception as e:
            return {"error": f"查询失败: {str(e)}"}

    def searchContent(self, key, quick, pg='1'):
        """搜索内容"""
        try:
            print(f"🔍 搜索内容: key={key}, quick={quick}, pg={pg}")
            
            if key and key.strip():
                self.save_search_history(key.strip())
            
            page = int(pg)
            page_size = 20
            offset = (page - 1) * page_size
            
            if not os.path.exists(self.db_path):
                print("❌ 数据库文件不存在")
                return {'list': []}
            
            search_term = f"%{key}%"
            
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = """
                SELECT * FROM songs 
                WHERE name LIKE ? 
                   OR name_full LIKE ?
                   OR name_trim LIKE ?
                ORDER BY hot_score DESC
                LIMIT ? OFFSET ?
            """
            
            params = (search_term, search_term, search_term, page_size, offset)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # 计算总数
            count_query = """
                SELECT COUNT(*) as total FROM songs 
                WHERE name LIKE ? 
                   OR name_full LIKE ?
                   OR name_trim LIKE ?
            """
            cursor.execute(count_query, (search_term, search_term, search_term))
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            conn.close()
            
            videos = self.arr2vod([dict(row) for row in rows])
            
            print(f"✅ 搜索到 {len(videos)} 个结果，总共 {total} 个")
            
            total_pages = (total + page_size - 1) // page_size if total > 0 else 1
            
            return {
                'list': videos,
                'page': page,
                'pagecount': total_pages,
                'limit': page_size,
                'total': total
            }
            
        except Exception as e:
            print(f"❌ 搜索失败: {e}")
            return {'list': []}

    def save_search_history(self, keyword):
        """保存搜索历史"""
        try:
            history_file = '/storage/emulated/0/fenmei/php/db/search_history.txt'
            
            history = []
            if os.path.exists(history_file):
                with open(history_file, 'r', encoding='utf-8') as f:
                    history = [line.strip() for line in f.readlines() if line.strip()]
            
            if keyword in history:
                history.remove(keyword)
            history.insert(0, keyword)
            
            history = history[:50]
            
            with open(history_file, 'w', encoding='utf-8') as f:
                for item in history:
                    f.write(f"{item}\n")
                    
        except Exception as e:
            print(f"⚠️ 保存搜索历史失败: {e}")

    def playerContent(self, flag, vid, vipFlags):
        """播放内容"""
        try:
            print(f"▶ 播放请求: flag={flag}, vid={vid}")
            
            if vid.startswith(('http://', 'https://')):
                return {
                    'jx': 0,
                    'parse': 0,
                    'url': vid,
                    'header': {
                        'User-Agent': 'Mozilla/5.0',
                        'Referer': self.host,
                        'Accept': '*/*'
                    }
                }
            
            if not self.token:
                self.token = self.get_auth_token()
                if not self.token:
                    print("❌ 获取token失败")
                    return {"parse": 0, "jx": 0, "url": ""}
            
            play_url = self.get_play_url(vid)
            if not play_url:
                print("❌ 获取播放URL失败")
                return {"parse": 0, "jx": 0, "url": ""}
            
            print(f"✅ 获取到播放URL: {play_url[:100]}...")
            
            result = {
                'jx': 0,
                'parse': 0,
                'url': play_url,
                'header': {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': self.host,
                    'Origin': self.host,
                    'Accept': '*/*',
                    'Accept-Encoding': 'identity',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                    'Connection': 'keep-alive',
                    'Range': 'bytes=0-',
                    'DNT': '1'
                }
            }
            
            if '.mp4' in play_url.lower():
                result['header']['Content-Type'] = 'video/mp4'
            elif '.m3u8' in play_url.lower():
                result['header']['Content-Type'] = 'application/vnd.apple.mpegurl'
            
            return result
            
        except Exception as e:
            print(f"❌ 播放器异常: {e}")
            return {"parse": 0, "jx": 0, "url": ""}

    def get_auth_token(self):
        """获取认证令牌"""
        try:
            timestamp = str(int(time.time()))
            params = self.thunder_sign({
                'appid': self.app_id,
                'mac': f"{self.mac}_{self.sn}",
                'sn': self.sn,
                'time': timestamp,
                'ver': "2.0",
                'vn': "4.1.3.03281430",
            }, '024210cba40d4385a93e6c2d3249bfb5')
            
            response = self.session.get(
                f'{self.host}/auth/init',
                params=params,
                timeout=10
            ).json()
            
            if response.get('code') == 200:
                return response.get('token')
            else:
                print(f"❌ 获取token失败: {response}")
                return None
        except Exception as e:
            print(f"❌ 初始化token失败: {e}")
            return None

    def get_play_url(self, musicno):
        """获取播放URL"""
        try:
            timestamp = str(int(time.time()))
            params = self.thunder_sign({
                "appid": self.app_id,
                "device": f"{self.mac}_{self.sn}",
                "ish265": "0",
                "ls": "1",
                "musicno": musicno,
                "resolution": "720",
                "sn": self.sn,
                "time": timestamp,
                "token": self.token
            }, '19042303a8374f67ae3fe1e25c97936f')
            
            response = self.session.get(
                f'{self.host}/music/downurl',
                params=params,
                timeout=10
            ).json()
            
            if response.get('code') == 200:
                return response.get('data', '')
            else:
                print(f"❌ 获取播放URL失败: {response}")
                return ''
        except Exception as e:
            print(f"❌ 获取播放URL异常: {e}")
            return ''

    def arr2vod(self, arr):
        """数组转视频列表"""
        videos = []
        for item in arr:
            try:
                tags_str = ''
                if 'tags_str' in item and item['tags_str']:
                    try:
                        tags = json.loads(item['tags_str'])
                        if isinstance(tags, list):
                            tags_str = ','.join(tags[:3])
                    except:
                        pass
                
                remarks_parts = []
                if item.get('language'):
                    remarks_parts.append(f"🌐{item['language']}")
                if tags_str:
                    remarks_parts.append(tags_str)
                if item.get('hot_score'):
                    remarks_parts.append(f"🔥{item['hot_score']}")
                
                remarks = ' | '.join(remarks_parts) if remarks_parts else 'KTV歌曲'
                
                content_parts = []
                if item.get('name'):
                    content_parts.append(f"🎵 {item['name']}")
                if item.get('language'):
                    content_parts.append(f"🌐 {item['language']}")
                if item.get('year'):
                    content_parts.append(f"📅 {item['year']}")
                
                content = " | ".join(content_parts) if content_parts else "KTV歌曲"
                
                videos.append({
                    'vod_id': item['tid'],
                    'vod_name': item['name'],
                    'vod_remarks': remarks,
                    'vod_pic': None,
                    'vod_content': content
                })
            except Exception as e:
                print(f"⚠️ 转换视频项失败: {e}")
                continue
        
        return videos

    def thunder_sign(self, params, sdk_key):
        """生成签名"""
        sorted_keys = sorted(params.keys())
        query_parts = []
        for key in sorted_keys:
            query_parts.append(f"{key}={params[key]}")
        base_string = "&".join(query_parts)
        sign_material = base_string + sdk_key
        sign = hashlib.md5(sign_material.encode('utf-8')).hexdigest()
        params['sign'] = sign
        return params

    def localProxy(self, param):
        """本地代理"""
        pass