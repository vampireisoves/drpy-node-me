import {readFile} from 'fs/promises';
import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'fs';
import {fileURLToPath} from "url";
import {createRequire} from 'module';
import {XMLHttpRequest} from 'xmlhttprequest';
import path from "path";
import vm from 'vm';
import WebSocket, {WebSocketServer} from 'ws';
import zlib from 'zlib';
import JSONbig from 'json-bigint';
import * as minizlib from 'minizlib';
import '../libs_drpy/es6-extend.js'
import {getSitesMap} from "../utils/sites-map.js";
import * as utils from '../utils/utils.js';
import * as misc from '../utils/misc.js';
import COOKIE from '../utils/cookieManager.js';
import {ENV} from '../utils/env.js';
import {Quark} from "../utils/quark.js";
import {UC} from "../utils/uc.js";
import {Ali} from "../utils/ali.js";
import {Cloud} from "../utils/cloud.js";
import {Yun} from "../utils/yun.js";
import AIS from '../utils/ais.js';
// const { req } = await import('../utils/req.js');
import {gbkTool} from '../libs_drpy/gbk.js'
// import {atob, btoa, base64Encode, base64Decode, md5} from "../libs_drpy/crypto-util.js";
import {base64Decode, base64Encode, md5, rc4, rc4_decode, rc4Decrypt, rc4Encrypt} from "../libs_drpy/crypto-util.js";
import {getContentType, getMimeType} from "../utils/mime-type.js";
import {getParsesDict} from "../utils/file.js";
import {getFirstLetter} from "../utils/pinyin-tool.js";
import "../utils/random-http-ua.js";
import template from '../libs_drpy/template.js'
import batchExecute from '../libs_drpy/batchExecute.js';
import '../libs_drpy/abba.js'
import '../libs_drpy/drpyInject.js'
import '../libs_drpy/crypto-js.js';
import '../libs_drpy/jsencrypt.js';
import '../libs_drpy/node-rsa.js';
import '../libs_drpy/pako.min.js';
import '../libs_drpy/json5.js'
import '../libs_drpy/jinja.js'
// import '../libs_drpy/jsonpathplus.min.js'
import '../libs_drpy/drpyCustom.js'
import '../libs_drpy/moduleLoader.js'
// import '../libs_drpy/crypto-js-wasm.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _data_path = path.join(__dirname, '../data');
const _config_path = path.join(__dirname, '../config');

globalThis.misc = misc;
globalThis.utils = utils;
globalThis.COOKIE = COOKIE;
globalThis.ENV = ENV;
globalThis._ENV = process.env;
globalThis.Quark = Quark;
globalThis.UC = UC;
globalThis.Ali = Ali;
globalThis.Cloud = Cloud;
globalThis.Yun = Yun;
globalThis.require = createRequire(import.meta.url);
globalThis._fetch = fetch;
globalThis.XMLHttpRequest = XMLHttpRequest;
globalThis.WebSocket = WebSocket;
globalThis.WebSocketServer = WebSocketServer;
globalThis.zlib = zlib;
globalThis.JSONbig = JSONbig;
globalThis.JsonBig = JSONbig({storeAsString: true});
globalThis.minizlib = minizlib;
globalThis.AIS = AIS;
globalThis.pathLib = {
    basename: path.basename,
    extname: path.extname,
    readFile: function (filename) {
        let _file_path = path.join(_data_path, filename);
        const resolvedPath = path.resolve(_data_path, _file_path); // 将路径解析为绝对路径
        if (!resolvedPath.startsWith(_data_path)) {
            log(`no access for read ${_file_path}`)
            return '';
        }
        // 检查文件是否存在
        if (!existsSync(resolvedPath)) {
            log(`file not found for read ${resolvedPath}`)
            return '';
        }
        return readFileSync(resolvedPath, 'utf8')
    },
    writeFile: function (filename, text) {
        let _file_path = path.join(_data_path, filename);
        const resolvedPath = path.resolve(_data_path, _file_path); // 将路径解析为绝对路径
        if (!resolvedPath.startsWith(_data_path)) {
            log(`no access for read ${_file_path}`)
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
            log(`failed for saveFile ${_file_path}　error:${e.message}`);
            return false
        }
    },
};
const {sleep, sleepSync, computeHash, deepCopy, urljoin, urljoin2, joinUrl, naturalSort, $js} = utils;
const es6JsPath = path.join(__dirname, '../libs_drpy/es6-extend.js');
// 读取扩展代码
const es6_extend_code = readFileSync(es6JsPath, 'utf8');
const reqJsPath = path.join(__dirname, '../libs_drpy/req-extend.js');
// 读取网络请求扩展代码
const req_extend_code = readFileSync(reqJsPath, 'utf8');
// 缓存已初始化的模块和文件 hash 值
const moduleCache = new Map();
const ruleObjectCache = new Map();
const jxCache = new Map();
let pupWebview = null;
if (typeof fetchByHiker === 'undefined') { // 判断是海阔直接放弃导入puppeteer
    try {
        // 尝试动态导入模块puppeteerHelper
        const {puppeteerHelper} = await import('../utils/headless-util.js');  // 使用动态 import
        pupWebview = new puppeteerHelper();
        console.log('puppeteerHelper imported successfully');
    } catch (error) {
        // console.log('Failed to import puppeteerHelper:', error);
        console.log(`Failed to import puppeteerHelper:${error.message}`);
    }
}
globalThis.pupWebview = pupWebview;

try {
    if (typeof fetchByHiker !== 'undefined' && typeof globalThis.import === 'function') {
        await globalThis.import('../libs_drpy/crypto-js-wasm.js'); // 海阔放在globalThis里去动态引入
    } else {
        await import('../libs_drpy/crypto-js-wasm.js'); // 使用动态 import规避海阔报错无法运行问题
    }
    globalThis.CryptoJSW = CryptoJSWasm;
} catch (error) {
    // console.log('Failed to import puppeteerHelper:', error);
    console.log(`Failed to import CryptoJSWasm:${error.message}`);
    globalThis.CryptoJSW = {
        loadAllWasm: async function () {
        },
        // MD5: async function (str) {
        //     return md5(str)
        // },
        ...CryptoJS
    };
}

let simplecc = null;
try {
    const simWasm = await import('simplecc-wasm');  // 使用动态 import
    simplecc = simWasm.simplecc;
    console.log('simplecc imported successfully');
} catch (error) {
    // console.log('Failed to import puppeteerHelper:', error);
    console.log(`Failed to import simplecc:${error.message}`);
}
globalThis.simplecc = simplecc;


export async function getSandbox(env = {}) {
    const {getProxyUrl, hostUrl, fServer} = env;
    // (可选) 加载所有 wasm 文件
    await CryptoJSW.loadAllWasm();
    const utilsSanbox = {
        sleep,
        sleepSync,
        utils,
        misc,
        computeHash,
        deepCopy,
        urljoin,
        urljoin2,
        joinUrl,
        naturalSort,
        $js,
        $,
        pupWebview,
        getProxyUrl,
        hostUrl,
        fServer,
        getContentType, getMimeType, getParsesDict, getFirstLetter
    };
    const drpySanbox = {
        jsp,
        pdfh,
        pd,
        pdfa,
        jsoup,
        pdfl,
        pjfh,
        pj,
        pjfa,
        pq,
        local,
        md5X,
        rsaX,
        aesX,
        desX,
        req,
        _fetch,
        XMLHttpRequest,
        simplecc,
        AIS,
        batchFetch,
        JSProxyStream,
        JSFile,
        js2Proxy,
        log,
        print,
        jsonToCookie,
        cookieToJson,
        runMain,
    };
    const drpyCustomSanbox = {
        MOBILE_UA,
        PC_UA,
        UA,
        UC_UA,
        IOS_UA,
        RULE_CK,
        CATE_EXCLUDE,
        TAB_EXCLUDE,
        OCR_RETRY,
        OCR_API,
        nodata,
        SPECIAL_URL,
        setResult,
        setHomeResult,
        setResult2,
        urlDeal,
        tellIsJx,
        urlencode,
        encodeUrl,
        uint8ArrayToBase64,
        Utf8ArrayToStr,
        gzip,
        ungzip,
        encodeStr,
        decodeStr,
        getCryptoJS,
        RSA,
        fixAdM3u8Ai,
        forceOrder,
        getQuery,
        stringify,
        dealJson,
        OcrApi,
        getHome,
        buildUrl,
        keysToLowerCase,
        parseQueryString,
        encodeIfContainsSpecialChars,
        objectToQueryString,
    };

    const libsSanbox = {
        matchesAll,
        cut,
        gbkTool,
        CryptoJS,
        CryptoJSW,
        JSEncrypt,
        NODERSA,
        pako,
        JSON5,
        jinja,
        template,
        batchExecute,
        atob,
        btoa,
        base64Encode,
        base64Decode,
        md5,
        rc4Encrypt,
        rc4Decrypt,
        rc4,
        rc4_decode,
        randomUa,
        jsonpath,
        hlsParser,
        axios,
        axiosX,
        URL,
        pathLib,
        qs,
        Buffer,
        URLSearchParams,
        COOKIE,
        ENV,
        _ENV,
        Quark,
        UC,
        Ali,
        Cloud,
        Yun,
        require,
        WebSocket,
        WebSocketServer,
        zlib,
        JSONbig,
        JsonBig,
        minizlib,
    };

    // 创建一个沙箱上下文，注入需要的全局变量和函数
    const sandbox = {
        console,      // 将 console 注入沙箱，便于调试
        // eval,    // 直接引入原生 eval(不要这样用，环境是隔离的会导致执行不符合预期，需要包装)
        WebAssembly, // 允许使用原生 WebAssembly(这里即使不引用也可以在沙箱里用这个变量。写在这里骗骗自己吧)
        setTimeout,   // 注入定时器方法
        setInterval,
        clearTimeout,
        clearInterval,
        module: {},   // 模块支持
        exports: {},   // 模块支持
        rule: {}, // 用于存放导出的 rule 对象
        jx: {},// 用于存放导出的 解析 对象
        lazy: async function () {
        }, // 用于导出解析的默认函数
        _asyncGetRule: null,
        _asyncGetLazy: null,
        ...utilsSanbox,
        ...drpySanbox,
        ...drpyCustomSanbox,
        ...libsSanbox,
    };
    // 创建一个上下文
    const context = vm.createContext(sandbox);
    // 注入扩展代码到沙箱中
    const polyfillsScript = new vm.Script(es6_extend_code);
    polyfillsScript.runInContext(context);

    // 设置沙箱到全局 $
    sandbox.$.setSandbox(sandbox);
    /*
    if (typeof fetchByHiker !== 'undefined') { // 临时解决海阔不支持eval问题，但是这个eval存在作用域问题，跟非海阔环境的有很大区别，属于残废版本
        sandbox.eval = function (code) {
            const evalScript = new vm.Script(code);
            return evalScript.runInContext(context);
        };
    }
    */
    return {
        sandbox,
        context
    }
}

/**
 * 初始化模块：加载并执行模块文件，存储初始化后的 rule 对象
 * 如果存在 `预处理` 属性且为函数，会在缓存前执行
 * @param {string} filePath - 模块文件路径
 * @param env
 * @param refresh 强制清除缓存
 * @returns {Promise<object>} - 返回初始化后的模块对象
 */
export async function init(filePath, env = {}, refresh) {
    try {
        // 读取文件内容
        const fileContent = await readFile(filePath, 'utf-8');
        // 计算文件的 hash 值
        const fileHash = computeHash(fileContent);
        const moduleName = path.basename(filePath, '.js');
        let moduleExt = env.ext || '';
        // log('moduleName:', moduleName);
        // log('moduleExt:', moduleExt);
        let SitesMap = getSitesMap(_config_path);
        // log('SitesMap:', SitesMap);
        if (moduleExt && SitesMap[moduleName]) {
            try {
                moduleExt = ungzip(moduleExt);
            } catch (e) {
                log(`[${moduleName}] ungzip解密moduleExt失败: ${e.message}`);
            }
            if (!SitesMap[moduleName].find(i => i.queryStr === moduleExt) && !SitesMap[moduleName].find(i => i.queryObject.params === moduleExt)) {
                throw new Error("moduleExt is wrong!")
            }
        }
        let hashMd5 = md5(filePath + '#pAq#' + moduleExt);

        // 检查缓存：是否有文件且未刷新且文件 hash 未变化
        if (moduleCache.has(hashMd5) && !refresh) {
            const cached = moduleCache.get(hashMd5);
            if (cached.hash === fileHash) {
                // log(`Module ${filePath} already initialized and unchanged, returning cached instance.`);
                return cached.moduleObject;
            }
        }
        log(`Loading module: ${filePath}`);
        let t1 = utils.getNowTime();
        const {sandbox, context} = await getSandbox(env);
        // 执行文件内容，将其放入沙箱中
        const js_code = getOriginalJs(fileContent);
        // console.log('js_code:', js_code.slice(5000));
        const js_code_wrapper = `
    _asyncGetRule  = (async function() {
        ${js_code}
        return rule;
    })();
    `;
        const ruleScript = new vm.Script(js_code_wrapper);
        // ruleScript.runInContext(context);
        // const result = await ruleScript.runInContext(context);
        const executeWithTimeout = (script, context, timeout) => {
            return Promise.race([
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Code execution timed out')), timeout)
                ),
                new Promise((resolve, reject) => {
                    try {
                        const result = script.runInContext(context); // 同步运行脚本
                        if (result && typeof result.then === 'function') {
                            // 如果结果是 Promise，则等待其解析
                            result.then(resolve).catch(reject);
                        } else {
                            // 如果结果是非异步值，直接返回
                            resolve(result);
                        }
                    } catch (error) {
                        reject(error);
                    }
                })
            ]);
        };
        const result = await executeWithTimeout(ruleScript, context, 30000);
        // console.log('result:', result);
        // sandbox.rule = await sandbox._asyncGetRule;
        sandbox.rule = result;

        // rule注入完毕后添加自定义req扩展request方法进入规则,这个代码里可以直接获取rule的任意对象，而且还是独立隔离的
        const reqExtendScript = new vm.Script(req_extend_code);
        reqExtendScript.runInContext(context);

        // 访问沙箱中的 rule 对象。不进行deepCopy了,避免初始化或者预处理对rule.xxx进行修改后，在其他函数里使用却没生效问题
        // const moduleObject = utils.deepCopy(sandbox.rule);
        const rule = sandbox.rule;
        if (moduleExt) { // 传了参数才覆盖rule参数，否则取rule内置
            // log('moduleExt:', moduleExt);
            if (moduleExt.startsWith('../json')) {
                rule.params = urljoin(env.jsonUrl, moduleExt.slice(8));
            } else {
                rule.params = moduleExt
            }
        }
        await initParse(rule, env, vm, context);
        // otherScript放入到initParse去执行
//         const otherScript = new vm.Script(`
// globalThis.jsp = new jsoup(rule.host||'');
// globalThis.pdfh = pdfh;
// globalThis.pd = pd;
// globalThis.pdfa = pdfa;
// globalThis.HOST = rule.host||'';
//         `);
//         otherScript.runInContext(context);
        let t2 = utils.getNowTime();
        const moduleObject = utils.deepCopy(rule);
        moduleObject.cost = t2 - t1;
        // console.log(`${filePath} headers:`, moduleObject.headers);
        // 缓存模块和文件的 hash 值
        moduleCache.set(hashMd5, {moduleObject, hash: fileHash});
        return moduleObject;
    } catch (error) {
        console.log(`Error in drpy.init :${filePath}`, error);
        throw new Error(`Failed to initialize module:${error.message}`);
    }
}

export async function getRuleObject(filePath, env, refresh) {
    try {
        // 读取文件内容
        const fileContent = await readFile(filePath, 'utf-8');
        // 计算文件的 hash 值
        const fileHash = computeHash(fileContent);

        // 检查缓存：是否有文件且未刷新且文件 hash 未变化
        if (ruleObjectCache.has(filePath) && !refresh) {
            const cached = ruleObjectCache.get(filePath);
            if (cached.hash === fileHash) {
                // log(`Module ${filePath} already initialized and unchanged, returning cached instance.`);
                return cached.ruleObject;
            }
        }
        log(`Loading RuleObject: ${filePath} fileSize:${fileContent.length}`);
        let t1 = utils.getNowTime();
        const {sandbox, context} = await getSandbox(env);
        const js_code = getOriginalJs(fileContent);
        const js_code_wrapper = `
    _asyncGetRule  = (async function() {
        ${js_code}
        return rule;
    })();
    `;
        const ruleScript = new vm.Script(js_code_wrapper);
        ruleScript.runInContext(context);
        sandbox.rule = await sandbox._asyncGetRule;
        const rule = sandbox.rule;
        let t2 = utils.getNowTime();
        const ruleObject = deepCopy(rule);
        // 设置可搜索、可筛选、可快搜等属性
        ruleObject.searchable = ruleObject.hasOwnProperty('searchable') ? Number(ruleObject.searchable) : 0;
        ruleObject.filterable = ruleObject.hasOwnProperty('filterable') ? Number(ruleObject.filterable) : 0;
        ruleObject.quickSearch = ruleObject.hasOwnProperty('quickSearch') ? Number(ruleObject.quickSearch) : 0;
        ruleObject.cost = t2 - t1;
        // console.log(`${filePath} headers:`, moduleObject.headers);
        // 缓存模块和文件的 hash 值
        ruleObjectCache.set(filePath, {ruleObject, hash: fileHash});
        return ruleObject
    } catch (error) {
        console.log(`${filePath} Error in drpy.getRuleObject:${error.message}`);
        return {}
    }
}

export async function initJx(filePath, env, refresh) {
    try {
        // 读取文件内容
        const fileContent = await readFile(filePath, 'utf-8');
        // 计算文件的 hash 值
        const fileHash = computeHash(fileContent);

        let hashMd5 = md5(filePath + '#pAq#' + (env === {} ? 0 : 1));

        // 检查缓存：是否有文件且未刷新且文件 hash 未变化
        if (jxCache.has(hashMd5) && !refresh) {
            const cached = jxCache.get(hashMd5);
            if (cached.hash === fileHash) {
                // log(`Module ${filePath} already initialized and unchanged, returning cached instance.`);
                return cached.jxObj;
            }
        }
        log(`Loading jx: ${filePath}, hash:${hashMd5}`);
        let t1 = utils.getNowTime();
        const {sandbox, context} = await getSandbox(env);
        // 执行文件内容，将其放入沙箱中
        const js_code = getOriginalJs(fileContent);
        const js_code_wrapper = `
    _asyncGetLazy  = (async function() {
        ${js_code}
        return {jx,lazy};
    })();
    `;
        const ruleScript = new vm.Script(js_code_wrapper);
        ruleScript.runInContext(context);
        const jxResult = await sandbox._asyncGetLazy;
        sandbox.lazy = jxResult.lazy;
        sandbox.jx = jxResult.jx;
        const reqExtendScript = new vm.Script(req_extend_code);
        reqExtendScript.runInContext(context);
        let t2 = utils.getNowTime();
        const jxObj = {...sandbox.jx, lazy: sandbox.lazy};
        const cost = t2 - t1;
        console.log(`加载解析:${filePath} 耗时 ${cost}毫秒`)
        jxCache.set(hashMd5, {jxObj, hash: fileHash});
        return jxObj;
    } catch (error) {
        console.log(`Error in drpy.initJx:${filePath}`, error);
        throw new Error(`Failed to initialize jx:${error.message}`);
    }
}


/**
 * 使用临时的上下文调用异步方法，确保每次调用时的上下文 (this) 是独立的。
 * 这样可以避免多个请求之间共享状态，确保数据的隔离性。
 *
 * @param rule 规则本身
 * @param {Function} method - 要调用的异步方法，通常是对象上的方法（例如：moduleObject[method]）
 * @param {Object} injectVars - 用作临时上下文的变量，通常包含一些动态的参数（如：input, MY_URL等）
 * @param {Array} args - 传递给方法的参数列表，会在方法调用时使用
 *
 * @returns {Promise} - 返回异步方法执行的结果，通常是 `await method.apply(...)` 调用的结果
 */
async function invokeWithInjectVars(rule, method, injectVars, args) {
    // return await moduleObject[method].apply(Object.assign(injectVars, moduleObject), args);
    // 这里不使用 bind 或者直接修改原方法，而是通过 apply 临时注入 injectVars 作为 `this` 上下文
    // 这样每次调用时，方法内部的 `this` 会指向 `injectVars`，避免了共享状态，确保数据的隔离性。
    let thisProxy = new Proxy(injectVars, {
        get(injectVars, key) {
            return injectVars[key] || rule[key]
        },
        set(injectVars, key, value) {
            rule[key] = value;
            injectVars[key] = value;
        }
    });
    let result = {};
    let error = null;
    try {
        result = await method.apply(thisProxy, args);
    } catch (e) {
        error = e;
    }
    if (!['推荐'].includes(injectVars['method']) && error) {
        throw error
    }
    // let result = await method.apply(injectVars, args);  // 使用 apply 临时注入 injectVars 作为上下文，并执行方法
    switch (injectVars['method']) {
        case '推荐':
            if (error) {
                log('error:', error);
                error = null;
                result = [];
            }
            break;
        case 'class_parse':
            result = await homeParseAfter(result, rule.类型, rule.hikerListCol, rule.hikerClassListCol, injectVars);
            break;
        case '一级':
            result = await cateParseAfter(rule, result, args[1]);
            console.log(`一级 ${injectVars.input} 执行完毕,结果为:`, JSON.stringify(result.list.slice(0, 2)));
            break;
        case '二级':
            result = await detailParseAfter(result);
            break;
        case '搜索':
            result = await searchParseAfter(rule, result, args[2]);
            console.log(`搜索 ${injectVars.input} 执行完毕,结果为:`, JSON.stringify(result.list.slice(0, 2)));
            break;
        case 'lazy':
            result = await playParseAfter(rule, result, args[1], args[0]);
            console.log(`免嗅 ${injectVars.input} 执行完毕,结果为:`, JSON.stringify(result));
            break;
        case 'proxy_rule':
            break;
        case 'action':
            break;
        default:
            console.log(`invokeWithInjectVars: ${injectVars['method']}`);
            break;
    }
    if (error) {
        throw error
    }
    return result
}

/**
 * 调用模块的指定方法
 * @param {string} filePath - 模块文件路径
 * @param env 全局的环境变量-针对本规则，如代理地址
 * @param {string} method - 要调用的属性方法名称
 * @param args - 传递给方法的普通参数
 * @param {object} injectVars - 需要注入的变量（如 input 和 MY_URL）
 * @returns {Promise<any>} - 方法调用的返回值
 */
async function invokeMethod(filePath, env, method, args = [], injectVars = {}) {
    const moduleObject = await init(filePath, env); // 确保模块已初始化
    switch (method) {
        case 'get_rule':
            return moduleObject;
        case 'class_parse':
            injectVars = await homeParse(moduleObject, ...args);
            if (!injectVars) {
                return {}
            }
            break
        case '推荐':
            injectVars = await homeVodParse(moduleObject, ...args);
            if (!injectVars) {
                return {}
            }
            break
        case '一级':
            injectVars = await cateParse(moduleObject, ...args);
            if (!injectVars) {
                return {}
            }
            break
        case '二级':
            injectVars = await detailParse(moduleObject, ...args);
            if (!injectVars) {
                return {}
            }
            break;
        case '搜索':
            injectVars = await searchParse(moduleObject, ...args);
            if (!injectVars) {
                return {}
            }
            break;
        case 'lazy':
            injectVars = await playParse(moduleObject, ...args);
            if (!injectVars) {
                return {}
            }
            break;
        case 'proxy_rule':
            injectVars = await proxyParse(moduleObject, ...args);
            if (!injectVars) {
                return {}
            }
            break;
    }
    injectVars['method'] = method;
    // 环境变量扩展进入this区域
    Object.assign(injectVars, env);
    if (method === 'lazy') {
        const tmpLazyFunction = async function () {
            let {input} = this;
            return input
        };
        if (moduleObject[method] && typeof moduleObject[method] === 'function') {
            try {
                return await invokeWithInjectVars(moduleObject, moduleObject[method], injectVars, args);
            } catch (e) {
                let playUrl = injectVars.input || '';
                log(`执行免嗅代码发送了错误: ${e.message},原始链接为:${playUrl}`);
                if (SPECIAL_URL.test(playUrl) || /^(push:)/.test(playUrl) || playUrl.startsWith('http')) {
                    return await invokeWithInjectVars(moduleObject, tmpLazyFunction, injectVars, args);
                } else {
                    throw e
                }
            }
        } else if (!moduleObject[method]) {// 新增特性，可以不写lazy属性
            return await invokeWithInjectVars(moduleObject, tmpLazyFunction, injectVars, args);
        }
    } else if (moduleObject[method] && typeof moduleObject[method] === 'function') {
        // console.log('injectVars:', injectVars);
        return await invokeWithInjectVars(moduleObject, moduleObject[method], injectVars, args);
    } else if (!moduleObject[method] && method === 'class_parse') { // 新增特性，可以不写class_parse属性
        const tmpClassFunction = async function () {
        };
        return await invokeWithInjectVars(moduleObject, tmpClassFunction, injectVars, args);
    } else {
        if (['推荐', '一级', '搜索'].includes(method)) {
            return []
        } else if (['二级'].includes(method)) {
            return {}
        } else if (['lazy'].includes(method)) {
            // console.log(injectVars);
            return {
                parse: 1,
                url: injectVars.input,
                header: moduleObject.headers && Object.keys(moduleObject.headers).length > 0 ? moduleObject.headers : undefined
            }
        } else {  // class_parse一定要有，这样即使不返回数据都能自动取class_name和class_url的内容
            throw new Error(`Method ${method} not found in module ${filePath}`);
        }
    }
}

async function initParse(rule, env, vm, context) {
    rule.host = (rule.host || '').rstrip('/');
    // 检查并执行 `hostJs` 方法
    if (typeof rule.hostJs === 'function') {
        log('Executing hostJs...');
        try {
            let HOST = await rule.hostJs.apply({input: rule.host, MY_URL: rule.host, HOST: rule.host});
            if (HOST) {
                rule.host = HOST.rstrip('/');
                log(`已动态设置规则【${rule.title}】的host为: ${rule.host}`);
            }
        } catch (e) {
            log(`hostJs执行错误:${e.message}`);
        }
    }
    let rule_cate_excludes = (rule.cate_exclude || '').split('|').filter(it => it.trim());
    let rule_tab_excludes = (rule.tab_exclude || '').split('|').filter(it => it.trim());
    rule_cate_excludes = rule_cate_excludes.concat(CATE_EXCLUDE.split('|').filter(it => it.trim()));
    rule_tab_excludes = rule_tab_excludes.concat(TAB_EXCLUDE.split('|').filter(it => it.trim()));

    rule.cate_exclude = rule_cate_excludes.join('|');
    rule.tab_exclude = rule_tab_excludes.join('|');

    rule.类型 = rule.类型 || '影视'; // 影视|听书|漫画|小说
    rule.url = rule.url || '';
    rule.double = rule.double || false;
    rule.homeUrl = rule.homeUrl || '';
    rule.detailUrl = rule.detailUrl || '';
    rule.searchUrl = rule.searchUrl || '';
    rule.homeUrl = rule.host && rule.homeUrl ? urljoin(rule.host, rule.homeUrl) : (rule.homeUrl || rule.host);
    rule.homeUrl = jinja.render(rule.homeUrl, {rule: rule});
    rule.detailUrl = rule.host && rule.detailUrl ? urljoin(rule.host, rule.detailUrl) : rule.detailUrl;
    rule.二级访问前 = rule.二级访问前 || '';
    if (rule.url.includes('[') && rule.url.includes(']')) {
        let u1 = rule.url.split('[')[0]
        let u2 = rule.url.split('[')[1].split(']')[0]
        rule.url = rule.host && rule.url ? urljoin(rule.host, u1) + '[' + urljoin(rule.host, u2) + ']' : rule.url;
    } else {
        rule.url = rule.host && rule.url ? urljoin(rule.host, rule.url) : rule.url;
    }
    if (rule.searchUrl.includes('[') && rule.searchUrl.includes(']') && !rule.searchUrl.includes('#')) {
        let u1 = rule.searchUrl.split('[')[0]
        let u2 = rule.searchUrl.split('[')[1].split(']')[0]
        rule.searchUrl = rule.host && rule.searchUrl ? urljoin(rule.host, u1) + '[' + urljoin(rule.host, u2) + ']' : rule.searchUrl;
    } else {
        rule.searchUrl = rule.host && rule.searchUrl ? urljoin(rule.host, rule.searchUrl) : rule.searchUrl;
    }
    rule.timeout = rule.timeout || 5000;
    rule.encoding = rule.编码 || rule.encoding || 'utf-8';
    rule.search_encoding = rule.搜索编码 || rule.search_encoding || '';
    rule.图片来源 = rule.图片来源 || '';
    rule.图片替换 = rule.图片替换 || '';
    rule.play_json = rule.hasOwnProperty('play_json') ? rule.play_json : [];
    rule.pagecount = rule.hasOwnProperty('pagecount') ? rule.pagecount : {};
    rule.proxy_rule = rule.hasOwnProperty('proxy_rule') ? rule.proxy_rule : '';
    if (!rule.hasOwnProperty('sniffer')) { // 默认关闭辅助嗅探
        rule.sniffer = false;
    }
    rule.sniffer = rule.hasOwnProperty('sniffer') ? rule.sniffer : '';
    rule.sniffer = !!(rule.sniffer && rule.sniffer !== '0' && rule.sniffer !== 'false');
    rule.isVideo = rule.hasOwnProperty('isVideo') ? rule.isVideo : '';
    if (rule.sniffer && !rule.isVideo) { // 默认辅助嗅探自动增强嗅探规则
        rule.isVideo = 'http((?!http).){12,}?\\.(m3u8|mp4|flv|avi|mkv|rm|wmv|mpg|m4a|mp3)\\?.*|http((?!http).){12,}\\.(m3u8|mp4|flv|avi|mkv|rm|wmv|mpg|m4a|mp3)|http((?!http).)*?video/tos*|http((?!http).)*?obj/tos*';
    }

    rule.tab_remove = rule.hasOwnProperty('tab_remove') ? rule.tab_remove : [];
    rule.tab_order = rule.hasOwnProperty('tab_order') ? rule.tab_order : [];
    rule.tab_rename = rule.hasOwnProperty('tab_rename') ? rule.tab_rename : {};

    if (rule.headers && typeof (rule.headers) === 'object') {
        try {
            let header_keys = Object.keys(rule.headers);
            for (let k of header_keys) {
                if (k.toLowerCase() === 'user-agent') {
                    let v = rule.headers[k];
                    console.log(v);
                    if (['MOBILE_UA', 'PC_UA', 'UC_UA', 'IOS_UA', 'UA'].includes(v)) {
                        rule.headers[k] = eval(v);
                        log(rule.headers[k])
                    }
                } else if (k.toLowerCase() === 'cookie') {
                    let v = rule.headers[k];
                    if (v && v.startsWith('http')) {
                        console.log(v);
                        try {
                            v = fetch(v);
                            console.log(v);
                            rule.headers[k] = v;
                        } catch (e) {
                            console.log(`从${v}获取cookie发生错误:${e.message}`);
                        }
                    }
                }
            }
        } catch (e) {
            console.log(`处理headers发生错误:${e.message}`);
        }
    } else {
        rule.headers = {}
    }
    // 新版放入规则内部
    rule.oheaders = deepCopy(rule.headers);
    rule.rule_fetch_params = {'headers': rule.headers, 'timeout': rule.timeout, 'encoding': rule.encoding};
    const originalScript = new vm.Script(`
globalThis.oheaders = rule.oheaders
globalThis.rule_fetch_params = rule.rule_fetch_params;
        `);
    originalScript.runInContext(context);

    // 检查并执行 `预处理` 方法
    if (typeof rule.预处理 === 'function') {
        log('Executing 预处理...');
        await rule.预处理(env);
    }

    const otherScript = new vm.Script(`
globalThis.jsp = new jsoup(rule.host||'');
globalThis.pdfh = pdfh;
globalThis.pd = pd;
globalThis.pdfa = pdfa;
globalThis.HOST = rule.host||'';
        `);
    otherScript.runInContext(context);
    return rule
}

async function homeParse(rule) {
    let url = rule.homeUrl;
    if (typeof (rule.filter) === 'string' && rule.filter.trim().length > 0) {
        try {
            let filter_json = ungzip(rule.filter.trim());
            // log(filter_json);
            rule.filter = JSON.parse(filter_json);
        } catch (e) {
            log(`[${rule.title}] filter ungzip或格式化解密出错: ${e.message}`);
            rule.filter = {};
        }
    }
    let classes = [];
    if (rule.class_name && rule.class_url) {
        let names = rule.class_name.split('&');
        let urls = rule.class_url.split('&');
        let cnt = Math.min(names.length, urls.length);
        for (let i = 0; i < cnt; i++) {
            classes.push({
                'type_id': urls[i],
                'type_name': names[i],
                'type_flag': rule['class_flag'],
            });
        }
    }
    const jsp = new jsoup(url);
    return {
        TYPE: 'home',
        input: url,
        MY_URL: url,
        HOST: rule.host,
        classes: classes,
        filters: rule.filter,
        cate_exclude: rule.cate_exclude,
        home_flag: rule.home_flag,
        fetch_params: deepCopy(rule.rule_fetch_params),
        jsp: jsp,
        pdfh: jsp.pdfh.bind(jsp),
        pdfa: jsp.pdfa.bind(jsp),
        pd: jsp.pd.bind(jsp),
        pjfh: jsp.pjfh.bind(jsp),
        pjfa: jsp.pjfa.bind(jsp),
        pj: jsp.pj.bind(jsp),
    }

}

async function homeParseAfter(d, _type, hikerListCol, hikerClassListCol, injectVars) {
    if (!d) {
        d = {};
    }
    d.type = _type || '影视';
    if (hikerListCol) {
        d.hikerListCol = hikerListCol;
    }
    if (hikerClassListCol) {
        d.hikerClassListCol = hikerClassListCol;
    }
    const {
        classes,
        filters,
        cate_exclude,
        home_flag,
    } = injectVars;
    if (!Array.isArray(d.class)) {
        d.class = classes;
    }
    if (!d.filters) {
        d.filters = filters;
    }
    if (!d.list) {
        d.list = [];
    }
    if (!d.type_flag && home_flag) {
        d.type_flag = home_flag;
    }
    d.class = d.class.filter(it => !cate_exclude || !(new RegExp(cate_exclude).test(it.type_name)));
    return d
}

async function homeVodParse(rule) {
    let url = rule.homeUrl;
    const jsp = new jsoup(url);
    return {
        TYPE: 'home',
        input: url,
        MY_URL: url,
        HOST: rule.host,
        double: rule.double,
        fetch_params: deepCopy(rule.rule_fetch_params),
        jsp: jsp,
        pdfh: jsp.pdfh.bind(jsp),
        pdfa: jsp.pdfa.bind(jsp),
        pd: jsp.pd.bind(jsp),
        pjfh: jsp.pjfh.bind(jsp),
        pjfa: jsp.pjfa.bind(jsp),
        pj: jsp.pj.bind(jsp),
    }
}

async function cateParse(rule, tid, pg, filter, extend) {
    log(tid, pg, filter, extend);
    let url = rule.url.replaceAll('fyclass', tid);
    if (pg === 1 && url.includes('[') && url.includes(']')) {
        url = url.split('[')[1].split(']')[0];
    } else if (pg > 1 && url.includes('[') && url.includes(']')) {
        url = url.split('[')[0];
    }
    if (rule.filter_url) {
        if (!/fyfilter/.test(url)) {
            if (!url.endsWith('&') && !rule.filter_url.startsWith('&')) {
                url += '&'
            }
            url += rule.filter_url;
        } else {
            url = url.replace('fyfilter', rule.filter_url);
        }
        url = url.replaceAll('fyclass', tid);
        let fl = filter ? extend : {};
        if (rule.filter_def && typeof (rule.filter_def) === 'object') {
            try {
                if (Object.keys(rule.filter_def).length > 0 && rule.filter_def.hasOwnProperty(tid)) {
                    let self_fl_def = rule.filter_def[tid];
                    if (self_fl_def && typeof (self_fl_def) === 'object') {
                        let fl_def = deepCopy(self_fl_def);
                        fl = Object.assign(fl_def, fl);
                    }
                }
            } catch (e) {
                log(`合并不同分类对应的默认筛选出错:${e.message}`);
            }
        }
        let new_url;
        new_url = jinja.render(url, {fl: fl, fyclass: tid});
        url = new_url;
    }
    if (/fypage/.test(url)) {
        if (url.includes('(') && url.includes(')')) {
            let url_rep = url.match(/.*?\((.*)\)/)[1];
            let cnt_page = url_rep.replaceAll('fypage', pg);
            let cnt_pg = eval(cnt_page);
            url = url.replaceAll(url_rep, cnt_pg).replaceAll('(', '').replaceAll(')', '');
        } else {
            url = url.replaceAll('fypage', pg);
        }
    }
    const jsp = new jsoup(url);
    return {
        MY_CATE: tid,
        MY_FL: extend,
        TYPE: 'cate',
        input: url,
        MY_URL: url,
        HOST: rule.host,
        MY_PAGE: pg,
        fetch_params: deepCopy(rule.rule_fetch_params),
        jsp: jsp,
        pdfh: jsp.pdfh.bind(jsp),
        pdfa: jsp.pdfa.bind(jsp),
        pd: jsp.pd.bind(jsp),
        pjfh: jsp.pjfh.bind(jsp),
        pjfa: jsp.pjfa.bind(jsp),
        pj: jsp.pj.bind(jsp),
    }
}

async function cateParseAfter(rule, d, pg) {
    return d.length < 1 ? nodata : {
        'page': parseInt(pg),
        'pagecount': 9999,
        'limit': Number(rule.limit) || 20,
        'total': 999999,
        'list': d,
    }
}

async function detailParse(rule, ids) {
    let vid = ids[0].toString();
    let orId = vid;
    let fyclass = '';
    log('orId:' + orId);
    if (vid.indexOf('$') > -1) {
        let tmp = vid.split('$');
        fyclass = tmp[0];
        vid = tmp[1];
    }
    let detailUrl = vid.split('@@')[0];
    let url;
    if (!detailUrl.startsWith('http') && !detailUrl.includes('/')) {
        url = rule.detailUrl.replaceAll('fyid', detailUrl).replaceAll('fyclass', fyclass);
    } else if (detailUrl.includes('/')) {
        url = urljoin(rule.homeUrl, detailUrl);
    } else {
        url = detailUrl
    }
    const jsp = new jsoup(url);
    return {
        TYPE: 'detail',
        input: url,
        vid: vid,
        orId: orId,
        fyclass: fyclass,
        MY_URL: url,
        HOST: rule.host,
        fetch_params: deepCopy(rule.rule_fetch_params),
        jsp: jsp,
        pdfh: jsp.pdfh.bind(jsp),
        pdfa: jsp.pdfa.bind(jsp),
        pd: jsp.pd.bind(jsp),
        pdfl: jsp.pdfl.bind(jsp), // 二级绑定pdfl函数
        pjfh: jsp.pjfh.bind(jsp),
        pjfa: jsp.pjfa.bind(jsp),
        pj: jsp.pj.bind(jsp),
    }
}

async function detailParseAfter(vod) {
    return {
        list: [vod]
    }
}

async function searchParse(rule, wd, quick, pg) {
    if (rule.search_encoding) {
        if (rule.search_encoding.toLowerCase() !== 'utf-8') {
            // 按搜索编码进行编码
            wd = encodeStr(wd, rule.search_encoding);
        }
    } else if (rule.encoding && rule.encoding.toLowerCase() !== 'utf-8') {
        // 按全局编码进行编码
        wd = encodeStr(wd, rule.encoding);
    }
    if (!rule.searchUrl) {
        return
    }
    if (rule.searchNoPage && Number(pg) > 1) {
        // 关闭搜索分页
        return '{}'
    }
    let url = rule.searchUrl.replaceAll('**', wd);
    if (pg === 1 && url.includes('[') && url.includes(']') && !url.includes('#')) {
        url = url.split('[')[1].split(']')[0];
    } else if (pg > 1 && url.includes('[') && url.includes(']') && !url.includes('#')) {
        url = url.split('[')[0];
    }

    if (/fypage/.test(url)) {
        if (url.includes('(') && url.includes(')')) {
            let url_rep = url.match(/.*?\((.*)\)/)[1];
            let cnt_page = url_rep.replaceAll('fypage', pg);
            let cnt_pg = eval(cnt_page);
            url = url.replaceAll(url_rep, cnt_pg).replaceAll('(', '').replaceAll(')', '');
        } else {
            url = url.replaceAll('fypage', pg);
        }
    }
    const jsp = new jsoup(url);
    return {
        TYPE: 'search',
        MY_PAGE: pg,
        KEY: wd,
        input: url,
        MY_URL: url,
        HOST: rule.host,
        detailUrl: rule.detailUrl || '',
        fetch_params: deepCopy(rule.rule_fetch_params),
        jsp: jsp,
        pdfh: jsp.pdfh.bind(jsp),
        pdfa: jsp.pdfa.bind(jsp),
        pd: jsp.pd.bind(jsp),
        pjfh: jsp.pjfh.bind(jsp),
        pjfa: jsp.pjfa.bind(jsp),
        pj: jsp.pj.bind(jsp),
    }

}

async function searchParseAfter(rule, d, pg) {
    return {
        'page': parseInt(pg),
        'pagecount': 9999,
        'limit': Number(rule.limit) || 20,
        'total': 999999,
        'list': d,
    }
}

async function playParse(rule, flag, id, flags) {
    let url = id;
    if (!/http/.test(url)) {
        try {
            url = base64Decode(url);
            log('[playParse]: id is base64 data');
        } catch (e) {
        }
    }
    url = decodeURIComponent(url);
    if (!/^http/.test(url)) {
        url = id;
    }
    if (id !== url) {
        log(`[playParse]: ${id} => ${url}`);
    } else {
        log(`[playParse]: ${url}`);
    }
    const jsp = new jsoup(url);
    return {
        TYPE: 'play',
        MY_FLAG: flag,
        flag: flag,
        input: url,
        MY_URL: url,
        HOST: rule.host,
        fetch_params: deepCopy(rule.rule_fetch_params),
        jsp: jsp,
        pdfh: jsp.pdfh.bind(jsp),
        pdfa: jsp.pdfa.bind(jsp),
        pd: jsp.pd.bind(jsp),
        pjfh: jsp.pjfh.bind(jsp),
        pjfa: jsp.pjfa.bind(jsp),
        pj: jsp.pj.bind(jsp),
    }
}

async function playParseAfter(rule, obj, playUrl, flag) {
    let common_play = {
        parse: SPECIAL_URL.test(playUrl) || /^(push:)/.test(playUrl) ? 0 : 1,
        url: playUrl,
        flag: flag,
        jx: tellIsJx(playUrl)
    };
    let lazy_play;
    if (!rule.play_parse || !rule.lazy) {
        lazy_play = common_play;
    } else if (rule.play_parse && rule.lazy && typeof (rule.lazy) === 'function') {
        try {
            lazy_play = typeof (obj) === 'object' ? obj : {
                parse: SPECIAL_URL.test(obj) || /^(push:)/.test(obj) ? 0 : 1,
                jx: tellIsJx(obj),
                url: obj
            };
        } catch (e) {
            log(`js免嗅错误:${e.message}`);
            lazy_play = common_play;
        }
    } else {
        lazy_play = common_play;
    }
    if (Array.isArray(rule.play_json) && rule.play_json.length > 0) { // 数组情况判断长度大于0
        let web_url = lazy_play.url;
        for (let pjson of rule.play_json) {
            if (pjson.re && (pjson.re === '*' || web_url.match(new RegExp(pjson.re)))) {
                if (pjson.json && typeof (pjson.json) === 'object') {
                    let base_json = pjson.json;
                    lazy_play = Object.assign(lazy_play, base_json);
                    break;
                }
            }
        }
    } else if (rule.play_json && !Array.isArray(rule.play_json)) { // 其他情况 非[] 判断true/false
        let base_json = {
            jx: 1,
            parse: 1,
        };
        lazy_play = Object.assign(lazy_play, base_json);
    } else if (!rule.play_json) { // 不解析传0
        let base_json = {
            jx: 0,
            parse: 1,
        };
        lazy_play = Object.assign(lazy_play, base_json);
    }
    return lazy_play
}

async function proxyParse(rule, params) {
    // log('proxyParse:', params);
    return {
        TYPE: 'proxy',
        input: params.url || '',
        MY_URL: params.url || '',
    }
}

export async function home(filePath, env, filter = 1) {
    return await invokeMethod(filePath, env, 'class_parse', [filter], {
        input: '$.homeUrl',
        MY_URL: '$.homeUrl'
    });
}

export async function homeVod(filePath, env) {
    return await invokeMethod(filePath, env, '推荐', [], {
        input: '$.homeUrl',
        MY_URL: '$.homeUrl'
    });
}

export async function cate(filePath, env, tid, pg = 1, filter = 1, extend = {}) {
    return await invokeMethod(filePath, env, '一级', [tid, pg, filter, extend], {
        input: '$.url',
        MY_URL: '$.url'
    });
}

export async function detail(filePath, env, ids) {
    if (!Array.isArray(ids)) throw new Error('Parameter "ids" must be an array');
    return await invokeMethod(filePath, env, '二级', [ids], {
        input: `${ids[0]}`,
        MY_URL: `${ids[0]}`
    });
}

export async function search(filePath, env, wd, quick = 0, pg = 1) {
    return await invokeMethod(filePath, env, '搜索', [wd, quick, pg], {
        input: '$.searchUrl',
        MY_URL: '$.searchUrl'
    });
}

export async function play(filePath, env, flag, id, flags) {
    flags = flags || [];
    if (!Array.isArray(flags)) throw new Error('Parameter "flags" must be an array');
    return await invokeMethod(filePath, env, 'lazy', [flag, id, flags], {
        input: `${id}`,
        MY_URL: `${id}`,
    });
}

export async function proxy(filePath, env, params) {
    params = params || {};
    try {
        return await invokeMethod(filePath, env, 'proxy_rule', [deepCopy(params)], {
            input: `${params.url}`,
            MY_URL: `${params.url}`,
        });
    } catch (e) {
        return [500, 'text/plain', '代理规则错误:' + e.message]
    }
}

export async function action(filePath, env, action, value) {
    try {
        return await invokeMethod(filePath, env, 'action', [action, value], {});
    } catch (e) {
        return '动作规则错误:' + e.message
    }
}

export async function getRule(filePath, env) {
    return await invokeMethod(filePath, env, 'get_rule', [], {});
}

export async function jx(filePath, env, params) {
    params = params || {};
    try {
        const jxObj = await initJx(filePath, env); // 确保模块已初始化
        const lazy = await jxObj.lazy;
        const result = await lazy(params.url || '', params);
        // log(`[jx]: ${JSON.stringify(result)}`);
        return result;
    } catch (e) {
        return {code: 404, url: '', msg: `${filePath} 代理解析错误:${e.message}`, cost: ''}
    }
}

export async function getJx(filePath) {
    try {
        // 确保模块已初始化
        const jxObj = await initJx(filePath, {});
        // console.log('jxObj:', jxObj);
        return jxObj;
    } catch (e) {
        return {code: 403, error: `${filePath} 获取代理信息错误:${e.message}`}
    }
}

/**
 * 获取加密前的原始的js源文本
 * @param js_code
 */
export function getOriginalJs(js_code) {
    let current_match = /var rule|[\u4E00-\u9FA5]+|function|let |var |const |\(|\)|"|'/;
    if (current_match.test(js_code)) {
        return js_code
    }
    let rsa_private_key = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqin/jUpqM6+fgYP/oMqj9zcdHMM0mEZXLeTyixIJWP53lzJV2N2E3OP6BBpUmq2O1a9aLnTIbADBaTulTNiOnVGoNG58umBnupnbmmF8iARbDp2mTzdMMeEgLdrfXS6Y3VvazKYALP8EhEQykQVarexR78vRq7ltY3quXx7cgI0ROfZz5Sw3UOLQJ+VoWmwIxu9AMEZLVzFDQN93hzuzs3tNyHK6xspBGB7zGbwCg+TKi0JeqPDrXxYUpAz1cQ/MO+Da0WgvkXnvrry8NQROHejdLVOAslgr6vYthH9bKbsGyNY3H+P12kcxo9RAcVveONnZbcMyxjtF5dWblaernAgMBAAECggEAGdEHlSEPFmAr5PKqKrtoi6tYDHXdyHKHC5tZy4YV+Pp+a6gxxAiUJejx1hRqBcWSPYeKne35BM9dgn5JofgjI5SKzVsuGL6bxl3ayAOu+xXRHWM9f0t8NHoM5fdd0zC3g88dX3fb01geY2QSVtcxSJpEOpNH3twgZe6naT2pgiq1S4okpkpldJPo5GYWGKMCHSLnKGyhwS76gF8bTPLoay9Jxk70uv6BDUMlA4ICENjmsYtd3oirWwLwYMEJbSFMlyJvB7hjOjR/4RpT4FPnlSsIpuRtkCYXD4jdhxGlvpXREw97UF2wwnEUnfgiZJ2FT/MWmvGGoaV/CfboLsLZuQKBgQDTNZdJrs8dbijynHZuuRwvXvwC03GDpEJO6c1tbZ1s9wjRyOZjBbQFRjDgFeWs9/T1aNBLUrgsQL9c9nzgUziXjr1Nmu52I0Mwxi13Km/q3mT+aQfdgNdu6ojsI5apQQHnN/9yMhF6sNHg63YOpH+b+1bGRCtr1XubuLlumKKscwKBgQDOtQ2lQjMtwsqJmyiyRLiUOChtvQ5XI7B2mhKCGi8kZ+WEAbNQcmThPesVzW+puER6D4Ar4hgsh9gCeuTaOzbRfZ+RLn3Aksu2WJEzfs6UrGvm6DU1INn0z/tPYRAwPX7sxoZZGxqML/z+/yQdf2DREoPdClcDa2Lmf1KpHdB+vQKBgBXFCVHz7a8n4pqXG/HvrIMJdEpKRwH9lUQS/zSPPtGzaLpOzchZFyQQBwuh1imM6Te+VPHeldMh3VeUpGxux39/m+160adlnRBS7O7CdgSsZZZ/dusS06HAFNraFDZf1/VgJTk9BeYygX+AZYu+0tReBKSs9BjKSVJUqPBIVUQXAoGBAJcZ7J6oVMcXxHxwqoAeEhtvLcaCU9BJK36XQ/5M67ceJ72mjJC6/plUbNukMAMNyyi62gO6I9exearecRpB/OGIhjNXm99Ar59dAM9228X8gGfryLFMkWcO/fNZzb6lxXmJ6b2LPY3KqpMwqRLTAU/zy+ax30eFoWdDHYa4X6e1AoGAfa8asVGOJ8GL9dlWufEeFkDEDKO9ww5GdnpN+wqLwePWqeJhWCHad7bge6SnlylJp5aZXl1+YaBTtOskC4Whq9TP2J+dNIgxsaF5EFZQJr8Xv+lY9lu0CruYOh9nTNF9x3nubxJgaSid/7yRPfAGnsJRiknB5bsrCvgsFQFjJVs=';
    let decode_content = '';

    function aes_decrypt(data) {
        // log(data);
        let key = CryptoJS.enc.Hex.parse("686A64686E780A0A0A0A0A0A0A0A0A0A");
        let iv = CryptoJS.enc.Hex.parse("647A797964730A0A0A0A0A0A0A0A0A0A");
        let ciphertext = CryptoJS.enc.Base64.parse(data);
        let decrypted = CryptoJS.AES.decrypt({ciphertext: ciphertext}, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8);
        // log(decrypted);
        return decrypted;
    }

    let error_log = false;

    function logger(text) {
        // console.log('[logger]:', text);
        if (error_log) {
            log(text);
        }
    }

    let decode_funcs = [
        (text) => {
            try {
                return ungzip(text)
            } catch (e) {
                logger('非gzip加密');
                return ''
            }
        },
        (text) => {
            try {
                return base64Decode(text)
            } catch (e) {
                logger('非b64加密');
                return ''
            }
        },
        (text) => {
            try {
                return aes_decrypt(text)
            } catch (e) {
                logger('非aes加密');
                return ''
            }
        },
        (text) => {
            try {
                return RSA.decode(text, rsa_private_key, null)
            } catch (e) {
                logger('非rsa加密');
                return ''
            }
        },
        // (text) => {
        //     try {
        //         return NODERSA.decryptRSAWithPrivateKey(text, RSA.getPrivateKey(rsa_private_key).replace(/RSA /g, ''), {
        //             options: {
        //                 environment: "browser",
        //                 encryptionScheme: 'pkcs1',
        //                 b: '1024'
        //             }
        //         });
        //     } catch (e) {
        //         log(e.message);
        //         return ''
        //     }
        // },
    ]
    let func_index = 0
    while (!current_match.test(decode_content)) {
        decode_content = decode_funcs[func_index](js_code);
        func_index++;
        if (func_index >= decode_funcs.length) {
            break;
        }
    }
    return decode_content
}

export const jsEncoder = {
    base64Encode,
    gzip,
    aes_encrypt: function (data) {
        // 定义密钥和初始向量，必须与解密时一致
        let key = CryptoJS.enc.Hex.parse("686A64686E780A0A0A0A0A0A0A0A0A0A");
        let iv = CryptoJS.enc.Hex.parse("647A797964730A0A0A0A0A0A0A0A0A0A");

        // 使用AES加密
        let encrypted = CryptoJS.AES.encrypt(data, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // 返回Base64编码的加密结果
        return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        // 返回完整的加密结果（包括 IV 和其他元数据）
        // return encrypted.toString(); // Base64 格式
    },

    rsa_encode: function (text) {
        let rsa_private_key = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqin/jUpqM6+fgYP/oMqj9zcdHMM0mEZXLeTyixIJWP53lzJV2N2E3OP6BBpUmq2O1a9aLnTIbADBaTulTNiOnVGoNG58umBnupnbmmF8iARbDp2mTzdMMeEgLdrfXS6Y3VvazKYALP8EhEQykQVarexR78vRq7ltY3quXx7cgI0ROfZz5Sw3UOLQJ+VoWmwIxu9AMEZLVzFDQN93hzuzs3tNyHK6xspBGB7zGbwCg+TKi0JeqPDrXxYUpAz1cQ/MO+Da0WgvkXnvrry8NQROHejdLVOAslgr6vYthH9bKbsGyNY3H+P12kcxo9RAcVveONnZbcMyxjtF5dWblaernAgMBAAECggEAGdEHlSEPFmAr5PKqKrtoi6tYDHXdyHKHC5tZy4YV+Pp+a6gxxAiUJejx1hRqBcWSPYeKne35BM9dgn5JofgjI5SKzVsuGL6bxl3ayAOu+xXRHWM9f0t8NHoM5fdd0zC3g88dX3fb01geY2QSVtcxSJpEOpNH3twgZe6naT2pgiq1S4okpkpldJPo5GYWGKMCHSLnKGyhwS76gF8bTPLoay9Jxk70uv6BDUMlA4ICENjmsYtd3oirWwLwYMEJbSFMlyJvB7hjOjR/4RpT4FPnlSsIpuRtkCYXD4jdhxGlvpXREw97UF2wwnEUnfgiZJ2FT/MWmvGGoaV/CfboLsLZuQKBgQDTNZdJrs8dbijynHZuuRwvXvwC03GDpEJO6c1tbZ1s9wjRyOZjBbQFRjDgFeWs9/T1aNBLUrgsQL9c9nzgUziXjr1Nmu52I0Mwxi13Km/q3mT+aQfdgNdu6ojsI5apQQHnN/9yMhF6sNHg63YOpH+b+1bGRCtr1XubuLlumKKscwKBgQDOtQ2lQjMtwsqJmyiyRLiUOChtvQ5XI7B2mhKCGi8kZ+WEAbNQcmThPesVzW+puER6D4Ar4hgsh9gCeuTaOzbRfZ+RLn3Aksu2WJEzfs6UrGvm6DU1INn0z/tPYRAwPX7sxoZZGxqML/z+/yQdf2DREoPdClcDa2Lmf1KpHdB+vQKBgBXFCVHz7a8n4pqXG/HvrIMJdEpKRwH9lUQS/zSPPtGzaLpOzchZFyQQBwuh1imM6Te+VPHeldMh3VeUpGxux39/m+160adlnRBS7O7CdgSsZZZ/dusS06HAFNraFDZf1/VgJTk9BeYygX+AZYu+0tReBKSs9BjKSVJUqPBIVUQXAoGBAJcZ7J6oVMcXxHxwqoAeEhtvLcaCU9BJK36XQ/5M67ceJ72mjJC6/plUbNukMAMNyyi62gO6I9exearecRpB/OGIhjNXm99Ar59dAM9228X8gGfryLFMkWcO/fNZzb6lxXmJ6b2LPY3KqpMwqRLTAU/zy+ax30eFoWdDHYa4X6e1AoGAfa8asVGOJ8GL9dlWufEeFkDEDKO9ww5GdnpN+wqLwePWqeJhWCHad7bge6SnlylJp5aZXl1+YaBTtOskC4Whq9TP2J+dNIgxsaF5EFZQJr8Xv+lY9lu0CruYOh9nTNF9x3nubxJgaSid/7yRPfAGnsJRiknB5bsrCvgsFQFjJVs=';
        return RSA.encode(text, rsa_private_key, null);
    }
};

export const jsDecoder = {
    base64Decode,
    ungzip,
    aes_decrypt: function (data) {
        let key = CryptoJS.enc.Hex.parse("686A64686E780A0A0A0A0A0A0A0A0A0A");
        let iv = CryptoJS.enc.Hex.parse("647A797964730A0A0A0A0A0A0A0A0A0A");
        let ciphertext = CryptoJS.enc.Base64.parse(data);
        let decrypted = CryptoJS.AES.decrypt({ciphertext: ciphertext}, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8);
        return decrypted;
    },
    rsa_decode: function (text) {
        let rsa_private_key = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqin/jUpqM6+fgYP/oMqj9zcdHMM0mEZXLeTyixIJWP53lzJV2N2E3OP6BBpUmq2O1a9aLnTIbADBaTulTNiOnVGoNG58umBnupnbmmF8iARbDp2mTzdMMeEgLdrfXS6Y3VvazKYALP8EhEQykQVarexR78vRq7ltY3quXx7cgI0ROfZz5Sw3UOLQJ+VoWmwIxu9AMEZLVzFDQN93hzuzs3tNyHK6xspBGB7zGbwCg+TKi0JeqPDrXxYUpAz1cQ/MO+Da0WgvkXnvrry8NQROHejdLVOAslgr6vYthH9bKbsGyNY3H+P12kcxo9RAcVveONnZbcMyxjtF5dWblaernAgMBAAECggEAGdEHlSEPFmAr5PKqKrtoi6tYDHXdyHKHC5tZy4YV+Pp+a6gxxAiUJejx1hRqBcWSPYeKne35BM9dgn5JofgjI5SKzVsuGL6bxl3ayAOu+xXRHWM9f0t8NHoM5fdd0zC3g88dX3fb01geY2QSVtcxSJpEOpNH3twgZe6naT2pgiq1S4okpkpldJPo5GYWGKMCHSLnKGyhwS76gF8bTPLoay9Jxk70uv6BDUMlA4ICENjmsYtd3oirWwLwYMEJbSFMlyJvB7hjOjR/4RpT4FPnlSsIpuRtkCYXD4jdhxGlvpXREw97UF2wwnEUnfgiZJ2FT/MWmvGGoaV/CfboLsLZuQKBgQDTNZdJrs8dbijynHZuuRwvXvwC03GDpEJO6c1tbZ1s9wjRyOZjBbQFRjDgFeWs9/T1aNBLUrgsQL9c9nzgUziXjr1Nmu52I0Mwxi13Km/q3mT+aQfdgNdu6ojsI5apQQHnN/9yMhF6sNHg63YOpH+b+1bGRCtr1XubuLlumKKscwKBgQDOtQ2lQjMtwsqJmyiyRLiUOChtvQ5XI7B2mhKCGi8kZ+WEAbNQcmThPesVzW+puER6D4Ar4hgsh9gCeuTaOzbRfZ+RLn3Aksu2WJEzfs6UrGvm6DU1INn0z/tPYRAwPX7sxoZZGxqML/z+/yQdf2DREoPdClcDa2Lmf1KpHdB+vQKBgBXFCVHz7a8n4pqXG/HvrIMJdEpKRwH9lUQS/zSPPtGzaLpOzchZFyQQBwuh1imM6Te+VPHeldMh3VeUpGxux39/m+160adlnRBS7O7CdgSsZZZ/dusS06HAFNraFDZf1/VgJTk9BeYygX+AZYu+0tReBKSs9BjKSVJUqPBIVUQXAoGBAJcZ7J6oVMcXxHxwqoAeEhtvLcaCU9BJK36XQ/5M67ceJ72mjJC6/plUbNukMAMNyyi62gO6I9exearecRpB/OGIhjNXm99Ar59dAM9228X8gGfryLFMkWcO/fNZzb6lxXmJ6b2LPY3KqpMwqRLTAU/zy+ax30eFoWdDHYa4X6e1AoGAfa8asVGOJ8GL9dlWufEeFkDEDKO9ww5GdnpN+wqLwePWqeJhWCHad7bge6SnlylJp5aZXl1+YaBTtOskC4Whq9TP2J+dNIgxsaF5EFZQJr8Xv+lY9lu0CruYOh9nTNF9x3nubxJgaSid/7yRPfAGnsJRiknB5bsrCvgsFQFjJVs=';
        return RSA.decode(text, rsa_private_key, null);
    }
};


/**
 * 执行main函数
 * 示例  function main(text){return gzip(text)}
 * @param main_func_code
 * @param arg
 */
export async function runMain(main_func_code, arg) {
    let mainFunc = async function () {
        return ''
    };
    try {
        eval(main_func_code + '\nmainFunc=main;');
        return mainFunc(arg);
    } catch (e) {
        log(`执行main_func_code发生了错误:${e.message}`);
        return ''
    }
}