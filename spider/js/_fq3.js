const {getIp} = await $.import('http://127.0.0.1:5757/public/ip.js');
const fs = require('fs');
const path = require('path');
const absolutePath = path.resolve('./');
console.log(absolutePath);
// const data = fs.readFileSync('./spider/js/_360.js', 'utf8');
const data = pathLib.readLib('./_360.js', 'utf8');
// console.log(data);
console.log(1111)
const {getPublicIp1, getPublicIp2} = require('../js/_lib.request.cjs');
console.log(2222)
const {XMLHttpRequest} = require("xmlhttprequest");
console.log('typeof getPublicIp1:', typeof getPublicIp1);
console.log('typeof getPublicIp2:', typeof getPublicIp2);
console.log('typeof runMain:', typeof runMain);
// runMain有弊端，参数类似错误调用会卡死，比如gzip传参了个数字
const a = await runMain(`
async function main(a){
return jsEncoder.gzip(a+'')
}
`, 123);
console.log('a:', a);


function test_rc4() {
    /*
    // 测试
    const key = '202205051426239465'; // 密钥
    const plaintext = 'Hello, RC4 encryption!'; // 原文

// 加密
    const encrypted = rc4Encrypt(key, plaintext);
    console.log('加密结果:', encrypted);

// 解密
    const decrypted = rc4Decrypt(key, encrypted);
    // const decrypted = rc4(key, encrypted);
    console.log('解密结果:', decrypted);
*/

    const encoded = rc4.encode('Hello, World!', 'my-secret-key');
    console.log('Encoded:', encoded);

    const decoded = rc4.decode(encoded, 'my-secret-key');
    console.log('Decoded:', decoded);

}

function test_ua() {
    let ua = randomUa.generateUa();
    log('ua:', ua);
    log(['1'] instanceof Array);
    let uas = randomUa.generateUa(10, {
        device: ['pc', '70^mobile'],
        pcOs: ['macos'],
        mobileOs: ['android', '90^ios'],
    });
    log(uas);
    log(typeof setTimeout);
    log(typeof setInterval);
    log(typeof require);
    log(typeof _fetch);
    log('XMLHttpRequest:', typeof XMLHttpRequest)
    const xhr = new XMLHttpRequest();
    log(xhr);
    let aa = simplecc("发财了去植发", "s2t"); // '發財了去植髮'
    let bb = simplecc("發財了去植髮", "t2s"); // '发财了去植发'
    log('aa:', aa)
    log('bb:', bb)
}

// 下面这个代码放哪儿都是可以后端持续执行任务，比如放class_parse里
// (async ()=>{
//     for (let i = 1; i <= 100; i++) {
//         console.log('模拟扫码检测，第' + i + '次');
//         await sleep(1000);
//     }
// })();

// 这个可以超时返回但无法结束任务
/*
for (let i = 1; i <= 100; i++) {
    console.log('模拟扫码检测，第' + i + '次');
    await sleep(1000);
}

 */

const rule = {
    类型: '小说',
    title: '番茄小说[书]',
    desc: '番茄小说纯js版本',
    host: 'https://fanqienovel.com/',
    homeUrl: 'https://fanqienovel.com/api/author/book/category_list/v0/',
    url: '/api/author/library/book_list/v0/?page_count=18&page_index=(fypage-1)&gender=-1&category_id=fyclass&creation_status=-1&word_count=-1&sort=0#fyfilter',
    class_parse: async function () {
        // let html = (await req('https://self-signed.badssl.com/')).content;
        // log(html);
        let a = `{"res_code": 0, "res_message": "成功","expireTime":0,"expireType":0,"fileListAO":{"count":1,"fileList":[],"fileListSize":0,"folderList":[{"createDate":"2024-10-04 15:13:39","filata":1,"fileListSize":0,"id":623111159176591217,"lastOpTime":"2025-01-14 10:43:18","name":"Season 1","parentId":624131159175862127,"rev":"20250114104318","starLabel":2}]},"lastRev":20250114232239}`;
        // log(a);
        // log(JSON.parse(a));
        // log(JSON.parse(a).fileListAO.folderList);
        // log(JsonBig.parse(a).fileListAO.folderList);
        log(DataBase);
        await database.startDb();
        // console.log('database:',database);
        await database.endDb();

        // let {cookie} = await reqCookie('https://www.03yy.live',{headers:{
        let {cookie} = await reqCookie('https://www.baidu.com', {
            headers: {
                'user-agent': PC_UA
            }
        });
        log('cookie:', cookie);
    },
    class_parse2: async function () {
        let {proxyUrl, getRule} = this;
        // let ip = await getPublicIp1();
        let ip = await getPublicIp2();
        log('ip:', ip);
        // test_ua();
        log('proxyUrl:', proxyUrl);
        log('type of getRule:', typeof getRule);
        // test_rc4()

        const sparkAI = new AIS.SparkAI({
            authKey: '12', // 替换为你的鉴权信息
            baseURL: 'https://spark-api-open.xf-yun.com',
        });

        try {
            const prompt = '你好，今天的天气怎么样？';
            const answer = await sparkAI.ask(prompt, {temperature: 0.7});
            console.log('AI 回复：', answer);
        } catch (error) {
            console.error('调用失败：', error.message);
        }

        /*
        const tx_rule = await getRule('腾云驾雾[官]');
        if (tx_rule) {
            log(tx_rule.url);
            log(tx_rule.title);
            // log(JSON.stringify(tx_rule));
            let data1 = await tx_rule.callRuleFn('搜索', ['斗罗大陆'])
            log(data1);
            let data2 = await tx_rule.callRuleFn('一级', ['tv'])
            log(data2);
        } else {
            log('没有这个原')
        }

         */

        /*
        (async ()=>{
            for (let i = 1; i <= 100; i++) {
                console.log('模拟扫码检测，第' + i + '次');
                await sleep(1000);
            }
        })();
         */

    },
    class_parse1: async () => {
        log('env:', ENV.get());
        log('ali_token:', ENV.get('ali_cookie'));
        log('Buffer:', typeof Buffer)
        log('URLSearchParams:', typeof URLSearchParams)
        log('axiosX', typeof axiosX);
        // log('ip:', await getIp());
        log(qs.stringify({a: 1, b: 2}))
        let ck = (await axios({url: 'http://www.baidu.com'})).headers['set-cookie']
        log(ck);
        // log(cookieToJson(ck));
        let ck_obj = COOKIE.parse(ck[0]);
        let ck_obj1 = COOKIE.parse(ck);
        log(ck_obj);
        log(ck_obj1);
        log(ck_obj.BAIDUID);
        log(COOKIE.serialize("name", 'echo', {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7, // 1 week
        }));
    },
    headers: {
        'User-Agent': 'PC_UA',
    },
    预处理: async () => {
    },
    一级: async function (tid, pg, filter, extend) {
    },
    二级: async function () {
        return '这是二级:' + rule.title
    },
    搜索: async function () {
        return '这是搜索:' + rule.title
    },
    lazy: async function () {
        return template.getMubans()
    },
};
