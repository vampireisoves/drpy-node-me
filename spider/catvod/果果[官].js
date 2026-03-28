/**
 * 芒果TV - 猫影视JS爬虫格式（第二个版本）
 * 调用壳子超级解析功能
 @header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '果果[官]',
  lang: 'cat'
  })
 */

class Spider extends BaseSpider {

    constructor() {
        super();
        this.host = 'https://www.mgtv.com';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Referer': 'https://www.mgtv.com/',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        };
    }

    init(extend = '') {
        return '';
    }

    getName() {
        return '芒果TV2';
    }

    isVideoFormat(url) {
        return true;
    }

    manualVideoCheck() {
        return false;
    }

    destroy() {
        // 清理资源
    }

    homeContent(filter) {
        const classes = [
            {type_id: '3', type_name: '电影'},
            {type_id: '2', type_name: '电视剧'},
            {type_id: '1', type_name: '综艺'},
            {type_id: '50', type_name: '动漫'},
            {type_id: '51', type_name: '纪录片'},
            {type_id: '115', type_name: '教育'},
            {type_id: '10', type_name: '少儿'}
        ];

        const filters = {
            '3': [
                {
                    key: 'year', name: '年份', value: [
                        {n: '全部', v: 'all'}, {n: '2025', v: '2025'}, {n: '2024', v: '2024'},
                        {n: '2023', v: '2023'}, {n: '2022', v: '2022'}, {n: '2021', v: '2021'},
                        {n: '2020', v: '2020'}, {n: '2019', v: '2019'}, {n: '2010-2019', v: '2010-2019'},
                        {n: '2000-2009', v: '2000-2009'}
                    ]
                },
                {
                    key: 'sort', name: '排序', value: [
                        {n: '综合', v: 'c1'}, {n: '最新', v: 'c2'}, {n: '最热', v: 'c4'}
                    ]
                }
            ],
            '2': [
                {
                    key: 'year', name: '年份', value: [
                        {n: '全部', v: 'all'}, {n: '2025', v: '2025'}, {n: '2024', v: '2024'},
                        {n: '2023', v: '2023'}, {n: '2022', v: '2022'}, {n: '2021', v: '2021'},
                        {n: '2020', v: '2020'}
                    ]
                },
                {
                    key: 'sort', name: '排序', value: [
                        {n: '综合', v: 'c1'}, {n: '最新', v: 'c2'}, {n: '最热', v: 'c4'}
                    ]
                }
            ],
            '1': [
                {
                    key: 'sort', name: '排序', value: [
                        {n: '综合', v: 'c1'}, {n: '最新', v: 'c2'}, {n: '最热', v: 'c4'}
                    ]
                }
            ],
            '50': [
                {
                    key: 'sort', name: '排序', value: [
                        {n: '综合', v: 'c1'}, {n: '最新', v: 'c2'}, {n: '最热', v: 'c4'}
                    ]
                }
            ]
        };

        return {
            class: classes,
            filters: filters
        };
    }

    homeVideoContent() {
        return {list: []};
    }

    async categoryContent(tid, pg, filter, extend) {
        try {
            const page = parseInt(pg) || 1;
            const baseUrl = 'https://pianku.api.mgtv.com/rider/list/pcweb/v3';

            // 构建查询参数
            const params = {
                platform: 'pcweb',
                channelId: tid,
                pn: page,
                pc: '20',
                hudong: '1',
                _support: '10000000',
                kind: 'a1',
                area: 'a1'
            };

            // 处理筛选条件
            if (extend) {
                if (extend.year && extend.year !== 'all') {
                    params.year = extend.year;
                }
                if (extend.sort) {
                    params.sort = extend.sort;
                }
                if (extend.chargeInfo) {
                    params.chargeInfo = extend.chargeInfo;
                }
            }

            const queryString = new URLSearchParams(params).toString();
            const url = `${baseUrl}?${queryString}`;

            const response = await this.fetch(url, {}, this.headers);
            const json = response.data || {};

            const videos = [];
            if (json.data?.hitDocs && Array.isArray(json.data.hitDocs)) {
                for (const item of json.data.hitDocs) {
                    videos.push({
                        vod_id: item.playPartId || '',
                        vod_name: item.title || '',
                        vod_pic: item.img || '',
                        vod_remarks: item.updateInfo || item.rightCorner?.text || ''
                    });
                }
            }

            return {
                list: videos,
                page: page,
                pagecount: json.data?.totalPage || 999,
                limit: 20,
                total: json.data?.totalHit || 9999
            };

        } catch (error) {
            console.error(`categoryContent error: ${error.message}`);
            return {
                list: [],
                page: pg,
                pagecount: 0,
                limit: 20,
                total: 0
            };
        }
    }

    async detailContent(ids) {
        try {
            const videoId = ids[0];

            // 获取视频基本信息
            const infoUrl = `https://pcweb.api.mgtv.com/video/info?video_id=${videoId}`;
            const infoResponse = await this.fetch(infoUrl, {}, this.headers);
            const infoData = infoResponse.data?.data?.info || {};

            const vod = {
                vod_id: videoId,
                vod_name: infoData.title || '',
                type_name: infoData.root_kind || '',
                vod_actor: '',
                vod_year: infoData.release_time || '',
                vod_content: infoData.desc || '',
                vod_remarks: infoData.time || '',
                vod_pic: infoData.img || '',
                vod_play_from: '芒果TV',
                vod_play_url: ''
            };

            // 分页获取所有剧集
            const pageSize = 50;
            let allEpisodes = [];

            try {
                // 获取第一页，同时获取总页数
                const firstPageUrl = `https://pcweb.api.mgtv.com/episode/list?video_id=${videoId}&page=1&size=${pageSize}`;
                const firstResponse = await this.fetch(firstPageUrl, {}, this.headers);
                const firstData = firstResponse.data?.data || {};

                if (firstData.list && Array.isArray(firstData.list)) {
                    allEpisodes = allEpisodes.concat(firstData.list);
                    const totalPages = firstData.total_page || 1;

                    // 如果有多页，获取剩余页面
                    if (totalPages > 1) {
                        const pagePromises = [];
                        for (let i = 2; i <= totalPages; i++) {
                            const pageUrl = `https://pcweb.api.mgtv.com/episode/list?video_id=${videoId}&page=${i}&size=${pageSize}`;
                            pagePromises.push(this.fetch(pageUrl, {}, this.headers));
                        }

                        const responses = await Promise.all(pagePromises);
                        for (const response of responses) {
                            const data = response.data?.data || {};
                            if (data.list && Array.isArray(data.list)) {
                                allEpisodes = allEpisodes.concat(data.list);
                            }
                        }
                    }
                }
            } catch (episodeError) {
                console.error(`获取剧集列表失败: ${episodeError.message}`);
            }

            // 构建播放列表
            const playUrls = [];
            if (allEpisodes.length > 0) {
                // 过滤可播放的剧集（isIntact = 1）
                const validEpisodes = allEpisodes.filter(item =>
                    item.isIntact === "1" || item.isIntact === 1
                );

                // 按集数排序
                validEpisodes.sort((a, b) => {
                    const orderA = parseInt(a.order) || 0;
                    const orderB = parseInt(b.order) || 0;
                    return orderA - orderB;
                });

                // 构建播放链接
                for (const item of validEpisodes) {
                    const name = item.t4 || item.t3 || item.title || `第${item.order || '?'}集`;
                    const playLink = item.url ? `https://www.mgtv.com${item.url}` : '';

                    if (playLink) {
                        playUrls.push(`${name}$${playLink}`);
                    }
                }
            }

            vod.vod_play_url = playUrls.join('#');

            return {list: [vod]};

        } catch (error) {
            console.error(`detailContent error: ${error.message}`);
            return {list: []};
        }
    }

    async searchContent(key, quick, pg = '1') {
        try {
            const page = parseInt(pg) || 1;
            const searchUrl = `https://mobileso.bz.mgtv.com/msite/search/v2?q=${encodeURIComponent(key)}&pn=${page}&pc=20`;

            const response = await this.fetch(searchUrl, {}, this.headers);
            const json = response.data?.data || {};

            const videos = [];

            if (json.contents && Array.isArray(json.contents)) {
                for (const group of json.contents) {
                    if (group.type === 'media' && group.data && Array.isArray(group.data)) {
                        for (const item of group.data) {
                            if (item.source === 'imgo') {
                                // 提取视频ID
                                const match = item.url.match(/\/(\d+)\.html/);
                                if (match) {
                                    videos.push({
                                        vod_id: match[1],
                                        vod_name: item.title ? item.title.replace(/<B>|<\/B>/g, '') : '',
                                        vod_pic: item.img || '',
                                        vod_remarks: item.desc ? item.desc.join(' ') : ''
                                    });
                                }
                            }
                        }
                    }
                }
            }

            return {
                list: videos,
                page: page,
                pagecount: 10,
                limit: 20,
                total: videos.length
            };

        } catch (error) {
            console.error(`searchContent error: ${error.message}`);
            return {
                list: [],
                page: pg,
                pagecount: 0,
                limit: 20,
                total: 0
            };
        }
    }

    async playerContent(flag, id, vipFlags) {
        try {
            // 调用壳子超级解析
            const playData = {
                parse: 1,
                jx: 1,
                play_parse: true,
                parse_type: '壳子超级解析',
                parse_source: '芒果TV2',
                url: id,
                header: JSON.stringify({
                    'User-Agent': this.headers['User-Agent'],
                    'Referer': 'https://www.mgtv.com',
                    'Origin': 'https://www.mgtv.com'
                })
            };

            return playData;

        } catch (error) {
            console.error(`playerContent error: ${error.message}`);
            return {
                parse: 1,
                jx: 1,
                play_parse: true,
                parse_type: '壳子超级解析',
                parse_source: '芒果TV2',
                url: id,
                header: JSON.stringify(this.headers)
            };
        }
    }

    localProxy(param) {
        return null;
    }
}

export default new Spider();