/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '盘Ta',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    title: '盘Ta',
    host: 'https://www.91panta.cn',
    url: '/?tagId=fyclass&page=fypage',
    detailUrl: '/fyid',
    searchUrl: '/search?keyword=**&page=fypage',
    play_parse: true,
    searchable: 1,
    quickSearch: 1,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.91panta.cn/',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7'
    },

    // 简化选择器获取逻辑，合并重复判断
    预处理: async function () {
        const resp = await req(this.host, { method: 'get', headers: this.headers }).catch(() => ({ content: '' }));
        const $ = pq(resp.content);
        const classNames = ['全部'], classIds = [''];
        // 简化tabNav选择器，合并两种情况
        const tabNav = $('#tabNavigation') || $('div[class*="tabNavigation"]');
        
        tabNav.find('a.tab').each((_, el) => {
            const href = $(el).attr('href'), name = $(el).text().trim();
            const match = href?.match(/tagId=(\d+)/);
            if (match && name) {
                classNames.push(name);
                classIds.push(match[1]);
            }
        });
        if (classIds.length > 1) {
            this.class_name = classNames.join('&');
            this.class_url = classIds.join('&');
        }
    },

    推荐: async function () {
        return await this.一级('', 1);
    },

    // 简化href拼接、变量声明，精简数组push逻辑
    _parseList: function ($, items) {
        const { publicUrl } = this;
        const videos = [];
        
        items.each((_, item) => {
            const titleElem = $(item).find('h2.title a');
            if (!titleElem.length) return;

            const title = titleElem.text().trim();
            // 用URL对象简化拼接，避免手动判断开头
            const href = new URL(titleElem.attr('href'), this.host).href;
            const tag = $(item).find('span.tag').text().trim();
            const timeText = $(item).find('span.postTime').text().trim();
            const remarks = [tag, timeText].filter(Boolean).join(' | ');

            videos.push({
                vod_name: title,
                vod_id: href,
                vod_pic: urljoin(publicUrl, './images/icon_cookie/移动.png'),
                vod_remarks: remarks
            });
        });
        return videos;
    },

    // 简化URL构建逻辑，减少冗余变量
    一级: async function (tid, pg) {
        const url = new URL(this.host);
        tid && url.searchParams.set('tagId', tid);
        pg > 1 && url.searchParams.set('page', pg);
        
        const resp = await req(url.toString(), { method: 'get', headers: this.headers }).catch(() => ({ content: '' }));
        const $ = pq(resp.content);
        return this._parseList($, $('.topicItem'));
    },

    // 精简变量声明、标题提取逻辑，简化数组处理
    二级: async function (vid) {
        const { publicUrl } = this;
        const realVid = Array.isArray(vid) ? vid[0] : vid;
        // 合并空值判断
        if (!realVid || ['no_data', 'error'].includes(realVid)) return {};

        const resp = await req(realVid, { method: 'get', headers: this.headers }).catch(() => ({ content: '' }));
        const html = resp.content;
        if (!html) return {};

        const $ = pq(html);
        const contentDiv = $('div.topicContent');
        if (!contentDiv.length) return {};

        // 简化标题提取逻辑，减少冗余变量
        let mainTitle = $('div.title, h2.title').first().text().trim() || $('title').text().trim() || "未知标题";
        // 处理a标签嵌套的标题
        mainTitle = $('div.title, h2.title').first().find('a').text().trim() || mainTitle;

        // 保留原始正则逻辑，仅简化变量声明
        const htmlContent = contentDiv.html();
        const links = new Set();
        if (htmlContent) {
            let match;
            // 1. 提取a标签链接
            const regex1 = /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/[^"']*?)["'][^>]*>/gi;
            while ((match = regex1.exec(htmlContent)) !== null) {
                const link = match[1].trim();
                /yun\.139\.com|139\.com|caiyun\.139\.com/.test(link) && links.add(link);
            }
            // 2. 提取span标签内链接
            const regex2 = /<span[^>]*>(https?:\/\/[^<]*?)<\/span>/gi;
            while ((match = regex2.exec(htmlContent)) !== null) {
                const link = match[1].trim();
                /yun\.139\.com|139\.com|caiyun\.139\.com/.test(link) && links.add(link);
            }
            // 3. 提取裸URL
            const regex3 = /https?:\/\/[^\s<>"\u0000-\u001F\u007F-\u009F\u2028\u2029]+/gi;
            while ((match = regex3.exec(htmlContent)) !== null) {
                const link = match[0].trim();
                /yun\.139\.com|139\.com|caiyun\.139\.com/.test(link) && links.add(link);
            }
        }

        const diskLinks = Array.from(links);
        if (!diskLinks.length) return {};
        
        // 简化链接清洗和剧集拼接
        const episodes = diskLinks.map(link => `点击播放$push://${encodeURIComponent(link.trim().replace(/&amp;/g, '&'))}`).join('#');
        const contentText = contentDiv.find('p').first().text().trim().substring(0, 200) || mainTitle;

        return {
            vod_id: realVid,
            vod_name: mainTitle,
            vod_pic: urljoin(publicUrl, './images/icon_cookie/移动.png'),
            vod_content: contentText,
            vod_remarks: "",
            vod_play_from: "移动云盘",
            vod_play_url: episodes
        };
    },

    // 简化搜索URL构建，减少冗余
    搜索: async function (wd, _, pg) {
        const url = new URL(`${this.host}/search`);
        url.searchParams.set('keyword', wd);
        url.searchParams.set('page', pg || 1);
        
        const resp = await req(url.toString(), { method: 'get', headers: this.headers }).catch(() => ({ content: '' }));
        const $ = pq(resp.content);
        return this._parseList($, $('.topicItem'));
    },

    // 简化URL提取逻辑
    lazy: function (flag, id) {
        const url = id.includes('$') ? id.split('$')[1] : id;
        return {
            url: url,
            header: JSON.stringify(this.headers)
        };
    }
};