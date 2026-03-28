// kzz-spider.mjs
import axios from 'axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

// 扩展dayjs以支持自定义格式解析
dayjs.extend(customParseFormat);

// 默认用户代理
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

/**
 * 获取可转债数据
 * @param {string|number} taskId - 任务ID
 * @param {string} [url='http://data.eastmoney.com/kzz/'] - 东方财富网查询地址
 * @param {number} [dayeExtra=0] - 日期偏移量。正数：未来天数，负数：过去天数
 * @param {Object} [kwargs] - 其他可选参数
 * @returns {Promise<Array>} - 可转债列表
 */
export async function getNowKzz(taskId, url = 'http://data.eastmoney.com/kzz/', dayeExtra = 0, kwargs = {}) {
    console.log(`[任务 ${taskId}] 开始获取可转债数据，日期偏移量: ${dayeExtra}, 参数: ${JSON.stringify(kwargs)}`);

    const headers = {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
    };

    // 创建axios会话实例
    const session = axios.create({
        headers,
        timeout: 15000,
        withCredentials: true
    });

    try {
        // 先访问首页获取必要的cookies
        console.log(`[任务 ${taskId}] 访问首页获取cookies...`);
        await session.get(url);

        // 构建数据API URL - 使用随机回调函数名
        const callbackName = `jQuery${Math.floor(Math.random() * 1000000000)}_${Date.now()}`;
        const dataUrl = `https://datacenter-web.eastmoney.com/api/data/v1/get?callback=${callbackName}&sortColumns=PUBLIC_START_DATE&sortTypes=-1&pageSize=50&pageNumber=1&reportName=RPT_BOND_CB_LIST&columns=ALL&quoteColumns=f2~01~CONVERT_STOCK_CODE~CONVERT_STOCK_PRICE%2Cf235~10~SECURITY_CODE~TRANSFER_PRICE%2Cf236~10~SECURITY_CODE~TRANSFER_VALUE%2Cf2~10~SECURITY_CODE~CURRENT_BOND_PRICE%2Cf237~10~SECURITY_CODE~TRANSFER_PREMIUM_RATIO%2Cf239~10~SECURITY_CODE~RESALE_TRIG_PRICE%2Cf240~10~SECURITY_CODE~REDEEM_TRIG_PRICE%2Cf23~01~CONVERT_STOCK_CODE~PBV_RATIO&quoteType=0&source=WEB&client=WEB`;

        console.log(`[任务 ${taskId}] 请求API数据...`);
        const response = await session.get(dataUrl);

        // 解析JSONP响应
        console.log(`[任务 ${taskId}] 解析响应数据...`);
        const jsonStr = extractJsonFromJsonp(response.data);
        const data = safeParseJson(jsonStr);

        console.log(`[任务 ${taskId}] 处理可转债数据...`);
        return processKzzData(data, dayeExtra);
    } catch (error) {
        const errorMsg = `[任务 ${taskId}] 获取可转债数据失败: ${error.message}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
}

/**
 * 从JSONP响应中提取JSON字符串
 * @param {string} jsonp - JSONP响应字符串
 * @returns {string} - JSON字符串
 */
function extractJsonFromJsonp(jsonp) {
    // 尝试多种解析方式
    const patterns = [
        /^[^{]*?\(({.*})\)[^}]*?$/,
        /^.*?\(({.*})\)$/,
        /^.*?\(({.*})\);?$/,
        /({.*})/
    ];

    for (const pattern of patterns) {
        const match = jsonp.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // 尝试直接解析为JSON
    try {
        JSON.parse(jsonp);
        return jsonp;
    } catch (e) {
        throw new Error('无法解析JSONP响应: ' + jsonp.substring(0, 100) + '...');
    }
}

/**
 * 安全解析JSON字符串
 * @param {string} jsonStr - JSON字符串
 * @returns {Object} - 解析后的对象
 */
function safeParseJson(jsonStr) {
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        // 尝试修复常见的JSON格式问题
        try {
            const fixedJson = jsonStr
                .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
                .replace(/:\s*'([^']*)'/g, ': "$1"')
                .replace(/(\w+)\s*:/g, '"$1":')  // 修复键名缺少引号
                .replace(/:\s*([a-zA-Z_][\w]*)([,\}])/g, ':"$1"$2'); // 修复字符串值缺少引号

            return JSON.parse(fixedJson);
        } catch (e2) {
            console.error('JSON解析错误:', e2.message);
            console.error('原始JSON字符串:', jsonStr.substring(0, 200));
            throw new Error('JSON解析失败: ' + e2.message);
        }
    }
}

function compareDates(dateStr1, dateStr2) {
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);
    return date1.getTime() - date2.getTime();
}

// 返回值>0表示date1较晚，<0表示date1较早，=0表示相同


/**
 * 处理可转债数据
 * @param {Object} data - 原始数据
 * @param {number} dayeExtra - 日期偏移量
 * @returns {Array} - 处理后的可转债列表
 */
function processKzzData(data, dayeExtra) {
    if (!data || !data.result || !Array.isArray(data.result.data)) {
        throw new Error('API返回的数据结构无效');
    }

    const resultData = data.result.data;

    // 计算目标日期范围
    const today = dayjs();
    const targetDate = today.add(dayeExtra, 'day');
    const targetDateStr = targetDate.format('YYYY-MM-DD');

    console.log(`筛选日期: ${targetDateStr} (偏移量: ${dayeExtra}天)`);

    // 处理数据
    const kzzList = [];
    const dateFormats = [
        'YYYY-MM-DD HH:mm:ss',
        'YYYY/MM/DD HH:mm:ss',
        'YYYY-MM-DD',
        'YYYY/MM/DD',
        'YYYY-M-DD',
        'YYYY-M-D',
        'YYYY/MM/DD'
    ];

    for (const item of resultData) {
        if (!item.PUBLIC_START_DATE) {
            console.warn(`跳过无发行日期的项目: ${item.SECURITY_NAME_ABBR}`);
            continue;
        }

        // 解析日期
        let publicDate;
        for (const format of dateFormats) {
            publicDate = dayjs(item.PUBLIC_START_DATE, format, true);
            if (publicDate.isValid()) break;
        }

        if (!publicDate.isValid()) {
            console.warn(`无效的日期格式: ${item.PUBLIC_START_DATE} (项目: ${item.SECURITY_NAME_ABBR})`);
            continue;
        }

        const dateStr = publicDate.format('YYYY-MM-DD');
        const dateStrNow = dayjs().format('YYYY-MM-DD');
        // console.log(dateStr, targetDateStr, dateStrNow);

        // 检查是否匹配目标日期
        // if (dateStr === targetDateStr) {
        if (compareDates(dateStr, targetDateStr) >= 0 || compareDates(dateStr, dateStrNow) >= 0) {
            // console.log('成功匹配:', dateStr, targetDateStr, dateStrNow);
            kzzList.push({
                name: item.SECURITY_NAME_ABBR,
                code: item.SECURITY_CODE,
                date: dateStr
            });
        }
    }

    console.log(`找到 ${kzzList.length} 个匹配的可转债`);
    return kzzList;
}