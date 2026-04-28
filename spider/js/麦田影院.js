/*
* @File     : 麦田影院.js
* @Author   : OpenAI
* @Date     : 2026-04-19
* @Comments : 初版：先完成分类、url 与一级规则
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '麦田影院',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    类型: '影视',
    title: '麦田影院',
    host: 'https://www.mtyy5.com',
    homeUrl: '/',
    url: '/vodshow/fyclass--------fypage---.html',
    searchUrl: '/index.php/ajax/suggest?mid=1&wd=**&limit=50',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'MOBILE_UA',
        'Referer': 'https://www.mtyy5.com/'
    },
    timeout: 10000,
    class_name: '电影&电视剧&动漫&综艺&短剧',
    class_url: '1&2&4&3&26',
    detailUrl: '/voddetail/fyid.html',
    lazy: async function () {
        let { input } = this;
        let html = await request(input);
        let m = html.match(/var\s+player_data\s*=\s*(\{.*?\})\s*<\/script>/s);
        if (!m) {
            return { parse: 1, url: input };
        }
        let data = JSON.parse(m[1]);
        let url = data.url || '';
        if (data.encrypt == '1') {
            url = unescape(url);
        } else if (data.encrypt == '2') {
            url = unescape(base64Decode(url));
        }
        if (/\.(m3u8|mp4|m4a|mp3)(\?|$)/i.test(url)) {
            return { parse: 0, url: url };
        }
        return { parse: 1, url: input };
    },
    limit: 6,
    double: false,
    推荐: '*',
    一级: 'div.public-list-box;a.time-title&&Text;img.gen-movie-img&&data-src;.public-list-prb&&Text;a.public-list-exp&&href',
    二级: {
        title: '.this-desc-title&&Text;.focus-item-label-original&&Text',
        img: '.this-bj .this-pic-bj&&style',
        desc: '.public-list-prb&&Text',
        content: '#height_limit&&Text',
        tabs: '.anthology-tab .swiper-wrapper a',
        tab_text: 'body&&Text',
        lists: '.anthology-list-box:eq(#id) li',
        list_text: 'a&&Text',
        list_url: 'a&&href'
    },
    搜索: 'json:list;name;pic;;id'
}
