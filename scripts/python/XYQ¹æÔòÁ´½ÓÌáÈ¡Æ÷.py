#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XYQ规则链接提取器

该脚本用于从XYQ规则JSON文件中提取链接并检查其可用性：
1. 扫描指定目录中的所有JSON文件
2. 从每个文件中提取"首页推荐链接"或"分类链接"
3. 检查提取的链接是否可用
4. 生成包含结果的JSON报告

Author: 自动化脚本
Date: 2024
"""

import os
import json
import requests
from urllib.parse import urlparse
import sys
from typing import Dict, List, Optional, Tuple, Any

# 检查是否安装了json5库
try:
    import json5
except ImportError:
    print("错误：需要安装json5库来处理带注释的JSON文件")
    print("请运行: pip install json5")
    sys.exit(1)


class XYQRuleExtractor:
    """XYQ规则链接提取器"""
    
    def __init__(self, timeout: int = 5):
        """
        初始化提取器
        
        Args:
            timeout: HTTP请求超时时间（秒）
        """
        self.timeout = timeout
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.results = []
    
    def extract_origin(self, url: str) -> str:
        """
        从完整URL中提取origin部分（协议+域名+端口）
        
        Args:
            url: 完整的URL
            
        Returns:
            origin部分的URL
        """
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"

    def check_url_availability(self, url: str) -> bool:
        """
        检查URL是否可用（在指定时间内返回HTML内容）
        
        Args:
            url: 要检查的URL
            
        Returns:
            URL是否可用
        """
        try:
            response = requests.get(
                url, 
                headers=self.headers, 
                timeout=self.timeout, 
                allow_redirects=True
            )

            # 检查状态码和内容类型
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '').lower()
                if 'text/html' in content_type:
                    return True
            return False
        except (requests.exceptions.RequestException, ValueError):
            return False

    def parse_json_file(self, file_path: str) -> Optional[str]:
        """
        解析JSON文件并提取目标URL
        
        Args:
            file_path: JSON文件路径
            
        Returns:
            提取的URL，如果解析失败返回None
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                # 使用json5加载带注释的JSON
                data = json5.load(f)

            # 尝试获取两种链接
            target_url = data.get('首页推荐链接') or data.get('分类链接')
            return target_url
        except (json5.JSONDecodeError, TypeError, ValueError) as e:
            print(f"解析错误: {os.path.basename(file_path)} - {str(e)}")
            return None
        except Exception as e:
            print(f"处理文件 {os.path.basename(file_path)} 时出错: {str(e)}")
            return None

    def process_single_file(self, file_path: str, filename: str) -> Dict[str, Any]:
        """
        处理单个JSON文件
        
        Args:
            file_path: 文件完整路径
            filename: 文件名
            
        Returns:
            包含处理结果的字典
        """
        entry = {
            "name": filename,
            "url": None,
            "avaliable": False
        }

        # 解析JSON文件
        target_url = self.parse_json_file(file_path)
        
        if target_url:
            # 提取origin
            origin_url = self.extract_origin(target_url)
            entry["url"] = origin_url

            # 检查URL可用性
            entry["avaliable"] = self.check_url_availability(origin_url)

        return entry

    def get_json_files(self, directory: str) -> List[str]:
        """
        获取目录中的所有JSON文件
        
        Args:
            directory: 目录路径
            
        Returns:
            JSON文件名列表
        """
        try:
            return [f for f in os.listdir(directory) if f.endswith('.json')]
        except OSError as e:
            print(f"读取目录失败: {e}")
            return []

    def save_results(self, output_file: str = 'XYQ提取结果.json') -> str:
        """
        保存结果到JSON文件
        
        Args:
            output_file: 输出文件名
            
        Returns:
            输出文件路径
        """
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, ensure_ascii=False, indent=2)
            return output_file
        except Exception as e:
            print(f"保存结果失败: {e}")
            return ""

    def process_directory(self, directory: str) -> Tuple[List[Dict[str, Any]], str]:
        """
        处理目录中的所有JSON文件并生成结果
        
        Args:
            directory: 包含JSON文件的目录路径
            
        Returns:
            (结果列表, 输出文件路径) 的元组
        """
        self.results = []
        
        # 获取所有JSON文件
        json_files = self.get_json_files(directory)
        
        if not json_files:
            print("目录中没有找到JSON文件")
            return [], ""

        # 处理每个JSON文件
        for filename in json_files:
            file_path = os.path.join(directory, filename)
            entry = self.process_single_file(file_path, filename)
            self.results.append(entry)

        # 保存结果
        output_file = self.save_results()
        return self.results, output_file

    def _calculate_statistics(self, results: List[Dict[str, Any]]) -> Tuple[int, int]:
        """
        计算统计数据
        
        Args:
            results: 处理结果列表
            
        Returns:
            (有效链接数量, 可用链接数量)
        """
        valid_count = sum(1 for entry in results if entry['url'])
        available_count = sum(1 for entry in results if entry['avaliable'])
        return valid_count, available_count
    
    def _print_file_results(self, results: List[Dict[str, Any]]) -> None:
        """
        打印每个文件的处理结果
        
        Args:
            results: 处理结果列表
        """
        for entry in results:
            status = "可用" if entry['avaliable'] else "不可用"
            url_display = entry['url'] if entry['url'] else "未找到有效链接"
            print(f"- {entry['name']}: {url_display} ({status})")

    def print_statistics(self, results: List[Dict[str, Any]]) -> None:
        """
        打印统计信息
        
        Args:
            results: 处理结果列表
        """
        if not results:
            print("没有处理任何文件")
            return

        # 计算统计数据
        valid_count, available_count = self._calculate_statistics(results)

        print(f"共处理 {len(results)} 个文件，结果摘要:")
        
        # 打印每个文件的结果
        self._print_file_results(results)

        print(f"\n统计: {valid_count} 个文件包含有效链接, {available_count} 个链接可用")


def extract_origin(url: str) -> str:
    """
    从完整URL中提取origin部分（协议+域名+端口）
    
    Args:
        url: 完整的URL
        
    Returns:
        origin部分的URL
        
    Note:
        这个函数保留是为了向后兼容，建议使用XYQRuleExtractor类
    """
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def check_url_availability(url: str, timeout: int = 5) -> bool:
    """
    检查URL是否可用（在指定时间内返回HTML内容）
    
    Args:
        url: 要检查的URL
        timeout: 超时时间
        
    Returns:
        URL是否可用
        
    Note:
        这个函数保留是为了向后兼容，建议使用XYQRuleExtractor类
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)

        # 检查状态码和内容类型
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '').lower()
            if 'text/html' in content_type:
                return True
        return False
    except (requests.exceptions.RequestException, ValueError):
        return False


def process_json_files(directory: str) -> Tuple[List[Dict[str, Any]], str]:
    """
    处理目录中的所有JSON文件并生成结果
    
    Args:
        directory: 包含JSON文件的目录路径
        
    Returns:
        (结果列表, 输出文件路径) 的元组
        
    Note:
        这个函数保留是为了向后兼容，建议使用XYQRuleExtractor类
    """
    extractor = XYQRuleExtractor()
    return extractor.process_directory(directory)


def validate_directory(directory: str) -> bool:
    """
    验证目录是否存在且有效
    
    Args:
        directory: 目录路径
        
    Returns:
        目录是否有效
    """
    if not directory.strip():
        print("错误：目录路径不能为空")
        return False
    
    if not os.path.isdir(directory):
        print("错误：指定的路径不是目录或不存在")
        return False
    
    return True


def main() -> None:
    """主函数"""
    # 获取用户输入
    target_dir = input("请输入包含JSON文件的目录路径: ").strip()

    # 验证目录
    if not validate_directory(target_dir):
        sys.exit(1)

    print(f"开始处理目录: {target_dir}")
    
    # 创建提取器并处理文件
    extractor = XYQRuleExtractor()
    results, output_file = extractor.process_directory(target_dir)

    if output_file:
        print(f"\n处理完成！结果已保存到 '{output_file}'")
        extractor.print_statistics(results)
    else:
        print("处理失败，未能生成结果文件")


if __name__ == "__main__":
    main()