/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '网盘[模板]',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    title: '网盘[模板]',
    host: '',
    url: '',
    searchUrl: '*',
    headers: {
        "User-Agent": "PC_UA",
        'Accept': 'text/html; charset=utf-8'
    },
    line_order: [ '百度', '优汐', '夸克', '天翼', '123', '移动', '阿里'],
    play_parse: true,
    search_match: true,
    searchable: 1,
    filterable: 1,
    timeout: 60000,
    quickSearch: 1,
    
    hostJs: async function() {
    let startTime = Date.now();
    
    try {
        // 解析参数
        let parts = rule.params.split('$');
        let _host = parts[0];
        let html = await request(_host);
        let json = JSON.parse(html);
        let paramKey = decodeURIComponent(parts[1]);
        let config = json[paramKey] || {};
        rule_type = parts.length > 2 ? parts[2] : "";
        rule._name = paramKey;

        // 处理域名配置
        let domains = Array.isArray(config) ? config : [config];
        domains = domains.filter(u => u?.trim()).map(u => {
            u = u.trim();
            return /^https?:\/\//i.test(u) ? u : 
                   (u.includes('https') || u.includes('ssl')) ? `https://${u.replace(/^(https?:\/\/)?/i, '')}` : 
                   `http://${u.replace(/^(https?:\/\/)?/i, '')}`;
        });

        console.log(`${rule._name}域名加载成功，共${domains.length}个`);

        // 域名检查函数 - 使用HEAD方法提高速度
        let check = url => new Promise(resolve => {
            let mod = url.startsWith('https') ? require('https') : require('http');
            let t0 = Date.now();
            
            let options = {
                method: 'HEAD',
                timeout: 2000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0 Safari/537.36'
                }
            };
            
            let req = mod.request(url, options, res => {
                let t = Date.now() - t0;
                let valid = res.statusCode >= 200 && res.statusCode < 400;
                console.log(`${valid ? '✅' : '❌'} ${url} (${t}ms, 状态: ${res.statusCode})`);
                resolve({ url, t, valid, code: res.statusCode });
                req.destroy();
            }).on('error', () => {
                resolve({ url, t: Infinity, valid: false, code: 0 });
            }).on('timeout', () => {
                req.destroy();
                resolve({ url, t: 2000, valid: false, code: 0 });
            });
            
            req.end();
        });

        // 并发检查域名
        const CONCURRENT_LIMIT = 5;
        let results = [];
        
        for (let i = 0; i < domains.length; i += CONCURRENT_LIMIT) {
            const chunk = domains.slice(i, i + CONCURRENT_LIMIT);
            const chunkResults = await Promise.all(chunk.map(check));
            results = results.concat(chunkResults);
            
            // 提前终止检查
            const validResults = results.filter(r => r.valid);
            if (validResults.length > 0) break;
        }
        
        // 选择最佳域名
        let validDomains = results.filter(x => x.valid);
        validDomains.sort((a, b) => a.t - b.t);
        let bestDomain = validDomains[0]?.url || domains[0];
        
        console.log(validDomains.length ? 
            `✅ 最终选用: ${bestDomain}（延迟: ${validDomains[0].t}ms）` : 
            `⚠️ 无可用域名，使用默认: ${bestDomain}`
        );
        
        return bestDomain;
    } catch (e) {
        console.error(`域名检测出错: ${e.message}`);
        return '';
    } finally {
        console.log(`⏱️ 域名检测耗时: ${Date.now() - startTime}ms`);
    }
},

    class_parse: async function () {
        const { input, pdfa, pdfh, pd, host, MY_CATE } = this;
        const classes = [];
        const filters = {};
        const seenTypeIds = new Set();
        
        // 添加缓存逻辑
        const cacheExpiration = 30 * 24 * 60 * 60 * 1000;
        const cacheKey = `${input}_${MY_CATE || 'default'}`;

        if (!this.cache) this.cache = {};

        if (this.cache[cacheKey] && this.cache[cacheKey].timestamp > Date.now() - cacheExpiration) {
            console.log(`📦 命中缓存 [Key: ${cacheKey}]`);
            return {
                class: this.cache[cacheKey].data,
                filters: this.cache[cacheKey].filters || {}
            };
        }

        try {
            const html = await request(input);
            const navItems = pdfa(html, '.nav-menu-items&&li');
            
            navItems.forEach((item) => {
                const href = pd(item, 'a&&href').trim();
                const typeName = pdfh(item, 'a&&Text').trim();
                const matchResult = href.match(/\/([^\/]+)\.html$/);
                
                if (matchResult && typeName && !seenTypeIds.has(matchResult[1])) {
                    const typeId = matchResult[1];
                    if (/^\d+$/.test(typeId)) {
                        classes.push({
                            type_name: typeName,
                            type_id: typeId
                        });
                        seenTypeIds.add(typeId);
                    }
                }
            });
            const htmlArr = await batchFetch(classes.map(item => {
                let url = rule_type ? 
                    `${host}/vodshow/${item.type_id}-----------.html` :
                    `${host}/index.php/vod/show/id/${item.type_id}.html`;
                return {
                    url: url,
                    options: { timeout: 100000, headers: rule.headers}
                };
            }));
            
            const CATEGORIES = [
                {key:'cateId', name:'类型', reg:/\/id\/(\d+)/},
                {key:'class', name:'剧情'},
                {key:'lang', name:'语言'},
                {key:'area', name:'地区'},
                {key:'year', name:'时间'},
                {key:'letter', name:'字母'},
            ];
            
            const SORT_OPTIONS = {
                "时间": "time",
                "人气": "hits",
                "评分": "score",
            };

            htmlArr.forEach((it, i) => {
                if (!it) {
                    filters[classes[i].type_id] = [];
                    return;
                }
                const type_id = classes[i].type_id;
                filters[type_id] = CATEGORIES.map((category) => {
                    const box = pdfa(it, '.library-box').find(b => b.includes(category.name)) || "";
                    let values = [];
                    
                    if (box) {
                        values = pdfa(box, "div a").map(a => {
                            const n = pdfh(a, "a&&Text") || "全部";
                            let v = n;
                            
                            if (category.key === 'cateId') {
                                const href = pd(a, 'a&&href');
                                v = href.match(category.reg)?.[1] || n;
                            }
                            
                            return { n, v };
                        }).filter(x => x.n && x.v);
                    }
                    
                    return { 
                        key: category.key, 
                        name: category.name, 
                        value: values
                    };
                }).filter(item => item.value && item.value.length > 3);
                
                const sortValues = Object.entries(SORT_OPTIONS).map(([name, value]) => ({
                    n: name,
                    v: value
                }));
                
                if (sortValues.length > 0) {
                    filters[type_id].push({
                        key: "by",
                        name: "排序",
                        value: sortValues
                    });
                }
            });
            
            // 保存到缓存
            this.cache[cacheKey] = {
                timestamp: Date.now(),
                data: classes,
                filters: filters
            };
            
            return { class: classes, filters };   
        } catch (error) {
            classes.forEach(cls => {
                filters[cls.type_id] = [];
            });
            return { class: classes, filters };
        }
    },

    // 以下代码保持不变...
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
        let { input, pdfa, pdfh, pd, MY_CATE, MY_FL, MY_PAGE, host } = this;
        const fl = MY_FL || {};
        const pg = MY_PAGE || 1;
        const type = MY_CATE || fl.cateId;

        let url;
        if (rule_type) {
            url = `${host}/vodshow/${type}-${fl.area || ''}-${fl.by || 'time'}-${fl.class || ''}--${fl.letter || ''}---${pg}---${fl.year || ''}.html`;
        } else {
            const parts = [
                fl.area ? `area/${fl.area}` : '',
                fl.by ? `by/${fl.by}` : '',
                fl.class ? `class/${fl.class}` : '',
                fl.cateId ? `id/${fl.cateId}` : `id/${MY_CATE}`,
                fl.lang ? `lang/${fl.lang}` : '',
                fl.letter ? `letter/${fl.letter}` : '',
                fl.year ? `year/${fl.year}` : ''
            ].filter(Boolean);
            
            url = `${host}/index.php/vod/show/${parts.join('/')}/page/${pg}.html`;
        }
        
        let html = await request(url);
        let data = pdfa(html, '.module-items .module-item');
        let d = data.map((it) => ({
            title: pd(it, 'a&&title') || pdfh(it, '.module-item-title&&Text'),
            pic_url: pd(it, 'img&&data-src') || pd(it, 'img&&src'),
            desc: pdfh(it, '.module-item-text&&Text') || pdfh(it, '.module-item-content&&Text'),
            url: pd(it, 'a&&href')
        }));
        return setResult(d);
    },
   
    二级: async function (ids) {
        try {
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
            let allLinks = new Set();

            for (let item of data) {
                let link = pd(item, 'p&&Text');
                if (link) {
                    link = link.trim();
                    allLinks.add(link); 
                }
            }

            let baiduLinks = Array.from(allLinks).filter(link => /pan\.baidu\.com/.test(link));
            let baiduLinkCount = baiduLinks.length;

            for (let link of allLinks) {
                if (/\.quark/.test(link)) {
                    playPans.push(link);
                    let shareData = await Quark.getShareData(link);
                    if (shareData) {
                        let videos = await Quark.getFilesByShareUrl(shareData);
                        let lineName = '夸克#' + panCounters.夸克;
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
                else if (/\.baidu/.test(link)) {
                    playPans.push(link);
                    let baiduData = await Baidu2.getShareData(link);
                    
                    Object.keys(baiduData).forEach((it, index) => {
                        let lineName;
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
                            playUrl = "资源已经失效，请访问其他资源";
                        }
                        allLines.push({ name: lineName, url: playUrl, type: '阿里' });
                        panCounters.阿里++; 
                    }
                }
            }

            allLines.sort((a, b) => {
                let aIndex = rule.line_order.indexOf(a.type);
                let bIndex = rule.line_order.indexOf(b.type);
                if (aIndex === -1) aIndex = Infinity;
                if (bIndex === -1) bIndex = Infinity;
                return aIndex - bIndex;
            });

            playform = allLines.map(line => line.name);
            playurls = allLines.map(line => line.url);
            vod.vod_play_from = playform.join("$$$");
            vod.vod_play_url = playurls.join("$$$");
            vod.vod_play_pan = playPans.join("$$$");

            return vod;
        } catch (error) {
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
    
    搜索: async function(wd, quick, pg) {
        let { host, input, pdfa, pdfh, pd } = this;
        
        let url = rule_type ? 
            `${host}/vodsearch/${wd}----------${pg}---.html` :
            `${host}/index.php/vod/search/page/${pg}/wd/${wd}.html`;
                    
        let d = [];
        let html = await request(url);
        let data = pdfa(html, '.module-items .module-search-item');
        data.forEach(it => {
            let title = pdfh(it, '.video-info&&a&&title');
            let desc = pdfh(it, '.video-serial&&Text');
            let content = pdfh(it, '.video-info-item:eq(2)&&Text').replace(/(bsp;)|(&n.*?)|(&nbsp;)|(\s+)/gi, '');
            if (rule.search_match && !title.includes(wd)) {
                return;
            }
            
            d.push({
                title,
                img: pd(it, 'img&&data-src'),
                desc: desc,
                content: content,
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
                
                return { parse: 0, url: urls };
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
                    "User-Agent": 'netdisk;P2SP;2.2.91.136;android-android;'
                }
            };
        }
    }
}