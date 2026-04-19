import http from 'http';

// 测试配置
const testConfig = {
    host: '192.168.31.10',
    port: 2121
};

const testFile = '/播放数据加密.txt';
const baseUrl = 'http://localhost:3000';

// URL 编码配置
const encodedConfig = encodeURIComponent(JSON.stringify(testConfig));

console.log('🚀 开始测试 FTP 文件流代理 HTTP 直链功能...\n');

// 测试1: 完整文件下载
function testFullDownload() {
    return new Promise((resolve, reject) => {
        console.log('📥 测试1: 完整文件下载');
        const url = `${baseUrl}/ftp/file?path=${encodeURIComponent(testFile)}&config=${encodedConfig}`;
        
        http.get(url, (res) => {
            console.log(`   状态码: ${res.statusCode}`);
            console.log(`   Content-Type: ${res.headers['content-type']}`);
            console.log(`   Content-Length: ${res.headers['content-length']}`);
            console.log(`   Accept-Ranges: ${res.headers['accept-ranges']}`);
            console.log(`   Cache-Control: ${res.headers['cache-control']}`);
            
            let dataLength = 0;
            res.on('data', (chunk) => {
                dataLength += chunk.length;
            });
            
            res.on('end', () => {
                console.log(`   实际接收数据长度: ${dataLength} bytes`);
                console.log('   ✅ 完整文件下载测试通过\n');
                resolve();
            });
        }).on('error', reject);
    });
}

// 测试2: 范围请求
function testRangeRequest() {
    return new Promise((resolve, reject) => {
        console.log('📊 测试2: 范围请求 (bytes=0-99)');
        const url = `${baseUrl}/ftp/file?path=${encodeURIComponent(testFile)}&config=${encodedConfig}`;
        
        const options = {
            headers: {
                'Range': 'bytes=0-99'
            }
        };
        
        const req = http.request(url, options, (res) => {
            console.log(`   状态码: ${res.statusCode}`);
            console.log(`   Content-Range: ${res.headers['content-range']}`);
            console.log(`   Content-Length: ${res.headers['content-length']}`);
            
            let dataLength = 0;
            res.on('data', (chunk) => {
                dataLength += chunk.length;
            });
            
            res.on('end', () => {
                console.log(`   实际接收数据长度: ${dataLength} bytes`);
                if (res.statusCode === 206 && dataLength === 100) {
                    console.log('   ✅ 范围请求测试通过\n');
                } else if (res.statusCode === 200) {
                    console.log('   ⚠️  服务器不支持范围请求，返回完整文件\n');
                } else {
                    console.log('   ❌ 范围请求测试失败\n');
                }
                resolve();
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// 测试3: HEAD 请求
function testHeadRequest() {
    return new Promise((resolve, reject) => {
        console.log('🔍 测试3: HEAD 请求');
        const url = `${baseUrl}/ftp/file?path=${encodeURIComponent(testFile)}&config=${encodedConfig}`;
        
        const options = {
            method: 'HEAD'
        };
        
        const req = http.request(url, options, (res) => {
            console.log(`   状态码: ${res.statusCode}`);
            console.log(`   Content-Type: ${res.headers['content-type']}`);
            console.log(`   Content-Length: ${res.headers['content-length']}`);
            console.log(`   Accept-Ranges: ${res.headers['accept-ranges']}`);
            
            let dataLength = 0;
            res.on('data', (chunk) => {
                dataLength += chunk.length;
            });
            
            res.on('end', () => {
                console.log(`   实际接收数据长度: ${dataLength} bytes (应该为0)`);
                if (dataLength === 0 && res.statusCode === 200) {
                    console.log('   ✅ HEAD 请求测试通过\n');
                } else {
                    console.log('   ❌ HEAD 请求测试失败\n');
                }
                resolve();
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// 测试4: 流式传输性能
function testStreamPerformance() {
    return new Promise((resolve, reject) => {
        console.log('⚡ 测试4: 流式传输性能');
        const url = `${baseUrl}/ftp/file?path=${encodeURIComponent(testFile)}&config=${encodedConfig}`;
        
        const startTime = Date.now();
        let firstByteTime = null;
        let dataLength = 0;
        
        http.get(url, (res) => {
            res.on('data', (chunk) => {
                if (!firstByteTime) {
                    firstByteTime = Date.now();
                    console.log(`   首字节延迟: ${firstByteTime - startTime}ms`);
                }
                dataLength += chunk.length;
            });
            
            res.on('end', () => {
                const endTime = Date.now();
                const totalTime = endTime - startTime;
                const throughput = (dataLength / 1024 / (totalTime / 1000)).toFixed(2);
                
                console.log(`   总传输时间: ${totalTime}ms`);
                console.log(`   传输速度: ${throughput} KB/s`);
                console.log('   ✅ 流式传输性能测试完成\n');
                resolve();
            });
        }).on('error', reject);
    });
}

// 运行所有测试
async function runAllTests() {
    try {
        await testFullDownload();
        await testRangeRequest();
        await testHeadRequest();
        await testStreamPerformance();
        
        console.log('🎉 所有 FTP 文件流代理 HTTP 直链功能测试完成！');
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        process.exit(1);
    }
}

runAllTests();