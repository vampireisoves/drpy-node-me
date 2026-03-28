/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '顶点小说[书]',
  '类型': '小说',
  lang: 'ds'
})
*/

var rule = {
  类型: '小说',
  title: '顶点小说[书]',
  host: 'https://www.23ddw.cc/',
  编码: 'utf-8',
  url: '/class/fyclass_fypage/',
  searchUrl: '/searchss/?searchkey=**&page=fypage',
  searchable: 2,
  quickSearch: 0,
  filterable: 1,
  filter: '',
  filter_url: '',
  filter_def: {},
  headers: { 'User-Agent': 'PC_UA' },
  timeout: 5000,
  hikerListCol: "text_1",
  hikerClassListCol: "text_1",
  class_name: '全本',
  class_url: '0',
  class_parse: '.nav&&ul&&li;a&&Text;a&&href;class/(.*?)_',
  cate_exclude: '',
  play_parse: true,
  lazy: $js.toString(async () => {
    log('input:', input);
    let html = await request(input);
    let title = pdfh(html, '.bookname&&Text');
    let content = pdfh(html, '#content&&Html') || '';
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
    input = { parse: 0, url: `novel://${JSON.stringify({ title, content })}`, js: '' };
    return input;
  }),
  double: false,
  一级: $js.toString(async () => {
    let d = [];
    let url = MY_CATE === '0' 
      ? urljoin(rule.host, `/quanben/${MY_PAGE}`)
      : input.split('#')[0].replace(/_[0-9]+\.html/, '') + `_${MY_PAGE}.html`;
    let html = await request(url);
    let lis = pdfa(html, '#newscontent ul li') || pdfa(html, '.item');
    lis.forEach(it => {
      let title = pdfh(it, 'dt&&Text') || pdfh(it, '.s2&&Text');
      let author = pdfh(it, '.btm a&&Text') || pdfh(it, '.s4&&Text');
      let lastChapter = pdfh(it, '.s3&&Text');
      let img = pdfh(it, 'img&&data-original') 
        ? pd(it, 'img&&data-original', rule.host) 
        : (pdfh(it, 'img&&src') ? pd(it, 'img&&src', rule.host) : '');
      d.push({
        title,
        desc: `${author} | ${lastChapter}`,
        img,
        url: pd(it, 'a&&href', rule.host)
      });
    });
    return setResult(d);
  }),
  二级: {
    title: 'h1&&Text',
    img: '#fmimg&&img&&data-original;#fmimg&&img&&src',
    desc: '#info&&p:eq(-1)&&Text',
    content: '#intro&&p&&Text',
    tabs: '#list&&dt',
    lists: '#list&&a',
    tab_text: 'dd&&Text',
    list_text: 'body&&Text',
    list_url: 'a&&href',
    list_url_prefix: '',
  },
  搜索: '#hotcontent&&.item;#newscontent ul li;a&&title;img&&data-original;.btm a&&Text;.blue.visible-xs&&Text;a&&href;dd&&Text;.s2&&Text;.s4&&Text;.s3&&Text'
};