"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'O站影视',
  lang: 'hipy'
})
"""

# -*- coding: utf-8 -*-
# 修复版：搜索功能 + 播放链接 + 分类 + 首页推荐
import sys
sys.path.append('..')
from base.spider import Spider
from bs4 import BeautifulSoup
import requests
import re
import json
import time
import html
import urllib.parse

class Spider(Spider):

    def init(self, extend=""):
        self.host = "https://omofuns.xyz"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Referer': self.host,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Connection': 'keep-alive'
        }

    def getName(self):
        return "O站影视"

    def isVideoFormat(self, url):
        return False

    def manualVideoCheck(self):
        pass

    def destroy(self):
        pass

    def get_html(self, url):
        try:
            res = requests.get(url, headers=self.headers, timeout=15)
            res.encoding = res.apparent_encoding
            return res.text
        except Exception as e:
            print(f"获取 {url} 失败: {str(e)}")
            return ""

    def unescape_js_string(self, s):
        try:
            s = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), s)
            s = s.replace('\\/', '/').replace('\\n', '\n').replace('\\t', '\t').replace('\\r', '\r')
            s = s.replace('\\"', '"').replace("\\'", "'")
            return s
        except:
            return s

    def extract_player_data(self, html_content):
        try:
            player_patterns = [
                r'var\s+player_aaaa\s*=\s*({.*?});',
                r'player_aaaa\s*=\s*({.*?});',
                r'var\s+player_\w+\s*=\s*({.*?});'
            ]
            for pattern in player_patterns:
                match = re.search(pattern, html_content, re.DOTALL)
                if match:
                    player_str = match.group(1)
                    try:
                        player_str = self.unescape_js_string(player_str)
                        player_data = json.loads(player_str)
                        return player_data
                    except:
                        url_match = re.search(r'"url"\s*:\s*"([^"]+)"', player_str)
                        if url_match:
                            return {'url': self.unescape_js_string(url_match.group(1))}
            iframe_match = re.search(r'<iframe[^>]+src=["\']([^"\']+player[^"\']*)["\']', html_content)
            if iframe_match:
                iframe_src = iframe_match.group(1)
                if 'url=' in iframe_src:
                    url_match = re.search(r'url=([^&]+)', iframe_src)
                    if url_match:
                        video_url = html.unquote(url_match.group(1))
                        return {'url': video_url}
            url_patterns = [
                r'"url"\s*:\s*"([^"]+)"',
                r"url\s*:\s*'([^']+)'",
                r'var\s+url\s*=\s*"([^"]+)"',
                r"var\s+url\s*=\s*'([^']+)'"
            ]
            for pattern in url_patterns:
                matches = re.findall(pattern, html_content)
                for match in matches:
                    if '.m3u8' in match or '.mp4' in match:
                        return {'url': self.unescape_js_string(match)}
            return {}
        except Exception as e:
            print(f"提取播放器数据失败: {str(e)}")
            return {}

    def homeContent(self, filter):
        classes = [
            {"type_name": "电影", "type_id": "1"},
            {"type_name": "连续剧", "type_id": "2"},
            {"type_name": "综艺", "type_id": "3"},
            {"type_name": "动漫", "type_id": "4"},
            {"type_name": "里番绅士专区", "type_id": "5"}
        ]
        filters = {
            "1": [
                {"key": "class", "name": "剧情", "value": [
                    {"n": "全部", "v": ""},
                    {"n": "情感", "v": "情感"},
                    {"n": "科幻", "v": "科幻"},
                    {"n": "热血", "v": "热血"},
                    {"n": "推理", "v": "推理"},
                    {"n": "搞笑", "v": "搞笑"},
                    {"n": "冒险", "v": "冒险"},
                    {"n": "动作", "v": "动作"},
                    {"n": "战争", "v": "战争"}
                ]},
                {"key": "area", "name": "地区", "value": [
                    {"n": "全部", "v": ""},
                    {"n": "国产", "v": "国产"},
                    {"n": "日本", "v": "日本"},
                    {"n": "欧美", "v": "欧美"}
                ]},
                {"key": "year", "name": "年份", "value": [
                    {"n": "全部", "v": ""},
                    {"n": "2024", "v": "2024"},
                    {"n": "2023", "v": "2023"},
                    {"n": "2022", "v": "2022"},
                    {"n": "2021", "v": "2021"},
                    {"n": "2020", "v": "2020"}
                ]}
            ],
            "2": [
                {"key": "class", "name": "剧情", "value": [
                    {"n": "全部", "v": ""},
                    {"n": "情感", "v": "情感"},
                    {"n": "科幻", "v": "科幻"},
                    {"n": "悬疑", "v": "悬疑"},
                    {"n": "古装", "v": "古装"},
                    {"n": "都市", "v": "都市"}
                ]},
                {"key": "area", "name": "地区", "value": [
                    {"n": "全部", "v": ""},
                    {"n": "国产", "v": "国产"},
                    {"n": "韩国", "v": "韩国"},
                    {"n": "日本", "v": "日本"},
                    {"n": "欧美", "v": "欧美"}
                ]},
                {"key": "year", "name": "年份", "value": [
                    {"n": "全部", "v": ""},
                    {"n": "2024", "v": "2024"},
                    {"n": "2023", "v": "2023"},
                    {"n": "2022", "v": "2022"}
                ]}
            ],
            "4": [
                {"key": "class", "name": "剧情", "value": [
                    {"n": "全部", "v": ""},
                    {"n": "情感", "v": "情感"},
                    {"n": "科幻", "v": "科幻"},
                    {"n": "热血", "v": "热血"},
                    {"n": "推理", "v": "推理"},
                    {"n": "搞笑", "v": "搞笑"},
                    {"n": "冒险", "v": "冒险"},
                    {"n": "萝莉", "v": "萝莉"},
                    {"n": "校园", "v": "校园"},
                    {"n": "动作", "v": "动作"},
                    {"n": "机战", "v": "机战"},
                    {"n": "运动", "v": "运动"},
                    {"n": "战争", "v": "战争"},
                    {"n": "少年", "v": "少年"},
                    {"n": "少女", "v": "少女"},
                    {"n": "社会", "v": "社会"},
                    {"n": "原创", "v": "原创"},
                    {"n": "亲子", "v": "亲子"},
                    {"n": "益智", "v": "益智"},
                    {"n": "励志", "v": "励志"},
                    {"n": "其他", "v": "其他"}
                ]},
                {"key": "area", "name": "地区", "value": [
                    {"n": "全部", "v": ""},
                    {"n": "国产", "v": "国产"},
                    {"n": "日本", "v": "日本"},
                    {"n": "欧美", "v": "欧美"},
                    {"n": "其他", "v": "其他"}
                ]},
                {"key": "lang", "name": "语言", "value": [
                    {"n": "全部", "v": ""},
                    {"n": "国语", "v": "国语"},
                    {"n": "英语", "v": "英语"},
                    {"n": "粤语", "v": "粤语"},
                    {"n": "闽南语", "v": "闽南语"},
                    {"n": "韩语", "v": "韩语"},
                    {"n": "日语", "v": "日语"},
                    {"n": "其它", "v": "其它"}
                ]},
                {"key": "year", "name": "年份", "value": [{"n": str(i), "v": str(i)} for i in range(2025, 2003, -1)]},
                {"key": "letter", "name": "字母", "value": [{"n": c, "v": c} for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] + [{"n": "0-9", "v": "0-9"}]},
                {"key": "by", "name": "排序", "value": [
                    {"n": "时间排序", "v": "time"},
                    {"n": "人气排序", "v": "hits"},
                    {"n": "评分排序", "v": "score"}
                ]}
            ],
            "5": [
                {"key": "letter", "name": "字母", "value": [{"n": c, "v": c} for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] + [{"n": "0-9", "v": "0-9"}]},
                {"key": "by", "name": "排序", "value": [
                    {"n": "时间排序", "v": "time"},
                    {"n": "人气排序", "v": "hits"},
                    {"n": "评分排序", "v": "score"}
                ]}
            ]
        }
        return {'class': classes, 'filters': filters}

    def homeVideoContent(self):
        html = self.get_html(self.host)
        soup = BeautifulSoup(html, "html.parser")
        videos = []
        for item in soup.select('.module-poster-item'):
            try:
                title_elem = item.select_one('.module-poster-item-title')
                title = title_elem.get_text(strip=True) if title_elem else '未知'
                img_elem = item.select_one('img')
                img = img_elem.get('data-original') or img_elem.get('src') if img_elem else ''
                link = item.get('href') or item.select_one('a').get('href', '')
                vid_match = re.search(r'id/(\d+)', link)
                if vid_match:
                    vid = vid_match.group(1)
                    remark_elem = item.select_one('.module-item-note')
                    remark = remark_elem.get_text(strip=True) if remark_elem else ''
                    videos.append({'vod_id': vid, 'vod_name': title, 'vod_pic': img, 'vod_remarks': remark})
            except:
                continue
        return {'list': videos}

    def categoryContent(self, tid, pg, filter, extend):
        try:
            base_url = f"{self.host}/vod/show/id/{tid}"
            params = []
            if extend.get('class'):
                params.append(f"class/{urllib.parse.quote(extend['class'])}")
            if extend.get('area'):
                params.append(f"area/{urllib.parse.quote(extend['area'])}")
            if extend.get('lang'):
                params.append(f"lang/{urllib.parse.quote(extend['lang'])}")
            if extend.get('year'):
                params.append(f"year/{extend['year']}")
            if extend.get('letter'):
                params.append(f"letter/{extend['letter']}")
            if extend.get('by'):
                base_url = f"{self.host}/vod/show/by/{extend['by']}/id/{tid}"
            if params:
                url = f"{base_url}/{'/'.join(params)}/page/{pg}.html"
            else:
                url = f"{base_url}/page/{pg}.html"
            print(f"[CATEGORY] URL: {url}")
            html = self.get_html(url)
            soup = BeautifulSoup(html, "html.parser")
            videos = []
            for item in soup.select('.module-poster-item'):
                try:
                    title_elem = item.select_one('.module-poster-item-title')
                    title = title_elem.get_text(strip=True) if title_elem else '未知'
                    img_elem = item.select_one('img')
                    img = img_elem.get('data-original') or img_elem.get('src') if img_elem else ''
                    link = item.get('href', '')
                    vid_match = re.search(r'id/(\d+)', link)
                    if vid_match:
                        vid = vid_match.group(1)
                        remark_elem = item.select_one('.module-item-note')
                        remark = remark_elem.get_text(strip=True) if remark_elem else ''
                        videos.append({'vod_id': vid, 'vod_name': title, 'vod_pic': img, 'vod_remarks': remark})
                except:
                    continue
            return {'list': videos, 'page': pg, 'pagecount': 9999, 'limit': 30, 'total': 99999}
        except Exception as e:
            print(f"[CATEGORY] 错误: {e}")
            return {'list': [], 'page': pg, 'pagecount': 1, 'limit': 30, 'total': 0}

    def detailContent(self, ids):
        try:
            vid = ids[0]
            url = f"{self.host}/vod/detail/id/{vid}.html"
            html = self.get_html(url)
            soup = BeautifulSoup(html, "html.parser")
            title = soup.select_one('.module-info-heading h1').get_text(strip=True) if soup.select_one('.module-info-heading h1') else '未知'
            pic = soup.select_one('.module-info-poster img').get('src') if soup.select_one('.module-info-poster img') else ''
            desc = soup.select_one('.module-info-introduction-content').get_text(strip=True) if soup.select_one('.module-info-introduction-content') else ''
            director = ''
            actor = ''
            director_elem = soup.find('span', string='导演：')
            if director_elem:
                director = '/'.join([a.get_text(strip=True) for a in director_elem.find_parent('div').select('a')])
            actor_elem = soup.find('span', string='主演：')
            if actor_elem:
                actor = '/'.join([a.get_text(strip=True) for a in actor_elem.find_parent('div').select('a')])
            play_from_list = []
            play_url_list = []
            source_tabs = soup.select('.module-tab-item.tab-item')
            play_lists = soup.select('.module-play-list-base')
            for idx, tab in enumerate(source_tabs):
                if idx >= len(play_lists):
                    break
                source_name = tab.get_text(strip=True)
                play_list = play_lists[idx]
                episodes = []
                for ep in play_list.select('a.module-play-list-link'):
                    ep_name = ep.get_text(strip=True)
                    ep_href = ep.get('href', '')
                    sid_match = re.search(r'sid/(\d+)', ep_href)
                    nid_match = re.search(r'nid/(\d+)', ep_href)
                    if sid_match and nid_match:
                        sid = sid_match.group(1)
                        nid = nid_match.group(1)
                        ep_url = f"{vid}@@{sid}@@{nid}"
                        episodes.append(f"{ep_name}${ep_url}")
                if episodes:
                    play_from_list.append(source_name)
                    play_url_list.append('#'.join(episodes))
            if not play_from_list:
                default_episodes = []
                for ep in soup.select('.module-play-list-link'):
                    ep_name = ep.get_text(strip=True)
                    ep_href = ep.get('href', '')
                    sid_match = re.search(r'sid/(\d+)', ep_href)
                    nid_match = re.search(r'nid/(\d+)', ep_href)
                    if sid_match and nid_match:
                        sid = sid_match.group(1)
                        nid = nid_match.group(1)
                        ep_url = f"{vid}@@{sid}@@{nid}"
                        default_episodes.append(f"{ep_name}${ep_url}")
                if default_episodes:
                    play_from_list = ['默认线路']
                    play_url_list = ['#'.join(default_episodes)]
            play_from = '$$$'.join(play_from_list)
            play_url = '$$$'.join(play_url_list)
            vod_info = {
                'vod_id': vid,
                'vod_name': title,
                'vod_pic': pic,
                'vod_content': desc,
                'vod_director': director,
                'vod_actor': actor,
                'vod_play_from': play_from,
                'vod_play_url': play_url
            }
            return {'list': [vod_info]}
        except Exception as e:
            print(f"[DETAIL] 错误: {e}")
            return {'list': []}

    def searchContent(self, key, quick, pg="1"):
        try:
            from urllib.parse import quote
            encoded_key = quote(key)
            url = f"{self.host}/vod/search/page/{pg}/wd/{encoded_key}.html"
            print(f"[SEARCH] URL: {url}")
            html = self.get_html(url)
            if not html:
                print("[SEARCH] 获取 HTML 失败")
                return {'list': []}
            soup = BeautifulSoup(html, "html.parser")
            videos = []
            for item in soup.select('.module-card-item'):
                try:
                    title_elem = item.select_one('.module-card-item-title a')
                    title = title_elem.get_text(strip=True) if title_elem else '未知'
                    img_elem = item.select_one('img.lazy')
                    img = img_elem.get('data-original') if img_elem else ''
                    link = title_elem.get('href') if title_elem else ''
                    vid_match = re.search(r'id/(\d+)', link)
                    if not vid_match:
                        continue
                    vid = vid_match.group(1)
                    remark_elem = item.select_one('.module-item-note')
                    remark = remark_elem.get_text(strip=True) if remark_elem else ''
                    videos.append({'vod_id': vid, 'vod_name': title, 'vod_pic': img, 'vod_remarks': remark})
                except Exception as e:
                    print(f"[SEARCH] 解析单项失败: {e}")
                    continue
            return {'list': videos, 'page': pg, 'pagecount': 9999, 'limit': 30, 'total': 99999}
        except Exception as e:
            print(f"[SEARCH] 搜索失败: {e}")
            import traceback
            traceback.print_exc()
            return {'list': []}

    def playerContent(self, flag, id, vipFlags):
        try:
            parts = id.split('@@')
            if len(parts) != 3:
                return {"parse": 0, "url": "", "header": self.headers}
            vid, sid, nid = parts
            play_url = f"{self.host}/vod/play/id/{vid}/sid/{sid}/nid/{nid}.html"
            html_content = self.get_html(play_url)
            url = ""
            player_data = self.extract_player_data(html_content)
            if player_data and player_data.get('url'):
                url = player_data['url']
            if not url:
                iframe_match = re.search(r'<iframe[^>]+src=["\']([^"\']+player[^"\']*)["\']', html_content)
                if iframe_match:
                    iframe_src = iframe_match.group(1)
                    if not iframe_src.startswith('http'):
                        iframe_src = self.host + iframe_src
                    if 'url=' in iframe_src:
                        url_match = re.search(r'url=([^&]+)', iframe_src)
                        if url_match:
                            url = html.unquote(url_match.group(1))
                    else:
                        iframe_html = self.get_html(iframe_src)
                        if iframe_html:
                            player_data = self.extract_player_data(iframe_html)
                            if player_data and player_data.get('url'):
                                url = player_data['url']
            if not url:
                patterns = [
                    r'"url"\s*:\s*"([^"]*\.m3u8[^"]*)"',
                    r'"url"\s*:\s*"([^"]*\.mp4[^"]*)"',
                    r"url\s*:\s*'([^']*\.m3u8[^']*)'",
                    r"url\s*:\s*'([^']*\.mp4[^']*)'",
                    r'src\s*=\s*"([^"]*\.m3u8[^"]*)"',
                    r'src\s*=\s*"([^"]*\.mp4[^"]*)"'
                ]
                for pattern in patterns:
                    match = re.search(pattern, html_content, re.IGNORECASE)
                    if match:
                        potential_url = match.group(1)
                        potential_url = self.unescape_js_string(potential_url)
                        if '.m3u8' in potential_url or '.mp4' in potential_url:
                            url = potential_url
                            break
            if url:
                if url.startswith('//'):
                    url = 'https:' + url
                elif url and not url.startswith('http'):
                    url = self.host + url
                url = self.unescape_js_string(url)
            headers = self.headers.copy()
            headers['Referer'] = play_url
            print(f"[PLAYER] 提取到的播放链接: {url}")
            return {"parse": 0, "url": url, "header": headers}
        except Exception as e:
            print(f"[PLAYER] 错误: {e}")
            return {"parse": 0, "url": "", "header": self.headers}

    def localProxy(self, param):
        pass
