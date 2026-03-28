/**
 * 小黄鸟 爬虫
 * 作者：deepseek
 * 版本：2.0 - WvSpider v2.0 新架构
 * 最后更新：2025-12-25
 * 发布页 https://xiaohuangniao.me/
 *
 * @config
 * debug: false
//  * showWebView: true
 * percent: 80,60
 * returnType: dom
 * timeout: 30
 *
 */

const baseUrl = 'https://xiaohuangniao.me';

/**
 * 初始化配置
 */
function init(cfg) {
    return {};
}

/**
 * 首页分类
 */
async function homeContent(filter) {
    return {
        class: [
            { type_id: "1", type_name: "热门福利" },
            { type_id: "2", type_name: "热门作者" },
            { type_id: "3", type_name: "站内搜索" }
        ]
    };
}

/**
 * 首页推荐视频
 */
async function homeVideoContent() {
    const res = Java.req(`${baseUrl}/api/requestdb?type=hot-tweets`);
    const json = JSON.parse(res.body);
    
    const vods = [];
    for (const [key, data] of Object.entries(json.data)) {
        if (data.author.userName == 'JianierCom') continue;
        // 跳过没有媒体的推文
        if (!data.extendedEntities || !data.extendedEntities.media || !data.extendedEntities.media[0]) continue;
        vods.push({
            vod_id: JSON.stringify(data),
            vod_name: data.text.toString().slice(0, 10) + '...',
            vod_pic: data.extendedEntities.media[0].url,
            vod_year: data.author.name,
            vod_remarks: data.viewCount + '浏览'
        });
    }
    return { list: vods };
}

/**
 * 分类内容
 */
async function categoryContent(tid, pg, filter, extend) {
    // 点击搜索
    if (tid == 'click_to_search') {
        if (pg == 1 || pg == '1') {
            const keyword = Java.showInputDialog('站内搜索', '请输入搜索关键字', '');
            if (!keyword) return Result.error('关键字不能为空!');
            Java.setCache('search_keyword', keyword);
        }
        // 使用缓存的关键字
        const cachedKeyword = Java.getCache('search_keyword');
        if (cachedKeyword) {
            tid = 'search_mode';
        } else {
            return Result.error('请先输入搜索关键字!');
        }
    }

    let Url = '';
    let type = '';

    // 解析 tid，确定 URL 和类型
    if (tid == 'search_mode') {
        const keyword = Java.getCache('search_keyword');
        Url = `${baseUrl}/api/search/tweets?q=${encodeURIComponent(keyword)}&page=${pg}&limit=16`;
        type = 'tweets';
    } else if (tid.includes('_folder')) {
        const authorId = tid.replace('_folder', '');
        Url = `${baseUrl}/api/tweet?limit=16&page=${pg}&authorId=${authorId}`;
        type = 'tweets';
    } else if (tid.includes('_search_user')) {
        const userName = tid.replace('_search_user', '');
        const res = Java.req(`${baseUrl}/api/search/users?q=${userName}&page=1&limit=16`);
        const json = JSON.parse(res.body);
        let authorId = '';
        for (const data of Object.values(json.data.users)) {
            if (data.userName == userName) {
                authorId = data.id;
                break;
            }
        }
        Url = `${baseUrl}/api/tweet?limit=16&page=${pg}&authorId=${authorId}`;
        type = 'tweets';
    } else if (tid.includes('_search_vod')) {
        const keyword = tid.replace('_search_vod', '');
        Url = `${baseUrl}/api/search/tweets?q=${encodeURIComponent(keyword)}&page=${pg}&limit=16`;
        type = 'tweets';
    } else if (tid == '1') {
        Url = `${baseUrl}/api/tweet?limit=16&page=${pg}`;
        type = 'tweets';
    } else if (tid == '2') {
        Url = `${baseUrl}/api/requestdb?type=hot-creators&page=${pg}&limit=16`;
        type = 'creators';
    } else if (tid == '3') {
        Url = `${baseUrl}/api/search/trending?limit=20`;
        type = 'trending';
    }

    const res = Java.req(Url);
    const json = JSON.parse(res.body);
    const vods = [];

    if (type == 'tweets') {
        for (const data of Object.values(json.data.tweets)) {
            if (data.author.userName == 'JianierCom') continue;
            if (!data.extendedEntities || !data.extendedEntities.media || !data.extendedEntities.media[0]) continue;
            vods.push({
                vod_id: JSON.stringify(data),
                vod_name: data.text.toString().slice(0, 10) + '...',
                vod_pic: data.extendedEntities.media[0].url,
                vod_year: data.author.name,
                vod_remarks: data.viewCount + '浏览'
            });
        }
    } else if (type == 'creators') {
        for (const data of Object.values(json.data.creators)) {
            if (['EndWokeness', 'JianierCom', 'Bitcoin'].includes(data.userName)) continue;
            vods.push({
                vod_id: data.id + '_folder',
                vod_name: data.name,
                vod_pic: data.profilePicture.replace('_normal', ''),
                vod_remarks: '推文' + data._count.tweets,
                vod_tag: 'folder',
                style: { type: "rect", ratio: 1.33 }
            });
        }
    } else if (type == 'trending') {
        vods.push({
            vod_id: 'click_to_search',
            vod_name: '点击进行站内搜索',
            vod_tag: 'folder',
            style: { type: "rect", ratio: 5 }
        });
        // 热门关键词
        for (const data of Object.values(json.data.keywords)) {
            vods.push({
                vod_id: data.keyword + '_search_vod',
                vod_name: data.keyword,
                vod_tag: 'folder'
            });
        }
        json.data.totalPages = 1;
        json.data.total = 20;
    }

    return { 
        code: 1, 
        msg: "数据列表", 
        list: vods, 
        page: parseInt(pg) || 1, 
        pagecount: json.data.totalPages || 1,
        limit: 16,
        total: json.data.total || vods.length
    };
}

/**
 * 详情页
 */
async function detailContent(ids) {
    const json = JSON.parse(ids[0]);
    const playList = [];
    
    json.extendedEntities.media.forEach(function(media, i) {
        if (media.type === 'video' && media.video_info && media.video_info.variants && media.video_info.variants[0]) {
            playList.push('视频' + (i + 1) + '$' + media.video_info.variants[0].url);
        } else if (media.type === 'photo') {
            playList.push('图片' + (i + 1) + '$' + media.url);
        }
    });

    return {
        list: [{
            vod_id: json.tweetId,
            vod_name: json.text,
            vod_pic: json.extendedEntities.media[0]?.url || '',
            vod_actor: aTags(`${json.author.name}:${json.author.userName}_search_user`),
            vod_content: json.text,
            vod_play_from: '播放源',
            vod_play_url: playList.join('#')
        }]
    };
}

/**
 * 搜索
 */
async function searchContent(key, quick, pg) {
    return { 
        code: 1, 
        msg: "数据列表", 
        list: [], 
        page: parseInt(pg) || 1, 
        pagecount: 10000, 
        limit: 24, 
        total: 240000 
    };
}

/**
 * 播放器
 */
async function playerContent(flag, id, vipFlags) {
    return { url: id, parse: 0 };
}

/**
 * 自定义动作
 */
async function action(str) {
}


/**
 * 生成a标签格式的字符串
 * @param {string|Array} input - 单个字符串或数组，格式为"name"或"name:id"
 * @returns {string} 可直接赋值的a标签字符串
 */
function aTags(input) {
    if (!input) return '';
    const arr = Array.isArray(input) ? input : [input];
    return arr.map(t => {
        if (!t || typeof t !== 'string') return '';
        let name, id;
        if (t.includes(':')) {
            const parts = t.split(':');
            name = parts[0];
            id = parts.slice(1).join(':');
        } else {
            name = t;
            id = t;
        }
        return `[a=cr:{"id":"${id.replace(/"/g, '\\"')}","name":"${name.replace(/"/g, '\\"')}"}/]${name}[/a]`;
    }).filter(Boolean).join(' ');
}
