import * as cheerio from "cheerio";
import fs from "fs-extra";
import { resolvePath, isSafePath, PROJECT_ROOT } from "../utils/pathHelper.js";
import { decodeDsSource } from "../utils/dsHelper.js";
import { get_drpy_libs_info } from "./drpyLibsInfo.js";
import { exec } from "child_process";
import util from "util";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const execPromise = util.promisify(exec);

let jsoup, req;
try {
    const htmlParser = await import("file://" + path.join(PROJECT_ROOT, "libs_drpy/htmlParser.js"));
    jsoup = htmlParser.jsoup;
    await import("file://" + path.join(PROJECT_ROOT, "libs_drpy/drpyInject.js"));
    req = globalThis.req;
    if (typeof req !== 'function') {
        throw new Error("globalThis.req is not a function after drpyInject.js import");
    }
    const dsReqLib = Number(process.env.DS_REQ_LIB) || 0;
    console.log(`[spiderTools] Using drpyInject request (DS_REQ_LIB=${dsReqLib}, 0=fetch 1=axios)`);
} catch (e) {
    console.error("Warning: Failed to import drpyInject request:", e.message);
    try {
        const reqModule = await import("file://" + path.join(PROJECT_ROOT, "utils/req.js"));
        req = reqModule.default;
        console.log("[spiderTools] Fallback to utils/req.js");
    } catch (e2) {
        console.error("Warning: Fallback req.js also failed:", e2.message);
    }
}

export const list_sources = async () => {
    const jsSourcesPath = resolvePath("spider/js");
    const catvodSourcesPath = resolvePath("spider/catvod");
    
    let jsSources = [];
    let catvodSources = [];

    if (await fs.pathExists(jsSourcesPath)) {
        jsSources = (await fs.readdir(jsSourcesPath)).filter(f => f.endsWith('.js'));
    }
    if (await fs.pathExists(catvodSourcesPath)) {
        catvodSources = (await fs.readdir(catvodSourcesPath)).filter(f => f.endsWith('.js'));
    }

    return {
        content: [{
            type: "text",
            text: JSON.stringify({
                "spider/js": jsSources,
                "spider/catvod": catvodSources
            }, null, 2)
        }]
    }
};

export const analyze_website_structure = async (args) => {
    if (!req) return { isError: true, content: [{ type: "text", text: "req module not loaded" }] };
    const { url, options } = args;
    try {
        const opt = options || {};
        if (!opt.method) opt.method = 'GET';
        opt.headers = opt.headers || {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        };
        const res = await req(url, opt);
        const html = typeof res === 'object' && res.content ? res.content : res;
        
        const $ = cheerio.load(html);
        
        $('script, style, link, meta, noscript, iframe, svg, path, nav, footer').remove();
        
        let simplifiedHtml = $('body').html() || '';
        simplifiedHtml = simplifiedHtml.replace(/\n\s*\n/g, '\n').substring(0, 15000);
        
        return {
            content: [{
                type: "text",
                text: `URL: ${url}\nTitle: ${$('title').text()}\n\nSimplified HTML Structure:\n${simplifiedHtml}`
            }]
        };
    } catch (e) {
        return {
            isError: true,
            content: [{ type: "text", text: `Fetch Error: ${e.message}` }]
        };
    }
};

export const get_claw_ds_skill = async (args = {}) => {
    const lang = (args && args.lang) || 'en';
    const fileName = lang === 'zh' ? 'skills-zh.md' : 'skills.md';
    const thisDir = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
        path.join(thisDir, fileName),
        path.join(thisDir, '..', fileName),
    ];
    let skillContent = null;
    for (const p of candidates) {
        try {
            if (await fs.pathExists(p)) {
                skillContent = await fs.readFile(p, 'utf-8');
                break;
            }
        } catch (e) { }
    }
    if (!skillContent) {
        return {
            isError: true,
            content: [{ type: "text", text: `Failed to read ${fileName}: not found in [${candidates.join(', ')}]` }]
        };
    }
    return {
        content: [{
            type: "text",
            text: skillContent
        }]
    };
};

export const get_routes_info = async () => {
    const indexControllerPath = resolvePath("controllers/index.js");
    if (!await fs.pathExists(indexControllerPath)) {
        return { content: [{ type: "text", text: "controllers/index.js not found" }] };
    }
    const content = await fs.readFile(indexControllerPath, "utf-8");
    const lines = content.split('\n');
    const registered = lines
      .filter(l => l.trim().startsWith('fastify.register('))
      .map(l => l.trim());
    
    return {
        content: [{
            type: "text",
            text: JSON.stringify({
                file: "controllers/index.js",
                registered_controllers: registered
            }, null, 2)
        }]
    };
};

export const guess_spider_template = async (args) => {
    try {
        const { url, options = {} } = args;
        if (!req) {
            throw new Error("req utility is not available. Please ensure drpy-node utils are configured correctly.");
        }

        if (!options.method) options.method = 'GET';
        const res = await req(url, options);
        const html = typeof res === 'object' && res.content ? res.content : res;
        const $ = cheerio.load(html);

        let matchedTemplate = '未匹配到任何内置模板';
        
        // 基于 drpy-node/libs_drpy/template.js 的特征进行探测
        if ($('.stui-header__menu').length > 0 || $('.stui-vodlist').length > 0) {
            matchedTemplate = '首图2 (stui-vodlist特征)';
        } else if ($('.myui-header__menu').length > 0 || $('.myui-vodlist').length > 0) {
            matchedTemplate = '首图 (myui-vodlist特征)';
        } else if ($('.module-poster-item').length > 0 || $('.module-item').length > 0) {
            matchedTemplate = 'mxpro (module-item特征)';
        } else if ($('.module-list').length > 0 && $('.module-items').length > 0) {
            matchedTemplate = 'mxone5 (module-items特征)';
        } else if ($('.top_nav').length > 0 || $('.cbox_list').length > 0) {
            matchedTemplate = 'mx (top_nav特征)';
        } else if ($('rss').length > 0 || $('video').length > 0 || html.includes('<?xml')) {
            matchedTemplate = '采集1 (XML/RSS特征)';
        }

        return {
            content: [{
                type: "text",
                text: `URL: ${url}\nTitle: ${$('title').text().trim()}\n\n分析结果: ${matchedTemplate}\n\n提示: 如果匹配到了内置模板，你可以在编写 rule 时直接设置 "模板: '匹配的模板名'"，并只覆盖特殊字段。`
            }]
        };
    } catch (e) {
        return {
            content: [{ type: "text", text: `Error guessing template: ${e.message}` }],
            isError: true
        };
    }
};

export const extract_website_filter = async (args) => {
    const url = args?.url;
    const urls = args?.urls;
    const isGzip = args?.gzip === true;
    const options = args?.options || {};
    const targets = urls && urls.length > 0 ? urls : url;
    
    if (!targets) return { isError: true, content: [{ type: "text", text: "Missing url or urls parameter" }] };
    
    try {
        const { extractFilter } = await import('./extractFilter.js');
        const filter = await extractFilter(targets, isGzip, options);
        if (!filter) {
            return { isError: true, content: [{ type: "text", text: "提取筛选失败，未找到明显的 filter 结构或网络请求报错。" }] };
        }
        
        let textResult = typeof filter === 'string' ? filter : JSON.stringify(filter, null, 4);
        
        return {
            content: [{
                type: "text",
                text: textResult
            }]
        };
    } catch (e) {
        return { isError: true, content: [{ type: "text", text: `提取异常: ${e.message}` }] };
    }
};

export const fetch_spider_url = async (args) => {
    if (!req) return { isError: true, content: [{ type: "text", text: "req module not loaded" }] };
    const { url, options } = args;
    try {
        const opt = options || {};
        if (!opt.method) opt.method = 'GET';
        const res = await req(url, opt);
        
        const result = {
            status: res.code || res.status,
            statusText: res.statusText || '',
            headers: res.headers || {},
            data: res.content !== undefined ? res.content : res.data
        };
        
        return {
            content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
            }]
        };
    } catch (e) {
        return {
            isError: true,
            content: [{ type: "text", text: `Fetch Error: ${e.message}\nResponse: ${e.response ? JSON.stringify(e.response.data) : 'No response'}` }]
        };
    }
};

export const extract_iframe_src = async (args) => {
    if (!req) return { isError: true, content: [{ type: "text", text: "req module not loaded" }] };
    const { url, options } = args;
    try {
        const opt = options || {};
        if (!opt.method) opt.method = 'GET';
        opt.headers = opt.headers || {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        const res = await req(url, opt);
        const html = typeof res === 'object' && res.content ? res.content : res;
        const $ = cheerio.load(html);
        
        const iframes = $('iframe');
        if (iframes.length === 0) {
            return { content: [{ type: "text", text: `在页面中未找到 iframe 标签。你可以考虑检查页面中的 script 数据（如 player_aaaa）。` }] };
        }
        
        let iframeInfo = "";
        iframes.each((i, el) => {
            iframeInfo += `[iframe ${i+1}] src: ${$(el).attr('src')}\n`;
        });
        
        return {
            content: [{
                type: "text",
                text: `URL: ${url}\n找到以下 iframe：\n${iframeInfo}\n这通常用于 lazy 函数中抓取直链，例如：\nvar src = pdfh(await request(input), "iframe&&src");\n// 注意规则：\n// 1. 若 src 是直链(.m3u8, .mp4)，给 input 赋值 {parse: 0, url: src, jx: 0}\n// 2. 若 src 只是第三方网页，需要继续嗅探，给 input 赋值 {parse: 1, url: src, jx: 0}\n// 3. 只有当目标是 爱/优/腾 等正版视频平台时，才返回 jx: 1 进行服务端解析。\n// 4. 最后必须加上 return input;`
            }]
        };
    } catch (e) {
        return {
            isError: true,
            content: [{ type: "text", text: `Fetch Error: ${e.message}` }]
        };
    }
};

export const debug_spider_rule = async (args) => {
    if (!jsoup) return { isError: true, content: [{ type: "text", text: "jsoup module not loaded" }] };
    const { html, url, rule, mode, baseUrl, options } = args;
    let content = html;
    let finalUrl = baseUrl || url;

    if (url && !content) {
        if (!req) return { isError: true, content: [{ type: "text", text: "req module not loaded for url fetch" }] };
        try {
            const opt = options || {};
            if (!opt.method) opt.method = 'GET';
            const res = await req(url, opt);
            content = typeof res === 'object' && res.content !== undefined ? res.content : (res.data || String(res));
            if (!finalUrl) finalUrl = url;
        } catch (e) {
            return {
                isError: true,
                content: [{ type: "text", text: `Failed to fetch URL: ${e.message}` }]
            };
        }
    }

    if (!content) {
        return {
            isError: true,
            content: [{ type: "text", text: "Please provide 'html' content or 'url' to fetch." }]
        };
    }

    try {
        const j = new jsoup(finalUrl || '');
        let result;
        if (mode === 'pdfa') {
            result = j.pdfa(content, rule);
        } else if (mode === 'pdfh') {
            result = j.pdfh(content, rule);
        } else if (mode === 'pd') {
            result = j.pd(content, rule);
        }
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    mode,
                    rule,
                    count: Array.isArray(result) ? result.length : (result ? 1 : 0),
                    result
                }, null, 2)
            }]
        };
    } catch (e) {
        return {
            isError: true,
            content: [{ type: "text", text: `Parsing Error: ${e.message}` }]
        };
    }
};

export const get_spider_template = async () => {
    const template = `/*
* @File     : drpy-node spider template
* @Author   : user
* @Date     : ${new Date().toISOString().split('T')[0]}
* @Comments : 
*/

var rule = {
    // 影视|漫画|小说
    类型: '影视',
    // 源标题
    title: 'Site Name',
    // 源主域名，可以自动处理后续链接的相对路径
    host: 'https://example.com',
    // 源主页链接，作为推荐的this.input
    homeUrl: '/latest/',
    // 源一级列表链接 (fyclass=分类, fypage=页码)
    url: '/category/fyclass/page/fypage', 
    // 源搜索链接 (**=关键词, fypage=页码)
    searchUrl: '/search?wd=**&pg=fypage',
    // 允许搜索(1)、允许快搜(1)、允许筛选(1)
    searchable: 2, 
    quickSearch: 0, 
    filterable: 1, 
    // 源默认请求头、调用await request如果参数二不填会自动添加
    headers: {
        'User-Agent': 'MOBILE_UA', 
    },
    // 接口访问超时时间
    timeout: 5000,
    // 静态分类名称
    class_name: 'Movie&TV&Anime',
    // 静态分类id
    class_url: '1&2&3',
    // 动态分类获取 列表;标题;链接;正则提取 (可选)
    // class_parse: '#side-menu:lt(1) li;a&&Text;a&&href;com/(.*?)/',
    
    // 是否需要调用免嗅lazy函数 (服务器解析播放)
    play_parse: true,
    // 免嗅lazy执行函数 (如果play_parse为true则需要)
    lazy: '',
    // 首页推荐显示数量
    limit: 6,
    // 是否双层列表定位,默认false
    double: true,
    
    // 推荐列表解析: 列表;标题;图片;描述;链接
    推荐: '.recommend .item;a&&title;img&&src;.remarks&&Text;a&&href',
    // 一级列表解析: 列表;标题;图片;描述;链接
    一级: '.list .item;a&&title;img&&src;.remarks&&Text;a&&href',
    // 二级详情解析 (字典模式)
    二级: {
        "title": "h1&&Text",
        "img": ".poster img&&src",
        "desc": ".desc&&Text",
        "content": ".content&&Text",
        "tabs": ".tabs span", // 线路列表
        "lists": ".playlists ul", // 选集列表
    },
    // 搜索结果解析: 列表;标题;图片;描述;链接
    搜索: '.search-result .item;a&&title;img&&src;.remarks&&Text;a&&href',

    /**
     * 高级函数用法 (如需使用，请解除注释并替换相应字段)
     * Advanced Function Usage (Uncomment and replace fields if needed)
     */
    
    /*
    // 动态获取域名 (优先级最高)
    hostJs: async function () {
        let {HOST} = this;
        // ... perform logic ...
        return HOST;
    },
    
    // 预处理 (初始化时执行一次，用于获取cookie等)
    预处理: async function () {
        let {HOST} = this;
        // ... perform logic ...
        return HOST;
    },
    
    // 自定义免嗅函数 (play_parse: true 时调用)
    lazy: async function () {
        let {input} = this;
        // ... perform logic to get real url ...
        return {
            url: input,
            parse: 0, // 0: 直接播放, 1: 嗅探
            header: {} // 可选
        };
    },
    
    // 动态分类解析 (替代 class_name/class_url)
    class_parse: async function () {
        let {input} = this;
        // ... parse input ...
        return {
            class: [{type_name: '电影', type_id: '1'}],
            filters: {} // 可选
        };
    },
    
    // 自定义推荐列表解析 (替代字符串规则)
    推荐: async function () {
        let {input} = this;
        // ... parse input ...
        return [{
            vod_name: 'Title',
            vod_pic: 'Image',
            vod_remarks: 'Desc',
            vod_id: 'Url'
        }];
    },
    
    // 自定义一级列表解析
    一级: async function () {
        let {input} = this;
        // ... parse input ...
        return [{
            vod_name: 'Title',
            vod_pic: 'Image',
            vod_remarks: 'Desc',
            vod_id: 'Url'
        }];
    },
    
    // 自定义二级详情解析
    二级: async function () {
        let {input} = this;
        // ... parse input ...
        return {
            vod_name: 'Title',
            vod_pic: 'Image',
            type_name: 'Category',
            vod_year: 'Year',
            vod_area: 'Area',
            vod_actors: 'Actors',
            vod_director: 'Director',
            vod_content: 'Content',
            vod_play_from: 'Line1$$$Line2', // 线路名
            vod_play_url: 'Ep1$Url1#Ep2$Url2$$$Ep1$Url1...', // 播放列表
        };
    },
    
    // 自定义搜索解析
    搜索: async function () {
        let {input} = this;
        // ... parse input ...
        return [{
            vod_name: 'Title',
            vod_pic: 'Image',
            vod_remarks: 'Desc',
            vod_id: 'Url'
        }];
    },
    */
}
`;
    return {
        content: [{
            type: "text",
            text: template
        }]
    }
};

export { get_drpy_libs_info };

export const validate_spider = async (args) => {
    const filePath = args?.path;
    if (!filePath || !isSafePath(filePath)) {
        return { isError: true, content: [{ type: "text", text: "Invalid path" }] };
    }
    try {
        let code = await fs.readFile(resolvePath(filePath), 'utf-8');
        if (filePath.endsWith('.js')) {
             code = await decodeDsSource(code);
        }
        const sandbox = {
            console: { log: () => {}, error: () => {}, warn: () => {}, info: () => {} },
            require: () => ({}),
            module: { exports: {} },
            exports: {},
            Buffer,
            WebAssembly: {},
            setTimeout, setInterval, clearTimeout, clearInterval,
            TextEncoder, TextDecoder,
            performance: { now: () => 0 },
            WebSocket: function() {},
            WebSocketServer: function() {},
            URL, URLSearchParams,
            process: { env: {}, cwd: () => '' },
            JSON, Math, Date, Array, String, RegExp, Object, Number, Boolean, Error, TypeError, RangeError, SyntaxError, Promise, Map, Set, WeakMap, WeakSet, Symbol, Proxy, Reflect, Intl, BigInt,
            parseInt, parseFloat, isNaN, isFinite, NaN, Infinity, undefined, eval, encodeURIComponent, decodeURIComponent, encodeURI, decodeURI, escape, unescape, btoa, atob,
        };
        const noop = () => {};
        const noopAsync = async () => '';
        const noopReturn = (v) => v;
        Object.assign(sandbox, {
            MOBILE_UA: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
            PC_UA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
            UA: 'Mozilla/5.0',
            UC_UA: 'Mozilla/5.0 (Linux; U; Android 9; zh-CN; MI 9 Build/PKQ1.181121.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.108 UCBrowser/12.5.5.1035 Mobile Safari/537.36',
            IOS_UA: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
            DICT: 'abcdefghijklmnopqrstuvwxyz0123456789',
            RULE_CK: 'cookie',
            CATE_EXCLUDE: '首页|留言|APP|下载|资讯|新闻|动态',
            TAB_EXCLUDE: '猜你|喜欢|下载|剧情|榜|评论',
            OCR_RETRY: 3,
            OCR_API: 'https://api.nn.ci/ocr/b64/text',
            nodata: {},
            SPECIAL_URL: /^(ftp|magnet|thunder|ws):/,
            NOVEL_DIR: '',
            rule: {},
            RKEY: 'validate',
            input: '',
            HOST: '',
            MY_URL: '',
            request: noopAsync,
            post: noopAsync,
            fetch: noopAsync,
            req: noopAsync,
            reqs: noopAsync,
            getHtml: noopAsync,
            getCode: noopAsync,
            checkHtml: async (h) => h,
            reqCookie: async () => ({ cookie: '', html: '' }),
            verifyCode: noopAsync,
            cachedRequest: noopAsync,
            batchFetch: async () => [],
            batchExecute: async () => [],
            XMLHttpRequest: function() { return { open: noop, send: noop, setRequestHeader: noop }; },
            responseBase64: '',
            pdfh: () => '',
            pd: noopReturn,
            pdfa: () => [],
            jsp: () => ({ pdfh: () => '', pd: noopReturn, pdfa: () => [], pdfl: () => [], pq: noopReturn }),
            jsoup: function() { return { pdfh: () => '', pd: noopReturn, pdfa: () => [] }; },
            pdfl: () => [],
            pq: noopReturn,
            pjfh: noopReturn,
            pj: noopReturn,
            pjfa: () => [],
            jsonpath: { query: () => [] },
            executeParse: noopReturn,
            cheerio: { load: () => ({ text: noop, html: noopReturn, find: noopReturn, attr: noopReturn, each: noop }) },
            base64Encode: noopReturn,
            base64Decode: noopReturn,
            md5: noopReturn,
            md5X: noopReturn,
            aes: noopReturn,
            aesX: noopReturn,
            des: noopReturn,
            desX: noopReturn,
            rsa: noopReturn,
            rsaX: noopReturn,
            rc4Encrypt: noopReturn,
            rc4Decrypt: noopReturn,
            rc4: { encrypt: noopReturn, decrypt: noopReturn },
            rc4_decode: noopReturn,
            CryptoJS: {},
            getCryptoJS: () => ({}),
            JSEncrypt: function() {},
            NODERSA: function() {},
            forge: {},
            gzip: noopReturn,
            ungzip: noopReturn,
            pako: {},
            zlib: {},
            encodeStr: noopReturn,
            decodeStr: noopReturn,
            gbkTool: {},
            uint8ArrayToBase64: noopReturn,
            Utf8ArrayToStr: noopReturn,
            urlencode: noopReturn,
            encodeUrl: noopReturn,
            iconv: {},
            setItem: noop,
            getItem: noopReturn,
            clearItem: noop,
            local: { set: noop, get: noopReturn, delete: noop },
            COOKIE: { get: noopReturn, set: noop },
            urljoin: noopReturn,
            urljoin2: noopReturn,
            joinUrl: noopReturn,
            getHome: noopReturn,
            buildUrl: noopReturn,
            getQuery: noopReturn,
            parseQueryString: noopReturn,
            buildQueryString: noopReturn,
            objectToQueryString: noopReturn,
            encodeIfContainsSpecialChars: noopReturn,
            urlDeal: noopReturn,
            tellIsJx: noopReturn,
            pathLib: path,
            qs: { parse: noopReturn, stringify: noopReturn },
            randomUa: { generateUa: () => 'Mozilla/5.0' },
            matchesAll: () => [],
            cut: noopReturn,
            strExtract: noopReturn,
            stringify: (o) => JSON.stringify(o),
            dealJson: noopReturn,
            lrcToSrt: noopReturn,
            naturalSort: noopReturn,
            JSON5: { parse: noopReturn, stringify: noopReturn },
            JSONbig: { parse: noopReturn, stringify: noopReturn },
            JsonBig: { parse: noopReturn, stringify: noopReturn },
            setResult: noopReturn,
            setHomeResult: noopReturn,
            setResult2: noopReturn,
            fixAdM3u8Ai: noopAsync,
            forceOrder: noopReturn,
            keysToLowerCase: noopReturn,
            getOriginalJs: noopReturn,
            vodDeal: {},
            processImage: noop,
            jsEncoder: {},
            jsDecoder: {},
            jinja: { render: noopReturn },
            template: { render: noopReturn },
            log: noop,
            print: noop,
            randStr: noopReturn,
            toBeijingTime: noopReturn,
            computeHash: noopReturn,
            deepCopy: noopReturn,
            sleep: noopAsync,
            sleepSync: noop,
            createBasicAuthHeaders: noopReturn,
            get_size: noopAsync,
            getContentType: noopReturn,
            getMimeType: noopReturn,
            getParsesDict: noopReturn,
            getFirstLetter: noopReturn,
            utils: {},
            misc: {},
            $: noopReturn,
            $js: noopReturn,
            runMain: noopReturn,
            AIS: {},
            OcrApi: { classification: noopAsync },
            simplecc: { t2s: noopReturn, s2t: noopReturn },
            DataBase: function() {},
            database: {},
            CryptoJSW: {},
            hlsParser: {},
            RSA: {},
            jsonToCookie: noopReturn,
            cookieToJson: noopReturn,
            ENV: {},
            _ENV: {},
            axios: { get: noopAsync, post: noopAsync },
            axiosX: noopAsync,
            Quark: {},
            Baidu: {}, Baidu2: {},
            UC: {},
            Ali: {},
            Cloud: {},
            Yun: {},
            Pan: {},
            Xun: {},
            createWebDAVClient: noopReturn,
            createFTPClient: noopReturn,
            js2Proxy: noopReturn,
            JSProxyStream: function() {},
            JSFile: function() {},
            getProxyUrl: noopReturn,
            hexToString: noopReturn,
            stringToHex: noopReturn,
            enBytes2Str: noopReturn,
            str2EnBytes: noopReturn,
            gdb64Decode: noopReturn,
            gdb64Encode: noopReturn,
            compressJs: noopReturn,
            decompressJs: noopReturn,
            decodeBase64Gzip: noopReturn,
            sha1: noopReturn,
            sha256: noopReturn,
            sha512: noopReturn,
            minizlib: {},
        });
        vm.createContext(sandbox);
        new vm.Script(code).runInContext(sandbox);
        
        if (!sandbox.rule) {
            return { isError: true, content: [{ type: "text", text: "Missing 'rule' object in spider file." }] };
        }
        
        const required = ['title', 'host', 'url'];
        const missing = required.filter(k => !sandbox.rule[k]);
        
        if (missing.length > 0) {
             return { isError: true, content: [{ type: "text", text: `Missing required fields in 'rule': ${missing.join(', ')}` }] };
        }
        
        return { content: [{ type: "text", text: "Spider structure is valid." }] };
    } catch (e) {
        return { isError: true, content: [{ type: "text", text: `Validation Error: ${e.message}` }] };
    }
};

export const check_syntax = async (args) => {
    const filePath = args?.path;
    if (!filePath || !isSafePath(filePath)) {
        return { isError: true, content: [{ type: "text", text: "Invalid path" }] };
    }
    try {
        let code = await fs.readFile(resolvePath(filePath), 'utf-8');
        if (filePath.endsWith('.js')) {
             code = await decodeDsSource(code);
        }
        new vm.Script(code);
        return { content: [{ type: "text", text: "Syntax OK" }] };
    } catch (e) {
        return { isError: true, content: [{ type: "text", text: `Syntax Error: ${e.message}\n${e.stack}` }] };
    }
};

const RULE_SUMMARY_KEYS = [
    'title', 'author', '类型', 'host', 'url', 'homeUrl', 'searchUrl',
    'searchable', 'quickSearch', 'filterable', 'headers', 'timeout',
    'class_name', 'class_url', 'class_parse', 'filter', 'filter_url',
    'play_parse', 'lazy', 'limit', 'double', '推荐', '一级', '二级', '搜索',
    'hostJs', '预处理', '模板', '模板修改',
];

let drpySGetRuleObject;

async function getRuleObjectFromEngine(filePath) {
    if (!drpySGetRuleObject) {
        const mod = await import("file://" + path.join(PROJECT_ROOT, "libs/drpyS.js"));
        drpySGetRuleObject = mod.getRuleObject;
    }
    const absPath = resolvePath(filePath);
    return await drpySGetRuleObject(absPath, {}, true);
}

export const get_resolved_rule = async (args) => {
    const filePath = args?.path;
    if (!filePath || !isSafePath(filePath)) {
        return { isError: true, content: [{ type: "text", text: "Invalid path" }] };
    }
    try {
        const rule = await getRuleObjectFromEngine(filePath);
        if (!rule || !rule.title) {
            return { isError: true, content: [{ type: "text", text: "No valid rule object found." }] };
        }
        const summary = {};
        for (const key of RULE_SUMMARY_KEYS) {
            if (rule[key] !== undefined) {
                summary[key] = rule[key];
            }
        }
        const extraKeys = Object.keys(rule).filter(k => !RULE_SUMMARY_KEYS.includes(k) && typeof rule[k] !== 'function');
        if (extraKeys.length > 0) {
            summary['_extra_keys'] = extraKeys;
        }
        return {
            content: [{
                type: "text",
                text: JSON.stringify(summary, (key, val) => (typeof val === 'function') ? `[Function: ${val.name || 'anonymous'}]` : val, 2)
            }]
        };
    } catch (e) {
        return { isError: true, content: [{ type: "text", text: `Error: ${e.message}` }] };
    }
};
