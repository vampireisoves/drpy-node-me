# -*- coding: utf-8 -*-
# by @嗷呜
import re
import json
import threading
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlencode
from base.spider import Spider

class Spider(Spider):

    def init(self, extend=""):
        if extend:
            hosts = json.loads(extend).get('site', "")
        else:
            hosts = "https://kissjav.com"
        self.host = self.host_late(hosts) if isinstance(hosts, (str, list)) and len(hosts.split(',')) > 1 else hosts.strip()
        self.session = requests.Session()
        self.session.headers.update(self.getheaders())

    def getName(self):
        return "KissJAV"

    def isVideoFormat(self, url):
        return ".mp4" in url or ".m3u8" in url

    def manualVideoCheck(self):
        pass

    def destroy(self):
        pass

    # -------------------- 1. 首页分类 --------------------
    def homeContent(self, filter):
        classes = [
            {"type_name": "Latest", "type_id": "latest-updates"},
            {"type_name": "Top Rated", "type_id": "top-rated"},
            {"type_name": "Most Viewed", "type_id": "most-popular"},
            {"type_name": "Categories", "type_id": "categories"},
            {"type_name": "KVIP", "type_id": "categories/vip"},
            {"type_name": "JVIP", "type_id": "categories/jvip"},
            {"type_name": "HOT", "type_id": "most-popular/?sort_by=video_viewed_today"},
        ]
        filters = {
            "latest-updates": [{"key": "sort", "name": "排序", "value": [
                {"n": "最新", "v": "post_date"}, {"n": "最多观看", "v": "video_viewed"},
                {"n": "最高评分", "v": "rating"}, {"n": "最长", "v": "duration"}
            ]}],
        }
        return {"class": classes, "filters": filters}

    # -------------------- 辅助: 解析视频列表 --------------------
    def _parse_videos(self, soup):
        videos = []
        for div in soup.select("div.thumb"):
            a = div.select_one("a")
            img = div.select_one("img")
            if a and img:
                videos.append({
                    "vod_id": a["href"].split("/")[-2],
                    "vod_name": a["title"],
                    "vod_pic": img.get("data-original") or img["src"],
                    "vod_remarks": div.select_one("div.time").get_text(strip=True) if div.select_one("div.time") else ""
                })
        return videos

    # -------------------- 2. 首页推荐 --------------------
    def homeVideoContent(self):
        url = urljoin(self.host, "/")
        r = self.fetch(url)
        soup = BeautifulSoup(r.text, "html.parser")
        return {"list": self._parse_videos(soup)}

    # -------------------- 3. 分类页 --------------------
    def categoryContent(self, tid, pg, filter, extend):
        sort = extend.get("sort", None)
        pg = int(pg)
        base_path = tid.split('?')[0]
        query_params = {}
        if '?' in tid:
            query_str = tid.split('?', 1)[1]
            query_params = dict(p.split('=') for p in query_str.split('&') if p)
        if sort:
            query_params['sort_by'] = sort
        url_path = f"{base_path.rstrip('/')}/" if pg == 1 else f"{base_path.rstrip('/')}/{pg}/"
        query = urlencode(query_params) if query_params else ''
        path = url_path + ('?' + query if query else '')
        url = urljoin(self.host, path)
        r = self.fetch(url)
        soup = BeautifulSoup(r.text, "html.parser")
        videos = self._parse_videos(soup)
        last_pg = 999
        pages = soup.select("div.pagination a")
        if pages:
            nums = [int(p.text) for p in pages if p.text.isdigit()]
            last_pg = max(nums) if nums else 999
        return {
            "list": videos,
            "page": pg,
            "pagecount": last_pg,
            "limit": 48,
            "total": 999999
        }

    # -------------------- 4. 详情页（修复版） --------------------
    def detailContent(self, ids):
        vid = ids[0]
        url = urljoin(self.host, f"/video/{vid}/")
        r = self.fetch(url)
        soup = BeautifulSoup(r.text, "html.parser")
        text = r.text

        # 尝试从 flashvars 获取 mp4 和 preview_url
        mp4 = ""
        preview_url = ""
        flashvars_match = re.search(r'flashvars\s*=\s*({[^}]+?video_url[^}]+})', text)
        if flashvars_match:
            flashvars_str = flashvars_match.group(1)
            flashvars_str = re.sub(r'(\w+):', r'"\1":', flashvars_str).replace("'", '"')
            try:
                flash_json = json.loads(flashvars_str)
                mp4 = flash_json.get("video_url", "").strip()
                preview_url = flash_json.get("preview_url", "")
            except json.JSONDecodeError:
                pass

        # 备选: 直接正则匹配 video_url
        if not mp4:
            video_url_match = re.search(r"video_url\s*:\s*'([^']+)'", text)
            if video_url_match:
                mp4 = video_url_match.group(1).strip()

        # 备选: 从下载链接获取
        if not mp4:
            download_link = soup.select_one("a.download-link")
            if download_link and "href" in download_link.attrs:
                mp4 = download_link["href"].split("?")[0]

        # 降级方案
        if not mp4:
            mp4 = f"{self.host}/get_file/7/5950d917fc788e62949551789342b7ba/{int(vid)//1000}000/{vid}/{vid}.mp4/?br=3196"

        # 标题
        title = vid
        title_elem = soup.select_one("h1.title")
        if title_elem:
            title = title_elem.get_text(strip=True)

        # 描述
        description = ""
        desc_elem = soup.select_one("meta[property='og:description']")
        if desc_elem:
            description = desc_elem["content"]

        # 预览图 (备选)
        if not preview_url:
            preview_elem = soup.select_one("meta[property='og:image']")
            if preview_elem:
                preview_url = preview_elem["content"]

        vod = {
            "vod_id": vid,
            "vod_name": title,
            "vod_pic": preview_url,
            "vod_content": description,
            "vod_play_from": "KissJAV",
            "vod_play_url": f"在线播放${mp4}"
        }
        return {"list": [vod]}

    # -------------------- 5. 搜索 --------------------
    def searchContent(self, key, quick, pg="1"):
        url = urljoin(self.host, f"/search/{key}/")
        r = self.fetch(url)
        soup = BeautifulSoup(r.text, "html.parser")
        return {"list": self._parse_videos(soup), "page": pg}

    # -------------------- 6. 播放 --------------------
    def playerContent(self, flag, id, vipFlags):
        return {"parse": 0, "url": id, "header": self.getheaders()}

    # -------------------- 7. 工具 --------------------
    def localProxy(self, param):
        pass

    def host_late(self, hosts):
        if isinstance(hosts, str):
            urls = [u.strip() for u in hosts.split(',')]
        else:
            urls = hosts
        if len(urls) <= 1:
            return urls[0] if urls else ''

        results = {}
        def test_host(url):
            try:
                start = time.time()
                requests.head(url, timeout=1.0, allow_redirects=False)
                results[url] = (time.time() - start) * 1000
            except Exception:
                results[url] = float('inf')

        threads = [threading.Thread(target=test_host, args=(u,)) for u in urls]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        return min(results, key=results.get)

    def fetch(self, url):
        return self.session.get(url, timeout=10)

    def getheaders(self, param=None):
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Referer": self.host + "/"
        }