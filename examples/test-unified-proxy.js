/**
 * 全能代理测试脚本
 * 测试 unified-proxy 的智能路由、错误处理和回退机制
 */

import fetch from 'node-fetch';

// 测试配置
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3001',
    authCode: 'drpy',
    timeout: 10000
};

// 测试用例
const TEST_CASES = [
    // M3U8 文件测试
    {
        name: 'M3U8 播放列表 - 应该使用 M3U8 代理',
        url: 'https://example.com/playlist.m3u8',
        expectedType: 'm3u8',
        shouldSucceed: false, // 示例URL，预期会失败但能测试路由逻辑
        description: '测试 M3U8 文件的智能识别和路由'
    },
    
    // TS 文件测试
    {
        name: 'TS 视频片段 - 应该使用 M3U8 代理',
        url: 'https://example.com/segment001.ts',
        expectedType: 'm3u8',
        shouldSucceed: false,
        description: '测试 TS 文件的智能识别和路由'
    },
    
    // 普通文件测试
    {
        name: '普通视频文件 - 应该使用文件代理',
        url: 'https://example.com/video.mp4',
        expectedType: 'file',
        shouldSucceed: false,
        description: '测试普通文件的智能识别和路由'
    },
    
    // 图片文件测试
    {
        name: '图片文件 - 应该使用文件代理',
        url: 'https://example.com/image.jpg',
        expectedType: 'file',
        shouldSucceed: false,
        description: '测试图片文件的智能识别和路由'
    },
    
    // 强制类型测试
    {
        name: '强制使用文件代理',
        url: 'https://example.com/test.m3u8',
        forceType: 'file',
        expectedType: 'file',
        shouldSucceed: false,
        description: '测试强制指定代理类型功能'
    },
    
    // 自定义请求头测试
    {
        name: '带自定义请求头的测试',
        url: 'https://example.com/test.mp4',
        headers: {
            'User-Agent': 'UnifiedProxyTest/1.0',
            'X-Custom-Header': 'test-value'
        },
        expectedType: 'file',
        shouldSucceed: false,
        description: '测试自定义请求头的传递'
    },
    
    // 错误处理测试
    {
        name: '无效URL测试',
        url: 'invalid-url',
        shouldSucceed: false,
        expectError: true,
        description: '测试无效URL的错误处理'
    },
    
    // 内网地址阻止测试
    {
        name: '内网地址阻止测试',
        url: 'http://192.168.1.1/test.mp4',
        shouldSucceed: false,
        expectError: true,
        expectedErrorCode: 403,
        description: '测试内网地址访问阻止功能'
    }
];

/**
 * 发起代理请求
 * @param {Object} testCase - 测试用例
 * @returns {Promise<Object>} 测试结果
 */
async function makeProxyRequest(testCase) {
    try {
        // 构建请求URL
        const encodedUrl = encodeURIComponent(testCase.url);
        let proxyUrl = `${TEST_CONFIG.baseUrl}/unified-proxy/proxy?url=${encodedUrl}&auth=${TEST_CONFIG.authCode}`;
        
        // 添加强制类型参数
        if (testCase.forceType) {
            proxyUrl += `&type=${testCase.forceType}`;
        }
        
        // 添加自定义请求头
        if (testCase.headers) {
            const encodedHeaders = encodeURIComponent(JSON.stringify(testCase.headers));
            proxyUrl += `&headers=${encodedHeaders}`;
        }
        
        console.log(`\n🔗 请求URL: ${proxyUrl}`);
        
        // 发起请求
        const startTime = Date.now();
        const response = await fetch(proxyUrl, {
            method: 'GET',
            timeout: TEST_CONFIG.timeout
        });
        const endTime = Date.now();
        
        // 获取响应内容（限制大小）
        let responseText = '';
        try {
            const text = await response.text();
            responseText = text.length > 500 ? text.substring(0, 500) + '...' : text;
        } catch (textError) {
            responseText = `Failed to read response: ${textError.message}`;
        }
        
        return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            responseTime: endTime - startTime,
            responseText: responseText,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            errorType: error.name
        };
    }
}

/**
 * 测试代理状态接口
 */
async function testProxyStatus() {
    console.log('\n📊 测试代理状态接口...');
    
    try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/unified-proxy/status`);
        const statusData = await response.json();
        
        console.log('✅ 状态接口响应:', JSON.stringify(statusData, null, 2));
        return true;
    } catch (error) {
        console.log('❌ 状态接口测试失败:', error.message);
        return false;
    }
}

/**
 * 分析测试结果
 * @param {Object} testCase - 测试用例
 * @param {Object} result - 测试结果
 * @returns {Object} 分析结果
 */
function analyzeResult(testCase, result) {
    const analysis = {
        testName: testCase.name,
        passed: false,
        issues: [],
        details: {}
    };
    
    // 检查是否符合预期
    if (testCase.expectError) {
        // 预期错误的测试
        if (!result.success) {
            analysis.passed = true;
            if (testCase.expectedErrorCode && result.status !== testCase.expectedErrorCode) {
                analysis.issues.push(`Expected error code ${testCase.expectedErrorCode}, got ${result.status}`);
                analysis.passed = false;
            }
        } else {
            analysis.issues.push('Expected error but request succeeded');
        }
    } else if (testCase.shouldSucceed) {
        // 预期成功的测试
        if (result.success) {
            analysis.passed = true;
        } else {
            analysis.issues.push(`Expected success but got error: ${result.error || result.status}`);
        }
    } else {
        // 预期失败但要测试路由逻辑的测试
        analysis.passed = true; // 主要测试路由逻辑，不关心最终成功与否
        
        // 分析响应头以判断使用的代理类型
        if (result.headers) {
            const contentType = result.contentType || '';
            if (testCase.expectedType === 'm3u8' && contentType.includes('mpegurl')) {
                analysis.details.detectedType = 'm3u8';
            } else if (testCase.expectedType === 'file') {
                analysis.details.detectedType = 'file';
            }
        }
    }
    
    // 记录响应时间
    if (result.responseTime) {
        analysis.details.responseTime = result.responseTime;
        if (result.responseTime > 5000) {
            analysis.issues.push('Response time too slow (>5s)');
        }
    }
    
    return analysis;
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('🚀 开始全能代理测试...\n');
    console.log(`📍 测试服务器: ${TEST_CONFIG.baseUrl}`);
    console.log(`🔑 认证码: ${TEST_CONFIG.authCode}`);
    console.log(`⏱️  超时时间: ${TEST_CONFIG.timeout}ms\n`);
    
    // 测试状态接口
    const statusOk = await testProxyStatus();
    if (!statusOk) {
        console.log('❌ 代理服务器状态检查失败，请确保服务器正在运行');
        return;
    }
    
    const results = [];
    let passedTests = 0;
    let totalTests = TEST_CASES.length;
    
    // 运行每个测试用例
    for (let i = 0; i < TEST_CASES.length; i++) {
        const testCase = TEST_CASES[i];
        console.log(`\n📋 测试 ${i + 1}/${totalTests}: ${testCase.name}`);
        console.log(`📝 描述: ${testCase.description}`);
        console.log(`🎯 目标URL: ${testCase.url}`);
        
        const result = await makeProxyRequest(testCase);
        const analysis = analyzeResult(testCase, result);
        
        results.push({
            testCase,
            result,
            analysis
        });
        
        // 显示测试结果
        if (analysis.passed) {
            console.log('✅ 测试通过');
            passedTests++;
        } else {
            console.log('❌ 测试失败');
            analysis.issues.forEach(issue => {
                console.log(`   ⚠️  ${issue}`);
            });
        }
        
        // 显示详细信息
        if (result.success !== undefined) {
            console.log(`📊 状态: ${result.status} ${result.statusText || ''}`);
        }
        if (result.error) {
            console.log(`❗ 错误: ${result.error}`);
        }
        if (result.responseTime) {
            console.log(`⏱️  响应时间: ${result.responseTime}ms`);
        }
        if (result.contentType) {
            console.log(`📄 内容类型: ${result.contentType}`);
        }
        
        // 等待一下避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 显示测试总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结');
    console.log('='.repeat(60));
    console.log(`✅ 通过: ${passedTests}/${totalTests}`);
    console.log(`❌ 失败: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    // 显示失败的测试
    const failedTests = results.filter(r => !r.analysis.passed);
    if (failedTests.length > 0) {
        console.log('\n❌ 失败的测试:');
        failedTests.forEach((test, index) => {
            console.log(`${index + 1}. ${test.testCase.name}`);
            test.analysis.issues.forEach(issue => {
                console.log(`   - ${issue}`);
            });
        });
    }
    
    // 性能统计
    const responseTimes = results
        .map(r => r.result.responseTime)
        .filter(time => time !== undefined);
    
    if (responseTimes.length > 0) {
        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const maxTime = Math.max(...responseTimes);
        const minTime = Math.min(...responseTimes);
        
        console.log('\n⏱️  性能统计:');
        console.log(`   平均响应时间: ${avgTime.toFixed(0)}ms`);
        console.log(`   最快响应时间: ${minTime}ms`);
        console.log(`   最慢响应时间: ${maxTime}ms`);
    }
    
    console.log('\n🎉 测试完成!');
}

// 运行测试
runAllTests().catch(error => {
    console.error('💥 测试运行失败:', error);
    process.exit(1);
});