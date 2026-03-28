import {getNowKzz} from "./kzz-util.mjs";

/**
 * 主函数 - 测试用
 */
async function main() {
    try {
        // 支持正负偏移量测试
        const testCases = [
            {offset: 0, desc: "今天"},
            {offset: 1, desc: "明天"},
            {offset: -1, desc: "昨天"},
            {offset: 7, desc: "7天后"},
            {offset: -7, desc: "7天前"}
        ];

        for (const testCase of testCases) {
            console.log(`\n===== 测试 ${testCase.desc} (偏移量: ${testCase.offset}) =====`);
            const kzzData = await getNowKzz(
                `test_${testCase.offset}`,
                'http://data.eastmoney.com/kzz/',
                testCase.offset
            );

            if (kzzData.length > 0) {
                console.log(`找到 ${kzzData.length} 个可转债:`);
                kzzData.forEach((item, index) => {
                    console.log(`${index + 1}. ${item.name} (${item.code}) - ${item.date}`);
                });
            } else {
                console.log(`未找到 ${testCase.desc} 的可转债数据`);
            }
        }

        console.log('\n所有测试完成');
    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

// 使用立即执行的异步函数调用main
(async () => {
    try {
        // await main();
        const kzzData = await getNowKzz(
            `test_7`,
            'http://data.eastmoney.com/kzz/',
            7
        );
        console.log(kzzData);
        console.log('程序执行完成');
    } catch (error) {
        console.error('程序执行失败:', error.message);
        process.exit(1);
    }
})();