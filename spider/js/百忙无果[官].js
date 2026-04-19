/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '百忙无果[官]',
  lang: 'ds'
})
*/

const {getHtml} = $.require('./_lib.request.js')
var rule = {
    title: '百忙无果[官]',
    host: 'https://pianku.api.%6d%67%74%76.com',
    homeUrl: '',
    searchUrl: 'https://mobileso.bz.%6d%67%74%76.com/msite/search/v2?q=**&pn=fypage&pc=10',
    detailUrl: 'https://pcweb.api.mgtv.com/episode/list?page=1&size=50&video_id=fyid',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    multi: 1,
    url: '/rider/list/pcweb/v3?platform=pcweb&channelId=fyclass&pn=fypage&pc=80&hudong=1&_support=10000000&kind=a1&area=a1',
    filter_url: 'year={{fl.year or "all"}}&sort={{fl.sort or "all"}}&chargeInfo={{fl.chargeInfo or "all"}}',
    headers: {
        'User-Agent': PC_UA,
        'Referer': "https://www.mgtv.com"
    },
    timeout: 5000,
    class_name: '电视剧&电影&综艺&动漫&纪录片&教育&少儿',
    class_url: '2&3&1&50&51&115&10',
    filter: 'H4sIAAAAAAAAA+2XvUrDUBSA3+XOHc65adraN+jm5CIdYok/GFupWiilIBalIFYoIh1EBxEKIih0MOZ1msS+hbc1yTni4mKms6XfIbnnC/mG9hSq6mZP7btdVVWNXae949aa2y1VUE3nwDVsHkw+Z378FoT3l4Z2HO/EXd3SNMPwfLoYTJfY/HA8T/UL6eDK3JUMtjDjnb3DFOoMbtTW45tpOHxPR1Y2Sk4/86PxSzotqn59Of/e+ajVPqZto9E4/Lj+tWd0dxrdviYPaNA6hseD9MEN2ih+eJr7o8XzJBxepNOfx3Zdp03Hhv5sHjz+/fVo0MUEry4Zt4hbnGvimnMkjpwDcWAc1zJuLhmvEK9wXiZe5rxEvMS5TdzmnHyR+yL5IvdF8kXui+SL3BfJF7kvkC9wXyBf4L5AvsB9gXyB+wL5AvcF8oXVl1MvKC2pSWqSWh6pWZKapCap5ZGaDdKatCat5dKa/FuT1qS1XFpD80YkNolNYvv32PpfCLkneIcUAAA=',
    limit: 20,
    play_parse: true,
    lazy: async function () {
        let {getProxyUrl, input} = this;
        let ids = input.split('/')
        let vid = ids[5].replace('.html', '')
        let cid = ids[4]
        let result = {};
        let danmu = getProxyUrl() + "&url=" + encodeURIComponent(`https://galaxy.bz.mgtv.com/getctlbarrage?vid=${vid}&cid=${cid}`)
        console.log(danmu)
        result["parse"] = 1;
        result["url"] = input;
        result["jx"] = 1
        result["danmaku"] = danmu;
        return result
    },
    一级: async function () {
        let {input} = this;
        let list = (await getHtml(input)).data.data.hitDocs;
        let videos = []
        list.forEach(item => {
            videos.push({
                url: item.playPartId,
                title: item.title,
                desc: item.updateInfo || item.rightCorner.text,
                pic_url: item.img,
            });
        })
        return setResult(videos);
    },
    二级: async function () {
        let {input} = this;
        log(input);
        let VOD = {};
        let d = [];
        let json = (await getHtml(input)).data;
        let host = "https://www.mgtv.com";
        let ourl = json.data.list.length > 0 ? json.data.list[0].url : json.data.series[0].url;
        if (!/^http/.test(ourl)) {
            ourl = host + ourl
        }
        let html = (await getHtml({
            url: ourl,
            headers: {
                'User-Agent': MOBILE_UA
            }
        })).data;
        if (html.includes("window.location =")) {
            print("开始获取ourl");
            ourl = pdfh(html, "meta[http-equiv=refresh]&&content").split("url=")[1];
            print("获取到ourl:" + ourl);
            html = (await getHtml(ourl)).data
        }
        try {
            const $ = pq(html)
            const js = JSON.parse($('script:contains(__INITIAL_STATE__)').html().replace('window.__INITIAL_STATE__=', '')).playPage.videoinfo;
            VOD.vod_name = js.clipName;
            VOD.type_name = js['0'];
            VOD.vod_area = js['1'];
            VOD.vod_actor = js['4'];
            // VOD.vod_director = js['0'];
            VOD.vod_remarks = js['3'];
            VOD.vod_pic = js.colImage;
            VOD.vod_content = js['5'];
            if (!VOD.vod_name) {
                VOD.vod_name = VOD.type_name;
            }
        } catch (e) {
            log("获取影片信息发生错误:" + e.message)
        }

        function getRjpg(imgUrl, xs) {
            xs = xs || 3;
            let picSize = /jpg_/.test(imgUrl) ? imgUrl.split("jpg_")[1].split(".")[0] : false;
            let rjpg = false;
            if (picSize) {
                let a = parseInt(picSize.split("x")[0]) * xs;
                let b = parseInt(picSize.split("x")[1]) * xs;
                rjpg = a + "x" + b + ".jpg"
            }
            return /jpg_/.test(imgUrl) && rjpg ? imgUrl.replace(imgUrl.split("jpg_")[1], rjpg) : imgUrl
        }

        if (json.data.total === 1 && json.data.list.length === 1) {
            let data = json.data.list[0];
            let url = "https://www.mgtv.com" + data.url;
            d.push({
                title: data.t4,
                desc: data.t2,
                pic_url: getRjpg(data.img),
                url: url
            })
        } else if (json.data.list.length > 1) {
            for (let i = 1; i <= json.data.total_page; i++) {
                if (i > 1) {
                    json = JSON.parse(fetch(input.replace("page=1", "page=" + i), {}))
                }
                json.data.list.forEach(function (data) {
                    let url = "https://www.mgtv.com" + data.url;
                    if (data.isIntact === "1") {
                        d.push({
                            title: data.t4,
                            desc: data.t2,
                            pic_url: getRjpg(data.img),
                            url: url
                        })
                    }
                })
            }
        } else {
            print(input + "暂无片源")
        }
        VOD.vod_play_from = "mgtv";
        VOD.vod_play_url = d.map(function (it) {
            return it.title + "$" + it.url
        }).join("#");
        return VOD
    },
    搜索: async function () {
        let {input} = this;
        let d = [];
        let json = (await getHtml(input)).data;
        json.data.contents.forEach(function (data) {
            if (data.type && data.type === 'media') {
                let item = data.data[0];
                let desc = item.desc.join(',');
                let fyclass = '';
                if (item.source === "imgo") {
                    let img = item.img ? item.img : '';
                    try {
                        fyclass = item.rpt.match(/idx=(.*?)&/)[1] + '$';
                    } catch (e) {
                        log(e.message);
                        fyclass = '';
                    }
                    log(fyclass);
                    d.push({
                        title: item.title.replace(/<B>|<\/B>/g, ''),
                        img: img,
                        content: '',
                        desc: desc,
                        url: fyclass + item.url.match(/.*\/(.*?)\.html/)[1]
                    })
                }
            }
        });
        return setResult(d)
    },
    proxy_rule: async function (params) {
        let {input} = this;
        log('[proxy_rule] input:', input);
        let resp = await getHtml({
            url: decodeURIComponent(input),
            method: 'GET',
            headers: {
                'User-Agent': PC_UA,
            }
        });
        log("加载弹幕");
        let damu = await getDanmu(resp.data);
        return [200, 'text/xml', damu];
    }
}

async function getDanmu(data) {
    let danmu = '<i>';
    if (data) {
        const urls = Array.from({length: 121}, (_, i) =>
            `https://${data.data.cdn_list.split(",")[0]}/${data.data.cdn_version}/${i}.json`);

        try {
            const responses = await Promise.all(urls.map(url => getHtml(url)));
            responses.forEach(response => {
                const list = response.data;
                if (typeof list === 'object' && list?.data?.items) {
                    list.data.items.forEach(item => {
                        danmu += `<d p="${item.time / 1000},1,25,${gcolor()}">${item.content}</d>`;
                    });
                }
            });
        } catch (error) {
            console.error("Error fetching danmu data:", error);
        }

        danmu += '</i>';
        log("读取弹幕成功");
        return danmu;
    }
}

function gcolor() {
    // 生成随机的红、绿、蓝分量
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);

    // 将 RGB 分量转换为十进制颜色值
    return (r << 16) + (g << 8) + b;
}
