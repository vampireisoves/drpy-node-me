#!/usr/bin/env node

/**
 * 内存泄露测试脚本
 * 用于测试 mediaProxy 接口的内存使用情况
 */

import http from 'http';
import { performance } from 'perf_hooks';

const TEST_URL = 'http://localhost:5757/mediaProxy';
const TEST_MEDIA_URL = 'https://httpbin.org/bytes/1024'; // 测试用的1KB数据
const CONCURRENT_REQUESTS = 10;
const TEST_DURATION = 60000; // 60秒测试
const MEMORY_CHECK_INTERVAL = 5000; // 每5秒检查一次内存

let requestCount = 0;
let errorCount = 0;
let activeRequests = 0;

// 内存监控
function logMemoryUsage() {
    const usage = process.memoryUsage();
    console.log(`[${new Date().toISOString()}] Memory Usage:`, {
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`,
        activeRequests: activeRequests,
        totalRequests: requestCount,
        errors: errorCount
    });
}

// 发送测试请求
function sendTestRequest() {
    return new Promise((resolve) => {
        activeRequests++;
        const startTime = performance.now();
        
        const queryParams = new URLSearchParams({
            url: TEST_MEDIA_URL,
            thread: '2',
            size: '64K',
            randUa: '0'
        }).toString();

        const options = {
            hostname: 'localhost',
            port: 5757,
            path: `/mediaProxy?${queryParams}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        };

        const req = http.request(options, (res) => {
            let dataReceived = 0;
            
            res.on('data', (chunk) => {
                dataReceived += chunk.length;
            });
            
            res.on('end', () => {
                const duration = performance.now() - startTime;
                requestCount++;
                activeRequests--;
                
                if (res.statusCode === 200 || res.statusCode === 206) {
                    console.log(`✓ Request ${requestCount} completed in ${Math.round(duration)}ms, received ${dataReceived} bytes (status: ${res.statusCode})`);
                } else {
                    console.log(`✗ Request ${requestCount} failed with status ${res.statusCode}`);
                    errorCount++;
                }
                resolve();
            });
            
            res.on('error', (error) => {
                console.error(`✗ Response error for request ${requestCount}:`, error.message);
                errorCount++;
                activeRequests--;
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error(`✗ Request error:`, error.message);
            errorCount++;
            activeRequests--;
            resolve();
        });

        req.on('timeout', () => {
            console.error(`✗ Request timeout`);
            errorCount++;
            activeRequests--;
            req.destroy();
            resolve();
        });

        req.end();
    });
}

// 并发测试
async function runConcurrentTest() {
    console.log(`Starting memory leak test...`);
    console.log(`Test URL: ${TEST_URL}`);
    console.log(`Media URL: ${TEST_MEDIA_URL}`);
    console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}`);
    console.log(`Test duration: ${TEST_DURATION / 1000} seconds`);
    console.log('---');

    // 开始内存监控
    const memoryInterval = setInterval(logMemoryUsage, MEMORY_CHECK_INTERVAL);
    logMemoryUsage(); // 初始内存状态

    const startTime = Date.now();
    
    // 持续发送并发请求
    while (Date.now() - startTime < TEST_DURATION) {
        const promises = [];
        
        for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
            promises.push(sendTestRequest());
        }
        
        await Promise.all(promises);
        
        // 短暂延迟避免过于频繁的请求
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    clearInterval(memoryInterval);
    
    // 等待所有请求完成
    while (activeRequests > 0) {
        console.log(`Waiting for ${activeRequests} active requests to complete...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('---');
    console.log('Test completed!');
    logMemoryUsage(); // 最终内存状态
    
    console.log(`Total requests: ${requestCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Success rate: ${((requestCount - errorCount) / requestCount * 100).toFixed(2)}%`);
    
    // 强制垃圾回收
    if (global.gc) {
        console.log('Running garbage collection...');
        global.gc();
        setTimeout(() => {
            console.log('Memory after GC:');
            logMemoryUsage();
            process.exit(0);
        }, 2000);
    } else {
        console.log('Garbage collection not available. Run with --expose-gc flag for better memory analysis.');
        process.exit(0);
    }
}

// 处理程序退出
process.on('SIGINT', () => {
    console.log('\nTest interrupted by user');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// 启动测试
runConcurrentTest().catch(console.error);