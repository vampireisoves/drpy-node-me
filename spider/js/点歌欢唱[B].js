/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '点歌欢唱[B]',
  logo: 'https://tva1.sinaimg.cn/crop.6.7.378.378.1024/a22d2331jw8f6hs4xrb4kj20ay0ayacy.jpg',
  lang: 'ds'
})
*/

var mv_list = [];
var authors = [];
var authorsPy = {};
const hots = '周华健,周杰伦,张信哲,陈奕迅,队长,林俊杰,王靖雯,时代少年团,薛之谦,周深,邓寓君,叶泽浩,莫文蔚,小阿七,邓紫棋,郭顶,蓝心羽,李荣浩,程响,蔡健雅,任然,许嵩,张杰,汪苏泷,一颗狼星,王忻辰,王菲,李宇春,不是花火呀,毛不易,王小帅,半吨兄弟,刘至佳,苏星婕,徐佳莹,郁可唯,张碧晨,王力宏,杨丞琳,五月天,周星星,刘大壮,张学友,刘梦妤,旺仔小乔,戴羽彤,陈慧娴,张韶涵,王唯乐,黄龄,易烊千玺,来一碗老于,周传雄,告五人,白小白,李克勤,虎二,黄霄雲,曲肖冰,张靓颖,魏晗,刘德华,房东的猫,孙燕姿,张信哲,大籽,音阙诗听,刘若英,王贰浪,庄心妍,赵雷,小鬼,王以太,方大同,杨宗纬,蒋雪儿,单依纯,林宥嘉,梁静茹,阿肆,陈粒,朴树,许巍,谭咏麟,金志文,蔡依林,李玉刚,马嘉祺,张远,姚六一,王杰,宋亚轩,司南,杨千嬅';
const starAuthors = '周杰伦,汪苏泷,李荣浩,蔡依林,筷子兄弟,凤凰传奇,程响';
const alphabetList = Array.from({length: 26}, (_, index) => {
    const uppercase = String.fromCharCode(65 + index); // 大写字母 A-Z
    const lowercase = String.fromCharCode(97 + index); // 小写字母 a-z
    // return {n: uppercase, v: lowercase};
    return {n: uppercase, v: uppercase};
});
alphabetList.unshift({n: '全部', v: ''});
var rule = {
    类型: '搜索',
    title: '点歌欢唱[B]',
    alias: '点歌欢唱搜索引擎',
    desc: '仅搜索源纯js写法',
    logo: 'https://tva1.sinaimg.cn/crop.6.7.378.378.1024/a22d2331jw8f6hs4xrb4kj20ay0ayacy.jpg',
    host: 'hiker://empty',
    url: '',
    searchUrl: 'hiker://empty',
    headers: {
        'User-Agent': 'PC_UA',
    },
    searchable: 1,
    quickSearch: 0,
    filterable: 1,
    double: true,
    play_parse: true,
    limit: 100,
    // class_name: '歌手&歌名&全名',
    // class_url: 'author&name&all',
    filter: {
        author: [
            {key: 'letters', name: '首字母', value: alphabetList}
        ]
    },
    // 推荐样式
    hikerListCol: 'icon_round_2',
    // 分类列表样式
    hikerClassListCol: 'avatar',
    home_flag: '3-11-S',
    // class_flag: '[CFS][CFPY]1',
    预处理: async function () {
        let t1 = (new Date()).getTime();
        let _url = rule.params;
        log(`传入参数:${_url}`);
        let _init = getItem('init');
        if (_init === '1') {
            mv_list = JSON.parse(pathLib.readFile('./mv/十六万歌曲.json'));
            authors = JSON.parse(pathLib.readFile('./mv/十六万歌曲作者.json'));
            authorsPy = JSON.parse(pathLib.readFile('./mv/十六万歌曲作者拼音.json'));
        } else {
            mv_list = (await request(_url)).split('\n').map((it) => {
                it = it.trim();
                let _tt = it.split(',')[0];
                let _uu = it.split(',')[1];
                let _aa, _nn;
                if (/.+-.+/.test(_tt)) {
                    _aa = _tt.split('-')[0].trim() || '未知';
                    _nn = _tt.split('-')[1].trim();
                } else {
                    _aa = '未知';
                    _nn = _tt.trim();
                }
                return {
                    title: _tt,
                    url: _uu,
                    author: _aa,
                    name: _nn,
                    title_py: getFirstLetter(_tt),
                    author_py: getFirstLetter(_aa),
                    name_py: getFirstLetter(_nn)
                }
            });
            authors = [...new Set(mv_list.filter(it => /[\u4e00-\u9fa5]{2,}/.test(it.author)).map(it => {
                const author = it.author.trim();
                authorsPy[author] = it.author_py;
                return author;
            }))];
            authors = authors.sort((a, b) => a.localeCompare(b, 'zh-CN', {numeric: true, sensitivity: 'base'}));
            pathLib.writeFile('./mv/十六万歌曲.json', JSON.stringify(mv_list));
            pathLib.writeFile('./mv/十六万歌曲作者.json', JSON.stringify(authors));
            pathLib.writeFile('./mv/十六万歌曲作者拼音.json', JSON.stringify(authorsPy));
            setItem('init', '1');
        }
        let t2 = (new Date()).getTime();
        log(`读取文件并转json耗时:${t2 - t1}毫秒`);
    },
    lazy: async function () {
    },
    proxy_rule: async function (params) {
        let {input, proxyPath, getProxyUrl} = this;
        let resp_not_found = [404, 'text/plain', 'not found'];
        return resp_not_found
    },
    action: async function (action, value) {
        if (action === 'only_search') {
            return '此源为纯搜索源，你直接全局搜索这个源或者使用此页面的源内搜索就好了'
        }
        if (action === '源内搜索') {
            let content = JSON.parse(value);
            return JSON.stringify({
                action: {
                    actionId: '__self_search__',
                    skey: '', //目标源key，可选，未设置或为空则使用当前源
                    name: '搜索: ' + content.wd,
                    tid: content.wd,
                    flag: '1',
                    msg: '源内搜索'
                }
            });
        }
        return `没有动作:${action}的可执行逻辑`
    },
    class_parse: async () => {
        let classes = [{
            type_id: 'hot',
            type_name: '热门',
            type_flag: '1'
        }, {
            type_id: 'author',
            type_name: '歌手',
            type_flag: '[CFS][CFPY]1'
        }, {
            type_id: 'name',
            type_name: '歌名',
            type_flag: '[CFS][CFPY]1-11'
        }, {
            type_id: 'all',
            type_name: '全名',
            type_flag: '[CFS][CFPY]1-11'
        }, {
            type_id: '华语歌手-1',
            type_name: '男歌手',
            type_flag: '[CFPY][PY1]2-00-S'
        }, {
            type_id: '华语歌手-2',
            type_name: '女歌手',
            type_flag: '[CFPY][PY1]2-00-S'
        }, {
            type_id: '华语歌手-3',
            type_name: '组合歌手',
            type_flag: '[CFPY][PY1]2-00-S'
        }];
        return {
            class: classes
        };
    },
    推荐: async function () {
        let {publicUrl} = this;
        let searchIcon = urljoin(publicUrl, './images/icon_cookie/搜索.jpg');
        let selectData = starAuthors.split(',').map(it => `${it}:=${it}`).join(',');
        return [{
            vod_id: 'only_search',
            vod_name: '这是个纯搜索源哦',
            vod_pic: 'https://t8.baidu.com/it/u=102347688,62200072&fm=193',
            vod_remarks: `歌手数量:${authors.length}`,
            vod_tag: 'action'
        },
            {
                vod_id: JSON.stringify({
                    actionId: '源内搜索',
                    id: 'wd',
                    type: 'input',
                    title: '源内搜索',
                    tip: '请输入搜索内容',
                    value: '',
                    selectData: selectData
                }),
                vod_name: '源内搜索',
                vod_pic: searchIcon,
                vod_remarks: `歌曲数量:${mv_list.length}`,
                vod_tag: 'action',
            }];
    },
    一级: async function (tid, pg, filter, extend) {
        let {MY_FL} = this;
        let d = [];
        let _f = rule.limit * (pg - 1);
        let _t = rule.limit * pg;
        let _d = [];
        if (tid === 'hot') {
            _d = hots.split(',').slice(_f, _t);
            _d.forEach(it => {
                d.push({
                    vod_name: it,
                    vod_id: 'author#' + it,
                });
            });
        } else if (tid === 'author') {
            let _authors = authors;
            if (MY_FL.custom) {
                _authors = authors.filter(_author => _author.includes(MY_FL.custom));
            } else if (MY_FL.custom_pinyin) {
                _authors = authors.filter(_author => authorsPy[_author].includes(MY_FL.custom_pinyin));
            } else if (MY_FL.letters) {
                _authors = authors.filter(_author => authorsPy[_author].startsWith(MY_FL.letters));
            }
            _d = _authors.slice(_f, _t);
            _d.forEach(it => {
                d.push({
                    vod_name: it,
                    vod_id: 'author#' + it,
                });
            });
        } else if (tid === 'name') {
            let _data = mv_list;
            if (MY_FL.custom) {
                _data = mv_list.filter(it => it.name.includes(MY_FL.custom));
            } else if (MY_FL.custom_pinyin) {
                _data = mv_list.filter(it => it.name_py.includes(MY_FL.custom_pinyin));
            }
            _d = _data.slice(_f, _t);
            _d.forEach(it => {
                d.push({
                    vod_name: it.title,
                    vod_id: it.url + '#' + it.title,
                });
            });
        } else if (tid === 'all') {
            let _data = mv_list;
            if (MY_FL.custom) {
                const words = MY_FL.custom.split('-');
                if (words.length > 1) {
                    _data = mv_list.filter(it => it.author.includes(words[0]) && it.name.includes(words[1]));
                } else {
                    _data = mv_list.filter(it => it.title.includes(MY_FL.custom));
                }
            } else if (MY_FL.custom_pinyin) {
                const words = MY_FL.custom_pinyin.split('-');
                if (words.length > 1) {
                    _data = mv_list.filter(it => it.author_py.includes(words[0]) && it.name_py.includes(words[1]));
                } else {
                    _data = mv_list.filter(it => it.title_py.includes(MY_FL.custom_pinyin));
                }
            }
            _d = _data.slice(_f, _t);
            _d.forEach(it => {
                d.push({
                    vod_name: it.title,
                    vod_id: it.url + '#' + it.title,
                });
            });
        } else if (tid.startsWith('华语歌手-')) {
            const cate = tid.substring(5);
            const letter = MY_FL.custom_pinyin ? MY_FL.custom_pinyin.substring(0, 1) : '';
            const url = `https://wapi.kuwo.cn/api/www/artist/artistInfo?category=${cate}&prefix=${letter}&pn=${pg}&rn=60`;
            const data = JSON.parse(await request(url)).data.artistList;
            data.forEach(it => {
                d.push({
                    vod_id: 'author#' + it.name,
                    vod_name: it.name,
                    vod_pic: it.pic
                });
            });
        } else {
            // 仅搜索作者允许翻页，其他情况只有3个固定按钮
            if (Number(pg) > 1) {
                return []
            }
            d.push({
                vod_name: '按歌手搜索',
                vod_id: 'author#' + tid,
                vod_remarks: '',
            });
            d.push({
                vod_name: '按歌名搜索',
                vod_id: 'name#' + tid,
                vod_remarks: '',
            });
            d.push({
                vod_name: '全名模糊搜索',
                vod_id: 'all#' + tid,
                vod_remarks: '',
            });
        }
        return d;
    },
    二级: async function () {
        let {orId} = this;

        let _sname = '';
        let _vname = '';
        let data = [];
        let _stype = orId.split('#')[0];
        _sname = orId.split('#')[1];
        _vname = '';
        switch (_stype) {
            case 'author':
                // log('_sname:', _sname);
                _vname = '歌手搜索';
                data = mv_list.filter(it => it.author.includes(_sname));
                break;
            case 'name':
                _vname = '歌名搜索';
                data = mv_list.filter(it => it.name.includes(_sname));
                break;
            case 'all':
                _vname = '全名搜索';
                data = mv_list.filter(it => it.title.includes(_sname));
                break;
            default:
                _vname = '单曲';
                data = [{title: _sname, url: _stype}];
                break;
        }
        return {
            vod_id: orId,
            vod_name: `${_vname}:${_sname}`,
            vod_remarks: `共计${data.length}`,
            vod_play_from: '道长源内搜索',
            vod_play_url: data.map(it => it.title + '$' + it.url).join('#')
        }
    },
    搜索: async function (wd, quick, pg) {
        if (Number(pg) > 1) {
            return []
        }
        let d = [];
        d.push({
            vod_name: '按歌手搜索:' + wd,
            vod_id: 'author#' + wd,
            vod_remarks: '',
        });
        d.push({
            vod_name: '按歌名搜索:' + wd,
            vod_id: 'name#' + wd,
            vod_remarks: '',
        });
        d.push({
            vod_name: '全名模糊搜索:' + wd,
            vod_id: 'all#' + wd,
            vod_remarks: '',
        });
        return d
    }
}
