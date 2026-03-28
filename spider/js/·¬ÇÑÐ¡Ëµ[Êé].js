/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '番茄小说[书]',
  author: '道长',
  '类型': '小说',
  logo: 'https://www.18zf.net/d/file/p/2023/1107/3ty5orktxrc.jpg',
  lang: 'ds'
})
*/

//fix by https://github.com/hunyanjie/FQWeb,https://github.com/POf-L/Fanqie-novel-Downloader
// http://localhost:5757/api/番茄小说[书]?ac=list&t=主分类&pg=1
// http://localhost:5757/api/番茄小说[书]?ac=detail&ids=https://fanqienovel.com/page/7431786294105099289
// http://localhost:5757/api/番茄小说[书]?wd=斩神&pg=2
// http://localhost:5757/api/番茄小说[书]?play=7432172914662720025&flag=番茄小说

// 对接API:https://qkfqapi.vv9v.cn/docs
// https://github.com/POf-L/Fanqie-novel-Downloader/blob/main/novel_downloader.py

const {getRandomFromList} = $.require('./_lib.random.js');
const {requestHtml} = $.require('./_lib.request.js');
// const fqweb_host = 'http://fqweb.jsj66.com';
// const fqweb_host = 'http://fanqie.mduge.com';
// const fqweb_host = 'https://qkfqapi.vv9v.cn';
const fqweb_host = 'http://101.35.133.34:5000';
// const fqweb_host = 'http://101.35.133.34:5000/docs'; //备选
// const fqweb_host = 'http://103.236.91.147:9999/docs'; //备选
// const fqweb_host = 'http://47.108.80.161:5005/docs'; //备选
// const fqweb_host = 'http://140.143.165.56:9999/docs'; //备选
// const fqweb_host = 'http://8.148.83.169:22222/docs'; //备选

var rule = {
    author: '道长',
    类型: '小说',
    title: '番茄小说[书]',
    desc: '番茄小说纯js版本',
    host: 'https://fanqienovel.com/',
    logo: 'https://www.18zf.net/d/file/p/2023/1107/3ty5orktxrc.jpg',
    homeUrl: 'https://fanqienovel.com/api/author/book/category_list/v0/',
    url: '/api/author/library/book_list/v0/?page_count=18&page_index=(fypage-1)&gender=1&category_id=fyclass&creation_status=-1&word_count=-1&book_type=-1&sort=0#fyfilter',
    // searchUrl: fqweb_host + '/search?query=**&page=fypage',
    searchUrl: fqweb_host + '/api/search?key=**&tab_type=3&offset=((fypage-1)*10)',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    filter: '',
    filter_url: '{{fl.筛选}}',
    filter_def: {
        //全部: {筛选: '-1'},
        主分类: {筛选: '1016'},//男频衍生
        主题: {筛选: '516'},//都市异能
        角色: {筛选: '29'},//如懿衍生
        情节: {筛选: '1034'},//如懿衍生
    },
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',

    },
    config: {
        api: 'https://novel.snssdk.com/api',
        封面域名: 'http://p6-novel.byteimg.com/large/',
    },
    timeout: 20000,
    play_parse: true,
    class_parse: async () => {
        // let html = (await req(rule.homeUrl)).content;
        let html = await requestHtml(rule.homeUrl);
        let json = JSON.parse(html);
        let data_list = json.data;
        let ret = {};
        for (let data of data_list) {
            if (!ret[data.label]) {
                ret[data.label] = {
                    title: [],
                    url: []
                }
            }
            ret[data.label].title.push(data.name);
            ret[data.label].url.push(data.category_id);
        }
        let classes = [];
        let filters = {};
        let keys = Object.keys(ret);
        for (let key of keys) {
            let _titles = ret[key].title;
            let _urls = ret[key].url;
            classes.push({
                type_name: key,
                type_id: key,
            });
            filters[key] = [{
                key: '筛选',
                name: '筛选',
                value: _titles.map((it, index) => {
                    return {
                        n: it,
                        v: _urls[index]
                    }
                })
            }];
        }
        classes.unshift({
            type_name: '全部',
            type_id: '-1',
        });
        return {class: classes, filters}
    },
    预处理: async () => {
    },
    推荐: async () => {
        return []
    },
    一级: async function (tid, pg, filter, extend) {
        let {MY_CATE, input} = this;
        log(input);
        if (MY_CATE !== '-1') {
            let category_id = input.split('#')[1];
            input = input.split('#')[0].replace(/category_id=.*?&/, 'category_id=' + category_id + '&');
        } else {
            input = input.split('#')[0]
        }
        let d = [];
        let html = (await req(input)).content;
        let json = JSON.parse(html);
        for (let it of json.data.book_list) {
            d.push({
                title: decodeText(it.book_name),
                url: "https://fanqienovel.com/page/" + it.book_id,
                desc: decodeText(it.author),
                pic_url: rule.config.封面域名 + it.thumb_uri
            });
        }
        return setResult(d);
    },
    二级: async function (ids) {
        let {input} = this;
        let html = (await req(input, {
            headers: {
                'User-Agent': PC_UA,
            }
        })).content;
        let jsonStr = cut(html, 'window.__INITIAL_STATE__=', '};').replace(/;$/, "").replaceAll('undefined', 'null');
        // pathLib.writeFile('./temp/jsonStr.json', jsonStr);
        let book_info = jsonStr.parseX.page;
        let list = book_info.chapterListWithVolume.flat();
        let urls = [];
        list.forEach((it, index) => {
            urls.push(it.title + '$' + it.itemId + '@' + it.title);
        });
        let vod = {
            vod_id: input,
            vod_name: book_info.bookName,
            vod_pic: book_info.thumbUri,
            vod_content: book_info.abstract,
            vod_remarks: book_info.lastChapterTitle,
            vod_director: book_info.author,
            vod_play_from: "番茄小说",
            vod_play_url: urls.join('#'),
        };
        return vod
    },
    searchHandel: function (json) {
        return {
            data: json.data.search_tabs[5].data
        };
    },
    搜索: async function (wd, quick, pg) {
        let {input} = this;
        // log(input);
        let d = [];
        let html = (await req(input)).content;
        let json = JSON.parse(html);
        json = this.searchHandel(json);
        // console.log(json);
        for (let it of json.data.filter(i => i.book_data)) {
            let book = it.book_data[0];
            // console.log(book)
            d.push({
                title: book.book_name,
                url: "https://fanqienovel.com/page/" + book.book_id,
                desc: book.author,
                content: book.book_abstract || book.abstract,
                pic_url: book.thumb_url
            });
        }
        return setResult(d);
    },
    lazy: async function (flag, id, flags) {
        let {input} = this;
        let title = input.split('@')[1];
        input = input.split('@')[0];
        let content = '小说内容';
        let content_url = ''; // 正文获取接口
        // content_url = `http://fqweb.jsj66.com/content?item_id=${input}`;
        //   content_url = `https://fanqienovel.com/reader/${input}?enter_from=reader`;
        // content_url = `${fqweb_host}/content?item_id=${input}`;
        content_url = `${fqweb_host}/api/content?tab=小说&item_id=${input}`;
        /*
        log(content_url);
        
        let html = (await req(content_url, {headers: {Cookie: getFqCookie()}})).content;
        html = html.match(/window.__INITIAL_STATE__=(.+?});/)[1].replaceAll(':undefined,', ':"undefined",');
        let json = JSON.parse(html).reader.chapterData;
        title = json.title;
        content = decodeText(json.content, 2);
        content = content.replace(/<\/p>/g, '\n').replace(/<\w+>/g, '').replace(/<[^>]*>/g, '');
        */

        // let html = (await req(content_url, {headers: {Cookie: getFqCookie()},timeout:this.timeout})).content;
        let html = await request(content_url);
        /*
        let json = JSON.parse(html).data.data;
        title = json.novel_data.title;
        content = json.content;
        */
        let json = JSON.parse(html);

        // content = json.content.replace(/\n\n妍󠇕希󠆖󠅽󠇕󠆨󠅼󠄡󠄩󠄠󠄩󠄣󠄣󠄢󠄨󠄨󠄩\n/g, "\n");
        content = json.data.content;
        //  print(content)
        let ret = JSON.stringify({
            title,
            content
        });
        return {parse: 0, url: 'novel://' + ret, js: ''}
    },
};

function decodeText(text, _type) {
    _type = _type || 0;//0 一级 1 搜索 2正文
    const CODE_ST = 58344;
    const CODE_ED = 58715;
    let charset = [];
    if (_type === 0) {
        charset = ['体', 'y', '十', '现', '快', '便', '话', '却', '月', '物', '水', '的', '放', '知', '爱', '万', '', '表', '风', '理', 'O', '老', '也', 'p', '常', '克', '平', '几', '最', '主', '她', 's', '将', '法', '情', 'o', '光', 'a', '我', '呢', 'J', '员', '太', '每', '望', '受', '教', 'w', '利', '军', '已', 'U', '人', '如', '变', '得', '要', '少', '斯', '门', '电', 'm', '男', '没', 'A', 'K', '国', '时', '中', '走', '么', '何', '口', '小', '向', '问', '轻', 'T', 'd', '神', '下', '间', '车', 'f', 'G', '度', 'D', '又', '大', '面', '远', '就', '写', 'j', '给', '通', '起', '实', 'E', '', '它', '去', 'S', '到', '道', '数', '吃', '们', '加', 'P', '是', '无', '把', '事', '西', '多', '界', '', '发', '新', '外', '活', '解', '孩', '只', '作', '前', 'Y', '尔', '经', '', 'u', '心', '告', '父', '等', 'Q', '民', '全', '这', '9', '果', '安', '', 'i', '母', '8', 'r', '说', '任', '先', '和', '地', 'C', '张', '战', '场', 'g', '像', 'c', 'q', '你', '使', '', '样', '总', '目', 'x', '性', '处', '音', '头', '', '应', '乐', '关', '能', '花', 'l', '当', '名', '手', '4', '重', '字', '声', '力', '友', '然', '生', '代', '内', '里', '本', '回', '真', '入', '师', '象', '', '0', '点', 'R', '亲', 'V', '种', '动', '英', '命', 'Z', 'h', 'X', '做', '特', '边', '高', '有', 'B', '为', '期', '自', '年', '马', '认', '出', '接', '至', 'H', '正', '方', '感', '所', '明', '者', '稜', 'F', '住', '学', '还', '分', '意', '更', '其', 'n', '但', '比', '觉', '以', '由', '死', '家', '让', '失', '士', 'L', '2', 'I', '金', '叫', '身', '报', '听', 'W', '再', '原', '山', '海', '白', '很', '见', '5', '直', '位', '第', '工', '个', '开', '岁', '好', '用', '都', '于', '可', '同', '3', '次', '四', '', '日', '信', '与', '女', '笑', '满', '并', '部', '什', '不', '从', '或', '机', '此', '', '了', '记', '三', 'e', '些', 'b', 'N', '夫', '会', '才', '儿', '眼', '两', '美', '被', '一', '公', '来', '立', 'z', '长', '对', '己', '看', 'k', '许', '因', '相', '色', '后', '往', '打', '结', '格', '过', '世', '气', '7', '子', '条', '在', '书', '之', '定', 'v', '拉', '成', '进', '带', '着', '东', '上', '想', '天', '他', '妈', '1', '文', '而', '路', '那', '别', '德', '6', 'M', 't', '行', '候', '难'];
    } else if (_type === 1) {
        charset = ['', 's', '', '作', '口', '在', '他', '能', '并', 'B', '士', '4', 'U', '克', '才', '正', '们', '字', '声', '高', '全', '尔', '活', '者', '动', '其', '主', '报', '多', '望', '放', 'h', 'w', '次', '年', '', '中', '3', '特', '于', '十', '入', '要', '男', '同', 'G', '面', '分', '方', 'K', '什', '再', '教', '本', '己', '结', '1', '等', '世', 'N', '', '说', 'g', 'u', '期', 'Z', '外', '美', 'M', '行', '给', '9', '文', '将', '两', '许', '张', '友', '0', '英', '应', '向', '像', '此', '白', '安', '少', '何', '打', '气', '常', '定', '间', '花', '见', '孩', '它', '直', '风', '数', '使', '道', '第', '水', '已', '女', '山', '解', 'd', 'P', '的', '通', '关', '性', '叫', '儿', 'L', '妈', '问', '回', '神', '来', 'S', '', '四', '里', '前', '国', '些', 'O', 'v', 'l', 'A', '心', '平', '自', '无', '军', '光', '代', '是', '好', '却', 'c', '得', '种', '就', '意', '先', '立', 'z', '子', '过', 'Y', 'j', '表', '', '么', '所', '接', '了', '名', '金', '受', 'J', '满', '眼', '没', '部', '那', 'm', '每', '车', '度', '可', 'R', '斯', '经', '现', '门', '明', 'V', '如', '走', '命', 'y', '6', 'E', '战', '很', '上', 'f', '月', '西', '7', '长', '夫', '想', '话', '变', '海', '机', 'x', '到', 'W', '一', '成', '生', '信', '笑', '但', '父', '开', '内', '东', '马', '日', '小', '而', '后', '带', '以', '三', '几', '为', '认', 'X', '死', '员', '目', '位', '之', '学', '远', '人', '音', '呢', '我', 'q', '乐', '象', '重', '对', '个', '被', '别', 'F', '也', '书', '稜', 'D', '写', '还', '因', '家', '发', '时', 'i', '或', '住', '德', '当', 'o', 'I', '比', '觉', '然', '吃', '去', '公', 'a', '老', '亲', '情', '体', '太', 'b', '万', 'C', '电', '理', '', '失', '力', '更', '拉', '物', '着', '原', '她', '工', '实', '色', '感', '记', '看', '出', '相', '路', '大', '你', '候', '2', '和', '', '与', 'p', '样', '新', '只', '便', '最', '不', '进', 'T', 'r', '做', '格', '母', '总', '爱', '身', '师', '轻', '知', '往', '加', '从', '', '天', 'e', 'H', '', '听', '场', '由', '快', '边', '让', '把', '任', '8', '条', '头', '事', '至', '起', '点', '真', '手', '这', '难', '都', '界', '用', '法', 'n', '处', '下', '又', 'Q', '告', '地', '5', 'k', 't', '岁', '有', '会', '果', '利', '民']
    } else if (_type === 2) {
        charset = ['D', '在', '主', '特', '家', '军', '然', '表', '场', '4', '要', '只', 'v', '和', '?', '6', '别', '还', 'g', '现', '儿', '岁', '?', '?', '此', '象', '月', '3', '出', '战', '工', '相', 'o', '男', '直', '失', '世', 'F', '都', '平', '文', '什', 'V', 'O', '将', '真', 'T', '那', '当', '?', '会', '立', '些', 'u', '是', '十', '张', '学', '气', '大', '爱', '两', '命', '全', '后', '东', '性', '通', '被', '1', '它', '乐', '接', '而', '感', '车', '山', '公', '了', '常', '以', '何', '可', '话', '先', 'p', 'i', '叫', '轻', 'M', '士', 'w', '着', '变', '尔', '快', 'l', '个', '说', '少', '色', '里', '安', '花', '远', '7', '难', '师', '放', 't', '报', '认', '面', '道', 'S', '?', '克', '地', '度', 'I', '好', '机', 'U', '民', '写', '把', '万', '同', '水', '新', '没', '书', '电', '吃', '像', '斯', '5', '为', 'y', '白', '几', '日', '教', '看', '但', '第', '加', '候', '作', '上', '拉', '住', '有', '法', 'r', '事', '应', '位', '利', '你', '声', '身', '国', '问', '马', '女', '他', 'Y', '比', '父', 'x', 'A', 'H', 'N', 's', 'X', '边', '美', '对', '所', '金', '活', '回', '意', '到', 'z', '从', 'j', '知', '又', '内', '因', '点', 'Q', '三', '定', '8', 'R', 'b', '正', '或', '夫', '向', '德', '听', '更', '?', '得', '告', '并', '本', 'q', '过', '记', 'L', '让', '打', 'f', '人', '就', '者', '去', '原', '满', '体', '做', '经', 'K', '走', '如', '孩', 'c', 'G', '给', '使', '物', '?', '最', '笑', '部', '?', '员', '等', '受', 'k', '行', '一', '条', '果', '动', '光', '门', '头', '见', '往', '自', '解', '成', '处', '天', '能', '于', '名', '其', '发', '总', '母', '的', '死', '手', '入', '路', '进', '心', '来', 'h', '时', '力', '多', '开', '已', '许', 'd', '至', '由', '很', '界', 'n', '小', '与', 'Z', '想', '代', '么', '分', '生', '口', '再', '妈', '望', '次', '西', '风', '种', '带', 'J', '?', '实', '情', '才', '这', '?', 'E', '我', '神', '格', '长', '觉', '间', '年', '眼', '无', '不', '亲', '关', '结', '0', '友', '信', '下', '却', '重', '己', '老', '2', '音', '字', 'm', '呢', '明', '之', '前', '高', 'P', 'B', '目', '太', 'e', '9', '起', '稜', '她', '也', 'W', '用', '方', '子', '英', '每', '理', '便', '四', '数', '期', '中', 'C', '外', '样', 'a', '海', '们', '任'];
    }

    function interpreter(cc) {
        let bias = cc - CODE_ST;
        if (charset[bias] === '?') {
            return String.fromCharCode(cc);
        }
        return charset[bias];
    }

    function _decodeText(text) {
        let len = text.length;
        let decode = '';
        for (var ind = 0; ind < len; ind++) {
            let cc = text.charCodeAt(ind);
            var ch = text.charAt(ind);
            if (cc >= CODE_ST && cc <= CODE_ED) {
                ch = interpreter(cc);
            }
            decode += ch;
        }
        return decode
    }

    function _decodeText2(text) {
        text = escape(text);
        /* 不够高效
        for (let i = 0; i < z.length; i++) {
            let I = '\\%u' + (i + 58344).toString(16);
            text = result
                .replace(new RegExp(I, 'gi'), z[i]);
        }
        */
        let reg = new RegExp('%uE([0-9a-fA-F]{3})', 'gi');
        let z = charset;
        text = text.replace(reg, ($0, $1) => z[('0x' + $1) - 1000]);
        return unescape(text);
    }

    // return _decodeText(text);
    return _decodeText2(text);
}

function getFqCookie() {
    let cookies = [
        'novel_web_id=78444872394737941004',
        'novel_web_id=69258894393744181011',
        'novel_web_id=77130880221809081001',
        'novel_web_id=64945771562463261001',
        'novel_web_id=78444872394737941004',
        'novel_web_id=0000000000004011402',
        'novel_web_id=0000000303614711402',
        'novel_web_id=0144211303614711401',
        'novel_web_id=0144211303614711402',
        'novel_web_id=0144211303614711403',
        'novel_web_id=0144211303614711406',
        'novel_web_id=7357767624615331361',
        'novel_web_id=7357767624615331362',
        'novel_web_id=7357767624615331365',
    ];
    return getRandomFromList(cookies)
}
