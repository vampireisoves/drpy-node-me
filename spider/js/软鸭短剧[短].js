/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '软鸭短剧',
  '类型': '短剧',
  lang: 'ds'
})
*/

var rule = {
    title: '软鸭短剧',
    类型: '短剧',
    host: 'https://api.xingzhige.com',
    homeUrl: '/API/playlet/?keyword=擦边&page=1',
    searchUrl: '/API/playlet/?keyword=fykey&page=fypage',
    url: '/API/playlet/?keyword=fyclass&page=fypage',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 8.0.0; zh-cn; Mi Note 2 Build/OPR1.170623.032) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/61.0.3163.128 Mobile Safari/537.36 XiaoMi/MiuiBrowser/10.1.1'
    },
    timeout: 5000,
    filterable: 1,
    limit: 30,
    multi: 1,
    searchable: 2,
    play_parse: true,
    search_match: true,

    class_parse: function() {
        return {
            class: [
                {type_id: "战神", type_name: "战神"},
                {type_id: "逆袭", type_name: "逆袭"},
                {type_id: "人物", type_name: "人物"},
                {type_id: "都市", type_name: "都市"},
                {type_id: "擦边", type_name: "擦边"},
                {type_id: "人妖", type_name: "人妖"},
                {type_id: "闪婚", type_name: "闪婚"},
                {type_id: "古装", type_name: "古装"},
                {type_id: "霸总", type_name: "霸总"},
                {type_id: "强者", type_name: "强者"},
                {type_id: "玄幻", type_name: "玄幻"},
                {type_id: "都市", type_name: "都市"},
                {type_id: "神豪", type_name: "神豪"},
                {type_id: "现代", type_name: "现代"},
                {type_id: "爱情", type_name: "爱情"},
                {type_id: "虐渣", type_name: "虐渣"},
                {type_id: "总裁", type_name: "总裁"},
                {type_id: "无敌", type_name: "无敌"},
                {type_id: "奇幻", type_name: "奇幻"}
            ],
            filters: {}
        };
    },

    一级: async function() {
        const {input, MY_CATE,MY_PAGE} = this;
        let cid = MY_CATE;
        let page = MY_PAGE || 1;
        const videos = [];
        // 如果是分类页
        if (input && input.includes('@')) {
            [cid, page] = input.split('@');
        }

        const url = `${rule.host}/API/playlet/?keyword=${encodeURIComponent(cid)}&page=${page}`;
        try {
            const response = await request(url, {headers: rule.headers});
            const data = JSON.parse(response).data;
            data.forEach(vod => {
                const purl = `${vod.title}@${vod.cover}@${vod.author}@${vod.type}@${vod.desc}@${vod.book_id}`
                videos.push({
                    title: vod.title,
                    img: vod.cover,
                    desc: ` ${vod.type}`,
                    url: encodeURIComponent(purl)
                });
            });
            return setResult(videos);
        } catch (e) {
            console.error("一级列表错误:", e);
            return [];
        }
    },

    二级: async function() {
        let {orId} = this;
        orId = decodeURIComponent(orId);
        let [title,img,author, type, desc, book_id] = orId.split('@');
        let bofang = '';
        let xianlu = '';
        try {
            book_id = book_id || orId.split('@')[5];
            const detailUrl = `${rule.host}/API/playlet/?book_id=${book_id}`;
            const detailResponse = await request(detailUrl, {headers: rule.headers});

            const detailData = JSON.parse(detailResponse);

            if (detailData.data?.video_list) {
                const episodes = detailData.data.video_list.map(ep => {
                    return `${ep.title}$${ep.video_id}`;
                });
                bofang = episodes.join('#');
            }
            xianlu = '专线';

            return {
                vod_name: title,
                vod_pic: img,
                vod_actor: author,
                vod_remarks: type,
                vod_content: desc,
                vod_play_from: xianlu,
                vod_play_url: bofang
            };
        } catch (e) {
            console.error("详情解析错误:", e);
            return {};
        }
    },

    搜索: async function() {
        const {KEY, MY_PAGE} = this;
        const page = MY_PAGE || 1;
        const url = `${rule.host}/API/playlet/?keyword=${encodeURIComponent(KEY)}&page=${page}`;
        const videos = [];
        try {
            const response = await request(url, {headers: rule.headers});
            const data = JSON.parse(response).data;

            data.forEach(vod => {
                const purl = `${vod.title}@${vod.cover}@${vod.author}@${vod.type}@${vod.desc}@${vod.book_id}`
                videos.push({
                    title: vod.title,
                    img: vod.cover,
                    desc: ` ${vod.type}`,
                    url: purl
                });
            });
            return setResult(videos);
        } catch (e) {
            console.error("搜索列表错误:", e);
            return [];
        }
    },

    lazy: async function() {
        const {input} = this;
        const url = `${rule.host}/API/playlet/?video_id=${input}&quality=1080p`;

        const response = await request(url, {headers: rule.headers});
        const data = JSON.parse(response);
        const playUrl = data.data?.video?.url || '';
        return {
            parse: 0,
            url: playUrl
        };

    }

};
