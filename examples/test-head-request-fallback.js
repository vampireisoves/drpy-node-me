/**
 * 测试 HEAD 请求回退机制
 * 验证当远程服务器的 HEAD 请求失败时，代理能够正确回退到 GET 请求
 */

import http from 'http';

const PROXY_BASE_URL = 'http://localhost:3002';
const TEST_URL = 'https://vip.ffzy-play8.com/20250610/713568_ef2eb646/index.m3u8';
const AUTH_CODE = 'drpys';

/**
 * 发起 HTTP 请求
 * @param {string} url - 请求 URL
 * @param {string} method - 请求方法
 * @returns {Promise} 请求结果
 */
function makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 80,
            path: urlObj.pathname + urlObj.search,
            method: method,
            timeout: 10000
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    contentLength: data.length
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

/**
 * 测试 HEAD 请求回退机制
 */
async function testHeadRequestFallback() {
    console.log('🧪 Testing HEAD Request Fallback Mechanism\n');
    
    const proxyUrl = `${PROXY_BASE_URL}/m3u8-proxy/proxy?url=${TEST_URL}&auth=${AUTH_CODE}`;
    
    try {
        // 测试 HEAD 请求
        console.log('📋 Testing HEAD request...');
        const headResponse = await makeRequest(proxyUrl, 'HEAD');
        
        console.log(`✅ HEAD Request Status: ${headResponse.statusCode}`);
        console.log(`📏 Content Length: ${headResponse.contentLength} (should be 0 for HEAD)`);
        console.log(`📄 Content-Type: ${headResponse.headers['content-type']}`);
        console.log(`🔧 CORS Headers: ${headResponse.headers['access-control-allow-origin']}`);
        
        if (headResponse.statusCode === 200 && headResponse.contentLength === 0) {
            console.log('✅ HEAD request fallback mechanism working correctly!\n');
        } else {
            console.log('❌ HEAD request fallback mechanism has issues!\n');
        }
        
        // 测试 GET 请求作为对比
        console.log('📋 Testing GET request for comparison...');
        const getResponse = await makeRequest(proxyUrl, 'GET');
        
        console.log(`✅ GET Request Status: ${getResponse.statusCode}`);
        console.log(`📏 Content Length: ${getResponse.contentLength}`);
        console.log(`📄 Content-Type: ${getResponse.headers['content-type']}`);
        
        if (getResponse.statusCode === 200 && getResponse.contentLength > 0) {
            console.log('✅ GET request working correctly!');
            console.log(`📝 Content preview: ${getResponse.data.substring(0, 100)}...`);
        } else {
            console.log('❌ GET request has issues!');
        }
        
        // 验证 HEAD 和 GET 请求的头信息一致性
        console.log('\n🔍 Comparing HEAD and GET response headers...');
        const headContentType = headResponse.headers['content-type'];
        const getContentType = getResponse.headers['content-type'];
        
        if (headContentType === getContentType) {
            console.log('✅ Content-Type headers match between HEAD and GET requests');
        } else {
            console.log(`❌ Content-Type mismatch: HEAD=${headContentType}, GET=${getContentType}`);
        }
        
        console.log('\n🎉 HEAD Request Fallback Test Completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// 运行测试
testHeadRequestFallback();