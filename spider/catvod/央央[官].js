/**
 * 央视大全 - 猫影视/TVBox JS爬虫格式
 * 继承BaseSpider类
 @header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '央央[官]',
  lang: 'cat'
  })
 */

class Spider extends BaseSpider {

    constructor() {
        super();
        this.host = 'https://api.cntv.cn';
        this.siteName = '央视大全';
        this.sessionStore = {};
        this.videoCache = {};

        this.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://tv.cctv.com",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        };
    }

    init(extend = "") {
        return "";
    }

    getName() {
        return this.siteName;
    }

    isVideoFormat(url) {
        return url.includes('.m3u8') || url.includes('.mp4');
    }

    manualVideoCheck() {
        return false;
    }

    destroy() {
        this.sessionStore = {};
        this.videoCache = {};
    }

    homeContent(filter) {
        const categories = [
            {type_id: "栏目大全", type_name: "栏目大全"},
            {type_id: "特别节目", type_name: "特别节目"},
            {type_id: "纪录片", type_name: "纪录片"},
            {type_id: "电视剧", type_name: "电视剧"},
            {type_id: "动画片", type_name: "动画片"}
        ];

        return {class: categories};
    }

    async homeVideoContent() {
        // 央视首页推荐
        return {list: []};
    }

    async categoryContent(tid, pg, filter, extend) {
        try {
            const page = parseInt(pg) || 1;
            const videos = [];

            const channelMap = {
                "特别节目": "CHAL1460955953877151",
                "纪录片": "CHAL1460955924871139",
                "电视剧": "CHAL1460955853485115",
                "动画片": "CHAL1460955899450127",
            };

            let filterObj = {};
            if (extend && typeof extend === 'object') {
                filterObj = extend;
            }

            if (tid === '栏目大全') {
                const url = `${this.host}/lanmu/columnSearch?&fl=&fc=&cid=&p=${page}&n=20&serviceId=tvcctv&t=json`;
                const response = await this.fetch(url, {}, this.headers);
                const data = response.data;

                if (data && data.response && data.response.docs) {
                    const docs = data.response.docs;
                    docs.forEach(it => {
                        videos.push({
                            vod_id: `${it.lastVIDE.videoSharedCode}|${it.column_firstclass}|${it.column_name}|${it.channel_name}|${it.column_brief}|${it.column_logo}|${it.lastVIDE.videoTitle}|栏目大全`,
                            vod_name: it.column_name,
                            vod_pic: it.column_logo,
                            vod_remarks: it.channel_name,
                            vod_content: ''
                        });
                    });
                }
            } else {
                // 处理筛选参数
                let fl_url = `&channelid=${channelMap[tid] || ''}&fc=${encodeURIComponent(tid)}`;
                if (filterObj.channel) fl_url += `&channel=${encodeURIComponent(filterObj.channel)}`;
                if (filterObj.sc) fl_url += `&sc=${encodeURIComponent(filterObj.sc)}`;
                if (filterObj.year) fl_url += `&year=${filterObj.year}`;

                const url = `${this.host}/list/getVideoAlbumList?${fl_url}&area=&letter=&n=24&serviceId=tvcctv&t=json&p=${page}`;
                const response = await this.fetch(url, {}, this.headers);
                const data = response.data;

                if (data && data.data && data.data.list) {
                    const dataList = data.data.list;
                    dataList.forEach(it => {
                        videos.push({
                            vod_id: `${it.id}|${it.sc}|${it.title}|${it.channel}|${it.brief}|${it.image}|${it.count}|${tid}`,
                            vod_name: it.title,
                            vod_pic: it.image,
                            vod_remarks: `${it.sc}${it.year ? '·' + it.year : ''}`,
                            vod_content: it.brief || ''
                        });
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

    async detailContent(ids) {
        try {
            const id = ids[0];
            if (!id) return {list: []};

            // 检查缓存
            const cacheKey = `detail_${id}`;
            if (this.videoCache[cacheKey]) {
                return {list: [this.videoCache[cacheKey]]};
            }

            const info = id.split("|");
            // ID 结构: 0:id, 1:sc, 2:title, 3:channel, 4:brief, 5:image, 6:count/remark, 7:cate

            const cate = info[7];
            const ctid = info[0];
            const modeMap = {
                "特别节目": "0",
                "纪录片": "0",
                "电视剧": "0",
                "动画片": "1"
            };

            // 获取选集列表
            let playUrls = [];
            const mode = modeMap[cate] || '0';
            const albumUrl = `${this.host}/NewVideo/getVideoListByAlbumIdNew?id=${ctid}&serviceId=tvcctv&p=1&n=100&mode=${mode}&pub=1`;

            const response = await this.fetch(albumUrl, {}, this.headers);
            const data = response.data;

            if (data.errcode === '1001') {
                // 需要获取真实的ctid
                const videoInfoUrl = `${this.host}/video/videoinfoByGuid?guid=${ctid}&serviceId=tvcctv`;
                const vInfoRes = await this.fetch(videoInfoUrl, {}, this.headers);
                const vInfoData = vInfoRes.data;
                const realCtid = vInfoData.ctid;

                const columnUrl = `${this.host}/NewVideo/getVideoListByColumn?id=${realCtid}&d=&p=1&n=100&sort=desc&mode=0&serviceId=tvcctv&t=json`;
                const colRes = await this.fetch(columnUrl, {}, this.headers);
                const colData = colRes.data;
                playUrls = colData.data?.list || [];
            } else {
                playUrls = data.data?.list || [];
            }

            // 构建播放列表
            const playList = [];
            if (playUrls.length > 0) {
                for (const item of playUrls) {
                    const title = item.title || `第${item.index || '?'}集`;
                    const cleanTitle = title.replace(/\$/g, '');
                    const guid = item.guid || '';
                    playList.push(`${cleanTitle}$${guid}`);
                }
            }

            const vod = {
                vod_id: id,
                vod_name: info[2] || '',
                vod_pic: info[5] || '',
                type_name: info[1] || '',
                vod_year: '',
                vod_area: '',
                vod_remarks: info[6] ? `共${info[6]}集` : '',
                vod_actor: '',
                vod_director: '',
                vod_content: info[4] || '',
                vod_play_from: playList.length > 0 ? '央视频' : '',
                vod_play_url: playList.length > 0 ? playList.join('#') : ''
            };

            // 缓存结果
            this.videoCache[cacheKey] = vod;

            return {list: [vod]};

        } catch (error) {
            console.error(`detailContent error: ${error.message}`);
            return {list: []};
        }
    }

    async searchContent(key, quick, pg = "1") {
        // CCTV搜索接口较复杂，这里返回空结果
        return {
            list: [],
            page: pg,
            pagecount: 0,
            limit: 20,
            total: 0
        };
    }

    async playerContent(flag, id, vipFlags) {
        try {
            // 央视视频采用直接播放的方式
            // 根据GUID拼接m3u8地址
            let playUrl = `https://cntv.playdreamer.cn/proxy/asp/hls/2000/0303000a/3/default/${id}/2000.m3u8`;

            // 也可以尝试其他格式
            // playUrl = `https://hls.cntv.myalicdn.com/asp/hls/2000/0303000a/3/default/${id}/2000.m3u8`;

            return {
                parse: 0,  // 0表示直接播放，不需要解析
                jx: 0,     // 0表示不解析
                url: playUrl,
                header: JSON.stringify({
                    'User-Agent': this.headers['User-Agent'],
                    'Referer': 'https://tv.cctv.com',
                    'Origin': 'https://tv.cctv.com'
                })
            };

        } catch (error) {
            console.error(`playerContent error: ${error.message}`);
            return {
                parse: 0,
                jx: 0,
                url: id,
                header: JSON.stringify(this.headers)
            };
        }
    }

    localProxy(param) {
        return null;
    }

    // 辅助方法：安全获取对象属性
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
}

export default new Spider();