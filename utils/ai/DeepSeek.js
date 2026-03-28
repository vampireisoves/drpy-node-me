/**
 * DeepSeek AI 客户端 - DeepSeek AI 接口封装
 * 
 * 功能说明：
 * - 封装 DeepSeek AI 的 API 调用
 * - 支持多用户上下文管理
 * - 自动维护对话历史记录
 * - 提供简洁的问答接口
 * 
 * 相关链接：
 * - 使用统计: https://platform.deepseek.com/usage
 * - API Keys: https://platform.deepseek.com/api_keys
 */

import axios from 'axios';

/**
 * DeepSeek AI 客户端类
 * 
 * @class DeepSeek
 * @description 提供与 DeepSeek AI 服务的交互接口，支持多用户上下文管理
 */
class DeepSeek {
    /**
     * 构造函数
     * 
     * @param {Object} config - 配置对象
     * @param {string} config.apiKey - DeepSeek AI 的 API 密钥（必需）
     * @param {string} [config.baseURL='https://api.deepseek.com'] - API 基础地址
     * @throws {Error} 当缺少必需的 apiKey 参数时抛出错误
     */
    constructor({apiKey, baseURL}) {
        if (!apiKey) {
            throw new Error('Missing required configuration parameters.');
        }
        
        /** @type {string} API 密钥 */
        this.apiKey = apiKey;
        
        /** @type {string} API 基础地址 */
        this.baseURL = baseURL || 'https://api.deepseek.com';
        
        /** @type {Object<string, Array>} 存储每个用户的对话上下文 */
        this.userContexts = {};
    }

    /**
     * 初始化用户上下文
     * 
     * @param {string} userId - 用户唯一标识符
     * @description 为新用户创建初始对话上下文，包含系统提示词
     */
    initUserContext(userId) {
        if (!this.userContexts[userId]) {
            this.userContexts[userId] = [
                {
                    role: "system", 
                    content: "你是一名优秀的AI助手，知道最新的互联网内容，善用搜索引擎和github并总结最贴切的结论来回答我提出的每一个问题"
                }
            ];
        }
    }

    /**
     * 更新用户上下文
     * 
     * @param {string} userId - 用户唯一标识符
     * @param {Object} message - 要添加的消息对象
     * @param {string} message.role - 消息角色（'user' 或 'assistant'）
     * @param {string} message.content - 消息内容
     * @description 将新消息添加到用户上下文中，并自动管理上下文长度（最多保留20条消息）
     */
    updateUserContext(userId, message) {
        this.userContexts[userId].push(message);
        
        // 控制上下文长度，保留最新的20条消息（包含系统消息）
        if (this.userContexts[userId].length > 20) {
            // 保留系统消息和最新的19条消息
            const systemMessage = this.userContexts[userId][0];
            const recentMessages = this.userContexts[userId].slice(-19);
            this.userContexts[userId] = [systemMessage, ...recentMessages];
        }
    }

    /**
     * 向 DeepSeek AI 发送问题并获取回答
     * 
     * @param {string} userId - 用户唯一标识符
     * @param {string} prompt - 用户的问题或提示
     * @param {Object} [options={}] - 可选参数
     * @param {number} [options.temperature] - 回答的随机性（0-2）
     * @param {number} [options.max_tokens] - 最大回答长度
     * @param {string} [options.model] - 使用的模型名称
     * @param {number} [options.top_p] - 核采样参数
     * @returns {Promise<string>} AI 的回答内容
     * @throws {Error} 当 API 调用失败时抛出错误
     * 
     * @example
     * const deepseek = new DeepSeek({ apiKey: 'your-api-key' });
     * const answer = await deepseek.ask('user123', '解释一下深度学习的原理');
     * console.log(answer);
     */
    async ask(userId, prompt, options = {}) {
        // 确保用户上下文已初始化
        this.initUserContext(userId);

        // 构建请求载荷
        const payload = {
            model: options.model || 'deepseek-chat', // 默认使用 deepseek-chat 模型
            messages: this.userContexts[userId].concat([{
                role: 'user',
                content: prompt
            }]),
            ...options, // 合并其他选项，如 temperature、max_tokens 等
        };

        // 调试输出请求载荷
        console.log('DeepSeek API Request Payload:', payload);

        try {
            // 发送 API 请求
            const response = await axios.post(`${this.baseURL}/chat/completions`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`, // Bearer 认证
                },
            });

            // 处理响应数据
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                const assistantMessage = response.data.choices[0].message;
                
                // 将 AI 的回答添加到用户上下文中
                this.updateUserContext(userId, assistantMessage);
                
                return assistantMessage.content;
            } else {
                throw new Error(
                    `Error from DeepSeek AI: ${response.data.error || 'No valid response received'}`
                );
            }
        } catch (error) {
            // 记录错误并重新抛出
            console.error('Error while communicating with DeepSeek AI:', error.message);
            
            // 如果是 axios 错误，提供更详细的错误信息
            if (error.response) {
                const errorMsg = error.response.data?.error?.message || error.response.statusText;
                throw new Error(`DeepSeek AI API Error (${error.response.status}): ${errorMsg}`);
            }
            
            throw error;
        }
    }
}

export default DeepSeek;
