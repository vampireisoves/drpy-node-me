// scripts/kzz_spider.mjs
import MessageSender from '../../utils/message_sender.js';
import {getNowKzz} from "../mjs/kzz-util.mjs";

function formatBondMessage(bonds) {
    // 获取当前时间并格式化
    const now = new Date();

    // 格式化日期为 YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // 格式化时间为 HH:mm:ss
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // 获取星期几（0-6，0表示星期日）
    const weekDay = now.getDay();
    // 将星期转换为数字格式（0=星期日，1=星期一，...6=星期六）
    const weekDayNumber = weekDay === 0 ? 0 : weekDay;
    const weekDict = {
        0: '天',
        1: '一',
        2: '二',
        3: '三',
        4: '四',
        5: '五',
        6: '六',
    };
    const weekName = weekDict[weekDayNumber];

    // 组装标题和时间信息
    let message = "可转债打新消息推送\n";
    message += `现在是: ${year}-${month}-${day} ${hours}:${minutes}:${seconds}  星期${weekName}\n`;

    // 添加每条债券信息
    if (bonds && bonds.length > 0) {
        bonds.forEach(bond => {
            message += `${bond.name}[${bond.code}]  申购日:${bond.date}\n`;
        });
    } else {
        message += `近日暂未可转债打新消息`;
    }

    return message;
}

export default {
    schedule: {
        cron: '0 0 9 * * 1,2,3,4,5',       // 每周工作日9点
        timezone: 'Asia/Shanghai', // 直接用北京时间时区
        runOnInit: false // 启动时立即执行一次
    },

    run: async (fastify) => {
        fastify.log.info('📊 kzz_spider.mjs send dingtalk message...');
        let kzzData = await getNowKzz(
            `获取未来3天的可转债数据`,
            'http://data.eastmoney.com/kzz/',
            3
        );
        // console.log(kzzData);
        // kzzData = [
        //     {name: '微导转债', code: '118058', date: '2025-08-06'},
        //     {name: '晶科转债', code: '118099', date: '2025-08-07'},
        //     {name: '隆基转债', code: '113050', date: '2025-08-08'}
        // ];
        const sendMsg = formatBondMessage(kzzData);
        await MessageSender.send(sendMsg);
        fastify.log.info(`📤 send dingtalk message successfully: ${sendMsg}`);
        fastify.log.info('📤 kzz_spider.mjs send dingtalk message successfully');
    }
};