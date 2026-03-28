/**
 * FetchAxios - 基于原生fetch API的HTTP客户端
 * 提供类似axios的API接口，支持请求/响应拦截器、超时控制等功能
 */
import FormData from 'form-data';
import https from "https";
import diagnosticsChannel from 'diagnostics_channel';

let undiciStripUASubscribed = false;

function ensureUndiciStripUASubscription() {
    if (undiciStripUASubscribed) {
        return;
    }
    undiciStripUASubscribed = true;

    diagnosticsChannel.channel('undici:request:create').subscribe(({request}) => {
        if (!request || !Array.isArray(request.headers)) {
            return;
        }
        const headers = request.headers;

        let shouldStrip = false;
        for (let i = 0; i < headers.length; i += 2) {
            const k = headers[i];
            if (typeof k === 'string' && k.toLowerCase() === 'x-remove-user-agent') {
                shouldStrip = true;
                break;
            }
        }
        if (!shouldStrip) {
            return;
        }

        for (let i = 0; i < headers.length; i += 2) {
            const k = headers[i];
            if (typeof k === 'string' && k.toLowerCase() === 'x-remove-user-agent') {
                headers.splice(i, 2);
                i -= 2;
            }
        }
        for (let i = 0; i < headers.length; i += 2) {
            const k = headers[i];
            if (typeof k === 'string' && k.toLowerCase() === 'user-agent') {
                headers.splice(i, 2);
                i -= 2;
            }
        }
    });
}

/**
 * FetchAxios类 - HTTP客户端实现
 * 基于原生fetch API，提供axios风格的接口
 */
class FetchAxios {
    /**
     * 构造函数
     * @param {Object} defaultConfig - 默认配置
     */
    constructor(defaultConfig = {}) {
        // 默认配置
        this.defaults = {
            baseURL: '',
            headers: {},
            timeout: 0,
            responseType: 'json', // json, text 或 arraybuffer
            withCredentials: false,
            httpsAgent: null,
            maxRedirects: 5, // 默认允许5次重定向
            validateStatus: function (status) {
                return status >= 200 && status < 300; // 默认只有 2xx 状态码被认为是成功
            },
            ...defaultConfig,
        };
        // 拦截器存储
        this.interceptors = {request: [], response: []};
    }

    /**
     * 添加请求拦截器
     * @param {Function} fn - 拦截器函数
     */
    useRequestInterceptor(fn) {
        this.interceptors.request.push(fn);
    }

    /**
     * 添加响应拦截器
     * @param {Function} fn - 拦截器函数
     */
    useResponseInterceptor(fn) {
        this.interceptors.response.push(fn);
    }

    /**
     * 发送HTTP请求
     * @param {string|Object} urlOrConfig - URL字符串或配置对象
     * @param {Object} config - 请求配置
     * @returns {Promise} 请求结果
     */
    async request(urlOrConfig, config = {}) {
        let finalConfig = {};
        // 判断调用方式
        if (typeof urlOrConfig === 'string') {
            // URL字符串方式调用
            finalConfig = {...this.defaults, ...config, url: this.defaults.baseURL + urlOrConfig};
        } else {
            // 配置对象方式调用
            finalConfig = {...this.defaults, ...urlOrConfig, url: this.defaults.baseURL + (urlOrConfig.url || '')};
        }

        // 执行请求拦截器
        for (const interceptor of this.interceptors.request) {
            finalConfig = await interceptor(finalConfig) || finalConfig;
        }

        if (finalConfig.headers) {
            const headerKeys = Object.keys(finalConfig.headers);
            for (const key of headerKeys) {
                if (key.toLowerCase() === 'user-agent' && finalConfig.headers[key] === 'RemoveUserAgent') {
                    delete finalConfig.headers[key];
                    finalConfig.headers['x-remove-user-agent'] = '1';
                    ensureUndiciStripUASubscription();
                    break;
                }
            }
        }

        // 拼接查询参数
        if (finalConfig.params) {
            const query = new URLSearchParams(finalConfig.params).toString();
            finalConfig.url += (finalConfig.url.includes('?') ? '&' : '?') + query;
        }

        // 设置超时控制
        const controller = new AbortController();
        let timeoutId;
        if (finalConfig.timeout && finalConfig.timeout > 0) {
            timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);
        }

        // 构建fetch选项
        const fetchOptions = {
            method: (finalConfig.method || 'GET').toUpperCase(),
            headers: {...finalConfig.headers},
            signal: controller.signal,
            credentials: finalConfig.withCredentials ? 'include' : 'same-origin',
            agent: finalConfig.httpsAgent || undefined,
            // 处理重定向控制
            redirect: finalConfig.maxRedirects === 0 ? 'manual' : 'follow',
        };

        // 处理请求体数据
        if (finalConfig.data instanceof FormData) {
            // FormData类型数据
            fetchOptions.body = finalConfig.data;
            Object.assign(fetchOptions.headers, finalConfig.data.getHeaders());
        } else if (finalConfig.data) {
            // 其他类型数据
            if (typeof finalConfig.data === 'object' && !fetchOptions.headers['Content-Type']) {
                fetchOptions.headers['Content-Type'] = 'application/json';
            }
            fetchOptions.body = fetchOptions.headers['Content-Type'] === 'application/json'
                ? JSON.stringify(finalConfig.data)
                : finalConfig.data;
        }

        try {
            // console.log(`[fetchAxios] finalConfig.url:${finalConfig.url} fetchOptions:`, fetchOptions);
            // 发送HTTP请求
            let response = await fetch(finalConfig.url, fetchOptions);

            // 处理手动重定向（当 maxRedirects 为 0 时）
            if (finalConfig.maxRedirects === 0 && response.status >= 300 && response.status < 400) {
                // 清除超时定时器
                if (timeoutId) clearTimeout(timeoutId);

                // 根据 responseType 返回对应的空数据，保持与 axios 行为一致
                let emptyData;
                if (finalConfig.responseType === 'json') {
                    emptyData = null; // JSON 类型返回 null
                } else if (finalConfig.responseType === 'arraybuffer') {
                    emptyData = new ArrayBuffer(0); // ArrayBuffer 类型返回空 buffer
                } else {
                    emptyData = ''; // text 类型返回空字符串
                }

                // 构建重定向响应对象
                const redirectResult = {
                    data: emptyData,
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    config: finalConfig,
                    request: finalConfig.url,
                };

                // 检查 validateStatus 函数，如果没有定义或返回 false，则抛出错误
                if (!finalConfig.validateStatus || !finalConfig.validateStatus(response.status)) {
                    // console.log(`[fetchAxios] redirect error:`, redirectResult);
                    // 创建符合 axios 标准的错误对象
                    const redirectError = new Error(`Request failed with status code ${response.status}`);
                    redirectError.code = 'ERR_BAD_REQUEST';
                    redirectError.config = finalConfig;
                    redirectError.request = finalConfig.url;
                    redirectError.response = redirectResult;
                    redirectError.isAxiosError = true;
                    throw redirectError; // 抛出符合 axios 标准的错误
                } else {
                    // console.log(`[fetchAxios] redirect result:`, redirectResult);
                    return redirectResult; // 如果 validateStatus 返回 true，则正常返回
                }
            }

            // 清除超时定时器（请求成功完成）
            if (timeoutId) clearTimeout(timeoutId);

            let responseData;

            // 根据响应类型处理数据
            if (finalConfig.responseType === 'json') {
                responseData = await response.json().catch(() => null);
            } else if (finalConfig.responseType === 'arraybuffer') {
                responseData = await response.arrayBuffer();
            } else {
                responseData = await response.text();
            }

            // 构建响应结果
            let result = {
                data: responseData,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                config: finalConfig,
                request: finalConfig.url,
            };

            // 执行响应拦截器
            for (const interceptor of this.interceptors.response) {
                result = await interceptor(result) || result;
            }

            // 检查响应状态，使用 validateStatus 函数
            if (!finalConfig.validateStatus(response.status)) {
                // 创建符合 axios 标准的错误对象
                const statusError = new Error(`Request failed with status code ${response.status}`);
                statusError.code = response.status >= 400 && response.status < 500 ? 'ERR_BAD_REQUEST' : 'ERR_BAD_RESPONSE';
                statusError.config = finalConfig;
                statusError.request = finalConfig.url;
                statusError.response = result;
                statusError.isAxiosError = true;
                throw statusError;
            }
            return result;
        } catch (err) {
            // 清除超时定时器
            if (timeoutId) clearTimeout(timeoutId);

            // 处理不同类型的错误
            if (err.name === 'AbortError') {
                // 超时错误
                const timeoutError = new Error(`Request timeout of ${finalConfig.timeout}ms exceeded`);
                timeoutError.code = 'ECONNABORTED';
                timeoutError.config = finalConfig;
                timeoutError.request = finalConfig.url;
                throw timeoutError;
            } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
                // 网络错误
                const networkError = new Error('Network Error');
                networkError.code = 'NETWORK_ERROR';
                networkError.config = finalConfig;
                networkError.request = finalConfig.url;
                throw networkError;
            } else {
                // 其他错误直接抛出
                throw err;
            }
        }
    }

    /**
     * GET请求
     * @param {string} url - 请求URL
     * @param {Object} config - 请求配置
     * @returns {Promise} 请求结果
     */
    get(url, config) {
        return this.request(url, {...config, method: 'GET'});
    }

    /**
     * POST请求
     * @param {string} url - 请求URL
     * @param {*} data - 请求数据
     * @param {Object} config - 请求配置
     * @returns {Promise} 请求结果
     */
    post(url, data, config) {
        return this.request(url, {...config, method: 'POST', data});
    }

    /**
     * PUT请求
     * @param {string} url - 请求URL
     * @param {*} data - 请求数据
     * @param {Object} config - 请求配置
     * @returns {Promise} 请求结果
     */
    put(url, data, config) {
        return this.request(url, {...config, method: 'PUT', data});
    }

    /**
     * DELETE请求
     * @param {string} url - 请求URL
     * @param {Object} config - 请求配置
     * @returns {Promise} 请求结果
     */
    delete(url, config) {
        return this.request(url, {...config, method: 'DELETE'});
    }
}

/**
 * 创建FetchAxios实例
 * @param {Object} defaultConfig - 默认配置
 * @returns {Function} 实例函数
 */
export function createInstance(defaultConfig) {
    const context = new FetchAxios(defaultConfig);

    // 创建可调用函数
    const instance = context.request.bind(context);

    // 挂载方法到实例
    ['get', 'post', 'put', 'delete', 'useRequestInterceptor', 'useResponseInterceptor'].forEach(method => {
        instance[method] = context[method].bind(context);
    });

    return instance;
}

// HTTPS代理 - 忽略证书错误
export const httpsAgent = new https.Agent({rejectUnauthorized: false});

/**
 * 创建HTTPS实例
 * @returns {Function} HTTPS实例
 */
export function createHttpsInstance() {
    return createInstance({
        headers: {'User-Agent': 'Mozilla/5.0'},
        timeout: 10000,
        responseType: 'arraybuffer',
        httpsAgent: httpsAgent
    });
}
