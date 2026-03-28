/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '鬼片之家',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    类型:'影视',
    title:'鬼片之家',
    desc:'不告诉你',
    host:'https://www.guipian360.com',
    url: '/list/fyclass-fypage.html',
    searchUrl:'/vodsearch/**----------fypage---.html',
    searchable:2,quickSearch:0,timeout:5000,play_parse:true,filterable:0,
    class_name: '鬼片大全&大陆鬼片&港台鬼片&林正英鬼片&日韩鬼片&欧美鬼片&泰国鬼片&恐怖片&电视剧&国产剧&港台剧&美剧&韩剧&日剧&泰剧&其它剧&动漫',
    class_url: '1&6&9&8&7&11&10&3&2&12&20&13&14&15&16&22&4',
    预处理: async () => {
        return []
    },
    推荐: async function (tid, pg, filter, extend) {
        return await this.一级(tid, pg, filter, extend);
    },
    一级: async function (tid, pg, filter, extend) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.m-movies .u-movie');
        data.forEach((it) => {
            let title = pdfh(it, 'a&&title');
            title = title.split('/')[0].trim().replace(/.*《([^》]+)》.*/, "$1");
            let url = pd(it, 'a&&href');
            let id = url.match(/\/(\d+)\.html/)?.[1] || '';
            let pic_url = pd(it, 'img&&src');
            if (pic_url && !pic_url.startsWith('http')) {
                pic_url = this.host + pic_url;
            }
            d.push({
                title: title,
                pic_url: pic_url,
                desc: pdfh(it, '.zhuangtai&&Text'),
                url: url,
                id: id
            })
        });
        return setResult(d)
    },
    二级: async function (ids) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};
        let vod_name = pdfh(html, 'h1&&Text');
        vod_name = vod_name.split('/')[0].trim().replace(/.*《([^》]+)》.*/, "$1");
        VOD.vod_name = vod_name;
        VOD.vod_pic = pd(html, '.lazy&&src') || '';
        if (VOD.vod_pic && !VOD.vod_pic.startsWith('http')) {
            VOD.vod_pic = this.host + VOD.vod_pic;
        }
        VOD.vod_content = pdfh(html, '.jianjie&&Text') || '暂无简介';
        VOD.vod_director = pdfh(html, '.hidden-xs:contains(导演：)&&Text') || '';
        if (VOD.vod_director) {
            VOD.vod_director = VOD.vod_director.replace('导演：', '').trim();
        }
        VOD.vod_actor = pdfh(html, '.hidden-xs:contains(主演：)&&Text') || '';
        if (VOD.vod_actor) {
            VOD.vod_actor = VOD.vod_actor.replace('主演：', '').trim();
        }
        VOD.vod_year = pdfh(html, 'strong:contains(年)&&Text') || '';
        if (VOD.vod_year) {
            VOD.vod_year = VOD.vod_year.replace('年', '').trim();
        }
        VOD.vod_area = pdfh(html, '.hidden-xs:contains(地区：) a&&Text') || '';
        VOD.vod_lang = pdfh(html, '.hidden-xs:contains(语言：)&&Text') || '';
        if (VOD.vod_lang) {
            VOD.vod_lang = VOD.vod_lang.replace('语言：', '').trim();
        }
        let playlist = pdfa(html, '#tv_tab&&.abc');
        let tabs = pdfa(html, '#tv_tab .select');
        let playmap = {};
        tabs.map((item, i) => {
            const form = pdfh(item, 'Text');
            const list = playlist[i];
            const a = pdfa(list, 'body&&a');
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
    搜索: async function (wd, quick, pg) {
        return await this.一级(wd, quick, pg);
    },
    lazy: async function (flag, id, flags) {
        let {input} = this;
        let html = await request(input);
        let match = html.match(/var now="(.*?)";/);
        if (match?.[1]) {
            let url = match[1];
            return {parse: 0, url: url};
        }
        return {parse: 0, url: input};
    }
}