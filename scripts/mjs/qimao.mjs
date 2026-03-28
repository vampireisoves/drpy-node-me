const url = 'https://www.qimao.com/shuku/0-a-a-a-a-a-a-click-1/';

try {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                'Chrome/139.0.0.0 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`请求失败，状态码：${response.status}`);
    }

    const html = await response.text();
    console.log(html); // 打印网页源码
} catch (err) {
    console.error('请求出错：', err);
}