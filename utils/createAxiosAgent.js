// createAxiosAgent.js
import http from 'http';
import https from 'https';
import axios from 'axios';
import {getSystemProxy, resolveDoh} from './dns_doh.js';
import {HttpsProxyAgent} from 'https-proxy-agent';

/**
 * 创建配置了代理的 axios 实例
 * @typedef {Object} CreateAxiosOptions
 * @property {number} [maxSockets=64] - 最大连接数，默认 64
 * @property {number} [timeout=30000] - 超时时间(毫秒)，默认 30000
 * @property {boolean} [rejectUnauthorized=false] - 是否拒绝未经授权的证书，默认 false(忽略证书错误)
 */

/**
 * 创建配置了代理的 axios 实例
 * @param {CreateAxiosOptions} [options={}] - 配置选项
 * @returns {import('axios').AxiosInstance} 配置好的 axios 实例
 */
export function createAxiosInstance(options = {}) {
    const {
        maxSockets = 64,
        timeout = 30000,
        rejectUnauthorized = false
    } = options;

    const AgentOption = {
        keepAlive: true,
        maxSockets: maxSockets,
        timeout: timeout
    };

    const httpAgent = new http.Agent(AgentOption);

    // 根据参数决定是否添加 rejectUnauthorized 选项
    const httpsAgentOptions = {...AgentOption};
    if (rejectUnauthorized === false) {
        httpsAgentOptions.rejectUnauthorized = false;
    }

    const httpsAgent = new https.Agent(httpsAgentOptions);

    const _axios = axios.create({
        httpAgent,
        httpsAgent,
    });

    _axios.interceptors.request.use(async config => {
        if (config && config.headers) {
            const headers = config.headers;
            const keys = Object.keys(headers);
            for (const key of keys) {
                if (key.toLowerCase() === 'user-agent' && headers[key] === 'RemoveUserAgent') {
                    delete headers[key];
                    break;
                }
            }
        }

        // System Proxy & DOH Injection
        try {
            const proxy = await getSystemProxy();
            if (proxy) {
                // Apply System Proxy
                const agent = new HttpsProxyAgent(proxy);
                config.httpsAgent = agent;
                config.proxy = false; // Disable axios internal proxy handling to use agent
            } else {
                // Apply DOH if no proxy
                let urlObj;
                try {
                    urlObj = new URL(config.url, config.baseURL);
                } catch (e) {
                    // Invalid URL, skip DOH
                }

                if (urlObj && urlObj.hostname && !/^(\d{1,3}\.){3}\d{1,3}$/.test(urlObj.hostname) && urlObj.hostname !== 'localhost') {
                    const ip = await resolveDoh(urlObj.hostname);
                    if (ip && ip !== urlObj.hostname) {
                        // Set Host header if missing
                        let hasHost = false;
                        const headerKeys = Object.keys(config.headers || {});
                        for (const k of headerKeys) {
                            if (k.toLowerCase() === 'host') {
                                hasHost = true;
                                break;
                            }
                        }
                        if (!hasHost) {
                            config.headers = config.headers || {};
                            config.headers['Host'] = urlObj.hostname;
                        }

                        // Replace hostname with IP
                        urlObj.hostname = ip;
                        config.url = urlObj.toString();

                        // Clear baseURL to avoid confusion if it was used
                        if (config.baseURL) {
                            delete config.baseURL;
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore errors to ensure request proceeds (fallback to default)
        }

        return config;
    });

    return _axios;
}

// 默认导出
export default createAxiosInstance;
