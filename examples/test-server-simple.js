#!/usr/bin/env node

/**
 * 简单的测试服务器
 * 只加载统一代理功能，用于测试
 */

import Fastify from 'fastify';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建Fastify实例
const fastify = Fastify({
    logger: true
});

// 添加简单的CORS头
fastify.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
});

// 加载统一代理控制器
async function loadUnifiedProxy() {
    try {
        const unifiedProxyPath = join(__dirname, '..', 'controllers', 'unified-proxy.js');
        const fileUrl = `file:///${unifiedProxyPath.replace(/\\/g, '/')}`;
        const { default: unifiedProxyController } = await import(fileUrl);
        
        // 注册统一代理路由
        await fastify.register(unifiedProxyController, {});
        
        console.log('✅ 统一代理控制器加载成功');
        return true;
    } catch (error) {
        console.error('❌ 统一代理控制器加载失败:', error.message);
        return false;
    }
}

// 添加根路径处理
fastify.get('/', async (request, reply) => {
    return {
        service: 'Unified Proxy Test Server',
        version: '1.0.0',
        status: 'running',
        endpoints: [
            'GET / - This info',
            'GET /unified-proxy/health - Health check',
            'GET /unified-proxy/status - Service status',
            'GET /unified-proxy/proxy - Smart proxy'
        ]
    };
});

// 启动服务器
async function start() {
    try {
        console.log('🚀 启动统一代理测试服务器...');
        
        // 加载统一代理
        const loaded = await loadUnifiedProxy();
        if (!loaded) {
            console.error('❌ 无法加载统一代理，服务器启动失败');
            process.exit(1);
        }
        
        // 启动服务器
        const port = process.env.PORT || 3001;
        const host = process.env.HOST || '0.0.0.0';
        
        await fastify.listen({ port, host });
        
        console.log(`✅ 服务器启动成功！`);
        console.log(`📍 地址: http://localhost:${port}`);
        console.log(`🔗 统一代理: http://localhost:${port}/unified-proxy/status`);
        console.log(`💡 使用 Ctrl+C 停止服务器`);
        
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🛑 正在关闭服务器...');
    try {
        await fastify.close();
        console.log('✅ 服务器已关闭');
        process.exit(0);
    } catch (error) {
        console.error('❌ 关闭服务器时出错:', error);
        process.exit(1);
    }
});

// 启动服务器
start();