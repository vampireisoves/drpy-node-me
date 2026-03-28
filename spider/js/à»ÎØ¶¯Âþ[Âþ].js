/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '嗷呜动漫',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    title: '嗷呜动漫',
    host: 'https://www.aowu.tv/',
    url: '/index.php/ds_api/vod',
    searchUrl: '/search/**----------fypage---/',
    homeUrl: '/',
    headers: {'User-Agent': 'MOBILE_UA'},
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    double: true,
    play_parse: true,
    limit: 6,
    class_name: '当季新番&番剧&剧场',
    class_url: '20&21&22',

    // 首页推荐
    推荐: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);

        let d = [];
        let data = pdfa(html, '.public-list-box');

        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a&&title'),
                pic_url: pd(it, '.lazy&&data-src', input),
                desc: pdfh(it, '.ft2&&Text'),
                url: pd(it, 'a&&href', input),
            })
        });
        return setResult(d)
    }, //一级
    一级: async function (tid, pg, filter, extend) {
        let {input, MY_CATE, MY_PAGE} = this;
        let d = [];

        let data = {'type': MY_CATE, 'by': 'time', 'page': MY_PAGE};
        let html = await request(input, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
        });

        let list = JSON.parse(html).list;
        list.forEach(it => d.push({
            title: it.vod_name, desc: it.vod_remarks, img: it.vod_pic, url: rule.host + it.url
        }));
        return setResult(d)
    },


    // 二级详情
    二级: async function (id) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};

        // 基本信息
        VOD.vod_name = pdfh(html, 'h3&&Text');
        VOD.vod_content = pdfh(html, '.switch-box&&Text');
        VOD.vod_pic = pd(html, '.vodlist_thumb&&data-original', input);

        // 播放列表提取
        let playlist = pdfa(html, '.anthology-list-play');
        let tabs = pdfa(html, '.anthology-tab a');

        let playmap = {};
        tabs.forEach((item, i) => {
            const form = pdfh(item, 'a&&Text')
            const list = playlist[i]
            if (list) {
                const a = pdfa(list, 'a')
                a.forEach((it) => {
                    let title = pdfh(it, 'a&&title') || pdfh(it, 'a&&Text')
                    let urls = pd(it, 'a&&href', input)
                    if (!playmap.hasOwnProperty(form)) {
                        playmap[form] = [];
                    }
                    playmap[form].push(title + "$" + urls);
                });
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

    // 搜索
    搜索: async function (wd, quick, pg) {
        let {input, pdfa, pdfh, pd} = this;
        let d = [];
        let html = await request(input);
        let data = pdfa(html, '.row .vod-detail');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'h3&&Text'),
                pic_url: pd(it, 'img&&data-src', input),
                desc: pdfh(it, '.pic_text&&Text'),
                url: pd(it, 'a&&href', input),
            })
        });

        d = d.filter(item => item.title?.toLowerCase().includes(wd.toLowerCase()));
        return setResult(d)
    },

    lazy: async function (flag, id, flags) {
        let {input, pdfa, pdfh, pd} = this;
        return {parse: 1, url: input}
    }

}