/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: '喜刷刷',
  lang: 'cat'
})
*/

async function init(cfg) {
}

async function home(filter, param) {
    let classes = [
        {
            type_id: 'shua',
            type_name: '测试示例',
            type_flag: '0-00-S'
        },
    ];

    return {class: classes};
}

async function homeVod(params) {
    return null;
}

async function category(tid, pg, filter, extend) {
    if (pg > 1) return null;

    const videos = [
        {
            vod_id: '美颜怪$美颜怪',
            vod_name: '美颜怪',
            vod_pic: 'https://vcg05.cfp.cn/creative/vcg/nowarter800/new/VCG41N910289498.jpg'
        },
        {
            vod_id: '短视频$https://v.api.aa1.cn/api/api-vs/index.php',
            vod_name: '短视频',
            vod_pic: 'https://vcg05.cfp.cn/creative/vcg/nowarter800/new/VCG41N910289498.jpg'
        },
        {
            vod_id: '酷音视频$https://api.suyanw.cn/api/kysp.php',
            vod_name: '酷音视频',
            vod_pic: ' https://vcg05.cfp.cn/creative/vcg/nowarter800/new/VCG41N910289498.jpg'
        },
        {
            vod_id: '刷刷刷1$http://xjj2.716888.xyz/fenlei/mvmn/mvmn.php',
            vod_name: '刷刷刷1',
            vod_pic: 'clan://assets/collect.png?bg=1'
        },
        {
            vod_id: '刷刷刷2$https://www.hhlqilongzhu.cn/api/MP4_xiaojiejie.php',
            vod_name: '刷刷刷2',
            vod_pic: 'clan://assets/collect.png?bg=2'
        },
        {
            vod_id: '刷刷刷3$http://api.cc1990.cc/api/video/ks_xjj',
            vod_name: '刷刷刷3',
            vod_pic: 'clan://assets/collect.png?bg=3'
        },
        {
            vod_id: '刷刷刷4$http://av.npcq.cn/pc.php',
            vod_name: '刷刷刷4',
            vod_pic: 'clan://assets/collect.png?bg=4'
        },
        {
            vod_id: '刷刷刷5$https://av.npcq.cn/api.php?action=next_video',
            vod_name: '刷刷刷5',
            vod_pic: 'clan://assets/collect.png?bg=5'
        },
    ];

    return {list: videos};
}

async function detail(tid) {
    const vod = {
        vod_id: tid,
        vod_name: tid.split('\$')[0],
        vod_play_from: "测试",
        vod_play_url: tid,
        vod_tag: '[SHUA]'
    };

    return {list: [vod]};
}

async function play(flag, id, flags) {
    if (id == '美颜怪') {
        return await 美颜怪();
    }

    let url = id;
    let title = '';
    let res = req(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36',
        },
        redirect: 0
    });

    if (res.headers.location) {
        id = res.headers.location;
    } else {
        try {
            const d = JSON.parse(res.content);
            url = d.url ? d.url : d.video_url ? d.video_url : url;
            title = d.title ? d.title : '';
        } catch (e) {
        }
    }
    return {
        parse: 0,
        url: url,
        header: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36'
        },
        shuaTitle: title,
        errorPlayNext: true
    };
}

async function 美颜怪() {

    let pg = getRnd(1, 30000);

    const res = await req('http://81.70.181.238/hot_video/getList', {
        method: 'POST',
        body: `page=${pg}&limit=1&sign=${getSign(pg)}&device_id=ffffffff-ca78-c55b-ca78-c55b00000000&auth_code=NotLogin&pro_id=2`,
        postType: 'form'
    });

    const d = JSON.parse(res.content);

    return {
        parse: 0,
        url: d.data.list[0].src,
        errorPlayNext: true
    };
}

function getSign(pg) {
    let txt = "limit=30&page=" + pg + "&key=f6113acb6573d8b98502335e06f0c857";
    let sign = md5X(txt).toUpperCase();
    return sign;
}

/* 生成指定范围的随机数（最小数，最大数，进制数, 是否大写）*/
function getRnd(min, max, hexNum, isUpper) {
    var r = parseInt(Math.random() * (max - min + 1) + min, 10);
    if (hexNum) {
        if (isUpper)
            r = r.toString(hexNum).toUpperCase();
        else
            r = r.toString(hexNum);
    }
    return r;
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
    };
}