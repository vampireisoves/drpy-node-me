import http from 'http';

// 测试配置
const config = {
    proxyHost: 'localhost',
    proxyPort: 3001,
    authCode: 'drpys', // 身份验证码
    testUrls: [
        'https://httpbin.org/json',
        'https://httpbin.org/headers',
        'https://httpbin.org/user-agent'
    ]
};

// Base64 编码函数
function base64Encode(str) {
    return Buffer.from(str, 'utf8').toString('base64');
}

// 发送 HTTP 请求的辅助函数
function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// 测试 1: 基本 URL 代理（不编码）
async function testBasicProxy() {
    console.log('\n=== 测试 1: 基本 URL 代理 ===');
    
    try {
        const testUrl = config.testUrls[0];
        const options = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/proxy?url=${encodeURIComponent(testUrl)}&auth=${config.authCode}`,
            method: 'GET'
        };
        
        console.log(`请求路径: ${options.path}`);
        const response = await makeRequest(options);
        
        console.log(`状态码: ${response.statusCode}`);
        console.log(`响应头: ${JSON.stringify(response.headers, null, 2)}`);
        console.log(`响应数据: ${response.data.substring(0, 200)}...`);
        
        if (response.statusCode === 200) {
            console.log('✅ 基本 URL 代理测试通过');
        } else {
            console.log('❌ 基本 URL 代理测试失败');
        }
    } catch (error) {
        console.log(`❌ 基本 URL 代理测试出错: ${error.message}`);
    }
}

// 测试 2: Base64 编码的 URL
async function testBase64UrlProxy() {
    console.log('\n=== 测试 2: Base64 编码的 URL ===');
    
    try {
        const testUrl = config.testUrls[1];
        const base64Url = base64Encode(testUrl);
        const encodedUrl = encodeURIComponent(base64Url);
        
        const options = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/proxy?url=${encodedUrl}&auth=${config.authCode}`,
            method: 'GET'
        };
        
        console.log(`原始 URL: ${testUrl}`);
        console.log(`Base64 编码: ${base64Url}`);
        console.log(`请求路径: ${options.path}`);
        
        const response = await makeRequest(options);
        
        console.log(`状态码: ${response.statusCode}`);
        console.log(`响应数据: ${response.data.substring(0, 200)}...`);
        
        if (response.statusCode === 200) {
            console.log('✅ Base64 URL 代理测试通过');
        } else {
            console.log('❌ Base64 URL 代理测试失败');
        }
    } catch (error) {
        console.log(`❌ Base64 URL 代理测试出错: ${error.message}`);
    }
}

// 测试 3: 自定义 headers（Base64 编码）
async function testCustomHeaders() {
    console.log('\n=== 测试 3: 自定义 headers ===');
    
    try {
        const testUrl = config.testUrls[2];
        const customHeaders = {
            'User-Agent': 'File-Proxy-Test/1.0',
            'X-Custom-Header': 'test-value'
        };
        
        const base64Headers = base64Encode(JSON.stringify(customHeaders));
        const encodedHeaders = encodeURIComponent(base64Headers);
        
        const options = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/proxy?url=${encodeURIComponent(testUrl)}&headers=${encodedHeaders}&auth=${config.authCode}`,
            method: 'GET'
        };
        
        console.log(`测试 URL: ${testUrl}`);
        console.log(`自定义 headers: ${JSON.stringify(customHeaders, null, 2)}`);
        console.log(`Base64 编码的 headers: ${base64Headers}`);
        
        const response = await makeRequest(options);
        
        console.log(`状态码: ${response.statusCode}`);
        console.log(`响应数据: ${response.data.substring(0, 500)}...`);
        
        if (response.statusCode === 200) {
            console.log('✅ 自定义 headers 测试通过');
        } else {
            console.log('❌ 自定义 headers 测试失败');
        }
    } catch (error) {
        console.log(`❌ 自定义 headers 测试出错: ${error.message}`);
    }
}

// 测试 4: HEAD 请求
async function testHeadRequest() {
    console.log('\n=== 测试 4: HEAD 请求 ===');
    
    try {
        const testUrl = config.testUrls[0];
        const options = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/proxy?url=${encodeURIComponent(testUrl)}&auth=${config.authCode}`,
            method: 'HEAD'
        };
        
        console.log(`请求路径: ${options.path}`);
        const response = await makeRequest(options);
        
        console.log(`状态码: ${response.statusCode}`);
        console.log(`响应头: ${JSON.stringify(response.headers, null, 2)}`);
        console.log(`响应体长度: ${response.data.length}`);
        
        if (response.statusCode === 200 && response.data.length === 0) {
            console.log('✅ HEAD 请求测试通过');
        } else {
            console.log('❌ HEAD 请求测试失败');
        }
    } catch (error) {
        console.log(`❌ HEAD 请求测试出错: ${error.message}`);
    }
}

// 测试 5: 健康检查
async function testHealthCheck() {
    console.log('\n=== 测试 5: 健康检查 ===');
    
    try {
        const options = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: '/file-proxy/health',
            method: 'GET'
        };
        
        const response = await makeRequest(options);
        
        console.log(`状态码: ${response.statusCode}`);
        console.log(`响应数据: ${response.data}`);
        
        if (response.statusCode === 200) {
            console.log('✅ 健康检查测试通过');
        } else {
            console.log('❌ 健康检查测试失败');
        }
    } catch (error) {
        console.log(`❌ 健康检查测试出错: ${error.message}`);
    }
}

// 测试 6: 状态信息
async function testStatus() {
    console.log('\n=== 测试 6: 状态信息 ===');
    
    try {
        const options = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: '/file-proxy/status',
            method: 'GET'
        };
        
        const response = await makeRequest(options);
        
        console.log(`状态码: ${response.statusCode}`);
        console.log(`响应数据: ${response.data}`);
        
        if (response.statusCode === 200) {
            console.log('✅ 状态信息测试通过');
        } else {
            console.log('❌ 状态信息测试失败');
        }
    } catch (error) {
        console.log(`❌ 状态信息测试出错: ${error.message}`);
    }
}

// 主测试函数
async function runAllTests() {
    console.log('🚀 开始 File Proxy 功能测试...');
    console.log(`代理服务器: http://${config.proxyHost}:${config.proxyPort}`);
    
    await testHealthCheck();
    await testStatus();
    await testBasicProxy();
    await testBase64UrlProxy();
    await testCustomHeaders();
    await testHeadRequest();
    
    console.log('\n🎉 所有测试完成！');
}

// 运行测试
runAllTests().catch(console.error);

export {
    runAllTests,
    testBasicProxy,
    testBase64UrlProxy,
    testCustomHeaders,
    testHeadRequest,
    testHealthCheck,
    testStatus
};