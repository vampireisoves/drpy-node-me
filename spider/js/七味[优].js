/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '七味',
  '类型': '影视',
  lang: 'ds'
})
*/

$.require('./_lib.request.js')
var rule = {
    title: '七味',
    host: 'https://www.pcmp4.com',
    hosts: [
        'https://www.pcmp4.com',
        'https://www.qwnull.com',
        'https://www.qwmkv.com',
        'https://www.qwfilm.com',
        'https://www.qnmp4.com',
        'https://www.qnnull.com',
        'https://www.qnhot.com'
    ],
    currentHostIndex: 0,
    homeUrl: '/',
    url: '/ms/--------.html?page={pg}',
    searchUrl: '/vs/-------------.html?wd=**',
    searchable: 2,
    quickSearch: 1,
    filterable: 1,
    timeout: 5000,
    play_parse: true,
    limit: 20,
    headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},
    class_name: '电影&剧集&综艺&动漫&短剧',
    class_url: '1&2&3&4&30',
    filter: {
        "1": [{"key":"type","name":"类型","value":[{"n":"全部","v":""},{"n":"剧情","v":"剧情"},{"n":"科幻","v":"科幻"},{"n":"动作","v":"动作"},{"n":"喜剧","v":"喜剧"},{"n":"爱情","v":"爱情"},{"n":"冒险","v":"冒险"},{"n":"儿童","v":"儿童"},{"n":"歌舞","v":"歌舞"},{"n":"音乐","v":"音乐"},{"n":"奇幻","v":"奇幻"},{"n":"动画","v":"动画"},{"n":"恐怖","v":"恐怖"},{"n":"惊悚","v":"惊悚"},{"n":"丧尸","v":"丧尸"},{"n":"战争","v":"战争"},{"n":"传记","v":"传记"},{"n":"纪录","v":"纪录"},{"n":"犯罪","v":"犯罪"},{"n":"悬疑","v":"悬疑"},{"n":"西部","v":"西部"},{"n":"灾难","v":"灾难"},{"n":"古装","v":"古装"},{"n":"武侠","v":"武侠"},{"n":"家庭","v":"家庭"},{"n":"短片","v":"短片"},{"n":"校园","v":"校园"},{"n":"文艺","v":"文艺"},{"n":"运动","v":"运动"},{"n":"青春","v":"青春"},{"n":"同性","v":"同性"},{"n":"励志","v":"励志"},{"n":"人性","v":"人性"},{"n":"美食","v":"美食"},{"n":"女性","v":"女性"},{"n":"治愈","v":"治愈"},{"n":"历史","v":"历史"},{"n":"其他","v":"其他"}]},{"key":"year","name":"年代","value":[{"n":"全部","v":""},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2013","v":"2013"},{"n":"2012","v":"2012"},{"n":"2011","v":"2011"},{"n":"2010","v":"2010"}]},{"key":"area","name":"地区","value":[{"n":"全部","v":""},{"n":"大陆","v":"大陆"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},{"n":"日本","v":"日本"},{"n":"韩国","v":"韩国"},{"n":"泰国","v":"泰国"},{"n":"美国","v":"美国"},{"n":"英国","v":"英国"},{"n":"法国","v":"法国"},{"n":"德国","v":"德国"},{"n":"印度","v":"印度"},{"n":"丹麦","v":"丹麦"},{"n":"瑞典","v":"瑞典"},{"n":"荷兰","v":"荷兰"},{"n":"加拿大","v":"加拿大"},{"n":"俄罗斯","v":"俄罗斯"},{"n":"意大利","v":"意大利"},{"n":"比利时","v":"比利时"},{"n":"西班牙","v":"西班牙"},{"n":"澳大利亚","v":"澳大利亚"},{"n":"其他","v":"其他"}]},{"key":"lang","name":"语言","value":[{"n":"全部","v":""},{"n":"国语","v":"国语"},{"n":"粤语","v":"粤语"},{"n":"英语","v":"英语"},{"n":"法语","v":"法语"},{"n":"日语","v":"日语"},{"n":"韩语","v":"韩语"},{"n":"泰语","v":"泰语"},{"n":"德语","v":"德语"},{"n":"俄语","v":"俄语"},{"n":"闽南语","v":"闽南语"},{"n":"丹麦语","v":"丹麦语"},{"n":"波兰语","v":"波兰语"},{"n":"瑞典语","v":"瑞典语"},{"n":"印地语","v":"印地语"},{"n":"挪威语","v":"挪威语"},{"n":"意大利语","v":"意大利语"},{"n":"西班牙语","v":"西班牙语"},{"n":"无对白","v":"无对白"},{"n":"其他","v":"其他"}]},{"key":"sort","name":"排序","value":[{"n":"按时间","v":"time"},{"n":"按人气","v":"hits"},{"n":"按评分","v":"score"}]}],
        "2": [{"key":"type","name":"类型","value":[{"n":"全部","v":""},{"n":"剧情","v":"剧情"},{"n":"科幻","v":"科幻"},{"n":"动作","v":"动作"},{"n":"喜剧","v":"喜剧"},{"n":"爱情","v":"爱情"},{"n":"冒险","v":"冒险"},{"n":"儿童","v":"儿童"},{"n":"歌舞","v":"歌舞"},{"n":"音乐","v":"音乐"},{"n":"奇幻","v":"奇幻"},{"n":"动画","v":"动画"},{"n":"恐怖","v":"恐怖"},{"n":"惊悚","v":"惊悚"},{"n":"丧尸","v":"丧尸"},{"n":"战争","v":"战争"},{"n":"传记","v":"传记"},{"n":"纪录","v":"纪录"},{"n":"犯罪","v":"犯罪"},{"n":"悬疑","v":"悬疑"},{"n":"西部","v":"西部"},{"n":"灾难","v":"灾难"},{"n":"古装","v":"古装"},{"n":"武侠","v":"武侠"},{"n":"家庭","v":"家庭"},{"n":"短片","v":"短片"},{"n":"校园","v":"校园"},{"n":"文艺","v":"文艺"},{"n":"运动","v":"运动"},{"n":"青春","v":"青春"},{"n":"同性","v":"同性"},{"n":"励志","v":"励志"},{"n":"人性","v":"人性"},{"n":"美食","v":"美食"},{"n":"女性","v":"女性"},{"n":"治愈","v":"治愈"},{"n":"历史","v":"历史"},{"n":"其他","v":"其他"}]},{"key":"year","name":"年代","value":[{"n":"全部","v":""},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2013","v":"2013"},{"n":"2012","v":"2012"},{"n":"2011","v":"2011"},{"n":"2010","v":"2010"}]},{"key":"area","name":"地区","value":[{"n":"全部","v":""},{"n":"大陆","v":"大陆"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},{"n":"日本","v":"日本"},{"n":"韩国","v":"韩国"},{"n":"泰国","v":"泰国"},{"n":"美国","v":"美国"},{"n":"英国","v":"英国"},{"n":"法国","v":"法国"},{"n":"德国","v":"德国"},{"n":"印度","v":"印度"},{"n":"丹麦","v":"丹麦"},{"n":"瑞典","v":"瑞典"},{"n":"荷兰","v":"荷兰"},{"n":"加拿大","v":"加拿大"},{"n":"俄罗斯","v":"俄罗斯"},{"n":"意大利","v":"意大利"},{"n":"比利时","v":"比利时"},{"n":"西班牙","v":"西班牙"},{"n":"澳大利亚","v":"澳大利亚"},{"n":"其他","v":"其他"}]},{"key":"lang","name":"语言","value":[{"n":"全部","v":""},{"n":"国语","v":"国语"},{"n":"粤语","v":"粤语"},{"n":"英语","v":"英语"},{"n":"法语","v":"法语"},{"n":"日语","v":"日语"},{"n":"韩语","v":"韩语"},{"n":"泰语","v":"泰语"},{"n":"德语","v":"德语"},{"n":"俄语","v":"俄语"},{"n":"闽南语","v":"闽南语"},{"n":"丹麦语","v":"丹麦语"},{"n":"波兰语","v":"波兰语"},{"n":"瑞典语","v":"瑞典语"},{"n":"印地语","v":"印地语"},{"n":"挪威语","v":"挪威语"},{"n":"意大利语","v":"意大利语"},{"n":"西班牙语","v":"西班牙语"},{"n":"无对白","v":"无对白"},{"n":"其他","v":"其他"}]},{"key":"sort","name":"排序","value":[{"n":"按时间","v":"time"},{"n":"按人气","v":"hits"},{"n":"按评分","v":"score"}]}],
        "3": [{"key":"type","name":"类型","value":[{"n":"全部","v":""},{"n":"真人秀","v":"真人秀"},{"n":"脱口秀","v":"脱口秀"},{"n":"选秀","v":"选秀"},{"n":"情感","v":"情感"},{"n":"喜剧","v":"喜剧"},{"n":"访谈","v":"访谈"},{"n":"播报","v":"播报"},{"n":"旅游","v":"旅游"},{"n":"音乐","v":"音乐"},{"n":"美食","v":"美食"},{"n":"纪实","v":"纪实"},{"n":"曲艺","v":"曲艺"},{"n":"生活","v":"生活"},{"n":"游戏","v":"游戏"},{"n":"财经","v":"财经"},{"n":"求职","v":"求职"},{"n":"体育","v":"体育"},{"n":"MV","v":"MV"},{"n":"纪录","v":"纪录"}]},{"key":"year","name":"年代","value":[{"n":"全部","v":""},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2013","v":"2013"},{"n":"2012","v":"2012"},{"n":"2011","v":"2011"},{"n":"2010","v":"2010"}]},{"key":"area","name":"地区","value":[{"n":"全部","v":""},{"n":"大陆","v":"大陆"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},{"n":"日本","v":"日本"},{"n":"韩国","v":"韩国"},{"n":"泰国","v":"泰国"},{"n":"美国","v":"美国"},{"n":"英国","v":"英国"},{"n":"法国","v":"法国"},{"n":"德国","v":"德国"},{"n":"印度","v":"印度"},{"n":"丹麦","v":"丹麦"},{"n":"瑞典","v":"瑞典"},{"n":"荷兰","v":"荷兰"},{"n":"加拿大","v":"加拿大"},{"n":"俄罗斯","v":"俄罗斯"},{"n":"意大利","v":"意大利"},{"n":"比利时","v":"比利时"},{"n":"西班牙","v":"西班牙"},{"n":"澳大利亚","v":"澳大利亚"},{"n":"其他","v":"其他"}]},{"key":"lang","name":"语言","value":[{"n":"全部","v":""},{"n":"国语","v":"国语"},{"n":"粤语","v":"粤语"},{"n":"英语","v":"英语"},{"n":"法语","v":"法语"},{"n":"日语","v":"日语"},{"n":"韩语","v":"韩语"},{"n":"泰语","v":"泰语"},{"n":"德语","v":"德语"},{"n":"俄罗斯","v":"俄罗斯"},{"n":"闽南语","v":"闽南语"},{"n":"丹麦语","v":"丹麦语"},{"n":"波兰语","v":"波兰语"},{"n":"瑞典语","v":"瑞典语"},{"n":"印地语","v":"印地语"},{"n":"挪威语","v":"挪威语"},{"n":"意大利语","v":"意大利语"},{"n":"西班牙语","v":"西班牙语"},{"n":"无对白","v":"无对白"},{"n":"其他","v":"其他"}]},{"key":"sort","name":"排序","value":[{"n":"按时间","v":"time"},{"n":"按人气","v":"hits"},{"n":"按评分","v":"score"}]}],
        "4": [{"key":"type","name":"类型","value":[{"n":"全部","v":""},{"n":"剧情","v":"剧情"},{"n":"萌系","v":"萌系"},{"n":"科幻","v":"科幻"},{"n":"日常","v":"日常"},{"n":"战斗","v":"战斗"},{"n":"战争","v":"战争"},{"n":"热血","v":"热血"},{"n":"机战","v":"机战"},{"n":"游戏","v":"游戏"},{"n":"搞笑","v":"搞笑"},{"n":"恋爱","v":"恋爱"},{"n":"后宫","v":"后宫"},{"n":"百合","v":"百合"},{"n":"基腐","v":"基腐"},{"n":"冒险","v":"冒险"},{"n":"儿童","v":"儿童"},{"n":"歌舞","v":"歌舞"},{"n":"音乐","v":"音乐"},{"n":"奇幻","v":"奇幻"},{"n":"恐怖","v":"恐怖"},{"n":"惊悚","v":"惊悚"},{"n":"犯罪","v":"犯罪"},{"n":"悬疑","v":"悬疑"},{"n":"西部","v":"西部"},{"n":"灾难","v":"灾难"},{"n":"古装","v":"古装"},{"n":"武侠","v":"武侠"},{"n":"泡面","v":"泡面"},{"n":"校园","v":"校园"},{"n":"运动","v":"运动"},{"n":"体育","v":"体育"},{"n":"青春","v":"青春"},{"n":"美食","v":"美食"},{"n":"治愈","v":"治愈"},{"n":"致郁","v":"致郁"},{"n":"励志","v":"励志"},{"n":"历史","v":"历史"},{"n":"其他","v":"其他"}]},{"key":"year","name":"年代","value":[{"n":"全部","v":""},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2013","v":"2013"},{"n":"2012","v":"2012"},{"n":"2011","v":"2011"},{"n":"2010","v":"2010"}]},{"key":"area","name":"地区","value":[{"n":"全部","v":""},{"n":"美国","v":"美国"},{"n":"英国","v":"英国"},{"n":"法国","v":"法国"},{"n":"大陆","v":"大陆"},{"n":"日本","v":"日本"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},{"n":"韩国","v":"韩国"},{"n":"泰国","v":"泰国"},{"n":"德国","v":"德国"},{"n":"印度","v":"印度"},{"n":"丹麦","v":"丹麦"},{"n":"瑞典","v":"瑞典"},{"n":"荷兰","v":"荷兰"},{"n":"加拿大","v":"加拿大"},{"n":"俄罗斯","v":"俄罗斯"},{"n":"意大利","v":"意大利"},{"n":"比利时","v":"比利时"},{"n":"西班牙","v":"西班牙"},{"n":"澳大利亚","v":"澳大利亚"},{"n":"其他","v":"其他"}]},{"key":"lang","name":"语言","value":[{"n":"全部","v":""},{"n":"国语","v":"国语"},{"n":"粤语","v":"粤语"},{"n":"英语","v":"英语"},{"n":"法语","v":"法语"},{"n":"日语","v":"日语"},{"n":"韩语","v":"韩语"},{"n":"泰语","v":"泰语"},{"n":"德语","v":"德语"},{"n":"俄罗斯","v":"俄罗斯"},{"n":"闽南语","v":"闽南语"},{"n":"丹麦语","v":"丹麦语"},{"n":"波兰语","v":"波兰语"},{"n":"瑞典语","v":"瑞典语"},{"n":"印地语","v":"印地语"},{"n":"挪威语","v":"挪威语"},{"n":"意大利语","v":"意大利语"},{"n":"西班牙语","v":"西班牙语"},{"n":"无对白","v":"无对白"},{"n":"其他","v":"其他"}]},{"key":"sort","name":"排序","value":[{"n":"按时间","v":"time"},{"n":"按人气","v":"hits"},{"n":"按评分","v":"score"}]}],
        "30": [{"key":"type","name":"类型","value":[{"n":"全部","v":""},{"n":"短剧","v":"短剧"},{"n":"古装","v":"古装"},{"n":"复仇","v":"复仇"},{"n":"强者","v":"强者"},{"n":"悬疑","v":"悬疑"},{"n":"甜宠","v":"甜宠"},{"n":"神豪","v":"神豪"},{"n":"穿越","v":"穿越"},{"n":"虐恋","v":"虐恋"},{"n":"逆袭","v":"逆袭"},{"n":"重生","v":"重生"},{"n":"萌宝","v":"萌宝"}]},{"key":"year","name":"年代","value":[{"n":"全部","v":""},{"n":"2026","v":"2026"},{"n":"2025","v":"2025"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2013","v":"2013"},{"n":"2012","v":"2012"},{"n":"2011","v":"2011"},{"n":"2010","v":"2010"}]},{"key":"area","name":"地区","value":[{"n":"全部","v":""},{"n":"大陆","v":"大陆"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},{"n":"日本","v":"日本"},{"n":"韩国","v":"韩国"},{"n":"泰国","v":"泰国"},{"n":"美国","v":"美国"},{"n":"英国","v":"英国"},{"n":"法国","v":"法国"},{"n":"德国","v":"德国"},{"n":"印度","v":"印度"},{"n":"丹麦","v":"丹麦"},{"n":"瑞典","v":"瑞典"},{"n":"荷兰","v":"荷兰"},{"n":"加拿大","v":"加拿大"},{"n":"俄罗斯","v":"俄罗斯"},{"n":"意大利","v":"意大利"},{"n":"比利时","v":"比利时"},{"n":"西班牙","v":"西班牙"},{"n":"澳大利亚","v":"澳大利亚"},{"n":"其他","v":"其他"}]},{"key":"lang","name":"语言","value":[{"n":"全部","v":""},{"n":"国语","v":"国语"},{"n":"粤语","v":"粤语"},{"n":"英语","v":"英语"},{"n":"法语","v":"法语"},{"n":"日语","v":"日语"},{"n":"韩语","v":"韩语"},{"n":"泰语","v":"泰语"},{"n":"德国","v":"德国"},{"n":"俄罗斯","v":"俄罗斯"},{"n":"闽南语","v":"闽南语"},{"n":"丹麦语","v":"丹麦语"},{"n":"波兰语","v":"波兰语"},{"n":"瑞典语","v":"瑞典语"},{"n":"印地语","v":"印地语"},{"n":"挪威语","v":"挪威语"},{"n":"意大利语","v":"意大利语"},{"n":"西班牙语","v":"西班牙语"},{"n":"无对白","v":"无对白"},{"n":"其他","v":"其他"}]},{"key":"sort","name":"排序","value":[{"n":"按时间","v":"time"},{"n":"按人气","v":"hits"},{"n":"按评分","v":"score"}]}]
    },
    
    init: async function() {
        return true;
    },

    推荐: async function(tid, pg, filter, extend) {
        try {
            let html = await request(this.getCurrentHost(), {headers: this.headers});
            let data = this.pdfa(html, '.content-list&&li');
            return setResult(data.map(it => this.parsePosterItem(it)));
        } catch (e) {
            return setResult([]);
        }
    },
    
    get_category_url: function(tid, pg, filter, extend) {
        let extendObj = {};
        if (typeof extend === 'object') {
            extendObj = extend;
        } else if (typeof extend === 'string' && extend) {
            try {
                extendObj = JSON.parse(extend);
            } catch (e) {}
        }
        const filters = {...filter, ...extendObj};
        let area = filters.area || '';
        let sort = filters.sort || 'time';
        let type = filters.type || '';
        let lang = filters.lang || '';
        let year = filters.year || '';
        return `/ms/${tid}-${area}-${sort}-${type}-${lang}-------${year}.html?page=${pg || 1}`;
    },
    
    一级: async function(tid, pg, filter, extend) {
        try {
            let tid = arguments[0] || '1';
            let pg = arguments[1] || '1';
            let filter = arguments[2] || {};
            let extend = arguments[3] || {};
            let url = this.get_category_url(tid, pg, filter, extend);
            if (!url.startsWith('http')) url = this.getCurrentHost() + url;
            let html = await request(url, {headers: this.headers});
            let data = this.pdfa(html, '.content-list&&li') || 
                      this.pdfa(html, '.content-list ul li') || 
                      this.pdfa(html, 'ul li') || 
                      this.pdfa(html, 'li') || 
                      [];
            return setResult(data.map(it => this.parsePosterItem(it)).filter(it => it.title));
        } catch (e) {
            return setResult([]);
        }
    },
    
    二级: async function(ids) {
        try {
            let videoId = (this.input.match(/\/mv\/(\d+)\.html/) || [])[1];
            if (!videoId) throw new Error('无效的视频ID');
            let html = await request(this.input, {headers: this.headers});
            let VOD = this.parseVodDetail(html, videoId);
            let finalVOD = await this.parsePlayLines(html, videoId, VOD);
            return finalVOD;
        } catch (e) {
            return {
                vod_name: '加载失败',
                type_name: '',
                vod_pic: '',
                vod_content: `加载失败: ${e.message}`,
                vod_remarks: '请检查网络连接或配置是否正确',
                vod_play_from: '默认线路',
                vod_play_url: '正片$$0|0|0'
            };
        }
    },
    
    搜索: async function (wd, quick, pg) {
        try {
            let keyword = this.input;
            if (keyword.includes('vs/') && keyword.includes('wd=')) {
                const url = new URL(keyword);
                keyword = url.searchParams.get('wd') || '';
                keyword = decodeURIComponent(keyword);
            }
            keyword = keyword.toLowerCase().trim();
            if (!keyword) {
                return setResult([]);
            }
            let matchedResults = [];
            let homeHtml = await request(this.getCurrentHost(), {headers: this.headers});
            let homeData = [];
            const contentListData = this.pdfa(homeHtml, '.content-list&&li') || [];
            homeData = [...homeData, ...contentListData];
            const contentListNthData = this.pdfa(homeHtml, '.content-list-nth&&li') || [];
            homeData = [...homeData, ...contentListNthData];
            const ulData = this.pdfa(homeHtml, 'ul li') || [];
            homeData = [...homeData, ...ulData];
            let homeItems = homeData.map(it => this.parsePosterItem(it)).filter(it => it.title);
            const seenTitles = new Set();
            homeItems = homeItems.filter(item => {
                if (seenTitles.has(item.title)) return false;
                seenTitles.add(item.title);
                return true;
            });
            matchedResults = homeItems.filter(item => {
                const itemTitleLower = item.title.toLowerCase();
                return itemTitleLower === keyword || itemTitleLower.includes(keyword);
            });
            return setResult(matchedResults);
        } catch (e) {
            return setResult([]);
        }
    },
    
    lazy: async function(flag, id, flags) {
        try {
            if (id.startsWith('magnet:')) {
                return {parse: 0, url: id, header: this.getDefaultHeaders()};
            }
            if (this.isValidPanUrl(id)) {
                return {
                    parse: 0,
                    url: 'push://' + id,
                    header: rule.headers,
                    jx: 0
                };
            }
            const ids = id.split('|');
            if (ids.length === 3) {
                const [videoId, lineIndex, episodeIndex] = ids;
                const lineNumber = parseInt(lineIndex) + 1;
                const episodeNumber = parseInt(episodeIndex) + 1;
                const playUrl = `${this.getCurrentHost()}/py/${videoId}-${lineNumber}-${episodeNumber}.html`;
                return {parse: 1, url: playUrl, header: this.getDefaultHeaders()};
            }
            return {parse: 1, url: this.input, header: this.getDefaultHeaders()};
        } catch (error) {
            return {parse: 1, url: this.input, header: this.getDefaultHeaders()};
        }
    },
    getCurrentHost: function() {
        return this.hosts[this.currentHostIndex];
    },
    nextHost: function() {
        this.currentHostIndex = (this.currentHostIndex + 1) % this.hosts.length;
        return this.getCurrentHost();
    },
    parsePosterItem: function(it) {
        const title = this.pdfh(it, 'h3 a&&Text') || 
                     this.pdfh(it, 'h3 a&&title') || 
                     this.pdfh(it, '.title a&&Text') || 
                     this.pdfh(it, '.title a&&title') || 
                     this.pdfh(it, '.li-img a&&title') || 
                     this.pdfh(it, 'a&&title') || 
                     '';
        const desc = this.pdfh(it, '.tag&&Text') || 
                    this.pdfh(it, '.label&&Text') || 
                    this.pdfh(it, '.remark&&Text') || 
                    '';
        const img = this.pd(it, '.li-img img&&src') || 
                   this.pd(it, 'img&&src') || 
                   '';
        const url = this.pd(it, 'h3 a&&href') || 
                   this.pd(it, '.title a&&href') || 
                   this.pd(it, '.li-img a&&href') || 
                   this.pd(it, 'a&&href') || 
                   '';
        return {title, desc, img: this.normalizeUrl(img), url: this.normalizeUrl(url)};
    },
    parseVodDetail: function(html, videoId) {
        const typeMatch = html.match(/<div><span>类型：<\/span>[\s\S]*?<\/div>/) || [];
        let type_name = '';
        if (typeMatch[0]) {
            const typeLinks = typeMatch[0].match(/<a[^>]*>([^<]+)<\/a>/g) || [];
            const typeValues = [...new Set(typeLinks.map(link => link.match(/<a[^>]*>([^<]+)<\/a>/)[1]))];
            type_name = typeValues.join('/') || '';
        }
        const areaMatch = html.match(/<div><span>地区：<\/span>[\s\S]*?<\/div>/) || [];
        let vod_area = '';
        if (areaMatch[0]) {
            const areaLinks = areaMatch[0].match(/<a[^>]*>([^<]+)<\/a>/g) || [];
            const areaValues = [...new Set(areaLinks.map(link => link.match(/<a[^>]*>([^<]+)<\/a>/)[1]))];
            vod_area = areaValues.join('/') || '';
        }
        return {
            vod_name: (this.pdfh(html, '.main-ui-meta h1&&Text') || '').replace(/\s*\(\d{4}\)$/, '') || this.pdfh(html, '.detail-title&&Text') || '',
            type_name: type_name || this.pdfh(html, '.main-ui-meta div:nth-child(9) a&&Text') || '',
            vod_pic: this.pd(html, '.img img&&src') || '',
            vod_content: (() => {
                const showContent = (this.pdfh(html, '.movie-introduce .zkjj_a&&Text') || '').replace(/\s*\[展开全部\]/g, '').trim();
                const hideContent = (this.pdfh(html, '.movie-introduce .sqjj_a&&Text') || '').replace(/\s*\[收起部分\]/g, '').trim();
                const fullContent = hideContent || showContent || this.pdfh(html, '.detail-content&&Text') || '';
                return fullContent.trim();
            })(),
            vod_remarks: this.pdfh(html, '.otherbox&&Text') || '',
            vod_year: (this.pdfh(html, '.main-ui-meta h1 span.year&&Text') || '').replace(/[()]/g, '') || '',
            vod_area: vod_area || this.pdfh(html, '.main-ui-meta div:nth-child(11) a&&Text') || '',
            vod_actor: (this.pdfh(html, '.main-ui-meta div.text-overflow&&Text') || '').replace(/^主演：/, '') || '',
            vod_director: (function(html) {
                const directorDiv = html.match(/<div>[\s\S]*?导演：[\s\S]*?<\/div>/) || [];
                if (directorDiv[0]) {
                    const directorMatch = directorDiv[0].match(/<a[^>]*>([^<]+)<\/a>/);
                    return directorMatch ? directorMatch[1] : '';
                }
                return '';
            })(html) || '',
            vod_play_from: '',
            vod_play_url: ''
        };
    },
    parsePlayLines: async function(html, videoId, VOD) {
        try {
            let playFrom = [];
            let playUrl = [];
            const lineItems = this.pdfa(html, '.py-tabs li') || [];
            const episodeContainers = this.pdfa(html, '.bd ul.player') || [];
            for (let i = 0; i < Math.min(lineItems.length, episodeContainers.length); i++) {
                const lineItem = lineItems[i];
                if (!lineItem) continue;
                let lineName = lineItem.replace(/<li[^>]*>/, '').replace(/<\/li>/, '').replace(/<div[^>]*>.*?<\/div>/g, '').replace(/<[^>]+>/g, '').trim().replace(/\s+/g, '') || `线路${i + 1}`;
                playFrom.push(lineName);
                const episodeItems = this.pdfa(episodeContainers[i], 'a') || [];
                let episodeList = episodeItems.map((epItem, j) => `${this.pdfh(epItem, 'Text') || ''}$${videoId}|${i}|${j}`);
                episodeList.length === 0 && episodeList.push(`正片$${videoId}|${i}|0`);
                playUrl.push(episodeList.join('#'));
            }
            const magnetLinks = [...new Set(html.match(/magnet:\?[^&"'\s]+/g) || [])];
            if (magnetLinks.length > 0) {
                playFrom.push('磁力下载');
                playUrl.push(magnetLinks.map((magnet, index) => `磁力${index + 1}$${magnet}`).join('#'));
            }
            let panLinksByType = {};
        const panRegex = /https?:\/\/(pan\.baidu\.com|pan\.quark\.cn|drive\.uc\.cn|cloud\.189\.cn|yun\.139\.com|alipan\.com|pan\.aliyun\.com|115\.com|115cdn\.com)\/[^"'\s>]+/g;
        const allPanLinks = [...new Set([
            ...(html.match(panRegex) || []),
            ...(this.pdfa(html, 'a') || []).flatMap(link => {
                const links = [];
                const href = this.pd(link, '&&href') || '';
                href && this.isValidPanUrl(href) && links.push(href);
                const dataClipboard = this.pd(link, '&&data-clipboard-text') || '';
                if (dataClipboard) {
                    this.isValidPanUrl(dataClipboard) && links.push(dataClipboard);
                }
                return links;
            })
        ])];
            
            allPanLinks.forEach(link => {
                if (link && !link.startsWith('magnet:')) {
                    const panType = this.getPanTypeFromUrl(link);
                    if (panType && panType !== '其他') {
                        panLinksByType[panType] = panLinksByType[panType] || [];
                        panLinksByType[panType].push(link);
                    }
                }
            });
            Object.entries(panLinksByType).forEach(([panType, links]) => {
                playFrom.push(`${panType}网盘`);
                playUrl.push(links.map((link, index) => `${panType}网盘${index + 1}$${link}`).join('#'));
            });
            playFrom.length === 0 && (playFrom = ['默认线路'], playUrl = [`正片$${videoId}|0|0`]);
            VOD.vod_play_from = playFrom.join('$$$');
            VOD.vod_play_url = playUrl.join('$$$');
            return VOD;
        } catch (e) {
            return {...VOD, vod_play_from: '默认线路', vod_play_url: `正片$${videoId}|0|0`};
        }
    },
    
    getPanTypeFromUrl: function(url) {
        if (!url) return '其他';
        const panTypes = {'pan.baidu.com': '百度', 'pan.baiduimg.com': '百度', 'pan.quark.cn': '夸克', 'drive.uc.cn': 'UC', 'cloud.189.cn': '天翼', 'yun.139.com': '移动', 'alipan.com': '阿里', 'pan.aliyun.com': '阿里', '115.com': '115', '115cdn.com': '115', 'magnet:': '磁力'};
        return Object.entries(panTypes).find(([domain]) => url.includes(domain))?.[1] || '其他';
    },
    
    isValidPanUrl: function(url) {
        if (!url) return false;
        return ['pan.baidu.com', 'pan.baiduimg.com', 'pan.quark.cn', 'drive.uc.cn', 'cloud.189.cn', 'yun.139.com', 'alipan.com', 'pan.aliyun.com', '115.com', '115cdn.com', 'magnet:'].some(domain => url.includes(domain));
    },
    normalizeUrl: function(url) {
        if (!url) return url;
        if (url.startsWith('//')) return 'https:' + url;
        if (url.startsWith('/')) return this.getCurrentHost() + url;
        return url;
    },
    getDefaultHeaders: function() {
        return {...this.headers, "Referer": this.getCurrentHost()};
    }
};