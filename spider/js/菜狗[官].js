/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '菜狗[官]',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    title: '菜狗[官]',
    host: 'https://waptv.sogou.com',
    homeUrl: '',
    searchUrl: '/film/result?ie=utf8&query=**',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    multi: 1,
    // 分类链接fypage参数支持1个()表达式
    url: '/napi/video/classlist?abtest=0&iploc=CN1304&spver=&listTab=fyclass&filter=&start=((fypage-1)*15)&len=15&fr=filter',
    filter_url: 'style={{fl.style}}&zone={{fl.zone}}&year={{fl.year}}&fee={{fl.fee}}&order={{fl.order}}',
    headers: {
        'User-Agent': 'PC_UA'
    },
    timeout: 5000,
    class_name: '电视剧&电影&动漫&综艺&纪录片',
    class_url: 'teleplay&film&cartoon&tvshow&documentary',
    filter: 'H4sIAAAAAAAAA+2Y3VIiRxTH34VrL9TsV/Iqqb2g3NlKKiopl92U2bIKQRRQASkXMXyqiygrOiCyMID7MtM9w1tkmO5zTpuLyVxYayrFFfzOme4+06f7f7rnYyCsLWu/LwfXAz/9/DHwm+b8Bt6F15e1wFxgNbiiOWi1h6yy6/CH4PJ7zX1u1TGz+MUkdjE1OxDYmBNWK9Hmsbi0SgAfy5dYsiF9EsA3iY1ZPyp9EsDHo1dW/kD6JGCfmc/2GYwnAX2bPRbLgE8Axpm6scZNiFMAtktvs0wH2gnAWBIF00hCLALQ1zo372vgEwA+u3XO9mA8CRhL44ANhhCLAIylvkM+Cdinvu9EAH0KwHbbJV6GOZOAvnjPHObBJ2Dj9dQr8v9naFVJPyvpbM/wmX62HXeex2FdwBSfH/P+DaRYAKVR54N7TKML2K56yYpjaCcAp/xWJ58E9B3VeekKfAJwyu/T1E4CTutum3wSsM+8zlI1Vj6BbpH9Tu66FlxTJnfQNYdnPid3cX7xB2lz/yr2RbIvqvYFsi+o9nmyzyv2hR/R7vxV7K/I/kq1vyT7S9X+guwvVPtzsj9X7c/I/owmu9jlR5cw0wLUqXyrKcvUvtviRtbnTPLWmZXcwZ3qAiVw3+4OHjzxwATPmcPCP597YFIjDa290ZSs83SOGRm/sZYiziqDWAWQOoztmy1UBxeccV/PBd7+urzySJLuJduecp+6MMclaCcAX2ozyyOwSyT4kUMeS/HoX9BOgC9J95BRT0n3Kj2pC+twSO83BdKJHTtpoEi4gAtnVLOvIaESaGHu2YkKLkwX/JQ6r/Iyk/uZ3M/k/v8t90vBtXAotPpIis+zFesKVU8AbqVYyz6JwFYSQHKQmxxDBiWoW1A/YPVbZRcK9qX7tRNWbEFEAqiW7DqVB2uJC9hnvTJpHUKfAmimDTo+S8B2xRQ/Bv2WgCvB6LBWFtaAAKoJbfbtCGuCC9jnl7p9U4Y+BaDolXO8UAfRE0DXkSpLFPE64oKfGmtHxs4kg7AJwPFahzTXEr5DvfDSaH7VoHAlYEjFsWngEUTATIFnCvwfUuDwh3e/hP54rK8opappGFYDdRYZnzis8i6KpQA/8m1ff7P1BIiCANqdPabj4VoAncpuzQGIngT0RZIUqgRF9idnVdL8KeB4/T5PwPcZCdjOaLJrOAhLoDjjztMYpwt0QYjzLRhPAhWKnjMbWChcwMRms7wBp0AJfgTY68DOcy2eAlGXQFuto1wQBCiFkH86pkI4hSc+zHsd2B0dd47pJOpT8CXq//Iq2sqSqje8kOaFqs93McefrCjclSRQWnJ2t8yuNzEzwJiA9K7ValtnKcgBMsY+qlnDfZaA3UKMm6KzyTaxogtQ+jf7eV45ov4lY/+Rpp3dh84FYPztJu/dQfACcHsncmwbCqwEjGjsXLPLkxzUUWKM63jMOpe8DIkmVpYt7zat8wGtXMkYufHVvofbtAQ6AdVMA05xErBdouD0xKPn0BQZn9BHvDYyBzrPgBA9MOF75tq88gVeUoAyCrts0BBTwLm7u2Nf4XwmAX36KbuAc5aEp603b0JL71e01XBw7bE+3Xt99rZ3mtZWD95fgHIGtZJ46heAGf98b45gk0jAPerxHcSpdjyPVV4AXcp32B5+OxJAGlY0jV3UMBdUWU1hRRWgjEfvIAHHS59a3VMYT4Cv8nYUt0/2qExNQemTbkoSnljiZ99rZreF2W3hu6j3xt+Cxnoedx0AAA==',
    limit: 20,
    play_parse: true,
    play_json: 1,
    lazy: async function () {
        let {input, fetch_params} = this;
        fetch_params.headers["User-Agent"] = MOBILE_UA;
        let html = await request(input, fetch_params);
        let rurl = html.match(/window\.open\('(.*?)',/)[1];
        rurl = urlDeal(rurl);
        return {parse: 1, jx: 1, url: rurl};
    },
    一级: async function () {
        let {input} = this;
        let d = [];
        let html = await request(input);
        html = JSON.parse(html);
        let list = html.listData.results;
        list.forEach(function (it) {
            let desc1 = it.ipad_play_for_list.finish_episode ? it.ipad_play_for_list.episode === it.ipad_play_for_list.finish_episode ? "全集" + it.ipad_play_for_list.finish_episode : "连载" + it.ipad_play_for_list.episode + "/" + it.ipad_play_for_list.finish_episode : "";
            let desc2 = it.score ? "评分:" + it.score : "";
            let desc3 = it.date ? "更至:" + it.date : "";
            d.push({
                title: it.name,
                img: it.v_picurl,
                url: "https://v.sogou.com" + it.url.replace("teleplay", "series").replace("cartoon", "series"),
                desc: desc1 || desc2 || desc3
            })
        });
        return setResult(d);
    },
    二级: async function () {
        let {input,pd} = this;
        log('input:', input);
        let VOD = {};
        let html = await request(input);
        try {
            let json = JSON.parse(html.match(/INITIAL_STATE.*?({.*});/)[1]).detail.itemData;
            let key = json.dockey;
            let name = json.name;
            let zone = json.zone;
            let score = json.score ? json.score : "暂无";
            let style = json.style;
            let emcee = json.emcee ? "主持：" + json.emcee : json.name;
            let director = json.director ? "导演：" + json.director : name;
            director = director.replace(/;/g, "\\t");
            let starring = json.starring ? "演员：" + json.starring : "声优：" + json.shengyou;
            starring = starring.replace(/.*undefined/, "").replace(/;/g, "\\t");
            let update = json.update_wordstr ? json.update_wordstr : "";
            let tv_station = json.tv_station ? json.tv_station : zone;
            let introduction = json.introduction;
            let shengyou = json.shengyou;
            let shows = json.play_from_open_index;
            let plays = json.play.item_list;
            if (shows) {
                VOD.vod_name = name;
                VOD.vod_area = emcee + "," + tv_station;
                VOD.vod_director = director;
                VOD.vod_actor = starring;
                VOD.vod_pic = pd(html, "#thumb_img&&img&&src");
                VOD.vod_remarks = style + " 评分:" + score + "," + update;
                VOD.vod_content = introduction
            } else {
                VOD.vod_name = name;
                VOD.vod_director = director;
                VOD.vod_actor = starring;
                VOD.vod_pic = pd(html, "#thumb_img&&img&&src");
                VOD.vod_content = introduction
            }
            log('vod:',VOD);
            let tp = "&type=json";
            try {
                let tabs = [];
                let lists = [];
                plays.forEach(function (it) {
                    lists.push(it.info);
                    let tbn = it.sitename[0] || it.site.replace(".com", "");
                    tbn = tbn.split("").join(" ");
                    tabs.push(tbn)
                });
                VOD.vod_play_from = tabs.join("$$$");
                let vod_lists = [];
                let play_url = '';
                print("play_url1:" + play_url);
                play_url = play_url.replace("&play_url=", "&type=json&play_url=");
                print("play_url2:" + play_url);
                lists.forEach(function (item, idex) {
                    if (item || shows) {
                        if (item && Array.isArray(item) && item.length > 1) {
                            let tmp = item.slice(1).map(function (its) {
                                return its.index + "$" + play_url + base64Encode(adhead(its.url))
                            });
                            vod_lists.push(tmp.join("#"))
                        }
                        if (shows) {
                            let arr = [];
                            let tmp = [];
                            let zy = shows.item_list[idex];
                            zy.date.forEach(function (date) {
                                let day = date.day;
                                for (let j = 0; j < day.length; j++) {
                                    let dayy = day[j][0] >= 10 ? day[j][0] : "0" + day[j][0];
                                    let Tdate = date.year + date.month + dayy;
                                    arr.push(Tdate)
                                }
                            });
                            for (let k = 0; k < arr.length; k++) {
                                let url = "https://v.sogou.com/vc/eplay?query=" + arr[k] + "&date=" + arr[k] + "&key=" + key + "&st=5&tvsite=" + plays[idex].site;
                                tmp.push("第" + arr[k] + "期" + "$" + play_url + base64Encode(adhead(url)))
                            }
                            vod_lists.push(tmp.join("#"))
                        }
                    } else if (plays[idex].site) {
                        let tmp = [];
                        if (!plays[idex].flag_list.includes("trailer")) {
                            tmp.push(plays[idex].sitename[0] + "$" + play_url + base64Encode(adhead(plays[idex].url)))
                        } else {
                            tmp.push(plays[idex].sitename[0] + "—预告" + "$" + play_url + base64Encode(adhead(plays[idex].url)))
                        }
                        vod_lists.push(tmp.join("#"))
                    }
                });
                VOD.vod_play_url = vod_lists.join("$$$")
            } catch (e) {
                let img = json.photo.item_list;
                VOD.vod_name = "本片无选集";
                VOD.vod_pic = img.length > 0 ? img[0] : ""
            }
        } catch (e) {
            print("发生了错误:" + e.message)
        }

        return VOD

    },
搜索: async function () {
        let {input} = this;
        let d = [];
        let html = await request(input);
        let jsonA = JSON.parse(html.match(/INITIAL_STATE.*?({.*});/)[1]);
        print(jsonA);
        jsonA = jsonA.result.resultData.searchData.results;
        jsonA.forEach(function (it) {
            let name = it.name;
            let introduction = it.introduction;
            let pic = it.v_picurl;
            let url = it.tiny_url;
            let zone = it.zone;
            let score = it.score || "暂无";
            let style = it.style;
            if (it.play_info && it.play_info.play_list) {
                let r = {};
                r.title = name.replace(//, "").replace(//, "");
                r.url = "https://v.sogou.com" + url.replace(/teleplay|cartoon/g, 'series');
                r.desc = it.listCategory.join(",");
                r.content = introduction;
                r.pic_url = pic;
                d.push(r)
            }
        });
        return setResult(d);
    },
}

function adhead(url) {
    let hd = "https://v.sogou.com";
    if (!url.startsWith(hd)) {
        url = hd + url
    }
    return urlencode(url)
}