var rule = {
    title: '_qq测试源',
    description: '这是描述',
    category: '视频',
    host:'https://github.com/hjdhnx/drpy-node',
    headers: {
        'User-Agent': 'PC_UA',
    },
    hostJs:async function(){
        let {HOST} = this;
        log('HOST:',HOST);
        log('request:',typeof request);
        return 'https://www.baidu.com';
    },
    class_parse: async () => {
        // await CryptoJSW.MD5.loadWasm();
        const rstMD5 = CryptoJSW.MD5('message').toString();
        console.log('rstMD5:', rstMD5);
        console.log('执行了分类获取')
        return [
            {type_id: '1', type_name: '电影'},
            {type_id: '2', type_name: '电视剧'},
            {type_id: '3', type_name: '综艺'},
            {type_id: '4', type_name: '动漫'},
        ]
    },
    预处理: async () => {
        console.log('执行了预处理')
        rule.title = 'qq影视'
        local.set(rule.title, 'cookie', 'qwerxxxx')

    },
    推荐: async function (...args) {
        console.log('执行了推荐函数');
        log('rule.title',rule.title);
        // log(typeof (getProxyUrl));
        // log(getProxyUrl());
        let {getProxyUrl} = this;
        log(getProxyUrl());
        console.log(typeof (jsp))
        console.log(typeof (pdfh))
        console.log('pako:', typeof (pako))
        // let html = (await req('https://www.baidu.com/', {})).content
        let html = await request('https://www.baidu.com/')
        console.log(html)
        let cookie = await local.get(rule.title, 'cookie')
        console.log(cookie)
        console.log(base64Encode(cookie))
        let url = pdfh(html, 'script&&Html')
        console.log('url:', url)
        // console.log(template.getMubans())
        console.log(typeof template.getMubans)
        return [
            {
                vod_name: '测试电影1',
                vod_pic: '1.png',
                vod_remarks: '测试描述1',
                vod_id: getProxyUrl() + '&url=' + 'https://hls09.cntv.myhwcdn.cn/asp/hls/2000/0303000a/3/default/d9b0eaa065934f25abd193d391f731b6/2000.m3u8'
            },
            {vod_name: '测试电影2', vod_pic: '2.png', vod_remarks: '测试描述2', vod_id: 'http://www.2.com'},
        ]
    },
    一级: async (args) => {
        // await sleep(200);
        sleepSync(200);
        let html = await req('123');
        console.log('title:', rule.title);
        console.log('html:' + html);
        console.log(typeof (btoa));
        console.log(btoa('123456'));
        console.log(base64Encode('123456'));
        // console.log({tid, pg, filter, extend})
        console.log(args)
        return html + '\n' + '这是一级:' + rule.title
    },
    二级: async () => {
        return '这是二级:' + rule.title
    },
    搜索: async () => {
        return '这是搜索:' + rule.title
    },
    lazy: async () => {
        return template.getMubans()
    },
    proxy_rule: async function (params) {
        // log(this);
        let {input, MY_URL} = this;
        log(`params:`, params);
        log(`input:${input}`);
        log(`MY_URL:${MY_URL}`);
        // return [404, 'text/plain', 'Not Found']
        return [302, 'text/html', '', {location: input || 'http://www.baidu.com'}]
    }
};
