/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: 'yikm[游戏]',
  lang: 'cat'
})
*/


let siteKey = "", siteType = "", sourceKey = "", ext = "", host = "";

const myGame = [
    {
        name: '斗地主(人机)',
        url: 'https://www.haiwaiqipai.com/games/doudizhus/index.html',
        pic: 'https://www.haiwaiqipai.com/img/DouDiZhu.jpg'
    },
    {
        name: '五子棋',
        url: 'https://wuziqi.hongton.com',
        pic: 'https://wuziqi.hongton.com/img/stype/init-bg.png'
    },
    {
        name: '俄罗斯方块',
        url: 'https://v2fy.com/game/tetris/',
        pic: 'https://i-1-uc129.zswxy.cn/2023/0223/5d809bdb026646478a97a938f7b3300c.png'
    },
    {
        name: '魂斗罗(美版)',
        url: 'https://www.yikm.net/play?id=4137',
        pic: 'https://img.1990i.com/fcpic/sj/436a.png',
        header: {
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36'
        }
    },
];

async function request(url, obj) {
    if (!obj) {
        obj = {
            headers: headers,
            timeout: 5000
        }
    }
    try {
        const response = await req(url, obj);
        let html = response.content;
        return html;
    } catch (e) {
        console.log(`请求失败: ${url}`, e.message);
        return '';
    }
}

// 2. 全局默认请求头（匹配request函数，复用至vod_id的header）
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0'
};


// 公共函数：返回统一的 header 配置
function hdr() {
    return {
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36'
    };
}

async function init(cfg) {
    siteKey = cfg.skey;
    siteType = cfg.stype;
    sourceKey = cfg.sourceKey;
    ext = cfg.ext;
    host = "https://www.yikm.net";
}

async function home(filter) {
    const classes = [
        {
            type_id: '定制',
            type_name: '定制',
            type_flag: '2-00-S'
        }, {
            type_id: '/nes?tag=0&e=0&page=',
            type_name: 'FC',
            type_flag: '[CFS]2-00-S'
        }, {
            type_id: '/nes?tag=&e=5&page=',
            type_name: 'SFC',
            type_flag: '[CFS]2-00-S',
        }, {
            type_id: '/nes?tag=9&e=&page=',
            type_name: '街机',
            type_flag: '[CFS]2-00-S',
        }, {
            type_id: '/nes?tag=&e=2&page=',
            type_name: 'GBA',
            type_flag: '[CFS]2-00-S',
        }, {
            type_id: '/nes?tag=&e=7&page=',
            type_name: 'NDS',
            type_flag: '[CFS]2-00-S',
        }, {
            type_id: '/nes?tag=&e=3&page=',
            type_name: 'MD',
            type_flag: '[CFS]2-00-S',
        }, {
            type_id: '/nes?tag=&e=6&page=',
            type_name: 'DOS',
            type_flag: '[CFS]2-00-S',
        }

    ];
    const filters = {
        "/nes?tag=0&e=0&page=": [
            {
                key: 'class',
                name: '分类',
                value: [{"n": "FC高清", "v": "/nes?tag=&e=4&page="}, {
                    "n": "动作冒险",
                    "v": "/nes?tag=2&e=0&page="
                }, {"n": "小游戏", "v": "/nes?tag=8&e=0&page="}, {
                    "n": "飞行射击",
                    "v": "/nes?tag=3&e=0&page="
                }, {"n": "格斗", "v": "/nes?tag=4&e=0&page="}, {"n": "棋牌", "v": "/nes?tag=5&e=0&page="}, {
                    "n": "射击",
                    "v": "/nes?tag=6&e=0&page="
                }, {"n": "运动比赛", "v": "/nes?tag=7&e=0&page="}, {"n": "角色扮演", "v": "/nes?tag=10&e=0&page="},]
            }
        ], "/nes?tag=&e=5&page=": [
            {
                key: 'class',
                name: '分类',
                value: [{"n": "汉化", "v": "/nes?tag=汉化&e=5&page="}, {
                    "n": "平台",
                    "v": "/nes?tag=平台&e=5&page="
                }, {"n": "策略", "v": "/nes?tag=策略&e=5&page="}, {
                    "n": "混合",
                    "v": "/nes?tag=混合&e=5&page="
                }, {"n": "动作", "v": "/nes?tag=动作&e=5&page="}, {
                    "n": "角色扮演",
                    "v": "/nes?tag=角色扮演&e=5&page="
                }, {"n": "射击", "v": "/nes?tag=射击&e=5&page="}, {
                    "n": "运动",
                    "v": "/nes?tag=运动&e=5&page="
                }, {"n": "格斗", "v": "/nes?tag=格斗&e=5&page="}, {
                    "n": "休闲",
                    "v": "/nes?tag=休闲&e=5&page="
                }, {"n": "冒险", "v": "/nes?tag=冒险&e=5&page="}, {
                    "n": "教育",
                    "v": "/nes?tag=教育&e=5&page="
                }, {"n": "赛车", "v": "/nes?tag=赛车&e=5&page="}, {
                    "n": "模拟",
                    "v": "/nes?tag=模拟&e=5&page="
                }, {"n": "其他", "v": "/nes?tag=其他&e=5&page="},]
            }
        ], "/nes?tag=9&e=&page=": [
            {
                key: 'class',
                name: '分类',
                value: [{"n": "动作冒险", "v": "/nes?tag=动作&e=1&page="}, {
                    "n": "射击",
                    "v": "/nes?tag=射击&e=1&page="
                }, {"n": "赛车", "v": "/nes?tag=赛车&e=1&page="}, {
                    "n": "格斗",
                    "v": "/nes?tag=格斗&e=1&page="
                }, {"n": "体育", "v": "/nes?tag=体育&e=1&page="}, {
                    "n": "益智游戏",
                    "v": "/nes?tag=益智&e=1&page="
                }, {"n": "其他", "v": "/nes?tag=其他&e=1&page="},]
            }
        ], "/nes?tag=&e=2&page=": [
            {
                key: 'class',
                name: '分类',
                value: [{"n": "动作", "v": "/nes?tag=动作&e=2&page="}, {
                    "n": "冒险",
                    "v": "/nes?tag=冒险&e=2&page="
                }, {"n": "角色扮演", "v": "/nes?tag=角色扮演&e=2&page="}, {
                    "n": "运动",
                    "v": "/nes?tag=运动&e=2&page="
                }, {"n": "策略", "v": "/nes?tag=策略&e=2&page="}, {
                    "n": "格斗",
                    "v": "/nes?tag=格斗&e=2&page="
                }, {"n": "射击", "v": "/nes?tag=射击&e=2&page="}, {
                    "n": "赛车",
                    "v": "/nes?tag=赛车&e=2&page="
                }, {"n": "体育", "v": "/nes?tag=体育&e=2&page="}, {
                    "n": "益智游戏",
                    "v": "/nes?tag=益智&e=2&page="
                }, {"n": "模拟", "v": "/nes?tag=模拟&e=2&page="}]
            }
        ], "/nes?tag=&e=7&page=": [
            {
                key: 'class',
                name: '分类',
                value: [{"n": "角色扮演", "v": "/nes?tag=角色扮演&e=7&page="}, {
                    "n": "动作角色扮演",
                    "v": "/nes?tag=动作角色扮演&e=7&page="
                }, {"n": "模拟角色扮演", "v": "/nes?tag=模拟角色扮演&e=7&page="}, {
                    "n": "动作游戏",
                    "v": "/nes?tag=动作游戏&e=7&page="
                }, {"n": "冒险游戏", "v": "/nes?tag=冒险游戏&e=7&page="}, {
                    "n": "冒险解谜",
                    "v": "/nes?tag=冒险解谜&e=7&page="
                }, {"n": "策略战棋", "v": "/nes?tag=策略战棋&e=7&page="}, {
                    "n": "模拟经营",
                    "v": "/nes?tag=模拟经营&e=7&page="
                }, {"n": "体育竞技", "v": "/nes?tag=体育竞技&e=7&page="}, {
                    "n": "赛车竞速",
                    "v": "/nes?tag=赛车竞速&e=7&page="
                }, {"n": "格斗游戏", "v": "/nes?tag=格斗游戏&e=7&page="}, {
                    "n": "大乱斗游戏",
                    "v": "/nes?tag=大乱斗游戏&e=7&page="
                }, {"n": "射击游戏", "v": "/nes?tag=射击游戏&e=7&page="}, {
                    "n": "第一人称射击",
                    "v": "/nes?tag=第一人称射击&e=7&page="
                }, {"n": "益智游戏", "v": "/nes?tag=益智游戏&e=7&page="}, {
                    "n": "养成游戏",
                    "v": "/nes?tag=养成游戏&e=7&page="
                }, {"n": "音乐游戏", "v": "/nes?tag=音乐游戏&e=7&page="}, {
                    "n": "恋爱游戏",
                    "v": "/nes?tag=恋爱游戏&e=7&page="
                }, {"n": "卡片游戏", "v": "/nes?tag=卡片游戏&e=7&page="}, {
                    "n": "桌面游戏",
                    "v": "/nes?tag=桌面游戏&e=7&page="
                }]
            }
        ], "/nes?tag=&e=3&page=": [
            {
                key: 'class',
                name: '分类',
                value: [{"n": "角色扮演", "v": "/nes?tag=角色扮演&e=3&page="}, {
                    "n": "动作冒险",
                    "v": "/nes?tag=动作冒险&e=3&page="
                }, {"n": "策略", "v": "/nes?tag=策略&e=3&page="}, {
                    "n": "棋牌",
                    "v": "/nes?tag=棋牌&e=3&page="
                }, {"n": "射击", "v": "/nes?tag=射击&e=3&page="}, {
                    "n": "模拟经营",
                    "v": "/nes?tag=模拟经营&e=3&page="
                }, {"n": "战棋", "v": "/nes?tag=战棋&e=3&page="}, {
                    "n": "格斗",
                    "v": "/nes?tag=格斗&e=3&page="
                }, {"n": "动作", "v": "/nes?tag=动作&e=3&page="}, {
                    "n": "解谜",
                    "v": "/nes?tag=解谜&e=3&page="
                }, {"n": "模拟", "v": "/nes?tag=模拟&e=3&page="}, {
                    "n": "休闲益智",
                    "v": "/nes?tag=休闲益智&e=3&page="
                }, {"n": "体育", "v": "/nes?tag=体育&e=3&page="}, {"n": "音乐", "v": "/nes?tag=音乐&e=3&page="}]
            }
        ]
    };

    return JSON.stringify({
        'class': classes,
        'filters': filters
    });
}

async function homeVod(params) {
    return null;
}

async function category(tid, pg, filter, extend) {
    extend = extend || {};

    if (tid == '定制') {
        if (pg != 1) return null;

        const videos = [];
        for (let it of myGame) {
            videos.push({
                vod_id: JSON.stringify({
                    actionId: 'browser',
                    type: 'browser',
                    title: '小游戏',
                    url: it.url,
                    header: it.header
                }),
                vod_name: it.name,
                vod_pic: it.pic,
                vod_tag: 'action'
            });
        }

        return JSON.stringify({
            'list': videos
        });
    }

    if (extend.custom) {
        return search(extend.custom, true, pg);
    }

    const classz = extend.class;
    const targetUrl = classz ? host + classz + pg : host + tid + pg;
    const html = await request(targetUrl);
    if (!html) return [];

    // 提取所有视频卡片
    const videoCards = pdfa(html, '.row .col-md-3.col-xs-6 .card-blog');
    const videos = [];

    for (const card of videoCards) {
        // 提取图片链接
        const vod_pic = pdfh(card, '.card-image img&&src');

        // 提取游戏名称
        const vod_name = pdfh(card, 'h4 a&&Text');

        // 提取游戏链接
        const gamePath = pdfh(card, 'h4 a&&href');
        const gameUrl = gamePath.startsWith('http') ? gamePath : host + gamePath;

        // 提取标签（如果有多个标签，这里取第一个）
        //const vod_tag = pdfh(card, '.table .label:first-child&&Text') || 'action';

        videos.push({
            vod_id: JSON.stringify({
                actionId: 'browser',
                type: 'browser',
                title: '小游戏',
                url: gameUrl,
                textZoom: 100,
                header: {
                    'Upgrade-Insecure-Requests': '1',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36'
                }
            }),
            vod_name: vod_name,
            vod_pic: vod_pic,
            vod_tag: 'action' // 统一转为小写
        });
    }

    // 添加固定项（如crazygames和poki）
    videos.push(
        {
            vod_id: JSON.stringify({
                actionId: 'browser',
                type: 'browser',
                title: '小游戏',
                url: 'https://www.crazygames.com'
            }),
            vod_name: 'crazygames',
            vod_pic: '',
            vod_tag: 'action'
        },
        {
            vod_id: JSON.stringify({
                actionId: 'browser',
                type: 'browser',
                title: '小游戏',
                url: 'https://poki.com/zh'
            }),
            vod_name: 'poki',
            vod_pic: '',
            vod_tag: 'action'
        }
    );

    return JSON.stringify({
        'list': videos
    });
}


async function search(wd, quick, pg) {
    const p = pg || 1;
    const url = host + '/search?name=' + encodeURIComponent(wd);
    const html = await request(url);
    if (!html) return [];
    const videoCard = pdfa(html, '.row .col-md-3.col-xs-6');
    console.log('【调试】网络数据：', videoCard);
    // 提取所有视频卡片
    const videoCards = pdfa(html, '.row .col-md-3.col-xs-6 .card.card-blog');
    const videos = [];

    for (const card of videoCards) {
        // 提取图片链接
        const vod_pic = pdfh(card, '.card-image img&&src');

        // 提取游戏名称
        const vod_name = pdfh(card, 'h4 a&&Text');

        // 提取游戏链接
        const gamePath = pdfh(card, 'h4 a&&href');
        const gameUrl = gamePath.startsWith('http') ? gamePath : host + gamePath;

        // 提取标签（如果有多个标签，这里取第一个）
        //const vod_tag = pdfh(card, '.table .label:first-child&&Text') || 'action';

        videos.push({
            vod_id: JSON.stringify({
                actionId: 'browser',
                type: 'browser',
                title: '小游戏',
                url: gameUrl,
                textZoom: 100,
                header: {
                    'Upgrade-Insecure-Requests': '1',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Mobile Safari/537.36'
                }
            }),
            vod_name: vod_name,
            vod_pic: vod_pic,
            vod_tag: 'action'
        });
    }

    return JSON.stringify({
        'list': videos,
        page: p
    });
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        search: search
    };
}
