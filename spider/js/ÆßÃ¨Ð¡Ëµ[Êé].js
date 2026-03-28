/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '七猫小说[书]',
  logo: 'https://cdn-front.qimao.com/global/static/images/favicon2022.ico',
  author: '道长',
  '类型': '小说',
  lang: 'ds'
})
*/

var rule = {
    author: '道长',
    类型: '小说', //影视|听书|漫画|小说
    title: '七猫小说[书]',
    host: 'https://www.qimao.com/',
    url: '/shuku/fyclass-fyfilter-fypage/',
    class_name: '全部&女生原创&男生原创&出版图书',
    //detailUrl:'https://api-bc.wtzw.com/api/v1/reader/detail?id=1747899',
    listUrl: 'https://api-ks.wtzw.com/api/v1/chapter/chapter-list',
    listUrl2: 'https://www.qimao.com/api/book/chapter-list',
    contentUrl: 'https://api-ks.wtzw.com/api/v1/chapter/content',
    class_url: 'a&1&0&2',
    searchUrl: 'https://api-bc.wtzw.com/search/v1/words#fypage',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    filter: "H4sIAAAAAAAAAO1W3U4aQRR+l72GZF1EGh+iL9AYs1GaEBUbKzSNIaEgLFDKlqJujURLCohpEaTErrtFXmZ+lrfoALszO3BRbrig2ZtN9vvOzPmZ+c6ZE0EUNl+dCHvh98KmAAZVWPkAc1n8YAo+ISofhOfRuLwfC08WRQkJM61RujWGyY8sJHw2XMpCtWfDwQ2GZ6+A8dHGN0SK49syfDIdfJ3iSNdRTrXxUJDZl06JPWwobJUkSpQepQdQTwHDwGc3lA6wKBrKSDPhnxSLRRJdTttN8PwNmJfkS2nmGwwqVqpHCZbcS/SzBjNpyoSExNaY44rb1tB5d664DrpQcQMi0BVgNoDuRL/Gc/7g+OvEQbkJ6l8TXSSryRT2S26WlWQKT3wWnFPlskNXfXTRRdrjSOuz7GbQxbKD9TuYzcxlFuJwyZUxRwT4sL524OcmvC9is+IKi0cXu9G/e2wBF5g1vLYGA6C3bUbkIyh9gYbq8u38815RMY9TT1AxR4pz3Xf2Izt77FIW8yhpsotCoHeHR7tvt6OxA2ZUTVrD8rTqtlHsza58HN4+jhDv7r3OHi1NZXu9luOHRxFiGIuPw9/ykQSX0RhwqQvM71YridLzRwzV+izJzpkoHaV/ceRsn8A/rlEhSfXH2otV+0Q6Ab9xyJOnJ8/Vlae0FHmiCwW2m1beQNWOc5TrTEdkohILXH8m85rSrNTYVPF9DRYe4FCjtOSmYUafuqC0ayorBs7nYFe1On2HDoYY3S3D0yE6v3QN3+ALT8OehldWw/IqjdhlP+n/McJX5cW/uo3Ueyt5ffZ/7LOJv/U9eHXlEAAA",
    filter_url: "{{fl.作品分类 or 'a'}}-a-{{fl.作品字数 or 'a'}}-{{fl.更新时间 or 'a'}}-a-{{fl.是否完结 or 'a'}}-{{fl.排序 or 'click'}}",
    filter_def: {},
    headers: {
        'User-Agent': 'PC_UA',
    },
    sign_headers: {
        "app-version": "51110",
        "platform": "android",
        "reg": "0",
        "AUTHORIZATION": "",
        "application-id": "com.****.reader",
        "net-env": "1",
        "channel": "unknown",
        "qm-params": "",
        "sign": "fc697243ab534ebaf51d2fa80f251cb4"
    },
    timeout: 5000,
    play_parse: true,
    lazy: async function () {
        let {input} = this;
        let params = {
            id: input.split('@@')[0],
            chapterId: input.split('@@')[1],
        };
        params['sign'] = getSignStr(params);
        let contentUrl = buildUrl(rule.contentUrl, params);
        //log(contentUrl);
        let title = input.split('@@')[2];
        let content = '';
        let html = await request(contentUrl, {
            headers: rule.sign_headers
        });
        //log(html);
        let json = JSON.parse(html);
        //log(json);
        let result = json.data.content;
        content = decodeContent(result);
        let ret = JSON.stringify({
            title,
            content
        });
        input = {
            parse: 0,
            url: 'novel://' + ret,
            js: ''
        };
        return input
    },
    double: true,
    推荐: '',
    request: async function (url, obj) {
        obj = obj || {};
        try {
            const response = await _fetch(url, {
                method: obj.method || 'GET',
                headers: obj.headers || {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                        'Chrome/139.0.0.0 Safari/537.36'
                }
            });
            return response.text();
        } catch (err) {
            return ''
        }
    },
    一级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await this.request(input);
        // console.log('html:', html);
        let d = [];
        let data = pdfa(html, 'ul.qm-cover-text&&li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, '.s-tit&&Text'),
                pic_url: pd(it, 'img&&src'),
                desc: pdfh(it, '.s-author&&Text'),
                url: pd(it, 'a&&href'),
                content: pdfh(it, '.s-desc&&Text'),
            })
        });
        return setResult(d)
    },
    二级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        // console.log('Detail Input:', input);
        let html = await this.request(input);
        // console.log('Detail HTML Length:', html.length);
        let VOD = {};
        VOD.vod_name = pdfh(html, '.book-detail-info .title .txt&&Text');
        VOD.type_name = pdfh(html, '.qm-tag:eq(-1)&&Text');
        VOD.vod_pic = pd(html, '.wrap-pic&&img&&src');
        VOD.vod_content = pdfh(html, '.intro&&Text');
        VOD.vod_remarks = pdfh(html, '.qm-tag&&Text');
        VOD.vod_year = '';
        VOD.vod_area = '';
        VOD.vod_actor = pdfh(html, '.sub-title&&span:eq(1)&&Text');
        VOD.vod_director = pdfh(html, '.sub-title&&span&&a&&Text');
        VOD.vod_play_from = '七猫小说';
        let book_id = input.match(/shuku\/(\d+)/)[1];
        let listUrl = buildUrl(rule.listUrl2, {
            book_id: book_id
        });
        // log(input);
        // log(listUrl);
        let html1 = await this.request(listUrl);
        let json = JSON.parse(html1);
        let chapters = json.data.chapters;
        // log(chapters.length);
        let LISTS = [chapters.map(it => it.title + '$' + book_id + '@@' + it.id + '@@' + it.title)];
        // log(LISTS);
        VOD.vod_play_url = LISTS.map(urls => urls.join('#')).join('$$$');
        return VOD
    },

    搜索: async function () {
        let {KEY, MY_PAGE} = this;
        let params = {
            'extend': '',
            'tab': '0',
            'gender': '0',
            'refresh_state': '8',
            'page': MY_PAGE,
            'wd': KEY,
            'is_short_story_user': '0'
        };
        params['sign'] = getSignStr(params);
        let _url = buildUrl(rule.searchUrl.split('#')[0], params);
        //log(_url);
        let html = await this.request(_url, {
            headers: rule.sign_headers
        });
        let json = JSON.parse(html);
        //log(json);
        let d = [];
        json.data.books.forEach(it => {
            if (it.show_type === '0') {
                d.push({
                    title: it.original_title,
                    desc: it.author,
                    img: it.image_link,
                    url: `https://www.qimao.com/shuku/${it.id}/`,
                });
            }
        });
        return setResult(d);
    },
}

function getSignStr(params) {
    // d3dGiJc651gSQ8w1
    const sign_key = "d3dGiJc651gSQ8w1";
    let keys = Object.keys(params)
        .sort();
    let sign_str = keys.reduce((pre, n) => pre + n + "=" + params[n], "") + sign_key;
    return md5(sign_str);
}

function novelContentDecrypt(data, iv) {
    let key = CryptoJS.enc.Hex.parse("32343263636238323330643730396531");
    iv = CryptoJS.enc.Hex.parse(iv);
    let HexStr = CryptoJS.enc.Hex.parse(data);
    let Base64Str = CryptoJS.enc.Base64.stringify(HexStr);
    let decrypted = CryptoJS.AES.decrypt(Base64Str, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

function decodeContent(response) {
    let txt = CryptoJS.enc.Base64.parse(response)
        .toString();
    let iv = txt.slice(0, 32);
    let _content = novelContentDecrypt(txt.slice(32), iv)
        .trim();
    return _content;
}
