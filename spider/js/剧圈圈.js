/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '剧圈圈',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    title: '剧圈圈',
    模板: 'mxpro',
    host: 'https://www.jqqzx.cc',
    class_name: '电影&剧集&动漫&综艺&短剧',
    class_url: 'dianying&juji&dongman&zongyi&duanju',
    class_parse: '',
    url: '/type/fyclass/page/fypage.html',
    searchUrl: '/index.php/ajax/suggest?mid=1&wd=**',
    searchable: 2,
    quickSearch: 0,
    搜索: async function() {
        let { input } = this;
        let res = JSON.parse(await request(input));
        let items = [];
        if (res.list) {
            res.list.forEach(item => {
                items.push({
                    title: item.name,
                    img: item.pic,
                    desc: '',
                    url: '/vod/' + item.id + '.html'
                });
            });
        }
        return items;
    },
    lazy: async function() {
        let { input } = this;
        let ua = MOBILE_UA || 'Mozilla/5.0 (Linux; Android 12; Mobile) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36';
        let direct = /^https?:\/\/.*\.(m3u8|mp4|flv|m4s)(\?.*)?$/i;
        let getHtml = res => res && (res.content || res.data || res.body || res);
        let getCookies = res => {
            let sc = res && res.headers && (res.headers['set-cookie'] || res.headers['Set-Cookie']);
            if (!sc) return [];
            return (Array.isArray(sc) ? sc : [sc]).map(v => String(v).split(';')[0]);
        };
        let mergeCookies = (...groups) => {
            let map = {};
            groups.flat().forEach(c => {
                let i = String(c || '').indexOf('=');
                if (i > 0) map[c.slice(0, i).trim()] = c.slice(i + 1);
            });
            return Object.keys(map).map(k => k + '=' + map[k]);
        };
        let b64 = str => {
            if (typeof base64Decode === 'function') return base64Decode(str);
            return Buffer.from(String(str || ''), 'base64').toString();
        };
        let xorDecode = enc => {
            let key = (typeof md5 === 'function' ? md5('test') : require('crypto').createHash('md5').update('test').digest('hex'));
            let txt = b64(enc), out = '';
            for (let i = 0; i < txt.length; i++) out += String.fromCharCode(txt.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            return b64(out);
        };
        let decodeUrl = enc => {
            let parts = xorDecode(String(enc || '').replace(/^error:\/\/apiRes_/, '')).split('/');
            if (parts.length < 3) return '';
            let from = JSON.parse(b64(parts[1]));
            let to = JSON.parse(b64(parts[0]));
            let body = b64(parts.slice(2).join('/'));
            return body.replace(/[a-zA-Z]/g, s => {
                let i = from.indexOf(s);
                return i > -1 ? to[i] : s;
            });
        };
        let result = (url, referer) => ({
            parse: 0,
            url: url,
            header: {
                'User-Agent': ua,
                'Referer': referer || rule.host + '/'
            }
        });

        try {
            if (direct.test(input)) return result(input);

            let htmlRes = await request(input, {
                withHeaders: true,
                headers: { 'User-Agent': ua, 'Referer': rule.host + '/' }
            });
            let html = getHtml(htmlRes) || '';
            let cookies = getCookies(htmlRes);
            let marker = 'var player_aaaa=';
            let start = html.indexOf(marker);
            if (start < 0) return input;

            let raw = html.slice(start + marker.length);
            let end = raw.indexOf('</script>');
            raw = (end > -1 ? raw.slice(0, end) : raw).trim().replace(/;?\s*$/, '');
            let player = null;
            let candidates = [
                raw,
                raw.replace(/\\\"/g, '"'),
                raw.replace(/\\\\/g, '\\'),
                raw.replace(/\\\"/g, '"').replace(/\\\\/g, '\\')
            ];
            for (let i = 0; i < candidates.length; i++) {
                try {
                    player = JSON5.parse(candidates[i]);
                    break;
                } catch (e) {}
            }
            if (!player || !player.url) return input;

            let vid = unescape(player.url || '');
            if (!vid) return input;
            if (direct.test(vid)) return result(vid, input);

            let playerUrl = rule.host + '/jx/player.php?vid=' + encodeURIComponent(vid);
            let playerRes = await request(playerUrl, {
                withHeaders: true,
                headers: {
                    'User-Agent': ua,
                    'Referer': input,
                    'Cookie': cookies.join('; ')
                }
            });
            cookies = mergeCookies(cookies, getCookies(playerRes));

            let apiRes = await request(rule.host + '/jx/api.php', {
                method: 'POST',
                headers: {
                    'User-Agent': ua,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': rule.host,
                    'Referer': playerUrl,
                    'Cookie': cookies.join('; ')
                },
                data: 'vid=' + encodeURIComponent(vid)
            });
            let json = typeof apiRes === 'string' ? JSON.parse(apiRes) : apiRes;
            let realUrl = json && json.code === 200 && json.data && json.data.url ? decodeUrl(json.data.url) : '';
            return /^https?:\/\//i.test(realUrl) ? result(realUrl, playerUrl) : input;
        } catch (e) {
            return input;
        }
    }
};
