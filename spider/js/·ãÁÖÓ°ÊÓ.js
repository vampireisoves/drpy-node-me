/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '枫林影视',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    title: '枫林影视',
    desc: '枫林影视资源站',
    host: 'https://8maple.st',
    url: '/filter/fyfilter--------fypage---.html',
    searchUrl: '/search/**----------fypage---.html',
    searchable: 2,//是否启用全局搜索,
    quickSearch: 0,//是否启用快速搜索,
    filterable: 0,//是否启用分类筛选,
    filter_url:'{{fl.cateId}}',
    filter:{
        "movie":[{"key":"cateId","name":"分类","value":[{"n":"全部","v":"movie"},{"n":"动作片","v":"action"},{"n":"喜剧片","v":"comedy"},{"n":"科幻片","v":"sciencefiction"},{"n":"恐怖片","v":"horror"},{"n":"爱情片","v":"love"},{"n":"战争片","v":"war"},{"n":"剧情片","v":"drama"},{"n":"动画电影","v":"cartoon"},{"n":"纪录片","v":"documentary"}]}],
        "tv":[{"key":"cateId","name":"分类","value":[{"n":"全部","v":"tv"},{"n":"国产剧","v":"cn"},{"n":"港剧","v":"hk"},{"n":"台剧","v":"tw"},{"n":"韩剧","v":"kr"},{"n":"日剧","v":"jp"},{"n":"美剧","v":"us"},{"n":"泰剧","v":"taidrama"},{"n":"其他剧","v":"etc"}]}],
        "show":[{"key":"cateId","name":"分类","value":[{"n":"全部","v":"show"},{"n":"国产综艺","v":"cntvshow"},{"n":"日韩综艺","v":"jpkrtvshow"},{"n":"欧美综艺","v":"ustvshow"},{"n":"港台综艺","v":"twhktvshow"}]}],
        "anime":[{"key":"cateId","name":"分类","value":[{"n":"全部","v":"anime"},{"n":"日韩动漫","v":"jpkranime"},{"n":"国产动漫","v":"cnanime"},{"n":"欧美动漫","v":"usanime"}]}]
    },
    filter_def:{
        movie:{cateId:'movie'},
        tv:{cateId:'tv'},
        show:{cateId:'show'},
        anime:{cateId:'anime'}
    },
    headers: { //网站的请求头,完整支持所有的,常带ua和cookies
        'User-Agent': 'MOBILE_UA',
        // "Cookie": "searchneed=ok"
    },
    class_name:'电影&电视剧&综艺&动漫',
    class_url:'movie&tv&show&anime',
    play_parse: true,
    limit: 6,
    double: true, // 推荐内容是否双层定位
    
    预处理: async () => {
        return [];
    },
    
    推荐: async function (tid, pg, filter, extend) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, 'ul.myui-vodlist.clearfix li');
        data.forEach((it) => {
            let title = pdfh(it, 'a&&title');
            let url = pd(it, 'a&&href');
            let id = url.match(/\/(\d+)\.html/)?.[1] || '';
            let pic_url = pd(it, 'a&&data-original');
            if (pic_url && !pic_url.startsWith('http')) {
                pic_url = this.host + pic_url;
            }
            let desc = pdfh(it, '.pic-text&&Text');
            d.push({
                title: title,
                pic_url: pic_url,
                desc: desc,
                url: url,
                id: id
            });
        });
        return setResult(d);
    },
    
    一级: async function (tid, pg, filter, extend) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.myui-vodlist li');
        data.forEach((it) => {
            let title = pdfh(it, 'a&&title');
            let url = pd(it, 'a&&href');
            let id = url.match(/\/(\d+)\.html/)?.[1] || '';
            let pic_url = pd(it, 'a&&data-original');
            if (pic_url && !pic_url.startsWith('http')) {
                pic_url = this.host + pic_url;
            }
            let desc = pdfh(it, '.pic-text:eq(1)&&Text');
            d.push({
                title: title,
                pic_url: pic_url,
                desc: desc,
                url: url,
                id: id
            });
        });
        return setResult(d);
    },
    
    二级: async function (ids) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};
        
        // 提取标题
        VOD.vod_name = pdfh(html, '.myui-content__detail .title&&Text') || '';
        if (VOD.vod_name) {
            VOD.vod_name = VOD.vod_name.split('/')[0].trim();
        }
        
        // 提取图片
        VOD.vod_pic = pd(html, '.myui-content__thumb .lazyload&&data-original') || '';
        if (VOD.vod_pic && !VOD.vod_pic.startsWith('http')) {
            VOD.vod_pic = this.host + VOD.vod_pic;
        }
        
        // 提取简介
        VOD.vod_content = pdfh(html, '.content&&Text') || '';
        
        // 提取导演、主演、年份、地区等信息
        let detailTexts = pdfa(html, '.myui-content__detail p');
        detailTexts.forEach((p) => {
            let text = pdfh(p, 'Text') || '';
            if (text.includes('导演：')) {
                VOD.vod_director = text.replace('导演：', '').trim();
            } else if (text.includes('主演：')) {
                VOD.vod_actor = text.replace('主演：', '').trim();
            } else if (text.includes('年份：')) {
                VOD.vod_year = text.replace('年份：', '').trim();
            } else if (text.includes('地区：')) {
                VOD.vod_area = text.replace('地区：', '').trim();
            } else if (text.includes('语言：')) {
                VOD.vod_lang = text.replace('语言：', '').trim();
            } else if (text.includes('类型：')) {
                VOD.vod_type = text.replace('类型：', '').trim();
            }
        });
        
        // 提取播放列表
        let tabs = pdfa(html, '.nav-tabs:eq(0) li');
        let lists = pdfa(html, '.myui-content__list');
        let playmap = {};
        
        tabs.forEach((tab, i) => {
            const form = pdfh(tab, 'Text');
            const list = lists[i];
            if (list) {
                const items = pdfa(list, 'li');
                const playItems = [];
                items.forEach((item) => {
                    let title = pdfh(item, 'a&&Text');
                    let urls = pd(item, 'a&&href', input);
                    if (title && urls) {
                        playItems.push(title + "$" + urls);
                    }
                });
                if (playItems.length > 0) {
                    playmap[form] = playItems;
                }
            }
        });
        
        VOD.vod_play_from = Object.keys(playmap).join('$$$');
        const urls = Object.values(playmap);
        const playUrls = urls.map((urllist) => {
            return urllist.join("#");
        });
        VOD.vod_play_url = playUrls.join('$$$');
        
        return VOD;
    },
    
    搜索: async function (wd, quick, pg) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '#searchList li');
        data.forEach((it) => {
            let title = pdfh(it, 'a&&title');
            let url = pd(it, 'a&&href');
            let id = url.match(/\/(\d+)\.html/)?.[1] || '';
            let pic_url = pd(it, '.lazyload&&data-original');
            if (pic_url && !pic_url.startsWith('http')) {
                pic_url = this.host + pic_url;
            }
            let desc = pdfh(it, '.text-muted&&Text');
            let content = pdfh(it, '.text-muted:eq(-1)&&Text');
            d.push({
                title: title,
                pic_url: pic_url,
                desc: desc,
                content: content,
                url: url,
                id: id
            });
        });
        return setResult(d);
    },
    
    lazy: async function (flag, id, flags) {
        let {input} = this;
        let html = await request(input);
        let match = html.match(/r player_.*?=(.*?)<\/script>/);
        if (match?.[1]) {
            let playerData = JSON.parse(match[1]);
            let url = playerData.url;
            if (playerData.encrypt === '1') {
                url = unescape(url);
            } else if (playerData.encrypt === '2') {
                url = unescape(base64Decode(url));
            }
            if (/m3u8|mp4/.test(url)) {
                return {parse: 0, url: url};
            }
        }
        return {parse: 0, url: input};
    }
};