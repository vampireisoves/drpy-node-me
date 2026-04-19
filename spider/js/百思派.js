/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '百思派',
  类型: '影视',
  lang: 'ds'
})
*/

var rule = {
    模板: '首图2',
    title: '百思派',
    host: 'https://www.bestpipe.cn',
    homeUrl: '/',
    url: '/vodshow/fyclass--------fypage---.html',
    searchUrl: '/vodsearch/**----------fypage---.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    timeout: 10000,
    headers: {
        'User-Agent': MOBILE_UA,
        'Referer': 'https://www.bestpipe.cn/'
    },
    class_name: '电影&剧集&短剧&动漫&综艺',
    class_url: '20&21&24&22&23',
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