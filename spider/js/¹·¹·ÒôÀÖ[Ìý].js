/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '狗狗音乐[听]',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    title: '狗狗音乐[听]',
    host: 'https://m.kugou.com',
    url: '',
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11)',
        'Referer': 'https://m.kugou.com/'
    },
    class_name: '热门榜&特色榜&全球榜',
    class_url: 'hot&feature&global',

    play_parse: true,

    lazy: async function () {
        let playUrl = this.input;
        let realUrl = '', lyric = '';

        const getLrc = async (hash) => {
            try {
                let lData = JSON.parse(await request(`https://lyrics.kugou.com/search?ver=1&man=yes&client=pc&hash=${hash}`));
                let cand = lData?.candidates?.[0];
                if (cand) {
                    let dData = JSON.parse(await request(`https://lyrics.kugou.com/download?ver=1&client=pc&id=${cand.id}&accesskey=${cand.accesskey}`));
                    return base64Decode(dData.content || '');
                }
            } catch (e) {
                log('getLrc error:', e);
            }
            return '';
        };

        const lrcToAss = (lrc) => {
            let ass = "[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n\n[V4+ Styles]\nStyle: Default,Arial,36,&H00FFFFFF,&H00000000,&H64000000,&H64000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";
            let times = [];
            lrc.split('\n').forEach(line => {
                let m = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
                if (m) times.push({start: `0:${m[1]}:${m[2]}`.replace('.', ','), text: m[3].trim()});
            });
            times.forEach((cur, i) => {
                let end = times[i + 1] ? times[i + 1].start : '0:99:00,00';
                ass += `Dialogue: 0,${cur.start},${end},Default,,0,0,0,,${cur.text}\n`;
            });
            return ass;
        };

        try {
            if (playUrl.includes('/mvweb/html/mv_')) {
                let mvid = playUrl.match(/mv_(\w+)/)?.[1];
                if (mvid) {
                    let mv = JSON.parse(await request(`https://m.kugou.com/app/i/mv.php?cmd=100&hash=${mvid}&ismp3=1&ext=mp4`))?.mvdata || {};
                    realUrl = mv.rq?.downurl || mv.sq?.downurl || mv.le?.downurl || '';
                    if (realUrl) {
                        let rawLrc = await getLrc(mvid);
                        if (rawLrc) lyric = lrcToAss(rawLrc);
                    }
                }
            } else if (playUrl.includes('hash=')) {
                let hash = playUrl.match(/hash=([^&]+)/)?.[1];
                if (hash) {
                    let res = JSON.parse(await request(`https://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${hash}`));
                    realUrl = res.url || res.backup_url?.[0] || '';
                    if (realUrl) lyric = await getLrc(hash);
                }
            }
        } catch (e) {
            console.log(e);
        }

        return realUrl ? {parse: 0, url: realUrl, header: rule.headers, subtitle: lyric} : playUrl;
    },

    推荐: async function () {
        let VODS = [];
        try {
            let list = JSON.parse(await request('https://mobilecdnbj.kugou.com/api/v3/rank/list?version=9108&plat=0&showtype=2'))?.data?.info || [];
            VODS = list.filter(i => i.classify === 1 || /TOP|新歌|热歌|飙升/.test(i.rankname)).slice(0, 12).map(i => ({
                vod_id: `https://mobilecdnbj.kugou.com/api/v3/rank/song?rankid=${i.rankid}&page=1&pagesize=200`,
                vod_name: i.rankname,
                vod_pic: i.imgurl.replace('{size}', '400'),
                vod_remarks: i.update_frequency || ''
            }));
        } catch (e) {
        }
        return VODS
    },

    一级: async function () {
        let {MY_CATE} = this;
        let VODS = [];
        try {
            let list = JSON.parse(await request('https://mobilecdnbj.kugou.com/api/v3/rank/list?version=9108&plat=0&showtype=2'))?.data?.info || [];
            if (MY_CATE === 'hot') list = list.filter(i => i.classify === 1);
            else if (MY_CATE === 'feature') list = list.filter(i => i.classify === 5);
            else if (MY_CATE === 'global') list = list.filter(i => /欧美|日本|韩国|Billboard/.test(i.rankname));
            VODS = list.map(i => ({
                vod_id: `https://mobilecdnbj.kugou.com/api/v3/rank/song?rankid=${i.rankid}&page=1&pagesize=200`,
                vod_name: i.rankname,
                vod_pic: i.imgurl.replace('{size}', '400'),
                vod_remarks: i.update_frequency || ''
            }));
        } catch (e) {
        }
        return VODS;
    },

    二级: async function () {
        let {input} = this;
        let VOD = {};
        try {
            let songs = JSON.parse(await request(input))?.data?.info || [];
            let music = [], mv = [];
            songs.forEach((s, i) => {
                music.push(`${i + 1}. 🎵 ${s.filename}$https://www.kugou.com/song/?hash=${s.hash}`);
                if (s.mvhash) mv.push(`${i + 1}. 🎬 ${s.filename}$https://www.kugou.com/mvweb/html/mv_${s.mvhash}.html`);
            });

            let playFrom = ['音乐'];
            let playUrl = [music.join('#')];

            if (mv.length > 0) {
                playFrom.push('MV');
                playUrl.push(mv.join('#'));
            }

            VOD = {
                vod_name: '酷狗音乐榜单',
                vod_pic: songs[0]?.imgurl?.replace('{size}', '400') || '',
                vod_remarks: `共 ${songs.length} 首`,
                vod_play_from: playFrom.join('$$$'),
                vod_play_url: playUrl.join('$$$')
            };
        } catch (e) {
            VOD = {vod_name: '解析失败'};
        }
        return VOD;
    },

    搜索: async function () {
        let {KEY, MY_PAGE} = this;
        let VODS = [];
        try {
            let list = JSON.parse(await request(`https://mobilecdnbj.kugou.com/api/v3/search/song?format=json&keyword=${encodeURIComponent(KEY)}&page=${MY_PAGE || 1}&pagesize=20`))?.data?.info || [];
            VODS = list.map(s => ({
                vod_id: `https://www.kugou.com/song/?hash=${s.hash}`,
                vod_name: `🎵 ${s.songname}`,
                vod_pic: s.album_img ? s.album_img.replace('{size}', '400') : '',
                vod_remarks: s.singername
            }));
        } catch (e) {
        }
        return VODS;
    }

};