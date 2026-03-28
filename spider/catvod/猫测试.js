/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '猫测试',
  lang: 'cat'
})
*/

import {_, load} from "assets://js/lib/cat.js"; // 通用，CAT_DEBUG=0|1 都完美
// import {_, load} from "../catLib/cat.js"; // 这样写在CAT_DEBUG=0模式下不行，在CAT_DEBUG=1没问题

function init(cfg) {
    const ext = cfg.ext;
    console.log('init');
}

function qjs_test() {
    console.log('typeof getProxy:', typeof getProxy);
    if (typeof getProxy === 'function') {
        console.log('getProxy(true):', getProxy(true));
    }
    console.log(`猫依赖测试：typeof load: ${typeof load},typeof _: ${typeof _}`);
    const t1 = Date.now()
    let str = '';
    for (let i = 0; i < 1000_000; i++) {
        str += 'a';
    }
    const t2 = Date.now()
    console.log(`qjs字符串拼接测试耗时: ${Math.ceil(t2 - t1)} ms`);
}

function home(filter) {
    qjs_test();
    let classes = [];
    classes.push({
        'type_id': 'test',
        'type_name': '测试分类'
    });
    let res = {
        'class': classes
    };
    return JSON.stringify(res);
}

function homeVod(params) {
    console.log("homeVod");
    let d = [];
    d.push({
        vod_name: '测试',
        vod_id: 'index.html',
        vod_pic: 'https://gitee.com/CherishRx/imagewarehouse/raw/master/image/13096725fe56ce9cf643a0e4cd0c159c.gif',
        vod_remarks: '原始JS',
    });
    return JSON.stringify({
        list: d
    })
}

function category(tid, pg, filter, extend) {
    console.log(`category  pg: ${pg}`);
    if (pg > 1) {
        return JSON.stringify({list: []})
    }
    let d = [];
    d.push({
        vod_name: '测试',
        vod_id: 'index.html',
        vod_pic: 'https://gitee.com/CherishRx/imagewarehouse/raw/master/image/13096725fe56ce9cf643a0e4cd0c159c.gif',
        vod_remarks: '类型:' + tid,
    });
    return JSON.stringify({
        list: d
    })
}

function detail(vod_url) {
    console.log("detail");
    let vod = {
        // vod_id:id,
        vod_name: '测试二级',
        type_name: vod_url,
        vod_pic: 'https://gitee.com/CherishRx/imagewarehouse/raw/master/image/13096725fe56ce9cf643a0e4cd0c159c.gif',
        vod_content: '这是一个原始js的测试案例',
        vod_play_from: '测试线路1$$$测试线路2',
        vod_play_url: '选集播放1$1.mp4#选集播放2$2.mp4$$$选集播放3$3.mp4#选集播放4$4.mp4',
    };
    return JSON.stringify({
        list: [vod]
    })
}

function play(flag, id, flags) {
    console.log("play");
    return '{}'
}

function search(wd, quick) {
    console.log("search");
    let yzm_url = 'http://192.168.10.99:5705/static/img/yzm.png';
    console.log('测试验证码地址:', yzm_url);
    let img_base64 = req(yzm_url, {buffer: 2}).content;
    console.log(img_base64);
    const res = req('https://api.nn.ci/ocr/b64/text', {data: {img: img_base64}, method: 'POST'});
    console.log('验证码识别结果:', res.content);
    let d = [];
    d.push({
        vod_name: wd,
        vod_id: 'index.html',
        vod_pic: 'https://gitee.com/CherishRx/imagewarehouse/raw/master/image/13096725fe56ce9cf643a0e4cd0c159c.gif',
        vod_remarks: '测试搜索',
    });
    return JSON.stringify({
        list: d
    })
}

function proxy(params) {
    console.log("proxy:", params);
    console.log('getProxy(true):', getProxy(true));
    return [200, 'text/plain;charset=utf-8', 'hello drpyS, 我是猫测试的本地代理', null];
}

// 导出函数对象
export default {
    init: init,
    home: home,
    homeVod: homeVod,
    category: category,
    detail: detail,
    play: play,
    search: search,
    proxy: proxy,
}