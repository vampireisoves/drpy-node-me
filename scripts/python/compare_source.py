#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JavaScript源文件对比工具
功能：对比js和js_dr2目录中的文件，找出js_dr2_old目录中的重复文件并提供删除功能
作者：AI Assistant
创建时间：2025年1月
"""

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Set, List, Dict


class SourceFileComparator:
    """JavaScript源文件对比器"""

    def __init__(self, base_dir: str = None):
        """
        初始化对比器
        
        Args:
            base_dir: 项目根目录，默认为当前脚本所在项目根目录
        """
        if base_dir is None:
            # 获取项目根目录（脚本在scripts/python目录下）
            script_dir = Path(__file__).parent
            self.base_dir = script_dir.parent.parent
        else:
            self.base_dir = Path(base_dir)

        # 定义三个目录路径
        self.js_dir = self.base_dir / "spider" / "js"
        self.js_dr2_dir = self.base_dir / "spider" / "js_dr2"
        self.js_dr2_old_dir = self.base_dir / "spider" / "js_dr2_old"

        # 存储文件信息
        self.js_files: Set[str] = set()
        self.js_dr2_files: Set[str] = set()
        self.js_dr2_old_files: Set[str] = set()
        self.duplicate_files: List[str] = []

        # 存储标准化文件名映射
        self.js_normalized_map: Dict[str, str] = {}
        self.js_dr2_normalized_map: Dict[str, str] = {}
        self.js_dr2_old_normalized_map: Dict[str, str] = {}

    def _normalize_filename(self, filename: str) -> str:
        """
        标准化文件名，去除中括号及其内容
        
        Args:
            filename: 原始文件名
            
        Returns:
            str: 标准化后的文件名
        """
        # 去除中括号及其内容，例如：可可影视[优].js -> 可可影视.js
        normalized = re.sub(r'\[.*?\]', '', filename)
        return normalized

    def _is_valid_js_file(self, filename: str) -> bool:
        """
        检查是否为有效的JavaScript文件（非_开头的.js文件）
        
        Args:
            filename: 文件名
            
        Returns:
            bool: 是否为有效的JavaScript文件
        """
        return (filename.endswith('.js') and
                not filename.startswith('_') and
                not filename.startswith('.'))

    def _scan_directory(self, directory: Path, normalized_map: Dict[str, str] = None) -> Set[str]:
        """
        扫描目录中的有效JavaScript文件
        
        Args:
            directory: 要扫描的目录路径
            normalized_map: 用于存储标准化文件名映射的字典
            
        Returns:
            Set[str]: 文件名集合
        """
        files = set()
        if not directory.exists():
            print(f"警告：目录不存在 - {directory}")
            return files

        try:
            for file_path in directory.iterdir():
                if file_path.is_file() and self._is_valid_js_file(file_path.name):
                    files.add(file_path.name)
                    # 如果提供了映射字典，则建立标准化文件名映射
                    if normalized_map is not None:
                        normalized_name = self._normalize_filename(file_path.name)
                        normalized_map[normalized_name] = file_path.name
        except PermissionError:
            print(f"错误：没有权限访问目录 - {directory}")
        except Exception as e:
            print(f"错误：扫描目录时发生异常 - {directory}: {e}")

        return files

    def scan_all_directories(self):
        """扫描所有目录中的JavaScript文件"""
        print("正在扫描目录...")
        print(f"项目根目录: {self.base_dir}")

        # 扫描js目录
        print(f"扫描目录: {self.js_dir}")
        self.js_files = self._scan_directory(self.js_dir, self.js_normalized_map)
        print(f"找到 {len(self.js_files)} 个有效JS文件")

        # 扫描js_dr2目录
        print(f"扫描目录: {self.js_dr2_dir}")
        self.js_dr2_files = self._scan_directory(self.js_dr2_dir, self.js_dr2_normalized_map)
        print(f"找到 {len(self.js_dr2_files)} 个有效JS文件")

        # 扫描js_dr2_old目录
        print(f"扫描目录: {self.js_dr2_old_dir}")
        self.js_dr2_old_files = self._scan_directory(self.js_dr2_old_dir, self.js_dr2_old_normalized_map)
        print(f"找到 {len(self.js_dr2_old_files)} 个有效JS文件")

    def find_duplicates(self):
        """查找重复文件（基于标准化文件名）"""
        print("\n正在分析重复文件...")

        # 合并js和js_dr2目录的标准化文件名
        source_normalized_names = set(self.js_normalized_map.keys()).union(set(self.js_dr2_normalized_map.keys()))

        # 查找js_dr2_old中与源目录重复的文件（基于标准化文件名）
        self.duplicate_files = []
        for normalized_name, original_name in self.js_dr2_old_normalized_map.items():
            if normalized_name in source_normalized_names:
                self.duplicate_files.append(original_name)

        print(f"发现 {len(self.duplicate_files)} 个重复文件（基于标准化文件名匹配）")

    def generate_report(self) -> Dict:
        """
        生成详细报告
        
        Returns:
            Dict: 包含统计信息的报告
        """
        report = {
            'scan_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'directories': {
                'js': str(self.js_dir),
                'js_dr2': str(self.js_dr2_dir),
                'js_dr2_old': str(self.js_dr2_old_dir)
            },
            'file_counts': {
                'js': len(self.js_files),
                'js_dr2': len(self.js_dr2_files),
                'js_dr2_old': len(self.js_dr2_old_files),
                'duplicates': len(self.duplicate_files)
            },
            'duplicate_files': sorted(self.duplicate_files),
            'unique_files_in_old': sorted(list(self.js_dr2_old_files - set(self.duplicate_files)))
        }
        return report

    def print_report(self):
        """打印详细报告"""
        report = self.generate_report()

        print("\n" + "=" * 60)
        print("JavaScript文件对比报告")
        print("=" * 60)
        print(f"扫描时间: {report['scan_time']}")
        print(f"项目根目录: {self.base_dir}")

        print(f"\n目录统计:")
        print(f"  js目录: {report['file_counts']['js']} 个文件")
        print(f"  js_dr2目录: {report['file_counts']['js_dr2']} 个文件")
        print(f"  js_dr2_old目录: {report['file_counts']['js_dr2_old']} 个文件")

        print(f"\n重复文件分析:")
        print(f"  重复文件数量: {report['file_counts']['duplicates']} 个")
        print(f"  js_dr2_old中唯一文件: {len(report['unique_files_in_old'])} 个")

        if self.duplicate_files:
            print(f"\n重复文件清单:")
            for i, filename in enumerate(report['duplicate_files'], 1):
                print(f"  {i:2d}. {filename}")

        if report['unique_files_in_old']:
            print(f"\njs_dr2_old中的唯一文件（不会被删除）:")
            for i, filename in enumerate(report['unique_files_in_old'], 1):
                print(f"  {i:2d}. {filename}")

    def delete_duplicates(self, confirm: bool = False) -> bool:
        """
        删除重复文件
        
        Args:
            confirm: 是否已确认删除
            
        Returns:
            bool: 删除是否成功
        """
        if not self.duplicate_files:
            print("没有发现重复文件，无需删除。")
            return True

        if not confirm:
            print(f"\n即将删除 {len(self.duplicate_files)} 个重复文件:")
            for filename in self.duplicate_files:
                print(f"  - {filename}")

            response = input(f"\n确认删除这些文件吗？(y/N): ").strip().lower()
            if response not in ['y', 'yes', '是']:
                print("取消删除操作。")
                return False

        # 执行删除
        deleted_count = 0
        failed_files = []

        for filename in self.duplicate_files:
            file_path = self.js_dr2_old_dir / filename
            try:
                if file_path.exists():
                    file_path.unlink()
                    deleted_count += 1
                    print(f"已删除: {filename}")
                else:
                    print(f"文件不存在: {filename}")
            except Exception as e:
                failed_files.append((filename, str(e)))
                print(f"删除失败: {filename} - {e}")

        print(f"\n删除完成:")
        print(f"  成功删除: {deleted_count} 个文件")
        if failed_files:
            print(f"  删除失败: {len(failed_files)} 个文件")
            for filename, error in failed_files:
                print(f"    - {filename}: {error}")

        return len(failed_files) == 0


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="JavaScript源文件对比工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python compare_source.py                    # 扫描并显示报告
  python compare_source.py --delete           # 扫描并交互式删除重复文件
  python compare_source.py --delete --force   # 扫描并强制删除重复文件（无确认）
  python compare_source.py --base-dir /path   # 指定项目根目录
        """
    )

    parser.add_argument(
        '--base-dir',
        type=str,
        help='项目根目录路径（默认为脚本所在项目根目录）'
    )
    parser.add_argument(
        '--delete',
        action='store_true',
        help='删除重复文件'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='强制删除，不需要确认（需要与--delete一起使用）'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='静默模式，只显示关键信息'
    )

    args = parser.parse_args()

    try:
        # 创建对比器实例
        comparator = SourceFileComparator(args.base_dir)

        # 扫描目录
        if not args.quiet:
            comparator.scan_all_directories()
        else:
            comparator.js_files = comparator._scan_directory(comparator.js_dir)
            comparator.js_dr2_files = comparator._scan_directory(comparator.js_dr2_dir)
            comparator.js_dr2_old_files = comparator._scan_directory(comparator.js_dr2_old_dir)

        # 查找重复文件
        comparator.find_duplicates()

        # 显示报告
        if not args.quiet:
            comparator.print_report()
        else:
            print(f"发现 {len(comparator.duplicate_files)} 个重复文件")

        # 删除重复文件
        if args.delete:
            success = comparator.delete_duplicates(confirm=args.force)
            if success:
                print("\n重复文件清理完成！")
                return 0
            else:
                print("\n重复文件清理失败！")
                return 1
        else:
            if comparator.duplicate_files:
                print(f"\n提示：使用 --delete 参数可以删除这 {len(comparator.duplicate_files)} 个重复文件")

        return 0

    except KeyboardInterrupt:
        print("\n\n操作被用户中断。")
        return 1
    except Exception as e:
        print(f"\n错误：{e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
