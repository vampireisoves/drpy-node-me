import axios from 'axios';
import * as cheerio from 'cheerio';
import zlib from 'zlib';

export async function extractFilter(urls, isGzip = false, options = {}) {
    try {
        let urlList = Array.isArray(urls) ? urls : [urls];
        let drpyFilter = {};
        let defaultHeaders = { 'User-Agent': 'MOBILE_UA' };
        let reqHeaders = { ...defaultHeaders, ...(options.headers || {}) };

        for (let baseUrl of urlList) {
            const { data: html } = await axios.get(baseUrl, {
                headers: reqHeaders
            });
            const $ = cheerio.load(html);

            // Phase 1: Try CMS-style filter blocks (extract_cms_filter logic)
            let cmsFound = extractCmsFilter($, drpyFilter);

            // Phase 2: URL query parameter based filters (original logic)
            const links = $('a').toArray();
            links.forEach(a => {
                let href = $(a).attr('href');
                if (href && (href.includes('.html?') || href.startsWith('?'))) {
                    let text = $(a).text().trim();
                    let typeName = '*';
                    let keyName = '';
                    let val = '';

                    if (href.startsWith('?')) {
                        let matchUrl = baseUrl.match(/\/([^/.]+)\.html/);
                        if (matchUrl) typeName = matchUrl[1];
                        let matchHref = href.match(/\?(.*?)=([^&]+)/);
                        if (matchHref) {
                            keyName = matchHref[1];
                            val = matchHref[2];
                        }
                    } else {
                        let match = href.match(/\/([^/.]+)\.html\?(.*?)=([^&]+)/);
                        if (match) {
                            typeName = match[1];
                            keyName = match[2];
                            val = match[3];
                        }
                    }

                    if (keyName && val !== undefined) {
                        if (['page', 'p', 'pg'].includes(keyName.toLowerCase())) return;

                        if (text === '全部' || text === '全部类型' || text === '全部地区' || text === '全部年份') val = '';
                        
                        if (!drpyFilter[typeName]) drpyFilter[typeName] = {};
                        if (!drpyFilter[typeName][keyName]) drpyFilter[typeName][keyName] = [];
                        
                        if (!drpyFilter[typeName][keyName].find(x => x.n === text)) {
                            drpyFilter[typeName][keyName].push({n: text, v: val});
                        }
                    }
                }
            });
        }
        
        let finalFilter = {};
        const keyNameMap = {
            'class': '类型',
            'area': '地区',
            'year': '年份',
            'sort': '排序',
            'sort_field': '排序',
            'by': '排序',
            'order': '排序'
        };
        
        for (let type in drpyFilter) {
            finalFilter[type] = [];
            for (let key in drpyFilter[type]) {
                let vals = drpyFilter[type][key];
                
                // Ensure "全部" is at the front if it exists
                let allIdx = vals.findIndex(x => x.n.includes('全部') || x.v === '');
                if (allIdx > 0) {
                    let all = vals.splice(allIdx, 1)[0];
                    all.n = '全部';
                    all.v = '';
                    vals.unshift(all);
                } else if (allIdx === -1) {
                    vals.unshift({n: '全部', v: ''});
                }
                
                finalFilter[type].push({
                    key: key,
                    name: keyNameMap[key] || key,
                    value: vals
                });
            }
        }
        
        if (isGzip) {
            let jsonStr = JSON.stringify(finalFilter);
            let zipped = zlib.gzipSync(Buffer.from(jsonStr));
            return zipped.toString('base64');
        }
        return finalFilter;
    } catch(e) {
        console.error(e.message);
        return null;
    }
}

function extractCmsFilter($, drpyFilter) {
    const filterBlocks = $(
        '.stui-screen__list, .myui-screen__list, .module-screen, .screen-list, ' +
        'dl.type, .filter-list, .screen-box, .stui-screen, .myui-screen'
    );
    if (filterBlocks.length === 0) return false;

    let typeName = '*';
    filterBlocks.each((idx, el) => {
        let filterName = $(el).find('span.text-muted, dt, .text-muted, .filter-title').first().text().trim();
        let keyName = '';
        if (filterName.includes('地区') || filterName.includes('area')) keyName = 'area';
        else if (filterName.includes('年份') || filterName.includes('year')) keyName = 'year';
        else if (filterName.includes('类型') || filterName.includes('class') || filterName.includes(' genre')) keyName = 'class';
        else if (filterName.includes('排序') || filterName.includes('sort') || filterName.includes('order')) keyName = 'order';
        else if (filterName) keyName = filterName;

        if (!keyName) return;

        $(el).find('a').each((i, a) => {
            let text = $(a).text().trim();
            let href = $(a).attr('href') || '';
            let val = '';
            if (href) {
                let match = href.match(/[?&](\w+)=(\w+)/);
                if (match) val = match[2];
            }
            if (text === '全部' || text === '全部类型' || text === '全部地区' || text === '全部年份') val = '';

            if (!text) return;
            if (!drpyFilter[typeName]) drpyFilter[typeName] = {};
            if (!drpyFilter[typeName][keyName]) drpyFilter[typeName][keyName] = [];
            if (!drpyFilter[typeName][keyName].find(x => x.n === text)) {
                drpyFilter[typeName][keyName].push({n: text, v: val});
            }
        });
    });
    return true;
}