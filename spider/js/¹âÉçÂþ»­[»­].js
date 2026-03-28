/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '光社漫画',
  author: 'EylinSir',
  '类型': '漫画',
  logo: 'https://m.g-mh.org/favicon.ico',
  lang: 'ds'
})
*/

var rule = {
    类型: '漫画',
    author: 'EylinSir',
    title: '光社漫画',
    host: 'https://m.g-mh.org',
    url: '/manga-genre/fyclass/page/fypage',
    searchUrl: '/s/**?page=fypage',
    logo: 'https://m.g-mh.org/favicon.ico',
    searchable: 2,
    quickSearch: 0,
    timeout: 5000,
    play_parse: true,
    class_name: '热门&国漫&韩漫&日漫&欧美&其他',
    class_url: 'hots&cn&kr&jp&ou-mei&qita',
    headers: {
        'User-Agent': 'PC_UA',
        'Referer': 'https://m.g-mh.org/'
    },

    _parse: function(html) {
        return (html.match(/<a href=["']\/manga\/[^"']+["'][\s\S]+?<h3[\s\S]+?<\/h3>/g) || []).map(it => {
            let img = it.match(/src=["']([^"']+)["']/)[1];
            let descMatch = it.match(/<p class=["']slicardtitlep["'][\s\S]*?>([\s\S]*?)<\/p>/);
            let originalImgUrl = img.startsWith('http') ? img : this.host + img;
            let jpgImgUrl = 'https://wsrv.nl/?url=' + encodeURIComponent(originalImgUrl) + '&output=jpg';
            return {
                title: it.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1].trim(),
                img: jpgImgUrl,
                url: it.match(/href=["']([^"']+)["']/)[1],
                desc: descMatch ? descMatch[1].trim() : ''
            };
        });
    },

    一级: async function(tid, pg, filter, extend) {
        return setResult(this._parse(await request(this.input, { headers: this.headers })));
    },

    推荐: async function(tid, pg, filter, extend) {
        return setResult(this._parse(await request(this.input, { headers: this.headers })));
    },

   二级: async function(ids) {
        let html = await request(this.input, { headers: this.headers });
        let mid = (html.match(/data-mid=["'](\d+)["']/) || html.match(/mid\s*:\s*["']?(\d+)["']?/))[1];
        let json = JSON.parse(await request(`https://api-get-v3.mgsearcher.com/api/manga/get?mid=${mid}&mode=all`, { headers: this.headers }));
        let chapters = json.data.chapters || json.data.data.chapters;
        return {
            vod_id: ids[0],
            vod_name: pdfh(html, 'h1&&Text'),
            vod_pic: pdfh(html, '.rounded-lg img&&src'),
            vod_content: pdfh(html, '.text-medium&&Text'),
            type_name: "漫画",
            vod_play_from: "光社漫画",
            vod_play_url: chapters.map(ch => {
                return `${ch.attributes?.title || 'Chapter ' + ch.id}$https://api-get-v3.mgsearcher.com/api/chapter/getinfo?m=${mid}&c=${ch.id}`;
            }).join("#")
        };
    },

    搜索: async function(wd, quick, pg) {
        return setResult(this._parse(await request(this.input, { headers: this.headers })));
    },

    lazy: async function(flag, id, flags) {
        let data = JSON.parse(await request(id, { headers: this.headers }));
        let images = data.data.info.images.images.map(img => 
            img.url.startsWith('http') ? img.url : "https://f40-1-4.g-mh.online" + img.url
        );
        return {
            parse: 0,
            url: "pics://" + images.join("&&"),
            header: this.headers
        };
    }
};
