# -*- coding: utf-8 -*-
import re
import requests
import time
import hmac
import hashlib
from datetime import datetime, timedelta


class Spider:
    def __init__(self):
        self.name = '蜻蜓FM电台'
        self.host = 'https://www.qtfm.cn'
        self.m_host = 'https://m.qtfm.cn'
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-S901U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        # 地区分类
        self.classes = []
        category_str = ("广东$239#浙江$99#北京$3#天津$5#河北$7#上海$83#山西$19#内蒙古$31#辽宁$44#吉林$59#黑龙江$69#"
                        "江苏$85#安徽$111#福建$129#江西$139#山东$151#河南$169#湖北$187#湖南$202#广西$239#海南$254#"
                        "重庆$257#四川$259#贵州$281#云南$291#陕西$316#甘肃$327#宁夏$351#新疆$357#西藏$308#青海$342")
        for item in category_str.split('#'):
            if '$' in item:
                name, cid = item.split('$')
                self.classes.append({"type_name": name, "type_id": cid})

    # ------------------- 框架必要接口 -------------------
    def getDependence(self): return ['requests']
    def getName(self): return self.name
    def init(self, extend=""): pass
    def isVideoFormat(self, url): return False
    def manualVideoCheck(self): pass
    def homeContent(self, filter): return {"class": self.classes}
    def homeVideoContent(self): return self.categoryContent("5", "1", False, {})

    # ------------------- 业务逻辑 -------------------
    def categoryContent(self, tid, pg, filter, extend):
        category_id = tid if tid and tid != "0" else "5"
        url = f"http://rapi.qingting.fm/categories/{category_id}/channels"
        params = {"with_total": "true", "page": pg, "pagesize": 30}
        try:
            r = requests.get(url, headers=self.headers, params=params, timeout=10)
            r.raise_for_status()
            items = r.json().get("Data", {}).get("items", [])
            videos = []
            for item in items:
                title = item.get("title", "").strip()
                pic = item.get("cover", "")
                if pic and pic.startswith('//'):
                    pic = 'https:' + pic
                cid = item.get("content_id", "")
                link = f"https://m.qtfm.cn/channels/{cid}/" if cid else ""
                now_play = item.get("nowplaying", {})
                remark = now_play.get("name") or now_play.get("title") or ""
                videos.append({"vod_id": link, "vod_name": title,
                               "vod_pic": pic, "vod_remarks": remark})
            total = r.json().get("Data", {}).get("total", 0)
            pagecount = (total // 30) + 1 if total else 1
            return {"list": videos, "page": int(pg), "pagecount": pagecount, "limit": 30, "total": total}
        except Exception as e:
            print(f"[categoryContent error] {e}")
            return self._page([], pg)

    def searchContent(self, key, quick, pg='1'):
        return self._page([], pg)

    # ✅ 修复：不再去 desktop 页解析 title，直接用列表里的名称
    def detailContent(self, array):
        vod_url = array[0]                                    # 形如 https://m.qtfm.cn/channels/20212227/
        cid = vod_url.split('/channels/')[1].rstrip('/')
        # 从列表页缓存里拿名称（若框架没传，可再发一次列表请求）
        try:
            # 这里简单再调一次列表接口，仅拿第一条匹配
            r = requests.get(
                f"http://rapi.qingting.fm/categories/0/channels",
                params={"page": 1, "pagesize": 200},         # 一次性多拿点
                headers=self.headers,
                timeout=10
            )
            r.raise_for_status()
            items = r.json().get("Data", {}).get("items", [])
            title = next((i["title"].strip()
                         for i in items if str(i.get("content_id")) == cid), "蜻蜓电台")
        except Exception:
            title = "蜻蜓电台"

        pic = ""                                              # 封面非必需，可留空
        live_url = self._get_live_url(cid)                   # 构造直链
        play_from = self.name
        play_url = f"直播${live_url}"

        vod = {
            "vod_id": vod_url,
            "vod_name": title,
            "vod_pic": pic,
            "vod_content": title,
            "vod_play_from": play_from,
            "vod_play_url": play_url
        }
        return {"list": [vod]}

    def playerContent(self, flag, id, vipFlags):
        return {"parse": 0, "playUrl": "", "url": id, "header": self.headers}

    # ------------------- 工具方法 -------------------
    def _page(self, videos, pg):
        return {"list": videos, "page": int(pg), "pagecount": 9999, "limit": 30, "total": 999999}

    config = {"player": {}, "filter": {}}
    header = property(lambda self: self.headers)

    def localProxy(self, param):
        return {}

    # HMAC 构造直播地址
    def _get_live_url(self, cid):
        t = f"/live/{cid}/64k.mp3"
        ts_unix = int(time.time() + 3600)
        n = hex(ts_unix)[2:].lower()
        i = t.replace('/', '%2F')
        a = f"app_id=web&path={i}&ts={n}"
        secret = b"Lwrpu$K5oP"
        o = hmac.new(secret, a.encode('utf-8'), hashlib.md5).hexdigest()
        return f"https://lhttp.qtfm.cn{t}?app_id=web&ts={n}&sign={o}"
