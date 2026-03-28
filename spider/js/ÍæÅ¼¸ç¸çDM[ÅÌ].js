/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '玩偶哥哥[盘]',
  lang: 'ds'
})
*/

const {getHtml} = $.require('./_lib.request.js')
const {
    formatPlayUrl,
} = misc;
const aliTranscodingCache = {};
const aliDownloadingCache = {};
let wd_data = {}
let video_info = {}
let rule_video_info = {}
let vod_ids = []

var rule = {
    title: '玩偶哥哥[盘]',
    // host: 'https://www.wogg.net',
    host: 'https://www.wogg.one/',
    url: '/index.php/vodshow/fyclass-fyfilter.html',
    filter_url: '{{fl.area}}-{{fl.by or "time"}}-{{fl.class}}-{{fl.lang}}-{{fl.letter}}---fypage---{{fl.year}}',
    searchUrl: '/vodsearch/**----------fypage---.html',
    // filter: 'H4sIAAAAAAAAA+2a2VIbRxSG30XXTmkGjLc77/u+O+UL2VElrjhOlSGpolxUsUmWsI2AwsgEASZmDwKxhICI4GXUM9JbeKRunTnzD2WNA0kqTl/q+3+d7j7dozlHMy9CZujY1y9C30dbQ8dCjyMt0fPfhA6EnkV+iDqf7eUtMfbK+fxz5OlP0arxmYNFbLbcNVvBzgcz1Paw7QBFeBppbnYDiOSM1RX7dIBQ5dtVOpRx/IqGq5HCitUsdmJZxXMtitUsVkef1T7ktShGA/XMFgsZGEgyGmimX2xuwUCSURRaG4siGc0l8a6YT8JcJKtZStlp8Xrea1GM5tKzZBfAohhbkT245VtRhZFl6qVvRYrRdLPTxe33MF3JKEp8oDw8B1Ekoyhj884aIYpkn7FHVueCPdQPFsnI0tVjdf4CFskodVspEduA1ElWs5RHB6x3U16LYjTQ0MtSMg8DSUZ52V60B38XhWVIDWEypiZLH/DUSEaW3rhIrYBFMjo1O33O9sKpkczdqYw12o87VWVk6d6xf4OlK0YJLPTbW5ndluZR+E9A5Hk0wn4BMjnxOh/0F2Bypjwcr41TCRRWiHZretjaWPI4FHITnLM2t70xJKI1bfeKkYLHoRBt+OpbdChEG/BqGR0KUYz0lJVZ8MaQiNYyPocxFHJP1R/oUMidac4/05wnxpucyE97Y0hEMbpTTpZFYs4bhiiteWrHTmXt5LB32UTdH6P31qsd58veQYmSL7Ze3BrymiTix+lp5Nm37nEqLWVLs+1Bj9NIwfHXBqgECivEthEdCtFhWZlEh0K0jemCeJNGk0vZdvtMErEjgw6F2MH0OSRiR8a3ZolY2sVil9chEU97azTy3E27lV4vp9cCpr3BaDhYC18JE64Cpjai2sjVBlQbuGqianLVQNVgqnkUVAcw9QiqR7h6GNXDXD2E6iGuNqHaxFXMlclzZWKuTJ4rE3Nl8lyZmCuT58rEXJk8VwbmyuC5MjBXBs+VgbkyeK4MzJXBc2VgrgyeKwNzZfBcGZgrg+fKwFwZPFcG5srguTIwVw7w/EZFW1qi7HIR2bS19Cbg5XKcLsVqlPBxUk6AcoKUk6CcJOUUKKdIOQ3KaVLOgHKGlLOgnCXlHCjnSDkPynlSLoBygZSLoFwk5RIol0i5DMplUq6AcoWUq6BcJeUaKNdIuQ7KdVJugHKDlJug3CTlFii3SLkNym1S7oByh5S7oNwl5R4o90i5D8p9Uh6A8oAU46ujoFUIvwQetbK7Re+AyKd8x9+9iVTiPGoNtzxx7LUhivm8lRtk6ndPWprdG/VSt0jEmdr8+Mfn0coMHh4INeyxhW3YtxbWHs/6WljFWFFSzM/4G90qhjrX53KYtb0KvYvoWBddqd06GKV8RoMtFtdFPgsWyT6vHa3XYAdoRwM02AFapQAtYHFzwtcqKeb2mjFreAk2QzKay9u4r+9VjHVT/uMh2e5FsYrir4r30mTFY47fW3ZLFLwx2Y82rH6DFKRRq9f+BGjUhnJObyJGJ7xhiOp25S+3K7rV0K2GbjV0q6FbDd1qfBmtRuMeW43GfWs1yu1Je6Ydqn7JeNHaPe4vWh1Gi13cKeUSXotiFGUga/XAUwLF3EogZm1Aja2YW06sFjf7YLqSsXKv/AGmqxhZ8vNicQwsktFcRlb8D2skoyiD49YaPtyTjKJsbFiJVDE/4HvM4lEojWu/Oj0FpFEyirjcWep4DbEk+8cK+0pLmfI6FGI1nVPlYVFeQeRYmHE2xeuQSJfBugzWZbAug3UZrMtgXQZ/0WXwwT2WwU37VgYHqHEDvMtld2VLE1BMK0YD9c7afXEYSDKy9I3ZC/jOkmRujVb3/alS32ipF14aU4wGej8hRuBfesVooPp/wVuZvP9FLcloLvXfMwrwjpvIOcleg7lIxi1Tq37LlPuww57cLv4Jr3spRlF6x0ViBKJI5h76FZGFPkQxGmikxxqGDkIxN7vLYieN2a0yVvT93X/ky0dGnnrf+xSp/l/sn6jmd12H/ttb1/u63tf1vq73db3PFF3vf9n1ftO+1vv6YtYX8//8YtbFny7+dPEXsPj7Vx/4HtnrE19376xku5VJVp5XFt7ayZfMoG+O+uaob4765qhvjvrm+J+5ObZ9BBHdMT09QAAA',
    cate_exclude: '全部影片',
    searchable: 1, // 固定值
    filterable: 0, // 固定值
    quickSearch: 1, // 固定值
    play_parse: true,
    class_parse: async () => {
        let classes = [{
            type_id: '1',
            type_name: '电影',
        }, {
            type_id: '2',
            type_name: '剧集',
        }, {
            type_id: '3',
            type_name: '动漫',
        }, {
            type_id: '4',
            type_name: '综艺',
        }, {
            type_id: '5',
            type_name: '音乐',
        }, {
            type_id: '6',
            type_name: '短剧',
        }, {
            type_id: '44',
            type_name: ' 臻彩视界片库',
        }];
        return {
            class: classes,
        }
    },
    预处理: async () => {
        return []
    },
    推荐: async () => {
        return []
    },
    一级: async function (tid, pg, filter, extend) {
        let {MY_CATE, input} = this;
        let html = (await getHtml(input)).data
        const $ = pq(html)
        let videos = []
        $('.module-items .module-item').each((index, item) => {
            const a = $(item).find('a:first')[0];
            const img = $(item).find('img:first')[0];
            const content = $(item).find('.video-text:first').text();
            videos.push({
                "vod_name": a.attribs.title,
                "vod_id": a.attribs.href,
                "vod_remarks": content,
                "vod_pic": img.attribs['data-src']
            })
        })
        return videos
    },
    二级: async function (ids) {
        let {input,getRule} = this;
        let html = (await getHtml(input)).data
        const $ = pq(html)
        let vod = {
            "vod_name": $('h1.page-title').text(),
            "vod_id": input,
            "vod_remarks": $(' div.video-info-main div:nth-child(4) div.video-info-item').text(),
            "vod_pic": $('.lazyload').attr('data-src'),
            "vod_content": $('p.sqjj_a').text().replace(/【玩偶哥哥】[收起部分]|【玩偶哥哥】|\[收起部分\]/igs,''),
        }
        let playform = []
        let playurls = []
        for (const item of $('.module-row-title')) {
            const a = $(item).find('p:first')[0];
            let link = a.children[0].data.trim()
            if (/pan.quark.cn/.test(link)) {
                const shareData = Quark.getShareData(link);
                if (shareData) {
                    const videos = await Quark.getFilesByShareUrl(shareData);
                    if (videos.length > 0) {
                        playform.push('Quark-' + shareData.shareId);
                        playurls.push(videos.map((v) => {
                            const list = [shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle ? v.subtitle.fid : '', v.subtitle ? v.subtitle.share_fid_token : ''];
                            return v.file_name + '$' + list.join('*');
                        }).join('#'))
                    } else {
                        playform.push('Quark-' + shareData.shareId);
                        playurls.push("资源已经失效，请访问其他资源")
                    }
                }
            }
            if (/drive.uc.cn/.test(link)) {
                const shareData = UC.getShareData(link);
                if (shareData) {
                    const videos = await UC.getFilesByShareUrl(shareData);
                    if (videos.length > 0) {
                        playform.push('UC-' + shareData.shareId);
                        playurls.push(videos.map((v) => {
                            const list = [shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle ? v.subtitle.fid : '', v.subtitle ? v.subtitle.share_fid_token : ''];
                            return v.file_name + '$' + list.join('*');
                        }).join('#'))
                    } else {
                        playform.push('UC-' + shareData.shareId);
                        playurls.push("资源已经失效，请访问其他资源")
                    }
                }
            }
            if (/www.alipan.com/.test(link)) {
                const shareData = Ali.getShareData(link);
                if (shareData) {
                    const videos = await Ali.getFilesByShareUrl(shareData);
                    log(videos)
                    if (videos.length > 0) {
                        playform.push('Ali-' + shareData.shareId);
                        playurls.push(videos.map((v) => {
                            const ids = [v.share_id, v.file_id, v.subtitle ? v.subtitle.file_id : ''];
                            return formatPlayUrl('', v.name) + '$' + ids.join('*');
                        }).join('#'))
                    } else {
                        playform.push('Ali-' + shareData.shareId);
                        playurls.push("资源已经失效，请访问其他资源")
                    }
                }
            }
        }
        vod.vod_play_from = playform.join("$$$")
        vod.vod_play_url = playurls.join("$$$")
        try {
            if(video_info?.name){
                setItem('video_info', {})
                setItem('rule_video_info', {})
            }
            setItem('danmu_flag', 'qq')
            const tx_rule = await getRule('腾云驾雾[官]')
            let video_list = vod.vod_play_url.split('#')
            rule_video_info.name = video_list.map(item=>{
                return item.split('$')[0]
            })
            rule_video_info.url = video_list.map(item=>{
                return item.split('$')[1]
            })
            if (tx_rule) {
                wd_data = await tx_rule.callRuleFn('搜索', [vod.vod_name])
                if (wd_data?.list) {
                    vod_ids = wd_data.list.filter(item => item?.vod_name === vod.vod_name).map(item => item.vod_id);
                }
            }
            if(!Array.isArray(vod_ids)){
                vod_ids = []
            }
            if (vod_ids?.length) {
                let vod_data = await tx_rule.callRuleFn('二级', [vod_ids])
                if (vod_data && vod_data.list && vod_data.list.length > 0 && vod_data.list[0].vod_play_url) {
                    let video_urls = vod_data.list[0].vod_play_url.split('#')
                    video_info.name = video_urls.map(item => {
                        return item.split('$')[0]
                    })
                    video_info.url = video_urls.map(item => {
                        return item.split('$')[1]
                    })
                    setItem('video_info', video_info)
                    setItem('rule_video_info', rule_video_info)
                } else {
                    vod_ids = []
                    if (video_info?.name) {
                        setItem('video_info', {})
                        setItem('rule_video_info', {})
                    }
                    setItem('danmu_flag', 'qiyi')
                    const qy_rule = await getRule('奇珍异兽[官]')
                    let video_list = vod.vod_play_url.split('#')
                    rule_video_info.name = video_list.map(item => {
                        return item.split('$')[0]
                    })
                    rule_video_info.url = video_list.map(item => {
                        return item.split('$')[1]
                    })
                    if (qy_rule) {
                        wd_data = await qy_rule.callRuleFn('搜索', [vod.vod_name])
                        wd_data.list.forEach(item => {
                            if (wd_data !== null && wd_data !== undefined && item?.vod_name === vod.vod_name) {
                                vod_ids.push(String(item.vod_id))
                            }
                        })
                    }
                    if (vod_ids?.length && vod_ids.length > 0) {
                        let vod_data = await qy_rule.callRuleFn('二级', [vod_ids])
                        if (vod_data && vod_data.list && vod_data.list.length > 0 && vod_data.list[0].vod_play_url) {
                            let video_urls = vod_data.list[0].vod_play_url.split('#')
                            video_info.name = video_urls.map(item => {
                                return item.split('$')[0]
                            })
                            video_info.url = video_urls.map(item => {
                                return item.split('$')[1]
                            })
                            setItem('video_info', video_info)
                            setItem('rule_video_info', rule_video_info)
                        }
                    }
                }
            }
        }catch (e) {
            log(e)
        }
        return vod
    },
    搜索: async function (wd, quick, pg) {
        let {input} = this
        let html = (await getHtml(input)).data
        const $ = pq(html)
        let videos = []
        $('.module-items .module-search-item').each((index, item) => {
            const a = $(item).find('a.video-serial:first')[0];
            const img = $(item).find('img:first')[0];
            const content = $(item).find('.video-text:first').text();
            videos.push({
                "vod_name": a.attribs.title,
                "vod_id": a.attribs.href,
                "vod_remarks": content,
                "vod_pic": img.attribs['data-src']
            })
        })
        return videos
    },
    lazy: async function (flag, id, flags) {
        let {getProxyUrl,input,proxyUrl,mediaProxyUrl,getRule} = this;
        let danmu = ''
        let lazy_data = ''
        try {
            video_info = getItem('video_info')
            rule_video_info = getItem('rule_video_info')
            let danmu_flag = getItem('danmu_flag')
            const tx_rule = await getRule('腾云驾雾[官]')
            const qy_rule = await getRule('奇珍异兽[官]')
            if(danmu_flag === 'qq'){
                for (let i = 0;i < video_info.name.length;i++) {
                    if(rule_video_info.url[i] === input){
                        if(matchEpisode(video_info.name[i], rule_video_info.name[i])){
                            lazy_data = await tx_rule.callRuleFn('lazy',['我是线路',video_info.url[i]])
                            danmu = lazy_data.danmaku
                        }else {
                            lazy_data = await tx_rule.callRuleFn('lazy',['我是线路',video_info.url[i]])
                            danmu = lazy_data.danmaku
                        }
                    }
                }
            }else if(danmu_flag === 'qiyi'){
                for (let i = 0;i < video_info.name.length;i++) {
                    if(rule_video_info.url[i] === input){
                        if(matchEpisode(video_info.name[i], rule_video_info.name[i])){
                            console.log('名字匹配成功',rule_video_info.url[i],i,video_info.url[i])
                            lazy_data = await qy_rule.callRuleFn('lazy',['我是线路',video_info.url[i]])
                            danmu = lazy_data.danmaku
                        }else {
                            console.log('名字匹配失败',rule_video_info.url[i],i,video_info.url[i])
                            lazy_data = await qy_rule.callRuleFn('lazy',['我是线路',video_info.url[i]])
                            danmu = lazy_data.danmaku
                        }
                        log("数据更新"+lazy_data)
                    }
                }
            }

        }catch (e) {
            log(e)
        }
        const ids = input.split('*');
        const urls = [];
        let result = {}
        let UCDownloadingCache = {};
        let UCTranscodingCache = {};
        let downUrl = ''
        if (flag.startsWith('Quark-')) {
            log("夸克网盘解析开始")
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
            // urls.push("原画", down.download_url + '#fastPlayMode##threads=10#');
            // urls.push("原代服", mediaProxyUrl + `?thread=${ENV.get('thread') || 6}&form=urlcode&randUa=1&url=` + encodeURIComponent(down.download_url) + '&header=' + encodeURIComponent(JSON.stringify(headers)));
            // if (ENV.get('play_local_proxy_type', '1') === '2') {
            //     urls.push("原代本", `http://127.0.0.1:7777/?thread=${ENV.get('thread') || 6}&form=urlcode&randUa=1&url=` + encodeURIComponent(down.download_url) + '&header=' + encodeURIComponent(JSON.stringify(headers)));
            // } else {
            //     urls.push("原代本", `http://127.0.0.1:5575/proxy?thread=${ENV.get('thread') || 6}&chunkSize=256&url=` + encodeURIComponent(down.download_url));
            // }
            // const transcoding = (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter((t) => t.accessable);
            // transcoding.forEach((t) => {
            //     urls.push(t.resolution === 'low' ? "流畅" : t.resolution === 'high' ? "高清" : t.resolution === 'super' ? "超清" : t.resolution, t.video_info.url)
            // });
            return {
                parse: 0,
                url: urls,
                header: headers
            }
        }
        if (flag.startsWith('UC-')) {
            console.log("UC网盘解析开始")
            if (!UCDownloadingCache[ids[1]]) {
                const down = await UC.getDownload(ids[0], ids[1], ids[2], ids[3], true);
                if (down) UCDownloadingCache[ids[1]] = down;
            }
            downUrl = UCDownloadingCache[ids[1]].download_url;
            const headers = {
                "Referer": "https://drive.uc.cn/",
                "cookie": UC.cookie,
                "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch'
            };
            urls.push("UC原画", downUrl);
            urls.push("原代服", mediaProxyUrl + `?thread=${ENV.get('thread') || 6}&form=urlcode&randUa=1&url=` + encodeURIComponent(downUrl) + '&header=' + encodeURIComponent(JSON.stringify(headers)));
            if (ENV.get('play_local_proxy_type', '1') === '2') {
                urls.push("原代本", `http://127.0.0.1:7777/?thread=${ENV.get('thread') || 6}&form=urlcode&randUa=1&url=` + encodeURIComponent(downUrl) + '&header=' + encodeURIComponent(JSON.stringify(headers)));
            } else {
                urls.push("原代本", `http://127.0.0.1:5575/proxy?thread=${ENV.get('thread') || 6}&chunkSize=256&url=` + encodeURIComponent(downUrl));
            }
            // return {
            //     parse: 0,
            //     url: urls,
            //     danmaku:danmu,
            //     header: {
            //         "Referer": "https://drive.uc.cn/",
            //         "cookie": ENV.get("uc_cookie"),
            //         "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch'
            //     },
            // }
            result["parse"] = 0;
            result["url"] = urls;
            result["danmaku"] = danmu;
            result["header"] = headers
            return result
        }
        if (flag.startsWith('Ali-')) {
            const transcoding_flag = {
                UHD: "4K 超清",
                QHD: "2K 超清",
                FHD: "1080 全高清",
                HD: "720 高清",
                SD: "540 标清",
                LD: "360 流畅"
            };
            console.log("网盘解析开始")
            const down = await Ali.getDownload(ids[0], ids[1], flag === 'down');
            urls.push("原画",down.url+"#isVideo=true##ignoreMusic=true#")
            urls.push("极速原画",down.url+"#fastPlayMode##threads=10#")
            const transcoding = (await Ali.getLiveTranscoding(ids[0], ids[1])).sort((a, b) => b.template_width - a.template_width);
            transcoding.forEach((t) => {
                if(t.url!==''){
                    urls.push(transcoding_flag[t.template_id],t.url);
                }
            });
            // return {
            //     parse: 0,
            //     url: urls,
            //     danmaku:danmu,
            //     header: {
            //         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            //         'Referer': 'https://www.aliyundrive.com/',
            //     },
            // }
            result["parse"]=0;
            result["url"]=urls;
            result["danmaku"]=danmu;
            result["header"]={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Referer': 'https://www.aliyundrive.com/',
            };
            return result;
        }
    },
}

function normalizeName(name) {
    return name.toLowerCase().replace(/\W+/g, ' ').trim();
}

function matchEpisode(vod_name, file_name) {
    const vod_normalized = normalizeName(vod_name);
    const file_normalized = normalizeName(file_name);

    // 使用正则表达式匹配剧集编号
    const episodeRegex = /(\d+)/;
    const vodEpisode = vod_normalized.match(episodeRegex)?.[1];
    const fileEpisode = file_normalized.match(episodeRegex)?.[1];

    return vodEpisode === fileEpisode;
}
