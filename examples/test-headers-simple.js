import fetch from 'node-fetch';

async function testHeaders() {
    const url = 'http://localhost:3002/m3u8-proxy/proxy?url=https%3A%2F%2Fvip.ffzy-play8.com%2F20250610%2F713568_ef2eb646%2Findex.m3u8&auth=drpys&headers=%7B%22User-Agent%22%3A%22Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%22%7D';
    
    try {
        const response = await fetch(url);
        const content = await response.text();
        
        console.log('M3U8 Content:');
        console.log('============================================================');
        console.log(content);
        console.log('============================================================');
        
        // 检查是否包含 headers 参数
        const hasHeaders = content.includes('&headers=');
        console.log(`\n包含 headers 参数: ${hasHeaders ? '✅ 是' : '❌ 否'}`);
        
        if (hasHeaders) {
            console.log('✅ 嵌套链接成功包含自定义请求头参数！');
        } else {
            console.log('❌ 嵌套链接未包含自定义请求头参数');
        }
        
    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

testHeaders();