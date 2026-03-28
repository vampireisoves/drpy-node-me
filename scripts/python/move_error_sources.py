#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
移动错误源文件脚本

该脚本用于处理错误的数据源文件：
1. 读取report.json文件，找出status为"error"的数据源
2. 根据name字段去掉括号后的文件名，在js目录中查找对应的JS文件
3. 将错误的JS文件移动到js_bad目录中

Author: 自动化脚本
Date: 2024
"""

import json
import os
import shutil
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any


class ErrorSourceMover:
    """错误源文件移动器"""
    
    def __init__(self):
        """初始化移动器，设置基本路径"""
        self.base_dir = Path(__file__).parent.parent.parent  # drpy-node目录
        self.report_file = self.base_dir / "data" / "source-checker" / "report.json"
        self.js_dir = self.base_dir / "spider" / "js"
        self.js_bad_dir = self.base_dir / "spider" / "js_bad"
        
        # 统计信息
        self.stats = {
            'error_count': 0,
            'moved_count': 0,
            'already_in_bad_count': 0,
            'not_found_count': 0
        }
    
    def extract_filename_from_name(self, name: str) -> str:
        """
        从name字段提取文件名，只去掉圆括号及其内容，保留方括号
        
        Args:
            name: 原始名称，例如: "皮皮虾[优](DS)"
            
        Returns:
            处理后的文件名，例如: "皮皮虾[优]"
        """
        # 使用正则表达式只去掉圆括号及其内容
        filename = re.sub(r'\(.*?\)', '', name).strip()
        return filename

    def find_js_file(self, filename: str) -> Tuple[Optional[Path], str]:
        """
        在js目录和js_bad目录中查找对应的JS文件
        
        Args:
            filename: 要查找的文件名（不含扩展名）
            
        Returns:
            (文件路径, 状态) 元组
            状态: 'js' - 在js目录, 'js_bad' - 在js_bad目录, 'not_found' - 未找到
        """
        js_file = self.js_dir / f"{filename}.js"
        js_bad_file = self.js_bad_dir / f"{filename}.js"
        
        if js_file.exists():
            return js_file, 'js'
        elif js_bad_file.exists():
            return js_bad_file, 'js_bad'
        else:
            return None, 'not_found'

    def load_report_data(self) -> List[Dict[str, Any]]:
        """
        加载报告文件数据
        
        Returns:
            数据源列表
            
        Raises:
            FileNotFoundError: 报告文件不存在
            json.JSONDecodeError: JSON格式错误
        """
        try:
            with open(self.report_file, 'r', encoding='utf-8') as f:
                report_data = json.load(f)
            return report_data.get('sources', [])
        except FileNotFoundError:
            raise FileNotFoundError(f"找不到报告文件: {self.report_file}")
        except json.JSONDecodeError as e:
            raise json.JSONDecodeError(f"无法解析JSON文件 {self.report_file}: {e}")

    def ensure_directories_exist(self) -> None:
        """确保必要的目录存在"""
        self.js_bad_dir.mkdir(exist_ok=True)

    def move_file_to_bad_dir(self, js_file: Path) -> bool:
        """
        将JS文件移动到js_bad目录
        
        Args:
            js_file: 要移动的文件路径
            
        Returns:
            移动是否成功
        """
        destination = self.js_bad_dir / js_file.name
        
        try:
            shutil.move(str(js_file), str(destination))
            print(f"  ✓ 已移动: {js_file.name} -> js_bad/")
            return True
        except Exception as e:
            print(f"  ✗ 移动失败: {e}")
            return False

    def process_error_source(self, source: Dict[str, Any]) -> None:
        """
        处理单个错误源
        
        Args:
            source: 源数据字典
        """
        self.stats['error_count'] += 1
        name = source.get('name', '')
        
        # 提取文件名
        filename = self.extract_filename_from_name(name)
        
        print(f"\n处理错误源: {name}")
        print(f"  提取的文件名: {filename}")
        
        # 查找对应的JS文件
        js_file, status = self.find_js_file(filename)
        
        if status == 'js':
            # 文件在js目录，需要移动到js_bad目录
            if self.move_file_to_bad_dir(js_file):
                self.stats['moved_count'] += 1
        elif status == 'js_bad':
            # 文件已经在js_bad目录
            self.stats['already_in_bad_count'] += 1
            print(f"  ℹ 文件已在js_bad目录: {js_file.name}")
        else:
            # 两个目录都没有找到文件
            self.stats['not_found_count'] += 1
            print(f"  ✗ 未找到对应的JS文件（js和js_bad目录都没有）")

    def process_all_error_sources(self, sources: List[Dict[str, Any]]) -> None:
        """
        处理所有错误源
        
        Args:
            sources: 所有数据源列表
        """
        print(f"总共找到 {len(sources)} 个数据源")
        
        # 遍历所有源，找出错误的源
        for source in sources:
            if source.get('status') == 'error':
                self.process_error_source(source)

    def print_statistics(self) -> None:
        """打印统计信息"""
        print("\n" + "=" * 50)
        print("处理完成！统计信息:")
        print(f"  错误源总数: {self.stats['error_count']}")
        print(f"  成功移动: {self.stats['moved_count']}")
        print(f"  已在js_bad目录: {self.stats['already_in_bad_count']}")
        print(f"  未找到文件: {self.stats['not_found_count']}")
        print("=" * 50)

    def print_initial_info(self) -> None:
        """打印初始信息"""
        print(f"读取报告文件: {self.report_file}")
        print(f"JS源目录: {self.js_dir}")
        print(f"JS错误目录: {self.js_bad_dir}")
        print("-" * 50)

    def run(self) -> None:
        """
        运行错误源移动流程
        """
        try:
            # 打印初始信息
            self.print_initial_info()
            
            # 确保目录存在
            self.ensure_directories_exist()
            
            # 加载报告数据
            sources = self.load_report_data()
            
            # 处理所有错误源
            self.process_all_error_sources(sources)
            
            # 打印统计信息
            self.print_statistics()
            
        except FileNotFoundError as e:
            print(f"错误: {e}")
        except json.JSONDecodeError as e:
            print(f"错误: {e}")
        except Exception as e:
            print(f"未知错误: {e}")


def move_error_sources() -> None:
    """
    主函数：处理错误源文件的移动
    
    这是为了保持向后兼容性而保留的函数
    """
    mover = ErrorSourceMover()
    mover.run()


# 为了向后兼容，保留原有的独立函数
def extract_filename_from_name(name: str) -> str:
    """
    从name字段提取文件名，只去掉圆括号及其内容，保留方括号
    
    Args:
        name: 原始名称
        
    Returns:
        处理后的文件名
        
    Note:
        这个函数保留是为了向后兼容，建议使用ErrorSourceMover类
    """
    return re.sub(r'\(.*?\)', '', name).strip()


def find_js_file(js_dir: Path, js_bad_dir: Path, filename: str) -> Tuple[Optional[Path], str]:
    """
    在js目录和js_bad目录中查找对应的JS文件
    
    Args:
        js_dir: js目录路径
        js_bad_dir: js_bad目录路径
        filename: 要查找的文件名
        
    Returns:
        (文件路径, 状态) 元组
        
    Note:
        这个函数保留是为了向后兼容，建议使用ErrorSourceMover类
    """
    js_file = js_dir / f"{filename}.js"
    js_bad_file = js_bad_dir / f"{filename}.js"
    
    if js_file.exists():
        return js_file, 'js'
    elif js_bad_file.exists():
        return js_bad_file, 'js_bad'
    else:
        return None, 'not_found'


if __name__ == "__main__":
    move_error_sources()
