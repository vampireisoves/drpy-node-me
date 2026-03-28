/**
 * JSON1视频解析器
 * 
 * 功能描述：
 * 这是一个基于第三方API的视频解析器，用于解析各大视频平台的播放链接。
 * 支持爱奇艺、腾讯视频、优酷等主流视频平台的视频解析。
 * 
 * 主要功能：
 * 1. 视频链接解析 - 将平台视频页面链接转换为可播放的直链
 * 2. 多平台支持 - 支持爱奇艺、腾讯、优酷等主流视频平台
 * 3. 异步处理 - 使用异步方式调用第三方解析API
 * 4. 错误处理 - 提供超时和异常处理机制
 * 
 * 支持的视频平台：
 * - 爱奇艺 (qiyi, imgo, 爱奇艺, 奇艺)
 * - 腾讯视频 (qq, qq 预告及花絮, 腾讯)
 * - 优酷 (youku, 优酷)
 * 
 * API接口：
 * GET /parse/json1?url={视频页面URL}
 * 
 * 使用示例：
 * http://localhost:5757/parse/json1?url=https://v.qq.com/x/cover/mzc00200vkqr54u/v4100qp69zl.html
 * 
 * 第三方API：
 * - 解析服务：https://cdnsrc.cdnapi.top/json/
 * - 超时设置：8秒
 * 
 * @author drpy-node
 * @version 1.0.0
 */

// 示例调用URL：
// http://localhost:5757/parse/json1?url=https://v.qq.com/x/cover/mzc00200vkqr54u/v4100qp69zl.html

// 导入请求工具库
const {requestJson} = $.require('./_lib.request.js')

/**
 * 解析器配置对象
 * 定义了解析器的基本信息和支持的平台标识
 */
const jx = {
    type: 1,                    // 解析器类型：1表示JSON解析器
    ext: {
        'flag': [               // 支持的视频平台标识列表
            'qiyi',             // 爱奇艺标识1
            'imgo',             // 爱奇艺标识2
            '爱奇艺',            // 爱奇艺中文标识
            '奇艺',              // 奇艺简称
            'qq',               // 腾讯视频标识
            'qq 预告及花絮',      // 腾讯视频预告片标识
            '腾讯',              // 腾讯中文标识
            'youku',            // 优酷英文标识
            '优酷',              // 优酷中文标识
        ]
    },
    header: {
        'User-Agent': MOBILE_UA,    // 默认使用移动端User-Agent
    },
    // 添加url属性直接暴露api，不走系统。建议web解析才写这个属性,json解析隐藏起来
    // url: 'https://cdnsrc.cdnapi.top/json/?url=',
};

/**
 * 懒加载解析函数
 * 异步调用第三方API解析视频链接
 * 
 * @param {string} input - 待解析的视频页面URL
 * @param {Object} params - 解析参数（当前未使用）
 * @returns {Promise<string>} 解析后的视频播放链接
 * 
 * @example
 * const playUrl = await lazy('https://v.qq.com/x/cover/mzc00200vkqr54u/v4100qp69zl.html');
 * 
 * @throws {Error} 当API请求失败或超时时抛出异常
 */
async function lazy(input, params) {
    log('input:', input);                                           // 记录输入的视频URL
    
    let headers = {'User-Agent': PC_UA};                           // 使用PC端User-Agent发送请求
    let timeout = 8000;                                            // 设置请求超时时间为8秒
    
    // 调用第三方解析API获取视频直链
    let obj = await requestJson('https://kalbim.xatut.top/kalbim2025/781718/play/video_player.php?url=' + input, {headers, timeout});
    
    return obj.url                                                 // 返回解析后的视频播放链接
}
