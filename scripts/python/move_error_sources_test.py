#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试脚本：查看错误源信息
"""

import json
import re
from pathlib import Path


def extract_filename_from_name(name):
    """从name字段提取文件名，只去掉圆括号及其内容，保留方括号"""
    filename = re.sub(r'\(.*?\)', '', name).strip()
    return filename


def test_error_sources():
    """测试函数：查看错误源信息"""
    base_dir = Path(__file__).parent.parent.parent
    report_file = base_dir / "data" / "source-checker" / "report.json"
    js_dir = base_dir / "spider" / "js"

    print(f"读取报告文件: {report_file}")
    print(f"JS源目录: {js_dir}")
    print("-" * 50)

    try:
        with open(report_file, 'r', encoding='utf-8') as f:
            report_data = json.load(f)

        sources = report_data.get('sources', [])
        error_sources = [s for s in sources if s.get('status') == 'error']

        print(f"总共找到 {len(sources)} 个数据源")
        print(f"其中错误源有 {len(error_sources)} 个")
        print("\n错误源列表:")
        print("-" * 50)

        js_bad_dir = base_dir / "spider" / "js_bad"

        for i, source in enumerate(error_sources[:10], 1):  # 只显示前10个
            name = source.get('name', '')
            filename = extract_filename_from_name(name)

            # 检查对应的JS文件在哪个目录
            js_file = js_dir / f"{filename}.js"
            js_bad_file = js_bad_dir / f"{filename}.js"
            
            if js_file.exists():
                status = "✓ 在js目录"
            elif js_bad_file.exists():
                status = "ℹ 在js_bad目录"
            else:
                status = "✗ 未找到"

            print(f"{i:2d}. {name}")
            print(f"    提取文件名: {filename}")
            print(f"    文件状态: {status}")
            print()

        if len(error_sources) > 10:
            print(f"... 还有 {len(error_sources) - 10} 个错误源")

    except Exception as e:
        print(f"错误: {e}")


if __name__ == "__main__":
    test_error_sources()
