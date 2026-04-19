/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '西瓜影院',
  类型: '影视',
  lang: 'ds'
})
*/

var rule = {
    模板: '首图2',
    title: '西瓜影院',
    host: 'https://sszzyy.com',
    homeUrl: '/',
    url: '/index.php/vod/type/id/fyclass/page/fypage.html',
    searchUrl: '/index.php/vod/search/page/fypage/wd/**.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    timeout: 15000,
    headers: {
        'User-Agent': MOBILE_UA,
        'Referer': 'https://sszzyy.com/'
    },
    class_name: '电影&连续剧&动漫&综艺&B站&人人专区',
    class_url: '20&37&43&45&47&60',
    class_parse: '',
    double: false,
    推荐: '.stui-vodlist.clearfix li;.title&&Text;.lazyload&&data-original||.lazyload&&src;.pic-text&&Text;a&&href',
    二级: async function () {
        let { input, pdfh, pd, pdfa } = this;
        let html = await request(input);
        let vod_name = pdfh(html, '.stui-content__detail .title&&Text');
        let vod_pic = pd(html, '.stui-content__thumb .lazyload&&data-original') || pd(html, '.stui-content__thumb .lazyload&&src');
        let p1 = pdfh(html, '.stui-content__detail p:eq(0)&&Text') || '';
        let vod_actor = (pdfh(html, '.stui-content__detail p:eq(3)&&Text') || '').replace('主演：', '').trim();
        let vod_director = (pdfh(html, '.stui-content__detail p:eq(2)&&Text') || '').replace('导演：', '').trim();
        let vod_content = (pdfh(html, '.detail&&Text') || '').replace('简介：', '').trim();
        let mType = p1.match(/类型：([^\/]*)/);
        let mArea = p1.match(/地区：([^\/]*)/);
        let mYear = p1.match(/年份：([^\/]*)/);
        let playTabs = pdfa(html, '.stui-pannel_hd h3');
        let playLists = pdfa(html, '.stui-content__playlist');
        let from = [];
        let urls = [];
        for (let i = 0; i < playLists.length; i++) {
            let tab = playTabs[i] ? pdfh(playTabs[i], 'body&&Text').trim() : '线路' + (i + 1);
            let arr = [];
            pdfa(playLists[i], 'li').forEach(it => {
                let n = pdfh(it, 'a&&Text').trim();
                let u = pd(it, 'a&&href');
                if (n && u) arr.push(n + '$' + u);
            });
            if (arr.length) {
                from.push(tab);
                urls.push(arr.join('#'));
            }
        }
        return {
            vod_id: input,
            vod_name,
            vod_pic,
            type_name: mType ? mType[1].trim() : '',
            vod_year: mYear ? mYear[1].trim() : '',
            vod_area: mArea ? mArea[1].trim() : '',
            vod_remarks: pdfh(html, '.stui-content__detail p:eq(1)&&Text') || '',
            vod_actor,
            vod_director,
            vod_content,
            vod_play_from: from.join('$$$'),
            vod_play_url: urls.join('$$$')
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