import path from "path";
import {readFile} from "fs/promises";
import {getSitesMap} from "../utils/sites-map.js";
import {computeHash, deepCopy, getNowTime, urljoin} from "../utils/utils.js";
import {fileURLToPath} from 'url';
import {md5} from "../libs_drpy/crypto-util.js";
import {PythonShell, PythonShellError} from 'python-shell';
import {fastify} from "../controllers/fastlogger.js";
import {daemon} from "../utils/daemonManager.js";
import {netCallPythonMethod} from '../spider/py/core/bridge.js';

// 缓存已初始化的模块和文件 hash 值
const moduleCache = new Map();
const ruleObjectCache = new Map();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _data_path = path.join(__dirname, '../data');
const _config_path = path.join(__dirname, '../config');
const _lib_path = path.join(__dirname, '../spider/py');
const timeout = 30000; // 30秒超时

function stringify(arg) {
    return Array.isArray(arg) || typeof arg == "object" ? JSON.stringify(arg) : arg
}

const json2Object = function (json) {
    // console.log('json2Object:', json);
    if (!json) {
        return {}
    } else if (json && typeof json === 'object') {
        return json
    }
    return JSON.parse(json);
}

const loadEsmWithHash = async function (filePath, fileHash, env) {
    // 创建Python模块代理
    const spiderProxy = {};
    const bridgePath = path.join(_lib_path, '_bridge.py'); // 桥接脚本路径

    // 创建方法调用函数
    const callPythonMethodOld = async (methodName, env, ...args) => {

        const options = {
            mode: 'text',     // 使用JSON模式自动解析
            pythonOptions: ['-u'], // 无缓冲输出
            // scriptPath: path.dirname(bridgePath),
            timeout: timeout,
            env: {
                "PYTHONIOENCODING": 'utf-8',
            }
        };
        // 将参数序列化为JSON字符串
        const jsonArgs = args.map(arg => JSON.stringify(arg));
        console.log(methodName, ...jsonArgs);
        try {
            const results = await PythonShell.run(bridgePath, {
                ...options,
                args: [filePath, methodName, JSON.stringify(env), ...jsonArgs]
            });
            // 取最后一条返回
            let vodResult = results.slice(-1)[0];
            // if (methodName !== 'init') {
            //     console.log(vodResult);
            // }
            if (typeof vodResult === 'string' && vodResult) {
                switch (vodResult) {
                    case 'None':
                        vodResult = null;
                        break;
                    case 'True':
                        vodResult = true;
                        break;
                    case 'False':
                        vodResult = false;
                        break;
                    default:
                        vodResult = JSON5.parse(vodResult);
                        break;

                }
            }
            // console.log('hipy logs:', results.slice(0, -1));
            fastify.log.info(`hipy logs: ${JSON.stringify(results.slice(0, -1))}`);
            // fastify.log.info(`typeof vodResult: ${typeof vodResult}`);
            // console.log('vodResult:', vodResult);
            // 检查是否有错误
            if (vodResult && vodResult.error) {
                throw new Error(`Python错误: ${vodResult.error}\n${vodResult.traceback}`);
            }

            return vodResult; // 返回最后1个结果集
        } catch (error) {
            console.error('error:', error);
            if (error instanceof PythonShellError) {
                // 尝试解析Python的错误输出
                try {
                    const errorData = JSON.parse(error.message);
                    throw new Error(`Python错误: ${errorData.error}\n${errorData.traceback}`);
                } catch (e) {
                    throw new Error(`Python执行错误: ${error.message}`);
                }
            }
            throw error;
        }
    };

    const callPythonMethod = async (methodName, env, ...args) => {
        const config = daemon.getDaemonConfig();
        const command = [
            `"${daemon.getPythonPath()}"`,
            `"${config.clientScript}"`,
            `--script-path "${filePath}"`,
            `--method-name "${methodName}"`,
            `--env '${JSON.stringify(env)}'`,
            ...args.map(arg => `--arg '${stringify(arg)}'`)
        ].join(' ');
        // console.log(command);
        const cmd_args = [];
        args.forEach(arg => {
            cmd_args.push(`--arg`);
            cmd_args.push(`${stringify(arg)}`);
        });
        const options = {
            mode: 'text',
            pythonPath: daemon.getPythonPath(),
            pythonOptions: ['-u'], // 无缓冲输出
            env: {
                "PYTHONIOENCODING": 'utf-8',
            },
            args: [
                '--script-path', filePath,
                '--method-name', methodName,
                '--env', JSON.stringify(env),
                ...cmd_args
            ]
        };
        const results = await PythonShell.run(config.clientScript, {
            ...options,
        });
        // 取最后一条返回
        const stdout = results.slice(-1)[0];
        fastify.log.info(`hipy logs: ${JSON.stringify(results.slice(0, -1))}`);
        // console.log(`hipy logs: ${JSON.stringify(results.slice(0, -1))}`);
        let vodResult = {};
        if (typeof stdout === 'string' && stdout) {
            switch (stdout) {
                case 'None':
                    vodResult = null;
                    break;
                case 'True':
                    vodResult = true;
                    break;
                case 'False':
                    vodResult = false;
                    break;
                default:
                    vodResult = JSON5.parse(stdout);
                    break;
            }
        }
        // console.log(typeof vodResult);
        // 检查是否有错误
        if (vodResult && vodResult.error) {
            throw new Error(`Python错误: ${vodResult.error}\n${vodResult.traceback}`);
        }
        // console.log(vodResult);
        return vodResult.result;
    }

    // 定义Spider类的方法
    const spiderMethods = [
        'init', 'home', 'homeVod', 'homeContent', 'category',
        'detail', 'search', 'play', 'proxy', 'action'
    ];

    // 为代理对象添加方法
    spiderMethods.forEach(method => {
        spiderProxy[method] = async (...args) => {
            // return callPythonMethod(method, env, ...args);
            return netCallPythonMethod(filePath, method, env, ...args);
        };
    });

    return spiderProxy;
}

const getRule = async function (filePath, env) {
    const moduleObject = await init(filePath, env);
    return JSON.stringify(moduleObject);
}

const init = async function (filePath, env = {}, refresh) {
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        const fileHash = computeHash(fileContent);
        const moduleName = path.basename(filePath, '.js');
        let moduleExt = env.ext || '';
        // const default_init_cfg = { // T3才需要这种结构
        //     stype: 4, //T3/T4 源类型
        //     skey: `hipy_${moduleName}`,
        //     sourceKey: `hipy_${moduleName}`,
        //     ext: moduleExt,
        // };
        let SitesMap = getSitesMap(_config_path);
        if (moduleExt && SitesMap[moduleName]) {
            try {
                moduleExt = ungzip(moduleExt);
            } catch (e) {
                log(`[${moduleName}] ungzip解密moduleExt失败: ${e.message}`);
            }
            if (!SitesMap[moduleName].find(i => i.queryStr === moduleExt) && !SitesMap[moduleName].find(i => i.queryObject.params === moduleExt)) {
                throw new Error("moduleExt is wrong!")
            }
            if (moduleExt.startsWith('../json')) {
                moduleExt = urljoin(env.jsonUrl, moduleExt.slice(8));
            }
        }
        let hashMd5 = md5(filePath + '#pAq#' + moduleExt);
        if (moduleCache.has(hashMd5) && !refresh) {
            const cached = moduleCache.get(hashMd5);
            // 除hash外还必须保证proxyUrl实时相等，避免本地代理url的尴尬情况
            if (cached.hash === fileHash && cached.proxyUrl === env.proxyUrl) {
                // console.log('cached init');
                return cached.moduleObject;
            }
        }
        log(`Loading module: ${filePath}`);
        let t1 = getNowTime();
        let module;
        module = await loadEsmWithHash(filePath, fileHash, env);
        // console.log('module:', module);
        const rule = module;
        // const initValue = await rule.init(default_init_cfg) || {};
        const initValue = await rule.init(moduleExt) || {};
        let t2 = getNowTime();
        const moduleObject = deepCopy(rule);
        moduleObject.cost = t2 - t1;
        moduleCache.set(hashMd5, {moduleObject, hash: fileHash, proxyUrl: env.proxyUrl});
        // return moduleObject;
        return {...moduleObject, ...initValue};
    } catch (error) {
        console.log(`Error in hipy.init :${filePath}`, error);
        throw new Error(`Failed to initialize module:${error.message}`);
    }
}

const home = async function (filePath, env, filter = 1) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.home(filter));
}

const homeVod = async function (filePath, env) {
    const moduleObject = await init(filePath, env);
    const homeVodResult = json2Object(await moduleObject.homeVod());
    return homeVodResult && homeVodResult.list ? homeVodResult.list : homeVodResult;
}


const category = async function (filePath, env, tid, pg = 1, filter = 1, extend = {}) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.category(tid, pg, filter, extend));
}

const detail = async function (filePath, env, ids) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.detail(ids));
}


const search = async function (filePath, env, wd, quick = 0, pg = 1) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.search(wd, quick, pg));
}

const play = async function (filePath, env, flag, id, flags) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.play(flag, id, flags));
}


const proxy = async function (filePath, env, params) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.proxy(params));
}

const action = async function (filePath, env, action, value) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.action(action, value));
}

export default {
    getRule,
    init,
    home,
    homeVod,
    category,
    detail,
    search,
    play,
    proxy,
    action,
}