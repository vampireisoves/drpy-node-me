/**
 * 日期时间格式化工具模块
 * 
 * 基于 Day.js 库提供日期时间的格式化和时区转换功能。
 * 主要用于将各种时间格式统一转换为北京时间格式。
 * 
 * 功能特性：
 * - 支持自定义日期格式解析
 * - 支持UTC时间处理
 * - 支持时区转换
 * - 提供北京时间格式化函数
 * 
 * @module DateTimeFormat
 * @author drpy-node
 * @since 1.0.0
 */

import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc.js';
import timezonePlugin from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

// 扩展dayjs功能，添加必要的插件支持
dayjs.extend(customParseFormat);  // 支持自定义日期格式解析
dayjs.extend(utcPlugin);          // 支持UTC时间处理
dayjs.extend(timezonePlugin);     // 支持时区转换功能

/**
 * 将任意时间格式转换为北京时间
 * 
 * 接收各种格式的日期时间输入，统一转换为北京时区的标准格式。
 * 自动处理UTC时间转换和时区偏移，确保输出时间的准确性。
 * 
 * @function toBeijingTime
 * @param {string|Date|number|null|undefined} date - 需要转换的日期时间
 *   - string: 日期字符串（如 '2024-01-01 12:00:00'、'2024-01-01T12:00:00Z'）
 *   - Date: JavaScript Date对象
 *   - number: 时间戳（毫秒或秒）
 *   - null/undefined: 空值
 * @returns {string|null} 转换后的北京时间字符串，格式为 'YYYY-MM-DD HH:mm:ss'
 *   - 成功转换时返回格式化的时间字符串
 *   - 输入为空值时返回 null
 * 
 * @example
 * // 转换UTC时间字符串
 * toBeijingTime('2024-01-01T12:00:00Z')  // '2024-01-01 20:00:00'
 * 
 * // 转换本地时间字符串
 * toBeijingTime('2024-01-01 12:00:00')   // '2024-01-01 12:00:00'
 * 
 * // 转换时间戳
 * toBeijingTime(1704067200000)           // '2024-01-01 12:00:00'
 * 
 * // 处理空值
 * toBeijingTime(null)                    // null
 * toBeijingTime(undefined)               // null
 */
export const toBeijingTime = (date) =>
    date ? dayjs(date).utc().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss') : null;