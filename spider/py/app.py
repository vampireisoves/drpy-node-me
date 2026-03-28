"""
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'app',
  lang: 'hipy'
})
"""

from flask import Flask, jsonify, request
import sys
import os
import importlib
import json
import base64

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

app = Flask(__name__)

# 站点映射和中文名称映射
from site_config import SITE_MAP

def load_spider(site_name):
    """加载爬虫"""
    if site_name not in SITE_MAP:
        raise Exception(f"站点 {site_name} 不存在")
    
    module_path = SITE_MAP[site_name]['module']
    module = importlib.import_module(module_path)
    sp = module.Spider()
    sp.init([])
    return sp

def parse_ext_params(ext):
    """解析扩展参数"""
    extend_params = {}
    if ext and ext != 'e30=':
        try:
            decoded = base64.b64decode(ext).decode('utf-8')
            extend_params = json.loads(decoded)
        except:
            try:
                extend_params = json.loads(ext)
            except:
                pass
    return extend_params

def make_spider_handler(site_name):
    def handler():
        try:
            # 获取所有参数
            wd = request.args.get('wd')
            ac = request.args.get('ac')
            play = request.args.get('play')
            flag = request.args.get('flag')
            t = request.args.get('t')
            pg = request.args.get('pg', '1')
            ids = request.args.get('ids')
            filter_param = request.args.get('filter', 'false').lower() == 'true'
            ext = request.args.get('ext')
            quick = request.args.get('quick')
            
            sp = load_spider(site_name)
            
            # 根据参数调用对应方法
            if ac == 'detail' and ids:
                result = sp.detailContent([ids])
            elif play and flag:
                result = sp.playerContent(flag, play, {})
            elif t:
                extend_params = parse_ext_params(ext)
                result = sp.categoryContent(t, pg, filter_param, extend_params)
            elif wd:
                try:
                    result = sp.searchContent(wd, quick == 'true', pg)
                except TypeError:
                    result = sp.searchContent(wd, quick == 'true')
            elif ac == 'video' or request.path.endswith('/homeVideo'):
                result = sp.homeVideoContent()
            else:
                # 智能回退逻辑
                result = sp.homeContent(filter_param)
                if not result.get('list') or len(result.get('list', [])) == 0:
                    try:
                        video_result = sp.homeVideoContent()
                        if video_result and video_result.get('list') and len(video_result.get('list', [])) > 0:
                            result['list'] = video_result['list']
                    except Exception:
                        pass
            
            return jsonify(result)

        except Exception as e:
            return jsonify({'error': str(e), 'status': 'error'}), 500
    return handler

# 推荐视频专用路由
@app.route('/<site_name>/homeVideo')
def home_video_handler(site_name):
    try:
        sp = load_spider(site_name)
        result = sp.homeVideoContent()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# 使用 add_url_rule 动态添加路由
for site_name in SITE_MAP.keys():
    handler = make_spider_handler(site_name)
    handler.__name__ = f'{site_name}_handler'
    app.add_url_rule(f'/{site_name}', view_func=handler)
    app.add_url_rule(f'/{site_name}/', view_func=handler)

# 自动生成站点配置JSON
@app.route('/t4')
@app.route('/t4.json')
def generate_sites_config():
    """生成站点配置"""
    base_url = request.host_url.rstrip('/')
    sites_list = []
    
    for site_key, site_info in SITE_MAP.items():
        sites_list.append({
            "key": site_info['key'],
            "name": site_info['name'],
            "type": 4,  # 修正为type=4，表示T4服务
            "api": f"{base_url}/{site_key}",
            "searchable": 1,
            "quickSearch": 1,
            "filterable": 1
        })
    
    return jsonify({"sites": sites_list})

# 根路由显示所有可用站点
@app.route('/')
def index():
    return jsonify({
        'message': '多爬虫API服务运行正常',
        'available_sites': list(SITE_MAP.keys()),
        'config_url': '/t4 或 /t4.json',
        'usage': '访问 /站点名?参数 来调用对应爬虫'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8002)