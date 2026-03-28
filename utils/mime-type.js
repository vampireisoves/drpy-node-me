import path from 'path';
import mime from 'mime-types';

/**
 * 根据文件路径或名称的后缀获取 Content-Type
 * @param {string} filePath - 文件路径或名称
 * @returns {string} - Content-Type 或 'unknown'
 */
export function getContentType(filePath) {
    const extension = path.extname(filePath); // 获取文件扩展名
    return getMimeType(extension);
}

/**
 * 根据扩展名返回 MIME 类型
 * @param {string} ext 文件扩展名
 * @returns {string} MIME 类型
 */
export function getMimeType(ext) {
    // const mimeTypes = {
    //     '.txt': 'text/plain; charset=utf-8',
    //     '.html': 'text/html; charset=utf-8',
    //     '.css': 'text/css; charset=utf-8',
    //     '.js': 'application/javascript; charset=utf-8',
    //     '.json': 'application/json; charset=utf-8',
    //     '.jpg': 'image/jpeg',
    //     '.jpeg': 'image/jpeg',
    //     '.png': 'image/png',
    //     '.gif': 'image/gif',
    //     '.svg': 'image/svg+xml',
    //     '.pdf': 'application/pdf',
    // };
    // return mimeTypes[ext] || 'application/octet-stream';
    const mimeType = mime.lookup(ext); // 从扩展名获取 MIME 类型
    const isUtf8Type = (mimeType && mimeType.includes('text')) || ext.includes('.js'); // 文本类的加; charset=utf-8
    const extInfo = (mimeType && isUtf8Type) ? '; charset=utf-8' : '';
    return (mimeType || 'application/octet-stream') + extInfo; // 如果未匹配，返回 'unknown'
}
