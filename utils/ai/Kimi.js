/**
 * Kimi AI 客户端 - 月之暗面 Moonshot AI 接口封装
 * 
 * 功能说明：
 * - 封装 Moonshot AI (Kimi) 的 API 调用
 * - 支持多用户上下文管理
 * - 自动维护对话历史记录
 * - 提供简洁的问答接口
 * 
 * 相关链接：
 * - API Keys: https://platform.moonshot.cn/console/api-keys
 * - 使用限制: https://platform.moonshot.cn/console/limits
 */

import axios from 'axios';

/**
 * Kimi AI 客户端类
 * 
 * @class Kimi
 * @description 提供与 Moonshot AI 服务的交互接口，支持多用户上下文管理
 */
class Kimi {
    /**
     * 构造函数
     * 
     * @param {Object} config - 配置对象
     * @param {string} config.apiKey - Moonshot AI 的 API 密钥（必需）
     * @param {string} [config.baseURL='https://api.moonshot.cn/v1'] - API 基础地址
     * @throws {Error} 当缺少必需的 apiKey 参数时抛出错误
     */
    constructor({apiKey, baseURL}) {
        if (!apiKey) {
            throw new Error('Missing required configuration parameters.');
        }
        
        /** @type {string} API 密钥 */
        this.apiKey = apiKey;
        
        /** @type {string} API 基础地址 */
        this.baseURL = baseURL || 'https://api.moonshot.cn/v1';
        
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
     * 向 Kimi AI 发送问题并获取回答
     * 
     * @param {string} userId - 用户唯一标识符
     * @param {string} prompt - 用户的问题或提示
     * @param {Object} [options={}] - 可选参数
     * @param {number} [options.temperature] - 回答的随机性（0-1）
     * @param {number} [options.max_tokens] - 最大回答长度
     * @param {string} [options.model] - 使用的模型名称
     * @returns {Promise<string>} AI 的回答内容
     * @throws {Error} 当 API 调用失败时抛出错误
     * 
     * @example
     * const kimi = new Kimi({ apiKey: 'your-api-key' });
     * const answer = await kimi.ask('user123', '什么是人工智能？');
     * console.log(answer);
     */
    async ask(userId, prompt, options = {}) {
        // 确保用户上下文已初始化
        this.initUserContext(userId);

        // 构建请求载荷
        const payload = {
            model: options.model || 'moonshot-v1-8k', // 默认使用 8k 上下文模型
            messages: this.userContexts[userId].concat([{
                role: 'user',
                content: prompt
            }]),
            ...options, // 合并其他选项，如 temperature、max_tokens 等
        };

        // 调试输出请求载荷
        console.log('Kimi API Request Payload:', payload);

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
                    `Error from Kimi AI: ${response.data.error || 'No valid response received'}`
                );
            }
        } catch (error) {
            // 记录错误并重新抛出
            console.error('Error while communicating with Kimi AI:', error.message);
            
            // 如果是 axios 错误，提供更详细的错误信息
            if (error.response) {
                const errorMsg = error.response.data?.error?.message || error.response.statusText;
                throw new Error(`Kimi AI API Error (${error.response.status}): ${errorMsg}`);
            }
            
            throw error;
        }
    }
}

export default Kimi;
