/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '奇珍异兽[官]',
  lang: 'ds'
})
*/

var rule = {
    title: '奇珍异兽[官]',
    host: 'https://www.iqiyi.com',
    homeUrl: '',
    detailUrl: 'https://pcw-api.iqiyi.com/video/video/videoinfowithuser/fyid?agent_type=1&authcookie=&subkey=fyid&subscribe=1',
    searchUrl: 'https://search.video.iqiyi.com/o?if=html5&key=**&pageNum=fypage&pos=1&pageSize=24&site=iqiyi',
    searchable: 2,
    multi: 1,
    filterable: 1,
    filter: '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',
    url: 'https://pcw-api.iqiyi.com/search/recommend/list?channel_id=fyclass&data_type=1&page_id=fypage&ret_num=48',
    filter_url: 'is_purchase={{fl.is_purchase}}&mode={{fl.mode}}&three_category_id={{fl.three_category_id}}&market_release_date_level={{fl.year}}',
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    timeout: 5000,
    class_name: '电影&电视剧&纪录片&动漫&综艺&音乐&网络电影',
    class_url: '1&2&3&4&6&5&16',
    limit: 20,
    一级: async function () {
        let {input, MY_CATE, fetch_params} = this;
        let d = [];
        if (MY_CATE === "16") {
            input = input.replace("channel_id=16", "channel_id=1").split("three_category_id")[0];
            input += "three_category_id=27401"
        } else if (MY_CATE === "5") {
            input = input.replace("data_type=1", "data_type=2")
        }
        let html = await request(input);
        let json = JSON.parse(html);
        if (json.code === "A00003") {
            fetch_params.headers["user-agent"] = PC_UA;
            json = JSON.parse(await fetch(input, fetch_params))
        }
        json.data.list.forEach(function (data) {
            let desc = '';
            if (data.channelId === 1) {
                desc = data.hasOwnProperty("score") ? data.score + "分\t" : ""
            } else if (data.channelId === 2 || data.channelId === 4) {
                if (data.latestOrder === data.videoCount) {
                    desc = (data.hasOwnProperty("score") ? data.score + "分\t" : "") + data.latestOrder + "集全"
                } else {
                    if (data.videoCount) {
                        desc = (data.hasOwnProperty("score") ? data.score + "分\t" : "") + data.latestOrder + "/" + data.videoCount + "集"
                    } else {
                        desc = "更新至 " + data.latestOrder + "集"
                    }
                }
            } else if (data.channelId === 6) {
                desc = data.period + "期"
            } else if (data.channelId === 5) {
                desc = data.focus
            } else {
                if (data.latestOrder) {
                    desc = "更新至 第" + data.latestOrder + "期"
                } else if (data.period) {
                    desc = data.period
                } else {
                    desc = data.focus
                }
            }
            let url = MY_CATE + "$" + data.albumId;
            d.push({
                url: url,
                title: data.name,
                desc: desc,
                pic_url: data.imageUrl.replace(".jpg", "_390_520.jpg?caplist=jpg,webp")
            })
        });
        return setResult(d);
    },
    二级: async function () {
        let {input} = this;
        let d = [];
        let html = await request(input);
        let json = JSON.parse(html).data;
        let VOD = {
            vod_id: "",
            vod_url: input,
            vod_name: "",
            type_name: "",
            vod_actor: "",
            vod_year: "",
            vod_director: "",
            vod_area: "",
            vod_content: "",
            vod_remarks: "",
            vod_pic: ""
        };
        VOD.vod_name = json.name;
        try {
            if (json.latestOrder) {
                VOD.vod_remarks = "类型: " + (json.categories[0].name || "") + "\t" + (json.categories[1].name || "") + "\t" + (json.categories[2].name || "") + "\t" + "评分：" + (json.score || "") + "\n更新至：第" + json.latestOrder + "集(期)/共" + json.videoCount + "集(期)"
            } else {
                VOD.vod_remarks = "类型: " + (json.categories[0].name || "") + "\t" + (json.categories[1].name || "") + "\t" + (json.categories[2].name || "") + "\t" + "评分：" + (json.score || "") + json.period
            }
        } catch (e) {
            VOD.vod_remarks = json.subtitle
        }
        VOD.vod_area = (json.focus || "") + "\n资费：" + (json.payMark === 1 ? "VIP" : "免费") + "\n地区：" + (json.areas || "");
        let vsize = "579_772";
        try {
            vsize = json.imageSize[12]
        } catch (e) {
        }
        VOD.vod_pic = json.imageUrl.replace(".jpg", "_" + vsize + ".jpg?caplist=jpg,webp");
        VOD.type_name = json.categories.map(function (it) {
            return it.name
        }).join(",");
        if (json.people.main_charactor) {
            let vod_actors = [];
            json.people.main_charactor.forEach(function (it) {
                vod_actors.push(it.name)
            });
            VOD.vod_actor = vod_actors.join(",")
        }
        VOD.vod_content = json.description;
        let playlists = [];
        if (json.channelId === 1 || json.channelId === 5) {
            playlists = [{
                playUrl: json.playUrl,
                imageUrl: json.imageUrl,
                shortTitle: json.shortTitle,
                focus: json.focus,
                period: json.period
            }]
        } else {
            if (json.channelId === 6) {
                let qs = json.period.split("-")[0];
                let listUrl = "https://pcw-api.iqiyi.com/album/source/svlistinfo?cid=6&sourceid=" + json.albumId + "&timelist=" + qs;
                let playData = JSON.parse(await request(listUrl)).data[qs];
                playData.forEach(function (it) {
                    playlists.push({
                        playUrl: it.playUrl,
                        imageUrl: it.imageUrl,
                        shortTitle: it.shortTitle,
                        focus: it.focus,
                        period: it.period
                    })
                })
            } else {
                let listUrl = "https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid=" + json.albumId + "&size=200&page=1";
                let data = JSON.parse(await request(listUrl)).data;
                let total = data.total;
                playlists = data.epsodelist;
                if (total > 200) {
                    for (let i = 2; i < total / 200 + 1; i++) {
                        let listUrl = "https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid=" + json.albumId + "&size=200&page=" + i;
                        let data = JSON.parse(await request(listUrl)).data;
                        playlists = playlists.concat(data.epsodelist)
                    }
                }
            }
        }
        playlists.forEach(function (it) {
            d.push({
                title: it.shortTitle || "第" + it.order + "集",
                desc: it.subtitle || it.focus || it.period,
                img: it.imageUrl.replace(".jpg", "_480_270.jpg?caplist=jpg,webp"),
                url: it.playUrl
            })
        });
        VOD.vod_play_from = "qiyi";
        VOD.vod_play_url = d.map(function (it) {
            return it.title + "$" + it.url
        }).join("#");
        return VOD

    },
    搜索: async function () {
        let {input, pjfa, pjfh, pj} = this;
        let d = [];
        let html = await request(input);
        let json = JSON.parse(html);
        let data = pjfa(json, '.data.docinfos');
        // log('data:', data);
        data.forEach((it) => {
            d.push({
                title: pjfh(it, '.albumDocInfo.albumTitle'),
                pic_url: pjfh(it, '.albumDocInfo.albumVImage'),
                desc: pjfh(it, '.albumDocInfo.channel'),
                url: pjfh(it, '.albumDocInfo.albumId'),
                content: pjfh(it, '.albumDocInfo.tvFocus'),
            })
        });
        return setResult(d);
    },
    lazy: async function () {
        let {input} = this;
        return {jx: 1, url: input}
    }
}
