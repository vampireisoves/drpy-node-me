/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: 'libvio影视',
  author: 'EylinSir',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    author: 'EylinSir',
    title: 'libvio影视',
    类型: '影视',
    host: 'https://www.libvio.cc',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'Referer': 'https://www.libvio.cc'
    },
    编码: 'utf-8',
    timeout: 20000,
    homeUrl: '/',
    class_name: '电影&电视剧&动漫&日韩剧&欧美剧',
    class_url: '1&2&4&15&16',
    url: '/type/fyclass-fypage.html',
    searchUrl: '/search/----------fypage---.html?wd=**',
    detailUrl: '/detail/fyid.html',
    playUrl: '/play/fyid.html',
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    limit: 90,
    double: false,
    play_parse: true,
  //  class_parse: '.stui-header__menu li:gt(0):lt(7);a&&Text;a&&href;/(\\d+).html',

    推荐: async function(tid, pg, filter, extend) {
        return this.一级();
    },

    一级: async function(tid, pg, filter, extend) {
        let { input, pdfa, pdfh, pd } = this;
        let html = await request(input);
        let d = pdfa(html, '.stui-vodlist li').map(it => ({
            title: pdfh(it, 'a&&title'),
            pic_url: pd(it, '.lazyload&&data-original'),
            desc: pdfh(it, '.pic-text&&Text'),
            url: pd(it, 'a&&href')
        }));
        return setResult(d);
    },

    二级: async function(ids) {
        try {
            let { input, pdfa, pdfh, pd } = this;
            let html = await request(input);

            let VOD = {
                vod_name: pdfh(html, 'h1&&Text') || '',
                vod_pic: pd(html, 'img&&data-original', input) || pd(html, 'img&&src', input) || '',
                vod_content: pdfh(html, '.detail-content&&Text') || pdfh(html, '*:contains(简介：)&&Text') || '',
                vod_play_from: '',
                vod_play_url: '',
                vod_play_pan: ''
            };

            let descLines = pdfa(html, '.stui-content__detail p.data').slice(0, 5).map(p => pdfh(p, 'p&&Text'));
            let allDesc = descLines.join(' ');
            const getMeta = (key) => (allDesc.match(new RegExp(`${key}：([^\\/]+)`)) || [])[1]?.trim() || '';

            VOD.vod_type = getMeta('类型');
            VOD.vod_area = getMeta('地区');
            VOD.vod_year = getMeta('年份');
            VOD.vod_actor = getMeta('主演');
            VOD.vod_director = getMeta('导演');
            VOD.vod_total = (allDesc.match(/总集数：(\d+)/) || [])[1] || '';
            VOD.vod_score = (html.match(/<span[^>]*class="douban"[^>]*>([^<]+)<\/span>/i) || [])[1]?.trim() || '';
            VOD.vod_remarks = descLines.join(' ');

            let playform = [], playurls = [], playPans = [];
            let sections = pdfa(html, '.stui-vodlist__head');

            for (let sec of sections) {
                let lineName = (pdfh(sec, '.stui-pannel__head h3&&Text') || pdfh(sec, 'h3&&Text') || '').replace(/[\uE000-\uF8FF]/g, '').trim();
                if (!lineName) continue;

                let isPan = /夸克|UC|百度|网盘|下载/.test(lineName);
                let links = pdfa(sec, '.stui-content__playlist li a');
                let episodeList = [];

                if (isPan) {
                    let panUrls = new Set();
                    for (let a of links) {
                        let url = pd(a, 'a&&href', input);
                        if (!url) continue;
                        try {
                            let playHtml = await request(url);
                            let matches = [...playHtml.matchAll(/var player_[^=]*=\s*({[^}]+})/g)];
                            for (let m of matches) {
                                try {
                                    let data = JSON.parse(m[1]);
                                    if (data.from && data.url) {
                                        let u = data.url.replace(/\\\//g, '/');
                                        panUrls.add(u);
                                        playPans.push(u);
                                    }
                                } catch {}
                            }
                        } catch {}
                    }

                    for (let u of panUrls) {
                        let videos = [];
                        let sd = null;

                        if (u.includes('pan.quark.cn')) {
                            sd = await Quark.getShareData(u);
                            if (sd) videos = await Quark.getFilesByShareUrl(sd);
                        } else if (u.includes('drive.uc.cn')) {
                            sd = await UC.getShareData(u);
                            if (sd) videos = await UC.getFilesByShareUrl(sd);
                        } else if (u.includes('pan.baidu.com')) {
                            sd = await Baidu2.getShareData(u);
                            if (sd) videos = Object.values(sd).flat();
                        }

                        videos.forEach(v => {
                            let name = v.file_name || v.name || '文件';
                            let token;
                            if (u.includes('baidu.com')) {
                                token = [v.path, v.uk, v.shareid, v.fsid].join('*');
                            } else {
                                if (!sd) return;
                                token = [sd.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle?.fid || '', v.subtitle?.share_fid_token || ''].join('*');
                            }
                            episodeList.push(`${name}$${token}`);
                        });
                    }
                } else {
                    episodeList = links.map(a => {
                        let title = pdfh(a, 'a&&Text');
                        let href = pd(a, 'a&&href', input);
                        return title && href ? `${title}$${href}` : '';
                    }).filter(Boolean);
                }

                if (episodeList.length) {
                    playform.push(lineName);
                    playurls.push(episodeList.join('#'));
                }
            }

            VOD.vod_play_from = playform.join('$$$');
            VOD.vod_play_url = playurls.join('$$$');
            VOD.vod_play_pan = playPans.join('$$$');
            return VOD;

        } catch (error) {
            return {
                vod_name: '加载失败',
                vod_pic: '',
                vod_content: `解析失败：${error.message}`,
                vod_remarks: '请检查网络或配置',
                vod_play_from: '错误$$$无效',
                vod_play_url: `详情：${error.message}$$$请重试`,
                vod_play_pan: ''
            };
        }
    },

    搜索: async function(wd, quick, pg) {
        return this.一级();
    },

    lazy: async function(flag, id, flags) {
        let ids = this.input.split('*');
        let { mediaProxyUrl } = this;

        if (/夸克|视频下载 \(夸克\)/.test(flag)) {
            let down = await Quark.getDownload(ids[0], ids[1], ids[2], ids[3], true);
            let urls = [];
            down.forEach(t => {
                if (t.url) {
                    urls.push(`猫${t.name}`, `http://127.0.0.1:5575/proxy?thread=${ENV.get('thread') || 6}&chunkSize=1024&url=${encodeURIComponent(t.url)}`);
                    urls.push(t.name, `${t.url}#isVideo=true##fastPlayMode##threads=20#`);
                }
            });
            (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3]))
                .filter(t => t.accessable)
                .forEach(t => {
                    let res = { low: '流畅', high: '高清', super: '超清' }[t.resolution] || t.resolution;
                    urls.push(res, `${t.video_info.url}#isVideo=true##fastPlayMode##threads=20#`);
                });
            return { parse: 0, url: urls, header: { 'Cookie': ENV.get('quark_cookie') } };
        }

        if (/UC|视频下载\(UC\)/.test(flag)) {
            let down = await UC.getDownload(ids[0], ids[1], ids[2], ids[3], true);
            return await UC.getLazyResult(down, mediaProxyUrl);
        }

        if (flag.includes('百度')) {
            let url = await Baidu2.getAppShareUrl(ids[0], ids[1], ids[2], ids[3]);
            return {
                parse: 0,
                url: [
                    "原画", `${url}#isVideo=true##fastPlayMode##threads=10#`,
                    "原代本", `http://127.0.0.1:7777/?thread=${ENV.get('thread') || 6}&form=urlcode&randUa=1&url=${encodeURIComponent(url)}`
                ],
                header: { "User-Agent": 'netdisk;P2SP;2.2.91.136;android-android;' }
            };
        }

        return { parse: 1, url: this.input, header: this.headers };
    }
};