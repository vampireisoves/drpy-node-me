/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '旺旺影视',
  类型: '影视',
  lang: 'ds'
})
*/

var rule = {
    title: '旺旺影视',
    类型: '影视',
    host: 'https://vip.wwgz.cn:5200',
    homeUrl: '/',
    url: '/vod-list-id-fyclass-pg-fypage-order--by-time-class-0-year-0-letter--area--lang-.html',
    searchUrl: '/index.php?m=vod-search&wd=**',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    timeout: 10000,
    play_parse: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://vip.wwgz.cn:5200/'
    },
    class_name: '电影&连续剧&综艺&动漫&短剧&音乐',
    class_url: '1&2&3&4&26&31',
    filter: {
        '1': [
            {"key":"cateId","name":"类型","value":[{"n":"全部","v":"1"},{"n":"动作片","v":"5"},{"n":"喜剧片","v":"6"},{"n":"爱情片","v":"7"},{"n":"科幻片","v":"8"},{"n":"恐怖片","v":"9"},{"n":"剧情片","v":"10"},{"n":"战争片","v":"11"},{"n":"惊悚片","v":"16"},{"n":"奇幻片","v":"17"}]},
            {"key":"area","name":"地区","value":[{"n":"全部","v":""},{"n":"大陆","v":"大陆"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},{"n":"美国","v":"美国"},{"n":"韩国","v":"韩国"},{"n":"日本","v":"日本"},{"n":"泰国","v":"泰国"},{"n":"新加坡","v":"新加坡"},{"n":"马来西亚","v":"马来西亚"},{"n":"印度","v":"印度"},{"n":"英国","v":"英国"},{"n":"法国","v":"法国"},{"n":"加拿大","v":"加拿大"},{"n":"西班牙","v":"西班牙"},{"n":"俄罗斯","v":"俄罗斯"},{"n":"其它","v":"其它"}]},
            {"key":"year","name":"年份","value":[{"n":"全部","v":"0"},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"}]},
            {"key":"by","name":"排序","value":[{"n":"时间","v":"time"},{"n":"人气","v":"hits"},{"n":"评分","v":"score"}]}
        ],
        '2': [
            {"key":"cateId","name":"类型","value":[{"n":"全部","v":"2"},{"n":"国产剧","v":"12"},{"n":"港台剧","v":"13"},{"n":"日韩剧","v":"14"},{"n":"欧美剧","v":"15"}]},
            {"key":"area","name":"地区","value":[{"n":"全部","v":""},{"n":"大陆","v":"大陆"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},{"n":"美国","v":"美国"},{"n":"韩国","v":"韩国"},{"n":"日本","v":"日本"},{"n":"泰国","v":"泰国"},{"n":"英国","v":"英国"}]},
            {"key":"year","name":"年份","value":[{"n":"全部","v":"0"},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"}]},
            {"key":"by","name":"排序","value":[{"n":"时间","v":"time"},{"n":"人气","v":"hits"},{"n":"评分","v":"score"}]}
        ],
        '3': [
            {"key":"cateId","name":"类型","value":[{"n":"全部","v":"3"},{"n":"内地综艺","v":"23"},{"n":"港台综艺","v":"24"},{"n":"日韩综艺","v":"25"},{"n":"欧美综艺","v":"22"}]},
            {"key":"year","name":"年份","value":[{"n":"全部","v":"0"},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"}]},
            {"key":"by","name":"排序","value":[{"n":"时间","v":"time"},{"n":"人气","v":"hits"},{"n":"评分","v":"score"}]}
        ],
        '4': [
            {"key":"cateId","name":"类型","value":[{"n":"全部","v":"4"},{"n":"国产动漫","v":"18"},{"n":"日韩动漫","v":"19"},{"n":"欧美动漫","v":"21"}]},
            {"key":"year","name":"年份","value":[{"n":"全部","v":"0"},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"}]},
            {"key":"by","name":"排序","value":[{"n":"时间","v":"time"},{"n":"人气","v":"hits"},{"n":"评分","v":"score"}]}
        ],
        '26': [
            {"key":"year","name":"年份","value":[{"n":"全部","v":"0"},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"}]},
            {"key":"by","name":"排序","value":[{"n":"时间","v":"time"},{"n":"人气","v":"hits"},{"n":"评分","v":"score"}]}
        ],
        '31': [
            {"key":"year","name":"年份","value":[{"n":"全部","v":"0"},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"}]},
            {"key":"by","name":"排序","value":[{"n":"时间","v":"time"},{"n":"人气","v":"hits"},{"n":"评分","v":"score"}]}
        ]
    },
    filter_url: '{{fl.cateId||fyclass}}-pg-fypage-order--by-{{fl.by||"time"}}-class-0-year-{{fl.year||0}}-letter--area-{{fl.area||""}}-lang-.html',
    推荐: async function () {
        const { input, pdfa, pdfh } = this;
        const html = await request(input);
        const d = [];
        pdfa(html, '.mod .globalPicList li').forEach(it => {
            d.push({
                title: pdfh(it, '.sTit&&Text'),
                pic_url: pdfh(it, 'img&&data-src') || pdfh(it, 'img&&src'),
                desc: pdfh(it, '.sBottom span&&Text') || pdfh(it, '.sDes&&Text'),
                url: pdfh(it, 'a&&href')
            });
        });
        return setResult(d);
    },
    一级: async function (tid, pg, filter, extend) {
        const { pdfa, pdfh } = this;
        let fl = extend || {};
        let cateId = fl.cateId || tid;
        let by = fl.by || 'time';
        let year = fl.year || 0;
        let area = fl.area || '';
        let url = `${rule.host}/vod-list-id-${cateId}-pg-${pg}-order--by-${by}-class-0-year-${year}-letter--area-${encodeURIComponent(area)}-lang-.html`;
        const html = await request(url);
        const d = [];
        pdfa(html, '.mod-bd .globalPicList li').forEach(it => {
            d.push({
                title: pdfh(it, '.sTit&&Text'),
                pic_url: pdfh(it, 'img&&data-src') || pdfh(it, 'img&&src'),
                desc: pdfh(it, '.sBottom span&&Text') || pdfh(it, '.sDes&&Text'),
                url: pdfh(it, 'a&&href')
            });
        });
        return setResult(d);
    },
    二级: async function (ids) {
        const { input, pdfa, pdfh } = this;
        const html = await request(input);
        const getVal = (name) => {
            let m = html.match(new RegExp('<div class="desc_item"><span>' + name + ':&nbsp;</span>([\\s\\S]*?)<\\/div>'));
            return m ? cleanText(m[1].replace(/<[^>]+>/g, ' ')) : '';
        };
        const vod = {
            vod_id: ids[0],
            vod_name: pdfh(html, '.page-bd .title&&Text'),
            vod_pic: pdfh(html, '.page-hd img&&src'),
            vod_remarks: getVal('状态'),
            vod_actor: getVal('主演'),
            vod_director: getVal('导演'),
            vod_year: getVal('年代'),
            vod_content: cleanText(pdfh(html, '.detail-con p&&Text').replace(/^简\s*介：?/, ''))
        };
        let tabs = [];
        pdfa(html, '#leftTabBox .hd li').forEach(it => {
            let name = cleanText(pdfh(it, 'a&&Text'));
            if (name) tabs.push(name);
        });
        let lists = [];
        pdfa(html, '#leftTabBox .bd .numList').forEach(ul => {
            let tmp = [];
            pdfa(ul, 'li').forEach(it => {
                let name = cleanText(pdfh(it, 'a&&Text'));
                let url = pdfh(it, 'a&&href');
                if (name && url) tmp.push(name + '$' + url);
            });
            if (tmp.length) lists.push(tmp.join('#'));
        });
        vod.vod_play_from = tabs.join('$$$');
        vod.vod_play_url = lists.join('$$$');
        return vod;
    },
    搜索: async function (wd) {
        const { pdfa, pdfh } = this;
        const html = await request(`${rule.host}/index.php?m=vod-search&wd=${encodeURIComponent(wd)}`, {
            headers: rule.headers
        });
        const d = [];
        pdfa(html, '#data_list li').forEach(it => {
            d.push({
                title: pdfh(it, '.sTit&&Text'),
                pic_url: pdfh(it, 'img&&data-src') || pdfh(it, 'img&&src'),
                desc: cleanText(pdfh(it, '.sDes:eq(0)&&Text')),
                url: pdfh(it, '.aPlayBtn&&href') || pdfh(it, '.pic a&&href')
            });
        });
        return setResult(d);
    },
    lazy: async function (flag, id) {
        let playUrl = /^https?:\/\//.test(id) ? id : rule.host + id;
        let headers = {
            'User-Agent': rule.headers['User-Agent'],
            'Referer': rule.host + '/'
        };
        let html = await request(playUrl, { headers: Object.assign({}, rule.headers, { Referer: playUrl }) });
        let purl = '';
        let m = html.match(/player_aaaa\s*=\s*(\{[\s\S]*?\})/);
        if (m && m[1]) {
            try {
                let player = JSON.parse(m[1]);
                purl = player.url || '';
                if (player.encrypt == '1') purl = unescape(purl);
                else if (player.encrypt == '2') purl = unescape(Buffer.from(purl, 'base64').toString());
            } catch (e) {}
        }
        if (purl && !/^https?:\/\//.test(purl) && !/\.m3u8|\.mp4|\.flv/i.test(purl)) {
            purl = urljoin(rule.host, purl);
        }
        if (purl && /\.m3u8|\.mp4|\.flv/i.test(purl)) {
            return { parse: 0, jx: 0, url: purl, header: headers };
        }

        let text = String(html || '').replace(/\\\//g, '/');
        let direct = text.match(/https?:\/\/[^'"\s<>]+\.(m3u8|mp4|flv)(\?[^'"\s<>]*)?/i);
        if (direct && direct[0]) {
            return { parse: 0, jx: 0, url: direct[0], header: headers };
        }

        let src = pdfh(html, 'video&&src') || pdfh(html, 'source&&src') || pdfh(html, 'iframe&&src');
        if (src) purl = src;
        if (!purl) return { parse: 1, url: playUrl, jx: 0, header: headers };
        if (!/^https?:\/\//.test(purl)) purl = urljoin(rule.host, purl);
        if (/\.m3u8|\.mp4|\.flv/i.test(purl)) {
            return { parse: 0, jx: 0, url: purl, header: headers };
        }
        return { parse: 1, jx: 0, url: purl, header: headers };
    }
};

function cleanText(s) {
    return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
