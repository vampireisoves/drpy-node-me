"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '归类深度搜索_修复版',
  lang: 'hipy'
})
"""

# -*- coding: utf-8 -*-
import os, json, gc, re, base64, threading
from base.spider import Spider

class Spider(Spider):
    # ==========================================
    # 🔍 【关键字设置】
    # ==========================================
    SEARCH_KEY = "嫂子"       # 这里输入你要搜索的关键字

    # ==========================================
    # 🏠 【内部存储开关】
    # ==========================================
    INT_PATH_CONFIG = [
        "peekpili/php-scripts/lz/json",     # 搜索路径开关，前面加#禁止搜索
       # "VodPlus/lz/jsons",   # 内部储存，老手机搜索专用文件夹，控制55m文件大小。
       # "VodPlus/lz/m3us",    # 内部储存，老手机搜索专用文件夹，控制55m文件大小。
        "peekpili/php-scripts/lz/m3u"
    ]

    # ==========================================
    # 💾 【外部存储开关】
    # ==========================================
    EXT_PATH_CONFIG = [
          # "VodPlus/lz/json",      # 搜索路径开关，前面加#禁止搜索
          # "VodPlus/lz/jsons",   # 外部储存，老手机搜索专用文件夹，控制55m文件大小。
          # "VodPlus/lz/m3us",    # 外部储存，老手机搜索专用文件夹，控制55m文件大小。
          # "VodPlus/lz/m3u"
    ]
    # ==========================================

    def __init__(self):
        super().__init__()
        self.inited = False
        self.cache = {"categories": [], "search_data": {}}

    def getName(self):
        return "归类深度搜索_修复版"

    def _fast_check(self, fp, kw_b):
        """流式闪读判定"""
        try:
            CHUNK_SIZE = 64 * 1024
            with open(fp, 'rb') as f:
                while True:
                    chunk = f.read(CHUNK_SIZE)
                    if not chunk: break
                    if kw_b in chunk.lower(): return True
        except: pass
        return False

    def _parse_m3u(self, fp, kw):
        items = []
        try:
            with open(fp, 'rb') as f:
                content = f.read().decode('utf-8', errors='ignore')
                temp_item = {}
                for line in content.split('\n'):
                    line = line.strip()
                    if line.startswith("#EXTINF:"):
                        name = line.split(',')[-1].strip()
                        logo_match = re.search(r'tvg-logo=["\'](.*?)["\']', line)
                        temp_item = {"n": name, "l": logo_match.group(1) if logo_match else ""}
                    elif "://" in line and not line.startswith("#"):
                        if kw.lower() in line.lower() or (temp_item and kw.lower() in temp_item.get("n", "").lower()):
                            name = temp_item.get("n", "直播线路")
                            pic = temp_item.get("l", "")
                            if not pic.startswith('http'): pic = "https://img.icons8.com/color/200/tv.png"
                            v_id = "M3U_URL|" + base64.b64encode(line.encode()).decode()
                            items.append({
                                "vod_id": v_id, "vod_name": name, "vod_pic": pic,
                                "vod_remarks": "M3U",
                                "vod_play_from": f"源自：{os.path.basename(fp)}",
                                "vod_content": f"⚡标题:{name}\n路径:{fp}"   #简介显示
                            })
                        temp_item = {}
        except: pass
        return items

    def _parse_json(self, fp, kw):
        items = []
        try:
            with open(fp, 'rb') as f:
                data = json.loads(f.read().decode('utf-8'))
                for item in data.get('list', []):
                    if kw.lower() in item.get('vod_name', '').lower():
                        item["vod_remarks"] = "JSON"
                        items.append(item)
        except: pass
        return items

    def _scan_folder_recursive(self, folder_path, kw, kw_b):
        """仅用于子目录文件检索"""
        res = []
        if not os.path.exists(folder_path): return res
        try:
            for f in os.listdir(folder_path):
                fp = os.path.join(folder_path, f)
                if os.path.isfile(fp) and self._fast_check(fp, kw_b):
                    if f.lower().endswith(('.m3u', '.m3u8', '.txt')):
                        res.extend(self._parse_m3u(fp, kw))
                    elif f.lower().endswith('.json'):
                        res.extend(self._parse_json(fp, kw))
        except: pass
        return res

    def init(self, extend):
        if self.inited: return
        gc.disable()
        kw = self.SEARCH_KEY.strip()
        kw_b = kw.lower().encode('utf-8')
        
        # 收集挂载点
        raw_roots = ["/storage/emulated/0/peekpili/php-scripts/lz", "/sdcard"]
        try:
            if os.path.exists("/storage"):
                for d in os.listdir("/storage"):
                    p = os.path.join("/storage", d)
                    if os.path.isdir(p) and d not in ["self", "emulated", "knox", "sdcard", "runtime", "container"]:
                        raw_roots.append(p)
        except: pass

        all_raw_cats, final_data, scanned_paths = [], {}, set()

        for r in raw_roots:
            if not os.path.exists(r): continue
            real_root = os.path.realpath(r)
            # 基础根目录层级防重
            if real_root in scanned_paths: continue
            scanned_paths.add(real_root)

            is_int = "emulated" in real_root or "sdcard" in real_root
            star = "" if is_int else "☆"
            config = self.INT_PATH_CONFIG if is_int else self.EXT_PATH_CONFIG

            for sub_base in config:
                if sub_base.startswith("#"): continue # 跳过屏蔽的路径
                target_path = os.path.join(r, sub_base)
                if not os.path.isdir(target_path): continue
                
                # A. 根目录扫描
                root_items = self._scan_folder_recursive(target_path, kw, kw_b)
                if root_items:
                    tid_root = base64.b64encode(f"R|{target_path}".encode()).decode()
                    all_raw_cats.append({
                        "type_id": tid_root, 
                        "type_name": f"{os.path.basename(target_path)}{star}({len(root_items)})", 
                        "sk": (0 if is_int else 1, -1)
                    })
                    final_data[tid_root] = root_items

                # B. 二级与三级深度扫描
                try:
                    with os.scandir(target_path) as it:
                        for entry in it:
                            if entry.is_dir():
                                # 二级目录
                                d2_res = self._scan_folder_recursive(entry.path, kw, kw_b)
                                if d2_res:
                                    tid2 = base64.b64encode(f"D2|{entry.path}".encode()).decode()
                                    all_raw_cats.append({
                                        "type_id": tid2, 
                                        "type_name": f"{entry.name}{star}({len(d2_res)})", 
                                        "sk": (0 if is_int else 1, 0)
                                    })
                                    final_data[tid2] = d2_res
                                
                                # 三级目录 (孙目录)
                                try:
                                    with os.scandir(entry.path) as sub_it:
                                        for sub in sub_it:
                                            if sub.is_dir():
                                                d3_res = self._scan_folder_recursive(sub.path, kw, kw_b)
                                                if d3_res:
                                                    tid3 = base64.b64encode(f"D3|{sub.path}".encode()).decode()
                                                    all_raw_cats.append({
                                                        "type_id": tid3, 
                                                        "type_name": f"{entry.name}{star}/{sub.name}*({len(d3_res)})", 
                                                        "sk": (0 if is_int else 1, 1)
                                                    })
                                                    final_data[tid3] = d3_res
                                except: pass
                except: pass

        if not all_raw_cats:
            self.cache["categories"] = [{"type_id": "NONE", "type_name": "❌无搜索结果，请检查关键字和搜索路径开关#"}]
            self.cache["search_data"] = {"NONE": [{"vod_id": "tip", "vod_name": "未找到匹配内容", "vod_content": f"重新输入搜索关键词，并检查路径是否被#屏蔽: {kw}"}]}
        else:
            sorted_cats = sorted(all_raw_cats, key=lambda x: x['sk'])
            self.cache["categories"] = [{"type_id": c["type_id"], "type_name": c["type_name"]} for c in sorted_cats]
            self.cache["search_data"] = final_data
        
        self.inited = True
        gc.collect()

    def homeContent(self, filter):
        return {"class": self.cache["categories"]}

    def categoryContent(self, tid, pg, filter, ext):
        res = self.cache["search_data"].get(tid, [])
        return {"page": 1, "pagecount": 1, "limit": len(res), "total": len(res), "list": res}

    def detailContent(self, array):
        v_id = str(array[0])
        if v_id == "tip": return {"list": [self.cache["search_data"]["NONE"][0]]}
        for tid in self.cache["search_data"]:
            for item in self.cache["search_data"][tid]:
                if str(item.get("vod_id")) == v_id:
                    if v_id.startswith("M3U_URL|"):
                        url = base64.b64decode(v_id.split("|")[1]).decode()
                        item["vod_play_from"] = "流式播放"  #线路显示
                        item["vod_play_url"] = f"点这全屏播放${url}"  #选集显示
                    return {"list": [item]}
        return {"list": []}

    def playerContent(self, flag, id, vipFlags):
        url = id.split('$')[-1] if '$' in id else id
        return {"url": url.strip(), "header": {"User-Agent": "okhttp/3.12.0"}, "parse": 0}

    def destroy(self):
        gc.collect()
        gc.enable()
        return "destroy"