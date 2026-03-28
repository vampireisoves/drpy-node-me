var rule = {
    title: '[画]',
    类型: '漫画',
    host: '',
    url: '/fyclass/index_fypage.html',
    class_parse: '#menu-main-menu&&li:lt(15);a&&Text;a&&href;.*/(.*?)/',
    cate_exclude: '',
    hikerListCol: "movie_3",
    hikerClassListCol: "movie_3",
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'MOBILE_UA',
    },
    play_parse: true,
    lazy: async function () {
        let {input, pdfa, pdfh} = this;
        // console.log('input:', input);
        input = input.split('@@')[0];
        let html = await request(input);
        let arr = pdfa(html, '.single-content&&img');
        let urls = [];
        arr.forEach((it) => {
            let src = pdfh(it, 'img&&data-src');
            src += '@Referer=' + rule.host;
            urls.push(src);
        });
        return {
            parse: 0,
            url: 'pics://' + urls.join('&&'),
            js: '',
            header: {
                referer: rule.host,
                'user-agent': MOBILE_UA
            }
        };
    },
    推荐: '*',
    searchUrl: '/sou-**-fypage.html',
    一级: '#content&&article;h2&&Text;img&&data-src;;a&&href',
    二级: '*',
    搜索: '*',
}