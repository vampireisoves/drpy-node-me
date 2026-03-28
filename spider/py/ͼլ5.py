"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '图宅',
  lang: 'hipy'
})
"""

import sys, re, json, requests, concurrent.futures
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from base.spider import Spider

requests.packages.urllib3.disable_warnings()

class Spider(Spider):
    def getName(self): return "图宅"
    
    def init(self, extend=""):
        super().init(extend)
        self.siteUrl = "https://down.nigx.cn/tuzac.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'
        }
        self.sess = requests.Session()
        # 增加连接池大小，提高并发请求速度
        self.sess.mount('https://', HTTPAdapter(pool_connections=30, pool_maxsize=30, max_retries=Retry(total=2, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])))

    def fetch(self, url):
        try: 
            return self.sess.get(url, headers=self.headers, timeout=6, verify=False)
        except:
            return None

    def homeContent(self, filter):
        cats = [
            {"type_name":"最新","type_id":"newest"},
            {"type_name":"女神","type_id":"tags/女神"},
            {"type_name":"美胸","type_id":"tags/美胸"},
            {"type_name":"AI","type_id":"tags/ai美女"},
            {"type_name":"黑丝","type_id":"tags/黑丝"},
            {"type_name":"大尺度","type_id":"tags/大尺度"},
            {"type_name":"无圣光","type_id":"tags/无圣光"},
            {"type_name":"萝莉","type_id":"tags/萝莉"},
            {"type_name":"Cosplay","type_id":"tags/Cosplay"},
            {"type_name":"私房","type_id":"tags/私房"},
            {"type_name":"尤物","type_id":"tags/尤物"},
            {"type_name":"全部分类","type_id":"all-tags"}
        ]
        return {'class': cats}

    def categoryContent(self, tid, pg, filter, extend):
        # 构建分类URL
        if tid == 'newest':
            url = f"{self.siteUrl}/{tid}/{pg}"
        elif tid == 'all-tags':
            url = f"{self.siteUrl}/{tid}"
        else:
            # 处理标签分类
            url = f"{self.siteUrl}/{tid}/{pg}"
        return self.postList(url, int(pg))

    def postList(self, url, pg):
        r = self.fetch(url)
        l = []
        if r and r.ok:
            h = r.text
            # 尝试多种文章匹配方式
            article_patterns = [
                r'<article[^>]*>(.*?)</article>',
                r'<div[^>]*class=["\']?post["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?entry["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?item["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?article["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?post-item["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?article-item["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?item-card["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?card["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?post-card["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?tag-item["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?tag-card["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?category-item["\']?[^>]*>(.*?)</div>',
                r'<div[^>]*class=["\']?category-card["\']?[^>]*>(.*?)</div>'
            ]
            
            # 去重集合
            seen_urls = set()
            
            for pattern in article_patterns:
                for m in re.finditer(pattern, h, re.S):
                    t = m.group(1)
                    href = re.search(r'href=["\']([^"\']+)["\']', t)
                    img = re.search(r'data-src=["\']([^"\']+)["\']', t) or re.search(r'src=["\']([^"\']+)["\']', t)
                    title = re.search(r'title=["\']([^"\']+)["\']', t) or re.search(r'<h\d[^>]*>(.*?)</h\d>', t, re.S) or re.search(r'<span[^>]*>(.*?)</span>', t, re.S) or re.search(r'<div[^>]*>(.*?)</div>', t, re.S)
                    note = re.search(r'teaser-file-info"[^>]*>(.*?)<', t, re.S) or re.search(r'<p[^>]*>(.*?)<', t, re.S)
                    
                    # 过滤条件
                    if href and href.group(1) not in seen_urls:
                        u = href.group(1)
                        # 过滤掉导航链接和非文章链接
                        if any(keyword in u.lower() for keyword in ['#', 'javascript:', 'search', 'login', 'register', 'home', 'about', 'contact']):
                            continue
                        
                        # 提取标题
                        title_text = ""
                        if title:
                            title_text = title.group(1).strip()
                            # 过滤掉导航相关的标题
                            if any(keyword in title_text.lower() for keyword in ['go back', 'search', '返回', '搜索']):
                                continue
                            # 过滤掉空标题或只有空格的标题
                            if not title_text or title_text.isspace():
                                continue
                        else:
                            continue
                        
                        # 提取图片
                        p = ""
                        if img:
                            p = img.group(1)
                            # 处理图片URL
                            if p.startswith("//"): p = "https:" + p
                            if not p.startswith("http") and p:
                                if p.startswith("/"):
                                    p = self.siteUrl + p
                                else:
                                    p = self.siteUrl + '/' + p
                        else:
                            # 跳过没有图片的项目
                            continue
                        
                        # 提取备注
                        note_text = note.group(1).strip() if note else ""
                        
                        # 添加到列表
                        seen_urls.add(u)
                        l.append({
                            'vod_id': self.siteUrl + u if u.startswith("/") else u,
                            'vod_name': title_text,
                            'vod_pic': p,
                            'vod_remarks': note_text,
                            'style': {"type": "rect", "ratio": 1.33}
                        })
        return {'list': l, 'page': pg, 'pagecount': pg + 1 if len(l) else pg, 'limit': 20, 'total': 9999}

    def detailContent(self, ids):
        return {'list': [{'vod_id': ids[0], 'vod_name': '', 'type_name': '美图', 'vod_play_from': '图宅', 'vod_play_url': '点击浏览$' + ids[0]}]}

    def searchContent(self, key, quick, pg=1):
        # 构建搜索URL
        url = f"{self.siteUrl}/search/page/{pg}?s={key}"
        return self.postList(url, int(pg))

    def playerContent(self, flag, id, vipFlags):
        # 解析id参数
        # 移除任何分批加载标记，直接使用原始URL
        if '||' in id:
            # 处理URL中可能包含||的情况
            parts = id.split('||')
            # 只取最后一个||之前的部分作为base_url
            base_url = '||'.join(parts[:-1])
        else:
            base_url = id
        
        seen = set()
        all_imgs = []
        
        # 处理第一页
        r = self.fetch(base_url)
        if not (r and r.ok):
            return {"parse": 0, "url": "", "header": ""}
        
        h = r.text
        
        # 提取当前页面的图片
        p1_imgs = self.getImgs(h)
        for img in p1_imgs:
            if img not in seen:
                seen.add(img)
                all_imgs.append(img)
        
        # 提取分页信息
        def get_max_page(html):
            try:
                m = re.search(r'<div id="pager".*?>(.*?)</div>', html, re.S)
                if m:
                    page_numbers = re.findall(r'(?:at=|>)(\d+)', m.group(1))
                    return max([int(n) for n in page_numbers if n.isdigit()] + [1])
                return 1
            except:
                return 1
        
        # 构造基础URL
        base_url_no_param = base_url.split('?')[0].rstrip('/')
        
        # 提取分页信息
        pm = re.search(r'<div id="pager".*?>(.*?)</div>', h, re.S)
        if pm and (rp := re.search(r'href=["\']([^"\']+?)\?at=\d+', pm.group(1))):
            if rp.group(1).startswith('/'):
                base_url_no_param = self.siteUrl + rp.group(1)
            else:
                base_url_no_param = rp.group(1)
        
        # 获取最大页码
        target_max = max(get_max_page(h), 35)
        fetched = {1}
        to_fetch = list(range(2, target_max + 1))
        
        # 批量获取分页内容
        while to_fetch and len(fetched) <= 200:
            cur_max = target_max
            # 使用多线程并发请求
            with concurrent.futures.ThreadPoolExecutor(25) as executor:
                future_to_page = {executor.submit(self.fetch, f"{base_url_no_param}?at={page}"): page for page in to_fetch}
                for future in concurrent.futures.as_completed(future_to_page):
                    page = future_to_page[future]
                    fetched.add(page)
                    try:
                        if (r2 := future.result()) and r2.ok:
                            imgs = self.getImgs(r2.text)
                            if imgs and imgs != p1_imgs:
                                for img in imgs:
                                    if img not in seen:
                                        seen.add(img)
                                        all_imgs.append(img)
                                cur_max = max(cur_max, get_max_page(r2.text))
                    except:
                        pass
            
            to_fetch = [i for i in range(target_max + 1, cur_max + 1) if i not in fetched]
            target_max = cur_max
        
        # 构造返回结果
        # 一次性返回所有图片
        result_url = "pics://" + "&&".join(all_imgs) if all_imgs else ""
        
        # 打印调试信息
        print(f"获取到的图片总数: {len(all_imgs)}")
        
        return {"parse": 0, "url": result_url, "header": ""}

    def getImgs(self, h):
        seen = set()
        imgs = []
        
        # 提取主要内容区域，只获取正文图片
        # 避免获取底部推荐图片
        content_match = re.search(r'<div class="file-detail">(.*?)<div id="pager"', h, re.S)
        if not content_match:
            content_match = re.search(r'<div class="file-detail">(.*?)<div class="related-file">', h, re.S)
        if not content_match:
            content_match = re.search(r'<div class="file-detail">(.*?)</div>', h, re.S)
        
        if content_match:
            t = content_match.group(1)
        else:
            # 如果没有找到主要内容区域，使用整个页面
            t = h
        
        # 提取所有图片URL，包括data-src和src属性
        # 使用更宽松的正则表达式，确保能匹配所有图片
        img_pattern = re.compile(r'<img[^>]*?(?:data-src|src)=["\']([^"\']+)["\']', re.I | re.S)
        img_urls = img_pattern.findall(t)
        
        for img_url in img_urls:
            if self._process_image_url(img_url, seen):
                imgs.append(img_url)
        
        return imgs
    
    def _process_image_url(self, img_url, seen):
        """处理图片URL并去重"""
        if not img_url:
            return False
        
        # 过滤掉小图标和无关图片
        if any(ext in img_url.lower() for ext in ['.gif', '.ico', 'avatar', 'logo']):
            return False
        
        # 处理相对URL
        if img_url.startswith("//"):
            img_url = "https:" + img_url
        elif not img_url.startswith("http"):
            # 尝试构造绝对URL
            if img_url.startswith("/"):
                img_url = self.siteUrl + img_url
            else:
                # 相对路径
                img_url = self.siteUrl + '/' + img_url
        
        # 去重
        if img_url in seen:
            return False
        seen.add(img_url)
        return True
