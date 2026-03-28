/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '包子漫画',
  '类型': '漫画',
  logo: 'https://cn.czmanga.com/favicon.ico',
  lang: 'ds'
})
*/

var rule = {
    title: '包子漫画',
    类型: '漫画',
    logo: 'https://cn.czmanga.com/favicon.ico',
    host: 'https://cn.czmanga.com',
    url: '/classify?region=fyclass&fyfilter',
    filter_url: 'type={{fl.type}}&state={{fl.state}}&filter={{fl.filter}}',
    filter: 'H4sIAAAAAAAAA42TW3PSQBSA/0seO3XGV/vmXev9bnX6sNKUrA2bFrIKdJgBIr0qUp0p+oJ1WgTGQq06iAXsn2GT8C/cpGfZ5cXx7ez35ezZcza7rE1oU0+XtQU9pU1pCRvZujapERTT+dLbaLvZHF+/QCbVw+8Ix6xQHzr1APMFMk0tM3ki/OOK3+8POk1wCT2OkdTs13fWeu1134NepM+0zGxgT6rbqUW1+GGXVTb/v7ib2/TWDkGYGBGER847OpAuYlDVsbd7w90iuCid10lUul7ed/rgUpiozs3ve9tb4JIUkZSy53rNdQrgntMlrOR5tS32uwtuQTd4psyrrkq3hMecV3wlXVBv3DaO/faG7JAfhw9ttO/Ku+HHBtiYRZNYSXWLda+0AtKm2JR9uM0vgz87oF4GaVLt9NztshibPmdRqdY+DI7WQaUNRNKGOjjPafqfs6DjehLLc7qlircvZhpFFi9oySb2aqz6Y9ARM5hDhKYNWXbo9FknLyRNGEof2a6/mxMnskg0ov4ApSJrfQVpWDRqqbdcrrJORxwWR3g3Ug4/NdzeKBORmHqV3/g1/xQPwUAWUWfOCm3WckYXbaOxhzCPTVuPy6fAmmX34M2/n8LEaO+z585fABiGgl+8dPkK8DAU/Or0tevAw1DwGzdv3QYehoLfuXvvPvAwFPzBw0eAg0jQxzNPgAaRoKdPnQEaRLz32cxfZbwNSYoEAAA=',
    searchUrl: '/search?q=wd',
    searchable: 2,
    quickSearch: 0,
    headers: {
        'User-Agent': 'MOBILE_UA',
    },
    timeout: 5000,
    class_name: '全部&国漫&日本&韩国&欧美',
    class_url: 'all&cn&jp&kr&en',
    play_parse: true,
    // lazy: $js.toString(async () => {
    //     input = input.replace('https://www.twbzmg.com/', 'https://www.twbzmg.com/');
    //     log('input:', input);
    //     let html = await request(input);
    //     let pics = pdfa(html, 'ul.comic-contain&&amp-img');
    //     pics = pics.map(it => pdfh(it, 'amp-img&&src'));
    //     return {parse: 0, url: pics.join('&&')};
    // }),
    lazy: async function () {
        let {input} = this;
        input = input.replace('https://www.twbzmg.com/', 'https://www.twbzmg.com/');
        log('input:', input);
        let html = await request(input);
        let pics = pdfa(html, 'ul.comic-contain&&amp-img');
        pics = pics.map(it => pdfh(it, 'amp-img&&src'));
        return {parse: 0, url: pics.join('&&')};
    },
    limit: 6,
    推荐: '.comics-card;h3&&Text;amp-img&&src;.text-truncate&&Text;a&&href',
    double: false,
    一级: '.classify-items .comics-card;h3&&Text;amp-img&&src;.text-truncate&&Text;a&&href',
    // 二级: {
    //     "title": ".comics-detail__title&&Text&&Text",
    //     "img": "amp-img&&src",
    //     //desc: '主要信息;年代;地区;演员;导演',
    //     "desc": ".comics-detail__author&&Text;.tag-list span:eq(0)&&Text;;;;",
    //     "content": ".comics-detail__desc&&Text",
    //     "tabs": ".section-title",
    //     "lists": "#chapter-items a.comics-chapters__item,#chapters_other_list a.comics-chapters__item"
    // },
    二级: async function () {
        let {input, orId, HOST, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};
        VOD.vod_name = pdfh(html, '.comics-detail__title&&Text');
        VOD.type_name = '';
        VOD.vod_pic = pd(html, 'amp-img&&src');
        VOD.vod_content = pdfh(html, '.comics-detail__desc&&Text');
        VOD.vod_remarks = pdfh(html, '.tag-list span:eq(0)&&Text');
        VOD.vod_year = '';
        VOD.vod_area = '';
        VOD.vod_actor = pdfh(html, '.comics-detail__author&&Text');
        VOD.vod_director = '';
        VOD.vod_play_from = '包子漫画';
        let list1 = pdfa(html, '#chapter-items a.comics-chapters__item');
        let list2 = pdfa(html, '#chapters_other_list a.comics-chapters__item');
        let list = list1.concat(list2);
        // log(list.length);
        let urls = [];
        list.forEach(item => {
            let title = pdfh(item, 'a&&Text');
            let url = pd(item, 'a&&href');
            urls.push(title + '$' + url);
        });
        // log(urls);
        VOD.vod_play_url = urls.join('#');
        return VOD
    },
    搜索: '*',
}
