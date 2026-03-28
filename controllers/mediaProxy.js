import {base64Decode, md5} from '../libs_drpy/crypto-util.js';
import '../utils/random-http-ua.js'
import {keysToLowerCase} from '../utils/utils.js';
import {ENV} from "../utils/env.js";
import chunkStream, {testSupport} from '../utils/chunk.js';
import createAxiosInstance from '../utils/createAxiosAgent.js';

// 全局资源管理器
const globalResourceManager = {
    activeStreams: new Set(),
    activeRequests: new Set(),
    
    addStream: function(stream) {
        this.activeStreams.add(stream);
        stream.on('close', () => this.activeStreams.delete(stream));
        stream.on('end', () => this.activeStreams.delete(stream));
        stream.on('error', () => this.activeStreams.delete(stream));
    },
    
    addRequest: function(requestId) {
        this.activeRequests.add(requestId);
    },
    
    removeRequest: function(requestId) {
        this.activeRequests.delete(requestId);
    },
    
    cleanup: function() {
        // 清理所有活跃的流
        this.activeStreams.forEach(stream => {
            if (stream && !stream.destroyed) {
                stream.destroy();
            }
        });
        this.activeStreams.clear();
        this.activeRequests.clear();
    },
    
    getStats: function() {
        return {
            activeStreams: this.activeStreams.size,
            activeRequests: this.activeRequests.size,
            memoryUsage: process.memoryUsage()
        };
    }
};

// 定期清理和内存监控
setInterval(() => {
    const stats = globalResourceManager.getStats();
    if (stats.activeStreams > 50 || stats.activeRequests > 100) {
        console.warn('[MediaProxy] High resource usage detected:', stats);
    }
    
    // 强制垃圾回收（如果可用）
    if (global.gc && stats.memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        global.gc();
        console.log('[MediaProxy] Forced garbage collection due to high memory usage');
    }
}, 30000); // 每30秒检查一次

const maxSockets = 32; // 减少最大连接数以防止连接池过大
const _axios = createAxiosInstance({
        maxSockets: maxSockets,
        rejectUnauthorized: true, // 不忽略证书错误
        keepAlive: true,
        keepAliveMsecs: 30000, // 30秒保持连接
        maxFreeSockets: 10, // 最大空闲连接数
        timeout: 30000, // 30秒超时
        freeSocketTimeout: 15000, // 空闲连接超时时间
    },
);

export default (fastify, options, done) => {
    // 用法同 https://github.com/Zhu-zi-a/mediaProxy
    fastify.all('/mediaProxy', async (request, reply) => {
        const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        globalResourceManager.addRequest(requestId);
        
        // 请求完成时清理
        const cleanup = () => {
            globalResourceManager.removeRequest(requestId);
        };
        
        // 监听请求结束事件
        request.raw.on('close', cleanup);
        request.raw.on('aborted', cleanup);
        reply.raw.on('finish', cleanup);
        reply.raw.on('close', cleanup);

        const {thread = 1, form = 'urlcode', url, header, size = '128K', randUa = 0} = request.query;

        // console.log('url:', url)
        // console.log('header:', header)

        // Check if the URL parameter is missing
        if (!url) {
            cleanup();
            return reply.code(400).send({error: 'Missing required parameter: url'});
        }

        try {
            // Decode URL and headers based on the form type
            const decodedUrl = form === 'base64' ? base64Decode(url) : url;
            const decodedHeader = header
                ? JSON.parse(form === 'base64' ? base64Decode(header) : header)
                : {};

            // Call the proxy function, passing the decoded URL and headers
            // return await proxyStreamMediaMulti(decodedUrl, decodedHeader, request, reply, thread, size, randUa);
            // return await chunkStream(request, reply, decodedUrl, ids[1], Object.assign({Cookie: cookie}, baseHeader));
            if (ENV.get('play_proxy_mode', '1') !== '2') { // 2磁盘加速 其他都是内存加速
                console.log('[mediaProxy] proxyStreamMediaMulti 内存加速:chunkSize:', sizeToBytes(size));
                return await proxyStreamMediaMulti(decodedUrl, decodedHeader, request, reply, thread, size, randUa);
            } else {
                console.log('[mediaProxy] chunkStream 磁盘加速 chunkSize:', sizeToBytes('256K'));
                return await chunkStream(request, reply, decodedUrl, md5(decodedUrl), decodedHeader,
                    Object.assign({chunkSize: 1024 * 256, poolSize: 5, timeout: 1000 * 10}, {
                        // chunkSize: sizeToBytes(size),
                        poolSize: thread
                    })
                );
            }
        } catch (error) {
            // fastify.log.error(error);
            fastify.log.error(error.message);
            cleanup();
            if (!reply.sent && !reply.raw.destroyed) {
                reply.code(500).send({error: error.message});
            }
        }
    });

    done();
};

// Helper function for range-based chunk downloading
async function fetchStream(url, userHeaders, start, end, randUa) {
    let stream = null;
    const headers = keysToLowerCase({
        ...userHeaders,
    });
    // 添加accept属性防止获取网页源码编码不正确问题
    if (!Object.keys(headers).includes('accept')) {
        headers['accept'] = '*/*';
    }
    try {
        const response = await _axios.get(url, {
            headers: {
                ...headers,
                ...randUa ? {
                    'User-Agent': randomUa.generateUa(1, {
                        // device: ['mobile', 'pc'],
                        device: ['pc'],
                        mobileOs: ['android']
                    })
                } : {},
                Range: `bytes=${start}-${end}`,
            },
            responseType: 'stream',
            timeout: 30000, // 30秒超时
        });

        stream = response.data;
        
        // 添加错误处理监听器
        stream.on('error', (error) => {
            console.error(`[fetchStream] Stream error for range ${start}-${end}:`, error.message);
            if (!stream.destroyed) {
                stream.destroy();
            }
        });

        // 添加超时处理
        const timeoutId = setTimeout(() => {
            if (!stream.destroyed) {
                console.warn(`[fetchStream] Stream timeout for range ${start}-${end}`);
                stream.destroy();
            }
        }, 60000); // 60秒超时

        // 清理超时定时器
        stream.on('end', () => clearTimeout(timeoutId));
        stream.on('close', () => clearTimeout(timeoutId));
        stream.on('error', () => clearTimeout(timeoutId));

        return {stream: stream, headers: response.headers};
    } catch (error) {
        console.error(`[fetchStream] Error fetching range ${start}-${end}:`, error.message);
        
        // 确保流被正确销毁
        if (stream && !stream.destroyed) {
            stream.destroy();
        }
        
        throw error;
    }
}

async function proxyStreamMedia(mediaUrl, reqHeaders, request, reply, randUa = 0) {
    let responseStream = null;
    const eventListeners = [];
    
    // 添加事件监听器的辅助函数
    const addListener = (target, event, listener) => {
        eventListeners.push({target, event, listener});
        target.on(event, listener);
    };
    
    // 清理所有事件监听器的函数
    const cleanupListeners = () => {
        eventListeners.forEach(({target, event, listener}) => {
            if (target && typeof target.removeListener === 'function') {
                target.removeListener(event, listener);
            }
        });
        eventListeners.length = 0;
    };
    
    try {
        // 随机生成 UA（如果启用 randUa 参数）
        const randHeaders = randUa
            ? Object.assign({}, reqHeaders, {
                'User-Agent': randomUa.generateUa(1, {
                    // device: ['mobile', 'pc'],
                    device: ['pc'],
                    mobileOs: ['android']
                })
            })
            : reqHeaders;

        const headers = keysToLowerCase({
            ...randHeaders,
        });
        // 添加accept属性防止获取网页源码编码不正确问题
        if (!Object.keys(headers).includes('accept')) {
            headers['accept'] = '*/*';
        }

        const response = await _axios.get(mediaUrl, {
            headers: headers,
            responseType: 'stream',
            timeout: 30000, // 30秒超时
        });

        responseStream = response.data;
        
        // 将流添加到全局资源管理器
        globalResourceManager.addStream(responseStream);

        // 设置响应头
        Object.entries(response.headers).forEach(([key, value]) => {
            if (!['transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
                reply.raw.setHeader(key, value);
            }
        });

        // 处理 range 请求
        const range = request.headers.range;
        if (range) {
            const contentLength = parseInt(response.headers['content-length'], 10);
            const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
            const start = parseInt(startStr, 10);
            const end = endStr ? parseInt(endStr, 10) : contentLength - 1;

            reply.raw.setHeader('Content-Range', `bytes ${start}-${end}/${contentLength}`);
            reply.raw.setHeader('Content-Length', end - start + 1);
            reply.raw.writeHead(206); // 206 Partial Content
        } else {
            reply.raw.writeHead(200);
        }

        // 监听客户端断开连接
        const onAbort = () => {
            console.log('[proxyStreamMedia] Client aborted the connection');
            if (responseStream && !responseStream.destroyed) {
                responseStream.destroy();
            }
            cleanupListeners();
        };

        addListener(request.raw, 'aborted', onAbort);
        addListener(request.raw, 'close', onAbort);

        // 流错误处理
        const onStreamError = (error) => {
            console.error('[proxyStreamMedia] Stream error:', error.message);
            cleanupListeners();
            if (!reply.sent && !reply.raw.destroyed) {
                reply.code(500).send({error: error.message});
            }
        };

        addListener(responseStream, 'error', onStreamError);

        // 流结束处理
        const onStreamEnd = () => {
            console.log('[proxyStreamMedia] Stream ended successfully');
            cleanupListeners();
        };

        addListener(responseStream, 'end', onStreamEnd);
        addListener(responseStream, 'close', onStreamEnd);

        // 检查连接状态
        if (request.raw.aborted || request.raw.destroyed) {
            console.log('[proxyStreamMedia] Connection already aborted');
            if (responseStream && !responseStream.destroyed) {
                responseStream.destroy();
            }
            return;
        }

        // 流式传输数据
        responseStream.pipe(reply.raw);

    } catch (error) {
        console.error('[proxyStreamMedia] Error:', error.message);
        
        // 清理资源
        if (responseStream && !responseStream.destroyed) {
            responseStream.destroy();
        }
        cleanupListeners();
        
        if (!reply.sent && !reply.raw.destroyed) {
            reply.code(500).send({error: error.message});
        }
    }
}

async function proxyStreamMediaMulti(mediaUrl, reqHeaders, request, reply, thread, size, randUa = 0) {
    // 资源清理管理器
    const resourceManager = {
        streams: [],
        eventListeners: [],
        cleanup: function() {
            // 清理所有流
            this.streams.forEach(stream => {
                if (stream && !stream.destroyed) {
                    stream.destroy();
                }
            });
            this.streams = [];
            
            // 清理所有事件监听器
            this.eventListeners.forEach(({target, event, listener}) => {
                if (target && typeof target.removeListener === 'function') {
                    target.removeListener(event, listener);
                }
            });
            this.eventListeners = [];
        },
        addStream: function(stream) {
            this.streams.push(stream);
        },
        addEventListener: function(target, event, listener) {
            this.eventListeners.push({target, event, listener});
            target.on(event, listener);
        }
    };

    try {
        let initialHeaders;
        let contentLength;

        // 随机生成 UA（如果启用 randUa 参数）
        const randHeaders = randUa
            ? Object.assign({}, reqHeaders, {
                'User-Agent': randomUa.generateUa(1, {
                    // device: ['mobile', 'pc'],
                    device: ['pc'],
                    mobileOs: ['android']
                })
            })
            : reqHeaders;

        const headers = keysToLowerCase({
            ...randHeaders,
        });
        // 添加accept属性防止获取网页源码编码不正确问题
        if (!Object.keys(headers).includes('accept')) {
            headers['accept'] = '*/*';
        }
        // 检查请求头中是否包含 Cookie
        const hasCookie = Object.keys(randHeaders).some(key => key.toLowerCase() === 'cookie');
        // console.log(`[proxyStreamMediaMulti] Checking for Cookie in headers: ${hasCookie}`);

        let testStream = null;
        try {
            if (!hasCookie) {
                // 优先尝试 HEAD 请求
                // console.log('[proxyStreamMediaMulti] Attempting HEAD request to fetch content-length...');
                const headResponse = await _axios.head(mediaUrl, {headers: headers});
                initialHeaders = headResponse.headers;
                contentLength = parseInt(initialHeaders['content-length'], 10);
                console.log(`[proxyStreamMediaMulti] HEAD request successful, content-length: ${contentLength}`);
            } else {
                throw new Error('Skipping HEAD request due to Cookie in headers.');
            }
        } catch (headError) {
            console.error('[proxyStreamMediaMulti] HEAD request failed or skipped:', headError.message);

            // 使用 HTTP Range 请求获取 content-length
            try {
                // console.log('[proxyStreamMediaMulti] Attempting Range GET request to fetch content-length...');
                const rangeHeaders = {...headers, Range: 'bytes=0-1'};
                const rangeResponse = await _axios.get(mediaUrl, {
                    headers: rangeHeaders,
                    responseType: 'stream',
                });
                initialHeaders = rangeResponse.headers;
                testStream = rangeResponse.data;

                // 从 Content-Range 提取总大小
                const contentRange = initialHeaders['content-range'];
                if (contentRange) {
                    const match = contentRange.match(/\/(\d+)$/);
                    if (match) {
                        contentLength = parseInt(match[1], 10);
                        console.log(`[proxyStreamMediaMulti] Range GET request successful, content-length: ${contentLength}`);
                    }
                }

                // 立即销毁流，防止下载文件内容
                if (testStream && !testStream.destroyed) {
                    testStream.destroy();
                }
                testStream = null;
            } catch (rangeError) {
                console.error('[proxyStreamMediaMulti] Range GET request failed:', rangeError.message);
                console.log('[proxyStreamMediaMulti] headers:', headers);
                // 使用 GET 请求获取 content-length
                // console.log('[proxyStreamMediaMulti] Falling back to full GET request to fetch content-length...');
                const getResponse = await _axios.get(mediaUrl, {
                    headers: headers,
                    responseType: 'stream',
                });
                initialHeaders = getResponse.headers;
                contentLength = parseInt(initialHeaders['content-length'], 10);
                console.log(`[proxyStreamMediaMulti] Full GET request successful, content-length: ${contentLength}`);
                testStream = getResponse.data;

                // 立即销毁流，防止下载文件内容
                if (testStream && !testStream.destroyed) {
                    testStream.destroy();
                }
                testStream = null;
            }
        }

        // 确保 content-length 有效
        if (!contentLength) {
            throw new Error('Failed to get the total content length.');
        }

        // 设置响应头，排除不必要的头部
        Object.entries(initialHeaders).forEach(([key, value]) => {
            if (!['transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
                reply.raw.setHeader(key, value);
            }
        });

        reply.raw.setHeader('Accept-Ranges', 'bytes');

        // 解析 range 请求头
        const range = request.headers.range || 'bytes=0-';
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        let start = parseInt(startStr, 10);
        let end = endStr ? parseInt(endStr, 10) : contentLength - 1;

        // 校正 range 范围
        if (start < 0) start = 0;
        if (end >= contentLength) end = contentLength - 1;

        if (start >= end) {
            reply.code(416).header('Content-Range', `bytes */${contentLength}`).send();
            console.log('[proxyStreamMediaMulti] Invalid range, sending 416 response.');
            return;
        }

        // 设置 Content-Range 和 Content-Length 响应头
        reply.raw.setHeader('Content-Range', `bytes ${start}-${end}/${contentLength}`);
        reply.raw.setHeader('Content-Length', end - start + 1);
        reply.raw.writeHead(206); // 206 Partial Content
        // console.log(`[proxyStreamMediaMulti] Serving range: ${start}-${end}`);

        // 计算每块的大小并划分子范围
        const chunkSize = sizeToBytes(size);
        const totalChunks = Math.ceil((end - start + 1) / chunkSize);
        const threadCount = Math.min(thread, totalChunks);
        const ranges = Array.from({length: threadCount}, (_, i) => {
            const subStart = start + (i * (end - start + 1)) / threadCount;
            const subEnd = Math.min(subStart + (end - start + 1) / threadCount - 1, end);
            return {start: Math.floor(subStart), end: Math.floor(subEnd)};
        });

        // console.log(`[proxyStreamMediaMulti] Splitting range into ${ranges.length} threads...`);

        // 并发获取数据块
        const fetchChunks = ranges.map(range =>
            fetchStream(mediaUrl, randHeaders, range.start, range.end, randUa)
        );
        
        let streams;
        try {
            streams = await Promise.all(fetchChunks);
        } catch (fetchError) {
            console.error('[proxyStreamMediaMulti] Error fetching streams:', fetchError.message);
            throw fetchError;
        }

        // 将所有流添加到资源管理器
        streams.forEach(({stream}) => {
            resourceManager.addStream(stream);
            globalResourceManager.addStream(stream);
        });

        // 设置全局中断处理
        const globalAbortHandler = () => {
            console.log('[proxyStreamMediaMulti] Client connection aborted, cleaning up resources');
            resourceManager.cleanup();
        };

        // 添加中断监听器到资源管理器
        resourceManager.addEventListener(request.raw, 'aborted', globalAbortHandler);
        resourceManager.addEventListener(request.raw, 'close', globalAbortHandler);

        // 按顺序发送数据块
        let cnt = 0;
        for (const {stream} of streams) {
            cnt += 1;
            // console.log(`[proxyStreamMediaMulti] Streaming chunk ${cnt}...`);

            try {
                // 检查连接状态
                if (request.raw.aborted || request.raw.destroyed) {
                    console.log(`[proxyStreamMediaMulti] Connection aborted before chunk ${cnt}`);
                    break;
                }

                for await (const chunk of stream) {
                    if (request.raw.aborted || request.raw.destroyed) {
                        // console.log(`[proxyStreamMediaMulti] Chunk ${cnt} aborted.`);
                        break;
                    }
                    
                    // 安全写入数据
                    if (!reply.raw.destroyed && !reply.raw.writableEnded) {
                        reply.raw.write(chunk);
                    } else {
                        console.log(`[proxyStreamMediaMulti] Response stream closed during chunk ${cnt}`);
                        break;
                    }
                }
            } catch (error) {
                console.error(`[proxyStreamMediaMulti] Error during streaming chunk ${cnt}:`, error.message);
                // 不要抛出错误，继续处理下一个chunk
            }
        }

        console.log('[proxyStreamMediaMulti] All chunks streamed successfully.');
        
        // 安全结束响应
        if (!reply.raw.destroyed && !reply.raw.writableEnded) {
            reply.raw.end();
        }

    } catch (error) {
        console.error('[proxyStreamMediaMulti] Error:', error.message);
        
        // 确保资源清理
        resourceManager.cleanup();
        
        if (!reply.sent && !reply.raw.destroyed) {
            reply.code(500).send({error: error.message});
        }
    } finally {
        // 最终清理
        resourceManager.cleanup();
    }
}

// Helper function to convert size string (e.g., '128K', '1M') to bytes
function sizeToBytes(size) {
    const sizeMap = {
        K: 1024,
        M: 1024 * 1024,
        G: 1024 * 1024 * 1024
    };
    const unit = size[size.length - 1].toUpperCase();
    const number = parseInt(size, 10);
    return number * (sizeMap[unit] || 1);
}
