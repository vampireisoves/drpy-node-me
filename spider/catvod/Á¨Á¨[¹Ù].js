/**
 * 哔哩哔哩 - 猫影视JS爬虫格式
 * 调用壳子超级解析功能
 @header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '哩哩[官]',
  lang: 'cat'
  })
 */

class Spider extends BaseSpider {

    constructor() {
        super();
        this.host = 'https://www.bilibili.com';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.bilibili.com',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        };

        // B站Cookie（需要登录才能获取高清画质）
        this.cookie = "";
        this.isLoggedIn = () => {
            return this.cookie && this.cookie.includes("SESSDATA=");
        };
    }

    init(extend = '') {
        return '';
    }

    getName() {
        return '哔哩哔哩';
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
            {type_id: '1', type_name: '番剧'},
            {type_id: '4', type_name: '国创'},
            {type_id: '2', type_name: '电影'},
            {type_id: '5', type_name: '电视剧'},
            {type_id: '3', type_name: '纪录片'},
            {type_id: '7', type_name: '综艺'}
        ];

        return {
            class: classes
        };
    }

    homeVideoContent() {
        return {list: []};
    }

    async categoryContent(tid, pg, filter, extend) {
        try {
            const page = parseInt(pg) || 1;
            let url = '';

            if (['1', '4'].includes(tid)) {
                url = `https://api.bilibili.com/pgc/web/rank/list?season_type=${tid}&pagesize=20&page=${page}&day=3`;
            } else {
                url = `https://api.bilibili.com/pgc/season/rank/web/list?season_type=${tid}&pagesize=20&page=${page}&day=3`;
            }

            const headers = {...this.headers};
            if (this.cookie) {
                headers.Cookie = this.cookie;
            }

            const response = await this.fetch(url, {}, headers);
            const data = response.data || {};

            const videos = [];
            if (data.code === 0) {
                const vodList = data.result ? data.result.list : (data.data ? data.data.list : []);

                for (const vod of vodList) {
                    const title = vod.title ? vod.title.trim() : '';
                    if (title.includes('预告')) {
                        continue;
                    }

                    const remark = vod.new_ep ? vod.new_ep.index_show : vod.index_show;

                    // 处理封面图片
                    let cover = vod.cover || '';
                    if (cover && cover.startsWith('//')) {
                        cover = 'https:' + cover;
                    }

                    videos.push({
                        vod_id: vod.season_id ? vod.season_id.toString() : '',
                        vod_name: title,
                        vod_pic: cover,
                        vod_remarks: remark || ''
                    });
                }
            }

            return {
                list: videos,
                page: page,
                pagecount: videos.length === 20 ? page + 1 : page,
                limit: 20,
                total: 9999
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

    formatCount(num) {
        if (num > 1e8) return (num / 1e8).toFixed(2) + '亿';
        if (num > 1e4) return (num / 1e4).toFixed(2) + '万';
        return num.toString();
    }

    async detailContent(ids) {
        try {
            const seasonId = ids[0];

            const headers = {...this.headers};
            if (this.cookie) {
                headers.Cookie = this.cookie;
            }

            const url = `https://api.bilibili.com/pgc/view/web/season?season_id=${seasonId}`;
            const response = await this.fetch(url, {}, headers);
            const data = response.data || {};

            if (data.code !== 0) {
                return {list: []};
            }

            const res = data.result;
            const stat = res.stat || {};

            // 处理封面图片
            let cover = res.cover || '';
            if (cover && cover.startsWith('//')) {
                cover = 'https:' + cover;
            }

            const vod = {
                vod_id: res.season_id ? res.season_id.toString() : '',
                vod_name: res.title || '',
                vod_pic: cover,
                type_name: res.share_sub_title || res.type_name || '',
                vod_year: res.publish && res.publish.pub_time ? res.publish.pub_time.substr(0, 4) : '',
                vod_area: res.areas && res.areas.length > 0 ? res.areas[0].name : '',
                vod_actor: `点赞:${this.formatCount(stat.likes || 0)} 投币:${this.formatCount(stat.coins || 0)}`,
                vod_content: res.evaluate || res.new_ep?.desc || '',
                vod_director: res.rating ? `评分:${res.rating.score}` : '暂无评分',
                vod_play_from: '哔哩哔哩',
                vod_play_url: ''
            };

            // 过滤预告片，构建播放列表
            const episodes = (res.episodes || []).filter(ep => !ep.title.includes('预告'));
            const playUrls = [];

            for (const ep of episodes) {
                const title = `${ep.title.replace(/#/g, '-')} ${ep.long_title || ''}`;
                const playId = `${res.season_id}_${ep.id}_${ep.cid}`;
                playUrls.push(`${title}$${playId}`);
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
            const encodedKeyword = encodeURIComponent(key);
            const searchTypes = ['media_bangumi', 'media_ft'];

            const headers = {...this.headers};
            if (this.cookie) {
                headers.Cookie = this.cookie;
            }

            const allVideos = [];

            for (const type of searchTypes) {
                try {
                    const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=${type}&keyword=${encodedKeyword}&page=${page}`;
                    const response = await this.fetch(url, {}, headers);
                    const data = response.data || {};

                    if (data.code === 0 && data.data && data.data.result) {
                        for (const vod of data.data.result) {
                            const title = vod.title ? vod.title.replace(/<[^>]+>/g, '') : '';
                            if (title.includes('预告')) {
                                continue;
                            }

                            // 处理封面图片
                            let cover = vod.cover || '';
                            if (cover && cover.startsWith('//')) {
                                cover = 'https:' + cover;
                            }

                            allVideos.push({
                                vod_id: vod.season_id ? vod.season_id.toString() : '',
                                vod_name: title,
                                vod_pic: cover,
                                vod_remarks: vod.index_show || ''
                            });
                        }
                    }
                } catch (searchError) {
                    console.error(`搜索类型 ${type} 失败: ${searchError.message}`);
                }
            }

            return {
                list: allVideos,
                page: page,
                pagecount: allVideos.length > 0 ? page + 1 : page,
                limit: 20,
                total: allVideos.length
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
            // 哔哩哔哩有自己的解析逻辑，直接返回播放链接
            // 格式：seasonId_epId_cid
            const parts = id.split('_');
            if (parts.length < 3) {
                throw new Error('无效的播放ID格式');
            }

            const seasonId = parts[0];
            const epId = parts[1];
            const cid = parts[2];

            // 构建播放链接（原版B站链接）
            const playUrl = `https://www.bilibili.com/bangumi/play/ep${epId}`;

            // 调用壳子超级解析
            const playData = {
                parse: 1,
                jx: 1,
                play_parse: true,
                parse_type: '壳子超级解析',
                parse_source: '哔哩哔哩',
                url: playUrl,
                header: JSON.stringify({
                    'User-Agent': this.headers['User-Agent'],
                    'Referer': 'https://www.bilibili.com',
                    'Origin': 'https://www.bilibili.com',
                    'Cookie': this.cookie || ''
                })
            };

            return playData;

        } catch (error) {
            console.error(`playerContent error: ${error.message}`);
            // 即使出错也返回超级解析参数
            return {
                parse: 1,
                jx: 1,
                play_parse: true,
                parse_type: '壳子超级解析',
                parse_source: '哔哩哔哩',
                url: id.includes('_') ? `https://www.bilibili.com/bangumi/play/ep${id.split('_')[1]}` : id,
                header: JSON.stringify(this.headers)
            };
        }
    }

    localProxy(param) {
        return null;
    }
}


export default new Spider();