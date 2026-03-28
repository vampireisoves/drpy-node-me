/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '木偶[盘]',
  '类型': '影视',
  lang: 'ds'
})
*/








var rule = {
    title: '木偶[盘]',
    // host: 'https://www.mogg.top',
    host: 'http://123.666291.xyz',
    url: '/index.php/vod/show/id/fyfilter.html',
    filter_url: '{{fl.cateId}}{{fl.area}}{{fl.by}}{{fl.class}}{{fl.lang}}{{fl.letter}}/page/fypage{{fl.year}}',
    searchUrl: '/index.php/vod/search/page/fypage/wd/**.html',
    filter: 'H4sIAAAAAAAAA+2YbW8SWRTHv8u87iYMrVZ557P1+flp4wvUya7Z2k1adpPGNFEpCNQW21QoW6o1CwXdUqY+dNsh0C/DnYFvsYF77jlnVCZk9UWN847/7z935p5z5t57hoearoV+fqj9ZkxqIe3uaHhiQhvQxsIPDC2kiWTJjsa0Ae3P8OgfRve6sQ6OldvRMplaSNOmBsDL5EWyBBSE8pzEJo0AoTz78XP7UQY8EHjPVLlZz6t7SoH3LM2LnZq6pxQ4js8QBD4vsdS0kup5UiivVVkTz96CBwKfl6o6deWBYPN0Fms0z45Ar/iU5gkC51JZazZW1VykwHHxhXbujRonBY57+dZOLKlxUvSTT/vJupOZV54U6EVT9pO/lCcFxl5Li9i2il0K5bVXFuylIngg8J6Zp62kpe4pBcbX2HAWP4r6pgoRNV6RLrT+xipKgd5cXKTfKU8KrOLuc5EqqypKQVnN2yvzmNWuQG961/lHRQICM1Cfd2p514RdaOp250q5lsLjRpgtpbwpnlm9lhKarqVUKLVzcTURKTDdazl7u6rSLQUlzLR3GpiwrsAAGnNiua6mLgWW6f0L8kBgMmc2yQOB47JFO7+uxkmB83z1hsaBoNL/Sx4ImovJ52K6xs2awlpT46TAcdNpUSiJhFoxpDGS4q6TrjjJnAoGNS3jVXtmVxRwF0ONV8S2mjW1uEDw0o+Gx36h0reqlVb5UY/Sk+kq/XK9Va2oB0jBSkEeCCzvuwJ5ILAU2bqYzZJNmhWL2VKwIpMHgr04zJOCFZlFIgVLo9iIUho7gqdx0giPUxrt7FY7+6FHGsnkaQwGgvuAdX8yPkR8iPNB4oOcB4kHOdeJ65wHiAcY1w8i1w9yfoD4Ac6HiQ9zvp/4fs4pXp3Hq1O8Oo9Xp3h1Hq9O8eo8Xp3i1Xm8OsWrB9xrwYhEDFZGUcna1dnPy9jF9quinWx8WsZDAA4hOQzkMJIjQI4gOQrkKJJjQI4hOQ7kOJITQE4gOQnkJJIRICNITgE5heQ0kNNIzgA5g+QskLNIzgE5h+Q8kPNILgC5gOQikItILgG5hOQykMtIrgC5guQqkKtIrgG5huQ6kOtIbgC5geQmkJtIbgG5hSTwk1oJnV/8hbkzydb83IKw0p+9LHK1k6mFtMj9BwbevGlZtrno8n+9H5mgLbQ6LRJxlz9x9/dxozOP2wNakHfE4Ygxco9m5GzWxMuZHrsQmZ9s5k2rxLpi1LiBrpc6ZzFeQZptv53Tk65AjVdsV0XaZFeg5mcq2e9dntx92RxR89J8g88Dj2bOqyWXHaV4vCWiqmIu1M/nh9jYEhYeRVL02db3/Pzwauu9Pj+8GlevNru585oaVxDUusfsnOoJQeDzXsTpUwEEa2opZyD67XS+usltblfEct3V6rpQP82wiMdE3sRuviv6aUD/bxPt1fB6N9i9m1rPBjtjitSqWHmNn1BK+w3pFxtSv7H0G0u/sfQby73WWA6yxnJPbslem+oXN+PvYlPdU+/AkP8O+Aerf7D6B6t/sH7Df2z2+bvqD3+yBof9l+AHfwmm/gPf45r1zyAAAA==',
    filter_def: {
        1: {cateId: '1'},
        2: {cateId: '2'},
        3: {cateId: '3'},
        4: {cateId: '4'},
        25: {cateId: '25'},
    },
    cate_exclude: '网址|专题|全部影片',
    // tab_rename: {'KUAKE1': '夸克1', 'KUAKE11': '夸克2', 'YOUSEE1': 'UC1', 'YOUSEE11': 'UC2',},
    //线路排序
    line_order: [ '百度', '优汐', '夸克', '天翼', '123', '移动', '阿里'],
    play_parse: true,
    search_match: true,
    searchable: 1,
    filterable: 1,
    timeout: 30000,
    quickSearch: 1,
    class_name: '电影&剧集&动漫&综艺&纪录片',
    class_url: '1&2&3&4&25',
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