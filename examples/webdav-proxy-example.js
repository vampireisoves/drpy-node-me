/**
 * WebDAV 代理服务器使用示例
 */

import { WebDAVProxy } from './webdav-proxy.js';

async function main() {
    // 创建代理服务器实例
    const proxy = new WebDAVProxy({
        port: 3000,
        host: 'localhost',
        cacheTimeout: 5 * 60 * 1000 // 5分钟缓存
    });

    try {
        // 启动服务器
        await proxy.start();
        
        console.log('\n=== WebDAV 代理服务器已启动 ===');
        console.log('现在你可以通过以下方式访问 WebDAV 文件：');
        console.log('');
        
        // 示例：获取文件直链
        console.log('1. 获取文件直链：');
        console.log('   GET http://localhost:3000/file?path=/root/webdav-example.js');
        console.log('   - 支持 Range 请求，适合视频流媒体播放');
        console.log('   - 自动设置正确的 Content-Type');
        console.log('   - 包含缓存控制头');
        console.log('');
        
        // 示例：获取文件信息
        console.log('2. 获取文件信息：');
        console.log('   GET http://localhost:3000/info?path=/root/webdav-example.js');
        console.log('   返回：文件大小、修改时间、内容类型等');
        console.log('');
        
        // 示例：列出目录内容
        console.log('3. 列出目录内容：');
        console.log('   GET http://localhost:3000/list?path=/root');
        console.log('   返回：目录下所有文件和子目录');
        console.log('');
        
        // 示例：配置 WebDAV 连接
        console.log('4. 配置 WebDAV 连接：');
        console.log('   POST http://localhost:3000/config');
        console.log('   Body: {');
        console.log('     "baseURL": "https://your-webdav-server.com",');
        console.log('     "username": "your-username",');
        console.log('     "password": "your-password"');
        console.log('   }');
        console.log('');
        
        console.log('注意：');
        console.log('- 如果没有通过 /config 配置，服务器会尝试从 json/webdav.json 读取默认配置');
        console.log('- 所有文件访问都会自动缓存 5 分钟以提高性能');
        console.log('- 支持 CORS，可以从浏览器直接访问');
        console.log('- 使用 Fastify 框架，性能更优');
        console.log('');
        
        // 等待用户中断
        console.log('按 Ctrl+C 停止服务器...');
        
        // 保持进程运行
        await new Promise(() => {});
        
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
}

// 优雅关闭处理
let proxy;
process.on('SIGINT', async () => {
    console.log('\n正在关闭服务器...');
    if (proxy) {
        await proxy.stop();
    }
    process.exit(0);
});

// 运行示例
main().catch(console.error);