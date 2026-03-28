#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
APP配置MAP提取器

功能描述：
从JSON配置文件中提取APP配置映射信息，并生成格式化的文本文件。
主要用于处理drpy-node项目中的APP配置数据，将JSON格式的配置转换为
便于使用的文本映射格式。

主要功能：
1. 读取JSON配置文件（App_PY.json）
2. 提取每个APP的api路径、名称和扩展配置
3. 格式化输出为文本映射文件（appMap.txt）
4. 支持嵌套JSON对象的序列化处理

输出格式：
{filename}@@{value}@@{key}[{name}]

使用示例：
python APP配置MAP提取器.py

作者: drpy-node
版本: 2.0.0
创建时间: 2024
最后修改: 2024
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


class AppConfigMapExtractor:
    """
    APP配置MAP提取器类
    
    负责从JSON配置文件中提取APP配置映射信息，并生成格式化的文本文件。
    """
    
    def __init__(self, separator: str = "@@") -> None:
        """
        初始化提取器
        
        Args:
            separator: 字段分隔符，默认为"@@"
        """
        self.separator = separator
        self.logger = self._setup_logger()
    
    def _setup_logger(self) -> logging.Logger:
        """
        设置日志记录器
        
        Returns:
            配置好的日志记录器实例
        """
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.INFO)
        
        # 避免重复添加处理器
        if not logger.handlers:
            # 创建控制台处理器
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logging.INFO)
            
            # 设置日志格式
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            console_handler.setFormatter(formatter)
            
            logger.addHandler(console_handler)
        
        return logger
    
    def _validate_json_structure(self, data: Any) -> bool:
        """
        验证JSON数据结构的有效性
        
        Args:
            data: 待验证的JSON数据
            
        Returns:
            bool: 数据结构是否有效
        """
        if not isinstance(data, list):
            self.logger.error("JSON数据必须是一个数组")
            return False
        
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                self.logger.error(f"第{i+1}个元素必须是对象类型")
                return False
            
            required_fields = ['api', 'name']
            for field in required_fields:
                if field not in item:
                    self.logger.warning(f"第{i+1}个元素缺少必需字段: {field}")
        
        return True
    
    def _extract_filename_from_api(self, api_path: str) -> str:
        """
        从API路径中提取文件名（不含扩展名）
        
        Args:
            api_path: API文件路径
            
        Returns:
            str: 提取的文件名
        """
        if not api_path:
            return ""
        
        try:
            # 使用pathlib处理路径，更加健壮
            path = Path(api_path)
            return path.stem  # 获取不含扩展名的文件名
        except Exception as e:
            self.logger.warning(f"解析API路径失败: {api_path}, 错误: {e}")
            return os.path.splitext(os.path.basename(api_path))[0]
    
    def _process_extension_value(self, value: Any) -> str:
        """
        处理扩展配置值，将复杂对象转换为JSON字符串
        
        Args:
            value: 扩展配置值
            
        Returns:
            str: 处理后的字符串值
        """
        if isinstance(value, dict):
            try:
                return json.dumps(value, ensure_ascii=False, separators=(',', ':'))
            except (TypeError, ValueError) as e:
                self.logger.warning(f"JSON序列化失败: {e}")
                return str(value)
        elif isinstance(value, (list, tuple)):
            try:
                return json.dumps(value, ensure_ascii=False, separators=(',', ':'))
            except (TypeError, ValueError) as e:
                self.logger.warning(f"JSON序列化失败: {e}")
                return str(value)
        else:
            return str(value)
    
    def _process_single_item(self, item: Dict[str, Any]) -> List[str]:
        """
        处理单个配置项，生成映射行
        
        Args:
            item: 单个APP配置项
            
        Returns:
            List[str]: 生成的映射行列表
        """
        results = []
        
        # 提取基本信息
        api_path = item.get('api', '')
        name = item.get('name', '')
        filename = self._extract_filename_from_api(api_path)
        
        if not filename:
            self.logger.warning(f"无法提取文件名，跳过项目: {item}")
            return results
        
        # 处理扩展配置
        exts = item.get('exts', {})
        if not isinstance(exts, dict):
            self.logger.warning(f"exts字段必须是对象类型，跳过项目: {item}")
            return results
        
        # 生成映射行
        for key, value in exts.items():
            try:
                processed_value = self._process_extension_value(value)
                line = f"{filename}{self.separator}{processed_value}{self.separator}{key}[{name}]"
                results.append(line)
            except Exception as e:
                self.logger.error(f"处理扩展配置失败: key={key}, value={value}, 错误: {e}")
                continue
        
        return results
    
    def _load_json_data(self, json_path: Path) -> Optional[List[Dict[str, Any]]]:
        """
        加载并验证JSON数据
        
        Args:
            json_path: JSON文件路径
            
        Returns:
            Optional[List[Dict[str, Any]]]: 加载的数据，失败时返回None
        """
        try:
            # 检查输入文件是否存在
            if not json_path.exists():
                self.logger.error(f"输入文件不存在: {json_path}")
                return None
            
            # 读取JSON文件
            self.logger.info(f"开始读取JSON文件: {json_path}")
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 验证数据结构
            if not self._validate_json_structure(data):
                return None
                
            return data
            
        except json.JSONDecodeError as e:
            self.logger.error(f"JSON文件格式错误: {e}")
            return None
        except FileNotFoundError as e:
            self.logger.error(f"文件未找到: {e}")
            return None
        except Exception as e:
            self.logger.error(f"读取JSON文件时发生错误: {e}")
            return None
    
    def _process_all_items(self, data: List[Dict[str, Any]]) -> List[str]:
        """
        处理所有配置项
        
        Args:
            data: 配置数据列表
            
        Returns:
            List[str]: 处理后的映射行列表
        """
        self.logger.info("开始处理配置数据...")
        all_results = []
        
        for i, item in enumerate(data):
            try:
                item_results = self._process_single_item(item)
                all_results.extend(item_results)
            except Exception as e:
                self.logger.error(f"处理第{i+1}个配置项失败: {e}")
                continue
        
        return all_results
    
    def _write_output_file(self, output_path: Path, results: List[str]) -> bool:
        """
        写入输出文件
        
        Args:
            output_path: 输出文件路径
            results: 要写入的结果列表
            
        Returns:
            bool: 写入是否成功
        """
        try:
            # 确保输出目录存在
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 写入输出文件
            self.logger.info(f"开始写入输出文件: {output_path}")
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(results))
            
            self.logger.info(f"处理完成！共生成 {len(results)} 行映射数据")
            self.logger.info(f"输出文件: {output_path.absolute()}")
            
            return True
            
        except PermissionError as e:
            self.logger.error(f"文件权限错误: {e}")
            return False
        except Exception as e:
            self.logger.error(f"写入文件时发生错误: {e}")
            return False

    def extract_config_map(self, json_file_path: Union[str, Path], 
                          output_txt_path: Union[str, Path]) -> bool:
        """
        从JSON文件提取配置映射并保存到文本文件
        
        Args:
            json_file_path: 输入的JSON文件路径
            output_txt_path: 输出的文本文件路径
            
        Returns:
            bool: 处理是否成功
        """
        json_path = Path(json_file_path)
        output_path = Path(output_txt_path)
        
        # 加载JSON数据
        data = self._load_json_data(json_path)
        if data is None:
            return False
        
        # 处理所有配置项
        all_results = self._process_all_items(data)
        if not all_results:
            self.logger.warning("没有生成任何映射数据")
            return False
        
        # 写入输出文件
        return self._write_output_file(output_path, all_results)


def parse_arguments() -> argparse.Namespace:
    """
    解析命令行参数
    
    Returns:
        argparse.Namespace: 解析后的命令行参数
    """
    parser = argparse.ArgumentParser(
        description="APP配置MAP提取器 - 从JSON配置文件中提取APP配置映射信息",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  %(prog)s                                    # 使用默认文件名
  %(prog)s -i config.json -o output.txt      # 指定输入输出文件
  %(prog)s -s "||" -v                        # 使用自定义分隔符和详细输出
  %(prog)s --input-file App_PY.json --quiet  # 静默模式运行
        """
    )
    
    parser.add_argument(
        '-i', '--input-file',
        type=str,
        default='App_PY.json',
        help='输入的JSON配置文件路径 (默认: App_PY.json)'
    )
    
    parser.add_argument(
        '-o', '--output-file',
        type=str,
        default='appMap.txt',
        help='输出的文本映射文件路径 (默认: appMap.txt)'
    )
    
    parser.add_argument(
        '-s', '--separator',
        type=str,
        default='@@',
        help='字段分隔符 (默认: @@)'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='启用详细输出模式'
    )
    
    parser.add_argument(
        '-q', '--quiet',
        action='store_true',
        help='静默模式，只输出错误信息'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version='%(prog)s 2.0.0'
    )
    
    return parser.parse_args()


def setup_logging_level(verbose: bool, quiet: bool) -> int:
    """
    根据命令行参数设置日志级别
    
    Args:
        verbose: 是否启用详细输出
        quiet: 是否启用静默模式
        
    Returns:
        int: 日志级别
    """
    if quiet:
        return logging.ERROR
    elif verbose:
        return logging.DEBUG
    else:
        return logging.INFO


def validate_arguments(args: argparse.Namespace) -> None:
    """
    验证命令行参数的有效性
    
    Args:
        args: 解析后的命令行参数
        
    Raises:
        SystemExit: 参数验证失败时退出程序
    """
    if args.verbose and args.quiet:
        print("错误: --verbose 和 --quiet 参数不能同时使用", file=sys.stderr)
        sys.exit(1)


def setup_extractor(args: argparse.Namespace) -> AppConfigMapExtractor:
    """
    创建并配置提取器实例
    
    Args:
        args: 解析后的命令行参数
        
    Returns:
        AppConfigMapExtractor: 配置好的提取器实例
    """
    # 设置日志级别
    log_level = setup_logging_level(args.verbose, args.quiet)
    
    # 创建提取器实例
    extractor = AppConfigMapExtractor(separator=args.separator)
    
    # 更新日志级别
    extractor.logger.setLevel(log_level)
    for handler in extractor.logger.handlers:
        handler.setLevel(log_level)
    
    return extractor


def print_startup_info(extractor: AppConfigMapExtractor, args: argparse.Namespace) -> None:
    """
    输出程序启动信息
    
    Args:
        extractor: 提取器实例
        args: 解析后的命令行参数
    """
    if not args.quiet:
        extractor.logger.info("=" * 50)
        extractor.logger.info("APP配置MAP提取器 v2.0.0")
        extractor.logger.info("=" * 50)
        extractor.logger.info(f"输入文件: {args.input_file}")
        extractor.logger.info(f"输出文件: {args.output_file}")
        extractor.logger.info(f"分隔符: {args.separator}")
        extractor.logger.info("=" * 50)


def print_result_info(extractor: AppConfigMapExtractor, args: argparse.Namespace, success: bool) -> None:
    """
    输出处理结果信息
    
    Args:
        extractor: 提取器实例
        args: 解析后的命令行参数
        success: 处理是否成功
    """
    if not args.quiet:
        if success:
            extractor.logger.info("✅ 处理成功完成！")
        else:
            extractor.logger.error("❌ 处理失败！")


def main() -> None:
    """
    主函数 - 程序入口点
    """
    try:
        # 解析和验证命令行参数
        args = parse_arguments()
        validate_arguments(args)
        
        # 创建并配置提取器
        extractor = setup_extractor(args)
        
        # 输出启动信息
        print_startup_info(extractor, args)
        
        # 执行提取操作
        success = extractor.extract_config_map(args.input_file, args.output_file)
        
        # 输出结果信息
        print_result_info(extractor, args, success)
        
        # 根据结果设置退出码
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n用户中断操作", file=sys.stderr)
        sys.exit(130)
    except Exception as e:
        print(f"程序执行出错: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
