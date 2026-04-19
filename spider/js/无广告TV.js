/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '无广告TV',
  类型: '影视',
  lang: 'ds'
})
*/

var rule = {
    模板: 'mxpro',
    title: '无广告TV',
    host: 'https://www.5ggtv.com',
    homeUrl: '/',
    url: '/vodshow/fyclass--------fypage---.html',
    searchUrl: '/vodsearch/**----------fypage---.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    timeout: 15000,
    headers: {
        'User-Agent': MOBILE_UA,
        'Referer': 'https://www.5ggtv.com/'
    },
    class_name: '电影&电视剧&综艺&动漫&短剧',
    class_url: '1&2&3&4&23',
    class_parse: '',
    一级: '.module-items&&.module-poster-item.module-item;.module-poster-item-title&&Text;img&&data-original||src;.module-item-note&&Text;a&&href',
    搜索: '.module-card-item.module-item;strong&&Text;img&&data-original||src;.module-item-note&&Text;a&&href;.module-info-item-content:eq(1)&&Text',
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