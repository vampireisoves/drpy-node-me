/**
 * M3U8 代理请求头测试脚本
 * 测试 Windows 11 User-Agent 和自定义请求头的传递
 */

import fetch from 'node-fetch';

const PROXY_BASE = 'http://localhost:3002';
const AUTH_CODE = 'drpys';
const TEST_URL = 'https://vip.ffzy-play8.com/20250610/713568_ef2eb646/index.m3u8';

// Windows 11 Chrome User-Agent
const WIN11_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 构建代理 URL
 */
function buildProxyUrl(targetUrl, customHeaders = null) {
    const encodedUrl = encodeURIComponent(targetUrl);
    let proxyUrl = `${PROXY_BASE}/m3u8-proxy/proxy?url=${encodedUrl}&auth=${AUTH_CODE}`;
    
    if (customHeaders) {
        const encodedHeaders = encodeURIComponent(JSON.stringify(customHeaders));
        proxyUrl += `&headers=${encodedHeaders}`;
    }
    
    return proxyUrl;
}

/**
 * 测试默认 User-Agent（无自定义请求头）
 */
async function testDefaultUserAgent() {
    console.log('\n🎯 测试 1: 默认 User-Agent（无自定义请求头）');
    console.log('============================================================');
    
    const proxyUrl = buildProxyUrl(TEST_URL);
    console.log(`📡 代理 URL: ${proxyUrl}`);
    
    try {
        const response = await fetch(proxyUrl, { method: 'GET' });
        const content = await response.text();
        
        console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
        console.log(`📄 内容长度: ${content.length} 字符`);
        
        // 检查是否包含代理链接
        const hasProxyLinks = content.includes('/m3u8-proxy/proxy');
        console.log(`🔗 包含代理链接: ${hasProxyLinks ? '✅ 是' : '❌ 否'}`);
        
        // 检查嵌套链接是否包含 headers 参数
        const hasHeadersParam = content.includes('&headers=');
        console.log(`📋 嵌套链接包含 headers 参数: ${hasHeadersParam ? '✅ 是' : '❌ 否'}`);
        
        return response.status === 200;
    } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
        return false;
    }
}

/**
 * 测试自定义 Windows 11 User-Agent
 */
async function testCustomUserAgent() {
    console.log('\n🎯 测试 2: 自定义 Windows 11 User-Agent');
    console.log('============================================================');
    
    const customHeaders = {
        'User-Agent': WIN11_USER_AGENT,
        'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, application/octet-stream',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://example.com/'
    };
    
    const proxyUrl = buildProxyUrl(TEST_URL, customHeaders);
    console.log(`📡 代理 URL: ${proxyUrl}`);
    console.log(`🖥️  User-Agent: ${customHeaders['User-Agent']}`);
    
    try {
        const response = await fetch(proxyUrl, { method: 'GET' });
        const content = await response.text();
        
        console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
        console.log(`📄 内容长度: ${content.length} 字符`);
        
        // 检查是否包含代理链接
        const hasProxyLinks = content.includes('/m3u8-proxy/proxy');
        console.log(`🔗 包含代理链接: ${hasProxyLinks ? '✅ 是' : '❌ 否'}`);
        
        // 检查嵌套链接是否包含 headers 参数
        const hasHeadersParam = content.includes('&headers=');
        console.log(`📋 嵌套链接包含 headers 参数: ${hasHeadersParam ? '✅ 是' : '❌ 否'}`);
        
        // 显示处理后的内容
        console.log('\n📄 处理后的 M3U8 内容:');
        console.log('------------------------------------------------------------');
        console.log(content);
        console.log('------------------------------------------------------------');
        
        return response.status === 200 && hasHeadersParam;
    } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
        return false;
    }
}

/**
 * 测试 HEAD 请求与自定义请求头
 */
async function testHeadWithCustomHeaders() {
    console.log('\n🎯 测试 3: HEAD 请求与自定义请求头');
    console.log('============================================================');
    
    const customHeaders = {
        'User-Agent': WIN11_USER_AGENT,
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br'
    };
    
    const proxyUrl = buildProxyUrl(TEST_URL, customHeaders);
    console.log(`📡 代理 URL: ${proxyUrl}`);
    console.log(`🖥️  User-Agent: ${customHeaders['User-Agent']}`);
    
    try {
        const response = await fetch(proxyUrl, { method: 'HEAD' });
        
        console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
        console.log(`📏 Content-Length: ${response.headers.get('content-length') || '未设置'}`);
        console.log(`🔄 CORS 头: ${response.headers.get('access-control-allow-origin')}`);
        
        return response.status === 200;
    } catch (error) {
        console.error(`❌ HEAD 请求失败: ${error.message}`);
        return false;
    }
}

/**
 * 测试嵌套 M3U8 文件的请求头传递
 */
async function testNestedM3u8Headers() {
    console.log('\n🎯 测试 4: 嵌套 M3U8 文件的请求头传递');
    console.log('============================================================');
    
    const customHeaders = {
        'User-Agent': WIN11_USER_AGENT,
        'Accept': 'application/vnd.apple.mpegurl',
        'X-Custom-Header': 'test-value-123'
    };
    
    // 首先获取主 M3U8 文件
    const mainProxyUrl = buildProxyUrl(TEST_URL, customHeaders);
    console.log(`📡 主 M3U8 代理 URL: ${mainProxyUrl}`);
    
    try {
        const mainResponse = await fetch(mainProxyUrl, { method: 'GET' });
        const mainContent = await mainResponse.text();
        
        console.log(`✅ 主 M3U8 响应状态: ${mainResponse.status} ${mainResponse.statusText}`);
        
        // 提取第一个嵌套的代理链接
        const lines = mainContent.split('\n');
        let nestedProxyUrl = null;
        
        for (const line of lines) {
            if (line.trim().startsWith('http://localhost:3002/m3u8-proxy/proxy')) {
                nestedProxyUrl = line.trim();
                break;
            }
        }
        
        if (!nestedProxyUrl) {
            console.log('❌ 未找到嵌套的代理链接');
            return false;
        }
        
        console.log(`📡 嵌套代理 URL: ${nestedProxyUrl}`);
        
        // 检查嵌套链接是否包含 headers 参数
        const hasHeadersParam = nestedProxyUrl.includes('&headers=');
        console.log(`📋 嵌套链接包含 headers 参数: ${hasHeadersParam ? '✅ 是' : '❌ 否'}`);
        
        if (hasHeadersParam) {
            // 解码 headers 参数
            const urlObj = new URL(nestedProxyUrl);
            const headersParam = urlObj.searchParams.get('headers');
            if (headersParam) {
                try {
                    const decodedHeaders = JSON.parse(decodeURIComponent(headersParam));
                    console.log('📋 解码后的请求头:', JSON.stringify(decodedHeaders, null, 2));
                    
                    // 验证自定义请求头是否正确传递
                    const hasCustomHeader = decodedHeaders['X-Custom-Header'] === 'test-value-123';
                    const hasUserAgent = decodedHeaders['User-Agent'] === WIN11_USER_AGENT;
                    
                    console.log(`🔍 自定义请求头传递: ${hasCustomHeader ? '✅ 正确' : '❌ 错误'}`);
                    console.log(`🖥️  User-Agent 传递: ${hasUserAgent ? '✅ 正确' : '❌ 错误'}`);
                    
                    return hasCustomHeader && hasUserAgent;
                } catch (e) {
                    console.log('❌ 解码 headers 参数失败:', e.message);
                    return false;
                }
            }
        }
        
        return hasHeadersParam;
    } catch (error) {
        console.error(`❌ 嵌套测试失败: ${error.message}`);
        return false;
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('🚀 开始 M3U8 代理请求头测试');
    console.log(`🎬 测试 URL: ${TEST_URL}`);
    console.log(`🖥️  Windows 11 User-Agent: ${WIN11_USER_AGENT}`);
    
    const results = {
        defaultUserAgent: await testDefaultUserAgent(),
        customUserAgent: await testCustomUserAgent(),
        headWithHeaders: await testHeadWithCustomHeaders(),
        nestedHeaders: await testNestedM3u8Headers()
    };
    
    console.log('\n📊 测试结果总结');
    console.log('============================================================');
    console.log(`默认 User-Agent 测试:     ${results.defaultUserAgent ? '✅ 通过' : '❌ 失败'}`);
    console.log(`自定义 User-Agent 测试:   ${results.customUserAgent ? '✅ 通过' : '❌ 失败'}`);
    console.log(`HEAD 请求头测试:         ${results.headWithHeaders ? '✅ 通过' : '❌ 失败'}`);
    console.log(`嵌套请求头传递测试:       ${results.nestedHeaders ? '✅ 通过' : '❌ 失败'}`);
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\n🎯 总体结果: ${allPassed ? '🎉 全部通过' : '⚠️ 部分失败'}`);
    
    return allPassed;
}

runAllTests().catch(console.error);