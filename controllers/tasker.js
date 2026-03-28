/**
 * 定时任务管理器
 * 
 * 功能描述：
 * 这是一个Fastify插件，用于管理和执行定时任务脚本。
 * 支持自动扫描scripts目录下的脚本文件，并按指定间隔执行。
 * 
 * 主要功能：
 * 1. 脚本自动发现 - 扫描scripts目录下的.js和.mjs文件
 * 2. 定时执行 - 按配置的时间间隔自动执行所有脚本
 * 3. 手动执行 - 提供API接口手动触发脚本执行
 * 4. 状态查询 - 提供任务运行状态查询接口
 * 5. 脚本过滤 - 支持排除指定的脚本文件
 * 
 * 环境变量配置：
 * - ENABLE_TASKER: 是否启用定时任务（0/1）
 * - TASKER_INTERVAL: 任务执行间隔（毫秒，默认30分钟）
 * 
 * API接口：
 * - GET /execute-now: 手动执行所有脚本
 * - GET /status: 查询任务运行状态
 * 
 * 脚本要求：
 * - 脚本必须导出run函数：export default { run: async (fastify) => {} }
 * - 支持ES模块(.mjs)和CommonJS(.js)格式
 * 
 * 使用场景：
 * - 数据定时同步
 * - 定时清理任务
 * - 监控和报告
 * - 自动化运维脚本
 * 
 * @author drpy-node
 * @version 1.0.0
 */

import path from 'path';
import {readdir, stat} from 'fs/promises';
import {pathToFileURL} from 'url'; // 用于将文件路径转换为URL格式，支持ES模块动态导入

// 脚本排除列表 - 这些脚本不会被自动执行
const scripts_exclude = ['moontv.mjs', 'kzz.mjs'];

// 从环境变量读取配置
const enable_tasker = Number(process.env.ENABLE_TASKER) || 0;                    // 是否启用定时任务
const tasker_interval = Number(process.env.TASKER_INTERVAL) || 30 * 60 * 1000;  // 任务执行间隔，默认30分钟

/**
 * Fastify插件 - 定时任务管理器
 * 注册定时任务相关的路由和功能
 * 
 * @param {Object} fastify - Fastify实例
 * @param {Object} options - 插件选项
 * @param {Function} done - 完成回调
 */
export default (fastify, options, done) => {
    // 插件配置
    const config = {
        scriptsDir: path.join(options.rootDir, 'scripts'), // 脚本目录路径
        interval: tasker_interval,                          // 执行间隔
    };

    /**
     * 加载并执行单个脚本
     * 使用ES模块动态导入机制加载脚本
     * 
     * @param {string} scriptPath - 脚本文件的完整路径
     * @returns {Promise<void>}
     * 
     * @example
     * await executeScript('/path/to/script.mjs');
     */
    async function executeScript(scriptPath) {
        try {
            fastify.log.info(`Executing script: ${scriptPath}`);

            // 将文件路径转换为URL格式，以支持ES模块导入
            const scriptUrl = pathToFileURL(scriptPath).href;
            
            // 动态导入ES模块
            const module = await import(scriptUrl);
            const script = module.default || module;

            // 检查脚本是否导出了run函数
            if (typeof script.run === 'function') {
                // 执行脚本的run函数，传入fastify实例
                await script.run(fastify);
            } else {
                fastify.log.warn(`Script ${scriptPath} does not export a 'run' function`);
            }
        } catch (err) {
            // 记录脚本执行错误，但不中断其他脚本的执行
            fastify.log.error(`Error executing script ${scriptPath}: ${err}`);
        }
    }

    /**
     * 执行目录下所有符合条件的脚本
     * 扫描scripts目录，过滤并执行所有有效的脚本文件
     * 
     * @returns {Promise<void>}
     */
    async function executeAllScripts() {
        try {
            fastify.log.info('Starting script execution...');

            // 读取脚本目录下的所有文件
            const files = await readdir(config.scriptsDir);

            // 遍历所有文件
            for (const file of files) {
                const filePath = path.join(config.scriptsDir, file);
                const fileStat = await stat(filePath);

                // 文件过滤条件：
                // 1. 必须是文件（非目录）
                // 2. 扩展名必须是.mjs或.js
                // 3. 不在排除列表中
                if (fileStat.isFile() && 
                    ['.mjs', '.js'].includes(path.extname(file)) && 
                    !scripts_exclude.includes(file)) {
                    
                    console.log(`Starting script execution:${file}| ${filePath}`);
                    await executeScript(filePath);
                }
            }

            fastify.log.info('Script execution completed');
        } catch (err) {
            fastify.log.error(`Error reading scripts directory:${err}`);
        }
    }

    /**
     * 启动定时任务调度器
     * 立即执行一次所有脚本，然后设置定时器按间隔重复执行
     */
    function startScheduledTasks() {
        // 立即执行一次所有脚本
        executeAllScripts().then(r => {
            // 执行完成的回调（当前为空）
        });
        
        // 设置定时器，按指定间隔重复执行
        setInterval(executeAllScripts, config.interval);

        fastify.log.info(`Scheduled tasks started, running every ${config.interval / 1000} seconds`);
    }

    /**
     * 手动执行脚本接口
     * GET /execute-now
     * 立即执行所有脚本，不等待定时器
     */
    fastify.get('/execute-now', async (request, reply) => {
        await executeAllScripts();
        return {message: 'Scripts executed manually'};
    });

    /**
     * 任务状态查询接口
     * GET /status
     * 返回当前任务的运行状态和时间信息
     */
    fastify.get('/status', async (request, reply) => {
        return {
            running: true,                                      // 任务是否正在运行
            lastRun: new Date(),                               // 最后执行时间（当前时间）
            nextRun: new Date(Date.now() + config.interval)    // 下次执行时间
        };
    });
    
    // 根据环境变量决定是否启动定时任务
    if (enable_tasker) {
        console.log('enable_tasker:', enable_tasker);
        console.log(`tasker_interval: ${tasker_interval} (ms) => ${tasker_interval / 60000}(m)`);
        
        // 启动定时任务调度器
        startScheduledTasks();
    }
    
    // 插件初始化完成
    done();
};