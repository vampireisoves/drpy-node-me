"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '图宅',
  lang: 'hipy'
})
"""

import re, requests
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
        self.sess.mount('https://', HTTPAdapter(max_retries=Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])))

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

    def getImgs(self, h):
        t = re.search(r'<div class="file-detail">(.*?)(?:<div id="pager"|<div class="related-file">)', h, re.S)
        return ["https:" + x if x.startswith("//") else (self.siteUrl + x if x.startswith("/") else x) 
                for x in re.findall(r'<img[^>]+(?:data-src|src)=["\']([^"\']+)["\']', t.group(1) if t else h) 
                if 'avatar' not in x and 'logo' not in x]

    def detailContent(self, ids):
        u = ids[0]
        r = self.fetch(u)
        if not (r and r.ok): return {'list': []}

        def get_max(h):
            m = re.search(r'<div id="pager".*?>(.*?)</div>', h, re.S)
            return max([int(n) for n in re.findall(r'(?:at=|>)(\d+)', m.group(1)) if n.isdigit()] + [1]) if m else 1

        m_pg, b_url = get_max(r.text), u.split('?')[0].rstrip('/')
        
        # 提取真实的基础翻页路径
        pm = re.search(r'<div id="pager".*?>(.*?)</div>', r.text, re.S)
        if pm and (rp := re.search(r'href=["\']([^"\']+?)\?at=\d+', pm.group(1))):
            b_url = self.siteUrl + rp.group(1) if rp.group(1).startswith('/') else rp.group(1)

        # 动态探测深层隐藏页码 (最多探10次)
        c_pg = m_pg
        for _ in range(10):
            if c_pg <= 1 or not (pr := self.fetch(f"{b_url}?at={c_pg}")) or not pr.ok: break
            if (nm := get_max(pr.text)) > c_pg: c_pg = m_pg = nm
            else: break

        # 构造选集列表
        pl = f"第1页${u}" + "".join(f"#第{i}页${b_url}?at={i}" for i in range(2, m_pg + 1))
        return {'list': [{'vod_id': u, 'vod_name': '', 'type_name': '美图', 'vod_play_from': '图宅', 'vod_play_url': pl}]}

    def searchContent(self, key, quick, pg=1):
        return self.postList(f"{self.siteUrl}/search/{pg}?term={key}", int(pg))

    def playerContent(self, flag, id, vipFlags):
        r = self.fetch(id)
        if not (r and r.ok): return {}
        
        # 选集模式下：传进来哪页就只抓哪页，去重后直接返回
        res = []
        for x in self.getImgs(r.text):
            if x not in res: res.append(x)
            
        return {"parse": 0, "url": "pics://" + "&&".join(res) if res else "", "header": ""}
