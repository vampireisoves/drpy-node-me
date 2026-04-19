/*
@header({
    key: "ktv60w",
    title: "六十万曲库",
    author: "phototake",
    logo: "assets://ktvlogo.jpg",
    playerType: 2,
    searchable: 0,
    lang:'cat',
    quickSearch: 0,
    ext: "music.db",
    more: {
        sourceTag: "KTV,曲库",
        errorPlayNext: true
    },
    comment: "需要自行寻找music.db数据库放置到tvbox下。"
})
*/
// 这个源没法播放，js的req请求老是返回500
// md5函数猫没有内置的，用md5X
let storageName = 'mtv60w';

function saveCache(k, v) {
    return local.set(storageName, k, v)
}

function clearCache(k) {
    return local.delete(storageName, k);
}

function getCacheOrDefault(k, v) {
    return local.get(storageName, k) || v;
}

// 数据库下载：https://ali.pri.mcdn.cherryonline.cn/muse.portal.ott_soocar2.full.260107.db.gz?Expires=1768369295&OSSAccessKeyId=LTAI5t9qmsDcuABHeMjS7VaA&Signature=Z4pEtpuFnp7BGBfOVfW3w01po9A%3D
import {Crypto} from 'assets://js/lib/cat.js';

let dbName = './data/mv/music.db';  // 数据库路径
let songWordNums = "";
const pageSize = 200; // 每页显示记录数
let songDb = null;

async function dbQuery(dbName, query) {
    if (!songDb) {
        songDb = new DataBase(dbName);
    }
    await songDb.startDb();
    const db = songDb.db;
    let data = await db.all(query);
    await songDb.endDb();
    return data
}

let classes = [];

async function init(ext) {
    // if (ext && ext.indexOf(".db") > 0) {
    //     //dbName = ext;
    // }

    /*let createTableSQL = "CREATE TABLE IF NOT EXISTS singer_collect (" +
        "id TEXT PRIMARY KEY, " +
        "val TEXT NOT NULL, " +
        "ts INTEGER);";
    dbExecSql1(dbName, createTableSQL);
    
    createTableSQL = "CREATE TABLE IF NOT EXISTS song_collect (" +
        "id TEXT PRIMARY KEY, " +
        "val TEXT NOT NULL, " +
        "ts INTEGER);";
    dbExecSql1(dbName, createTableSQL);
    */
    let query = "SELECT distinct name_len FROM songs WHERE name_len > 0 order by name_len";
    let d = await dbQuery(dbName, query)
    songWordNums = d.map(it => `${it.name_len} 字:=${it.name_len}`).join(',');
    console.log(songWordNums);
}

async function home(filter) {
    classes = [];
    classes.push({
        type_id: JSON.stringify({type: 'singer', id: 'singer'}),
        type_name: '歌手',
        type_flag: '[CFS][CFPY][CFS:男:=A男,女:=A女,组合:=A组合,中国:=B中国,大陆:=B大陆,港台:=B港台,外国:=B外国]1'
    }, {
        type_id: JSON.stringify({type: 'song', id: 'song', name: '曲库', lname: '曲库'}),
        type_name: '曲库',
        type_flag: '[CFS][CFPY]' + (songWordNums == '' ? '' : '[CFS:' + songWordNums + ']') + '1-00'
    }, {
        type_id: JSON.stringify({type: 'playlists', id: 'playlists', name: '歌单', lname: '歌单'}),
        type_name: '歌单',
        type_flag: '[CFS][CFPY]1-11'
    });

    return JSON.stringify({
        'class': classes,
        'filters': null,
        'type_flag': '3-0-S',
        'invalid': false,
    });
}

async function homeVod(params) {
    let videos = [];
    let position = 0;
    classes.forEach(it => {
        videos.push({
            vod_id: 'tab:' + position,
            vod_name: it.type_name,
            vod_pic: 'clan://assets/tab.png?bgcolor=' + (position),
            // vod_pic: 'clan://tu.zip/default/' + (position + 10) + '.png?bgcolor=' + (position + 12),
        });
        position++;
    });

    return JSON.stringify({
        'list': videos,
    });
}

async function category(tid, pg, filter, extend) {
    pg = pg || 1;
    extend = extend || {};

    const pageIndex = pg - 1;
    const offset = pageIndex * pageSize; // 计算当前页的偏移量
    const cid = JSON.parse(tid);

    let videos = [];
    let query = '';
    let data = [];
    let cnt = 0;
    if (cid.type == 'singer') {
        let customFilter = '1';
        let wd = '';
        if (extend.selection) {
            wd = extend.selection.trim();
            const fix = wd.substring(0, 1);
            const val = wd.substring(1);
            if (fix == 'A') {
                customFilter = "type='" + val + "'";
            } else if (fix == 'B') {
                customFilter = "area='" + val + "'";
            } else {
                customFilter = "tags_str like '%" + wd + "%'";
            }
        } else if (extend.custom) {
            wd = extend.custom.trim();
            customFilter = "singers.name_trim like '%" + wd + "%'";
        } else if (extend.custom_pinyin) {
            wd = extend.custom_pinyin.trim();
            customFilter = "singers.name_cap like '%" + wd + "%'";
        }
        query = "SELECT id,name_trim as name, tags_str as tags"
            + " FROM singers"
            + " WHERE " + customFilter
            + " ORDER BY hot_score DESC"
            + " LIMIT " + pageSize + " OFFSET " + offset;
        console.log(query);
        data = await dbQuery(dbName, query)
        console.log(JSON.stringify(data));
        data.forEach(it => {
            videos.push({
                vod_id: 'singer#' + it.name + '#' + it.id,
                vod_name: it.name,
                vod_pic: 'clan://assets/ktvlogo.jpg',
                vod_remarks: it.tags == '' ? '' : JSON.parse(it.tags).join(' '),
            });
        });
    } else if (cid.type == 'song') {
        let customFilter = '1';
        let wd = '';
        if (extend.selection) {
            wd = extend.selection.trim();
            customFilter = "(name_len=" + wd + ")";
        } else if (extend.custom) {
            wd = extend.custom || extend.selection;
            customFilter = "(name_trim like '%" + wd + "%')";
        } else if (extend.custom_pinyin) {
            wd = extend.custom_pinyin.trim();
            customFilter = "(name_cap like '%" + wd + "%')";
        }
        query = "SELECT tid,name_trim as name,hot_score FROM songs"
            + " WHERE " + customFilter
            + " ORDER BY hot_score DESC"
            + " LIMIT " + pageSize + " OFFSET " + offset;
        console.warn(query);
        data = await dbQuery(dbName, query)
        data.forEach(it => {
            videos.push({
                vod_id: it.tid + '#' + it.name,
                vod_name: it.name,
                vod_pic: 'clan://assets/ktvlogo.jpg',
                vod_remarks: it.hot_score < 10000 ? it.hot_score + '' : (it.hot_score / 10000).toFixed(1) + '万',
            });
        });
        if (videos.length > 1 && pg == 1) {
            query = "SELECT COUNT(*) as num FROM songs WHERE " + customFilter;
            const d = await dbQuery(dbName, query)
            videos.unshift({
                vod_id: JSON.stringify({
                    type: 'song_page',
                    id: cid.id,
                    name: cid.name + (wd == '' ? '' : '-' + wd),
                    lname: cid.lname + (wd == '' ? '' : '-' + wd),
                    filter: customFilter
                }),
                vod_name: cid.name + (wd == '' ? '' : '-' + wd) + ' [分页]',
                vod_pic: 'clan://assets/collect.png',
                vod_remarks: d[0].num + '首 ' + Math.floor((d[0].num - 1) / pageSize + 1) + '页',
                vod_tag: 'folder',
                vod_style: '1',
            });
        }
    } else if (cid.type == 'song_page') {
        if (pg == 1) {
            query = "SELECT COUNT(*) as num FROM songs WHERE " + cid.filter;
            data = await dbQuery(dbName, query)
            if (data.length > 0) {
                for (let i = 0; i < data[0].num; i += pageSize) {
                    const pageNo = i / pageSize + 1;
                    const name = cid.lname + (data[0].num > pageSize ? ' (第' + pageNo + '页)' : '');
                    videos.push({
                        vod_id: 'multi_song#' + name + '#' + i + '#' + cid.filter,
                        vod_name: '第 ' + pageNo + ' 页',
                        vod_pic: 'clan://assets/collect.png',
                        vod_remarks: (i + 1) + '~' + (data[0].num > pageNo * pageSize ? i + pageSize : data[0].num)
                    });
                }
            }
        }
    } else if (cid.type == 'playlists') {
        let customFilter = '1';
        let wd = '';
        if (extend.custom) {
            wd = extend.custom || extend.selection;
            customFilter = "(name like '%" + wd + "%')";
        } else if (extend.custom_pinyin) {
            wd = extend.custom_pinyin.trim();
            customFilter = "(name_cap like '%" + wd + "%')";
        }
        query = "SELECT id,name,hot_score FROM playlists"
            + " WHERE " + customFilter
            + " ORDER BY hot_score DESC"
            + " LIMIT " + pageSize + " OFFSET " + offset;
        console.warn(query);
        data = await dbQuery(dbName, query)
        data.forEach(it => {
            videos.push({
                vod_id: 'playlists#' + it.name + '#' + it.id,
                vod_name: it.name,
                vod_pic: 'clan://assets/collect.png',
                vod_remarks: it.hot_score < 10000 ? it.hot_score + '' : (it.hot_score / 10000).toFixed(1) + '万',
            });
        });
    }

    return JSON.stringify({
        'list': videos,
    });
}

async function detail(id) {
    const urls = [];

    const ids = id.split('#');

    let _stype = ids[0];
    let _sname = ids[1];
    let _sid = ids.length > 2 ? ids[2] : '';
    let _vname = '';
    let _content = '';

    let query = '';
    let data = [];
    switch (_stype) {
        case 'singer':
            _vname = '歌手';
            query = "SELECT songs.tid,songs.name_trim as name,songs.hot_score,'" + _sname + "' as singer_names"
                + " FROM song_singer_relations as relations left join songs on relations.song_id=songs.id"
                + " WHERE relations.singer_id='" + _sid + "'"
                + " ORDER BY songs.hot_score DESC";
            console.log(query);
            break;
        case 'multi_song':
            _vname = '合集';
            // query = "SELECT name, singer_names, number, format, edition FROM song WHERE " + ids[3] + " ORDER BY temperature DESC, acronym COLLATE NOCASE LIMIT " + pageSize + " OFFSET " + ids[2];
            query = "SELECT tid,name_trim as name,hot_score FROM songs"
                + " WHERE " + ids[3]
                + " ORDER BY hot_score DESC"
                + " LIMIT " + pageSize + " OFFSET " + ids[2];
            console.log(query);
            break;
        case 'playlists':
            _vname = '歌单';
            query = "SELECT filename as tid,song_name as name FROM playlist_songs"
                + " WHERE playlist_id='" + _sid + "'"
                + " ORDER BY sort_no";
            console.log(query);
            break;
        default:
            _vname = '单曲';
            _content = ids[2];
            urls.push(_sname + '$' + _stype);
            break;
    }

    if (urls.length == 0) {
        data = await dbQuery(dbName, query)
        data.forEach(it => {
            urls.push((it.singer_names ? it.singer_names + '-' : '') + it.name + '$' + it.tid);
        });
    }

    let vod = {
        vod_id: id,
        vod_name: `${_vname}: ${_sname}`,
        vod_pic: 'clan://assets/ktvlogo.jpg',
        vod_play_from: 'mv60w',
        vod_play_url: urls.join('#'),
        vod_content: _content
    };

    return JSON.stringify({
        'list': [vod]
    });

}

async function search(wd, quick) {
    return null;
}

async function action(action, value) {
    return '';
}

let host = 'https://conn.origjoy.com';


async function play(flag, vid, flags) {
    try {
        vid = vid.match(/([0-9]+)/)[1];
        let sn = 'a12d4a7c9n12';
        let appId = 'd4eeacc6cec3434fbc8c41608a3056a0';
        let headers = {'User-Agent': 'RemoveUserAgent', 'Accept': '*/*'};

        let token = getCacheOrDefault('mtv60w_token', null);
        console.warn('缓存的token:', token);

        let cacheTime = getCacheOrDefault('mtv60w_time', '0');
        let mac = getCacheOrDefault('mtv60w_mac', null);
        if (!token || !mac || Date.now() - cacheTime > 600000) {
            cacheTime = '' + Date.now();
            saveCache('mtv60w_time', cacheTime);

            mac = '0' + md5X(cacheTime).substring(0, 11);
            saveCache('mtv60w_mac', mac);

            let timestamp = Math.floor(Date.now() / 1000).toString();
            let authParams = await thunderSign({
                'appid': appId,
                'mac': `${mac}_${sn}`,
                'sn': sn,
                'time': timestamp,
                'ver': '2.0',
                'vn': '4.1.3.03281430',
            }, '024210cba40d4385a93e6c2d3249bfb5');
            let authQuery = new URLSearchParams(authParams).toString();
            let authRes = await req(`${host}/auth/init?${authQuery}`, {method: 'get', timeout: 5000, headers: headers});

            console.log('authRes:\n', authRes);
            try {
                let authData = JSON.parse(authRes.content);
                token = authData.token;
                if (token) {
                    saveCache('mtv60w_token', token);
                    console.warn('新的token:', token, '\nmac:', mac, '\ntime:', cacheTime);
                }
            } catch (ee) {
                clearCache('mtv60w_token');
                clearCache('mtv60w_time');
                clearCache('mtv60w_mac');
                console.error(ee);
            }
        }
        let timestamp2 = Math.floor(Date.now() / 1000).toString();
        let playParams = await thunderSign({
            'appid': appId,
            'device': `${mac}_${sn}`,
            'ish265': '0',
            'ls': '1',
            'musicno': vid,
            'resolution': '720',
            'sn': sn,
            'time': timestamp2,
            'token': token
        }, '19042303a8374f67ae3fe1e25c97936f');
        let playQuery = new URLSearchParams(playParams).toString();
        let playRes = await req(`${host}/music/downurl?${playQuery}`, {method: 'get', timeout: 5000, headers: headers});
        console.log('playRes:\n', playRes);
        try {
            let playData = JSON.parse(playRes.content);
            return {
                parse: 0,
                url: playData.data,
                header: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
                },
                playerType: 1
            };
        } catch (ee) {
            clearCache('mtv60w_token');
            clearCache('mtv60w_time');
            clearCache('mtv60w_mac');
            console.error(ee);
        }
    } catch (e) {
        console.error(e);
    }
    return {
        parse: 0,
        errMsg: '获取链接发生错误'
    };
}

async function thunderSign(params, sdkKey) {
    let sortedKeys = Object.keys(params).sort();
    let baseString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    let sign = Crypto.MD5(baseString + sdkKey).toString();
    return {...params, sign: sign};
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
        search: search,
        extResult: null,
        action: action
    };
}