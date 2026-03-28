/**
 * ES6扩展和Polyfill库
 *
 * 该文件提供了ES6+特性的polyfill实现，确保在旧版本JavaScript环境中的兼容性
 * 包含Object、String、Array等原生对象的方法扩展和自定义工具函数
 *
 * @author drpy
 * @version 1.0.0
 */

// Object.assign Polyfill - 用于对象属性合并
if (typeof Object.assign !== 'function') {
    Object.defineProperty(Object, 'assign', {
        /**
         * 将所有可枚举属性从一个或多个源对象复制到目标对象
         * @param {Object} target - 目标对象
         * @param {...Object} sources - 源对象
         * @returns {Object} 目标对象
         */
        value: function (target, ...sources) {
            if (target == null) {
                throw new TypeError("Cannot convert undefined or null to object");
            }
            // 遍历所有源对象
            for (let source of sources) {
                if (source != null) {
                    // 复制源对象的所有可枚举属性
                    for (let key in source) {
                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                            target[key] = source[key];
                        }
                    }
                }
            }
            return target;
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

// String.prototype.includes Polyfill - 字符串包含检查
if (!String.prototype.includes) {
    Object.defineProperty(String.prototype, 'includes', {
        /**
         * 判断字符串是否包含指定的子字符串
         * @param {string} search - 要搜索的字符串
         * @param {number} start - 开始搜索的位置，默认为0
         * @returns {boolean} 是否包含指定字符串
         */
        value: function (search, start = 0) {
            if (typeof start !== 'number') start = 0;
            return this.indexOf(search, start) !== -1;
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

// Array.prototype.includes Polyfill - 数组包含检查
if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        /**
         * 判断数组是否包含指定的元素
         * @param {*} searchElement - 要搜索的元素
         * @param {number} fromIndex - 开始搜索的索引，默认为0
         * @returns {boolean} 是否包含指定元素
         */
        value: function (searchElement, fromIndex = 0) {
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            let o = Object(this);
            let len = o.length >>> 0; // 转换为无符号32位整数
            if (len === 0) return false;

            let n = fromIndex | 0; // 转换为整数
            let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            while (k < len) {
                if (o[k] === searchElement) return true;
                k++;
            }
            return false;
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

// String.prototype.startsWith Polyfill - 字符串开头检查
if (typeof String.prototype.startsWith !== 'function') {
    Object.defineProperty(String.prototype, 'startsWith', {
        /**
         * 判断字符串是否以指定的前缀开头
         * @param {string} prefix - 要检查的前缀
         * @returns {boolean} 是否以指定前缀开头
         */
        value: function (prefix) {
            return this.slice(0, prefix.length) === prefix;
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

// String.prototype.endsWith Polyfill - 字符串结尾检查
if (typeof String.prototype.endsWith !== 'function') {
    Object.defineProperty(String.prototype, 'endsWith', {
        /**
         * 判断字符串是否以指定的后缀结尾
         * @param {string} suffix - 要检查的后缀
         * @returns {boolean} 是否以指定后缀结尾
         */
        value: function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

// Object.values Polyfill - 获取对象所有值
if (typeof Object.values !== 'function') {
    Object.defineProperty(Object, 'values', {
        /**
         * 返回对象所有可枚举属性的值组成的数组
         * @param {Object} obj - 要获取值的对象
         * @returns {Array} 包含所有值的数组
         */
        value: function (obj) {
            if (obj == null) {
                throw new TypeError("Cannot convert undefined or null to object");
            }
            let values = [];
            for (let key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    values.push(obj[key]);
                }
            }
            return values;
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

// Array.prototype.join Polyfill - 数组连接
if (typeof Array.prototype.join !== 'function') {
    Object.defineProperty(Array.prototype, 'join', {
        /**
         * 将数组元素连接成字符串
         * @param {string} separator - 分隔符，默认为空字符串
         * @returns {string} 连接后的字符串
         */
        value: function (separator = '') {
            let result = '';
            for (let i = 0; i < this.length; i++) {
                if (i > 0) result += separator;
                result += this[i];
            }
            return result;
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

// Array.prototype.toReversed Polyfill - 数组反转（非破坏性）
if (typeof Array.prototype.toReversed !== 'function') {
    Object.defineProperty(Array.prototype, 'toReversed', {
        /**
         * 返回数组的反转副本（不修改原数组）
         * @returns {Array} 反转后的新数组
         */
        value: function () {
            return this.slice().reverse();
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

// Array.prototype.append 别名 - Python风格的数组添加方法
Object.defineProperty(Array.prototype, 'append', {
    value: Array.prototype.push, // 直接使用push方法
    writable: true,
    configurable: true,
    enumerable: false
});

// String.prototype.strip 别名 - Python风格的字符串去空格方法
Object.defineProperty(String.prototype, 'strip', {
    value: String.prototype.trim, // 直接使用trim方法
    writable: true,
    configurable: true,
    enumerable: false
});

// String.prototype.rstrip - 右侧去除指定字符
Object.defineProperty(String.prototype, 'rstrip', {
    /**
     * 去除字符串右侧的指定字符
     * @param {string} chars - 要去除的字符，默认为空白字符
     * @returns {string} 处理后的字符串
     */
    value: function (chars) {
        if (!chars) return this.trimEnd();
        let regex = new RegExp('[' + chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ']+$');
        return this.replace(regex, '');
    },
    writable: true,
    configurable: true,
    enumerable: false
});

// String.prototype.join - 字符串连接数组
if (typeof String.prototype.join !== 'function') {
    Object.defineProperty(String.prototype, 'join', {
        /**
         * 使用字符串作为分隔符连接数组
         * @param {Array} arr - 要连接的数组
         * @returns {string} 连接后的字符串
         */
        value: function (arr) {
            if (!Array.isArray(arr)) return '';
            return arr.join(this);
        },
        writable: true,
        configurable: true,
        enumerable: false
    });
}

/**
 * 全局匹配函数 - 获取字符串中所有匹配项
 * @param {string} str - 要搜索的字符串
 * @param {RegExp|string} pattern - 匹配模式
 * @param {boolean} flatten - 是否扁平化结果
 * @returns {Array} 匹配结果数组
 */
function matchesAll(str, pattern, flatten) {
    if (typeof pattern === 'string') {
        pattern = new RegExp(pattern, 'g');
    }
    let matches = [];
    let match;
    while ((match = pattern.exec(str)) !== null) {
        matches.push(flatten ? match[0] : match);
        if (!pattern.global) break; // 防止无限循环
    }
    return matches;
}

// String原型扩展 - 高级字符串处理方法
Object.defineProperties(String.prototype, {
    replaceX: {
        /**
         * 增强的字符串替换方法 - 支持高级替换逻辑
         * @param {RegExp|string} regex - 匹配模式
         * @param {string|Function} replacement - 替换内容
         * @returns {string} 替换后的字符串
         */
        value: function (regex, replacement) {
            // 处理字符串类型的正则表达式
            if (typeof regex === 'string') {
                regex = new RegExp(regex, 'g');
            }

            // 处理函数类型的替换内容
            if (typeof replacement === 'function') {
                return this.replace(regex, replacement);
            }

            // 处理 null/undefined 的替换内容
            replacement = replacement == null ? '' : String(replacement);

            // 创建正则表达式副本以避免修改原始对象的 lastIndex
            const regexCopy = new RegExp(regex.source, regex.flags);

            // 获取所有匹配项
            let matches = matchesAll(this, regexCopy, true);

            // 如果有多个匹配项，进行高级替换处理
            if (matches && matches.length > 1) {
                const hasCaptureGroup = /\$\d/.test(replacement);

                if (hasCaptureGroup) {
                    // 有捕获组引用时，使用标准替换
                    return this.replace(regex, replacement);
                } else {
                    // 无捕获组引用时，对每个完整匹配进行替换
                    return this.replace(regex, function (match) {
                        return replacement;
                    });
                }
            }

            // 单个匹配或无匹配时，使用标准替换
            return this.replace(regex, replacement);
        },
        writable: true,
        configurable: true,
        enumerable: false
    },
    parseX: {
        /**
         * 解析字符串为JSON对象（安全解析）
         * @returns {*} 解析后的对象，解析失败返回null
         */
        get: function () {
            try {
                return JSON5.parse(this);
            } catch (e) {
                log(`String.parseX error: ${e.message}`);
                return null;
            }
        },
        configurable: true,
        enumerable: false
    }
});

/**
 * 字符串截取函数 - 高级文本处理
 * @param {string} text - 要处理的文本
 * @param {string} start - 开始标记
 * @param {string} end - 结束标记
 * @param {function|null|undefined} method - 处理方法函数，用于对截取结果进行后处理
 * @param {boolean} All - 是否处理所有匹配项
 * @returns {string|Array} 处理结果，单个匹配返回字符串，多个匹配返回数组
 */
function cut(text, start, end, method, All) {
    // 实现复杂的文本截取逻辑
    if (!text || typeof text !== 'string') return '';

    let startIndex = text.indexOf(start);
    if (startIndex === -1) return All ? [] : '';

    startIndex += start.length;
    let endIndex = text.indexOf(end, startIndex);
    if (endIndex === -1) return All ? [] : '';

    let result = text.substring(startIndex, endIndex) + end; // 包含 end 标记

    if (All) {
        let results = [result];
        let remainingText = text.substring(endIndex + end.length);
        let moreResults = cut(remainingText, start, end, method, true);
        if (Array.isArray(moreResults)) {
            results = results.concat(moreResults);
        }
        return results;
    }

    // 应用 method 处理函数（如果提供）
    if (method && typeof method === 'function') {
        result = method(result);
    }

    return result;
}

// 将工具函数添加到全局作用域
globalThis.matchesAll = matchesAll;
globalThis.cut = cut;
