#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
采集分类生成器

该脚本用于处理采集源的分类信息，支持两种模式：
1. 生成静态分类：从动态采集源获取分类信息并生成静态配置
2. 添加分类过滤：检测分类的有效性并添加排除列表

Author: DaShenHan&道长-----先苦后甜，任凭晚风拂柳颜------
Date: 2024/6/21
"""

import os
import json
import gzip
import base64
import time
import warnings
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor
from pprint import pprint
from typing import Dict, List, Optional, Any

import requests

# 关闭警告信息
warnings.filterwarnings("ignore")
requests.packages.urllib3.disable_warnings()

# 全局配置
THREAD_POOL_SIZE = 20  # 线程池大小
TIMEOUT = 5  # 请求超时时间（秒）
USE_GZIP = False  # 是否使用gzip压缩

# HTTP请求头配置
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
    'Connection': 'close'  # 设置为关闭长连接
}

# 初始化线程池
pool = ThreadPoolExecutor(max_workers=THREAD_POOL_SIZE)


def compress_and_encode(data: str) -> str:
    """
    压缩并编码字符串数据
    
    Args:
        data: 需要压缩的字符串
        
    Returns:
        压缩并Base64编码后的字符串
    """
    # 压缩数据
    compressed_data = gzip.compress(data.encode('utf-8'))
    # 对压缩数据进行Base64编码
    encoded_data = base64.b64encode(compressed_data).decode('utf-8')
    return encoded_data


def decode_and_decompress(encoded_data: str) -> str:
    """
    解码并解压缩字符串数据
    
    Args:
        encoded_data: Base64编码的压缩数据
        
    Returns:
        解压缩后的原始字符串
    """
    # 解码Base64数据
    decoded_data = base64.b64decode(encoded_data.encode('utf-8'))
    # 解压缩数据
    decompressed_data = gzip.decompress(decoded_data).decode('utf-8')
    return decompressed_data


def get_classes(rec: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    """
    从采集源获取分类信息
    
    Args:
        rec: 采集源记录，包含url、api等信息
        
    Returns:
        分类列表，获取失败时返回None
    """
    classes = None
    if rec.get('url') and str(rec['url']).startswith('http'):
        # 构建API地址
        _class_api = rec.get('api') or '/api.php/provide/vod/'
        _api = urljoin(str(rec['url']).rstrip('/'), _class_api)
        print(_api)
        
        try:
            # 发送HTTP请求获取分类数据
            r = requests.get(_api, headers=HEADERS, timeout=TIMEOUT, verify=False)
            ret = r.json()
            
            # 特殊处理乐视资源的调试信息
            if rec.get('name') == '乐视资源':
                print('=======乐视=========')
                print(ret)
                
            classes = ret.get('class')
        except Exception as e:
            print(f'获取资源【{rec["name"]}】({_api})分类发生错误:{e}')

    return classes


def _extract_class_data(classes: List[Dict[str, Any]]) -> tuple[List[str], List[str]]:
    """
    从分类列表中提取分类名称和ID
    
    Args:
        classes: 分类列表
        
    Returns:
        (分类名称列表, 分类ID列表)
    """
    class_names = []
    class_urls = []
    for cls in classes:
        if cls.get('type_name') and cls.get('type_id'):
            class_urls.append(str(cls['type_id']))
            class_names.append(str(cls['type_name']))
    return class_names, class_urls

def _format_class_name(class_names: List[str]) -> str:
    """
    格式化分类名称字符串
    
    Args:
        class_names: 分类名称列表
        
    Returns:
        格式化后的分类名称字符串
    """
    global USE_GZIP
    class_name_str = '&'.join(class_names)
    if USE_GZIP:
        class_name_str = compress_and_encode(class_name_str)
    return class_name_str

def _create_empty_class_result() -> Dict[str, str]:
    """
    创建空的分类结果
    
    Returns:
        空的分类结果字典
    """
    return {
        "name": "",
        "class_name": "",
        "class_url": "",
    }

def convert_class(classes: Optional[List[Dict[str, Any]]], name: Optional[str] = None) -> Dict[str, str]:
    """
    将获取的分类转换为静态分类格式
    
    Args:
        classes: 分类列表
        name: 资源名称
        
    Returns:
        包含name、class_name、class_url的字典
    """
    if name is None:
        name = ''
        
    # 如果没有分类数据，返回空结构
    if not classes:
        return _create_empty_class_result()
    
    # 提取分类名称和ID
    class_names, class_urls = _extract_class_data(classes)
    
    # 格式化分类名称
    class_name_str = _format_class_name(class_names)
    
    return {
        "name": name,
        "class_name": class_name_str,
        "class_url": '&'.join(class_urls),
    }


def get_convert_classes(rec: Dict[str, Any]) -> Dict[str, str]:
    """
    获取并转换单个采集源的分类信息
    
    Args:
        rec: 采集源记录
        
    Returns:
        转换后的分类信息
    """
    classes = get_classes(rec)
    return convert_class(classes, rec.get('name'))


def check_class(api: str, type_name: str, type_id: str, limit_count: int = 6) -> bool:
    """
    检查指定分类是否有效（是否有内容）
    
    Args:
        api: API地址
        type_name: 分类名称
        type_id: 分类ID
        limit_count: 检查的内容数量限制
        
    Returns:
        分类是否有效
    """
    try:
        # 构建分类检查URL
        check_url = f'{api}?ac=detail&t={type_id}&pg=1'
        r = requests.get(check_url, headers=HEADERS, timeout=TIMEOUT, verify=False)
        ret = r.json()
        
        # 检查是否有视频列表
        vod_list = ret.get('list', [])
        return len(vod_list) >= limit_count
    except Exception as e:
        print(f'检查分类【{type_name}】({type_id})发生错误:{e}')
        return False


def check_active(api: str) -> bool:
    """
    检查API是否可用
    
    Args:
        api: API地址
        
    Returns:
        API是否可用
    """
    try:
        r = requests.get(api, headers=HEADERS, timeout=TIMEOUT, verify=False)
        ret = r.json()
        # 简单检查返回数据是否包含预期字段
        return 'class' in ret or 'list' in ret
    except Exception as e:
        print(f'检查API活跃状态发生错误:{e}')
        return False


def load_json_file(file_path: str) -> List[Dict[str, Any]]:
    """
    加载JSON文件
    
    Args:
        file_path: 文件路径
        
    Returns:
        解析后的JSON数据
        
    Raises:
        SystemExit: 文件不存在时退出程序
    """
    if not os.path.exists(file_path):
        exit(f'不存在采集文件路径:{file_path}')
        
    with open(file_path, encoding='utf-8') as f:
        data = f.read()
    return json.loads(data)


def save_json_file(file_path: str, data: List[Dict[str, Any]]) -> None:
    """
    保存数据到JSON文件
    
    Args:
        file_path: 文件路径
        data: 要保存的数据
    """
    with open(file_path, mode='w+', encoding='utf-8') as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=2))


def process_records_with_threadpool(records: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    使用线程池处理采集记录
    
    Args:
        records: 采集记录列表
        
    Returns:
        处理结果列表
    """
    # 提交任务到线程池
    tasks = [pool.submit(get_convert_classes, rec) for rec in records]
    # 等待所有任务完成
    pool.shutdown(wait=True)
    # 获取结果
    return [task.result() for task in tasks]


def merge_records_with_results(records: List[Dict[str, Any]], results: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """
    将处理结果合并到原始记录中
    
    Args:
        records: 原始记录列表
        results: 处理结果列表
        
    Returns:
        合并后的记录列表
    """
    new_records = []
    for record in records:
        rec_name = record["name"]
        if rec_name:
            # 查找对应的处理结果
            has_name = [ret for ret in results if ret.get("name") == rec_name]
            if has_name:
                record.update(has_name[-1])
                new_records.append(record)
    return new_records


def main(fname: str = '采集') -> None:
    """
    主函数：生成静态分类配置
    
    Args:
        fname: 输入文件名（不含扩展名）
    """
    # 构建文件路径
    file_path = f'./{fname}.json'
    out_file_path = file_path.replace('.json', '静态.json')
    
    # 加载原始数据
    records = load_json_file(file_path)
    print(records)
    
    # 使用线程池处理记录
    results = process_records_with_threadpool(records)
    print(results)
    
    # 合并结果
    new_records = merge_records_with_results(records, results)
    pprint(new_records)
    
    # 保存结果
    print(f'转换静态数据成功记录数:{len(new_records)}')
    save_json_file(out_file_path, new_records)


def check_categories_validity(api_url: str, class_names: List[str], class_urls: List[str], max_workers: int) -> List[str]:
    """
    检查分类的有效性
    
    Args:
        api_url: API地址
        class_names: 分类名称列表
        class_urls: 分类URL列表
        max_workers: 最大工作线程数
        
    Returns:
        无效分类名称列表
    """
    cate_excludes = []
    
    # 创建线程池检查分类
    rec_pool = ThreadPoolExecutor(max_workers=max_workers or len(class_names))
    tasks = []
    
    # 提交检查任务
    for i in range(len(class_names)):
        type_name = class_names[i]
        type_id = class_urls[i]
        tasks.append(rec_pool.submit(check_class, api_url, type_name, type_id))
    
    # 等待所有任务完成
    rec_pool.shutdown(wait=True)
    results = [task.result() for task in tasks]
    print(results)
    
    # 收集无效分类
    for i in range(len(class_names)):
        type_name = class_names[i]
        if not results[i]:
            cate_excludes.append(type_name)
    
    return cate_excludes


def process_single_record_for_exclusion(rec: Dict[str, Any], max_workers: int) -> Dict[str, Any]:
    """
    处理单个记录的分类排除逻辑
    
    Args:
        rec: 采集记录
        max_workers: 最大工作线程数
        
    Returns:
        处理后的记录
    """
    new_rec = rec.copy()
    
    # 构建API URL
    if rec.get('api'):
        api_url = urljoin(rec['url'], rec['api'])
    else:
        api_url = urljoin(rec['url'], '/api.php/provide/vod/')
    
    print(api_url)
    
    # 检查API是否可用
    if not check_active(api_url):
        print(f'{rec["name"]} ({rec["url"]})视为不存活,跳过分类检测')
        return new_rec
    
    # 解析分类信息
    class_names = decode_and_decompress(rec['class_name']).split('&')
    class_urls = rec['class_url'].split('&')
    
    # 检查分类有效性
    cate_excludes = check_categories_validity(api_url, class_names, class_urls, max_workers)
    
    # 添加排除列表
    if len(cate_excludes) > 0:
        new_rec['cate_excludes'] = cate_excludes
    
    return new_rec


def main_exclude(fname: str = '采集静态', max_workers: int = 0) -> None:
    """
    主函数：添加分类过滤配置
    
    Args:
        fname: 输入文件名（不含扩展名）
        max_workers: 最大工作线程数，0表示使用分类数量
    """
    # 加载数据
    file_path = f'./{fname}.json'
    records = load_json_file(file_path)
    
    # 验证数据格式
    if len(records) < 1 or not records[0].get('class_name'):
        exit('输入数据有误，疑似不是静态数据')
    
    print(records)
    
    # 处理每个记录
    new_records = []
    for rec in records:
        new_rec = process_single_record_for_exclusion(rec, max_workers)
        new_records.append(new_rec)
    
    # 保存结果
    save_json_file(file_path, new_records)


def get_user_input() -> tuple[str, str]:
    """
    获取用户输入
    
    Returns:
        (处理模式, 文件名) 的元组
    """
    fmode = str(input('请输入处理文件方式(0:生成分类 1:添加分类过滤),留空默认为生成静态分类:\n'))
    ftips = '采集静态' if fmode == '1' else '采集'
    fname = str(input(f'请输入文件名(q结束程序),留空默认为{ftips}:\n'))
    return fmode, fname


def main_entry() -> None:
    """
    程序入口点
    """
    global USE_GZIP
    USE_GZIP = True
    
    # 获取用户输入
    fmode, fname = get_user_input()
    
    # 记录开始时间
    t1 = time.time()
    
    # 检查是否退出
    if fname == 'q':
        exit('已主动结束脚本')
    
    # 根据模式执行相应操作
    if not fmode or fmode == '0':
        # 生成静态分类
        fname = fname or '采集'
        main(fname)
    elif fmode == '1':
        # 添加分类过滤
        fname = fname or '采集静态'
        main_exclude(fname, 10)
    else:
        exit(f'未知的处理类型:{fmode}')
    
    # 计算并显示运行时间
    t2 = time.time()
    print(f'本次程序运行耗时:{round(t2 - t1, 2)}秒')


if __name__ == '__main__':
    main_entry()
