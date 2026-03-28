/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: 'iptv',
  lang: 'ds'
})
*/

var rule = {
    类型: '代理',
    title: 'iptv',
    alias: 'iptv代理引擎',
    desc: '仅代理源纯js写法',
    host: 'hiker://empty',
    url: '',
    searchUrl: '',
    headers: {
        'User-Agent': 'PC_UA',
    },
    searchable: 0,
    quickSearch: 0,
    filterable: 0,
    double: true,
    play_parse: true,
    limit: 10,
    class_name: '',
    class_url: '',
    lazy: async function () {
    },
    proxy_rule: async function (params) {
        let {input, proxyPath, getProxyUrl} = this;
        // log('proxyPath:', proxyPath);
        // log('getProxyUrl:', getProxyUrl());
        // log('params:', params);
        let resp_not_found = [404, 'text/plain', 'not found'];
        if (proxyPath === 'live') {
            let m3u_text = pathLib.readFile('./iptv/iptv.m3u');
            let m3u_api = getProxyUrl().split('?')[0] + 'jsyd';
            let m3u_content = m3u_text.replaceAll('http://$api', m3u_api);
            return [200, 'text/plain', m3u_content]
        } else if (proxyPath === 'jsyd') {
            const {p, id} = params;
            if (!p || !id) {
                return resp_not_found
            }
            const cleanId = id.replace('.m3u8', '');
            const authParams = await fHurl(cleanId, p);

            const redirectUrl = `http://tptvh.mobaibox.com/${p}/lookback/${cleanId}/${cleanId}?${authParams}&Author=DaBenDan`;
            return [302, null, '', {location: redirectUrl}]
        }
        return resp_not_found
    },
    action: async function (action, value) {
        if (action === 'only_proxy') {
            return '此源为纯代理源，你直接复制代理地址拿去用就好了'
        }
        return `没有动作:${action}的可执行逻辑`
    },
    推荐: async function () {
        let {getProxyUrl} = this;
        let live_url = getProxyUrl().split('?')[0] + 'live';
        log('live_url:', live_url);
        return [{
            vod_id: 'only_proxy',
            vod_name: '这是个纯代理源哦',
            vod_tag: 'action'
        },
            {
                vod_id: JSON.stringify({
                    actionId: '代理地址',
                    id: 'proxy_iptv',
                    type: 'input',
                    title: '直接用的代理m3u链接',
                    value: live_url,
                }),
                vod_name: '复制代理地址',
                vod_tag: 'action'
            }
        ]
    },
    一级: async function () {
        return []
    },
    二级: async function () {
        return {}
    },
    搜索: async function () {
        return []
    }
}

// 模拟 PHP 的 f_curl 函数
const fCurl = async (url, headers = {}, data = null, resolveHosts = null, includeHeaders = false) => {
    try {
        const options = {
            url,
            method: data ? 'POST' : 'GET',
            headers,
            data,
            validateStatus: () => true,
        };

        if (resolveHosts) {
            options.headers['Host'] = resolveHosts;
        }

        const response = await axios(options);
        return includeHeaders ? response.headers : response.data;
    } catch (error) {
        console.error('Error in fCurl:', error.message);
        return null;
    }
};

// 模拟 PHP 的 f_hurl 函数
const fHurl = async (id, pt, attempt = 1) => {
    if (attempt > 3) {
        throw new Error('404');
    }

    const headers = {'User-Agent': 'okhttp/3.12.0'};
    const requestBody = JSON.stringify({ContentID: id});
    const response = await fCurl('http://223.105.251.59:33200/EPG/Ott/jsp/Auth.jsp', headers, requestBody);

    if (!response) {
        throw new Error('404');
    }

    const auth = response?.AuthCode;

    if (!auth) {
        throw new Error('404');
    }

    if (auth === 'accountinfo=') {
        return fHurl(id, pt, attempt + 1);
    }

    const decodedAuth = decodeURIComponent(auth).split(':')[0] + ',END';
    return decodedAuth;
};
