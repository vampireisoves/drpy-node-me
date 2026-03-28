/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 1,
  title: '木兮',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    title: '木兮',
    host: 'https://film.symx.club',
    url: '/api/film/category/list?fyfilter',
    detailUrl: '/api/film/detail?id=fyid',
    searchUrl: '/api/film/search?keyword=**&pageNum=fypage&pageSize=10',
    filter_url: 'categoryId=fyclass&language={{fl.lang}}&pageNum=fypage&pageSize=15&sort={{fl.by or "updateTime"}}&year={{fl.year}}',
    searchable: 2,
    quickSearch: 1,
    filterable: 0,
    headers: {
        'User-Agent': MOBILE_UA,
        'Accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-platform': 'web'
    },
    play_parse: true,
    search_match: true,
    class_name: '电视剧&电影&综艺&动漫&短剧',
    class_url: '1&2&3&4&5',
    推荐: $js.toString(async () => {
        let d = [];
        let html = await request(input + '/api/film/category');
        let categories = JSON.parse(html).data;

        categories.forEach(category => {
            category.filmList.forEach(item => {
                let title = item.name;
                if (!/名称|排除/.test(title)) {
                    d.push({
                        title: title,
                        desc: item.updateStatus,
                        img: item.cover,
                        url: item.id,
                        content:item.blurb,
                    });
                }
            });
        });

        return setResult(d);
    }),
    一级: $js.toString(async () => {
        let d = [];
        let html = await request(input);
        let data = JSON.parse(html).data.list;
        data.forEach(item => {
            let title = item.name;
            if (!/名称|排除/.test(title)) {
                d.push({
                    title: title,
                    desc: item.updateStatus,
                    img: item.cover,
                    url: item.id,
                    content:item.blurb,
                });
            }
        });
        return setResult(d);
    }),

    二级: $js.toString(async () => {
        let html = await request(input);
        let data = JSON.parse(html).data;
        // 定义类型映射
        let categoryMap = {
            1: "电视剧",
            2: "电影",
            3: "综艺",
            4: "动漫",
            5: "短剧"
        };
        let categoryName = categoryMap[data.categoryId]
        let VOD = {
            vod_id: orId,
            vod_name: data.name,
            type_name: categoryName,
            vod_pic: data.cover,
            vod_remarks: data.updateStatus,
            vod_content: data.blurb
        };

        let playlist = data.playLineList || [];
        let playFrom = [];
        let playUrl = [];

        playlist.forEach(line => {
            playFrom.push(line.playerName);
            let lines = line.lines || [];
            let lineUrls = lines.map(tag => {
                let title = tag.name;
                let url = tag.id;
                return `${title}$${url}`;
            });
            playUrl.push(lineUrls.join("#"));
        });

        VOD.vod_play_from = playFrom.join("$$$");
        VOD.vod_play_url = playUrl.join("$$$");
        return VOD
    }),

    搜索: $js.toString(async () => {
        let d = [];
        let html = await request(input);
        let data = JSON.parse(html).data.list;
        data.forEach(item => {
            let title = item.name;
            d.push({
                title: title,
                desc: item.updateStatus,
                img: item.cover,
                url: item.id,
                content:item.blurb,
            });
        });
        return setResult(d);
    }),
    lazy: $js.toString(async () => {
        let purl = 'https://film.symx.club/api/line/play/parse?lineId=' + input;
        let html = await request(purl);
        let url = JSON.parse(html).data;
        input = {
            parse: 0,
            url: url
        };
        return input
    }),

}