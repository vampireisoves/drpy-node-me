// scripts/dingtalk_test.mjs
import MessageSender from '../../utils/message_sender.js';


export default {
    schedule: {
        // cron: '0 0 9 * * *',       // 每天 9:00
        timezone: 'Asia/Shanghai', // 直接用北京时间时区
        runOnInit: false // 启动时立即执行一次
    },

    run: async (fastify) => {
        fastify.log.info('📊 test send dingtalk message...');
        await MessageSender.send('这是钉钉消息');
        fastify.log.info('📤 send dingtalk message successfully');
    }
};