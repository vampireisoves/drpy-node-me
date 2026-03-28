// js/_test.js
console.log('加载test...')
globalThis.check = ()=>{
    console.log('check...')
}
check1 = ()=>{
    console.log('check1...')
}
sleepSync(2000);
console.log('睡眠了200ms')
async function test1(){
    await sleep(200);
    console.log('test1睡眠完毕11')
}
console.log('test1定义完毕')
var rule = {
    title: '标题1',
    description: '这是描述',
    category: '视频',
    class_parse: async () => {
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
        check()
        check1()
        await test1()
        eval('console.log("这是测试eval打印日志")')
        rule.title = 'test影视'
    },
    推荐: async () => {
        sleepSync(2000);
        console.log('进入了推荐')
        console.log(`这是推荐:${rule.title}`);
        return [
            {vod_name: '测试电影1', vod_pic: '1.png', vod_remarks: '测试描述1', vod_id: 'http://www.1.com'},
            {vod_name: '测试电影2', vod_pic: '2.png', vod_remarks: '测试描述2', vod_id: 'http://www.2.com'},
        ]
    },
    一级: async function(tid, pg, filter, extend) {
        let {input,MY_URL} = this;
        console.log({tid,pg,filter,extend});
        console.log(`input:${input},MY_URL:${MY_URL}`);
        console.log(rule.host);
        console.log(rule.host.rstrip('/'));
        // log(typeof jsonpath)
        // log(jsonpath({path:'$.title',json:rule}))
        log(MOBILE_UA);
        log(jsonpath.query(rule,'$.title'));
        return `input:${input},MY_URL:${MY_URL},host:${rule.host.rstrip('/')}`
    },
    二级: async () => {
        return '这是二级:' + rule.title
    },
    搜索: async () => {
        return '这是搜索:' + rule.title
    },
    lazy: async () => {
        return '这是播放:' + rule.title
    },
};
