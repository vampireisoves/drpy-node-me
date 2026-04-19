/**
 * 简单的 FTP 代理测试
 */

import Fastify from 'fastify';

console.log('开始测试 FTP 代理控制器...');

try {
    // 测试导入
    console.log('1. 测试导入 FTP 代理控制器...');
    const ftpProxyController = await import('../controllers/ftp-proxy.js');
    console.log('✅ FTP 代理控制器导入成功');
    console.log('导入的模块:', typeof ftpProxyController.default);

    // 创建 Fastify 实例
    console.log('2. 创建 Fastify 实例...');
    const fastify = Fastify({
        logger: false
    });
    console.log('✅ Fastify 实例创建成功');

    // 注册插件
    console.log('3. 注册 FTP 代理控制器插件...');
    await fastify.register(ftpProxyController.default);
    console.log('✅ FTP 代理控制器插件注册成功');

    // 启动服务器
    console.log('4. 启动服务器...');
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('✅ 服务器启动成功: http://localhost:3001');

    // 测试健康检查
    console.log('5. 测试健康检查接口...');
    const response = await fetch('http://localhost:3001/ftp/health');
    const data = await response.json();
    console.log('✅ 健康检查响应:', data);

    // 关闭服务器
    console.log('6. 关闭服务器...');
    await fastify.close();
    console.log('✅ 测试完成');

} catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
}