/**
 * 统一 M3U8 代理接口 - 最终功能验证测试
 * 验证所有功能：M3U8、TS、HEAD 请求、文件类型检测等
 */

import fetch from 'node-fetch';

const PROXY_BASE = 'http://localhost:3002';
const AUTH_CODE = 'drpys';

// 测试用的 URL
const TEST_URLS = {
    m3u8: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    json: 'https://httpbin.org/json',
    text: 'https://httpbin.org/robots.txt'
};

/**
 * 构建代理 URL
 */
function buildProxyUrl(targetUrl) {
    const encodedUrl = encodeURIComponent(targetUrl);
    return `${PROXY_BASE}/m3u8-proxy/proxy?url=${encodedUrl}&auth=${AUTH_CODE}`;
}

/**
 * 测试 M3U8 文件代理
 */
async function testM3u8Proxy() {
    console.log('\n🎯 测试 M3U8 文件代理');
    console.log('============================================================');
    
    const proxyUrl = buildProxyUrl(TEST_URLS.m3u8);
    console.log(`📡 代理 URL: ${proxyUrl}`);
    
    try {
        const response = await fetch(proxyUrl);
        const content = await response.text();
        
        console.log(`✅ 响应状态: ${response.status}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
        console.log(`📄 内容长度: ${content.length} 字符`);
        
        // 验证 M3U8 格式
        const isValidM3u8 = content.includes('#EXTM3U') || content.includes('#EXT-X-');
        console.log(`📝 M3U8 格式验证: ${isValidM3u8 ? '✅ 有效' : '❌ 无效'}`);
        
        // 验证链接转换
        const hasProxyLinks = content.includes('/m3u8-proxy/proxy');
        console.log(`🔗 链接转换验证: ${hasProxyLinks ? '✅ 已转换' : '❌ 未转换'}`);
        
        // 显示前几行内容
        const lines = content.split('\n').slice(0, 5);
        console.log('📄 内容预览:');
        lines.forEach((line, index) => {
            if (line.trim()) {
                console.log(`   ${index + 1}. ${line.trim()}`);
            }
        });
        
        return response.status === 200 && isValidM3u8 && hasProxyLinks;
        
    } catch (error) {
        console.log(`❌ 测试失败: ${error.message}`);
        return false;
    }
}

/**
 * 测试 HEAD 请求
 */
async function testHeadRequest() {
    console.log('\n🎯 测试 HEAD 请求');
    console.log('============================================================');
    
    const proxyUrl = buildProxyUrl(TEST_URLS.m3u8);
    console.log(`📡 HEAD 请求: ${proxyUrl}`);
    
    try {
        const response = await fetch(proxyUrl, { method: 'HEAD' });
        
        console.log(`✅ 响应状态: ${response.status}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
        console.log(`📏 Content-Length: ${response.headers.get('content-length')}`);
        
        return response.status === 200;
        
    } catch (error) {
        console.log(`❌ 测试失败: ${error.message}`);
        return false;
    }
}

/**
 * 测试文件类型检测
 */
async function testFileTypeDetection() {
    console.log('\n🎯 测试文件类型检测');
    console.log('============================================================');
    
    const tests = [
        { name: 'M3U8 文件', url: TEST_URLS.m3u8, expectedType: 'application/vnd.apple.mpegurl' },
        { name: 'JSON 文件', url: TEST_URLS.json, expectedType: 'application/json' },
        { name: 'Text 文件', url: TEST_URLS.text, expectedType: 'text/plain' }
    ];
    
    let allPassed = true;
    
    for (const test of tests) {
        console.log(`\n📝 测试 ${test.name}: ${test.url}`);
        
        try {
            const proxyUrl = buildProxyUrl(test.url);
            const response = await fetch(proxyUrl);
            const contentType = response.headers.get('content-type');
            
            console.log(`   ✅ 响应状态: ${response.status}`);
            console.log(`   📋 Content-Type: ${contentType}`);
            
            const typeMatches = contentType && contentType.includes(test.expectedType.split('/')[0]);
            console.log(`   ${typeMatches ? '✅' : '❌'} ${test.name} 代理成功`);
            
            if (!typeMatches) allPassed = false;
            
        } catch (error) {
            console.log(`   ❌ 测试失败: ${error.message}`);
            allPassed = false;
        }
    }
    
    return allPassed;
}

/**
 * 测试服务器状态
 */
async function testServerStatus() {
    console.log('\n🎯 测试服务器状态');
    console.log('============================================================');
    
    try {
        const response = await fetch(`${PROXY_BASE}/m3u8-proxy/status`);
        const status = await response.json();
        
        console.log(`✅ 服务器状态: ${response.status}`);
        console.log(`📊 可用接口数量: ${status.endpoints?.length || 0}`);
        
        // 检查统一接口是否存在
        const hasUnifiedProxy = status.endpoints?.some(ep => 
            ep.includes('/m3u8-proxy/proxy')
        );
        
        console.log(`🔧 统一代理接口: ${hasUnifiedProxy ? '✅ 已注册' : '❌ 未找到'}`);
        
        return response.status === 200 && hasUnifiedProxy;
        
    } catch (error) {
        console.log(`❌ 测试失败: ${error.message}`);
        return false;
    }
}

/**
 * 运行完整验证测试
 */
async function runFinalVerification() {
    console.log('🎬 统一 M3U8 代理接口 - 最终功能验证');
    console.log('============================================================');
    console.log(`🏠 代理服务器: ${PROXY_BASE}`);
    console.log(`🔐 认证代码: ${AUTH_CODE}`);
    
    const results = {
        serverStatus: await testServerStatus(),
        m3u8Proxy: await testM3u8Proxy(),
        headRequest: await testHeadRequest(),
        fileTypeDetection: await testFileTypeDetection()
    };
    
    console.log('\n📊 最终验证结果总结');
    console.log('============================================================');
    console.log(`${results.serverStatus ? '✅' : '❌'} 服务器状态检查: ${results.serverStatus ? '通过' : '失败'}`);
    console.log(`${results.m3u8Proxy ? '✅' : '❌'} M3U8 文件代理: ${results.m3u8Proxy ? '通过' : '失败'}`);
    console.log(`${results.headRequest ? '✅' : '❌'} HEAD 请求支持: ${results.headRequest ? '通过' : '失败'}`);
    console.log(`${results.fileTypeDetection ? '✅' : '❌'} 文件类型检测: ${results.fileTypeDetection ? '通过' : '失败'}`);
    
    const allPassed = Object.values(results).every(result => result);
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('🎉 统一 M3U8 代理接口最终验证全部通过！');
        console.log('🚀 所有功能正常工作，可以投入使用');
    } else {
        console.log('⚠️  部分功能验证未通过，需要进一步检查');
    }
    console.log('='.repeat(60));
    
    return allPassed;
}

// 运行测试
runFinalVerification().catch(console.error);