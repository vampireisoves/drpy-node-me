const icon_quark = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzU5OTQ0NTYzNjI4IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjE5OTQiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiI+PHBhdGggZD0iTTQ2OS4zNDQgOTkwLjRjLTExMi45Ni05Ljk4NC0yMjAuNzM2LTYwLjk2LTI5Ny44MjQtMTQwLjQ4LTc3LjM0NC04MC0xMTYuNjA4LTE1OC4zMDQtMTM1LjM5Mi0yNzAuMjcyLTQuODk2LTI5LjAyNC01LjYtOTguMzA0LTEuMjE2LTEyNi44NDggMTAuNDk2LTcwLjQ5NiAzMy45Mi0xMzcuMzQ0IDY1Ljg1Ni0xODguOEMxOTEuMjY0IDExOC4wOCAzNDMuMjMyIDMyIDUxMC4wOCAzMmM3MS4yMzIgMCAxMzUuMzkyIDEyLjkyOCAxOTcuMTIgNDAgNTMuOTIgMjMuNjggMTEzLjE4NCA2NS44NTYgMTUyLjk2IDEwOS4wNTYgNjIuMTc2IDY3LjU1MiA5NC4xNDQgMTI1LjEyIDExNy41NjggMjExLjk2OCAxOC41NiA2OC41NDQgMTkuMDA4IDE2NC44OTYgMS40NCAyMzIuOTYtMTkuNzQ0IDc1LjM5Mi00Ni41OTIgMTI5LjI4LTk0Ljg4IDE4OS4wNTYtNDEuOTUyIDUyLjE5Mi04Ni4wOCA4OS4wMjQtMTQ0LjE2IDEyMC4yNTYtNjAuOTkyIDMyLjk2LTExNy4zNDQgNDkuMjgtMTg4LjU3NiA1NS4xMzYtMzQuODggMi45MTItNDguMjg4IDIuOTEyLTgyLjIwOCAweiBtODYuMTEyLTI0NC4zODRjMTEuOTY4LTUuMTIgMjEuMjE2LTE5LjUyIDIxLjIxNi0zMy40NCAwLTIzLjkwNCA0LjY0LTUwLjk3NiAxMC43NTItNjIuOTQ0IDEyLjQ0OC0yNC4zODQgMjkuMDI0LTMyLjkyOCA3OS4yNjQtNDAuNzM2IDE5LjUyLTIuOTEyIDM5LjUyLTcuMDQgNDQuNDE2LTkuMDI0IDEzLjg4OC02LjA4IDI1LjM3Ni0xNy43OTIgMzIuOTI4LTM0LjE0NCA2LjgxNi0xNC44OCA3LjA3Mi0xNi4zMiA3LjA3Mi01NC40LTAuMjU2LTQyLjIwOC0xLjY5Ni01MS40NTYtMTYuMzItODkuMjgtMjEuNzYtNTYuODMyLTc4LjgxNi0xMTMuNDA4LTEzNS40MjQtMTMzLjkyYTQwMC4yMjQgNDAwLjIyNCAwIDAgMC01MC40OTYtMTIuNjcyYy0yNi44MTYtNC4zODQtMzEuOTM2LTQuNjQtNTUuMTA0LTEuOTUyLTQ1Ljg1NiA1LjM0NC03NC4xNzYgMTQuNC0xMDUuODg4IDMzLjQwOC0yMCAxMi4xOTItMjEuNDQgMTMuNDQtNDUuNiAzNy4zMTItMzUuMzkyIDM0Ljg4LTUzLjY2NCA2OC44LTY0Ljg5NiAxMTkuNTUyLTE5LjUyIDg5LjAyNCAxNS44NzIgMTgyLjk0NCA5MC4wMTYgMjM5LjU1MiAzMC45NzYgMjMuNjQ4IDc2LjM1MiA0Mi42ODggMTA5LjI4IDQ1Ljg1NiAyOC4yODggMi45MTIgNjguMzIgMS4yMTYgNzguNzg0LTMuMnoiIGZpbGw9IiMzQTI1REQiIHAtaWQ9IjE5OTUiPjwvcGF0aD48L3N2Zz4='
const action_data = [
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
            imageUrl: 'https://img2.baidu.com/it/u=1206278833,3265480730&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=800',
            imageHeight: 200,
            imageType: 'card_pic_3',
            keep: true,
            width: 680,
            height: 800,
            msgType: 'long_text',
            httpTimeout: 60,
            canceledOnTouchOutside: false,
            selectData: '新的对话:=清空AI对话记录'
        }),
        vod_name: '连续对话',
        vod_pic: 'https://img2.baidu.com/it/u=1206278833,3265480730&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=800',
        vod_tag: 'action'
    },
    {
        vod_id: '夸克扫码',
        vod_name: '夸克扫码',
        vod_pic: icon_quark,
        vod_remarks: '夸克',
        vod_tag: 'action'
    },
    {
        vod_id: '基础Action指令',
        vod_name: '基础Action',
        vod_tag: 'action'
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
        vod_pic: '',
        vod_tag:'action'
    },
    {
        vod_id: 'set-cookie',
        vod_name: '设置Cookie',
        vod_pic: '',
        vod_remarks: '夸克',
        vod_tag: 'action'
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
            imageType: 'card_pic_3',
        }),
        vod_name: '单项输入带图',
        vod_tag: 'action'
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
            //initAction: 'initAction'
        }),
        vod_name: '扫码初始动作',
        vod_tag: 'action'
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
        vod_tag: 'action'
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
        vod_tag: 'action'
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
        vod_tag: 'action'
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
        vod_tag: 'action'
    },
];

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

$.exports = {
    action_data,
    generateUUID
}
