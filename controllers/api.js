/**
 * API控制器 - 处理drpy-node的核心API路由
 *
 * 功能说明：
 * 1. 提供统一的API接口，支持多种引擎（drpyS、hipy、xbpq、catvod）
 * 2. 处理视频源的首页、分类、详情、搜索、播放等操作
 * 3. 提供代理服务和解析服务
 * 4. 支持超时控制和错误处理
 *
 * 主要路由：
 * - /api/:module - 主API接口，支持GET/POST
 * - /proxy/:module/* - 代理接口
 * - /parse/:jx - 解析接口
 *
 * @author drpy-node
 * @version 1.0.0
 */

import path from 'path';
import {existsSync} from 'fs';
import {base64Decode} from '../libs_drpy/crypto-util.js';
import {ENV} from "../utils/env.js";
import {validatePwd} from "../utils/api_validate.js";
import {startJsonWatcher, getApiEngine} from "../utils/api_helper.js";
import * as drpyS from '../libs/drpyS.js';
import hipy from '../libs/hipy.js';
import php from '../libs/php.js';
import xbpq from '../libs/xbpq.js';
import catvod from '../libs/catvod.js';

/**
 * 支持的引擎映射表
 * 包含drpyS、hipy、phipy、xbpq、catvod五种引擎
 */
const ENGINES = {
    drpyS,
    hipy,
    php,
    xbpq,
    catvod,
};

/**
 * 创建带超时的Promise包装函数
 * 为API操作添加超时控制，防止长时间阻塞
 *
 * @param {Promise} promise - 要包装的Promise对象
 * @param {number|null} timeoutMs - 超时时间（毫秒），null则使用默认值
 * @param {string} operation - 操作描述，用于错误信息
 * @param {string|null} invokeMethod - 调用方法类型，用于确定超时时间
 * @returns {Promise} 包装后的Promise，会在超时时reject
 */
function withTimeout(promise, timeoutMs = null, operation = 'API操作', invokeMethod = null) {
    let defaultTimeout;

    // 根据invokeMethod确定超时时间
    if (invokeMethod === 'action') {
        // action接口使用专用超时时间，默认60秒
        defaultTimeout = parseInt(process.env.API_ACTION_TIMEOUT || '60') * 1000;
    } else {
        // 其他接口使用默认超时时间，默认20秒
        defaultTimeout = parseInt(process.env.API_TIMEOUT || '20') * 1000;
    }

    const actualTimeout = timeoutMs || defaultTimeout;

    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`${operation}超时 (${actualTimeout}ms)`));
            }, actualTimeout);
        })
    ]);
}

/**
 * Fastify插件主函数
 * 注册所有API路由和中间件
 *
 * @param {Object} fastify - Fastify实例
 * @param {Object} options - 插件选项，包含jsonDir、jxDir等配置
 * @param {Function} done - 插件完成回调
 */
export default (fastify, options, done) => {
    // 启动JSON监听器，监控规则文件变化
    startJsonWatcher(ENGINES, options.jsonDir);

    /**
     * 主API路由 - 处理视频源的各种操作
     * 支持GET和POST请求，根据query参数执行不同逻辑
     *
     * 支持的操作：
     * - 默认：返回首页和推荐内容
     * - play：播放链接解析
     * - ac+t：分类列表
     * - ac+ids：详情信息
     * - ac+action：动作处理
     * - wd：搜索
     * - refresh：强制刷新
     */
    fastify.route({
        method: ['GET', 'POST'], // 同时支持 GET 和 POST
        url: '/api/:module',
        preHandler: validatePwd, // 密码验证中间件
        schema: {
            consumes: ['application/json', 'application/x-www-form-urlencoded'], // 声明支持的内容类型
        },
        handler: async (request, reply) => {
            const moduleName = request.params.module;
            const method = request.method.toUpperCase();

            // 根据请求方法选择参数来源
            const query = method === 'GET' ? request.query : Object.assign(request.query || {}, request.body);

            // 获取API引擎和模块路径
            let {apiEngine, moduleDir, _ext, modulePath} = getApiEngine(ENGINES, moduleName, query, options);

            // 检查模块文件是否存在
            if (!existsSync(modulePath)) {
                const error_msg=`Module ${moduleName} not found`;
                console.error(error_msg);
                fastify.log.error(error_msg);
                reply.status(404).send({error: error_msg});
                return;
            }

            // 获取模块扩展参数
            const moduleExt = query.extend || '';

            // 构建请求相关的URL信息
            const protocol = request.headers['x-forwarded-proto'] || (request.socket.encrypted ? 'https' : 'http');
            const hostname = request.hostname;
            const wsName = hostname.replace(`:${options.PORT}`, `:${options.WsPORT}`);
            const requestHost = `${protocol}://${hostname}`;
            const publicUrl = `${protocol}://${hostname}/public/`;
            const jsonUrl = `${protocol}://${hostname}/json/`;
            const httpUrl = `${protocol}://${hostname}/http`;
            const imageApi = `${protocol}://${hostname}/image`;
            const mediaProxyUrl = `${protocol}://${hostname}/mediaProxy`;
            const webdavProxyUrl = `${protocol}://${hostname}/webdav/`;
            const ftpProxyUrl = `${protocol}://${hostname}/ftp/`;
            const hostUrl = `${hostname.split(':')[0]}`;
            // const fServer = fastify.server;
            const fServer = options.wsApp.server;

            /**
             * 构建环境对象
             * 为规则执行提供必要的环境信息
             *
             * @param {string} moduleName - 模块名称
             * @returns {Object} 环境对象，包含各种URL和配置
             */
            function getEnv(moduleName) {
                const proxyUrl = `${protocol}://${hostname}/proxy/${moduleName}/?do=${query.do || 'ds'}&extend=${encodeURIComponent(moduleExt)}`;
                const getProxyUrl = function () {
                    return proxyUrl
                };
                return {
                    requestHost,
                    proxyUrl,
                    publicUrl,
                    jsonUrl,
                    httpUrl,
                    imageApi,
                    mediaProxyUrl,
                    webdavProxyUrl,
                    ftpProxyUrl,
                    hostUrl,
                    hostname,
                    wsName,
                    fServer,
                    getProxyUrl,
                    ext: moduleExt
                }
            }

            const env = getEnv(moduleName);

            /**
             * 动态获取规则对象
             * 支持跨规则调用，为规则提供调用其他规则的能力
             *
             * @param {string} _moduleName - 目标模块名称
             * @returns {Object|null} 规则对象，包含callRuleFn方法
             */
            env.getRule = async function (_moduleName) {
                const _modulePath = path.join(moduleDir, `${_moduleName}${_ext}`);
                if (!existsSync(_modulePath)) {
                    return null;
                }
                const _env = getEnv(_moduleName);
                const RULE = await withTimeout(
                    apiEngine.getRule(_modulePath, _env),
                    null,
                    `获取规则[${_moduleName}]`
                );

                /**
                 * 规则函数调用方法
                 * 提供统一的规则方法调用接口
                 *
                 * @param {string} _method - 方法名称
                 * @param {Array} _args - 方法参数
                 * @returns {*} 方法执行结果
                 */
                RULE.callRuleFn = async function (_method, _args) {
                    let invokeMethod = null;

                    // 方法名映射到标准接口
                    switch (_method) {
                        case 'class_parse':
                            invokeMethod = 'home';
                            break;
                        case '推荐':
                            invokeMethod = 'homeVod';
                            break;
                        case '一级':
                            invokeMethod = 'category';
                            break;
                        case '二级':
                            invokeMethod = 'detail';
                            break;
                        case '搜索':
                            invokeMethod = 'search';
                            break;
                        case 'lazy':
                            invokeMethod = 'play';
                            break;
                        case 'proxy_rule':
                            invokeMethod = 'proxy';
                            break;
                        case 'action':
                            invokeMethod = 'action';
                            break;
                    }

                    // 如果没有映射的方法，直接调用规则对象的方法
                    if (!invokeMethod) {
                        if (typeof RULE[_method] !== 'function') {
                            return null
                        } else {
                            return await withTimeout(
                                RULE[_method],
                                null,
                                `规则方法[${_method}]`
                            )
                        }
                    }

                    // 调用映射后的标准接口
                    return await withTimeout(
                        apiEngine[invokeMethod](_modulePath, _env, ..._args),
                        null,
                        `规则调用[${_method}]`,
                        invokeMethod
                    )
                };
                return RULE
            };

            // 获取页码参数
            const pg = Number(query.pg) || 1;

            try {
                // 根据 query 参数决定执行逻辑

                // 处理播放逻辑
                if ('play' in query) {
                    const result = await withTimeout(
                        apiEngine.play(modulePath, env, query.flag, query.play),
                        null,
                        `播放接口[${moduleName}]`
                    );
                    return reply.send(result);
                }

                // 处理分类逻辑
                if ('ac' in query && 't' in query) {
                    let ext = query.ext;
                    let extend = {};

                    // 解析筛选参数
                    if (ext) {
                        try {
                            extend = JSON.parse(base64Decode(ext))
                        } catch (e) {
                            fastify.log.error(`筛选参数错误:${e.message}`);
                        }
                    }

                    const result = await withTimeout(
                        apiEngine.category(modulePath, env, query.t, pg, 1, extend),
                        null,
                        `分类接口[${moduleName}]`
                    );
                    return reply.send(result);
                }

                // 处理详情逻辑
                if ('ac' in query && 'ids' in query) {
                    if (method === 'POST') {
                        fastify.log.info(`[${moduleName}] 二级已接收post数据: ${query.ids}`);
                    }

                    const result = await withTimeout(
                        apiEngine.detail(modulePath, env, query.ids.split(',')),
                        null,
                        `详情接口[${moduleName}]`
                    );
                    return reply.send(result);
                }

                // 处理动作逻辑
                if ('ac' in query && 'action' in query) {
                    const result = await withTimeout(
                        apiEngine.action(modulePath, env, query.action, query.value),
                        null,
                        `动作接口[${moduleName}]`,
                        'action'
                    );
                    return reply.send(result);
                }

                // 处理搜索逻辑
                if ('wd' in query) {
                    const quick = 'quick' in query ? query.quick : 0;
                    const result = await withTimeout(
                        apiEngine.search(modulePath, env, query.wd, quick, pg),
                        null,
                        `搜索接口[${moduleName}]`
                    );
                    return reply.send(result);
                }

                // 处理强制刷新初始化逻辑
                if ('refresh' in query) {
                    const refreshedObject = await withTimeout(
                        apiEngine.init(modulePath, env, true),
                        null,
                        `初始化接口[${moduleName}]`
                    );
                    const {context, ...responseObject} = refreshedObject;
                    return reply.send(responseObject);
                }

                // 默认逻辑，返回 home + homeVod 接口
                if (!('filter' in query)) {
                    query.filter = 1
                }

                const filter = 'filter' in query ? query.filter : 1;

                // 获取首页数据
                const resultHome = await withTimeout(
                    apiEngine.home(modulePath, env, filter),
                    null,
                    `首页接口[${moduleName}]`
                );

                // 获取推荐数据
                const resultHomeVod = await withTimeout(
                    apiEngine.homeVod(modulePath, env),
                    null,
                    `推荐接口[${moduleName}]`
                );

                // 合并结果
                let result = {
                    ...resultHome,
                };

                // 如果有推荐数据，添加到结果中
                if (Array.isArray(resultHomeVod) && resultHomeVod.length > 0) {
                    Object.assign(result, {list: resultHomeVod})
                }

                reply.send(result);

            } catch (error) {
                // 错误处理和日志记录
                const error_msg=`Failed to process module ${moduleName}: ${error.message}`;
                console.error(error_msg);
                fastify.log.error(error_msg);
                reply.status(500).send({error: error_msg});
            }
        }
    });

    /**
     * 代理路由 - 处理模块的代理请求
     * 支持流媒体代理、文件代理等功能
     *
     * 路径格式：/proxy/:module/*
     * 支持Range请求头，用于视频流的断点续传
     */
    fastify.get('/proxy/:module/*', async (request, reply) => {
        const moduleName = request.params.module;
        const query = request.query; // 获取 query 参数

        // 获取API引擎和模块路径
        let {apiEngine, modulePath} = getApiEngine(ENGINES, moduleName, query, options);

        // 检查模块文件是否存在
        if (!existsSync(modulePath)) {
            const error_msg=`Module ${moduleName} not found`;
            console.error(error_msg);
            fastify.log.error(error_msg);
            reply.status(404).send({error: error_msg});
            return;
        }

        const proxyPath = request.params['*']; // 捕获整个路径
        fastify.log.info(`try proxy for ${moduleName} -> ${proxyPath}: ${JSON.stringify(query)}`);

        const rangeHeader = request.headers.range; // 获取客户端的 Range 请求头
        const moduleExt = query.extend || '';

        // 构建请求相关的URL信息
        const protocol = request.headers['x-forwarded-proto'] || (request.socket.encrypted ? 'https' : 'http');
        const hostname = request.hostname;
        const wsName = hostname.replace(`:${options.PORT}`, `:${options.WsPORT}`);
        const requestHost = `${protocol}://${hostname}`;
        const publicUrl = `${protocol}://${hostname}/public/`;
        const jsonUrl = `${protocol}://${hostname}/json/`;
        const httpUrl = `${protocol}://${hostname}/http`;
        const imageApi = `${protocol}://${hostname}/image`;
        const mediaProxyUrl = `${protocol}://${hostname}/mediaProxy`;
        const webdavProxyUrl = `${protocol}://${hostname}/webdav/`;
        const ftpProxyUrl = `${protocol}://${hostname}/ftp/`;
        const hostUrl = `${hostname.split(':')[0]}`;
        // const fServer = fastify.server;
        const fServer = options.wsApp.server;

        /**
         * 构建代理环境对象
         * 为代理操作提供必要的环境信息
         *
         * @param {string} moduleName - 模块名称
         * @returns {Object} 环境对象，包含代理路径和各种URL
         */
        function getEnv(moduleName) {
            const proxyUrl = `${protocol}://${hostname}/proxy/${moduleName}/?do=${query.do || 'ds'}&extend=${encodeURIComponent(moduleExt)}`;
            const getProxyUrl = function () {
                return proxyUrl
            };
            return {
                requestHost,
                proxyUrl,
                proxyPath, // 代理路径
                publicUrl,
                jsonUrl,
                httpUrl,
                imageApi,
                mediaProxyUrl,
                webdavProxyUrl,
                ftpProxyUrl,
                hostUrl,
                hostname,
                wsName,
                fServer,
                getProxyUrl,
                ext: moduleExt
            }
        }

        const env = getEnv(moduleName);

        try {
            // 调用模块的代理方法
            const backRespList = await withTimeout(
                apiEngine.proxy(modulePath, env, query),
                null,
                `代理接口[${moduleName}]`
            );

            // 解析代理响应
            const statusCode = backRespList[0];
            const mediaType = backRespList[1] || 'application/octet-stream';
            let content = backRespList[2] || '';
            const headers = backRespList.length > 3 ? backRespList[3] : null;
            const toBytes = backRespList.length > 4 ? backRespList[4] : null;

            // 如果需要转换为字节内容(尝试base64转bytes)
            if (toBytes === 1) {
                try {
                    if (content.includes('base64,')) {
                        content = unescape(content.split("base64,")[1]);
                    }
                    content = Buffer.from(content, 'base64');
                } catch (e) {
                    const error_msg = `Local Proxy toBytes error: ${e}`;
                    fastify.log.error(error_msg);
                    console.error(error_msg);
                }
            }
            // 流代理 - 重定向到媒体代理服务
            else if (toBytes === 2 && content.startsWith('http')) {
                const new_headers = {
                    ...(headers ? headers : {}),
                    ...(rangeHeader ? {Range: rangeHeader} : {}), // 添加 Range 请求头
                }

                // 构建重定向URL，使用媒体代理服务
                const redirectUrl = `/mediaProxy?url=${encodeURIComponent(content)}&headers=${encodeURIComponent(JSON.stringify(new_headers))}&thread=${ENV.get('thread') || 1}`;

                // 执行重定向
                return reply.redirect(redirectUrl);
            }

            // 根据媒体类型来决定如何设置字符编码
            if (typeof content === 'string') {
                // 如果返回的是文本内容（例如 JSON 或字符串）
                if (mediaType && (mediaType.includes('text') || mediaType === 'application/json')) {
                    // 对于文本类型，设置 UTF-8 编码
                    reply
                        .code(statusCode)
                        .type(`${mediaType}; charset=utf-8`)  // 设置编码为 UTF-8
                        .headers(headers || {})  // 如果有headers, 则加上
                        .send(content);
                } else {
                    // 对于其他类型的文本（例如 XML），直接返回，不指定 UTF-8 编码
                    reply
                        .code(statusCode)
                        .type(mediaType)
                        .headers(headers || {})
                        .send(content);
                }
            } else {
                // 如果返回的是二进制内容（例如图片或其他文件）
                reply
                    .code(statusCode)
                    .type(mediaType)  // 使用合适的媒体类型，如 image/png
                    .headers(headers || {})
                    .send(content);
            }

        } catch (error) {
            const error_msg = `Error proxy module ${moduleName}:${error.message}`;
            fastify.log.error(error_msg);
            console.error(error_msg);
            reply.status(500).send({error: error_msg});
        }
    });

    /**
     * 解析路由 - 处理视频链接解析
     * 用于解析各种视频网站的播放链接
     *
     * 路径格式：/parse/:jx
     * 支持多种解析器，返回解析后的播放链接
     */
    fastify.get('/parse/:jx', async (request, reply) => {
        let t1 = (new Date()).getTime(); // 记录开始时间
        const jxName = request.params.jx;
        const query = request.query; // 获取 query 参数

        // 构建解析器文件路径
        const jxPath = path.join(options.jxDir, `${jxName}.js`);

        // 检查解析器文件是否存在
        if (!existsSync(jxPath)) {
            const error_msg = `解析 ${jxName} not found`;
            fastify.log.error(error_msg);
            console.error(error_msg);
            return reply.status(404).send({error: error_msg});
        }

        const moduleExt = query.extend || '';

        // 构建请求相关的URL信息
        const protocol = request.headers['x-forwarded-proto'] || (request.socket.encrypted ? 'https' : 'http');
        const hostname = request.hostname;
        const wsName = hostname.replace(`:${options.PORT}`, `:${options.WsPORT}`);
        const requestHost = `${protocol}://${hostname}`;
        const publicUrl = `${protocol}://${hostname}/public/`;
        const jsonUrl = `${protocol}://${hostname}/json/`;
        const httpUrl = `${protocol}://${hostname}/http`;
        const imageApi = `${protocol}://${hostname}/image`;
        const mediaProxyUrl = `${protocol}://${hostname}/mediaProxy`;
        const webdavProxyUrl = `${protocol}://${hostname}/webdav/`;
        const ftpProxyUrl = `${protocol}://${hostname}/ftp/`;
        const hostUrl = `${hostname.split(':')[0]}`;
        // const fServer = fastify.server;
        const fServer = options.wsApp.server;

        /**
         * 构建解析环境对象
         * 为解析操作提供必要的环境信息
         *
         * @param {string} moduleName - 模块名称（这里为空字符串）
         * @returns {Object} 环境对象，包含各种URL和配置
         */
        function getEnv(moduleName) {
            // 构建代理URL，将parse路径转换为proxy路径
            const proxyUrl = `${protocol}://${hostname}${request.url}`.split('?')[0].replace('/parse/', '/proxy/') + `/?do=${query.do || "ds"}&extend=${encodeURIComponent(moduleExt)}`;
            const getProxyUrl = function () {
                return proxyUrl
            };
            return {
                requestHost,
                proxyUrl,
                publicUrl,
                jsonUrl,
                httpUrl,
                imageApi,
                mediaProxyUrl,
                webdavProxyUrl,
                ftpProxyUrl,
                hostUrl,
                hostname,
                wsName,
                getProxyUrl,
                fServer,
                ext: moduleExt
            }
        }

        const env = getEnv('');

        try {
            // 调用drpyS引擎的解析方法
            const backResp = await withTimeout(
                drpyS.jx(jxPath, env, query),
                null,
                `解析接口[${jxName}]`
            );

            const statusCode = 200;
            const mediaType = 'application/json; charset=utf-8';

            // 处理对象类型的响应
            if (typeof backResp === 'object') {
                // 设置默认的状态码
                if (!backResp.code) {
                    let statusCode = backResp.url && backResp.url !== query.url ? 200 : 404;
                    backResp.code = statusCode
                }

                // 设置默认的消息
                if (!backResp.msg) {
                    let msgState = backResp.url && backResp.url !== query.url ? '成功' : '失败';
                    backResp.msg = `${jxName}解析${msgState}`;
                }

                // 计算耗时
                let t2 = (new Date()).getTime();
                backResp.cost = t2 - t1;

                let backRespSend = JSON.stringify(backResp);
                console.log(backRespSend);
                return reply.code(statusCode).type(`${mediaType}; charset=utf-8`).send(backRespSend);
            }
            // 处理字符串类型的响应
            else if (typeof backResp === 'string') {
                // 处理重定向响应
                if (backResp.startsWith('redirect://')) {
                    return reply.redirect(backResp.split('redirect://')[1]);
                }

                // 构建标准响应格式
                let statusCode = backResp && backResp !== query.url ? 200 : 404;
                let msgState = backResp && backResp !== query.url ? '成功' : '失败';
                let t2 = (new Date()).getTime();

                let result = {
                    code: statusCode,
                    url: backResp,
                    msg: `${jxName}解析${msgState}`,
                    cost: t2 - t1
                }

                let backRespSend = JSON.stringify(result);
                console.log(backRespSend);
                return reply.code(statusCode).type(`${mediaType}; charset=utf-8`).send(backRespSend);
            } else {
                // 其他类型的响应，返回失败
                const error_msg = `${jxName}解析失败`;
                fastify.log.error(error_msg);
                console.error(error_msg);
                return reply.status(404).send({error: error_msg});
            }

        } catch (error) {
            // 错误处理和日志记录
            const error_msg = `Failed to proxy jx ${jxName}: ${error.message}`;
            fastify.log.error(error_msg);
            console.error(error_msg);
            reply.status(500).send({error: error_msg});
        }
    });

    // 插件注册完成
    done();
};
