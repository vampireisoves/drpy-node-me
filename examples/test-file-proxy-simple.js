import Fastify from 'fastify';
import fileProxyController from '../controllers/file-proxy.js';

// 创建 Fastify 实例
const fastify = Fastify({
    logger: true
});

// 注册 file-proxy 控制器
fastify.register(fileProxyController, {});

// 启动服务器
const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log('🚀 File Proxy 测试服务器启动成功！');
        console.log('服务器地址: http://localhost:3001');
        console.log('健康检查: http://localhost:3001/file-proxy/health');
        console.log('状态信息: http://localhost:3001/file-proxy/status');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();