/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: '嗷呜动漫',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    title: '嗷呜动漫',
    host: 'https://www.aowu.tv',
    url: '/index.php/ds_api/vod',
    homeUrl: '/',
    headers: {'User-Agent': 'MOBILE_UA'},
    searchable: 0,
    quickSearch: 0,
    filterable: 0,
    double: true,
    play_parse: true,
    limit: 6,
    class_name: '当季新番&番剧&剧场',
    class_url: '20&21&22',

    // 首页推荐 - 使用API获取当季新番
    推荐: async function () {
        let d = [];
        let apiUrl = 'https://www.aowu.tv/index.php/ds_api/vod';
        let resp = await axios.post(apiUrl, {
            type: 20, by: 'time', page: 1
        }, {
            headers: {'Content-Type': 'application/json'}
        });
        let json = resp.data;
        let list = json.list || [];
        list.slice(0, 12).forEach(it => {
            d.push({
                title: it.vod_name,
                pic_url: it.vod_pic || '',
                desc: it.vod_remarks || '',
                url: rule.host + (it.url || ''),
            })
        });
        return setResult(d)
    },

    // 一级分类 - 使用API接口
    一级: async function (tid, pg, filter, extend) {
        let {MY_CATE, MY_PAGE} = this;
        let d = [];
        let apiUrl = 'https://www.aowu.tv/index.php/ds_api/vod';
        let resp = await axios.post(apiUrl, {
            type: MY_CATE, by: 'time', page: MY_PAGE
        }, {
            headers: {'Content-Type': 'application/json'}
        });
        let json = resp.data;
        let list = json.list;
        list.forEach(it => d.push({
            title: it.vod_name, desc: it.vod_remarks, img: it.vod_pic, url: rule.host + it.url
        }));
        return setResult(d)
    },

    // 二级详情 - 优先HTML解析，WAF拦截时回退API
    二级: async function (id) {
        let {input, pdfa, pdfh, pd} = this;
        let VOD = {};

        // 从URL提取基本信息
        let match = input.match(/\/bangumi\/([^\/]+)/);
        let code = match ? match[1] : '';

        // 尝试获取HTML详情页
        let html = '';
        try {
            html = await request(input);
        } catch(e) {}

        // 检查是否被WAF拦截
        if (html && html.indexOf('Verify Yourself') === -1 && html.indexOf('GOEDGE_WAF') === -1) {
            // HTML可用，解析播放信息
            VOD.vod_name = pdfh(html, 'h3&&Text');
            VOD.vod_content = pdfh(html, '.switch-box&&Text') || pdfh(html, '.text-collapse&&Text');
            VOD.vod_pic = pd(html, '.vodlist_thumb&&data-original', input);

            let playlist = pdfa(html, '.anthology-list-play');
            let tabs = pdfa(html, '.anthology-tab&&a');

            let playmap = {};
            tabs.forEach((item, i) => {
                let form = pdfh(item, 'Text');
                let list = playlist[i];
                if (list) {
                    pdfa(list, 'a').forEach(it => {
                        let title = pdfh(it, 'Text');
                        let urls = pd(it, 'a&&href', input);
                        if (!playmap[form]) playmap[form] = [];
                        playmap[form].push(title + "$" + urls);
                    });
                }
            });

            VOD.vod_play_from = Object.keys(playmap).join('$$$');
            VOD.vod_play_url = Object.values(playmap).map(list => list.join('#')).join('$$$');
        } else {
            // HTML被WAF拦截，使用API回退
            let apiUrl = 'https://www.aowu.tv/index.php/ds_api/vod';
            let resp = await axios.post(apiUrl, {
                ac: 'detail', ids: code
            }, {
                headers: {'Content-Type': 'application/json'}
            });
            let json = resp.data;
            if (json && json.list && json.list.length > 0) {
                let item = json.list[0];
                VOD.vod_name = item.vod_name || '';
                VOD.vod_pic = item.vod_pic || '';
                VOD.vod_content = item.vod_content || '';
                VOD.vod_remarks = item.vod_remarks || '';
                if (item.vod_play_from) {
                    VOD.vod_play_from = item.vod_play_from;
                    VOD.vod_play_url = item.vod_play_url || '';
                }
            }
        }

        return VOD
    },

    lazy: async function (flag, id, flags) {
        let {input} = this;
        return {parse: 1, url: input}
    }

}