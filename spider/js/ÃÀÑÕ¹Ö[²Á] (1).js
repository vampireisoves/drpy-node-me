/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: '美颜怪',
  author: 'LoyDgIk',
  '类型': '影视',
  mergeList: 1,
  more: {
    mergeList: 1
  },
  lang: 'ds'
})
*/


class Rule {
    类型 = "影视";
    author = "LoyDgIk";
    title = "美颜怪";
    desc = "";
    host = "http://81.70.181.238/";
    homeUrl = "";
    url = "http://81.70.181.238/%2Fhot_video%2fyclass";
    searchable = 0;
    quickSearch = 0;
    headers = {
        'User-Agent': 'okhttp/3.14.9',
    };
    timeout = 5000;
    play_parse = true;
    hikerClassListCol = 'pic_2_card';
    class_name = "最新&发现";
    class_url = "FgetList&FgetRandList";

    getSign(pg) {
        let txt = "limit=30&page=" + pg + "&key=f6113acb6573d8b98502335e06f0c857";
        let sign = md5(txt).toUpperCase();
        return sign;
    }

    async 预处理() {
    }

    async 推荐() {
    }

    async 一级(tid, pg, filter, extend) {
        try {
            let {
                //MY_CATE,
                input
            } = this;

            let d = [];
            let json = JSON.parse((await post(input, {
                body: `page=${pg}&limit=30&sign=${this.getSign(pg)}&device_id=ffffffff-ca78-c55b-ca78-c55b00000000&auth_code=NotLogin&pro_id=2`
            })));
            for (let it of json.data.list) {
                d.push({
                    title: "",
                    pic_url: it.pic,
                    url: it.src
                });
            }
            //log(d)
            return setResult(d);
        } catch (e) {
            log(e);
        }
    }

    async 搜索(wd, quick, pg) {
        try {
            // log(Object.keys(this));
            return this.一级();

            // let 一级 = rule.一级.bind(this);
            // return await 一级();
        } catch (e) {
            log(e.toString())
        }

    }

    async 二级(ids) {
        let {
            input
        } = this;
        let vod = {
            vod_id: input,
            vod_play_from: "播放",
            vod_play_url: "播放$" + input,
        };
        return vod;
    }

    async lazy(flag, id, flags) {
        return {
            parse: 0,
            url: id,
            js: ''
        }
    }
}

rule = new Rule();
