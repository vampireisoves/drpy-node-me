"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'destroy',
  lang: 'hipy'
})
"""

# -*- coding: utf-8 -*-
import os, json, time, gc, re, base64
from base.spider import Spider

class Spider(Spider):
    def __init__(self):
        super().__init__()
        self.inited = False
        self.cache = {"categories": [], "file_index": {}}
        self.config = self._get_adaptive_config()

    def getName(self):
        # 动态显示当前运行模式（Eco:经济/Turbo:加速）
        return f"流式归类_{self.config['tag']}"

    def _get_adaptive_config(self):
        """
        性能自适应：根据 Android 系统的总内存自动调整分页大小和读取缓冲区
        """
        total_kb = 2048 * 1024 # 默认按 2GB 计算
        try:
            if os.path.exists('/proc/meminfo'):
                with open('/proc/meminfo', 'r') as f:
                    m = re.search(r'MemTotal:\s+(\d+)', f.read())
                    if m: total_kb = int(m.group(1))
        except: pass
        
        # 内存小于 1.5GB 的设备：每页显示 500 条，减少压力
        if total_kb <= 1572864: 
            return {"limit": 500, "chunk": 1024 * 1024, "tag": "Eco"}
        # 内存充足设备：每页显示 2000 条，读取更快
        else: 
            return {"limit": 2000, "chunk": 4 * 1024 * 1024, "tag": "Turbo"}

    def init(self, extend):
        """
        初始化：探测存储路径，扫描 lz 文件夹并建立文件索引
        """
        if self.inited: return
        gc.disable() # 初始化期间禁用垃圾回收，提升扫描速度
        
        # 预设可能的存储根目录
        raw_roots = ["/storage/emulated/0/peekpili/", "/sdcard"]
        try:
            # 自动探测并加入所有挂载的外部 SD 卡或 U 盘
            if os.path.exists("/storage"):
                for d in os.listdir("/storage"):
                    p = os.path.join("/storage", d)
                    if os.path.isdir(p) and d not in ["self", "emulated", "knox", "sdcard", "runtime"]:
                        raw_roots.append(p)
        except: pass
        if extend: raw_roots.insert(0, extend.strip())

        all_raw_cats, final_index, unique_real_paths = [], {}, set()
        sort_w = {"json": 0, "m3u": 1} # 排序权重：JSON 在前，M3U 在后

        for r in raw_roots:
            lz_p = os.path.join(r, "php-scripts/lz")
            if not os.path.isdir(lz_p): continue
            
            # 物理路径去重：防止同一个 SD 卡通过不同挂载点导致重复显示
            real_lz_root = os.path.realpath(lz_p)
            is_int = "/storage/emulated/0/peekpili/php-scripts" in real_lz_root or "/sdcard" in real_lz_root
            star_storage = "" if is_int else "☆" # 🎯 外部存储特有的星号标识

            for sub in ["json", "m3u"]:
                tp = os.path.join(lz_p, sub)
                if not os.path.isdir(tp): continue
                
                with os.scandir(tp) as it:
                    for en in it:
                        # --- 处理一级目录 ---
                        if en.is_dir():
                            real_path = os.path.realpath(en.path)
                            if real_path in unique_real_paths: continue
                            
                            # 检查目录下是否有支持的媒体文件
                            fl = [e.path for e in os.scandir(en.path) if e.name.lower().endswith(('.json', '.m3u', '.m3u8'))]
                            if fl:
                                unique_real_paths.add(real_path)
                                tid = base64.b64encode(f"C|{en.path}".encode()).decode()
                                all_raw_cats.append({
                                    "type_id": tid, 
                                    "type_name": f"{en.name}{star_storage}",
                                    "sk": (0 if is_int else 1, 0, sort_w[sub], en.name) # 排序元组
                                })
                                final_index[tid] = fl
                            
                            # --- 处理二级子目录（递归一层） ---
                            with os.scandir(en.path) as sub_it:
                                for sub_en in sub_it:
                                    if sub_en.is_dir():
                                        real_sub_path = os.path.realpath(sub_en.path)
                                        if real_sub_path in unique_real_paths: continue
                                        
                                        sf = [e.path for e in os.scandir(sub_en.path) if e.name.lower().endswith(('.json', '.m3u', '.m3u8'))]
                                        if sf:
                                            unique_real_paths.add(real_sub_path)
                                            sid = base64.b64encode(f"C|{sub_en.path}".encode()).decode()
                                            # 🎯 显示格式：一级名☆/二级名*
                                            full_name = f"{en.name}{star_storage}/{sub_en.name}*"
                                            all_raw_cats.append({
                                                "type_id": sid, 
                                                "type_name": full_name,
                                                "sk": (0 if is_int else 1, 1, sort_w[sub], sub_en.name)
                                            })
                                            final_index[sid] = sf
        
        # 按照 存储类型->层级->权重->字母 排序
        sorted_cats = sorted(all_raw_cats, key=lambda x: x['sk'])
        self.cache["categories"] = [{"type_id": c["type_id"], "type_name": c["type_name"]} for c in sorted_cats]
        self.cache["file_index"] = final_index
        self.inited = True
        gc.collect()

    def _parse_m3u_stream(self, file_path, page, limit):
        """
        ⚡ 核心优化：二进制流式解析
        原理：不一次性读取整个文件，而是逐行扫描，达到当前翻页所需的数量后立即停止读取。
        这让 300MB+ 的 M3U 文件在低配盒子上也能秒开且不崩溃。
        """
        items = []
        target_start = (page - 1) * limit
        target_end = target_start + limit
        count = 0
        try:
            # 使用 'rb' 二进制模式读取，处理编码更鲁棒
            with open(file_path, 'rb') as f:
                temp_item = {}
                for line_bytes in f:
                    line = line_bytes.decode('utf-8', errors='ignore').strip()
                    if not line: continue
                    # 解析 M3U 标准标签
                    if line.startswith("#EXTINF:"):
                        name = line.split(',')[-1].strip()
                        logo_match = re.search(r'tvg-logo=["\'](.*?)["\']', line)
                        temp_item = {"n": name, "l": logo_match.group(1) if logo_match else ""}
                    # 解析播放地址
                    elif line.startswith("http"):
                        if temp_item:
                            # 只记录当前页码范围内的条目
                            if target_start <= count < target_end:
                                v_id = "M3U_URL|" + base64.b64encode(line.encode()).decode()
                                items.append({
                                    "vod_id": v_id, 
                                    "vod_name": temp_item["n"],
                                    "vod_pic": temp_item["l"] if temp_item["l"].startswith('http') else "https://img.icons8.com/color/200/tv.png",
                                    "vod_remarks": "M3U", # 🎯 副标题：显示文件类型为 M3U
                                    "vod_play_from": f"文件：{os.path.basename(file_path)}",
                                    "vod_content": f"⚡{temp_item['n']} | 路径:{file_path}"  #简介内容
                                })
                            count += 1
                            temp_item = {}
                        # 🎯 性能关键：读够了当前页，直接跳出循环，不再读取剩下的几万行
                        if count >= target_end and page != -1: break 
        except: pass
        return items, count

    def homeContent(self, filter):
        return {"class": self.cache["categories"]}

    def categoryContent(self, tid, pg, filter, ext):
        """
        分类页加载：根据 TID（加密后的路径）展示文件内容
        """
        page = int(pg) if pg.isdigit() else 1
        limit = self.config['limit']
        files = self.cache["file_index"].get(tid, [])
        all_list, total_count = [], 0
        for fp in files:
            # 如果是 M3U，使用流式解析
            if fp.lower().endswith(('.m3u', '.m3u8')):
                items, f_total = self._parse_m3u_stream(fp, page, limit)
                all_list.extend(items)
                total_count += f_total
            # 如果是 JSON，保持原始解析逻辑（中餐灶台）
            else:
                try:
                    with open(fp, "rb") as f:
                        data = json.loads(f.read().decode("utf-8"))
                        j_items = data.get("list", [])
                        total_count += len(j_items)
                        # 🎯 核心修改：设置副标题为 JSON 格式标记
                        for item in j_items:
                            item["vod_remarks"] = "JSON" # 🎯 副标题：显示文件类型为 JSON
                        start = (page - 1) * limit
                        all_list.extend(j_items[start : start + limit])
                except: continue
        return {"page": page, "pagecount": (total_count + limit - 1) // limit, "limit": limit, "total": total_count, "list": all_list[:limit]}

    def detailContent(self, array):
        """
        详情页：根据 vod_id 反查文件信息并显示
        """
        if not array: return {"list": []}
        vod_id = str(array[0])
        
        # 处理 M3U 直播源详情
        if vod_id.startswith("M3U_URL|"):
            real_url = base64.b64decode(vod_id.split("|")[1]).decode()
            for tid in self.cache["file_index"]:
                for fp in self.cache["file_index"][tid]:
                    if fp.lower().endswith(('.m3u', '.m3u8')):
                        items, _ = self._parse_m3u_stream(fp, 1, 999999) # 全力读取查找
                        for item in items:
                            if item["vod_id"] == vod_id:
                                item["vod_play_url"] = f"立即播放${real_url}"
                                return {"list": [item]}
                                
        # 处理 JSON 点播源详情
        for tid in self.cache["file_index"]:
            for fp in self.cache["file_index"][tid]:
                if fp.lower().endswith('.json'):
                    try:
                        with open(fp, "rb") as f:
                            data = json.loads(f.read().decode("utf-8"))
                            for item in data.get("list", []):
                                if str(item.get("vod_id")) == vod_id: return {"list": [item]}
                    except: continue
        return {"list": []}

    def playerContent(self, flag, id, vipFlags):
        """
        播放器：解析加密或直接的 URL
        """
        url = id.split('$')[-1] if '$' in id else id
        if "://" not in url:
            try: url = base64.b64decode(id.split("|")[-1]).decode()
            except: pass
        return {"url": url.strip(), "header": {"User-Agent": "okhttp/3.12.0"}, "parse": 0}

    def destroy(self):
        """
        销毁：释放内存并恢复 GC
        """
        gc.collect()
        gc.enable()
        return "destroy"