"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '爱上你听书网',
  lang: 'hipy'
})
"""

# -*- coding: utf-8 -*-
import sys
import requests
import json
import re
import urllib.parse
sys.path.append('..')
from base.spider import Spider

class Spider(Spider):
    def getName(self):
        return "爱上你听书网"

    def init(self, extend=""):
        print("============爱上你听书网============")
        pass

    def homeContent(self, filter):
        result = {}
        # 先获取首页分析分类结构
        url = 'https://www.230ts.net'
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36"
        }
        try:
            rsp = self.fetch(url, headers=headers)
            content = rsp.text
            classes = self.parse_classes(content)
            result['class'] = classes
        except:
            # 如果解析失败，使用默认分类
            cateManual = {
                "玄幻": "1",
                "修真": "2", 
                "都市": "3",
                "穿越": "4",
                "网游": "5",
                "科幻": "6"
            }
            classes = []
            for k in cateManual:
                classes.append({
                    'type_name': k,
                    'type_id': cateManual[k]
                })
            result['class'] = classes
        return result

    def homeVideoContent(self):
        url = 'https://www.230ts.net'
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36"
        }
        rsp = self.fetch(url, headers=headers)
        content = rsp.text
        videos = self.get_recommend_list(content)
        result = {
            'list': videos
        }
        return result

    def categoryContent(self, tid, pg, filter, extend):
        result = {}
        # 尝试不同的URL格式
        url_formats = [
            'https://www.230ts.net/sort/{0}_{1}.html',
            'https://www.230ts.net/sort/{0}/{1}.html',
            'https://www.230ts.net/fenlei/{0}_{1}.html',
            'https://www.230ts.net/category/{0}/{1}.html'
        ]
        
        content = ""
        for url_format in url_formats:
            try:
                url = url_format.format(tid, pg)
                print("尝试URL:", url)
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36"
                }
                rsp = self.fetch(url, headers=headers)
                content = rsp.text
                if "没有找到相关内容" not in content and "404" not in content:
                    break
            except:
                continue
        
        if not content:
            result['list'] = []
            result['page'] = pg
            result['pagecount'] = 1
            result['limit'] = 90
            result['total'] = 0
            return result
            
        videos = self.get_category_list(content)
        result['list'] = videos
        result['page'] = pg
        result['pagecount'] = 9999 if videos else 1
        result['limit'] = 90
        result['total'] = 999999 if videos else 0
        return result

    def detailContent(self, array):
        tid = array[0]
        if tid.startswith('http'):
            url = tid
        else:
            url = 'https://www.230ts.net' + tid if tid.startswith('/') else 'https://www.230ts.net/' + tid
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36"
        }
        try:
            rsp = self.fetch(url, headers=headers)
            content = rsp.text
        except:
            content = ""
        
        # 解析详情信息
        vod = self.parse_detail_content(content, url)
        
        result = {
            'list': [vod]
        }
        return result

    def searchContent(self, key, quick):
        result = {}
        url = 'https://www.230ts.net/search.html?searchtype=name&searchword={}'.format(urllib.parse.quote(key))
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36"
        }
        try:
            rsp = self.fetch(url, headers=headers)
            content = rsp.text
            videos = self.get_search_list(content, key)
        except:
            videos = []
        
        result['list'] = videos
        return result

    def playerContent(self, flag, id, vipFlags):
        result = {}
        
        # 处理播放地址
        play_url = id.replace("www", "wap")
        
        result["parse"] = 0
        result["playUrl"] = ''
        result["url"] = play_url
        result["header"] = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36",
            "Referer": "https://www.230ts.net/"
        }
        
        return result

    def parse_classes(self, content):
        """解析分类"""
        classes = []
        
        # 多种方式尝试解析分类
        patterns = [
            r'<a[^>]*href="/sort/([^/"]+)/?"[^>]*>([^<]+)</a>',
            r'<a[^>]*href="/fenlei/([^/"]+)/?"[^>]*>([^<]+)</a>',
            r'<li[^>]*>.*?<a[^>]*href="/[^"]*/([^/"]+)/?"[^>]*>([^<]+)</a>.*?</li>'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content, re.S)
            for match in matches:
                type_id, type_name = match
                if type_name not in ['首页', '网站首页', 'Home'] and len(type_name) < 10:
                    classes.append({
                        'type_name': type_name.strip(),
                        'type_id': type_id.strip()
                    })
            if classes:
                break
        
        # 去重
        seen = set()
        unique_classes = []
        for cls in classes:
            if cls['type_name'] not in seen:
                seen.add(cls['type_name'])
                unique_classes.append(cls)
        
        return unique_classes[:6]  # 限制6个分类

    def get_recommend_list(self, content):
        """解析推荐内容"""
        videos = []
        
        print("开始解析推荐内容...")
        
        # 方法1: 直接查找所有书籍链接
        book_pattern = r'<a[^>]*href="(/book/\d+\.html)"[^>]*>.*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>'
        book_matches = re.findall(book_pattern, content, re.S)
        
        for match in book_matches[:6]:  # limit:6
            url, img, title = match
            print(f"找到推荐书籍: {title}")
            videos.append({
                "vod_id": url,
                "vod_name": title.strip(),
                "vod_pic": self.format_url(img),
                "vod_remarks": "推荐"
            })
        
        # 方法2: 如果没有图片，找标题链接
        if not videos:
            book_pattern2 = r'<a[^>]*href="(/book/\d+\.html)"[^>]*title="([^"]*)"[^>]*>'
            book_matches2 = re.findall(book_pattern2, content, re.S)
            
            for match in book_matches2[:6]:
                url, title = match
                print(f"找到推荐书籍(无图): {title}")
                videos.append({
                    "vod_id": url,
                    "vod_name": title.strip(),
                    "vod_pic": "",
                    "vod_remarks": "推荐"
                })
        
        # 方法3: 通用查找
        if not videos:
            links = re.findall(r'<a[^>]*href="(/book/\d+\.html)"[^>]*>(.*?)</a>', content, re.S)
            for url, title_content in links[:6]:
                title = re.sub(r'<[^>]*>', '', title_content).strip()
                if title and len(title) > 2:
                    print(f"找到推荐书籍(通用): {title}")
                    videos.append({
                        "vod_id": url,
                        "vod_name": title,
                        "vod_pic": "",
                        "vod_remarks": "推荐"
                    })
        
        print(f"最终找到 {len(videos)} 个推荐项目")
        return videos

    def get_category_list(self, content):
        """解析分类内容"""
        videos = []
        
        print("开始解析分类内容...")
        print("内容长度:", len(content))
        
        # 显示部分内容用于调试
        if len(content) < 1000:
            print("页面内容:", content)
        
        # 方法1: 查找书籍块
        book_patterns = [
            r'<div[^>]*class="[^"]*book-item[^"]*"[^>]*>(.*?)</div>',
            r'<li[^>]*class="[^"]*book-list[^"]*"[^>]*>(.*?)</li>',
            r'<div[^>]*class="[^"]*list-item[^"]*"[^>]*>(.*?)</div>'
        ]
        
        for pattern in book_patterns:
            items = re.findall(pattern, content, re.S)
            print(f"模式 {pattern} 找到 {len(items)} 个项目")
            
            for item in items:
                # 提取链接和标题
                link_match = re.search(r'<a[^>]*href="(/book/\d+\.html)"[^>]*>', item, re.S)
                if link_match:
                    url = link_match.group(1)
                    
                    # 提取标题
                    title_match = re.search(r'title="([^"]*)"', item, re.S)
                    title = title_match.group(1) if title_match else ""
                    if not title:
                        # 尝试从链接文本提取
                        text_match = re.search(r'<a[^>]*href="[^"]*"[^>]*>(.*?)</a>', item, re.S)
                        title = re.sub(r'<[^>]*>', '', text_match.group(1)).strip() if text_match else ""
                    
                    # 提取图片
                    img_match = re.search(r'<img[^>]*src="([^"]*)"', item, re.S)
                    img = img_match.group(1) if img_match else ""
                    
                    # 提取作者
                    author_match = re.search(r'演播[：:]\s*<[^>]*>([^<]*)</', item, re.S)
                    author = author_match.group(1).strip() if author_match else ""
                    
                    if title:
                        print(f"找到分类书籍: {title}")
                        videos.append({
                            "vod_id": url,
                            "vod_name": title,
                            "vod_pic": self.format_url(img),
                            "vod_remarks": author
                        })
        
        # 方法2: 直接查找所有书籍链接
        if not videos:
            book_links = re.findall(r'<a[^>]*href="(/book/\d+\.html)"[^>]*title="([^"]*)"[^>]*>', content, re.S)
            for url, title in book_links:
                print(f"直接找到分类书籍: {title}")
                videos.append({
                    "vod_id": url,
                    "vod_name": title.strip(),
                    "vod_pic": "",
                    "vod_remarks": ""
                })
        
        print(f"分类解析完成，找到 {len(videos)} 个项目")
        return videos

    def parse_detail_content(self, content, url):
        """解析详情页内容"""
        
        if not content:
            return {
                "vod_id": url,
                "vod_name": "获取失败",
                "vod_pic": "",
                "vod_content": "无法获取内容",
                "vod_actor": "",
                "vod_director": "",
                "vod_play_from": "爱上你听书",
                "vod_play_url": "暂无章节$"
            }
        
        # 标题
        title_patterns = [
            r'<h1[^>]*>(.*?)</h1>',
            r'<title>(.*?)</title>',
            r'<div[^>]*class="[^"]*book-title[^"]*"[^>]*>(.*?)</div>'
        ]
        
        title = "未知标题"
        for pattern in title_patterns:
            match = re.search(pattern, content, re.S)
            if match:
                title = re.sub(r'<[^>]*>', '', match.group(1)).strip()
                break
        
        # 图片
        img_patterns = [
            r'<img[^>]*class="[^"]*cover[^"]*"[^>]*src="([^"]*)"[^>]*>',
            r'<img[^>]*src="([^"]*)"[^>]*alt="' + re.escape(title) + r'"[^>]*>',
            r'<div[^>]*class="[^"]*book-cover[^"]*"[^>]*>.*?<img[^>]*src="([^"]*)"[^>]*>'
        ]
        
        img = ""
        for pattern in img_patterns:
            match = re.search(pattern, content, re.S)
            if match:
                img = match.group(1)
                break
        
        # 作者
        author_patterns = [
            r'演播[：:]\s*<[^>]*>([^<]*)</',
            r'作者[：:]\s*<[^>]*>([^<]*)</',
            r'播音[：:]\s*<[^>]*>([^<]*)</'
        ]
        
        author = "未知演播"
        for pattern in author_patterns:
            match = re.search(pattern, content, re.S)
            if match:
                author = match.group(1).strip()
                break
        
        # 内容简介
        desc_patterns = [
            r'<div[^>]*class="[^"]*desc[^"]*"[^>]*>(.*?)</div>',
            r'<div[^>]*class="[^"]*intro[^"]*"[^>]*>(.*?)</div>',
            r'<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)</div>',
            r'<p[^>]*class="[^"]*summary[^"]*"[^>]*>(.*?)</p>'
        ]
        
        desc = "暂无简介"
        for pattern in desc_patterns:
            match = re.search(pattern, content, re.S)
            if match:
                desc = re.sub(r'<[^>]*>', '', match.group(1)).strip()
                if desc:
                    break
        
        # 播放列表
        playList = self.parse_playlist(content)
        
        vod = {
            "vod_id": url,
            "vod_name": title,
            "vod_pic": self.format_url(img),
            "vod_content": desc,
            "vod_actor": author,
            "vod_director": "爱上你听书",
            "vod_play_from": "爱上你听书",
            "vod_play_url": "#".join(playList) if playList else "暂无章节$暂无播放地址"
        }
        
        return vod

    def parse_playlist(self, content):
        """解析播放列表"""
        playList = []
        
        # 查找章节列表
        chapter_patterns = [
            r'<a[^>]*href="(/play/\d+/\d+\.html)"[^>]*>(.*?)</a>',
            r'<a[^>]*href="(/sound/\d+\.html)"[^>]*>(.*?)</a>',
            r'<li[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>.*?</li>'
        ]
        
        for pattern in chapter_patterns:
            matches = re.findall(pattern, content, re.S)
            if matches:
                for match in matches:
                    if len(match) == 2:
                        url, name = match
                        playList.append('{}${}'.format(name.strip(), self.format_url(url)))
                break
        
        return playList

    def get_search_list(self, content, keyword):
        """解析搜索结果"""
        videos = []
        
        # 使用分类解析的逻辑来解析搜索结果
        videos = self.get_category_list(content)
        
        # 如果没有结果，尝试直接搜索
        if not videos:
            links = re.findall(r'<a[^>]*href="(/book/\d+\.html)"[^>]*>(.*?)</a>', content, re.S)
            for url, title_content in links:
                title = re.sub(r'<[^>]*>', '', title_content).strip()
                if keyword.lower() in title.lower():
                    videos.append({
                        "vod_id": url,
                        "vod_name": title,
                        "vod_pic": "",
                        "vod_remarks": "搜索结果"
                    })
        
        return videos

    def format_url(self, url):
        """格式化URL"""
        if not url:
            return ""
        if url.startswith('http'):
            return url
        if url.startswith('//'):
            return 'https:' + url
        if url.startswith('/'):
            return 'https://www.230ts.net' + url
        return 'https://www.230ts.net/' + url

    def isVideoFormat(self, url):
        pass

    def manualVideoCheck(self):
        pass