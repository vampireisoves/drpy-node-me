// js/_360.js
var rule = {
    title: '标题1',
    description: '这是描述',
    category: '视频',
    searchUrl: '11',
    class_parse: async () => {
        console.log('执行了分类获取')
        log(typeof atob)
        log(typeof btoa)
        return [
            {type_id: '1', type_name: '电影'},
            {type_id: '2', type_name: '电视剧'},
            {type_id: '3', type_name: '综艺'},
            {type_id: '4', type_name: '动漫'},
        ]
    },
    预处理: async () => {
        console.log('执行了预处理')
        rule.title = '360影视'
    },
    推荐: async () => {
        sleepSync(2000);
        console.log('进入了推荐')
        // return '这是推荐:' + rule.title
        return [
            {vod_name: '测试电影1', vod_pic: '1.png', vod_remarks: '测试描述1', vod_id: 'http://www.1.com'},
            {vod_name: '测试电影2', vod_pic: '2.png', vod_remarks: '测试描述2', vod_id: 'http://www.2.com'},
        ]
    },
    一级: async () => {
        // await sleep(200);
        sleepSync(200);
        let html = (await req('123')).content;
        console.log('title:', rule.title);
        console.log('html:', html);
        return html + '\n' + '这是一级:' + rule.title
    },
    二级: async () => {
        return '这是二级:' + rule.title
    },
    搜索: async () => {
        return ['这是搜索:' + rule.title]
    },
    lazy: async () => {
        return '这是播放:' + rule.title
    },
};
