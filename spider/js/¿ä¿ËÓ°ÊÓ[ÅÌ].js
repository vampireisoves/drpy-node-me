/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '夸克影视[优]',
  '类型': '影视',
  lang: 'ds'
})
*/

const quarkDownloadingCache = {};
var rule = {
    类型:'影视',
    title:'夸克影视[优]',
    host:'https://www.quarktv.com',
    url:'/category/fyclass/page/fypage',
    searchUrl:'/?s=**',
    searchable:2,quickSearch:0,filterable:0,
    class_parse: `.site-nav li:gt(0):lt(10);a&&Text;a&&href;.*/category/(.*/?)`,
    headers:{
        'User-Agent':'MOBILE_UA',
    },
    play_parse:true,
    预处理: async () => {
        return []
    },
    推荐: async function (tid, pg, filter, extend) {
        return this.一级(tid, pg, filter, extend);
    },
    一级: async function (tid, pg, filter, extend) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, 'article.excerpt');
        data.forEach((it) => {
            let originalTitle = pdfh(it, 'h2 a&&Text');
            // 提取《》中的内容作为标题，如果没有则使用原标题
            let title = originalTitle.match(/《(.*?)》/)?.[1] || originalTitle;
            d.push({
                title: title,
                pic_url: pd(it, 'img&&data-src'),
                desc: pdfh(it, '.meta&&Text'),
                url: pd(it, 'h2 a&&href'),
            })
        });
        return setResult(d)
    },
    二级: async function (ids) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};
        VOD.vod_name = pdfh(html, 'h1&&Text');
        VOD.vod_pic = pd(html, '.cover img&&src');
        VOD.vod_content = pdfh(html, '.intro&&Text');
        let downloadList = pdfa(html, '.ul-pans li:last-child a');
        let playmap = {};
        for (let it of downloadList) {
            let title = pdfh(it, 'a&&Text');
            let url = pd(it, 'a&&href');
            if (/pan.quark.cn/.test(url)) {
                const shareData = Quark.getShareData(url);
                if (shareData) {
                    const videos = await Quark.getFilesByShareUrl(shareData);
                    if (videos.length > 0) {
                        playmap['夸克'] = playmap['夸克'] || [];
                        playmap['夸克'] = playmap['夸克'].concat(videos.map((v) => {
                            const list = [shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle ? v.subtitle.fid : '', v.subtitle ? v.subtitle.share_fid_token : ''];
                            return v.file_name + '$' + list.join('*');
                        }));
                    } else {
                        playmap['夸克'] = playmap['夸克'] || [];
                        playmap['夸克'].push("资源已经失效，请访问其他资源");
                    }
                }
            } else {
                playmap['下载'] = playmap['下载'] || [];
                playmap['下载'].push(title + "$" + url);
            }
        }
        
        VOD.vod_play_from = Object.keys(playmap).join('$$$');
        const urls = Object.values(playmap);
        const playUrls = urls.map((urllist) => {
            return urllist.join("#");
        });
        VOD.vod_play_url = playUrls.join('$$$');
        return VOD;
    },
    搜索: async function () {
        return this.一级();
    },
    lazy: async function (flag, id, flags) {
        let {input, mediaProxyUrl} = this;
        
        // 处理推送类型
        if (flag === '推送') {
            if (tellIsJx(input)) {
                return {parse: 1, jx: 1, url: input};
            } else if (/m3u8|mp4|m3u/.test(input)) {
                return {url: input};
            } else {
                return {parse: 1, url: input};
            }
        }
        
        const ids = input.split('*');
        
        // 处理夸克网盘
        if (flag === '夸克' || flag.startsWith('Quark-')) {
            log("夸克网盘解析开始");
            
            const down = await Quark.getDownload(ids[0], ids[1], ids[2], ids[3], true);
            const headers = {
                'Cookie': ENV.get('quark_cookie')
            };
            
            const urls = [];
            down.forEach((t) => {
                if(t.url!==undefined){
                    urls.push("猫"+t.name, `http://127.0.0.1:5575/proxy?thread=${ENV.get('thread') || 6}&chunkSize=1024&url=` + encodeURIComponent(t.url));
                    urls.push(t.name, t.url+ "#isVideo=true##fastPlayMode##threads=20#")
                    
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
        }
        
        return input;
    }
}