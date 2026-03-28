/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '河南电视',
  lang: 'cat'
})
*/

import "assets://js/lib/crypto-js.js";
// import "../catLib/crypto-js.js";

let _CFG = {};

let headers = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36';

function init(cfg) {
    console.log('getProxy(true):', getProxy(true));
    /*
     {
     "stype": 3,
     "skey": "catvod_河南电视代理",
     "sourceKey": "catvod_河南电视代理", // 这个宝盒没有
     "ext": ""
     */
    _CFG = cfg;
}

async function home(filter) {
    console.log('home...');
    console.log('_CFG:', _CFG);
    console.log('skey:', _CFG.skey);
    let classes = [];
    return JSON.stringify({
        'class': classes,
        'type_flag': '3-00-S'
    });
}

async function homeVod(params) {
    console.log('homeVod...');
    let videos = [{
        vod_id: JSON.stringify({
            actionId: '代理地址',
            id: 'proxy_url',
            type: 'input',
            title: '直接用的代理m3u链接',
            tip: '可复制的地址',
            value: getProxy(true) + '&sitekey=' + _CFG.skey + '&flag=live'
        }),
        vod_pic: 'clan://assets/tab.png?bgcolor=0',
        vod_name: '复制代理地址',
        vod_tag: 'action'
    }];

    return JSON.stringify({
        'list': videos
    });
}

async function proxy(params) {
    let resp_not_found = [404, 'text/plain', 'not found'];
    if (params.flag === 'live') {
        let m3u_text = await getStreamHN();
        let m3u_api = getProxy(true) + '&skey=' + _CFG.skey + '&flag=hn';
        let m3u_content = '河南电视频道,#genre#\n' + m3u_text.replaceAll('http://$api', m3u_api);
        return [200, 'text/plain', m3u_content]
    }
    if (params.flag === 'hn') {
        const {url} = params;
        if (!url) {
            return resp_not_found
        }
        let m3u8 = await req(url, {
            headers: {
                'User-Agent': headers
            }
        });
        return [200, 'text/plain', m3u8.content]
    }
    return resp_not_found
}

async function getStreamHN() {
    try {
        const t = Math.round(new Date() / 1000);
        const str = '6ca114a836ac7d73' + t;
        const sign = CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);

        const url = `https://pubmod.hntv.tv/program/getAuth/live/class/program/11`;
        let resp = await req(url, {
            headers: {
                'User-Agent': headers,
                'timestamp': t,
                'sign': sign
            }
        });
        // log('resp.content:', resp.content)
        let channelList = JSON.parse(resp.content).map(it => {
            return `${it.name},http://$api&url=${encodeURIComponent(it.video_streams[0])}`;
        });
        return channelList.join('\n');
    } catch (e) {
        console.log(e);
    }
}

async function action(action, value) {
    if (action === '代理地址') {
        return JSON.stringify({
            action: {
                actionId: '__copy__',
                content: JSON.parse(value).proxy_url
            },
            toast: '直播源已复制到剪贴板'
        });
    }
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: null,
        detail: null,
        proxy: proxy,
        play: null,
        search: null,
        action: action
    };
}