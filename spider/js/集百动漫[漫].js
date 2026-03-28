/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 0,
  title: '集百动漫',
  author: 'EylinSir',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    author: 'EylinSir',
    title: '集百动漫',
    host: 'http://www.duanjux.com',
    url: '/bm/fyclass/fypage.html',
    searchUrl: '/vodsearch/-------------.html?wd=**',
    homeUrl: '/',
    headers: {'User-Agent': 'UC_UA'},
    searchable: 1, 
    quickSearch: 0, 
    filterable: 0, 
    double: true, 
    play_parse: true, 
    limit: 6,
    class_name: '3D国漫&动漫&沙雕剧场',
    class_url: '20&21&22',
    lazy: async function () {
        let html = await request(this.input);
        let url = this.pdfh(html, 'iframe&&src') || this.input;
        if (url.includes("player.bilibili") && url.includes("aid=")) {
            url = "https://www.bilibili.com/video/av" + url.match(/aid=(\d+)/)[1];
        }
        let jx = /iqiyi|qq\.com|youku|mgtv|sohu|bilibili|1905|pptv/.test(url) ? 1 : 0;
        return {parse: 1, jx: jx, url: url};
    },
    推荐: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.post-item');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, '.post-item-title&&Text'),
                pic_url: pd(it, '.post-item-cover img&&src'),
                desc: pdfh(it, '.post-item-summary&&Text'),
                url: pd(it, '.post-item-img&&href'),
            })
        });
        return setResult(d)
    },
    一级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.post-item');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, '.post-item-title&&Text'),
                pic_url: pd(it, '.post-item-cover img&&src'),
                desc: pdfh(it, '.post-item-summary&&Text'),
                url: pd(it, '.post-item-img&&href'),
            })
        });
        return setResult(d)
    },
    二级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};
        const postContent = pdfa(html, '.post-content')[0];
        const contentText = pdfh(postContent, 'Text');
        const nameMatch = contentText.match(/剧名：(.*?)「/);
        VOD.vod_name = nameMatch ? nameMatch[1] : pdfh(html, 'title&&Text').replace(/_.*/, '');
        VOD.vod_content = pdfh(postContent, 'Text');
        const playListDiv = pdfa(html, '.block-wrap#divTags')[0];
        const playItems = pdfa(playListDiv, 'ul li a');
        let playmap = {};
        let form = '集百动漫';
        playmap[form] = [];
        playItems.forEach((it) => {
            let title = pdfh(it, 'a&&title');
            let urls = pd(it, 'a&&href', input);
            playmap[form].push(title + "$" + urls);
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
        let data = pdfa(html, '.post-item');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, '.post-item-title&&Text'),
                pic_url: pd(it, '.post-item-cover img&&src'),
                desc: pdfh(it, '.post-item-summary&&Text'),
                url: pd(it, '.post-item-img&&href'),
                content: pdfh(it, '.post-item-summary&&Text'),
            })
        });
        return setResult(d)
    }
}