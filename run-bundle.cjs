const path = require('path');
const fs = require('fs');

const __dirname_custom = '/storage/emulated/0/peekpili/drpy-node';
const logFilePath = path.join(__dirname_custom, 'drpy_node.log');

function writeLog(msg) {
  const line = '[' + new Date().toISOString() + '] ' + msg + '\n';
  try { fs.appendFileSync(logFilePath, line); } catch(e) {}
  console.log(msg);
}

try { fs.writeFileSync(logFilePath, ''); } catch(e) {}

writeLog('[drpy-start] 启动脚本开始');
writeLog('[drpy-start] Node.js: ' + process.version);
writeLog('[drpy-start] 平台: ' + process.platform + ' ' + process.arch);

// ===== 设置 PHP 环境变量 =====
process.env.PHP_PATH = '/data/user/0/com.example.peekpili/files/php/php';
process.env.PHPRC = '/data/user/0/com.example.peekpili/files/php';
process.env.PHP_INI_SCAN_DIR = '/data/user/0/com.example.peekpili/files/php/conf.d';
process.env.HOME = '/data/user/0/com.example.peekpili/files/php';
process.env.TMPDIR = '/data/user/0/com.example.peekpili/cache';
process.env.LD_LIBRARY_PATH = '/data/user/0/com.example.peekpili/files/php/libs:/system/lib64:/system/lib';
writeLog('[drpy-start] PHP 环境变量已设置');
writeLog('[drpy-start] PHP_PATH: ' + process.env.PHP_PATH);
writeLog('[drpy-start] LD_LIBRARY_PATH: ' + process.env.LD_LIBRARY_PATH);

// 测试 PHP 可执行性
try {
  const { execFileSync } = require('child_process');
  const phpVersion = execFileSync(process.env.PHP_PATH, ['-v'], { 
    encoding: 'utf8', 
    timeout: 5000,
    env: process.env  // 传递完整环境变量
  });
  writeLog('[drpy-start] PHP 版本测试成功: ' + phpVersion.split('\n')[0]);
} catch (e) {
  writeLog('[drpy-start] ⚠️ PHP 版本测试失败: ' + e.message);
  writeLog('[drpy-start] ⚠️ 这可能导致 PHP 爬虫源无法使用');
}


// ===== 应用 drpy-node 兼容性补丁 (移动端) =====
// 自动替换不兼容的 controllers 文件
(function() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    writeLog('[drpy-patch] 开始应用兼容性补丁...');
    
    // 补丁文件列表
    const patches = [
      { name: 'docs.js', path: 'controllers/docs.js' },
      { name: 'root.js', path: 'controllers/root.js' }
    ];
    
    let patchCount = 0;
    
    for (const patch of patches) {
      const targetPath = path.join(__dirname_custom, patch.path);
      
      // 检查目标文件是否存在
      if (!fs.existsSync(targetPath)) {
        writeLog('[drpy-patch] 目标文件不存在，跳过: ' + patch.name);
        continue;
      }
      
      // 读取目标文件
      const targetContent = fs.readFileSync(targetPath, 'utf8');
      
      // 检查是否使用了不兼容的 import { marked } from "marked"
      if (targetContent.includes('import { marked } from "marked"')) {
        writeLog('[drpy-patch] 检测到不兼容的 marked 导入: ' + patch.name);
        
        // 创建备份
        const backupPath = targetPath + '.incompatible';
        if (!fs.existsSync(backupPath)) {
          fs.writeFileSync(backupPath, targetContent);
          writeLog('[drpy-patch] 已创建备份: ' + patch.name + '.incompatible');
        }
        
        // 应用补丁：替换为兼容版本
        const patchedContent = targetContent
          .replace(/import { marked } from "marked";/g, '// import { marked } from "marked";')
          .replace(/\/\/ import '\.\.\/utils\/marked\.min\.js';/g, "import '../utils/marked.min.js';");
        
        fs.writeFileSync(targetPath, patchedContent);
        patchCount++;
        writeLog('[drpy-patch] 已应用补丁: ' + patch.name);
      } else {
        writeLog('[drpy-patch] 文件已兼容，无需补丁: ' + patch.name);
      }
    }
    
    if (patchCount > 0) {
      writeLog('[drpy-patch] 补丁应用完成，共 ' + patchCount + ' 个文件');
    } else {
      writeLog('[drpy-patch] 所有文件已兼容，无需应用补丁');
    }
  } catch (e) {
    writeLog('[drpy-patch] 补丁应用失败: ' + e.message);
  }
})();

// ===== WebAssembly Polyfill =====
// nodejs-mobile 在 iOS 上不支持 WebAssembly，需要提供一个 mock
// 这会让依赖库回退到纯 JavaScript 实现
if (typeof globalThis.WebAssembly === 'undefined') {
  writeLog('[polyfill] 添加 WebAssembly mock');
  globalThis.WebAssembly = {
    compile: function() { return Promise.reject(new Error('WebAssembly not supported')); },
    instantiate: function() { return Promise.reject(new Error('WebAssembly not supported')); },
    instantiateStreaming: function() { return Promise.reject(new Error('WebAssembly not supported')); },
    compileStreaming: function() { return Promise.reject(new Error('WebAssembly not supported')); },
    validate: function() { return false; },
    Module: function() { throw new Error('WebAssembly not supported'); },
    Instance: function() { throw new Error('WebAssembly not supported'); },
    Memory: function() { throw new Error('WebAssembly not supported'); },
    Table: function() { throw new Error('WebAssembly not supported'); },
    CompileError: Error,
    LinkError: Error,
    RuntimeError: Error
  };
}

// ===== Web API Polyfills =====
// flutter_node 的 Node.js 缺少一些 Web API

if (typeof globalThis.Blob === 'undefined') {
  writeLog('[polyfill] 添加 Blob');
  globalThis.Blob = class Blob {
    constructor(bits = [], opts = {}) {
      this._parts = bits;
      this.type = opts.type || '';
      this.size = bits.reduce((s, b) => s + (typeof b === 'string' ? Buffer.byteLength(b) : b.length || b.byteLength || 0), 0);
    }
    async text() { return this._parts.map(b => typeof b === 'string' ? b : Buffer.from(b).toString()).join(''); }
    async arrayBuffer() { return Buffer.concat(this._parts.map(b => Buffer.from(b))).buffer; }
    slice(start, end, type) { return new Blob([Buffer.concat(this._parts.map(b => Buffer.from(b))).slice(start, end)], {type}); }
  };
}

if (typeof globalThis.File === 'undefined') {
  writeLog('[polyfill] 添加 File');
  globalThis.File = class File extends globalThis.Blob {
    constructor(bits, name, opts = {}) {
      super(bits, opts);
      this.name = name;
      this.lastModified = opts.lastModified || Date.now();
    }
  };
}

if (typeof globalThis.FormData === 'undefined') {
  writeLog('[polyfill] 添加 FormData');
  globalThis.FormData = class FormData {
    constructor() { this._data = new Map(); }
    append(k, v) { if (!this._data.has(k)) this._data.set(k, []); this._data.get(k).push(v); }
    get(k) { const v = this._data.get(k); return v ? v[0] : null; }
    getAll(k) { return this._data.get(k) || []; }
    has(k) { return this._data.has(k); }
    delete(k) { this._data.delete(k); }
    set(k, v) { this._data.set(k, [v]); }
    *entries() { for (const [k, vs] of this._data) for (const v of vs) yield [k, v]; }
    *keys() { for (const k of this._data.keys()) yield k; }
    *values() { for (const vs of this._data.values()) for (const v of vs) yield v; }
    [Symbol.iterator]() { return this.entries(); }
  };
}

writeLog('[polyfill] Web API polyfills 已添加');

// ===== 预加载全局库 =====
// drpy-node 使用了很多全局库，需要预先加载

// 加载 UMD 格式的库到 globalThis
function loadUmdLib(libPath, libName) {
  try {
    if (fs.existsSync(libPath)) {
      const code = fs.readFileSync(libPath, 'utf8');
      const module = { exports: {} };
      const func = new Function('exports', 'module', 'require', 'globalThis', code);
      func(module.exports, module, require, globalThis);
      // 检查是否已经设置到 globalThis
      if (globalThis[libName]) {
        writeLog('[polyfill] ' + libName + ' 已加载(global): ' + (typeof globalThis[libName]));
        return true;
      }
      // 否则从 module.exports 获取
      if (module.exports[libName]) {
        globalThis[libName] = module.exports[libName];
      } else if (module.exports.default) {
        globalThis[libName] = module.exports.default;
      } else if (Object.keys(module.exports).length > 0) {
        globalThis[libName] = module.exports;
      }
      writeLog('[polyfill] ' + libName + ' 已加载: ' + (typeof globalThis[libName]));
      return true;
    } else {
      writeLog('[polyfill] ' + libName + ' 文件不存在: ' + libPath);
      return false;
    }
  } catch (e) {
    writeLog('[polyfill] 加载 ' + libName + ' 失败: ' + e.message);
    return false;
  }
}

// 加载直接执行的脚本（设置 globalThis 变量）
// 对于 UMD 格式的库，需要模拟一个没有 exports 的环境
function loadScript(libPath, desc) {
  try {
    if (fs.existsSync(libPath)) {
      const code = fs.readFileSync(libPath, 'utf8');
      // 创建一个隔离的环境，不暴露 exports/module，强制使用 globalThis
      const func = new Function('require', 'globalThis', 'exports', 'module', code);
      func(require, globalThis, undefined, undefined);
      writeLog('[polyfill] ' + desc + ' 已执行');
      return true;
    } else {
      writeLog('[polyfill] ' + desc + ' 文件不存在: ' + libPath);
      return false;
    }
  } catch (e) {
    writeLog('[polyfill] 执行 ' + desc + ' 失败: ' + e.message);
    return false;
  }
}

const libsDir = path.join(__dirname_custom, 'libs_drpy');
const distDir = path.join(libsDir, '_dist');
const utilsDir = path.join(__dirname_custom, 'utils');

// 1. 加载 abba.js (提供 atob/btoa)
loadScript(path.join(libsDir, 'abba.js'), 'abba (atob/btoa)');

// 2. 加载 CryptoJS
loadUmdLib(path.join(libsDir, 'crypto-js.js'), 'CryptoJS');

// 3. 加载 pako
loadUmdLib(path.join(libsDir, 'pako.min.js'), 'pako');

// 4. 加载 JSEncrypt
loadUmdLib(path.join(libsDir, 'jsencrypt.js'), 'JSEncrypt');

// 5. 加载 jinja
loadUmdLib(path.join(libsDir, 'jinja.js'), 'jinja');

// 6. 加载 JSON5
loadUmdLib(path.join(distDir, 'json5.js'), 'JSON5');

// 7. 加载 NODERSA
loadUmdLib(path.join(distDir, 'node-rsa.js'), 'NODERSA');

// 8. 加载 gbkTool
loadUmdLib(path.join(distDir, 'gb18030.js'), 'gbkTool');

// 9. 加载 marked
loadUmdLib(path.join(utilsDir, 'marked.min.js'), 'marked');

// 10. 加载 randomUa (random-http-ua)
loadScript(path.join(utilsDir, 'random-http-ua.js'), 'randomUa');

writeLog('[polyfill] 全局库加载完成');

// ===== 切换工作目录 =====
try {
  process.chdir(__dirname_custom);
  writeLog('[drpy-start] 工作目录: ' + process.cwd());
} catch (e) {
  writeLog('[drpy-start] 切换目录失败: ' + e.message);
}

process.env.NODE_ENV = 'production';

// ===== iOS 请求库修复 =====
// nodejs-mobile 的 fetch API 不支持 agent 参数，强制使用 axios
process.env.DS_REQ_LIB = '1';
writeLog('[polyfill] 强制使用 axios 请求库 (DS_REQ_LIB=1)');

// ===== iOS 网络修复 =====
// nodejs-mobile 在 iOS 上可能有 TLS/SSL 问题，禁用证书验证
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 修复 iOS 上的 DNS 解析问题
if (process.platform === 'ios' || process.platform === 'darwin') {
  try {
    // 设置 DNS 服务器（如果可用）
    const dns = require('dns');
    if (dns.setServers) {
      dns.setServers(['8.8.8.8', '114.114.114.114', '223.5.5.5']);
      writeLog('[polyfill] DNS 服务器已设置');
    }
  } catch (e) {
    writeLog('[polyfill] DNS 设置跳过: ' + e.message);
  }
}

// 增加 HTTP 请求超时容忍度
process.env.UV_THREADPOOL_SIZE = '16';

process.on('uncaughtException', (e) => {
  writeLog('[ERROR] 未捕获异常: ' + e.message);
  writeLog('[ERROR] 堆栈: ' + e.stack);
});

process.on('unhandledRejection', (r) => {
  // 只记录非 WebAssembly 相关的拒绝，避免日志刷屏
  const msg = String(r);
  if (!msg.includes('WebAssembly')) {
    writeLog('[ERROR] Promise拒绝: ' + msg);
  }
});


// 写入端口文件 - 只记录 HTTP 端口（5757），忽略 WebSocket 端口（57575）
let httpPortWritten = false;
function writePortFile(port) {
  // 只写入第一个非 WebSocket 端口（57575 是 WebSocket 端口）
  if (port === 57575) {
    writeLog('[drpy-start] 跳过 WebSocket 端口: ' + port);
    return;
  }
  if (httpPortWritten) {
    writeLog('[drpy-start] HTTP 端口已记录，跳过: ' + port);
    return;
  }
  try {
    fs.writeFileSync(path.join(__dirname_custom, 'server_port.txt'), port.toString());
    httpPortWritten = true;
    writeLog('[drpy-start] HTTP 端口已写入: ' + port);
  } catch (e) {
    writeLog('[drpy-start] 写入端口失败: ' + e.message);
  }
}

// 拦截 http.Server.listen
const origListen = require('http').Server.prototype.listen;
require('http').Server.prototype.listen = function(...args) {
  const srv = origListen.apply(this, args);
  this.on('listening', () => {
    const addr = this.address();
    if (addr && addr.port) {
      writePortFile(addr.port);
      writeLog('[drpy-start] 服务器启动，端口: ' + addr.port);
    }
  });
  return srv;
};

const indexPath = path.join(__dirname_custom, 'index.js');
writeLog('[drpy-start] index.js: ' + indexPath);
writeLog('[drpy-start] 存在: ' + fs.existsSync(indexPath));
writeLog('[drpy-start] node_modules: ' + fs.existsSync(path.join(__dirname_custom, 'node_modules')));

const indexUrl = 'file://' + indexPath.replace(/\\/g, '/');
writeLog('[drpy-start] 加载: ' + indexUrl);

import(indexUrl)
  .then((m) => {
    writeLog('[drpy-start] 加载成功: ' + Object.keys(m || {}).join(','));
    
    // 延迟测试网络连接
    setTimeout(async () => {
      writeLog('[network-test] 开始网络测试...');
      
      // 测试 1: 简单的 HTTPS 请求
      try {
        const https = require('https');
        const testUrl = 'https://httpbin.org/get';
        writeLog('[network-test] 测试 HTTPS: ' + testUrl);
        
        const testPromise = new Promise((resolve, reject) => {
          const req = https.get(testUrl, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, length: data.length }));
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        });
        
        const result = await testPromise;
        writeLog('[network-test] HTTPS 成功: status=' + result.status + ', length=' + result.length);
      } catch (e) {
        writeLog('[network-test] HTTPS 失败: ' + e.message);
      }
      
      // 测试 2: 番茄小说 API
      try {
        const https = require('https');
        const fqUrl = 'https://fanqienovel.com/api/author/book/category_list/v0/';
        writeLog('[network-test] 测试番茄小说 API: ' + fqUrl);
        
        const fqPromise = new Promise((resolve, reject) => {
          const req = https.get(fqUrl, { 
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
            }
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, length: data.length, preview: data.substring(0, 100) }));
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        });
        
        const result = await fqPromise;
        writeLog('[network-test] 番茄小说 API 状态: ' + result.status + ', 长度: ' + result.length);
        writeLog('[network-test] 响应预览: ' + result.preview);
      } catch (e) {
        writeLog('[network-test] 番茄小说 API 失败: ' + e.message);
      }
      
      writeLog('[network-test] 网络测试完成');
    }, 3000);
  })
  .catch((e) => {
    writeLog('[drpy-start] 加载失败: ' + e.message);
    writeLog('[drpy-start] 堆栈: ' + e.stack);
  });
