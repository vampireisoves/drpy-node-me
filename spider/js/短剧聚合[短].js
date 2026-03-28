/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '聚合短剧[短]',
  author: 'EylinSir',
  '类型': '短剧',
  lang: 'ds'
})
*/

globalThis.aggConfig = {
  keys: 'd3dGiJc651gSQ8w1',
  charMap: {
    '+': 'P', '/': 'X', '0': 'M', '1': 'U', '2': 'l', '3': 'E', '4': 'r', '5': 'Y', '6': 'W', '7': 'b', '8': 'd', '9': 'J',
    'A': '9', 'B': 's', 'C': 'a', 'D': 'I', 'E': '0', 'F': 'o', 'G': 'y', 'H': '_', 'I': 'H', 'J': 'G', 'K': 'i', 'L': 't',
    'M': 'g', 'N': 'N', 'O': 'A', 'P': '8', 'Q': 'F', 'R': 'k', 'S': '3', 'T': 'h', 'U': 'f', 'V': 'R', 'W': 'q', 'X': 'C',
    'Y': '4', 'Z': 'p', 'a': 'm', 'b': 'B', 'c': 'O', 'd': 'u', 'e': 'c', 'f': '6', 'g': 'K', 'h': 'x', 'i': '5', 'j': 'T',
    'k': '-', 'l': '2', 'm': 'z', 'n': 'S', 'o': 'Z', 'p': '1', 'q': 'V', 'r': 'v', 's': 'j', 't': 'Q', 'u': '7', 'v': 'D',
    'w': 'w', 'x': 'n', 'y': 'L', 'z': 'e'
  },
  headers: {
    default: { 'User-Agent': 'okhttp/3.12.11', 'content-type': 'application/json; charset=utf-8' }
  },
  platform: {
    百度: { host: 'https://api.jkyai.top', url1: '/API/bddjss.php?name=fyclass&page=fypage', url2: '/API/bddjss.php?id=fyid', search: '/API/bddjss.php?name=**&page=fypage' },
    甜圈: { host: 'https://mov.cenguigui.cn', url1: '/duanju/api.php?classname', url2: '/duanju/api.php?book_id', search: '/duanju/api.php?name' },
    锦鲤: { host: 'https://api.jinlidj.com', search: '/api/search', url2: '/api/detail' },
    番茄: { host: 'https://reading.snssdk.com', url1: '/reading/bookapi/bookmall/cell/change/v', url2: 'https://fqgo.52dns.cc/catalog', search: 'https://fqgo.52dns.cc/search' },
    星芽: { host: 'https://app.whjzjx.cn', url1: '/cloud/v2/theater/home_page?theater_class_id', url2: '/v2/theater_parent/detail', search: '/v3/search', loginUrl: 'https://u.shytkjgs.com/user/v1/account/login' },
    西饭: { host: 'https://xifan-api-cn.youlishipin.com', url1: '/xifan/drama/portalPage', url2: '/xifan/drama/getDuanjuInfo', search: '/xifan/search/getSearchList' },
    软鸭: { host: 'https://api.xingzhige.com', url1: '/API/playlet', search: '/API/playlet' },
    七猫: { host: 'https://api-store.qmplaylet.com', url1: '/api/v1/playlet/index', url2: 'https://api-read.qmplaylet.com/player/api/v1/playlet/info', search: '/api/v1/playlet/search' },
    围观: { host: 'https://api.drama.9ddm.com', url1: '/drama/home/shortVideoTags', url2: '/drama/home/shortVideoDetail', search: '/drama/home/search' },
    红果: { host: 'https://api.cenguigui.cn', url1: '/api/duanju/api.php?name=fyclass&page=fypage', url2: '/api/duanju/api.php?book_id=fyid', search: '/api/duanju/api.php?name=**&page=fypage', homeUrl: '/api/duanju/api.php?name=新剧' }
  },
  platformList: [
    { name: '七猫短剧', id: '七猫' }, { name: '番茄短剧', id: '番茄' }, //{ name: '红果短剧', id: '红果' },
    { name: '星芽短剧', id: '星芽' }, { name: '甜圈短剧', id: '甜圈' }, { name: '锦鲤短剧', id: '锦鲤' },
    { name: '西饭短剧', id: '西饭' }, { name: '软鸭短剧', id: '软鸭' }, { name: '围观短剧', id: '围观' }//,
   // { name: '百度短剧', id: '百度' }/*, { name: '牛牛短剧', id: '牛牛' }*/
  ],
  search: { limit: 30, timeout: 6000 }
};

// === 工具函数 ===
const guid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});
const encHex = txt => {
  const k = CryptoJS.enc.Utf8.parse("p0sfjw@k&qmewu#w");
  return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(txt), k, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }).ciphertext.toString(CryptoJS.enc.Hex);
};
const getPlatformConfig = id => globalThis.aggConfig.platform[id];

// === 七猫专用 ===
async function getQmParamsAndSign() {
  const sessionId = Math.floor(Date.now()).toString();
  const data = {
    "static_score": "0.8", "uuid": "00000000-7fc7-08dc-0000-000000000000",
    "device-id": "20250220125449b9b8cac84c2dd3d035c9052a2572f7dd0122edde3cc42a70",
    "mac": "", "sourceuid": "aa7de295aad621a6", "refresh-type": "0", "model": "22021211RC",
    "wlb-imei": "", "client-id": "aa7de295aad621a6", "brand": "Redmi", "oaid": "",
    "oaid-no-cache": "", "sys-ver": "12", "trusted-id": "", "phone-level": "H",
    "imei": "", "wlb-uid": "aa7de295aad621a6", "session-id": sessionId
  };
  const jsonStr = JSON.stringify(data);
  const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
  let qmParams = '';
  for (const c of base64Str) qmParams += globalThis.aggConfig.charMap[c] || c;
  const paramsStr = `AUTHORIZATION=app-version=10001application-id=com.duoduo.readchannel=unknownis-white=net-env=5platform=androidqm-params=${qmParams}reg=${globalThis.aggConfig.keys}`;
  return { qmParams, sign: await md5(paramsStr) };
}
async function getHeaderX() {
  const { qmParams, sign } = await getQmParamsAndSign();
  return {
    'net-env': '5', 'reg': '', 'channel': 'unknown', 'is-white': '', 'platform': 'android',
    'application-id': 'com.duoduo.read', 'authorization': '', 'app-version': '10001',
    'user-agent': 'webviewversion/0', 'qm-params': qmParams, 'sign': sign
  };
}

// === 主规则 ===
var rule = {
  类型: '短剧',
  title: '聚合短剧[短]',
  author: 'EylinSir',
  host: '',
  url: '',
  searchUrl: '*',
  searchable: 1,
  quickSearch: 1,
  filterable: 1,
  timeout: 5000,
  play_parse: true,
  search_match: true,
  headers: globalThis.aggConfig.headers.default,
  filter_url: '{{fl.area}}',
  filter: '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',
  filter_def: {
    百度: { area: '逆袭' }, 甜圈: { area: '推荐榜' }, 锦鲤: { area: '' }, 番茄: { area: 'videoseries_hot' },
    星芽: { area: '1' }, 西饭: { area: '' }, 软鸭: { area: '战神' }, 七猫: { area: '0' },
    围观: { area: '' }, 红果: { area: '系统' }
  },

  预处理: async function () {
    const cfg = globalThis.aggConfig;
    this.platforms = cfg.platformList.map(item => ({
      ...item,
      url: `${cfg.platform[item.id].host}${cfg.platform[item.id].url1}`
    }));
    try {
      const data = { 'device': '24250683a3bdb3f118dff25ba4b1cba1a' };
      const options = {
        method: 'POST',
        headers: { 'User-Agent': 'okhttp/4.10.0', 'platform': '1', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
      let html = await request(cfg.platform.星芽.loginUrl, options);
      const res = JSON.parse(html);
      const token = res?.data?.token || res?.data?.data?.token;
      this.xingya_headers = { ...rule.headers, authorization: token };
    } catch (e) {
      log(`星芽短剧token获取失败: ${e.message}`);
    }
  },

  class_parse: () => ({
    class: globalThis.aggConfig.platformList.map(item => ({
      type_id: item.id,
      type_name: item.name
    }))
  }),
  
  推荐: async function () {
      const cfg = globalThis.aggConfig;
      const randomPlat = cfg.platformList[Math.floor(Math.random() * cfg.platformList.length)];
      const platId = randomPlat.id;
      const defaultFilter = this.filter_def?.[platId] || {};
      const fakeContext = {
          MY_CATE: platId,
          MY_FL: defaultFilter,
          MY_PAGE: 1,           // 推荐只取第一页
    ...this
      };
      const result = await this.一级.call(fakeContext);
    return result;
  },

  一级: async function () {
    const { MY_CATE, MY_FL, MY_PAGE } = this;
    const area = MY_FL?.area || '';
    const plat = getPlatformConfig(MY_CATE);
    const cfg = globalThis.aggConfig;
    let d = [];
    const fetch = async (url, opt = {}) => JSON.parse(await request(url, { headers: this.headers, ...opt }));

    try {
      switch (MY_CATE) {
        case '百度':
          (await fetch(`${plat.host}${plat.url1.replace('fyclass', area).replace('fypage', MY_PAGE)}`)).data.forEach(it =>
            d.push({ title: it.title, img: it.cover, desc: '更新至' + it.totalChapterNum + '集', url: `百度@${it.id}` }));
          break;
        case '甜圈':
          (await fetch(`${plat.host}${plat.url1}=${area}&offset=${MY_PAGE}`)).data.forEach(it =>
            d.push({ title: it.title, img: it.cover, year: it.copyright, desc: it.sub_title, url: `甜圈@${it.book_id}` }));
          break;
        case '锦鲤':
          (await fetch(plat.host + plat.search, { method: 'POST', body: JSON.stringify({ page: MY_PAGE, limit: 24, type_id: area, year: '', keyword: '' }) })).data.list.forEach(item =>
            d.push({ title: item.vod_name || '', year: item.vod_year, desc: `${item.vod_total}集`, content: item.vod_tag, img: item.vod_pic, url: `锦鲤@${item.vod_id}` }));
          break;
        case '番茄': {
          const sessionId = new Date().toISOString().slice(0, 16).replace(/-|T:/g, '');
          let url = `${plat.host}${plat.url1}?change_type=0&selected_items=${area}&tab_type=8&cell_id=6952850996422770718&version_tag=video_feed_refactor&device_id=1423244030195267&aid=1967&app_name=novelapp&ssmix=a&session_id=${sessionId}`;
          if (MY_PAGE > 1) url += `&offset=${(MY_PAGE - 1) * 12}`;
          (await fetch(url)).data?.cell_view?.cell_data?.forEach(item => {
            const videoData = item.video_data?.[0] || item;
            d.push({ title: videoData.title || '未知短剧', img: videoData.cover || videoData.horiz_cover || '', desc: videoData.sub_title || videoData.rec_text || '', url: `番茄@${videoData.series_id || videoData.book_id || videoData.id || ''}` });
          });
          break;
        }
        case '星芽':
          (await fetch(`${plat.host}${plat.url1}=${area}&type=1&class2_ids=0&page_num=${MY_PAGE}&page_size=24`, { headers: this.xingya_headers })).data.list.forEach(it => {
            const id = `${plat.host}${plat.url2}?theater_parent_id=${it.theater.id}`;
            d.push({ title: it.theater.title, img: it.theater.cover_url, desc: `${it.theater.total}集`, content: `播放量:${it.theater.play_amount_str}`, url: `星芽@${id}` });
          });
          break;
        case '西饭': {
          const [typeId, typeName] = area.split('@');
          const ts = Math.floor(Date.now() / 1000);
          const url = `${plat.host}${plat.url1}?reqType=aggregationPage&offset=${(MY_PAGE - 1) * 30}&categoryId=${typeId}&quickEngineVersion=-1&scene=&categoryNames=${encodeURIComponent(typeName)}&categoryVersion=1&density=1.5&pageID=page_theater&version=2001001&androidVersionCode=28&requestId=${ts}aa498144140ef297&appId=drama&teenMode=false&userBaseMode=false&session=eyJpbmZvIjp7InVpZCI6IiIsInJ0IjoiMTc0MDY1ODI5NCIsInVuIjoiT1BHXzFlZGQ5OTZhNjQ3ZTQ1MjU4Nzc1MTE2YzFkNzViN2QwIiwiZnQiOiIxNzQwNjU4Mjk0In19&feedssession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dHlwIjowLCJidWlkIjoxNjMzOTY4MTI2MTQ4NjQxNTM2LCJhdWQiOiJkcmFtYSIsInZlciI6MiwicmF0IjoxNzQwNjU4Mjk0LCJ1bm0iOiJPUEdfMWVkZDk5NmE2NDdlNDUyNTg3Nzc1MTE2YzFkNzViN2QwIiwiZXhwIjoxNzQxMjYzMDk0LCJkYyI6Imd6cXkifQ.JS3QY6ER0P2cQSxAE_OGKSMIWNAMsYUZ3mJTnEpf-Rc`;
          (await fetch(url)).result.elements.forEach(soup => soup.contents.forEach(vod => {
            const dj = vod.duanjuVo;
            d.push({ title: dj.title, img: dj.coverImageUrl, desc: `${dj.total}集`, url: `西饭@${dj.duanjuId}#${dj.source}` });
          }));
          break;
        }
        case '软鸭':
          (await fetch(`${plat.host}${plat.url1}/?keyword=${encodeURIComponent(area)}&page=${MY_PAGE}`)).data.forEach(item => {
            const purl = `${item.title}@${item.cover}@${item.author}@${item.type}@${item.desc}@${item.book_id}`;
            d.push({ title: item.title, img: item.cover, desc: item.type, content: item.author, url: `软鸭@${encodeURIComponent(purl)}` });
          });
          break;
        case '七猫': {
          let signStr = `operation=1playlet_privacy=1tag_id=${area}${cfg.keys}`;
          const sign = await md5(signStr);
          const url = `${plat.host}${plat.url1}?tag_id=${area}&playlet_privacy=1&operation=1&sign=${sign}`;
          const headers = { ...await getHeaderX(), ...cfg.headers.default };
          (await fetch(url, { method: 'GET', headers })).data?.list?.forEach(item => {
            d.push({ title: item.title || '', img: item.image_link || '', desc: `${item.total_episode_num || 0}集`, content: item.tags, url: `七猫@${encodeURIComponent(item.playlet_id)}` });
          });
          break;
        }
        case '围观':
          (await fetch(`${plat.host}${plat.search}`, { method: 'POST', body: JSON.stringify({ "audience": "全部受众", "page": MY_PAGE, "pageSize": 30, "searchWord": "", "subject": "全部主题" }) })).data.forEach(it =>
            d.push({ title: it.title, img: it.vertPoster, year: it.publishDate?.toString() || '', desc: `集数:${it.episodeCount} 播放:${it.viewCount}`, remarks: it.description, url: `围观@${it.oneId}` }));
          break;
        case '红果':
          (await fetch(`${plat.host}${plat.url1.replace('fyclass', area).replace('fypage', MY_PAGE)}`)).data.forEach(item =>
            d.push({ title: item.title, img: item.cover, desc: `${item.total || 0}集`, url: `红果@${item.book_id}` }));
          break;
      }
    } catch (e) {
      log(`${MY_CATE}一级加载失败: ${e.message}`);
    }
    return setResult(d);
  },

  二级: async function () {
    const { orId } = this;
    if (orId === 'update_info') {
      return {
        vod_content: rule.update_info,
        vod_name: '更新日志',
        type_name: '更新日志',
        vod_pic: 'https://resource-cpd...（略）',
        vod_remarks: `版本:${rule.version}`,
        vod_play_from: '聚合短剧',
        vod_play_url: '随机小视频$http://api.yujn.cn/api/zzxjj.php'
      };
    }
    const [platform, ...rest] = orId.split('@');
    const id = rest.join('@');
    const cfg = globalThis.aggConfig;
    const plat = getPlatformConfig(platform);
    const fetch = async (url, opt = {}) => JSON.parse(await request(url, { headers: this.headers, ...opt }));
    let VOD = {};

    switch (platform) {
      case '百度':
        const res1 = await fetch(`${plat.host}${plat.url2.replace('fyid', id)}`);
        VOD = {
          vod_name: res1.title,
          vod_pic: res1.data[0].cover,
          vod_year: '更新至:' + res1.total + '集',
          vod_play_from: '百度短剧',
          vod_play_url: res1.data.map(item => `${item.title}$${item.video_id}`).join("#")
        };
        break;
      case '甜圈':
        const res2 = await fetch(`${plat.host}${plat.url2}=${id}`);
        VOD = {
          vod_name: res2.book_name, type_name: res2.category, vod_pic: res2.book_pic, vod_content: res2.desc,
          vod_remarks: res2.duration, vod_year: `更新时间:${res2.time}`, vod_actor: res2.author,
          vod_play_from: '甜圈短剧',
          vod_play_url: res2.data.map(item => `${item.title}$${item.video_id}`).join('#')
        };
        break;
      case '锦鲤':
        const res3 = await fetch(`${plat.host}${plat.url2}/${id}`);
        const list = res3.data;
        const playUrls = Object.keys(list.player).map(key => `${key}$${list.player[key]}`);
        VOD = {
          ...list,
          vod_id: list.vod_id || '暂无id', vod_name: list.vod_name || '暂无名称', type_name: list.vod_class || '暂无类型',
          vod_pic: list.vod_pic || '暂无图片', vod_remarks: list.vod_remarks || '暂无备注', vod_year: list.vod_year || '暂无年份',
          vod_area: list.vod_area || '暂无地区', vod_actor: list.vod_actor || '暂无演员',
          vod_director: list.vod_director || '暂无导演', vod_content: list.vod_blurb || '暂无剧情',
          vod_play_from: '锦鲤短剧', vod_play_url: playUrls.join('#')
        };
        break;
      case '番茄':
        const res4 = await fetch(`${plat.url2}?book_id=${id}`, { headers: cfg.headers.default });
        const bookInfo = res4.data.book_info;
        VOD = {
          vod_id: bookInfo.book_id,
          vod_name: bookInfo.book_name,
          vod_type: bookInfo.tags,
          vod_year: bookInfo.create_time,
          vod_pic: bookInfo.thumb_url || bookInfo.audio_thumb_uri,
          vod_content: bookInfo.abstract || bookInfo.book_abstract_v2,
          vod_remarks: bookInfo.sub_info || `更新至${res4.data.item_data_list.length}集`,
          vod_play_from: '番茄短剧',
          vod_play_url: res4.data.item_data_list.map(item => `${item.title}$${item.item_id}`).join('#')
        };
        break;
      case '星芽':
        const res5 = JSON.parse(await request(id, { headers: this.xingya_headers }));
        const data5 = res5.data;
        VOD = {
          vod_id: id,
          vod_name: data5.title,
          type_name: data5.score,
          vod_pic: data5.cover_url,
          vod_area: `收藏${data5.collect_number}`,
          vod_actor: `点赞${data5.like_num}`,
          vod_director: `评分${data5.score}`,
          vod_remarks: data5.desc_tags + '',
          vod_content: data5.introduction,
          vod_play_from: '星芽短剧',
          vod_play_url: data5.theaters.map(it => `${it.num}$${it.son_video_url}`).join('#')
        };
        break;
      case '西饭': {
        const [duanjuId, source] = id.split('#');
        const url = `${plat.host}${plat.url2}?duanjuId=${duanjuId}&source=${source}&openFrom=homescreen&type=&pageID=page_inner_flow&density=1.5&version=2001001&androidVersionCode=28&requestId=1740658944980aa498144140ef297&appId=drama&teenMode=false&userBaseMode=false&session=eyJpbmZvIjp7InVpZCI6IiIsInJ0IjoiMTc0MDY1ODI5NCIsInVuIjoiT1BHXzFlZGQ5OTZhNjQ3ZTQ1MjU4Nzc1MTE2YzFkNzViN2QwIiwiZnQiOiIxNzQwNjU4Mjk0In19&feedssession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dHlwIjowLCJidWlkIjoxNjMzOTY4MTI2MTQ4NjQxNTM2LCJhdWQiOiJkcmFtYSIsInZlciI6MiwicmF0IjoxNzQwNjU4Mjk0LCJ1bm0iOiJPUEdfMWVkZDk5NmE2NDdlNDUyNTg3Nzc1MTE2YzFkNzViN2QwIiwiZXhwIjoxNzQxMjYzMDk0LCJkYyI6Imd6cXkifQ.JS3QY6ER0P2cQSxAE_OGKSMIWNAMsYUZ3mJTnEpf-Rc`;
        const res6 = await fetch(url);
        VOD = {
          vod_name: res6.result.title,
          vod_pic: res6.result.coverImageUrl,
          vod_content: res6.result.desc || '未知',
          vod_remarks: res6.result.updateStatus === 'over' ? `${res6.result.total}集 已完结` : `更新${res6.result.total}集`,
          vod_play_from: '西饭短剧',
          vod_play_url: res6.result.episodeList.map(ep => `${ep.index}$${ep.playUrl}`).join('#')
        };
        break;
      }
      case '软鸭': {
        const did = decodeURIComponent(id);
        const [title, img, author, type, desc, book_id] = did.split('@');
        const res7 = await fetch(`${plat.host}${plat.url1}/?book_id=${book_id}`);
        VOD = {
          vod_name: title,
          vod_pic: img,
          vod_actor: author,
          vod_remarks: type,
          vod_content: desc,
          vod_play_from: '软鸭短剧',
          vod_play_url: (res7.data?.video_list || []).map(ep => `${ep.title}$${ep.video_id}`).join('#')
        };
        break;
      }
      case '七猫': {
        const did = decodeURIComponent(id);
        const sign = await md5(`playlet_id=${did}${cfg.keys}`);
        const url = `${plat.url2}?playlet_id=${did}&sign=${sign}`;
        const headers = { ...await getHeaderX(), ...cfg.headers.default };
        const res8 = await fetch(url, { method: 'GET', headers });
        VOD = {
          vod_name: res8.data.title || '未知标题',
          vod_pic: res8.data.image_link || '未知图片',
          vod_remarks: `${res8.data.tags} ${res8.data.total_episode_num}集`,
          vod_content: res8.data.intro || '未知剧情',
          vod_play_from: '七猫短剧',
          vod_play_url: res8.data.play_list.map(it => `${it.sort}$${it.video_url}`).join('#')
        };
        break;
      }
      case '围观': {
        const res10 = await fetch(`${plat.host}${plat.url2}?oneId=${id}&page=1&pageSize=1000`);
        const firstEpisode = res10.data[0];
        VOD = {
          vod_name: firstEpisode.title,
          vod_pic: firstEpisode.vertPoster,
          vod_remarks: `共${res10.data.length}集`,
          vod_content: `播放量:${firstEpisode.collectionCount} 评论:${firstEpisode.commentCount}`,
          vod_play_from: '围观短剧',
          vod_play_url: res10.data.map(episode => `${episode.title}第${episode.playOrder}集$${episode.playSetting}`).join('#')
        };
        break;
      }
      case '红果':
        const res12 = await fetch(`${plat.host}${plat.url2.replace('fyid', id)}`);
        VOD = {
          vod_name: res12.book_name || '红果短剧',
          vod_pic: res12.book_pic || '',
          vod_content: res12.desc || '',
          vod_remarks: `${res12.total || 0}集-${res12.duration || ''}`,
          vod_play_from: '红果短剧',
          vod_play_url: (res12.data || []).map(ep => `${ep.title}$${ep.video_id}`).join('#')
        };
        break;
    }
    return VOD;
  },

  搜索: async function (wd, quick, pg) {
    const { KEY, MY_PAGE } = this;
    const cfg = globalThis.aggConfig;
    const d = [];
    const timeout = cfg.search.timeout;
    const limit = cfg.search.limit;

    const tasks = cfg.platformList.map(async (p) => {
      try {
        const plat = cfg.platform[p.id];
        let results = [];

        switch (p.id) {
          case '百度':
            results = (JSON.parse(await request(`${plat.host}${plat.search.replace('**', encodeURIComponent(KEY)).replace('fypage', MY_PAGE)}`, { headers: this.headers, timeout }))).data?.map(it => ({ title: it.title, img: it.cover, year: '更新至' + it.totalChapterNum + '集', desc: `百度短剧 | ${it.title || '无简介'}`, url: `百度@${it.id}` })) || [];
            break;
          case '甜圈':
            results = (JSON.parse(await request(`${plat.host}${plat.search}=${encodeURIComponent(KEY)}&offset=${MY_PAGE}`, { headers: this.headers, timeout }))).data?.map(it => ({ title: it.title, img: it.cover, year: it.copyright || '未知', desc: `甜圈短剧 | ${it.sub_title || '无简介'}`, url: `甜圈@${it.book_id}` })) || [];
            break;
          case '锦鲤':
            results = (JSON.parse(await request(plat.host + plat.search, { method: 'POST', body: JSON.stringify({ page: MY_PAGE, limit, type_id: '', year: '', keyword: KEY }), timeout }))).data?.list?.map(it => ({ title: it.vod_name || '未知短剧', img: it.vod_pic || '', year: it.vod_year || '未知', desc: `锦鲤短剧 | ${it.vod_total || 0}集`, url: `锦鲤@${it.vod_id}` })) || [];
            break;
          case '番茄':
            results = (JSON.parse(await request(`${plat.search}?keyword=${encodeURIComponent(KEY)}&page=${MY_PAGE}`, { timeout }))).data?.map(it => ({ title: it.title || '未知标题', img: it.cover || '', year: '未知', desc: `番茄短剧 | ${it.sub_title || '无简介'}`, url: `番茄@${it.series_id || ''}` })) || [];
            break;
          case '星芽': {
            const res = JSON.parse(await request(plat.host + plat.search, { method: 'POST', headers: this.xingya_headers, body: JSON.stringify({ text: KEY }), timeout }));
            results = res.data?.theater?.search_data?.map(it => ({ title: it.title, desc: `星芽短剧 | ${it.total || 0}集`, img: it.cover_url || '', content: it.introduction || '', url: `星芽@${plat.host}${plat.url2}?theater_parent_id=${it.id}` })) || [];
            break;
          }
          case '西饭': {
            const ts = Math.floor(Date.now() / 1000);
            const url = `${plat.host}${plat.search}?reqType=search&offset=${(MY_PAGE - 1) * limit}&keyword=${encodeURIComponent(KEY)}&quickEngineVersion=-1&scene=&categoryVersion=1&density=1.5&pageID=page_theater&version=2001001&androidVersionCode=28&requestId=${ts}aa498144140ef297&appId=drama&teenMode=false&userBaseMode=false&session=eyJpbmZvIjp7InVpZCI6IiIsInJ0IjoiMTc0MDY1ODI5NCIsInVuIjoiT1BHXzFlZGQ5OTZhNjQ3ZTQ1MjU4Nzc1MTE2YzFkNzViN2QwIiwiZnQiOiIxNzQwNjU4Mjk0In19&feedssession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dHlwIjowLCJidWlkIjoxNjMzOTY4MTI2MTQ4NjQxNTM2LCJhdWQiOiJkcmFtYSIsInZlciIowiwicmF0IjoxNzQwNjU4Mjk0LCJ1bm0iOiJPUEdfMWVkZDk5NmE2NDdlNDUyNTg3Nzc1MTE2YzFkNzViN2QwIiwiZXhwIjoxNzQxMjYzMDk0LCJkYyI6Imd6cXkifQ.JS3QY6ER0P2cQSxAE_OGKSMIWNAMsYUZ3mJTnEpf-Rc`;
            results = (JSON.parse(await request(url, { headers: cfg.headers.default, timeout }))).result?.elements?.map(vod => {
              const dj = vod.duanjuVo || {};
              return { title: dj.title || '未知标题', img: dj.coverImageUrl || '', year: '未知', desc: `西饭短剧 | ${dj.total || 0}集`, url: `西饭@${dj.duanjuId || ''}#${dj.source || ''}` };
            }).filter(x => x.title !== '未知标题') || [];
            break;
          }
          case '软鸭':
            results = (JSON.parse(await request(`${plat.host}${plat.search}/?keyword=${encodeURIComponent(KEY)}&page=${MY_PAGE}`, { headers: cfg.headers.default, timeout }))).data?.map(item => {
              const purl = `${item.title}@${item.cover}@${item.author}@${item.type}@${item.desc}@${item.book_id}`;
              return { title: item.title, img: item.cover, year: '未知', desc: `软鸭短剧 | ${item.type || '无分类'}`, url: `软鸭@${encodeURIComponent(purl)}` };
            }) || [];
            break;
          case '七猫': {
            let signStr = `operation=2playlet_privacy=1search_word=${KEY}${cfg.keys}`;
            const sign = await md5(signStr);
            const headers = { ...await getHeaderX(), ...cfg.headers.default };
            const res = JSON.parse(await request(`${plat.host}${plat.search}?search_word=${encodeURIComponent(KEY)}&playlet_privacy=1&operation=2&sign=${sign}`, { method: 'GET', headers, timeout }));
            results = res.data?.list?.map(item => ({ title: item.title || '未知标题', img: item.image_link || '', year: '未知', desc: `七猫短剧 | ${item.tags} ${item.total_episode_num || 0}集`, url: `七猫@${encodeURIComponent(item.playlet_id)}` })) || [];
            break;
          }
          case '围观':
            results = (JSON.parse(await request(`${plat.host}${plat.search}`, { method: 'POST', body: JSON.stringify({ "audience": "", "page": MY_PAGE, "pageSize": limit, "searchWord": KEY, "subject": "" }), timeout }))).data?.map(it => ({ title: it.title || '未知标题', img: it.vertPoster || '', year: it.publishDate?.toString() || '', desc: `围观短剧 | 集数:${it.episodeCount || 0} 播放:${it.viewCount || 0}`, remarks: it.description || '', url: `围观@${it.oneId || ''}` })) || [];
            break;
          case '红果':
            results = (JSON.parse(await request(`${plat.host}${plat.search.replace('**', encodeURIComponent(KEY)).replace('fypage', MY_PAGE)}`, { headers: this.headers, timeout }))).data?.map(item => ({ title: item.title || '未知标题', img: item.cover || '', year: '未知', desc: `红果短剧 | ${item.total || 0}集`, url: `红果@${item.book_id || ''}` })) || [];
            break;
        }
        return results;
      } catch (e) {
        log(`搜索失败（平台：${p.name}）：${e.message}`);
        return [];
      }
    });

    const results = (await Promise.allSettled(tasks))
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);
    return setResult(rule.search_match ? results.filter(i => (i.title || '').toLowerCase().includes(KEY.toLowerCase())) : results);
  },

  lazy: async function (flag, id, flags) {
    const { input } = this;
    const cfg = globalThis.aggConfig;
    const plat = cfg.platform;
    const headers = this.headers;

    if (/百度/.test(flag)) {
      const item = JSON.parse(await request(`https://api.jkyai.top/API/bddjss.php?video_id=${input}`));
      const qualityOrder = ["1080p", "sc", "sd"];
      const qualityNames = { "1080p": "蓝光", "sc": "超清", "sd": "标清" };
      let urls = [];
      qualityOrder.forEach(q => {
        let quality = item.data.qualities.find(x => x.quality === q);
        if (quality) urls.push(qualityNames[q], quality.download_url);
      });
      return { parse: 0, url: urls };
    }
    if (/甜圈/.test(flag)) return { parse: 0, url: `https://mov.cenguigui.cn/duanju/api.php?video_id=${input}&type=mp4` };
    if (/锦鲤/.test(flag)) {
      const html = await request(`${input}&auto=1`, { headers: { referer: 'https://www.jinlidj.com/' } });
      const match = html.match(/let data\s*=\s*({[^;]*});/);
      return { parse: 0, url: JSON.parse(match[1]).url };
    }
    if (/番茄/.test(flag)) {
      const res = JSON.parse(await request(`https://fqgo.52dns.cc/video?item_ids=${input}`, { headers: cfg.headers.default }));
      const videoModel = res.data?.[input] ? JSON.parse(res.data[input].video_model) : null;
      const url = videoModel?.video_list?.video_1 ? atob(videoModel.video_list.video_1.main_url) : '';
      return { parse: 0, url };
    }
    if (/软鸭/.test(flag)) {
      const res = JSON.parse(await request(`${plat.软鸭.host}/API/playlet/?video_id=${input}&quality=1080p`, { headers }));
      return { parse: 0, url: res.data?.video?.url || '' };
    }
    if (/围观/.test(flag)) {
      let setting;
      try { setting = typeof input === 'string' ? JSON.parse(input) : input; } catch (e) { return { parse: 0, url: input }; }
      let urls = [];
      if (setting.super) urls.push("超清", setting.super);
      if (setting.high) urls.push("高清", setting.high);
      if (setting.normal) urls.push("流畅", setting.normal);
      return { parse: 0, url: urls };
    }
    if (/红果/.test(flag)) {
      const res = JSON.parse(await request(`${plat.红果.host}/api/duanju/api.php?video_id=${input}`, { headers }));
      return { parse: 0, url: res.data?.url || input };
    }
    return { parse: 0, url: input };
  }
};