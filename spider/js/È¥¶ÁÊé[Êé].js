/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '去读书[书]',
  author: 'EylinSir',
  '类型': '小说',
  logo: 'http://www.qudushu.com/favicon.ico',
  lang: 'ds'
})
*/

var rule = {
    类型: '小说',
    author: 'EylinSir',
    title: '去读书[书]',
    host: 'http://www.qudushu.com',
    url: '/book/fyclass/0/fypage.html',
    logo: 'http://www.qudushu.com/favicon.ico',
    class_name: '玄幻魔法&武侠修真&都市言情&历史军事&穿越架空&游戏竞技',
    class_url: 'sort1&sort2&sort3&sort4&sort5&sort6',
    searchUrl: '/modules/article/search.php?q=**',
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    timeout: 10000,
    play_parse: true,
    headers: { 'User-Agent': 'MOBILE_UA' },

    一级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let url = input.startsWith('http') ? input : `${this.host}/book/${input}/0/1.html`;
        let html = await request(url);
        let d = [];
        let items = pdfa(html, '.blockcontent .c_row') || pdfa(html, '.c_row') || [];
        for (let item of items) {
            let title = pdfh(item, '.c_subject a:eq(1)&&Text');
            let url = pd(item, '.c_subject a:eq(1)&&href');
            if (!title || !url) continue;
            d.push({
                title,
                url,
                desc: pdfh(item, '.c_tag span:eq(1)&&Text') || '',
                pic_url: pd(item, 'img&&src') || '',
                content: pdfh(item, '.c_description&&Text') || '',
            });
        }
        return setResult(d);
    },

    二级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {
            vod_name: pdfh(html, '[property="og:novel:book_name"]&&content') || '',
            vod_pic: pd(html, '.divbox.cf img&&src') || '',
            vod_content: pdfh(html, '.tabcontent .tabvalue:eq(0)&&Text') || '',
            vod_remarks: pdfh(html, 'h3 a&&Text') || '',
            vod_actor: pdfh(html, '[property="og:novel:author"]&&content') || '',
            vod_play_from: '去读书网'
        };
        VOD.vod_director = VOD.vod_actor; // 复用作者信息
        let tocUrl = pd(html, 'a:contains(点击阅读)&&href') || '';
        tocUrl = tocUrl && !tocUrl.startsWith('http') ? `${this.host}${tocUrl}` : tocUrl;
        let tocHtml = tocUrl ? await request(tocUrl) : '';
        let chapters = [];
        let chs = pdfa(tocHtml, '.index li') || [];
        for (let ch of chs) {
            let title = pdfh(ch, 'a&&Text');
            let chUrl = pd(ch, 'a&&href');
            if (!title || !chUrl) continue;
            chUrl = chUrl.startsWith('http') ? chUrl : `${this.host}${chUrl}`;
            chapters.push(`${title}$${chUrl}`);
        }
        VOD.vod_play_url = chapters.join('#');
        return VOD;
    },

    搜索: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let items = pdfa(html, '#jieqi_page_contents .c_row') || [];
        for (let item of items) {
            let title = pdfh(item, '.c_subject a&&Text');
            let url = pd(item, '.c_subject a&&href');
            if (!title || !url) continue;
            url = url.startsWith('http') ? url : `${this.host}${url}`;
            let pic = pd(item, 'img&&src') || '';
            pic = pic.startsWith('http') ? pic : `${this.host}${pic}`;
            d.push({
                title,
                url,
                desc: pdfh(item, '.c_tag span:eq(1)&&Text') || '',
                pic_url: pic,
                content: '',
            });
        }
        return setResult(d);
    },

    lazy: async function () {
        let {input, pdfh} = this;
        let html = await request(input);
        let title = pdfh(html, 'h1&&Text') || '';
        let content = pdfh(html, '#acontent&&Html') || '';
        if (content) {
            const replaceRules = [
                [/<script[^>]*?>[\s\S]*?<\/script>/gi, ''], 
                [/<\/p>|<br\s*\/?>/g, '\n'], 
                [/<[^>]*?>/g, ''],
                [/去读书推荐各位书友阅读：.*|去读书 www\.qudushu\.la|如果您中途有事离开，请按.*以便以后接着观看！/g, ''], 
                [/&nbsp;|[ \t]+/g, ' '],
                [/\n[ \t]*\n+/g, '\n']
            ];
            replaceRules.forEach(([reg, val]) => content = content.replace(reg, val));
            content = content.trim();
            if (content.startsWith(title)) {
                content = content.replace(title, '').trim();
            }
        }
        return {
            parse: 0,
            url: `novel://${JSON.stringify({title, content})}`,
            js: ''
        };
    }
};