/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '天空影视',
  类型: '影视',
  lang: 'ds'
})
*/

var rule = {
    模板: '首图2',
    title: '天空影视',
    host: 'https://skyysw.com',
    homeUrl: '/',
    url: '/index.php/vod/show/id/fyclass/page/fypage.html',
    searchUrl: '/index.php/vod/search/page/fypage/wd/**.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    timeout: 10000,
    headers: {
        'User-Agent': MOBILE_UA,
        'Referer': 'https://skyysw.com/'
    },
    class_name: '电影&电视剧&综艺&动漫',
    class_url: '2&1&3&4',
    class_parse: '',
    double: false,
    推荐: '.myui-vodbox .myui-vodbox-content;.card-info .title&&Text;img&&src;.tag-box .tag&&Text;a&&href',
    一级: '.movie-ul .myui-vodbox-content;.card-info .title&&Text;img&&src;.tag-box .tag&&Text;a&&href',
    二级: async function () {
        let { input, pdfh, pd, pdfa } = this;
        let html = await request(input);
        let title = pdfh(html, 'h1.title&&Text');
        let type_name = pdfh(html, '.tags .tag&&Text');
        let vod_pic = pd(html, '.img-box img&&data-original') || pd(html, '.img-box img&&src');
        let vod_director = (pdfh(html, '.director:eq(0)&&Text') || '').replace('导演:', '').trim();
        let vod_actor = (pdfh(html, '.director:eq(1)&&Text') || '').replace('主演:', '').trim();
        let vod_content = pdfh(html, '.vod-content .intro&&Text').replace('简介:', '').trim();
        let playUrls = [];
        pdfa(html, '.tab-content .listitem a').forEach(it => {
            let n = pdfh(it, 'a&&Text').trim();
            let u = pd(it, 'a&&href');
            if (n && u) playUrls.push(n + '$' + u);
        });
        return {
            vod_id: input,
            vod_name: title,
            vod_pic: vod_pic,
            type_name: type_name,
            vod_year: '未知',
            vod_area: '未知',
            vod_remarks: pdfh(html, '.tag-box .tag&&Text') || '',
            vod_actor: vod_actor,
            vod_director: vod_director,
            vod_content: vod_content,
            vod_play_from: 'ff',
            vod_play_url: playUrls.join('#')
        };
    },
    搜索: '.show-vod-list .myui-vodbox-content;.card-info .title&&Text;img&&src;.tag-box .tag&&Text;a&&href',
    play_parse: true,
    lazy: async function () {
        let { input } = this;
        return {
            parse: 1,
            url: input,
            header: {
                'User-Agent': rule.headers['User-Agent'],
                'Referer': input
            }
        };
    }
};