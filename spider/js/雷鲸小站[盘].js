/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '雷鲸小站[盘]',
  '类型': '影视',
  lang: 'ds'
})
*/

const { req_ } = $.require('./_lib.request.js');
const { formatPlayUrl } = misc;

const rule = {
  title: '雷鲸小站[盘]',
  author: 'EylinSir',
  host: 'https://www.leijing1.com',
  url: '/?tagId=fyclass&page=fypage',
  detailUrl: '/fyid',
  searchUrl: '/search?keyword=**&page=fypage',
  img: './images/icon_cookie/天翼.png',
  play_parse: true,
  searchable: 1,
  quickSearch: 1,
  class_name: '电影&剧集&动漫&影视原盘&纪录&综艺&演唱会&其他',
  class_url: '42204681950354&42204684250355&42204792950357&42212287587456&42204697150356&42210356650363&42317879720298&42238531387459',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
    'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7'
  },

  预处理: async () => [],
  推荐: async function () {
    return await this.一级(0, 1);
  },

  // 一级列表解析（极简拼接）
  一级: async function (tid, pg) {
    const { input, publicUrl } = this;
    // 仅一行拼接，简洁且复用顶层常量
    const pic = urljoin(publicUrl, this.img);
    const html = await req_(input, 'get', this.headers);
    const $ = pq(html);
    let videos = [];

    $('.topicList .topicItem').each((_, item) => {
      const a = $(item).find('h2 a:first');
      const title = a.text().trim();
      if (title && !/防失联|微信群|QQ群/.test(title)) {
        videos.push({
          vod_name: title,
          vod_id: a.attr('href'),
          vod_pic: pic // 直接用
        });
      }
    });
    return videos;
  },

  // 二级详情解析（极简拼接）
  二级: async function (ids) {
    const { publicUrl, input } = this;
    const pic = urljoin(publicUrl, this.img); // 仅一行

    if (ids === "no_data") {
      return { vod_name: "暂无数据", vod_id: ids, vod_pic: pic, vod_content: "当前分类暂无内容" };
    }

    const html = await req_(input, 'get', this.headers);
    const $ = pq(html);
    const contentHtml = $('.topicContent').html();
    const linkMatch = contentHtml.match(/(?:<a[^>]*href=["']|<span style="color:\s*#0070C0;\s*">)?(https:\/\/cloud\.189\.cn\/[^"'<]*)/i);
    const link = linkMatch ? linkMatch[1] : '';

    const vod = {
      vod_name: $('.title').text().trim(),
      vod_id: input,
      vod_pic: pic, // 直接用
      vod_content: $('div.topicContent p:nth-child(1)').text(),
      vod_play_from: '',
      vod_play_url: '',
      vod_play_pan: ''
    };

    if (link) {
      const data = await Cloud.getShareData(link);
      const [playform, playurls] = Object.entries(data).reduce(([f, u], [k, l]) => {
        f.push(`Cloud-${k}`);
        u.push(l.map(i => `${i.name}$${i.fileId}*${i.shareId}`).join('#'));
        return [f, u];
      }, [[], []]);
      vod.vod_play_from = playform.join("$$$");
      vod.vod_play_url = playurls.join("$$$");
      vod_play_pan: link;
    }
    return vod;
  },

  // 搜索解析（极简拼接）
  搜索: async function (wd, quick, pg) {
    const { publicUrl } = this;
    const pic = urljoin(publicUrl, this.img); // 仅一行
    const searchUrl = `${this.host}/search?keyword=${encodeURIComponent(wd)}&page=${pg || 1}`;
    const html = await req_(searchUrl, 'get', this.headers);
    const $ = pq(html);
    const videos = [];

    $('.topicList .topicItem').each((_, item) => {
      const a = $(item).find('h2 a:first');
      const href = a.attr('href');
      if (href) {
        videos.push({
          vod_name: a.text().trim(),
          vod_id: href,
          vod_remarks: $(item).find('.summary').text().trim().substring(0, 100),
          vod_pic: pic // 直接用
        });
      }
    });
    return videos;
  },

  lazy: async function (flag, id) {
    if (!flag.startsWith('Cloud-')) return;
    const [fileId, shareId] = this.input.split('*');
    log("天翼云盘解析开始");
    return { url: `${await Cloud.getShareUrl(fileId, shareId)}#isVideo=true#` };
  }
};