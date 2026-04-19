// esm-register.mjs
import { register } from 'module';
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets_path = path.join(__dirname, '../spider/catvod');

// --- Bun Plugin Support ---
if (typeof Bun !== 'undefined') {
    Bun.plugin({
        name: "assets-loader",
        setup(build) {
            // Intercept assets:// imports
            build.onResolve({ filter: /^assets:\/\/js\/lib\// }, args => {
                const relativeUrl = args.path.replaceAll('assets://js/lib/', '../catLib/');
                const catLibJsPath = path.join(assets_path, relativeUrl);
                return { path: catLibJsPath };
            });

            // Intercept catvod module loading to inject initEnv
            build.onLoad({ filter: /spider[\\/]catvod[\\/].*\.js$/ }, async (args) => {
                let code = await Bun.file(args.path).text();
                
                // Replace assets path in the code as well just in case it's dynamic
                code = code.replaceAll('assets://js/lib/', '../catLib/');
                
                if (!code.includes('initEnv(env)')) {
                    code += `\n
var _ENV = {};
var getProxyUrl = null;
var getProxy = null;

export function initEnv(env) {
    _ENV = env;
    if (env.getProxyUrl) {
        getProxyUrl = env.getProxyUrl;
        getProxy = env.getProxyUrl;
    }
}
                    `;
                }
                
                return {
                    contents: code,
                    loader: 'js',
                };
            });
        },
    });
}

// --- Node.js ESM Loader Support ---
export async function load(url, context, nextLoad) {
    // console.log('load esm form:', url);
    if (url.startsWith('assets://js/lib/')) {
        const relativeUrl = url.replaceAll('assets://js/lib/', '../catLib/');
        const catLibJsPath = path.join(assets_path, relativeUrl);
        const catLibHref = pathToFileURL(catLibJsPath).href;
        // console.log(`[assets url]: ${url} [relativeUrl]:${relativeUrl}\n[catLibJsPath]: ${catLibJsPath} [catLibHref]:${catLibHref}`);
        url = catLibHref;
    }
    // 解决不了CAT_DEBUG=0模式下的相对路径依赖问题
    // else if(url.startsWith('.') && url.includes('/catLib/')) {
    //     const catLibJsPath = path.join(assets_path, url);
    //     url = pathToFileURL(catLibJsPath).href;
    // }
    // 只处理目标模块
    if (url.includes('/spider/catvod')) {
        // 正常加载模块
        const result = await nextLoad(url, context);

        // 转换为字符串并替换路径
        let code = result.source.toString();
        code = code.replaceAll('assets://js/lib/', '../catLib/');
        if (!code.includes('initEnv(env)')) {
            code += `\n
var _ENV = {};
var getProxyUrl = null;
var getProxy = null;

export function initEnv(env) {
    _ENV = env;
    if (env.getProxyUrl) {
        getProxyUrl = env.getProxyUrl;
        getProxy = env.getProxyUrl
    }
}
            `
        }

        // 返回修改后的结果，保持 source 为 Buffer
        return {
            ...result,
            source: Buffer.from(code, 'utf-8')
        };
    }

    // 其他模块正常加载
    return nextLoad(url, context);
}

// 注册加载器 (Node.js only)
if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
    register(import.meta.url);
}