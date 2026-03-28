/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '西饭短剧[短]',
  '类型': '短剧',
  lang: 'ds'
})
*/

var rule = {
    title: '西饭短剧[短]',
    类型:'短剧',
    host: 'https://xifan-api-cn.youlishipin.com',
    homeUrl: '/xifan/drama/portalPage?reqType=duanjuCategory&version=2001001&androidVersionCode=28',
    searchUrl: '**',
    url: '/xifan/drama/portalPage?reqType=aggregationPage&offset=fypage&categoryId=fyclass',
    headers: {
        'User-Agent': 'okhttp/3.12.11',
    },
    timeout: 5000,
    filterable: 1,
    limit: 30,
    multi: 1,
    searchable: 2,
    play_parse: true,
    search_match: true,

    class_parse: async function () {
        let {input} = this;
        let html = await request(input);
        let classes = [];
        let filters = {};
        let data = JSON.parse(html).result.elements[0].contents;
        data.forEach((it) => {
            const categoryItemVo = it.categoryItemVo || {};
            const typeName = categoryItemVo.oppoCategory;
            const typeId = categoryItemVo.categoryId;
            const subCategories = categoryItemVo.subCategories || [];

            // 只提取 type 为 duanjuCategory 的作为主分类
            if (it.type && it.type.includes("duanjuCategory")) {
                classes.push({
                    type_name: typeName,
                    type_id: `${typeId}@${typeName}`,
                });
            }

            // 其他作为筛选条件
            if (subCategories.length > 0) {
                filters[typeName] = {
                    key: categoryItemVo.categoryId,
                    name: categoryItemVo.oppoCategory,
                    value: subCategories.map(sub => ({
                        n: sub.oppoCategory,
                        v: `${sub.oppoCategory}@${sub.categoryId}`
                    }))
                };
            }
        });
        // 设置筛选条件
        return {
            class: classes,
            filters: filters
        };
    },

    一级: async function () {
        let {input,MY_PAGE} = this;
        const typeId = input.split('categoryId=')[1].split('@')[0];
        const typeName = input.split('categoryId=')[1].split('@')[1];
        let page = (MY_PAGE - 1) * rule.limit;
        let current_timestamp = Math.floor(Date.now() / 1000);
        let url = `${rule.host}/xifan/drama/portalPage?reqType=aggregationPage&offset=${page}&categoryId=${typeId}&quickEngineVersion=-1&scene=&categoryNames=${encodeURIComponent(typeName)}&categoryVersion=1&density=1.5&pageID=page_theater&version=2001001&androidVersionCode=28&requestId=${current_timestamp}aa498144140ef297&appId=drama&teenMode=false&userBaseMode=false&session=eyJpbmZvIjp7InVpZCI6IiIsInJ0IjoiMTc0MDY1ODI5NCIsInVuIjoiT1BHXzFlZGQ5OTZhNjQ3ZTQ1MjU4Nzc1MTE2YzFkNzViN2QwIiwiZnQiOiIxNzQwNjU4Mjk0In19&feedssession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dHlwIjowLCJidWlkIjoxNjMzOTY4MTI2MTQ4NjQxNTM2LCJhdWQiOiJkcmFtYSIsInZlciI6MiwicmF0IjoxNzQwNjU4Mjk0LCJ1bm0iOiJPUEdfMWVkZDk5NmE2NDdlNDUyNTg3NzUxMTZjMWQ3NWI3ZDAiLCJpZCI6IjNiMzViZmYzYWE0OTgxNDQxNDBlZjI5N2JkMDY5NGNhIiwiZXhwIjoxNzQxMjYzMDk0LCJkYyI6Imd6cXkifQ.JS3QY6ER0P2cQSxAE_OGKSMIWNAMsYUZ3mJTnEpf-Rc`;

        let d = [];
        let html = await request(url, { headers: rule.headers });
        let data = JSON.parse(html).result.elements;
        data.forEach((soup) => {
            soup.contents.forEach((vod) => {
                let dj = vod.duanjuVo;
                d.push({
                    title: dj.title,
                    img: dj.coverImageUrl,
                    desc: dj.total + '集',
                    url: `${dj.duanjuId}#${dj.source}`
                });
            });
        });

        return setResult(d);
    },

    二级: async function () {
        let {orId} = this;
        let [duanjuId, source] = orId.split("#");
        let url = `${rule.host}/xifan/drama/getDuanjuInfo?duanjuId=${duanjuId}&source=${source}&openFrom=homescreen&type=&pageID=page_inner_flow&density=1.5&version=2001001&androidVersionCode=28&requestId=1740658944980aa498144140ef297&appId=drama&teenMode=false&userBaseMode=false&session=eyJpbmZvIjp7InVpZCI6IiIsInJ0IjoiMTc0MDY1ODI5NCIsInVuIjoiT1BHXzFlZGQ5OTZhNjQ3ZTQ1MjU4Nzc1MTE2YzFkNzViN2QwIiwiZnQiOiIxNzQwNjU4Mjk0In19&feedssession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dHlwIjowLCJidWlkIjoxNjMzOTY4MTI2MTQ4NjQxNTM2LCJhdWQiOiJkcmFtYSIsInZlciI6MiwicmF0IjoxNzQwNjU4Mjk0LCJ1bm0iOiJPUEdfMWVkZDk5NmE2NDdlNDUyNTg3NzUxMTZjMWQ3NWI3ZDAiLCJpZCI6IjNiMzViZmYzYWE0OTgxNDQxNDBlZjI5N2JkMDY5NGNhIiwiZXhwIjoxNzQxMjYzMDk0LCJkYyI6Imd6cXkifQ.JS3QY6ER0P2cQSxAE_OGKSMIWNAMsYUZ3mJTnEpf-Rc`;

        let response = await request(url, { headers: rule.headers });
        let data = JSON.parse(response).result;
        VOD = {
            vod_name: data.title,
            vod_pic: data.coverImageUrl,
            vod_content:  data.desc || '未知',
            vod_remarks: data.updateStatus === 'over'  ? `${data.total}集 已完结`  : `更新${data.total}集`
        };

        let playUrls = [];
        data.episodeList.forEach((ep) => {
            playUrls.push(`${ep.index}$${ep.playUrl}`);
        });

        VOD.vod_play_from = '西饭短剧';
        VOD.vod_play_url = playUrls.join("#");
        return VOD;
    },

    搜索: async function () {
        let {input,MY_PAGE,KEY} = this;
        let d = [];
        let current_timestamp = Math.floor(Date.now() / 1000);
        let url = `${rule.host}/xifan/search/getSearchList?keyword=${KEY}84&pageIndex=${MY_PAGE}&version=2001001&androidVersionCode=28&requestId=${current_timestamp}ea3a14bc0317d76f&appId=drama&teenMode=false&userBaseMode=false&session=eyJpbmZvIjp7InVpZCI6IiIsInJ0IjoiMTc0MDY2ODk4NiIsInVuIjoiT1BHX2U5ODQ4NTgzZmM4ZjQzZTJhZjc5ZTcxNjRmZTE5Y2JjIiwiZnQiOiIxNzQwNjY4OTg2In19&feedssession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dHlwIjowLCJidWlkIjoxNjM0MDU3ODE4OTgxNDk5OTA0LCJhdWQiOiJkcmFtYSIsInZlciI6MiwicmF0IjoxNzQwNjY4OTg2LCJ1bm0iOiJPUEdfZTk4NDg1ODNmYzhmNDNlMmFmNzllNzE2NGZlMTljYmMiLCJpZCI6ImVhZGE1NmEyZWEzYTE0YmMwMzE3ZDc2ZmVjODJjNzc3IiwiZXhwIjoxNzQxMjczNzg2LCJkYyI6ImJqaHQifQ.IwuI0gK077RF4G10JRxgxx4GCG502vR8Z0W9EV4kd-c`;

        let html = await request(url, {headers: rule.headers });
        let data = JSON.parse(html).result.elements;
        data.forEach((soup) => {
            soup.contents.forEach((vod) => {
                let dj = vod.duanjuVo;
                let name = dj.title.replace(/<\/?tag>/g, "");
                if (rule.search_match && !new RegExp(KEY, "i").test(name)) {
                    return;
                }

                d.push({
                    title: name,
                    img: dj.coverImageUrl,
                    desc: dj.total + '集',
                    url: `${dj.duanjuId}#${dj.source}`
                });
            });
        });

        return setResult(d);
    },
    lazy: async function () {
        let {input} = this;
        return   {
            parse: 0,
            url: input
        };
    },
}
