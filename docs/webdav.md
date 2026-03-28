# WebDAV 工具类

这是一个功能完整的 WebDAV 客户端工具类，基于 Node.js 和 axios 实现，支持所有常见的 WebDAV 操作。

## 特性

- ✅ **完整的 WebDAV 支持**：支持所有标准 WebDAV 方法
- ✅ **身份验证**：支持基本身份验证（Basic Auth）
- ✅ **SSL 配置**：可配置 SSL 证书验证
- ✅ **文件操作**：上传、下载、删除、移动、复制
- ✅ **目录操作**：创建、列出、删除目录
- ✅ **进度回调**：支持上传/下载进度监控
- ✅ **流式处理**：支持大文件的流式上传/下载
- ✅ **错误处理**：完善的错误处理和异常信息
- ✅ **XML 解析**：使用 cheerio 进行可靠的 XML 解析

## 安装

此工具类使用项目现有的依赖，无需额外安装：

- `axios` - HTTP 客户端
- `cheerio` - XML/HTML 解析器

## 快速开始

### 基本用法

```javascript
import {WebDAVClient, createWebDAVClient} from './utils/webdav.js';

// 创建 WebDAV 客户端
const webdav = createWebDAVClient({
    baseURL: 'https://your-webdav-server.com/webdav',
    username: 'your-username',
    password: 'your-password',
    rejectUnauthorized: false, // 开发环境可以忽略 SSL 证书
    timeout: 30000 // 30秒超时
});

// 测试连接
const isConnected = await webdav.testConnection();
console.log('连接状态:', isConnected);
```

### 目录操作

```javascript
// 列出目录内容
const items = await webdav.listDirectory('/');
console.log('目录内容:', items);

// 创建目录
await webdav.createDirectory('/new-folder', true); // 递归创建

// 检查文件/目录是否存在
const exists = await webdav.exists('/some-path');

// 获取文件/目录信息
const info = await webdav.getInfo('/some-file.txt');
console.log('文件信息:', info);
```

### 文件操作

```javascript
// 上传文本文件
await webdav.putFileContent('/remote/file.txt', 'Hello WebDAV!');

// 上传本地文件
await webdav.uploadFile('./local-file.pdf', '/remote/file.pdf', {
    overwrite: true,
    onProgress: (progress) => {
        console.log(`上传进度: ${Math.round(progress.loaded * 100 / progress.total)}%`);
    }
});

// 下载文件内容
const content = await webdav.getFileContent('/remote/file.txt');

// 下载文件到本地
await webdav.downloadFile('/remote/file.pdf', './downloaded-file.pdf', {
    onProgress: (progress) => {
        console.log(`下载进度: ${Math.round(progress.loaded * 100 / progress.total)}%`);
    }
});

// 复制文件
await webdav.copy('/source.txt', '/destination.txt');

// 移动文件
await webdav.move('/old-path.txt', '/new-path.txt');

// 删除文件
await webdav.delete('/unwanted-file.txt');
```

## API 参考

### 构造函数

```javascript
new WebDAVClient(config)
```

**配置选项：**

- `baseURL` (string): WebDAV 服务器基础 URL
- `username` (string, 可选): 用户名
- `password` (string, 可选): 密码
- `rejectUnauthorized` (boolean, 默认: false): 是否验证 SSL 证书
- `timeout` (number, 默认: 30000): 请求超时时间（毫秒）
- `headers` (object, 可选): 自定义请求头

### 主要方法

#### 连接测试

```javascript
await webdav.testConnection()
```

返回 `boolean` - 连接是否成功

#### 目录操作

```javascript
// 列出目录
await webdav.listDirectory(remotePath, depth)
// 参数：
// - remotePath: 远程目录路径（默认: '/'）
// - depth: 查询深度（默认: 1）

// 创建目录
await webdav.createDirectory(remotePath, recursive)
// 参数：
// - remotePath: 远程目录路径
// - recursive: 是否递归创建（默认: false）
```

#### 文件操作

```javascript
// 上传文件
await webdav.uploadFile(source, remotePath, options)
// 参数：
// - source: 本地文件路径、Buffer 或可读流
// - remotePath: 远程文件路径
// - options: { overwrite, contentType, onProgress }

// 下载文件
await webdav.downloadFile(remotePath, localPath, options)
// 参数：
// - remotePath: 远程文件路径
// - localPath: 本地保存路径（可选，不提供则返回 Buffer）
// - options: { onProgress }

// 文本文件操作
await webdav.putFileContent(remotePath, content, encoding, overwrite)
await webdav.getFileContent(remotePath, encoding)
```

#### 通用操作

```javascript
// 获取信息
await webdav.getInfo(remotePath)

// 检查存在
await webdav.exists(remotePath)

// 移动
await webdav.move(sourcePath, destinationPath, overwrite)

// 复制
await webdav.copy(sourcePath, destinationPath, overwrite)

// 删除
await webdav.delete(remotePath)
```

## 返回的文件/目录信息

```javascript
{
    name: 'file.txt',           // 文件/目录名
        path
:
    '/path/to/file.txt',  // 完整路径
        isDirectory
:
    false,         // 是否为目录
        size
:
    1024,                 // 文件大小（字节）
        lastModified
:
    Date,         // 最后修改时间
        creationDate
:
    Date,         // 创建时间
        contentType
:
    'text/plain',  // 内容类型
        etag
:
    'abc123'              // ETag
}
```

## 错误处理

所有方法都会抛出有意义的错误信息：

```javascript
try {
    await webdav.uploadFile('./file.txt', '/remote/file.txt');
} catch (error) {
    console.error('上传失败:', error.message);
}
```

## 常见用例

### 1. 备份文件到 WebDAV

```javascript
async function backupToWebDAV(localFiles, remoteDir) {
    const webdav = createWebDAVClient({ /* 配置 */});

    // 创建备份目录
    await webdav.createDirectory(remoteDir, true);

    // 批量上传文件
    for (const localFile of localFiles) {
        const remotePath = `${remoteDir}/${path.basename(localFile)}`;
        await webdav.uploadFile(localFile, remotePath, {
            onProgress: (progress) => {
                console.log(`${localFile}: ${Math.round(progress.loaded * 100 / progress.total)}%`);
            }
        });
    }
}
```

### 2. 同步目录

```javascript
async function syncDirectory(localDir, remoteDir) {
    const webdav = createWebDAVClient({ /* 配置 */});

    // 获取远程目录内容
    const remoteItems = await webdav.listDirectory(remoteDir);

    // 比较并同步文件
    // ... 实现同步逻辑
}
```

### 3. 配置文件管理

```javascript
async function updateConfig(configData) {
    const webdav = createWebDAVClient({ /* 配置 */});

    // 备份现有配置
    if (await webdav.exists('/config.json')) {
        await webdav.copy('/config.json', '/config.json.backup');
    }

    // 上传新配置
    await webdav.putFileContent('/config.json', JSON.stringify(configData, null, 2));
}
```

## 支持的 WebDAV 服务器

此工具类兼容大多数标准 WebDAV 服务器，包括：

- **Nextcloud/ownCloud**
- **Apache HTTP Server** (mod_dav)
- **Nginx** (nginx-dav-ext-module)
- **IIS** (WebDAV 扩展)
- **Caddy** (webdav 插件)
- **SabreDAV**

## 注意事项

1. **SSL 证书**：生产环境建议设置 `rejectUnauthorized: true`
2. **大文件**：使用流式上传/下载处理大文件
3. **并发**：避免对同一文件进行并发操作
4. **路径**：确保路径以 `/` 开头
5. **权限**：确保 WebDAV 用户有足够的权限

## 许可证

MIT License