// scripts/daily-report.mjs
import MessageSender from '../../utils/message_sender.js';
import {getDailyNews} from "../mjs/news-util.mjs";

export default {
    // 每天北京时间上午8点执行
    schedule: {
        // cron: '0 0 1 * * *', // UTC时间1点对应北京时间9点
        // timezone: 'UTC',
        cron: '0 0 14 * * *',       // 每天 14:00
        // cron: '0 31 17 * * *',       // 每天 17:30
        timezone: 'Asia/Shanghai', // 直接用北京时间时区
        runOnInit: false // 启动时立即执行一次
    },

    run: async (fastify) => {
        fastify.log.info('📊 Generating daily report...');
        // 这里执行生成日报的逻辑
        // await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('正在获取国内新闻...');
        const news = await getDailyNews();

        if (news.length === 0) {
            console.log('未获取到新闻数据');
            return;
        }
        // 输出新闻
        const news_arr = [];
        news_arr.push('\n最新国内新闻:');
        news.forEach((item, index) => {
            news_arr.push(`${index + 1}. ${item.title}`);
            news_arr.push(`   ${item.description.trim()}`);
            news_arr.push(`   来源: ${item.source} | 发布时间: ${item.ctime}`);
            news_arr.push(`   链接: ${item.url}`);
        });
        fastify.log.info(news_arr.join('\n'));
        await MessageSender.send(news_arr.join('\n'));
        fastify.log.info('📤 Daily report sent successfully');
    }
};