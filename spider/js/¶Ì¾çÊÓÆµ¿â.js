/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 1,
  title: '短剧视频库',
  author: '251208_DS',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    author: '251208_DS',
    title: '短剧视频库',
    类型: '影视',
    host: 'https://www.lehuashi.com/',
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    timeout: 5000,
    homeUrl: '/',
    url: '/show/fyfilter.html',
    filter_url: '{{fl.cateId}}{{fl.area}}{{fl.by}}{{fl.class}}{{fl.lang}}/page/fypage/{{fl.year}}',
    detailUrl: '/detail/fyid.html',
    searchUrl: '/search/page/fypage/wd/**.html',
    searchable: 2,
    quickSearch: 1,
    filterable: 1,
    limit: 10,
    double: false,
    class_name: '电影&电视剧&短剧&动漫&综艺',
    class_url: '1&2&3&4&5',
    filter_def: {
        1: { cateId: '1' },
        2: { cateId: '2' },
        3: { cateId: '3' },
        4: { cateId: '4' },
        5: { cateId: '5' }
    },
    搜索: async function () {
        return this.一级();
    },

    推荐: async function () {
        return this.一级();
    },

    一级: async function (tid, pg, filter, extend) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let klist = pdfa(html, '.fed-list-item');
        let k = klist.map(it => ({
            title: pdfh(it, '.fed-list-title&&Text'),
            pic_url: pdfh(it, '.fed-lazy&&data-original'),
            desc: pdfh(it, '.fed-text-center&&Text'),
            url: pdfh(it, 'a&&href'),
            content: ''
        }));
        return setResult(k);
    },

    二级: async function (ids) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};
        VOD.vod_id = input;
        VOD.vod_name = pdfh(html, 'h1&&Text');
        VOD.type_name = pdfh(html, 'li:contains(分类)&&Text').replace('分类：','');
        VOD.vod_pic = pd(html, '.lazyload&&data-original', input);
        VOD.vod_remarks = pdfh(html, 'li:contains(状态)&&Text').replace('状态：','');
        VOD.vod_year = pdfh(html, 'li:contains(年份)&&Text').replace('年份：','');
        VOD.vod_area = pdfh(html, 'li:contains(地区)&&Text').replace('地区：','');
        VOD.vod_director = pdfh(html, 'li:contains(导演)&&Text').replace('导演：','');
        VOD.vod_actor = pdfh(html, 'li:contains(主演)&&Text').replace('主演：','');
        VOD.vod_content = pdfh(html, '.fed-conv-text&&Text').replace('简介：','');
        
        let r_ktabs = pdfa(html, '.fed-tabs-btn');
        let ktabs = r_ktabs.map(it => pdfh(it, 'a&&Text'));
        VOD.vod_play_from = ktabs.join('$$$');
        
        let klists = [];
        let r_plists = pdfa(html, '.fed-tabs-btm');
        r_plists.forEach((rp) => {
            let klist = pdfa(rp, 'a').map((it) => {
                return pdfh(it, 'a&&Text') + '$' + pd(it, 'a&&href', input);
            });
            klist = klist.join('#');
            klists.push(klist);
        });
        VOD.vod_play_url = klists.join('$$$');
        return VOD;
    },

    搜索: async function (wd, quick, pg) {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.fed-list-deta');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, '.fed-deta-content&&h1&&Text'),
                pic_url: pdfh(it, '.fed-lazy&&data-original'),
                desc: pdfh(it, '.fed-text-center&&Text'),
                url: pd(it, 'a&&href'),
                content: ''
            });
        });
        return setResult(d);
    },

    lazy: async function (flag, id, flags) {
        let {input, pdfa, pdfh, pd} = this;
        let kcode = JSON.parse(fetch(input).split('aaaa=')[1].split('<')[0]);
        let kurl = kcode.url;
        if (/\.(m3u8|mp4)/.test(kurl)) {
            return { 
                jx: 0, 
                parse: 0, 
                url: kurl, 
                header: {
                    'User-Agent': MOBILE_UA, 
                    'Referer': getHome(kurl)
                } 
            };
        } else {
            return { jx: 0, parse: 1, url: input };
        }
    },

    sniffer: 0,
    isVideo: 'http((?!http).){26,}\\.(m3u8|mp4|flv|avi|mkv|wmv|mpg|mpeg|mov|ts|3gp|rm|rmvb|asf|m4a|mp3|wma)',
    play_parse: true,

filter: {
       
  "1": [
    {
      "key": "cateId",
      "name": "类型",
      "value": [
        {"n": "全部", "v": "1"},
        {"n": "剧情片", "v": "6"},
        {"n": "动作片", "v": "7"},
        {"n": "冒险片", "v": "8"},
        {"n": "喜剧片", "v": "9"},
        {"n": "奇幻片", "v": "10"},
        {"n": "恐怖片", "v": "11"},
        {"n": "悬疑片", "v": "16"},
        {"n": "惊悚片", "v": "17"},
        {"n": "灾难片", "v": "18"},
        {"n": "爱情片", "v": "19"},
        {"n": "犯罪片", "v": "20"},
        {"n": "科幻片", "v": "21"},
        {"n": "动画电影", "v": "22"},
        {"n": "战争片", "v": "28"},
        {"n": "经典片", "v": "29"}
      ]
    },
{
  "key": "area",
  "name": "地区",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "大陆", "v": "/area/大陆"},
    {"n": "欧美", "v": "/area/欧美"},
    {"n": "香港", "v": "/area/香港"},
    {"n": "美国", "v": "/area/美国"},
    {"n": "台湾", "v": "/area/台湾"},
    {"n": "日本", "v": "/area/日本"},
    {"n": "韩国", "v": "/area/韩国"},
    {"n": "英国", "v": "/area/英国"},
    {"n": "法国", "v": "/area/法国"},
    {"n": "德国", "v": "/area/德国"},
    {"n": "俄罗斯", "v": "/area/俄罗斯"},
    {"n": "泰国", "v": "/area/泰国"},
    {"n": "印度", "v": "/area/印度"},
    {"n": "加拿大", "v": "/area/加拿大"},
    {"n": "西班牙", "v": "/area/西班牙"},
    {"n": "意大利", "v": "/area/意大利"},
    {"n": "新加坡", "v": "/area/新加坡"}
  ]
},
{
  "key": "lang",
  "name": "语言",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "国语", "v": "/lang/国语"},
    {"n": "粤语", "v": "/lang/粤语"},
    {"n": "英语", "v": "/lang/英语"},
    {"n": "韩语", "v": "/lang/韩语"},
    {"n": "日语", "v": "/lang/日语"},
    {"n": "法语", "v": "/lang/法语"},
    {"n": "德语", "v": "/lang/德语"},
    {"n": "俄语", "v": "/lang/俄语"},
    {"n": "泰语", "v": "/lang/泰语"},
    {"n": "西班牙语", "v": "/lang/西班牙语"},
    {"n": "意大利语", "v": "/lang/意大利语"},
    {"n": "印地语", "v": "/lang/印地语"},
    {"n": "葡萄牙语", "v": "/lang/葡萄牙语"},
    {"n": "土耳其语", "v": "/lang/土耳其语"}
  ]
},
{
  "key": "year",
  "name": "年代",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "2025", "v": "/year/2025"},
    {"n": "2024", "v": "/year/2024"},
    {"n": "2023", "v": "/year/2023"},
    {"n": "2022", "v": "/year/2022"},
    {"n": "2021", "v": "/year/2021"},
    {"n": "2020", "v": "/year/2020"},
    {"n": "2019", "v": "/year/2019"},
    {"n": "2018", "v": "/year/2018"},
    {"n": "2017", "v": "/year/2017"},
    {"n": "2016", "v": "/year/2016"},
    {"n": "2015", "v": "/year/2015"},
    {"n": "2014", "v": "/year/2014"},
    {"n": "2013", "v": "/year/2013"},
    {"n": "2012", "v": "/year/2012"},
    {"n": "2011", "v": "/year/2011"}
  ]
}
  ],


  "2": [
    {
      "key": "cateId",
      "name": "类型",
      "value": [
        {"n": "全部", "v": "2"},
        {"n": "国产剧", "v": "12"},
        {"n": "港剧", "v": "13"},
        {"n": "韩剧", "v": "14"},
        {"n": "日剧", "v": "15"},
        {"n": "泰剧", "v": "23"},
        {"n": "台剧", "v": "24"},
        {"n": "欧美剧", "v": "25"},
        {"n": "新马剧", "v": "26"},
        {"n": "其他剧", "v": "27"}
      ]
    },
{
  "key": "area",
  "name": "地区",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "大陆", "v": "/area/大陆"},
    {"n": "欧美", "v": "/area/欧美"},
    {"n": "香港", "v": "/area/香港"},
    {"n": "美国", "v": "/area/美国"},
    {"n": "台湾", "v": "/area/台湾"},
    {"n": "日本", "v": "/area/日本"},
    {"n": "韩国", "v": "/area/韩国"},
    {"n": "英国", "v": "/area/英国"},
    {"n": "法国", "v": "/area/法国"},
    {"n": "德国", "v": "/area/德国"},
    {"n": "俄罗斯", "v": "/area/俄罗斯"},
    {"n": "泰国", "v": "/area/泰国"},
    {"n": "印度", "v": "/area/印度"},
    {"n": "加拿大", "v": "/area/加拿大"},
    {"n": "西班牙", "v": "/area/西班牙"},
    {"n": "意大利", "v": "/area/意大利"},
    {"n": "新加坡", "v": "/area/新加坡"}
  ]
},
{
  "key": "lang",
  "name": "语言",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "国语", "v": "/lang/国语"},
    {"n": "粤语", "v": "/lang/粤语"},
    {"n": "英语", "v": "/lang/英语"},
    {"n": "韩语", "v": "/lang/韩语"},
    {"n": "日语", "v": "/lang/日语"},
    {"n": "法语", "v": "/lang/法语"},
    {"n": "德语", "v": "/lang/德语"},
    {"n": "俄语", "v": "/lang/俄语"},
    {"n": "泰语", "v": "/lang/泰语"},
    {"n": "西班牙语", "v": "/lang/西班牙语"},
    {"n": "意大利语", "v": "/lang/意大利语"},
    {"n": "印地语", "v": "/lang/印地语"},
    {"n": "葡萄牙语", "v": "/lang/葡萄牙语"},
    {"n": "土耳其语", "v": "/lang/土耳其语"}
  ]
},
{
  "key": "year",
  "name": "年代",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "2025", "v": "/year/2025"},
    {"n": "2024", "v": "/year/2024"},
    {"n": "2023", "v": "/year/2023"},
    {"n": "2022", "v": "/year/2022"},
    {"n": "2021", "v": "/year/2021"},
    {"n": "2020", "v": "/year/2020"},
    {"n": "2019", "v": "/year/2019"},
    {"n": "2018", "v": "/year/2018"},
    {"n": "2017", "v": "/year/2017"},
    {"n": "2016", "v": "/year/2016"},
    {"n": "2015", "v": "/year/2015"},
    {"n": "2014", "v": "/year/2014"},
    {"n": "2013", "v": "/year/2013"},
    {"n": "2012", "v": "/year/2012"},
    {"n": "2011", "v": "/year/2011"}
  ]
}
  ],


  "3": [
    {
      "key": "cateId",
      "name": "类型",
      "value": [
        {"n": "全部", "v": "3"},
        {"n": "总裁短剧", "v": "41"},
        {"n": "神豪短剧", "v": "42"},
        {"n": "穿越重生短剧", "v": "43"},
        {"n": "都市短剧", "v": "44"},
        {"n": "年代短剧", "v": "45"},
        {"n": "长篇剧场", "v": "46"}
      ]
    },
{
  "key": "area",
  "name": "地区",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "大陆", "v": "/area/大陆"},
    {"n": "欧美", "v": "/area/欧美"},
    {"n": "香港", "v": "/area/香港"},
    {"n": "美国", "v": "/area/美国"},
    {"n": "台湾", "v": "/area/台湾"},
    {"n": "日本", "v": "/area/日本"},
    {"n": "韩国", "v": "/area/韩国"},
    {"n": "英国", "v": "/area/英国"},
    {"n": "法国", "v": "/area/法国"},
    {"n": "德国", "v": "/area/德国"},
    {"n": "俄罗斯", "v": "/area/俄罗斯"},
    {"n": "泰国", "v": "/area/泰国"},
    {"n": "印度", "v": "/area/印度"},
    {"n": "加拿大", "v": "/area/加拿大"},
    {"n": "西班牙", "v": "/area/西班牙"},
    {"n": "意大利", "v": "/area/意大利"},
    {"n": "新加坡", "v": "/area/新加坡"}
  ]
},
{
  "key": "lang",
  "name": "语言",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "国语", "v": "/lang/国语"},
    {"n": "粤语", "v": "/lang/粤语"},
    {"n": "英语", "v": "/lang/英语"},
    {"n": "韩语", "v": "/lang/韩语"},
    {"n": "日语", "v": "/lang/日语"},
    {"n": "法语", "v": "/lang/法语"},
    {"n": "德语", "v": "/lang/德语"},
    {"n": "俄语", "v": "/lang/俄语"},
    {"n": "泰语", "v": "/lang/泰语"},
    {"n": "西班牙语", "v": "/lang/西班牙语"},
    {"n": "意大利语", "v": "/lang/意大利语"},
    {"n": "印地语", "v": "/lang/印地语"},
    {"n": "葡萄牙语", "v": "/lang/葡萄牙语"},
    {"n": "土耳其语", "v": "/lang/土耳其语"}
  ]
},
{
  "key": "year",
  "name": "年代",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "2025", "v": "/year/2025"},
    {"n": "2024", "v": "/year/2024"},
    {"n": "2023", "v": "/year/2023"},
    {"n": "2022", "v": "/year/2022"},
    {"n": "2021", "v": "/year/2021"},
    {"n": "2020", "v": "/year/2020"},
    {"n": "2019", "v": "/year/2019"},
    {"n": "2018", "v": "/year/2018"},
    {"n": "2017", "v": "/year/2017"},
    {"n": "2016", "v": "/year/2016"},
    {"n": "2015", "v": "/year/2015"},
    {"n": "2014", "v": "/year/2014"},
    {"n": "2013", "v": "/year/2013"},
    {"n": "2012", "v": "/year/2012"},
    {"n": "2011", "v": "/year/2011"}
  ]
}
  ],


  "4": [
    {
      "key": "cateId",
      "name": "类型",
      "value": [
        {"n": "全部", "v": "4"},
        {"n": "国产动漫", "v": "36"},
        {"n": "日本动漫", "v": "37"},
        {"n": "韩国动漫", "v": "38"},
        {"n": "欧美动漫", "v": "39"},
        {"n": "港台动漫", "v": "40"}
      ]
    },
{
  "key": "area",
  "name": "地区",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "大陆", "v": "/area/大陆"},
    {"n": "欧美", "v": "/area/欧美"},
    {"n": "香港", "v": "/area/香港"},
    {"n": "美国", "v": "/area/美国"},
    {"n": "台湾", "v": "/area/台湾"},
    {"n": "日本", "v": "/area/日本"},
    {"n": "韩国", "v": "/area/韩国"},
    {"n": "英国", "v": "/area/英国"},
    {"n": "法国", "v": "/area/法国"},
    {"n": "德国", "v": "/area/德国"},
    {"n": "俄罗斯", "v": "/area/俄罗斯"},
    {"n": "泰国", "v": "/area/泰国"},
    {"n": "印度", "v": "/area/印度"},
    {"n": "加拿大", "v": "/area/加拿大"},
    {"n": "西班牙", "v": "/area/西班牙"},
    {"n": "意大利", "v": "/area/意大利"},
    {"n": "新加坡", "v": "/area/新加坡"}
  ]
},
{
  "key": "lang",
  "name": "语言",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "国语", "v": "/lang/国语"},
    {"n": "粤语", "v": "/lang/粤语"},
    {"n": "英语", "v": "/lang/英语"},
    {"n": "韩语", "v": "/lang/韩语"},
    {"n": "日语", "v": "/lang/日语"},
    {"n": "法语", "v": "/lang/法语"},
    {"n": "德语", "v": "/lang/德语"},
    {"n": "俄语", "v": "/lang/俄语"},
    {"n": "泰语", "v": "/lang/泰语"},
    {"n": "西班牙语", "v": "/lang/西班牙语"},
    {"n": "意大利语", "v": "/lang/意大利语"},
    {"n": "印地语", "v": "/lang/印地语"},
    {"n": "葡萄牙语", "v": "/lang/葡萄牙语"},
    {"n": "土耳其语", "v": "/lang/土耳其语"}
  ]
},
{
  "key": "year",
  "name": "年代",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "2025", "v": "/year/2025"},
    {"n": "2024", "v": "/year/2024"},
    {"n": "2023", "v": "/year/2023"},
    {"n": "2022", "v": "/year/2022"},
    {"n": "2021", "v": "/year/2021"},
    {"n": "2020", "v": "/year/2020"},
    {"n": "2019", "v": "/year/2019"},
    {"n": "2018", "v": "/year/2018"},
    {"n": "2017", "v": "/year/2017"},
    {"n": "2016", "v": "/year/2016"},
    {"n": "2015", "v": "/year/2015"},
    {"n": "2014", "v": "/year/2014"},
    {"n": "2013", "v": "/year/2013"},
    {"n": "2012", "v": "/year/2012"},
    {"n": "2011", "v": "/year/2011"}
  ]
}
  ],

  "5": [
    {
      "key": "cateId",
      "name": "分类",
      "value": [
        {"n": "全部", "v": "5"},
        {"n": "国产综艺", "v": "30"},
        {"n": "港台综艺", "v": "31"},
        {"n": "韩国综艺", "v": "32"},
        {"n": "日本综艺", "v": "33"},
        {"n": "欧美综艺", "v": "35"}
      ]
    },

{
  "key": "area",
  "name": "地区",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "大陆", "v": "/area/大陆"},
    {"n": "欧美", "v": "/area/欧美"},
    {"n": "香港", "v": "/area/香港"},
    {"n": "美国", "v": "/area/美国"},
    {"n": "台湾", "v": "/area/台湾"},
    {"n": "日本", "v": "/area/日本"},
    {"n": "韩国", "v": "/area/韩国"},
    {"n": "英国", "v": "/area/英国"},
    {"n": "法国", "v": "/area/法国"},
    {"n": "德国", "v": "/area/德国"},
    {"n": "俄罗斯", "v": "/area/俄罗斯"},
    {"n": "泰国", "v": "/area/泰国"},
    {"n": "印度", "v": "/area/印度"},
    {"n": "加拿大", "v": "/area/加拿大"},
    {"n": "西班牙", "v": "/area/西班牙"},
    {"n": "意大利", "v": "/area/意大利"},
    {"n": "新加坡", "v": "/area/新加坡"}
  ]
},
{
  "key": "lang",
  "name": "语言",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "国语", "v": "/lang/国语"},
    {"n": "粤语", "v": "/lang/粤语"},
    {"n": "英语", "v": "/lang/英语"},
    {"n": "韩语", "v": "/lang/韩语"},
    {"n": "日语", "v": "/lang/日语"},
    {"n": "法语", "v": "/lang/法语"},
    {"n": "德语", "v": "/lang/德语"},
    {"n": "俄语", "v": "/lang/俄语"},
    {"n": "泰语", "v": "/lang/泰语"},
    {"n": "西班牙语", "v": "/lang/西班牙语"},
    {"n": "意大利语", "v": "/lang/意大利语"},
    {"n": "印地语", "v": "/lang/印地语"},
    {"n": "葡萄牙语", "v": "/lang/葡萄牙语"},
    {"n": "土耳其语", "v": "/lang/土耳其语"}
  ]
},
{
  "key": "year",
  "name": "年代",
  "value": [
    {"n": "全部", "v": ""},
    {"n": "2025", "v": "/year/2025"},
    {"n": "2024", "v": "/year/2024"},
    {"n": "2023", "v": "/year/2023"},
    {"n": "2022", "v": "/year/2022"},
    {"n": "2021", "v": "/year/2021"},
    {"n": "2020", "v": "/year/2020"},
    {"n": "2019", "v": "/year/2019"},
    {"n": "2018", "v": "/year/2018"},
    {"n": "2017", "v": "/year/2017"},
    {"n": "2016", "v": "/year/2016"},
    {"n": "2015", "v": "/year/2015"},
    {"n": "2014", "v": "/year/2014"},
    {"n": "2013", "v": "/year/2013"},
    {"n": "2012", "v": "/year/2012"},
    {"n": "2011", "v": "/year/2011"}
  ]
}

  ]



    }

    
}