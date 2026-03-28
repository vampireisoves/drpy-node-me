/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '玖月影视',
  author: '不告诉你',
  '类型': '影视',
  logo: 'https://i-blog.csdnimg.cn/blog_migrate/2621e710a94ab40ba66645d47f296aaf.gif',
  lang: 'ds'
})
*/

var rule = {
    title: '玖月影视',
    author: '不告诉你',
    logo: 'https://i-blog.csdnimg.cn/blog_migrate/2621e710a94ab40ba66645d47f296aaf.gif',
    host: 'http://www.xiao1616.com',
    url: '/as/fyclass-fypage.html',
    searchUrl: '/vodvsearch/**----------fypage---.html',
    headers: {
        'User-Agent': 'UC_UA'
    },
    homeUrl: '/',
    searchable: 1,
    quickSearch: 1,
    play_parse: true,
    double: true,
    timeout: 5000,
    class_name: '爱情&动作&科幻&剧情&恐怖&喜剧&其它&国剧&港澳&日剧&韩剧&美剧&国漫&次元&综艺',
    class_url: '5&6&7&8&9&10&11&12&13&14&15&16&17&18&4',
    推荐: '*',
    tab_exclude: '榜单|剧情|猜',
    一级: 'ul.gfsd5d li;a&&title;.lazyload&&data-original;span.aecccdfg&&Text;a&&href',
    二级: {
        title: 'h1&&Text',
        img: '.lazyload&&data-original',
        //desc: '主要信息;年代;地区;演员;导演',
        desc: '.dfdgdasdaa&&p:eq(0)&&Text;.dfdgdasdaa&&p:eq(3)&&Text;;.dfdgdasdaa&&p:eq(1)&&Text;.dfdgdasdaa&&p:eq(2)&&Text',
        content: '.dfdgdasdaa&&p.desc&&Text',
        tabs: 'body&&.astdui-padnnel_hd h3',
        lists: 'ul.dfs2_plsdfaylidst:eq(#id)&&li a'
    },
    搜索: '*',
}
