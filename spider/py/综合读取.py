"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '综合读取',
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
        self.cache = {"categories": [], "file_index": {}} # 分类与文件映射缓存
        self.info_cache = {} # 文件统计元数据缓存
        self.line_limit = 2000    # 默认分页阈值2000条
        self.read_buffer = 1024 * 1024 
        self.adaptive_tag = ""

    def getName(self):
        return f"Local_Turbo_v44_{self.adaptive_tag}"

    # 硬件适配：根据 MemTotal 自动调整读取缓冲区和分页限制
    def _get_adaptive_config(self):
        total_kb = 0
        try:
            with open('/proc/meminfo', 'r') as f:
                content = f.read()
                m = re.search(r'MemTotal:\s+(\d+)', content)
                if m: total_kb = int(m.group(1))
        except: total_kb = 2097152 
        if total_kb <= 3145728: return {"limit": 2000, "read_mb": 2, "tag": "Eco"}    #低配置手机
        elif total_kb < 25165824: return {"limit": 10000, "read_mb": 10, "tag": "Balance"}   #中配置手机
        else: return {"limit": 50000, "read_mb": 50, "tag": "Ultra"}   #高配置手机

    # 存储容量取整显示逻辑
    def _format_size(self, size_bytes):
        if size_bytes < 1048576: return f"{int(size_bytes/1024)}K"  
        if size_bytes < 1073741824: return f"{size_bytes/1048576:.1f}M"
        return f"{size_bytes/1073741824:.2f}G"

    # 核心统计：使用二进制流式读取文件，计算直播源条数与分类
    def _get_file_base_stats(self, f_path):
        try:
            st = os.stat(f_path)
            if f_path in self.info_cache and self.info_cache[f_path]['mtime'] == st.st_mtime:
                return self.info_cache[f_path]
            count, g_count, f_low = 0, 0, f_path.lower()
            with open(f_path, 'rb') as f:
                while True:
                    buf = f.read(self.read_buffer) 
                    if not buf: break
                    if '.json' in f_low: count += buf.count(b'"vod_play_url"')
                    elif '.m3u' in f_low: count += len(re.findall(rb'\n\s*(?!#)\w+://', b'\n' + buf))
                    else: count += buf.count(b'://'); g_count += buf.count(b',#genre#')
            f_size_str = self._format_size(st.st_size)
            rem = f"{f_size_str} {max(1, g_count) if '.txt' in f_low and '.m3u' not in f_low else ''}{'类 ' if '.txt' in f_low and '.m3u' not in f_low else ''}{count}条"
            data = {'mtime': st.st_mtime, 'rem': rem, 'count': count, 'size_str': f_size_str}
            self.info_cache[f_path] = data
            return data
        except: return {'rem': "0B 0条", 'count': 0, 'size_str': "0B"}

    # 目录初始化：探测本地/外部存储中的 /lz 文件夹
    def init(self, extend):
        if self.inited: return
        config = self._get_adaptive_config()
        self.line_limit, self.read_buffer, self.adaptive_tag = config["limit"], config["read_mb"] * 1024 * 1024, config["tag"]

        raw_roots = ["/storage/emulated/0/peekpili/php-scripts/lz", "/sdcard"]
        try:
            if os.path.exists("/storage"):
                for d in os.listdir("/storage"):
                    p = "/storage/" + d
                    if os.path.isdir(p) and d not in ["self", "emulated", "knox", "sdcard"]: raw_roots.append(p)
        except: pass
        if extend: raw_roots.insert(0, extend.strip())

        all_raw_cats, final_index, unique_paths = [], {}, set()
        sort_w = {"json": 0, "m3u": 1, "wj": 2}

        for r in raw_roots:
            if not os.path.exists(r): continue
            lz_p = os.path.join(r, "lz")
            if not os.path.isdir(lz_p): continue
            is_int = "emulated/0" in r
            star = "" if is_int else "☆" # 外部存储显示星号
            
            for sub in ["json", "m3u", "wj"]:
                tp = os.path.join(lz_p, sub)
                if os.path.isdir(tp):
                    pre = f"【{sub.upper()}】"
                    with os.scandir(tp) as it:
                        for en in it:
                            # 父目录扫描逻辑
                            if en.is_dir() and en.path not in unique_paths:
                                fl = [e.path for e in os.scandir(en.path) if e.name.lower().endswith(('.json', '.txt', '.m3u', '.m3u8'))]
                                if fl:
                                    unique_paths.add(en.path)
                                    tid = base64.b64encode(f"C|{en.path}".encode()).decode()
                                    all_raw_cats.append({
                                        "type_id": tid, "type_name": f"{pre}{en.name}{star}",
                                        "sk": (0 if is_int else 1, 0, sort_w[sub], en.name)
                                    })
                                    final_index[tid] = sorted(list(set(fl)))
                                    # 子目录扫描（二级文件夹）
                                    for sub_en in os.scandir(en.path):
                                        if sub_en.is_dir():
                                            sf = [e.path for e in os.scandir(sub_en.path) if e.name.lower().endswith(('.json', '.txt', '.m3u', '.m3u8'))]
                                            if sf:
                                                sid = base64.b64encode(f"C|{sub_en.path}".encode()).decode()
                                                all_raw_cats.append({
                                                    "type_id": sid, "type_name": f"{pre}{en.name}{star}/{sub_en.name}*",
                                                    "sk": (0 if is_int else 1, 1, sort_w[sub], sub_en.name)
                                                })
                                                final_index[sid] = sorted(list(set(sf)))

        # 按照 存储类型->目录层级->格式权重 进行排序
        sorted_cats = sorted(all_raw_cats, key=lambda x: x['sk'])
        self.cache["categories"] = [{"type_id": c["type_id"], "type_name": c["type_name"]} for c in sorted_cats]
        self.cache["file_index"] = final_index
        self.inited = True
        gc.collect()

    def homeContent(self, filter): return {"class": self.cache["categories"]}

    # 分类页列表：支持大文件自动分页逻辑
    def categoryContent(self, tid, pg, filter, ext):
        if str(pg) != "1" and pg != 1: return {"list": []}
        v_list = []
        for fp in self.cache["file_index"].get(tid, []):
            f_low = fp.lower()
            info = self._get_file_base_stats(fp)
            ps = (info['count'] // self.line_limit) + 1 if info['count'] > 0 else 1
            if '.json' in f_low: pic = "https://img.icons8.com/color/200/json--v1.png"
            elif '.m3u' in f_low: pic = "https://img.icons8.com/color/200/opened-folder.png"
            elif '.txt' in f_low: pic = "https://img.icons8.com/color/200/txt.png"
            else: pic = "https://img.icons8.com/color/200/opened-folder.png"
            for i in range(ps):
                v_list.append({
                    "vod_id": base64.b64encode(f"P|{i}|{fp}".encode()).decode(),
                    "vod_name": f"{os.path.basename(fp).rsplit('.',1)[0]}({i+1}/{ps})" if ps > 1 else os.path.basename(fp).rsplit('.',1)[0],
                    "vod_pic": pic, "vod_remarks": info['rem']
                })
        return {"list": v_list}

    # 详情页解析：三格式引擎（JSON/M3U/TXT）
    def detailContent(self, array):
        try:
            raw = base64.b64decode(array[0]).decode()
            _, p_idx, f_path = raw.split('|', 2)
            p_idx, info, f_low = int(p_idx), self._get_file_base_stats(f_path), f_path.lower()
            enc = 'utf-8'
            with open(f_path, 'rb') as f:
                head = f.read(1024)
                for e in ['utf-8', 'gb18030']:
                    try: head.decode(e); enc = e; break
                    except: pass
            play_urls, froms, skip, found, actual_count = [], [], p_idx * self.line_limit, 0, 0
            with open(f_path, 'rb') as f:
                # 场景 A: 结构化 JSON
                if '.json' in f_low:
                    pattern = re.compile(rb'\{[^{}]*"vod_name"\s*:\s*"([^"]+)"[^{}]*"vod_play_url"\s*:\s*"([^"]+)"[^{}]*\}')
                    while True:
                        chunk = f.read(self.read_buffer)
                        if not chunk: break
                        for m_n, m_u in pattern.findall(chunk):
                            found += 1
                            if found <= skip: continue
                            play_urls.append(f"{m_n.decode(enc,'ignore').replace('$','')}${m_u.decode(enc,'ignore')}")
                            if len(play_urls) >= self.line_limit: break
                        if len(play_urls) >= self.line_limit: break
                    froms.append("本地JSON")
                    actual_count = len(play_urls)
                    final_url = "#".join(play_urls)
                # 场景 B: 标准 M3U/M3U8
                elif '.m3u' in f_low:
                    tmp_n = ""
                    for line in f:
                        l = line.decode(enc, 'ignore').strip()
                        if not l: continue
                        if l.upper().startswith("#EXTINF"): tmp_n = l.split(",")[-1].strip()
                        elif "://" in l and not l.startswith("#"):
                            found += 1
                            if found <= skip: (tmp_n := ""); continue
                            play_urls.append(f"{tmp_n if tmp_n else 'CH'+str(found)}${l}")
                            tmp_n = ""; actual_count += 1
                            if actual_count >= self.line_limit: break
                    froms.append("本地M3U")
                    final_url = "#".join(play_urls)
                # 场景 C: 通用 TXT (WJ 格式)
                else: 
                    cur_g = "默认"; g_dict = {cur_g: []}
                    for line in f:
                        l = line.decode(enc, 'ignore').strip()
                        if not l or l.startswith('#'): continue
                        if ',#genre#' in l:
                            cur_g = l.split(',')[0].strip(); g_dict[cur_g] = []
                        elif '://' in l and ',' in l:
                            found += 1
                            if found <= skip: continue
                            n, _, u = l.partition(',')
                            g_dict[cur_g].append(f"{n.strip()}${u.strip()}")
                            actual_count += 1
                            if actual_count >= self.line_limit: break
                    for k in g_dict:
                        if g_dict[k]: froms.append(k); play_urls.append("#".join(g_dict[k]))
                    final_url = "$$$".join(play_urls)
            
            total_p = (info['count'] // self.line_limit) + 1
            # 状态栏信息显示顺序优化
            content = f"⚡总量:{info['size_str']} {info['count']}条 | 本段:{p_idx+1}/{total_p}集  {actual_count}条 | 档位:{self.adaptive_tag} | 路径:{f_path} | 码 {enc.upper()} "
            return {"list": [{
                "vod_name": os.path.basename(f_path).rsplit('.', 1)[0],
                "vod_play_from": "$$$".join(froms),
                "vod_play_url": final_url,
                "vod_content": content
            }]}
        except: return {"list": []}

    def playerContent(self, flag, id, vipFlags):
        url = id.split('$')[-1] if '$' in id else id
        return {"url": url.strip(), "parse": 0, "header": {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}}