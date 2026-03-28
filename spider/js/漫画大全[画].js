/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '漫画大全',
  '类型': '漫画',
  lang: 'ds'
})
*/

var rule = {
    title: '漫画大全',
    host: 'http://android.007ting.com',
    url: '/android_rest.action?typeId=fyclass&page=fypage&type=index&userId=0',
    detailUrl: '/android_rest.action?id=fyid&type=product&userId=userId',
    searchUrl: '/android_rest.action?type=search&userId=0&word=**',
    searchable: 2,
    quickSearch: 0,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9;MIX 2S Build/PKQ1.180729.001)"
    },
    timeout: 5000,
    class_name: '全部&热血&玄幻&恋爱&纯爱&都市&冒险&古风&穿越&搞笑&奇幻&萝莉&御姐&后宫&修真&耽美&动作&少年&霸总&生活&武侠&大女主&科幻&剧情&悬疑&韩漫&韩国&更新&新增',
    class_url: '0&1&2&3&32&4&5&6&7&8&10&11&12&13&14&15&16&17&19&20&25&26&27&28&29&30&33&34&35',
    play_parse: true,
    lazy: async function (flag, id, flags) {
        let result = `${flag}?${id}`.replace('在线观看-', '');
        let _id = result.split("?");
        let videoSign = md5(`-${_id[0]}-${_id[1]}-TcbmGhl247Bc-Rd-android`);
        let url = rule.host + '/android_rest.action';
        let params = `chapterId=${_id[1]}&videoSign=${videoSign}&id=${_id[0]}&type=imagesList`;
        let html = await post(url, {body: params});
        let imgList = html.parseX.imagesList.map((img) => {
            return img.imageURL
        });
        return {parse: 0, url: 'pics://' + imgList.join('&&')};
    },
    limit: 6,
    推荐: '',
    double: true,
    一级: async function (tid, pg, filter, extend) {
        let [url, params] = this.input.split('?');
        let html = await post(url, {body: params, headers: rule.headers});
        let items = html.parseX.itemsList;
        let d = [];
        items.forEach(function (item) {
            d.push({
                title: item.title,
                desc: item.subTitle,
                url: item.comicId,
                img: item.imageURL,
                content: item.updateMsg,
            })
        });
        return setResult(d)
    },
    二级: async function (ids) {
        let [url, params] = this.input.split('?');
        let html = await post(url, {body: params, headers: rule.headers});
        let json = html.parseX;
        let vod = {
            "vod_name": json.title,
            "vod_id": json.comicId,
            "vod_remarks": json.updateMsg,
            "vod_pic": json.imageURL,
            "vod_content": json.desc,
        };
        let playform = '在线观看-' + json.comicId;
        let playurls = [];
        json.chapterList.forEach(function (chapter) {
            playurls.push(chapter.partName + '$' + chapter.partId);
        });
        vod.vod_play_from = playform;
        vod.vod_play_url = playurls.join('#');
        return vod;
    },
    搜索: async function (wd, quick, pg) {
        let [url, params] = this.input.split('?');
        let html = await post(url, {body: params, headers: rule.headers});
        let items = html.parseX.searchList;
        let d = [];
        items.forEach(function (item) {
            d.push({
                title: item.title.replace(/\[.*/g, ""),
                desc: item.subTitle,
                url: item.comicId,
                img: item.imageURL,
                content: item.updateMsg,
            })
        });
        return setResult(d)
    },
}
