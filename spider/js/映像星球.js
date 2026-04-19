/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '映像星球',
  类型: '影视',
  lang: 'ds'
})
*/

var rule = {
    模板: 'mxpro',
    title: '映像星球',
    host: 'https://www.yxxq39.cc',
    homeUrl: '/',
    url: '/top/fyclass--------fypage---.html',
    searchUrl: '/search/**----------fypage---.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    timeout: 10000,
    headers: {
        'User-Agent': MOBILE_UA,
        'Referer': 'https://www.yxxq39.cc/'
    },
    class_name: '电影&电视剧&综艺&动漫&纪录片&短剧&伦理片',
    class_url: '1&2&3&4&5&6&7',
    class_parse: '',
    搜索: '.module-card-item.module-item;strong&&Text;img&&data-original;.module-item-note&&Text;a&&href;.module-info-item-content:eq(1)&&Text',
    二级: async function () {
        let { input, pdfh, pd, pdfa } = this;
        let html = await request(input);
        let vod_name = pdfh(html, 'h1&&Text');
        let vod_pic = pd(html, '.module-info-poster img&&data-original') || pd(html, '.module-info-poster img&&src');
        let descs = pdfa(html, '.module-info-item');
        let vod_director = '';
        let vod_actor = '';
        let vod_remarks = '';
        descs.forEach(it => {
            let txt = pdfh(it, 'body&&Text').trim();
            if (txt.startsWith('导演：')) vod_director = txt.replace('导演：', '').replace(/\/$/, '').trim();
            if (txt.startsWith('主演：')) vod_actor = txt.replace('主演：', '').replace(/\/$/, '').trim();
            if (txt.startsWith('备注：')) vod_remarks = txt.replace('备注：', '').replace(/\/$/, '').trim();
        });
        let rawContent = pdfh(html, '.module-info-introduction-content&&Text').trim();
        let vod_content = rawContent
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\.custom-ad-container[\s\S]*/g, '')
            .trim();
        let playUrls = [];
        pdfa(html, '.module-play-list-link').forEach(it => {
            let n = pdfh(it, 'span&&Text') || pdfh(it, 'body&&Text');
            let u = pd(it, 'a&&href') || pd(it, 'href');
            if (n && u) playUrls.push(n.trim() + '$' + u);
        });
        return {
            vod_id: input,
            vod_name,
            vod_pic,
            type_name: (pdfh(html, '.module-info-tag-link:eq(2)&&Text') || '').replace(/\/$/, '').trim(),
            vod_year: (pdfh(html, '.module-info-tag-link:eq(0)&&Text') || '').trim(),
            vod_area: (pdfh(html, '.module-info-tag-link:eq(1)&&Text') || '').trim(),
            vod_remarks,
            vod_actor,
            vod_director,
            vod_content,
            vod_play_from: '线路①',
            vod_play_url: playUrls.join('#')
        };
    },
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