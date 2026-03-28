"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'M3U读取',
  lang: 'hipy'
})
"""

# -*- coding: utf-8 -*-
import os, base64, gc, re
from base.spider import Spider

class Spider(Spider):
    def __init__(self):
        super().__init__()
        self.inited = False
        self.cache = {"categories": [], "file_index": {}}
        self.info_cache = {}
        self.scanned_paths = set()
        # 初始预设，会在 init 中被自适应配置覆盖
        self.line_limit = 2000    #限制2000条划分一集的清单数量
        self.adaptive_tag = ""

    def getName(self):
        return f"LocalM3U_v30_{self.adaptive_tag}" if self.adaptive_tag else "LocalM3U_v30_Adaptive"

    # --- 核心：三档自适应逻辑 ---
    def _get_adaptive_config(self):
        """
        根据运行内存(RAM)自动调整性能参数
        档位1(≤3G): 侧重稳定，防止盒子闪退
        档位2(3G-24G): 侧重均衡，主流手机体验
        档位3(≥24G): 侧重全量，释放旗舰性能
        """
        total_kb = 0
        try:
            with open('/proc/meminfo', 'r') as f:
                content = f.read()
                m = re.search(r'MemTotal:\s+(\d+)', content)
                if m: total_kb = int(m.group(1))
        except: total_kb = 2097152 # 异常默认按2G处理

        if total_kb <= 3145728: # ≤3GB
            return {"limit": 2000, "read_mb": 2, "tag": "Eco"}   #低档手机
        elif total_kb < 25165824: # 3GB - 24GB
            return {"limit": 10000, "read_mb": 10, "tag": "Balance"}   #中等手机
        else: # ≥24GB
            return {"limit": 50000, "read_mb": 50, "tag": "Ultra"}    #高档手机

    # 文件大小单位 B K 取整
    def _format_size(self, size_bytes):
        if size_bytes < 1024: return f"{int(size_bytes)}B"
        if size_bytes < 1048576: return f"{int(size_bytes/1024)}K"  
        return f"{size_bytes/1048576:.1f}M"

    def _get_file_base_stats(self, f_path):
        """二进制流扫描：不解析文本，只数 URL 数量，实现秒开"""
        try:
            st = os.stat(f_path)
            if f_path in self.info_cache and self.info_cache[f_path]['mtime'] == st.st_mtime:
                return self.info_cache[f_path]
            
            count = 0
            with open(f_path, 'rb') as f:
                while True:
                    buf = f.read(512 * 1024)
                    if not buf: break
                    # 匹配 http/https/rtp/rtsp 等特征，但不计入 # 开头的注释行
                    count += len(re.findall(rb'\n\s*(?!#)\w+://', b'\n' + buf))
            
            f_size_str = self._format_size(st.st_size)
            data = {
                'mtime': st.st_mtime, 
                'rem': f"{f_size_str} {count}条", 
                'count': count, 
                'size_str': f_size_str,
                'path': f_path
            }
            self.info_cache[f_path] = data
            return data
        except: return {'rem': "0B 0条", 'count': 0, 'size_str': "0B", 'path': f_path}

    def init(self, extend):
        if self.inited: return
        # --- 初始化时根据内存设定全局限额 ---
        config = self._get_adaptive_config()
        self.line_limit = config["limit"]
        self.read_limit = config["read_mb"] * 1024 * 1024
        self.adaptive_tag = config["tag"]

        self.scanned_paths.clear()
        raw_roots = [extend.strip()] if extend else ["/storage/emulated/0/peekpili/php-scripts", "/storage"]
        all_raw_cats, final_index = [], {}
        unique_roots = set()

        for r in raw_roots:
            if not os.path.exists(r): continue
            try: r = os.path.realpath(r)
            except: pass
            if r in unique_roots: continue
            unique_roots.add(r)
            
            is_int = "emulated/0" in r
            scan_targets = [r]
            if r == "/storage":
                try: scan_targets = [os.path.join(r, s) for s in os.listdir(r) if s not in ["self", "emulated", "knox", "sdcard0"]]
                except: continue

            for target in scan_targets:
                m3u_path = os.path.join(target, "lz", "m3u")
                if os.path.isdir(m3u_path) and m3u_path not in self.scanned_paths:
                    self.scanned_paths.add(m3u_path)
                    suffix = "" if is_int else "☆"
                    with os.scandir(m3u_path) as it:
                        for entry in it:
                            if not entry.is_dir(): continue
                            f_list = [e.path for e in os.scandir(entry.path) if e.name.lower().endswith(('.m3u', '.txt'))]
                            if f_list:
                                tid = base64.b64encode(f"C|{entry.path}".encode()).decode()
                                all_raw_cats.append({"type_id": tid, "type_name": f"{entry.name}{suffix}"})
                                final_index[tid] = sorted(list(set(f_list)))
                            # 三级探测
                            for sub in os.scandir(entry.path):
                                if sub.is_dir():
                                    sub_f = [e.path for e in os.scandir(sub.path) if e.name.lower().endswith(('.m3u', '.txt'))]
                                    if sub_f:
                                        sid = base64.b64encode(f"C|{sub.path}".encode()).decode()
                                        all_raw_cats.append({"type_id": sid, "type_name": f"{entry.name}{suffix}/{sub.name}*"})
                                        final_index[sid] = sorted(list(set(sub_f)))

        self.cache["categories"] = sorted(all_raw_cats, key=lambda x: (x['type_name'].count('*'), '☆' in x['type_name']))
        self.cache["file_index"] = final_index
        self.inited = True
        gc.collect()

    def homeContent(self, filter): return {"class": self.cache["categories"]}

    def categoryContent(self, tid, pg, filter, ext):
        if str(pg) != "1" and pg != 1: return {"list": []}
        target_files = self.cache["file_index"].get(tid, [])
        v_list = []
        for f_path in target_files:
            f_base = os.path.basename(f_path).rsplit('.', 1)[0]
            info = self._get_file_base_stats(f_path)
            
            # --- 联动自适应 line_limit 进行分割 ---
            total = info['count']
            parts = (total // self.line_limit) + 1 if total > 0 else 1
            
            for i in range(parts):
                v_id = base64.b64encode(f"P|{i}|{f_path}".encode()).decode()
                v_list.append({
                    "vod_id": v_id,
                    "vod_name": f"{f_base}({i+1}/{parts})" if parts > 1 else f_base,
                    "vod_pic": "https://img.icons8.com/color/200/m3u.png",
                    "vod_remarks": info['rem']
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

            play_urls, temp_name = [], ""
            # 联动自适应 limit
            skip, found = p_idx * self.line_limit, 0
            
            with open(f_path, 'rb') as f:
                for line in f:
                    try: line_str = line.decode(enc, 'ignore').strip()
                    except: continue
                    if not line_str: continue
                    
                    if line_str.upper().startswith("#EXTINF"):
                        temp_name = line_str.split(",")[-1].strip()
                    elif "://" in line_str and not line_str.startswith("#"):
                        found += 1
                        if found <= skip:
                            temp_name = ""
                            continue
                        
                        name = temp_name if temp_name else f"CH{found}"
                        b64_url = base64.b64encode(line_str.encode('utf-8')).decode()
                        play_urls.append(f"{name}${b64_url}")
                        temp_name = ""
                        if len(play_urls) >= self.line_limit: break

            # 保持要求的极简简介顺序
            total_p = (info['count'] // self.line_limit) + 1
            content = f"⚡总量:{info['size_str']} {info['count']}条 | 本段:{p_idx+1}/{total_p}集  {len(play_urls)}条 | 码 {enc.upper()} | 路径:{f_path} | 档位:{self.adaptive_tag}"

            return {"list": [{
                "vod_name": os.path.basename(f_path).rsplit('.', 1)[0],
                "vod_play_from": "本地M3U",
                "vod_play_url": "#".join(play_urls),
                "vod_remarks": info['rem'],
                "vod_content": content
            }]}
        except: return {"list": []}

    def playerContent(self, flag, id, vipFlags):
        try: url = base64.b64decode(id).decode()
        except: url = id
        return {"url": url, "parse": 0, "header": {"User-Agent": "Mozilla/5.0"}}