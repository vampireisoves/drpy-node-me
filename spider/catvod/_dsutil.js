import {Crypto, cheerio} from "assets://js/lib/cat.js";

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36';
const PC_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36';
const UA = 'Mozilla/5.0';
const UC_UA = 'Mozilla/5.0 (Linux; U; Android 9; zh-CN; MI 9 Build/PKQ1.181121.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.108 UCBrowser/12.5.5.1035 Mobile Safari/537.36';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

// T3 java注入joinUrl函数
if (typeof joinUrl !== 'function') {
    globalThis.joinUrl = (from, to) => {
        const resolvedUrl = new URL(to, new URL(from, 'resolve://'));
        if (resolvedUrl.protocol === 'resolve:') {
            const {pathname, search, hash} = resolvedUrl;
            return pathname + search + hash;
        }
        return resolvedUrl.href;
    };
}

function urljoin(fromPath, nowPath) {
    fromPath = fromPath || '';
    nowPath = nowPath || '';
    return joinUrl(fromPath, nowPath);
}

// T3 java注入req函数
async function request(url, obj) {
    if (!obj) {
        obj = {
            headers: {'user-agent': MOBILE_UA},
        }
    }
    try {
        return (await req(url, obj)).content;
    } catch (e) {
        console.error(`请求${url}错误:${e.message}`);
        return ''
    }
}

async function $css(html) {
    return cheerio.load(html)
}

function parseList($, host, listItems) {
    const d = [];

    listItems.each((index, element) => {
        const item = $(element);

        // 提取数据
        const vod_name = item.find('a').attr('title');
        const vod_id = urljoin(host, item.find('a').attr('href'));
        const vod_pic = item.find('.stui-vodlist__thumb').attr('data-original');
        const vod_remarks = item.find('.pic-text').text().trim(); // 使用.text()而不是.attr()

        d.push({
            vod_name,
            vod_id,
            vod_pic,
            vod_remarks
        });
    });
    return d
}

function parseDetail($, host, vod_id) {
    const tabs = [];
    const lists = [];
    // 获取线路名称列表
    $('.nav-tabs li').each((index, element) => {
        const item = $(element);
        const tab_name = item.find('a').text().replace(/\s/g, '');
        tabs.push(tab_name);
    });
    // 循环每个线路，构造最终播放列表
    $('.tab-content .stui-content__playlist').each((index, element) => {
        const item = $(element);
        const list1 = [];
        item.find('li').each((index1, element1) => {
            const item1 = $(element1);
            const title = item1.find('a').text().replace(/\s/g, '');
            const href = urljoin(host, item1.find('a').attr('href'));
            list1.push(`${title}$${href}`);
        });
        lists.push(list1.join('#'));
    });

    let vod = {
        vod_id: vod_id,
        // vod_name: $('h1.title').text().replace(/\s/g, ''),
        vod_name: $('.stui-content__thumb a').attr('title'),
        type_name: $('.stui-content__detail p:eq(1) a:eq(0)').text().replace(/\s/g, ''),
        vod_pic: $('.stui-vodlist__thumb img').attr('data-original').replace(/\s/g, ''),
        vod_content: $('.stui-content__detail p:eq(4)').text().replace(/\s/g, '').slice(0, -2),
        vod_play_from: tabs.join('$$$'),
        vod_play_url: lists.join('$$$'),
    };
    return vod;
}

function tellIsJx(url) {
    // 是否大厂
    const isDc = function (vipUrl) {
        let flag = new RegExp('qq\.com|iqiyi\.com|youku\.com|mgtv\.com|bilibili\.com|sohu\.com|ixigua\.com|pptv\.com|miguvideo\.com|le\.com|1905\.com|fun\.tv');
        return flag.test(vipUrl);
    }
    try {
        let is_vip = !/\.(m3u8|mp4|m4a)$/.test(url.split('?')[0]) && isDc(url);
        return is_vip ? 1 : 0
    } catch (e) {
        return 1
    }
}

function base64Encode(text) {
    return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text));
}

function base64Decode(text) {
    return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text));
}

async function lazy(input) {
    const result = {
        parse: 1,
        url: input,
    };
    // console.log('base64Encode:',base64Encode(JSON.stringify(result)));
    try {
        let html = await request(input);
        let hconf = html.match(/r player_.*?=(.*?)</)[1];
        // let json = JSON5.parse(hconf);
        let json = JSON.parse(hconf);
        let url = json.url;
        if (json.encrypt == '1') {
            url = unescape(url);
        } else if (json.encrypt == '2') {
            url = unescape(base64Decode(url));
        }
        if (/\.(m3u8|mp4|m4a|mp3)/.test(url)) {
            input = {
                parse: 0,
                jx: 0,
                url: url,
            };
        } else {
            input = url && url.startsWith('http') && tellIsJx(url) ? {parse: 0, jx: 1, url: url} :
                result;
        }
        return input
    } catch (e) {
        console.log(`lazy执行发生错误: ${e.message}`);
        return result
    }
}

export {
    urljoin,
    request,
    $css,
    parseList,
    parseDetail,
    base64Encode,
    base64Decode,
    lazy,
    cheerio,
    Crypto as CryptoJS
}