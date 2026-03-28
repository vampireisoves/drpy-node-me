/**
 * 加密解密工具库
 * 提供Base64、MD5、RC4等加密解密功能
 */

import './crypto-js.js';

/**
 * 浏览器兼容的Base64编解码实现
 * @returns {Object} 包含atob和btoa方法的对象
 */
function window_b64() {
    // Base64字符映射表
    let b64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    // Base64解码字符数组
    let base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

    /**
     * Base64编码
     * @param {string} str 待编码字符串
     * @returns {string} Base64编码结果
     */
    function btoa(str) {
        var out, i, len;
        var c1, c2, c3;
        len = str.length;
        i = 0;
        out = "";
        while (i < len) {
            c1 = str.charCodeAt(i++) & 0xff;
            if (i == len) {
                out += b64map.charAt(c1 >> 2);
                out += b64map.charAt((c1 & 0x3) << 4);
                out += "==";
                break;
            }
            c2 = str.charCodeAt(i++);
            if (i == len) {
                out += b64map.charAt(c1 >> 2);
                out += b64map.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
                out += b64map.charAt((c2 & 0xF) << 2);
                out += "=";
                break;
            }
            c3 = str.charCodeAt(i++);
            out += b64map.charAt(c1 >> 2);
            out += b64map.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += b64map.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
            out += b64map.charAt(c3 & 0x3F);
        }
        return out;
    }

    /**
     * Base64解码
     * @param {string} str Base64编码字符串
     * @returns {string} 解码结果
     */
    function atob(str) {
        var c1, c2, c3, c4;
        var i, len, out;
        len = str.length;
        i = 0;
        out = "";
        while (i < len) {
            do {
                c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
            } while (i < len && c1 == -1);
            if (c1 == -1) break;
            do {
                c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
            } while (i < len && c2 == -1);
            if (c2 == -1) break;
            out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
            do {
                c3 = str.charCodeAt(i++) & 0xff;
                if (c3 == 61) return out;
                c3 = base64DecodeChars[c3];
            } while (i < len && c3 == -1);
            if (c3 == -1) break;
            out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
            do {
                c4 = str.charCodeAt(i++) & 0xff;
                if (c4 == 61) return out;
                c4 = base64DecodeChars[c4];
            } while (i < len && c4 == -1);
            if (c4 == -1) break;
            out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
        }
        return out;
    }

    return {
        atob,
        btoa
    }
}

// 导出Base64编解码函数
export const {atob, btoa} = window_b64();

/**
 * Base64编码（使用CryptoJS）
 * @param {string} text 待编码文本
 * @returns {string} Base64编码结果
 */
export function base64Encode(text) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
    // return text
}

/**
 * Base64解码（使用CryptoJS）
 * @param {string} text Base64编码文本
 * @returns {string} 解码结果
 */
export function base64Decode(text) {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text));
    // return text
}

/**
 * MD5哈希
 * @param {string} text 待哈希文本
 * @returns {string} MD5哈希值
 */
export function md5(text) {
    return CryptoJS.MD5(text).toString();
}

/**
 * RC4加密
 * @param {string} word 待加密内容
 * @param {string} key 加密密钥
 * @returns {string} 加密结果
 */
export function rc4Encrypt(word, key) {
    return CryptoJS.RC4.encrypt(word, CryptoJS.enc.Utf8.parse(key)).toString()
}

/**
 * RC4解密
 * @param {string} word 待解密内容
 * @param {string} key 解密密钥
 * @returns {string} 解密结果
 */
export function rc4Decrypt(word, key) {
    const ciphertext = CryptoJS.enc.Hex.parse(word);
    const key_data = CryptoJS.enc.Utf8.parse(key)
    const decrypted = CryptoJS.RC4.decrypt({ciphertext: ciphertext}, key_data, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * RC4解码（自定义实现）
 * @param {string} data 待解码数据
 * @param {string} key 密钥
 * @param {number} t 类型标识
 * @returns {string} 解码结果
 */
export function rc4_decode(data, key, t) {
    let pwd = key || 'ffsirllq';
    let cipher = '';
    key = [];
    let box = [];
    let pwd_length = pwd.length;
    if (t === 1) {
        data = atob(data);
    } else {
        data = encodeURIComponent(data);
    }
    let data_length = data.length;
    // 初始化密钥调度算法
    for (let i = 0; i < 256; i++) {
        key[i] = pwd[i % pwd_length].charCodeAt();
        box[i] = i;
    }
    // 密钥调度
    for (let j = 0, i = 0; i < 256; i++) {
        j = (j + box[i] + key[i]) % 256;
        let tmp = box[i];
        box[i] = box[j];
        box[j] = tmp;
    }
    // 伪随机生成算法
    for (let a = 0, j = 0, i = 0; i < data_length; i++) {
        a = (a + 1) % 256;
        j = (j + box[a]) % 256;
        let tmp = box[a];
        box[a] = box[j];
        box[j] = tmp;
        let k = box[((box[a] + box[j]) % 256)];
        cipher += String.fromCharCode(data[i].charCodeAt() ^ k);
    }
    if (t === 1) {
        return decodeURIComponent(cipher);
    } else {
        return btoa(cipher);
    }
}

// https://github.com/Hiram-Wong/ZyPlayer/blob/main/src/renderer/src/utils/crypto.ts
/**
 * 十六进制编解码工具
 */
const hex = {
    decode: function (val) {
        return Buffer.from(val, 'hex').toString('utf-8');
    },
    encode: function (val) {
        return Buffer.from(val, 'utf-8').toString('hex');
    },
};

/**
 * 解析编码格式
 * @param {string} value 值
 * @param {string} encoding 编码格式
 * @returns {Object} CryptoJS编码对象
 */
const parseEncode = function (value, encoding) {
    switch (encoding) {
        case 'base64':
            return CryptoJS.enc.Base64.parse(value);
        case 'hex':
            return CryptoJS.enc.Hex.parse(value);
        case 'latin1':
            return CryptoJS.enc.Latin1.parse(value);
        case 'utf8':
            return CryptoJS.enc.Utf8.parse(value);
        default:
            return CryptoJS.enc.Utf8.parse(value);
    }
};

/**
 * 格式化编码输出
 * @param {Object} value CryptoJS对象
 * @param {string} encoding 编码格式
 * @returns {string} 格式化结果
 */
const formatEncode = function (value, encoding) {
    switch (encoding.toLowerCase()) {
        case 'base64':
            return value.toString(); // 整个CipherParams对象(含原数据), 默认输出 Base64
        case 'hex':
            return value.ciphertext.toString(); // ciphertext属性(仅密文), 默认输出 Hex
    }
};

/**
 * 格式化解码输出
 * @param {Object} value CryptoJS对象
 * @param {string} encoding 编码格式
 * @returns {string} 格式化结果
 */
const formatDecode = function (value, encoding) {
    switch (encoding.toLowerCase()) {
        case 'utf8':
            return value.toString(CryptoJS.enc.Utf8);
        case 'base64':
            return value.toString(CryptoJS.enc.Base64);
        case 'hex':
            return value.toString(CryptoJS.enc.Hex);
        default:
            return value.toString(CryptoJS.enc.Utf8);
    }
};

/**
 * 获取加密模式
 * @param {string} mode 模式名称
 * @returns {Object} CryptoJS模式对象
 */
const getMode = function (mode) {
    switch (mode.toLowerCase()) {
        case 'cbc':
            return CryptoJS.mode.CBC;
        case 'cfb':
            return CryptoJS.mode.CFB;
        case 'ofb':
            return CryptoJS.mode.OFB;
        case 'ctr':
            return CryptoJS.mode.CTR;
        case 'ecb':
            return CryptoJS.mode.ECB;
        default:
            return CryptoJS.mode.CBC;
    }
};

/**
 * 获取填充方式
 * @param {string} padding 填充方式名称
 * @returns {Object} CryptoJS填充对象
 */
const getPad = function (padding) {
    switch (padding.toLowerCase()) {
        case 'zeropadding':
            return CryptoJS.pad.ZeroPadding;
        case 'pkcs5padding':
        case 'pkcs7padding':
            return CryptoJS.pad.Pkcs7;
        case 'ansix923':
            return CryptoJS.pad.AnsiX923;
        case 'iso10126':
            return CryptoJS.pad.Iso10126;
        case 'iso97971':
            return CryptoJS.pad.Iso97971;
        case 'nopadding':
            return CryptoJS.pad.NoPadding;
        default:
            return CryptoJS.pad.ZeroPadding;
    }
};

/**
 * RC4加密解密工具
 */
export const rc4 = {
    /**
     * RC4编码
     * @param {string} val 待编码值
     * @param {string} key 密钥
     * @param {string} encoding 输入编码
     * @param {string} keyEncoding 密钥编码
     * @param {string} outputEncode 输出编码
     * @returns {string} 编码结果
     */
    encode: function (val, key, encoding = 'utf8', keyEncoding = 'utf8', outputEncode = 'base64') {
        if (!['base64', 'hex'].includes(outputEncode.toLowerCase())) return '';
        if (!key || !val) return '';

        const plaintext = parseEncode(val, encoding);
        const v = parseEncode(key, keyEncoding);

        return formatEncode(CryptoJS.RC4.encrypt(plaintext, v), outputEncode);
    },
    /**
     * RC4解码
     * @param {string} val 待解码值
     * @param {string} key 密钥
     * @param {string} encoding 输入编码
     * @param {string} keyEncoding 密钥编码
     * @param {string} outputEncode 输出编码
     * @returns {string} 解码结果
     */
    decode: function (val, key, encoding = 'utf8', keyEncoding = 'utf8', outputEncode = 'base64') {
        if (!['base64', 'hex'].includes(encoding.toLowerCase())) return '';
        if (!key || !val) return '';

        const plaintext = parseEncode(val, encoding);
        const v = parseEncode(key, keyEncoding);

        return formatDecode(CryptoJS.RC4.toString(plaintext, v), outputEncode);
    },
};
