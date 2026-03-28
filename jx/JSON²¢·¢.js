// http://localhost:5757/parse/JSON并发?url=https://v.qq.com/x/cover/mzc00200vkqr54u/v4100qp69zl.html

const {requestJson} = $.require('./_lib.request.js');
const {getRandomFromList, shuffleArray} = $.require('./_lib.random.js');
const jx = {
    type: 2,
    ext: {
        'flag': [
            "qiyi",
            "imgo",
            "爱奇艺",
            "奇艺",
            "qq",
            "qq 预告及花絮",
            "腾讯",
            "youku",
            "优酷",
            "pptv",
            "PPTV",
            "letv",
            "乐视",
            "leshi",
            "mgtv",
            "芒果",
            "sohu",
            "xigua",
            "fun",
            "风行"
        ]
    },
}

async function lazy(input, params) {
    log('input:', input);
    let jx_dict = getParsesDict(requestHost);
    // log(jx_dict);
    if (jx_dict.length > 0) {
        jx_dict = jx_dict.filter(it => it.type === 1);
    }
    // log(jx_dict);
    jx_dict = shuffleArray(jx_dict);
    // log(jx_dict);
    log(`待并发的json解析数量: ${jx_dict.length}`);
    let realUrls = [];
    const tasks = jx_dict.map((jxObj, index) => {
        let task_id = jxObj.url + input;
        return {
            func: async function parseTask({jxObj, task_id}) {
                let json = await requestJson(task_id);
                let url = pjfh(json, '$.url');
                if (!json.code || json.code === 200 || ![-1, 404, 403].includes(json.code)) {
                    if (url) {
                        let lastIndex = url.lastIndexOf('/');
                        let lastLength = url.slice(lastIndex + 1).length;
                        // log('lastLength:', lastLength);
                        if (lastLength > 10) {
                            // log(`code:${json.code} , url:${json.url}`);
                            return json
                        }
                    }
                    throw new Error(`${jxObj.name} 解析 ${input} 失败: ${JSON.stringify(json)}`);
                } else {
                    throw new Error(`${jxObj.name} 解析 ${input} 失败`);
                }
            },
            param: {jxObj, task_id},
            id: task_id
        }
    });
    const listener = {
        func: (param, id, error, result) => {
            if (error) {
                // console.error(`Task ${id} failed with error: ${error.message}`);
            } else if (result) {
                // log(`Task ${id} succeeded with result: `, result);
                realUrls.push({original: id, ...result});
            }
            // 中断逻辑示例
            if (param.stopOnFirst && result && result.url) {
                return 'break';
            }
        },
        param: {stopOnFirst: true},
    }
    // await batchExecute(tasks, listener, 3);
    // log(realUrls);
    // return getRandomFromList(realUrls);

    // realUrls = await batchExecute(tasks, listener, 1); //可以这样用，不过无法对结果进行篡改
    await batchExecute(tasks, listener, 1);
    return realUrls[0]
}
