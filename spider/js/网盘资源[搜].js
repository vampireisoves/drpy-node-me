/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '网盘资源[搜]',
  '类型': '搜索',
  lang: 'ds'
})
*/

var rule = {
    类型: '搜索',
    title: '网盘资源[搜]',
    alias: '网盘搜索引擎',
    desc: '纯搜索源',
    host: 'https://so.yinpai.xyz',
    url: '',
    searchUrl: '/api.php',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    double: true,
    play_parse: true,
    search_match: true,
    limit: 10,
 
    action: async function (action, value) {
        if (action === 'only_search') {
            return '此源为纯搜索源，直接搜索即可，如输入 大奉打更人';
        }
        return `未定义动作:${action}`;
    },

    推荐: async function () {
        return [{
            vod_id: 'only_search',
            vod_pic: this.publicUrl + '/images/icon_cookie/搜索.jpg',
            vod_name: '这是个纯搜索源哦',
            vod_tag: 'action'
        }];
    },
    二级: async function (ids) {
        let {orId} = this;
        let html = await request('https://so.yinpai.xyz/api.php?ids=' + orId);
        const data = JSON.parse(html).list[0];
        const link = data?.vod_play_url?.split('$')?.[1] || '';

        let vod = {
            vod_name: data.vod_name || '',
            vod_pic: data.vod_pic || '',
            vod_remarks: data.vod_remarks || '',
        };

        let playform = [];
        let playurls = [];
        let playPans = [];

        let panCounters = {
            '夸克': 1,
            '优汐': 1,
            '百度': 1,
            '天翼': 1,
            '123': 1,
            '移动': 1,
            '阿里': 1
        };

        let allLines = [];

        if (/\.quark/.test(link)) {
            playPans.push(link);
            let shareData = await Quark.getShareData(link);
            if (shareData) {
                let videos = await Quark.getFilesByShareUrl(shareData);
                let lineName = '夸克#' + panCounters.夸克;
                let playUrl = videos.length > 0 ?
                    videos.map(v => `${v.file_name}$${[
                        shareData.shareId,
                        v.stoken,
                        v.fid,
                        v.share_fid_token,
                        v.subtitle?.fid || '',
                        v.subtitle?.share_fid_token || ''
                    ].join('*')}`).join('#') :
                    "资源已经失效，请访问其他资源";
                allLines.push({
                    name: lineName,
                    url: playUrl,
                    type: '夸克'
                });
                panCounters.夸克++;
            }
        } else if (/\.uc/i.test(link)) {
            playPans.push(link);
            let shareData = await UC.getShareData(link);
            if (shareData) {
                let videos = await UC.getFilesByShareUrl(shareData);
                let lineName = '优汐#' + panCounters.优汐;
                let playUrl = videos.length > 0 ?
                    videos.map(v => `${v.file_name}$${[
                        shareData.shareId,
                        v.stoken,
                        v.fid,
                        v.share_fid_token,
                        v.subtitle?.fid || '',
                        v.subtitle?.share_fid_token || ''
                    ].join('*')}`).join('#') :
                    "资源已经失效，请访问其他资源";
                allLines.push({
                    name: lineName,
                    url: playUrl,
                    type: '优汐'
                });
                panCounters.优汐++;
            }
        } else if (/\.189/.test(link)) {
            playPans.push(link);
            let cloudData = await Cloud.getShareData(link);
            Object.keys(cloudData).forEach(it => {
                let lineName = '天翼-' + it;
                const urls = cloudData[it].map(item =>
                    `${item.name}$${[item.fileId, item.shareId].join('*')}`
                ).join('#');
                allLines.push({
                    name: lineName,
                    url: urls,
                    type: '天翼'
                });
            });
        } else if (/\.139/.test(link)) {
            playPans.push(link);
            let yunData = await Yun.getShareData(link);
            Object.keys(yunData).forEach(it => {
                let lineName = '移动-' + it;
                const urls = yunData[it].map(item =>
                    `${item.name}$${[item.contentId, item.linkID].join('*')}`
                ).join('#');
                allLines.push({
                    name: lineName,
                    url: urls,
                    type: '移动'
                });
            });
        } else if (/\.123/.test(link)) {
            playPans.push(link);
            let shareData = await Pan.getShareData(link);
            let videos = await Pan.getFilesByShareUrl(shareData);
            Object.keys(videos).forEach(it => {
                let lineName = '123-' + it;
                const urls = videos[it].map(v =>
                    `${v.FileName}$${[v.ShareKey, v.FileId, v.S3KeyFlag, v.Size, v.Etag].join('*')}`
                ).join('#');
                allLines.push({
                    name: lineName,
                    url: urls,
                    type: '123'
                });
            });
        } else if (/\.baidu/.test(link)) {
            playPans.push(link);
            let baiduData = await Baidu2.getShareData(link);
            Object.keys(baiduData).forEach((it, index) => {
                let lineName = '百度#' + panCounters.百度;
                const urls = baiduData[it].map(item =>
                    item.name + "$" + [item.path, item.uk, item.shareid, item.fsid].join('*')
                ).join('#');
                allLines.push({
                    name: lineName,
                    url: urls,
                    type: '百度'
                });
            });
        } else if (/\.alipan/.test(link)) {
            playPans.push(link);
            const shareData = await Ali.getShareData(link);
            if (shareData) {
                const videos = await Ali.getFilesByShareUrl(shareData);
                let lineName = '阿里#' + panCounters.阿里;
                let playUrl;
                if (videos.length > 0) {
                    playUrl = videos.map((v) => {
                        const ids = [
                            v.share_id,
                            v.file_id,
                            v.subtitle ? v.subtitle.file_id : ''
                        ];
                        return `${v.name}$${ids.join('*')}`;
                    }).join('#');
                } else {
                    playUrl = "资源已经失效，请访问其他资源";
                }
                allLines.push({
                    name: lineName,
                    url: playUrl,
                    type: '阿里'
                });
                panCounters.阿里++;
            }
        }

        playform = allLines.map(line => line.name);
        playurls = allLines.map(line => line.url);
        vod.vod_play_from = playform.join("$$$");
        vod.vod_play_url = playurls.join("$$$");
        vod.vod_play_pan = playPans.join("$$$");

        return vod;
    },
    搜索: async function (wd, pg) {
        let {input} = this;
        const types = ['baidu', 'xunlei', 'tianyi', 'aliyun', 'uc', 'dquark', 'mobile'];
        const urls = types.map(type =>
            `${input}?type=${type}&wd=${encodeURIComponent(wd)}`
        );

        const htmls = await Promise.all(
            urls.map(url => request(url))
        );

        const allItems = [];
        htmls.forEach(html => {
            const data = JSON.parse(html);
            if (data.list && Array.isArray(data.list)) {
                data.list.forEach(item => {
                    allItems.push(item);
                });
            }
        });

        const d = [];
        allItems.forEach(item => {
            let title = item.vod_name;
            if (rule.search_match && !title.includes(wd)) {
                return;
            }
            d.push({
                title: title || '未知名称',
                img: item.vod_pic || '无图片',
                desc: item.vod_remarks || '无备注',
                url: item.vod_id || '无ID'
            });
        });

        return setResult(d);
    },

    lazy: async function (flag, id, flags) {
        let {input, mediaProxyUrl} = this;
        let ids = input.split('*');
        let urls = [];
        let UCDownloadingCache = {};
        let UCTranscodingCache = {};

        if (flag.startsWith('夸克')) {
            let down = await Quark.getDownload(ids[0], ids[1], ids[2], ids[3], true);
            let headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'origin': 'https://pan.quark.cn',
                'referer': 'https://pan.quark.cn/',
                'Cookie': Quark.cookie
            };
            urls.push("原画", down.download_url + '#fastPlayMode##threads=10#');
            urls.push(
                "原代服",
                mediaProxyUrl + `?thread=${ENV.get('thread') || 6}&form=urlcode&randUa=1&url=` +
                encodeURIComponent(down.download_url) + '&header=' + encodeURIComponent(JSON.stringify(headers))
            );
            if (ENV.get('play_local_proxy_type', '1') === '2') {
                urls.push(
                    "原代本",
                    `http://127.0.0.1:7777/?thread=${ENV.get('thread') || 6}&form=urlcode&randUa=1&url=` +
                    encodeURIComponent(down.download_url) + '&header=' + encodeURIComponent(JSON.stringify(headers))
                );
            } else {
                urls.push(
                    "原代本",
                    `http://127.0.0.1:5575/proxy?thread=${ENV.get('thread') || 6}&chunkSize=256&url=` +
                    encodeURIComponent(down.download_url)
                );
            }
            let transcoding = (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter((t) => t.accessable);
            transcoding.forEach((t) => {
                let res = t.resolution === 'low' ? "流畅" :
                    t.resolution === 'high' ? "高清" :
                        t.resolution === 'super' ? "超清" :
                            t.resolution === 'dolby_vision' ? "HDR" : "4K";
                urls.push(res, t.video_info.url);
            });

            return {
                parse: 0,
                url: urls,
                header: headers
            };
        } else if (flag.startsWith('优汐')) {
            let down = await UC.getDownload(ids[0], ids[1], ids[2], ids[3], true);
            down.forEach(t => {
                let res = t.name === 'low' ? "流畅" :
                    t.name === 'high' ? "高清" :
                        t.name === 'super' ? "超清" :
                            t.name === 'dolby_vision' ? "HDR" : "4K";
                urls.push(res, `${t.url}`);
            });

            return {parse: 0, url: urls};
        } else if (flag.startsWith('移动')) {
            let url = await Yun.getSharePlay(ids[0], ids[1]);
            return {
                url: `${url}`
            };
        } else if (flag.startsWith('天翼')) {
            let url = await Cloud.getShareUrl(ids[0], ids[1]);
            return {
                url: `${url}`
            };
        } else if (flag.startsWith('123')) {
            let url = await Pan.getDownload(ids[0], ids[1], ids[2], ids[3], ids[4]);
            urls.push("原画", url);
            return {
                parse: 0,
                url: urls
            };
        } else if (flag.startsWith('阿里')) {
            const transcoding_flag = {
                UHD: "4K 超清",
                QHD: "2K 超清",
                FHD: "1080 全高清",
                HD: "720 高清",
                SD: "540 标清",
                LD: "360 流畅"
            };
            const down = await Ali.getDownload(ids[0], ids[1], flag === 'down');
            urls.push("原画", down.url + "#isVideo=true##ignoreMusic=true#");
            urls.push("极速原画", down.url + "#fastPlayMode##threads=10#");
            const transcoding = (await Ali.getLiveTranscoding(ids[0], ids[1])).sort((a, b) => b.template_width - a.template_width);
            transcoding.forEach((t) => {
                if (t.url !== '') {
                    urls.push(transcoding_flag[t.template_id], t.url);
                }
            });
            return {
                parse: 0,
                url: urls,
                header: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Referer': 'https://www.aliyundrive.com/'
                }
            };
        } else if (flag.startsWith('百度')) {
            let url = await Baidu2.getAppShareUrl(ids[0], ids[1], ids[2], ids[3]);
            urls.push("原画", url + "#isVideo=true##fastPlayMode##threads=10#");
            urls.push(
                "原代本",
                `http://127.0.0.1:7777/?thread=${ENV.get('thread') || 6}&form=urlcode&randUa=1&url=` +
                encodeURIComponent(url)
            );
            return {
                parse: 0,
                url: urls,
                header: {
                    'User-Agent': 'netdisk;1.4.2;22021211RC;android-android;12;JSbridge4.4.0;jointBridge;1.1.0;',
                }
            };
        }
    }
}