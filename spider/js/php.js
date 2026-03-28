/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 0,
  title: '',
  '类型': '影视',
  lang: 'ds'
})
*/
// php@@{"host":"https://jingyu4k-1312635929.cos.ap-nanjing.myqcloud.com/1.json"}@@php测试
var rule = {
    类型: '影视',
    title: '',
    host: '',
    url: '',
    searchUrl: '',
    headers: {'User-Agent': 'UC_UA'},
    searchable: 1,
    quickSearch: 0,
    filterable: 0,
    double: true,
    play_parse: true,
    limit: 6,
    class_name: '电影&电视剧&动漫&短剧&综艺',
    class_url: '1&2&3&4&5',
    hostJs: async function () {
        let {HOST} = this;
        return await request(HOST);
    },
    预处理: async function () {
        log('rule.params:', rule.params);
        try {
            let extObject = JSON5.parse(rule.params);
            log('extObject:', extObject);
        } catch (err) {
            // log('[ERR] extObject:', err);
            log(`[ERR] extObject: ${err.message}`);
        }
    },
    class_parse: async function () {
        let {input, pdfa, pdfh, pd} = this;
        return {}
    },
    lazy: async function () {
        let {input} = this;
        return input
    },
    推荐: async function () {
        let {input, pdfa, pdfh, pd, getProxyUrl} = this;
        let d = [];
        let url = getProxyUrl();
        log('url:', getProxyUrl());
        let html = await request(url, {withHeaders: true, redirect: 0});
        log('html:', html);
        return setResult(d)
    },
    一级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let d = [];
        return setResult(d)
    },
    二级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let VOD = {};
        return VOD
    },
    搜索: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let d = [];
        return setResult(d)
    },
    proxy_rule: async function () {
        return [302, 'text/html', '', {Location: 'https://www.baidu.com'}]
    }
}
