/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: 'PTT[优]',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',//影视|听书|漫画|小说
    title: 'PTT[优]',
    host: 'https://ptt.red',
    homeUrl: '/zh-cn',
    url: '/zh-cn/p/fyclassfyfilter',
    searchUrl: '/zh-cn/q/**?page=fypage',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    filter: 'H4sIAAAAAAAAAO2X32saQRDH/5d76JMQ74d3Z8C/pIRytD6UpimYtBCCYCIGY9qoIbWVSltIqia1UUkQf+TSf8bdPf+Luml0ZtcsBFqf9HH3M+vOznxnvNnRdG316Y72Kr6trWqk0iLv+1pI2/Bex/H6nbf+Nn5nuMG3M/VRus63xwstGbrfPauNyvv3u0+8RNx79vJFzJjyUbVMu02ZR+B8vkV7tzK34Py3c/LFl7nuTA3opx+00pgxcMGgUWO3R7KBDfyq9dANYXDxQ4v0qzMG4CPJdIaDkmxgask1bvE3yKw9IF8PIcjT9WOCPLypssIkyCvPV0wT7s7Vh34FEIpsqUIOakDgxSzbpukMEAgmqxVJbwAERXG3QFMlIFE4k2sy/wIIihzNfh72DxDSsd/05idCIJmx14J7OryW9S+I/xEFAt2112ClIkIWvoudoFeZkYdTN0YWvDionQbNa3TKEBJKetfDgY+qZrJ+TEKNsGFN9LId9xKxuw1ETZmamBoyNTDVZapjGpZpGFE9KlE9iqkrUxdTR6YOprZMbUwjMo1gKseK1x5KBT06Jv08pGK6FlPB9tv0+JecClpJ0VJrcsHmm8RWbN3b3OIXrIU0Yy59kota0QJ50UHMhe7JESpI3Pd4QUIehZ7JEQhAaIbcDVdZCjxBS70vmN7NueldLWqUkZlS0JV6d02l3l1DqXekHOF/n1eJoSwFw1yWwsKVgjWvUjBstahttagdtagdtXLdpXIXTrkR3MX/afAIOleskEbTBeSbNS9FBI+n3S7N5hGCfIwbvHDKRt/2flFEigGLt+plP148Vdv2/1I1y/riZAzRCeopYfa0Iazs/HfQyQFy1LOng+bc/Flwimdt9NmS9kl3D3V4+EF2UiGX3xECRQblAt09REg9zDrWskwWrEySfwAneSZu2xMAAA==',
    filter_url: '{% if fyclass !="1" %}{{fl.地区}}?page=fypage{% else %}{{fl.类型}}?page=fypage{{fl.地区|safe}}{% endif %}{{fl.年份|safe}}{{fl.排序|safe}}',
    filter_def: {},
    headers: {
        'User-Agent': 'MOBILE_UA',
    },
    timeout: 5000,
    // class_parse: '.nav-tabs&&a;a&&Text;a&&href;(\\d+)',
    cate_exclude: '',
    play_parse: true,
    class_parse: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.nav-tabs&&a');
        data.forEach((it) => {
            d.push({
                type_name: pdfh(it, 'a&&Text'),
                type_id: pd(it, 'a&&href').match(/(\d+)/)[1],
            })
        });
        return {
            class: d
        }
    },
    lazy: async function () {
        let {input} = this;
        let html = await request(input);
        let sdata = pdfh(html, '.container-fluid&&script&&Html');
        let json = JSON.parse(sdata);
        if (json.contentUrl) {
            return {parse: 0, url: json.contentUrl, js: ''};
        }
        return input
    },
    double: false,
    推荐: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '#videos&&.card:not(:has(.badge-success:contains(广告)))');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a:eq(-1)&&Text'),
                pic_url: pd(it, 'img&&src'),
                desc: pdfh(it, '.badge-success&&Text'),
                url: pd(it, 'a:eq(-1)&&href'),
            })
        });
        return setResult(d)
    },
    一级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '#videos&&.card:not(:has(.badge-success:contains(广告)))');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a:eq(-1)&&Text'),
                pic_url: pd(it, 'img&&src'),
                desc: pdfh(it, '.badge-success&&Text'),
                url: pd(it, 'a:eq(-1)&&href'),
            })
        });
        return setResult(d)
    },
    二级: async function () {
        let {input, pdfh, pd} = this;
        let html = await request(input);
        let data = html.split('node:')[1].split('},')[0] + '}';
        data = data.trim();
        let json = JSON.parse(data);
        let VOD = {};
        VOD.vod_name = json.title;
        VOD.type_name = json.type;
        VOD.vod_id = input;
        VOD.vod_pic = urljoin(input, json.thumbnail);
        VOD.vod_year = json.year;
        VOD.vod_area = json._area;
        VOD.vod_remarks = json.note;
        VOD.vod_content = json.description;
        VOD.vod_director = json.director;
        VOD.vod_actor = json.actors;
        let v_tabs = pdfa(html, '.nav-tabs&&li');
        let v_tab_urls = v_tabs.map(it => pd(it, 'a&&href', input));
        v_tabs = v_tabs.map(it => pdfh(it, 'a&&title'));
        VOD.vod_play_from = v_tabs.join('$$$');
        let lists = [];
        let list1 = pdfa(html, '.mb-2.fullwidth&&a').map(it => pdfh(it, 'a&&Text') + '$' + pd(it, 'a&&href', input));
        // log(list1);
        lists.push(list1);
        // log(v_tab_urls);
        if (v_tab_urls.length > 1) {
            let t1 = (new Date()).getTime();
            let reqUrls = v_tab_urls.slice(1).map(it => {
                return {
                    url: it,
                    options: {
                        timeout: 5000,
                        headers: rule.headers
                    }
                }
            });
            let htmls = await batchFetch(reqUrls);
            let t2 = (new Date()).getTime();
            log(`批量请求二级 ${input} 耗时${t2 - t1}毫秒:`);
            htmls.forEach((ht) => {
                if (ht) {
                    let list0 = pdfa(ht, '.mb-2.fullwidth&&a').map(it => pdfh(it, 'a&&Text') + '$' + pd(it, 'a&&href', input));
                    lists.push(list0);
                } else {
                    lists.push([]);
                }
            });

        }
        let playUrls = lists.map(it => it.join('#'));
        VOD.vod_play_url = playUrls.join('$$$');
        return VOD
    },
    搜索: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '#videos&&.card:not(:has(.badge-success:contains(广告)))');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a:eq(-1)&&Text'),
                pic_url: pd(it, 'img&&src'),
                desc: pdfh(it, '.badge-success&&Text'),
                url: pd(it, 'a:eq(-1)&&href'),
            })
        });
        return setResult(d)
    }
}
