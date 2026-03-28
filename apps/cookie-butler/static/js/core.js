class QRCodeHandler {
    // 状态常量
    static STATUS_NEW = "NEW";            // 待扫描
    static STATUS_SCANED = "SCANED";      // 已扫描
    static STATUS_CONFIRMED = "CONFIRMED"; // 已确认
    static STATUS_CANCELED = "CANCELED";   // 已取消
    static STATUS_EXPIRED = "EXPIRED";     // 已过期

    // 平台常量
    static PLATFORM_QUARK = "quark";      // 夸克
    static PLATFORM_QUARK_TOKEN = "quark_token"
    static PLATFORM_ALI = "ali";          // 阿里云盘
    static PLATFORM_UC = "uc";            // UC
    static PLATFORM_UC_TOKEN = "uc_token";            // uc_token
    static PLATFORM_BILI = "bili";        // 哔哩哔哩
    static PLATFORM_YUN = "yun";           //移动
    static PLATFORM_BAIDU = "baidu";    //百度
    static PLATFORM_PIKPAK = "pikpak";  //pikpak

    // 通用请求头
    static HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2012K10C Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Mobile Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*'
    };

    constructor() {
        this.platformStates = {
            [QRCodeHandler.PLATFORM_QUARK]: null,
            [QRCodeHandler.PLATFORM_QUARK_TOKEN]: null,
            [QRCodeHandler.PLATFORM_ALI]: null,
            [QRCodeHandler.PLATFORM_UC]: null,
            [QRCodeHandler.PLATFORM_UC_TOKEN]: null,
            [QRCodeHandler.PLATFORM_BILI]: null,
            [QRCodeHandler.PLATFORM_YUN]: null,
            [QRCodeHandler.PLATFORM_BAIDU]: null,
            [QRCodeHandler.PLATFORM_PIKPAK]: null,
        };
        this.Addition = {
            DeviceID: '07b48aaba8a739356ab8107b5e230ad4', RefreshToken: '', AccessToken: ''
        }
        this.conf = {
            api: "https://open-api-drive.uc.cn",
            clientID: "5acf882d27b74502b7040b0c65519aa7",
            signKey: "l3srvtd7p42l0d0x1u8d7yc8ye9kki4d",
            appVer: "1.6.8",
            channel: "UCTVOFFICIALWEB",
            codeApi: "http://api.extscreen.com/ucdrive",
        };
        this.quark_conf = {
            api: "https://open-api-drive.quark.cn",
            clientID: "d3194e61504e493eb6222857bccfed94",
            signKey: "kw2dvtd7p4t3pjl2d9ed9yc8yej8kw2d",
            appVer: "1.5.6",
            channel: "CP",
            codeApi: "http://api.extscreen.com/quarkdrive",
        };
    }

    static generateUUID() {
        if (crypto && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        } else if (crypto && typeof crypto.getRandomValues === 'function') {
            return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
        } else {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        }
    }

    async _generateQRCode(url) {
        return new Promise((resolve, reject) => {
            QRCode.toDataURL(url, function (err, res) {
                if (err) reject(err);
                resolve(res);
            });
        });
    }

    formatCookiesToList(cookieString) {
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
    };

    formatCookie(cookies) {
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

    async startScan(platform) {
        switch (platform) {
            case QRCodeHandler.PLATFORM_QUARK:
                return await this._startQuarkScan();
            case QRCodeHandler.PLATFORM_QUARK_TOKEN:
                return await this._startQuark_TOKENScan();
            case QRCodeHandler.PLATFORM_ALI:
                return await this._startAliScan();
            case QRCodeHandler.PLATFORM_UC:
                return await this._startUCScan();
            case QRCodeHandler.PLATFORM_UC_TOKEN:
                return await this._startUC_TOKENScan();
            case QRCodeHandler.PLATFORM_BILI:
                return await this._startBiliScan();
            case QRCodeHandler.PLATFORM_YUN:
                return await this._startYunScan();
            case QRCodeHandler.PLATFORM_BAIDU:
                return await this._startBaiduScan();
            case QRCodeHandler.PLATFORM_PIKPAK:
                return await this._startPikPakScan();
            default:
                throw new Error("Unsupported platform");
        }
    }

    async checkStatus(platform) {
        switch (platform) {
            case QRCodeHandler.PLATFORM_QUARK:
                return await this._checkQuarkStatus();
            case QRCodeHandler.PLATFORM_QUARK_TOKEN:
                return await this._checkQuark_TOKENStatus();
            case QRCodeHandler.PLATFORM_ALI:
                return await this._checkAliStatus();
            case QRCodeHandler.PLATFORM_UC:
                return await this._checkUCStatus();
            case QRCodeHandler.PLATFORM_UC_TOKEN:
                return await this._checkUC_TOKENStatus();
            case QRCodeHandler.PLATFORM_BILI:
                return await this._checkBiliStatus();
            case QRCodeHandler.PLATFORM_YUN:
                return await this._checkYunStatus();
            case QRCodeHandler.PLATFORM_BAIDU:
                return await this._checkBaiduStatus();
            case QRCodeHandler.PLATFORM_PIKPAK:
                return await this._checkPikPakStatus();
            default:
                throw new Error("Unsupported platform");
        }
    }

    // 夸克平台相关方法
    async _startQuarkScan() {
        try {
            const requestId = QRCodeHandler.generateUUID();
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://uop.quark.cn/cas/ajax/getTokenForQrcodeLogin", headers: {
                        ...QRCodeHandler.HEADERS
                    }, params: {
                        request_id: requestId, client_id: "532", v: "1.2"
                    },
                }
            });
            const resData = res.data;
            const qcToken = resData.data.data.members.token;

            const qrUrl = `https://su.quark.cn/4_eMHBJ?token=${qcToken}&client_id=532&ssb=weblogin&uc_param_str=&uc_biz_str=S%3Acustom%7COPT%3ASAREA%400%7COPT%3AIMMERSIVE%401%7COPT%3ABACK_BTN_STYLE%400`;

            this.platformStates[QRCodeHandler.PLATFORM_QUARK] = {
                token: qcToken, request_id: requestId
            };

            const qrCode = await this._generateQRCode(qrUrl);
            return {
                qrcode: qrCode, status: QRCodeHandler.STATUS_NEW
            };
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_QUARK] = null;
            throw e;
        }
    }

    async _checkQuarkStatus() {
        const state = this.platformStates[QRCodeHandler.PLATFORM_QUARK];
        if (!state) {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }

        try {
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://uop.quark.cn/cas/ajax/getServiceTicketByQrcodeToken", headers: {
                        ...QRCodeHandler.HEADERS
                    }, params: {
                        request_id: state.request_id, client_id: "532", v: "1.2", token: state.token
                    }
                }
            });
            const resData = res.data;

            if (resData.data.status === 2000000) { // 扫码成功
                const serviceTicket = resData.data.data.members.service_ticket;
                const cookieRes = await axios({
                    url: "/http", method: "POST", data: {
                        url: "https://pan.quark.cn/account/info", headers: {
                            ...QRCodeHandler.HEADERS
                        }, params: {
                            st: serviceTicket, lw: "scan"
                        }
                    }
                });
                const cookieResData = cookieRes.data;
                const cookies = Array.isArray(cookieResData.headers['set-cookie']) ? cookieResData.headers['set-cookie'].join('; ') : cookieResData.headers['set-cookie'];
                const cookies2array = this.formatCookiesToList(cookies);
                let mainCookies = this.formatCookie(cookies2array);
                const cookieSelfRes = await axios({
                    url: "/http", method: "POST", data: {
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
                const cookies2arraySelf = this.formatCookiesToList(cookiesSelf);
                const mainCookiesSelf = this.formatCookie(cookies2arraySelf);
                if (mainCookiesSelf) mainCookies += ';' + mainCookiesSelf;
                return {
                    status: QRCodeHandler.STATUS_CONFIRMED, cookie: mainCookies
                };
            } else if (resData.data.status === 50004002) { // token过期
                this.platformStates[QRCodeHandler.PLATFORM_QUARK] = null;
                return {status: QRCodeHandler.STATUS_EXPIRED};
            } else {
                return {status: QRCodeHandler.STATUS_NEW};
            }
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_QUARK] = null;
            throw new Error(e.response.data.message || e.message);
        }
    }

    // 阿里云盘平台相关方法
    async _startAliScan() {
        try {
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://passport.aliyundrive.com/newlogin/qrcode/generate.do", headers: {
                        ...QRCodeHandler.HEADERS
                    }, params: {
                        appName: "aliyun_drive",
                        fromSite: "52",
                        appEntrance: "web",
                        isMobile: "false",
                        lang: "zh_CN",
                        returnUrl: "",
                        bizParams: "",
                        _bx_v: "2.2.3"
                    }
                }
            });
            const resData = res.data;
            const contentData = resData.data.content.data;
            this.platformStates[QRCodeHandler.PLATFORM_ALI] = {
                ck: contentData.ck, t: contentData.t
            };
            const qrCode = await this._generateQRCode(contentData.codeContent);
            return {
                qrcode: qrCode, status: QRCodeHandler.STATUS_NEW
            };
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_ALI] = null;
            throw e;
        }
    }

    async _checkAliStatus() {
        const state = this.platformStates[QRCodeHandler.PLATFORM_ALI];
        if (!state) {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }

        try {
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://passport.aliyundrive.com/newlogin/qrcode/query.do", method: "POST", headers: {
                        ...QRCodeHandler.HEADERS
                    }, params: {
                        appName: "aliyun_drive", fromSite: "52", _bx_v: "2.2.3"
                    }, data: {
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
                    console.log(bizExt.pds_login_result);
                    return {
                        status: QRCodeHandler.STATUS_CONFIRMED, token: bizExt.pds_login_result.refreshToken
                    };
                }
                return {status: QRCodeHandler.STATUS_EXPIRED};
            } else if (status === "SCANED") {
                return {status: QRCodeHandler.STATUS_SCANED};
            } else if (status === "CANCELED") {
                this.platformStates[QRCodeHandler.PLATFORM_ALI] = null;
                return {status: QRCodeHandler.STATUS_CANCELED};
            } else if (status === "NEW") {
                return {status: QRCodeHandler.STATUS_NEW};
            } else {
                return {status: QRCodeHandler.STATUS_EXPIRED};
            }
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_ALI] = null;
            throw new Error(e.message);
        }
    }

    // UC平台相关方法
    async _startUCScan() {
        try {
            const requestId = QRCodeHandler.generateUUID();
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://api.open.uc.cn/cas/ajax/getTokenForQrcodeLogin", headers: {
                        ...QRCodeHandler.HEADERS
                    }, params: {
                        __t: Date.now()
                    }, data: {
                        v: "1.2", request_id: requestId, client_id: "381"
                    }
                }
            });
            const resData = res.data;
            const token = resData.data.data.members.token;
            const qrUrl = `https://su.uc.cn/1_n0ZCv?token=${token}&client_id=381&uc_param_str=&uc_biz_str=S%3Acustom%7CC%3Atitlebar_fix`;

            this.platformStates[QRCodeHandler.PLATFORM_UC] = {
                token: token, request_id: requestId
            };
            const qrCode = await this._generateQRCode(qrUrl);
            return {
                qrcode: qrCode, status: QRCodeHandler.STATUS_NEW
            };
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_UC] = null;
            throw e;
        }
    }

    async _checkUCStatus() {
        const state = this.platformStates[QRCodeHandler.PLATFORM_UC];
        if (!state) {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }
        try {

            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://api.open.uc.cn/cas/ajax/getServiceTicketByQrcodeToken", method: "POST", headers: {
                        ...QRCodeHandler.HEADERS
                    }, params: {
                        __t: Date.now()
                    }, data: {
                        v: "1.2", request_id: state.request_id, client_id: "381", token: state.token
                    }
                }
            });
            // this.code = await this.getCode(this.token)
            // let access_token = await this.refreshToken(this.code);
            // console.log(access_token)
            const resData = res.data;
            if (resData.data.status === 2000000) { // 扫码成功

                const serviceTicket = resData.data.data.members.service_ticket;
                const cookieRes = await axios({
                    url: "/http", method: "POST", data: {
                        url: "https://drive.uc.cn/account/info", headers: {
                            ...QRCodeHandler.HEADERS
                        }, params: {
                            st: serviceTicket
                        },
                    }
                });
                const cookieResData = cookieRes.data;
                const cookies = cookieResData.headers['set-cookie'];
                const cookies2array = this.formatCookiesToList(cookies);
                let mainCookies = this.formatCookie(cookies2array);
                const cookieSelfRes = await axios({
                    url: "/http", method: "POST", data: {
                        url: "https://pc-api.uc.cn/1/clouddrive/config?pr=UCBrowser&fr=pc", headers: {
                            ...QRCodeHandler.HEADERS,
                            Origin: 'https://drive.uc.cn',
                            Referer: 'https://drive.uc.cn/',
                            Cookie: mainCookies
                        }
                    }
                });
                const cookieResDataSelf = cookieSelfRes.data;
                const cookiesSelf = Array.isArray(cookieResDataSelf.headers['set-cookie']) ? cookieResDataSelf.headers['set-cookie'].join('; ') : cookieResDataSelf.headers['set-cookie'];
                const cookies2arraySelf = this.formatCookiesToList(cookiesSelf);
                const mainCookiesSelf = this.formatCookie(cookies2arraySelf);
                if (mainCookiesSelf) mainCookies += ';' + mainCookiesSelf;
                this.platformStates[QRCodeHandler.PLATFORM_UC] = null;
                return {
                    status: QRCodeHandler.STATUS_CONFIRMED, cookie: mainCookies
                };
            } else if (resData.data.status === 50004002) { // token过期
                this.platformStates[QRCodeHandler.PLATFORM_UC] = null;
                return {status: QRCodeHandler.STATUS_EXPIRED};
            } else {
                return {status: QRCodeHandler.STATUS_NEW};
            }
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_UC] = null;
            throw new Error(e.message);
        }
    }

    arrayBufferToBase64(buffer) {
        // 将 ArrayBuffer 转为 Uint8Array（字节数组）
        const bytes = new Uint8Array(buffer);
        // 将每个字节转为字符，拼接成字符串（需确保二进制安全）
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        // 用 btoa 将二进制字符串转为 Base64（btoa 支持单字节字符串）
        return btoa(binary);
    }

    async _getQRCode(url) {
        let arrayBufferData = await axios({
            url: "/http", method: "POST", data: {
                url: url, headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.61 Chrome/126.0.6478.61 Not/A)Brand/8  Safari/537.36',
                }, responseType: 'arraybuffer'
            }
        });
        let base64Images = this.arrayBufferToBase64(arrayBufferData.data.data.data)
        return 'data:image/png;base64,' + base64Images;
    }

    async _startBaiduScan() {
        try {
            const requestId = QRCodeHandler.generateUUID();
            let t3 = new Date().getTime().toString()
            let t1 = Math.floor(new Date().getTime() / 1000).toString()
            let call = `tangram_guid_${t3}`
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://passport.baidu.com/v2/api/getqrcode", headers: {
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
                    }, params: {
                        "lp": "pc",
                        "qrloginfrom": "pc",
                        "gid": requestId, // "callback": `tangram_guid_${t3}`,
                        "apiver": "v3",
                        "tt": `${t3}`,
                        "tpl": "netdisk",
                        "logPage": `traceId%3Apc_loginv5_${t1}%2ClogPage%3Aloginv5`,
                        "_": `${t3}`
                    }
                }
            });
            const resData = res.data.data;
            const qrUrl = 'https://' + resData.imgurl
            let channel_id = resData.sign
            this.platformStates[QRCodeHandler.PLATFORM_BAIDU] = {
                t1: t1, t3: t3, channel_id: channel_id, request_id: requestId

            };
            const qrCode = await this._getQRCode(qrUrl);
            return {
                qrcode: qrCode, status: QRCodeHandler.STATUS_NEW
            };
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_BAIDU] = null;
            throw e;
        }
    }

    async _checkBaiduStatus() {
        const state = this.platformStates[QRCodeHandler.PLATFORM_BAIDU];
        let t3 = state.t3
        let t1 = state.t1
        let call = `tangram_guid_${t3}`
        let cookie = ''
        if (!state) {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }
        try {
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://passport.baidu.com/channel/unicast", method: "Get", headers: {
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
                    }, params: {
                        'channel_id': state.channel_id,
                        'gid': state.request_id,
                        'tpl': 'netdisk',
                        '_sdkFrom': '1', // 'callback': call,
                        'apiver': 'v3',
                        'tt': t3,
                        '_': t3,
                    }
                }
            });
            const resData = res.data.data;
            let bduss = ''
            if (resData.channel_v) { // 扫码成功
                let bddata = JSON.parse(resData.channel_v);
                if (bddata.v) {
                    bduss = bddata.v
                }
                const cookieRes = await axios({
                    url: "/http", method: "POST", data: {
                        url: "https://passport.baidu.com/v3/login/main/qrbdusslogin", headers: {
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
                        }, params: {
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
                            'elapsed': '1', // 'callback': 'bd__cbs__tro4ll'
                        },
                    }
                });
                // 获取cookie
                let cookieData = cookieRes.data.data;
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
                    let data = await axios({
                        url: "/http", method: "POST", data: {
                            url: "https://passport.baidu.com/v3/login/api/auth/?return_type=5&tpl=netdisk&u=https://pan.baidu.com/disk/home",
                            headers: headers,
                            maxRedirects: 0
                        }
                    }).catch(e => e.response)
                    let lur = data.data.headers.location
                    let ldata = await axios({
                        url: "/http", method: "POST", data: {
                            url: lur, headers: headers, maxRedirects: 0
                        }
                    }).catch(e => e.response)
                    let ck = ldata.data.headers['set-cookie']
                    let stokenCookie = ''
                    if (typeof ck === 'string') {
                        stokenCookie = ck.split(',').find(c => c.toLowerCase().includes('stoken')).split(';')[0]
                    }
                    cookie = "BDUSS=" + bduss + ";" + stokenCookie + ";"
                }
                this.platformStates[QRCodeHandler.PLATFORM_BAIDU] = null;
                return {
                    status: QRCodeHandler.STATUS_CONFIRMED, cookie: cookie
                };
            } else if (resData.data) { // token过期
                this.platformStates[QRCodeHandler.PLATFORM_BAIDU] = null;
                return {status: QRCodeHandler.STATUS_EXPIRED};
            } else {
                return {status: QRCodeHandler.STATUS_NEW};
            }
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_BAIDU] = null;
            throw new Error(e.message);
        }
    }

    async _startPikPakScan() {
        try {
            const requestId = QRCodeHandler.generateUUID();
            let client_id = "YUMx5nI8ZU8Ap8pm"
            let device_code = ''
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://user.mypikpak.com/v1/auth/device/code", method: "POST", headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
                        "Accept-Encoding": "gzip, deflate, br",
                        "Content-Type": "application/json",
                        "accept-language": "zh-TW",
                        "referer": "https://mypikpak.com/",
                        "x-client-id": client_id,
                        "x-device-id": "1dbab4c32bbb4e00829dcdd0d2e38a16"
                    }, data: {
                        "scope": "user", "client_id": client_id
                    }, proxy_flag: true
                }
            });
            const resData = res.data.data;
            const qrUrl = resData.verification_uri_complete
            device_code = resData.device_code
            this.platformStates[QRCodeHandler.PLATFORM_PIKPAK] = {
                client_id: client_id, device_code: device_code

            };
            const qrCode = await this._generateQRCode(qrUrl);
            return {
                qrcode: qrCode, status: QRCodeHandler.STATUS_NEW
            };
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_PIKPAK] = null;
            throw e;
        }
    }

    async _checkPikPakStatus() {
        const state = this.platformStates[QRCodeHandler.PLATFORM_PIKPAK];
        if (!state) {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }
        try {
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://user.mypikpak.com/v1/auth/token", method: "POST", headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.61 Chrome/126.0.6478.61 Not/A)Brand/8  Safari/537.36',
                        'Referer': 'https://pan.baidu.com/',
                        'Accept-Language': 'zh-CN,zh;q=0.9',
                    }, data: {
                        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                        "device_code": state.device_code,
                        "client_id": state.client_id
                    }, proxy_flag: true
                }
            });
            const resData = res.data;
            if (resData.status === 200) {
                this.platformStates[QRCodeHandler.PLATFORM_PIKPAK] = null;
                return {
                    status: QRCodeHandler.STATUS_CONFIRMED,
                    token: resData.data.token_type + ' ' + resData.data.access_token + ';' + resData.data.refresh_token,
                };
            }
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_PIKPAK] = null;
            throw new Error(e.message);
        }
    }

    generateDeviceID(timestamp) {
        return CryptoJS.MD5(timestamp).toString().slice(0, 16); // 取前16位
    }

    generateReqId(deviceID, timestamp) {
        return CryptoJS.MD5(deviceID + timestamp).toString().slice(0, 16);
    }

    generateXPanToken(method, pathname, timestamp, key) {
        const data = method + '&' + pathname + '&' + timestamp + '&' + key;
        return CryptoJS.SHA256(data).toString();
    }

    //uc_token
    async _startUC_TOKENScan() {
        try {
            const pathname = '/oauth/authorize'
            const timestamp = Math.floor(Date.now() / 1000).toString() + '000'; // 13位时间戳需调整
            const deviceID = this.Addition.DeviceID || this.generateDeviceID(timestamp);
            const reqId = this.generateReqId(deviceID, timestamp);
            const token = this.generateXPanToken('GET', pathname, timestamp, this.conf.signKey);
            const headers = {
                Accept: 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Linux; U; Android 13; zh-cn; M2004J7AC Build/UKQ1.231108.001) AppleWebKit/533.1 (KHTML, like Gecko) Mobile Safari/533.1',
                'x-pan-tm': timestamp,
                'x-pan-token': token,
                'x-pan-client-id': this.conf.clientID, ...(this.Addition.AccessToken ? {'Authorization': `Bearer ${this.Addition.AccessToken}`} : {})
            };
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: `${this.conf.api}${pathname}`, headers: headers, params: {
                        req_id: reqId,
                        access_token: this.Addition.AccessToken,
                        app_ver: this.conf.appVer,
                        device_id: deviceID,
                        device_brand: 'Xiaomi',
                        platform: 'tv',
                        device_name: 'M2004J7AC',
                        device_model: 'M2004J7AC',
                        build_device: 'M2004J7AC',
                        build_product: 'M2004J7AC',
                        device_gpu: 'Adreno (TM) 550',
                        activity_rect: '{}',
                        channel: this.conf.channel,
                        auth_type: 'code',
                        client_id: this.conf.clientID,
                        scope: 'netdisk',
                        qrcode: '1',
                        qr_width: '460',
                        qr_height: '460',
                    },
                }
            });
            const resData = res.data;
            this.query_token = resData.data.query_token;
            const qrCode = resData.data.qr_data;
            this.platformStates[QRCodeHandler.PLATFORM_UC_TOKEN] = {
                query_token: this.query_token, request_id: reqId
            };
            return {
                qrcode: 'data:image/png;base64,' + qrCode, status: QRCodeHandler.STATUS_NEW
            };
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_UC_TOKEN] = null;
            throw e;
        }
    }

    async _checkUC_TOKENStatus() {
        const state = this.platformStates[QRCodeHandler.PLATFORM_UC_TOKEN];
        if (!state) {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }
        const pathname = '/oauth/code';
        const timestamp = Math.floor(Date.now() / 1000).toString() + '000'; // 13位时间戳需调整
        const deviceID = this.Addition.DeviceID || this.generateDeviceID(timestamp);
        const reqId = this.generateReqId(deviceID, timestamp);
        const x_pan_token = this.generateXPanToken("GET", pathname, timestamp, this.conf.signKey);
        const headers = {
            Accept: 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Linux; U; Android 13; zh-cn; M2004J7AC Build/UKQ1.231108.001) AppleWebKit/533.1 (KHTML, like Gecko) Mobile Safari/533.1',
            'x-pan-tm': timestamp,
            'x-pan-token': x_pan_token,
            'x-pan-client-id': this.conf.clientID, ...(this.Addition.AccessToken ? {'Authorization': `Bearer ${this.Addition.AccessToken}`} : {})
        };
        try {
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: `${this.conf.api}${pathname}`, headers: headers, params: {
                        req_id: reqId,
                        access_token: this.Addition.AccessToken,
                        app_ver: this.conf.appVer,
                        device_id: deviceID,
                        device_brand: 'Xiaomi',
                        platform: 'tv',
                        device_name: 'M2004J7AC',
                        device_model: 'M2004J7AC',
                        build_device: 'M2004J7AC',
                        build_product: 'M2004J7AC',
                        device_gpu: 'Adreno (TM) 550',
                        activity_rect: '{}',
                        channel: this.conf.channel,
                        client_id: this.conf.clientID,
                        scope: 'netdisk',
                        query_token: this.query_token
                    }
                }
            }).catch(err => err.response);
            const resData = res.data;
            if (resData.status === 200) { // 扫码成功
                const pathname = '/token';
                const timestamp = Math.floor(Date.now() / 1000).toString() + '000';
                const reqId = this.generateReqId(this.Addition.DeviceID, timestamp);
                const data = JSON.stringify({
                    req_id: reqId,
                    app_ver: this.conf.appVer,
                    device_id: this.Addition.DeviceID,
                    device_brand: 'Xiaomi',
                    platform: 'tv',
                    device_name: 'M2004J7AC',
                    device_model: 'M2004J7AC',
                    build_device: 'M2004J7AC',
                    build_product: 'M2004J7AC',
                    device_gpu: 'Adreno (TM) 550',
                    activity_rect: '{}',
                    channel: this.conf.channel,
                    code: resData.data.code
                });
                const response = await axios({
                    url: '/http', method: "POST", data: {
                        url: `${this.conf.codeApi}${pathname}`, method: "POST", headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*',
                            'Content-Type': 'application/json',
                        }, data: data
                    }
                });
                const resp = response.data;
                if (resp.status === 200) {
                    this.platformStates[QRCodeHandler.PLATFORM_UC_TOKEN] = null;
                    return {
                        status: QRCodeHandler.STATUS_CONFIRMED, cookie: resp.data.data.access_token
                    };
                }

            } else if (resData.status === 400) {
                return {status: QRCodeHandler.STATUS_NEW};
            }
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_UC_TOKEN] = null;
            throw new Error(e.message);
        }
    }

    //quark_token
    async _startQuark_TOKENScan() {
        try {
            const pathname = '/oauth/authorize'
            const timestamp = Math.floor(Date.now() / 1000).toString() + '000'; // 13位时间戳需调整
            const deviceID = this.Addition.DeviceID || this.generateDeviceID(timestamp);
            const reqId = this.generateReqId(deviceID, timestamp);
            const token = this.generateXPanToken('GET', pathname, timestamp, this.quark_conf.signKey);
            const headers = {
                Accept: 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Linux; U; Android 13; zh-cn; M2004J7AC Build/UKQ1.231108.001) AppleWebKit/533.1 (KHTML, like Gecko) Mobile Safari/533.1',
                'x-pan-tm': timestamp,
                'x-pan-token': token,
                'x-pan-client-id': this.quark_conf.clientID, ...(this.Addition.AccessToken ? {'Authorization': `Bearer ${this.Addition.AccessToken}`} : {})
            };
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: `${this.quark_conf.api}${pathname}`, headers: headers, params: {
                        req_id: reqId,
                        access_token: this.Addition.AccessToken,
                        app_ver: this.quark_conf.appVer,
                        device_id: deviceID,
                        device_brand: 'Xiaomi',
                        platform: 'tv',
                        device_name: 'M2004J7AC',
                        device_model: 'M2004J7AC',
                        build_device: 'M2004J7AC',
                        build_product: 'M2004J7AC',
                        device_gpu: 'Adreno (TM) 550',
                        activity_rect: '{}',
                        channel: this.quark_conf.channel,
                        auth_type: 'code',
                        client_id: this.quark_conf.clientID,
                        scope: 'netdisk',
                        qrcode: '1',
                        qr_width: '460',
                        qr_height: '460',
                    },
                }
            });
            const resData = res.data;
            this.query_token = resData.data.query_token;
            const qrCode = resData.data.qr_data;
            this.platformStates[QRCodeHandler.PLATFORM_QUARK_TOKEN] = {
                query_token: this.query_token, request_id: reqId
            };
            return {
                qrcode: 'data:image/png;base64,' + qrCode, status: QRCodeHandler.STATUS_NEW
            };
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_QUARK_TOKEN] = null;
            throw e;
        }
    }

    async _checkQuark_TOKENStatus() {
        const state = this.platformStates[QRCodeHandler.PLATFORM_QUARK_TOKEN];
        if (!state) {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }
        const pathname = '/oauth/code';
        const timestamp = Math.floor(Date.now() / 1000).toString() + '000'; // 13位时间戳需调整
        const deviceID = this.Addition.DeviceID || this.generateDeviceID(timestamp);
        const reqId = this.generateReqId(deviceID, timestamp);
        const x_pan_token = this.generateXPanToken("GET", pathname, timestamp, this.quark_conf.signKey);
        const headers = {
            Accept: 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Linux; U; Android 13; zh-cn; M2004J7AC Build/UKQ1.231108.001) AppleWebKit/533.1 (KHTML, like Gecko) Mobile Safari/533.1',
            'x-pan-tm': timestamp,
            'x-pan-token': x_pan_token,
            'x-pan-client-id': this.quark_conf.clientID, ...(this.Addition.AccessToken ? {'Authorization': `Bearer ${this.Addition.AccessToken}`} : {})
        };
        try {
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: `${this.quark_conf.api}${pathname}`, headers: headers, params: {
                        req_id: reqId,
                        access_token: this.Addition.AccessToken,
                        app_ver: this.quark_conf.appVer,
                        device_id: deviceID,
                        device_brand: 'Xiaomi',
                        platform: 'tv',
                        device_name: 'M2004J7AC',
                        device_model: 'M2004J7AC',
                        build_device: 'M2004J7AC',
                        build_product: 'M2004J7AC',
                        device_gpu: 'Adreno (TM) 550',
                        activity_rect: '{}',
                        channel: this.quark_conf.channel,
                        client_id: this.quark_conf.clientID,
                        scope: 'netdisk',
                        query_token: this.query_token
                    }
                }
            }).catch(err => err.response);
            const resData = res.data;
            if (resData.status === 200) { // 扫码成功
                const pathname = '/token';
                const timestamp = Math.floor(Date.now() / 1000).toString() + '000';
                const reqId = this.generateReqId(this.Addition.DeviceID, timestamp);
                const data = JSON.stringify({
                    req_id: reqId,
                    app_ver: this.quark_conf.appVer,
                    device_id: this.Addition.DeviceID,
                    device_brand: 'Xiaomi',
                    platform: 'tv',
                    device_name: 'M2004J7AC',
                    device_model: 'M2004J7AC',
                    build_device: 'M2004J7AC',
                    build_product: 'M2004J7AC',
                    device_gpu: 'Adreno (TM) 550',
                    activity_rect: '{}',
                    channel: this.quark_conf.channel,
                    code: resData.data.code
                });
                const response = await axios({
                    url: '/http', method: "POST", data: {
                        url: `${this.quark_conf.codeApi}${pathname}`, method: "POST", headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*',
                            'Content-Type': 'application/json',
                        }, data: data
                    }
                });
                const resp = response.data;
                if (resp.status === 200) {
                    this.platformStates[QRCodeHandler.PLATFORM_QUARK_TOKEN] = null;
                    return {
                        status: QRCodeHandler.STATUS_CONFIRMED, cookie: resp.data.data.access_token
                    };
                }

            } else if (resData.status === 400) {
                return {status: QRCodeHandler.STATUS_NEW};
            }
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_QUARK_TOKEN] = null;
            throw new Error(e.message);
        }
    }

    // 哔哩哔哩平台相关方法
    async _startBiliScan() {
        try {
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://passport.bilibili.com/x/passport-login/web/qrcode/generate", headers: {
                        ...QRCodeHandler.HEADERS
                    }, params: {
                        source: "main-mini"
                    }
                }
            });
            const resData = res.data;
            console.log(resData)

            if (resData.data.code !== 0) {
                throw new Error(resData.data.message);
            }

            const qrcodeData = resData.data.data;
            this.platformStates[QRCodeHandler.PLATFORM_BILI] = {
                qrcode_key: qrcodeData.qrcode_key
            };

            const qrCode = await this._generateQRCode(qrcodeData.url);
            return {
                qrcode: qrCode, status: QRCodeHandler.STATUS_NEW
            };
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_BILI] = null;
            throw new Error(e.message);
        }
    }

    async _checkBiliStatus() {
        const state = this.platformStates[QRCodeHandler.PLATFORM_BILI];
        if (!state) {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }

        try {
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://passport.bilibili.com/x/passport-login/web/qrcode/poll", headers: {
                        ...QRCodeHandler.HEADERS
                    }, params: {
                        qrcode_key: state.qrcode_key, source: "main-mini"
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
                    status: QRCodeHandler.STATUS_CONFIRMED, cookie: cookie
                };
            } else { // 二维码过期
                this.platformStates[QRCodeHandler.PLATFORM_BILI] = null;
                return {status: QRCodeHandler.STATUS_EXPIRED};
            }
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_BILI] = null;
            throw new Error(e.message);
        }
    }

    //移动
    getRandomSring(e) {
        for (var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", a = "", n = 0; n < e; n++) {
            var o = Math.floor(Math.random() * t.length);
            a += t.substring(o, o + 1)
        }
        return a
    }

    async _startYunScan() {
        try {
            let time = new Date(+new Date() + 8 * 3600 * 1000).toJSON().substr(0, 19).replace('T', ' ');
            let key = this.getRandomSring(16);
            const data = {
                "clientCode": "10701", "type": 1
            }
            let sign = this.getNewSign(undefined, data, time, key);
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://yun.139.com/orchestration/auth-rebuild/key/v1.0/getRsaPublicKey",
                    method: "POST",
                    headers: {
                        "Caller": "web",
                        "CMS-DEVICE": "default",
                        "mcloud-channel": "1000101",
                        "mcloud-client": "10701",
                        "mcloud-sign": time + "," + key + "," + sign,
                        "mcloud-skey": '',
                        "mcloud-version": "7.17.0",
                        "X-DeviceInfo": "||9|7.17.0|chrome|142.0.0.0|67320742f0cb68aab9890b8ad5cbb2e4||windows 10||zh|||",
                        "X-Huawei-ChannelSrc": "10000034",
                        "X-Inner-Ntwk": "2",
                        "X-M4C-Caller": "PC",
                        "X-M4C-Src": "10002",
                        "X-SvcType": "1",
                        "X-Yun-Api-Version": "v1",
                        "X-Yun-App-Channel": "10000034",
                        "X-Yun-Channel-Source": "10000034",
                        "X-Yun-Client-Info": "||9|7.17.0|chrome|142.0.0.0|67320742f0cb68aab9890b8ad5cbb2e4||windows 10||zh|||",
                        "X-Yun-Module-Type": "100",
                        "X-Yun-Svc-Type": "1"
                    },
                    data: data
                }
            });
            let publicKey = res.data.data.data.publicKey;
            let qrcSessionID = this.getRandomSring(16)
            let e = "https://yun.139.com/w/#/qrcLogin?sID=".concat(qrcSessionID, "&dID=").concat('67320742f0cb68aab9890b8ad5cbb2e4', "&cType=9")
            const qrCode = await this._generateQRCode(e);
            this.platformStates[QRCodeHandler.PLATFORM_YUN] = {
                dycPwd: qrcSessionID, publicKey: publicKey,
            };
            return {
                qrcode: qrCode, status: QRCodeHandler.STATUS_NEW
            };
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_YUN] = null;
            throw e;
        }
    }

    AESEncrypt(e, t) {
        const r = CryptoJS.AES.encrypt(e, CryptoJS.enc.Utf8.parse(t), {
            mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7
        });
        return r.toString()
    }

    AESDecrypt(e, t) {
        var r = CryptoJS.AES.decrypt(e, CryptoJS.enc.Utf8.parse(t), {
            mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7
        });
        return r.toString(CryptoJS.enc.Utf8)
    }

    getNewSign(e, t, a, n) {
        var r = "", i = "";
        if (t) {
            var s = Object.assign({}, t);
            i = JSON.stringify(s), i = encodeURIComponent(i);
            var u = i.split(""), l = u.sort();
            i = l.join("")
        }
        var d = CryptoJS.MD5(btoa(i)).toString(), p = CryptoJS.MD5(a + ":" + n).toString();
        return CryptoJS.MD5(d + p).toString().toUpperCase()
    }

    rsaEncrypt(e, t) {
        var a = new JSEncrypt();
        return a.setPublicKey(t), a.encrypt(e.toString())
    }

    enCodeToken(e, t) {
        try {
            if (!e || !t) return "";
            var a = "pc:".concat(e, ":").concat(t);
            return "Basic ".concat(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(a)))
        } catch (n) {
        }
    }

    async _checkYunStatus() {
        const state = this.platformStates[QRCodeHandler.PLATFORM_YUN];
        if (!state) {
            return {status: QRCodeHandler.STATUS_EXPIRED};
        }
        let e = {
            "dycPwd": state.dycPwd, "loginStyle": "QRCode", "clientEnv": "3", "setCookie": 0
        }
        let time = new Date(+new Date() + 8 * 3600 * 1000).toJSON().substr(0, 19).replace('T', ' ');
        let key = this.getRandomSring(16);
        let encryptMsg = this.AESEncrypt(JSON.stringify(e), key)
        let data = {
            "encryptMsg": encryptMsg, "clientId": "10701", "returnToken": true
        }
        let sign = this.getNewSign(undefined, data, time, key);
        // let publicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCMQm8Ux+tji3IgoRqv4shpbtuYyIW4k7jUThPWlb4ECXVJdss+NvJKpHBrQ4N0+Np4HR9KVWzea/ANIV1N7by0qNGRZyn5Xjyc/6GSKZwUXJHrsrCyFTGyKJW5kgiJCy0AhruGqLxoArXPvhMJJ9iWb17IRmCN9bc1iOjURyU1RQIDAQAB'
        let publicKey = state.publicKey;
        let skey = this.rsaEncrypt(key, publicKey)
        try {
            const res = await axios({
                url: "/http", method: "POST", data: {
                    url: "https://yun.139.com/orchestration/auth-rebuild/permission/v1.0/login",
                    method: "POST",
                    headers: {
                        "Caller": "web",
                        "CMS-DEVICE": "default",
                        "mcloud-channel": "1000101",
                        "mcloud-client": "10701",
                        "mcloud-sign": time + "," + key + "," + sign,
                        "mcloud-skey": skey,
                        "mcloud-version": "7.17.0",
                        "X-DeviceInfo": "||9|7.17.0|chrome|142.0.0.0|67320742f0cb68aab9890b8ad5cbb2e4||windows 10||zh|||",
                        "X-Huawei-ChannelSrc": "10000034",
                        "X-Inner-Ntwk": "2",
                        "X-M4C-Caller": "PC",
                        "X-M4C-Src": "10002",
                        "X-SvcType": "1",
                        "X-Yun-Api-Version": "v1",
                        "X-Yun-App-Channel": "10000034",
                        "X-Yun-Channel-Source": "10000034",
                        "X-Yun-Client-Info": "||9|7.17.0|chrome|142.0.0.0|67320742f0cb68aab9890b8ad5cbb2e4||windows 10||zh|||",
                        "X-Yun-Module-Type": "100",
                        "X-Yun-Svc-Type": "1"
                    },
                    data: data
                }
            });
            const resData = res.data.data;
            if (resData.code === "0" && resData.data?.authToken) {
                this.platformStates[QRCodeHandler.PLATFORM_YUN] = null;
                let token = btoa(resData.data.authToken)
                return {
                    status: QRCodeHandler.STATUS_CONFIRMED, token: token,
                };
            }
        } catch (e) {
            this.platformStates[QRCodeHandler.PLATFORM_YUN] = null;
            throw new Error(e.message);
        }
    }
}
