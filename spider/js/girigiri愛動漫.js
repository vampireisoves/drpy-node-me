/*
* 站点: bgm.girigirilove.com - girigiri愛動漫
* 站型: MacCMS 自定义模板 (dsn2)
* 播放: player_aaaa JSON, encrypt:2 (base64)
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: 'girigiri愛動漫',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    类型: '影视',
    title: 'girigiri愛動漫',
    host: 'https://bgm.girigirilove.com',
    url: '/show/fyclass--------fypage---/',
    detailUrl: '/GVfyid/',
    searchUrl: '/search/**-------------/',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    filter_url: '{{fl.area}}--{{fl.class}}-{{fl.lang}}---fypage---{{fl.year}}',
    filter: 'H4sIAPrO7GkC/+2V3W4SURDH32WvuZgD9ItXMb3YNMQLkYs2mjSEBEraQq1mMS1K2KhNg2AUtcULPkRfZg8fb+HCOWdmkBseYO72/589M/s/GfgVvKSXKXj+cdb3Mk8K3rPsqZcxMuHl/efZWOnevR59jvVLP/ciu3otv7TPu4tKd2nHwismjBsNStOwal0rXE23WlSzgs5V+LnK2rnXZXbOiOJh8TDhHeX8kxP24Ubjl88exvrDqy2/XDdCXeu4KUa42qz6MK2c25oVrjYtB9NSw9aswJ5X3WgSup5GYM9OXQ/HrqcReK7WoXlW4Lzq+2hUc/OMwHPtS+ppBdYu3i6aX1zNCOx59m3WqLueRmDt051u9VzNCOwZvNHfv7qeRmC+Sm9+V3L5jHC1+d8gvg1bswJr5WsdjlzNCOzZ/KMDtwlW4AYNm7rddxtkBGYIR7ObR5fBCKy9a+vBwNWMcLVF72bav9U/69R5zcJ7+H0WDRqz22t3Faj5Bl01FuEjWyKjcdbHfjQM3BQj8E4C13n5ZHY/5+efstVfSdz8+Y/evFvacvPj0PH7dANLQb/ZCdWsMPNPs/4xm7+S9J8x/BWNJ1vOT0Jy13qrR+bvkL/D/TT5ae6nyE9xP0l+kvuKfMV9IB+Yrw7Qjx+Zv0/+Pvf3yN/jPuVVPK+ivIrnVZRX8byK8iqeV1FexfMqyqt4XkV5Fc8LlBd4XqC8wPMC5QWeFygv8LxAeYHnBcoLPC9QXuB5gfICzwuUF3hegPll/wBWW3pPr6y5yy0vJryU8FH4KHwUPgofhY/Cxw0+xnshgBRACiAFkAJIAaQAcgOQIIAUQAogBZACSAGkAHITkGkBpABSACmAFEAKIAWQm4DcFUAKIAWQAkgBpABSAPkfIIv/AP7vFZnFKgAA',

    headers: {
        'User-Agent': PC_UA,
    },
    timeout: 5000,
    class_name: '日番&美番&劇場版&真人番劇&BD副音軌&演唱會&周邊活動&其他',
    class_url: '2&3&21&20&24&26',
    play_parse: true,
    lazy: async function () {
        let { input, HOST } = this;
        let html = await request(input);
        // 用花括号计数法提取 player_aaaa JSON（含嵌套对象）
        let idx = html.indexOf('player_aaaa=');
        if (idx === -1) return { parse: 1, url: input };
        let start = html.indexOf('{', idx);
        if (start === -1) return { parse: 1, url: input };
        let depth = 0, end = start;
        for (let i = start; i < html.length; i++) {
            if (html[i] === '{') depth++;
            else if (html[i] === '}') {
                depth--;
                if (depth === 0) { end = i; break; }
            }
        }
        let data;
        try {
            data = JSON.parse(html.substring(start, end + 1));
        } catch (e) {
            return { parse: 1, url: input };
        }
        if (data.encrypt == 2 && data.url) {
            let realUrl = unescape(base64Decode(data.url));
            return { parse: 0, jx: 0, url: realUrl };
        }
        if (data.url) {
            return { parse: 0, jx: 0, url: data.url };
        }
        return { parse: 1, url: input };
    },
    double: false,
    推荐: '.public-list-box.public-pic-b;a&&title;img&&data-src;.public-list-prb&&Text;a&&href',
    一级: '.public-list-box.public-pic-b;a&&title;img&&data-src;.public-list-prb&&Text;a&&href',
    二级: {
        title: '.slide-info-title&&Text',
        img: '.detail-pic img&&data-src',
        desc: '.slide-info-remarks:eq(0)&&Text',
        content: '.text.cor3&&Text',
        tabs: '.anthology-tab a',
        lists: '.anthology-list-box:eq(#id) li',
        list_text: 'a&&Text',
        list_url: 'a&&href',
    },
    搜索: async function () {
        let { KEY, HOST } = this;
        if (!KEY) return [];
        let url = HOST + '/index.php/ajax/suggest?mid=1&wd=' + encodeURIComponent(KEY);
        let json = await request(url, {
            headers: {
                'User-Agent': PC_UA,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        let data = JSON.parse(json);
        if (data.code !== 1 || !data.list) return [];
        let vodList = [];
        for (let i = 0; i < data.list.length; i++) {
            vodList.push({
                title: data.list[i].name,
                desc: '',
                pic_url: urljoin(HOST, data.list[i].pic),
                url: '1$/GV' + data.list[i].id + '/',
            });
        }
        return setResult(vodList);
    },
};
