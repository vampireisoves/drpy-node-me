/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '电影人生',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    title: '电影人生',
    host: 'https://dyrsok.com',
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    url: '/fyclass.html?page=fypage&class=fyfilter',
    filter_url: '{{fl.class}}&area={{fl.area}}&year={{fl.year}}&sort_field={{fl.sort}}',
    searchUrl: '/s.html?name=**',
    class_name: '电影&电视剧&综艺&动漫&短剧',
    class_url: 'dianying&dianshiju&zongyi&dongman&duanju',
    play_parse: true,
    filterable: 1,
    filter: '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',
    lazy: `js:
        var url = input.startsWith('http') ? input : rule.host + input;
        input = { parse: 0, url: url, jx: 0 };
        return input;
    `,
    推荐: '*',
    一级: 'a:has(.lazy-image);a&&title;img&&data-src;div.absolute.text-white&&Text;a&&href',
    二级: async function() {
        var d = [];
        try {
            let { input } = this;
            var html = await request(input);
            var VOD = {};
            var ld_match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
            if (ld_match) {
                var ld = JSON.parse(ld_match[1]);
                VOD.vod_name = ld.name || '';
                VOD.vod_pic = ld.image || '';
                if(ld.director && ld.director.name) VOD.vod_director = ld.director.name;
                if(ld.actor && ld.actor.length) VOD.vod_actor = ld.actor.map(function(it){ return it.name; }).join(',');
                VOD.vod_content = ld.description || '';
                VOD.vod_year = ld.year || '';
                if(ld.genre && ld.genre.length) VOD.type_name = ld.genre.join(',');
            }
            if (!VOD.vod_name) {
                var title_match = html.match(/<meta property="og:title" content="([^"]+)"/);
                if(title_match) VOD.vod_name = title_match[1].split('_')[0];
                var pic_match = html.match(/<meta property="og:image" content="([^"]+)"/);
                if(pic_match) VOD.vod_pic = pic_match[1];
                var desc_match = html.match(/<meta property="og:description" content="([^"]+)"/);
                if(desc_match) VOD.vod_content = desc_match[1];
            }
            var list_match = html.match(/var dyrs_vod_list = JSON\.parse\('([^']+)'\)/);
            if (list_match) {
                var raw_json = list_match[1].replace(/\\u0022/g, '"').replace(/\\\//g, '/');
                var list = JSON.parse(raw_json);
                var origins = [];
                list.forEach(function(it) {
                    if (origins.indexOf(it.origin) === -1) {
                        origins.push(it.origin);
                    }
                });
                VOD.vod_play_from = origins.join('$$$');
                var play_urls = [];
                origins.forEach(function(origin) {
                    var urls = [];
                    list.forEach(function(it) {
                        if (it.origin === origin) {
                            urls.push(it.title + '$' + it.url);
                        }
                    });
                    play_urls.push(urls.join('#'));
                });
                VOD.vod_play_url = play_urls.join('$$$');
            }
            return VOD;
        } catch(e) {
            log('二级解析报错:' + e.message);
        }
        return {};
    },
    搜索: '*',
};
