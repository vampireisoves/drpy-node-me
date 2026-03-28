/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '爱壹帆',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    title: '爱壹帆',
    host: 'https://www.iyf.lv',
    homeUrl: '/label/new/',
   // url: '/k/fyclass--------fypage---/',
    url: '/t/fyclass/',
    searchUrl: '/s/-------------/?wd=**', 
    searchable: 2, 
    quickSearch: 0, 
    limit: 20,
    double: true, 
    timeout: 5000,
    headers: {
        'User-Agent': 'MOBILE_UA',
    },
    class_name: '电影&剧集&综艺&动漫',
    class_url: '1&2&3&4',
    play_parse: true,
    推荐: '*',
    一级: '.tab-list.active .module-poster-item.module-item;.module-poster-item-title&&Text;.module-item-pic img&&data-original;.module-item-note&&Text;a&&href',
    
    二级: {
        title: 'h1&&Text;.module-info-tag-link:eq(-1)&&Text',
        img: '.lazyload&&data-original',
        desc: '.module-info-item:eq(-2)&&Text;.module-info-tag-link&&Text;.module-info-tag-link:eq(1)&&Text;.module-info-item:eq(2)&&Text;.module-info-item:eq(1)&&Text',
        content: '.module-info-introduction&&Text',
        tabs: '.module-tab-item',
        lists: '.module-play-list:eq(#id) a',
        tab_text: 'div&&Text'
    },
    搜索: 'body .module-item;.module-card-item-title&&Text;.lazyload&&data-original;.module-item-note&&Text;a&&href;.module-info-item-content&&Text'
};