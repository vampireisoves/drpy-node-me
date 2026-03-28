/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '兔小贝[儿]',
  '类型': '影视',
  mergeList: 1,
  more: {
    mergeList: 1
  },
  lang: 'ds'
})
*/

var rule = {
    title: '兔小贝[儿]',
    host: 'https://www.tuxiaobei.com',
    mergeList: 1,
    homeUrl: '',
    url: '/list/mip-data?typeId=fyclass&page=fypage&callback=',
    detailUrl: '/play/fyid',
    searchUrl: '/search/index?key=**',
    searchable: 2,
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    timeout: 5000,
    class_url: '2&3&4&25',
    class_name: '儿歌&故事&国学&启蒙',
    cate_exclude: '应用',
    推荐: '.pic-list.list-box;.items;.text&&Text;mip-img&&src;.all&&Text;a&&href',
    double: true,
    limit: 5,
    play_parse: true,
    lazy: async function () {
        let {input, fetch_params, pdfh} = this;
        fetch_params.headers["user-agent"] = IOS_UA;
        let html = await request(input, fetch_params);
        let src = pdfh(html, "body&&#videoWrap&&video-src");
        return {parse: 0, url: src, js: ''};
    },
    一级: 'json:data.items;name;image;duration_string;video_id',
    二级: '*',
    搜索: '.list-con&&.items;.text&&Text;mip-img&&src;.time&&Text;a&&href',
}