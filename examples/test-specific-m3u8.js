/**
 * 测试指定的 M3U8 URL
 * 验证 HEAD 和 GET 请求功能
 */

import fetch from 'node-fetch';

const PROXY_BASE = 'http://localhost:3002';
const AUTH_CODE = 'drpys';
const TEST_URL = 'https://vip.ffzy-play8.com/20250610/713568_ef2eb646/index.m3u8';

/**
 * 构建代理 URL
 */
function buildProxyUrl(targetUrl) {
    const encodedUrl = encodeURIComponent(targetUrl);
    return `${PROXY_BASE}/m3u8-proxy/proxy?url=${encodedUrl}&auth=${AUTH_CODE}`;
}

/**
 * 测试 HEAD 请求
 */
async function testHeadRequest() {
    console.log('\n🎯 测试 HEAD 请求');
    console.log('============================================================');
    
    const proxyUrl = buildProxyUrl(TEST_URL);
    console.log(`📡 代理 URL: ${proxyUrl}`);
    
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
 * 测试 GET 请求
 */
async function testGetRequest() {
    console.log('\n🎯 测试 GET 请求');
    console.log('============================================================');
    
    const proxyUrl = buildProxyUrl(TEST_URL);
    console.log(`📡 代理 URL: ${proxyUrl}`);
    
    try {
        const response = await fetch(proxyUrl);
        const content = await response.text();
        
        console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
        console.log(`📄 内容长度: ${content.length} 字符`);
        
        // 验证 M3U8 格式
        const isValidM3u8 = content.includes('#EXTM3U') || content.includes('#EXT-X-');
        console.log(`📝 M3U8 格式验证: ${isValidM3u8 ? '✅ 有效' : '❌ 无效'}`);
        
        // 验证链接转换
        const hasProxyLinks = content.includes('/m3u8-proxy/proxy');
        console.log(`🔗 链接转换验证: ${hasProxyLinks ? '✅ 已转换' : '❌ 未转换'}`);
        
        // 显示内容
        console.log('\n📄 M3U8 内容:');
        console.log('------------------------------------------------------------');
        console.log(content);
        console.log('------------------------------------------------------------');
        
        return response.status === 200 && isValidM3u8;
    } catch (error) {
        console.error(`❌ GET 请求失败: ${error.message}`);
        return false;
    }
}

/**
 * 运行测试
 */
async function runTest() {
    console.log('🚀 开始测试指定的 M3U8 URL');
    console.log(`🎬 测试 URL: ${TEST_URL}`);
    
    const headResult = await testHeadRequest();
    const getResult = await testGetRequest();
    
    console.log('\n📊 测试结果总结');
    console.log('============================================================');
    console.log(`HEAD 请求: ${headResult ? '✅ 成功' : '❌ 失败'}`);
    console.log(`GET 请求:  ${getResult ? '✅ 成功' : '❌ 失败'}`);
    console.log(`总体结果:  ${headResult && getResult ? '🎉 全部通过' : '⚠️ 部分失败'}`);
}

runTest().catch(console.error);