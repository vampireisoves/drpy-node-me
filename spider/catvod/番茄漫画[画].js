/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 0,
  title: '番茄漫画',
  '类型': '漫画',
  lang: 'ds'
})
*/
import cheerio from 'assets://js/lib/cheerio.min.js';

let HOST = 'https://qkfqapi.vv9v.cn';
let UA = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36"
};

async function request(url, obj) {
    if (!obj) {
        obj = {
            headers: UA,
            timeout: 5000
        }
    }
    const response = await req(url, obj);
    return response.content;
}

function init(cfg) {
    const ext = cfg.ext;
    console.log('番茄漫画源初始化');
    console.log('初始化完成');
}

async function home(filter) {
    try {
        let html = await request('https://qkfqapi.vv9v.cn/api/discover/style?tab=漫画&source_type=男频');
        let json = JSON.parse(html);
        let data = json.data;
        let d = [];
        data.forEach((it) => {
            if (it.url && it.url.trim() !== '') {
                d.push({
                    type_name: it.title,
                    type_id: it.url,
                });
            }
        });
        return JSON.stringify({
            'class': d
        });
    } catch (error) {
        console.log('home函数错误:', error);
    }
}


async function homeVod(params) {
    try {
        let url = HOST + '/api/discover?tab=漫画&type=7&gender=2&genre_type=110&page=1';
        let html = await request(url);
        let json = JSON.parse(html);

        if (json && json.data) {
            let data = json.data.data || json.data;
            let d = [];

            data.forEach((item) => {
                if (item && item.book_name) {
                    d.push({
                        vod_name: item.book_name,
                        vod_id: item.book_id || item.id,
                        vod_pic: item.thumb_url || item.cover,
                        vod_remarks: item.author || item.category || '',
                        vod_content: item.abstract || item.description || ''
                    });
                }
            });

            return JSON.stringify({
                list: d
            });
        }
    } catch (error) {
        console.log('首页推荐请求错误:', error);
    }
}

async function category(tid, pg, filter, extend) {
    try {
        let url = tid;
        let html = await request(url);
        let json = JSON.parse(html);

        if (json && json.data) {
            let data = json.data.data || json.data;
            let d = [];

            data.forEach((item) => {
                if (item && item.book_name) {
                    d.push({
                        vod_name: item.book_name,
                        vod_id: item.book_id || item.id,
                        vod_pic: item.thumb_url || item.cover,
                        vod_remarks: item.author || item.category || '',
                        vod_content: item.abstract || item.description || ''
                    });
                }
            });

            if (d.length > 0) {
                return JSON.stringify({
                    list: d,
                    page: pg,
                    pagecount: 999,
                    limit: 20,
                    total: 999
                });
            }
        }
    } catch (error) {
        console.log('分类请求错误:', error);
    }
}

async function detail(vod_url) {
    try {
        let detailUrl = HOST + '/api/detail?book_id=' + vod_url;
        let json = JSON.parse(await request(detailUrl));

        if (json?.data?.data) {
            let data = json.data.data;
            let vod = {
                vod_name: data.book_name || '',
                vod_id: vod_url,
                type_name: data.category || '',
                vod_pic: data.thumb_url || '',
                vod_content: data.abstract || '',
                vod_remarks: data.sub_info || '',
                vod_director: data.author || '',
                vod_play_from: '番茄漫画',
                vod_play_url: ''
            };

            let chapterUrl = HOST + '/api/book?book_id=' + vod_url;
            let chapterJson = JSON.parse(await request(chapterUrl));
            if (chapterJson?.data?.data) {
                let bookInfo = chapterJson.data.data;
                let list = bookInfo.chapterListWithVolume.flat();

                let urls = [];
                list.forEach((it) => {
                    if (it && it.title && it.itemId) {
                        urls.push(it.title + '$' + it.itemId + '@' + it.title);
                    }
                });
                vod.vod_play_url = urls.join('#');
            }

            return JSON.stringify({list: [vod]});
        }
    } catch (error) {
        console.log('详情请求错误:', error);
    }
}

async function play(flag, id, flags) {
    try {
        let itemId = id;
        let title = '';

        if (id.includes('@')) {
            let parts = id.split('@');
            itemId = parts[0];
            title = parts[1] || '';
        }

        let url = HOST + '/api/content?tab=漫画&item_id=' + itemId + '&show_html=0';
        let html = await request(url);
        let json = JSON.parse(html);
        let images = json.data.images;
        images = pdfa(images, 'img');
        let pics = [];
        images.forEach((img) => {
            let pic = pdfh(img, 'img&&src');
            pics.push(pic);
        });

        if (pics.length > 0) {
            return JSON.stringify({
                parse: 0,
                url: 'pics://' + pics.join('&&')
            });
        }
    } catch (error) {
        console.log('播放 请求错误:', error);
    }
}

async function search(wd, quick) {
    try {
        let searchUrl = HOST + '/api/search?key=' + encodeURIComponent(wd) + '&tab_type=8&offset=0';
        let html = await request(searchUrl);
        let json = JSON.parse(html);

        if (json && json.data) {
            let searchTabs = json.data.search_tabs || [];
            let bookList = [];

            if (searchTabs.length > 3 && searchTabs[3].data) {
                bookList = searchTabs[3].data;
            } else if (json.data.data) {
                bookList = json.data.data;
            }

            let d = [];
            bookList.forEach((item) => {
                let book = item.book_data ? item.book_data[0] : item;
                if (book && book.book_name) {
                    d.push({
                        vod_name: book.book_name,
                        vod_id: book.book_id,
                        vod_pic: book.thumb_url || '',
                        vod_remarks: book.author || '',
                        vod_content: book.book_abstract || book.abstract || ''
                    });
                }
            });

            return JSON.stringify({
                list: d
            });
        }
    } catch (error) {
        console.log('搜索请求错误:', error);
    }
}

function proxy(params) {
    return [200, 'text/plain;charset=utf-8', '番茄漫画源代理测试', null];
}

export default {
    init: init,
    home: home,
    homeVod: homeVod,
    category: category,
    detail: detail,
    play: play,
    search: search,
    proxy: proxy,
}