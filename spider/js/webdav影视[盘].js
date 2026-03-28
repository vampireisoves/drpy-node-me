/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: 'webdav影视[盘]',
  '类型': '影视',
  lang: 'ds',
  style: {
    type: 'list',
    ratio: 1.433
  }
})
*/

var rule = {
    类型: '影视',
    title: 'webdav[盘]',
    host: '',
    url: '',
    searchUrl: '',
    headers: {'User-Agent': 'UC_UA'},
    searchable: 0,
    quickSearch: 0,
    filterable: 0,
    double: true,
    play_parse: true,
    limit: 6,
    class_name: '',
    class_url: '',
    pans: [],
    style: {"type": "list", "ratio": 1.433},
    // 推荐样式
    hikerListCol: 'icon_round_2',
    // 分类列表样式
    hikerClassListCol: 'avatar',
    hostJs: async function () {
        let {HOST} = this;
        return rule.params;
    },
    预处理: async function () {
        log('rule.host:', rule.host);
        let data = await request(rule.host);
        try {
            rule.pans = JSON.parse(data);
        } catch (e) {
            log('获取webdav配置错误:', e.message);
        }
    },
    class_parse: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let classList = [];
        rule.pans.forEach(pan => {
            classList.push({
                type_name: pan.name,
                type_id: pan.id || pan.baseURL,
            })
        })

        let filters = [{
            'key': 'order',
            'name': '排序',
            'value': [{'n': '名称⬆️', 'v': 'vod_name_asc'}, {'n': '名称⬇️', 'v': 'vod_name_desc'},
                {'n': '中英⬆️', 'v': 'vod_cn_asc'}, {'n': '中英⬇️', 'v': 'vod_cn_desc'},
                {'n': '时间⬆️', 'v': 'vod_time_asc'}, {'n': '时间⬇️', 'v': 'vod_time_desc'},
                {'n': '大小⬆️', 'v': 'vod_size_asc'}, {'n': '大小⬇️', 'v': 'vod_size_desc'}, {'n': '无', 'v': 'none'}]
        },
            {'key': 'show', 'name': '播放展示', 'value': [{'n': '单集', 'v': 'single'}, {'n': '全集', 'v': 'all'}]}
        ];

        let filter_dict = {};
        classList.forEach(it => {
            filter_dict[it.type_id] = filters;
        });

        return {class: classList, filters: filter_dict}
    },
    lazy: async function () {
        let {input, webdavProxyUrl} = this;
        console.log(`✅webdavProxyUrl的结果:', ${webdavProxyUrl}`);
        return {
            parse: 0,
            url: webdavProxyUrl + input
        }
    },
    action: async function (action, value) {
        if (action === 'only_params') {
            return '这是个传参源哦'
        }
        return `未定义动作:${action}`
    },
    推荐: async function () {
        let {input, pdfa, pdfh, pd, publicUrl} = this;
        let vod_pic = urljoin(publicUrl, './images/icon_common/网盘.png');
        let d = [];
        if (!rule.pans || rule.pans.length < 1) {
            d.push({
                vod_id: 'only_params',
                vod_pic: vod_pic,
                vod_name: '这是个传参源哦',
                vod_tag: 'action',
            })
        }
        return d
    },

    一级: async function (tid, pg, filter, extend) {
        let d = [];
        if (Number(pg) > 1) {
            return d
        }
        const _id = tid.split('$')[0];
        const _tid = tid.split('$')[1] || '/';
        let pan = rule.pans.find(it => it.id === _id || it.baseURL === _id);
        if (pan) {
            const webdav = createWebDAVClient(pan);
            const isConnected = await webdav.testConnection();
            if (isConnected) {
                const rootItems = await webdav.listDirectory(_tid);
                console.log('Root directory contents:');

                // 排除的文件扩展名列表
                const excludeExts = [
                    // 文档文件
                    'nfo', 'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                    // 图片文件
                    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ico', 'svg',
                    // 压缩文件
                    'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
                    // 程序文件
                    'exe', 'msi', 'bat', 'cmd', 'sh', 'dmg', 'pkg',
                    // 配置文件
                    'ini', 'cfg', 'conf', 'config', 'xml', 'json', 'yml', 'yaml',
                    // 其他文件
                    'url', 'lnk', 'torrent', 'md', 'log', 'db', 'sqlite'
                ];

                const excludePattern = new RegExp(`\\.(${excludeExts.join('|')})$`, 'i');

                // 音视频文件扩展名
                const mediaExts = [
                    'mp4', 'mkv', 'avi', 'ts', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp',
                    'mp3', 'wav', 'flac', 'aac', 'wma', 'm4a', 'ogg', 'ape', 'dts'
                ];
                const mediaPattern = new RegExp(`\\.(${mediaExts.join('|')})$`, 'i');

                rootItems.forEach(item => {
                    log(item);

                    // 当 showAll 为 false 时，排除不需要的文件类型
                    if (pan.showAll === false && !item.isDirectory) {
                        // 排除非音视频文件
                        if (excludePattern.test(item.name)) {
                            return; // 跳过这些文件
                        }
                    }

                    const type = item.isDirectory ? 'folder' : 'file';
                    const size = item.isDirectory ? '' : `${(item.size / (1024 * 1024)).toFixed(2)} MB`;
                    const content = item.isDirectory ? '' : `${item.contentType}`;

                    // 根据文件类型设置图标
                    let vod_pic = 'https://mpimg.cn/view.php/9f684b4c4d80cb4b31d3dfade4b34612.png'; // 默认文件夹图标

                    if (!item.isDirectory) {
                        if (mediaPattern.test(item.name)) {
                            // 音视频和图片文件使用媒体图标
                            vod_pic = 'https://mpimg.cn/view.php/41a0fdeb398939242397a3a467567337.png';
                        } else {
                            // 其他文件使用默认文件图标
                            vod_pic = 'https://mpimg.cn/view.php/9f684b4c4d80cb4b31d3dfade4b34612.png';
                        }
                    }

                    d.push({
                        vod_name: item.name,
                        vod_remarks: size,
                        vod_tag: type,
                        vod_id: _id + '$' + item.path,
                        vod_pic: vod_pic,
                        vod_content: content,
                    })
                });

                let fl = filter ? extend : {};
                if (fl.order) {
                    let key = fl.order.split('_').slice(0, -1).join('_');
                    let order = fl.order.split('_').slice(-1)[0];
                    console.log(`排序key:${key},排序order:${order}`);

                    if (key.includes('name')) {
                        d = sortListByName(d, key, order);
                    } else if (key.includes('time')) {
                        d = sortListByTime(d, key, order);
                    } else if (key.includes('size')) {
                        d = sortListBySize(d, key, order);
                    }
                }
            }
        }
        return d
    },

    二级: async function (ids) {
        let VOD = {};
        let tid = ids[0];
        const _id = tid.split('$')[0];
        const _tid = tid.split('$')[1] || '/';
        let pan = rule.pans.find(it => it.id === _id || it.baseURL === _id);
        if (pan) {
            const webdav = createWebDAVClient(pan);
            const isConnected = await webdav.testConnection();
            if (isConnected) {
                const itemInfo = await webdav.getInfo(_tid);
                VOD.vod_name = itemInfo.name;
                VOD.vod_content = itemInfo.path + '\n' + '上次修改时间:' + itemInfo.lastModified;
                VOD.vod_remarks = itemInfo.size;
                VOD.vod_director = itemInfo.etag;
                VOD.vod_actor = itemInfo.contentType;
                VOD.vod_pic = '/default-poster.svg';
                VOD.vod_play_from = '在线观看';
                const proxy_params_url = `file?config=${encodeURIComponent(JSON.stringify(pan))}&path=${encodeURIComponent(_tid)}`;
                VOD.vod_play_url = itemInfo.name + '$' + proxy_params_url;
            }
        }
        return VOD
    },

    搜索: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let d = [];
        return setResult(d)
    }
}

// 排序函数（移到 rule 对象外部）
const sortListByName = (vodList, key, order) => {
    if (!key) return vodList;
    order = order || 'asc';
    return vodList.sort((a, b) => {
        const nameA = a[key].toLowerCase();
        const nameB = b[key].toLowerCase();
        if (order === 'asc') {
            return nameA.localeCompare(nameB);
        } else {
            return nameB.localeCompare(nameA);
        }
    });
};

const sortListByTime = (vodList, key, order) => {
    if (!key) return vodList;
    let ASCarr = vodList.sort((a, b) => {
        const timeA = new Date(a.vod_content.split('上次修改时间:')[1] || 0);
        const timeB = new Date(b.vod_content.split('上次修改时间:')[1] || 0);
        return timeA - timeB;
    });
    if (order === 'desc') {
        ASCarr.reverse();
    }
    return ASCarr;
};

const sortListBySize = (vodList, key, order) => {
    if (!key) return vodList;
    let ASCarr = vodList.sort((a, b) => {
        const sizeA = parseInt(a.vod_remarks) || 0;
        const sizeB = parseInt(b.vod_remarks) || 0;
        return sizeA - sizeB;
    });
    if (order === 'desc') {
        ASCarr.reverse();
    }
    return ASCarr;
};