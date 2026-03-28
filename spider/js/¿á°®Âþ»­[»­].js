/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '酷爱漫画',
  author: 'EylinSir',
  '类型': '漫画',
  logo: 'https://www.kuimh.com/static/images/favicon.ico',
  lang: 'ds'
})
*/

var rule = {
    类型: '漫画',
    author: 'EylinSir',
    title: '酷爱漫画',
    host: 'https://www.kuimh.com',
    logo: 'https://www.kuimh.com/static/images/favicon.ico',
    searchUrl: '/search?keyword=**&page=fypage',
    url: '/booklist?tag=fyfilter&area=fyclass&end=fyfilter&page=fypage',
    searchable: 2,
    quickSearch: 0,
    timeout: 5000,
    play_parse: true,
    headers: {
        'User-Agent': 'PC_UA',
        'Referer': 'https://www.kuimh.com'
    },
    class_name: '国产&日本&韩国&欧美&其他',
    class_url: '1&2&3&5&7',
    filter: {
        "1": [
            {"key":"tag","name":"题材","value":[{"n":"全部","v":"全部"},{"n":"恋爱","v":"恋爱"},{"n":"古风","v":"古风"},{"n":"校园","v":"校园"},{"n":"奇幻","v":"奇幻"},{"n":"大女主","v":"大女主"},{"n":"治愈","v":"治愈"},{"n":"穿越","v":"穿越"},{"n":"励志","v":"励志"},{"n":"爆笑","v":"爆笑"},{"n":"萌系","v":"萌系"},{"n":"玄幻","v":"玄幻"},{"n":"日常","v":"日常"},{"n":"都市","v":"都市"},{"n":"彩虹","v":"彩虹"},{"n":"灵异","v":"灵异"},{"n":"悬疑","v":"悬疑"},{"n":"少年","v":"少年"}]},
            {"key":"end","name":"状态","value":[{"n":"全部","v":"-1&last=-1"},{"n":"最新","v":"-1&last=1"},{"n":"连载","v":"0&last=-1"},{"n":"完结","v":"1&last=-1"}]}
        ]
    },

    parseList: function(html) {
        return pdfa(html, '.mh-item').map(it => {
            let pic = pdfh(it, 'img&&data-src');
            if (!pic) pic = (pdfh(it, 'html').match(/https?:\/\/[^"']+\.(?:jpg|png|jpeg)(?:\/\d+)?/i) || [])[0];
            return {
                title: pdfh(it, '.title a&&Text'),
                pic_url: pic,
                desc: pdfh(it, '.chapter&&Text'),
                url: pdfh(it, 'a&&href')
            };
        });
    },

    推荐: async function(tid, pg, filter, extend) {
        return await this.一级('1', 1, filter, {});
    },

    一级: async function(tid, pg, filter, extend) {
        let url = `${this.host}/booklist?tag=${extend.tag || '全部'}&area=${tid}&end=${extend.end || '-1&last=-1'}&page=${pg}`;
        let html = await request(url, { headers: this.headers });
        return setResult(this.parseList(html));
    },

    二级: async function(ids) {
        let vid = ids[0];
        let url = this.input;
        let html = await request(url);
        let tabs = pdfa(html, '#detail-list-select li');
        let playUrls = tabs.map(it => {
            let name = pdfh(it, 'a&&Text');
            let u = pdfh(it, 'a&&href');
            return name.trim() + '$' + u;
        }).join('#');
        return {
            vod_name: pdfh(html, '.info h1&&Text').trim() || "未知",
            vod_pic: pdfh(html, '.cover img&&src'),
            vod_content: pdfh(html, '.content&&Text').trim(),
            vod_play_from: "酷爱漫画",
            vod_play_url: playUrls + "$$$" + playUrls
        };
    },

    搜索: async function(wd, quick, pg) {
        let url = this.input;
        let html = await request(url, { headers: this.headers });
        return setResult(this.parseList(html));
    },

    lazy: async function () {
        let { input } = this;
        let url = input.startsWith('http') ? input : this.host + input;
        let html = await request(url, { headers: { 'Referer': url } });
        let pattern = /(https?:\/\/[^"'\s<>]+\.(?:jpg|png|jpeg|webp)(?:\/\d+)?)/gi;
        let matches = html.match(pattern) || [];
        let imgs = [];
        matches.forEach(src => {
            if (/grey\.gif|logo|icon|tu\.petatt\.cn/.test(src)) return;
            src = src.replace(/\\/g, '/');
            if (!imgs.includes(src)) imgs.push(src);
        });
        return { 
            parse: 0, 
            url: imgs.length ? 'pics://' + imgs.join('&&') : url,
            header: { 'Referer': url }
        };
    }
};
// 自动填充其他分类
['2','3','5','7'].forEach(k => rule.filter[k] = rule.filter['1']);