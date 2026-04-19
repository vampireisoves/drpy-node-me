/**
 * 简单的 M3U8 代理服务器测试
 * 用于测试指定的 M3U8 URL
 */

import Fastify from 'fastify';
import m3u8ProxyController from '../controllers/m3u8-proxy.js';

const fastify = Fastify({ 
    logger: true,
    disableRequestLogging: false
});

// 注册 M3U8 代理控制器
await fastify.register(m3u8ProxyController);

// 启动服务器
const start = async () => {
    try {
        await fastify.listen({ port: 3002, host: '0.0.0.0' });
        console.log('🚀 M3U8 代理服务器已启动');
        console.log('📡 服务地址: http://0.0.0.0:3002');
        console.log('');
        console.log('📋 可用接口:');
        console.log('  GET  /m3u8-proxy/health - 健康检查');
        console.log('  GET  /m3u8-proxy/status - 服务状态');
        console.log('  GET  /m3u8-proxy/proxy?url=<url>&auth=drpys - 统一代理接口');
        console.log('  HEAD /m3u8-proxy/proxy?url=<url>&auth=drpys - HEAD 请求测试');
        console.log('');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();