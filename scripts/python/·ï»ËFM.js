const host = 'https://s.fm.renbenai.com';
const headers = {
    'User-Agent': 'okhttp/3.12.11',
    'Cookie': 'KLBRSID=9b9dd35888924d7c870dd3474e89cab6|1753290568|1753290499'
};

// 初始化配置
function init(cfg) {
    // 初始化函数，可留空
}

// 获取分类列表
async function home(filter) {
    try {
        const url = host + '/fm/read/fmd/static/categoryTvGet_100.html';
        const r = await req(url, { headers: headers });
        const json = JSON.parse(r.content);
        const data = json.data.list[0].channelContent;
        
        const classes = data.map((it) => ({
            type_id: it.id.toString(),
            type_name: it.nodeName,
        }));
        
        return JSON.stringify({ class: classes });
    } catch (e) {
        return JSON.stringify({ class: [] });
    }
}

// 首页推荐
async function homeVod() {
    try {
        // 先获取分类，取第一个分类的内容作为首页推荐
        const url = host + '/fm/read/fmd/static/categoryTvGet_100.html';
        const r = await req(url, { headers: headers });
        const json = JSON.parse(r.content);
        const data = json.data.list[0].channelContent;
        
        if (data.length > 0) {
            const firstCategoryId = data[0].id.toString();
            const listUrl = `${host}/fm/read/fmd/android/600/getProgramList.html&cid=${firstCategoryId}&pagenum=1`;
            const listR = await req(listUrl, { headers: headers });
            const listJson = JSON.parse(listR.content);
            const listData = listJson.data.hotList;
            
            const videos = listData.map(item => ({
                vod_id: item.id.toString(),
                vod_name: item.programName,
                vod_pic: item.img640_640,
                vod_remarks: item.resourceTitle
            }));
            
            return JSON.stringify({ list: videos });
        }
        return JSON.stringify({ list: [] });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

// 分类筛选
async function category(tid, pg, filter, extend = {}) {
    try {
        const page = pg || 1;
        const url = `${host}/fm/read/fmd/android/600/getProgramList.html&cid=${tid}&pagenum=${page}`;
        const r = await req(url, { headers: headers });
        const json = JSON.parse(r.content);
        const data = json.data.hotList;
        
        const videos = data.map(item => ({
            vod_id: item.id.toString(),
            vod_name: item.programName,
            vod_pic: item.img640_640,
            vod_remarks: item.resourceTitle
        }));
        
        return JSON.stringify({
            page: parseInt(page),
            pagecount: 999,
            limit: 20,
            total: videos.length,
            list: videos
        });
    } catch (e) {
        return JSON.stringify({ page: pg || 1, pagecount: 0, list: [] });
    }
}

// 详情页
async function detail(id) {
    try {
        const url = `${host}/fm/read/fmd/android/getProgramAudioList_620.html&pid=${id}`;
        const r = await req(url, { headers: headers });
        const json = JSON.parse(r.content);
        const list = json.data.list;
        
        if (!list || list.length === 0) {
            return JSON.stringify({ list: [] });
        }
        
        const item = list[0];
        const playUrls = list.map(it => {
            const firstUrl = it.audiolist && it.audiolist[0] ? it.audiolist[0].filePath : '';
            return `${it.title}$${firstUrl}`;
        }).filter(item => item.split('$')[1]); // 过滤掉没有地址的项

        const vodInfo = {
            vod_id: id,
            vod_name: item.title || '暂无名称',
            vod_pic: item.img370_370 || '',
            vod_remarks: item.tags || '',
            vod_content: item.programDetails || '',
            vod_play_from: '凤凰FM',
            vod_play_url: playUrls.join('#')
        };
        
        return JSON.stringify({ list: [vodInfo] });
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

// 搜索
async function search(wd, quick, pg = 1) {
    try {
        const url = `${host}/fm/read/fmd/public/search_720.html&keyWord=${encodeURIComponent(wd)}&searchType=1&pageNum=${pg}`;
        const r = await req(url, { headers: headers });
        const json = JSON.parse(r.content);
        const data = json.data.program;
        
        const videos = data.map(item => ({
            vod_id: item.id.toString(),
            vod_name: item.programName,
            vod_pic: item.img640_640,
            vod_remarks: item.programName
        }));
        
        return JSON.stringify({
            page: parseInt(pg),
            list: videos
        });
    } catch (e) {
        return JSON.stringify({ page: pg, list: [] });
    }
}

// 播放
async function play(flag, id, flags) {
    // 直接返回播放地址
    return JSON.stringify({
        parse: 0,
        url: id,
        header: headers
    });
}

// 导出模块
export default {
    init: init,
    home: home,
    homeVod: homeVod,
    category: category,
    detail: detail,
    search: search,
    play: play
};