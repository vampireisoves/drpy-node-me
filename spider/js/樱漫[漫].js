/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 0,
  title: '樱漫',
  lang: 'ds'
})
*/

var rule = {
    title: '樱漫',
    host: 'https://skr.skr2.cc:666',
    url: '/vodshow/fyclass--------fypage---/',
    searchUrl: '/vodsearch/**----------fypage---/',
    headers: {
        'User-Agent': 'UC_UA'
    },
    searchable: 1,
    quickSearch: 0,
    filterable: 0,
    class_name: '国漫&美漫&日漫&大陆&港台&日剧&纪录片&综艺',
    class_url: '47&85&46&81&82&32&88&91',
    play_parse: true,
    limit: 6,
    double: true,
    lazy: async function () {
        let {input, pdfa, pdfh, pd} = this
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
    一级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.vodlist li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a&&title'),
                pic_url: pd(it, '.lazyload&&data-original'),
                desc: pdfh(it, '.pic_text.text_right&&Text'),
                url: pd(it, 'a&&href'),
            })
        });
        return setResult(d)
    },
    二级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};
        VOD.vod_name = pdfh(html, 'h1&&Text');
        VOD.vod_content = pdfh(html, '.content_desc.full_text&&Text');
        let playlist = pdfa(html, '.content_playlist');
        let tabs = pdfa(html, '.play_source_tab a');
        let playmap = {};
        tabs.map((item, i) => {
            const form = pdfh(item, 'Text');
            const list = playlist[i];
            const a = pdfa(list, 'a:not([rel])');
            a.map((it) => {
                let title = pdfh(it, 'a&&Text');
                let urls = pd(it, 'a&&href', input);
                if (!playmap.hasOwnProperty(form)) {
                    playmap[form] = [];
                }
                playmap[form].push(title + "$" + urls);
            });
        });
        VOD.vod_play_from = Object.keys(playmap).join('$$$');
        const urls = Object.values(playmap);
        const playUrls = urls.map((urllist) => {
            return urllist.join("#");
        });
        VOD.vod_play_url = playUrls.join('$$$');
        return VOD;
    },
    搜索: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.vodlist li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, '.vodlist_title&&Text'),
                pic_url: pd(it, '.lazyload&&data-original'),
                desc: pdfh(it, '.voddate&&Text'),
                url: pd(it, 'a&&href'),
            })
        });
        return setResult(d)
    }
}
