/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '趣盘社[盘]',
  lang: 'ds'
})
*/





var rule = {
    title: '趣盘社[盘]',
    host: 'https://www.qupanshe.com',
    url: '/forum.php?mod=forumdisplay&fid=fyclass&page=fypage',
    detailUrl: '/fyid',
    searchUrl: '/search.php?mod=forum&srchtxt=**&searchsubmit=yes&page=fypage',
    play_parse: true,
    search_match: true,
    searchable: 1,
    filterable: 0,
    quickSearch: 1,
    百度_img: 'https://pan.losfer.cn/view.php/15f16a3203e73ebfa1dab24687b78b96.png',
    headers: {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 15; PGZ110 Build/AP3A.240617.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.58 Mobile Safari/537.36'
  },
    class_parse: async () => {
        let classes = [{
            type_id: '3',
            type_name: '电影',
        }, {
            type_id: '2',
            type_name: '剧集',
        }, {
            type_id: '6',
            type_name: '记录',
        }, {
            type_id: '5',
            type_name: '动漫',
        }, {
            type_id: '4',
            type_name: " 综艺"
        }
        ];
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
        let { input, pdfa, pdfh, pd } = this;
        let html = await request(input);
        let data = pdfa(html, 'tbody[id^="normalthread_"]');
        let videos = [];
        
        data.forEach(item => {
                // 提取标题
                let title = pdfh(item, '.tit_box a&&Text');
                // 提取链接
                let link = pd(item, '.tit_box a&&href');
                // 提取作者信息
                let author = pdfh(item, '.avatar1&&title') || '';
                
                // 提取发布时间/其他信息
                let info = pdfh(item, '.list_au_info&&Text') || '';
                
                // 提取是否有新回复标记
                let isNew = pdfh(item, '.xi1&&Text') || '';
                
                if (title && link) {
                    let desc = [];
                    if (author) desc.push(`作者: ${author}`);
                    if (info) desc.push(info);
                    if (isNew) desc.push(isNew);
                    
                    videos.push({
                        "vod_name": title.trim(),
                        "vod_id": link,
                        "vod_pic": rule.百度_img,
                      //  "vod_remarks": desc.join(' • ')
                    });
                }
        });
        
        return videos;
    },
    
    二级: async function (ids) {
    let {input} = this;
    
    let html = await request(input);
    let name = pdfh(html, 'h1&&Text') || '未知标题';
    let desc = pdfh(html, 'font:eq(0)&&Text') || '未知简介';
    let playform = [];
    let playurls = [];
    let playPans = [];
    
    // 百度网盘链接匹配
    let baiduPatterns = [
        /(https?:\/\/pan\.baidu\.com\/s\/[a-zA-Z0-9_-]{5,})(\?pwd=[a-zA-Z0-9]{4})?/gi,
        /(https?:\/\/pan\.baidu\.com\/share\/init\?surl=[a-zA-Z0-9_-]{5,})/gi
    ];
    
    let foundBaiduLinks = new Set();
    
    for (let pattern of baiduPatterns) {
        let matches = html.match(pattern);
        if (matches) matches.forEach(match => foundBaiduLinks.add(match));
    }
    
    // 处理百度链接
    if (foundBaiduLinks.size > 0) {
        for (let link of foundBaiduLinks) {
            if (!link.includes('?pwd=') && !link.includes('pwd=')) {
                let pwdMatch = html.match(/(提取码|密码|pwd|码)[：:\s]*([a-zA-Z0-9]{4})/i);
                if (pwdMatch) {
                    let password = pwdMatch[2];
                    let separator = link.includes('?') ? '&' : '?';
                    link += `${separator}pwd=${password}`;
                }
            }
            playPans.push(link);
            
            try {
                let shareData = await Baidu.getShareData(link);
                let videos = await Baidu.getFilesByShareUrl(shareData);
                playform.push(`百度#1`);
                playurls.push(videos.videos.map(v =>
                    `${v.file_name}$${[shareData.shareId, v.fid, v.file_name].join('*')}`
                ).join('#'));
            } catch (error) {
                playform.push(`资源已经失效`);
                playurls.push("资源已经失效，请访问其他资源");
            }
        }
    }
    
    return {
        vod_name: name,
        vod_content: desc,
        vod_play_from: playform.join("$$$") || '暂无播放源',
        vod_play_url: playurls.join("$$$") || '暂无播放链接$暂无',
        vod_play_pan: playPans.join("$$$") || '暂无网盘链接'
    };
},
    搜索: async function(wd, pg) {
    let { pdfa, pdfh, pd, input } = this;
    let d = [];
    let html = await request(input);
    let data = pdfa(html, 'li.pbw'); 
    data.forEach((it) => {
        let title = pdfh(it, 'h3&&Text');
        let url = pd(it, 'a&&href');
        d.push({
            title: title,
            img: rule.百度_img,
            desc: '百度网盘',
            content: '百度网盘',
            url: url,
        });
    });
    
    return setResult(d);
},
    lazy: async function (flag, id, flags) {
        let {input} = this;
        let urls = [];
        let ids = input.split('*');
        if (flag.startsWith('百度')) {
            console.log("百度网盘解析开始");
            let down = await Baidu.getDownload(ids[0], ids[1], ids[2]);
            let headers = {
                'User-Agent': 'netdisk;1.4.2;22021211RC;android-android;12;JSbridge4.4.0;jointBridge;1.1.0;',
                'Referer': 'https://pan.baidu.com'
            };
            urls.push("原画", `${down.dlink}`);
            return {
                parse: 0,
                url: urls,
                header: headers
            };
        }
    },
}
