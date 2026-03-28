/**
 * 自然排序比较函数模块
 * 
 * 提供智能的字符串比较功能，支持：
 * - 数字的自然排序（如：file1.txt, file2.txt, file10.txt）
 * - 日期格式的比较
 * - 十六进制数字的比较
 * - 大小写敏感/不敏感的比较
 * - 中文字符的本地化比较
 * 
 * ESM Module: Natural Compare Function
 */

/**
 * 自然比较函数工厂
 * 创建一个自定义的字符串比较函数，支持多种排序选项
 * 
 * @param {Object} options - 比较选项
 * @param {boolean} options.desc - 是否降序排列，默认false（升序）
 * @param {boolean} options.insensitive - 是否忽略大小写，默认false（区分大小写）
 * @returns {Function} 返回比较函数，用于Array.sort()等方法
 */
function naturalCompareFactory(options) {
    /**
     * 将字符串分割为token数组
     * 使用正则表达式将字符串分割为数字和非数字部分
     * 
     * @param {string} str - 要分割的字符串
     * @returns {Array} 分割后的token数组
     */
    function splitString(str) {
        return str
            .replace(tokenRegex, "\0$1\0")  // 在匹配的token前后添加分隔符
            .replace(/\0$/, "")             // 移除末尾的分隔符
            .replace(/^\0/, "")             // 移除开头的分隔符
            .split("\0");                   // 按分隔符分割
    }

    /**
     * 解析token为数字或字符串
     * 尝试将token转换为数字，如果不能转换则返回处理后的字符串
     * 
     * @param {string} token - 要解析的token
     * @param {number} length - token数组的长度
     * @returns {number|string} 解析后的数字或字符串
     */
    function parseToken(token, length) {
        // 如果不是前导零或长度为1，尝试转换为浮点数
        return (!token.match(leadingZeroRegex) || length === 1) && parseFloat(token) ||
            token.replace(whitespaceRegex, " ").replace(trimRegex, "") ||  // 标准化空白字符
            0;
    }

    // 初始化选项，设置默认值
    options = options || {};
    
    // 定义各种正则表达式
    const leadingZeroRegex = /^0/,  // 匹配前导零
        whitespaceRegex = /\s+/g,   // 匹配多个空白字符
        trimRegex = /^\s+|\s+$/g,   // 匹配首尾空白字符
        unicodeRegex = /[^\x00-\x80]/,  // 匹配非ASCII字符（如中文）
        hexRegex = /^0x[0-9a-f]+$/i,    // 匹配十六进制数字
        // 匹配数字token（包括十六进制、浮点数、科学计数法）
        tokenRegex = /(0x[\da-fA-F]+|(^[\+\-]?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?(?=\D|\s|$))|\d+)/g,
        // 匹配日期格式
        dateRegex = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
        // 获取小写转换函数（兼容性处理）
        toLowerCase = String.prototype.toLocaleLowerCase || String.prototype.toLowerCase,
        // 根据选项设置排序方向
        ascending = options.desc ? -1 : 1,      // 升序值
        descending = -ascending,                // 降序值
        // 根据选项设置预处理函数
        preprocess = options.insensitive
            ? (str) => toLowerCase.call("" + str).replace(trimRegex, "")  // 不区分大小写
            : (str) => ("" + str).replace(trimRegex, "");                 // 区分大小写

    /**
     * 字符串比较函数
     * 实现自然排序的核心比较逻辑
     * 
     * @param {*} a - 第一个比较值
     * @param {*} b - 第二个比较值
     * @returns {number} 比较结果：-1(a<b), 0(a=b), 1(a>b)
     */
    return function compareStrings(a, b) {
        // 预处理输入字符串
        const strA = preprocess(a);
        const strB = preprocess(b);

        // 处理空值情况
        if (!strA && !strB) return 0;          // 都为空，相等
        if (!strA && strB) return descending;  // a为空，b不为空
        if (strA && !strB) return ascending;   // a不为空，b为空

        // 将字符串分割为token数组
        const tokensA = splitString(strA);
        const tokensB = splitString(strB);
        
        // 检查是否为十六进制数字
        const hexMatchA = strA.match(hexRegex);
        const hexMatchB = strB.match(hexRegex);
        
        // 尝试解析为日期或十六进制数字
        const parsedDateA = hexMatchA && hexMatchB ? parseInt(hexMatchA[0], 16) : tokensA.length > 1 ? Date.parse(strA) : null;
        const parsedDateB = hexMatchA && hexMatchB ? parseInt(hexMatchB[0], 16) : parsedDateA && strB.match(dateRegex) ? Date.parse(strB) : null;

        // 如果都是有效的日期，按日期比较
        if (parsedDateA && parsedDateB) {
            if (parsedDateA === parsedDateB) return 0;
            return parsedDateA < parsedDateB ? descending : ascending;
        }

        // 逐个比较token
        const maxTokens = Math.max(tokensA.length, tokensB.length);

        for (let i = 0; i < maxTokens; i++) {
            // 解析当前位置的token
            const tokenA = parseToken(tokensA[i] || "", tokensA.length);
            const tokenB = parseToken(tokensB[i] || "", tokensB.length);

            // 如果一个是数字一个不是，数字排在前面
            if (isNaN(tokenA) !== isNaN(tokenB)) return isNaN(tokenA) ? ascending : descending;

            // 如果包含Unicode字符（如中文），使用本地化比较
            if (unicodeRegex.test(tokenA + tokenB) && tokenA.localeCompare) {
                // 使用中文本地化比较，支持数字排序和基本敏感度
                const localeComparison = tokenA.localeCompare(tokenB, 'zh-CN', {numeric: true, sensitivity: 'base'});
                if (localeComparison !== 0) return localeComparison * ascending;
            }

            // 数值比较
            if (tokenA < tokenB) return descending;
            if (tokenA > tokenB) return ascending;

            // 字符串比较（作为备选方案）
            if ("" + tokenA < "" + tokenB) return descending;
            if ("" + tokenA > "" + tokenB) return ascending;
        }

        // 所有token都相等
        return 0;
    };
}

// 导出工厂函数
export default naturalCompareFactory;

/**
 * 预配置的自然比较函数
 * 使用升序排列和大小写不敏感的比较
 * 
 * @example
 * const arr = ['file10.txt', 'file2.txt', 'file1.txt'];
 * arr.sort(naturalCompare);
 * // 结果: ['file1.txt', 'file2.txt', 'file10.txt']
 */
export const naturalCompare = naturalCompareFactory({desc: false, insensitive: true});
