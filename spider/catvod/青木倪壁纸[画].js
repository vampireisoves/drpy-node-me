/* 青木倪壁纸
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '青木倪壁纸',
  lang: 'cat'
})
*/

let siteKey = "", siteType = "", sourceKey = "", ext = "";
const limit = 50;

async function request(data) {
    const resp = await req('https://www.6qmn.com/index.php/joe/api', {
        method: 'POST',
        body: data,
        headers: {
            'Referer': 'https://www.6qmn.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
            'content-type': 'application/x-www-form-urlencoded'
        }
    });
    return resp.content;
}

function init(cfg) {
    siteKey = cfg.skey;
    siteType = cfg.stype;
    sourceKey = cfg.sourceKey;
    ext = cfg.ext;
}

async function home(filter) {
    const res = await request({
        routeType: 'wallpaper_type'
    });

    const data = JSON.parse(res).data;
    let classes = [];
    for (const item of data) {
        classes.push({
            'type_id': item.name + '$' + item.id,
            'type_name': item.name,
            'type_flag': '0-0-16T9'
        });
    }
    return JSON.stringify({
        'class': classes,
        'type_flag': '0-0-16T9'
    });
}

function homeVod(params) {
    return category('4K专区$36', 1);
}

async function category(tid, pg, filter, extend) {
    const page = pg || 1;
    console.log('tid:' + tid + ', pg:' + pg + ', filter:' + filter + ', extend:' + JSON.stringify(extend));

    const videos = [];

    const ajax_data = {
        routeType: 'wallpaper_list',
        cid: tid.split('$')[1],
        start: (page - 1) * limit,
        count: limit
    };
    const res = await request(ajax_data);

    const json = JSON.parse(res);
    const total = parseInt(json.total);
    const pagecount = Math.ceil(total / limit);
    let index = (page - 1) * limit;
    for (const v of json.data) {
        const video = {
            'vod_id': tid + '|' + total + '$' + pagecount + '$' + page + '|' + v.utag + '|' + v.url,
            'vod_name': v.utag,
            'vod_pic': v.url,
            'vod_remarks': '' + page
        };
        videos.push(video);
        index++;
    }

    return JSON.stringify({
        'page': pg,
        'pagecount': pagecount,
        'limit': limit,
        'total': total,
        'list': videos,
        'type_des': ''
    });
}

function detail(id) {
    const info = id.split('|');
    const total = parseInt(info[1].split('$')[0]);
    const pagecount = parseInt(info[1].split('$')[1]);
    const page = parseInt(info[1].split('$')[2]);
    const cid = info[0].split('$')[1];
    let vod = {
        'vod_id': id,
        'vod_name': info[0].split('$')[0],
        'vod_pic': info[3],
        'type_name': '壁纸',
        'vod_content': info[0].split('$')[0] + '，共 ' + total + ' 张壁纸，每页 ' + limit + ' 张，共 ' + pagecount + ' 页',
        'vod_play_from': '青木倪',
        'vod_play_url': ''
    };
    const urls = ['0$' + info[2] + '@' + info[3]];
    for (let i = 1; i <= pagecount; i++) {
        urls.push(i + '$' + cid + '-' + i);
    }
    vod['vod_play_url'] = urls.join("#");
    // console.log(JSON.stringify({'list':[vod]}));
    return JSON.stringify({
        'list': [vod]
    });
}

async function play(flag, id, flags) {
    let info = id.split('-');
    if (info.length == 1) {
        return {
            parse: 0,
            url: 'pics://' + id.replace('@', '$').split('$').slice(-1)[0],
        }
    }

    const page = parseInt(info[1]);
    const ajax_data = {
        routeType: 'wallpaper_list',
        cid: info[0],
        start: (page - 1) * limit,
        count: limit
    };
    const res = await request(ajax_data);
    // console.log(res);

    const json = JSON.parse(res);
    let content = [];
    for (const v of json.data) {
        // content.push(v.utag + '$' + v.url);
        content.push(v.url);
    }
    return {
        parse: 0,
        url: 'pics://' + content.join('&&'),
    }
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
        proxy: null,
        search: null,
        extResult: null,
    };
}