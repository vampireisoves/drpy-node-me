/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '耐看影视',
  author: 'EylinSir',
  类型: '影视',
  logo: 'https://nkvod.org/upload/site/20241223-1/7c00a9d60fffa62f46be199e52d6cc85.png',
  lang: 'ds',
})
*/

var rule = {
    类型: '影视',
    author: 'EylinSir',
    title: '耐看影视',
    host: 'https://nkvod.org',
    url: '/t/fyclass/',
    searchUrl: '/search.html?wd=**',
    logo: 'https://nkvod.org/upload/site/20241223-1/7c00a9d60fffa62f46be199e52d6cc85.png',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    play_parse: true,
    searchCookie: '',
    class_name: '电影&剧集&动漫&综艺',
    class_url: '1&2&4&3',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; ALN-AL00 Build/HUAWEIALN-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36',
        'Referer': 'https://nkvod.org/'
    },
    cateMap: {
        '1': 'dianying',
        '2': 'lianxuju',
        '3': 'zongyi',
        '4': 'dongman'
    },
    typeMap: {
        '1': {
            '动作片': 'dongzuopian',
            '喜剧片': 'xijupian',
            '爱情片': 'aiqingpian',
            '科幻片': 'kehuanpian',
            '恐怖片': 'kongbupian',
            '剧情片': 'juqingpian',
            '战争片': 'zhanzhengpian',
            '电影解说': 'dyjs'
        },
        '2': {
            '国产剧': 'guochanju',
            '港台剧': 'gangtaiju',
            '日韩剧': 'rihanju',
            '欧美剧': 'oumeiju'
        },
        '3': {
            '大陆综艺': 'daluzy',
            '日韩综艺': 'rihanzy',
            '港台综艺': 'gangtaizy',
            '欧美综艺': 'oumeizy'
        },
        '4': {
            '国产动漫': 'gcdm',
            '日韩动漫': 'rihandm',
            '欧美动漫': 'oumeidm',
            '港台动漫': 'gangtaidm',
            '海外动漫': 'haiwaidm'
        }
    },

    updateCookie: function(c) {
        if (!c) return;
        let cArr = Array.isArray(c) ? c : [c];
        let dict = {};
        if (this.searchCookie) {
            this.searchCookie.split(';').forEach(i => {
                let p = i.split('=');
                if (p.length >= 2) dict[p[0].trim()] = p.slice(1).join('=');
            });
        }
        cArr.forEach(i => {
            let kv = i.split(';')[0].trim();
            let p = kv.split('=');
            if (p.length >= 2) dict[p[0].trim()] = p.slice(1).join('=');
        });
        let res = [];
        for (let k in dict) res.push(k + '=' + dict[k]);
        this.searchCookie = res.join(';');
    },

    CryptoTool: {
        getrandom: function(b) {
            try {
                let string = b.substring(10);
                let words = CryptoJS.enc.Base64.parse(string);
                let substr = CryptoJS.enc.Latin1.stringify(words);
                if (!substr) return '';
                let data2 = substr.substring(10).replace('_nanke', '');
                let data3 = data2.slice(0, 20) + data2.slice(21);
                let hexStr = data3.replace(/[^0-9a-fA-F]/g, '');
                return this.hexDecodeAndFilter(hexStr);
            } catch (error) {
                return '';
            }
        },
        hexDecodeAndFilter: function(hexStr) {
            try {
                let pureHex = hexStr.replace(/[^0-9a-fA-F]/g, '');
                if (pureHex.length % 2 !== 0) pureHex += '0';
                let decoded = '';
                for (let i = 0; i < pureHex.length; i += 2) {
                    let char = String.fromCharCode(parseInt(pureHex.substr(i, 2), 16));
                    if (/[a-zA-Z0-9:\/\.\-\?\&=\%_~]/.test(char)) decoded += char;
                }
                let urlMatch = decoded.match(/https?:\/\/[^\s]+/);
                return urlMatch ? urlMatch[0] : decoded.trim();
            } catch (e) {
                return '';
            }
        },
        arr2hex: function(arr) {
            return arr.map(function(b) {
                return ('0' + (b & 0xFF).toString(16)).slice(-2);
            }).join('');
        },
        decryptData: function(hex, keyArr, ivArr) {
            try {
                let key = CryptoJS.enc.Hex.parse(this.arr2hex(keyArr));
                let iv = CryptoJS.enc.Hex.parse(this.arr2hex(ivArr));
                let src = CryptoJS.enc.Hex.parse(hex);
                let modes = [CryptoJS.mode.CBC, CryptoJS.mode.ECB, CryptoJS.mode.OFB, CryptoJS.mode.CFB, CryptoJS.mode.CTR];
                for (let i = 0; i < modes.length; i++) {
                    try {
                        let param = { mode: modes[i], padding: CryptoJS.pad.Pkcs7 };
                        if (modes[i] !== CryptoJS.mode.ECB) param.iv = iv;
                        let dec = CryptoJS.AES.decrypt({ ciphertext: src }, key, param);
                        let res = dec.toString(CryptoJS.enc.Utf8);
                        if (res) return res;
                    } catch (e) {}
                }
                return null;
            } catch (e) {
                return null;
            }
        }
    },

    request: async function(url, opt) {
        let opts = {
            method: opt?.method || 'GET',
            headers: Object.assign({}, this.headers, opt?.headers || {}),
            data: opt?.body
        };
        if (this.searchCookie) opts.headers.Cookie = this.searchCookie;
        let res = await req(url, opts);
        if (res.headers['set-cookie']) this.updateCookie(res.headers['set-cookie']);
        if (res.content.includes('系统安全验证') || res.content.includes('请输入验证码') || res.content.includes('verify_check')) {
            if (await this.fetchCk(url)) {
                opts.headers.Cookie = this.searchCookie;
                if (!opts.headers.Referer) opts.headers.Referer = url;
                res = await req(url, opts);
                if (res.headers['set-cookie']) this.updateCookie(res.headers['set-cookie']);
            }
        }
        return res.content;
    },

    fetchCk: async function(ref) {
        for (let i = 0; i < 3; i++) {
            try {
                let yzm = this.host + '/index.php/verify/index.html?' + Math.random();
                let h = { 'User-Agent': this.headers['User-Agent'], 'Referer': ref };
                if (this.searchCookie) h.Cookie = this.searchCookie;
                let res = await req(yzm, { headers: h, buffer: 2 });
                if (res.headers['set-cookie']) this.updateCookie(res.headers['set-cookie']);
                let code = '';
                if (typeof ocr === 'function') {
                    try { code = await ocr(yzm, res.content); } catch (e) {}
                }
                if (!code) {
                    let r = await req('https://api.nn.ci/ocr/b64/text', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: res.content });
                    code = r.content;
                }
                code = code.trim().replace(/\s+/g, '');
                if (!code) continue;
                let vRes = await req(this.host + '/index.php/ajax/verify_check?type=search&verify=' + code, {
                    method: 'GET',
                    headers: {
                        'User-Agent': this.headers['User-Agent'],
                        'Referer': ref,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Cookie': this.searchCookie
                    }
                });
                if (vRes.content.includes('"code":1')) {
                    if (vRes.headers['set-cookie']) this.updateCookie(vRes.headers['set-cookie']);
                    return true;
                }
            } catch (e) {}
        }
        return false;
    },

    buildFilterConfig: function() {
        return {
            '1': [
                { key: 'class', name: '类型', value: [
                    { n: '全部', v: '' },
                    { n: '动作片', v: '动作片' },
                    { n: '喜剧片', v: '喜剧片' },
                    { n: '爱情片', v: '爱情片' },
                    { n: '科幻片', v: '科幻片' },
                    { n: '恐怖片', v: '恐怖片' },
                    { n: '剧情片', v: '剧情片' },
                    { n: '战争片', v: '战争片' },
                    { n: '电影解说', v: '电影解说' }
                ]},
                { key: 'by', name: '排序', value: [{ n: '最新', v: 'time' }, { n: '最热', v: 'hits' }] }
            ],
            '2': [
                { key: 'class', name: '类型', value: [
                    { n: '全部', v: '' },
                    { n: '国产剧', v: '国产剧' },
                    { n: '港台剧', v: '港台剧' },
                    { n: '日韩剧', v: '日韩剧' },
                    { n: '欧美剧', v: '欧美剧' }
                ]},
                { key: 'by', name: '排序', value: [{ n: '最新', v: 'time' }, { n: '最热', v: 'hits' }] }
            ],
            '3': [
                { key: 'class', name: '类型', value: [
                    { n: '全部', v: '' },
                    { n: '大陆综艺', v: '大陆综艺' },
                    { n: '日韩综艺', v: '日韩综艺' },
                    { n: '港台综艺', v: '港台综艺' },
                    { n: '欧美综艺', v: '欧美综艺' }
                ]},
                { key: 'by', name: '排序', value: [{ n: '最新', v: 'time' }, { n: '最热', v: 'hits' }] }
            ],
            '4': [
                { key: 'class', name: '类型', value: [
                    { n: '全部', v: '' },
                    { n: '国产动漫', v: '国产动漫' },
                    { n: '日韩动漫', v: '日韩动漫' },
                    { n: '欧美动漫', v: '欧美动漫' },
                    { n: '港台动漫', v: '港台动漫' },
                    { n: '海外动漫', v: '海外动漫' }
                ]},
                { key: 'by', name: '排序', value: [{ n: '最新', v: 'time' }, { n: '最热', v: 'hits' }] }
            ]
        };
    },

    预处理: async function() {
        rule.filter = this.buildFilterConfig();
    },

    getCategorySlug: function(tid) {
        return this.cateMap[tid] || 'dianying';
    },

    buildCategoryUrl: function(tid, pg, extend) {
        let cate = this.getCategorySlug(tid);
        let page = parseInt(pg) || 1;
        let extClass = (extend.class || '').trim();
        let extBy = (extend.by || '').trim();
        if (extClass) {
            let slug = (this.typeMap[tid] && this.typeMap[tid][extClass]) || '';
            if (slug) {
                return this.host + '/t/' + slug + (page > 1 ? '_' + page : '') + '/';
            }
            return this.host + '/s/' + cate + '-' + encodeURIComponent(extClass) + (extBy === 'hits' ? '-hits' : '') + (page > 1 ? '_' + page : '') + '.html';
        }
        if (extBy === 'hits') {
            return this.host + '/s/' + cate + '--hits' + (page > 1 ? '_' + page : '') + '.html';
        }
        return this.host + '/t/' + cate + (page > 1 ? '_' + page : '') + '/';
    },

    parseVodList: function(html) {
        let videos = [];
        let items = pdfa(html, '.module-poster-item');
        items.forEach(item => {
            let title = pdfh(item, '.module-poster-item-title&&Text') || pdfh(item, 'a&&title');
            let img = pdfh(item, 'img&&data-original') || pdfh(item, 'img&&data-src') || pdfh(item, 'img&&src');
            let remarks = pdfh(item, '.module-item-note&&Text');
            let vurl = pdfh(item, 'a&&href');
            if (vurl) {
                vurl = vurl.startsWith('http') ? vurl : this.host + vurl;
                if (img && !img.startsWith('http')) img = this.host + img;
                videos.push({
                    vod_id: vurl,
                    vod_name: title,
                    vod_pic: img,
                    vod_remarks: remarks
                });
            }
        });
        return videos;
    },

    推荐: async function() {
        return await this.一级('1', 1, {}, {});
    },

    一级: async function(tid, pg, filter, extend) {
        let url = this.buildCategoryUrl(tid, pg, extend || {});
        let html = await this.request(url);
        return this.parseVodList(html);
    },

    二级: async function(ids) {
        let html = await this.request(ids[0]);
        let vod = {
            vod_id: ids[0],
            vod_name: pdfh(html, '.module-info-heading h1&&Text') || pdfh(html, 'h1&&Text'),
            vod_pic: pdfh(html, '.module-info-poster img&&data-original') || pdfh(html, '.module-info-poster img&&data-src') || pdfh(html, '.module-info-poster img&&src'),
            vod_content: pdfh(html, '.video-info-content span&&Text') || pdfh(html, '.module-info-introduction-content p&&Text') || '',
            vod_play_from: '',
            vod_play_url: ''
        };
        if (vod.vod_pic && !vod.vod_pic.startsWith('http')) vod.vod_pic = this.host + vod.vod_pic;
        let infoItems = pdfa(html, '.module-info-item');
        infoItems.forEach(info => {
            let title = (pdfh(info, '.module-info-item-title&&Text') || '').trim();
            let text = (pdfh(info, '.module-info-item-content&&Text') || pdfh(info, 'body&&Text') || '').trim().replace(/\/+$/g, '').trim();
            if (title.includes('导演')) vod.vod_director = text;
            else if (title.includes('演员')) vod.vod_actor = text;
            else if (title.includes('上映')) vod.vod_year = text;
            else if (title.includes('状态')) vod.vod_remarks = text;
        });
        let tags = pdfa(html, '.module-info-tag-link a');
        if (tags.length > 1) vod.vod_area = (pdfh(tags[1], 'body&&Text') || '').trim();
        let playFrom = [];
        let playUrl = [];
        let tabs = pdfa(html, '.episode-tab');
        let panels = pdfa(html, '.episode-panel');
        if (tabs.length === 0 && panels.length > 0) tabs = [{}];
        for (let i = 0; i < panels.length; i++) {
            let tabName = '线路' + (i + 1);
            if (tabs[i]) {
                let tabText = (pdfh(tabs[i], 'body&&Text') || '').replace(/\(.*?\)/g, '').trim();
                if (tabText) tabName = tabText;
            }
            playFrom.push(tabName);
            let urls = [];
            let items = pdfa(panels[i], '.episode-item');
            for (let j = 0; j < items.length; j++) {
                let itemHtml = items[j];
                let name = (pdfh(itemHtml, 'a&&Text') || pdfh(itemHtml, 'body&&Text') || '').trim();
                let href = pdfh(itemHtml, 'a&&href') || '';
                if (!href || href === '#' || href.toLowerCase().startsWith('javascript')) continue;
                let fullUrl = href.startsWith('http') ? href : this.host + href;
                urls.push(name + '$' + fullUrl + '@' + tabName);
            }
            playUrl.push(urls.join('#'));
        }
        vod.vod_play_from = playFrom.join('$$$');
        vod.vod_play_url = playUrl.join('$$$');
        return vod;
    },

    搜索: async function(key, quick, pg) {
        let url = this.host + '/search.html?wd=' + encodeURIComponent(key);
        let html = await this.request(url);
        return this.parseVodList(html);
    },

    lazy: async function(flag, id, flags) {
        try {
            let parts = id.split('@');
            let playUrl = parts[0];
            if (playUrl === this.host || playUrl === this.host + '/') return { parse: 1, url: playUrl };
            let html = await this.request(playUrl, { headers: { Referer: playUrl } });
            let start = 'var player_aaaa=';
            let idx = html.indexOf(start);
            if (idx === -1) return { parse: 1, url: playUrl };
            let jsonStr = html.substring(idx + start.length);
            let endIdx = jsonStr.indexOf('</script>');
            if (endIdx !== -1) jsonStr = jsonStr.substring(0, endIdx);
            let json = JSON.parse(jsonStr.trim().replace(/;$/, ''));
            if (json.url && /m3u8|mp4/i.test(json.url)) return { parse: 0, url: json.url };
            let parseDomain = 'https://gg.xn--it-if7c19g5s4bps5c.com/nkvod3.php';
            let jx = parseDomain + (parseDomain.includes('?') ? '&' : '?') + 'url=' + encodeURIComponent(json.url) + '&next=' + encodeURIComponent(json.link_next || '') + '&title=' + encodeURIComponent(json.vod_data?.vod_name || '');
            let jxHtml = (await req(jx, { headers: { Referer: playUrl, 'User-Agent': this.headers['User-Agent'] } })).content;
            let keyMatch = jxHtml.match(/var\s+raw_key\s*=\s*\[(.*?)\]/);
            let ivMatch = jxHtml.match(/var\s+iv\s*=\s*\[(.*?)\]/);
            let encMatch = jxHtml.match(/var\s+encrypted\s*=\s*["'](.*?)["']/);
            if (!keyMatch || !ivMatch || !encMatch) return { parse: 1, url: playUrl };
            let key = keyMatch[1].split(',').map(Number);
            let iv = ivMatch[1].split(',').map(Number);
            let enc = encMatch[1];
            let dec = this.CryptoTool.decryptData(enc, key, iv);
            if (!dec) return { parse: 1, url: playUrl };
            let final = '';
            let randomMatch = dec.match(/getrandom\(['"](.*?)['"]\)/);
            if (randomMatch) final = this.CryptoTool.getrandom(randomMatch[1]);
            else {
                let urlMatch = dec.match(/https?:\/\/[^\s"'<>]+/);
                if (urlMatch) final = urlMatch[0];
            }
            return { parse: 0, url: final, header: { 'User-Agent': this.headers['User-Agent'] } };
        } catch (e) {
            return { parse: 1, url: id };
        }
    }
};
