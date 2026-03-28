// 已测试可用方案，只不过启动时需要加参数 --experimental-loader ./utils/esm-loader.mjs
// esm-loader.mjs
export async function load(url, context, nextLoad) {
    // 先让 Node.js 正常加载模块
    const result = await nextLoad(url, context);

    // 仅处理目标模块（根据 URL 识别）
    if (url.includes('/spider/catvod')) {
        console.log(`自定义加载esm模块: ${url}`);
        // console.log(result);
        let code = result.source.toString();

        // 替换 import 路径
        code = code.replaceAll('assets://js/lib/', '../catLib/');
        result.source = code;
        return result;
        // return {
        //     format: 'module',
        //     responseURL: result.responseURL,
        //     source: code,
        //     shortCircuit: true,
        // };
    }

    return result;
}