/*
title: '嗷呜动漫', author: '小可乐/v6.1.1'
说明：可以不写ext，也可以写ext，ext支持的参数和格式参数如下
"ext": {
    "host": "xxxx", //站点网址
    "timeout": 6000  //请求超时，单位毫秒
}
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '嗷呜动漫[漫]',
  lang: 'cat'
})
*/
import {Crypto} from 'assets://js/lib/cat.js';

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36';
const DefHeader = {'User-Agent': MOBILE_UA};
var HOST;
var KParams = {
    headers: {'User-Agent': MOBILE_UA},
    timeout: 5000
};

async function init(cfg) {
    try {
        HOST = (cfg.ext?.host?.trim() || 'https://www.aowu.tv').replace(/\/$/, '');
        KParams.headers['Referer'] = HOST;
        let parseTimeout = parseInt(cfg.ext?.timeout?.trim(), 10);
        KParams.timeout = parseTimeout > 0 ? parseTimeout : 5000;
    } catch (e) {
        console.error('初始化参数失败：', e.message);
    }
}

async function home(filter) {
    try {
        let kclassName = '新番$20&番剧$21&剧场$22';
        let classes = kclassName.split('&').map(item => {
            let [cName, cId] = item.split('$');
            return {type_name: cName, type_id: cId}; 
        });
        let filters = {};
        try {
            const nameObj = { class: 'class,剧情', year: 'year,年份', by: 'by,排序' };
            const flValues = { class: ['搞笑','恋爱','校园','后宫','治愈','日常','原创','战斗','百合','BL','卖肉','漫画改','游戏改','异世界','泡面番','轻小说改','OVA','OAD','京阿尼','芳文社','A-1Pictures','CloverWorks','J.C.STAFF','动画工房','SUNRISE','Production.I.G','MADHouse','BONES','P.A.WORKS','SHAFT','MAPPA','ufotable','TRIGGER','WITSTUDIO'], year: ['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010','2009','2008','2007','2006','2005','2004','2003','2002','2001','2000','1999','1998','1997','1996','1995','1994','1993','1992','1991','1990'], by: ['按最新,time', '按最热,hits', '按评分,score'] };
            for (let item of classes) {
                filters[item.type_id] = Object.entries(nameObj).map(([nObjk, nObjv]) => {
                    let [kkey, kname] = nObjv.split(',');
                    let fvalue = flValues[nObjk] || [];
                    if (item.type_id === '20' && nObjk === 'year') {fvalue = fvalue.slice(0, 2);}
                    let kvalue = fvalue.map(it => {
                        let [n, v] = [it, it];
                        if (nObjk === 'by') {[n, v] = it.split(',');}
                        return {n: n, v: v}; 
                    });
                    if (nObjk !== 'by') {kvalue.unshift({n: '全部', v: ''});}
                    return {key: kkey, name: kname, value: kvalue};
                }).filter(flt => flt.key && flt.value.length > 1);
            }
        } catch (e) {
            filters = {};
        }
        return JSON.stringify({class: classes, filters: filters});
    } catch (e) {
        console.error('获取分类失败：', e.message);
        return JSON.stringify({class: [], filters: {}});
    }
}

async function homeVod() {
    try {
        let homeUrl = HOST;
        let resHtml = await request(homeUrl);
        let VODS = getVodList(resHtml, true);
        return JSON.stringify({list: VODS});
    } catch (e) {
        console.error('推荐页获取失败：', e.message);
        return JSON.stringify({list: []});
    }
}

async function category(tid, pg, filter, extend) {
    try {
        pg = parseInt(pg, 10);
        pg = pg > 0 ? pg : 1;
        let cateBody = `type=${tid}&class=${extend?.class ?? ''}&year=${extend?.year ?? ''}&by=${extend?.by ?? ''}&page=${pg}`;
        let cateUrl = `${HOST}/index.php/ds_api/vod`;
        let resObj = safeParseJSON(await request(cateUrl, {
            headers: {...KParams.headers, 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'},
            method: 'POST',
            body: cateBody
        }));
        if (!resObj) {throw new Error('源码对象为空');}
        let VODS = [];
        let listArr = Array.isArray(resObj.list) ? resObj.list : [];
        for (let it of listArr) {
            let kname = it.vod_name || '名称';
            let kpic = it.vod_pic || '图片';
            let kremarks = `${it.vod_remarks || '状态'}|${it.vod_douban_score || '无评分'}`;
            let kyear = extend?.year || '';
            let kid = it.url ?? 'Id';
            VODS.push({
                vod_name: kname,
                vod_pic: kpic,
                vod_remarks: kremarks,
                vod_year: kyear,
                vod_id: `${kid}@${kname}@${kpic}@${kremarks}`
            });
        }
        let {pagecount=1000, limit=30, total=30000} = resObj;
        return JSON.stringify({list: VODS, page: pg, pagecount: pagecount, limit: 30, total: total});
    } catch (e) {
        console.error('类别页获取失败：', e.message);
        return JSON.stringify({list: [], page: 1, pagecount: 0, limit: 30, total: 0});
    }
}

async function search(wd, quick, pg) {
    try {
        pg = parseInt(pg, 10);
        pg = pg > 0 ? pg : 1;
        let searchUrl = `${HOST}/search/${wd}----------${pg}---.html`;        
        let resHtml = await request(searchUrl);
        let VODS = getVodList(resHtml);
        return JSON.stringify({list: VODS, page: pg, pagecount: 10, limit: 30, total: 300});
    } catch (e) {
        console.error('搜索页获取失败：', e.message);
        return JSON.stringify({list: [], page: 1, pagecount: 0, limit: 30, total: 0});
    }
}

function getVodList(khtml, rec = false) {
    try {
        if (!khtml) {throw new Error('源码为空');}  
        let kvods = [];
        let selector = rec ? '.public-list-box' : '.search-list';
        let listArr = pdfa(khtml, selector);
        for (let it of listArr) {
            let kname = cutStr(it, 'alt="', '"', '名称');
            let kpic = cutStr(it, 'data-src="', '"', '图片');
            let kremarks = rec ? `${cutStr(it, 'public-prt£>', '<', '类型')}|${cutStr(it, 'ft2">', '<', '状态')}` : cutStr(it, 'this-wap">', '</div>', '状态');
            let kid = cutStr(it, 'href="', '"', 'Id');
            kvods.push({
                vod_name: kname,
                vod_pic: kpic,
                vod_remarks: kremarks,
                vod_id: `${kid}@${kname}@${kpic}@${kremarks}`
            });
        }
        return kvods;
    } catch (e) {
        console.error(`生成视频列表失败：`, e.message);
        return [];
    }
}

async function detail(ids) {
    try {
        let [id, kname, kpic, kremarks] = ids.split('@');
        let detailUrl = !/^http/.test(id) ? `${HOST}${id}` : id;
        let resHtml = await request(detailUrl);
        if (!resHtml) {throw new Error('源码为空');}
        let intros = cutStr(resHtml, 'search-show', '</ul>', '', false);
        let ktabs = pdfa(resHtml, '.anthology-tab&&a').map((it,idx) => cutStr(it, '</i>', '<', `线路${idx+1}`));
        let kurls = pdfa(resHtml, '.anthology-list-play').map(item => { 
            return pdfa(item, 'a').map(it => { return `${cutStr(it, '>', '<', 'noEpi')}$${cutStr(it, 'href="', '"', 'noUrl')}` }).join('#');
        });
        let VOD = {
            vod_id: detailUrl,
            vod_name: kname,
            vod_pic: kpic,
            type_name: cutStr(intros, '类型：', '</li>', '类型'),
            vod_remarks: `${cutStr(intros, '状态：', '</li>', '状态')}|${cutStr(intros, '更新：', '</li>', '更新')}`,
            vod_year: cutStr(intros, '年份：', '</li>', '1000'),
            vod_area: cutStr(intros, '地区：', '</li>', '地区'),
            vod_lang: cutStr(intros, '语言：', '</li>', '语言'),
            vod_director: cutStr(intros, '导演：', '</li>', '').replace(/,$/, '') || '导演',
            vod_actor: cutStr(intros, '主演：', '</li>', '').replace(/,$/, '') || '主演',
            vod_content: cutStr(intros, '简介：', '</li>', '') || kname,
            vod_play_from: ktabs.join('$$$'),
            vod_play_url: kurls.join('$$$')
        };
        return JSON.stringify({list: [VOD]});
    } catch (e) {
        console.error('详情页获取失败：', e.message);
        return JSON.stringify({list: []});
    }
}

async function play(flag, ids, flags) {
    try {
        let playUrl = !/^http/.test(ids) ? `${HOST}${ids}` : ids;
        let kp = 0, kurl = '';
        let resHtml = await request(playUrl);
        let codeObj = safeParseJSON(cutStr(resHtml, 'var player_£=', '<', '', false));
        let jurl = codeObj?.url ?? '';
        jurl = safeUrlDecode(safeB64Decode(jurl));
        if (jurl) {
            jurl = `${HOST}/player/?url=${jurl}&next=`;
            resHtml = await request(jurl);
            let encryptedUrl = cutStr(resHtml, 'const encryptedUrl = "', '"', '');
            let sessionKey = cutStr(resHtml, 'const sessionKey = "', '"', '');
            kurl = urlAesDecrypt(encryptedUrl, sessionKey);
        }
        if (!/^http/.test(kurl)) {
            kurl = playUrl;
            kp = 1;
        }
        return JSON.stringify({jx: 0, parse: kp, url: kurl, header: DefHeader});
    } catch (e) {
        console.error('播放失败：', e.message);
        return JSON.stringify({jx: 0, parse: 0, url: '', header: {}});
    }
}

function urlAesDecrypt(ciphertext, key) {
    try {
        const rawData = Crypto.enc.Base64.parse(ciphertext);
        const keyWordArr = Crypto.enc.Utf8.parse(key);
        const ivWordArr = Crypto.lib.WordArray.create(rawData.words.slice(0, 4));
        const encrypted = Crypto.lib.WordArray.create(rawData.words.slice(4));
        const decrypted = Crypto.AES.decrypt( { ciphertext: encrypted }, keyWordArr,
            { 
                iv: ivWordArr, 
                mode: Crypto.mode.CBC, 
                padding: Crypto.pad.Pkcs7 
            }
        );
        return decrypted.toString(Crypto.enc.Utf8);
    } catch (e) {
        return '';
    }
}

function safeB64Decode(b64Str) {
    try {return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(b64Str));} catch (e) {return '';}
}

function safeUrlDecode(urlStr) {
    try {return decodeURIComponent(urlStr);} catch (e) {return '';}
}

function safeParseJSON(jStr) {
    try {return JSON.parse(jStr);} catch (e) {return null;}
}

function cutStr(str, prefix = '', suffix = '', defaultVal = 'cutFaile', clean = true, i = 1, all = false) {
    try {
        if (typeof str !== 'string' || !str) {throw new Error('被截取对象需为非空字符串');}
        const cleanStr = cs => String(cs).replace(/<[^>]*?>/g, ' ').replace(/(&nbsp;|\u00A0|\s)+/g, ' ').trim().replace(/\s+/g, ' ');
        const esc = s => String(s).replace(/[.*+?${}()|[\]\\/^]/g, '\\$&');
        let pre = esc(prefix).replace(/£/g, '[^]*?'), end = esc(suffix);
        let regex = new RegExp(`${pre ? pre : '^'}([^]*?)${end ? end : '$'}`, 'g');
        let matchIterator = str.matchAll(regex);
        if (all) {
            let matchArr = [...matchIterator];
            return matchArr.length ? matchArr.map(it => {
                const val = it[1] ?? defaultVal;
                return clean && val !== defaultVal ? cleanStr(val) : val;
            }) : [defaultVal];
        }
        i = parseInt(i, 10);
        if (isNaN(i) || i < 1) {throw new Error('序号必须为正整数');}
        let tgIdx = i - 1,matchIdx = 0;
        for (const match of matchIterator) {
            if (matchIdx++ === tgIdx) {
                const result = match[1] ?? defaultVal;
                return clean && result !== defaultVal ? cleanStr(result) : result;
            }
        }
        return defaultVal;
    } catch (e) {
        console.error(`字符串截取失败：`, e.message);
        return all ? ['cutErr'] : 'cutErr';
    }
}

async function request(reqUrl, options = {}) {
    try {
        if (typeof reqUrl !== 'string' || !reqUrl.trim()) { throw new Error('reqUrl需为字符串且非空'); }
        if (typeof options !== 'object' || Array.isArray(options) || options === null) { throw new Error('options类型需为非null对象'); }
        options.method = options.method?.toUpperCase() || 'GET';
        if (['GET', 'HEAD'].includes(options.method)) {
            delete options.body;
            delete options.data;
            delete options.postType;
        }
        let {headers, timeout, buffer, ...restOpts} = options;
        const optObj = {
            headers: (typeof headers === 'object' && !Array.isArray(headers) && headers) ? headers : KParams.headers,
            timeout: parseInt(timeout, 10) > 0 ? parseInt(timeout, 10) : KParams.timeout,
            buffer: buffer ?? 0,
            ...restOpts
        };
        const res = await req(reqUrl, optObj);
        if (options.withHeaders) {
            const resHeaders = typeof res.headers === 'object' && !Array.isArray(res.headers) && res.headers ? res.headers : {};
            const resWithHeaders = { ...resHeaders, body: res?.content ?? '' };
            return JSON.stringify(resWithHeaders);
        }
        return res?.content ?? '';
    } catch (e) {
        console.error(`${reqUrl}→请求失败：`, e.message);
        return options?.withHeaders ? JSON.stringify({ body: '' }) : '';
    }
}

export function __jsEvalReturn() {
    return {
        init,
        home,
        homeVod,
        category,
        search,
        detail,
        play,
        proxy: null
    };
}