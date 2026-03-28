/**
 * 拼音工具模块
 * 
 * 提供中文文本转拼音首字母的功能，主要用于：
 * - 生成中文内容的首字母缩写
 * - 创建搜索索引
 * - 文件名或标识符生成
 * 
 * @author drpy-node
 * @version 1.0.0
 */

import {pinyin} from 'pinyin';

/**
 * 获取中文文本的拼音首字母
 * 
 * 将输入的中文文本转换为对应的拼音首字母大写组合
 * 例如："中国" -> "ZG"，"北京市" -> "BJS"
 * 
 * @param {string} text - 需要转换的中文文本
 * @returns {string} 拼音首字母大写组合字符串
 * 
 * @example
 * // 基本用法
 * getFirstLetter('中国'); // 返回 'ZG'
 * getFirstLetter('北京市'); // 返回 'BJS'
 * getFirstLetter('上海浦东新区'); // 返回 'SHPDXQ'
 */
export function getFirstLetter(text) {
    // 使用pinyin库将中文转换为拼音首字母
    const pinyinArray = pinyin(text, {
        style: pinyin.STYLE_FIRST_LETTER, // 设置样式为首字母
    });
    
    // 将拼音数组转换为大写字母并连接成字符串
    return pinyinArray.map(item => item[0].toUpperCase()).join('');
}
