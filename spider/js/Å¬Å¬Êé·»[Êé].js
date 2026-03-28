/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '努努书坊[书]',
  author: 'EylinSir',
  '类型': '小说',
  logo: 'https://www.nunubook.com/favicon.ico',
  lang: 'ds'
})
*/

var rule = {
  类型: '小说',
  author: 'EylinSir',
  title: '努努书坊[书]',
  host: 'https://www.nunubook.com',
  url: '/fyclass/##fypage',
  logo: 'https://www.nunubook.com/favicon.ico',
  class_name: '玄幻小说&魔幻小说&悬疑小说&历史架空&都市小说&言情小说&武侠小说&官场小说&现代小说&战争军事&侦探推理&外国小说&纪实小说&诗歌戏曲&宗教哲学&文学理论&寓言童话&科普学习&社会心理&作品集&传记回忆&杂文随笔',
  class_url: 'xuanhuan&mohuan&xuanyi&lishi&dushi&yanqing&wuxia&guanchang&xiandaixiaoshuo&zhanzhengjunshi&zhentantuili&waiguo&jishi&shigexiqu&zhexue&wenxuelilun&yuyantonghua&kepuxuexi&shehuixinli&zuopinji&zhuanjihuiyi&zawen',
  searchUrl: '/e/search/index.php?tbname=bookname&show=title&tempid=1&keyboard=**',
  searchable: 1,
  quickSearch: 1,
  filterable: 0,
  timeout: 10000,
  play_parse: true,
  headers: { 'User-Agent': 'MOBILE_UA' },

  一级: async function () {
    let [cateUrl, pg] = this.input.split('##');
    let list = [];
    let cateKey = cateUrl.split('/').filter(Boolean).pop() || '';
    let cl = this.class_url.split('&').findIndex(k => k === cateKey) + 1 || undefined;
    if (pg === '1') {
      let html = await request(cateUrl);
      let selectors = ['.listBig-li', 'li.listBig-li', '.book-item', '.list-item'];
      let items = selectors.map(sel => this.pdfa(html, sel)).find(Boolean);
      items?.forEach(item => {
        let urlSelectors = ['a:eq(0)&&href', 'a&&href'];
        let url = urlSelectors.map(sel => this.pd(item, sel)).find(Boolean) || this.pdfh(item, 'a&&href');
        if (url) {
          url = url.startsWith('http') ? url : `${this.host}${url}`;
          let title = this.pdfh(item, 'h3&&Text') || this.pdfh(item, 'h2&&Text') || '未知标题';
          let desc = this.pdfh(item, 'p:eq(0)&&Text') || '无简介';
          list.push({
            title,
            url,
            desc,
            pic_url: this.pd(item, 'img&&src') || '',
            content: this.pdfh(item, '.text&&Text') || desc
          });
        }
      });
    } else if (cl) {
      let apiUrl = `${this.host}/e/extend/more/lsmore.php?page=${pg}&line=10&cl=${cl}`;
      let json = JSON.parse(await request(apiUrl));
      list.push(...json.map(item => ({
        title: item.title,
        url: item.url,
        pic_url: item.pic,
        desc: item.smalltext,
        content: `${item.smalltext}\n作者：${item.writer}`
      })));
    }
    return setResult(list);
  },

  二级: async function () {
    let html = await request(this.input);
    let VOD = {
      vod_name: this.pdfh(html, 'h1&&Text'),
      vod_pic: this.pdfh(html, '[property$=image]&&content'),
      vod_content: this.pdfh(html, '[property$=description]&&content'),
      vod_actor: this.pdfh(html, '[property$=author]&&content')
    };
    let id = this.input.match(/\/(\d+)(\/|\.html)/)?.[1];
    if (id) {
        let baseUrl = `${this.host}/e/extend/bookpage/pages.php?id=${id}&dz=asc&pageNum=`;
        let firstPage = JSON.parse(await request(baseUrl + '0'));
        let chapters = firstPage.list || [];
        if (firstPage.totalPage > 0) {
          let reqs = [];
          for (let i = 1; i <= firstPage.totalPage; i++) reqs.push(request(baseUrl + i));
          let res = await Promise.all(reqs);
          res.forEach(r => { chapters = chapters.concat(JSON.parse(r).list || []) });
        }
        VOD.vod_play_from = '努努书坊';
        VOD.vod_play_url = chapters.map(c => {
          let url = c.pic || c.url;
          return c.title + '$' + (url.startsWith('http') ? url : `${this.host}${url}`);
        }).join('#');
    }
    return VOD;
  },

  搜索: async function () {
    let [url, params] = this.input.split('?');
    let html = await post(url, { body: params });
    let list = [];
    if (!html.includes('没有搜索到')) {
      (this.pdfa(html, '.search-wrap-first') || []).forEach(item => {
        let url = this.pd(item, 'a&&href');
        if (url) list.push({
          title: this.pdfh(item, 'h3&&Text').replace('小说', ''),
          url: url.startsWith('http') ? url : `${this.host}${url}`,
          pic_url: this.pd(item, 'img&&src'),
          content: this.pdfh(item, 'p&&Text')
        });
      });
    }
    return setResult(list);
  },

  lazy: async function () {
    let { input, pdfh } = this;
    let html = await request(input);
    let content = pdfh(html, '#text&&Html') || '';
    if (content) {
      content = content
      .replace(/<script[^>]*?>.*?<\/script>/gs, '') 
      .replace(/<\/p>/g, '\n\n') 
      .replace(/<br\s*\/?>/gi, '\n') 
      .replace(/<[^>]+>/g, '') 
      .replace(/&nbsp;/g, ' ') 
      .replace(/\n\s*\n/g, '\n\n') 
      .trim();
  }
    return {
      parse: 0,
      url: `novel://${JSON.stringify({ title: pdfh(html, 'h1&&Text') || '', content })}`,
      js: ''
    };
  }
};