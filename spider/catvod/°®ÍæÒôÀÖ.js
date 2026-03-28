/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '爱玩音乐',
  lang: 'cat'
})
*/

const root = 'http://www.22a5.com';
let quality = 'flac';

let siteKey = "", siteType = "", sourceKey = "", ext = "";
const cates = {};
const phb = [
    {name: 'TOP榜单', id: 'top'},
    {name: '通勤路上榜', id: 'tqltop'},
    {name: '网络红歌榜', id: 'hot'},
    {name: '网络最新榜', id: 'new'},
    {name: 'DJ舞曲大全', id: 'djwuqu'},
    {name: '音乐热评榜', id: 'share'},
    {name: '音乐先锋榜', id: 'ndtop'},
    {name: '爱听电音榜', id: 'hktop'},
    {name: '车载歌曲榜', id: 'cztop'},
    {name: '英国排行榜', id: 'ygtop'},
    {name: '韩国排行榜', id: 'krtop'},
    {name: '日本排行榜', id: 'jptop'},
    {name: '快手热歌榜', id: 'kuaishou'},
    {name: '抖音热歌榜', id: 'douyin'},
    {name: '酷我原创榜', id: 'kwyc'},
    {name: 'ACG新歌榜', id: 'newacg'},
    {name: '酷我飙升榜', id: 'kuwo'},
    {name: '电音热歌榜', id: 'dytop'},
    {name: '综艺新歌榜', id: 'newzy'},
    {name: '说唱先锋榜', id: 'sctop'},
    {name: '影视金曲榜', id: 'ystop'},
    {name: '粤语金曲榜', id: 'yytop'},
    {name: '欧美金曲榜', id: 'ustop'},
    {name: '80后热歌榜', id: 'blhot'},
    {name: '网红新歌榜', id: 'wlhot'},
    {name: '古风音乐榜', id: 'gfhot'},
    {name: '夏日畅爽榜', id: 'xrtop'},
    {name: '会员喜爱榜', id: 'vip'},
    {name: '跑步健身榜', id: 'jstop'},
    {name: '宝宝哄睡榜', id: 'bbtop'},
    {name: '睡前放松榜', id: 'sqtop'},
    {name: '熬夜修仙榜', id: 'aytop'},
    {name: 'Vlog必备榜', id: 'vlogtop'},
    {name: 'KTV点唱榜', id: 'ktvtop'}
];

function init(cfg) {
    siteKey = cfg.skey;
    siteType = cfg.stype;
    sourceKey = cfg.sourceKey;
    ext = cfg.ext;
    if (/128k|320k|flac|flac24bit/.test(ext)) {
        quality = ext;
    }
}

async function home(filter) {
    const classes = [];

    classes.push({
        'type_name': '歌单',
        'type_id': '1',
        'type_flag': '2-0-S'
    });

    classes.push({
        'type_name': '歌手',
        'type_id': '2',
        'type_flag': '2-0-S'
    });

    classes.push({
        'type_name': '榜单',
        'type_id': '3',
        'type_flag': '1-0'
    });

    return JSON.stringify({
        'class': classes,
        'filters': filters,
        'type_flag': '2-0-S'
    });
}

async function homeVod(params) {
    return null;
    // return await category('1', 1, false, {type:'douyin'});
}

async function category(tid, pg, filter, extend) {
    const videos = [];

    const page = pg || 1;
    console.log('tid: ' + tid + ', page: ' + page + ', extend:' + JSON.stringify(extend));

    if (tid == '1') {
        const type = extend && extend.type ? extend.type : 'index';
        const url = root + '/playtype/' + type + '/' + page + '.html';
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });
        const html = res.content.split('<div class="video_list">')[1].match(/<ul([\s\S]+?)<\/ul>/)[1];
        const data = html.match(/<li>[\s\S]+?<\/li>/gi);
        if (data) {
            for (const item of data) {
                videos.push({
                    vod_id: tid + "|" + item.match(/href="\/playlist\/(.+?)\.html"/)[1],
                    vod_name: item.match(/title="(.+?)"/)[1],
                    vod_pic: item.match(/src="(.+?)"/)[1].replace(/^.+&url=/g, ''),
                    vod_remarks: ''
                });
            }
        } else {
            console.log('data is null');
        }
    } else if (tid == '2') {
        const cate = extend && extend.cate ? extend.cate : 'index';
        const sex = extend && extend.sex ? extend.sex : 'index';
        const type = extend && extend.type ? extend.type : 'index';
        const letter = extend && extend.letter ? extend.letter : 'index';
        const url = root + `/singerlist/${cate}/${sex}/${type}/${letter}/${page}.html`;
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });
        const html = res.content.split('<div class="singer_list">')[1].match(/<ul>([\s\S]+?)<\/ul>/)[1];
        const data = html.match(/<li>[\s\S]+?<\/li>/gi);
        for (const item of data) {
            videos.push({
                vod_id: tid + "|" + item.match(/href="\/singer\/(.+?)\.html"/)[1],
                vod_name: item.match(/title="(.+?)"/)[1],
                vod_pic: item.match(/src="(.+?)"/)[1].replace(/^.+&url=/g, ''),
                vod_remarks: '',
                vod_tag: 'folder-2-0-S'
            });
        }
    } else if (tid.indexOf('|') > 0) {
        const url = root + `/singer/album/${tid.split('|')[1]}/${page}.html`;
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });

        if (page == 1) {
            const pic = res.content.match(/<div class="pic">[\s\S]+?src="(.+?)"/)[1];
            videos.push({
                vod_id: '2|' + tid.split('|')[1],
                vod_name: '[ 最新歌曲 ]',
                vod_pic: pic,
                vod_remarks: ''
            });
            videos.push({
                vod_id: '3|' + tid.split('|')[1],
                vod_name: '[ 最新视频 ]',
                vod_pic: pic + '&1',
                vod_remarks: ''
            });
        }

        const html = res.content.split('<div class="video_list">')[1].match(/<ul>([\s\S]+?)<\/ul>/)[1];
        for (const item of html.match(/<li>[\s\S]+?<\/li>/gi)) {
            videos.push({
                vod_id: "4|" + item.match(/href="\/album\/(.+?)\.html"/)[1],
                vod_name: item.match(/title="(.+?)"/)[1],
                vod_pic: item.match(/src="(.+?)"/)[1].replace(/^.+&url=/g, ''),
                vod_remarks: '专辑'
            });
        }
    } else if (tid == '3') {
        for (const item of phb) {
            videos.push({
                vod_id: '5|' + item.name + '$' + item.id,
                vod_name: item.name,
                vod_pic: '',
                vod_remarks: ''
            });
        }
        return JSON.stringify({
            'page': 1,
            'pagecount': 1,
            'limit': videos.length,
            'total': 1,
            'list': videos,
            'type_des': ''
        });
    }

    console.log(JSON.stringify(videos));

    return JSON.stringify({
        'page': page,
        'pagecount': page + 1,
        'limit': videos.length,
        'total': videos.length * (page + 1),
        'list': videos,
        'type_des': ''
    });
}

async function detail(id) {
    const ids = id.split("|");

    let vod = {};
    if (ids[0] == '1') {
        const page = ids.length > 2 ? parseInt(ids[2]) : 1;
        const url = root + '/playlist/' + ids[1] + '/' + page + '.html';
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });
        const html = res.content.match(/<div class="main">([\s\S]+?)<div class="page">/)[1];

        vod = {
            vod_id: id,
            vod_name: html.match(/<h1>(.+?)<\/h1>/)[1],
            vod_pic: html.match(/src="(.+?)"/)[1].replace(/^.+&url=/g, ''),
            type_name: '歌单',
            vod_remarks: '',
            vod_content: html.match(/<div class="pagedata">(.+?)<\/div>/)[1] + "。" + html.match(/<div class="info">(.+?)<\/div>/)[1],
            vod_play_from: '爱玩音乐[ 歌单 ]',
            vod_play_url: ''
        };

        const urls = [];
        for (const item of html.match(/<li>[\s\S]+?<\/li>/gi)) {
            const pId = item.match(/href="\/mp3\/(.+?)\.html"/)[1];
            const pName = item.match(/<a .+?>(.+?)<\/a>/)[1].replace(/[$|#]/g, '');
            urls.push(pName + '$' + pName + '|' + pId);
        }
        if (res.content.indexOf('下一页') > 0) {
            urls.push('>>> [ 加载更多 ] <<<$mpush://detail://' + sourceKey + '/' + ids[0] + '|' + ids[1] + '|' + (page + 1));
        }
        vod.vod_play_url = urls.join('#');
    } else if (ids[0] == '2') {
        const page = ids.length > 2 ? parseInt(ids[2]) : 1;
        const url = root + '/singer/' + ids[1] + '/' + page + '.html';
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });
        const html = res.content.match(/<div class="main">([\s\S]+?)<div class="page">/)[1];

        vod = {
            vod_id: id,
            vod_name: html.match(/<h1>(.+?)<\/h1>/)[1],
            vod_pic: html.match(/src="(.+?)"/)[1].replace(/^.+&url=/g, ''),
            type_name: '最新歌曲',
            vod_remarks: '',
            vod_content: html.match(/<div class="info">([\s\S]+?)<\/div>/)[1],
            vod_play_from: '爱玩音乐[ 最新歌曲 ]',
            vod_play_url: ''
        };

        const urls = [];
        for (const item of html.match(/<ul>([\s\S]+?)<\/ul>/)[1].match(/<li>[\s\S]+?<\/li>/g)) {
            const pId = item.match(/href="\/mp3\/(.+?)\.html"/)[1];
            const pName = item.match(/<a .+?>(.+?)<\/a>/)[1].replace(/[$|#]/g, '');
            urls.push(pName + '$' + pName + '|' + pId);
        }
        if (res.content.indexOf('下一页') > 0) {
            urls.push('>>> [ 加载更多 ] <<<$mpush://detail://' + sourceKey + '/' + ids[0] + '|' + ids[1] + '|' + (page + 1));
        }
        vod.vod_play_url = urls.join('#');
    } else if (ids[0] == '3') {
        const page = ids.length > 2 ? parseInt(ids[2]) : 1;
        const url = root + '/singer/video/' + ids[1] + '/' + page + '.html';
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });
        const html = res.content.match(/<div class="main">([\s\S]+?)<div class="page">/)[1];

        vod = {
            vod_id: id,
            vod_name: html.match(/<h1>(.+?)<\/h1>/)[1],
            vod_pic: html.match(/src="(.+?)"/)[1].replace(/^.+&url=/g, ''),
            type_name: '最新视频',
            vod_remarks: '',
            vod_content: html.match(/<div class="info">([\s\S]+?)<\/div>/)[1],
            vod_play_from: '爱玩音乐[ 最新视频 ]',
            vod_play_url: ''
        };

        const urls = [];
        for (const item of html.match(/<ul>([\s\S]+?)<\/ul>/)[1].match(/<li>[\s\S]+?<\/li>/g)) {
            const pId = item.match(/href="\/mp4\/(.+?)\.html"/)[1];
            const pName = item.match(/title="(.+?)"/)[1].replace(/[$|#]/g, '');
            urls.push(pName + '$' + 'mp4|' + pId);
        }
        if (res.content.indexOf('下一页') > 0) {
            urls.push('>>> [ 加载更多 ] <<<$mpush://detail://' + sourceKey + '/' + ids[0] + '|' + ids[1] + '|' + (page + 1));
        }
        vod.vod_play_url = urls.join('#');
    } else if (ids[0] == '4') {
        const page = ids.length > 2 ? parseInt(ids[2]) : 1;
        const url = root + '/album/' + ids[1] + '/' + page + '.html';
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });
        const html = res.content.match(/<div class="main">([\s\S]+?)<div class="page">/)[1];

        vod = {
            vod_id: id,
            vod_name: html.match(/<h1>(.+?)<\/h1>/)[1],
            vod_pic: html.match(/src="(.+?)"/)[1].replace(/^.+&url=/g, ''),
            type_name: '专辑',
            vod_remarks: '专辑',
            vod_content: html.match(/<div class="pagedata">(.+?)<\/div>/s)[1] + "。" + html.match(/<div class="info">(.+?)<\/div>/s)[1],
            vod_play_from: '爱玩音乐[ 专辑 ]',
            vod_play_url: ''
        };

        const urls = [];
        for (const item of html.match(/<li>[\s\S]+?<\/li>/gi)) {
            const pId = item.match(/href="\/mp3\/(.+?)\.html"/)[1];
            const pName = item.match(/<a .+?>(.+?)<\/a>/)[1].replace(/[$|#]/g, '');
            urls.push(pName + '$' + pName + '|' + pId);
        }
        if (res.content.indexOf('下一页') > 0) {
            urls.push('>>> [ 加载更多 ] <<<$mpush://detail://' + sourceKey + '/' + ids[0] + '|' + ids[1] + '|' + (page + 1));
        }
        vod.vod_play_url = urls.join('#');
    } else if (ids[0] == '5') {
        const arr = ids[1].split('$');
        const page = ids.length > 2 ? parseInt(ids[2]) : 1;
        const url = root + '/list/' + arr[1] + '/' + page + '.html';
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });
        const html = res.content.match(/<div class="play_list">([\s\S]+?)<div class="page">/)[1];

        vod = {
            vod_id: id,
            vod_name: arr[0],
            vod_pic: '',
            type_name: '榜单',
            vod_remarks: '',
            vod_content: html.match(/<div class="pagedata">(.+?)<\/div>/)[1] + "。" + html.match(/<h1>(.+?)<\/h1>/)[1],
            vod_play_from: '爱玩音乐[ 榜单 ]',
            vod_play_url: ''
        };

        const urls = [];
        for (const item of html.match(/<li>[\s\S]+?<\/li>/gi)) {
            const pId = item.match(/href="\/mp3\/(.+?)\.html"/)[1];
            const pName = item.match(/<a .+?>(.+?)<\/a>/)[1].replace(/[$|#]/g, '');
            urls.push(pName + '$' + pName + '|' + pId);
        }
        if (res.content.indexOf('下一页') > 0) {
            urls.push('>>> [ 加载更多 ] <<<$mpush://detail://' + sourceKey + '/' + ids[0] + '|' + ids[1] + '|' + (page + 1));
        }
        vod.vod_play_url = urls.join('#');
    } else if (ids[0] == '6') {
        const arr = ids[1].split('$');
        const page = ids.length > 2 ? parseInt(ids[2]) : 1;
        const url = root + '/list/' + arr[1] + '/' + page + '.html';
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });
        const html = res.content.match(/<div class="play_list">([\s\S]+?)<div class="page">/)[1];

        vod = {
            vod_id: id,
            vod_name: arr[0],
            vod_pic: '',
            type_name: '榜单',
            vod_remarks: '',
            vod_content: html.match(/<div class="pagedata">(.+?)<\/div>/)[1] + "。" + html.match(/<h1>(.+?)<\/h1>/)[1],
            vod_play_from: '爱玩音乐[ 榜单 ]',
            vod_play_url: ''
        };

        const urls = [];
        for (const item of html.match(/<li>[\s\S]+?<\/li>/gi)) {
            const pId = item.match(/href="\/mp3\/(.+?)\.html"/)[1];
            const pName = item.match(/<a .+?>(.+?)<\/a>/)[1].replace(/[$|#]/g, '');
            urls.push(pName + '$' + pName + '|' + pId);
        }
        if (res.content.indexOf('下一页') > 0) {
            urls.push('>>> [ 加载更多 ] <<<$mpush://detail://' + sourceKey + '/' + ids[0] + '|' + ids[1] + '|' + (page + 1));
        }
        vod.vod_play_url = urls.join('#');
    } else if (ids[0] == '7') {
        const page = ids.length > 2 ? parseInt(ids[2]) : 1;
        const url = root + '/so/' + ids[1] + '/' + page + '.html';
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });
        const html = res.content.match(/<div class="main">([\s\S]+?)<div class="page">/)[1];

        vod = {
            vod_id: id,
            vod_name: html.match(/<h1>(.+?)<\/h1>/)[1],
            vod_pic: '',
            type_name: '搜索',
            vod_remarks: '',
            vod_content: html.match(/<div class="pagedata">(.+?)<\/div>/)[1],
            vod_play_from: '爱玩音乐[ 搜索 ]',
            vod_play_url: ''
        };

        const urls = [];
        for (const item of html.match(/<li>[\s\S]+?<\/li>/gi)) {
            const pId = item.match(/href="\/mp3\/(.+?)\.html"/)[1];
            const pName = item.match(/<a .+?>(.+?)<\/a>/)[1].replace(/[$|#]/g, '');
            urls.push(pName + '$' + pName + '|' + pId);
        }
        if (res.content.indexOf('下一页') > 0) {
            urls.push('>>> [ 加载更多 ] <<<$mpush://detail://' + sourceKey + '/' + ids[0] + '|' + ids[1] + '|' + (page + 1));
        }
        vod.vod_play_url = urls.join('#');
    }

    return JSON.stringify({
        'list': [vod]
    });
}

async function play(flag, id, flags) {
    const arr = id.split('|');
    const name = arr[0];
    id = arr[1];

    if (name == 'mp4') {
        const url = root + '/mp4/' + id + '.html';
        const res = await req(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            }
        });

        const data = strExtract(res.content, '(?m)quality:(\\[.*?\\]),', 1).replace(/'/g, '"').replace(/type:/g, '"type":').replace(/name:/g, '"name":').replace(/url:/g, '"url":');
        console.log(JSON.parse(data));
        const urls = [];
        for (const item of JSON.parse(data)) {
            urls.push(item.name, root + item.url);
        }

        return JSON.stringify({
            parse: 0,
            url: urls,
            header: {
                'Referer': url
            }
        });
    }

    const url = root + '/js/play.php';
    const res = await req(url, {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': root + '/mp3/' + id + '.html'
        },
        data: {
            id: id,
            type: 'music'
        },
        postType: 'form'
    });
    const data = JSON.parse(res.content);

    let song_url = data.url;
    const lrcUrl = root + '/plug/down.php?ac=music&lk=lrc&id=' + id;
    const lrcRes = await req(lrcUrl, {method: 'GET'});
    let lrc = lrcRes.content.replaceAll(/\[.+?\].+?www.22a5.com\r?\n/g, '');

    return JSON.stringify({
        parse: 0,
        url: song_url,
        subs: [
            {
                'format': 'application/x-subrip',
                'name': name + '.srt',
                'data': lrcToSrt(lrc),
                // 'data': lrc,
                'selected': true
            }
        ]

    });
}

async function search(wd, quick) {
    const videos = [];
    videos.push({
        vod_id: '7|' + wd,
        vod_name: wd,
        vod_pic: '',
        vod_remarks: ''
    });

    return JSON.stringify({
        'page': 1,
        'pagecount': 1,
        'limit': videos.length,
        'total': videos.length,
        'list': videos,
        'type_des': ''
    });
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
        search: search
    };
}

const filters = {
    '1': [
        {
            key: 'type', name: '主题', value: [
                {n: '全部歌单', v: 'index'},
                {n: 'DJ', v: 'dj'},
                {n: '抖音', v: 'douyin'},
                {n: '经典', v: 'jingdian'},
                {n: 'BGM', v: 'bgm'},
                {n: '古风', v: 'gufeng'},
                {n: '喊麦', v: 'hanmai'},
                {n: '游戏', v: 'youxi'},
                {n: '轻音乐', v: 'qingyinle'},
                {n: '怀旧', v: 'huaijiu'},
                {n: '佛乐', v: 'fule'},
                {n: '合唱', v: 'hechang'},
                {n: '网络', v: 'wangluo'},
                {n: '儿童', v: 'ertong'},
                {n: 'ACG', v: 'acg'},
                {n: '影视', v: 'yingshi'},
                {n: '网红', v: 'wanghong'},
                {n: '3D', v: '3d'},
                {n: '纯音乐', v: 'chunyinle'},
                {n: 'KTV', v: 'ktv'},
                {n: '乐器', v: 'leqi'},
                {n: '翻唱', v: 'fanchang'},
                {n: '店铺专用', v: 'dianpu'}
            ]
        },
        {
            key: 'type', name: '心情', value: [
                {n: '伤感', v: 'shanggan'},
                {n: '放松', v: 'fangsong'},
                {n: '励志', v: 'lizhi'},
                {n: '开心', v: 'kaixin'},
                {n: '甜蜜', v: 'tianmi'},
                {n: '兴奋', v: 'xingfen'},
                {n: '安静', v: 'anjing'},
                {n: '治愈', v: 'zhiyu'},
                {n: '寂寞', v: 'jimo'},
                {n: '思恋', v: 'silian'}
            ]
        },
        {
            key: 'type', name: '场景', value: [
                {n: '开车', v: 'kaiche'},
                {n: '运动', v: 'yundong'},
                {n: '睡前', v: 'shuiqian'},
                {n: '跳舞', v: 'tiaowu'},
                {n: '清晨', v: 'qingchen'},
                {n: '夜店', v: 'yedian'},
                {n: '校园', v: 'xiaoyuan'},
                {n: '咖啡店', v: 'kafeidian'},
                {n: '旅行', v: 'lvxing'},
                {n: '工作', v: 'gongzuo'},
                {n: '广场舞', v: 'guangchangwu'}
            ]
        },
        {
            key: 'type', name: '年代', value: [
                {n: '70后', v: '70h'},
                {n: '80后', v: '80h'},
                {n: '90后', v: '90h'},
                {n: '00后', v: '00h'},
                {n: '10后', v: '10h'}
            ]
        },
        {
            key: 'type', name: '曲风', value: [
                {n: '流行', v: 'liuxing'},
                {n: '电子', v: 'dianzi'},
                {n: '摇滚', v: 'yaogun'},
                {n: '民歌', v: 'minge'},
                {n: '民谣', v: 'minyao'},
                {n: '古典', v: 'gudian'},
                {n: '嘻哈', v: 'xiha'},
                {n: '乡村', v: 'xiangcun'},
                {n: '爵士', v: 'jueshi'},
                {n: 'R&B', v: 'rb'}
            ]
        },
        {
            key: 'type', name: '语言', value: [
                {n: '华语', v: 'huayu'},
                {n: '欧美', v: 'oumei'},
                {n: '韩语', v: 'hanyu'},
                {n: '粤语', v: 'yueyu'},
                {n: '日语', v: 'riyu'},
                {n: '小语种', v: 'xiaoyuzhong'}
            ]
        }
    ],
    "2": [
        {
            key: 'cate', name: '歌手分类', value: [
                {n: '全部', v: 'index'},
                {n: '华语歌手', v: 'huayu'},
                {n: '欧美歌手', v: 'oumei'},
                {n: '韩国歌手', v: 'hanguo'},
                {n: '日本歌手', v: 'ribrn'},
            ]
        },
        {
            key: 'sex', name: '性别类型', value: [
                {n: '全部', v: 'index'},
                {n: '男', v: 'male'},
                {n: '女', v: 'girl'},
                {n: '乐队组合', v: 'band'},
            ]
        },
        {
            key: 'type', name: '歌手类型', value: [
                {n: '全部', v: 'index'},
                {n: '流行', v: 'liuxing'},
                {n: '电子', v: 'dianzi'},
                {n: '摇滚', v: 'yaogun'},
                {n: '嘻哈', v: 'xiha'},
                {n: 'R&B', v: 'rb'},
                {n: '民谣', v: 'minyao'},
                {n: '爵士', v: 'jueshi'},
                {n: '古典', v: 'gudian'},
                {n: '拉丁', v: 'lading'},
                {n: '轻音乐', v: 'qingyinle'},
                {n: '乡村', v: 'xiangcun'},
                {n: '蓝调', v: 'landiao'},
            ]
        },
        {
            key: 'letter', name: '字母排序', value: [
                {n: '全部', v: 'index'},
                {n: 'A', v: 'a'},
                {n: 'B', v: 'b'},
                {n: 'C', v: 'c'},
                {n: 'D', v: 'd'},
                {n: 'E', v: 'e'},
                {n: 'F', v: 'f'},
                {n: 'G', v: 'g'},
                {n: 'H', v: 'h'},
                {n: 'I', v: 'i'},
                {n: 'J', v: 'j'},
                {n: 'K', v: 'k'},
                {n: 'L', v: 'l'},
                {n: 'M', v: 'm'},
                {n: 'N', v: 'n'},
                {n: 'O', v: 'o'},
                {n: 'P', v: 'p'},
                {n: 'Q', v: 'q'},
                {n: 'R', v: 'r'},
                {n: 'S', v: 's'},
                {n: 'T', v: 't'},
                {n: 'U', v: 'u'},
                {n: 'V', v: 'v'},
                {n: 'W', v: 'w'},
                {n: 'X', v: 'x'},
                {n: 'Y', v: 'y'},
                {n: 'Z', v: 'z'},
            ]
        }
    ]
};