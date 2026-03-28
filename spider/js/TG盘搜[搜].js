/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '盘搜',
  author: 'EylinSir',
  '类型': '搜索',
  lang: 'ds'
})
*/

const Pan_API = 'https://pancheck.banye.tech:7777'; // PanCheck的API地址 自行替换
const Pan_So = 'https://so.252035.xyz'; // PanSou地址，自行替换
const PAN_TYPES = '百度网盘,夸克网盘,UC网盘,天翼云盘,移动云盘'; // 默认搜索的网盘类型和排序，逗号分隔
const MAX_RESULTS = 15; // 默认搜索结果数量 （每个网盘类型最多15条）
const PAN_ORDER = 'desc'; // asc: 旧→新, desc: 新→旧（按时间排序）

// 网盘映射
const diskMapping = [
    { name: '百度网盘', apiType: 'baidu', domain: ['baidu.com'], regex: /pan\.baidu\.com/ },
    { name: '夸克网盘', apiType: 'quark', domain: ['quark'], regex: /pan\.quark\.cn/ },
    { name: 'UC网盘', apiType: 'uc', domain: ['uc'], regex: /uc/ },
    { name: '天翼云盘', apiType: '189', domain: ['189.cn'], regex: /cloud\.189\.cn/ },
    { name: '移动云盘', apiType: '139', domain: ['139.com'], regex: /(?:yun\.|caiyun\.)?139\.com/ },
    { name: '阿里云盘', apiType: 'ali', domain: ['alipan', 'aliyundrive'], regex: /ali(?:yundrive|pan)\.com/ },
    { name: '115网盘', apiType: '115', domain: ['115cdn'], regex: /115\.com/ },
    { name: '123云盘', apiType: '123', domain: ['123'], regex: /www\.123(?:(?:684|865|912|592)\.com|pan\.(?:com|cn))/ },
    { name: '磁力链接', apiType: 'magnet', domain: [], regex: /^magnet:\?/ },
    { name: '电驴链接', apiType: 'ed2k', domain: [], regex: /^ed2k:\/\// }
];

// 全局映射
const nameToApiType = {};
const apiTypeToName = {};
diskMapping.forEach(m => {
    nameToApiType[m.name] = m.apiType;
    apiTypeToName[m.apiType] = m.name;
});

// 检查链接有效性
const checkLinkValidity = async (links) => {
    try {
        const cleanLinks = links.map(link => link.replace(/[`]/g, '').trim());
        const apiResponse = await request(`${Pan_API}/api/v1/links/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: cleanLinks })
        });
        return JSON.parse(apiResponse);
    } catch (error) {
        return { valid_links: links, invalid_links: [] };
    }
};

var rule = {
    类型: '搜索',
    title: '盘搜',
    author: 'EylinSir',
    desc: '支持网盘优先级与过滤的纯搜索源',
    host: Pan_So,
    url: '/api/search',
    searchUrl: '/api/search?kw=**',
    headers: { 'User-Agent': 'MOBILE_UA', 'Content-Type': 'application/json' },
    searchable: 1, quickSearch: 1, filterable: 0, double: true,
    play_parse: true, search_match: true, limit: 10,
    pan_types: PAN_TYPES,
    max_results: MAX_RESULTS,
    pan_order: PAN_ORDER,

    action: function (action, value) {
        if (action === 'only_search') return '此源为纯搜索源，直接搜索即可！';
        if (action === 'init') {
            this.init(value);
            return '配置已更新';
        }
        return `注意:${action}`;
    },

    _getDiskInfo: (str, type = 'short') => {
        for (const m of diskMapping) {
            if ((type === 'short' && m.domain.some(d => str.includes(d))) ||
                (type === 'full' && m.regex.test(str))) {
                return m.name;
            }
        }
        return type === 'short' ? null : '其他网盘';
    },

    预加载: function (extend) {
        const cfg = extend ? (typeof extend === 'string' ? JSON.parse(extend) : extend) : {};
        this.pan_types = cfg.pan_types || PAN_TYPES;
        this.max_results = cfg.max_results_per_pan ? Number(cfg.max_results_per_pan) : MAX_RESULTS;
        this.pan_order = cfg.pan_order && ['asc', 'desc'].includes(cfg.pan_order) ? cfg.pan_order : PAN_ORDER;
        this.headers.Referer = `${this.host}/`;
    },

    推荐: function () {
        return [{
            vod_id: 'only_search',
            vod_name: '纯搜索源哦！',
            vod_tag: 'action',
            vod_pic: this.publicUrl + '/images/icon_cookie/搜索.jpg'
        }];
    },

    二级: function () {
        let url = this.orId;
        if (url.startsWith('push://')) url = decodeURIComponent(url.slice(7));
        url = url.trim().replace(/&amp;/g, '&');
        const disk = this._getDiskInfo(url, 'full');
        return {
            vod_pic: '',
            vod_id: this.orId,
            vod_content: `盘搜分享资源\n链接: ${url}`,
            vod_play_from: disk,
            vod_play_url: `点我播放$push://${encodeURIComponent(url)}`,
            vod_name: `${disk}资源`
        };
    },

    搜索: async function (wd, pg) {
        const panTypes = (this.pan_types || '').split(',').map(s => s.trim()).filter(Boolean);
        const allowedTypes = panTypes.map(t => nameToApiType[t] || t);
        const priorityApiTypes = panTypes.map(t => nameToApiType[t] || t);
        const apiUrl = `${this.host}/api/search?kw=${encodeURIComponent(wd)}`;

        let html;
        for (let i = 0; i <= 3; i++) {
            try {
                html = await request(apiUrl, {
                    headers: { 'User-Agent': 'MOBILE_UA', 'Referer': `${this.host}/` }
                });
                if (html) break;
            } catch (e) {
                if (i === 3) throw e;
                await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            }
        }

        const data = JSON.parse(html);
        if (data.code !== 0) throw new Error(data.message || '请求失败');

        const allImages = (data.data?.merged_by_type ? Object.values(data.data.merged_by_type).flat().flatMap(i => i.images || []) : []).filter(Boolean);
        const allItems = [];

        for (const [apiType, rows] of Object.entries(data.data?.merged_by_type || {})) {
            if (!allowedTypes.some(type => type === apiType || type === apiTypeToName[apiType])) continue;
            const name = apiTypeToName[apiType] || '其他网盘';
            for (const row of (rows || []).slice(0, this.max_results)) {
                const dt = new Date(row.datetime);
                const timeStr = `${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`;
                allItems.push({
                    title: row.note || '未知名称',
                    img: row.images?.[0] || (allImages.length ? allImages[Math.floor(Math.random() * allImages.length)] : ''),
                    desc: timeStr,
                    url: row.url,
                    pan: name,
                    panApiType: apiType,
                    time: dt.getTime(),
                    source: row.source || '盘搜'
                });
            }
        }

        allItems.sort((a, b) => {
            const aIdx = priorityApiTypes.indexOf(a.panApiType);
            const bIdx = priorityApiTypes.indexOf(b.panApiType);
            if (aIdx !== -1 || bIdx !== -1) {
                if (aIdx === -1) return 1;
                if (bIdx === -1) return -1;
                return aIdx - bIdx;
            }
            return this.pan_order === 'asc' ? a.time - b.time : b.time - a.time;
        });

        const results = allItems
            .filter(item => !this.search_match || item.title.includes(wd))
            .map(item => ({
                vod_id: item.url,
                vod_name: item.title,
                vod_pic: item.img,
                vod_remarks: `${item.pan}:${item.desc}|${item.source}`
            }));

        if (results.length > 0) {
            const validityResult = await checkLinkValidity(results.map(item => item.vod_id));
            const validLinks = [
                ...(validityResult.valid_links || []),
                ...(validityResult.pending_links || [])
            ].map(link => link.replace(/[`]/g, '').trim());

            if (validLinks.length > 0) {
                const validLinksSet = new Set(validLinks);
                const validResults = results.filter(item => validLinksSet.has(item.vod_id.replace(/[`]/g, '').trim()));
                if (validResults.length > 0) return validResults;
            }
        }
        return results;
    },

    lazy: function (flag, id) {
        return {
            url: id.includes('$') ? id.split('$')[1] : id,
            header: JSON.stringify(this.headers)
        };
    }
};
