"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '图宅',
  lang: 'hipy'
})
"""

import re, requests, concurrent.futures
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from base.spider import Spider

requests.packages.urllib3.disable_warnings()

class Spider(Spider):
    def getName(self): return "图宅"
    
    def init(self, extend=""):
        super().init(extend)
        self.siteUrl = "https://down.nigx.cn/tuzac.com"
        self.headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'}
        self.sess = requests.Session()
        self.sess.mount('https://', HTTPAdapter(pool_connections=30, pool_maxsize=30, max_retries=Retry(total=2, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])))

    def fetch(self, url):
        try: return self.sess.get(url, headers=self.headers, timeout=6, verify=False)
        except: return None

    def homeContent(self, filter):
        cats = ["最新|newest", "女神|tags/女神", "美胸|tags/美胸", "AI|tags/ai美女", "黑丝|tags/黑丝", "大尺度|tags/大尺度", "无圣光|tags/无圣光", "萝莉|tags/萝莉", "Cosplay|tags/Cosplay", "私房|tags/私房", "尤物|tags/尤物"]
        return {'class': [{"type_name": c.split('|')[0], "type_id": c.split('|')[1]} for c in cats]}

    def categoryContent(self, tid, pg, filter, extend):
        return self.postList(f"{self.siteUrl}/{tid}/{pg}", int(pg))

    def postList(self, url, pg):
        r, l = self.fetch(url), []
        if r and r.ok:
            for t in re.findall(r'<article[^>]*>(.*?)</article>', r.text, re.S):
                hr, im = re.search(r'href=["\']([^"\']+)["\']', t), re.search(r'(?:data-src|src)=["\']([^"\']+)["\']', t)
                ti, no = re.search(r'title=["\']([^"\']+)["\']', t), re.search(r'teaser-file-info"[^>]*>(.*?)<', t, re.S)
                if hr:
                    u, p = hr.group(1), (im.group(1) if im else "")
                    l.append({
                        'vod_id': self.siteUrl + u if u.startswith("/") else u,
                        'vod_name': ti.group(1) if ti else "未知",
                        'vod_pic': "https:" + p if p.startswith("//") else p,
                        'vod_remarks': no.group(1).strip() if no else "",
                        'style': {"type": "rect", "ratio": 1.33}
                    })
        return {'list': l, 'page': pg, 'pagecount': pg + 1 if l else pg, 'limit': 20, 'total': 9999}

    def detailContent(self, ids):
        return {'list': [{'vod_id': ids[0], 'vod_name': '', 'type_name': '美图', 'vod_play_from': '图宅', 'vod_play_url': '点击浏览$' + ids[0]}]}

    def searchContent(self, key, quick, pg=1):
        return self.postList(f"{self.siteUrl}/search/{pg}?term={key}", int(pg))

    def getImgs(self, h):
        t = re.search(r'<div class="file-detail">(.*?)(?:<div id="pager"|<div class="related-file">)', h, re.S)
        return ["https:" + x if x.startswith("//") else (self.siteUrl + x if x.startswith("/") else x) 
                for x in re.findall(r'<img[^>]+(?:data-src|src)=["\']([^"\']+)["\']', t.group(1) if t else h) 
                if 'avatar' not in x and 'logo' not in x]

    def playerContent(self, flag, id, vipFlags):
        r = self.fetch(id)
        if not (r and r.ok): return {}
        
        imgs_dict, p1_imgs = {1: self.getImgs(r.text)}, self.getImgs(r.text)
        base_url = id.split('?')[0].rstrip('/')
        
        def get_max(h):
            m = re.search(r'<div id="pager".*?>(.*?)</div>', h, re.S)
            return max([int(n) for n in re.findall(r'(?:at=|>)(\d+)', m.group(1)) if n.isdigit()] + [1]) if m else 1

        target_max = max(get_max(r.text), 35)
        pm = re.search(r'<div id="pager".*?>(.*?)</div>', r.text, re.S)
        if pm and (rp := re.search(r'href=["\']([^"\']+?)\?at=\d+', pm.group(1))):
            base_url = self.siteUrl + rp.group(1) if rp.group(1).startswith('/') else rp.group(1)

        fetched, to_fetch = {1}, list(range(2, target_max + 1))
        
        while to_fetch and len(fetched) <= 200:
            cur_max = target_max
            with concurrent.futures.ThreadPoolExecutor(25) as ex:
                f2p = {ex.submit(self.fetch, f"{base_url}?at={p}"): p for p in to_fetch}
                for f in concurrent.futures.as_completed(f2p):
                    p = f2p[f]
                    fetched.add(p)
                    try:
                        if (r2 := f.result()) and r2.ok:
                            imgs = self.getImgs(r2.text)
                            if imgs and imgs != p1_imgs:
                                imgs_dict[p] = imgs
                                cur_max = max(cur_max, get_max(r2.text))
                    except: pass
            
            to_fetch = [i for i in range(target_max + 1, cur_max + 1) if i not in fetched]
            target_max = cur_max

        res = []
        for i in range(1, target_max + 1):
            for img in imgs_dict.get(i, []):
                if img not in res: res.append(img)
                
        return {"parse": 0, "url": "pics://" + "&&".join(res) if res else "", "header": ""}
