/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '兄弟盘[搜]',
  '类型': '搜索',
  lang: 'ds'
})
*/

var rule = {
    类型: '搜索',
    title: '兄弟盘[搜]',
    alias: '网盘搜索引擎',
    desc: '仅搜索源纯js写法',
    host: 'https://xiongdipan.com',
    url: '',
    searchUrl: 'search?page=fypage&k=**&s=1&t=7',
    headers: {
        'User-Agent': 'PC_UA'
    },
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    double: true,
    play_parse: true,
    limit: 10,
   // 百度_img: 'https://pan.losfer.cn/view.php/15f16a3203e73ebfa1dab24687b78b96.png',

    action: async function (action, value) {
        if (action === 'only_search') {
            return '此源为纯搜索源，直接搜索即可，如输入 大奉打更人'
        }
        return `未定义动作:${action}`
    },

    推荐: async function () {
        let {publicUrl} = this;
        let baidu_img = urljoin(publicUrl, './images/icon_cookie/百度.png');
        return [{
            vod_id: 'only_search',
            vod_name: '这是个百度纯搜索源哦',
            vod_tag: 'action',
            vod_pic: baidu_img,
        }]
    },

    二级: async function(ids) {
        let {input} = this;
        VOD = {};
        let html = await request(input);
        const regex = /window\.open\(\s*["'](https?:\/\/[^"'\s]+)["']/gi;
        const matches = html.match(regex);
        const pans = matches ? matches.map(m => m.replace(/window\.open\(\s*["']|["']/gi, '')) : [];

        let link = pans.length > 0 ? pans[0] : '';
        // 无效链接直接返回
        if (!link) {
            VOD.vod_play_from = '资源失效';
            VOD.vod_play_url = '资源失效$1';
            return VOD;
        }

        let playform = [];
        let playurls = [];
        // 处理百度网盘链接
        if (/baidu/i.test(link)) {
            try {
                let data = await Baidu2.getShareData(link);
                let vod_content_add = ['百度网盘'];
                const allVideos = Object.values(data).flatMap((items, index) => {
                    vod_content_add.push(Object.keys(data)[index]);
                    return items;
                });
                
                if (allVideos.length > 0) {
                    playform.push(`百度#1`);
                    playurls.push(allVideos.map(item =>
                        `${item.name}$${item.path}*${item.uk}*${item.shareid}*${item.fsid}`
                    ).join('#'));
                } else {
                    playform.push(`资源已经失效`);
                    playurls.push("资源已经失效");
                }
            } catch (error) {
                playform.push(`资源已经失效`);
                playurls.push("资源已经失效，请访问其他资源");
            }
        }
        VOD.vod_play_from = playform.join("$$$") || '暂无播放源';
        VOD.vod_play_url = playurls.join("$$$") || '暂无播放链接$暂无';
        VOD.vod_play_pan = link;

        return VOD;
    },

    搜索: async function(wd, pg) {
        let { input, pdfa, pdfh, pd, publicUrl, host } = this;
        let html = await request(input);
        let d = [];

        // 提取搜索结果项和链接
        let items = pdfa(html, '#app van-card');
        let links = pdfa(html, '#app van-row a[href*="/s/"]');

        // 将结果项与链接关联
        items.forEach((it, index) => {
            if (index < links.length) {
                let title = pdfh(it, 'template:eq(0)&&Text');
                let desc = pdfh(it, 'template:eq(1)&&Text');
                let url = pd(links[index], 'a&&href');
                d.push({
                    title: title,
                    img: urljoin(publicUrl, './images/icon_cookie/百度.png'),
                    desc: '百度网盘',
                    content: '百度网盘',
                    url: url
                });
            }
        });

        return setResult(d);
    },

    lazy: async function(flag, id, flags) {
        let {input} = this;
        let ids = input.split('*');
        if (flag.startsWith('百度')) {
            console.log('百度网盘开始解析');
            // App原画不转存
            let url = await Baidu2.getAppShareUrl(ids[0], ids[1], ids[2], ids[3]);
            return {
                parse: 0,
                url: `${url}#isVideo=true##fastPlayMode##threads=10#`,
                header: {
                    "User-Agent": 'netdisk;P2SP;2.2.91.136;android-android;',
                    "Cookie": ENV.get('baidu_cookie'),
                }
            };
        }
    },
}