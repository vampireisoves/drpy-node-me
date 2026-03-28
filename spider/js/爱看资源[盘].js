/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '爱看资源网',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    title: '爱看资源网',
    host: 'https://aikanzy.com/',
   // url: '/fyclass-fypage.html',
    url: '/fyclass.html',
    searchUrl: '/search?word=**&molds=article',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
 //   class_parse: '.top-bar-menu&&li;a&&Text;a&&href;.*/(.*?).html',
 //   class_parse: '.top-bar-menu&&li;a&&Text;a&&href;.*/(.*?)(\.html)?$',
    class_name: '电影&电视剧&动漫/动画&综艺&短剧&其他&双男主',
    class_url: 'dy-fypage&dsj-fypage&dmdh-fypage&zy-fypage&dj-fypage&qt-fypage&tags/index/tagname/双男主/page/fypage',
    tab_rename: {
        'KUAKE1': '夸克1',
        'KUAKE11': '夸克2',
        'YOUSEE1': 'UC1',
        'YOUSEE11': 'UC2'
    },
    图片来源: '@Referer=https://aikanzy.com@User-Agent=Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
        'Referer': 'https://aikanzy.com'
    },
    play_parse: true,
    limit: 20,
    double: false,
    推荐: '*',
    一级: '#content .post-list;a&&title;.lazyload&&data-src;.entry-meta&&Text;a&&href',
    
    二级: async function (ids) {
        const { input, pdfa, pdfh, pd } = this;
        const html = await request(input);
        const VOD = {};
        
        // 提取并处理标题
        const title1 = pdfh(html, 'h1&&Text') || '';
        const title2 = pdfh(html, '#content&&li:eq(2)&&Text') || '';
        const fullTitle = (title1 + ' ' + title2).trim();
        const match = fullTitle.match(/《([^》]+)》/);
        
        VOD.vod_name = match ? match[1] : fullTitle;
        VOD.vod_pic = pd(html, '.shadimg img&&src') || '';
        VOD.vod_content = fullTitle; // 使用完整标题作为简介
        VOD.vod_remarks = VOD.vod_content.substring(0, 100) + '...';
        
        // 处理网盘链接
        const panList = pdfa(html, '.con_ad-top&&p:eq(-1) a') || [];
        const forms = [];
        const urls = [];
        const pans = [];
        
        for (const it of panList) {
            const title = pdfh(it, '.icon&&Text') || pdfh(it, 'a&&Text') || '';
            const url = pd(it, 'a&&href') || '';
            
            if (!title || !url) continue;
            
            // 重命名标题
            for (const key in this.tab_rename) {
                if (title.includes(key)) {
                    title = this.tab_rename[key];
                    break;
                }
            }
            
            pans.push(url);
            
            // 夸克网盘特殊处理
            if (url.includes('pan.quark.cn')) {
                const processedUrl = url.replace(/#\/list\/share.*/, '');
                let result;
                
                try {
                    const shareData = Quark.getShareData(processedUrl);
                    if (shareData) {
                        const files = await Quark.getFilesByShareUrl(shareData);
                        const allFiles = Array.isArray(files) ? files : Object.values(files).flat();
                        
                        if (allFiles.length > 0) {
                            result = allFiles.map(v => {
                                const params = [
                                    shareData.shareId,
                                    v.stoken,
                                    v.fid,
                                    v.share_fid_token,
                                    v.subtitle?.fid || '',
                                    v.subtitle?.share_fid_token || ''
                                ];
                                return `${v.file_name}$${params.join('*')}`;
                            }).join('#');
                        } else {
                            result = "资源已经失效，请访问其他资源";
                        }
                    } else {
                        result = "资源已经失效，请访问其他资源";
                    }
                    
                    forms.push('夸克网盘');
                    urls.push(result);
                } catch (error) {
                    log("夸克网盘解析失败: " + error.message);
                    forms.push('夸克网盘');
                    urls.push(`${title}$${processedUrl}`);
                }
            } else {
                // 其他网盘使用推送方式
                forms.push('推送');
                urls.push(`${title}$${url}`);
            }
        }
        
        // 设置播放信息
        if (forms.length > 0) {
            VOD.vod_play_from = forms.join('$$$');
            VOD.vod_play_url = urls.join('$$$');
            VOD.vod_play_pan = pans.join('$$$');
        } else {
            VOD.vod_play_from = '网盘';
            VOD.vod_play_url = '暂无可用资源';
        }
        
        return VOD;
    },
    
    搜索: '*',
    
    lazy: async function (flag, id, flags) {
        const { input, mediaProxyUrl } = this;
        
        // 处理推送类型
        if (flag === '推送' || flag === '网盘') {
            if (tellIsJx(input)) {
                return { parse: 1, jx: 1, url: input };
            } else if (/m3u8|mp4|m3u/.test(input)) {
                return { url: input };
            } else {
                return { parse: 1, url: input };
            }
        }
        
        const ids = input.split('*');
        
        // 处理夸克网盘
        if (flag === '夸克网盘') {
            log("夸克网盘解析开始");
            
            const down = await Quark.getDownload(ids[0], ids[1], ids[2], ids[3], true);
            const headers = {
                'Cookie': ENV.get('quark_cookie')
            };
            
            const urls = [];
            down.forEach((t) => {
                if (t.url !== undefined) {
                    urls.push("猫"+t.name, `http://127.0.0.1:5575/proxy?thread=${ENV.get('thread') || 6}&chunkSize=1024&url=` + encodeURIComponent(t.url));
                    urls.push(t.name, t.url + "#isVideo=true##fastPlayMode##threads=20#")
        //            urls.push("猫" + t.name, `http://127.0.0.1:5575/proxy?thread=${ENV.get('thread') || 6}&chunkSize=1024&url=` + encodeURIComponent(t.url));
                }
            });
            
            // 添加转码地址
            const transcoding = (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter((t) => t.accessable);
            transcoding.forEach((t) => {
                urls.push(t.resolution === 'low' ? "流畅" : t.resolution === 'high' ? "高清" : t.resolution === 'super' ? "超清" : t.resolution, t.video_info.url + "#isVideo=true##fastPlayMode##threads=20#")
            });
            
            return {
                parse: 0,
                url: urls,
                header: headers
            };
        }
        
        // 默认处理
        return input;
    }
}