// http://localhost:5757/api/番茄小说[书]?ac=list&t=主分类&pg=1
const {getRandomFromList} = $.require('./_lib.random.js');

function testHls() {
    log(typeof hlsParser)

    // 假设m3u8Content是你的M3U8文件内容
    const m3u8Content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:10,
http://example.com/first.ts
#EXTINF:10,
http://example.com/second.ts
#EXTINF:10,
http://example.com/third.ts`;

// 解析M3U8文件内容
    const playlist = hlsParser.parse(m3u8Content);

// 检查是否存在segments并且长度大于0
    if (playlist.segments && playlist.segments.length > 0) {
        // 删除第一个播放地址
        playlist.segments.shift();
    }

// 将修改后的播放列表对象转换回M3U8文件内容
    const newM3u8Content = hlsParser.stringify(playlist);

    console.log(newM3u8Content);
}

var rule = {
    类型: '小说',
    title: '番茄小说[书]',
    desc: '番茄小说纯js版本',
    host: 'https://fanqienovel.com/',
    homeUrl: 'https://fanqienovel.com/api/author/book/category_list/v0/',
    url: '/api/author/library/book_list/v0/?page_count=18&page_index=(fypage-1)&gender=-1&category_id=fyclass&creation_status=-1&word_count=-1&sort=0#fyfilter',
    class_parse: async () => {
        log(btoa('123456'));
        log(misc.randMAC());
        log(getRandomFromList(['drpy', 'drpyS', 'hipy']));
        log('oheaders:', oheaders)
        log('rule_fetch_params:', rule_fetch_params)
        log('type of batchFetch:', batchFetch)
        testHls()
        // return {}
    },
    headers: {
        'User-Agent': 'PC_UA',
    },
    预处理: async () => {
    },
    推荐1: async () => {
        // globalThis.fetch_params = {'ua':'xxxx'} // 移除fetch_params,因为不能局部变量，全局变量会导致串数据
        // let html = await request('https://www.baidu.com/')
        // log(html)
        log(typeof RULE_CK, RULE_CK);
        log(typeof RKEY, RKEY);
        log('getItem:', typeof getItem);
        log('setItem:', typeof setItem);
        log('fetch:', typeof fetch);
        log('jsp:', typeof jsp);
        log('pdfh:', typeof pdfh);
        // setItem(RULE_CK, 'dd僵尸大时代');
        log(getItem(RULE_CK));
        log(jsp.MY_URL);
        log(rule.host);
        return []
    },
    一级: async (tid, pg, filter, extend) => {
        console.log(input);
        console.log({tid, pg, filter, extend});
        console.log(rule.host);
        console.log(rule.host.rstrip('/'));
    },
    二级: async () => {
        return '这是二级:' + rule.title
    },
    搜索: async () => {
        return '这是搜索:' + rule.title
    },
    lazy: async () => {
        return template.getMubans()
    },
};
