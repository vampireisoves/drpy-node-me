import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

// 获取当前模块路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const outputFile = args.find(arg => !arg.startsWith('-')) || 'moontv-ds.json';
    const prettyPrint = args.includes('--pretty') || args.includes('-p');

    return {
        outputFile,
        prettyPrint
    };
}

function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch (error) {
        console.error(`解析URL失败: ${url}`, error.message);
        return url.split('/').slice(0, 3).join('/');
    }
}

async function convertMoonTV() {
    try {
        // 读取JSON文件
        const filePath = path.join(__dirname, 'moontv.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(data);

        // 提取并转换数据
        const result = Object.values(jsonData.api_site).map(item => {
            // 优先使用detail，否则从api提取域名
            // const url = item.detail || extractDomain(item.api);
            const url = extractDomain(item.api);

            return {
                name: item.name,
                url,
                parse_url: "",
                cate_exclude: ""
            };
        });

        return result;
    } catch (error) {
        throw new Error(`转换失败: ${error.message}`);
    }
}

async function main(outputFile, prettyPrint) {
    console.log('开始处理月亮影视的源格式为采王可用格式');

    try {
        const convertedData = await convertMoonTV();

        // 格式化输出
        const jsonString = prettyPrint
            ? JSON.stringify(convertedData, null, 2)
            : JSON.stringify(convertedData);

        // 输出转换结果
        console.log('转换结果:');
        console.log(jsonString);

        // 保存到文件
        const outputPath = path.join(__dirname, outputFile);
        await fs.writeFile(outputPath, jsonString);
        console.log(`结果已保存至: ${outputPath}`);

        return convertedData;
    } catch (error) {
        console.error('处理过程中出错:', error.message);
        process.exit(1);
    }
}

// 使用立即执行的异步函数调用main
(async () => {
    try {
        const {outputFile, prettyPrint} = parseArgs();

        console.log(`输出文件: ${outputFile}`);
        console.log(`美化输出: ${prettyPrint ? '是' : '否'}`);

        await main(outputFile, prettyPrint);
        console.log('处理完成');
    } catch (error) {
        console.error('程序执行失败:', error.message);
        process.exit(1);
    }
})();