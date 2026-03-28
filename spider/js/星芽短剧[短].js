/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 1,
  title: '星芽短剧',
  类型: '短剧',
  lang: 'ds'
})
*/

// http://localhost:5757/api/星芽短剧?ac=list&t=1&pg=1
// http://localhost:5757/api/星芽短剧?ac=detail&ids=https://app.whjzjx.cn/v2/theater_parent/detail?theater_parent_id=3523
// http://localhost:5757/api/星芽短剧?wd=龙王&pg=1
// http://localhost:5757/api/星芽短剧?play=http://qcapp.xingya.com.cn/h265/wz_mp40905dingtianhou01.mp4?sign=4db245c4e9cd5bd3d3026e2e0f6147a6&t=674ee966&flag=星芽短剧
var rule = {
    类型: '短剧',
    title: '星芽短剧',
    desc: '星芽短剧纯js版本',
    host: 'https://app.whjzjx.cn',
    url: '/cloud/v2/theaterfyfilter',
    filter_url: '/home_page?theater_class_id=fyclass&type=1&{{fl.type or "class2_ids=0"}}&page_num=fypage&page_size=24',
    searchUrl: '/v3/search',
    searchable: 2,
    quickSearch: 1,
    filterable: 1,
    filter: 'H4sIAAAAAAAAA6vmUgACJUMlK4VoMBMEquEssGR2aiVQWqmksiBVSQdVKi8xNxUk93zj7qfzutFlyxJzSlNRTMZuA8I4kFlPW1e8bF6BZhbCTJCS5JzE4mKj+MyUYlsDJQx1tZha8dn3snnv0x1NxNpnQrF9T/uXvFjcSqx9phTb97xvw5Pdi1+saHjWTLSthpRb+6xjxvOl84i10IjycH3Z0PZi0VpiLTSnPFxX7n+xrYvoEKXcwqd9bU/7NxGdUCnPGS+2zni6cj/RUWhGeZAunfe0ZzfRFlKeSF+29z6fMp9YC6ngwSlznq5bQKx9xsbUKGxIzvzGVMgbfS1PdxIdkcaUR+SLCT1P180l1kJLyu1rmfhsC9Glm7ERxRY+2bWJhCg0MaTchzMnPGtEr9JxWmiBxT4UkVguVPFYrloA8HqNcnwIAAA=',
    headers: {
        'User-Agent': 'okhttp/4.10.0',
        'Accept-Encoding': 'gzip',
        'x-app-id': '7',
        'platform': '1',
        'manufacturer': 'realme',
        'version_name': '3.3.1',
        'user_agent': 'Mozilla/5.0 (Linux; Android 9; RMX1931 Build/PQ3A.190605.05081124; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Mobile Safari/537.36',
        'dev_token': 'BFdbZBGOEgG7QDt01ldOQNNfhO2F-rv4QcugZoFZm5_3DlPJEo_bSBeJ6dW2X3eKzxxKKWz3xJCM_u5PppGMqRuYPxcsVg9a-jriWiIoPZvHMSLbcbxTFuasqgTivTY3GabW1yP57LQSsJNQfKoX1BKYGHducrhb0bTwvigfn3gE*',
        'app_version': '3.1.0.1',
        'device_platform': 'android',
        'personalized_recommend_status': '1',
        'device_type': 'RMX1931',
        'device_brand': 'realme',
        'os_version': '9',
        'channel': 'default',
        'raw_channel': 'default',
        'oaid': '',
        'msa_oaid': '',
        'uuid': 'randomUUID_8a0324bf-03c8-4789-8ef8-12d3bcff28f5',
        'device_id': '24250683a3bdb3f118dff25ba4b1cba1a',
        'ab_id': '',
        'support_h265': '1'
    },
    timeout: 5000,
    class_name: '剧场&热播剧&会员专享&星选好剧&新剧&阳光剧场',
    class_url: '1&2&8&7&3&5',
    play_parse: true,
    class_parse: async () => {
    },
    预处理: async () => {
        let html = await post('https://u.shytkjgs.com/user/v1/account/login', {
            headers: {
                'User-Agent': 'okhttp/4.10.0',
                'Accept-Encoding': 'gzip',
                'Content-Type': 'application/x-www-form-urlencoded',
                'x-app-id': '7',
                'platform': '1',
                'manufacturer': 'realme',
                'version_name': '3.3.1',
                'user_agent': 'Mozilla/5.0 (Linux; Android 9; RMX1931 Build/PQ3A.190605.05081124; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Mobile Safari/537.36',
                'app_version': '3.3.1',
                'device_platform': 'android',
                'personalized_recommend_status': '1',
                'device_type': 'RMX1931',
                'device_brand': 'realme',
                'os_version': '9',
                'channel': 'default',
                'raw_channel': 'default',
                'oaid': '',
                'msa_oaid': '',
                'uuid': 'randomUUID_914e7a9b-deac-4f80-9247-db56669187df',
                'device_id': '24250683a3bdb3f118dff25ba4b1cba1a',
                'ab_id': '',
                'support_h265': '1'
            },
            body: "device=24250683a3bdb3f118dff25ba4b1cba1a&install_first_open=false&first_install_time=1723214205125&last_update_time=1723214205125&report_link_url="
        });
        // log('html:', html);
        html = JSON.parse(html);
        try {
            rule.headers['authorization'] = html.data.token
        } catch (e) {
            rule.headers['authorization'] = html.data.data.token
        }
        log('authorization:', rule.headers['authorization']);
    },
    推荐: async () => {
        return []
    },
    一级: async function (tid, pg, filter, extend) {
        let {input} = this;
        let d = [];
        let html = await request(input, {headers: rule.headers});
        let data = JSON.parse(html).data.list;
        data.forEach(it => {
            let id = 'https://app.whjzjx.cn/v2/theater_parent/detail?theater_parent_id=' + it.theater.id;
            d.push({
                url: id,
                title: it.theater.title,
                img: it.theater.cover_url,
                desc: it.theater.theme,
            })
        })
        return setResult(d);
    },
    二级: async function (ids) {
        let {input} = this;
        let urls = [];
        let html = await request(input, {headers: rule.headers});
        let data = JSON.parse(html).data;
        let vod = {
            vod_id: input,
            vod_name: data.theaters.son_title,
            vod_pic: data.cover_url,
        }
        let playFroms = [];
        let playUrls = [];
        data.theaters.forEach(it => {
            urls.push(it.num + '$' + encodeURIComponent(it.son_video_url));
        })
        playFroms.push('不知道倾情打造');
        vod.vod_play_from = playFroms.join('$$$');
        playUrls.push(urls.join('#'));
        vod.vod_play_url = playUrls.join('$$$');
        return vod
    },
    搜索: async function (wd, quick, pg) {
        let {input, KEY} = this
        let d = [];
        let html = await post(input, {headers: rule.headers, body: {"text": KEY}})
        let list = JSON.parse(html).data.theater.search_data;
        list.forEach(it => {
            let id = 'https://app.whjzjx.cn/v2/theater_parent/detail?theater_parent_id=' + it.id;
            d.push({
                url: id,
                title: it.title,
                desc: it.total,
                img: it.cover_url,
                content: it.introduction,
            })
        })
        return setResult(d);
    },
    lazy: async function (flag, id, flags) {
        let {input} = this;
        return {parse: 0, url: input, js: ''}
    },
};
