/**
 * 批量HTTP请求处理模块
 * 提供两种不同的批量请求实现方式：PQueue和Queue
 * @module drpyBatchFetch
 */

import PQueue from 'p-queue';
import Queue from 'queue';
import createAxiosInstance from '../utils/createAxiosAgent.js';

// 最大连接数配置
const maxSockets = 16;
// 创建axios实例
const _axios = createAxiosInstance({maxSockets:maxSockets});

/**
 * 使用PQueue实现的批量请求方法
 * @param {Array} items - 请求项数组，每个项包含url和options
 * @param {number} maxWorkers - 最大并发数，默认5
 * @param {number} timeoutConfig - 超时时间配置，默认5000ms
 * @returns {Promise<Array>} 返回响应数据数组
 */
export const batchFetch1 = async (items, maxWorkers = 5, timeoutConfig = 5000) => {
    // 记录开始时间
    let t1 = (new Date()).getTime();
    
    // 创建PQueue实例，设置并发数
    const queue = new PQueue({concurrency: maxWorkers});

    // 获取全局 timeout 设置
    const timeout = timeoutConfig;

    // 遍历 items 并生成任务队列
    const promises = items.map((item) => {
        return queue.add(async () => {
            try {
                // 发送HTTP请求
                const response = await _axios(
                    Object.assign({}, item?.options, {
                        url: item.url,
                        method: item?.options?.method || 'GET',
                        timeout: item?.options?.timeout || timeout,
                        responseType: 'text',
                    }),
                );
                return response.data;
            } catch (error) {
                // 记录错误日志
                console.log(`[batchFetch][error] ${item.url}: ${error}`);
                return null;
            }
        });
    });
    
    // 等待所有任务完成
    const results = await Promise.all(promises);
    
    // 计算耗时并记录日志
    let t2 = (new Date()).getTime();
    log(`PQueue 批量请求 ${items[0].url} 等 ${items.length}个地址 耗时${t2 - t1}毫秒:`);
    
    // 执行所有任务
    return results
};

/**
 * 使用Queue实现的批量请求方法
 * @param {Array} items - 请求项数组，每个项包含url和options
 * @param {number} maxWorkers - 最大并发数，默认5
 * @param {number} timeoutConfig - 超时时间配置，默认5000ms
 * @returns {Promise<Array>} 返回响应数据数组
 */
export const batchFetch2 = async (items, maxWorkers = 5, timeoutConfig = 5000) => {
    // 记录开始时间
    let t1 = (new Date()).getTime();
    
    // 创建Queue实例，设置并发数和自动启动
    const queue = new Queue({concurrency: maxWorkers, autostart: true});

    // 获取全局 timeout 设置
    const timeout = timeoutConfig;

    // 初始化结果数组和Promise数组
    const results = [];
    const promises = [];

    // 遍历items创建任务
    items.forEach((item, index) => {
        promises.push(
            new Promise((resolve) => {
                queue.push(async () => {
                    try {
                        // 发送HTTP请求
                        const response = await _axios(
                            Object.assign({}, item?.options, {
                                url: item.url,
                                method: item?.options?.method || 'GET',
                                timeout: item?.options?.timeout || timeout,
                                responseType: 'text',
                            }),
                        );
                        // 按索引存储结果
                        results[index] = response.data;
                        resolve();
                    } catch (error) {
                        // 记录错误日志
                        console.log(`[batchFetch][error] ${item.url}: ${error}`);
                        results[index] = null;
                        resolve();
                    }
                });
            }),
        );
    });

    // 等待所有任务完成
    await Promise.all(promises);
    
    // 计算耗时并记录日志
    let t2 = (new Date()).getTime();
    log(`Queue 批量请求 ${items[0].url} 等 ${items.length}个地址 耗时${t2 - t1}毫秒:`);
    
    return results;
};



