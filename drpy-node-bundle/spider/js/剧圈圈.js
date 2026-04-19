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
        function getContent(res) {
            return res && (res.content || res.data || res.body || res);
        }
        function getSetCookies(res) {
            let cookies = [];
            if (res && res.headers) {
                let sc = res.headers['set-cookie'] || res.headers['Set-Cookie'];
                if (Array.isArray(sc)) cookies.push(...sc.map(c => String(c).split(';')[0]));
                else if (typeof sc === 'string') cookies.push(sc.split(';')[0]);
            }
            return cookies;
        }
        function mergeCookies(oldCookies, newCookies) {
            let dict = {};
            (oldCookies || []).forEach(c => {
                let p = String(c).split('=');
                if (p.length > 1) dict[p.shift().trim()] = p.join('=');
            });
            (newCookies || []).forEach(c => {
                let p = String(c).split('=');
                if (p.length > 1) dict[p.shift().trim()] = p.join('=');
            });
            return Object.keys(dict).map(k => k + '=' + dict[k]);
        }
        function stdB64Decode(str) {
            if (typeof base64Decode === 'function') {
                try { return base64Decode(str); } catch (e) {}
            }
            let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            let out = '';
            let i = 0;
            str = String(str || '').replace(/[^A-Za-z0-9\+\/\=]/g, '');
            while (i < str.length) {
                let enc1 = chars.indexOf(str.charAt(i++));
                let enc2 = chars.indexOf(str.charAt(i++));
                let enc3 = chars.indexOf(str.charAt(i++));
                let enc4 = chars.indexOf(str.charAt(i++));
                let chr1 = (enc1 << 2) | (enc2 >> 4);
                let chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                let chr3 = ((enc3 & 3) << 6) | enc4;
                out += String.fromCharCode(chr1);
                if (enc3 !== 64 && enc3 !== -1) out += String.fromCharCode(chr2);
                if (enc4 !== 64 && enc4 !== -1) out += String.fromCharCode(chr3);
            }
            return out;
        }
        function getMd5(str) {
            if (typeof md5 === 'function') return md5(str);
            return require('crypto').createHash('md5').update(str).digest('hex');
        }
        function customStrDecode(enc) {
            let key = getMd5('test');
            let decoded1 = stdB64Decode(enc);
            let len = key.length;
            let code = '';
            for (let i = 0; i < decoded1.length; i++) {
                let k = i % len;
                code += String.fromCharCode(decoded1.charCodeAt(i) ^ key.charCodeAt(k));
            }
            return stdB64Decode(code);
        }
        function deString(arr1, arr2, str) {
            let res = '';
            let chars = String(str || '').split('');
            for (let i = 0; i < chars.length; i++) {
                let ch = chars[i];
                if (/^[a-zA-Z]+$/.test(ch)) {
                    let idx = arr1.indexOf(ch);
                    res += idx > -1 ? arr2[idx] : ch;
                } else {
                    res += ch;
                }
            }
            return res;
        }
        function decodeApiUrl(enc) {
            enc = String(enc || '').replace(/^error:\/\/apiRes_/, '');
            let decoded2 = customStrDecode(enc);
            let parts = decoded2.split('/');
            if (parts.length < 3) return '';
            let arr1 = JSON.parse(stdB64Decode(parts[1]));
            let arr2 = JSON.parse(stdB64Decode(parts[0]));
            let payload = stdB64Decode(parts.slice(2).join('/'));
            return deString(arr1, arr2, payload);
        }
        function wrapResult(url, referer) {
            return {
                parse: 0,
                url: url,
                header: {
                    'User-Agent': ua,
                    'Referer': referer || rule.host + '/'
                }
            };
        }

        try {
            if (/^https?:\/\/.*\.(m3u8|mp4|flv|m4s)(\?.*)?$/i.test(input)) {
                return wrapResult(input, rule.host + '/');
            }

            let htmlRes = await request(input, {
                withHeaders: true,
                headers: { 'User-Agent': ua, 'Referer': rule.host + '/' }
            });
            let html = getContent(htmlRes);
            let cookies = getSetCookies(htmlRes);
            let marker = 'var player_aaaa=';
            let start = html ? html.indexOf(marker) : -1;
            if (start < 0) {
                return input;
            }

            let raw = html.slice(start + marker.length);
            let endScript = raw.indexOf('</script>');
            if (endScript > -1) {
                raw = raw.slice(0, endScript);
            }
            raw = raw.trim().replace(/;?\s*$/, '');

            let player_aaaa = null;
            let candidates = [
                raw,
                raw.replace(/\\\"/g, '"'),
                raw.replace(/\\\\/g, '\\'),
                raw.replace(/\\\"/g, '"').replace(/\\\\/g, '\\')
            ];
            for (let i = 0; i < candidates.length; i++) {
                try {
                    player_aaaa = JSON5.parse(candidates[i]);
                    break;
                } catch (e) {}
            }
            if (!player_aaaa || !player_aaaa.url) {
                return input;
            }

            let vid = unescape(player_aaaa.url);
            if (/^https?:\/\/.*\.(m3u8|mp4|flv|m4s)(\?.*)?$/i.test(vid)) {
                return wrapResult(vid, input);
            }

            let playerUrl = rule.host + '/jx/player.php?vid=' + encodeURIComponent(vid);
            let playerRes = await request(playerUrl, {
                withHeaders: true,
                headers: {
                    'User-Agent': ua,
                    'Referer': input,
                    'Cookie': cookies.join('; ')
                }
            });
            cookies = mergeCookies(cookies, getSetCookies(playerRes));

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
            if (!json || json.code !== 200 || !json.data || !json.data.url) {
                return input;
            }

            let finalUrl = decodeApiUrl(json.data.url);
            if (/^https?:\/\//i.test(finalUrl)) {
                return wrapResult(finalUrl, playerUrl);
            }
            return input;
        } catch (e) {
            return input;
        }
    }
};
