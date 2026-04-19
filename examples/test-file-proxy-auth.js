import http from 'http';

// 测试配置
const config = {
    proxyHost: 'localhost',
    proxyPort: 3001,
    authCode: 'drpys',
    wrongAuthCode: 'wrong_auth',
    testUrl: 'https://httpbin.org/json'
};

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

// 测试 1: 无身份验证参数
async function testNoAuth() {
    console.log('\n=== 测试 1: 无身份验证参数 ===');
    
    try {
        const options = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/proxy?url=${encodeURIComponent(config.testUrl)}`,
            method: 'GET'
        };
        
        console.log(`请求路径: ${options.path}`);
        const response = await makeRequest(options);
        
        console.log(`状态码: ${response.statusCode}`);
        console.log(`响应数据: ${response.data.substring(0, 200)}`);
        
        if (response.statusCode === 401) {
            console.log('✅ 无身份验证参数测试通过 - 正确返回 401');
        } else {
            console.log('❌ 无身份验证参数测试失败 - 应该返回 401');
        }
    } catch (error) {
        console.log(`❌ 无身份验证参数测试出错: ${error.message}`);
    }
}

// 测试 2: 错误的身份验证参数
async function testWrongAuth() {
    console.log('\n=== 测试 2: 错误的身份验证参数 ===');
    
    try {
        const options = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/proxy?url=${encodeURIComponent(config.testUrl)}&auth=${config.wrongAuthCode}`,
            method: 'GET'
        };
        
        console.log(`请求路径: ${options.path}`);
        const response = await makeRequest(options);
        
        console.log(`状态码: ${response.statusCode}`);
        console.log(`响应数据: ${response.data.substring(0, 200)}`);
        
        if (response.statusCode === 401) {
            console.log('✅ 错误身份验证参数测试通过 - 正确返回 401');
        } else {
            console.log('❌ 错误身份验证参数测试失败 - 应该返回 401');
        }
    } catch (error) {
        console.log(`❌ 错误身份验证参数测试出错: ${error.message}`);
    }
}

// 测试 3: 正确的身份验证参数
async function testCorrectAuth() {
    console.log('\n=== 测试 3: 正确的身份验证参数 ===');
    
    try {
        const options = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/proxy?url=${encodeURIComponent(config.testUrl)}&auth=${config.authCode}`,
            method: 'GET'
        };
        
        console.log(`请求路径: ${options.path}`);
        const response = await makeRequest(options);
        
        console.log(`状态码: ${response.statusCode}`);
        console.log(`响应数据: ${response.data.substring(0, 200)}...`);
        
        if (response.statusCode === 200) {
            console.log('✅ 正确身份验证参数测试通过 - 正确返回 200');
        } else {
            console.log('❌ 正确身份验证参数测试失败 - 应该返回 200');
        }
    } catch (error) {
        console.log(`❌ 正确身份验证参数测试出错: ${error.message}`);
    }
}

// 测试 4: info 接口身份验证
async function testInfoAuth() {
    console.log('\n=== 测试 4: info 接口身份验证 ===');
    
    try {
        // 无 auth 参数
        const optionsNoAuth = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/info?url=${encodeURIComponent(config.testUrl)}`,
            method: 'GET'
        };
        
        console.log(`无 auth 请求路径: ${optionsNoAuth.path}`);
        const responseNoAuth = await makeRequest(optionsNoAuth);
        console.log(`无 auth 状态码: ${responseNoAuth.statusCode}`);
        
        // 有 auth 参数
        const optionsWithAuth = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/info?url=${encodeURIComponent(config.testUrl)}&auth=${config.authCode}`,
            method: 'GET'
        };
        
        console.log(`有 auth 请求路径: ${optionsWithAuth.path}`);
        const responseWithAuth = await makeRequest(optionsWithAuth);
        console.log(`有 auth 状态码: ${responseWithAuth.statusCode}`);
        
        if (responseNoAuth.statusCode === 401 && responseWithAuth.statusCode === 200) {
            console.log('✅ info 接口身份验证测试通过');
        } else {
            console.log('❌ info 接口身份验证测试失败');
        }
    } catch (error) {
        console.log(`❌ info 接口身份验证测试出错: ${error.message}`);
    }
}

// 测试 5: cache 接口身份验证
async function testCacheAuth() {
    console.log('\n=== 测试 5: cache 接口身份验证 ===');
    
    try {
        // 无 auth 参数
        const optionsNoAuth = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/cache`,
            method: 'DELETE'
        };
        
        console.log(`无 auth 请求路径: ${optionsNoAuth.path}`);
        const responseNoAuth = await makeRequest(optionsNoAuth);
        console.log(`无 auth 状态码: ${responseNoAuth.statusCode}`);
        
        // 有 auth 参数
        const optionsWithAuth = {
            hostname: config.proxyHost,
            port: config.proxyPort,
            path: `/file-proxy/cache?auth=${config.authCode}`,
            method: 'DELETE'
        };
        
        console.log(`有 auth 请求路径: ${optionsWithAuth.path}`);
        const responseWithAuth = await makeRequest(optionsWithAuth);
        console.log(`有 auth 状态码: ${responseWithAuth.statusCode}`);
        
        if (responseNoAuth.statusCode === 401 && responseWithAuth.statusCode === 200) {
            console.log('✅ cache 接口身份验证测试通过');
        } else {
            console.log('❌ cache 接口身份验证测试失败');
        }
    } catch (error) {
        console.log(`❌ cache 接口身份验证测试出错: ${error.message}`);
    }
}

// 运行所有身份验证测试
async function runAuthTests() {
    console.log('开始运行文件代理身份验证测试...');
    
    await testNoAuth();
    await testWrongAuth();
    await testCorrectAuth();
    await testInfoAuth();
    await testCacheAuth();
    
    console.log('\n身份验证测试完成！');
}

runAuthTests().catch(console.error);

export {
    runAuthTests,
    testNoAuth,
    testWrongAuth,
    testCorrectAuth,
    testInfoAuth,
    testCacheAuth
};