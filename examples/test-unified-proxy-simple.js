#!/usr/bin/env node

/**
 * 简单的统一代理测试脚本
 * 直接测试统一代理的核心功能，不依赖于完整的服务器启动
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 模拟Fastify实例和请求/响应对象
class MockFastify {
    constructor() {
        this.routes = new Map();
    }

    get(path, handler) {
        this.routes.set(`GET:${path}`, handler);
    }

    post(path, handler) {
        this.routes.set(`POST:${path}`, handler);
    }

    route(options) {
        const method = options.method || 'GET';
        const path = options.url || options.path;
        const handler = options.handler;
        this.routes.set(`${method}:${path}`, handler);
    }

    async inject(options) {
        const key = `${options.method}:${options.url.split('?')[0]}`;
        const handler = this.routes.get(key);
        
        if (!handler) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Route not found' })
            };
        }

        const mockRequest = {
            method: options.method,
            url: options.url,
            query: new URLSearchParams(options.url.split('?')[1] || ''),
            headers: options.headers || {},
            body: options.payload
        };

        const mockReply = {
            statusCode: 200,
            headers: {},
            body: null,
            code(status) {
                this.statusCode = status;
                return this;
            },
            header(name, value) {
                this.headers[name] = value;
                return this;
            },
            send(data) {
                this.body = data;
                return this;
            },
            type(contentType) {
                this.headers['content-type'] = contentType;
                return this;
            }
        };

        try {
            await handler(mockRequest, mockReply);
            return {
                statusCode: mockReply.statusCode,
                headers: mockReply.headers,
                body: mockReply.body
            };
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message })
            };
        }
    }
}

// 导入统一代理控制器
async function loadUnifiedProxy() {
    try {
        const unifiedProxyPath = join(__dirname, '..', 'controllers', 'unified-proxy.js');
        const fileUrl = `file:///${unifiedProxyPath.replace(/\\/g, '/')}`;
        const { default: unifiedProxyController } = await import(fileUrl);
        return unifiedProxyController;
    } catch (error) {
        console.error('❌ 无法加载统一代理控制器:', error.message);
        return null;
    }
}

// 测试函数
async function testUnifiedProxy() {
    console.log('🚀 开始简单统一代理测试...\n');

    // 加载统一代理控制器
    const unifiedProxyController = await loadUnifiedProxy();
    if (!unifiedProxyController) {
        console.log('❌ 测试失败：无法加载统一代理控制器');
        return;
    }

    // 创建模拟Fastify实例
    const mockFastify = new MockFastify();
    
    // 注册统一代理路由
    try {
        await unifiedProxyController(mockFastify, {}, () => {});
        console.log('✅ 统一代理控制器加载成功');
    } catch (error) {
        console.error('❌ 统一代理控制器注册失败:', error.message);
        return;
    }

    // 测试状态接口
    console.log('\n📊 测试状态接口...');
    try {
        const statusResponse = await mockFastify.inject({
            method: 'GET',
            url: '/unified-proxy/status'
        });

        if (statusResponse.statusCode === 200) {
            console.log('✅ 状态接口测试成功');
            console.log('📄 响应内容:', statusResponse.body);
        } else {
            console.log('❌ 状态接口测试失败，状态码:', statusResponse.statusCode);
        }
    } catch (error) {
        console.error('❌ 状态接口测试异常:', error.message);
    }

    // 测试代理接口（无效URL）
    console.log('\n🔗 测试代理接口（无效URL）...');
    try {
        const proxyResponse = await mockFastify.inject({
            method: 'GET',
            url: '/unified-proxy/proxy?url=invalid-url&auth=drpy'
        });

        if (proxyResponse.statusCode >= 400) {
            console.log('✅ 无效URL测试成功，正确返回错误状态码:', proxyResponse.statusCode);
        } else {
            console.log('❌ 无效URL测试失败，应该返回错误状态码');
        }
    } catch (error) {
        console.error('❌ 无效URL测试异常:', error.message);
    }

    // 测试代理接口（缺少认证）
    console.log('\n🔐 测试代理接口（缺少认证）...');
    try {
        const authResponse = await mockFastify.inject({
            method: 'GET',
            url: '/unified-proxy/proxy?url=https://example.com/test.m3u8'
        });

        if (authResponse.statusCode === 401) {
            console.log('✅ 认证测试成功，正确返回401状态码');
        } else {
            console.log('❌ 认证测试失败，状态码:', authResponse.statusCode);
        }
    } catch (error) {
        console.error('❌ 认证测试异常:', error.message);
    }

    console.log('\n🎉 简单统一代理测试完成！');
}

// 运行测试
testUnifiedProxy().catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
});