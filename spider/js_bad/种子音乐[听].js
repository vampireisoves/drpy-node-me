var rule = {
    title: '种子音乐[听]',
    host: 'https://www.zz123.com',
    homeUrl: '/list/mszm.htm?page=1',
    url: '/fyclass.htm?page=fypage',
    searchUrl: '/ajax/?act=search&key=**&lang=',
    detailUrl: '/play/fyid.html',
    author: 'EylinSir',
    limit: 6,
    searchable: 2,
    quickSearch: 0,
    headers: {
        'User-Agent': 'MOBILE_UA',
        'referer': 'https://www.zz123.com/',
    },
    class_parse: '.aside-menu-list.channel&&[href*=list];a&&Text;a&&href;.(list.*).htm',
    play_parse: true,
    sniffer:1,
    isVideo:"http((?!http).){26,}\\.(m3u8|mp4|flv|avi|mkv|wmv|mpg|mpeg|mov|ts|3gp|rm|rmvb|asf|m4a|mp3|wma)",
    lazy: async function(flag, id) {
        let url = id.replace(/play\/(\w+)\.htm/, 'ajax/?act=songinfo&id=$1&lang=');
        let data = JSON.parse(await request(url, {
            headers: rule.headers
        }));
        let songData = data.data;
        return {
            parse: 0,
            url: songData.mp3,          // 播放链接
            header: rule.headers,        // 请求头
            lrc: songData.lrc,           // 歌词内容
            img: songData.pic,           // 封面图片
            title: songData.mname,       // 歌名
            singer: songData.sname       // 歌手
        };
    },
    推荐: "*",
    一级: '.mobile-list&&.mobile-list-item;.songname&&Text;.lazyload&&data-src;.authorname&&Text;a&&href',
    二级: '*',
    搜索: 'json:data;mname;pic;sname;id',
}