/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '热播之家',
  类型: '影视',
  lang: 'ds'
})
*/

var rule = {
    模板: '首图2',
    title: '热播之家',
    host: 'https://www.rebozj.pro',
    homeUrl: '/',
    url: '/show/fyclass--------fypage---.html',
    searchUrl: '/search/**----------fypage---.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    timeout: 10000,
    headers: {
        'User-Agent': MOBILE_UA,
        'Referer': 'https://www.rebozj.pro/'
    },
    class_name: '电影&电视剧&纪录片&动漫&综艺',
    class_url: '1&2&3&4&5',
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
    },
    搜索: '.stui-vodlist li;a&&title;a&&data-original||img&&data-original||img&&src;.pic-text&&Text;a&&href'
};