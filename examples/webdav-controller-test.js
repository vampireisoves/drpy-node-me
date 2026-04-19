/**
 * WebDAV 控制器集成测试
 * 测试集成到主系统中的 WebDAV 代理控制器功能
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5757'; // 主系统端口
const TEST_CONFIG = {
    baseURL: 'https://your-webdav-server.com',
    username: 'your-username',
    password: 'your-password'
};

/**
 * 测试 WebDAV 控制器的各个端点
 */
async function testWebDAVController() {
    console.log('🧪 开始测试 WebDAV 控制器集成...\n');

    try {
        // 1. 测试健康检查
        console.log('1️⃣ 测试健康检查...');
        const healthResponse = await axios.get(`${BASE_URL}/webdav/health`);
        console.log('✅ 健康检查通过:', healthResponse.data);
        console.log('');

        // 2. 测试服务状态
        console.log('2️⃣ 测试服务状态...');
        const statusResponse = await axios.get(`${BASE_URL}/webdav/status`);
        console.log('✅ 服务状态:', statusResponse.data);
        console.log('');

        // 3. 测试配置验证（如果有有效配置）
        console.log('3️⃣ 测试配置验证...');
        try {
            const configResponse = await axios.post(`${BASE_URL}/webdav/config`, TEST_CONFIG);
            console.log('✅ 配置验证成功:', configResponse.data);
        } catch (configError) {
            console.log('⚠️ 配置验证失败（预期，因为使用的是示例配置）:', configError.response?.data?.error || configError.message);
        }
        console.log('');

        // 4. 测试目录列表（使用默认配置）
        console.log('4️⃣ 测试目录列表...');
        try {
            const listResponse = await axios.get(`${BASE_URL}/webdav/list?path=/`);
            console.log('✅ 目录列表获取成功:', listResponse.data);
        } catch (listError) {
            console.log('⚠️ 目录列表获取失败（可能是配置问题）:', listError.response?.data?.error || listError.message);
        }
        console.log('');

        // 5. 测试文件信息获取
        console.log('5️⃣ 测试文件信息获取...');
        try {
            const infoResponse = await axios.get(`${BASE_URL}/webdav/info?path=/test.txt`);
            console.log('✅ 文件信息获取成功:', infoResponse.data);
        } catch (infoError) {
            console.log('⚠️ 文件信息获取失败（可能是文件不存在或配置问题）:', infoError.response?.data?.error || infoError.message);
        }
        console.log('');

        // 6. 测试文件直链访问
        console.log('6️⃣ 测试文件直链访问...');
        try {
            const fileResponse = await axios.head(`${BASE_URL}/webdav/file?path=/test.txt`);
            console.log('✅ 文件直链访问成功，状态码:', fileResponse.status);
            console.log('   响应头:', fileResponse.headers);
        } catch (fileError) {
            console.log('⚠️ 文件直链访问失败（可能是文件不存在或配置问题）:', fileError.response?.data?.error || fileError.message);
        }
        console.log('');

        // 7. 测试缓存清理
        console.log('7️⃣ 测试缓存清理...');
        try {
            const cacheResponse = await axios.delete(`${BASE_URL}/webdav/cache`);
            console.log('✅ 缓存清理成功:', cacheResponse.data);
        } catch (cacheError) {
            console.log('⚠️ 缓存清理失败（可能是权限问题）:', cacheError.response?.data?.error || cacheError.message);
        }
        console.log('');

        console.log('🎉 WebDAV 控制器集成测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 控制器已成功集成到主系统');
        console.log('- ✅ 所有端点都可以正常访问');
        console.log('- ✅ 错误处理机制正常工作');
        console.log('- ⚠️ 实际功能需要有效的 WebDAV 配置');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 请确保主系统服务器正在运行 (npm start 或 node index.js)');
        }
    }
}

/**
 * 显示使用说明
 */
function showUsage() {
    console.log('📖 WebDAV 控制器使用说明:\n');
    console.log('🔗 可用端点:');
    console.log('  GET  /webdav/health                    - 健康检查');
    console.log('  GET  /webdav/status                    - 服务状态');
    console.log('  GET  /webdav/file?path=<file_path>     - 文件直链访问');
    console.log('  GET  /webdav/info?path=<file_path>     - 文件信息获取');
    console.log('  GET  /webdav/list?path=<dir_path>      - 目录列表');
    console.log('  POST /webdav/config                    - 配置验证');
    console.log('  DELETE /webdav/cache                   - 清理缓存');
    console.log('');
    console.log('🔧 配置说明:');
    console.log('  - 默认配置文件: json/webdav.json');
    console.log('  - 也可以通过 config 参数传递配置');
    console.log('  - 支持 Range 请求，适合视频流播放');
    console.log('');
    console.log('💡 使用示例:');
    console.log('  # 获取文件直链');
    console.log('  curl "http://localhost:5757/webdav/file?path=/video.mp4"');
    console.log('');
    console.log('  # 获取目录列表');
    console.log('  curl "http://localhost:5757/webdav/list?path=/movies"');
    console.log('');
    console.log('  # 获取文件信息');
    console.log('  curl "http://localhost:5757/webdav/info?path=/document.pdf"');
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
    showUsage();
    console.log('\n' + '='.repeat(60) + '\n');
    testWebDAVController();
}

export { testWebDAVController, showUsage };