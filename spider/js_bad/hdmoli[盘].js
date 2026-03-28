/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: 'hdmoli',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    title: 'hdmoli',
    alias: 'hdmoli',
    desc: '首图模板纯js写法',
    host: 'https://www.hdmoli.pro',
    url: '/mlist/indexfyclass-fypage.html',
    searchUrl: '/search.php?page=fypage&searchword=**&searchtype=',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'MOBILE_UA',
    },
    class_name: '电影&电视剧&动漫',
    class_url: '1&2&41',
    lazy: async function () {
        let {input, pdfa, pdfh, pd} = this
        if (input.startsWith('push://')) {
            return {
                parse: 0,
                url: input
            }
        }
        const html = JSON.parse((await req(input)).content.match(/r player_.*?=(.*?)</)[1]);
        let url = html.url;
        if (html.encrypt == "1") {
            url = unescape(url)
            return {parse: 0, url: url}
        } else if (html.encrypt == "2") {
            url = unescape(base64Decode(url))
            return {parse: 0, url: url}
        }
        if (/m3u8|mp4/.test(url)) {
            input = url
            return {parse: 0, url: input}
        } else {
            return {parse: 1, url: input}
        }
    },
    推荐: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, 'ul.myui-vodlist.clearfix');
        data.forEach((it) => {
            let data1 = pdfa(it, 'li');
            data1.forEach((it1) => {
                d.push({
                    title: pdfh(it1, 'a&&title'),
                    pic_url: pd(it1, 'a&&data-original'),
                    desc: pdfh(it1, '.pic-text&&Text'),
                    url: pd(it1, 'a&&href'),
                })
            });
        });
        return setResult(d)
    },
    一级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.myui-vodlist li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a&&title'),
                pic_url: pd(it, 'a&&data-original'),
                desc: pdfh(it, '.pic-text&&Text'),
                url: pd(it, 'a&&href'),
            })
        });
        return setResult(d)
    },
    二级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};
        VOD.vod_name = pdfh(html, '.myui-content__detail .title--font&&Text');
        let datas = pdfh(html, '.data&&Html').trim().split('\n').filter(i => !/split-line/.test(i));
        VOD.type_name = datas[0];
        VOD.vod_pic = pd(html, '.myui-content__thumb .lazyload&&data-original');
        VOD.vod_content = pdfh(html, '.myui-panel-box&&.text-muted&&Text');
        VOD.vod_remarks = pdfh(html, '.myui-content__detail .title&&font&&Text');
        VOD.vod_year = pdfh(datas[2], 'Text');
        VOD.vod_area = pdfh(datas[1], 'Text');
        VOD.vod_actor = pdfh(html, 'p.data:eq(1)&&Text');
        VOD.vod_director = pdfh(html, 'p.data:eq(2)&&Text');
        let playlist = pdfa(html, '.myui-content__list')
        let tabs = pdfa(html, '.myui-panel__head&&li');
        let playmap = {};
        tabs.map((item, i) => {
            const form = pdfh(item, 'Text')
            const list = playlist[i]
            const a = pdfa(list, 'body&&a')
            a.map((it) => {
                let title = pdfh(it, 'a&&Text')
                let urls = pd(it, 'a&&href', input)
                if (!playmap.hasOwnProperty(form)) {
                    playmap[form] = [];
                }
                playmap[form].push(title + "$" + urls);
            });
        });
        let pans = pdfa(html, '.downlist&&a');
        pans.forEach((item, i) => {
            const form = pdfh(item, 'a&&title');
            const list = pdfh(item, 'a&&href');
            if (/pan.quark.cn|drive.uc.cn|www.alipan.com|www.aliyundrive.com/.test(list)) {
                playmap[form] = [form + '$push://' + list];
            }
        });
        VOD.vod_play_from = Object.keys(playmap).join('$$$');
        const urls = Object.values(playmap);
        const playUrls = urls.map((urllist) => {
            return urllist.join("#")
        });
        VOD.vod_play_url = playUrls.join('$$$');
        return VOD
    },
    搜索: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '#searchList li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a&&title'),
                pic_url: pd(it, '.lazyload&&data-original'),
                desc: pdfh(it, '.pic-text&&Text'),
                url: pd(it, 'a&&href'),
                content: pdfh(it, '.detail&&Text'),
            })
        });
        return setResult(d)
    }
}
