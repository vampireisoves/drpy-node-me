// utils.js: 存放工具类方法
import pkg from 'lodash';
import crypto from 'crypto';
import {naturalCompare} from './natsort.js';

const {cloneDeep} = pkg;

export function getTitleLength(title) {
    return title.length;  // 返回标题长度
}

export function getNowTime() {
    return (new Date()).getTime()
}

export async function sleep(ms) {
    // 模拟异步请求
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

export function sleepSync(ms) {
    const end = Date.now() + ms; // 获取当前时间并计算结束时间
    while (Date.now() < end) {
        // 阻塞式等待，直到时间到达
    }
}

/**
 * 计算文件内容的 hash 值
 * @param {string} content - 文件内容
 * @returns {string} - 文件内容的 hash 值
 */
export function computeHash(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * 将obj所有key变小写
 * @param obj
 */
export function keysToLowerCase(obj) {
    return Object.keys(obj).reduce((result, key) => {
        const newKey = key.toLowerCase();
        result[newKey] = obj[key]; // 如果值也是对象，可以递归调用本函数
        return result;
    }, {});
}

export const deepCopy = cloneDeep

const resolve = (from, to) => {
    const resolvedUrl = new URL(to, new URL(from, 'resolve://'));
    if (resolvedUrl.protocol === 'resolve:') {
        const {pathname, search, hash} = resolvedUrl;
        return pathname + search + hash;
    }
    return resolvedUrl.href;
};

/**
 *  url拼接
 * @param fromPath 初始当前页面url
 * @param nowPath 相对当前页面url
 * @returns {*}
 */
export const urljoin = (fromPath, nowPath) => {
    fromPath = fromPath || '';
    nowPath = nowPath || '';
    return resolve(fromPath, nowPath);
};

export const urljoin2 = urljoin
export const joinUrl = urljoin

export const updateQueryString = (originalUrl, newQuery) => {
    // 解析原始 URL
    const parsedUrl = new URL(originalUrl);

    // 如果 newQuery 是空字符串或只包含 '?'，则直接返回原始 URL
    if (newQuery === '' || newQuery === '?') {
        return parsedUrl.href;
    }

    // 解析新的查询参数
    const newQueryParams = new URLSearchParams(newQuery.slice(1)); // 去掉前面的 '?'

    // 将新的查询参数添加到原始 URL 的查询参数中
    newQueryParams.forEach((value, key) => {
        parsedUrl.searchParams.append(key, value);
    });

    // 生成更新后的 URL
    return decodeURIComponent(parsedUrl.href);
};

export function naturalSort(arr, key, customOrder = []) {
    return arr.sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];

        // 检查是否在自定义排序列表中
        const aIndex = customOrder.findIndex((item) => aValue.includes(item));
        const bIndex = customOrder.findIndex((item) => bValue.includes(item));

        if (aIndex !== -1 && bIndex !== -1) {
            // 如果都在自定义列表中，按自定义顺序排序
            return aIndex - bIndex;
        } else if (aIndex !== -1) {
            // 如果只有a在自定义列表中，a优先
            return -1;
        } else if (bIndex !== -1) {
            // 如果只有b在自定义列表中，b优先
            return 1;
        }

        // 如果都不在自定义列表中，按自然顺序排序
        // return aValue.localeCompare(bValue, 'zh-CN', {numeric: true, sensitivity: 'base'});
        // return aValue.localeCompare(bValue, 'zh-CN', {numeric: true});
        return naturalCompare(aValue, bValue);
    });
}

// 海阔不支持Intl.Collator
/*
export function naturalSort(arr, key, customOrder = []) {
    const collator = new Intl.Collator('zh-Hans-CN', {
        numeric: true,
        sensitivity: 'base',
    });

    return arr.sort((a, b) => {
        const x = a[key] || '';
        const y = b[key] || '';

        // 1. 检查自定义顺序
        const xIndex = customOrder.findIndex((item) => x.includes(item));
        const yIndex = customOrder.findIndex((item) => y.includes(item));

        if (xIndex !== -1 || yIndex !== -1) {
            if (xIndex === -1) return 1; // x 不在自定义顺序中，y 在
            if (yIndex === -1) return -1; // y 不在自定义顺序中，x 在
            return xIndex - yIndex; // 两者都在自定义顺序中，按索引排序
        }

        // 2. 使用 `Intl.Collator` 进行自然排序
        return collator.compare(x, y);
    });
}
*/

export function naturalSortAny(arr, key, customOrder = []) {
    return arr.sort((a, b) => {
        const EQUAL = 0;
        const GREATER = 1;
        const SMALLER = -1;

        const options = {caseSensitive: false};

        const re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi;
        const sre = /(^[ ]*|[ ]*$)/g;
        const dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/;
        const hre = /^0x[0-9a-f]+$/i;
        const ore = /^0/;

        const normalize = function normalize(value) {
            const string = '' + value;
            return options.caseSensitive ? string : string.toLowerCase();
        };

        const x = normalize(a[key]).replace(sre, '') || '';
        const y = normalize(b[key]).replace(sre, '') || '';

        // Check custom order first
        const xIndex = customOrder.findIndex((item) => x.includes(item));
        const yIndex = customOrder.findIndex((item) => y.includes(item));

        if (xIndex !== -1 || yIndex !== -1) {
            if (xIndex === -1) return GREATER; // x not in customOrder, y is
            if (yIndex === -1) return SMALLER; // y not in customOrder, x is
            return xIndex - yIndex; // Both in customOrder, compare their indices
        }

        // chunk/tokenize
        const xN = x.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0');
        const yN = y.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0');

        // Return immediately if at least one of the values is empty.
        if (!x && !y) return EQUAL;
        if (!x && y) return GREATER;
        if (x && !y) return SMALLER;

        // numeric, hex or date detection
        const xD = parseInt(x.match(hre)) || (xN.length != 1 && x.match(dre) && Date.parse(x));
        const yD = parseInt(y.match(hre)) || (xD && y.match(dre) && Date.parse(y)) || null;
        let oFxNcL, oFyNcL;

        // first try and sort Hex codes or Dates
        if (yD) {
            if (xD < yD) return SMALLER;
            else if (xD > yD) return GREATER;
        }

        // natural sorting through split numeric strings and default strings
        for (let cLoc = 0, numS = Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
            oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
            oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;

            // handle numeric vs string comparison - number < string - (Kyle Adams)
            if (isNaN(oFxNcL) !== isNaN(oFyNcL)) return isNaN(oFxNcL) ? GREATER : SMALLER;

            // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
            else if (typeof oFxNcL !== typeof oFyNcL) {
                oFxNcL += '';
                oFyNcL += '';
            }
            if (oFxNcL < oFyNcL) return SMALLER;
            if (oFxNcL > oFyNcL) return GREATER;
        }
        return EQUAL;
    });
}

/**
 * 构造Basic验证请求头
 * @param {string} username - 用户名，如果不提供则从环境变量API_AUTH_NAME获取
 * @param {string} password - 密码，如果不提供则从环境变量API_AUTH_CODE获取
 * @returns {Object} - 包含Authorization头的对象
 */
export function createBasicAuthHeaders(username, password) {
    const authName = username || process.env.API_AUTH_NAME;
    const authCode = password || process.env.API_AUTH_CODE;

    // if (!authName || !authCode) {
    //     throw new Error('Basic认证信息不完整，请检查用户名和密码或环境变量API_AUTH_NAME和API_AUTH_CODE');
    // }

    const credentials = Buffer.from(`${authName}:${authCode}`).toString('base64');

    return {
        'Authorization': `Basic ${credentials}`
    };
}

export function get_size(sz) {
    if (sz <= 0) {
        return "";
    }
    let filesize = "";
    if (sz > 1024 * 1024 * 1024 * 1024.0) {
        sz /= (1024 * 1024 * 1024 * 1024.0);
        filesize = "TB";
    } else if (sz > 1024 * 1024 * 1024.0) {
        sz /= (1024 * 1024 * 1024.0);
        filesize = "GB";
    } else if (sz > 1024 * 1024.0) {
        sz /= (1024 * 1024.0);
        filesize = "MB";
    } else if (sz > 1024.0) {
        sz /= 1024.0;
        filesize = "KB";
    } else {
        filesize = "B";
    }
    // 转成字符串
    let sizeStr = sz.toFixed(2) + filesize,
        // 获取小数点处的索引
        index = sizeStr.indexOf("."),
        // 获取小数点后两位的值
        dou = sizeStr.substr(index + 1, 2);
    if (dou === "00") {
        return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2);
    } else {
        return sizeStr;
    }
}

export const $js = {
    toString(func) {
        let strfun = func.toString();
        // 处理 async () => { ... } 形式
        // 匹配: async () => { 或 async() => { 或 () => { 
        strfun = strfun.replace(/^(async\s*)?\(\)(\s+)?=>(\s+)?\{/, "js:");
        // 移除末尾的 }
        strfun = strfun.replace(/\}$/, '');
        // 去除开头和结尾的多余空白字符，但保留内部格式
        strfun = strfun.replace(/^js:\s*/, 'js:').replace(/\s*$/, '');
        return strfun;
    }
};
