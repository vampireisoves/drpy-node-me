/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: 'Tg搜索',
  author: 'EylinSir',
  '类型': '搜索',
  lang: 'ds'
})
*/

const Pan_API = 'https://pancheck.banye.tech:7777';  // 网盘链接有效性检测过滤api，需自行替换
const Pan_Sift = [];
const DEFAULT_CHANNELS = 'douerpan,bdwpzhpd,wydwpzy,sgkwpzy,zyywpzy,Baidu_Netdisk,PanjClub,youxigs,yunpanuc,zyfb123,ysxb48,xiangnikanj';//定义频道
const DEFAULT_SOURCES = ['百度网盘', '夸克网盘', 'UC网盘', '移动云盘', '天翼云盘', '115网盘', '阿里云盘', '123云盘'];//定义搜索网盘类型及顺序
const diskMapping = [
    { name: '阿里云盘', domain: ['alipan', 'aliyundrive'], regex: /ali(?:yundrive|pan)\.com/ },
    { name: '夸克网盘', domain: ['quark'], regex: /pan\.quark\.cn/ },
    { name: '115网盘', domain: ['115cdn'], regex: /115\.com/ },
    { name: '百度网盘', domain: ['baidu.com'], regex: /pan\.baidu\.com/ },
    { name: 'UC网盘', domain: ['uc'], regex: /uc/ },
    { name: '天翼云盘', domain: ['189.cn'], regex: /cloud\.189\.cn/ },
    { name: '移动云盘', domain: ['139.com'], regex: /(?:yun\.|caiyun\.)?139\.com/ },
    { name: '123云盘', domain: ['123'], regex: /www\.123(?:(?:684|865|912|592)\.com|pan\.(?:com|cn))/ }
];

// 检测链接有效性的函数
const checkLinkValidity = async (links) => {
    try {
        // 清理链接
        const cleanLinks = links.map(link => link.replace(/[`]/g, '').trim());
        
        // 调用API
        const apiResponse = await request(`${Pan_API}/api/v1/links/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                links: cleanLinks, 
                selectedPlatforms: Pan_Sift 
            })
        });
        
        return JSON.parse(apiResponse);
    } catch (error) {
        console.error('链接检测失败:', error);
        return { valid_links: links, invalid_links: [] };
    }
};

var rule = {
    类型: '搜索',
    title: 'Tg搜索',
    author: 'EylinSir',
    desc: 'TG搜索源，内置多个频道，支持夸克、阿里云盘等网盘资源搜索。',
    host: 'https://tgsou.252035.xyz',
    url: '/',
    searchUrl: '/?keyword=**',
    headers: {
        'User-Agent': 'MOBILE_UA',
        'Content-Type': 'application/json',
        'Referer': 'https://tgsou.252035.xyz/'
    },
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    double: true,
    play_parse: true,
    search_match: true,
    limit: 10,
    
    action: async function (action, value) {
        if (action === 'only_search') {
            return '此源为纯搜索源，直接搜索即可，如输入 大奉打更人'
        }
        return `未定义动作:${action}`
    },
        
    推荐: async function () {
        return [{
            vod_id: 'only_search',
            vod_name: '纯搜索源哦！',
            vod_tag: 'action',
            vod_pic: this.publicUrl + '/images/icon_cookie/搜索.jpg'
        }];
    },

    搜索: async function(wd, pg) {
        const page = parseInt(pg) || 1;
        const today = `${new Date().getMonth() + 1}-${new Date().getDate()}`;
        const apiUrl = `${this.host}/api/search?channelUsername=${DEFAULT_CHANNELS}&pic=true&keyword=${encodeURIComponent(wd)}&page=${page}&size=${this.limit}`;
        
        try {
            const res = await request(apiUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const data = JSON.parse(res);
            const createResult = (id, name, pic, source) => ({
                vod_id: id,
                vod_name: name,
                vod_pic: pic,
                vod_remarks: `${source}:${today}|TG搜`
            });
            const isValidResource = (source, name) => 
                source && DEFAULT_SOURCES.includes(source) && (!this.search_match || name.includes(wd));
            const results = [];
            const resultsList = data.results || (data.code === 0 && data.data?.results) || [];
            for (const item of resultsList) {
                if (typeof item !== 'string') continue;
                const [_, resources] = item.split('$$$');
                if (!resources) continue;
                for (const r of resources.split('##')) {
                    const segs = r.split('@');
                    if (segs.length < 2) continue;
                    const id = segs[0].trim();
                    const [pic, name] = (segs[1] || '').split('$$').map(s => s?.trim() || '');
                    if (!id || !name) continue;
                    const source = this._getDiskInfo(id, 'short');
                    if (isValidResource(source, name)) {
                        results.push(createResult(id, name, pic, source));
                    }
                }
            }
            if (data.code === 0 && data.data?.merged_by_type) {
                for (const items of Object.values(data.data.merged_by_type)) {
                    if (!Array.isArray(items)) continue;
                    for (const item of items) {
                        const url = (item.url || '').trim();
                        const title = (item.note || '').trim() || '未命名资源';
                        const pic = item.images?.[0] || '';
                        if (!url || !title) continue;
                        const source = this._getDiskInfo(url, 'short');
                        if (isValidResource(source, title)) {
                            results.push(createResult(url, title, pic, source));
                        }
                    }
                }
            }
            // 检测链接有效性
            if (results.length > 0) {
                const validityResult = await checkLinkValidity(results.map(item => item.vod_id));
                
                // 合并有效和待处理链接
                const validLinks = [...(validityResult.valid_links || []), ...(validityResult.pending_links || [])];
                
                if (validLinks.length > 0) {
                    const validLinksSet = new Set(validLinks);
                    const validResults = results.filter(item => {
                        const cleanLink = item.vod_id.replace(/[`]/g, '').trim();
                        return validLinksSet.has(cleanLink);
                    });
                    
                    if (validResults.length > 0) {
                        validResults.sort((a, b) => {
                            const sa = a.vod_remarks.split(':')[0];
                            const sb = b.vod_remarks.split(':')[0];
                            return DEFAULT_SOURCES.indexOf(sa) - DEFAULT_SOURCES.indexOf(sb);
                        });
                        return validResults;
                    }
                }
            }
        } catch (e) {}
        return [{ vod_id: 'error', vod_name: '搜索失败', vod_remarks: '无匹配资源或API异常', vod_pic: '' }];
    },

    _getDiskInfo: (str, type = 'short') => {
        if (!str) return type === 'short' ? null : '其他网盘';
        for (const mapping of diskMapping) {
            if (type === 'short' && mapping.domain.some(domain => str.includes(domain))) {
                return mapping.name;
            }
            if (type === 'full' && mapping.regex.test(str)) {
                return mapping.name;
            }
        }
        return type === 'short' ? null : '其他网盘';
    },

    二级: async function() {
        let url = this.orId;
        if (url.startsWith('push://')) url = decodeURIComponent(url.slice(7));
        url = url.trim().replace(/&amp;/g, '&');
        const disk = this._getDiskInfo(url, 'full');
        return {
            vod_pic: '',
            vod_id: this.orId,
            vod_content: `TG频道分享资源\n链接: ${url}`,
            vod_play_from: disk,
            vod_play_url: `点我播放$push://${encodeURIComponent(url)}`,
            vod_name: `${disk}资源`
        };
    },

    lazy: async function(flag, id) {
        return {
            url: id.includes('$') ? id.split('$')[1] : id,
            header: JSON.stringify(this.headers)
        };
    }
};
