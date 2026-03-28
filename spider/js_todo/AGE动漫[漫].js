var rule = {
    title: 'AGE动漫',
    host: 'https://www.agedm.io',
    url: '/catalog/fyclass',
    searchUrl: '/search?query=**',
    searchable: 2,
    quickSearch: 0,
    headers: {
        'User-Agent': 'MOBILE_UA',
        'Referer': 'https://www.agedm.io/'
    },
    timeout: 5000,
    class_name: '连载&完结&日漫&国漫',
    class_url: 'all-all-all-all-all-time-fypage-all-all-连载&all-all-all-all-all-time-fypage-all-all-完结&all-all-all-all-all-time-fypage-日本-all-all&all-all-all-all-all-time-fypage-中国-all-all',
    play_parse: true,
    lazy: `js:
        var html = request(input);
        var src = pdfh(html, 'iframe#iframeForVideo&&src');
        input = {jx:0, url:src, parse:1, header:rule.headers};
    `,
    limit: 6,
    推荐: 'div.video_item;a&&Text;img&&src;.video_item--info&&Text;a&&href',
    double: true,
    一级: 'div.video_item;a&&Text;img&&src;.video_item--info&&Text;a&&href',
    二级: {
        title: 'h4.detail_imform_name&&Text',
        img: '.video_detail_cover img&&data-original',
        desc: '.video_detail_desc&&Text',
        content: '.detail_imform_list&&Text',
        tabs: '.nav-pills li button',
        lists: '.video_detail_episode'
    },
    搜索: 'div.video_item;a&&Text;img&&src;.video_item--info&&Text;a&&href',
}