/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '凡客TV',
  lang: 'ds'
})
*/

var rule = {
  类型: '影视',
  title: '凡客TV',
  desc: '源动力出品',
  host: 'https://fktv.me',
  url: '/channel?page=fypage&cat_id=fyclass&order=new&page_size=32',
  searchUrl: '/channel?page=fypage&keywords=**&page_size=32&order=new',
  searchable: 2,
  quickSearch: 0,
  timeout: 5000,
  play_parse: true,
  filterable: 0,
  class_name: '电影&电视剧&动漫&综艺&短剧&纪录片&解说&音乐',
  class_url: '1&2&4&3&8&6&7&5',
  预处理: async () => {
    return []
  },
  推荐: async function (tid, pg, filter, extend) {
    const { input, pdfa, pdfh, pd, getProxyUrl } = this;
    const html = await request(input);
    const d = [];
    const data = pdfa(html, '.video-wrap .list-wrap .item-wrap');

    data.forEach((it) => {
      const img = pdfh(it, '.normal-wrap .bg-cover&&data-src');

      d.push({
        title: pdfh(it, '.meta-wrap a&&Text'),
        pic_url: getProxyUrl() + '&url=' + base64Encode(encodeURIComponent(img)),
        desc: pdfh(it, '.meta-wrap .category&&Text'),
        url: pdfh(it, '.meta-wrap a&&href'),
      })
    });

    return setResult(d);
  },
  一级: async function (tid, pg, filter, extend) {
    const { input, pdfa, pdfh, pd, getProxyUrl } = this;
    const html = await request(input);
    const d = [];
    const data = pdfa(html, '.video-wrap .list-wrap .item-wrap');

    data.forEach((it) => {
      const img = pdfh(it, '.normal-wrap .bg-cover&&data-src');

      d.push({
        title: pdfh(it, '.meta-wrap a&&Text'),
        pic_url: getProxyUrl() + '&url=' + base64Encode(encodeURIComponent(img)),
        desc: pdfh(it, '.meta-wrap .category&&Text'),
        url: pdfh(it, '.meta-wrap a&&href'),
      })
    });

    return setResult(d);
  },
  二级: async function (ids) {
    const { input, pdfa, pdfh, pd, getProxyUrl } = this;
    const html = await request(`${rule.host}${ids[0]}`);
    const img = pdfh(html, '.info-more .meta-wrap .thumb&&data-src');

    const vod = {
      vod_id: ids[0],
      vod_name: pdfh(html, '.tab-body h1.title&&Text'),
      vod_pic: getProxyUrl() + '&url=' + base64Encode(encodeURIComponent(img)),
      vod_content: pdfh(html, '.info-more .desc&&Text'),
      vod_remarks: pdfh(html, '.info-more .meta-wrap .mb-2&&Text'),
      type_name: pdfh(html, '.info-more .meta-wrap .tag-list a&&Text')
    };
    let playFroms = [];
    let playUrls = [];

    const tmpFroms = {};
    const playList = pdfa(html, '.line-header .item-wrap');
    playList.forEach((it) => {
      const line = pdfh(it, 'div&&data-line');
      const name = pdfh(it, 'div&&Text');
      playFroms.push(name);
      tmpFroms[line] = name;
    });

    const tmpIndexs = {};
    const indexList = pdfa(html, '.line-list .anthology-list .inner-wrap .item-wrap');
    indexList.forEach((it) => {
      const index = pdfh(it, 'span.number&&Text');
      const url = pdfh(it, 'div&&data-id');
      tmpIndexs[index] = url;
    });

    for (item1 in tmpFroms) {
      const tmpUrls = [];
      for (item2 in tmpIndexs) {
        const newIndex = `${item1}-${ids[0]}-${tmpIndexs[item2]}`;
        tmpUrls.push(`${item2}$${newIndex}`);
      }
      playUrls.push(tmpUrls.join('#'));
    }
    vod.vod_play_from = playFroms.join('$$$');
    vod.vod_play_url = playUrls.join('$$$');

    return vod;
  },
  搜索: async function (wd, quick, pg) {
    const { input, pdfa, pdfh, pd, getProxyUrl } = this;
    const html = await request(input);
    const d = [];
    const data = pdfa(html, '.video-wrap .list-wrap .item-wrap');

    data.forEach((it) => {
      const img = pdfh(it, '.normal-wrap .bg-cover&&data-src');
      d.push({
        title: pdfh(it, '.meta-wrap a&&Text'),
        pic_url: getProxyUrl() + '&url=' + base64Encode(encodeURIComponent(img)),
        desc: pdfh(it, '.meta-wrap .category&&Text'),
        url: pdfh(it, '.meta-wrap a&&href'),
      })
    });
    return setResult(d);
  },
  lazy: async function (flag, id, flags) {
    const { input, pdfa, pdfh, pd } = this;
    const [vod_from, vod_id, vod_url] = id.split("-");
    const detailUrl = `${rule.host}${vod_id}`;
    const cookie = rule.generateCookie();
    const html = await request(detailUrl, {
      method: 'POST',
      headers: {
        "Content-Type": 'application/x-www-form-urlencoded; charset=UTF-8',
        origin: 'https://fktv.me',
        referer: detailUrl,
        cookie: cookie
      },
      data: `link_id=${vod_url}&is_switch=1`
    });
    const response = JSON.parse(html);

    if (response.data.play_error !== '') {
      return { parse: 1, url: detailUrl }
    };

    const list = response.data.play_links;
    const item = list.find((item) => item.id === vod_from);
    const playUrl = `${rule.host}${item.m3u8_url}`;

    if (/m3u8|mp4/.test(playUrl)) {
      return { parse: 0, url: playUrl }
    } else {
      return { parse: 1, url: detailUrl }
    }
  },
  proxy_rule: async function () {
    const { input } = this;
    const rawInput = input.replace(/ /g, '+');
    const url = decodeURIComponent(base64Decode(rawInput));
    if (input) {
      const img_base64 = await rule.decodeImg(url);
      return [200, 'image/png', img_base64, null, 1];
    }
  },
  generateCookie: function () {
    const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz102345678";
    const a = t.length;
    let n = "";
    for (let i = 0; i < 32; i++) {
      n += t.charAt(Math.floor(Math.random() * a));
    }
    const cookie = `_did=${n}`;
    return cookie;
  },
  imgDecrypt: function (data) {
    // 将 Uint8Array 转为 WordArray
    const len = data.length;
    const words = [];
    for (let i = 0; i < len; i++) {
      words[i >>> 2] |= (data[i] & 0xff) << (24 - (i % 4) * 8);
    }
    const newdata = CryptoJS.lib.WordArray.create(words, len);

    const lkey = eval(
      (function (p, a, c, k, e, d) {
        e = function (c) {
          return (
            (c < a ? "" : e(parseInt(c / a))) +
            ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36))
          );
        };
        if (!"".replace(/^/, String)) {
          while (c--) d[e(c)] = k[c] || e(c);
          k = [
            function (e) {
              return d[e];
            },
          ];
          e = function () {
            return "\\w+";
          };
          c = 1;
        }
        while (c--)
          if (k[c]) p = p.replace(new RegExp("\\b" + e(c) + "\\b", "g"), k[c]);
        return p;
      })(
        "b['\\0\\3\\9']['\\a\\4\\c\\8\\3\\1']['\\d\\4\\h\\i\\0']('\\6\\2\\6\\2\\7\\2\\e\\5\\1\\f\\5\\0\\7\\g\\1\\j')",
        20,
        20,
        "x65|x31|x32|x6e|x61|x39|x35|x30|x69|x63|x4c|CryptoJS|x74|x70|x66|x34|x36|x72|x73|x64".split(
          "|",
        ),
        0,
        {},
      ),
    );
    const b64data = newdata.toString(CryptoJS.enc.Base64);
    const decrypted = CryptoJS.AES.decrypt(b64data, lkey, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    //把解密后的对象再转为base64编码,这步是关键,跟解密文字不同
    const b64 = decrypted.toString(CryptoJS.enc.Base64);

    return `data:image/png;base64,${b64}`;
  },
  decodeImg: async function (url) {
    const response = await axios(url, {
      method: 'GET',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        origin: 'https://fktv.me',
        referer: 'https://fktv.me',
      },
      responseType: 'arraybuffer',
    });
    const uint8ArrayData = new Uint8Array(response.data);
    const base64 = rule.imgDecrypt(uint8ArrayData);
    return base64;
  }
}