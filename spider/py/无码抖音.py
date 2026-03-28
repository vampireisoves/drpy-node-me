"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '无码抖音',
  lang: 'hipy'
})
"""

#!/data/data/com.termux/files/usr/bin/python3
# -*- coding: utf-8 -*-
import aiohttp
import asyncio
import re
import time
import os
import json
import threading
from collections import defaultdict
from urllib.parse import urljoin, quote
import concurrent.futures

# 禁用SSL警告
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

MOBILE_UA = "Mozilla/5.0 (Linux; Android 13; SM-S901U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"

class DouyinSpider:
    def __init__(self):
        self.base_url = 'https://douyin.wmdy34.fun/douyin/'
        self.session = None
        self.connector = None
        
        self.categories = {}
        category_str = "国产精品$13#网曝吃瓜$6#自拍偷拍$7#传媒出品$8#网红主播$9#大神探花$10#抖阴视频$11#国产其它$12#日韩精品$14#日韩无码$15#日韩有码$16#中文字幕$20#萝莉少女$21#人妻熟妇$22#韩国主播$23#日韩其它$24#欧美精品$5#欧美无码$25#欧美另类$26#欧美其它$27#AI换脸$28#AV解说$29#三级伦理$30#成人动漫$31#国产视频$1#无码中文$2#3$3#4$4"
        for item in category_str.split('#'):
            if '$' in item:
                name, cid = item.split('$')
                self.categories[cid] = name
        
        self.category_videos = defaultdict(list)
        self.seen_urls = set()
        self.save_path = os.path.expanduser("~/douyin_full_videos.txt")
        self.pause_flag = False
        self.exit_flag = False
        self.lock = threading.Lock()
        self.total_extracted = 0
        self.semaphore = asyncio.Semaphore(50)  # 提高并发数量

    async def create_session(self):
        """创建aiohttp会话"""
        timeout = aiohttp.ClientTimeout(total=15)
        self.connector = aiohttp.TCPConnector(limit=50, ssl=False)
        self.session = aiohttp.ClientSession(
            connector=self.connector,
            timeout=timeout,
            headers={
                'User-Agent': MOBILE_UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
        )

    async def close_session(self):
        """关闭aiohttp会话"""
        if self.session:
            await self.session.close()
        if self.connector:
            await self.connector.close()

    async def get_html(self, url, retry=3):
        """异步获取页面内容"""
        if self.exit_flag:
            return None
            
        while self.pause_flag:
            await asyncio.sleep(1)
            if self.exit_flag:
                return None
                
        try:
            if not url.startswith('http'):
                url = urljoin(self.base_url, url)
                
            async with self.semaphore:
                async with self.session.get(url, allow_redirects=True) as response:
                    if response.status == 200:
                        return await response.text(encoding='utf-8')
                    elif response.status == 404:
                        return None
                    elif retry > 0:
                        await asyncio.sleep(1)
                        return await self.get_html(url, retry - 1)
        except aiohttp.ClientError as e:
            if retry > 0:
                await asyncio.sleep(1)
                return await self.get_html(url, retry - 1)
        return None

    def clean_title(self, title):
        """清理标题"""
        title = re.sub(r'<[^>]+>', '', title)
        title = re.sub(r'[\[\]【】]', '', title)
        title = re.sub(r'\s+', ' ', title)
        return title.strip()

    def extract_video_list(self, html):
        """从列表页提取视频链接和标题"""
        videos = []
        if not html:
            return videos
        
        array_pattern = r'lazyload\"(.*?)</a>'
        array_matches = re.findall(array_pattern, html, re.S | re.I)
        
        for array_match in array_matches:
            title_pattern = r'title=\"(.*?)\"'
            title_match = re.search(title_pattern, array_match)
            title = title_match.group(1) if title_match else ""
            
            link_pattern = r'href=\"(.*?)\"'
            link_match = re.search(link_pattern, array_match)
            link = link_match.group(1) if link_match else ""
            
            if title and link:
                title = self.clean_title(title)
                
                if not link.startswith('http'):
                    link = urljoin(self.base_url, link)
                
                with self.lock:
                    if link in self.seen_urls:
                        continue
                    self.seen_urls.add(link)
                
                videos.append({
                    'title': title,
                    'url': link
                })
        
        return videos

    def extract_m3u8_from_detail(self, html):
        """从详情页提取m3u8链接"""
        if not html:
            return None
            
        patterns = [
            r'var player_.*?url\":\"(.*?)\"',
            r'url\s*[:=]\s*["\'](https?://[^"\']+?\.m3u8[^"\']*)["\']',
            r'(https?://[^\s"\']+?\.m3u8[^\s"\']*)',
            r'file\s*[:=]\s*["\'](https?://[^"\']+?\.m3u8[^"\']*)["\']',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, html, re.I)
            for match in matches:
                m3u8_url = match.replace('\\/', '/')
                if m3u8_url.startswith('//'):
                    m3u8_url = 'https:' + m3u8_url
                if '.m3u8' in m3u8_url:
                    return m3u8_url
                    
        return None

    async def process_video(self, video, category_name):
        """异步处理单个视频，并将结果存入内存"""
        if self.exit_flag:
            return
            
        try:
            detail_html = await self.get_html(video['url'])
            if not detail_html:
                return
                
            m3u8_url = self.extract_m3u8_from_detail(detail_html)
            if m3u8_url:
                video['playback_url'] = m3u8_url
                with self.lock:
                    self.category_videos[category_name].append(video)
                    self.total_extracted += 1
                    if self.total_extracted % 10 == 0:
                        print(f"  ✅ 已提取 {self.total_extracted} 个视频")
                
        except Exception as e:
            pass

    async def crawl_category_page(self, category_id, category_name, page):
        """异步爬取特定分类的单页"""
        url = f'https://douyin.wmdy34.fun/douyin/vodtype/{category_id}-{page}.html'
        html = await self.get_html(url)
        if not html:
            return None
            
        videos = self.extract_video_list(html)
        if not videos:
            return []
            
        tasks = [self.process_video(video, category_name) for video in videos]
        await asyncio.gather(*tasks)
        
        next_page_pattern = f'vodtype/{category_id}-{page+1}.html'
        if next_page_pattern not in html:
            return []
            
        return videos

    async def crawl_all_category_pages(self, category_id, category_name):
        """异步爬取一个分类的所有页码"""
        print(f"📁 开始爬取: {category_name}")
        page = 1
        while not self.exit_flag:
            if self.pause_flag:
                await asyncio.sleep(1)
                continue
                
            videos = await self.crawl_category_page(category_id, category_name, page)
            
            if not videos:
                print(f"  ⏹️ {category_name} 爬取完成或找不到更多内容")
                break
            
            page += 1
            await asyncio.sleep(0.5)
            
    def save_results(self):
        """保存结果 - 按分类组织"""
        if not self.category_videos:
            return
            
        try:
            with open(self.save_path, 'w', encoding='utf-8') as f:
                total_count = 0
                # 修复：遍历所有分类名称，而不是分类ID
                for category_name in self.categories.values():
                    videos = self.category_videos.get(category_name, [])
                    if not videos:
                        continue
                        
                    total_count += len(videos)
                    f.write(f"\n{category_name},#genre#\n")
                    
                    for video in videos:
                        clean_title = video['title'].replace(',', '，')
                        f.write(f"{clean_title},{video['playback_url']}\n")
            
            print(f"💾 最终保存: {total_count} 个视频")
        except Exception as e:
            print(f"❌ 保存失败: {str(e)}")

    async def listen_commands(self):
        """异步监听用户命令"""
        print("\n📱 命令: p=暂停/继续, q=退出")
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as pool:
            while not self.exit_flag:
                try:
                    cmd = await loop.run_in_executor(pool, input, "> ")
                    cmd = cmd.strip().lower()
                    
                    if cmd == 'p':
                        self.pause_flag = not self.pause_flag
                        status = "暂停" if self.pause_flag else "继续"
                        print(f"⏸️ {status}")
                        
                    elif cmd == 'q':
                        self.exit_flag = True
                        print("🛑 正在退出...")
                        break
                        
                except (KeyboardInterrupt, EOFError):
                    self.exit_flag = True
                    break

    async def run_async(self):
        """异步主函数"""
        print("🚀 抖音视频全站提取工具启动 (优化版)")
        print("🎯 按分类实时写入文件，并支持全局并发")
        
        await self.create_session()
        
        try:
            cmd_task = asyncio.create_task(self.listen_commands())
            
            tasks = []
            for category_id, category_name in self.categories.items():
                if self.exit_flag:
                    break
                tasks.append(self.crawl_all_category_pages(category_id, category_name))
            
            await asyncio.gather(*tasks)
                
            if not cmd_task.done():
                cmd_task.cancel()
                try:
                    await cmd_task
                except asyncio.CancelledError:
                    pass
                    
        except KeyboardInterrupt:
            print("\n⚠️ 用户中断")
        finally:
            await self.close_session()
            self.save_results()
            print(f"\n🎉 完成! 共提取 {self.total_extracted} 个视频")

    def run(self):
        """运行入口"""
        try:
            asyncio.run(self.run_async())
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(self.run_async())
            finally:
                loop.close()

if __name__ == "__main__":
    spider = DouyinSpider()
    spider.run()