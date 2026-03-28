/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '爱推图[画]',
  '类型': '漫画',
  mergeList: true,
  more: {
    mergeList: 1
  },
  lang: 'ds'
})
*/

var rule = {
    title: '爱推图[画]',
    类型: '漫画',
    host: 'https://ww.aituitu.com/',
    url: '/fyclass/index_fypage.html',
    class_parse: '#menu-main-menu&&li:lt(15);a&&Text;a&&href;.*/(.*?)/',
    cate_exclude: '娱乐时尚',
    hikerListCol: "movie_2",
    hikerClassListCol: "movie_2",
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
    },
    play_parse: true,
    lazy: async function () {
        let {input, pdfa} = this;
        // 获取当前文章最干净的 URL，用作最强防盗链
        let realUrl = input.split('@@')[0];
        let html = await request(realUrl);
        
        let arr = pdfa(html, '.single-content img');
        let urls = [];
        
        arr.forEach((it) => {
            // 采用最稳健的正则提取，绝不漏掉任何一张图
            let dSrcMatch = it.match(/data-src=['"]([^'"]+)['"]/);
            let srcMatch = it.match(/src=['"]([^'"]+)['"]/);
            let picUrl = dSrcMatch ? dSrcMatch[1] : (srcMatch ? srcMatch[1] : "");
            
            // 过滤占位假图
            if (picUrl && !picUrl.includes('400-600.jpg') && !picUrl.includes('data:image')) {
                if (picUrl.startsWith('//')) {
                    picUrl = 'https:' + picUrl;
                }
                // 【核心修复】绝不在此处拼接 @Referer，保持图片链接的纯净！
                urls.push(picUrl);
            }
        });
        
        return {
            parse: 0,
            url: 'pics://' + urls.join('&&'),
            js: '',
            header: {
                // 【核心修复】在这里把当前文章地址作为 Referer 传给播放器！
                'Referer': realUrl,
                'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
            }
        };
    },
    推荐: '*',
    searchUrl: '/sou-**-fypage.html',
    一级: '#content&&article;h2&&Text;img&&data-src;;a&&href',
    二级: '*',
    搜索: '*',
}