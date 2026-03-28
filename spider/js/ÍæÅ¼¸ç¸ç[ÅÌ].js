/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '玩偶哥哥[盘]',
  lang: 'ds'
})
*/

var rule = {
    title: '玩偶哥哥[盘]',
    // host: 'https://www.wogg.net',
    host: 'https://www.wogg.one/',
    url: '/vodshow/fyclass-fyfilter.html',
    filter_url: '{{fl.area}}-{{fl.by or fl.time}}-{{fl.class}}-----fypage---{{fl.year}}',
    searchUrl: '/vodsearch/**--------fypage---.html',
    filter: 'H4sIAAAAAAAAA+2aa09aSRjHv8t57SYepbb1Xe/3+71NX7AN2W3Wuom6m5jGxIoXwAtoXJGC1bag2IjgZa3CAl+GmXP4Fo3McxnaakiWmnUz7/j/njMz55kz55l/hvPasq3OZ6+t33z9Vqf1osvb22u1WN3eVz6r0xLBFekfsVqsP71df/hq13Xv45F01Z/moNVpWQMtEJtLiOAKUBAYcwIb3AIExuSbiBycgxgI6jOUrhQT2KcS1OfKtNgrYJ9KUDv9DkHQeIH5Sj6I4ymBMTezLCY+QQwEjRfKOkWMgaDxwkn3I42nBMVSY3yfIOheMsuV0hLeixLUbnSmGlvFdkpQu3efZGAe2ynRyHzKoTVnbhpjSlDMH5JDbzGmBOVeCIuRXcxdCYxVF2bkfApiIKjPuTE3mMc+laD8SuvO7N+iuIEpkqYrpkZFeBPDSgw834+qNevt8Xm1JZvIiYn8QUuWgvqSrexmRLwokivV2CjE6lD9ddXlmNzN1l0H6Kv+wjm5V6rvTyGaztKUiBdxOpWgJZgqO+GME4zhKiRNk7r1F7cGQa3HNzgGgtpFUzKxhu2UoIe4uMrtQPB4OX28nB4Tpc8cA0GxyZzIL2NMCepzOCySKyKA65s1v/pLcrwsklRRSNMVIzuVAi50EPry6PJ2/8LLw81m3PTgAcuDg3UVLV50sxkcQAltojkGgh7vZpJjILSHwDEQ2kPgGAg9oX6ft4cTktGdanT7gIQ4qCfU1tp2Aljtp8Y9zD06b2fervM25m06t5nbOm9l3qpx+zRx+7TOTzE/pfOTzE/qvIN5h845X1vP1+Z8bT1fm/O19XxtztfW87U5X1vP1+Z87db6Venr6/Npj1FkojI7+e1jrGG5mJLB0teP8QyAM0TOAjlL5ByQc0TOAzlP5AKQC0QuArlI5BKQS0QuA7lM5AqQK0SuArlK5BqQa0SuA7lO5AaQG0RuArlJ5BaQW0RuA7lN5A6QO0TuArlL5B6Qe0TuA7lP5AGQB0QeAnlI5BGQR0QeA3lM5AmQJ0SeAnlKpPUnfBP2f+kL5ud+7Z2fmhH58DeLRb3tHLQ6rb6Xr3y8L+XzMjdbF//1ZV8vF7PssAiM1sV7X/ze49u/j+ctVpvxicYnGp9ofKLxicYnGp9ofKLxicYnfscntjfVJ0r/iBxeJJ9RE414Osefcd9jjQZBfU6lnQhu4SAoFnnnrJHnUaIRj+VGFtwp9IkgqM+l9yJOVVyJRjyrTOQ136YEjVeOiFAax1OiEc8qctNiD0s9CD2W2tJiqS2ez2Sp8g/6PRDsvBZFIE7OqyZ4MW2KTATtjRLUZzwkY2izQPC8bIhylOalJhrdyo/M6R3mkQ51bYf4rh/n6IwDMg7IOCDjgIwD+sEOyKM5oCM+dfh3pwlHdlZgdh2z65hdx+w6Ztdp3q5zQtt1TFE9sqJqioYpGse3aHQ09bDOmf1c/YCHZyCooqS2OAaC3n5/UewO4duvBPeZEOtL1GdNUJ9725XCR+xTCWq3WnZ3QthOCWp3yB+wlfwmZwaCczj4z1k3MiHWF7AqKkH5jU06s3iICYL6PORQsTo46n6gqqgEjReLyDfjOJ4S1C64zfcCgsZLTlYKYzieEpR7eb1SwIMnEMar/6e8utluzHZzfLcbj6e5+435UOi7e5H5UMh8KGQ+FDIfCv1fTRBzc2BpzKAxg8fUDHaYE0tTVU1VNVXVVNVmVdWBLyuBjHHQPQAA',
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
    class_parse: async () => {
        let classes = [{
            type_id: '1',
            type_name: '玩偶电影',
        }, {
            type_id: '2',
            type_name: '玩偶剧集',
        }, {
            type_id: '44',
            type_name: '臻彩视界',
        }, {
            type_id: '6',
            type_name: '玩偶短剧',
        }, {
            type_id: '3',
            type_name: '玩偶动漫',
        }, {
            type_id: '4',
            type_name: '玩偶综艺',
        }, {
            type_id: '5',
            type_name: '玩偶音乐',
        }];
        return {
            class: classes,
        }
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
        let down = await Quark.getDownload(ids[0], ids[1], ids[2], ids[3], true);
        let headers = {
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