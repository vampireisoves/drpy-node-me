import fetch from 'node-fetch';

const TEST_URL = 'https://vip.ffzy-play8.com/20250610/713568_ef2eb646/index.m3u8';
const WIN11_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function buildProxyUrl(targetUrl, headers = null) {
    const encodedUrl = encodeURIComponent(targetUrl);
    let proxyUrl = `http://localhost:3002/m3u8-proxy/proxy?url=${encodedUrl}&auth=drpys`;
    
    if (headers) {
        const headersParam = encodeURIComponent(JSON.stringify(headers));
        proxyUrl += `&headers=${headersParam}`;
    }
    
    return proxyUrl;
}

async function testNestedHeaders() {
    console.log('🎯 测试嵌套 M3U8 文件的请求头传递');
    console.log('============================================================');
    
    const customHeaders = {
        'User-Agent': WIN11_USER_AGENT,
        'Accept': 'application/vnd.apple.mpegurl',
        'X-Custom-Header': 'test-value-123'
    };
    
    const mainProxyUrl = buildProxyUrl(TEST_URL, customHeaders);
    console.log(`📡 主 M3U8 代理 URL: ${mainProxyUrl}`);
    
    try {
        const response = await fetch(mainProxyUrl);
        const content = await response.text();
        
        console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
        console.log('\n📄 完整的 M3U8 内容:');
        console.log('============================================================');
        console.log(content);
        console.log('============================================================');
        
        // 分析每一行
        const lines = content.split('\n');
        console.log('\n🔍 逐行分析:');
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('http://localhost:3002/m3u8-proxy/proxy')) {
                console.log(`第 ${index + 1} 行 (代理链接):`);
                console.log(`  完整 URL: ${trimmedLine}`);
                console.log(`  包含 headers: ${trimmedLine.includes('&headers=') ? '✅ 是' : '❌ 否'}`);
                
                if (trimmedLine.includes('&headers=')) {
                    // 提取并解码 headers 参数
                    try {
                        const url = new URL(trimmedLine);
                        const headersParam = url.searchParams.get('headers');
                        if (headersParam) {
                            const decodedHeaders = JSON.parse(decodeURIComponent(headersParam));
                            console.log(`  解码后的请求头:`, JSON.stringify(decodedHeaders, null, 4));
                        }
                    } catch (e) {
                        console.log(`  解码失败: ${e.message}`);
                    }
                }
            } else if (trimmedLine.startsWith('#')) {
                console.log(`第 ${index + 1} 行 (注释): ${trimmedLine}`);
            } else if (trimmedLine === '') {
                console.log(`第 ${index + 1} 行 (空行)`);
            } else {
                console.log(`第 ${index + 1} 行 (其他): ${trimmedLine}`);
            }
        });
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testNestedHeaders();