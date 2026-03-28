/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '多多[盘]',
  lang: 'ds'
})
*/


var rule = {
    title: '多多[盘]',
    host: 'https://tv.yydsys.top',
    url: '/index.php/vod/show/id/fyfilter.html',
    filter_url: '{{fl.cateId}}{{fl.area}}{{fl.by or "/by/time"}}{{fl.class}}{{fl.lang or "/lang/国语"}}{{fl.letter}}/page/fypage{{fl.year}}',
    searchUrl: '/index.php/vod/search/page/fypage/wd/**.html',
    filter: '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',
    filter_def: {
        1: {
            cateId: '1'
        },
        2: {
            cateId: '2'
        },
        3: {
            cateId: '3'
        },
        4: {
            cateId: '4'
        },
        5: {
            cateId: '5'
        },
        20: {
            cateId: '20'
        }
    },
    headers: {
        "User-Agent": "PC_UA",
        'Accept': 'text/html; charset=utf-8'
    },
    cate_exclude: '网址|专题|全部影片',
    /*
    tab_rename: {
        'KUAKE1': '夸克1',
        'KUAKE11': '夸克2',
        'YOUSEE1': 'UC1',
        'YOUSEE11': 'UC2',
    },
    */
    //线路排序
    line_order: [ '百度', '优汐', '夸克', '天翼', '123', '移动', '阿里'],
    play_parse: true,
    search_match: true,
    searchable: 1,
    filterable: 1,
    timeout: 30000,
    quickSearch: 1,
    class_name: '电影&剧集&动漫&综艺&记录',
    class_url: '1&2&4&3&5&20',
    class_parse: async () => {
    },
    预处理: async () => {
        return []
    },

    推荐: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.module-items .module-item');
        data.forEach(it => {
            let title = pdfh(it, 'a&&title');
            d.push({
                title: title,
                img: pd(it, 'img&&data-src'),
                desc: pdfh(it, '.module-item-text&&Text'),
                url: pd(it, 'a&&href')
            });
        });
        return setResult(d);
    },
    一级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.module-items .module-item');
        data.forEach(it => {
            let title = pdfh(it, 'a&&title');
            d.push({
                title: title,
                img: pd(it, 'img&&data-src'),
                desc: pdfh(it, '.module-item-text&&Text'),
                url: pd(it, 'a&&href')
            });
        });
        return setResult(d);
    },
    二级: async function (ids) {
    try {
        console.log("开始加载二级内容...");
        let loadStartTime = Date.now();
        let { input, pdfa, pdfh, pd } = this;
        let html = await request(input);
        let data = pdfa(html, '.module-row-title');

        let vod = {
            vod_name: pdfh(html, '.video-info&&h1&&Text') || '',
            type_name: pdfh(html, '.tag-link&&Text') || '',
            vod_pic: pd(html, '.lazyload&&data-original||data-src||src') || '',
            vod_content: pdfh(html, '.sqjj_a--span&&Text') || '',
            vod_remarks: pdfh(html, '.video-info-items:eq(3)&&Text') || '',
            vod_year: pdfh(html, '.tag-link:eq(2)&&Text') || '',
            vod_area: pdfh(html, '.tag-link:eq(3)&&Text') || '',
            vod_actor: pdfh(html, '.video-info-actor:eq(1)&&Text') || '',
            vod_director: pdfh(html, '.video-info-actor:eq(0)&&Text') || ''
        };

        let playform = [];
        let playurls = [];
        let playPans = [];

        // 按网盘类型计数（用于线路命名
        let panCounters = {
            '夸克': 1,
            '优汐': 1,
            '百度': 1,
            '天翼': 1,
            '123': 1,
            '移动': 1,
            '阿里': 1 
        };

        // 收集所有线路信息（用于后续排序）
        let allLines = [];

        // 1. 统一收集所有链接并自动去重
        let allLinks = new Set();
        for (let item of data) {
            let link = pd(item, 'p&&Text');
            if (link) {
                link = link.trim();
                allLinks.add(link); 
            }
        }

        // 2. 统计去重后的百度链接数量（用于百度线路命名逻辑）
        let baiduLinks = Array.from(allLinks).filter(link => /pan\.baidu\.com/.test(link));
        let baiduLinkCount = baiduLinks.length;

        // 3. 遍历去重后的链接，按网盘类型逐一处理
        for (let link of allLinks) {
            // 夸克网盘处理
            if (/\.quark/.test(link)) {
                playPans.push(link);
                let shareData = await Quark.getShareData(link);
                if (shareData) {
                    let videos = await Quark.getFilesByShareUrl(shareData);
                    let lineName = '夸克#' + panCounters.夸克;
                    // 处理视频链接或失效提示
                    let playUrl = videos.length > 0 
                        ? videos.map(v => `${v.file_name}$${[
                            shareData.shareId,
                            v.stoken,
                            v.fid,
                            v.share_fid_token,
                            v.subtitle?.fid || '',
                            v.subtitle?.share_fid_token || ''
                        ].join('*')}`).join('#')
                        : "资源已经失效，请访问其他资源";
                    allLines.push({ name: lineName, url: playUrl, type: '夸克' });
                    panCounters.夸克++;
                }
            }
            // 优汐（UC）网盘处理
            else if (/\.uc/i.test(link)) {
                playPans.push(link);
                let shareData = await UC.getShareData(link);
                if (shareData) {
                    let videos = await UC.getFilesByShareUrl(shareData);
                    let lineName = '优汐#' + panCounters.优汐;
                    let playUrl = videos.length > 0 
                        ? videos.map(v => `${v.file_name}$${[
                            shareData.shareId,
                            v.stoken,
                            v.fid,
                            v.share_fid_token,
                            v.subtitle?.fid || '',
                            v.subtitle?.share_fid_token || ''
                        ].join('*')}`).join('#')
                        : "资源已经失效，请访问其他资源";
                    allLines.push({ name: lineName, url: playUrl, type: '优汐' });
                    panCounters.优汐++;
                }
            }
            // 天翼网盘处理
            else if (/\.189/.test(link)) {
                playPans.push(link);
                let cloudData = await Cloud.getShareData(link);
                Object.keys(cloudData).forEach(it => {
                    let lineName = '天翼-' + it;
                    const urls = cloudData[it].map(item => 
                        `${item.name}$${[item.fileId, item.shareId].join('*')}`
                    ).join('#');
                    allLines.push({ name: lineName, url: urls, type: '天翼' });
                });
            }
            // 移动网盘处理
            else if (/\.139/.test(link)) {
                playPans.push(link);
                let yunData = await Yun.getShareData(link);
                Object.keys(yunData).forEach(it => {
                    let lineName = '移动-' + it;
                    const urls = yunData[it].map(item => 
                        `${item.name}$${[item.contentId, item.linkID].join('*')}`
                    ).join('#');
                    allLines.push({ name: lineName, url: urls, type: '移动' });
                });
            }
            // 123网盘处理
            else if (/\.123/.test(link)) {
                playPans.push(link);
                let shareData = await Pan.getShareData(link);
                let videos = await Pan.getFilesByShareUrl(shareData);
                Object.keys(videos).forEach(it => {
                    let lineName = '123-' + it;
                    const urls = videos[it].map(v => 
                        `${v.FileName}$${[v.ShareKey, v.FileId, v.S3KeyFlag, v.Size, v.Etag].join('*')}`
                    ).join('#');
                    allLines.push({ name: lineName, url: urls, type: '123' });
                });
            }
            // 百度网盘处理（保留原命名逻辑）
            else if (/\.baidu/.test(link)) {
                playPans.push(link);
                let baiduData = await Baidu2.getShareData(link);
                
                Object.keys(baiduData).forEach((it, index) => {
                    let lineName;
                    // 单个百度链接：命名为"百度#1"；多个：按链接后缀命名
                    if (baiduLinkCount === 1) {
                        lineName = '百度#1';
                    } else {
                        let lastPart = it.split('/').pop();
                        lineName = '百度-' + lastPart;
                    }

                    const urls = baiduData[it].map(item => 
                        item.name + "$" + [item.path, item.uk, item.shareid, item.fsid].join('*')
                    ).join('#');
                    allLines.push({ name: lineName, url: urls, type: '百度' });
                });
            }
            else if (/\.alipan/.test(link)) {
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
                        playUrl = "资源已经失效，请访问其他资源"; // 失效提示与其他网盘统一
                    }
                    allLines.push({ name: lineName, url: playUrl, type: '阿里' });
                    panCounters.阿里++; 
                }
            }
        }

        allLines.sort((a, b) => {
            let aIndex = rule.line_order.indexOf(a.type);
            let bIndex = rule.line_order.indexOf(b.type);
            // 未在排序列表的线路放最后
            if (aIndex === -1) aIndex = Infinity;
            if (bIndex === -1) bIndex = Infinity;
            return aIndex - bIndex;
        });

        // 5. 组装最终结果
        playform = allLines.map(line => line.name);
        playurls = allLines.map(line => line.url);
        vod.vod_play_from = playform.join("$$$");
        vod.vod_play_url = playurls.join("$$$");
        vod.vod_play_pan = playPans.join("$$$");

        return vod;
    } catch (error) {
        console.error(`❌ 二级函数执行出错: ${error.message}`);
        // 错误时返回统一错误信息
        return {
            vod_name: '加载失败',
            type_name: '错误',
            vod_pic: '',
            vod_content: `加载失败: ${error.message}`,
            vod_remarks: '请检查网络连接或配置是否正确',
            vod_play_from: '加载错误$$$所有链接无效',
            vod_play_url: `错误详情: ${error.message}$$$建议重试或联系维护者`,
            vod_play_pan: ''
        };
    }
},


    搜索: async function () {
        let {input, pdfa, pdfh, pd, KEY} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.module-items .module-search-item');
        data.forEach(it => {
            let title = pdfh(it, '.video-info&&a&&title');
            if (rule.search_match) {
                data = data.filter(it => {
                    return title && new RegExp(KEY, "i").test(title);
                });
            }
            d.push({
                title: title,
                img: pd(it, 'img&&data-src'),
                desc: pdfh(it, '.module-item-text&&Text'),
                url: pd(it, '.video-info&&a&&href')
            });
        });
        return setResult(d);
    },
    lazy: async function (flag, id, flags) {
    let { input, mediaProxyUrl } = this;
    let ids = input.split('*');
    let urls = [];
    let UCDownloadingCache = {};
    let UCTranscodingCache = {};

    if (flag.startsWith('夸克')) {
        console.log("夸克网盘解析开始");
        const down = await Quark.getDownload(ids[0], ids[1], ids[2], ids[3], true);
            const headers = {
                // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 QuarkPC/4.5.5.535 quark-cloud-drive/2.5.40 Channel/pckk_other_ch',
                // 'origin': 'https://pan.quark.cn',
                // 'referer': 'https://pan.quark.cn/',
                'Cookie': ENV.get('quark_cookie')
            };
            down.forEach((t) => {
                if(t.url!==undefined){
                    urls.push(t.name, t.url+ "#isVideo=true##fastPlayMode##threads=20#")
                    urls.push("猫"+t.name, `http://127.0.0.1:5575/proxy?thread=${ENV.get('thread') || 6}&chunkSize=1024&url=` + encodeURIComponent(t.url));
                }
            });
            const transcoding = (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter((t) => t.accessable);
            transcoding.forEach((t) => {
                urls.push(t.resolution === 'low' ? "流畅" : t.resolution === 'high' ? "高清" : t.resolution === 'super' ? "超清" : t.resolution, t.video_info.url+ "#isVideo=true##fastPlayMode##threads=20#")
            });
        
        return {
            parse: 0,
            url: urls,
            header: headers
        };
    } else if (flag.startsWith('UC')) {
        console.log("UC网盘解析开始");
        if (!UCDownloadingCache[ids[1]]) {
            let down = await UC.getDownload(ids[0], ids[1], ids[2], ids[3], true);
            if (down) UCDownloadingCache[ids[1]] = down;
        }
        let downCache = UCDownloadingCache[ids[1]];
        return await UC.getLazyResult(downCache, mediaProxyUrl);
    } else if (flag.startsWith('移动')) {
        console.log("移动网盘解析开始");
        let url = await Yun.getSharePlay(ids[0], ids[1]);
        return {
            url: `${url}`
        };
    } else if (flag.startsWith('天翼')) {
        console.log("天翼网盘解析开始");
        let url = await Cloud.getShareUrl(ids[0], ids[1]);
        return {
            url: `${url}`
        };
    } else if (flag.startsWith('123')) {
        console.log("123网盘解析开始");
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
        console.log("阿里网盘解析开始"); 
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
        console.log("百度网盘开始解析"); // 统一引号格式
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
                "User-Agent": 'netdisk;P2SP;2.2.91.136;android-android;'
                // "Cookie": ENV.get('baidu_cookie'),
            }
        };
    }
},
}