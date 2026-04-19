#!/usr/bin/env node

/**
 * 全面的统一代理测试脚本
 * 测试统一代理的所有功能，包括智能路由、错误处理、回退机制等
 */

import axios from 'axios';

// 测试配置
const config = {
    baseUrl: 'http://localhost:3001',
    authCode: 'drpys',
    timeout: 10000
};

// 测试用例
const testCases = [
    {
        name: '健康检查接口',
        url: '/unified-proxy/health',
        method: 'GET',
        expectStatus: 200,
        noAuth: true
    },
    {
        name: '状态接口',
        url: '/unified-proxy/status',
        method: 'GET',
        expectStatus: 200,
        noAuth: true
    },
    {
        name: 'M3U8文件智能路由',
        url: '/unified-proxy/proxy',
        method: 'GET',
        params: {
            url: 'https://example.com/playlist.m3u8',
            auth: config.authCode
        },
        expectStatus: [200, 404, 502] // 可能的状态码
    },
    {
        name: 'TS文件智能路由',
        url: '/unified-proxy/proxy',
        method: 'GET',
        params: {
            url: 'https://example.com/segment001.ts',
            auth: config.authCode
        },
        expectStatus: [200, 404, 502]
    },
    {
        name: '普通文件智能路由',
        url: '/unified-proxy/proxy',
        method: 'GET',
        params: {
            url: 'https://httpbin.org/json',
            auth: config.authCode
        },
        expectStatus: [200, 404, 502]
    },
    {
        name: '强制M3U8类型',
        url: '/unified-proxy/proxy',
        method: 'GET',
        params: {
            url: 'https://example.com/video.mp4',
            auth: config.authCode,
            type: 'm3u8'
        },
        expectStatus: [200, 404, 502]
    },
    {
        name: '强制文件类型',
        url: '/unified-proxy/proxy',
        method: 'GET',
        params: {
            url: 'https://example.com/playlist.m3u8',
            auth: config.authCode,
            type: 'file'
        },
        expectStatus: [200, 404, 502]
    },
    {
        name: '自定义请求头',
        url: '/unified-proxy/proxy',
        method: 'GET',
        params: {
            url: 'https://httpbin.org/headers',
            auth: config.authCode,
            headers: Buffer.from(JSON.stringify({
                'User-Agent': 'UnifiedProxy/1.0',
                'X-Custom-Header': 'test-value'
            })).toString('base64')
        },
        expectStatus: [200, 404, 502]
    },
    {
        name: '无效URL测试',
        url: '/unified-proxy/proxy',
        method: 'GET',
        params: {
            url: 'invalid-url',
            auth: config.authCode
        },
        expectStatus: 400
    },
    {
        name: '缺少认证测试',
        url: '/unified-proxy/proxy',
        method: 'GET',
        params: {
            url: 'https://example.com/test.m3u8'
        },
        expectStatus: 401
    },
    {
        name: '错误认证测试',
        url: '/unified-proxy/proxy',
        method: 'GET',
        params: {
            url: 'https://example.com/test.m3u8',
            auth: 'wrong-auth'
        },
        expectStatus: 401
    },
    {
        name: '内网地址阻止测试',
        url: '/unified-proxy/proxy',
        method: 'GET',
        params: {
            url: 'http://192.168.1.1/test.m3u8',
            auth: config.authCode
        },
        expectStatus: 400
    },
    {
        name: 'HEAD请求测试',
        url: '/unified-proxy/proxy',
        method: 'HEAD',
        params: {
            url: 'https://httpbin.org/json',
            auth: config.authCode
        },
        expectStatus: [200, 404, 502]
    }
];

// 颜色输出函数
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// 执行单个测试用例
async function runTestCase(testCase) {
    const { name, url, method, params, expectStatus, noAuth } = testCase;
    
    try {
        console.log(`\n${colors.cyan('📋')} 测试: ${colors.bold(name)}`);
        
        // 构建请求URL
        let requestUrl = `${config.baseUrl}${url}`;
        if (params) {
            const searchParams = new URLSearchParams(params);
            requestUrl += `?${searchParams.toString()}`;
        }
        
        console.log(`   ${colors.blue('🔗')} URL: ${requestUrl}`);
        console.log(`   ${colors.blue('📤')} 方法: ${method}`);
        
        // 发送请求
        const startTime = Date.now();
        const response = await axios({
            method: method.toLowerCase(),
            url: requestUrl,
            timeout: config.timeout,
            validateStatus: () => true // 不抛出状态码错误
        });
        const duration = Date.now() - startTime;
        
        console.log(`   ${colors.blue('📊')} 状态码: ${response.status}`);
        console.log(`   ${colors.blue('⏱️')} 响应时间: ${duration}ms`);
        
        // 检查期望状态码
        const expectedStatuses = Array.isArray(expectStatus) ? expectStatus : [expectStatus];
        const isStatusValid = expectedStatuses.includes(response.status);
        
        if (isStatusValid) {
            console.log(`   ${colors.green('✅')} 测试通过`);
            
            // 如果是状态接口，显示部分响应内容
            if (url.includes('/status') && response.data) {
                console.log(`   ${colors.blue('📄')} 服务信息: ${response.data.service || 'N/A'}`);
                console.log(`   ${colors.blue('🔧')} 版本: ${response.data.version || 'N/A'}`);
                console.log(`   ${colors.blue('🎯')} 支持类型: ${response.data.detection?.supportedTypes?.join(', ') || 'N/A'}`);
            }
            
            return { success: true, status: response.status, duration };
        } else {
            console.log(`   ${colors.red('❌')} 测试失败 - 期望状态码: ${expectedStatuses.join(' 或 ')}, 实际: ${response.status}`);
            return { success: false, status: response.status, duration, expected: expectedStatuses };
        }
        
    } catch (error) {
        console.log(`   ${colors.red('❌')} 测试异常: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// 检查服务器状态
async function checkServerStatus() {
    try {
        console.log(`${colors.cyan('🔍')} 检查服务器状态...`);
        const response = await axios.get(`${config.baseUrl}/unified-proxy/health`, {
            timeout: 5000
        });
        
        if (response.status === 200) {
            console.log(`${colors.green('✅')} 服务器运行正常`);
            return true;
        } else {
            console.log(`${colors.red('❌')} 服务器状态异常: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`${colors.red('❌')} 无法连接到服务器: ${error.message}`);
        console.log(`${colors.yellow('💡')} 请确保服务器在 ${config.baseUrl} 运行`);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log(`${colors.bold(colors.blue('🚀 统一代理全面测试'))}\n`);
    console.log(`${colors.cyan('📍')} 测试服务器: ${config.baseUrl}`);
    console.log(`${colors.cyan('🔑')} 认证码: ${config.authCode}`);
    console.log(`${colors.cyan('⏱️')} 超时时间: ${config.timeout}ms`);
    
    // 检查服务器状态
    const serverOk = await checkServerStatus();
    if (!serverOk) {
        console.log(`\n${colors.red('❌')} 测试终止：服务器不可用`);
        process.exit(1);
    }
    
    // 运行所有测试用例
    console.log(`\n${colors.bold(colors.cyan('📋 开始执行测试用例'))}`);
    
    const results = [];
    let passCount = 0;
    let failCount = 0;
    
    for (const testCase of testCases) {
        const result = await runTestCase(testCase);
        results.push({ name: testCase.name, ...result });
        
        if (result.success) {
            passCount++;
        } else {
            failCount++;
        }
        
        // 测试间隔
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 输出测试总结
    console.log(`\n${colors.bold(colors.cyan('📊 测试总结'))}`);
    console.log(`${colors.green('✅')} 通过: ${passCount}`);
    console.log(`${colors.red('❌')} 失败: ${failCount}`);
    console.log(`${colors.blue('📈')} 总计: ${passCount + failCount}`);
    console.log(`${colors.blue('📊')} 成功率: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
    
    // 显示失败的测试
    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
        console.log(`\n${colors.bold(colors.red('❌ 失败的测试:'))}`);
        failedTests.forEach(test => {
            console.log(`   • ${test.name}: ${test.error || `状态码 ${test.status} (期望 ${test.expected?.join(' 或 ')})`}`);
        });
    }
    
    // 性能统计
    const successfulTests = results.filter(r => r.success && r.duration);
    if (successfulTests.length > 0) {
        const avgDuration = successfulTests.reduce((sum, test) => sum + test.duration, 0) / successfulTests.length;
        const maxDuration = Math.max(...successfulTests.map(test => test.duration));
        const minDuration = Math.min(...successfulTests.map(test => test.duration));
        
        console.log(`\n${colors.bold(colors.blue('⏱️ 性能统计:'))}`);
        console.log(`   平均响应时间: ${avgDuration.toFixed(1)}ms`);
        console.log(`   最快响应时间: ${minDuration}ms`);
        console.log(`   最慢响应时间: ${maxDuration}ms`);
    }
    
    console.log(`\n${colors.bold(colors.cyan('🎉 测试完成！'))}`);
    
    // 如果有失败的测试，退出码为1
    if (failCount > 0) {
        process.exit(1);
    }
}

// 运行测试
runTests().catch(error => {
    console.error(`${colors.red('❌')} 测试运行失败:`, error);
    process.exit(1);
});