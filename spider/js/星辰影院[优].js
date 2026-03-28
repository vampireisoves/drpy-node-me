/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '星辰影院',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    title: '星辰影院',
    host: 'https://www.xcyycn.com',
    url: '/vs/fyfilter',
    searchUrl: '/s.html?wd=**&submit=',
    headers: {'User-Agent': 'MOBILE_UA'},
    searchable: 1, quickSearch: 0, filterable: 1, play_parse: true, double: false, limit: 6,
    filter_url: '{{fl.cateId}}-{{fl.area}}-{{fl.by}}-{{fl.class}}-----fypage---{{fl.year}}.html',
    filter_def: {
        '1': {cateId: '1'}, '2': {cateId: '2'}, '3': {cateId: '3'}, '4': {cateId: '4'}
    },
    class_name: '电影&电视剧&动漫&综艺',
    class_url: '1&2&4&3',
    filter: 'H4sIAAAAAAAAA+2Zy04bSRSG9/MYXrOohtwmrzLKwhNZSpRMRoJMJBQhQcDEBgcbROw4OEDENYRLcxkwDbZfxlVtv8WUXVXnnJ4hx42HRRbe+T+nbn91ddXX5bcJL/H4t7eJF6nxxOPE05fJsbHEUOJV8o+UljK7o6bTWr9Jvvwr1S33qhNO77andzthLRITQzY6t9usVWzUCsgVK7otlzPC5cKdRXl5ZXNWuJyaKqjJos1ZAfUyx3ZwKKA/GDgKaDPzqRlkXZtGuFzr0Je1jzZnBfEXLl+hv46ANqfn1LvPrk0jYJxzR2Ftz43TCKj3bj8sLrp6RkB/s0vt8jfXnxGQ23qPc2YF5A7PZXDgckZAbmFW5k9czgiXa16va8c2ZwXUy2+2NmA+jXC59tpp87Jgc1ZAvUJOTcJzNwLmulHQs+jm2giYl4PtZn3dzYsRMJ9rB2H2vZtPI7BerpVZhXpdAf1tNXDVWgHjnGmE37fcOI2A/qbq7c91158RuJbyauUE1lJXQL3KWjMIwp1JVxU0zNyXJfXJ9WrFxJNO1ryNydFUkryMFV/mgrgv4+ZOuzzrDBkB3W6XVfXIdWsEPmhfXdbhQXcFGKovyJWac2METERpS1X23UQYgQvkG9azAh7K/DHmrIA2Tz9izgoYZ/0Cc1ZAvZm8diwz7t1BTZZCmNcLp4yrwWp4GRozYa2kim6aUON2sK7mG7ph2BGchhIffBlsu7QR6M2n3vyIt/S5PJx29YyAekVfdyS/fHVVQYO3/Imsz8tD9xBRQxv1UzMfzQC2LBqCcVTWWpOnegBuKKBhRSyuynTVrQgjoPbFmZ5WV9UIGOOHC5l2W40V0VmT/rWugAP8dxS85Pbk7pRzYQTkygFZBEaQw0P6yzgI1LgdzqlKCbbDroDxL5X1JujGbwR9ccdTyVHy4l6eNa9qMV/cYTF8z8a6P0l8BOMjND6M8WEa9zDu0bjAuCBx71eI658k/gjjj2j8IcYf0vgDjD+g8fsYv0/j6Nejfj3061G/Hvr1qF8P/XrUr4d+PepXoF9B/Qr0K6hfgX4F9SvQr6B+BfoV1K9Av4L6FehXUL8C/QrqV6BfQf0K9Kt/0mX5+zguSrWwJIP8fxalymVV6bxdOrNtvH6uS+PLltUnmPKXbfLZ89djNNk6mpEZd+iMPf1zNNXp/snQL4nhHzNmeHwlV+fjHmsrtWYAO64RMID9HX0oudfdiDhHHnc8ccchd+Spvy/kJnCrEbG2foZbWd5l+JpjTI5NOeZjWZ9hU46T++VW9vuBYX2OTTn+5Lic/V4J9vDbwoo47M3xLsfQLJczvNsvQ9/IyQOa/b/E15tVe5MoS9IcpfakzRiczHDg3ZFob+bnvhh6MzNLurci1t7keWumHZDngDwH5Hkzed67U/LU56u6/h7hTxsiR0fnUKDlIqEorUbL0RCUqx7pgytajoaixBktR0OE3H54i8lRJEem7G0kd4vJUCRHdSwJM2TDESZ7q8gQNEdgHEFzhMmRG3ubzNA1R8IctXLkrQqr4T7MixFxKDKcPmh9hWtRI35iUuyXBjnC7PvekyHF3hzYm9Z602YM0mKIkr23ZQh5wD0D7hlwzy24Z+SuuKe7h4ZX161sENlWbSjKKZFykVCUj6LlaCjKR9FyNASbbM9/2cxVCzncQcOmN3Ms8xvYBuo4JzJ70q1U5QZ86RkRh7ZYwmFOZJZGOBJj6K512Gj5GdemEfg006pahefYFXGoqV8S4+7s2DtJ7r6L++++vtDeWMMjvCN+YlLhaISjmH5Jhf2nkqOYGDdWDAvcwa1UjFu1u7i36u/OacA1A64ZcM0NXDPxDyQRoaiuJgAA',
    lazy: async function () {
        let {input} = this
        const content = (await req(input)).content
        const html = JSON.parse(content.match(/r player_.*?=(.*?)</)[1])
        let url = html.url
        if (html.encrypt) {
            url = html.encrypt === "2" ? unescape(base64Decode(url)) : unescape(url)
            return {parse: 0, url}
        }
        return {parse: /m3u8|mp4/.test(url) ? 0 : 1, url: /m3u8|mp4/.test(url) ? url : input}
    },
    推荐: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.hl-vod-list li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a&&title'),
                pic_url: pd(it, '.hl-lazy&&data-original'),
                desc: pdfh(it, '.hl-pic-text&&Text'),
                url: pd(it, 'a&&href'),
            })
        });
        return setResult(d)
    },
    一级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.hl-vod-list li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a&&title'),
                pic_url: pd(it, '.hl-lazy&&data-original'),
                desc: pdfh(it, '.hl-pic-text&&Text'),
                url: pd(it, 'a&&href'),
            })
        });
        return setResult(d)
    },
    二级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};
        VOD.vod_name = pdfh(html, '.h2&&Text');
        VOD.vod_content = pdfh(html, '.hl-dc-content&&.blurb&&Text');
        let playlist = pdfa(html, '.hl-plays-list')
        let tabs = pdfa(html, '.hl-plays-from.hl-tabs a');
        let playmap = {};
        tabs.map((item, i) => {
            const form = pdfh(item, 'Text')
            const list = playlist[i]
            const a = pdfa(list, 'body&&a:not(:contains(展开))')
            a.map((it) => {
                let title = pdfh(it, 'a&&Text')
                let urls = pd(it, 'a&&href', input)
                if (!playmap.hasOwnProperty(form)) {
                    playmap[form] = [];
                }
                playmap[form].push(title + "$" + urls);
            });
        });
        VOD.vod_play_from = Object.keys(playmap).join('$$$');
        const urls = Object.values(playmap);
        const playUrls = urls.map((urllist) => {
            return urllist.join("#")
        });
        VOD.vod_play_url = playUrls.join('$$$');
        return VOD
    },
    搜索: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.hl-one-list li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, '.hl-item-title&&Text'),
                pic_url: pd(it, '.hl-lazy&&data-original'),
                desc: pdfh(it, '.hl-pic-text&&Text'),
                url: pd(it, 'a&&href'),
                content: pdfh(it, '.hl-item-content&&p:eq(0)&&Text'),
            })
        });
        return setResult(d)
    }
}
