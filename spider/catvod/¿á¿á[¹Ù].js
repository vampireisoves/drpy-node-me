/**
 * 优酷视频 - 猫影视/TVBox JS爬虫格式
 * 调用壳子超级解析功能（壳子会自动读取json配置）
 @header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '酷酷[官]',
  lang: 'cat'
  })
 */

class Spider extends BaseSpider {

    constructor() {
        super();
        this.host = 'https://www.youku.com';
        this.sessionStore = {};

        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.youku.com',
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
        return '优酷视频';
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
        const categories = '电视剧&电影&综艺&动漫&少儿&纪录片&文化&亲子&教育&搞笑&生活&体育&音乐&游戏'.split('&');

        const result = {
            class: categories.map(name => ({
                type_id: name,
                type_name: name
            }))
        };

        return result;
    }

    homeVideoContent() {
        return {list: []};
    }

    async categoryContent(tid, pg, filter, extend) {
        try {
            const page = parseInt(pg) || 1;
            let filterObj = {};

            if (extend && typeof extend === 'object') {
                filterObj = extend;
            }

            filterObj.type = tid;
            const paramsStr = JSON.stringify(filterObj);

            let url = `https://www.youku.com/category/data?optionRefresh=1&pageNo=${page}&params=${encodeURIComponent(paramsStr)}`;

            // 处理session
            if (page > 1 && this.sessionStore[tid]) {
                url = url.replace("optionRefresh=1", `session=${encodeURIComponent(this.sessionStore[tid])}`);
            }

            const response = await this.fetch(url, {}, this.headers);
            const resData = response.data;

            if (resData.data && resData.data.filterData && resData.data.filterData.session) {
                this.sessionStore[tid] = JSON.stringify(resData.data.filterData.session);
            }

            const videos = [];
            if (resData.data && resData.data.filterData && Array.isArray(resData.data.filterData.listData)) {
                const lists = resData.data.filterData.listData;
                for (const it of lists) {
                    let vid = "";
                    if (it.videoLink && it.videoLink.includes("id_")) {
                        vid = it.videoLink.split("id_")[1].split(".html")[0];
                    } else {
                        vid = "msearch:" + it.title;
                    }

                    videos.push({
                        vod_id: vid,
                        vod_name: it.title || '',
                        vod_pic: it.img || '',
                        vod_remarks: it.summary || '',
                        vod_content: it.subTitle || ''
                    });
                }
            }

            return {
                list: videos,
                page: page,
                pagecount: 9999,
                limit: 20,
                total: 999999
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

    safeFixYoukuInitialData(rawStr) {
        if (!rawStr) return '{}';
        let s = rawStr
            .replace(/^[\s\S]*?window\.__INITIAL_DATA__\s*[=:]\s*/, '')
            .replace(/;[\s\S]*$/, '')
            .replace(/\.{3,}[\s\S]*$/, '')
            .replace(/,\s*$/, '')
            .trim();

        if (!s || s.length < 2 || !/^\{/.test(s)) {
            return '{}';
        }

        let open = 0, close = 0;
        for (let char of s) {
            if (char === '{') open++;
            if (char === '}') close++;
        }

        if (open > close) {
            s += '}'.repeat(open - close);
        }
        if (!s.startsWith('{')) {
            s = '{' + s;
        }
        if (!s.endsWith('}')) {
            s += '}';
        }

        return s;
    }

    getSafe(obj, path, defaultValue = '') {
        if (!obj || typeof obj !== 'object') return defaultValue;
        try {
            return path.split('.').reduce((o, key) => {
                if (o == null) return defaultValue;
                return o[key];
            }, obj) ?? defaultValue;
        } catch {
            return defaultValue;
        }
    }

    async detailContent(ids) {
        try {
            const id = ids[0];

            // 获取剧集列表
            const apiUrl = `https://search.youku.com/api/search?appScene=show_episode&showIds=${id}`;
            const apiResponse = await this.fetch(apiUrl, {}, this.headers);
            const jsonData = apiResponse.data;
            const videoLists = jsonData.serisesList || [];

            // 构建播放列表
            const playUrls = [];
            if (videoLists.length > 0) {
                for (const item of videoLists) {
                    const title = item.showVideoStage?.replace("期", "集") ||
                        item.displayName ||
                        item.title ||
                        `第${item.index || '?'}集`;
                    const url = `https://v.youku.com/v_show/id_${item.videoId}.html`;
                    playUrls.push(`${title}$${url}`);
                }
            }

            // 获取详情信息
            let detailInfo = {
                title: '',
                cover: '',
                category: '',
                remarks: '',
                desc: ''
            };

            try {
                const detailUrl = `https://v.youku.com/v_show/id_${id}.html`;
                const htmlResponse = await this.fetch(detailUrl, {
                    headers: {
                        ...this.headers,
                        'Referer': 'https://v.youku.com/'
                    }
                });
                const html = htmlResponse.data;

                // 检查是否触发人机验证
                if (html.includes("人机验证") || html.includes("captcha") || html.includes("verify")) {
                    detailInfo.desc = "触发优酷人机验证,建议在浏览器中访问优酷官网解除限制后再重试";
                } else if (html.includes("window.__INITIAL_DATA__ =")) {
                    let dataStr = html.split("window.__INITIAL_DATA__ =")[1]?.split(";")?.[0]?.trim() || '{}';
                    dataStr = this.safeFixYoukuInitialData(dataStr);

                    try {
                        const detailJson = JSON.parse(dataStr);
                        const item = this.getSafe(detailJson, 'moduleList.0.components.0.itemList.0', {});
                        const extra = this.getSafe(detailJson, 'pageMap.extra', {});

                        detailInfo.title = item.introTitle || extra.showName || videoLists[0]?.title || '';
                        detailInfo.cover = item.showImgV || extra.showImgV || extra.showImg || '';
                        detailInfo.category = item.showGenre || extra.videoCategory || '';
                        detailInfo.remarks = item.introSubTitle || extra.showSubtitle || item.mark?.text || '';
                    } catch (parseErr) {
                        console.error(`JSON解析失败: ${parseErr.message}`);
                    }
                } else {
                    detailInfo.title = videoLists[0]?.title?.split(" ")[0] || '';
                }
            } catch (detailError) {
                console.error(`获取详情失败: ${detailError.message}`);
            }

            const vod = {
                vod_id: id,
                vod_name: detailInfo.title || videoLists[0]?.title || '未知标题',
                type_name: detailInfo.category || '',
                vod_year: '',
                vod_remarks: detailInfo.remarks || '',
                vod_content: detailInfo.desc || (detailInfo.remarks ? `简介: ${detailInfo.remarks}` : '暂无简介'),
                vod_play_from: playUrls.length > 0 ? '优酷视频' : '',
                vod_play_url: playUrls.length > 0 ? playUrls.join('#') : ''
            };

            return {list: [vod]};

        } catch (error) {
            console.error(`detailContent error: ${error.message}`);
            return {list: []};
        }
    }

    async searchContent(key, quick, pg = '1') {
        try {
            const page = parseInt(pg) || 1;
            const url = `https://search.youku.com/api/search?pg=${page}&keyword=${encodeURIComponent(key)}`;

            const response = await this.fetch(url, {}, this.headers);
            const data = response.data;

            const videos = [];

            if (data && Array.isArray(data.pageComponentList)) {
                for (const item of data.pageComponentList) {
                    if (item.commonData) {
                        const common = item.commonData;
                        let vid = common.showId || '';

                        if (!vid && common.titleDTO && common.titleDTO.displayName) {
                            vid = `msearch:${common.titleDTO.displayName}`;
                        }

                        videos.push({
                            vod_id: vid,
                            vod_name: common.titleDTO?.displayName || '',
                            vod_pic: common.posterDTO?.vThumbUrl || '',
                            vod_remarks: common.stripeBottom || '',
                            vod_content: common.updateNotice || ''
                        });
                    }
                }
            }

            return {
                list: videos,
                page: page,
                pagecount: 9999,
                limit: 20,
                total: 999999
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
            // 关键：调用壳子超级解析
            // 壳子会自动读取json配置中的解析规则
            const playData = {
                parse: 1,           // 必须为1，表示需要解析
                jx: 1,              // 必须为1，启用解析
                play_parse: true,   // 启用播放解析
                parse_type: '壳子超级解析',
                parse_source: '优酷视频',
                url: id,            // 原始优酷链接
                header: JSON.stringify({
                    'User-Agent': this.headers['User-Agent'],
                    'Referer': 'https://www.youku.com',
                    'Origin': 'https://www.youku.com'
                })
            };

            return playData;

        } catch (error) {
            console.error(`playerContent error: ${error.message}`);
            // 即使出错也返回超级解析参数，让壳子处理
            return {
                parse: 1,
                jx: 1,
                play_parse: true,
                parse_type: '壳子超级解析',
                parse_source: '优酷视频',
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