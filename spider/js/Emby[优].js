/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 1,
  title: 'Emby',
  '类型': '影视',
  lang: 'ds'
})
*/

const config = {
    host: '',
    userId: '',
    token: '',
    deviceId: '',
    clientVersion: '',
    pageSize: 30
};

// 设备配置：核心属性单独换行，短数组合并，格式清晰
const deviceProfile = {
    DeviceProfile: {
        MaxStaticBitrate: 140000000,
        MaxStreamingBitrate: 140000000,
        DirectPlayProfiles: [
            {
                Container: 'mp4,mkv,webm',
                Type: 'Video',
                VideoCodec: 'h264,h265,av1,vp9',
                AudioCodec: 'aac,mp3,opus,flac'
            },
            {Container: 'mp3,aac,flac,opus', Type: 'Audio'}
        ],
        TranscodingProfiles: [
            {
                Container: 'mp4',
                Type: 'Video',
                VideoCodec: 'h264',
                AudioCodec: 'aac',
                Context: 'Streaming',
                Protocol: 'http'
            },
            {Container: 'aac', Type: 'Audio', Context: 'Streaming', Protocol: 'http'}
        ],
        SubtitleProfiles: [{Format: 'srt,ass,vtt', Method: 'External'}],
        CodecProfiles: [{
            Type: 'Video',
            Codec: 'h264',
            ApplyConditions: [{Condition: 'LessThanEqual', Property: 'VideoLevel', Value: '62'}]
        }],
        BreakOnNonKeyFrames: true
    }
};

// 提取重复常量：解决硬编码冗余，修改仅需改1处
const BASE_FIELDS = 'BasicSyncInfo,CanDelete,Container,PrimaryImageAspectRatio,ProductionYear,Status,EndDate';
const IMAGE_TYPES = 'Primary,Backdrop,Thumb,Banner';

// 请求头生成：属性分行，结构清晰
function getHeaders(extra = {}) {
    return {
        'X-Emby-Client': 'Emby Web',
        'X-Emby-Device-Name': 'Android WebView Android',
        'X-Emby-Device-Id': config.deviceId,
        'X-Emby-Client-Version': config.clientVersion,
        'X-Emby-Token': config.token,
        ...extra
    };
}

// 图片URL生成：三元运算符分行，可读性强
function getImageUrl(itemId, imageTag) {
    return imageTag
        ? `${config.host}/emby/Items/${itemId}/Images/Primary?maxWidth=400&tag=${imageTag}&quality=90`
        : '';
}

// 视频数据提取：逻辑块分行，变量单独声明
function extractVideos(jsonData) {
    return (jsonData?.Items || []).map(function (item) {
        const isFolder = ['Folder', 'BoxSet', 'CollectionFolder'].includes(item.Type);

        return {
            title: item.Name || '',
            img: getImageUrl(item.Id, item.ImageTags?.Primary),
            desc: item.ProductionYear?.toString() || '',
            url: item.Id,
            vod_tag: isFolder ? 'folder' : 'video'
        };
    });
}

// API请求：参数分行，逻辑清晰
async function fetchApi(url, options = {}) {
    return await request(url, {
        ...options,
        headers: getHeaders(options.headers || {})
    });
}

var rule = {
    title: 'Emby',
    host: config.host,
    headers: getHeaders(),
    searchable: 2,
    quickSearch: 1,
    timeout: 15000,
    play_parse: true,
    searchUrl: `/emby/Users/${config.userId}/Items?` +
        `SortBy=SortName&SortOrder=Ascending&Fields=${BASE_FIELDS}&` +
        `StartIndex=0&EnableImageTypes=${IMAGE_TYPES}&ImageTypeLimit=1&` +
        `Recursive=true&SearchTerm=**&GroupProgramsBySeries=true&Limit=50&X-Emby-Token=${config.token}`,
    预处理: async function () {
        // log('rule.params:', rule.params);
        let parts = JSON.parse(rule.params);
        if (parts) {
            if (parts.host) config.host = parts.host;
            if (parts.userId) config.userId = parts.userId;
            if (parts.token) config.token = parts.token;
            if (parts.deviceId) config.deviceId = parts.deviceId;
            if (parts.clientVersion) config.clientVersion = parts.clientVersion;
            // pageSize 保留原默认值，不覆盖
        }
    },
    // 播放解析：按步骤拆分，每个逻辑块空行分隔
    lazy: async function () {
        // 提取视频ID
        const videoId = typeof this.input === "string"
            ? (this.input.match(/\/Items\/(\w+)/)?.[1] || this.input)
            : this.input;

        // 请求播放信息
        const json = JSON.parse(await fetchApi(
            `${config.host}/emby/Items/${videoId}/PlaybackInfo`,
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(deviceProfile)
            }
        ));

        // 媒体源判断：短路求值简化逻辑，避免嵌套
        const mediaSource = json?.MediaSources?.[0];
        if (!mediaSource) {
            return {
                parse: 1,
                url: `${config.host}/emby/Items/${videoId}/PlaybackInfo`,
                header: getHeaders({"Content-Type": "application/json"}),
                msg: "没有可用的媒体源"
            };
        }

        // 构建播放URL
        const playUrl = `${config.host}/emby/videos/${videoId}/stream?` +
            `Static=true&MediaSourceId=${mediaSource.Id}&DeviceId=${config.deviceId}&` +
            `api_key=${config.token}&PlaySessionId=${json.PlaySessionId || ''}`;

        return {parse: 0, jx: 0, url: playUrl, header: getHeaders()};
    },

    // 分类解析：逻辑块分行，过滤/映射单独换行
    class_parse: async function () {
        const json = JSON.parse(await fetchApi(`${config.host}/emby/Users/${config.userId}/Views`));

        const classList = (json?.Items || []).filter(function (it) {
            return !it.Name.includes("播放列表") && !it.Name.includes("相机");
        }).map(function (it) {
            return {type_id: it.Id, type_name: it.Name};
        });

        return {class: classList, filters: {}, list: []};
    },

    // 推荐：URL拆分，请求-解析-返回逻辑清晰
    推荐: async function (tid, pg, filter, extend) {
        const url = `${config.host}/emby/Users/${config.userId}/Items?` +
            `SortBy=DateCreated&SortOrder=Descending&IncludeItemTypes=Movie,Series,Folder&` +
            `Recursive=true&Limit=40&Fields=${BASE_FIELDS},CommunityRating,CriticRating,Path,Overview,IsFolder&` +
            `EnableImageTypes=${IMAGE_TYPES}&ImageTypeLimit=1`;

        const json = JSON.parse(await fetchApi(url));
        return setResult(extractVideos(json));
    },

    // 一级分类：关键变量单独声明，URL按参数组拆分
    一级: async function (tid, pg, filter, extend) {
        const startIndex = (pg - 1) * config.pageSize;

        const url = `${config.host}/emby/Users/${config.userId}/Items?` +
            `SortBy=DateLastContentAdded,SortName&SortOrder=Descending&` +
            `IncludeItemTypes=Movie,Series,Folder&Recursive=true&` +
            `Fields=${BASE_FIELDS},CommunityRating,CriticRating,Path,Overview,IsFolder&` +
            `StartIndex=${startIndex}&ParentId=${tid}&EnableImageTypes=${IMAGE_TYPES}&` +
            `ImageTypeLimit=1&Limit=${config.pageSize}&EnableUserData=true`;

        const json = JSON.parse(await fetchApi(url));
        return setResult(extractVideos(json));
    },

// 二级详情：按功能模块拆分，每个模块空行分隔
    二级: async function (ids) {
        // 1. 获取基础信息
        const detailUrl = `${config.host}/emby/Users/${config.userId}/Items/${ids}?` +
            `Fields=${BASE_FIELDS},CommunityRating,CriticRating,Path,Overview,People,Studios,RunTimeTicks,MediaStreams`;
        const info = JSON.parse(await fetchApi(detailUrl));

        // 2. 解构提取核心数据：简化变量声明，避免多层if
        const {People = [], Studios = [], MediaStreams = [], RunTimeTicks} = info;
        const director = People.filter(function (p) {
            return p.Type === "Director" || (p.Role && p.Role.includes("Director"));
        }).map(function (p) {
            return p.Name;
        }).join(" / ");

        const actor = People.filter(function (p) {
            return p.Type === "Actor" || (p.Role && p.Role.includes("Actor"));
        }).map(function (p) {
            return p.Name;
        }).join(" / ");

        const area = Studios.map(function (s) {
            return s.Name;
        }).join(" / ");
        const language = Array.from(new Set(
            MediaStreams.filter(function (s) {
                return s.Type === "Audio" && s.Language;
            })
                .map(function (s) {
                    return s.Language;
                })
        )).join(" / ");

        // 3. 时长计算：逻辑单独成块，变量命名清晰
        let duration = "";
        if (RunTimeTicks) {
            const mins = Math.floor(RunTimeTicks / 600000000);
            const hours = Math.floor(mins / 60);
            duration = hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
        }

        // 4. 构建基础VOD信息：属性分行，结构清晰
        const VOD = {
            type_name: (info.Genres || []).join(" "),
            vod_name: info.Name || "",
            vod_pic: getImageUrl(info.Id, info.ImageTags?.Primary),
            vod_remarks: `评分：${info.CommunityRating || "N/A"}`,
            vod_content: info.Overview || "",
            vod_year: info.ProductionYear?.toString() || "",
            vod_director: director,
            vod_actor: actor,
            vod_area: area,
            vod_lang: language,
            vod_time: duration
        };

        // 5. 剧集特殊处理：循环内逻辑分行，避免堆砌
        if (info.Type === "Series") {
            const seasonsUrl = `${config.host}/emby/Shows/${ids}/Seasons?` +
                `UserId=${config.userId}&Fields=${BASE_FIELDS},Path,Overview&EnableTotalRecordCount=false`;
            const seasons = (JSON.parse(await fetchApi(seasonsUrl))).Items || [];

            const from = [], result = [];
            for (let i = 0; i < seasons.length; i++) {
                const season = seasons[i];
                from.push(season.Name);

                const episodesUrl = `${config.host}/emby/Shows/${ids}/Episodes?` +
                    `SeasonId=${season.Id}&ImageTypeLimit=1&UserId=${config.userId}&` +
                    `Fields=Overview,PrimaryImageAspectRatio&Limit=1000`;
                const episodes = (JSON.parse(await fetchApi(episodesUrl))).Items || [];

                // 仅新增：添加第几集的序号显示
                result.push(episodes.map(function (item) {
                    // 获取集序号，兜底处理
                    const episodeNum = item.IndexNumber ? `第${item.IndexNumber}集` : "未知集数";
                    // 拼接序号和原名称
                    const fullName = item.Name ? `${episodeNum} ${item.Name}` : episodeNum;
                    return `${fullName}$${item.Id}`;
                }).join("#"));
            }

            VOD.vod_play_from = from.join("$$$");
            VOD.vod_play_url = result.join("$$$");
        } else {
            VOD.vod_play_from = "EMBY";
            VOD.vod_play_url = `${info.Name || "播放"}$${ids}`;
        }

        return VOD;
    },
    // 搜索：URL拆分，逻辑简洁清晰
    搜索: async function (wd, quick, pg = 1) {
        const url = `${config.host}/emby/Users/${config.userId}/Items?` +
            `SortBy=SortName&SortOrder=Ascending&Fields=${BASE_FIELDS}&` +
            `StartIndex=0&EnableImageTypes=${IMAGE_TYPES}&ImageTypeLimit=1&` +
            `Recursive=true&SearchTerm=${encodeURIComponent(wd)}&` +
            `GroupProgramsBySeries=true&Limit=50`;

        const json = JSON.parse(await fetchApi(url));
        return setResult(extractVideos(json));
    }
};