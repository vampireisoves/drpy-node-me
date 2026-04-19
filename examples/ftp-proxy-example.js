/**
 * FTP 代理服务测试示例
 * 演示如何使用 FTP 代理控制器提供文件直链服务
 */

import Fastify from 'fastify';
import ftpProxyController from '../controllers/ftp-proxy.js';

// 创建 Fastify 实例
const fastify = Fastify({
    logger: {
        level: 'info'
    }
});

// 添加根路径处理
fastify.get('/', async (request, reply) => {
    return reply.type('text/html').send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FTP 代理服务测试</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { color: #fff; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
        .get { background: #61affe; }
        .post { background: #49cc90; }
        .delete { background: #f93e3e; }
        code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
        .example { background: #e8f4fd; padding: 10px; border-left: 4px solid #2196F3; margin: 10px 0; }
        .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 FTP 代理服务测试</h1>
        <p>这是一个 FTP 文件代理服务，提供 HTTP 直链访问 FTP 服务器上的文件。</p>
        
        <div class="warning">
            <strong>⚠️ 注意：</strong>请确保已正确配置 <code>json/ftp.json</code> 文件，或在请求中提供 FTP 配置参数。
        </div>

        <h2>📋 可用接口</h2>

        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/ftp/health</strong> - 健康检查
            <div class="example">
                <strong>示例：</strong><br>
                <code>curl http://localhost:3000/ftp/health</code>
            </div>
        </div>

        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/ftp/status</strong> - 获取服务状态
            <div class="example">
                <strong>示例：</strong><br>
                <code>curl http://localhost:3000/ftp/status</code>
            </div>
        </div>

        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/ftp/list</strong> - 列出目录内容
            <div class="example">
                <strong>参数：</strong><br>
                • <code>path</code> - 目录路径（可选，默认为 /）<br>
                • <code>config</code> - FTP 配置（可选，JSON 格式）<br><br>
                <strong>示例：</strong><br>
                <code>curl "http://localhost:3000/ftp/list?path=/"</code><br>
                <code>curl "http://localhost:3000/ftp/list?path=/uploads"</code>
            </div>
        </div>

        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/ftp/info</strong> - 获取文件信息
            <div class="example">
                <strong>参数：</strong><br>
                • <code>path</code> - 文件路径（必需）<br>
                • <code>config</code> - FTP 配置（可选，JSON 格式）<br><br>
                <strong>示例：</strong><br>
                <code>curl "http://localhost:3000/ftp/info?path=/readme.txt"</code>
            </div>
        </div>

        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/ftp/file</strong> - 获取文件直链（下载文件）
            <div class="example">
                <strong>参数：</strong><br>
                • <code>path</code> - 文件路径（必需）<br>
                • <code>config</code> - FTP 配置（可选，JSON 格式）<br><br>
                <strong>示例：</strong><br>
                <code>curl "http://localhost:3000/ftp/file?path=/readme.txt"</code><br>
                <code>curl "http://localhost:3000/ftp/file?path=/images/photo.jpg" -o photo.jpg</code><br><br>
                <strong>支持 Range 请求：</strong><br>
                <code>curl -H "Range: bytes=0-1023" "http://localhost:3000/ftp/file?path=/large-file.zip"</code>
            </div>
        </div>

        <div class="endpoint">
            <span class="method post">POST</span>
            <strong>/ftp/config</strong> - 测试 FTP 配置
            <div class="example">
                <strong>请求体：</strong><br>
                <pre>{
  "host": "192.168.31.10",
  "port": 2121,
  "username": "anonymous",
  "password": "anonymous@example.com",
  "secure": false,
  "pasv": true
}</pre>
                <strong>示例：</strong><br>
                <code>curl -X POST -H "Content-Type: application/json" -d '{"host":"192.168.31.10","port":2121}' http://localhost:3000/ftp/config</code>
            </div>
        </div>

        <div class="endpoint">
            <span class="method delete">DELETE</span>
            <strong>/ftp/cache</strong> - 清理缓存
            <div class="example">
                <strong>示例：</strong><br>
                <code>curl -X DELETE http://localhost:3000/ftp/cache</code>
            </div>
        </div>

        <h2>🔧 配置说明</h2>
        <p>FTP 配置文件位置：<code>json/ftp.json</code></p>
        <div class="example">
            <strong>配置示例：</strong>
            <pre>{
  "host": "192.168.31.10",
  "port": 2121,
  "username": "anonymous",
  "password": "anonymous@example.com",
  "secure": false,
  "pasv": true,
  "timeout": 30000,
  "verbose": false
}</pre>
        </div>

        <h2>🌐 使用场景</h2>
        <ul>
            <li><strong>文件直链服务：</strong>为 FTP 服务器上的文件提供 HTTP 直链访问</li>
            <li><strong>媒体流服务：</strong>支持 Range 请求，适合视频、音频等大文件的流式传输</li>
            <li><strong>文件浏览器：</strong>通过 HTTP API 浏览 FTP 服务器的目录结构</li>
            <li><strong>缓存优化：</strong>自动缓存文件信息和客户端连接，提高访问效率</li>
        </ul>

        <h2>📝 测试步骤</h2>
        <ol>
            <li>确保 FTP 服务器正在运行并可访问</li>
            <li>配置 <code>json/ftp.json</code> 文件</li>
            <li>启动此代理服务：<code>node ftp-proxy-example.js</code></li>
            <li>测试健康检查：<code>curl http://localhost:3000/ftp/health</code></li>
            <li>列出根目录：<code>curl "http://localhost:3000/ftp/list?path=/"</code></li>
            <li>下载文件：<code>curl "http://localhost:3000/ftp/file?path=/your-file.txt"</code></li>
        </ol>

        <div class="warning">
            <strong>💡 提示：</strong>
            <ul>
                <li>支持匿名 FTP 访问，无需用户名密码</li>
                <li>支持 HTTP Range 请求，适合大文件下载</li>
                <li>自动缓存文件信息，提高访问速度</li>
                <li>支持跨域访问（CORS）</li>
            </ul>
        </div>
    </div>
</body>
</html>
    `);
});

// 启动服务器
const start = async () => {
    try {
        // 注册 FTP 代理控制器
        await fastify.register(ftpProxyController);
        
        const port = process.env.PORT || 3000;
        const host = process.env.HOST || '0.0.0.0';
        
        await fastify.listen({ port, host });
        
        console.log(`🚀 FTP 代理服务已启动！`);
        console.log(`📍 服务地址: http://localhost:${port}`);
        console.log(`📋 API 文档: http://localhost:${port}`);
        console.log(`🔍 健康检查: http://localhost:${port}/ftp/health`);
        console.log(`📊 服务状态: http://localhost:${port}/ftp/status`);
        console.log('');
        console.log('🔧 快速测试命令:');
        console.log(`   curl http://localhost:${port}/ftp/health`);
        console.log(`   curl "http://localhost:${port}/ftp/list?path=/"`);
        console.log(`   curl "http://localhost:${port}/ftp/status"`);
        
    } catch (err) {
        console.error('❌ 服务启动失败:', err);
        process.exit(1);
    }
};

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🛑 正在关闭 FTP 代理服务...');
    try {
        await fastify.close();
        console.log('✅ 服务已安全关闭');
        process.exit(0);
    } catch (err) {
        console.error('❌ 关闭服务时出错:', err);
        process.exit(1);
    }
});

start();