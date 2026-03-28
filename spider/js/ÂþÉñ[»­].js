/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '漫神',
  '类型': '漫画',
  lang: 'ds'
})
*/


var rule = {
    title: '漫神',
    类型: '漫画',
    host: 'https://m.mhkami.com',
    url: '/api/comic/index/lists?tags=fyclass&page=fypage&fyfilter',
    filter_url: 'area={{fl.area or "9"}}&full={{fl.full or "3"}}',
    detailUrl: '/book/fyid/',
    searchUrl: '/search?searchkey=**',
    searchable: 2,
    quickSearch: 0,
    headers: {
        "Referer": "https://m.mhkami.com/",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) CriOS/31.0.1650.18 Mobile/11B554a Safari/8536.25",
        "Cookie": "Hm_lvt_f1b6d7d9bb6305a3671545b693cbab40=1695538245;Hm_lpvt_f1b6d7d9bb6305a3671545b693cbab40=1695538245"
    },
    timeout: 10000,
    filter: {
        '*': [
            {
                key: 'area',
                name: '地区',
                value: [
                    {n: '全部', v: '9'},
                    {n: '日漫', v: '1'},
                    {n: '港台', v: '2'},
                    {n: '美漫', v: '3'},
                    {n: '国漫', v: '4'},
                    {n: '韩漫', v: '5'},
                    {n: '未分类', v: '6'}
                ]
            },
            {
                key: 'full',
                name: '进度',
                value: [
                    {n: '全部', v: '3'},
                    {n: '连载中', v: '4'},
                    {n: '已完结', v: '1'}
                ]
            }
        ]
    },
    class_name: '全部&长条&大女主&百合&耽美&纯爱&後宫&韩漫&奇幻&轻小说&生活&悬疑&格斗&搞笑&伪娘&竞技&职场&萌系&冒险&治愈&都市&霸总&神鬼&侦探&爱情&古风&欢乐向&科幻&穿越&性转换&校园&美食&悬疑&剧情&热血&节操&励志&异世界&历史&战争&恐怖&霸总',
    class_url: '全部&长条&大女主&百合&耽美&纯爱&後宫&韩漫&奇幻&轻小说&生活&悬疑&格斗&搞笑&伪娘&竞技&职场&萌系&冒险&治愈&都市&霸总&神鬼&侦探&爱情&古风&欢乐向&科幻&穿越&性转换&校园&美食&悬疑&剧情&热血&节操&励志&异世界&历史&战争&恐怖&霸总',
    play_parse: true,
    lazy: async function (flag, id, flags) {
        let {input} = this;
        let html = await request(input);
        let images = pdfa(html, 'figure.item');
        // log(images);
        let imgList = [];
        images.forEach(image => {
            imgList.push(pdfh(image, 'img&&data-src') + '@Referer=https://m.mhkami.com/');
        });
        // let nextPage = pdfh(html, 'div.action&&a:contains("下一页")&&href');
        // log('nextPage:',nextPage);
        let actions = pdfa(html, 'div.action&&a');
        // log('actions:', actions);
        let nextPage = null;
        actions.forEach(action => {
            if (!nextPage && pdfh(action, 'a&&Text').includes('下一页')) {
                nextPage = pd(action, 'a&&href');
            }
        });
        if (nextPage) {
            log('处理下一页图片链接:', nextPage);
        }
        return {parse: 0, url: 'pics://' + imgList.join('&&'), header: rule.headers};
    },
    limit: 6,
    推荐: '',
    double: true,
    一级: async function (tid, pg, filter, extend) {
        let [url, params] = this.input.split('?');
        let html = await post(url, {body: params, headers: rule.headers});
        let items = html.parseX.data;
        let d = [];
        items.forEach(function (item) {
            d.push({
                title: item.name,
                desc: item.author,
                url: item.id,
                img: item.cover + '@Referer=https://m.mhkami.com/',
                content: item.intro,
            })
        });
        return setResult(d)
    },
    二级: async function (ids) {
        let {input, orId, pdfh, pdfa, pd} = this;
        let html = await request(input);
        let vod = {
            "vod_name": pdfh(html, 'h1.name--span&&Text'),
            "vod_id": orId,
            "vod_remarks": '',
            "vod_pic": pdfh(html, '.thumbnail&&img&&src') + '@Referer=https://m.mhkami.com/',
            "vod_content": pdfh(html, '#js_desc_content&&Text'),
        };
        let playform = '在线观看-' + orId;
        let playurls = [];
        let chapterList = pdfa(html, '#js_chapters&&li');
        chapterList.forEach(function (chapter) {
            playurls.push(pdfh(chapter, 'a&&title') + '$' + pd(chapter, 'a&&href'));
        });
        vod.vod_play_from = playform;
        vod.vod_play_url = playurls.join('#');
        return vod;
    },
    搜索: async function (wd, quick, pg) {
        let {input, pdfh, pd, pdfa} = this;
        let html = await request(input);
        let items = pdfa(html, '.col3&&.item');
        let d = [];
        items.forEach(function (item) {
            let url = pdfh(item, 'a&&href');
            d.push({
                title: pdfh(item, '.title&&Text'),
                desc: pdfh(item, '.chapter&&Text'),
                url: url.match(/(\d+)/)[1],
                img: pd(item, 'img&&src') + '@Referer=https://m.mhkami.com/',
                content: '',
            })
        });
        return setResult(d)
    },
}
