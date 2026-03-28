"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'NullBR_Magnet_Mod',
  lang: 'hipy'
})
"""

# coding=utf-8
# !/usr/bin/python
"""
基于 nullbr.online API 的OK影视盒插件 
地址: https://nullbr.online/
使用电报直接登录注册
"""
from base.spider import Spider
import requests
import json
import re

class Spider(Spider):
    def __init__(self):
        self.api_url = "https://api.nullbr.com"
        self.app_id = ""#一定要申请id
        self.api_key = ""#填入你的api key
        self.headers = {
            'X-APP-ID': self.app_id,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.resource_icons = {
            "ed2k": "⚡",
            "magnet": "🧲",
            "video": "🎬"
        }
        
        new_categories_data = [
            {"list_id": 2142788, "type_name": "🔥 热门电影 (IMDB)"},
            {"list_id": 2142753, "type_name": "⭐ 高分电影 (IMDB)"},
            {"list_id": 20492833, "type_name": "💥 动作片 (1980+)"},
            {"list_id": 20492976, "type_name": "🚀 奇幻/科幻"},
            {"list_id": 22214764, "type_name": "⚛️ 科幻电影"},
            {"list_id": 20492899, "type_name": "👻 恐怖片 (1960+)"},
            {"list_id": 21040461, "type_name": "🔪 亚洲恐怖"},
            {"list_id": 22214712, "type_name": "💖 爱情片"},
            {"list_id": 20493347, "type_name": "🕵️ 悬疑片 (1980+)"},
            {"list_id": 20493216, "type_name": "👨‍👩‍👧‍👦 家庭片 (1980+)"},
            {"list_id": 22214785, "type_name": "⚔️ 战争电影"},
            {"list_id": 6674424, "type_name": "🥋 亚洲武侠"},
            {"list_id": 22209016, "type_name": "🏅 体育电影"},
            {"list_id": 22214618, "type_name": "📜 传记片"},
            {"list_id": 22214679, "type_name": "🏛️ 历史片"},
            {"list_id": 22214696, "type_name": "🎵 音乐电影"},
            {"list_id": 4519217, "type_name": "🧸 儿童动画"},
            {"list_id": 4519222, "type_name": "👧 儿童电影"},
            {"list_id": 21242048, "type_name": "🐻 动物电影"},
            {"list_id": 21100861, "type_name": "🧠 烧脑电影"},
            {"list_id": 800238, "type_name": "🤯 最佳烧脑"},
            {"list_id": 11086333, "type_name": "🌍 反乌托邦"},
            {"list_id": 21793252, "type_name": "🧐 存在主义"},
            {"list_id": 21760015, "type_name": "🤪 恶搞喜剧"},
            {"list_id": 21143267, "type_name": "😂 最佳恶搞"},
            {"list_id": 22924428, "type_name": "🇫🇷 法国情色"},
            {"list_id": 20260771, "type_name": "🔞 北美情色"},
            {"list_id": 22146946, "type_name": "🔞 最佳情色 (2021)"},
            {"list_id": 30122482, "type_name": "🦸 漫威宇宙"},
            {"list_id": 2143362, "type_name": "🔥 热门剧集 (IMDB)"},
            {"list_id": 2143363, "type_name": "⭐ 高分剧集 (IMDB)"},
            {"list_id": 20772104, "type_name": "🚨 犯罪剧集"},
            {"list_id": 20772087, "type_name": "👻 恐怖剧集"},
            {"list_id": 22214424, "type_name": "⚛️ 科幻剧集"},
            {"list_id": 22214419, "type_name": "💖 爱情剧集"},
            {"list_id": 22214296, "type_name": "🏛️ 历史剧集"},
            {"list_id": 22214487, "type_name": "⚔️ 战争剧集"},
            {"list_id": 22214180, "type_name": "📜 传记剧集"},
            {"list_id": 22214436, "type_name": "🏅 体育剧集"},
            {"list_id": 22209115, "type_name": "🎥 体育纪录片"},
            {"list_id": 22214382, "type_name": "🎵 音乐剧集"},
            {"list_id": 22578892, "type_name": "🔫 黑帮剧集"},
            {"list_id": 20770341, "type_name": "⚖️ 犯罪主题"},
            {"list_id": 21040641, "type_name": "🌈 LGBTQ+"},
            {"list_id": 21874345, "type_name": "🏆 帝国100最佳"},
            {"list_id": 9342696, "type_name": "🇭🇰 最佳港片"},
            {"list_id": 835720, "type_name": "🌍 帝国500最佳"},
            {"list_id": 805405, "type_name": "📜 死前必看1001部"},
            {"list_id": 5707382, "type_name": "🎞️ 死前必看100动漫"},
            {"list_id": 21881822, "type_name": "⚔️ 二战电影/剧集"},
            {"list_id": 21881936, "type_name": "⏳ 二战编年史"},
            {"list_id": 20770352, "type_name": "🏛️ 历史主题"},
            {"list_id": 21103682, "type_name": "📰 真实事件改编"},
            {"list_id": 4308678, "type_name": "🕰️ 时间旅行"},
            {"list_id": 806590, "type_name": "🌴 戛纳金棕榈奖"},
            {"list_id": 7940555, "type_name": "🏆 奥斯卡提名"},
            {"list_id": 832943, "type_name": "🏆 奥斯卡获奖"},
            {"list_id": 3785062, "type_name": "🍅 烂番茄100最佳"},
            {"list_id": 3350405, "type_name": "🍅 烂番茄最佳爱情喜剧"},
            {"list_id": 30923909, "type_name": "🆕 烂番茄最佳2025"},
            {"list_id": 21103727, "type_name": "🍅 烂番茄最佳80年代"},
            {"list_id": 9584218, "type_name": "📊 Reddit Top 250"},
            {"list_id": 9450398, "type_name": "🇷🇺 最佳俄罗斯"},
            {"list_id": 9359843, "type_name": "🇮🇳 最佳宝莱坞"},
            {"list_id": 19609954, "type_name": "😱 1000部最佳恐怖"},
            {"list_id": 22033528, "type_name": "📜 高分纪录片"},
            {"list_id": 2475998, "type_name": "💻 黑客主题"},
            {"list_id": 9940837, "type_name": "🏰 Disney+"},
            {"list_id": 24934536, "type_name": "💿 录像带商店"},
            {"list_id": 25373500, "type_name": "📈 高分电影 (<2010)"},
            {"list_id": 25373705, "type_name": "📈 高分电影 (>2010)"},
            {"list_id": 24377858, "type_name": "📺 高分剧集 (<2010)"},
            {"list_id": 24376999, "type_name": "📺 高分剧集 (>2010)"},
            {"list_id": 5046722, "type_name": "🇯🇵 亚洲情色_日本"},
        ]

        self.categories = []
        self.category_list_map = {}
        
        for item in new_categories_data:
            type_id = f"list_{item['list_id']}"
            self.categories.append({
                "type_id": type_id,
                "type_name": item['type_name']
            })
            self.category_list_map[type_id] = item['list_id']

        self.home_list_id = 2142788 
    
    def getName(self):
        return "NullBR_Magnet_Mod"
    
    def init(self, extend):
        pass
    
    def isVideoFormat(self, url):
        pass
    
    def manualVideoCheck(self):
        pass
    
    def _make_request(self, endpoint, params=None, need_auth=False):
        url = f"{self.api_url}{endpoint}"
        headers = self.headers.copy()
        if need_auth:
            headers['X-API-KEY'] = self.api_key
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            if response.status_code == 429:
                return None
            response.raise_for_status()
            return response.json()
        except Exception:
            return None
    
    def _build_video_info(self, item, media_type):
        poster_path = item.get('poster', '')
        poster = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path and poster_path.startswith('/') else poster_path
        vod_id = f"{media_type}_{item.get('tmdbid', '')}"
        vote = item.get('vote_average') or item.get('vote') or 0
        year = (item.get('release_date', '') or '')[:4]
        flags = ""
        if item.get('ed2k-flg', 0) == 1:
            flags += "⚡"
        if item.get('magnet-flg', 0) == 1:
            flags += "🧲"
        if item.get('video-flg', 0) == 1:
            flags += "🎬"
        return {
            "vod_id": vod_id,
            "vod_name": item.get('title', ''),
            "vod_pic": poster or "https://via.placeholder.com/300x450?text=No+Image",
            "vod_remarks": f"⭐{vote} {year} {flags}".strip()
        }

    def homeContent(self, filter):
        return {"class": self.categories}

    def homeVideoContent(self):
        videos = []
        list_id = self.home_list_id 
        data = self._make_request(f"/list/{list_id}")
        if data and "items" in data:
            for item in data["items"][:12]:
                videos.append(self._build_video_info(item, item.get("media_type", "movie")))
        return {'list': videos}

    def categoryContent(self, cid, pg, filter, ext):
        pg = int(pg) if pg else 1
        list_id = self.category_list_map.get(cid) 
        if not list_id:
            return self.searchContentPage(cid, False, pg)
        data = self._make_request(f"/list/{list_id}", {"page": pg})
        videos = []
        if data and "items" in data:
            for item in data["items"]:
                videos.append(self._build_video_info(item, item.get("media_type", "movie")))
        return {
            'list': videos,
            'page': pg,
            'pagecount': data.get('total_page', 1) if data else 1,
            'limit': 20,
            'total': data.get('total_items', 0) if data else 0
        }

    def detailContent(self, ids):
        vod_id = ids[0]
        if "_" in vod_id:
            media_type, tmdbid = vod_id.split("_", 1)
        else:
            media_type = "movie"
            tmdbid = vod_id
        data = self._make_request(f"/{media_type}/{tmdbid}")
        if not data: 
            return {"list": []}
        video_detail = {
            "vod_id": vod_id,
            "vod_name": data.get('title', ''),
            "vod_pic": f"https://image.tmdb.org/t/p/w500{data.get('poster', '')}" if data.get('poster') else "https://via.placeholder.com/300x450",
            "vod_content": data.get('overview', ''),
            "vod_year": (data.get('release_date', '') or '')[:4],
            "vod_remarks": f"Rating:{data.get('vote', data.get('vote_average', ''))}"
        }
        play_from = []
        play_url = []
        
        if data.get('video-flg', 0) == 1:
            if media_type == 'movie':
                video_list_data = self._make_request(f"/{media_type}/{tmdbid}/video", need_auth=True)
                video_urls = []
                if video_list_data and 'video' in video_list_data:
                    for idx, v in enumerate(video_list_data['video'], 1):
                        source = v.get('source', 'Direct')
                        name = v.get('name', f'Route{idx}')
                        link_type = v.get('type', 'm3u8')
                        link = v.get('link', '')
                        if link:
                            display_name = f"{name}[{source}/{link_type}]"
                            video_urls.append(f"{display_name}${link}")
                if video_urls:
                    play_from.append("🎬Online")
                    play_url.append("#".join(video_urls))
            else:
                play_from.append("🎬Online")
                play_url.append(f"{media_type}_{tmdbid}@video")

        if data.get('ed2k-flg', 0) == 1:
            if media_type == 'movie':
                ed2k_data = self._make_request(f"/movie/{tmdbid}/ed2k", need_auth=True)
                ed2k_urls = []
                if ed2k_data and 'ed2k' in ed2k_data:
                    for idx, item in enumerate(ed2k_data['ed2k'], 1):
                        size = item.get('size', 'N/A')
                        res = item.get('resolution') or 'Unk'
                        is_sub = "CN" if item.get('zh_sub') == 1 else ""
                        name = item.get('name', f'ed2k Res {idx}')
                        cleaned_name = re.sub(r'[\[\]\(\)]', ' ', name)
                        display_name = f"[{size}]{res}{is_sub}{cleaned_name[:20]}"
                        real_url = item.get('ed2k', '')
                        if real_url:
                            ed2k_urls.append(f"{display_name}${real_url}")
                if ed2k_urls:
                    play_from.append("⚡Ed2k")
                    play_url.append("#".join(ed2k_urls))
            else:
                play_from.append("⚡Ed2k")
                play_url.append(f"{media_type}_{tmdbid}@ed2k")

        if data.get('magnet-flg', 0) == 1:
            if media_type == 'movie':
                magnet_data = self._make_request(f"/movie/{tmdbid}/magnet", need_auth=True)
                magnet_urls = []
                if magnet_data and 'magnet' in magnet_data:
                    for idx, item in enumerate(magnet_data['magnet'], 1):
                        size = item.get('size', 'N/A')
                        res = item.get('resolution') or 'Unk'
                        is_sub = "CN" if item.get('zh_sub') == 1 else ""
                        name = item.get('name', f'Magnet Res {idx}')
                        cleaned_name = re.sub(r'[\[\]\(\)]', ' ', name)
                        display_name = f"[{size}]{res}{is_sub}{cleaned_name[:20]}"
                        real_url = item.get('magnet', '')
                        if real_url:
                            magnet_urls.append(f"{display_name}${real_url}")
                if magnet_urls:
                    play_from.append("🧲Magnet")
                    play_url.append("#".join(magnet_urls))
            else:
                play_from.append("🧲Magnet")
                play_url.append(f"{media_type}_{tmdbid}@magnet")

        if play_from and play_url:
            video_detail["vod_play_from"] = "$$$".join(play_from)
            video_detail["vod_play_url"] = "$$$".join(play_url)
        return {"list": [video_detail]}

    def playerContent(self, flag, id, vipFlags):
        result = {
            "parse": 0,
            "playUrl": '',
            "url": "",
            "header": {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        }
        
        if id.startswith("magnet:?") or id.startswith("magnet://") or id.startswith("ed2k://"):
            result["url"] = id
            return result
            
        if id.startswith("magnet:///") or "cache/thunder/" in id:
            result["url"] = id
            return result
            
        if id.startswith("http://") or id.startswith("https://"):
            result["url"] = id
            return result
        
        if "@" in id:
            vod_part, resource_type = id.split("@", 1)
            if "_" in vod_part:
                media_type, tmdbid = vod_part.split("_", 1)
            else:
                media_type = "movie"
                tmdbid = vod_part
            
            if media_type == 'tv':
                endpoint = f"/{media_type}/{tmdbid}/{resource_type}"
            else:
                endpoint = f"/{media_type}/{tmdbid}/{resource_type}"

            data = self._make_request(endpoint, need_auth=True)
            
            if data:
                if resource_type == "ed2k" and "ed2k" in data and data["ed2k"]:
                    for item in data["ed2k"]:
                        if item.get("zh_sub") == 1:
                            result["url"] = item.get("ed2k", "")
                            break
                    if not result["url"] and data["ed2k"]:
                        result["url"] = data["ed2k"][0].get("ed2k", "")
                
                elif resource_type == "magnet" and "magnet" in data and data["magnet"]:
                    for item in data["magnet"]:
                        if item.get("zh_sub") == 1:
                            result["url"] = item.get("magnet", "")
                            break
                    if not result["url"] and data["magnet"]:
                        result["url"] = data["magnet"][0].get("magnet", "")
                        
                elif resource_type == "video" and "video" in data:
                    for item in data["video"]:
                        if item.get("type") == "m3u8":
                            result["url"] = item.get("link", "")
                            break
                    if not result["url"] and data["video"]:
                        result["url"] = data["video"][0].get("link", "")
        
        return result

    def searchContentPage(self, key, quick, pg):
        pg = int(pg) if pg else 1
        data = self._make_request("/search", {"query": key, "page": pg})
        videos = []
        if data and "items" in data:
            for item in data["items"]:
                videos.append(self._build_video_info(item, item.get("media_type", "movie")))
        return {
            'list': videos,
            'page': pg,
            'pagecount': data.get('total_pages', 1) if data else 1,
            'limit': 20,
            'total': data.get('total_results', 0) if data else 0
        }
        
    def searchContent(self, key, quick, pg="1"):
        return self.searchContentPage(key, quick, pg)

    def localProxy(self, params):
        return None