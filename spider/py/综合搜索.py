"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '本地归类搜索_双控版',
  lang: 'hipy'
})
"""

# -*- coding: utf-8 -*-
import os, base64, re, gc, threading
from concurrent.futures import ThreadPoolExecutor
from base.spider import Spider

class Spider(Spider):
    # ==========================================
    # 🔍 【关键字设置】
    # ==========================================
    SEARCH_KEY = "淫荡"       #这里输入你要搜索的关键字
# ==========================================
    # 🎯 开关说明：在路径前加 # 号即可【关闭】该目录的搜索
 # ==========================================   
    # 🏠 【内部存储开关】 (/storage/emulated/0/VodPlus/wwwroot/lz)
    INT_PATH_CONFIG = [
      "lz/json",      #前面加#号，就是阻止搜索这个文件夹
      "lz/m3u",      #前面加#号，就是阻止搜索这个文件夹
      "lz/txt"        #前面加#号，就是阻止搜索这个文件夹
    ]
 # ==========================================
    # 💾 【外部存储开关】 (SD卡/USB挂载)
    EXT_PATH_CONFIG = [
            # "lz/json",     #前面加#号，就是阻止搜索这个文件夹
            # "lz/m3u",   #前面加#号，就是阻止搜索这个文件夹
            # "lz/txt"        #前面加#号，就是阻止搜索这个文件夹
    ]
    # ==========================================

    def init(self, extend):
        self.base_paths = []
        
        # 1. 处理内部存储：仅添加未被 # 屏蔽的路径
        for path in self.INT_PATH_CONFIG:
            if not path.startswith("#"):
                full_p = os.path.join("/storage/emulated/0/peekpili/php-scripts", path)
                if os.path.isdir(full_p):
                    self.base_paths.append(full_p)

        # 2. 处理外部存储：扫描所有挂载盘，仅添加对应的未屏蔽路径
        active_ext_subs = [p for p in self.EXT_PATH_CONFIG if not p.startswith("#")]
        if active_ext_subs:
            try:
                if os.path.exists("/storage"):
                    for folder in os.listdir("/storage"):
                        # 跳过系统盘和内部存储
                        if folder not in ["emulated", "self", "knox", "sdcard0", "container"]:
                            sd_root = os.path.join("/storage", folder)
                            for sub in active_ext_subs:
                                full_sd_p = os.path.join(sd_root, sub)
                                if os.path.isdir(full_sd_p):
                                    self.base_paths.append(full_sd_p)
            except: pass

        self.cache_list = []
        self.total_links = 0
        self.did_search = False
        self._lock = threading.Lock() 
        self.inited = True

    def getName(self):
        return "本地归类搜索_双控版"

    def _scan_single_file(self, fp, kw_b, low_f):
        """流式闪读+精准计数"""
        try:
            CHUNK_SIZE = 64 * 1024
            found = False
            with open(fp, 'rb') as f_obj:
                while True:
                    chunk = f_obj.read(CHUNK_SIZE)
                    if not chunk: break
                    if kw_b in chunk.lower():
                        found = True
                        break
            if found:
                with open(fp, 'rb') as f_obj:
                    raw = f_obj.read()
                    if low_f.endswith('.json'):
                        count = len(re.findall(rb'"vod_name"\s*:\s*"[^"]*' + re.escape(kw_b) + rb'[^"]*"', raw, re.IGNORECASE))
                    else:
                        count = sum(1 for line in raw.split(b'\n') if kw_b in line.lower() and b'://' in line)
                if count > 0:
                    return {"fp": fp, "count": count, "ext": low_f.split('.')[-1]}
        except: pass
        return None

    def _execute_search(self):
        if self.did_search: return
        with self._lock:
            if self.did_search: return
            kw = self.SEARCH_KEY.strip().lower()
            if not kw: return
            
            kw_b = kw.encode('utf-8')
            file_tasks = []
            
            # 第一阶段：路径收集 (基于 init 过滤后的 base_paths)
            for path in self.base_paths:
                if not os.path.exists(path): continue
                for root, _, fs in os.walk(path):
                    for f in fs:
                        low_f = f.lower()
                        if low_f.endswith(('.json', '.m3u', '.txt')):
                            file_tasks.append((os.path.join(root, f), low_f))

            # 第二阶段：8线程并发，压榨CPU极限
            res = []
            local_total_links = 0
            with ThreadPoolExecutor(max_workers=8) as executor:
                futures = [executor.submit(self._scan_single_file, fp, kw_b, low_f) for fp, low_f in file_tasks]
                for future in futures:
                    item = future.result()
                    if item:
                        fp = item['fp']
                        count = item['count']
                        clean_name = re.sub(r'\.(m3u|txt|json|txt\.m3u|m3u\.txt)$', '', os.path.basename(fp), flags=re.I)
                        
                        # 图标逻辑
                        if '.json' in fp.lower(): pic = "https://img.icons8.com/color/200/json--v1.png"
                        elif '.m3u' in fp.lower(): pic = "https://img.icons8.com/color/200/opened-folder.png"
                        else: pic = "https://img.icons8.com/color/200/txt.png"
                        
                        remarks = f"匹配{count}条"
                        if "/emulated/0" not in fp: remarks += " ☆"
                        
                        res.append({"n": clean_name, "p": pic, "f": remarks, "path": fp, "ext": item['ext'], "c": count})
                        local_total_links += count

            self.cache_list = res
            self.total_links = local_total_links
            self.did_search = True
            gc.collect()

    def homeContent(self, filter):
        self._execute_search()
        total_files = len(self.cache_list)
        limit = 40
        pages = (total_files + limit - 1) // limit
        classes = [{"type_id": f"p_{i}", "type_name": f"搜索{i*limit+1}-{min((i+1)*limit, total_files)} 共{total_files}个 {self.total_links}条"} for i in range(pages)]
        return {"class": classes if classes else [{"type_id":"n","type_name":"无结果，请检查开关"}]}

    def categoryContent(self, tid, pg, filter, ext):
        if str(pg) != "1": return {"page": pg, "pagecount": pg, "limit": 40, "total": 0, "list": []}
        self._execute_search()
        if not tid.startswith("p_") or not self.cache_list: return {"list": []}
        idx = int(tid.split('_')[1])
        limit = 40
        page_data = self.cache_list[idx*limit : (idx+1)*limit]
        v_list = [{"vod_id": base64.b64encode(f"{i['ext']}|{i['path']}|{i['c']}".encode()).decode(), "vod_name": i['n'], "vod_pic": i['p'], "vod_remarks": i['f']} for i in page_data]
        return {"page": 1, "pagecount": 1, "limit": limit, "total": len(page_data), "list": v_list}

    def detailContent(self, array):
        try:
            raw = base64.b64decode(array[0]).decode()
            ext, f_path, f_count = raw.split('|', 2)
            kw = self.SEARCH_KEY.lower()
            enc = 'utf-8'
            with open(f_path, 'rb') as f:
                head = f.read(2048)
                for e in ['utf-8', 'gb18030', 'cp936']:
                    try: head.decode(e); enc = e; break
                    except: pass
            play_urls = []
            if ext == "json":
                pattern = re.compile(rb'\{[^{}]*"vod_name"\s*:\s*"([^"]+)"[^{}]*"vod_play_url"\s*:\s*"([^"]+)"[^{}]*\}')
                with open(f_path, 'rb') as f:
                    content = f.read()
                    matches = pattern.findall(content)
                    for m_n, m_u in matches:
                        n_str = m_n.decode(enc, 'ignore').strip()
                        if kw in n_str.lower():
                            u_str = m_u.decode(enc, 'ignore').strip()
                            play_urls.append(f"{n_str}${u_str}")
            else:
                temp_name = ""
                with open(f_path, 'r', encoding=enc, errors='ignore') as f:
                    for line in f:
                        line = line.strip()
                        if not line: continue
                        if line.upper().startswith("#EXTINF"):
                            temp_name = line.split(",")[-1].strip()
                        elif "://" in line and not line.startswith("#"):
                            if kw in line.lower() or (temp_name and kw in temp_name.lower()):
                                n_v = temp_name if temp_name else (line.split(',')[0] if ',' in line else "线路")
                                u_v = line.split(',')[-1] if ',' in line else line
                                play_urls.append(f"{n_v.strip()}${u_v.strip()}")
                            temp_name = ""
            
            clean_name = re.sub(r'\.(m3u|txt|json|txt\.m3u|m3u\.txt)$', '', os.path.basename(f_path), flags=re.I)
            info_text = f"⚡路径: {f_path}     |       搜索结果: 共匹配{len(play_urls)}条"
            return {"list": [{"vod_name": clean_name, "vod_play_from": "归类搜索", "vod_play_url": "#".join(play_urls), "vod_remarks": f"匹配{f_count}条", "vod_content": info_text}]}
        except: pass
        return {"list": []}

    def playerContent(self, flag, id, vipFlags):
        return {"url": id.split('$')[-1].strip(), "parse": 0}