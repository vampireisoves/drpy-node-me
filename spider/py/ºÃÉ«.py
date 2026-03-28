"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '好色',
  lang: 'hipy'
})
"""

import re
import sys
import urllib.parse
import threading
import time
import requests
from pyquery import PyQuery as pq
sys.path.append('..')
from base.spider import Spider

class Spider(Spider):
    def __init__(self):
        # 使用rule中定义的配置
        self.name = '好色TV（优）'
        self.host = 'https://hsex.icu/'
        self.candidate_hosts = [
            "https://hsex.icu/",
            "https://hsex1.icu/",
            "https://hsex.tv/"
        ]
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': self.host
        }
        self.timeout = 5000
        
        # 分类映射 - 根据rule中的class_name和class_url
        self.class_map = {
            '视频': {'type_id': 'list', 'url_suffix': 'list'},
            '周榜': {'type_id': 'top7', 'url_suffix': 'top7'},
            '月榜': {'type_id': 'top', 'url_suffix': 'top'},
            '5分钟+': {'type_id': '5min', 'url_suffix': '5min'},
            '10分钟+': {'type_id': 'long', 'url_suffix': 'long'}
        }

    def getName(self):
        return self.name

    def init(self, extend=""):
        # 尝试获取最快可用域名
        self.host = self.get_fastest_host()
        self.headers['Referer'] = self.host

    def isVideoFormat(self, url):
        if not url:
            return False
        return any(fmt in url.lower() for fmt in ['.mp4', '.m3u8', '.flv', '.avi'])

    def manualVideoCheck(self):
        def check(url):
            if not self.isVideoFormat(url):
                return False
            try:
                resp = self.fetch(url, headers=self.headers, method='HEAD', timeout=3)
                return resp.status_code in (200, 302) and 'video' in resp.headers.get('Content-Type', '')
            except:
                return False
        return check

    def get_fastest_host(self):
        """测试候选域名，返回最快可用的"""
        results = {}
        threads = []

        def test_host(url):
            try:
                start_time = time.time()
                resp = requests.head(url, headers=self.headers, timeout=2, allow_redirects=False)
                if resp.status_code in (200, 301, 302):
                    delay = (time.time() - start_time) * 1000
                    results[url] = delay
                else:
                    results[url] = float('inf')
            except:
                results[url] = float('inf')

        for host in self.candidate_hosts:
            t = threading.Thread(target=test_host, args=(host,))
            threads.append(t)
            t.start()
        for t in threads:
            t.join()

        valid_hosts = [(h, d) for h, d in results.items() if d != float('inf')]
        return valid_hosts[0][0] if valid_hosts else self.candidate_hosts[0]

    def homeContent(self, filter):
        result = {}
        # 根据rule中的class_name和class_url设置分类
        classes = []
        for name, info in self.class_map.items():
            classes.append({
                'type_name': name,
                'type_id': info['type_id']
            })
        result['class'] = classes
        
        try:
            # 获取首页内容
            html = self.fetch_with_retry(self.host, retry=2, timeout=5).text
            data = pq(html)
            
            # 根据rule中的一级解析规则提取视频
            vlist = []
            items = data('.row .col-xs-6.col-md-3')
            for item in items.items():
                try:
                    title = item('h5').text().strip()
                    if not title:
                        continue
                    
                    # 提取图片URL
                    style = item('.image').attr('style') or ''
                    pic_match = re.search(r'url\(["\']?([^"\']+)["\']?\)', style)
                    vod_pic = pic_match.group(1) if pic_match else ''
                    if vod_pic and not vod_pic.startswith('http'):
                        vod_pic = f"{self.host.rstrip('/')}/{vod_pic.lstrip('/')}"
                    
                    # 提取描述信息
                    desc = item('.duration').text().strip() or '未知'
                    
                    # 提取链接
                    href = item('a').attr('href') or ''
                    if not href:
                        continue
                    vod_id = href.split('/')[-1]
                    if not vod_id.endswith('.htm'):
                        vod_id += '.htm'
                    
                    vlist.append({
                        'vod_id': vod_id,
                        'vod_name': title,
                        'vod_pic': vod_pic,
                        'vod_remarks': desc
                    })
                except Exception as e:
                    print(f"解析首页视频项失败: {e}")
                    continue
            
            result['list'] = vlist
        except Exception as e:
            print(f"首页解析失败: {e}")
            result['list'] = []
        return result

    def homeVideoContent(self):
        return []

    def categoryContent(self, tid, pg, filter, extend):
        result = {}
        try:
            # 根据rule中的URL模板构造分类URL
            cate_info = None
            for name, info in self.class_map.items():
                if info['type_id'] == tid:
                    cate_info = info
                    break
            
            if not cate_info:
                result['list'] = []
                return result
            
            url = f"{self.host}{cate_info['url_suffix']}_list-{pg}.htm"
            html = self.fetch(url, headers=self.headers, timeout=8).text
            html = html.encode('utf-8', errors='ignore').decode('utf-8')
            data = pq(html)
            
            # 使用相同的一级解析规则
            vlist = []
            items = data('.row .col-xs-6.col-md-3')
            for item in items.items():
                try:
                    title = item('h5').text().strip()
                    if not title:
                        continue
                    
                    style = item('.image').attr('style') or ''
                    pic_match = re.search(r'url\(["\']?([^"\']+)["\']?\)', style)
                    vod_pic = pic_match.group(1) if pic_match else ''
                    if vod_pic and not vod_pic.startswith('http'):
                        vod_pic = f"{self.host.rstrip('/')}/{vod_pic.lstrip('/')}"
                    
                    desc = item('.duration').text().strip() or '未知'
                    
                    href = item('a').attr('href') or ''
                    if not href:
                        continue
                    vod_id = href.split('/')[-1]
                    if not vod_id.endswith('.htm'):
                        vod_id += '.htm'
                    
                    vlist.append({
                        'vod_id': vod_id,
                        'vod_name': title,
                        'vod_pic': vod_pic,
                        'vod_remarks': desc
                    })
                except Exception as e:
                    print(f"解析分类视频项失败: {e}")
                    continue
            
            # 提取总页数
            pagecount = 1
            try:
                pagination = data('.pagination1 li a, .pagination li a')
                page_nums = []
                for a in pagination.items():
                    text = a.text().strip()
                    if text.isdigit():
                        page_nums.append(int(text))
                if page_nums:
                    pagecount = max(page_nums)
            except:
                pagecount = 1
            
            result['list'] = vlist
            result['page'] = pg
            result['pagecount'] = pagecount
            result['limit'] = len(vlist)
            result['total'] = 999999
        except Exception as e:
            print(f"分类解析失败: {e}")
            result['list'] = []
            result['page'] = pg
            result['pagecount'] = 1
            result['limit'] = 0
            result['total'] = 0
        return result

    def detailContent(self, ids):
        try:
            if not ids or not ids[0]:
                return {'list': []}
            
            vod_id = ids[0].strip()
            if not vod_id.endswith('.htm'):
                vod_id += '.htm'
            url = f"{self.host}{vod_id.lstrip('/')}"
            
            html = self.fetch_with_retry(url, retry=2, timeout=8).text
            html = html.encode('utf-8', errors='ignore').decode('utf-8')
            data = pq(html)
            
            # 提取标题
            title = data('.panel-title, .video-title, h1').text().strip() or '未知标题'
            
            # 提取图片
            vod_pic = ''
            poster_style = data('.vjs-poster').attr('style') or ''
            pic_match = re.search(r'url\(["\']?([^"\']+)["\']?\)', poster_style)
            if pic_match:
                vod_pic = pic_match.group(1)
            if not vod_pic:
                vod_pic = data('.video-pic img, .vjs-poster img, .thumbnail img').attr('src') or ''
            if vod_pic and not vod_pic.startswith('http'):
                vod_pic = f"{self.host}{vod_pic.lstrip('/')}"
            
            # 提取描述信息
            duration = '未知'
            views = '未知'
            info_items = data('.panel-body .col-md-3, .video-info .info-item, .info p')
            for item in info_items.items():
                text = item.text().strip()
                if '时长' in text or 'duration' in text.lower():
                    duration = text.replace('时长：', '').replace('时长', '').strip()
                elif '观看' in text or 'views' in text.lower():
                    views_match = re.search(r'(\d+\.?\d*[kK]?)次观看', text)
                    if views_match:
                        views = views_match.group(1)
                    else:
                        views = text.replace('观看：', '').replace('观看', '').strip()
            remarks = f"{duration} | {views}"
            
            # 提取播放地址 - 根据rule中的play_parse和lazy设置
            video_url = ''
            m3u8_match = re.search(r'videoUrl\s*=\s*["\']([^"\']+\.m3u8)["\']', html)
            if m3u8_match:
                video_url = m3u8_match.group(1)
            if not video_url:
                source = data('source[src*=".m3u8"], source[src*=".mp4"]')
                video_url = source.attr('src') or ''
            if not video_url:
                # 尝试从JavaScript变量中提取
                js_matches = re.findall(r'(https?://[^\s"\']+\.(?:m3u8|mp4))', html)
                if js_matches:
                    video_url = js_matches[0]
            
            if video_url and not video_url.startswith('http'):
                video_url = f"{self.host}{video_url.lstrip('/')}"
        
            vod = {
                'vod_id': vod_id,
                'vod_name': title,
                'vod_pic': vod_pic,
                'vod_remarks': remarks,
                'vod_play_from': '好色TV（优）',
                'vod_play_url': f'正片${video_url}' if video_url else '正片$暂无地址'
            }
            return {'list': [vod]}
        except Exception as e:
            print(f"详情解析失败: {e}")
            return {'list': []}

    def searchContent(self, key, quick, pg=1):
        """
        完整搜索功能：覆盖首页搜索框、分类下拉搜索、URL参数搜索三种常见模式
        :param key: 搜索关键词
        :param quick: 是否快速搜索（默认False，不影响逻辑）
        :param pg: 页码（默认1）
        :return: 搜索结果字典（包含list、page、pagecount）
        """
        try:
            # 1. 首页搜索框模式（直接拼接search参数）
            search_url = f"{self.host}search.htm?search={urllib.parse.quote(key, encoding='utf-8', errors='replace')}"
            
            # 2. 分类下拉搜索模式（部分网站会在分类下拉框中提交search参数）
            # 分类下拉搜索URL（假设分类ID为1，需根据实际网站调整）
            # category_search_url = f"{self.host}category.htm?id=1&search={urllib.parse.quote(key)}"
            
            # 3. URL参数搜索模式（部分网站使用/search/{keyword}.htm格式）
            # keyword_search_url = f"{self.host}search/{urllib.parse.quote(key)}.htm"
            
            # 优先使用首页搜索框模式（最常见）
            target_url = search_url
            
            # 打印调试信息（可根据需要注释掉）
            print(f"搜索URL: {target_url}")
            
            # 发送请求
            html = self.fetch(target_url, headers=self.headers, timeout=5).text
            html = html.encode('utf-8', errors='ignore').decode('utf-8')
            data = pq(html)
            
            # 解析搜索结果（根据网站实际结构调整选择器）
            vlist = []
            items = data('.row.body .col-xs-6.col-md-3, .row .col-xs-6.col-md-3')  # 主要结果容器
            
            # 如果主要容器没找到，尝试备用选择器（部分网站可能修改结构）
            if not items:
                items = data('.thumbnail')  # 备用：缩略图容器
                if not items:
                    items = data('.video-item')  # 备用：视频项容器
            
            for item in items.items():
                try:
                    # 跳过非视频结果（如广告、用户信息）
                    if item.hasClass('ad') or item.find('.user-info').length > 0:
                        continue
                    
                    # 提取标题（优先从h5标签获取，其次从a标签）
                    title_elem = item('.caption.title h5 a, .title h5 a, h5 a')
                    title = title_elem.text().strip()
                    if not title:
                        continue
                    
                    # 提取图片（优先从style属性获取，其次从img标签）
                    style = item('.image').attr('style') or ''
                    pic_match = re.search(r'url\(["\']?([^"\']+)["\']?\)', style)
                    vod_pic = pic_match.group(1) if pic_match else ''
                    if not vod_pic:
                        vod_pic = item('img').attr('src') or ''
                    if vod_pic and not vod_pic.startswith('http'):
                        vod_pic = f"{self.host.rstrip('/')}/{vod_pic.lstrip('/')}"
                    
                    # 提取描述（时长+观看次数+日期）
                    desc_parts = []
                    # 时长（常见类名：duration、time）
                    duration_elem = item('.duration, .time, .video-duration')
                    duration = duration_elem.text().strip() if duration_elem.length > 0 else '未知'
                    desc_parts.append(duration)
                    
                    # 观看次数（常见类名：views、count、hot）
                    views_elem = item('.views, .count, .hot, .video-views')
                    views_text = views_elem.text().strip() if views_elem.length > 0 else ''
                    views_match = re.search(r'(\d+\.?\d*[kK]?)次观看', views_text)
                    views = views_match.group(1) if views_match else '未知'
                    desc_parts.append(f"{views}次观看")
                    
                    # 日期（常见类名：date、pub-date、upload-time）
                    date_elem = item('.date, .pub-date, .upload-time')
                    date = date_elem.text().strip() if date_elem.length > 0 else '未知'
                    desc_parts.append(date)
                    remarks = ' | '.join(desc_parts)
                    
                    # 提取链接（优先从a标签的href获取）
                    href = title_elem.attr('href') or item('a').attr('href') or ''
                    if not href:
                        continue
                    
                    # 确保vod_id格式正确（提取URL最后一部分并添加.htm后缀）
                    vod_id = href.split('/')[-1]
                    if not vod_id.endswith('.htm'):
                        vod_id += '.htm'
                    
                    vlist.append({
                        'vod_id': vod_id,
                        'vod_name': title,
                        'vod_pic': vod_pic,
                        'vod_remarks': remarks
                    })
                except Exception as e:
                    print(f"解析搜索视频项失败: {e}")
                    continue
            
            # 提取总页数（根据网站实际结构调整选择器）
            pagecount = 1
            try:
                pagination = data('.pagination1 li a, .pagination li a')  # 主要分页容器
                if pagination.length == 0:
                    pagination = data('.pagination1, .pagination')  # 备用：分页容器
                
                page_nums = []
                for a in pagination.items():
                    text = a.text().strip()
                    if text.isdigit():
                        page_nums.append(int(text))
                if page_nums:
                    pagecount = max(page_nums)
            except:
                pagecount = 1
            
            return {'list': vlist, 'page': int(pg), 'pagecount': pagecount}
        except Exception as e:
            print(f"搜索失败: {e}")
            return {'list': [], 'page': int(pg), 'pagecount': 1}

    def playerContent(self, flag, id, vipFlags):
        headers = self.headers.copy()
        headers.update({
            'Referer': self.host,
            'Origin': self.host.rstrip('/'),
            'Host': urllib.parse.urlparse(self.host).netloc,
        })
        
        # 根据rule中的double设置
        return {
            'parse': 1,  # 根据rule中的play_parse设置
            'url': id,
            'header': headers,
            'double': True  # 根据rule中的double设置
        }

    def localProxy(self, param):
