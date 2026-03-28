"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'TXT读取',
  lang: 'hipy'
})
"""

# -*- coding: utf-8 -*-
import os, base64, gc, re
from base.spider import Spider

class Spider(Spider):
    PROTO_M = b'://'
    GENRE_M = b',#genre#'
    COMMA = b','

    def __init__(self):
        super().__init__()
        self.inited = False
        self.cache = {"categories": [], "file_index": {}}
        self.info_cache = {}
        # 初始预设，会在 init 中被自适应配置覆盖
        self.line_limit = 2000     #限制2000条划分一集的清单数量
        self.adaptive_tag = ""

    def getName(self):
        return f"LocalTXT_v34_{self.adaptive_tag}" if self.adaptive_tag else "LocalTXT_v34_Adaptive"

    # --- 恢复核心：三档自适应逻辑 ---
    def _get_adaptive_config(self):
        total_kb = 0
        try:
            with open('/proc/meminfo', 'r') as f:
                content = f.read()
                m = re.search(r'MemTotal:\s+(\d+)', content)
                if m: total_kb = int(m.group(1))
        except: total_kb = 2097152 # 默认2G
        
        if total_kb <= 3145728: # ≤3GB (低端盒子)
            return {"limit": 2000, "tag": "Eco"}
        elif total_kb < 25165824: # 3GB - 24GB (主流设备)
            return {"limit": 8000, "tag": "Balance"}
        else: # ≥24GB (旗舰设备)
            return {"limit": 30000, "tag": "Ultra"}

    def _format_size(self, size_bytes):
        if size_bytes < 1024: return f"{int(size_bytes)}B"
        if size_bytes < 1048576: return f"{int(size_bytes/1024)}K"  
        return f"{size_bytes/1048576:.1f}M"

    def _get_file_base_stats(self, f_path):
        try:
            st = os.stat(f_path)
            if f_path in self.info_cache and self.info_cache[f_path]['mtime'] == st.st_mtime:
                return self.info_cache[f_path]
            
            g_count, l_count = 0, 0
            with open(f_path, 'rb') as f:
                while True:
                    buf = f.read(512 * 1024)
                    if not buf: break
                    g_count += buf.count(self.GENRE_M)
                    l_count += buf.count(self.PROTO_M)
            
            f_size_str = self._format_size(st.st_size)
            res_rem = f"{f_size_str} {max(1, g_count)}类 {l_count}条"
            data = {'mtime': st.st_mtime, 'rem': res_rem, 'count': l_count, 'size_str': f_size_str}
            self.info_cache[f_path] = data
            return data
        except: return {'rem': "0B 0类 0条", 'count': 0, 'size_str': "0B"}

    def init(self, extend):
        if self.inited: return
        # --- 缝合自适应联动 ---
        config = self._get_adaptive_config()
        self.line_limit = config["limit"]
        self.adaptive_tag = config["tag"]

        roots = [extend.strip()] if extend else ["/storage/emulated/0/peekpili/php-scripts/lz/txt", "/storage"]
        all_cats, all_index = [], {}
        unique_roots = set()

        for r in roots:
            if not os.path.exists(r): continue
            try: r = os.path.realpath(r)
            except: pass
            if r in unique_roots: continue
            unique_roots.add(r)
            
            is_int = "emulated/0" in r
            scan_targets = [r]
            if r == "/storage":
                try: 
                    scan_targets = [os.path.join(r, d) for d in os.listdir(r) if d not in ["self", "emulated", "knox", "sdcard0"]]
                except: continue
            for target in scan_targets:
                self._deep_scan(target, is_int, all_cats, all_index)

        self.cache["categories"] = sorted(all_cats, key=lambda x: (x['type_name'].count('*'), '☆' in x['type_name']))
        self.cache["file_index"] = all_index
        self.inited = True
        gc.collect()

    def _deep_scan(self, path, is_int, all_cats, all_index):
        try:
            wj_path = os.path.join(path, "lz", "wj")
            scan_dir = wj_path if os.path.isdir(wj_path) else path
            with os.scandir(scan_dir) as it:
                for entry in it:
                    if not entry.is_dir(): continue
                    f_list = [e.path for e in os.scandir(entry.path) if e.name.lower().endswith('.txt')]
                    if f_list:
                        tid = base64.b64encode(f"C|{entry.path}".encode()).decode()
                        all_cats.append({"type_id": tid, "type_name": f"{entry.name}{'' if is_int else '☆'}"})
                        all_index[tid] = sorted(list(set(f_list)))
                    for sub in os.scandir(entry.path):
                        if sub.is_dir():
                            sub_f = [e.path for e in os.scandir(sub.path) if e.name.lower().endswith('.txt')]
                            if sub_f:
                                sid = base64.b64encode(f"C|{sub.path}".encode()).decode()
                                all_cats.append({"type_id": sid, "type_name": f"{entry.name}/{sub.name}*"})
                                all_index[sid] = sorted(list(set(sub_f)))
        except: pass

    def homeContent(self, filter): return {"class": self.cache["categories"]}

    def categoryContent(self, tid, pg, filter, ext):
        if str(pg) != "1" and pg != 1: return {"list": []}
        file_list = self.cache["file_index"].get(tid, [])
        v_list = []
        for f_path in file_list:
            info = self._get_file_base_stats(f_path)
            # 这里联动 line_limit 实现动态分集
            parts = (info['count'] // self.line_limit) + 1 if info['count'] > 0 else 1
            f_name = os.path.basename(f_path)[:-4]
            for i in range(parts):
                v_id = base64.b64encode(f"P|{i}|{f_path}".encode()).decode()
                v_list.append({
                    "vod_id": v_id, "vod_name": f"{f_name}({i+1}/{parts})" if parts > 1 else f_name, 
                    "vod_pic": "https://img.icons8.com/color/200/txt.png", "vod_remarks": info['rem']
                })
        return {"page": 1, "pagecount": 1, "list": v_list}

    def detailContent(self, array):
        try:
            raw = base64.b64decode(array[0]).decode()
            _, p_idx, f_path = raw.split('|', 2)
            p_idx = int(p_idx)
            info = self._get_file_base_stats(f_path)
            
            enc = 'utf-8'
            with open(f_path, 'rb') as f:
                head = f.read(2048)
                for e in ['utf-8', 'gb18030', 'cp936']:
                    try: head.decode(e); enc = e; break
                    except: pass

            froms, urls = [], []
            curr_g = "未分类"
            genre_dict = {curr_g: []}
            genre_order = [curr_g]
            skip, found = p_idx * self.line_limit, 0
            
            with open(f_path, 'rb') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith(b'#'): continue
                    if self.GENRE_M in line:
                        curr_g = line.split(b',')[0].decode(enc, 'ignore').strip()
                        if curr_g not in genre_dict:
                            genre_dict[curr_g] = []; genre_order.append(curr_g)
                    elif self.PROTO_M in line and self.COMMA in line:
                        found += 1
                        if found <= skip: continue
                        if curr_g not in genre_dict:
                            genre_dict[curr_g] = []; genre_order.append(curr_g)
                        name, _, url = line.decode(enc, 'ignore').partition(',')
                        genre_dict[curr_g].append(f"{name.strip()}${url.strip()}")
                        if found >= (skip + self.line_limit): break

            for g in genre_order:
                links = genre_dict[g]
                if links:
                    froms.append(g)
                    urls.append("#".join(links))

            total_p = (info['count'] // self.line_limit) + 1
            this_p_count = sum(len(l) for l in genre_dict.values())
            # 保持要求的极简简介顺序
            content = f"⚡总量:{info['size_str']} {info['count']}条 | 本段:{p_idx+1}/{total_p}集 {this_p_count}条 | 码{enc.upper()} | 路径:{f_path} | 档位:{self.adaptive_tag}"
            
            return {"list": [{
                "vod_name": os.path.basename(f_path)[:-4], "vod_play_from": "$$$".join(froms), 
                "vod_play_url": "$$$".join(urls), "vod_remarks": info['rem'], "vod_content": content
            }]}
        except: return {"list": []}

    def playerContent(self, flag, id, vipFlags): return {"url": id, "parse": 0}