/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '布谷音乐[听]',
  '类型': '音乐',
  mergeList: true,
  more: {
    mergeList: 1
  },
  lang: 'ds'
})
*/

var rule = {
    title: '布谷音乐[听]',
    类型: '音乐',
    host: 'https://a.buguyy.top',
    url: '/newapi/fyclass',
    searchUrl: '/newapi/search.php?keyword=**',
    class_name: '最新歌曲&人气歌曲&随机歌曲',
    class_url: 'getnew.php?t=1&gethot.php?t=1&getrand.php?t=1',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    play_parse: true,
    limit: 6,
    double: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0'
    },

    lazy: async function (flag, id, flags) {
        let {input} = this;
        try {
            let coverFromList = '';
            let id = '';

            if (typeof input === 'object') {
                coverFromList =
                    input.picurl ||   // ✅ 修复点
                    input.vod_pic ||
                    input.pic ||
                    '';
                id =
                    input.vod_id ||
                    input.id ||
                    String(input);
            } else {
                id = String(input);
            }

            // ID 清洗
            if (id.includes('id=')) {
                id = id.match(/id=(\d+)/)?.[1] || id;
            }
            id = id.replace(/\D/g, '');

            let api = 'https://a.buguyy.top/newapi/geturl2.php?id=' + id;
            let ua = 'Mozilla/5.0 (Linux; Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0';

            let json = await request(api, {
                headers: {
                    'User-Agent': ua,
                    'Referer': 'https://www.buguyy.top/'
                }
            });

            let data = JSON.parse(json);
            let d = data.data || {};

            if (data.code === 200 && d.url) {
                let lrc = d.lrc || '';
                if (lrc) lrc = lrc.replace(/<br\s*\/?>/gi, '\n');

                input = {
                    parse: 0,
                    url: d.url,
                    pic: coverFromList || d.pic || '', // ✅ 播放页封面稳定
                    lrc: lrc,
                    header: {
                        'User-Agent': ua,
                        'Referer': 'https://www.buguyy.top/'
                    }
                };
            } else {
                input = {
                    parse: 0,
                    url: '',
                    pic: coverFromList || ''
                };
            }
        } catch (e) {
            input = {parse: 0, url: '', error: e.message};
        }
        return input;
    },
    推荐: '*',
    一级: 'json:data.list;title;picurl;singer;id',
    二级: '*',
    搜索: 'json:data.list;title;picurl;singer;id',
};