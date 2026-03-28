/**
 * Web1 解析器 - 基于第三方解析接口的视频解析模块
 * 
 * 功能说明：
 * - 支持多个主流视频平台的解析（爱奇艺、腾讯、优酷等）
 * - 通过第三方解析接口 bfq.cfwlgzs.cn 进行视频链接解析
 * - 使用重定向方式返回解析后的视频地址
 * 
 * 使用示例：
 * http://localhost:5757/parse/web1?url=https://v.qq.com/x/cover/mzc00200vkqr54u/v4100qp69zl.html
 */

// 引入请求工具库
const {requestJson} = $.require('./_lib.request.js')

/**
 * 解析器配置对象
 * @type {Object}
 */
const jx = {
    /**
     * 解析器类型
     * @type {number} 0表示web解析器
     */
    type: 0,
    
    /**
     * 扩展配置
     * @type {Object}
     */
    ext: {
        /**
         * 支持的视频平台标识列表
         * @type {Array<string>} 包含各大视频平台的标识符
         */
        'flag': [
            'qiyi',           // 爱奇艺平台标识
            'imgo',           // imgo平台标识
            '爱奇艺',          // 爱奇艺中文标识
            '奇艺',           // 奇艺简称
            'qq',             // 腾讯视频标识
            'qq 预告及花絮',   // 腾讯视频预告片标识
            '腾讯',           // 腾讯中文标识
            'youku',          // 优酷平台标识
            '优酷',           // 优酷中文标识
        ]
    },
    
    /**
     * 请求头配置
     * @type {Object}
     */
    header: {
        /**
         * 用户代理字符串，使用移动端UA
         * @type {string}
         */
        'User-Agent': MOBILE_UA,
    },
    
    /**
     * 第三方解析接口地址
     * 添加url属性直接暴露api，不走系统。建议web解析才写这个属性,json解析隐藏起来
     * @type {string}
     */
    url: 'https://www.ckplayer.vip/jiexi/?url=',
};

/**
 * 懒加载解析函数
 * 
 * @param {string} input - 待解析的视频URL
 * @param {Object} params - 解析参数（当前未使用）
 * @returns {Promise<string>} 返回重定向地址，格式为 'redirect://解析接口地址+原始URL'
 * 
 * @description
 * 该函数不直接解析视频，而是返回一个重定向地址，
 * 将原始视频URL拼接到第三方解析接口后面，
 * 由系统进行重定向到解析接口进行实际解析
 */
async function lazy(input, params) {
    // 返回重定向地址，将原始URL拼接到解析接口后面
    return 'redirect://' + jx.url + input
}
