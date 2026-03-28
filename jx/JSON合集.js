/**
 * JSON合集解析器
 * 
 * 功能：通过多个解析接口并发解析视频链接，提高解析成功率
 * 接口示例：http://localhost:5757/parse/JSON合集?url=https://v.qq.com/x/cover/mzc00200vkqr54u/v4100qp69zl.html
 * 
 * @author drpy
 * @version 1.0.0
 */

// 引入请求和随机工具库
const {requestJson} = $.require('./_lib.request.js');
const {getRandomFromList, shuffleArray} = $.require('./_lib.random.js');

/**
 * 解析器配置对象
 * @type {Object}
 */
const jx = {
    type: 3, // 解析器类型：3表示JSON解析器
    ext: {
        /**
         * 支持的视频平台标识列表
         * 用于匹配不同视频平台的播放链接
         */
        'flag': [
            "qiyi",           // 爱奇艺
            "imgo",           // 图片相关
            "爱奇艺",          // 爱奇艺中文标识
            "奇艺",           // 奇艺简称
            "qq",             // 腾讯视频
            "qq 预告及花絮",   // 腾讯视频预告
            "腾讯",           // 腾讯视频中文标识
            "youku",          // 优酷
            "优酷",           // 优酷中文标识
            "pptv",           // PPTV
            "PPTV",           // PPTV大写
            "letv",           // 乐视
            "乐视",           // 乐视中文标识
            "leshi",          // 乐视拼音
            "mgtv",           // 芒果TV
            "芒果",           // 芒果TV中文标识
            "sohu",           // 搜狐视频
            "xigua",          // 西瓜视频
            "fun",            // 风行视频
            "风行"            // 风行视频中文标识
        ]
    },
}

/**
 * 懒加载解析函数
 * 通过多个解析接口并发请求，提高解析成功率和速度
 * 
 * @param {string} input - 待解析的视频URL
 * @param {Object} params - 解析参数（可选）
 * @returns {Promise<Object>} 解析结果对象，包含真实播放地址
 */
async function lazy(input, params) {
    log('input:', input);
    
    /**
     * 解析接口列表
     * 包含多个备用解析接口，提高解析成功率
     */
    let parse_list = [
        "https://kalbim.xatut.top/kalbim2025/781718/play/video_player.php?url=",    // 主要解析接口
        "http://1.94.221.189:88/algorithm.php?url=" // 备用解析接口
    ]
    
    let realUrls = []; // 存储解析成功的URL结果
    
    /**
     * 构建并发任务列表
     * 为每个解析接口创建一个异步任务
     */
    const tasks = parse_list.map((_url, index) => {
        let task_id = _url + input; // 完整的解析请求URL
        return {
            /**
             * 解析任务函数
             * @param {Object} param - 任务参数
             * @param {string} param._url - 解析接口URL
             * @param {string} param.task_id - 完整的请求URL
             * @returns {Promise<Object>} 解析结果
             */
            func: async function parseTask({_url, task_id}) {
                let json = await requestJson(task_id); // 发送解析请求
                let url = pjfh(json, '$.url'); // 提取解析后的视频URL
                
                // 检查解析结果是否有效
                if (!json.code || json.code === 200 || ![-1, 404, 403].includes(json.code)) {
                    if (url) {
                        // 验证URL有效性：检查文件名长度
                        let lastIndex = url.lastIndexOf('/');
                        let lastLength = url.slice(lastIndex + 1).length;
                        // log('lastLength:', lastLength);
                        
                        if (lastLength > 10) { // 文件名长度大于10认为是有效URL
                            // log(`code:${json.code} , url:${json.url}`);
                            return json
                        }
                    }
                    // 解析失败，抛出错误
                    throw new Error(`${_url} 解析 ${input} 失败: ${JSON.stringify(json)}`);
                } else {
                    // HTTP状态码异常，解析失败
                    throw new Error(`${_url} 解析 ${input} 失败`);
                }
            },
            param: {_url, task_id}, // 任务参数
            id: task_id             // 任务唯一标识
        }
    });
    
    /**
     * 任务执行监听器
     * 处理任务执行结果，收集成功的解析结果
     */
    const listener = {
        /**
         * 任务结果处理函数
         * @param {Object} param - 监听器参数
         * @param {string} id - 任务ID
         * @param {Error} error - 错误信息（如果有）
         * @param {Object} result - 执行结果（如果成功）
         * @returns {string|undefined} 返回'break'可中断后续任务执行
         */
        func: (param, id, error, result) => {
            if (error) {
                // 任务执行失败，记录错误（可选）
                // console.error(`Task ${id} failed with error: ${error.message}`);
            } else if (result) {
                // 任务执行成功，收集结果
                // log(`Task ${id} succeeded with result: `, result);
                realUrls.push({original: id, ...result});
            }
            
            // 中断逻辑：如果设置了stopOnFirst且获得了有效结果，则中断后续任务
            if (param.stopOnFirst && result && result.url) {
                return 'break';
            }
        },
        param: {stopOnFirst: true}, // 获得第一个成功结果后即停止
    }
    
    // 执行并发任务，最大并发数为1（串行执行）
    await batchExecute(tasks, listener, 1);
    
    // 返回第一个成功解析的结果
    return realUrls[0]
}
