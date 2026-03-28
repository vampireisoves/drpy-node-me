import axios from 'axios';

// https://www.tianapi.com/apiview/4
// 配置参数 - 需要替换为你自己的API密钥
export const API_KEY = process.env.tx_news_guonei_api_key || 'YOUR_API_KEY'; // 从天行数据(https://www.tianapi.com/)获取
// const API_KEY = '770fa1d03b538b12b5596a3877d39e1e'; // 从天行数据(https://www.tianapi.com/)获取
const NEWS_API_URL = 'https://api.tianapi.com/guonei/index';

export async function getDailyNews() {
    try {
        // 设置请求参数
        const params = {
            key: API_KEY,
            num: 10, // 获取10条新闻
        };

        // 发送API请求
        const response = await axios.get(NEWS_API_URL, {params});

        // 检查API响应
        if (response.data.code !== 200) {
            throw new Error(`API错误: ${response.data.msg}`);
        }

        // 返回格式化新闻数据
        return response.data.newslist.map(item => ({
            title: item.title,
            description: item.description,
            url: item.url,
            picUrl: item.picUrl,
            ctime: item.ctime,
            source: item.source,
        }));
    } catch (error) {
        console.error('获取新闻失败:', error.message);
        return [];
    }
}

