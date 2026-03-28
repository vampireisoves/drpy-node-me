"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'hohoj',
  lang: 'hipy'
})
"""

# -*- coding: utf-8 -*-
#七哥爱瑟瑟
import json
import re
import requests
from pyquery import PyQuery as pq
import sys
sys.path.append('..')
from base.spider import Spider


class Spider(Spider):
    host = 'https://hohoj.tv'
    headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'referer': 'https://hohoj.tv/'
    }

    def init(self, extend=''):
        self.proxies = json.loads(extend).get('proxy', {}) if extend else {}

    def getName(self):
        return "hohoj"

    def fetch(self, url, params=None):
        try:
            return requests.get(url, headers=self.headers, params=params, 
                              proxies=self.proxies, timeout=10).text
        except:
            return ''

    def homeContent(self, filter):
        html = self.fetch(self.host)
        return {
            'class': [
                {'type_name': '有码', 'type_id': 'search?type=censored'},
                {'type_name': '無碼', 'type_id': 'search?type=uncensored'},
                {'type_name': '中文字幕', 'type_id': 'search?type=chinese'},
                {'type_name': '歐美', 'type_id': 'search?type=europe'},
                {'type_name': '女優', 'type_id': 'all_models'},
                {'type_name': '亂倫', 'type_id': 'main_ctg?id=8&name=亂倫'},
                {'type_name': '強姦凌辱', 'type_id': 'main_ctg?id=2&name=強姦凌辱'},
                {'type_name': '內射受孕', 'type_id': 'main_ctg?id=12&name=內射受孕'},
                {'type_name': '多P群交', 'type_id': 'main_ctg?id=5&name=多P群交'},
                {'type_name': '巨乳美乳', 'type_id': 'main_ctg?id=9&name=巨乳美乳'},
                {'type_name': '出軌', 'type_id': 'main_ctg?id=7&name=出軌'},
                {'type_name': '角色劇情', 'type_id': 'main_ctg?id=6&name=角色劇情'},
                {'type_name': '絲襪美腿', 'type_id': 'main_ctg?id=1&name=絲襪美腿'},
                {'type_name': '潮吹放尿', 'type_id': 'main_ctg?id=10&name=潮吹放尿'},
                {'type_name': '走後門', 'type_id': 'main_ctg?id=11&name=走後門'},
                {'type_name': '制服誘惑', 'type_id': 'main_ctg?id=4&name=制服誘惑'},
                {'type_name': '主奴調教', 'type_id': 'main_ctg?id=3&name=主奴調教'},
            ],
            'filters': self.get_filters(),
            'list': self.parse_videos(pq(html)('.video-item'))
        }

    def get_filters(self):
        base = [{'key': 'order', 'name': '排序', 'value': [
            {'n': '最新', 'v': 'latest'},
            {'n': '最热', 'v': 'hot'},
            {'n': '最多观看', 'v': 'views'},
            {'n': '最多喜欢', 'v': 'likes'},
        ]}]
        return {
            'search?type=censored': base,
            'search?type=uncensored': base,
            'search?type=chinese': base,
            'search?type=europe': base,
        }

    def categoryContent(self, tid, pg, filter, extend):
        url = f"{self.host}/{tid if tid != 'all_models' else 'all_models'}"
        params = extend.copy() if extend else {}
        if int(pg) > 1:
            params['p'] = pg
        
        html = self.fetch(url, params)
        data = pq(html)
        
        videos = self.parse_models(data('.model')) if tid == 'all_models' else self.parse_videos(data('.video-item'))
        
        return {
            'list': videos,
            'page': pg,
            'pagecount': data('.pagination a').length or 1,
            'limit': 90,
            'total': 999999
        }

    def detailContent(self, ids):
        vid = ids[0]
        url = f"{self.host}{vid}" if vid.startswith('/') else f"{self.host}/{vid}"
        html = self.fetch(url)
        data = pq(html)
        
        video_id = vid.split('id=')[-1].split('&')[0] if 'id=' in vid else ''
        
        title = data('h1').text() or data('title').text() or ''
        title = re.sub(r'\s*HoHoJ.*$', '', title)
        title = re.sub(r'\s*\|.*$', '', title)
        title = title.strip()
        
        vod = {
            'vod_name': title,
            'vod_play_from': '撸出血',
            'vod_play_url': f"{title}${video_id}",
            'vod_pic': data('.video-player img').attr('src') or data('meta[property="og:image"]').attr('content'),
            'vod_year': data('.info span').eq(-1).text(),
        }
        
        actors = []
        for a in data('.model a').items():
            name = a('.model-name').text().strip()
            href = a.attr('href')
            if name and href:
                actors.append(f'[a=cr:{json.dumps({"id": href, "name": name})}/]{name}[/a]')
        if actors:
            vod['vod_actor'] = ' '.join(actors)
        
        tags = []
        for ctg_span in data('span.ctg').items():
            a = ctg_span.find('a')
            if a:
                name = a.text().strip()
                href = a.attr('href')
                if name and href:
                    tags.append(f'[a=cr:{json.dumps({"id": href, "name": name})}/]{name}[/a]')
        
        if tags:
            vod['vod_content'] = ' '.join(tags)
        
        return {'list': [vod]}

    def searchContent(self, key, quick, pg="1"):
        params = {'text': key}
        if int(pg) > 1:
            params['p'] = pg
        html = self.fetch(f"{self.host}/search", params)
        return {'list': self.parse_videos(pq(html)('.video-item')), 'page': pg}

    def playerContent(self, flag, id, vipFlags):
        html = self.fetch(f"{self.host}/embed?id={id}")
        
        video_url = ''
        match = re.search(r'<video[^>]+src="([^"]+)"', html)
        if match:
            video_url = match.group(1)
        else:
            match = re.search(r'var\s+videoSrc\s*=\s*["\']([^"\']+)["\']', html)
            video_url = match.group(1) if match else pq(html)('video').attr('src') or ''
        
        return {
            'parse': 0,
            'url': video_url,
            'header': {
                'user-agent': self.headers['user-agent'],
                'referer': f"{self.host}/embed?id={id}",
                'origin': self.host,
            }
        } if video_url else {'parse': 0, 'url': ''}

    def parse_videos(self, items):
        videos = []
        for i in items.items():
            link = i('a').attr('href')
            title = i('.video-item-title').text() or i('img').attr('alt')
            if not link or not title:
                continue
            
            title = re.sub(r'\s*HoHoJ.*$', '', title)
            title = re.sub(r'\s*\|.*$', '', title).strip()
            
            rating = i('.video-item-rating')
            views = rating.find('.fa-eye').parent().text().strip()
            likes = rating.find('.fa-heart').parent().text().strip()
            
            videos.append({
                'vod_id': link,
                'vod_name': title,
                'vod_pic': i('img').attr('src'),
                'vod_remarks': f"👁 {views} ❤ {likes}",
                'vod_tag': '无码' if i('.video-item-badge').length else '',
                'style': {"type": "rect", "ratio": 1.5}
            })
        return videos

    def parse_models(self, items):
        return [{
            'vod_id': i('a').attr('href'),
            'vod_name': i('.model-name').text(),
            'vod_pic': i('img').attr('src'),
            'vod_tag': 'folder',
            'style': {"type": "rect", "ratio": 0.75}
        } for i in items.items() if i('a').attr('href')]

    def isVideoFormat(self, url):
        pass
    def manualVideoCheck(self):
        pass
    def destroy(self):
        pass
    def homeVideoContent(self):
        pass
    def localProxy(self, param):
        pass
    def liveContent(self, url):
        pass