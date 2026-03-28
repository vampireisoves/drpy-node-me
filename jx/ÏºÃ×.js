/**
 * 虾米视频解析器
 * 
 * 功能描述：
 * 这是一个基于虾米解析服务的视频解析器，使用加密通信协议与第三方解析API交互。
 * 支持多种视频平台的解析，采用AES加密确保通信安全。
 * 
 * 主要功能：
 * 1. 视频链接解析 - 解析各大视频平台的播放链接
 * 2. 加密通信 - 使用MD5+AES加密与解析服务通信
 * 3. 动态UA - 使用随机User-Agent避免被识别
 * 4. 安全解密 - 对返回的加密播放链接进行AES解密
 * 
 * 技术特点：
 * - MD5签名验证：对请求参数进行MD5哈希签名
 * - AES加密通信：使用AES-CBC模式加密请求数据
 * - AES解密响应：解密服务器返回的加密播放链接
 * - 随机UA：动态生成User-Agent避免检测
 * 
 * API接口：
 * GET /parse/虾米?url={视频页面URL}
 * 
 * 使用示例：
 * http://localhost:5757/parse/虾米?url=https://v.qq.com/x/cover/mzc00200vkqr54u/v4100qp69zl.html
 * 
 * 第三方服务：
 * - 解析服务：https://122.228.8.29:4433/xmflv.js
 * - 参考站点：https://jx.xmflv.com
 * 
 * 加密算法：
 * - 签名：MD5(时间戳 + URL编码的视频链接)
 * - 加密：AES-CBC模式，ZeroPadding填充
 * - 解密：AES-CBC模式，Pkcs7填充
 * 
 * @author drpy-node
 * @version 1.0.0
 */

// 示例调用URL：
// http://localhost:5757/parse/虾米?url=https://v.qq.com/x/cover/mzc00200vkqr54u/v4100qp69zl.html
// 参考解析站点：https://jx.xmflv.com/?url=https://v.qq.com/x/cover/mzc00200qon7vo3/b4100sccuyb.html

// 导入HTML请求工具
const {getHtml} = $.require('./_lib.request.js')

/**
 * 解析器配置对象
 * 定义了请求头信息
 */
const jx = {
    header: {
        'User-Agent': PC_UA,                    // 使用PC端User-Agent
        'Referer': 'https://jx.xmflv.com'      // 设置来源页面，模拟从官方站点访问
    },
};

/**
 * 懒加载解析函数
 * 使用加密通信协议解析视频链接
 * 
 * @param {string} input - 待解析的视频页面URL
 * @param {Object} params - 解析参数（当前未使用）
 * @returns {Promise<Object>} 包含解密后播放链接和请求头的对象
 * 
 * @example
 * const result = await lazy('https://v.qq.com/x/cover/mzc00200vkqr54u/v4100qp69zl.html');
 * // 返回: {url: '解密后的播放链接', header: {请求头信息}}
 */
async function lazy(input, params) {
    console.log('input:', input);
    
    // 生成时间戳作为请求标识
    const t = Date.now()
    
    // 生成MD5签名：MD5(时间戳 + URL编码的视频链接)
    const a = CryptoJS.MD5(t + encodeURIComponent(input)).toString()
    
    /**
     * AES加密签名函数
     * 使用MD5哈希作为密钥，对签名进行AES加密
     * 
     * @param {string} a - 待加密的签名字符串
     * @returns {string} AES加密后的字符串
     */
    const sign = function (a) {
        const b = CryptoJS.MD5(a);                          // 对签名进行MD5哈希作为密钥
        const c = CryptoJS.enc.Utf8.parse(b);               // 将MD5结果转换为UTF8格式
        const d = CryptoJS.enc.Utf8.parse('3cccf88181408f19'); // 固定的初始化向量(IV)
        
        // 使用AES-CBC模式加密，ZeroPadding填充
        return CryptoJS.AES.encrypt(a, c, {
            iv: d,                                          // 初始化向量
            mode: CryptoJS.mode.CBC,                        // CBC模式
            padding: CryptoJS.pad.ZeroPadding               // Zero填充
        }).toString()
    };
    
    // 生成随机User-Agent避免被识别
    let ua = randomUa.generateUa();
    
    // 向解析服务发送POST请求
    let reqs = (await getHtml({
        url: "https://122.228.8.29:4433/xmflv.js",         // 解析服务API地址
        method: 'POST',                                     // 使用POST方法
        headers: {
            'User-Agent': ua,                               // 随机User-Agent
            'Origin': 'https://jx.xmflv.com'               // 设置来源域名
        },
        data: qs.stringify({                                // 表单数据
            'wap': '',                                      // WAP标识（空）
            'url': encodeURIComponent(input),               // URL编码的视频链接
            'time': t,                                      // 时间戳
            'key': sign(a)                                  // 加密签名
        }),
    })).data;
    
    // 从响应中提取解密所需的参数
    let key = reqs.aes_key         // AES解密密钥
    let iv = reqs.aes_iv           // AES解密初始化向量
    let play_url = reqs.url        // 加密的播放链接
    
    // 注释掉的M3U8处理代码（备用）
    // let m3u8 = (await axios.request({
    //     url:m3u8_url
    // })).data
    
    // 返回解密后的播放链接和请求头
    return {
        url: decrypt(play_url, key, iv),                    // 解密播放链接
        header: {
            'origin': 'https://jx.xmflv.cc/',              // 设置来源域名
            // 'Origin': 'https://jx.xmflv.com',           // 备用来源域名（已注释）
            'User-Agent': ua,                               // 使用相同的随机User-Agent
        }
    }
}

/**
 * AES解密函数
 * 使用AES-CBC模式解密服务器返回的加密播放链接
 * 
 * @param {string} text - 加密的文本（Base64格式）
 * @param {string} aes_key - AES解密密钥
 * @param {string} aes_iv - AES解密初始化向量
 * @returns {string} 解密后的明文播放链接
 * 
 * @example
 * const playUrl = decrypt(encryptedUrl, key, iv);
 */
function decrypt(text, aes_key, aes_iv) {
    // 将密钥和IV转换为UTF8格式
    let key = CryptoJS.enc.Utf8.parse(aes_key),
        iv = CryptoJS.enc.Utf8.parse(aes_iv),
        
        // 使用AES-CBC模式解密，Pkcs7填充
        decrypted = CryptoJS.AES.decrypt(text, key, {
            iv: iv,                                         // 初始化向量
            mode: CryptoJS.mode.CBC,                        // CBC模式
            padding: CryptoJS.pad.Pkcs7                     // Pkcs7填充
        });
    
    // 将解密结果转换为UTF8字符串并返回
    return decrypted.toString(CryptoJS.enc.Utf8);
}
