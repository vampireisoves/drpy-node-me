/**
 * FTP 客户端测试文件
 * 
 * 该文件用于测试 FTP 客户端的各种功能，包括：
 * - 连接测试
 * - 目录列表
 * - 文件信息获取
 * - 文件上传下载
 * - 文件流获取（用于直链服务）
 * - 目录创建和删除
 * 
 * 使用方法：
 * node ftp-test.js
 */

import { FTPClient } from '../utils/ftp.js';
import fs from 'fs';
import path from 'path';

// FTP 配置 - 请根据实际情况修改
const FTP_CONFIG = {
    host: 'ftp.example.com',
    port: 21,
    username: 'testuser',
    password: 'testpass',
    secure: false,
    pasv: true,
    timeout: 30000,
    verbose: true
};

/**
 * 从配置文件加载 FTP 配置
 */
function loadFTPConfig() {
    try {
        // 直接读取指定的配置文件路径
        const configPath = 'e:\\gitwork\\drpy-node\\json\\ftp.json';
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            // 如果配置是数组格式，取第一个元素
            let ftpConfig = Array.isArray(config) ? (config.length > 0 ? config[0] : null) : config;
            
            if (ftpConfig) {
                // 支持匿名 FTP 访问
                if (!ftpConfig.username || ftpConfig.username === 'your-username' || ftpConfig.username === '') {
                    ftpConfig.username = 'anonymous';
                }
                if (!ftpConfig.password || ftpConfig.password === 'your-password' || ftpConfig.password === '') {
                    ftpConfig.password = 'anonymous@example.com';
                }
            }
            
            return ftpConfig;
        } else {
            console.warn(`配置文件不存在: ${configPath}`);
        }
    } catch (error) {
        console.warn('Failed to load FTP config from e:\\gitwork\\drpy-node\\json\\ftp.json:', error.message);
    }
    
    return FTP_CONFIG;
}

/**
 * 运行 FTP 客户端测试
 */
async function runFTPTests() {
    console.log('🚀 开始 FTP 客户端功能测试...\n');

    const config = loadFTPConfig();
    if (!config) {
        console.error('❌ 无法加载 FTP 配置');
        return;
    }

    console.log('📋 FTP 配置信息:');
    console.log(`   主机: ${config.host}:${config.port}`);
    console.log(`   用户: ${config.username}`);
    console.log(`   安全: ${config.secure ? 'FTPS' : 'FTP'}`);
    console.log(`   模式: ${config.pasv ? '被动' : '主动'}\n`);

    const client = new FTPClient(config);

    try {
        // 1. 测试连接
        console.log('🔗 测试 FTP 连接...');
        const connected = await client.testConnection();
        if (connected) {
            console.log('✅ FTP 连接成功\n');
        } else {
            console.log('❌ FTP 连接失败\n');
            return;
        }

        // 2. 测试目录列表
        console.log('📁 测试目录列表功能...');
        try {
            const files = await client.listDirectory('/');
            console.log(`✅ 目录列表获取成功，共 ${files.length} 个项目:`);
            files.slice(0, 5).forEach(file => {
                const type = file.isDirectory ? '📁' : '📄';
                const size = file.isFile ? ` (${file.size} bytes)` : '';
                console.log(`   ${type} ${file.name}${size}`);
            });
            if (files.length > 5) {
                console.log(`   ... 还有 ${files.length - 5} 个项目`);
            }
            console.log();
        } catch (error) {
            console.log('❌ 目录列表获取失败:', error.message, '\n');
        }

        // 3. 测试文件信息获取
        console.log('ℹ️  测试文件信息获取...');
        try {
            const files = await client.listDirectory('/');
            const testFile = files.find(f => f.isFile);
            
            if (testFile) {
                const fileInfo = await client.getInfo(testFile.path);
                console.log('✅ 文件信息获取成功:');
                console.log(`   文件名: ${fileInfo.name}`);
                console.log(`   大小: ${fileInfo.size} bytes`);
                console.log(`   类型: ${fileInfo.contentType}`);
                console.log(`   修改时间: ${fileInfo.lastModified}`);
                console.log();
            } else {
                console.log('⚠️  根目录中没有找到文件，跳过文件信息测试\n');
            }
        } catch (error) {
            console.log('❌ 文件信息获取失败:', error.message, '\n');
        }

        // 4. 测试文件存在性检查
        console.log('🔍 测试文件存在性检查...');
        try {
            const exists1 = await client.exists('/');
            const exists2 = await client.exists('/nonexistent-file-12345.txt');
            console.log(`✅ 根目录存在: ${exists1}`);
            console.log(`✅ 不存在的文件: ${exists2}\n`);
        } catch (error) {
            console.log('❌ 文件存在性检查失败:', error.message, '\n');
        }

        // 5. 测试目录创建和删除
        console.log('📁 测试目录创建和删除...');
        try {
            const testDir = '/test-ftp-client-' + Date.now();
            
            // 创建目录
            await client.createDirectory(testDir);
            console.log(`✅ 目录创建成功: ${testDir}`);
            
            // 验证目录存在
            const dirExists = await client.exists(testDir);
            console.log(`✅ 目录存在验证: ${dirExists}`);
            
            // 删除目录
            await client.delete(testDir);
            console.log(`✅ 目录删除成功: ${testDir}`);
            
            // 验证目录不存在
            const dirNotExists = await client.exists(testDir);
            console.log(`✅ 目录删除验证: ${!dirNotExists}\n`);
        } catch (error) {
            console.log('❌ 目录操作失败:', error.message, '\n');
        }

        // 6. 测试文件上传和下载
        console.log('📤 测试文件上传和下载...');
        try {
            const testContent = `FTP 客户端测试文件\n创建时间: ${new Date().toISOString()}\n随机数: ${Math.random()}`;
            const testFileName = '/test-ftp-upload-' + Date.now() + '.txt';
            
            // 上传文件
            await client.putFileContent(testFileName, testContent);
            console.log(`✅ 文件上传成功: ${testFileName}`);
            
            // 下载文件
            const downloadedContent = await client.getFileContent(testFileName);
            console.log(`✅ 文件下载成功，内容匹配: ${downloadedContent === testContent}`);
            
            // 删除测试文件
            await client.delete(testFileName);
            console.log(`✅ 测试文件删除成功\n`);
        } catch (error) {
            console.log('❌ 文件上传下载失败:', error.message, '\n');
        }

        // 7. 测试文件流获取（用于直链服务）
        console.log('🌊 测试文件流获取功能...');
        try {
            const files = await client.listDirectory('/');
            const testFile = files.find(f => f.isFile && f.size > 0 && f.size < 1024 * 1024); // 找一个小于1MB的文件
            
            if (testFile) {
                const streamInfo = await client.getFileStream(testFile.path);
                console.log('✅ 文件流获取成功:');
                console.log(`   文件: ${testFile.name}`);
                console.log(`   大小: ${streamInfo.size} bytes`);
                console.log(`   类型: ${streamInfo.contentType}`);
                console.log(`   Headers:`, Object.keys(streamInfo.headers).join(', '));
                
                // 读取流的前几个字节来验证
                let bytesRead = 0;
                await new Promise((resolve, reject) => {
                    streamInfo.stream.on('data', (chunk) => {
                        bytesRead += chunk.length;
                    });
                    
                    streamInfo.stream.on('end', () => {
                        console.log(`✅ 流读取完成，共读取 ${bytesRead} bytes\n`);
                        resolve();
                    });
                    
                    streamInfo.stream.on('error', (error) => {
                        console.log('❌ 流读取错误:', error.message, '\n');
                        reject(error);
                    });
                });
            } else {
                console.log('⚠️  没有找到合适的测试文件，跳过文件流测试\n');
            }
        } catch (error) {
            console.log('❌ 文件流获取失败:', error.message, '\n');
        }

        // 8. 测试文件移动/重命名
        console.log('🔄 测试文件移动/重命名...');
        try {
            // 等待一下确保之前的操作完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const testContent = `移动测试文件\n时间: ${new Date().toISOString()}`;
            const originalName = '/test-move-original-' + Date.now() + '.txt';
            const newName = '/test-move-renamed-' + Date.now() + '.txt';
            
            // 创建测试文件
            await client.putFileContent(originalName, testContent);
            console.log(`✅ 创建测试文件: ${originalName}`);
            
            // 移动/重命名文件
            await client.move(originalName, newName);
            console.log(`✅ 文件重命名成功: ${originalName} -> ${newName}`);
            
            // 验证原文件不存在，新文件存在
            const originalExists = await client.exists(originalName);
            const newExists = await client.exists(newName);
            console.log(`✅ 原文件不存在: ${!originalExists}, 新文件存在: ${newExists}`);
            
            // 清理测试文件
            if (newExists) {
                await client.delete(newName);
                console.log(`✅ 清理测试文件成功\n`);
            }
        } catch (error) {
            console.log('❌ 文件移动测试失败:', error.message, '\n');
        }

        console.log('🎉 FTP 客户端测试完成！');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
    } finally {
        // 断开连接
        await client.disconnect();
        console.log('🔌 FTP 连接已断开');
    }
}



// 主程序
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
    runFTPTests().catch(console.error);
}

export { runFTPTests, loadFTPConfig };