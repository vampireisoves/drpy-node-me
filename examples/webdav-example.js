/**
 * WebDAV 工具类使用示例
 * 
 * 本文件展示了如何使用 WebDAV 工具类进行各种文件和目录操作。
 * 包含了连接测试、目录浏览、文件上传下载等常见场景的示例代码。
 * 
 * @author drpy-node
 * @version 1.0.0
 */

import { createWebDAVClient } from '../utils/webdav.js';

/**
 * WebDAV 使用示例
 */
async function webdavExample() {
    // 1. 创建 WebDAV 客户端
    const webdav = createWebDAVClient({
        baseURL: 'http://192.168.31.217/webdav',
        username: 'your-username',
        password: 'your-password',
        rejectUnauthorized: false, // 忽略 SSL 证书验证（仅用于测试）
        timeout: 30000 // 30秒超时
    });

    try {
        // 2. 测试连接
        console.log('Testing WebDAV connection...');
        const isConnected = await webdav.testConnection();
        if (!isConnected) {
            console.error('Failed to connect to WebDAV server');
            return;
        }
        console.log('✓ WebDAV connection successful');

        // 3. 列出根目录内容
        console.log('\nListing root directory...');
        const rootItems = await webdav.listDirectory('/');
        console.log('Root directory contents:');
        rootItems.forEach(item => {
            const type = item.isDirectory ? '[DIR]' : '[FILE]';
            const size = item.isDirectory ? '' : ` (${item.size} bytes)`;
            console.log(`  ${type} ${item.name}${size}`);
        });

        // 4. 创建目录
        console.log('\nCreating directory...');
        const testDir = '/test-directory';
        await webdav.createDirectory(testDir, true); // 递归创建
        console.log(`✓ Directory created: ${testDir}`);

        // 5. 检查文件/目录是否存在
        console.log('\nChecking if directory exists...');
        const exists = await webdav.exists(testDir);
        console.log(`Directory ${testDir} exists: ${exists}`);

        // 6. 获取目录信息
        console.log('\nGetting directory info...');
        try {
            const dirInfo = await webdav.getInfo(testDir);
            if (dirInfo) {
                console.log('Directory info:', {
                    name: dirInfo.name,
                    path: dirInfo.path,
                    isDirectory: dirInfo.isDirectory,
                    lastModified: dirInfo.lastModified
                });
            } else {
                console.log('No directory info returned');
            }
        } catch (error) {
            console.error('Failed to get directory info:', error.message);
        }

        // 7. 上传文件（从文本内容）
        console.log('\nUploading text file...');
        const testFile = `${testDir}/test.txt`;
        const textContent = `Hello WebDAV!\nCreated at: ${new Date().toISOString()}`;
        await webdav.putFileContent(testFile, textContent);
        console.log(`✓ Text file uploaded: ${testFile}`);

        // 8. 上传文件（从 Buffer）
        console.log('\nUploading JSON file...');
        const jsonFile = `${testDir}/data.json`;
        const jsonData = {
            message: 'Hello from WebDAV',
            timestamp: Date.now(),
            items: ['item1', 'item2', 'item3']
        };
        const jsonBuffer = Buffer.from(JSON.stringify(jsonData, null, 2));
        await webdav.uploadFile(jsonBuffer, jsonFile, {
            contentType: 'application/json',
            overwrite: true
        });
        console.log(`✓ JSON file uploaded: ${jsonFile}`);

        // 9. 列出测试目录内容
        console.log('\nListing test directory...');
        const testDirItems = await webdav.listDirectory(testDir);
        console.log('Test directory contents:');
        testDirItems.forEach(item => {
            const type = item.isDirectory ? '[DIR]' : '[FILE]';
            const size = item.isDirectory ? '' : ` (${item.size} bytes)`;
            const modified = item.lastModified ? ` - Modified: ${item.lastModified.toISOString()}` : '';
            console.log(`  ${type} ${item.name}${size}${modified}`);
        });

        // 10. 下载文件内容
        console.log('\nDownloading text file...');
        const downloadedText = await webdav.getFileContent(testFile);
        console.log('Downloaded text content:');
        console.log(downloadedText);

        // 11. 下载文件为 Buffer
        console.log('\nDownloading JSON file...');
        const downloadedBuffer = await webdav.downloadFile(jsonFile);
        const downloadedJson = JSON.parse(downloadedBuffer.toString());
        console.log('Downloaded JSON content:');
        console.log(downloadedJson);

        // 11. 复制文件
        console.log('\nCopying file...');
        const copiedFile = `${testDir}/test-copy.txt`;
        
        try {
            // 首先验证源文件是否存在
            const sourceExists = await webdav.exists(testFile);
            console.log(`Source file exists: ${sourceExists}`);
            
            if (!sourceExists) {
                console.error(`❌ Source file does not exist: ${testFile}`);
                return;
            }
            
            // 执行复制操作
            await webdav.copy(testFile, copiedFile);
            console.log(`✓ File copied: ${testFile} → ${copiedFile}`);
            
            // 验证复制是否成功
            const copyExists = await webdav.exists(copiedFile);
            console.log(`Copy file exists: ${copyExists}`);
            
        } catch (error) {
            console.error('Failed to copy file:', error.message);
            // 继续执行其他操作，不要因为复制失败而中断整个流程
        }

        // 13. 移动文件
        console.log('\nMoving file...');
        const movedFile = `${testDir}/test-moved.txt`;
        await webdav.move(copiedFile, movedFile);
        console.log(`✓ File moved: ${copiedFile} -> ${movedFile}`);

        // 14. 获取文件信息
        console.log('\nGetting file info...');
        try {
            const fileInfo = await webdav.getInfo(movedFile);
            if (fileInfo) {
                console.log('File info:', {
                    name: fileInfo.name,
                    path: fileInfo.path,
                    size: fileInfo.size,
                    contentType: fileInfo.contentType,
                    lastModified: fileInfo.lastModified
                });
            } else {
                console.log('No file info returned');
            }
        } catch (error) {
            console.error('Failed to get file info:', error.message);
        }

        // 15. 删除文件
        console.log('\nDeleting files...');
        await webdav.delete(movedFile);
        await webdav.delete(jsonFile);
        console.log('✓ Files deleted');

        // 16. 删除目录
        console.log('\nDeleting directory...');
        await webdav.delete(testDir);
        console.log(`✓ Directory deleted: ${testDir}`);

        console.log('\n✓ All WebDAV operations completed successfully!');

    } catch (error) {
        console.error('WebDAV operation failed:', error.message);
    }
}

/**
 * 文件上传示例（从本地文件）
 */
async function uploadLocalFileExample() {
    const webdav = createWebDAVClient({
        baseURL: 'http://192.168.31.217/webdav',
        username: 'your-username',
        password: 'your-password'
    });

    try {
        // 上传本地文件
        const localFilePath = './webdav-example.js'; // 本地文件路径
        const remoteFilePath = '/root/webdav-example.js'; // 远程文件路径

        console.log('Uploading local file...');
        await webdav.uploadFile(localFilePath, remoteFilePath, {
            overwrite: true,
            onProgress: (progressEvent) => {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Upload progress: ${percent}%`);
            }
        });

        console.log('✓ Local file uploaded successfully');

        // 下载到本地文件
        const downloadPath = './1.js';
        console.log('Downloading to local file...');
        await webdav.downloadFile(remoteFilePath, downloadPath, {
            onProgress: (progressEvent) => {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Download progress: ${percent}%`);
            }
        });

        console.log('✓ File downloaded successfully');

    } catch (error) {
        console.error('File operation failed:', error.message);
    }
}

/**
 * 批量操作示例
 */
async function batchOperationsExample() {
    const webdav = createWebDAVClient({
        baseURL: 'http://192.168.31.217/webdav',
        username: 'your-username',
        password: 'your-password'
    });

    try {
        const batchDir = '/batch-test';
        
        // 创建批量测试目录
        await webdav.createDirectory(batchDir, true);

        // 批量上传文件
        const files = [
            { name: 'file1.txt', content: 'Content of file 1' },
            { name: 'file2.txt', content: 'Content of file 2' },
            { name: 'file3.txt', content: 'Content of file 3' }
        ];

        console.log('Batch uploading files...');
        for (const file of files) {
            const remotePath = `${batchDir}/${file.name}`;
            await webdav.putFileContent(remotePath, file.content);
            console.log(`✓ Uploaded: ${file.name}`);
        }

        // 批量下载文件
        console.log('\nBatch downloading files...');
        const downloadedFiles = [];
        for (const file of files) {
            const remotePath = `${batchDir}/${file.name}`;
            const content = await webdav.getFileContent(remotePath);
            downloadedFiles.push({ name: file.name, content });
            console.log(`✓ Downloaded: ${file.name}`);
        }

        // 显示下载的内容
        console.log('\nDownloaded contents:');
        downloadedFiles.forEach(file => {
            console.log(`${file.name}: ${file.content}`);
        });

        // 批量删除文件
        console.log('\nBatch deleting files...');
        for (const file of files) {
            const remotePath = `${batchDir}/${file.name}`;
            await webdav.delete(remotePath);
            console.log(`✓ Deleted: ${file.name}`);
        }

        // 删除批量测试目录
        await webdav.delete(batchDir);
        console.log(`✓ Deleted directory: ${batchDir}`);

    } catch (error) {
        console.error('Batch operation failed:', error.message);
    }
}

// 导出示例函数
export {
    webdavExample,
    uploadLocalFileExample,
    batchOperationsExample
};

await webdavExample();
await uploadLocalFileExample();
await batchOperationsExample();

// 如果直接运行此文件，执行示例
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('Running WebDAV examples...\n');
    
    // 运行基本示例
    await webdavExample();
    
    // 取消注释以下行来运行其他示例
    // await uploadLocalFileExample();
    // await batchOperationsExample();
}