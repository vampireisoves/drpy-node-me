/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '毒舌影视',
  '类型': '影视',
  lang: 'ds'
})
*/

const {getHtml} = $.require('./_lib.request.js')

var rule = {
  title: '毒舌影视',
  host: 'https://www.xnhrsb.com/',
  url: '/dsshiyisw/fyclass--------fypage---.html',
  searchUrl: '/dsshiyisc/**----------fypage---.html',
  class_name: '电影&电视剧&综艺&动漫&短剧&豆瓣',
  class_url: '1&2&3&4&5&duoban',
  searchable: 2,
  quickSearch: 0,
  filterable: 0,
  headers: {
    'User-Agent': 'MOBILE_UA',
  },
  play_parse: true,
  limit: 6,
  double: true,
  推荐: '.bt_img;ul&&li;*;*;*;*',
  一级: '.mrb&&ul li;.dytit&&Text;.lazy&&data-original;.hdinfo&&Text;a&&href',
  二级: {
    title: 'h1&&Text;.moviedteail_list li&&a&&Text',
    img: 'div.dyimg img&&src',
    desc: '.moviedteail_list li:eq(3)&&Text;.moviedteail_list li:eq(2)&&Text;.moviedteail_list li:eq(1)&&Text;.moviedteail_list li:eq(6)&&Text;.moviedteail_list li:eq(4)&&Text',
    content: '.yp_context&&Text',
    tabs: '.mi_paly_box .ypxingq_t',
    lists: '.paly_list_btn:eq(#id) a:gt(0)',
  },
  搜索: '.mrb&&ul li;.dytit&&Text;.lazy&&data-original;.hdinfo&&Text;a&&href',
  
  // 简化的lazy函数，只保留最有效的解析方法
  lazy: async function (flag, input, next) {
    // 如果输入已经是m3u8地址，直接返回
    if (input.includes('.m3u8')) {
      return { parse: 0, url: input };
    }
    
    // 如果是播放页面，需要提取真实地址
    if (input.includes('/dsshiyipy/')) {
      try {
        const html = (await getHtml({
          url: input,
          headers: {
            'User-Agent': 'MOBILE_UA',
            'Referer': rule.host
          }
        })).data;
        
        const $ = pq(html);
        
        // 查找包含player_aaaa的脚本并提取m3u8地址
        const scripts = $('script');
        for (let i = 0; i < scripts.length; i++) {
          const scriptContent = $(scripts[i]).html();
          if (scriptContent && scriptContent.includes('player_aaaa')) {
            const urlMatch = scriptContent.match(/"url"\s*:\s*"([^"]+\.m3u8[^"]*)"/);
            if (urlMatch) {
              // 处理转义字符并返回
              const playUrl = urlMatch[1].replace(/\\\//g, '/');
              return { parse: 0, url: playUrl };
            }
            break;
          }
        }
      } catch (e) {
        console.error('获取播放页失败:', e);
      }
    }
    
    // 如果无法解析，返回原始地址
    return { parse: 0, url: input };
  }
}