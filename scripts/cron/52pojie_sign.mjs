// scripts/52pojie_sign.mjs
import MessageSender from '../../utils/message_sender.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const cookie = process.env.cookie_52pojie || "";
const headers = {
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4265.0 Safari/537.36 Edg/87.0.644.4'
};
const url_draw = 'https://www.52pojie.cn/home.php?mod=task&do=draw&id=2';
const url_apply = 'https://www.52pojie.cn/home.php?mod=task&do=apply&id=2';

export default {
    schedule: {
        // cron: '0 0 7 * * *',       // 每天 7:00
        timezone: 'Asia/Shanghai', // 直接用北京时间时区
        runOnInit: false // 启动时立即执行一次
    },

    run: async (fastify) => {
        if (!cookie) {
            return
        }
        fastify.log.info('📊 开始论坛签到...');
        fastify.log.info(`headers: ${JSON.stringify(headers)}`);
        try {
            // 申请任务
            await axios.get(url_apply, {headers});
            // 领取任务
            const response = await axios.get(url_draw, {headers});
            const $ = cheerio.load(response.data);
            const username = $('.vwmy a').text();
            const message = $('#messagetext p').text();
            if (username) {
                const msg = `52破解签到信息\n${username}\t${message}`;
                fastify.log.info(msg);
                await MessageSender.send(msg);
            } else {
                fastify.log.info(`签到失败,网页内容为:${response.data.slice(0, 300)}`);
            }

        } catch (error) {
            fastify.log.info(`请求出错:${error.message}`);
        }
        fastify.log.info('📤 论坛签到完成');
    }
};