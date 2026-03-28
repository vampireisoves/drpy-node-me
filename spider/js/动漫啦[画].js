/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '动漫啦',
  author: 'EylinSir',
  '类型': '漫画',
  logo: 'https://www.dongman.la/favicon.ico',
  lang: 'ds'
})
*/

var rule = {
    类型: '漫画',
    author: 'EylinSir',
    title: '动漫啦',
    host: 'https://www.dongman.la',
    url: '/manhua/fyclass/fypage.html',
    searchUrl: '/manhua/so/**/fypage.html',
    logo: 'https://www.dongman.la/favicon.ico',
    searchable: 2,
    quickSearch: 0,
    timeout: 5000,
    limit: 20,
    play_parse: true,
    class_name: '日本&国产&港台&欧美&韩漫&完结&连载中',
    class_url: 'japan&guochan&hongkongtaiwan&oumei&hanguo&finish&serial',
    headers: {
        'User-Agent': 'PC_UA',
        'Referer': 'https://www.dongman.la/',
    },
    
    _parseList: function(html) {
        return pdfa(html, '.cy_list_mh ul').map(ul => {
            let title = pdfh(ul, 'li a.pic img&&alt');
            let href = pdfh(ul, 'li a.pic&&href');
            if (!title || !href) return null;
            let img = pdfh(ul, 'li a.pic img&&src');
            return {
                title: title.replace(/(漫画|在线观看)/g, '').trim(),
                img: img.startsWith('//') ? 'https:' + img : img,
                desc: pdfh(ul, '.updata&&Text').replace('最新：', '').trim(),
                url: href,
                year: pdfh(ul, '.zuozhe&&Text').replace('状态：', '').trim()
            };
        }).filter(Boolean);
    },

    推荐: async function(tid, pg, filter, extend) {
        return await this.一级(tid, pg, filter, extend);
    },

    一级: async function(tid, pg, filter, extend) {
        let url = this.input;
        return setResult(this._parseList(await request(url)));
    },

    二级: async function(ids) {
        let url = this.input;
        let html = await request(url);
        let playUrls = pdfa(html, '#play_0 li').map(it => {
            let u = pdfh(it, 'a&&href');
            let t = pdfh(it, 'a&&Text');
            return (u && !u.includes('javascript')) ? t + '$' + u : null;
        }).filter(Boolean);
        return {
            vod_name: pdfh(html, '.detail-info-title&&Text'),
            vod_pic: pdfh(html, 'img.pic&&src'),
            vod_content: pdfh(html, '#comic-description&&Text').replace(/(详细简介↓|收起↑)/g, "").trim(),
            vod_play_from: "动漫啦",
            vod_play_url: playUrls.reverse().join('#'),
            vod_area: (pdfh(html, '.cy_xinxi&&Text').match(/地区：(\S+)/) || [])[1] || '',
            vod_director: pdfh(html, '.detail-info-author&&Text').replace('作者：', '').trim()
        };
    },

    搜索: async function(wd, quick, pg) {
        let url = this.input;
        return setResult(this._parseList(await request(url)));
    },

    lazy: async function(flag, id, flags) {
        let url = this.input;
        let header = { 'User-Agent': this.headers['User-Agent'], 'Referer': url };
        let imgs = [];
        let tryUrls = [url.replace(/\.html$/, '') + '/all.html', url];
        for (let u of tryUrls) {
            let html = await request(u);
            let regex = /(?:data-original|data-src|src)=["']([^"']+\.(?:jpg|png|jpeg|webp|bmp))/gi;
            let match;
            while ((match = regex.exec(html)) !== null) {
                let src = match[1];
                if (/logo|icon|loading|hm\.baidu/.test(src)) continue;
                if (src.startsWith('//')) src = 'https:' + src;
                else if (src.startsWith('/')) src = this.host + src;
                if (!imgs.includes(src)) imgs.push(src);
            }
            if (imgs.length > 0) break;
        }
        if (imgs.length > 0) {
            return { parse: 0, url: 'pics://' + imgs.join('&&'), header: header };
        }
    }
};