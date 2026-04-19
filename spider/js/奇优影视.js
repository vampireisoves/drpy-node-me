/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '奇优影视',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    title: '奇优影视',
    host: 'http://www.dyxz4.com',
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    模板: '首图2',
    url: '/list/fyclass_fypage.html?order=fyfilter',
    filter_url: '{{fl.order}}',
    searchUrl: '/search.php#searchword=**;post',
    // 使用 class_parse 动态抓取分类，避免在代码中硬编码“伦理”等敏感词
    // class_parse 语法：节点选择器;分类名选择器;分类链接选择器;链接正则提取分类ID
    class_parse: '.stui-header__menu li;a&&Text;a&&href;.*/list/(.*?).html',
    play_parse: true,
    filterable: 1,
    filter: {
        '*': [
            {
                "key": "order",
                "name": "排序",
                "value": [
                    { "n": "全部", "v": "" },
                    { "n": "按时间", "v": "time" },
                    { "n": "按人气", "v": "hit" }
                ]
            }
        ]
    },
    lazy: `js:
        let html = await request(input);
        let src = pdfh(html, "iframe&&src");
        
        if (src) {
            // 如果提取到的 iframe src 已经是直链 (如 m3u8/mp4)
            if (src.includes('.m3u8') || src.includes('.mp4')) {
                input = { parse: 0, url: src, jx: 0 };
            } else {
                // 如果不是直链，返回给客户端继续嗅探
                input = { parse: 1, url: src, jx: 0 };
            }
        } else {
            // 如果没有提取到 iframe，将当前输入原样返回去嗅探
            input = { parse: 1, url: input, jx: 0 };
        }
        return input;
    `,
    二级: {
        title: 'h1.line1&&Text',
        img: '.stui-content__thumb .lazyload&&data-original',
        desc: '.stui-content__detail p.data:eq(2)&&Text',
        content: '#desc .col-pd&&Text',
        tabs: '.nav-tabs a',
        lists: '.stui-content__playlist li'
    }
}
