// 网址发布页 https://ddys.site
// 网址发布页 https://ddys.wiki
// 网址发布页 https://ddys.info/
var rule = {
    title: 'ddys',
    // host: 'https://ddys.pro',
    host: 'https://ddys.mov/',
    /*host: 'https://ddys.info',
    hostJs: async function () {
        let{HOST}=this
        let html = await request(HOST,{headers: {'User-Agent': MOBILE_UA}});
        HOST = pdfh(html, 'a&&href');
        return HOST;
    },*/
    url: '/fyclass/page/fypage/',
    searchUrl: '/?s=**&post_type=post',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'PC_UA',
    },
    class_name: '电影&电视剧&动漫',
    class_url: 'category/movie&category/airing&category/anime/new-bangumi',
    /*class_parse:async function () {
        let {pdfa,pdfh,pd} = this;
        let html =await request(rule.host,{
            headers: {
                'User-Agent': MOBILE_UA,
            //    'Cookie':'X_CACHE_KEY=7791d8c9a761b51365e524f94a3af24f;cf_clearance=QJy.5hM8B_sizwwOLwIEq5uQYdmI70G.bK_f8ez0_qI-1736495334-1.2.1.1-80gPwpLxtdQfr_HFCYZKzpeTL4LFVqdrmU.bw3X.57Nri3h7_T74oKHp7ZY6N8moX93fPBUi1mBaVD4Cla6PWLyJjiZriZJhgFQCoaNjDG_dy3v2.akBe0I_NG4zySGqfQcg2OS6yTvCr7nOHHJleZzhfnBOUV55g0hY53Y.0JOTjokDX2VJYDGBmGdUI4M0ZsbDha9m1q2R5doUrv.a29t1_PaeZ4vthayxR2vOqNsPO_R.glP4n9hatQzykhMKBpemNQlt5Sn7xTeT2EcdJXMttSpiUHABW725F4sDtEd9EaQAS1VAtRTG4kw4KjvK4Y_brvnf5DRSRH_ZGsqL.UDPxGAFdDfh9EX_bQJhwsMXgCkR9wvgdQB.tr7hymwiVYEXichdgzVosdkQ7TDq2g',
            //    'Priority':'u=0, i'
            },
            method:'GET'
        })
        log(html)
        let d = [];
        let data = pdfa(html, '#primary-menu li.menu-item');
        data.forEach((it) => {
            let id=pd(it, 'a&&href').match(/\.pro\/(.*)/)[1]
            log(id)
            d.push({
                type_name: pdfh(it, 'a&&Text'),
                type_id: id,
            })
        });
        log(d)
        return {
            class: d
        }
    },*/
    //class_parse: '#primary-menu li.menu-item;a&&Text;a&&href;\.pro/(.*)',
    //cate_exclude: '站长|^其他$|关于|^电影$|^剧集$|^类型$',
    double: false,
    play_parse: true,

    lazy: async function () {
        let {input} = this
        return input
    },
    limit: 6,
    推荐: async function () {
        return []
    },
    一级: async function () {
        let {input, pdfa, pd, pdfh} = this;
        var d = [];
        var html = await request(input);
        // log(html);
        let list = pdfa(html, '.post-box-list&&article');
        list.forEach(it => {
            d.push({
                title: pdfh(it, 'a:eq(-1)&&Text'),
                img: pd(it, '.post-box-image&&style'),
                desc: pdfh(it, 'a:eq(0)&&Text'),
                url: pd(it, 'a:eq(-1)&&href'),
            })
        });
        return setResult(d);
    },
    //一级: '.post-box-list&&article;a:eq(-1)&&Text;.post-box-image&&style;a:eq(0)&&Text;a:eq(-1)&&href',
    二级: async function () {
        let {input, pdfa, pdfh} = this;
        let html = await request(input);
        let VOD = {};
        VOD.vod_name = pdfh(html, '.post-title&&Text');
        VOD.vod_content = pdfh(html, '.abstract&&Text');
        var playurls = [];
        var playfrom = [];
        let src = pdfh(html, ".wp-playlist-script&&Html");
        src = JSON.parse(src).tracks;
        src.forEach(it => {
            let purl = "https://v.ddys.pro" + it.src0;
            playfrom.push('播放');
            playurls.push(unescape(it.caption) + "$" + purl)
        })
        var plists = pdfa(html, '.entry&&p:has(a[href])')
        let p_1 = plists.map(v => pdfh(v, 'a&&title') + '$push://' + pdfh(v, 'a&&href')).filter(v => v.includes('uc'));
        playurls.push(p_1)
        let p_2 = plists.map(v => pdfh(v, 'a&&title') + '$push://' + pdfh(v, 'a&&href')).filter(v => v.includes('quark'));
        playurls.push(p_2)
        let tabs = ['UC网盘', '夸克网盘']
        playfrom.push(tabs)
        VOD.vod_play_from = playfrom.join("$$$")
        VOD.vod_play_url = playurls.join("$$$")
        return VOD
    },

    搜索: async function () {
        let {
            input,
            pdfa,
            pdfh,
            pd
        } = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '#main&&article');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, '.post-title&&Text'),
                pic_url: pd(it, '.post-box-image&&style'),
                desc: pdfh(it, '.published&&Text'),
                url: pd(it, 'a&&href')
            })
        });
        return setResult(d)
    }
    //搜索: '#main&&article;.post-title&&Text;;.published&&Text;a&&href'
}
