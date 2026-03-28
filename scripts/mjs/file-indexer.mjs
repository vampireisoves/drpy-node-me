import pkg from 'node-sqlite3-wasm';
const { Database: SQLite3Database } = pkg;
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import Fastify from 'fastify';

// 获取当前脚本所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'index.db');

/**
 * 文件索引器类
 */
class FileIndexer {
    constructor() {
        this.db = null;
        this.baseDirectory = __dirname;
    }

    /**
     * 初始化数据库连接
     */
    async initDatabase() {
        try {
            console.log('正在初始化数据库:', DB_PATH);
            this.db = new SQLite3Database(DB_PATH);
            
            // 创建文件索引表
            this.db.run(`
                CREATE TABLE IF NOT EXISTS file_index (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_path TEXT NOT NULL UNIQUE,
                    file_name TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    file_type TEXT NOT NULL,
                    is_directory INTEGER NOT NULL DEFAULT 0,
                    relative_path TEXT NOT NULL,
                    last_modified INTEGER NOT NULL,
                    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
                )
            `);

            // 创建索引以提高查询性能
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_name ON file_index(file_name)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_file_type ON file_index(file_type)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_relative_path ON file_index(relative_path)`);
            
            console.log('数据库初始化成功');
        } catch (error) {
            console.error('数据库初始化失败:', error);
            throw error;
        }
    }

    /**
     * 关闭数据库连接
     */
    async closeDatabase() {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }

    /**
     * 获取文件类型
     */
    getFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        if (!ext) return 'unknown';
        
        const typeMap = {
            '.js': 'javascript',
            '.mjs': 'javascript',
            '.ts': 'typescript',
            '.json': 'json',
            '.txt': 'text',
            '.md': 'markdown',
            '.html': 'html',
            '.css': 'css',
            '.png': 'image',
            '.jpg': 'image',
            '.jpeg': 'image',
            '.gif': 'image',
            '.svg': 'image',
            '.mp4': 'video',
            '.avi': 'video',
            '.mkv': 'video',
            '.mp3': 'audio',
            '.wav': 'audio',
            '.pdf': 'document',
            '.doc': 'document',
            '.docx': 'document',
            '.zip': 'archive',
            '.rar': 'archive',
            '.7z': 'archive'
        };
        
        return typeMap[ext] || 'other';
    }

    /**
     * 递归扫描目录
     */
    async scanDirectory(dirPath = this.baseDirectory) {
        const files = [];
        
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const relativePath = path.relative(this.baseDirectory, fullPath);
                
                // 排除自己和index.db文件
                if (entry.name === 'file-indexer.mjs' || entry.name === 'index.db') {
                    continue;
                }
                
                try {
                    const stats = fs.statSync(fullPath);
                    
                    const fileInfo = {
                        file_path: fullPath,
                        file_name: entry.name,
                        file_size: stats.size,
                        file_type: entry.isDirectory() ? 'directory' : this.getFileType(entry.name),
                        is_directory: entry.isDirectory() ? 1 : 0,
                        relative_path: relativePath,
                        last_modified: Math.floor(stats.mtime.getTime() / 1000)
                    };
                    
                    files.push(fileInfo);
                    
                    // 如果是目录，递归扫描
                    if (entry.isDirectory()) {
                        const subFiles = await this.scanDirectory(fullPath);
                        files.push(...subFiles);
                    }
                } catch (error) {
                    console.warn(`无法访问文件 ${fullPath}:`, error.message);
                }
            }
        } catch (error) {
            console.error(`扫描目录失败 ${dirPath}:`, error);
        }
        
        return files;
    }

    /**
     * 清空并重建索引
     */
    async rebuildIndex() {
        const startTime = Date.now();
        try {
            console.log('开始重建文件索引...');
            
            // 清空现有数据
            this.db.run('DELETE FROM file_index');
            
            // 扫描文件
            const files = await this.scanDirectory();
            console.log(`发现 ${files.length} 个文件/目录`);
            
            // 批量插入数据
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO file_index 
                (file_path, file_name, file_size, file_type, is_directory, relative_path, last_modified)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            for (const file of files) {
                stmt.run([
                    file.file_path,
                    file.file_name,
                    file.file_size,
                    file.file_type,
                    file.is_directory,
                    file.relative_path,
                    file.last_modified
                ]);
            }
            
            stmt.finalize();
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            const durationFormatted = `${duration}ms`;
            
            console.log(`文件索引重建完成，耗时: ${durationFormatted}`);
            return { 
                success: true, 
                count: files.length,
                duration: duration,
                durationFormatted: durationFormatted
            };
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.error(`重建索引失败，耗时: ${duration}ms，错误:`, error);
            throw error;
        }
    }

    /**
     * 搜索文件
     */
    searchFiles(query = '', fileType = '', limit = 100, offset = 0) {
        try {
            let sql = `
                SELECT file_path, file_name, file_size, file_type, is_directory, 
                       relative_path, last_modified, created_at, updated_at
                FROM file_index 
                WHERE 1=1
            `;
            const params = [];
            
            // 文件名模糊搜索
            if (query) {
                sql += ` AND (file_name LIKE ? OR relative_path LIKE ?)`;
                params.push(`%${query}%`, `%${query}%`);
            }
            
            // 文件类型过滤
            if (fileType) {
                sql += ` AND file_type = ?`;
                params.push(fileType);
            }
            
            sql += ` ORDER BY file_name ASC LIMIT ? OFFSET ?`;
            params.push(limit, offset);
            
            const results = this.db.all(sql, params);
            
            // 获取总数
            let countSql = `SELECT COUNT(*) as total FROM file_index WHERE 1=1`;
            const countParams = [];
            
            if (query) {
                countSql += ` AND (file_name LIKE ? OR relative_path LIKE ?)`;
                countParams.push(`%${query}%`, `%${query}%`);
            }
            
            if (fileType) {
                countSql += ` AND file_type = ?`;
                countParams.push(fileType);
            }
            
            const countResult = this.db.get(countSql, countParams);
            
            return {
                files: results.map(file => ({
                    ...file,
                    file_size_formatted: this.formatFileSize(file.file_size),
                    last_modified_formatted: new Date(file.last_modified * 1000).toLocaleString(),
                    is_directory: Boolean(file.is_directory)
                })),
                total: countResult.total,
                limit,
                offset
            };
        } catch (error) {
            console.error('搜索文件失败:', error);
            throw error;
        }
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取统计信息
     */
    getStats() {
        try {
            const totalFiles = this.db.get('SELECT COUNT(*) as count FROM file_index WHERE is_directory = 0');
            const totalDirs = this.db.get('SELECT COUNT(*) as count FROM file_index WHERE is_directory = 1');
            const totalSize = this.db.get('SELECT SUM(file_size) as size FROM file_index WHERE is_directory = 0');
            const fileTypes = this.db.all(`
                SELECT file_type, COUNT(*) as count 
                FROM file_index 
                WHERE is_directory = 0 
                GROUP BY file_type 
                ORDER BY count DESC
            `);
            
            return {
                total_files: totalFiles.count,
                total_directories: totalDirs.count,
                total_size: totalSize.size || 0,
                total_size_formatted: this.formatFileSize(totalSize.size || 0),
                file_types: fileTypes
            };
        } catch (error) {
            console.error('获取统计信息失败:', error);
            throw error;
        }
    }
}

/**
 * 创建Fastify服务器
 */
async function createServer() {
    const server = Fastify({ logger: true });
    const indexer = new FileIndexer();
    
    // 初始化数据库
    await indexer.initDatabase();
    
    // 设置CORS
    server.addHook('onRequest', async (request, reply) => {
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (request.method === 'OPTIONS') {
            reply.code(200).send();
        }
    });
    
    // 根路径 - HTML界面
    server.get('/', async (request, reply) => {
        reply.type('text/html');
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文件索引服务 - API测试界面</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5rem;
            border-bottom: 2px solid #4facfe;
            padding-bottom: 10px;
        }
        
        .api-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .api-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            border: 1px solid #e9ecef;
            transition: all 0.3s ease;
        }
        
        .api-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .api-card h3 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 1.2rem;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #495057;
            font-weight: 500;
        }
        
        .form-control {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #4facfe;
        }
        
        .btn {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            width: 100%;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .result {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #4facfe;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .loading {
            display: none;
            color: #4facfe;
            font-style: italic;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .content {
                padding: 20px;
            }
            
            .api-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📁 文件索引服务</h1>
            <p>API测试界面 - 轻松管理和搜索文件</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>🔧 API接口测试</h2>
                <div class="api-grid">
                    <div class="api-card">
                        <h3>🔄 重建索引</h3>
                        <p style="margin-bottom: 15px; color: #6c757d;">扫描目录并重建文件索引</p>
                        <button class="btn" onclick="rebuildIndex()">重建索引</button>
                        <div class="loading" id="rebuild-loading">正在重建索引...</div>
                        <div class="result" id="rebuild-result" style="display: none;"></div>
                    </div>
                    
                    <div class="api-card">
                        <h3>🔍 搜索文件</h3>
                        <div class="form-group">
                            <label for="search-query">搜索关键词</label>
                            <input type="text" id="search-query" class="form-control" placeholder="输入文件名关键词">
                        </div>
                        <div class="form-group">
                            <label for="search-type">文件类型</label>
                            <select id="search-type" class="form-control">
                                <option value="">所有类型</option>
                                <option value="javascript">JavaScript</option>
                                <option value="json">JSON</option>
                                <option value="text">文本</option>
                                <option value="image">图片</option>
                                <option value="video">视频</option>
                                <option value="audio">音频</option>
                                <option value="document">文档</option>
                                <option value="archive">压缩包</option>
                            </select>
                        </div>
                        <button class="btn" onclick="searchFiles()">搜索文件</button>
                        <div class="loading" id="search-loading">正在搜索...</div>
                        <div class="result" id="search-result" style="display: none;"></div>
                    </div>
                    
                    <div class="api-card">
                        <h3>📊 统计信息</h3>
                        <p style="margin-bottom: 15px; color: #6c757d;">查看文件索引统计数据</p>
                        <button class="btn" onclick="getStats()">获取统计</button>
                        <div class="loading" id="stats-loading">正在获取统计...</div>
                        <div class="result" id="stats-result" style="display: none;"></div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>📈 实时统计</h2>
                <div class="stats-grid" id="stats-dashboard">
                    <div class="stat-card">
                        <div class="stat-number" id="total-files">-</div>
                        <div class="stat-label">总文件数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="total-size">-</div>
                        <div class="stat-label">总大小</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="file-types">-</div>
                        <div class="stat-label">文件类型</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 页面加载时自动获取统计信息
        window.onload = function() {
            updateDashboard();
        };

        async function rebuildIndex() {
            const loadingEl = document.getElementById('rebuild-loading');
            const resultEl = document.getElementById('rebuild-result');
            
            loadingEl.style.display = 'block';
            resultEl.style.display = 'none';
            
            try {
                const response = await fetch('/rebuild', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: '{}'
                });
                
                const data = await response.json();
                resultEl.textContent = JSON.stringify(data, null, 2);
                resultEl.style.display = 'block';
                
                // 重建成功后更新仪表板
                if (data.success) {
                    setTimeout(updateDashboard, 1000);
                }
            } catch (error) {
                resultEl.textContent = '错误: ' + error.message;
                resultEl.style.display = 'block';
            } finally {
                loadingEl.style.display = 'none';
            }
        }

        async function searchFiles() {
            const query = document.getElementById('search-query').value;
            const type = document.getElementById('search-type').value;
            const loadingEl = document.getElementById('search-loading');
            const resultEl = document.getElementById('search-result');
            
            loadingEl.style.display = 'block';
            resultEl.style.display = 'none';
            
            try {
                const params = new URLSearchParams();
                if (query) params.append('q', query);
                if (type) params.append('type', type);
                
                const response = await fetch('/search?' + params.toString());
                const data = await response.json();
                resultEl.textContent = JSON.stringify(data, null, 2);
                resultEl.style.display = 'block';
            } catch (error) {
                resultEl.textContent = '错误: ' + error.message;
                resultEl.style.display = 'block';
            } finally {
                loadingEl.style.display = 'none';
            }
        }

        async function getStats() {
            const loadingEl = document.getElementById('stats-loading');
            const resultEl = document.getElementById('stats-result');
            
            loadingEl.style.display = 'block';
            resultEl.style.display = 'none';
            
            try {
                const response = await fetch('/stats');
                const data = await response.json();
                resultEl.textContent = JSON.stringify(data, null, 2);
                resultEl.style.display = 'block';
                
                // 更新仪表板
                updateDashboard();
            } catch (error) {
                resultEl.textContent = '错误: ' + error.message;
                resultEl.style.display = 'block';
            } finally {
                loadingEl.style.display = 'none';
            }
        }

        async function updateDashboard() {
            try {
                const response = await fetch('/stats');
                const data = await response.json();
                
                if (data.success && data.stats) {
                    document.getElementById('total-files').textContent = data.stats.total_files || 0;
                    document.getElementById('total-size').textContent = data.stats.total_size_formatted || '-';
                    document.getElementById('file-types').textContent = data.stats.file_types ? data.stats.file_types.length : 0;
                }
            } catch (error) {
                console.error('更新仪表板失败:', error);
            }
        }

        // 回车键搜索
        document.getElementById('search-query').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchFiles();
            }
        });
    </script>
</body>
</html>
        `;
    });
    
    // 重建索引
    server.post('/rebuild', async (request, reply) => {
        try {
            const result = await indexer.rebuildIndex();
            return {
                success: true,
                message: '索引重建成功',
                ...result
            };
        } catch (error) {
            reply.code(500);
            return {
                success: false,
                message: '索引重建失败',
                error: error.message
            };
        }
    });
    
    // 搜索文件
    server.get('/search', async (request, reply) => {
        try {
            const { q = '', type = '', limit = 100, offset = 0 } = request.query;
            const result = indexer.searchFiles(q, type, parseInt(limit), parseInt(offset));
            
            return {
                success: true,
                ...result
            };
        } catch (error) {
            reply.code(500);
            return {
                success: false,
                message: '搜索失败',
                error: error.message
            };
        }
    });
    
    // 获取统计信息
    server.get('/stats', async (request, reply) => {
        try {
            const stats = indexer.getStats();
            return {
                success: true,
                stats
            };
        } catch (error) {
            reply.code(500);
            return {
                success: false,
                message: '获取统计信息失败',
                error: error.message
            };
        }
    });
    
    // 优雅关闭
    process.on('SIGINT', async () => {
        console.log('正在关闭服务器...');
        await indexer.closeDatabase();
        await server.close();
        process.exit(0);
    });
    
    return { server, indexer };
}

/**
 * 启动服务器
 */
async function startServer() {
    try {
        console.log('正在启动文件索引服务器...');
        const { server } = await createServer();
        const port = process.env.FILE_INDEXER_PORT || 3002;
        
        console.log(`尝试在端口 ${port} 启动服务器...`);
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`文件索引服务已启动: http://localhost:${port}`);
        console.log('API接口:');
        console.log(`  - GET http://localhost:${port}/ - 服务状态`);
        console.log(`  - POST http://localhost:${port}/rebuild - 重建索引`);
        console.log(`  - GET http://localhost:${port}/search?q=关键词&type=文件类型 - 搜索文件`);
        console.log(`  - GET http://localhost:${port}/stats - 统计信息`);
    } catch (error) {
        console.error('启动服务器失败:', error);
        console.error('错误堆栈:', error.stack);
        process.exit(1);
    }
}

// 如果直接运行此脚本，启动服务器
const currentFile = fileURLToPath(import.meta.url);
const runFile = process.argv[1];
console.log('当前文件:', currentFile);
console.log('运行文件:', runFile);

if (currentFile === runFile || path.resolve(currentFile) === path.resolve(runFile)) {
    console.log('检测到直接运行脚本，启动服务器...');
    startServer();
} else {
    console.log('脚本被导入，不自动启动服务器');
}

export { FileIndexer, createServer };