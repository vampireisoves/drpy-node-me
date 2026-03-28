// http://localhost:5757/parse/爱奇艺?url=https://www.iqiyi.com/v_ir1vbyxi4w.html
async function lazy(input, params) {
    const url = 'http://api.zn0534.com/';
    const tidData = {
        tid: input, // 替换为实际的链接地址
        name: 'name',
        layer: 1,
        id: 0,
        page: 1,
        window: 'yssj',
        site: 252,
        tids: ''
    };

    const userAccount = {
        status: 1,
        msg: 'lanmei',
        user: {cookie_status: -1},
        data: {
            layer: 0,
            site: 51,
            site2: 0,
            site3: 0,
            page: 1,
            selected: 0,
            keyword: null,
            post_typeid1: null,
            post_typeid2: null,
            post_typeid3: null,
            post_typeid4: null,
            keyword1: null,
            keyword2: null,
            max_page: 1
        },
        key2: 'value=42bc9f4c7652f2ecaip1',
        group: 'dlzc_51',
        site: 51,
        md5: 'd0358525e24346374d424a92e0ddeb58',
        time: Math.floor(Date.now() / 1000),
        username: 'lanmei',
        uid: '4672'
    };

    // 请求主体数据
    const postData = {
        interaction: 1,
        tid: JSON.stringify(tidData),
        value: 95,
        window: 'yssj',
        site: 252,
        title: '',
        selected: 1,
        class: 'jx',
        user_account: JSON.stringify(userAccount),
        application: 'zhrs',
        device: 'android',
        width: 1440,
        high: 3200,
        version: '1.067',
        x1: null,
        x2: '33cd492810e5fb22',
        x3: 15,
        x4: 35,
        vip_number3448368693: ''
    };

    try {
        const response = await axios.post(url, postData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const {data} = response;
        console.log(data);
        if (data && data.tid) {
            console.log('播放链接:', data.tid);
            return data.tid;
        } else {
            console.error('未找到播放链接');
            return input;
        }
    } catch (error) {
        console.error('请求失败:', error.message);
        return input;
    }
}

module.exports = lazy;
