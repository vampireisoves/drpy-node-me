import {getDailyNews, API_KEY} from "./news-util.mjs";

// 主函数
async function main() {
    // 检查API密钥
    if (API_KEY === 'YOUR_API_KEY') {
        console.log('请先获取天行数据API密钥并替换脚本中的YOUR_API_KEY');
        console.log('注册地址: https://www.tianapi.com/signup.html');
        return;
    }

    console.log('正在获取国内新闻...');
    const news = await getDailyNews();

    if (news.length === 0) {
        console.log('未获取到新闻数据');
        return;
    }

    // 输出新闻
    console.log('\n最新国内新闻:');
    news.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   ${item.description}`);
        console.log(`   来源: ${item.source} | 发布时间: ${item.ctime}`);
        console.log(`   链接: ${item.url}`);
    });
}

// 执行主函数
main();