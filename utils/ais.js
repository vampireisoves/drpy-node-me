/**
 * AI服务模块集合
 * 统一导入和导出各种AI服务提供商的实现
 * 
 * 支持的AI服务：
 * - SparkAI: 讯飞星火AI服务
 * - DeepSeek: DeepSeek AI服务
 * - SparkAIBot: 讯飞星火AI机器人服务
 * - Kimi: Kimi AI服务
 * 
 * @example
 * import ais from './ais.js';
 * const sparkAI = new ais.SparkAI(config);
 * const response = await sparkAI.chat('你好');
 */

// 导入各种AI服务实现
import SparkAI from './ai/SparkAI.js';      // 讯飞星火AI服务
import DeepSeek from './ai/DeepSeek.js';    // DeepSeek AI服务
import SparkAIBot from './ai/SparkAIBot.js'; // 讯飞星火AI机器人服务
import Kimi from './ai/Kimi.js';            // Kimi AI服务

// 统一导出所有AI服务
export default {SparkAI, DeepSeek, SparkAIBot, Kimi}
