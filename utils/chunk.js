/**
 * 分块流处理工具
 * 提供HTTP Range请求支持和分块下载缓存功能
 */

import req from './req.js';
import CryptoJS from 'crypto-js';
import {join} from 'path';
import fs from 'fs';
import {PassThrough} from 'stream';

/**
 * 测试URL是否支持Range请求
 * @param {string} url 目标URL
 * @param {Object} headers 请求头
 * @returns {Array} [是否支持, 响应头]
 */
export async function testSupport(url, headers) {
    const resp = await req
        .get(url, {
            responseType: 'stream',
            headers: Object.assign(
                {
                    Range: 'bytes=0-0', // 测试Range请求
                },
                headers,
            ),
        })
        .catch((err) => {
            console.error(err);
            return err.response || {status: 500, data: {}};
        });
    if (resp && resp.status === 206) {
        const isAccept = resp.headers['accept-ranges'] === 'bytes';
        const contentRange = resp.headers['content-range'];
        const contentLength = parseInt(resp.headers['content-length']);
        const isSupport = isAccept || !!contentRange || contentLength === 1;
        const length = contentRange ? parseInt(contentRange.split('/')[1]) : contentLength;
        // 清理响应头
        delete resp.headers['content-range'];
        delete resp.headers['content-length'];
        if (length) resp.headers['content-length'] = length.toString();
        return [isSupport, resp.headers];
    } else {
        return [false, null];
    }
}

// URL头信息缓存
const urlHeadCache = {};
// 当前URL密钥
let currentUrlKey = '';
// 缓存根目录
const cacheRoot = (process.env['NODE_PATH'] || '.') + '/vod_cache';
// 最大缓存大小 100MB
const maxCache = 1024 * 1024 * 100;

/**
 * 删除所有缓存文件，保留指定的密钥
 * @param {string} keepKey 要保留的密钥
 */
function delAllCache(keepKey) {
    try {
        fs.readdir(cacheRoot, (_, files) => {
            if (files)
                for (const file of files) {
                    if (file === keepKey) continue;
                    const dir = join(cacheRoot, file);
                    fs.stat(dir, (_, stats) => {
                        if (stats && stats.isDirectory()) {
                            fs.readdir(dir, (_, subFiles) => {
                                if (subFiles)
                                    for (const subFile of subFiles) {
                                        // 删除非.p结尾的文件
                                        if (!subFile.endsWith('.p')) {
                                            fs.rm(join(dir, subFile), {recursive: true}, () => {
                                            });
                                        }
                                    }
                            });
                        }
                    });
                }
        });
    } catch (error) {
        console.error(error);
    }
}

/**
 * 分块流处理主函数
 * @param {Object} inReq 输入请求对象
 * @param {Object} outResp 输出响应对象
 * @param {string} url 目标URL
 * @param {string} urlKey URL密钥
 * @param {Object} headers 请求头
 * @param {Object} option 配置选项
 * @returns {Stream} 流对象
 */
async function chunkStream(inReq, outResp, url, urlKey, headers, option) {
    // 生成URL密钥
    urlKey = urlKey || CryptoJS.enc.Hex.stringify(CryptoJS.MD5(url)).toString();
    if (currentUrlKey !== urlKey) {
        delAllCache(urlKey);
        currentUrlKey = urlKey;
    }
    
    // 检查URL头信息缓存
    if (!urlHeadCache[urlKey]) {
        const [isSupport, urlHeader] = await testSupport(url, headers);
        if (!isSupport || !urlHeader['content-length']) {
            console.log(`[chunkStream] 获取content-length失败，执行重定向到: ${url}`);
            outResp.redirect(url);
            return;
        }
        urlHeadCache[urlKey] = urlHeader;
    }
    
    // 创建缓存目录
    let exist = true;
    await fs.promises.access(join(cacheRoot, urlKey)).catch((_) => (exist = false));
    if (!exist) {
        await fs.promises.mkdir(join(cacheRoot, urlKey), {recursive: true});
    }
    
    const contentLength = parseInt(urlHeadCache[urlKey]['content-length']);
    let byteStart = 0;
    let byteEnd = contentLength - 1;
    const streamHeader = {};
    
    // 处理Range请求
    if (inReq.headers.range) {
        // console.log(inReq.id, inReq.headers.range);
        const ranges = inReq.headers.range.trim().split(/=|-/);
        if (ranges.length > 2 && ranges[2]) {
            byteEnd = parseInt(ranges[2]);
        }
        byteStart = parseInt(ranges[1]);
        Object.assign(streamHeader, urlHeadCache[urlKey]);
        streamHeader['content-length'] = (byteEnd - byteStart + 1).toString();
        streamHeader['content-range'] = `bytes ${byteStart}-${byteEnd}/${contentLength}`;
        outResp.code(206);
    } else {
        Object.assign(streamHeader, urlHeadCache[urlKey]);
        outResp.code(200);
    }
    
    // 设置默认选项
    option = option || {chunkSize: 1024 * 256, poolSize: 5, timeout: 1000 * 10};
    console.log(`[chunkStream] option: `, option);
    const chunkSize = option.chunkSize;
    const poolSize = option.poolSize;
    const timeout = option.timeout;
    
    // 计算分块信息
    let chunkCount = Math.ceil(contentLength / chunkSize);
    let chunkDownIdx = Math.floor(byteStart / chunkSize);
    let chunkReadIdx = chunkDownIdx;
    let stop = false;
    const dlFiles = {};
    
    // 启动下载任务池
    for (let i = 0; i < poolSize && i < chunkCount; i++) {
        new Promise((resolve) => {
            (async function doDLTask(spChunkIdx) {
                if (stop || chunkDownIdx >= chunkCount) {
                    resolve();
                    return;
                }
                // 缓存大小控制
                if (spChunkIdx === undefined && (chunkDownIdx - chunkReadIdx) * chunkSize >= maxCache) {
                    setTimeout(doDLTask, 5);
                    return;
                }
                const chunkIdx = spChunkIdx || chunkDownIdx++;
                const taskId = `${inReq.id}-${chunkIdx}`;
                try {
                    const dlFile = join(cacheRoot, urlKey, `${inReq.id}-${chunkIdx}.p`);
                    let exist = true;
                    await fs.promises.access(dlFile).catch((_) => (exist = false));
                    if (!exist) {
                        const start = chunkIdx * chunkSize;
                        const end = Math.min(contentLength - 1, (chunkIdx + 1) * chunkSize - 1);
                        // console.log('[chunkIdx]:', inReq.id, chunkIdx);
                        // 下载分块数据
                        const dlResp = await req.get(url, {
                            responseType: 'stream',
                            timeout: timeout,
                            headers: Object.assign(
                                {
                                    Range: `bytes=${start}-${end}`,
                                },
                                headers,
                            ),
                        });
                        const dlCache = join(cacheRoot, urlKey, `${inReq.id}-${chunkIdx}.dl`);
                        const writer = fs.createWriteStream(dlCache);
                        const readTimeout = setTimeout(() => {
                            writer.destroy(new Error(`${taskId} read timeout`));
                        }, timeout);
                        const downloaded = new Promise((resolve) => {
                            writer.on('finish', async () => {
                                if (stop) {
                                    await fs.promises.rm(dlCache).catch((e) => console.error(e));
                                } else {
                                    await fs.promises.rename(dlCache, dlFile).catch((e) => console.error(e));
                                    dlFiles[taskId] = dlFile;
                                }
                                resolve(true);
                            });
                            writer.on('error', async (e) => {
                                console.error(e);
                                await fs.promises.rm(dlCache).catch((e1) => console.error(e1));
                                resolve(false);
                            });
                        });
                        dlResp.data.pipe(writer);
                        const result = await downloaded;
                        clearTimeout(readTimeout);
                        if (!result) {
                            setTimeout(() => {
                                doDLTask(chunkIdx);
                            }, 15);
                            return;
                        }
                    }
                    setTimeout(doDLTask, 5);
                } catch (error) {
                    console.error(error);
                    setTimeout(() => {
                        doDLTask(chunkIdx);
                    }, 15);
                }
            })();
        });
    }

    outResp.headers(streamHeader);
    const stream = new PassThrough();
    
    // 读取文件并写入流
    new Promise((resolve) => {
        let writeMore = true;
        (async function waitReadFile() {
            try {
                if (chunkReadIdx >= chunkCount || stop) {
                    stream.end();
                    resolve();
                    return;
                }
                if (!writeMore) {
                    setTimeout(waitReadFile, 5);
                    return;
                }
                const taskId = `${inReq.id}-${chunkReadIdx}`;
                if (!dlFiles[taskId]) {
                    setTimeout(waitReadFile, 5);
                    return;
                }
                const chunkByteStart = chunkReadIdx * chunkSize;
                const chunkByteEnd = Math.min(contentLength - 1, (chunkReadIdx + 1) * chunkSize - 1);
                const readFileStart = Math.max(byteStart, chunkByteStart) - chunkByteStart;
                const dlFile = dlFiles[taskId];
                delete dlFiles[taskId];
                // 读取文件数据
                const fd = await fs.promises.open(dlFile, 'r');
                const buffer = Buffer.alloc(chunkByteEnd - chunkByteStart - readFileStart + 1);
                await fd.read(buffer, 0, chunkByteEnd - chunkByteStart - readFileStart + 1, readFileStart);
                await fd.close().catch((e) => console.error(e));
                await fs.promises.rm(dlFile).catch((e) => console.error(e));
                writeMore = stream.write(buffer);
                if (!writeMore) {
                    stream.once('drain', () => {
                        writeMore = true;
                    });
                }
                chunkReadIdx++;
                setTimeout(waitReadFile, 5);
            } catch (error) {
                setTimeout(waitReadFile, 5);
            }
        })();
    });
    
    // 清理资源
    stream.on('close', async () => {
        Object.keys(dlFiles).forEach((reqKey) => {
            if (reqKey.startsWith(inReq.id)) {
                fs.rm(dlFiles[reqKey], {recursive: true}, () => {
                });
                delete dlFiles[reqKey];
            }
        });
        stop = true;
    });
    return stream;
}

// 导出默认函数
export default chunkStream;
