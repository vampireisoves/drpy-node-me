/*
* @File     : 看片狂人.js
* @Author   : OpenAI
* @Date     : 2026-04-19
* @Comments : 初版：先打通分类与一级列表，后续补二级/搜索/播放
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '看片狂人',
  类型: '影视',
  mergeList: true,
  more: {
    mergeList: 1,
  },
  lang: 'ds',
})
*/

var rule = {
    类型: '影视',
    title: '看片狂人',
    host: 'https://www.kpkuang.fun',
    homeUrl: '/',
    url: '/vodtype/fyclass/index-fypage.html',
    searchUrl: '/vodsearch/**-------------.html',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'MOBILE_UA',
        'Referer': 'https://www.kpkuang.fun/'
    },
    timeout: 10000,
    class_name: '电影&连续剧&综艺&动漫&短剧',
    class_url: '1&2&3&4&37',
    play_parse: true,
    lazy: 'js: return input;',
    limit: 6,
    double: false,
    推荐: '.fed-list-info li.fed-list-item;.cinema_title&&Text;a.fed-list-pics&&data-original||src;.fed-list-name&&Text;a.fed-list-pics&&href',
    一级: '.fed-list-info li.fed-list-item;.cinema_title&&Text;a.fed-list-pics&&data-original||src;.fed-list-name&&Text;a.fed-list-pics&&href',
    二级: '*',
    搜索: '*'
}
