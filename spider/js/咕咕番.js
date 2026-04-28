/*
* @File     : spider/js/咕咕番.js
* @Author   : ChatGPT
* @Date     : 2026-04-19
* @Comments : 咕咕番 - 在线日漫
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '咕咕番',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    类型: '影视',
    title: '咕咕番',
    host: 'https://www.gugu3.com',
    homeUrl: '/index.php/vod/show/id/6.html',
    url: '/index.php/vod/show/id/fyclass/page/fypage.html',
    searchUrl: '/index.php/vod/search/page/fypage/wd/**.html',

    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': MOBILE_UA,
        'Referer': 'https://www.gugu3.com/'
    },
    timeout: 8000,
    class_name: '番剧&剧场版&特摄',
    class_url: '6&21&23',
    detailUrl: '/index.php/vod/detail/id/fyid.html',
    play_parse: true,
    lazy: '',
    limit: 6,
    double: false,
    推荐: async function () {
        let { HOST } = this;
        let data = {
            type: '6',
            class: '',
            area: '',
            year: '',
            lang: '',
            version: '',
            state: '',
            letter: '',
            time: '',
            level: '0',
            weekday: '',
            by: 'time',
            page: '1'
        };
        let html = await post(HOST + '/index.php/ds_api/vod', {
            headers: rule.headers,
            data: data
        });
        let json = JSON.parse(html);
        let list = (json.list || []).slice(0, 12);
        return list.map(it => ({
            vod_name: it.vod_name,
            vod_pic: it.vod_pic,
            vod_remarks: it.vod_remarks || it.vod_douban_score || '',
            vod_id: it.url || ('/index.php/vod/detail/id/' + it.vod_id + '.html')
        }));
    },
    一级: async function () {
        let { HOST, MY_CATE, MY_PAGE } = this;
        let data = {
            type: MY_CATE || '6',
            class: '',
            area: '',
            year: '',
            lang: '',
            version: '',
            state: '',
            letter: '',
            time: '',
            level: '0',
            weekday: '',
            by: 'time',
            page: MY_PAGE || '1'
        };
        let html = await post(HOST + '/index.php/ds_api/vod', {
            headers: rule.headers,
            data: data
        });
        let json = JSON.parse(html);
        let list = json.list || [];
        return list.map(it => ({
            vod_name: it.vod_name,
            vod_pic: it.vod_pic,
            vod_remarks: it.vod_remarks || it.vod_douban_score || '',
            vod_id: it.url || ('/index.php/vod/detail/id/' + it.vod_id + '.html')
        }));
    },
    二级: {
        title: '.slide-info-title&&Text;.detail-info .partition:eq(2)&&Text',
        img: '.detail-pic img&&data-src',
        desc: '.slide-info-remarks:eq(0)&&Text;.slide-info-remarks:eq(1)&&Text;.slide-info-remarks:eq(2)&&Text;.detail-info .partition:eq(1)&&Text;.detail-info .partition:eq(0)&&Text',
        content: '#height_limit&&Text',
        tabs: '.anthology-tab .swiper-slide',
        tab_text: 'body&&Text',
        lists: '.anthology-list-box:eq(#id) .anthology-list-play li',
        list_text: 'a&&Text',
        list_url: 'a&&href'
    },
    搜索: '.search-list;.slide-info-title&&Text;.detail-pic img&&data-src;.slide-info-remarks:eq(0)&&Text;a&&href'
};
