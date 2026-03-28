// _debug.js
// 测试方法: http://localhost:5757/api/_debug?pwd=dzyyds
var rule = {
    title: '_debug',
    description: '这是描述',
    类型: '测试',
    searchUrl: '',
    class_parse: async () => {
        log(`[${rule.title}] --class_parse--`);
        return [
            {type_id: '1', type_name: '电影'},
            {type_id: '2', type_name: '电视剧'},
            {type_id: '3', type_name: '综艺'},
            {type_id: '4', type_name: '动漫'},
        ]
    },
    预处理: async () => {
        log(`[${rule.title}] --预处理--`);
        rule.title = '_debug';
    },
    推荐: async () => {
        // return '这是推荐:' + rule.title;
        let d = [];
        let html = '{}';
        html = await request('https://httpbin.org/headers', {
            headers: {
                'Accept': '*/*',
                'User-Agent': ''
            }
        });
        // log(html);
        d.push({
            title: 'request结果1-传空UA',
            content: html.parseX.headers,
        });

        html = await request('https://httpbin.org/headers', {
            headers: {
                'Accept': '*/*',
                'User-Agent': 'RemoveUserAgent',
            }
        });
        // log(html);
        d.push({
            title: 'request结果2-不传UA',
            content: html.parseX.headers,
        });

        html = (await req('https://httpbin.org/headers', {
            headers: {
                'Accept': '*/*',
                'User-Agent': 'RemoveUserAgent',
            }
        })).content;
        d.push({
            title: 'req结果-不传UA',
            content: html.parseX.headers,
        });

        html = (await req('https://conn.origjoy.com/auth/init?appid=d4eeacc6cec3434fbc8c41608a3056a0&mac=0afa691314fd_a12d4a7c9n12&sn=a12d4a7c9n12&time=1768728113&ver=2.0&vn=4.1.3.03281430&sign=6a1ee16242b93a3ae6492bc55992b691',
            {
                headers: {
                    'Accept': '*/*',
                    'User-Agent': 'RemoveUserAgent',
                }
            })).content;
        d.push({
            title: 'req结果-60wmv',
            content: html,
        });
        return d;
    },
    一级: async () => {
        return '这是一级:' + rule.title
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