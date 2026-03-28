/**
 * 文件操作工具模块
 *
 * 功能：提供文件读写、路径处理、解析器配置等核心文件操作功能
 * 包含安全的文件访问控制和路径解析功能
 *
 * @author drpy
 * @version 1.0.0
 */

import path from "path";
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'fs';
import {fileURLToPath} from "url";
import '../libs_drpy/jinja.js'

// 获取当前模块的目录路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolvePath(dir, relativePath) {
    let p = path.join(dir, relativePath);
    if (existsSync(p)) return p;
    let fixedRelative = relativePath.replace(/^\.\.[\\\/]/, './');
    let p2 = path.join(dir, fixedRelative);
    if (existsSync(p2)) return p2;
    // Try going up one more level (useful for dist/ bundle)
    if (relativePath.startsWith('..')) {
        let p3 = path.join(dir, '../' + relativePath);
        if (existsSync(p3)) return p3;
    }
    return p;
}

// 定义核心路径常量
const _data_path = resolvePath(__dirname, '../data');      // 数据文件存储路径
const _lib_path = resolvePath(__dirname, '../spider/js');  // 库文件路径
const _jx_path = resolvePath(__dirname, '../jx');          // 解析文件路径

export {getSitesMap} from "./sites-map.js";
// ES6扩展代码路径和内容
const es6JsPath = resolvePath(__dirname, '../libs_drpy/es6-extend.js');
/**
 * ES6扩展代码
 * 包含ES6语法扩展和兼容性代码
 */
export const es6_extend_code = readFileSync(es6JsPath, 'utf8');

// 网络请求扩展代码路径和内容
const reqJsPath = resolvePath(__dirname, '../libs_drpy/req-extend.js');
/**
 * 网络请求扩展代码
 * 包含HTTP请求相关的扩展功能
 */
export const req_extend_code = readFileSync(reqJsPath, 'utf8');

/**
 * 路径操作库
 * 提供安全的文件读写和路径操作功能
 */
export const pathLib = {
    basename: path.basename, // 获取文件名
    extname: path.extname,   // 获取文件扩展名

    /**
     * 安全读取数据文件
     *
     * @param {string} filename - 相对于data目录的文件名
     * @returns {string} 文件内容，失败返回空字符串
     */
    readFile: function (filename) {
        let _file_path = path.join(_data_path, filename);
        const resolvedPath = path.resolve(_data_path, _file_path); // 将路径解析为绝对路径

        // 安全检查：确保访问路径在允许的数据目录内
        if (!resolvedPath.startsWith(_data_path)) {
            log(`[pathLib.readFile] no access for read ${_file_path}`)
            return '';
        }

        // 检查文件是否存在
        if (!existsSync(resolvedPath)) {
            log(`[pathLib.readFile] file not found for read ${resolvedPath}`)
            return '';
        }

        return readFileSync(resolvedPath, 'utf8')
    },

    /**
     * 安全写入数据文件
     *
     * @param {string} filename - 相对于data目录的文件名
     * @param {string} text - 要写入的文本内容
     * @returns {boolean} 写入成功返回true，失败返回false
     */
    writeFile: function (filename, text) {
        let _file_path = path.join(_data_path, filename);
        const resolvedPath = path.resolve(_data_path, _file_path); // 将路径解析为绝对路径

        // 安全检查：确保访问路径在允许的数据目录内
        if (!resolvedPath.startsWith(_data_path)) {
            log(`[pathLib.writeFile] no access for read ${_file_path}`)
            return '';
        }

        try {
            const dirPath = path.dirname(resolvedPath);
            // 检查目录是否存在，不存在则创建
            if (!existsSync(dirPath)) {
                mkdirSync(dirPath, {recursive: true});
            }
            writeFileSync(resolvedPath, text, 'utf8');
            return true
        } catch (e) {
            log(`[pathLib.writeFile] failed for saveFile ${_file_path}　error:${e.message}`);
            return false
        }
    },

    /**
     * 安全读取库文件
     *
     * @param {string} filename - 相对于库目录的文件名
     * @returns {string} 文件内容，失败返回空字符串
     */
    readLib: function (filename) {
        let _file_path = path.join(_lib_path, filename);
        const resolvedPath = path.resolve(_data_path, _file_path); // 将路径解析为绝对路径

        // 安全检查：确保访问路径在允许的库目录内
        if (!resolvedPath.startsWith(_lib_path)) {
            log(`[pathLib.readLib] no access for read ${_file_path}`)
            return '';
        }

        // 检查文件是否存在
        if (!existsSync(resolvedPath)) {
            log(`[pathLib.readLib] file not found for read ${resolvedPath}`)
            return '';
        }

        return readFileSync(resolvedPath, 'utf8')
    },
};

/**
 * 获取解析器配置字典
 *
 * 功能：从配置文件中读取解析器列表，支持模板变量替换
 * 解析parses.conf配置文件，生成解析器对象数组
 *
 * @param {string} host - 主机地址，用于模板变量替换
 * @returns {Array} 解析器配置对象数组
 */
export function getParsesDict(host) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const jx_conf = path.join(__dirname, '../config/parses.conf');
    let jx_list = [];

    // 检查解析器配置文件是否存在
    if (existsSync(jx_conf)) {
        const jx_conf_text = readFileSync(jx_conf, 'utf-8');
        let jx_conf_content = jx_conf_text.trim();

        let hostName = host;
        try {
            const raw = String(host || '');
            const hasScheme = raw.includes('://');
            const u = new URL(hasScheme ? raw : `http://${raw}`);
            const hostname = u.hostname || raw;
            const safeHostname = hostname.includes(':') ? `[${hostname}]` : hostname;
            hostName = hasScheme ? `${u.protocol}//${safeHostname}` : safeHostname;
        } catch (e) {
            const raw = String(host || '').replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '').split('/')[0];
            hostName = raw.startsWith('[') ? raw.split(']')[0] + ']' : raw.split(':')[0];
        }

        let var_dict = {
            host,
            hostName
        };

        // 使用Jinja模板引擎渲染配置内容
        jx_conf_content = jinja.render(jx_conf_content, var_dict);

        // 解析配置行：过滤空行和注释行
        const jxs = jx_conf_content.split('\n')
            .filter(it => it.trim() && !it.trim().startsWith('#'))
            .map(it => it.trim());

        // 处理每个解析器配置行
        jxs.forEach((jx) => {
            let jx_arr = jx.split(',');
            let jx_name = jx_arr[0];                                    // 解析器名称
            let jx_url = jx_arr[1];                                     // 解析器URL
            let jx_type = jx_arr.length > 2 ? Number(jx_arr[2]) || 0 : 0; // 解析器类型
            let jx_ua = jx_arr.length > 3 ? jx_arr[3] : 'Mozilla/5.0';   // User-Agent
            let jx_flag = jx_arr.length > 4 ? jx_arr[4] : '';            // 标志位

            // 构建解析器对象
            let jx_obj = {
                'name': jx_name,
                'url': jx_url,
                'type': jx_type,
                "header": {
                    "User-Agent": jx_ua
                },
            }

            // 如果有标志位，添加扩展配置
            if (jx_flag) {
                jx_obj.ext = {
                    "flag": jx_flag.split('|')
                }
            }

            jx_list.push(jx_obj);
        });
    }

    return jx_list
}

/**
 * 执行解析
 *
 * @param {string} name - 解析文件名 (不含.js)
 * @param {string} host - 主机地址
 * @param {string} url - 需要解析的URL
 * @returns {Array} [flag, url] - flag为true表示找到解析文件，false表示未找到
 */
export function executeParse(name, host, url) {
    let _file_path = path.join(_jx_path, name + '.js');
    if (existsSync(_file_path)) {
        return [true, host + '/parse/' + name + '?url=' + url];
    } else {
        return [false, url];
    }
}

globalThis.pathLib = pathLib;
globalThis.executeParse = executeParse;
