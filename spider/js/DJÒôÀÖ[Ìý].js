/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: 'DJ音乐',
  author: 'EylinSir',
  '类型': '影视',
  mergeList: true,
  more: {
    mergeList: 1
  },
  logo: 'https://pic.289.com/up/2023-12/20231219154340126.png',
  lang: 'ds'
})
*/

var rule = {
    title: 'DJ音乐',
    host: 'http://www.djuu.com',
    homeUrl: '/exclusive/115_1.html',
    url: '/djlist/fyclass_fypage.html',
    searchUrl: '/search?musicname=**',
    author: 'EylinSir',
    logo: 'https://pic.289.com/up/2023-12/20231219154340126.png',
    hikerListCol: 'icon_4',
    searchable: 2,
    quickSearch: 0,
    class_name: '迪高串烧&慢摇串烧&慢歌串烧&中文Remix&外文Remix&HOUSE&HOUSE&霓虹风格&Mashup&中文DISCO&外文DISCO',
    class_url: '1&2&3&4&5&6&7&8&9&10',
    headers: {
        'User-Agent': 'PC_UA'
    },
    timeout: 5000,
    limit: 6,
    double: false,
    play_parse: true,
    lazy: async function () {
        let {input} = this;
        log("input:", input);
        let html = await request(input);
        // log(html)
        let music = html.match(/var\s+music\s*=\s*(\{[\s\S]*?\})/)[1];
        music = JSON5.parse(music);
        // log(music);
        // 算法来自:https://www.djuu.com/static/js/common.js
        input = urljoin(input, "//mp4.djuu.com/" + music.file + ".m4a");
        // log(input);
        return input;
    },
    推荐: '*',
    一级: '.list_musiclist tr:gt(0);a&&title;img&&src;.cor999:eq(1)&&Text;a&&href',
    二级: '*',
    搜索: '*;*;*;.sc_1&&Text;*',
}
