import subprocess
import sqlite3
import json
import os
import sys
import time
import argparse
import threading
import queue
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# --- 用户配置区域 (User Configuration) ---
# 默认使用的PHP爬虫文件路径
# 获取当前脚本所在目录
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# 获取项目根目录 (假设脚本在 scripts/python，根目录在 ../../)
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../"))
DEFAULT_SPIDER = os.path.join(SCRIPT_DIR, "74P福利图 ᵈᶻ[画].php")

# 每个分类默认最大爬取页数 (设置为 0 或 None 表示不限制，直到爬完)
DEFAULT_MAX_PAGES = 1
# 默认并发线程数
DEFAULT_THREADS = 8
# 是否解析最终播放地址 (True: 解析并存入resolved_url, False: 只存入原始链接)
RESOLVE_FINAL_URLS = True
# PHP 命令路径
PHP_CMD = "php"
# 桥接脚本路径
BRIDGE_SCRIPT = os.path.join(SCRIPT_DIR, "_crawler_bridge.php")

# --- 数据库管理 (Database Manager) ---
class DBManager:
    def __init__(self, db_path):
        # check_same_thread=False 允许在多线程中使用同一个连接，但需要我们自己加锁
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        self.lock = threading.Lock()
        self.init_tables()
        self._source_cache = {}

    def init_tables(self):
        with self.lock:
            # 优化：移除 source_file 字段 (假设每个DB只对应一个源)
            # 优化：移除 type_name (通过关联查询获取)
            # 优化：crawled_at 使用 INTEGER 时间戳
            
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                tid TEXT PRIMARY KEY,
                name TEXT
            )
            ''')
            
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS vods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vod_id TEXT UNIQUE,
                vod_name TEXT,
                type_id TEXT,
                vod_pic TEXT,
                vod_remarks TEXT,
                vod_content TEXT,
                crawled_at INTEGER,
                FOREIGN KEY(type_id) REFERENCES categories(tid)
            )
            ''')
            
            # 新增：播放源表 (归一化 play_from)
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS play_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE
            )
            ''')

            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vod_pk INTEGER,
                sid INTEGER,
                name TEXT,
                raw_url TEXT,
                resolved_url TEXT,
                FOREIGN KEY(vod_pk) REFERENCES vods(id),
                FOREIGN KEY(sid) REFERENCES play_sources(id)
            )
            ''')
            self.conn.commit()

    def get_or_create_source(self, name):
        # 简单缓存
        if name in self._source_cache:
            return self._source_cache[name]
            
        with self.lock:
            try:
                self.cursor.execute('INSERT OR IGNORE INTO play_sources (name) VALUES (?)', (name,))
                self.cursor.execute('SELECT id FROM play_sources WHERE name = ?', (name,))
                row = self.cursor.fetchone()
                if row:
                    sid = row[0]
                    self._source_cache[name] = sid
                    return sid
                return 0
            except Exception as e:
                print(f"[DB Error] get_or_create_source: {e}")
                return 0

    def save_category(self, tid, name):
        with self.lock:
            try:
                self.cursor.execute('INSERT OR IGNORE INTO categories (tid, name) VALUES (?, ?)', 
                                    (tid, name))
                # 如果名称更新了，也可以 update
                self.cursor.execute('UPDATE categories SET name = ? WHERE tid = ? AND name != ?', (name, tid, name))
                self.conn.commit()
            except Exception as e:
                print(f"[DB Error] save_category: {e}")

    def item_exists(self, vod_id):
        with self.lock:
            try:
                self.cursor.execute('SELECT 1 FROM vods WHERE vod_id = ?', (vod_id,))
                return self.cursor.fetchone() is not None
            except Exception as e:
                print(f"[DB Error] item_exists: {e}")
                return False

    def save_vod(self, data):
        with self.lock:
            try:
                self.cursor.execute('''
                INSERT OR REPLACE INTO vods (vod_id, vod_name, type_id, vod_pic, vod_remarks, vod_content, crawled_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    data.get('vod_id'),
                    data.get('vod_name'),
                    data.get('type_id'),
                    data.get('vod_pic'),
                    data.get('vod_remarks'),
                    data.get('vod_content'),
                    int(time.time())
                ))
                vod_pk = self.cursor.lastrowid
                if vod_pk == 0: 
                     self.cursor.execute('SELECT id FROM vods WHERE vod_id = ?', (data.get('vod_id'),))
                     res = self.cursor.fetchone()
                     if res: vod_pk = res[0]
                
                self.conn.commit()
                return vod_pk
            except Exception as e:
                print(f"[DB Error] save_vod: {e}")
                return None

    def save_episodes(self, vod_pk, episodes):
        # 预处理 source_id 以减少锁内操作时间
        # 但 get_or_create_source 本身也加锁，所以这里可以先收集
        processed_eps = []
        for ep in episodes:
            sid = self.get_or_create_source(ep['play_from'])
            processed_eps.append((sid, ep['name'], ep['url'], ep.get('resolved_url', '')))

        with self.lock:
            try:
                self.cursor.execute('DELETE FROM episodes WHERE vod_pk = ?', (vod_pk,))
                self.cursor.executemany('''
                INSERT INTO episodes (vod_pk, sid, name, raw_url, resolved_url)
                VALUES (?, ?, ?, ?, ?)
                ''', [(vod_pk, sid, name, raw_url, res_url) for sid, name, raw_url, res_url in processed_eps])
                self.conn.commit()
            except Exception as e:
                print(f"[DB Error] save_episodes: {e}")

    def close(self):
        self.conn.close()

# --- PHP 桥接调用 (PHP Bridge) ---
class PHPBridge:
    def __init__(self, spider_path):
        self.spider_path = spider_path

    def call(self, method, *args):
        # 构建命令
        cmd = [PHP_CMD, BRIDGE_SCRIPT, self.spider_path, method]
        cmd_args = []
        for arg in args:
            if isinstance(arg, (dict, list)):
                cmd_args.append(json.dumps(arg))
            else:
                cmd_args.append(str(arg))
        cmd.extend(cmd_args)
        
        try:
            # subprocess.run 是同步阻塞的，但在多线程中调用是安全的
            result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
            if result.returncode != 0:
                if "Warning" not in result.stderr and "Notice" not in result.stderr:
                     pass 
                return None
            
            output = result.stdout.strip()
            try:
                json_res = json.loads(output)
                if json_res['status'] == 'success':
                    return json_res['data']
                else:
                    return None
            except json.JSONDecodeError:
                return None
                
        except Exception as e:
            print(f"[Bridge Error] {e}")
            return None

# --- 任务追踪器 (Task Tracker) ---
class TaskTracker:
    def __init__(self):
        self.lock = threading.Lock()
        self.cond = threading.Condition(self.lock)
        self.pending = 0

    def add(self, n=1):
        with self.lock:
            self.pending += n

    def done(self):
        with self.lock:
            self.pending -= 1
            if self.pending == 0:
                self.cond.notify_all()

    def wait_until_done(self):
        with self.lock:
            while self.pending > 0:
                self.cond.wait()

# --- 统计与监控 (Stats & Monitor) ---
class Stats:
    def __init__(self):
        self.lock = threading.Lock()
        self.categories_found = 0
        self.pages_scanned = 0
        self.items_found = 0
        self.items_processed = 0
        self.items_skipped = 0
        self.episodes_resolved = 0
        self.errors = 0
        self.start_time = time.time()

    def inc(self, field, count=1):
        with self.lock:
            setattr(self, field, getattr(self, field) + count)

# --- 爬虫逻辑 (Crawler Logic) ---
class Crawler:
    def __init__(self, spider_path, db_path, max_pages=DEFAULT_MAX_PAGES, max_workers=DEFAULT_THREADS):
        self.spider_path = spider_path
        self.bridge = PHPBridge(spider_path)
        self.db = DBManager(db_path)
        self.max_pages = max_pages
        self.max_workers = max_workers
        self.stats = Stats()
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.tracker = TaskTracker()
        self.running = True
        
        # 启动监控线程
        self.monitor_thread = threading.Thread(target=self.monitor_loop, daemon=True)
        self.monitor_thread.start()

    def submit_task(self, func, *args):
        self.tracker.add()
        self.executor.submit(self._wrap_task, func, *args)

    def _wrap_task(self, func, *args):
        try:
            func(*args)
        except Exception as e:
            print(f"[Task Error] {e}")
            self.stats.inc('errors')
        finally:
            self.tracker.done()

    def run(self):
        print(f"🚀 开始并发爬取: {os.path.basename(self.spider_path)}")
        print(f"⚙️  配置: 最大线程={self.max_workers}, 每个分类最大页数={self.max_pages}, 解  析地址={RESOLVE_FINAL_URLS}")
        
        # 1. 获取首页分类
        home_data = self.bridge.call('homeContent', True)
        if not home_data or 'class' not in home_data:
            print("❌ 无法获取分类信息，退出。")
            return

        categories = home_data['class']
        self.stats.categories_found = len(categories)
        print(f"📋 获取到 {len(categories)} 个分类，开始派发任务...")
        
        # 2. 保存分类并派发分类任务
        for cat in categories:
            tid = str(cat['type_id'])
            name = cat['type_name']
            self.db.save_category(tid, name)
            self.submit_task(self.process_category, tid, name)
            
        # 3. 等待所有任务完成
        self.tracker.wait_until_done()
        self.running = False
        
        self.print_final_stats()
        
        # 关闭 executor 和 db
        self.executor.shutdown(wait=True)
        self.db.close()

    def monitor_loop(self):
        while self.running:
            self.print_progress()
            time.sleep(1)

    def print_progress(self):
        elapsed = time.time() - self.stats.start_time
        speed = self.stats.items_processed / elapsed if elapsed > 0 else 0
        # \033[K 清除当前行剩余内容，确保更新时不会有残留字符
        sys.stdout.write(
            f"\r\033[K⏱️  {elapsed:.1f}s | "
            f"Pages: {self.stats.pages_scanned} | "
            f"Items: {self.stats.items_processed}/{self.stats.items_found} | "
            f"Skip: {self.stats.items_skipped} | "
            f"Eps: {self.stats.episodes_resolved} | "
            f"Speed: {speed:.2f} it/s | "
            f"Err: {self.stats.errors}"
        )
        sys.stdout.flush()

    def print_final_stats(self):
        elapsed = time.time() - self.stats.start_time
        print("\n" + "-" * 50)
        print(f"统计报告:")
        print(f"  总耗时: {elapsed:.2f} 秒")
        print(f"  扫描页数: {self.stats.pages_scanned}")
        print(f"  处理资源: {self.stats.items_processed}")
        print(f"  跳过资源: {self.stats.items_skipped}")
        print(f"  解析集数: {self.stats.episodes_resolved}")
        print(f"  错误数量: {self.stats.errors}")
        print("-" * 50)

    def process_category(self, tid, tname):
        cat_data = self.bridge.call('categoryContent', tid, 1, False, {})
        
        if not cat_data or 'list' not in cat_data:
            self.stats.inc('errors')
            return

        items = cat_data.get('list', [])
        self.stats.inc('items_found', len(items))
        self.stats.inc('pages_scanned')
        
        for item in items:
            item['type_id'] = tid
            item['type_name'] = tname
            self.submit_task(self.process_item, item)

        page_count = 0
        if 'pagecount' in cat_data:
            try:
                page_count = int(cat_data['pagecount'])
            except:
                page_count = 9999
        
        # 递归触发第2页（如果需要）
        # 如果明确返回只有1页，则停止；否则只要没达到max_pages就尝试下一页
        if page_count != 1:
            next_page = 2
            if not self.max_pages or next_page <= self.max_pages:
                self.submit_task(self.process_page, tid, tname, next_page)

    def process_page(self, tid, tname, page):
        cat_data = self.bridge.call('categoryContent', tid, page, False, {})
        if not cat_data or 'list' not in cat_data:
            self.stats.inc('errors')
            return
        
        items = cat_data.get('list', [])
        self.stats.inc('items_found', len(items))
        self.stats.inc('pages_scanned')
        
        if len(items) == 0:
            return

        for item in items:
            item['type_id'] = tid
            item['type_name'] = tname
            self.submit_task(self.process_item, item)

        # 提交下一页任务（递归爬取）
        if len(items) > 0:
            next_page = page + 1
            if not self.max_pages or next_page <= self.max_pages:
                self.submit_task(self.process_page, tid, tname, next_page)

    def process_item(self, item):
        vod_id = item['vod_id']
        vod_name = item['vod_name']
        
        # 增量爬取检查：如果数据库中已存在该 vod_id，则跳过
        if self.db.item_exists(vod_id):
            # 即使跳过，也可以尝试更新 type_id (如果之前为空)
            # 但为了性能，这里暂时略过，除非强制更新
            self.stats.inc('items_skipped')
            return
            
        # 详情页爬取
        detail_res = self.bridge.call('detailContent', [vod_id])
        if not detail_res or 'list' not in detail_res or not detail_res['list']:
            self.stats.inc('errors')
            return
            
        vod_data = detail_res['list'][0]
        # 补全可能缺失的字段
        if 'vod_id' not in vod_data: vod_data['vod_id'] = vod_id
        if 'type_id' not in vod_data: vod_data['type_id'] = item.get('type_id')
        
        # 存入 VOD 主表
        vod_pk = self.db.save_vod(vod_data)
        if not vod_pk:
            self.stats.inc('errors')
            return

        self.stats.inc('items_processed')
        
        # 处理播放列表
        play_from_str = vod_data.get('vod_play_from', '')
        play_url_str = vod_data.get('vod_play_url', '')
        
        if not play_from_str or not play_url_str:
            return
            
        play_from_list = play_from_str.split('$$$')
        play_url_list = play_url_str.split('$$$')
        
        all_episodes = []
        
        for i, source_name in enumerate(play_from_list):
            if i >= len(play_url_list): break
            url_text = play_url_list[i]
            
            # 格式: 名字$地址#名字$地址
            episodes = url_text.split('#')
            for ep_str in episodes:
                if '$' in ep_str:
                    ep_name, ep_url = ep_str.split('$', 1)
                else:
                    ep_name, ep_url = '正片', ep_str
                    
                episode = {
                    'play_from': source_name,
                    'name': ep_name,
                    'url': ep_url,
                    'resolved_url': ''
                }
                
                if RESOLVE_FINAL_URLS:
                    play_res = self.bridge.call('playerContent', source_name, ep_url, [])
                    if play_res and 'url' in play_res:
                         episode['resolved_url'] = play_res['url']
                         self.stats.inc('episodes_resolved')
                    else:
                         pass
                
                all_episodes.append(episode)
        
        if all_episodes:
            self.db.save_episodes(vod_pk, all_episodes)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DrPy PHP Spider Concurrent Crawler")
    parser.add_argument("spider", nargs="?", default=DEFAULT_SPIDER, help="PHP spider file path")
    parser.add_argument("-p", "--max-pages", type=int, default=DEFAULT_MAX_PAGES, help="Max pages per category")
    parser.add_argument("-t", "--threads", type=int, default=DEFAULT_THREADS, help="Concurrency threshold (max workers)")
    parser.add_argument("-n", "--no-resolve", action="store_true", help="Skip resolving final playback URLs")
    
    args = parser.parse_args()
    
    if args.no_resolve:
        RESOLVE_FINAL_URLS = False
        
    spider_file = args.spider
    if not os.path.exists(spider_file):
        print(f"Error: File not found: {spider_file}")
        sys.exit(1)
        
    # 根据爬虫文件名生成数据库文件名 (例如: spider.php -> spider.db)
    # 确保数据库文件生成在爬虫文件同级目录
    spider_dir = os.path.dirname(os.path.abspath(spider_file))
    base_name = os.path.splitext(os.path.basename(spider_file))[0]
    db_path = os.path.join(spider_dir, f"{base_name}.db")
    
    print(f"📁 数据库路径: {db_path}")

    crawler = Crawler(spider_file, db_path, args.max_pages, args.threads)
    crawler.run()
