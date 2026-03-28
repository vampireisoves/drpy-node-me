/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '兄弟盘[搜]',
  lang: 'ds'
})
*/


var rule = {
    类型: '搜索',
    title: '兄弟盘[搜]',
    alias: '网盘搜索引擎',
    desc: '仅搜索源纯js写法',
    host: 'https://ysxjjkl.souyisou.top',
    url: '',
    searchUrl: '?search=**&limit=12&page=fypage',
    headers: {
        'User-Agent': 'PC_UA'
    },

    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    double: true,
    play_parse: true,
    limit: 10,
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

    二级: async function (ids) {
        let {orId} = this;
        VOD = {};
        let link = orId || '';
        // 无效链接直接返回
        if (!link) {
            VOD.vod_play_from = '资源失效';
            VOD.vod_play_url = '资源失效$1';
            return VOD;
        }

        let playform = [];
        let playurls = [];
        // 处理百度网盘链接
        // if (/baidu/i.test(link)) {
        //     try {
        //         let shareData = await Baidu.getShareData(link);
        //         let videos = await Baidu.getFilesByShareUrl(shareData);
        //         playform.push(`百度#1`);
        //         playurls.push(videos.videos.map(v =>
        //             `${v.file_name}$${[shareData.shareId, v.fid, v.file_name].join('*')}`
        //         ).join('#'));
        //     } catch (error) {
        //         playform.push(`资源已经失效`);
        //         playurls.push("资源已经失效，请访问其他资源");
        //     }
        // }

        if (/pan.baidu.com/.test(link)) {
            let data = await Baidu2.getShareData(link)

            const allLines = Object.keys(data);
            const lineCount = allLines.length;

            allLines.forEach((it, index) => {
                let lineName;
                if (lineCount > 1) {
                    const fullFileName = data[it][0].name;
                    const fileNameWithoutSuffix = fullFileName.substring(0, fullFileName.lastIndexOf('.'));
                    lineName = '百度#' + fileNameWithoutSuffix;
                } else {
                    // 单线路：固定为"百度#1"
                    lineName = '百度#1';
                }
                playform.push(lineName);

                // 原urls逻辑保持不变
                const urls = data[it].map(item => item.name + "$" + [item.path, item.uk, item.shareid, item.fsid].join('*')).join('#');
                playurls.push(urls);
            })
        }

        VOD.vod_play_from = playform.join("$$$") || '暂无播放源';
        VOD.vod_play_url = playurls.join("$$$") || '暂无播放链接$暂无';
        VOD.vod_play_pan = link;

        return VOD;
    },

    搜索: async function (wd, pg) {
        let {input, pdfa, pdfh, pd, host, publicUrl} = this;
        let baidu_img = urljoin(publicUrl, './images/icon_cookie/百度.png');
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '#searchWrapper .box');
        data.forEach((it, index) => {
            let title = pdfh(it, '.info&&Text').trim().split('链接')[0];
            let link = pdfh(it, '.info a&&href');
            let code = pdfh(it, '.js-copy-code&&data-clipboard-text');
            d.push({
                title: title,
                img: baidu_img,
                desc: '百度网盘',
                content: '百度网盘',
                url: link
            });
        });

        return setResult(d);
    },

    lazy: async function (flag, id, flags) {
        let {input} = this;
        let urls = [];
        let ids = input.split('*');
        // if (flag.startsWith('百度')) {
        //     console.log("百度网盘解析开始");
        //     let down = await Baidu.getDownload(ids[0], ids[1], ids[2]);
        //     let headers = {
        //         'User-Agent': 'netdisk;1.4.2;22021211RC;android-android;12;JSbridge4.4.0;jointBridge;1.1.0;',
        //         'Referer': 'https://pan.baidu.com'
        //     };
        //
        //     urls.push("原画", `${down.dlink}`);
        //     return {
        //         parse: 0,
        //         url: urls,
        //         header: headers
        //     };
        // }

        if (flag.startsWith('百度')) {
            log('百度网盘开始解析')
            //网页转码
            // let url = await Baidu.getShareUrl(ids[0],ids[1],ids[2],ids[3])
            // let urls = []
            // url.map(it=>{
            //     urls.push(it.name,it.url + "#isVideo=true##fastPlayMode##threads=10#")
            // })
            // return {
            //     parse:0,
            //     url:urls,
            //     header:{
            //         "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
            //         "Cookie": ENV.get('baidu_cookie'),
            //     }
            // }
            //App原画不转存
            let url = await Baidu2.getAppShareUrl(ids[0], ids[1], ids[2], ids[3])
            return {
                parse: 0,
                url: url + "#isVideo=true##fastPlayMode##threads=10#",
                header: {
                    "User-Agent": 'netdisk;P2SP;2.2.91.136;android-android;'
                    // "Cookie": ENV.get('baidu_cookie'),
                }
            }
        }
    },
}