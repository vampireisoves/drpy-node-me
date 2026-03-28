/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: 'TG频道',
  author: 'EylinSir',
  '类型': '影视',
  logo: 'https://api.xinac.net/icon/?url=https://t.me',
  lang: 'ds'
})
*/

const { req_proxy } = $.require('./_lib.request.js');
const MAX_CONCUR = 5;
let pageCache = { video: {}, search: {} };
let searchState = { key: '', idx: 0 };

const diskRules = {
  '百度': { reg: /pan\.baidu\.com/, icon: '百度.png' },
  '夸克': { reg: /pan\.quark\.cn/, icon: '夸克.png' },
  '阿里': { reg: /www\.(aliyundrive|alipan)\.com/, icon: '阿里.png' },
  '移动': { reg: /(yun|caiyun)\.139\.com/, icon: '移动.png' },
  '天翼': { reg: /cloud\.189\.cn/, icon: '天翼.png' },
  '115': { reg: /(www\.115|115cdn)\.com/, icon: '115.png' },
  'UC': { reg: /pan\.uc\.cn|drive\.uc\.cn/, icon: 'UC.png' },
  '123': { reg: /123pan\.(?:com|cn)|123(?:684|865|912|592)\.com/i, icon: '123.png' },
  '磁力': { reg: /magnet:\?xt=urn:btih:[\da-fA-F]{32,40}/gi, icon: '磁力.png' } 
};

const EPISODE_COMBINED_REGEX = /((?:更新至|全|第)\s*\d+\s*集)|((?:更新至|全|第)\s*[一二三四五六七八九十百千万亿]+\s*集)|((?:更至|更)\s*(?:EP)?\s*\d+)/;
const QUALITY_REGEX = /(SDR|HDR|HQ|4K|1080[Pp])/g;
const TITLE_FILTER_REG = /^[^\u4e00-\u9fa5A-Za-z0-9\(\[\{（【《「『〔〖〈﹝［]+/;
const TITLE_CLEAN_REG = /(名称：|资源标题：|名称[：:])/g;
const EPISODE_CLEAN_REG = /(全|共)\s*\d+\s*集|\d+\s*集\s*全|更(新|至)?\s*\d+\s*集|第\s*\d+\s*-\s*\d+\s*集|更.*|剧情.*|（又名：.*）|(SDR|HDR|HQ|4K|1080[Pp])/g;

function getDiskInfo(url) {
  if (diskRules.磁力.reg.test(url)) return { name: '磁力', icon: diskRules.磁力.icon };
  
  const host = url.match(/^(?:https?:\/\/)?([^\/]+)/)?.[1] || '';
  for (const [name, { reg, icon }] of Object.entries(diskRules)) {
    if (name !== '磁力' && reg.test(host)) return { name, icon };
  }
  return null;
}

function cleanTitle(text) {
  const titleLine = (text.split('\n').find(line => {
    const trimLine = line.trim();
    return !/^[A-Za-z]+\s+\d+$|https?:\/\/\S+/i.test(trimLine);
  }) || text.split('\n')[0] || '未知资源').trim();
  
  return titleLine
    .replace(TITLE_CLEAN_REG, '')
    .replace(TITLE_FILTER_REG, '')
    .replace(EPISODE_CLEAN_REG, '')
    .trim();
}

function getRemarks(text) {
  const episodeMatch = text.match(EPISODE_COMBINED_REGEX);
  const qualityInfo = (text.match(QUALITY_REGEX) || []).filter((v, i, a) => a.indexOf(v) === i);
  
  const remarksParts = [];
  if (episodeMatch) remarksParts.push(episodeMatch[0]);
  if (qualityInfo.length) remarksParts.push(...qualityInfo);
  return remarksParts.join(' ');
}

function addLinkToResults(url, ctx) {
  const { diskCount, playUrls, playFroms, diskTypes, linkSet } = ctx;
  const diskInfo = getDiskInfo(url);
  if (!diskInfo) return;

  linkSet.add(url);
  diskCount[diskInfo.name] = (diskCount[diskInfo.name] || 0) + 1;
  const fromName = diskCount[diskInfo.name] > 1 ? `${diskInfo.name}${diskCount[diskInfo.name]}` : diskInfo.name;
  
  const playUrl = diskInfo.name === '磁力' ? url : `点击播放$push://${url.replace(/\#/g, '%23')}`;
  playUrls.push(playUrl);
  playFroms.push(fromName);
  diskTypes.add(diskInfo.name);
}

function getPageUrl(baseUrl, cacheKey, cache) {
  return cacheKey ? `${baseUrl}${cache[cacheKey] || ''}` : baseUrl;
}

const rule = {
  类型: '影视',
  title: 'TG频道',
  author: 'EylinSir',
  host: 'https://t.me',
  url: '/s/fyclass',
  searchUrl: '?q=**',
  Pan_API: 'https://pancheck.banye.tech:7777',  // 网盘链接有效性检测过滤api，需自行替换
  logo: 'https://api.xinac.net/icon/?url=https://t.me',
  searchable: 1,
  quickSearch: 1,
  filterable: 0,
  play_parse: true,
  timeout: 18000,
  hikerListCol: 'icon_4',
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },

  class_parse: async function() {
    return { class: JSON.parse(await request(this.params)) };
  },

  lazy: async function(flag, id) {
    const realUrl = id.includes('$') ? id.split('$').slice(1).join('$').replace(/%23/g, '\#') : id;
    return { url: realUrl };
  },

  parseMessages: async function(html) {
    const { pdfa, pdfh } = this;
    const $ = require('cheerio').load(html);
    const messages = pdfa(html, '.tgme_widget_message') || [];
    let results = [];
    let allLinks = [];

    for (const item of messages) {
      const textHtml = pdfh(item, '.tgme_widget_message_text&&Html') || '';
      const text = textHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
      if (!text) continue;

      const title = cleanTitle(text);
      
      const linkCtx = {
        diskCount: {},
        playUrls: [],
        playFroms: [],
        diskTypes: new Set(),
        linkSet: new Set()
      };

      [...pdfa(item, '.tgme_widget_message_text a'), ...pdfa(item, '.tgme_widget_message_inline_keyboard a')].forEach(a => {
        const url = (pdfh(a, 'a&&href') || '').replace(/&\#$/, '').trim();
        if (/^https?:\/\//.test(url)) addLinkToResults(url, linkCtx);
      });

      (text.match(diskRules.磁力.reg) || []).forEach(magnet => {
        addLinkToResults(magnet.trim(), linkCtx);
      });

      if (linkCtx.playUrls.length === 0) continue;

      let pic = '';
      const photoStyle = $(item).find('.tgme_widget_message_photo_wrap').attr('style') || '';
      const picMatch = photoStyle.match(/background-image\s*:\s*url\(['"]?([^'"]+)['"]?\)/i);
      if (picMatch?.[1]) {
        pic = picMatch[1];
      } else if (linkCtx.diskTypes.size) {
        const firstType = Array.from(linkCtx.diskTypes)[0];
        pic = urljoin(this.publicUrl, `./images/icon_cookie/${diskRules[firstType]?.icon || '网盘.png'}`);
      }

      const dateTime = pdfh(item, '.tgme_widget_message_date time&&datetime') || '';
      const year = dateTime.split('T')[0]?.substring(5) || '';
      const remarks = getRemarks(text);
      const vodYear = year + (linkCtx.diskTypes.size ? ` ${Array.from(linkCtx.diskTypes).join('/')}` : '');
      const linkArr = Array.from(linkCtx.linkSet);

      results.push({
        vod_name: title,
        vod_year: vodYear,
        vod_remarks: remarks,
        vod_pic: pic,
        vod_id: JSON.stringify({
          vod_name: title,
          vod_pic: pic,
          vod_content: text.split('\n').slice(1).join('\n'),
          vod_play_from: linkCtx.playFroms.join('$$$'),
          vod_play_url: linkCtx.playUrls.join('$$$')
        }),
        links: linkArr
      });
      allLinks.push(...linkArr);
    }

    if (allLinks.length) {
      try {
        const [magnetLinks, nonMagnetLinks] = [
          allLinks.filter(link => diskRules.磁力.reg.test(link)),
          allLinks.filter(link => !diskRules.磁力.reg.test(link))
        ];
        const validLinks = new Set([...magnetLinks]);

        const apiLinks = nonMagnetLinks;
        if (apiLinks.length) {
          const res = JSON.parse(await request(`${this.Pan_API}/api/v1/links/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: apiLinks })
          }));
          [...(res.valid_links || []), ...(res.pending_links || [])].forEach(link => validLinks.add(link));
        }

        results = results.filter(item => item.links.some(link => validLinks.has(link)));
      } catch (e) {
        console.error('链接校验失败:', e.message);
      }
    }

    results.forEach(item => delete item.links);
    const nextPage = $('link[rel="prev"]').attr('href')?.split('?')?.[1] || '';
    return { results: results.reverse(), nextPage: nextPage ? `?${nextPage}` : "0" };
  },

  一级: async function() {
    const { input, MY_PAGE } = this;
    if (!input || (MY_PAGE !== 1 && (!pageCache.video[input] || pageCache.video[input] === "0"))) return [];
    
    const url = getPageUrl(input, MY_PAGE !== 1 ? input : '', pageCache.video);
    const html = await req_proxy(url, 'get', this.headers);
    const { results, nextPage } = await this.parseMessages(html);
    pageCache.video[input] = nextPage;
    return results;
  },

  二级: function(ids) {
    return JSON.parse(ids);
  },

  搜索: async function() {
    const { KEY, MY_PAGE } = this;
    if (!KEY) return [];
    const { class: channels } = await this.class_parse();
    if (!channels?.length) return [];

    if (MY_PAGE === 1 || searchState.key !== KEY) {
      pageCache.search = {};
      searchState = { key: KEY, idx: 0 };
    }

    let { idx } = searchState;
    if (idx >= channels.length && !Object.values(pageCache.search).some(p => p && p !== "0")) return [];
    if (idx >= channels.length) idx = searchState.idx = 0;

    const batch = channels.slice(idx, idx + MAX_CONCUR);
    const results = (await Promise.all(batch.map(async channel => {
      const chanName = channel.type_id?.replace(/^\//, '');
      if (!chanName || pageCache.search[chanName] === "0") return [];

      const baseUrl = `${this.host}/s/${chanName}?q=${encodeURIComponent(KEY)}`;
      const url = getPageUrl(baseUrl, chanName, pageCache.search);

      try {
        const html = await req_proxy(url, 'get', this.headers);
        const { results: chanRes, nextPage } = await this.parseMessages(html);
        pageCache.search[chanName] = nextPage === "0" ? "0" : nextPage;
        return chanRes.map(item => ({
          ...item,
          vod_remarks: `${channel.type_name || chanName} ${item.vod_remarks}`.trim()
        }));
      } catch (e) {
        console.error(`处理频道${chanName}失败:`, e.message);
        pageCache.search[chanName] = "0";
        return [];
      }
    }))).flat();

    searchState.idx = idx + MAX_CONCUR;
    return results;
  }
};