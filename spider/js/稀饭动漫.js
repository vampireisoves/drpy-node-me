/*
* @File     : 稀饭动漫.js
* @Site     : https://dm.xifanacg.com/
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '稀饭动漫',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    类型: '影视',
    title: '稀饭动漫',
    host: 'https://dm.xifanacg.com',
    homeUrl: '/',
    url: '/index.php/ds_api/vod',
    detailUrl: '/bangumi/fyid.html',
    searchUrl: '/search/wd/**.html',
    searchable: 1,
    quickSearch: 0,
    filterable: 1,
    filter: 'H4sIAFg57GkC/+2Y0U4aURCGX8XstRd7QKvtqzReULNJTa1NwDYhhgTFWqwGkFCQQKWmIdAIFattFhCfhrMLb9Fdzmbnn8SG0rQNMXvHP98Oc/j3nJkTdjShPVl4uqO9MOLOB219MxKLaYsL2lbkpeEG7Ku+PDtyI28im68N9fCWS+Tb5jjVnBBXaonFBY9YuTO7deITTxKXmZpMV3zuSeKjQV92sqPLG6vQ9Z9iQai1e2Snr6iWksTt8p3MpX3uSci/vcAqngT+6VxW2sSVBJ4+tYol4koC/9a39qm+J8GL+jvZ7ZMXSkJ+qS5Nk/KVJD7+mLdO6z73JPFhtyzr1zJHr4MiUGWvZRfhjSkJq8xl5NcLWqWS4HLjBH+FJyH/ID8uf6F8JSE/1R6dJylfSci/3RuaRfvDMX2FH4FfYZpWOstepx8Bx2rXw26OHFMSau3+kKksFVIS1nqXGX+u0VqVhN2bHDgx2rdKJtYmT3jHLBI1InjKZLUjj3sznrJS3aq2cGe4kteJG5Eoq9O9GfYHs9UJ6aFHfnwiGFtGtszZErIlzsLIwpyFkIU4E8gEZzoynTHxGJgjGFtFtsrZCrIVztAXwX0R6Ivgvgj0RXBfBPoiuC8CfRHcF4G+CO6LQF8E90VHX3Tui46+6NwXHX3RuS86+qJzX3T0xRF8vz6L4261MnnZy963W61q0ip2/G/a3nAS4GRUk04H8enzje0Yns/LfZk+8Gls/VXUcJex5kRCwTAMhmEwDB/MMKQ3b7ZlZUCvXUnIbzVwnZ4MhmkwTINh+qfDNPz3h6k8bMhqzz6kGUIReOp90y707cJ3OaBhyIIzjJxpI23KyP1Fsw8aYNAAH0oDnK8b/D/4P8s5Cc5VGC85rvz9K/7UC+GUHvTfesj9PQB9wB7iyaBHzGmPmJ9zmfgJ9iD+8mcWAAA=',
    filter_def: {'1':{'by':'time'},'2':{'by':'time'},'3':{'by':'time'},'21':{'by':'time'}},
    filter_url: 'class={{fl.class}}&area={{fl.area}}&year={{fl.year}}&by={{fl.by}}',
    headers: {'User-Agent': 'MOBILE_UA'},
    class_name: '连载新番&完结旧番&剧场版&美漫',
    class_url: '1&2&3&21',
    play_parse: true,
    double: false,

    推荐: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let list = [], seen = {};
        let add = (v) => { if (v && v.vod_name && v.vod_id && !seen[v.vod_id]) { seen[v.vod_id]=1; list.push(v); } };
        let html = await request(input);
        pdfa(html, '.slide-time-list .swiper-slide').forEach(it => {
            add({vod_name:pdfh(it,'.slide-info-title&&Text'), vod_pic:pdfh(it,'.swiper-lazy&&data-background'), vod_remarks:pdfh(it,'.gen-meta-after-title li:eq(0)&&Text'), vod_id:pd(it,'a.lank&&href',input)});
        });
        pdfa(html, '.public-list-box').forEach(it => {
            add({vod_name:pdfh(it,'a.public-list-exp&&title')||pdfh(it,'.time-title&&Text'), vod_pic:pdfh(it,'img&&data-src')||pdfh(it,'img&&src'), vod_remarks:pdfh(it,'.public-list-prb&&Text'), vod_id:pd(it,'a.public-list-exp&&href',input)});
        });
        return list;
    },

    一级: async function () {
        let {MY_CATE, MY_PAGE, MY_FL, HOST} = this;
        let body = 'type=' + MY_CATE + '&page=' + (MY_PAGE || 1) + '&by=' + ((MY_FL && MY_FL.by) || 'time');
        if (MY_FL) {
            if (MY_FL.class) body += '&class=' + encodeURIComponent(MY_FL.class);
            if (MY_FL.area) body += '&area=' + encodeURIComponent(MY_FL.area);
            if (MY_FL.year) body += '&year=' + encodeURIComponent(MY_FL.year);
        }
        let text = await request(HOST + '/index.php/ds_api/vod', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest'},
            data: body
        });
        let data = JSON.parse(text);
        return (data.list || []).map(it => ({
            vod_name: it.vod_name || '',
            vod_pic: (it.vod_pic || '').replace(/\\\//g, '/'),
            vod_remarks: it.vod_remarks || '',
            vod_id: HOST + (it.url || ('/bangumi/' + it.vod_id + '.html')),
        }));
    },

    二级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let V = {
            vod_name: pdfh(html,'.detail-info h3&&Text') || pdfh(html,'h1&&Text'),
            vod_pic: pdfh(html,'.detail-pic img&&data-src') || pdfh(html,'.detail-pic img&&src'),
            vod_remarks: pdfh(html,'.slide-info-remarks:eq(0)&&Text'),
            vod_year: pdfh(html,'.slide-info-remarks:eq(1)&&Text'),
            vod_area: pdfh(html,'.slide-info-remarks:eq(2)&&Text'),
            vod_director: pdfh(html,'.partition:contains("导演") a&&Text'),
            vod_actor: pdfh(html,'.partition:contains("演员") a&&Text'),
            type_name: pdfh(html,'.partition:contains("类型") a&&Text'),
            vod_content: pdfh(html,'#height_limit&&Text') || pdfh(html,'.text.cor3&&Text'),
        };
        let tabs = pdfa(html,'.anthology-tab .swiper-wrapper a');
        let boxes = pdfa(html,'.anthology-list .anthology-list-box');
        let from=[], urls=[];
        tabs.forEach((tab,i) => {
            let nm = pdfh(tab,'body&&Text').replace(/\s+/g,' ').trim();
            let bd = pdfh(tab,'.badge&&Text').trim();
            if (bd && nm.endsWith(bd)) nm = nm.slice(0,-bd.length).trim();
            nm = nm || ('线路' + (i+1));
            let box = boxes[i]; if (!box) return;
            let eps = [];
            pdfa(box,'a').forEach(a => {
                let n = pdfh(a,'body&&Text').trim(), u = pd(a,'a&&href',input);
                if (n && u) eps.push(n + '$' + u);
            });
            if (eps.length) { from.push(nm); urls.push(eps.join('#')); }
        });
        return {...V, vod_play_from: from.join('$$$'), vod_play_url: urls.join('$$$')};
    },

    搜索: async function () {
        let {KEY, HOST} = this;
        let wd = encodeURIComponent(KEY || ''); if (!wd) return [];
        let html = await request(HOST + '/index.php/ajax/suggest?mid=1&wd=' + wd, {headers:{'X-Requested-With':'XMLHttpRequest'}});
        let data = {}; try { data = JSON.parse(html); } catch(e) { return []; }
        return (data.list || []).map(it => ({vod_name:it.name||'', vod_pic:it.pic||'', vod_remarks:'', vod_id:HOST+'/bangumi/'+it.id+'.html'})).filter(it => it.vod_name && it.vod_id);
    },

    lazy: async function () {
        let {input} = this;
        let html = await request(input, {headers:{'User-Agent':'Mozilla/5.0','Referer':input}});
        let m = html.match(/var\s+player_aaaa\s*=\s*(\{[\s\S]*?\})\s*<\/script>/);
        if (m) try {
            let data = JSON.parse(m[1]);
            let url = String(data.url || '').replace(/\\\//g, '/');
            if (url) return {parse:/\.(m3u8|mp4|m4a|mp3)(\?|$)/i.test(url)?0:1, url, header:{'User-Agent':'Mozilla/5.0','Referer':input,'Origin':'https://dm.xifanacg.com'}};
        } catch(e) {}
        return {parse:1, url:input, header:{'User-Agent':'Mozilla/5.0','Referer':input}};
    }
};
