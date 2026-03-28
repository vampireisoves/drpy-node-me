/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: '动作测试',
  more: {
    sourceTag: '设置,动作',
    actions: [
      {
        name: '模拟设置夸克Cookie',
        action: 'set-cookie'
      },
      {
        name: '模拟夸克扫码',
        action: '夸克扫码'
      },
      {
        name: '模拟设置玩偶域名',
        action: '{\'actionId\':\'玩偶域名\',\'id\':\'domain\',\'type\':\'input\',\'width\':450,\'title\':\'玩偶域名\',\'tip\':\'请输入玩偶域名\',\'value\':\'\',\'msg\':\'选择或输入使用的域名\',\'selectData\':\'1:=https://www.wogg.net/,2:=https://wogg.xxooo.cf/,3:=https://wogg.888484.xyz/,4:=https://www.wogg.bf/,5:=https://woggapi.333232.xyz/\'}'
      }
    ]
  },
  lang: 'ds'
})
*/


const data = [
    {
        vod_id: '放入剪贴板',
        vod_name: '放入剪贴板',
        vod_tag:'action'
    },
    {
        vod_id: '刷新列表',
        vod_name: '刷新列表',
        vod_tag: 'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: 'WEBVIEW',
            type: 'webview',
            height: -260,
            textZoom: 70,
            url: 'http://127.0.0.1:9978/',
        }),
        vod_name: 'WEBVIEW',
        vod_pic: 'clan://assets/tab.png',
        vod_tag:'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: 'help',
            type: 'help',
            title: '使用帮助',
            data: {
                使用帮助: '暂未收录内容'
            }
        }),
        vod_name: '使用帮助',
        vod_pic: 'clan://assets/set.png',
        vod_tag:'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: '图片点击坐标',
            id: 'coord',
            type: 'input',
            title: '图片点击坐标',
            tip: '请输入图片中文字的坐标',
            value: '',
            msg: '点击图片上文字获取坐标',
            imageUrl: 'https://pic.imgdb.cn/item/667ce9f4d9c307b7e9f9d052.webp',
            imageHeight: 300,
            imageClickCoord: true,
            button: 3,
        }),
        vod_name: '图片点击坐标',
        vod_pic: 'https://pic.imgdb.cn/item/667ce9f4d9c307b7e9f9d052.webp',
        vod_tag:'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: '消息弹窗',
            type: 'msgbox',
            title: '消息弹窗',
            // msg: '这是一个消息弹窗',
            // msgType: 'rich_text',
            htmlMsg: '这是一个支持 <font color=red><b>简单HTML语法</b></font> 内容的弹窗',
            imageUrl: 'https://pic.imgdb.cn/item/667ce9f4d9c307b7e9f9d052.webp',
        }),
        vod_name: '消息弹窗',
        vod_pic: 'clan://assets/ktvlogo.jpg',
        vod_tag:'action'
    },
	{
		vod_id: JSON.stringify({
			actionId: '连续对话',
			id: 'talk',
			type: 'input',
			title: '连续对话',
			tip: '请输入消息',
			value: '',
			msg: '开始新的对话',
			button: 3,
            imageUrl: 'https://pic.imgdb.cn/item/667ce9f4d9c307b7e9f9d052.webp',
            imageHeight: 200,
			keep: true,
			width: 680,
			height: 1680,
		}),
		vod_name: '连续对话',
		vod_pic: 'https://img2.baidu.com/it/u=1206278833,3265480730&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=800',
		vod_tag:'action'
	},
    {
        vod_id: JSON.stringify({
            actionId: '源内搜索',
            id: 'wd',
            type: 'input',
            title: '源内搜索',
            tip: '请输入搜索内容',
            value: ''
        }),
        vod_name: '源内搜索',
        vod_pic: 'clan://assets/search.png',
        vod_tag:'action'
    },
	{
		vod_id: '夸克扫码',
		vod_name: '夸克扫码',
		vod_pic: 'https://pic.qisuidc.cn/s/2024/10/23/6718c212f1fdd.webp',
		vod_remarks: '夸克',
		vod_tag:'action'
	},
    {
        vod_id: JSON.stringify({
            actionId: '玩偶域名',
            id: 'domain',
            type: 'input',
            width: 450,
            title: '玩偶域名',
            tip: '请输入玩偶域名',
            value: '',
            msg: '选择或输入使用的域名',
            selectData: '1:=https://www.wogg.net/,2:=https://wogg.xxooo.cf/,3:=https://wogg.888484.xyz/,4:=https://www.wogg.bf/,5:=https://woggapi.333232.xyz/'
        }), 
        vod_name: '玩偶域名',
        vod_tag:'action'
    },
    {
        vod_id: '基础Action指令',
        vod_name: '基础Action',
        vod_tag:'action'
    },
	{
		vod_id: 'set-cookie',
		vod_name: '设置Cookie',
		vod_pic: 'https://pic.qisuidc.cn/s/2024/10/23/6718c212f1fdd.webp',
		vod_remarks: '夸克',
		vod_tag:'action'
	},
    {
        vod_id: JSON.stringify({
            actionId: '单项输入',
            id: 'alitoken',
            type: 'input',
            title: '阿里云盘Token',
            tip: '请输入阿里云盘32位的Token',
            value: '',
            msg: '单项输入带图, 例如显示验证码图片',
            imageUrl: 'https://pic.imgdb.cn/item/667ce9f4d9c307b7e9f9d052.webp',
            imageHeight: 200,
        }),
        vod_name: '单项输入带图',
        vod_tag:'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: '扫码初始动作',
            id: 'alitoken',
            type: 'input',
            title: '阿里云盘Token',
            msg: '弹出窗口就执行initAction里的动作，回调时就关闭窗口，应用于扫码场景，为了演示，动作注释了',
            button: 0,
            timeout: 20,
            qrcode: 'https://www.alipan.com/',
            //initActio: 'initAction'
        }),
        vod_name: '扫码初始动作',
        vod_tag:'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: '单项快速输入',
            id: 'alitoken',
            type: 'input',
            width: 680,
            title: '阿里云盘Token',
            tip: '请输入阿里云盘32位的Token',
            value: '',
            msg: '中国第五座南极科考站秦岭站正式建成。',
            selectData: '1:=aaa输入默认值,2:=bb输入默认值bbbbb,3:=c输入默认值ddd,4:=输入默认值,5:=111,6:=22222,7:=HOHO,HELLO,world'
        }), 
        vod_name: '单项快速输入',
        vod_tag:'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: '多项输入',
            type: 'multiInput',
            title: 'Action多项输入',
            width: 640,
            msg: '通过action配置的多项输入',
            input: [
                {
                    id: 'item1',
                    name: '项目1',
                    tip: '请输入项目1内容',
                    value: ''
                },
                {
                    id: 'item2',
                    name: '项目2',
                    tip: '请输入项目2内容',
                    value: ''
                },
                {
                    id: 'item3',
                    name: '项目3',
                    tip: '请输入项目3内容',
                    value: ''
                }
            ]
        }),
        vod_name: '多项输入',
        vod_tag:'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: '多项输入',
            type: 'multiInputX',
            canceledOnTouchOutside: true,
            title: 'Action多项输入(multiInputX)',
            width: 716,
            height: -300,
            bottom: 1,
            dimAmount: 0.3,
            msg: '“平行志愿”是普通高校招生平行志愿投档模式的简称，平行志愿投档又可分为按“院校+专业组”（以下简称院校专业组）平行志愿投档和按专业平行志愿投档两类。',
            button: 3,
            input: [
                {
                    id: 'item1',
                    name: '文件夹路径（文件夹选择）',
                    tip: '请输入文件夹路径',
                    value: '',
                    selectData: '[folder]',
                    validation: '',
                    inputType: 0,
                    help: '“平行志愿”是普通高校招生平行志愿投档模式的简称，平行志愿投档又可分为按“院校+专业组”（以下简称院校专业组）平行志愿投档和按专业平行志愿投档两类。'
                },
                {
                    id: 'item2',
                    name: '日期（日期选择）',
                    tip: '请输入项目2内容',
                    value: '',
                    selectData: '[calendar]',
                    validation: '',
                    inputType: 0,
                    
                },
                {
                    id: 'item3',
                    name: '文件路径（文件选择）',
                    tip: '请输入文件路径',
                    value: '',
                    selectData: '[file]',
                    inputType: 0,
                },
                {
                    id: 'item4',
                    name: '多项选择',
                    tip: '请输入多项内容，以“,”分隔',
                    value: '',
                    selectData: '[请选择字母]a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z',
                    selectWidth: 640,
                    multiSelect: true,
                    selectColumn: 4,
                    inputType: 0,
                },
                {
                    id: 'item5',
                    name: '项目5',
                    tip: '请输入项目5内容',
                    value: '',
                    multiLine: 5,
                },
                {
                    id: 'item6',
                    name: '项目6',
                    tip: '请输入项目6内容，密码，inputType: 129',
                    value: '',
                    inputType: 129,
                },
                {
                    id: 'item7',
                    name: '图像base64（图像文件选择）',
                    tip: '请输入项目7内容',
                    value: '',
                    selectData: '[image]',
                    multiLine: 3,
                    inputType: 0,
                },
                {
                    id: 'item8',
                    name: '单项选择',
                    tip: '请输入项目8内容',
                    value: '李四',
                    selectData: '[请选择]张三,李四,王五,赵六',
                    onlyQuickSelect: true,
                },
                {
                    id: 'item9',
                    name: '项目9\n“平行志愿”是普通高校招生平行志愿投档模式的简称，平行志愿投档又可分为按“院校+专业组”（以下简称院校专业组）平行志愿投档和按专业平行志愿投档两类。',
                    tip: '请输入项目9内容',
                    value: '可歌可泣',
                    selectData: '[请选择]可爱,可惜,可人,可以,可歌可泣,可恶',
                    validation: '',
                    quickSelect: true,
                    inputType: 0,
                    help: '<h1>“平行志愿”</h1>是普通高校 <b>招生平行</b> 志愿投档模式的简称，<i>平行志愿</i>投档又可分为按“院校+专业组”（以下简称院校专业组）平行志愿投档和按专业平行志愿&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;投档两类。'
                },
                {
                    id: 'item10',
                    name: '项目10',
                    tip: '请输入项目10内容',
                    value: ''
                },
                {
                    id: 'item11',
                    name: '项目11',
                    tip: '请输入项目11内容',
                    value: ''
                }
            ]
        }),
        vod_name: '多项输入',
        vod_tag:'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: '多行编辑',
            type: 'edit',
            id: 'alitoken',
            title: '阿里云盘Token',
            msg: '阿里云盘32位的Token',
            tip: '请输入阿里云盘32位的Token',
            value: '',
            width: 640,
            height: 400,
        }), 
        vod_name: '多行编辑',
        vod_tag:'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: '单选菜单',
            type: 'menu',
            title: 'Action菜单',
            width: 300,
            column: 2,
            option: [
                {
                    name: '菜单1',
                    action: 'menu1'
                },
                {
                    name: '菜单2',
                    action: 'menu2'
                },
                '菜单3$menu3',
                '菜单4$menu4',
                '菜单5$menu5',
                '菜单6$menu6',
                '菜单7$menu7',
                '菜单8$menu8',
                '菜单9$menu9',
                '菜单10$menu10',
            ],
            selectedIndex: 3
        }),
        vod_name: '单选菜单',
        vod_tag:'action'
    },
    {
        vod_id: JSON.stringify({
            actionId: '多选菜单',
            type: 'select',
            title: 'Action多选菜单',
            width: 480,
            column: 2,
            option: [
                {
                    name: '选项1',
                    action: 'menu1',
                    selected: true
                },
                {
                    name: '选项2',
                    action: 'menu2'
                },
                {
                    name: '选项3',
                    action: 'menu3',
                    selected: true
                },
                {
                    name: '选项4',
                    action: 'menu4'
                },
                {
                    name: '选项5',
                    action: 'menu5'
                },
                {
                    name: '选项6',
                    action: 'menu6'
                },
                {
                    name: '选项7',
                    action: 'menu7'
                },
                {
                    name: '选项8',
                    action: 'menu8'
                },
                {
                    name: '选项9',
                    action: 'menu9',
                    selected: true
                },
                {
                    name: '选项10',
                    action: 'menu10',
                    selected: true
                },
                {
                    name: '选项11',
                    action: 'menu11',
                    selected: true
                },
                {
                    name: '选项12',
                    action: 'menu12',
                    selected: true
                }
            ]
        }),
        vod_name: '多选菜单',
        vod_tag:'action'
    },
];

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// 访问测试 127.0.0.1:5757/api/动作测试/?ac=action&action=set-cookie
// 访问测试 127.0.0.1:5757/api/动作测试/?ac=action&action=quarkCookieConfig&value=我是cookie
var rule = {
    类型: '测试',
    title: '动作测试',
    
    home_flag: '5',
    class_flag: '3-11-S',
    
    more: {
        sourceTag: '设置,动作',
        actions: [
            {name: '模拟设置夸克Cookie', action: 'set-cookie'},
            {name: '模拟夸克扫码', action: '夸克扫码'},
            {
                name: '模拟设置玩偶域名',
                action: JSON.stringify({
                    actionId: '玩偶域名',
                    id: 'domain',
                    type: 'input',
                    width: 450,
                    title: '玩偶域名',
                    tip: '请输入玩偶域名',
                    value: '',
                    msg: '选择或输入使用的域名',
                    selectData: '1:=https://www.wogg.net/,2:=https://wogg.xxooo.cf/,3:=https://wogg.888484.xyz/,4:=https://www.wogg.bf/,5:=https://woggapi.333232.xyz/'
                })
            },
        ],
    },
    
    推荐: async () => {
        return data;
    },
    一级: async function (tid, pg, filter, extend) {
        if (pg !== 1) {
            return [];
        }
        let videos = [];
        videos.push({
            vod_id: JSON.stringify({
                actionId: '源内搜索',
                id: 'wd',
                type: 'input',
                title: '源内搜索',
                tip: '请输入搜索内容',
                value: tid
            }),
            vod_name: '源内搜索',
            vod_pic: 'https://t7.baidu.com/it/u=3126957922,610821603&fm=193',
            vod_tag:'action'
        });

        return videos
    },
    
    action: async function (action, value) {
        if (action == 'set-cookie') {
            return JSON.stringify({
                action: {
                    actionId: 'quarkCookieConfig',
                    id: 'cookie',
                    type: 'input',
                    title: '夸克Cookie',
                    tip: '请输入夸克的Cookie',
                    value: '原值',
                    msg: '此弹窗是动态设置的参数，可用于动态返回原设置值等场景'
                }
            });
        }
        if (action == 'quarkCookieConfig' && value) {
            try {
                const obj = JSON.parse(value);
                const val = obj.cookie;
                return "我收到了：" + value;
            } catch (e) {
                return '发生错误：' + e;
            }
        }
        
		if (action == '连续对话') {
		    let content = JSON.parse(value);
		    if (content.talk.indexOf('http') == 0) {
    			return JSON.stringify({
                    action: {
        				actionId: '__detail__',
        				skey: 'push_agent',
        				ids: content.talk,
                    },
                    toast: '你要去看视频了'
    			});
		    }
			return JSON.stringify({
                action: {
    				actionId: '__keep__',
    				msg: '回音：' + content.talk,
    				reset: true
                },
                toast: '你有新的消息'
			});
		}
		
        if (action == '夸克扫码') {
            if (rule.quarkScanCheck) {
                console.log('请等待上个扫码任务完成：' + rule.quarkScanCheck);
                return '请等待上个扫码任务完成';
            }
            
            let requestId = generateUUID();
            console.log('request_id:', requestId);
            let data = await post('https://uop.quark.cn/cas/ajax/getTokenForQrcodeLogin', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; M2012K10C Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Mobile Safari/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json, text/plain, */*'
                },
                data: {
                    request_id: requestId,
                    client_id: "532",
                    v: "1.2"
                }
            });
            console.log('data:', data);
            let qcToken = JSON.parse(data).data.members.token;
            let qrcodeUrl = `https://su.quark.cn/4_eMHBJ?token=${qcToken}&client_id=532&ssb=weblogin&uc_param_str=&uc_biz_str=S%3Acustom%7COPT%3ASAREA%400%7COPT%3AIMMERSIVE%401%7COPT%3ABACK_BTN_STYLE%400`;
            return JSON.stringify({
                action: {
                    actionId: 'quarkScanCookie',
                    id: 'quarkScanCookie',
                    canceledOnTouchOutside: false,
                    type: 'input',
                    title: '夸克扫码Cookie',
                    msg: '请使用夸克APP扫码登录获取',
                    width: 500,
                    button: 1,
                    timeout: 20,
                    qrcode: qrcodeUrl,
                    qrcodeSize: '400',
                    initAction: 'quarkScanCheck',
                    initValue: requestId,
                    cancelAction: 'quarkScanCancel',
                    cancelValue: requestId,
                }
            });
        }
        if (action == 'quarkScanCheck') {
            rule.quarkScanCheck = value;
            for (let i = 1; i < 15; i++) {
                console.log('模拟扫码检测：' + value + '，第' + i + '次');
                await sleep(1000);
                
                if (!rule.quarkScanCheck) {
                    console.log('退出扫码检测：' + value);
                    rule.quarkScanCheck = null;
                    return '扫码取消';
                }
            }
            rule.quarkScanCheck = null;
            
            return JSON.stringify({
                action: {
                    actionId: 'quarkCookieError',
                    id: 'cookie',
                    type: 'input',
                    title: '夸克Cookie',
                    width: 300,
                    button: 0,
                    imageUrl: 'https://preview.qiantucdn.com/agency/dp/dp_thumbs/1014014/15854479/staff_1024.jpg!w1024_new_small_1',
                    imageHeight: 200,
                    msg: '扫码超时,请重进'
                }
            });
        }
        if (action == 'quarkScanCancel') {
            console.log('用户取消扫码：' + value);
            rule.quarkScanCheck = null;
            return;
        }
        
        if (action == '玩偶域名') {
		    let content = JSON.parse(value);
            console.log('玩偶域名：' + content.domain);
            
            console.log('临时测试', '＝＝＝＝＝＝测试nodeApi开始＝＝＝＝＝＝');
            
            const dbName = 'song.db';  // 数据库路径
            const query = "SELECT val"
                + " FROM singer_collect"
                + " ORDER BY ts DESC";
            const data = console.dbQuery(dbName, query);
            
            console.log('临时测试', data);
            console.log('临时测试', '＝＝＝＝＝＝测试nodeApi结束＝＝＝＝＝＝');
            
            return '回音：' + content.domain;
        }
        
        if (action == '源内搜索') {
		    let content = JSON.parse(value);
			return JSON.stringify({
                action: {
    				actionId: '__self_search__',
    				// skey: '', //目标源key，可选，未设置或为空则使用当前源
    				// name: '搜索: ' + content.wd,
    				// tid: content.wd,
    				// flag: '1',
    				folder: '查询1$' + content.wd + '$0-0-S#查询2$' + content.wd + '$3#查询3$' + content.wd + '$5',
    				// folder: [
    				//     {
    				//         name: '查询1：' + content.wd,
    				//         id: content.wd,
    				//         flag: '0-0-S',
    				//     },
    				//     {
    				//         name: '查询2：' + content.wd,
    				//         id: content.wd,
    				//         flag: '3',
    				//     },
    				//     {
    				//         name: '查询3：' + content.wd,
    				//         id: content.wd,
    				//         flag: '5',
    				//     },
    				// ],
    				msg: '源内搜索'
                }
			});
        }
    
        if (action == '欢唱此歌') {
            console.log(value);
            const d = value.split('$');
            if (d.length < 2) return '欢唱参数缺失';
            return JSON.stringify({
                action: {
                    actionId: '__ktvplayer__',
                    name: d[0],
                    id: d[1]
                },
                toast: ''
            });        
        }
        
        if (action == '刷新列表') {
            return JSON.stringify({
                action: {
                    actionId: '__refresh_list__',
                },
                toast: '刷新列表'
            });
        }
        
        if (action == '放入剪贴板') {
            return JSON.stringify({
                action: {
                    actionId: '__copy__',
                    content: 'hello world'
                },
                toast1: '内容放入剪贴板aaa'
            });
        }

        return '动作：' + action + '\n数据：' + value;
    },
};







