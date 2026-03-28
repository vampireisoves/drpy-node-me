/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: '动作交互',
  lang: 'ds'
})
*/

const {action_data, generateUUID} = $.require('./_lib.action.js');

// 访问测试 http://127.0.0.1:5757/api/动作交互?ac=action&action=set-cookie
// 访问测试 http://127.0.0.1:5757/api/动作交互?ac=action&action=quarkCookieConfig&value={"cookie":"我是cookie"}
var rule = {
    类型: '测试',
    title: '动作交互',
    推荐: async () => {
        return action_data;
    },
    action: async function (action, value) {
        if (action === 'set-cookie') {
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
        if (action === 'quarkCookieConfig' && value) {
            try {
                const obj = JSON.parse(value);
                const val = obj.cookie;
                return "我收到了：" + value;
            } catch (e) {
                return '发生错误：' + e;
            }
        }

        if (action === '连续对话') {
            let content = JSON.parse(value);
            try {
                a = b;
            } catch (e) {
                console.error('测试出错捕获：', e);
            }
            console.error('对象日志测试:', 0, '==== ', content, ' ====', true);
            if (content.talk.indexOf('http') > -1) {
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

        if (action === '夸克扫码') {
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
        if (action === 'quarkScanCheck') {
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
                    imageType: 'card_pic_3',
                    msg: '扫码超时,请重进'
                }
            });
        }
        if (action === 'quarkScanCancel') {
            console.log('用户取消扫码：' + value);
            rule.quarkScanCheck = null;
            return;
        }

        return '动作：' + action + '\n数据：' + value;
    },
};
