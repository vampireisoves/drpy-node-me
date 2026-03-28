# -*- coding: utf-8 -*-
import re
import requests
import time
import json
import base64
from urllib.parse import quote, unquote


class Spider:
    def __init__(self):
        self.name = '酷我听书'
        self.title = '酷我听书[听]'
        self.host = 'http://tingshu.kuwo.cn'
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Referer': 'http://tingshu.kuwo.cn/'
        }
        self.timeout = 10
        
        # 分类信息
        self.classes = [
            {"type_name": "小说", "type_id": "5"},
            {"type_name": "评书", "type_id": "62"}, 
            {"type_name": "资讯", "type_id": "3"},
            {"type_name": "文学", "type_id": "4"},
            {"type_name": "儿童", "type_id": "6"},
            {"type_name": "热门", "type_id": "37"},
            {"type_name": "推荐", "type_id": "1"}
        ]

    # ------------------- 框架必要接口 -------------------
    def getDependence(self): 
        return ['requests']
        
    def getName(self): 
        return self.name
        
    def init(self, extend=""): 
        pass
        
    def isVideoFormat(self, url): 
        return False
        
    def manualVideoCheck(self): 
        pass
        
    def homeContent(self, filter): 
        return {"class": self.classes}
        
    def homeVideoContent(self): 
        return self.categoryContent("37", "1", False, {})

    # ------------------- 业务逻辑 -------------------
    def categoryContent(self, tid, pg, filter, extend):
        try:
            category_id = tid
            page = int(pg)
            url = f"{self.host}/tingshu/api/filter/albums"
            params = {
                "sortType": "tsScore",
                "rn": "20",
                "categoryId": category_id,
                "pn": page
            }
            
            print(f"[categoryContent] 请求URL: {url}, 参数: {params}")
            
            r = requests.get(url, headers=self.headers, params=params, timeout=self.timeout)
            r.raise_for_status()
            data = r.json()
            
            videos = []
            if "data" in data and "data" in data["data"]:
                items = data["data"]["data"]
                for item in items:
                    title = item.get("albumName", "").strip()
                    pic = item.get("coverImg", "")
                    album_id = item.get("albumId", "")
                    remark = item.get("title", "") or f"专辑ID:{album_id}"
                    
                    if title and album_id:
                        videos.append({
                            "vod_id": f"album_{album_id}", 
                            "vod_name": title,
                            "vod_pic": self.fix_pic_url(pic), 
                            "vod_remarks": remark
                        })
            
            total = data.get("data", {}).get("total", 0)
            pagecount = (total + 19) // 20 if total else 1
            
            print(f"[categoryContent] 获取到 {len(videos)} 个视频")
            return {
                "list": videos, 
                "page": page, 
                "pagecount": pagecount, 
                "limit": 20, 
                "total": total
            }
            
        except Exception as e:
            print(f"[categoryContent error] {e}")
            return {"list": [], "page": 1, "pagecount": 1, "limit": 0, "total": 0}

    def searchContent(self, key, quick, pg='1'):
        if quick:
            return {"list": [], "page": 1, "pagecount": 1, "limit": 0, "total": 0}
            
        try:
            url = "http://search.kuwo.cn/r.s"
            params = {
                "client": "kt",
                "all": key,
                "ft": "album",
                "newsearch": "1",
                "itemset": "web_2013",
                "cluster": "0",
                "pn": str(int(pg) - 1),
                "rn": "20",
                "rformat": "json",
                "encoding": "utf8",
                "ver": "mbox"
            }
            
            print(f"[searchContent] 搜索关键词: {key}, 页码: {pg}")
            
            r = requests.get(url, headers=self.headers, params=params, timeout=self.timeout)
            r.raise_for_status()
            
            # 处理JSONP响应
            content = r.text
            if content.startswith('(') and content.endswith(')'):
                content = content[1:-1]
            
            data = json.loads(content) if content else {}
            
            videos = []
            if "albumlist" in data and data["albumlist"]:
                for item in data["albumlist"]:
                    title = item.get("name", "")
                    pic = item.get("img", "")
                    album_id = item.get("DC_TARGETID", "").replace("ALBUM_", "")
                    
                    if title and album_id:
                        videos.append({
                            "vod_id": f"album_{album_id}",
                            "vod_name": title,
                            "vod_pic": self.fix_pic_url(pic),
                            "vod_remarks": "搜索结果"
                        })
            
            print(f"[searchContent] 搜索到 {len(videos)} 个结果")
            return {
                "list": videos, 
                "page": int(pg), 
                "pagecount": 999, 
                "limit": 20, 
                "total": 999999
            }
            
        except Exception as e:
            print(f"[searchContent error] {e}")
            return {"list": [], "page": 1, "pagecount": 1, "limit": 0, "total": 0}

    def detailContent(self, array):
        if not array:
            return {"list": []}
            
        vod_id = array[0]
        print(f"[detailContent] 获取详情: {vod_id}")
        
        try:
            # 解析专辑ID
            if vod_id.startswith("album_"):
                album_id = vod_id.replace("album_", "")
            else:
                album_id_match = re.search(r'albumid=(\d+)', vod_id)
                album_id = album_id_match.group(1) if album_id_match else vod_id
            
            # 获取专辑详情
            album_url = f"{self.host}/tingshu/api/www/album/albumInfo"
            params = {"albumId": album_id}
            
            r = requests.get(album_url, headers=self.headers, params=params, timeout=self.timeout)
            r.raise_for_status()
            album_data = r.json().get("data", {})
            
            title = album_data.get("albumName", "酷我听书专辑")
            pic = album_data.get("coverImg", "")
            desc = album_data.get("title", "") or album_data.get("description", "") or "暂无简介"
            author = album_data.get("artist", "") or "未知作者"
            
            # 获取音频列表
            tracks_url = f"{self.host}/tingshu/api/www/track/trackListByAlbumId"
            track_params = {"albumId": album_id, "page": 1, "pageSize": 500}
            
            r_tracks = requests.get(tracks_url, headers=self.headers, params=track_params, timeout=self.timeout)
            r_tracks.raise_for_status()
            tracks_data = r_tracks.json().get("data", {})
            tracks = tracks_data.get("list", [])
            
            play_urls = []
            for index, track in enumerate(tracks):
                track_name = track.get("name", "").strip()
                track_id = track.get("trackId", "")
                if not track_name:
                    track_name = f"第{index + 1}集"
                
                if track_id:
                    play_url = f"track_{track_id}"
                    play_urls.append(f"{track_name}${play_url}")
            
            # 如果没有获取到音频列表，创建默认播放项
            if not play_urls:
                play_urls.append(f"第1集${vod_id}$$1")
            
            play_from = "酷我听书"
            play_url = "#".join(play_urls) if play_urls else f"默认${vod_id}$$1"
            
            vod = {
                "vod_id": vod_id,
                "vod_name": title,
                "vod_pic": self.fix_pic_url(pic),
                "vod_content": desc,
                "vod_director": author,
                "vod_play_from": play_from,
                "vod_play_url": play_url
            }
            
            print(f"[detailContent] 成功获取详情，共 {len(play_urls)} 个音频")
            return {"list": [vod]}
            
        except Exception as e:
            print(f"[detailContent error] {e}")
            # 返回基本详情结构，确保能进入播放器
            vod = {
                "vod_id": vod_id,
                "vod_name": "酷我听书专辑",
                "vod_pic": "",
                "vod_content": "获取详情失败",
                "vod_play_from": "酷我听书",
                "vod_play_url": f"第1集${vod_id}$$1"
            }
            return {"list": [vod]}

    def playerContent(self, flag, id, vipFlags):
        print(f"[playerContent] 开始处理播放请求: {id}")
        
        try:
            # 解析track_id
            if id.startswith("track_"):
                track_id = id.replace("track_", "")
            else:
                track_id_match = re.search(r'rid=(\w+)', id)
                track_id = track_id_match.group(1) if track_id_match else id
            
            print(f"[playerContent] 解析出的track_id: {track_id}")
            
            # 方法1: 使用主API获取播放地址
            play_url = self.get_play_url_primary(track_id)
            if play_url:
                print(f"[playerContent] 主API获取成功: {play_url}")
                return {
                    "parse": 0, 
                    "playUrl": "", 
                    "url": play_url, 
                    "header": self.get_play_headers()
                }
            
            # 方法2: 使用备用API
            play_url = self.get_play_url_backup(track_id)
            if play_url:
                print(f"[playerContent] 备用API获取成功: {play_url}")
                return {
                    "parse": 0, 
                    "playUrl": "", 
                    "url": play_url, 
                    "header": self.get_play_headers()
                }
            
            # 方法3: 使用第三方解析
            play_url = self.get_play_url_third(track_id)
            if play_url:
                print(f"[playerContent] 第三方解析成功: {play_url}")
                return {
                    "parse": 0, 
                    "playUrl": "", 
                    "url": play_url, 
                    "header": self.get_play_headers()
                }
            
            print(f"[playerContent] 所有方法都失败，使用原始ID")
            return {
                "parse": 1,  # 尝试让播放器自己解析
                "playUrl": "", 
                "url": id, 
                "header": self.get_play_headers()
            }
                
        except Exception as e:
            print(f"[playerContent error] {e}")
            return {
                "parse": 1,
                "playUrl": "", 
                "url": id, 
                "header": self.get_play_headers()
            }

    def get_play_url_primary(self, track_id):
        """主API获取播放地址"""
        try:
            url = "http://antiserver.kuwo.cn/anti.s"
            params = {
                "type": "convert_url",
                "rid": f"MUSIC_{track_id}",
                "format": "mp3",
                "response": "url"
            }
            
            r = requests.get(url, headers=self.headers, timeout=self.timeout)
            if r.status_code == 200:
                content = r.text.strip()
                if content.startswith('http'):
                    return content
            return None
        except:
            return None

    def get_play_url_backup(self, track_id):
        """备用API获取播放地址"""
        try:
            url = "http://mobi.kuwo.cn/mobi.s"
            params = {
                "f": "web",
                "type": "convert_url2",
                "rid": track_id,
                "format": "mp3",
                "response": "url",
                "br": "128kmp3"
            }
            
            r = requests.get(url, headers=self.headers, timeout=self.timeout)
            if r.status_code == 200:
                content = r.text.strip()
                if content.startswith('http'):
                    return content
            return None
        except:
            return None

    def get_play_url_third(self, track_id):
        """第三方解析获取播放地址"""
        try:
            url = "http://www.kuwo.cn/api/v1/www/music/playUrl"
            params = {
                "mid": track_id,
                "type": "music",
                "plat": "web",
                "httpsStatus": 1
            }
            
            headers = self.headers.copy()
            headers['Referer'] = 'http://www.kuwo.cn/'
            headers['csrf'] = '123456'
            
            r = requests.get(url, headers=headers, params=params, timeout=self.timeout)
            if r.status_code == 200:
                data = r.json()
                if data.get("code") == 200:
                    play_url = data.get("data", {}).get("url", "")
                    if play_url:
                        return play_url
            return None
        except:
            return None

    def get_play_headers(self):
        """获取播放专用请求头"""
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'identity',
            'Connection': 'keep-alive',
            'Range': 'bytes=0-',
            'Referer': 'http://tingshu.kuwo.cn/'
        }

    def fix_pic_url(self, pic_url):
        """修复图片URL"""
        if not pic_url:
            return ""
        if pic_url.startswith('//'):
            return 'http:' + pic_url
        elif pic_url.startswith('/'):
            return 'http://tingshu.kuwo.cn' + pic_url
        elif not pic_url.startswith('http'):
            return 'http://tingshu.kuwo.cn/' + pic_url
        return pic_url

    # ------------------- 工具方法 -------------------
    def _page(self, videos, pg):
        return {
            "list": videos, 
            "page": int(pg), 
            "pagecount": 9999, 
            "limit": 20, 
            "total": 999999
        }

    @property
    def config(self):
        return {"player": {}, "filter": {}}
        
    @property  
    def header(self):
        return self.headers

    def localProxy(self, param):
        return {}