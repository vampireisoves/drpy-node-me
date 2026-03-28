import MessageSender from '../../utils/message_sender.js';

export default {
    schedule: {
        //cron: '0 */30 * * * *',
        timezone: 'Asia/Shanghai', // 直接用北京时间时区
        runOnInit: false // 启动时立即执行一次
    },
    run: async (fastify) => {
        fastify.log.info('📊 版本监测...');
            let vercode = "V1.0";
            let config = {
                //to: '123456@qq.com,1234567@qq.com', 不填默认发给自己
                subject: '版本监听',
                text: `有更新，版本${vercode}`,
                html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa;border-radius:8px;">
  <p style="font-size:16px;color:#333;margin:0 0 15px 0;"><span style="color:#4CAF50;font-weight:bold;">🔄 更新通知：</span>当前版本 <strong style="color:#2196F3;">${vercode}</strong> 已发布</p></div>`
            };
            await MessageSender.send(config,2);
            fastify.log.info('📤 send qqemail message successfully');
    }
};