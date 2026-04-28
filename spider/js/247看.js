/*
* @File     : 247看.js
* @Author   : drpy-node
* @Date     : 2026-04-21
* @Comments : 纯API驱动的SPA影视站，后端Express + MeiliSearch
*  API汇总:
*  - 分类: GET /api/categories
*  - 首页: GET /api/home
*  - 列表: GET /api/categories/{type_id}/videos?page=X&limit=24
*  - 详情: GET /api/videos/{vod_id}
*  - 搜索: POST https://meilisearch.247kan.com/indexes/videos/search
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '247看',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    类型: '影视',
    title: '247看',
    host: 'https://247kan.com',
    homeUrl: '/api/home',
    url: '/api/categories/fyclass/videos?page=fypage&limit=24',
    searchUrl: '/api/search?q=**&page=fypage',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'MOBILE_UA',
    },
    timeout: 10000,
    class_name: '',
    class_url: '',
    // 关键：一级返回纯数字vod_id，引擎通过此规则拼出完整详情URL
    detailUrl: '/api/videos/fyid',
    play_parse: true,
    limit: 6,
    double: false,

    // 动态分类解析
    class_parse: async function () {
        let {HOST} = this;
        let data = JSON.parse(await request(HOST + '/api/categories'));
        let classes = [];
        data.data.forEach(function (cat) {
            classes.push({
                type_id: String(cat.type_id),
                type_name: cat.type_name
            });
        });
        return {class: classes};
    },

    // 首页推荐 — 聚合featured/latest/trending及各分类videos
    推荐: async function () {
        let data = JSON.parse(await request(this.input));
        let d = data.data;
        let items = [];
        // 辅助函数：去重后添加
        let added = {};
        function addVod(v) {
            let id = String(v.vod_id);
            if (!added[id]) {
                added[id] = true;
                items.push({
                    vod_name: v.vod_name,
                    vod_pic: v.vod_pic || v.vod_tmdb_poster || '',
                    vod_remarks: v.vod_remarks || '',
                    vod_id: id
                });
            }
        }
        // 精选
        if (d.featured) d.featured.forEach(addVod);
        // 最新
        if (d.latest) d.latest.forEach(addVod);
        // 热门
        if (d.trending) d.trending.forEach(addVod);
        // 各分类推荐
        if (d.categories) d.categories.forEach(function (cat) {
            if (cat.videos) cat.videos.forEach(addVod);
        });
        return items;
    },

    // 一级列表 — this.input是url模板渲染后的完整URL
    一级: async function () {
        let data = JSON.parse(await request(this.input));
        let items = [];
        if (data.data && data.data.videos) {
            data.data.videos.forEach(function (v) {
                items.push({
                    vod_name: v.vod_name,
                    vod_pic: v.vod_pic || '',
                    vod_remarks: v.vod_remarks || '',
                    vod_id: String(v.vod_id)
                });
            });
        }
        return items;
    },

    // 二级详情 — this.input是detailUrl渲染后的完整URL
    二级: async function () {
        let data = JSON.parse(await request(this.input));
        let v = data.data;

        // 处理线路和选集
        let playFrom = [];
        let playList = [];
        if (v.episodes && v.episodes.length > 0) {
            // 按route分组
            let routeMap = {};
            v.episodes.forEach(function (ep) {
                if (!routeMap[ep.route]) {
                    routeMap[ep.route] = [];
                }
                routeMap[ep.route].push(ep);
            });
            // 遍历每个route生成线路
            Object.keys(routeMap).forEach(function (route) {
                playFrom.push(route);
                let eps = [];
                routeMap[route].forEach(function (ep) {
                    let epName = ep.name || ('第' + ep.episode + '集');
                    eps.push(epName + '$' + ep.url);
                });
                playList.push(eps.join('#'));
            });
        }

        return {
            vod_name: v.vod_name,
            vod_pic: v.vod_pic || '',
            type_name: v.type_name || '',
            vod_year: v.vod_year || '',
            vod_area: v.vod_area || '',
            vod_actors: v.vod_actor || '',
            vod_director: v.vod_director || '',
            vod_content: (v.vod_content || '').replace(/<[^>]*>/g, '').trim(),
            vod_remarks: v.vod_remarks || '',
            vod_play_from: playFrom.join('$$$'),
            vod_play_url: playList.join('$$$')
        };
    },

    // 搜索 — POST到MeiliSearch（用body发JSON）
    搜索: async function () {
        let KEY = this.KEY || '';
        let MY_PAGE = this.MY_PAGE || 1;
        let searchUrl = 'https://meilisearch.247kan.com/indexes/videos/search';
        let postData = JSON.stringify({
            q: KEY,
            limit: 20,
            offset: (MY_PAGE - 1) * 20,
            attributesToRetrieve: ['vod_id', 'vod_name', 'vod_pic', 'vod_douban_score', 'vod_year', 'vod_remarks', 'vod_class', 'vod_content']
        });
        let html;
        try {
            html = await request(searchUrl, {
                method: 'POST',
                body: postData,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer Ub-lWdJKpjLqIHIayy8b0m1Nc49HMqOZr0U5jt7UPZM'
                }
            });
        } catch (e) {
            log('247看 搜索 request 异常: ' + e.message);
            return [];
        }
        let data = typeof html === 'string' ? JSON.parse(html) : html;
        let items = [];
        if (data.hits) {
            data.hits.forEach(function (v) {
                items.push({
                    vod_name: v.vod_name,
                    vod_pic: v.vod_pic || '',
                    vod_remarks: v.vod_remarks || v.vod_year || '',
                    vod_id: String(v.vod_id)
                });
            });
        }
        return items;
    },

    // 播放免嗅 - m3u8直链直接播放，平台链接走嗅探
    lazy: async function () {
        let {input} = this;
        let url = input;
        // m3u8直链
        if (url.indexOf('.m3u8') > -1) {
            return {
                url: url,
                parse: 0
            };
        }
        // 平台链接需要嗅探
        return {
            url: url,
            parse: 1
        };
    }
};
