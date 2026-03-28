/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '光速',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    title: '光速',
    host: 'https://jingyu-1312635929.cos.ap-nanjing.myqcloud.com/1.json',
    url: '/api.php/getappapi.index/typeFilterVodList',
    homeUrl: '/api.php/getappapi.index/initV119',
    detailUrl: '/api.php/getappapi.index/vodDetail',
    searchUrl: '/api.php/getappapi.index/searchList',
    headers: {'User-Agent': 'UC_UA'},
    searchable: 1,
    quickSearch: 0,
    filterable: 1,
    double: true,
    play_parse: true,
    limit: 6,
    // class_name: '电影&电视剧&动漫&短剧&综艺',
    // class_url: '1&2&3&4&5',
    playHeader: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; M2012K10C Build/RP1A.200720.011)'
    },
    hostJs: async function () {
        let {HOST} = this;
        return await request(HOST);
    },
    预处理: async function () {

    },
    class_parse: async function () {
        let {input, pdfa, pdfh, pd} = this;
        // log('input:', input);
        let data = await getdata(input);
        // log('data:', data);
        const dy = {
            "class": "类型",
            "area": "地区",
            "lang": "语言",
            "year": "年份",
            "letter": "字母",
            "by": "排序",
            "sort": "排序"
        };
        const filters = {};
        const classes = [];
        const json_data = data["type_list"];
        const homedata = data["banner_list"];

        for (let item of json_data) {
            if (item["type_name"] === "全部") {
                continue;
            }

            let has_non_empty_field = false;
            const jsontype_extend = JSON.parse(item["type_extend"]);
            homedata.push(...item["recommend_list"]);
            jsontype_extend["sort"] = "最新,最热,最赞";
            classes.push({
                "type_name": item["type_name"],
                "type_id": item["type_id"]
            });

            for (let key in dy) {
                if (key in jsontype_extend && jsontype_extend[key].trim() !== "") {
                    has_non_empty_field = true;
                    break;
                }
            }

            if (has_non_empty_field) {
                filters[String(item["type_id"])] = [];
                for (let dkey in jsontype_extend) {
                    if (dkey in dy && jsontype_extend[dkey].trim() !== "") {
                        const values = jsontype_extend[dkey].split(",");
                        const value_array = values
                            .map(value => {
                                value = value.trim();
                                if (value !== "") {
                                    return {"n": value, "v": value};
                                }
                            })
                            .filter(item => item !== undefined);  // Remove undefined values

                        filters[String(item["type_id"])].push({
                            "key": dkey,
                            "name": dy[dkey],
                            "value": value_array
                        });
                    }
                }
            }
        }

        const result = {
            "class": classes,
            "filters": filters,
            "list": homedata
        };
        return result;
    },
    lazy: async function (flag, id, flags) {
        let {input, getProxyUrl} = this;
        const ids = id.split("|||");
        if (ids[1]) {
            this.playHeader['User-Agent'] = base64Decode(ids[1]);
        }
        let url = base64Decode(ids[0]);

        if (!/\.(m3u8|mp4)$/i.test(url)) {
            const a = url.split("@@");
            const body = `parse_api=${a[0]}&url=${encodeURIComponent(aes("encrypt", a[1]))}&token=${ids[ids.length - 1]}`;
            const jd = (await getdata(rule.host + "/api.php/getappapi.index/vodParse", body))['json'];
            url = JSON.parse(jd)['url'];
        }

        if (/\.(jpg|png|jpeg)$/i.test(url)) {
            url = getProxyUrl() + "&url=" + base64Encode(url) + "&type=m3u8";
        }

        const result = {
            "parse": 0,
            "url": url,
            "header": this.playHeader
        };

        return result;
    },
    推荐: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let d = [];
        return setResult(d)
    },
    一级: async function (tid, pg, filter, extend) {
        let {input} = this;
        const body = {
            "area": extend.area || '全部',
            "year": extend.year || '全部',
            "type_id": tid,
            "page": pg,
            "sort": extend.sort || '最新',
            "lang": extend.lang || '全部',
            "class": extend.class || '全部'
        };
        let data = await getdata(input, body);
        return data["recommend_list"]
    },
    二级: async function (ids) {
        let {input, pdfa, pdfh, pd} = this;
        log('input:', input);
        const body = `vod_id=${ids[0]}`;
        const data = await getdata(input, body);
        const vod = data["vod"];

        const play = [];
        const names = [];

        for (let itt of data["vod_play_list"]) {
            const a = [];
            names.push(itt["player_info"]["show"]);
            const parse = itt["player_info"]["parse"];
            let ua = '';

            if (itt["player_info"]["user_agent"] && itt["player_info"]["user_agent"] !== '') {
                ua = base64Encode(unescape(encodeURIComponent(itt["player_info"]["user_agent"])));
            }

            for (let it of itt["urls"]) {
                let url = it["url"];
                if (!/\.(m3u8|mp4)$/i.test(url)) {
                    url = parse + '@@' + url;
                }
                url = base64Encode(unescape(encodeURIComponent(url)));
                a.push(`${it['name']}$${url}|||${ua}|||${it['token']}`);
            }
            play.push(a.join("#"));
        }

        vod["vod_play_from"] = names.join("$$$");
        vod["vod_play_url"] = play.join("$$$");
        return vod;
    },
    搜索: async function (wd, quick, pg) {
        let {input, pdfa, pdfh, pd} = this;
        let body = `keywords=${wd}&type_id=0&page=${pg}`;
        let data = await getdata(input, body);
        return data["search_list"]
    },
    proxy_rule: async function (params) {
        let {input, MY_URL} = this;
        // log(`params:`, params);
        // log(`input:${input}`);
        // log(`MY_URL:${MY_URL}`);
        const url = base64Decode(input);
        const durl = url.slice(0, url.lastIndexOf('/'));
        let data = await request(url, {headers: this.playHeader});
        let inde = null;
        let pd = true;
        const lines = data.trim().split('\n');
        for (let index = 0; index < lines.length; index++) {
            const string = lines[index];
            // Uncomment the next two lines if you want to handle '#EXT-X-DISCONTINUITY' lines
            // if (string.includes('#EXT-X-DISCONTINUITY') && pd) {
            //     pd = false;
            //     inde = index;
            // }
            if (!string.includes('#EXT') && !string.includes('http')) {
                lines[index] = durl + (string.startsWith('/') ? '' : '/') + string;
            }
        }
        if (inde) {
            lines.splice(inde, 4);  // Remove 4 lines starting from index `inde`
        }

        data = lines.join('\n');

        return [200, "application/vnd.apple.mpegurl", data];
    }
}

function aes(operation, text) {
    const key = CryptoJS.enc.Utf8.parse("4d83b87c4c5ea111");  // 16 bytes key
    const iv = key;  // 使用与 key 相同的 iv

    if (operation === "encrypt") {
        // 使用 CBC 模式，填充并加密
        const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        // 返回 Base64 编码的密文
        return encrypted.toString();
    } else if (operation === "decrypt") {
        // 解密并去除填充
        const decrypted = CryptoJS.AES.decrypt(text, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        // 返回解密后的明文
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
}

function header() {
    const t = String(Math.floor(Date.now() / 1000));  // 获取当前时间戳
    return {
        "User-Agent": "okhttp/3.14.9",
        "app-version-code": "300",
        "app-ui-mode": "light",
        "app-user-device-id": md5(t),
        "app-api-verify-time": t,
        "app-api-verify-sign": aes("encrypt", t),  // 使用 AES 加密
        "Content-Type": "application/x-www-form-urlencoded"
    };
}

async function getdata(url, data = null) {
    let responseData = await post(url, {data, headers: header()});
    let responseJson = JSON.parse(responseData);
    const decryptedData = aes("decrypt", responseJson.data);
    return JSON.parse(decryptedData);
}
