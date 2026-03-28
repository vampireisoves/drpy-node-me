/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: 'ftp[盘]',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    title: 'ftp[盘]',
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
            log('获取ftp配置错误:', e.message);
        }
    },
    class_parse: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let classList = [];
        rule.pans.forEach(pan => {
            classList.push({
                type_name: pan.name,
                type_id: pan.id || pan.basePath,
            })
        })
        return {class: classList}
    },
    lazy: async function () {
        let {input, ftpProxyUrl} = this;
        // log('input:', input);
        // log('ftpProxyUrl:', ftpProxyUrl);
        return {
            parse: 0,
            url: ftpProxyUrl + input
        }
    },
    推荐: async function () {
        let {input, pdfa, pdfh, pd, publicUrl} = this;
        let vod_pic = urljoin(publicUrl, './images/icon_common/网盘.png');
        let d = [];
        log('rule.pans:', rule.pans);
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
    action: async function (action, value) {
        if (action === 'only_params') {
            return '此源为传参源，你必须要给出系统允许的extend参数才能使用'
        }
    },
    一级: async function (tid, pg, filter, extend) {
        let d = [];
        if (Number(pg) > 1) {
            return d
        }
        const _id = tid.split('$')[0];
        const _tid = tid.split('$')[1] || '/';
        let pan = rule.pans.find(it => it.id === _id || it.basePath === _id);
        if (pan) {
            const ftp = createFTPClient(setAnonymous(pan));
            const isConnected = await ftp.testConnection();
            if (isConnected) {
                const rootItems = await ftp.listDirectory(_tid);
                console.log('Root directory contents:');
                rootItems.forEach(item => {
                    log(item);
                    // const type = item.isDirectory ? 'folder' : undefined;
                    const type = item.isDirectory ? 'folder' : 'file';
                    const size = item.isDirectory ? '' : `${get_size(item.size)}`;
                    const content = item.isDirectory ? '' : `${item.contentType}`;
                    // console.log(`  ${type} ${item.name}${size}`);
                    d.push({
                        vod_name: item.name,
                        vod_remarks: size,
                        vod_tag: type,
                        vod_id: _id + '$' + item.path,
                        vod_content: content,
                    })
                });
            }
        }
        return d
    },
    二级: async function (ids) {
        let {publicUrl} = this;
        let vod_pic = urljoin(publicUrl, './images/logo_round.png');
        // log('ids:',ids);
        let VOD = {};
        let tid = ids[0];
        const _id = tid.split('$')[0];
        const _tid = tid.split('$')[1] || '/';
        let pan = rule.pans.find(it => it.id === _id || it.basePath === _id);
        if (pan) {
            const ftp = createFTPClient(setAnonymous(pan));
            const isConnected = await ftp.testConnection();
            if (isConnected) {
                const itemInfo = await ftp.getInfo(_tid);
                // log('itemInfo:');
                // log(itemInfo);
                VOD.vod_name = itemInfo.name;
                VOD.vod_content = itemInfo.path + '\n' + '上次修改时间:' + toBeijingTime(itemInfo.lastModified);
                VOD.vod_remarks = get_size(itemInfo.size);
                VOD.vod_director = itemInfo.etag;
                VOD.vod_actor = itemInfo.contentType;
                VOD.vod_pic = vod_pic;
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

function setAnonymous(ftpConfig) {
    // 支持匿名 FTP 访问
    if (!ftpConfig.username || ftpConfig.username === 'your-username' || ftpConfig.username === '') {
        ftpConfig.username = 'anonymous';
    }
    if (!ftpConfig.password || ftpConfig.password === 'your-password' || ftpConfig.password === '') {
        ftpConfig.password = 'anonymous@example.com';
    }
    return ftpConfig;
}