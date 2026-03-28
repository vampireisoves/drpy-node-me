/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 1,
  title: '999片',
  author: 'EylinSir优化251201',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    author: 'EylinSir优化251201',
    title: '999片',
    类型: '影视',
    host: 'https://www.998pian.com',
    searchable: 2,
    quickSearch: 1,
    filterable: 1,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; M2102J2SC Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.7390.17 Mobile Safari/537.36'
    },
    
    url: '/vodshow/fyclass--------fypage---.html',
    searchUrl: '/vodsearch/**----------fypage---.html',
    搜索: '*',
    推荐: '*',
    class_name: '电影&电视剧&综艺&动漫&短剧',
    class_url: 'dianying&dianshiju&zongyi&dongman&duanju',
    一级: '.hl-lazy;a&&title;a&&data-original;.hl-lc-1&&Text;a&&href',
    二级: {
        title: 'h2&&Text;li:contains(分类)&&Text',
        img: '.hl-lazy&&data-original',

        desc: 'li:contains(更新)&&Text;li:contains(年份)&&Text;li:contains(地区)&&Text;li:contains(演员)&&Text;li:contains(导演)&&Text',
        content: '.blurb&&Text',
        tabs: '.hl-tabs-btn',           
         tab_text: 'Text',              
          lists: '.hl-list-wrap:eq(#id) li',   
          list_text: 'a&&Text',           
           list_url: 'a&&href'            
    },
    sniffer: 0,
    isVideo: 'http((?!http).){26,}\\.(m3u8|mp4|flv|avi|mkv|wmv|mpg|mpeg|mov|ts|3gp|rm|rmvb|asf|m4a|mp3|wma)',
    play_parse: true,
    lazy: async function lazyFunc() {
    let html = await request(input);
    let kcode = JSON.parse(html.split('aaaa=')[1].split('<')[0]);
    let kurl = kcode.url;
    if (/\.(m3u8|mp4)/.test(kurl)) {
        input = { 
            jx: 0, 
            parse: 0, 
            url: kurl, 
            header: {
                'User-Agent': MOBILE_UA, 
                'Referer': getHome(kurl)
            }
        };
    } else {
        input = { 
            jx: 0, 
            parse: 1, 
            url: input 
        };
    }
}

}
