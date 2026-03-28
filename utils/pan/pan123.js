/**
 * 123网盘API操作类
 * 提供123网盘的文件分享、下载、播放等功能
 */

import axios from "axios";
import {ENV} from "../env.js";
import {base64Decode} from "../../libs_drpy/crypto-util.js";

/**
 * 123网盘操作类
 * 支持文件分享链接解析、文件列表获取、下载链接生成等功能
 */
class Pan123 {
    constructor() {
        // 支持的123网盘域名正则表达式
        this.regex = /https:\/\/(www.123684.com|www.123865.com|www.123912.com|www.123pan.com|www.123pan.cn|www.123592.com)\/s\/([^\\/]+)/
        this.api = 'https://www.123684.com/b/api/share/';
        this.loginUrl = 'https://login.123pan.com/api/user/sign_in';
        this.cate = ''
    }

    /**
     * 初始化方法，检查登录状态
     */
    async init() {
        if (!this.auth) {
            try {
                await this.login();
            } catch (error) {
                console.error('登录失败:', error.message);
            }
        }
    }

    // 获取账号
    get passport() {
        return ENV.get('pan_passport')
    }

    // 获取密码
    get password() {
        return ENV.get('pan_password')
    }

    // 获取认证token
    get auth() {
        return ENV.get('pan_auth')
    }

    /**
     * 登录方法
     */
    async login() {
        let data = JSON.stringify({
            "passport": this.passport,
            "password": this.password,
            "remember": true
        });
        let config = {
            method: 'POST',
            url: this.loginUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'App-Version': '43',
                'Referer': 'https://login.123pan.com/centerlogin?redirect_url=https%3A%2F%2Fwww.123684.com&source_page=website',
            },
            data: data
        };

        // 发送登录请求并保存token
        let auth = (await axios.request(config)).data
        ENV.set('pan_auth', auth.data.token)
    }

    /**
     * 解析分享链接，提取分享密钥和提取码
     * @param {string} url 分享链接
     * @returns {string|null} 分享密钥
     */
    getShareData(url) {
        this.SharePwd = ''
        // 移除URL前后的反引号
        url = url.replace(/^`|`$/g, '');
        url = decodeURIComponent(url);
        // 处理提取码格式
        if (url.indexOf('提取码') > 0 && url.indexOf('?') < 0) {
            url = url.replace(/提取码:|提取码|提取码：/g, '?')
        }
        if (url.indexOf('提取码') > 0 && url.indexOf('?') > 0) {
            url = url.replace(/提取码:|提取码|提取码：/g, '')
        }
        if (url.indexOf('：') > 0) {
            url = url.replace('：', '')
        }
        const matches = this.regex.exec(url);
        // 提取分享密码
        if (url.indexOf('?') > 0) {
            const queryString = url.split('?')[1];
            // 使用正则表达式提取pwd参数
            const pwdMatch = queryString.match(/pwd=([^&]+)/i);
            if (pwdMatch && pwdMatch[1]) {
                this.SharePwd = pwdMatch[1];
            }
        }
        if (matches) {
            let shareKey = '';
            if (matches[2].indexOf('?') > 0) {
                shareKey = matches[2].split('?')[0];
            } else if (matches[2].indexOf('html') > 0) {
                shareKey = matches[2].replace('.html', '');
            } else {
                shareKey = matches[2].match(/www/g) ? matches[1] : matches[2];
            }
            return shareKey;
        }
        return null;
    }

    /**
     * 根据分享链接获取文件列表
     * @param {string} shareKey 分享密钥
     * @returns {Object} 文件列表对象
     */
    async getFilesByShareUrl(shareKey) {
        let file = {}
        try {
            // 获取分享信息，返回完整的文件列表
            let videos = await this.getShareInfo(shareKey, this.SharePwd, 0, 0)
            if (videos && Array.isArray(videos)) {
                // 直接使用文件名作为键，保存完整的文件信息
                videos.forEach(video => {
                    if (video.Category === 2) {
                        if (!(video.FileName in file)) {
                            file[video.FileName] = [];
                        }
                        file[video.FileName].push(video);
                    }
                });
            }
        } catch (error) {
            console.error('获取文件列表失败:', error.message);
        }
        return file;
    }

    /**
     * 获取分享信息
     * @param {string} shareKey 分享密钥
     * @param {string} SharePwd 分享密码
     * @param {number} next 下一页标识
     * @param {number} ParentFileId 父文件夹ID
     * @returns {Array} 分类信息数组
     */
    async getShareInfo(shareKey, SharePwd, next, ParentFileId) {
        let cate = []
        try {
            const apiUrl = this.api + `get?limit=100&next=${next}&orderBy=file_name&orderDirection=asc&shareKey=${shareKey.trim()}&SharePwd=${SharePwd || ''}&ParentFileId=${ParentFileId}&Page=1`;
            let list = await axios.get(apiUrl, {
                headers: {},
            });
            if (list.status === 200 && list.data.code === 0) {
                let info = list.data.data;
                let next = info.Next;
                let infoList = info.InfoList
                // 处理文件夹
                let folders = infoList.filter(item => item.Category === 0);
                // 处理视频文件
                let videos = infoList.filter(item => item.Category === 2);
                
                // 先处理视频文件，返回完整的文件信息
                if (videos.length > 0) {
                    cate.push(...videos);
                }
                
                // 如果有文件夹，递归处理
                if (folders.length > 0) {
                    for (let item of folders) {
                        // 递归处理子文件夹时，next参数应该为0，获取第一页
                        let subCate = await this.getShareInfo(shareKey, SharePwd, 0, item.FileId);
                        if (subCate && subCate.length > 0) {
                            cate.push(...subCate);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('获取分享信息失败:', error.message);
        }
        return cate;
    }

    /**
     * 获取分享文件列表
     * @param {string} shareKey 分享密钥
     * @param {string} SharePwd 分享密码
     * @param {number} next 下一页标识
     * @param {number} ParentFileId 父文件夹ID
     * @returns {Array} 视频文件列表
     */
    async getShareList(shareKey, SharePwd, next, ParentFileId) {
        let video = []
        try {
            let link = this.api + `get?limit=100&next=${next}&orderBy=file_name&orderDirection=asc&shareKey=${shareKey.trim()}&SharePwd=${SharePwd || ''}&ParentFileId=${ParentFileId}&Page=1`
            let infoList = (await axios.request({
                method: 'get',
                url: link,
                headers: {},
            })).data;
            if (infoList.code === 0 && infoList.data) {
                // 筛选视频文件
                infoList.data.InfoList.forEach(it => {
                    if (it.Category === 2) {
                        video.push({
                            ShareKey: shareKey,
                            FileId: it.FileId,
                            S3KeyFlag: it.S3KeyFlag,
                            Size: it.Size,
                            Etag: it.Etag,
                            FileName: it.FileName,
                        })
                    }
                })
            }
        } catch (error) {
            console.error('获取分享文件列表失败:', error.message);
        }
        return video;
    }

    /**
     * 获取文件下载链接
     * @param {string} shareKey 分享密钥
     * @param {string} FileId 文件ID
     * @param {string} S3KeyFlag S3密钥标识
     * @param {number} Size 文件大小
     * @param {string} Etag 文件标签
     * @returns {string} 解码后的下载链接
     */
    async getDownload(shareKey, FileId, S3KeyFlag, Size, Etag) {
        try {
            await this.init();
            let data = JSON.stringify({
                "ShareKey": shareKey,
                "FileID": FileId,
                "S3KeyFlag": S3KeyFlag,
                "Size": Size,
                "Etag": Etag
            });
            let config = {
                method: 'POST',
                url: `${this.api}download/info`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    'Authorization': `Bearer ${this.auth}`,
                    'Content-Type': 'application/json;charset=UTF-8',
                    'platform': 'android',
                },
                data: data
            };
            let response = await axios.request(config);
            if (response.data && response.data.code === 0 && response.data.data && response.data.data.DownloadURL) {
                let down = response.data.data;
                let downloadUrl = down.DownloadURL;
                let url = new URL(downloadUrl);
                let params = url.searchParams.get('params');
                if (params) {
                    let decodedUrl = base64Decode(params);
                    return decodedUrl;
                } else {
                    console.error('下载链接缺少params参数');
                    return downloadUrl;
                }
            } else {
                console.error('获取下载链接失败:', response.data.message || '未知错误');
                return '';
            }
        } catch (error) {
            console.error('获取下载链接失败:', error.message);
            return '';
        }
    }

    /**
     * 获取视频在线播放链接
     * @param {string} shareKey 分享密钥
     * @param {string} FileId 文件ID
     * @param {string} S3KeyFlag S3密钥标识
     * @param {number} Size 文件大小
     * @param {string} Etag 文件标签
     * @returns {Array} 不同清晰度的播放链接数组
     */
    async getLiveTranscoding(shareKey, FileId, S3KeyFlag, Size, Etag) {
        try {
            await this.init();
            let config = {
                method: 'GET',
                url: `https://www.123684.com/b/api/video/play/info`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    'Authorization': `Bearer ${this.auth}`,
                    'Content-Type': 'application/json;charset=UTF-8',
                    'platform': 'android',
                },
                params: {
                    "etag": Etag,
                    "size": Size,
                    "from": "1",
                    "shareKey": shareKey
                }
            };
            let down = (await axios.request(config)).data.data
            if (down?.video_play_info) {
                let videoinfo = []
                // 处理不同清晰度的播放链接
                down.video_play_info.forEach(item => {
                    if (item.url !== '') {
                        videoinfo.push({
                            name: item.resolution,
                            url: item.url
                        })
                    }
                })
                return videoinfo;
            }
        } catch (error) {
            console.error('获取视频播放链接失败:', error.message);
        }
        return []
    }
}

// 导出Pan123实例
export const Pan = new Pan123();