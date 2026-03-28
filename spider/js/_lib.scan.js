class QRCodeHandler {
    // 状态常量
    static STATUS_NEW = "NEW";            // 待扫描
    static STATUS_SCANED = "SCANED";      // 已扫描
    static STATUS_CONFIRMED = "CONFIRMED"; // 已确认
    static STATUS_CANCELED = "CANCELED";   // 已取消
    static STATUS_EXPIRED = "EXPIRED";     // 已过期
    static STATUS_WAIT = "WAIT";     // 待确认授权

    // 平台常量
    static PLATFORM_QUARK = "quark";      // 夸克
    static PLATFORM_ALI = "ali";          // 阿里云盘
    static PLATFORM_UC = "uc";            // UC
    static PLATFORM_UC_TOKEN = "uc_token";            // uc_token
    static PLATFORM_BILI = "bili";        // 哔哩哔哩
    static PLATFORM_BAIDU = "baidu";    //百度

    // 通用请求头
    static HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2012K10C Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Mobile Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*'
    };

    constructor() {
        this.platformStates = {
            [QRCodeHandler.PLATFORM_QUARK]: null,
            [QRCodeHandler.PLATFORM_ALI]: null,
            [QRCodeHandler.PLATFORM_UC]: null,
            [QRCodeHandler.PLATFORM_UC_TOKEN]: null,
            [QRCodeHandler.PLATFORM_BILI]: null,
            [QRCodeHandler.PLATFORM_BAIDU]: null,
        };
    }
}

const qrcode = new QRCodeHandler();

function formatCookiesToList(cookieString) {
    const result = [];
    let currentCookie = '';
    let inExpires = false;

    for (let i = 0; i < cookieString.length; i++) {
        const char = cookieString[i];

        // 判断是否进入或退出 `expires` 属性
        if (cookieString.slice(i, i + 8).toLowerCase() === 'expires=') {
            inExpires = true;
        }
        if (inExpires && char === ';') {
            inExpires = false;
        }

        // 检测到逗号分隔符并且不在 `expires` 属性中，表示一个 Cookie 条目结束
        if (char === ',' && !inExpires) {
            result.push(currentCookie.trim());
            currentCookie = '';
        } else {
            currentCookie += char;
        }
    }

    // 添加最后一个 Cookie 条目
    if (currentCookie.trim()) {
        result.push(currentCookie.trim());
    }

    return result;
}

function formatCookie(cookies) {
    if (!Array.isArray(cookies)) cookies = [cookies];
    if (cookies.length === 0) return '';

    let mainCookies = [];
    for (const cookie of cookies) {
        if (cookie && typeof cookie === 'string' && cookie.trim()) {
            mainCookies.push(cookie.split('; ')[0]);
        }
    }
    return mainCookies.join(';');
}

async function _checkQuarkStatus(state, httpUrl) {
    try {
        console.log(`[_checkQuarkStatus] httpUrl: ${httpUrl}`);
        const res = await axios({
            url: httpUrl,
            method: "POST",
            data: {
                url: "https://uop.quark.cn/cas/ajax/getServiceTicketByQrcodeToken",
                headers: {
                    ...QRCodeHandler.HEADERS
                },
                params: {
                    request_id: state.request_id,
                    client_id: "532",
                    v: "1.2",
                    token: state.token
                }
            }
        });
        const resData = res.data;

        if (resData.data.status === 2000000) { // 扫码成功
            const serviceTicket = resData.data.data.members.service_ticket;
            const cookieRes = await axios({
                url: httpUrl,
                method: "POST",
                data: {
                    url: "https://pan.quark.cn/account/info",
                    headers: {
                        ...QRCodeHandler.HEADERS
                    },
                    params: {
                        st: serviceTicket,
                        lw: "scan"
                    }
                }
            });
            log('扫码成功,开始获取cookie');
            const cookieResData = cookieRes.data;
            const cookies = Array.isArray(cookieResData.headers['set-cookie']) ? cookieResData.headers['set-cookie'].join('; ') : cookieResData.headers['set-cookie'];
            const cookies2array = formatCookiesToList(cookies);
            let mainCookies = formatCookie(cookies2array);
            const cookieSelfRes = await axios({
                url: httpUrl,
                method: "POST",
                data: {
                    url: "https://drive-pc.quark.cn/1/clouddrive/file/sort?pr=ucpro&fr=pc&uc_param_str=&pdir_fid=0&_page=1&_size=50&_fetch_total=1&_fetch_sub_dirs=0&_sort=file_type:asc,updated_at:desc",
                    headers: {
                        ...QRCodeHandler.HEADERS,
                        Origin: 'https://pan.quark.cn',
                        Referer: 'https://pan.quark.cn/',
                        Cookie: mainCookies
                    }
                }
            });
            const cookieResDataSelf = cookieSelfRes.data;
            const cookiesSelf = Array.isArray(cookieResDataSelf.headers['set-cookie']) ? cookieResDataSelf.headers['set-cookie'].join('; ') : cookieResDataSelf.headers['set-cookie'];
            const cookies2arraySelf = formatCookiesToList(cookiesSelf);
            const mainCookiesSelf = formatCookie(cookies2arraySelf);
            if (mainCookiesSelf) mainCookies += ';' + mainCookiesSelf;
            return {
                status: QRCodeHandler.STATUS_CONFIRMED,
                cookie: mainCookies
            };
        } else if (resData.data.status === 50004002) { // token过期
            return {status: 'EXPIRED'};
        } else {
            return {status: 'NEW'};
        }
    } catch (e) {
        console.error(e);
        log(`[_checkQuarkStatus] error:${e.message}`);
        throw new Error(e.response.data.message || e.message);
    }
}

async function _checkUCStatus(state, httpUrl) {
    try {
        const res = await axios({
            url: httpUrl,
            method: "POST",
            data: {
                url: "https://api.open.uc.cn/cas/ajax/getServiceTicketByQrcodeToken",
                method: "POST",
                headers: {
                    ...QRCodeHandler.HEADERS
                },
                params: {
                    __t: Date.now()
                },
                data: {
                    v: "1.2",
                    request_id: state.request_id,
                    client_id: "381",
                    token: state.token
                }
            }
        });
        const resData = res.data;

        if (resData.data.status === 2000000) { // 扫码成功
            const serviceTicket = resData.data.data.members.service_ticket;
            const cookieRes = await axios({
                url: httpUrl,
                method: "POST",
                data: {
                    url: "https://drive.uc.cn/account/info",
                    headers: {
                        ...QRCodeHandler.HEADERS
                    },
                    params: {
                        st: serviceTicket
                    },
                }
            });
            log('扫码成功,开始获取cookie');
            const cookieResData = cookieRes.data;
            const cookies = cookieResData.headers['set-cookie'];
            const cookies2array = formatCookiesToList(cookies);
            let mainCookies = formatCookie(cookies2array);
            const cookieSelfRes = await axios({
                url: httpUrl,
                method: "POST",
                data: {
                    url: "https://pc-api.uc.cn/1/clouddrive/config?pr=UCBrowser&fr=pc",
                    headers: {
                        ...QRCodeHandler.HEADERS,
                        Origin: 'https://drive.uc.cn',
                        Referer: 'https://drive.uc.cn/',
                        Cookie: mainCookies
                    }
                }
            });
            const cookieResDataSelf = cookieSelfRes.data;
            const cookiesSelf = Array.isArray(cookieResDataSelf.headers['set-cookie']) ? cookieResDataSelf.headers['set-cookie'].join('; ') : cookieResDataSelf.headers['set-cookie'];
            const cookies2arraySelf = formatCookiesToList(cookiesSelf);
            const mainCookiesSelf = formatCookie(cookies2arraySelf);
            if (mainCookiesSelf) mainCookies += ';' + mainCookiesSelf;
            return {
                status: QRCodeHandler.STATUS_CONFIRMED,
                cookie: mainCookies
            };
        } else if (resData.data.status === 50004002) { // token过期
            return {status: 'EXPIRED'};
        } else {
            return {status: 'NEW'};
        }
    } catch (e) {
        console.error(e);
        log(`[_checkUCStatus] error:${e.message}`);
        throw new Error(e.response.data.message || e.message);
    }
}

async function _checkAliStatus(state, httpUrl) {
    try {
        const res = await axios({
            url: httpUrl,
            method: "POST",
            data: {
                url: "https://passport.aliyundrive.com/newlogin/qrcode/query.do",
                method: "POST",
                headers: {
                    ...QRCodeHandler.HEADERS
                },
                params: {
                    appName: "aliyun_drive",
                    fromSite: "52",
                    _bx_v: "2.2.3"
                },
                data: {
                    ck: state.ck,
                    t: state.t,
                    appName: "aliyun_drive",
                    appEntrance: "web",
                    isMobile: "false",
                    lang: "zh_CN",
                    returnUrl: "",
                    navlanguage: "zh-CN",
                    bizParams: ""
                }
            }
        });
        const resData = res.data;

        if (!resData.data.content || !resData.data.content.data) {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }

        const status = resData.data.content.data.qrCodeStatus;

        if (status === "CONFIRMED") {
            if (resData.data.content.data.bizExt) {
                const bizExt = JSON.parse(atob(resData.data.content.data.bizExt));
                console.log('[_lib.scan.js]阿里扫码结果:', bizExt.pds_login_result);
                return {
                    status: QRCodeHandler.STATUS_CONFIRMED,
                    token: bizExt.pds_login_result.refreshToken
                };
            }
            return {status: QRCodeHandler.STATUS_EXPIRED};
        } else if (status === "SCANED") {
            return {status: QRCodeHandler.STATUS_SCANED};
        } else if (status === "CANCELED") {
            qrcode.platformStates[QRCodeHandler.PLATFORM_ALI] = null;
            return {status: QRCodeHandler.STATUS_CANCELED};
        } else if (status === "NEW") {
            return {status: QRCodeHandler.STATUS_NEW};
        } else {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }
    } catch (e) {
        console.error(e);
        log(`[_checkAliStatus] error:${e.message}`);
        throw new Error(e.response.data.message || e.message);
    }
}

async function _checkBaiduStatus(state, httpUrl) {
    let t3 = state.t3
    let t1 = state.t1
    let call = `tangram_guid_${t3}`
    let cookie = ''
    if (!state) {
        return {status: QRCodeHandler.STATUS_EXPIRED};
    }
    try {
        const res = await axios({
            url: httpUrl,
            method: "POST",
            data: {
                url: "https://passport.baidu.com/channel/unicast",
                method: "Get",
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.61 Chrome/126.0.6478.61 Not/A)Brand/8  Safari/537.36',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                    'DNT': '1',
                    'sec-ch-ua-mobile': '?0',
                    'Sec-Fetch-Site': 'same-site',
                    'Sec-Fetch-Mode': 'no-cors',
                    'Sec-Fetch-Dest': 'script',
                    'Referer': 'https://pan.baidu.com/',
                    'Accept-Language': 'zh-CN,zh;q=0.9',
                },
                params: {
                    'channel_id': state.channel_id,
                    'gid': state.request_id,
                    'tpl': 'netdisk',
                    '_sdkFrom': '1',
                    // 'callback': call,
                    'apiver': 'v3',
                    'tt': t3,
                    '_': t3,
                }
            }
        });
        const resData = res.data.data;
        let bduss = ''
        if (resData.channel_v) { // 扫码成功 {errno: 0,channel_id: '922c8743d86b7fa006f82454e653a1a2',channel_v: '{"status":1}'}
            console.log(resData);
            let bddata = JSON.parse(resData.channel_v);
            if (bddata.status === 1) { // 等待授权
                return {status: QRCodeHandler.STATUS_WAIT};
            }
            if (bddata.v) {
                bduss = bddata.v
            }
            const cookieRes = await axios({
                url: httpUrl,
                method: "POST",
                data: {
                    url: "https://passport.baidu.com/v3/login/main/qrbdusslogin",
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.61 Chrome/126.0.6478.61 Not/A)Brand/8  Safari/537.36',
                        'sec-ch-ua-platform': '"Windows"',
                        'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                        'DNT': '1',
                        'sec-ch-ua-mobile': '?0',
                        'Sec-Fetch-Site': 'same-site',
                        'Sec-Fetch-Mode': 'no-cors',
                        'Sec-Fetch-Dest': 'script',
                        'Referer': 'https://pan.baidu.com/',
                        'Accept-Language': 'zh-CN,zh;q=0.9',
                    },
                    params: {
                        'v': t3,
                        'bduss': bduss,
                        'u': 'https://pan.baidu.com/disk/main%23/index?category%3Dall',
                        'loginVersion': 'v5',
                        'qrcode': '1',
                        'tpl': 'netdisk',
                        'maskId': '',
                        'fileId': '',
                        'apiver': 'v3',
                        'tt': t3,
                        'traceid': '',
                        'time': t1,
                        'alg': 'v3',
                        'elapsed': '1',
                        // 'callback': 'bd__cbs__tro4ll'
                    },
                }
            });
            // 获取cookie
            let cookieData = cookieRes.data.data;
            // console.log('[_lib.scan] 扫码完毕,cookieData为:', cookieData);
            if (cookieData) {
                let bduss = cookieData.match(/"bduss": "(.*?)"/)[1]
                let stoken = cookieData.match(/"stoken": "(.*?)"/)[1]
                let ptoken = cookieData.match(/"ptoken": "(.*?)"/)[1]
                let ubi = encodeURIComponent(cookieData.match(/"ubi": "(.*?)"/)[1])
                let cookies = {
                    'newlogin': '1',
                    'UBI': ubi,
                    'STOKEN': stoken,
                    'BDUSS': bduss,
                    'PTOKEN': ptoken,
                    'BDUSS_BFESS': bduss,
                    'STOKEN_BFESS': stoken,
                    'PTOKEN_BFESS': ptoken,
                    'UBI_BFESS': ubi,
                }

                function buildk(params) {
                    return Object.keys(params)
                        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                        .join(';');
                }

                let headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                    'Referer': 'https://pan.baidu.com/',
                }
                headers.Cookie = buildk(cookies)
                // console.log('[_lib.scan] 扫码完毕,headers.Cookie为:', headers.Cookie);
                let data = await axios({
                    url: httpUrl,
                    method: "POST",
                    data: {
                        url: "https://passport.baidu.com/v3/login/api/auth/?return_type=5&tpl=netdisk&u=https://pan.baidu.com/disk/home",
                        headers: headers,
                        maxRedirects: 0
                    }
                }).catch(e => e.response)
                let lur = data.data.headers.location
                let ldata = await axios({
                    url: httpUrl,
                    method: "POST",
                    data: {
                        url: lur,
                        headers: headers,
                        maxRedirects: 0
                    }
                }).catch(e => e.response)
                let ck = ldata.data.headers['set-cookie']
                let stokenCookie = ''
                if (typeof ck === 'string') {
                    stokenCookie = ck.split(',').find(c => c.toLowerCase().includes('stoken')).split(';')[0]
                }
                cookie = "BDUSS=" + bduss + ";" + stokenCookie + ";"
            }
            qrcode.platformStates[QRCodeHandler.PLATFORM_BAIDU] = null;
            console.log('[_lib.scan] 扫码完毕,cookie为:', cookie);
            return {
                status: QRCodeHandler.STATUS_CONFIRMED,
                cookie: cookie
            };
        } else if (resData.data) { // token过期
            qrcode.platformStates[QRCodeHandler.PLATFORM_BAIDU] = null;
            return {status: QRCodeHandler.STATUS_EXPIRED};
        } else {
            return {status: QRCodeHandler.STATUS_NEW};
        }
    } catch (e) {
        qrcode.platformStates[QRCodeHandler.PLATFORM_BAIDU] = null;
        throw new Error(e.message);
    }
}

async function _checkBiliStatus(state, httpUrl) {
    try {
        const res = await axios({
            url: httpUrl,
            method: "POST",
            data: {
                url: "https://passport.bilibili.com/x/passport-login/web/qrcode/poll",
                headers: {
                    ...QRCodeHandler.HEADERS
                },
                params: {
                    qrcode_key: state.qrcode_key,
                    source: "main-mini"
                }
            }
        });
        const resData = res.data;

        if (resData.data.code !== 0) {
            throw new Error(resData.data.message);
        }

        if (resData.data.data.code === 86101) { // 未扫码
            return {status: QRCodeHandler.STATUS_NEW};
        } else if (resData.data.data.code === 86090) { // 已扫码未确认
            return {status: QRCodeHandler.STATUS_SCANED};
        } else if (resData.data.data.code === 0) { // 已确认
            const url = resData.data.data.url;
            let cookie = "";
            if (url) {
                const search = new URL(url).search;
                cookie = search.slice(1);
                cookie = decodeURIComponent(cookie);
            }
            return {
                status: QRCodeHandler.STATUS_CONFIRMED,
                cookie: cookie
            };
        } else { // 二维码过期
            qrcode.platformStates[QRCodeHandler.PLATFORM_BILI] = null;
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }
    } catch (e) {
        console.error(e);
        log(`[_checkBiliStatus] error:${e.message}`);
        throw new Error(e.response.data.message || e.message);
    }
}


$.exports = {
    QRCodeHandler,
    qrcode,
    formatCookiesToList,
    formatCookie,
    _checkQuarkStatus,
    _checkUCStatus,
    _checkAliStatus,
    _checkBiliStatus,
    _checkBaiduStatus,
}
