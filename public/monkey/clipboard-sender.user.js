// ==UserScript==
// @name         通用网页脚本框架（重构版）
// @namespace    https://github.com/hjdhnx/drpy-node
// @description  日志、右下角弹窗、按钮皮肤、可配置布局、按钮集合弹窗、按钮开关、定时任务等；结构化、可扩展。
// @version      2.0.2
// @author       taoist (refactor by chatgpt)
// @match        https://*.baidu.com/*
// @match        https://www.baidu.com/*
// @match        https://connect.huaweicloud.com/*
// @match        https://*.huaweicloud.com/*
// @match        https://*.iconfont.cn/*
// @match        https://*.ziwierp.cn/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==

(function () {
    'use strict';

    const META = Object.freeze({ version: '2.0.2', name: '通用网页脚本框架（重构版）' });

    const CONFIG = {
        buttonTop: 280,
        popTop: 150,
        baseLeft: 0,
        columnWidth: 70,
        columnGap: 70,
        buttonHeight: 24,
        layoutMode: 'fixed', // 'fixed' or 'auto'
        layoutOffset: 10,
        themes: [
            { name: '紫色起源', fg: '#E0EEEE', bg: '#9370DB' },
            { name: '淡绿生机', fg: '#BFEFFF', bg: '#BDB76B' },
            { name: '丰收时节', fg: '#E0EEE0', bg: '#CD661D' },
            { name: '粉色佳人', fg: '#FFFAFA', bg: '#FFB6C1' },
            { name: '黑白优雅', fg: '#111', bg: '#eee' },
            // 新增渐变色皮肤
            { name: '清新蓝绿', fg: '#ffffff', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
            { name: '热情夕阳', fg: '#4a2f2f', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' },
            { name: '高级紫罗兰', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
            { name: '极光青绿', fg: '#083b2e', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
            { name: '科技未来蓝紫', fg: '#ffffff', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            // 新增更多渐变色皮肤
            { name: '日落金橙', fg: '#ffffff', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
            { name: '薄荷清凉', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
            { name: '浪漫粉紫', fg: '#ffffff', bg: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)' },
            { name: '深海蓝', fg: '#ffffff', bg: 'linear-gradient(135deg, #0c2b5b 0%, #204584 100%)' },
            { name: '森林绿意', fg: '#ffffff', bg: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
            { name: '莓果甜心', fg: '#ffffff', bg: 'linear-gradient(135deg, #c71d6f 0%, #d09693 100%)' },
            { name: '柠檬青柚', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)' },
            { name: '星空紫', fg: '#ffffff', bg: 'linear-gradient(135deg, #231557 0%, #44107a 29%, #ff1361 67%, #fff800 100%)' },
            { name: '珊瑚橙红', fg: '#ffffff', bg: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)' },
            { name: '冰川蓝白', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
            // 新增现代感皮肤
            { name: '赛博朋克', fg: '#00ffff', bg: 'linear-gradient(135deg, #0f0f23 0%, #2d1b69 50%, #ff006e 100%)' },
            { name: '霓虹夜色', fg: '#ffffff', bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #e94560 100%)' },
            { name: '极简黑金', fg: '#ffd700', bg: 'linear-gradient(135deg, #000000 0%, #434343 100%)' },
            { name: '银河星尘', fg: '#ffffff', bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 50%, #9b59b6 100%)' },
            { name: '电光蓝紫', fg: '#ffffff', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' },
            { name: '炫彩极光', fg: '#ffffff', bg: 'linear-gradient(135deg, #ff0844 0%, #ffb199 25%, #00d4ff 50%, #90e0ef 75%, #a8dadc 100%)' },
            { name: '暗黑科技', fg: '#00ff41', bg: 'linear-gradient(135deg, #0d1421 0%, #1a252f 50%, #2a3441 100%)' },
            { name: '彩虹渐变', fg: '#ffffff', bg: 'linear-gradient(135deg, #ff0000 0%, #ff8000 16.66%, #ffff00 33.33%, #80ff00 50%, #00ff80 66.66%, #0080ff 83.33%, #8000ff 100%)' },
            // 新增自然风皮肤
            { name: '樱花飞舞', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)' },
            { name: '秋叶满山', fg: '#ffffff', bg: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 50%, #ff6b6b 100%)' },
            { name: '海洋深处', fg: '#ffffff', bg: 'linear-gradient(135deg, #667db6 0%, #0082c8 50%, #0052d4 100%)' },
            { name: '翡翠森林', fg: '#ffffff', bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
            { name: '薰衣草田', fg: '#ffffff', bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
            // 新增艺术感皮肤
            { name: '油画印象', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 30%, #ff9a9e 60%, #fecfef 100%)' },
            { name: '水彩渲染', fg: '#ffffff', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)' },
            { name: '抽象几何', fg: '#ffffff', bg: 'linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #ffeaa7 100%)' },
            { name: '梦幻极光', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 25%, #d299c2 50%, #fef9d7 75%, #dae2f8 100%)' },
            { name: '水墨丹青', fg: '#ffffff', bg: 'linear-gradient(135deg, #2c3e50 0%, #34495e 30%, #7f8c8d 60%, #95a5a6 100%)' },
            { name: '火焰燃烧', fg: '#ffffff', bg: 'linear-gradient(135deg, #ff4e50 0%, #f9ca24 50%, #ff6348 100%)' },
            { name: '冰雪奇缘', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 25%, #90caf9 50%, #64b5f6 75%, #42a5f5 100%)' },
            { name: '紫罗兰梦', fg: '#ffffff', bg: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 25%, #af7ac5 50%, #c39bd3 75%, #d7bde2 100%)' },
            // 新增经典配色
            { name: '复古胶片', fg: '#f4f4f4', bg: 'linear-gradient(135deg, #8b5a3c 0%, #d4a574 50%, #f4e4bc 100%)' },
            { name: '工业风格', fg: '#ffffff', bg: 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #95a5a6 100%)' },
            { name: '马卡龙色', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 25%, #fd79a8 50%, #a29bfe 75%, #74b9ff 100%)' },
            { name: '暗夜精灵', fg: '#00d4aa', bg: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 50%, #2d2d2d 100%)' },
            // 新增时尚潮流皮肤
            { name: '玫瑰金辉', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #f8cdda 0%, #1d2b64 100%)' },
            { name: '翡翠绿洲', fg: '#ffffff', bg: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
            { name: '琥珀夕照', fg: '#ffffff', bg: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)' },
            { name: '深邃蓝海', fg: '#ffffff', bg: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
            { name: '紫晶魅惑', fg: '#ffffff', bg: 'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)' },
            { name: '橙红烈焰', fg: '#ffffff', bg: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)' },
            { name: '青春活力', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)' },
            { name: '梦幻粉紫', fg: '#ffffff', bg: 'linear-gradient(135deg, #cc2b5e 0%, #753a88 100%)' },
            { name: '金属质感', fg: '#ffffff', bg: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)' },
            { name: '炫酷黑红', fg: '#ffffff', bg: 'linear-gradient(135deg, #000000 0%, #e74c3c 100%)' },
            // 新增自然风光皮肤
            { name: '晨曦微光', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
            { name: '暮色苍茫', fg: '#ffffff', bg: 'linear-gradient(135deg, #2c3e50 0%, #fd746c 100%)' },
            { name: '春意盎然', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)' },
            { name: '秋韵浓浓', fg: '#ffffff', bg: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)' },
            { name: '冬雪皑皑', fg: '#2d2d2d', bg: 'linear-gradient(135deg, #e6ddd4 0%, #d5def5 100%)' },
            { name: '夏日清凉', fg: '#ffffff', bg: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)' },
            // 新增科幻未来皮肤
            { name: '星际穿越', fg: '#ffffff', bg: 'linear-gradient(135deg, #0f0f23 0%, #8e44ad 50%, #3498db 100%)' },
            { name: '量子空间', fg: '#00ffff', bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
            { name: '机械战警', fg: '#ffffff', bg: 'linear-gradient(135deg, #434343 0%, #000000 50%, #ff6b6b 100%)' },
            { name: '虚拟现实', fg: '#ffffff', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' },
            { name: '时空隧道', fg: '#ffffff', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%)' },
            // 新增奢华典雅皮肤
            { name: '皇室紫金', fg: '#ffd700', bg: 'linear-gradient(135deg, #2c1810 0%, #8e44ad 50%, #f39c12 100%)' },
            { name: '贵族蓝银', fg: '#ffffff', bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 50%, #ecf0f1 100%)' },
            { name: '典雅黑白', fg: '#ffffff', bg: 'linear-gradient(135deg, #000000 0%, #434343 50%, #ffffff 100%)' },
            { name: '奢华红金', fg: '#ffd700', bg: 'linear-gradient(135deg, #8b0000 0%, #dc143c 50%, #ffd700 100%)' },
            { name: '翡翠宝石', fg: '#ffffff', bg: 'linear-gradient(135deg, #134e5e 0%, #71b280 50%, #a8e6cf 100%)' },
        ],
        defaultThemeIndex: 0,
        storagePrefix: 'tmx.framework.'
    };

    class Store {
        constructor(prefix) {
            this.prefix = prefix;
            this.ls = window.localStorage;
            this.ss = window.sessionStorage;
            // 检测是否支持GM存储API
            this.hasGMStorage = typeof GM_setValue !== 'undefined' && typeof GM_getValue !== 'undefined';
        }

        key(k) {
            return `${this.prefix}${k}`;
        }

        get(k, d = null) {
            try {
                if (this.hasGMStorage) {
                    // 使用GM全局存储
                    const v = GM_getValue(this.key(k), null);
                    return v == null ? d : JSON.parse(v);
                } else {
                    // 降级到localStorage
                    const v = this.ls.getItem(this.key(k));
                    return v == null ? d : JSON.parse(v);
                }
            } catch (e) {
                console.warn('存储读取失败:', e);
                return d;
            }
        }

        set(k, v) {
            try {
                if (this.hasGMStorage) {
                    // 使用GM全局存储
                    GM_setValue(this.key(k), JSON.stringify(v));
                } else {
                    // 降级到localStorage
                    this.ls.setItem(this.key(k), JSON.stringify(v));
                }
            } catch (e) {
                console.warn('存储写入失败:', e);
            }
        }

        remove(k) {
            try {
                if (this.hasGMStorage) {
                    // 使用GM全局存储
                    if (typeof GM_deleteValue !== 'undefined') {
                        GM_deleteValue(this.key(k));
                    } else {
                        GM_setValue(this.key(k), null);
                    }
                } else {
                    // 降级到localStorage
                    this.ls.removeItem(this.key(k));
                }
            } catch (e) {
                console.warn('存储删除失败:', e);
            }
        }

        // Session存储仍使用sessionStorage（因为GM不支持session级别存储）
        sget(k, d = null) {
            try {
                const v = this.ss.getItem(this.key(k));
                return v == null ? d : JSON.parse(v);
            } catch (e) {
                console.warn('Session存储读取失败:', e);
                return d;
            }
        }

        sset(k, v) {
            try {
                this.ss.setItem(this.key(k), JSON.stringify(v));
            } catch (e) {
                console.warn('Session存储写入失败:', e);
            }
        }

        sremove(k) {
            try {
                this.ss.removeItem(this.key(k));
            } catch (e) {
                console.warn('Session存储删除失败:', e);
            }
        }

        // 获取所有存储的键（仅GM模式支持）
        getAllKeys() {
            if (this.hasGMStorage && typeof GM_listValues !== 'undefined') {
                try {
                    return GM_listValues().filter(key => key.startsWith(this.prefix));
                } catch (e) {
                    console.warn('获取存储键列表失败:', e);
                    return [];
                }
            }
            return [];
        }

        // 获取存储模式信息
        getStorageInfo() {
            return {
                mode: this.hasGMStorage ? 'GM全局存储' : 'localStorage',
                crossDomain: this.hasGMStorage,
                prefix: this.prefix
            };
        }
    }

    const store = new Store(CONFIG.storagePrefix);

    const h = (tag, attrs = {}, children = []) => {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) {
            if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
            else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
            else if (v != null) el.setAttribute(k, String(v));
        }
        for (const child of [].concat(children)) {
            if (child == null) continue;
            el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        }
        return el;
    };

    function getLayoutOffset(defaultOffset = 10) {
        // 使用 includes 防止 Rollup 将此代码块视为死代码而被移除 (Tree Shaking)
        if (['auto'].includes(CONFIG.layoutMode)) {
            const isMobile = /Android|iPhone|SymbianOS|Windows Phone|iPad|iPod/i.test(navigator.userAgent);
            if (isMobile) return 10;
            const h = window.screen.height;
            if (h === 1080) return 300;
            if (h === 768) return 100;
            if (h === 720) return 50;
            if (h < 720) return 0;
            if (h > 1080) return 500;
            return defaultOffset;
        }
        return Number(CONFIG.layoutOffset) || defaultOffset;
    }

    const ZIndexManager = {
        baseZIndex: 2147483647, // 最高基础层级
        currentZIndex: 2147483647,
        
        getNextZIndex() {
            return ++this.currentZIndex;
        },
        
        // 确保元素在最上层
        bringToTop(element) {
            element.style.zIndex = this.getNextZIndex();
        }
    };

    const buttonMap = new Map();
    const groupMap = new Map();

    let columnsInstance = null;

    function setColumns(columns) {
        columnsInstance = columns;
    }

    function getColumns() {
        return columnsInstance;
    }

    const Logger = (() => {
        let el, hooked = false, orig = { log: console.log, clear: console.clear };

        function ensure() {
            if (el) return;
            
            // 检测是否为移动端设备
            const isMobile = /Android|iPhone|SymbianOS|Windows Phone|iPad|iPod/i.test(navigator.userAgent);
            
            // 计算日志窗口的最大宽度：按钮宽度 * 总列数(5)
            const loggerMaxWidth = CONFIG.columnWidth * 5; // 70 * 5 = 350px
            
            let loggerStyle;
            if (isMobile) {
                // 移动端：日志窗体在隐藏日志按钮上方
                const hideLogBtn = buttonMap.get('toggle-log');
                let left = CONFIG.baseLeft + getLayoutOffset();
                
                // 计算合适的日志窗口高度，确保不超出屏幕顶部
                const viewportHeight = window.innerHeight;
                let maxLoggerHeight = Math.min(285, viewportHeight * 0.4); // 最大不超过视窗高度的40%
                let top = CONFIG.buttonTop - maxLoggerHeight - 10; // 日志窗体高度 + 10px间距
                
                // 如果隐藏日志按钮已存在，根据其位置动态调整
                if (hideLogBtn) {
                    const btnRect = hideLogBtn.getBoundingClientRect();
                    left = btnRect.left;
                    top = btnRect.top - maxLoggerHeight - 10;
                }
                
                // 确保不超出视窗顶部，留出至少10px边距
                if (top < 10) {
                    top = 10;
                    // 如果顶部空间不足，重新计算高度
                    const availableHeight = (hideLogBtn ? hideLogBtn.getBoundingClientRect().top : CONFIG.buttonTop) - 20;
                    if (availableHeight > 100) {
                        maxLoggerHeight = Math.min(maxLoggerHeight, availableHeight);
                    }
                }
                
                loggerStyle = {
                    position: 'fixed', 
                    left: left + 'px',
                    top: top + 'px', 
                    minWidth: '220px', 
                    maxWidth: Math.min(loggerMaxWidth, window.innerWidth - 10) + 'px', // 移动端：5个按钮宽度或屏幕宽度-10px
                    maxHeight: maxLoggerHeight + 'px',
                    overflow: 'auto', 
                    fontFamily: 'Helvetica,Arial,sans-serif', 
                    fontSize: '12px',
                    fontWeight: 'bold', 
                    padding: '6px', 
                    background: 'var(--tmx-bg)', 
                    color: 'var(--tmx-fg)',
                    border: '1px solid #aaa', 
                    zIndex: 2147483640, // 降低层级，确保GroupPopup在上方 
                    opacity: 0.9,
                    wordWrap: 'break-word', 
                    whiteSpace: 'pre-wrap'
                };
            } else {
                // PC端：保持原有位置（最后一列按钮右边）
                loggerStyle = {
                    position: 'fixed', 
                    left: (CONFIG.baseLeft + getLayoutOffset() + loggerMaxWidth) + 'px',
                    top: (CONFIG.buttonTop + 3) + 'px', 
                    minWidth: '220px', 
                    maxWidth: loggerMaxWidth + 'px', // PC端使用计算出的最大宽度
                    maxHeight: '285px',
                    overflow: 'auto', 
                    fontFamily: 'Helvetica,Arial,sans-serif', 
                    fontSize: '12px',
                    fontWeight: 'bold', 
                    padding: '6px', 
                    background: 'var(--tmx-bg)', 
                    color: 'var(--tmx-fg)',
                    border: '1px solid #aaa', 
                    zIndex: 2147483646, 
                    opacity: 0.9,
                    wordWrap: 'break-word', 
                    whiteSpace: 'pre-wrap'
                };
            }
            
            el = h('div', {
                id: 'tmx-logger',
                style: loggerStyle
            });
              document.body.appendChild(el);
        }

        function hook() {
            if (hooked) return;
            ensure();
            console.log = (...args) => {
                append(args.join(' '));
                orig.log.apply(console, args);
            };
            console.clear = () => {
                clear();
                orig.clear.apply(console);
            };
            hooked = true;
        }

        function append(text) {
            ensure();
            const row = h('div', {
                style: {
                    lineHeight: '18px',
                    background: el.children.length % 2 ? 'rgba(255,255,255,0.2)' : ''
                }
            }, text);
            el.appendChild(row);
            el.scrollTop = el.scrollHeight - el.clientHeight;
        }

        function clear() {
            if (el) el.innerHTML = '';
        }

        function hide() {
            if (el) el.style.display = 'none';
        }

        function show() {
            ensure();
            el.style.display = '';
        }

        function applyTheme() {
            if (el) {
                el.style.background = 'var(--tmx-bg)';
                el.style.color = 'var(--tmx-fg)';
            }
        }

        return { hook, append, clear, hide, show, applyTheme };
    })();

    const Theme = {
        index: store.get('theme.index', CONFIG.defaultThemeIndex),
        get current() {
            return CONFIG.themes[this.index % CONFIG.themes.length];
        },
        next() {
            this.setIndex((this.index + 1) % CONFIG.themes.length);
        },
        setIndex(i) {
            this.index = i;
            store.set('theme.index', i);
            this.apply();
        },
        apply() {
            document.documentElement.style.setProperty('--tmx-fg', this.current.fg);
            document.documentElement.style.setProperty('--tmx-bg', this.current.bg);
            document.documentElement.style.setProperty('--tmx-btn-h', CONFIG.buttonHeight + 'px');
        }
    };

    function btnStyle() {
        return {
            display: 'block',
            width: '100%',
            height: 'var(--tmx-btn-h)',
            marginTop: '6px',
            color: 'var(--tmx-fg)',
            background: 'var(--tmx-bg)',
            border: '1px solid #999',
            cursor: 'pointer'
        };
    }

    class Columns {
        constructor() {
            this.columns = new Map();
            for (let i = 1; i <= 5; i++) this.ensure(i);
        }

        ensure(index) {
            if (this.columns.has(index)) return this.columns.get(index);
            const offset = getLayoutOffset();
            const left = CONFIG.baseLeft + offset + (index - 1) * CONFIG.columnGap;
            const box = h('div', {
                'data-tmx-ui': 'true',
                style: {
                    position: 'fixed',
                    top: CONFIG.buttonTop + 'px',
                    left: left + 'px',
                    width: CONFIG.columnWidth + 'px',
                    zIndex: 2147483646
                }
            });
            document.body.appendChild(box);
            this.columns.set(index, box);
            return box;
        }

        addButton(index, label, onClick) {
            const box = this.ensure(index);
            const btn = h('button', { style: btnStyle(), title: label }, label);
            btn.addEventListener('click', onClick);
            box.appendChild(btn);
            return btn;
        }
    }

    class GroupPopup {
        constructor(title) {
            this.title = title;
            // overlay covers full screen to allow click-outside-to-close
            this.overlay = h('div', {
                'data-tmx-ui': 'true',
                style: {
                    position: 'fixed',
                    inset: '0',
                    zIndex: 2147483645,
                    display: 'none',
                    background: 'rgba(0,0,0,0)',
                    pointerEvents: 'none' // 允许点击穿透到下层
                }
            });
            // 添加关闭按钮到panel
            const closeBtn = h('button', {
                style: {
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    width: '20px',
                    height: '20px',
                    border: 'none',
                    background: '#ff6b6b',
                    color: 'white',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '12px',
                    lineHeight: '1'
                }
            }, '×');
            closeBtn.addEventListener('click', () => this.hide());
            
            // 为panel单独设置pointer-events
            this.panelClickHandler = (e) => {
                e.stopPropagation();
            };

            // 创建固定定位的wrapper
            this.panelWrapper = h('div', {
                style: {
                    position: 'fixed',
                    top: CONFIG.popTop + 'px',
                    left: getLayoutOffset() + 'px',
                    pointerEvents: 'auto'
                }
            });
            
            this.panel = h('div', {
                style: {
                    position: 'relative',
                    width: 'min(480px, calc(100vw - 20px))', // 5列按钮宽度，移动端不超出
                    padding: '10px 8px',
                    background: '#B2DFEE',
                    color: 'green',
                    textAlign: 'center',
                    border: '2px solid #ccc',
                    boxSizing: 'border-box'
                }
            });
            this.panel.addEventListener('click', this.panelClickHandler);
            
            // 添加关闭按钮到panel
            this.panel.appendChild(closeBtn);
            
            const titleBar = h('div', { style: { marginBottom: '6px', fontWeight: 'bold' } }, title);
            this.btnWrap = h('div', {
                style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    minHeight: '40px'
                }
            });
            this.panel.append(titleBar, this.btnWrap);
            this.panelWrapper.appendChild(this.panel);
            this.overlay.append(this.panelWrapper);
            document.body.appendChild(this.overlay);
            this.visible = false;
        }

        /**
         * 添加按钮
         * @param {string} label
         * @param {Function} handler  // will be called either as handler(btn) for toggles or handler() for normal
         * @param {Object} options { isToggle:boolean, storeKey:string }
         */
        addButton(label, handler, options = {}) {
            const btn = h('button', {
                style: Object.assign({}, btnStyle(), {
                    width: 'calc(20% - 3.2px)', // 每行5列，减去gap间距
                    minWidth: '60px',
                    maxWidth: '80px',
                    flex: '0 0 auto',
                    padding: '3px 4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '12px'
                }),
                title: label
            }, label);
            // apply current theme colors
            btn.style.color = getComputedStyle(document.documentElement).getPropertyValue('--tmx-fg') || CONFIG.themes[0].fg;
            btn.style.background = getComputedStyle(document.documentElement).getPropertyValue('--tmx-bg') || CONFIG.themes[0].bg;

            if (options.isToggle && options.storeKey) {
                // read initial state from store
                let active = store.get(options.storeKey, 0) === 1;
                btn.style.borderStyle = active ? 'inset' : 'outset';
                
                // 如果是开关，且初始为开启状态，尝试更新按钮文本
                // 注意：这里我们假设 label 格式为 "开XX"，开启后变为 "关XX"
                // 或者更通用的做法是，handler 内部会根据 store 状态更新文本，
                // 但这里是初始化，handler 还没执行。
                // 实际上，makeToggle 生成的 handler 已经处理了点击后的文本更新。
                // 问题的关键在于：页面刷新加载时，按钮文本是初始传入的 label（通常是"开XX"），
                // 但如果 store 里状态是 1（已开启），按钮应该是"关XX"。
                
                if (active && label.startsWith('开')) {
                    btn.textContent = label.replace('开', '关');
                }

                // click toggles state, calls handler with (active, btn)
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // 注意：这里的 active 变量是闭包内的局部变量，
                    // 但 makeToggle 内部也会读取 store。
                    // 为了避免状态不一致，最好重新从 store 读取，或者让 handler 负责更新状态。
                    // 现在的逻辑是：点击 -> active取反 -> 更新样式 -> 调用handler -> handler更新store
                    
                    // 修正：点击时，active 应该是取反后的值
                    // 但 makeToggle 的逻辑是：读取 store -> 取反 -> 保存 store -> 更新 UI
                    // 所以这里我们只需要调用 handler 即可，handler 会处理一切
                    // 不过 handler 需要知道当前按钮元素，以便更新文本
                    
                    try {
                        // 传递 btn 给 handler，handler (makeToggle返回的函数) 会处理状态切换和UI更新
                        handler(btn);
                        
                        // 更新闭包内的 active 状态，以便下次点击逻辑正确（虽然 makeToggle 内部主要依赖 store）
                        // 重新读取 store 以确保同步
                        active = store.get(options.storeKey, 0) === 1;
                        btn.style.borderStyle = active ? 'inset' : 'outset';
                    } catch (err) {
                        console.error(err);
                    }
                    this.hide(); // collapse after click (保持原版体验)
                });
            } else {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    try {
                        handler(btn);
                    } catch (err) {
                        console.error(err);
                    }
                    this.hide();
                });
            }
            this.btnWrap.appendChild(btn);
            return btn;
        }

        show() {
            this.overlay.style.display = '';
            // 确保当前弹窗在最上层
            ZIndexManager.bringToTop(this.overlay);
            this.visible = true;
        }

        hide() {
            this.overlay.style.display = 'none';
            this.visible = false;
        }

        toggle() {
            this.visible ? this.hide() : this.show();
        }
    }

    const Dialog = (() => {
        let overlay, panel, titleEl, contentEl, inputEl, buttonArea;
        let resolvePromise = null;

        function ensure() {
            return new Promise((resolve) => {
                // 检查所有必要的DOM元素是否都已创建
                if (overlay && titleEl && contentEl && buttonArea) {
                    resolve();
                    return;
                }

                // 确保document.body已经存在
                if (!document.body) {
                    console.error('Dialog: document.body not ready');
                    setTimeout(() => ensure().then(resolve), 100);
                    return;
                }

                initializeDialog();
                resolve();
            });
        }

        function initializeDialog() {

            // 创建遮罩层
            overlay = h('div', {
                'data-tmx-ui': 'true',
                style: {
                    position: 'fixed',
                    inset: '0',
                    zIndex: 2147483647, // 最高层级，确保在指令管理界面之上
                    display: 'none',
                    background: 'rgba(0,0,0,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            });

            // 创建对话框面板
            panel = h('div', {
                style: {
                    width: '320px',
                    maxWidth: '90vw',
                    background: '#fff',
                    borderRadius: '4px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    fontFamily: 'Arial, sans-serif'
                }
            });

            // 标题栏
            const header = h('div', {
                style: {
                    padding: '12px 15px',
                    borderBottom: '1px solid #eee',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: '8px',
                    lineHeight: '1.4',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    minHeight: '40px'
                }
            });

            titleEl = h('div', {
                style: {
                    flex: '1 1 auto',
                    minWidth: '0',
                    marginRight: '10px',
                    lineHeight: '1.4',
                    fontSize: '14px',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    overflow: 'visible'
                }
            }, '对话框');

            // 右上角关闭按钮
            const closeButton = h('button', {
                style: {
                    background: 'none',
                    border: 'none',
                    color: 'var(--tmx-fg)',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '2px',
                    marginLeft: 'auto',
                    flex: '0 0 auto'
                },
                onclick: () => hide(null)
            }, '×');

            // 鼠标悬停效果
            closeButton.addEventListener('mouseenter', () => {
                closeButton.style.background = 'rgba(255,255,255,0.2)';
            });
            closeButton.addEventListener('mouseleave', () => {
                closeButton.style.background = 'none';
            });

            header.appendChild(titleEl);
            header.appendChild(closeButton);

            // 内容区域
            contentEl = h('div', {
                style: {
                    padding: '15px',
                    minHeight: '50px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    lineHeight: '1.5'
                }
            });

            // 输入框区域（用于prompt）
            inputEl = h('input', {
                type: 'text',
                style: {
                    display: 'none',
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginTop: '10px',
                    boxSizing: 'border-box'
                }
            });
            contentEl.appendChild(inputEl);

            // 按钮区域
            buttonArea = h('div', {
                style: {
                    padding: '10px 15px',
                    borderTop: '1px solid #eee',
                    textAlign: 'right'
                }
            });

            panel.append(header, contentEl, buttonArea);
            overlay.appendChild(panel);
            document.body.appendChild(overlay);

            // 添加调试日志
            console.log('Dialog: DOM elements created and appended to body');
        }

        function createButton(text, isPrimary = false, onClick) {
            return h('button', {
                style: {
                    padding: '6px 12px',
                    marginLeft: '8px',
                    background: isPrimary ? 'var(--tmx-bg)' : '#f8f9fa',
                    color: isPrimary ? 'var(--tmx-fg)' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                },
                onclick: onClick
            }, text);
        }

        async function show(title, content, options = {}) {
            await ensure();
            if (!titleEl) {
                console.error('Dialog show: titleEl is still undefined after ensure()');
                return;
            }
            titleEl.textContent = title || '提示';

            // 清理旧内容
            const oldContent = contentEl.querySelectorAll(':not(input)');
            oldContent.forEach(el => el.remove());

            // 设置内容
            if (typeof content === 'string') {
                const contentNode = document.createElement('div');
                contentNode.innerHTML = content;
                // 设置内容区域的文本换行样式
                contentNode.style.whiteSpace = 'normal';
                contentNode.style.wordWrap = 'break-word';
                contentNode.style.wordBreak = 'break-word';
                contentNode.style.overflowWrap = 'anywhere';
                contentNode.style.lineHeight = '1.5';
                contentEl.insertBefore(contentNode, inputEl);
            } else {
                contentEl.insertBefore(content, inputEl);
            }

            // 处理输入框
            inputEl.style.display = options.showInput ? 'block' : 'none';
            inputEl.value = options.defaultValue || '';
            if (options.showInput) {
                setTimeout(() => inputEl.focus(), 100);
            }

            // 清空并添加按钮
            buttonArea.innerHTML = '';
            if (options.buttons) {
                options.buttons.forEach(btn => {
                    buttonArea.appendChild(btn);
                });
            }

            // 显示对话框
            overlay.style.display = 'flex';

            // 返回Promise
            return new Promise(resolve => {
                resolvePromise = resolve;
            });
        }

        function hide(result) {
            if (overlay) {
                overlay.style.display = 'none';
                // 清理内容
                const oldContent = contentEl.querySelectorAll(':not(input)');
                oldContent.forEach(el => el.remove());
                inputEl.style.display = 'none';
                inputEl.value = '';
                buttonArea.innerHTML = '';
            }
            if (resolvePromise) {
                resolvePromise(result);
                resolvePromise = null;
            }
        }

        function alert(message, title = '提示') {
            const okButton = createButton('确定', true, () => hide(true));
            return show(title, message, {
                buttons: [okButton]
            });
        }

        function confirm(message, title = '确认') {
            const cancelButton = createButton('取消', false, () => hide(false));
            const okButton = createButton('确定', true, () => hide(true));
            return show(title, message, {
                buttons: [cancelButton, okButton]
            });
        }

        function prompt(message, defaultValue = '', title = '输入') {
            const cancelButton = createButton('取消', false, () => hide(null));
            const okButton = createButton('确定', true, () => hide(inputEl.value));
            return show(title, message, {
                showInput: true,
                defaultValue: defaultValue,
                buttons: [cancelButton, okButton]
            });
        }

        async function multilinePrompt(message, defaultValue = '', title = '多行输入', options = {}) {
            await ensure();
            titleEl.textContent = title || '多行输入';

            // 清理旧内容
            const oldContent = contentEl.querySelectorAll(':not(input)');
            oldContent.forEach(el => el.remove());

            // 设置内容
            if (typeof message === 'string') {
                const contentNode = document.createElement('div');
                contentNode.innerHTML = message;
                contentEl.insertBefore(contentNode, inputEl);
            } else {
                contentEl.insertBefore(message, inputEl);
            }

            // 创建多行文本输入框
            const textareaEl = h('textarea', {
                style: {
                    width: options.width || '100%',
                    height: options.height || '200px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginTop: '10px',
                    boxSizing: 'border-box',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    resize: 'both',
                    minHeight: '100px',
                    maxHeight: '400px'
                },
                placeholder: options.placeholder || '请输入代码...'
            });
            textareaEl.value = defaultValue || '';
            contentEl.insertBefore(textareaEl, inputEl);

            // 隐藏原输入框
            inputEl.style.display = 'none';

            // 调整对话框大小
            panel.style.width = options.dialogWidth || '600px';
            panel.style.maxWidth = '90vw';

            // 创建按钮
            const cancelButton = createButton('取消', false, () => {
                panel.style.width = '320px'; // 恢复默认宽度
                hide(null);
            });
            const okButton = createButton('确定', true, () => {
                const value = textareaEl.value;
                panel.style.width = '320px'; // 恢复默认宽度
                hide(value);
            });

            // 清空并添加按钮
            buttonArea.innerHTML = '';
            buttonArea.appendChild(cancelButton);
            buttonArea.appendChild(okButton);

            // 显示对话框
            overlay.style.display = 'flex';

            // 聚焦到文本框
            setTimeout(() => textareaEl.focus(), 100);

            // 返回Promise
            return new Promise(resolve => {
                resolvePromise = resolve;
            });
        }

        function applyTheme() {
            if (!panel || !buttonArea) return;
            const header = panel.querySelector('div');
            if (header) {
                header.style.background = 'var(--tmx-bg)';
                header.style.color = 'var(--tmx-fg)';
            }

            const primaryButtons = buttonArea.querySelectorAll('button');
            primaryButtons.forEach((btn, index) => {
                if (index === primaryButtons.length - 1) { // 主按钮通常是最后一个
                    btn.style.background = 'var(--tmx-bg)';
                    btn.style.color = 'var(--tmx-fg)';
                }
            });
        }

        // 初始化函数，确保DOM元素已创建
        function initialize() {
            // 确保DOM元素已创建
            ensure();
            console.log('Dialog: 初始化完成');
        }

        return { alert, confirm, prompt, multilinePrompt, applyTheme, initialize };
    })();

    const Toast = (() => {
        let root, content, titleEl, minBtn;

        function ensure() {
            if (root) return;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            root = h('div', {
                id: 'tmx-toast',
                'data-tmx-ui': 'true',
                style: {
                    position: 'fixed',
                    right: '10px',
                    bottom: '10px',
                    minWidth: isMobile ? '200px' : '250px',
                    maxWidth: isMobile ? '90vw' : '400px',
                    width: 'auto',
                    border: '1px solid #aaa',
                    background: '#fff',
                    zIndex: 2147483645,
                    display: 'none'
                }
            });
            const header = h('div', {
                style: {
                    height: '36px',
                    lineHeight: '36px',
                    padding: '0 8px',
                    color: 'var(--tmx-fg)',
                    background: 'var(--tmx-bg)',
                    borderBottom: '1px solid #aaa',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            });
            titleEl = h('span', {}, '通知');
            const btns = h('div', {
                style: {
                    display: 'flex',
                    gap: '5px'
                }
            });
            minBtn = h('button', {
                style: {
                    background: 'none',
                    border: 'none',
                    color: 'var(--tmx-fg)',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    lineHeight: '1'
                }
            }, '−');
            const closeBtn = h('button', {
                style: {
                    background: 'none',
                    border: 'none',
                    color: 'var(--tmx-fg)',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    lineHeight: '1'
                }
            }, '×');
            btns.append(minBtn, closeBtn);
            header.append(titleEl, btns);
            content = h('div', {
                style: {
                    minHeight: '60px',
                    maxHeight: isMobile ? '40vh' : '300px',
                    width: '100%',
                    overflow: 'auto',
                    fontSize: '13px',
                    fontWeight: 'normal',  // 确保文字不加粗
                    padding: '8px',
                    textAlign: 'left',
                    background: '#fff',  // 设置内容区域背景色
                    borderTop: '1px solid #eee',  // 添加顶部边框分隔线
                    borderRight: '1px solid #eee'  // 添加右边框线条
                }
            });
            root.append(header, content);
            document.body.appendChild(root);
            let expanded = true;
            minBtn.addEventListener('click', () => {
                expanded = !expanded;
                if (expanded) {
                    // 展开状态：恢复到右下角
                    content.style.display = '';
                    header.style.display = '';
                    // 重置header的flex布局样式
                    header.style.display = 'flex';
                    header.style.justifyContent = 'space-between';
                    header.style.alignItems = 'center';
                    root.style.right = '10px';
                    root.style.bottom = '10px';
                    root.style.minWidth = isMobile ? '200px' : '250px';
                    root.style.maxWidth = isMobile ? '90vw' : '400px';
                    root.style.width = 'auto';
                    root.style.height = '';
                    root.style.padding = '';
                    root.style.borderRadius = '';
                    root.style.boxShadow = '';
                    root.style.fontSize = '';
                    root.style.display = '';       // 恢复默认display
                    root.style.justifyContent = ''; // 清除flex属性
                    root.style.alignItems = '';    // 清除flex属性
                    root.style.boxSizing = '';
                    root.style.background = '';    // 清除背景色
                    root.style.color = '';         // 清除文字颜色
                    root.style.cursor = '';        // 清除鼠标样式
                    content.style.background = '#fff'; // 重置内容区域背景色
                    content.style.borderTop = '1px solid #eee'; // 重置顶部边框
                    content.style.borderRight = '1px solid #eee'; // 重置右边框
                    content.style.fontWeight = 'normal'; // 重置字体粗细
                    // 清空最小化内容 - 移除所有直接添加到root的子元素（除了header和content）
                    const childrenToRemove = [];
                    for (let child of root.children) {
                        if (child !== header && child !== content) {
                            childrenToRemove.push(child);
                        }
                    }
                    childrenToRemove.forEach(child => child.remove());
                    // 弹窗还原后重新计算调试代码容器位置
                    if (window.DebugWindow && window.DebugWindow.updateMinimizedContainerPosition) {
                        window.DebugWindow.updateMinimizedContainerPosition();
                    }
                } else {
                    // 最小化状态：固定在最右下角，样式与调试窗口一致
                    content.style.display = 'none';
                    header.style.display = 'none';
                    // 弹窗提示固定在底部
                    root.style.right = '10px';
                    root.style.bottom = '10px';
                    root.style.width = '120px';  // 设置固定宽度
                    root.style.minWidth = '';     // 清除最小宽度限制
                    root.style.maxWidth = '';     // 清除最大宽度限制
                    root.style.height = '32px';  // 设置固定高度
                    root.style.padding = '8px 12px';  // 与调试窗口最小化项一致
                    root.style.borderRadius = '4px';  // 与调试窗口最小化项一致
                    root.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'; // 与调试窗口最小化项一致
                    root.style.fontSize = '12px';     // 与调试窗口最小化项一致
                    root.style.background = 'var(--tmx-bg)';  // 添加背景颜色，与全局皮肤色保持一致
                    root.style.color = 'var(--tmx-fg)';      // 添加文字颜色
                    root.style.display = 'flex';      // 使用flex布局，与调试窗口一致
                    root.style.justifyContent = 'space-between'; // 与调试窗口布局一致
                    root.style.alignItems = 'center'; // 垂直居中
                    root.style.boxSizing = 'border-box'; // 确保padding包含在尺寸内
                    root.style.cursor = 'pointer';

                    // 创建最小化内容
                    const minimizedTitle = h('span', {
                        style: {
                            fontWeight: 'normal'  // 确保最小化标题文字不加粗
                        }
                    }, titleEl.textContent);
                    const minimizedCloseBtn = h('span', {
                        style: {
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        },
                        onclick: (e) => {
                            e.stopPropagation();
                            root.remove();
                        }
                    }, '×');

                    // 先清理可能存在的旧的最小化元素
                    const childrenToRemove = [];
                    for (let child of root.children) {
                        if (child !== header && child !== content) {
                            childrenToRemove.push(child);
                        }
                    }
                    childrenToRemove.forEach(child => child.remove());
                    
                    root.appendChild(minimizedTitle);
                    root.appendChild(minimizedCloseBtn);
                    
                    // 弹窗最小化后重新计算调试代码容器位置
                    if (window.DebugWindow && window.DebugWindow.updateMinimizedContainerPosition) {
                        window.DebugWindow.updateMinimizedContainerPosition();
                    }
                }
            });

            // 点击最小化状态时展开
            root.addEventListener('click', (e) => {
                if (!expanded && (e.target === root || e.target === root.minimizedContent || e.target.tagName === 'SPAN' && e.target.textContent !== '×')) {
                    minBtn.click();
                }
            });
            closeBtn.addEventListener('click', () => root.remove());
        }

        function show(title, html) {
            ensure();
            // 如果只传了一个参数，且是字符串，那么它应该是内容，标题默认为"通知"
            if (html === undefined && typeof title === 'string') {
                html = title;
                title = '通知';
            }
            
            titleEl.textContent = title || '通知';
            
            if (html === undefined || html === null) {
                content.innerHTML = '';
            } else if (typeof html === 'string') {
                // 处理换行符，将其转换为 <br>
                content.innerHTML = html.replace(/\n/g, '<br>');
            } else {
                content.innerHTML = '';
                content.append(html);
            }
            root.style.display = '';
        }

        function resize(hh, ww) {
            ensure();
            content.style.height = Math.max(60, hh) + 'px';
            root.style.width = Math.max(220, ww) + 'px';
        }

        function hide() {
            if (root) {
                root.remove();
                root = null;
                content = null;
                titleEl = null;
                minBtn = null;
            }
        }

        function applyTheme() {
            ensure();
        }

        return { show, resize, hide, applyTheme };
    })();

    const RemoteCommandStorage = {
        STORAGE_KEY: 'remote_commands_cache',
        LAST_SYNC_KEY: 'remote_commands_last_sync',

        // 获取缓存的远程指令
        getCache() {
            try {
                return store.get(this.STORAGE_KEY, []);
            } catch (e) {
                console.error('获取远程指令缓存失败:', e);
                return [];
            }
        },

        // 保存远程指令到缓存
        saveCache(commands) {
            try {
                store.set(this.STORAGE_KEY, commands);
                store.set(this.LAST_SYNC_KEY, Date.now());
                return true;
            } catch (e) {
                console.error('保存远程指令缓存失败:', e);
                return false;
            }
        },

        // 获取上次同步时间
        getLastSyncTime() {
            try {
                return store.get(this.LAST_SYNC_KEY, 0);
            } catch (e) {
                return 0;
            }
        },

        // 清除缓存
        clearCache() {
            try {
                store.remove(this.STORAGE_KEY);
                store.remove(this.LAST_SYNC_KEY);
            } catch (e) {
                console.error('清除远程指令缓存失败:', e);
            }
        }
    };

    const CommandStorage = {
        STORAGE_KEY: 'custom_commands',

        // 获取所有指令（包括本地和远程）
        getAll() {
            try {
                // 获取本地指令（使用全局存储）
                let localCommands = store.get(this.STORAGE_KEY, []);
                
                // 数据迁移：确保所有本地指令都有必要的字段
                let needsSave = false;
                localCommands = localCommands.map(cmd => {
                    if (!cmd.id) {
                        cmd.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                        needsSave = true;
                        console.warn('为指令添加缺失的ID:', cmd.name, cmd.id);
                    }
                    if (cmd.code === undefined || cmd.code === null) {
                        cmd.code = '';
                        needsSave = true;
                        console.warn('为指令添加缺失的代码字段:', cmd.name);
                    }
                    if (!cmd.name) {
                        cmd.name = '未命名指令_' + cmd.id;
                        needsSave = true;
                        console.warn('为指令添加缺失的名称字段:', cmd.id);
                    }
                    // 标记为本地指令
                    cmd.isRemote = false;
                    return cmd;
                });
                
                // 如果有数据需要迁移，保存回存储
                if (needsSave) {
                    this.save(localCommands);
                    console.log('指令数据迁移完成');
                }
                
                // 获取远程指令（如果启用）
                let remoteCommands = [];
                if (store.get('remote_commands_enabled', 0) === 1) {
                    remoteCommands = RemoteCommandStorage.getCache();
                }
                
                // 合并指令：远程指令在前，本地指令在后
                const allCommands = [...remoteCommands, ...localCommands];
                
                return allCommands;
            } catch (e) {
                console.error('获取指令失败:', e);
                return [];
            }
        },

        // 获取仅本地指令
        getLocalOnly() {
            try {
                let commands = store.get(this.STORAGE_KEY, []);
                
                // 确保本地指令都有必要的字段
                commands = commands.map(cmd => {
                    if (!cmd.id) {
                        cmd.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    }
                    if (cmd.code === undefined || cmd.code === null) {
                        cmd.code = '';
                    }
                    if (!cmd.name) {
                        cmd.name = '未命名指令_' + cmd.id;
                    }
                    cmd.isRemote = false;
                    return cmd;
                });
                
                return commands;
            } catch (e) {
                console.error('获取本地指令失败:', e);
                return [];
            }
        },

        // 保存指令（仅保存本地指令）
        save(commands) {
            try {
                // 过滤出本地指令
                const localCommands = commands.filter(cmd => !cmd.isRemote);
                store.set(this.STORAGE_KEY, localCommands);
                return true;
            } catch (e) {
                console.error('保存指令失败:', e);
                return false;
            }
        },

        // 添加指令（仅添加到本地）
        add(name, code, description = '') {
            const localCommands = this.getLocalOnly();
            const newCommand = {
                id: Date.now().toString(),
                name: name,
                description: description,
                code: code,
                createTime: new Date().toISOString(),
                isRemote: false
            };
            localCommands.push(newCommand);
            return this.save(localCommands);
        },

        // 删除指令（仅删除本地指令）
        remove(id) {
            const localCommands = this.getLocalOnly();
            const filtered = localCommands.filter(cmd => cmd.id !== id);
            return this.save(filtered);
        },

        // 导入指令（仅导入到本地）
        import(commandsData) {
            try {
                if (Array.isArray(commandsData)) {
                    const localCommands = this.getLocalOnly();
                    commandsData.forEach(cmd => {
                        if (cmd.name && cmd.code) {
                            localCommands.push({
                                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                name: cmd.name,
                                description: cmd.description || '',
                                code: cmd.code,
                                createTime: new Date().toISOString(),
                                isRemote: false
                            });
                        }
                    });
                    return this.save(localCommands);
                }
                return false;
            } catch (e) {
                console.error('导入指令失败:', e);
                return false;
            }
        },

        // 导出指令（仅导出本地指令）
        export() {
            const localCommands = this.getLocalOnly();
            return localCommands.map(cmd => ({
                name: cmd.name,
                description: cmd.description || '',
                code: cmd.code
            }));
        }
    };

    /**
     * 统一脚本执行器
     * 支持 async/await 语法，并注入常用的全局函数
     */
    async function executeScript(code) {
        if (!code) return;

        try {
            // 使用 AsyncFunction 构造函数来支持顶层 await
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            
            // 准备注入的变量名和值
            const context = {
                click: window.click,
                sleep: window.sleep,
                inputText: window.inputText,
                scroll: window.scroll,
                scrollToBottom: window.scrollToBottom,
                scrollToTop: window.scrollToTop,
                scrollIntoView: window.scrollIntoView,
                clickbtn: window.clickbtn,
                clickhref: window.clickhref,
                clickgo: window.clickgo,
                copyWithGreasemonkey: window.copyWithGreasemonkey,
                Toast: window.Toast,
                DebugWindow: window.DebugWindow,
                // 也可以注入 window 本身，方便访问其他全局变量
                window: window,
                document: document,
                console: console,
                alert: window.alert,
                confirm: window.confirm,
                prompt: window.prompt
            };

            const argNames = Object.keys(context);
            const argValues = Object.values(context);

            // 创建函数，参数名为注入的变量名
            const fn = new AsyncFunction(...argNames, code);
            
            // 执行函数，传入对应的值
            return await fn(...argValues);
        } catch (error) {
            console.error('[ScriptExecutor] 执行出错:', error);
            throw error;
        }
    }

    const ScheduledTaskStorage = {
        STORAGE_KEY: 'scheduled_tasks',

        // 获取所有定时任务
        getAll() {
            try {
                return store.get(this.STORAGE_KEY, []);
            } catch (e) {
                console.error('获取定时任务失败:', e);
                return [];
            }
        },

        // 保存定时任务
        save(tasks) {
            try {
                store.set(this.STORAGE_KEY, tasks);
                return true;
            } catch (e) {
                console.error('保存定时任务失败:', e);
                return false;
            }
        },

        // 添加定时任务
        add(taskData) {
            const tasks = this.getAll();
            if (typeof taskData === 'string') {
                // 兼容旧的调用方式
                const [name, commandId, schedule] = arguments;
                taskData = {
                    id: Date.now().toString(),
                    name: name,
                    commandId: commandId,
                    schedule: schedule,
                    enabled: true,
                    createTime: Date.now(),
                    lastRun: null,
                    nextRun: this.calculateNextRun(schedule)
                };
            } else {
                // 新的调用方式，传入完整的任务对象
                if (!taskData.nextRun) {
                    taskData.nextRun = this.calculateNextRun(taskData.schedule);
                }
            }
            tasks.push(taskData);
            return this.save(tasks) ? taskData : null;
        },

        // 删除定时任务
        remove(id) {
            const tasks = this.getAll();
            const filtered = tasks.filter(task => task.id !== id);
            return this.save(filtered);
        },

        // 更新定时任务
        update(id, updates) {
            const tasks = this.getAll();
            const taskIndex = tasks.findIndex(task => task.id === id);
            if (taskIndex !== -1) {
                tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
                if (updates.schedule) {
                    tasks[taskIndex].nextRun = this.calculateNextRun(updates.schedule);
                }
                return this.save(tasks);
            }
            return false;
        },

        // 计算下次执行时间
        calculateNextRun(schedule) {
            const now = new Date();
            const next = new Date(now);

            // 处理自定义格式 custom:分 时 日 月 周
            if (typeof schedule === 'string' && schedule.startsWith('custom:')) {
                // 这里简单返回每分钟，实际应该实现cron解析
                // 为了简化，这里暂时不支持复杂的cron解析，只做占位
                // 如果需要支持，需要引入cron-parser或自己实现
                next.setMinutes(next.getMinutes() + 1);
                return next.toISOString();
            }

            if (schedule === 'every-minute') {
                 next.setMinutes(next.getMinutes() + 1);
            } else if (schedule === 'every-hour') {
                 next.setHours(next.getHours() + 1);
                 next.setMinutes(0, 0, 0);
            } else if (typeof schedule === 'object') {
                // 旧的schedule对象格式
                switch (schedule.type) {
                    case 'interval':
                        next.setMinutes(next.getMinutes() + schedule.minutes);
                        break;
                    case 'daily':
                        const [hours, minutes] = schedule.time.split(':').map(Number);
                        next.setHours(hours, minutes, 0, 0);
                        if (next <= now) {
                            next.setDate(next.getDate() + 1);
                        }
                        break;
                    case 'weekly':
                        const [weekHours, weekMinutes] = schedule.time.split(':').map(Number);
                        next.setHours(weekHours, weekMinutes, 0, 0);
                        const targetDay = schedule.dayOfWeek; // 0=Sunday, 1=Monday, ...
                        const currentDay = next.getDay();
                        let daysToAdd = targetDay - currentDay;
                        if (daysToAdd < 0 || (daysToAdd === 0 && next <= now)) {
                            daysToAdd += 7;
                        }
                        next.setDate(next.getDate() + daysToAdd);
                        break;
                    case 'monthly':
                        const [monthHours, monthMinutes] = schedule.time.split(':').map(Number);
                        next.setHours(monthHours, monthMinutes, 0, 0);
                        if (schedule.dayOfMonth === 'last') {
                            // 每月最后一天
                            next.setMonth(next.getMonth() + 1, 0);
                            if (next <= now) {
                                next.setMonth(next.getMonth() + 1, 0);
                            }
                        } else {
                            // 指定日期
                            next.setDate(schedule.dayOfMonth);
                            if (next <= now) {
                                next.setMonth(next.getMonth() + 1);
                            }
                        }
                        break;
                    default:
                        next.setMinutes(next.getMinutes() + 1);
                }
            } else {
                // 默认每分钟
                next.setMinutes(next.getMinutes() + 1);
            }

            return next.toISOString();
        }
    };

    const Scheduler = (() => {
        const dailyTasks = new Map();
        const scheduledTasks = new Map();
        let isRunning = false;

        function start() {
            if (isRunning) return;
            isRunning = true;

            // 加载已保存的定时任务
            loadScheduledTasks();

            setInterval(() => {
                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                const timeKey = `${hh}:${mm}`;
                const tag = `tick.${timeKey}`;
                if (store.sget(tag)) return;
                store.sset(tag, 1);
                setTimeout(() => store.sremove(tag), 65 * 1000);

                // 执行原有的每日任务
                for (const [, t] of dailyTasks) {
                    if (t.time === timeKey) {
                        try {
                            t.fn();
                        } catch (err) {
                            console.error('[Scheduler]', err);
                        }
                    }
                }

                // 执行新的定时任务
                checkScheduledTasks(now);
            }, 10 * 1000);
        }

        function loadScheduledTasks() {
            const tasks = ScheduledTaskStorage.getAll();
            tasks.forEach(task => {
                if (task.enabled) {
                    scheduledTasks.set(task.id, task);
                }
            });
            console.log(`[Scheduler] 加载了 ${tasks.length} 个定时任务`);
        }

        function checkScheduledTasks(now) {
            for (const [taskId, task] of scheduledTasks) {
                if (!task.enabled) continue;

                const nextRun = new Date(task.nextRun);
                if (now >= nextRun) {
                    executeScheduledTask(task);
                }
            }
        }

        async function executeScheduledTask(task) {
            try {
                console.log(`[Scheduler] 执行定时任务: ${task.name}`);

                // 查找对应的指令
                const commands = CommandStorage.getAll();
                const command = commands.find(cmd => cmd.id === task.commandId);

                if (!command) {
                    console.error(`[Scheduler] 找不到指令 ID: ${task.commandId}`);
                    return;
                }

                // 执行指令代码
                const result = await executeScript(command.code);
                if (result !== undefined) {
                    console.log(`[Scheduler] 任务执行结果:`, result);
                }

                // 更新任务状态
                const now = new Date();
                task.lastRun = now.toISOString();
                task.nextRun = ScheduledTaskStorage.calculateNextRun(task.schedule);

                // 保存到存储
                ScheduledTaskStorage.update(task.id, {
                    lastRun: task.lastRun,
                    nextRun: task.nextRun
                });

                // 更新内存中的任务
                scheduledTasks.set(task.id, task);

                Toast.show(`定时任务 "${task.name}" 执行完成`);

            } catch (error) {
                console.error(`[Scheduler] 任务执行失败: ${task.name}`, error);
                Toast.show(`定时任务执行失败: ${error.message}`, 'error');
            }
        }

        function registerDaily(hhmm, fn, key) {
            dailyTasks.set(key || hhmm, { time: hhmm, fn });
        }

        function unregister(key) {
            dailyTasks.delete(key);
        }

        function addScheduledTask(task) {
            if (task.enabled) {
                scheduledTasks.set(task.id, task);
            }
        }

        function removeScheduledTask(taskId) {
            scheduledTasks.delete(taskId);
        }

        function updateScheduledTask(taskId, updates) {
            const task = scheduledTasks.get(taskId);
            if (task) {
                Object.assign(task, updates);
                if (!task.enabled) {
                    scheduledTasks.delete(taskId);
                }
            }
        }

        return {
            start,
            registerDaily,
            unregister,
            addScheduledTask,
            removeScheduledTask,
            updateScheduledTask,
            loadScheduledTasks,
            loadTasks: loadScheduledTasks  // 为管理界面提供重新加载任务的方法
        };
    })();

    const DebugWindowManager = (() => {
        let windowCounter = 0;
        const activeWindows = new Map();
        const minimizedWindows = new Map();
        let minimizedContainer = null;

        function createMinimizedContainer() {
            // 动态计算Toast弹窗的实际高度，为调试窗口留出空间
            const toastElement = document.getElementById('tmx-toast');
            let toastHeight = 0;
            if (toastElement && toastElement.style.display !== 'none') {
                // 弹窗显示时，获取其实际高度
                toastHeight = toastElement.offsetHeight;
            }
            // 如果没有弹窗或获取不到高度，使用默认值
            if (toastHeight === 0) {
                toastHeight = 50; // 默认高度
            }
            const bottomOffset = 10 + toastHeight + 15; // 基础间距 + Toast实际高度 + 额外间距，避免遮挡弹窗按钮

            if (minimizedContainer) {
                // 如果容器已存在，更新其位置
                minimizedContainer.style.bottom = bottomOffset + 'px';
                return;
            }

            minimizedContainer = h('div', {
                style: {
                    position: 'fixed',
                    bottom: bottomOffset + 'px',
                    right: '10px',
                    zIndex: 2147483646,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    maxWidth: '300px'
                }
            });

            document.body.appendChild(minimizedContainer);
        }

        function createDebugWindow(defaultCode = '') {
            windowCounter++;
            const windowId = `debug-window-${windowCounter}`;

            // 检测是否为移动端设备
            const isMobile = /Android|iPhone|SymbianOS|Windows Phone|iPad|iPod/i.test(navigator.userAgent);
            
            // 创建窗口遮罩
            const overlay = h('div', {
                'data-tmx-ui': 'true',
                style: {
                    position: 'fixed',
                    inset: '0',
                    zIndex: 2147483640,
                    display: 'flex',
                    background: 'rgba(0,0,0,0.3)',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'center',
                    paddingTop: isMobile ? (CONFIG.buttonTop + CONFIG.buttonHeight * 3 + 20) + 'px' : '0'
                }
            });

            // 创建窗口面板
            const panel = h('div', {
                style: {
                    width: '700px',
                    maxWidth: '90vw',
                    background: '#fff',
                    borderRadius: '6px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    fontFamily: 'Arial, sans-serif',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: isMobile && window.innerHeight <= 667 ? '70vh' : '80vh' // iPhone SE等小屏设备优化
                }
            });

            // 标题栏
            const header = h('div', {
                style: {
                    padding: '10px 15px',
                    borderBottom: '1px solid #eee',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            });

            const titleEl = h('span', {}, `调试代码 #${windowCounter}`);

            // 窗口控制按钮容器
            const controlButtons = h('div', {
                style: {
                    display: 'flex',
                    gap: '5px'
                }
            });

            // 最小化按钮
            const minimizeButton = h('button', {
                style: {
                    background: 'none',
                    border: 'none',
                    color: 'var(--tmx-fg)',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    lineHeight: '1'
                },
                onclick: () => minimizeWindow(windowId)
            }, '−');

            // 关闭按钮
            const closeButton = h('button', {
                style: {
                    background: 'none',
                    border: 'none',
                    color: 'var(--tmx-fg)',
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    lineHeight: '1'
                },
                onclick: () => closeWindow(windowId)
            }, '×');

            // 按钮悬停效果
            [minimizeButton, closeButton].forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'rgba(255,255,255,0.2)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'none';
                });
            });

            controlButtons.appendChild(minimizeButton);
            controlButtons.appendChild(closeButton);
            header.appendChild(titleEl);
            header.appendChild(controlButtons);

            // 添加拖动功能
            let isDragging = false;
            let dragOffset = { x: 0, y: 0 };

            // 设置标题栏样式支持拖动
            header.style.cursor = 'move';
            header.style.userSelect = 'none';

            header.addEventListener('mousedown', (e) => {
                // 只有点击标题区域才能拖动，避免点击按钮时触发拖动
                if (e.target === header || e.target === titleEl) {
                    isDragging = true;
                    const rect = panel.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;

                    // 防止文本选择
                    e.preventDefault();

                    // 添加全局鼠标事件
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                }
            });

            function handleMouseMove(e) {
                if (!isDragging) return;

                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;

                // 限制窗口不超出视窗边界
                const maxX = window.innerWidth - panel.offsetWidth;
                const maxY = window.innerHeight - panel.offsetHeight;

                const constrainedX = Math.max(0, Math.min(newX, maxX));
                const constrainedY = Math.max(0, Math.min(newY, maxY));

                panel.style.position = 'fixed';
                panel.style.left = constrainedX + 'px';
                panel.style.top = constrainedY + 'px';
                panel.style.transform = 'none';
            }

            function handleMouseUp() {
                isDragging = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }

            // 内容区域
            const contentEl = h('div', {
                style: {
                    padding: '15px',
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }
            });

            // 多行文本输入框
            const textareaEl = h('textarea', {
                style: {
                    width: '100%',
                    height: isMobile && window.innerHeight <= 667 ? '200px' : '300px', // 小屏设备减少高度
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    resize: 'vertical',
                    minHeight: isMobile && window.innerHeight <= 667 ? '150px' : '200px', // 小屏设备减少最小高度
                    maxHeight: isMobile && window.innerHeight <= 667 ? '300px' : '500px', // 小屏设备减少最大高度
                    flex: '1'
                },
                placeholder: '请输入JavaScript代码...\n\n支持多行输入，例如:\nconsole.log("调试信息");\nalert("弹窗测试");\ndocument.querySelector("body").style.background = "red";'
            });
            textareaEl.value = defaultCode;

            // 按钮区域
            const buttonArea = h('div', {
                style: {
                    padding: '15px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px'
                }
            });

            // 执行按钮
            const executeButton = h('button', {
                style: {
                    padding: '8px 16px',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                },
                onclick: () => executeCode(textareaEl.value, windowId)
            }, '执行代码');

            // 添加到指令集按钮
            const addToCommandButton = h('button', {
                style: {
                    padding: '8px 16px',
                    background: '#FF9800',
                    color: '#ffffff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginRight: '5px'
                },
                onclick: () => addToCommandSet(textareaEl.value)
            }, '添加到指令集');

            // 从指令集选择按钮
            const selectFromCommandButton = h('button', {
                style: {
                    padding: '8px 16px',
                    background: '#4CAF50',
                    color: '#ffffff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginRight: '5px'
                },
                onclick: () => selectFromCommandSet(textareaEl)
            }, '从指令集选择');

            // 快捷指令按钮
            const snippetButton = h('button', {
                style: {
                    padding: '8px 16px',
                    background: '#17a2b8',
                    color: '#ffffff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginRight: '5px'
                },
                onclick: () => showSnippets(textareaEl)
            }, '快捷指令');

            // 清空按钮
            const clearButton = h('button', {
                style: {
                    padding: '8px 16px',
                    background: '#f8f9fa',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                },
                onclick: () => {
                    textareaEl.value = '';
                    textareaEl.focus();
                }
            }, '清空');

            buttonArea.appendChild(clearButton);
            buttonArea.appendChild(addToCommandButton);
            buttonArea.appendChild(snippetButton);
            buttonArea.appendChild(selectFromCommandButton);
            buttonArea.appendChild(executeButton);

            contentEl.appendChild(textareaEl);
            panel.appendChild(header);
            panel.appendChild(contentEl);
            panel.appendChild(buttonArea);
            overlay.appendChild(panel);

            // 存储窗口信息
            const windowInfo = {
                id: windowId,
                overlay,
                panel,
                textareaEl,
                titleEl
            };

            activeWindows.set(windowId, windowInfo);
            document.body.appendChild(overlay);

            // 聚焦到文本框
            setTimeout(() => textareaEl.focus(), 100);

            return windowId;
        }

        function minimizeWindow(windowId) {
            const windowInfo = activeWindows.get(windowId);
            if (!windowInfo) return;

            // 隐藏窗口
            windowInfo.overlay.style.display = 'none';

            // 移动到最小化列表
            minimizedWindows.set(windowId, windowInfo);
            activeWindows.delete(windowId);

            // 创建最小化容器
            createMinimizedContainer();

            // 创建最小化项
            const minimizedItem = h('div', {
                style: {
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    width: '120px',  // 设置固定宽度，与Toast弹窗一致
                    height: '32px',  // 设置固定高度，与Toast弹窗一致
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    boxSizing: 'border-box'  // 确保padding包含在尺寸内
                },
                onclick: () => restoreWindow(windowId)
            });

            const titleSpan = h('span', {}, windowInfo.titleEl.textContent);
            const closeBtn = h('span', {
                style: {
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                },
                onclick: (e) => {
                    e.stopPropagation();
                    closeWindow(windowId);
                }
            }, '×');

            minimizedItem.appendChild(titleSpan);
            minimizedItem.appendChild(closeBtn);
            minimizedContainer.appendChild(minimizedItem);

            // 存储最小化项引用
            windowInfo.minimizedItem = minimizedItem;
        }

        function restoreWindow(windowId) {
            const windowInfo = minimizedWindows.get(windowId);
            if (!windowInfo) return;

            // 显示窗口
            windowInfo.overlay.style.display = 'flex';

            // 移回活动列表
            activeWindows.set(windowId, windowInfo);
            minimizedWindows.delete(windowId);

            // 移除最小化项
            if (windowInfo.minimizedItem) {
                windowInfo.minimizedItem.remove();
                delete windowInfo.minimizedItem;
            }

            // 如果没有最小化窗口了，移除容器
            if (minimizedWindows.size === 0 && minimizedContainer) {
                minimizedContainer.remove();
                minimizedContainer = null;
            }

            // 聚焦到文本框
            setTimeout(() => windowInfo.textareaEl.focus(), 100);
        }

        function closeWindow(windowId) {
            // 从活动窗口中移除
            const activeWindow = activeWindows.get(windowId);
            if (activeWindow) {
                activeWindow.overlay.remove();
                activeWindows.delete(windowId);
            }

            // 从最小化窗口中移除
            const minimizedWindow = minimizedWindows.get(windowId);
            if (minimizedWindow) {
                minimizedWindow.overlay.remove();
                if (minimizedWindow.minimizedItem) {
                    minimizedWindow.minimizedItem.remove();
                }
                minimizedWindows.delete(windowId);
            }

            // 如果没有最小化窗口了，移除容器
            if (minimizedWindows.size === 0 && minimizedContainer) {
                minimizedContainer.remove();
                minimizedContainer = null;
            }
        }

        async function executeCode(code, windowId) {
            if (!code || code.trim() === '') {
                await Dialog.alert('请输入要执行的代码', '提示');
                return;
            }

            try {
                console.log(`[调试窗口 #${windowId}] 执行代码:`, code);
                const result = await executeScript(code);
                console.log(`[调试窗口 #${windowId}] 执行结果:`, result);

                // 显示执行结果
                if (result !== undefined) {
                    const resultStr = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
                    await Dialog.alert(`执行结果:\n${resultStr}`, '调试结果');
                } else {
                    await Dialog.alert('代码执行完成（无返回值）', '调试结果');
                }

                Logger.append(`[调试窗口] 执行成功: ${code.split('\n')[0]}${code.split('\n').length > 1 ? '...' : ''}`);
            } catch (error) {
                console.error(`[调试窗口 #${windowId}] 执行错误:`, error);
                await Dialog.alert(`执行错误:\n${error.message}\n\n堆栈信息:\n${error.stack}`, '调试错误');
                Logger.append(`[调试窗口] 执行错误: ${error.message}`);
            }
        }

        // 添加到指令集功能
        async function addToCommandSet(code) {
            if (!code || code.trim() === '') {
                await Dialog.alert('请先输入要保存的代码', '提示');
                return;
            }

            try {
                // 请求输入指令名称
                const commandName = await Dialog.prompt('请输入指令名称:', '', '添加到指令集');

                if (commandName === null) {
                    // 用户取消了输入
                    return;
                }

                if (!commandName || commandName.trim() === '') {
                    await Dialog.alert('指令名称不能为空', '错误');
                    return;
                }

                // 请求输入指令描述（可选）
                const commandDescription = await Dialog.prompt('请输入指令描述（可选）:', '', '添加到指令集');
                
                if (commandDescription === null) {
                    // 用户取消了输入
                    return;
                }

                // 检查指令名称是否已存在
                const existingCommands = CommandStorage.getAll();
                const nameExists = existingCommands.some(cmd => cmd.name === commandName.trim());

                if (nameExists) {
                    const confirmed = await Dialog.confirm(`指令名称 "${commandName.trim()}" 已存在，是否覆盖？`, '确认覆盖');
                    if (!confirmed) {
                        return;
                    }
                    // 删除同名指令
                    const existingCommand = existingCommands.find(cmd => cmd.name === commandName.trim());
                    if (existingCommand) {
                        CommandStorage.remove(existingCommand.id);
                    }
                }

                // 添加指令到存储
                const success = CommandStorage.add(commandName.trim(), code.trim(), commandDescription ? commandDescription.trim() : '');

                if (success) {
                    Toast.show(`指令 "${commandName.trim()}" 已添加到指令集`);
                    console.log(`[指令集] 添加指令成功: ${commandName.trim()}`);
                    Logger.append(`[指令集] 添加指令: ${commandName.trim()}`);

                    // 如果指令选择器已打开，更新按钮显示
                    if (window.commandSelector && window.commandSelector.visible) {
                        window.commandSelector.updateCommandButtons();
                    }
                } else {
                    await Dialog.alert('添加指令失败，请重试', '错误');
                }

            } catch (error) {
                console.error('[指令集] 添加指令失败:', error);
                await Dialog.alert(`添加指令失败: ${error.message}`, '错误');
            }
        }

        // 从指令集选择功能
        function selectFromCommandSet(textareaEl) {
            const commands = CommandStorage.getAll();
            if (commands.length === 0) {
                Toast.show('没有可选择的指令', 'warning');
                return;
            }

            // 创建临时的指令选择弹窗
            const commandSelectPopup = new GroupPopup('选择指令');
            
            // 为每个指令添加按钮
            commands.forEach(command => {
                commandSelectPopup.addButton(command.name, () => {
                    // 将指令代码加载到调试代码区域
                    textareaEl.value = command.code;
                    textareaEl.focus();
                    Toast.show(`已加载指令: ${command.name}`);
                    console.log(`[调试执行器] 加载指令: ${command.name}`);
                    Logger.append(`[调试执行器] 加载指令: ${command.name}`);
                    
                    // 关闭弹窗
                    commandSelectPopup.hide();
                });
            });

            // 显示弹窗
            commandSelectPopup.show();
        }

        // 快捷指令列表
        const SNIPPETS = [
            { name: '点击(click)', code: 'await click(100, 100);' },
            { name: '睡眠(sleep)', code: 'await sleep(1000);' },
            { name: '输入(inputText)', code: "await inputText('内容', '#target');" },
            { name: '滚动(scroll)', code: "await scroll(0, 100);" },
            { name: '滚动到底部', code: "await scrollToBottom();" },
            { name: '点击按钮(clickbtn)', code: "clickbtn('按钮文本');" },
            { name: '点击链接(clickhref)', code: "clickhref('链接文本');" },
            { name: '点击选择器(clickgo)', code: "clickgo('.css-selector');" },
            { name: '轻提示(Toast)', code: "Toast.show('提示内容');" },
            { name: '日志(log)', code: "console.log('日志信息');" },
            { name: '循环示例', code: "for (let i = 0; i < 5; i++) {\n    console.log(i);\n    await sleep(500);\n}" }
        ];

        // 显示快捷指令弹窗
        function showSnippets(textareaEl) {
            const popup = new GroupPopup('快捷指令');
            
            SNIPPETS.forEach(snippet => {
                // 提取函数名作为按钮文本，去掉参数部分，更简洁
                const btnText = snippet.name;
                popup.addButton(btnText, () => {
                    insertTextAtCursor(textareaEl, snippet.code);
                    popup.hide();
                    // 自动将光标移动到参数位置 (如果可能)
                    // 这里暂不实现复杂的光标定位，只是插入
                });
            });
            
            popup.show();
        }

        // 在光标处插入文本
        function insertTextAtCursor(textarea, text) {
            const startPos = textarea.selectionStart;
            const endPos = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, startPos) +
                text +
                textarea.value.substring(endPos, textarea.value.length);
            textarea.focus();
            textarea.selectionStart = startPos + text.length;
            textarea.selectionEnd = startPos + text.length;
        }

        function applyTheme() {
            // 为所有活动窗口应用主题
            activeWindows.forEach(windowInfo => {
                const header = windowInfo.panel.querySelector('div');
                if (header) {
                    header.style.background = 'var(--tmx-bg)';
                    header.style.color = 'var(--tmx-fg)';
                }

                const executeButton = windowInfo.panel.querySelector('button[onclick*="executeCode"]');
                if (executeButton) {
                    executeButton.style.background = 'var(--tmx-bg)';
                    executeButton.style.color = 'var(--tmx-fg)';
                }
            });

            // 为最小化项应用主题
            if (minimizedContainer) {
                const items = minimizedContainer.querySelectorAll('div');
                items.forEach(item => {
                    item.style.background = 'var(--tmx-bg)';
                    item.style.color = 'var(--tmx-fg)';
                });
            }
        }

        // 更新最小化容器位置的方法
        function updateMinimizedContainerPosition() {
            if (minimizedContainer && minimizedWindows.size > 0) {
                // 重新计算位置
                createMinimizedContainer();
            }
        }

        // 获取最小化容器信息的方法
        return {
            createWindow: createDebugWindow,
            closeWindow,
            minimizeWindow,
            restoreWindow,
            applyTheme,
            updateMinimizedContainerPosition
        };
    })();

    // 同步远程指令集
    async function syncRemoteCommands(showToast = true) {
        const url = store.get('remote_command_url', '');
        if (!url) {
            console.log('[远程指令] 未配置远程指令集URL');
            if (showToast) {
                Toast.show('未配置远程指令集URL', 'warning');
            }
            return false;
        }

        // 显示加载状态
        if (showToast) {
            Toast.show('正在同步远程指令集...', 'info');
        }

        try {
            console.log('[远程指令] 开始同步远程指令集:', url);
            
            // 使用GM_xmlhttpRequest避免跨域问题
            const data = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache',
                        'User-Agent': 'ClipboardSender/1.0'
                    },
                    timeout: 15000, // 15秒超时
                    onload: function(response) {
                        try {
                            if (response.status < 200 || response.status >= 300) {
                                reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                                return;
                            }

                            const contentType = response.responseHeaders.toLowerCase();
                            if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
                                // 尝试解析，可能服务器没有设置正确的Content-Type
                                console.warn('[远程指令] 响应头未包含JSON类型，尝试强制解析');
                            }

                            const jsonData = JSON.parse(response.responseText);
                            resolve(jsonData);
                        } catch (parseError) {
                            reject(new Error(`JSON解析失败: ${parseError.message}`));
                        }
                    },
                    onerror: function(error) {
                        reject(new Error('网络请求失败'));
                    },
                    ontimeout: function() {
                        reject(new Error('请求超时'));
                    }
                });
            });
            
            // 验证数据格式
            if (!Array.isArray(data)) {
                throw new Error('远程指令集格式错误：应为数组格式');
            }

            if (data.length === 0) {
                console.log('[远程指令] 远程指令集为空');
                if (showToast) {
                    Toast.show('远程指令集为空', 'warning');
                }
                RemoteCommandStorage.saveCache([]);
                return true;
            }

            // 处理远程指令数据
            const remoteCommands = data.map((cmd, index) => {
                // 验证必要字段
                if (!cmd.name && !cmd.code) {
                    console.warn(`[远程指令] 跳过无效指令 (索引 ${index}):`, cmd);
                    return null;
                }
                
                // 确保每个指令都有必要的字段
                const processedCmd = {
                    id: cmd.id || `remote_${Date.now()}_${index}`,
                    name: cmd.name || `远程指令_${index + 1}`,
                    description: cmd.description || '',
                    code: cmd.code || '',
                    createTime: cmd.createTime || new Date().toISOString(),
                    isRemote: true, // 标记为远程指令
                    remoteUrl: url // 记录来源URL
                };
                return processedCmd;
            }).filter(Boolean); // 过滤掉无效指令

            // 保存到缓存
            const saveSuccess = RemoteCommandStorage.saveCache(remoteCommands);
            if (!saveSuccess) {
                throw new Error('保存远程指令到本地缓存失败');
            }
            
            console.log(`[远程指令] 同步成功，获取到 ${remoteCommands.length} 个远程指令`);
            
            if (showToast) {
                Toast.show(`远程指令同步成功，获取 ${remoteCommands.length} 个指令`, 'success');
            }
            
            return true;

        } catch (error) {
            console.error('[远程指令] 同步失败:', error);
            
            let errorMessage = '远程指令同步失败';
            if (error.message.includes('请求超时')) {
                errorMessage = '远程指令同步超时，请检查网络连接';
            } else if (error.message.includes('网络请求失败')) {
                errorMessage = '网络连接失败，请检查URL或网络状态';
            } else if (error.message.includes('JSON解析失败')) {
                errorMessage = '远程指令数据格式错误，请检查URL返回的内容';
            } else {
                errorMessage = `远程指令同步失败：${error.message}`;
            }
            
            if (showToast) {
                Toast.show(errorMessage, 'error');
            }
            
            return false;
        }
    }

    class SkinSelector {
        constructor() {
            this.overlay = h('div', {
                'data-tmx-ui': 'true',
                style: {
                    position: 'fixed',
                    inset: '0',
                    zIndex: 2147483646,
                    display: 'none',
                    background: 'rgba(0,0,0,0.3)'
                }
            });

            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.hide();
            });

            this.panel = h('div', {
                style: {
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 'min(480px, calc(100vw - 20px))',
                    maxHeight: '70vh',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    border: '2px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box'
                }
            });

            // 固定的标题栏容器
            const titleContainer = h('div', {
                style: {
                    position: 'relative',
                    padding: '15px 15px 0 15px',
                    flexShrink: '0'
                }
            });

            const titleBar = h('div', {
                style: {
                    marginBottom: '15px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    textAlign: 'center',
                    borderBottom: '1px solid #ccc',
                    paddingBottom: '10px'
                }
            }, `选择皮肤主题 (共${CONFIG.themes.length}套)`);

            this.closeBtn = h('button', {
                style: {
                    position: 'absolute',
                    top: '10px',
                    right: '15px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: 'var(--tmx-fg)',
                    fontWeight: 'bold'
                }
            }, '×');

            this.closeBtn.addEventListener('click', () => this.hide());

            titleContainer.append(titleBar, this.closeBtn);

            // 可滚动的皮肤网格容器
            const skinContainer = h('div', {
                style: {
                    flex: '1',
                    overflow: 'auto',
                    padding: '0 15px 15px 15px'
                }
            });

            this.skinGrid = h('div', {
                style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px'
                }
            });

            skinContainer.appendChild(this.skinGrid);
            this.panel.append(titleContainer, skinContainer);
            this.overlay.append(this.panel);
            document.body.appendChild(this.overlay);

            this.createSkinButtons();
            this.visible = false;
        }

        createSkinButtons() {
            CONFIG.themes.forEach((theme, index) => {
                const skinBtn = h('div', {
                    style: {
                        padding: '8px 4px',
                        border: '2px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: theme.bg,
                        color: theme.fg,
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        minHeight: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        wordBreak: 'break-all',
                        lineHeight: '1.2'
                    },
                    title: theme.name
                }, theme.name);

                // 当前选中的皮肤添加特殊标识
                if (index === Theme.index) {
                    skinBtn.style.borderColor = '#007bff';
                    skinBtn.style.borderWidth = '3px';
                    skinBtn.style.boxShadow = '0 0 10px rgba(0,123,255,0.5)';
                }

                skinBtn.addEventListener('mouseenter', () => {
                    if (index !== Theme.index) {
                        skinBtn.style.transform = 'scale(1.05)';
                        skinBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                    }
                });

                skinBtn.addEventListener('mouseleave', () => {
                    if (index !== Theme.index) {
                        skinBtn.style.transform = 'scale(1)';
                        skinBtn.style.boxShadow = 'none';
                    }
                });

                skinBtn.addEventListener('click', () => {
                    // 移除之前选中的样式
                    this.skinGrid.querySelectorAll('div').forEach(btn => {
                        btn.style.borderColor = '#ccc';
                        btn.style.borderWidth = '2px';
                        btn.style.boxShadow = 'none';
                    });

                    // 应用新皮肤
                    Theme.index = index;
                    Theme.apply();
                    Logger.applyTheme();
                    Toast.applyTheme();
                    Dialog.applyTheme();

                    // 同步按钮颜色
                    for (const [, el] of buttonMap) {
                        el.style.color = 'var(--tmx-fg)';
                        el.style.background = 'var(--tmx-bg)';
                    }
                    for (const [, gp] of groupMap) {
                        Array.from(gp.btnWrap.children).forEach(b => {
                            b.style.color = 'var(--tmx-fg)';
                            b.style.background = 'var(--tmx-bg)';
                        });
                    }

                    // 更新弹窗样式
                    this.panel.style.background = 'var(--tmx-bg)';
                    this.panel.style.color = 'var(--tmx-fg)';
                    this.closeBtn.style.color = 'var(--tmx-fg)';

                    // 标记当前选中
                    skinBtn.style.borderColor = '#007bff';
                    skinBtn.style.borderWidth = '3px';
                    skinBtn.style.boxShadow = '0 0 10px rgba(0,123,255,0.5)';

                    console.log(`已切换到皮肤: ${theme.name}`);
                });

                this.skinGrid.appendChild(skinBtn);
            });
        }

        show() {
            this.overlay.style.display = '';
            this.visible = true;
        }

        hide() {
            this.overlay.style.display = 'none';
            this.visible = false;
        }

        toggle() {
            this.visible ? this.hide() : this.show();
        }
    }

    class CommandSelector extends GroupPopup {
        constructor() {
            super('指令集');
            this.updateCommandButtons();
        }

        updateCommandButtons() {
            // 清空现有按钮
            this.btnWrap.innerHTML = '';

            const commands = CommandStorage.getAll();

            // 创建导入按钮
            this.addButton('导入指令', () => this.importCommands());

            // 创建导出按钮
            this.addButton('导出指令', () => this.exportCommands());

            // 创建指令管理按钮
            this.addButton('指令管理', () => this.manageCommands());

            // 创建自定义指令按钮
            commands.forEach(command => {
                const btn = this.addButton(command.name, () => this.executeCommand(command));
                // 为自定义指令按钮添加右键删除功能
                btn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (confirm(`确定要删除指令 "${command.name}" 吗？`)) {
                        CommandStorage.remove(command.id);
                        this.updateCommandButtons();
                        console.log(`已删除指令: ${command.name}`);
                    }
                });
                btn.title = `${command.name}\n\n右键删除指令`;
            });
        }

        async executeCommand(command) {
            try {
                console.log(`执行指令: ${command.name}`);
                const result = await executeScript(command.code);
                if (result !== undefined) {
                    console.log('执行结果:', result);
                }
                Toast.show(`指令 "${command.name}" 执行完成`);
            } catch (error) {
                console.error('指令执行失败:', error);
                Toast.show(`指令执行失败: ${error.message}`, 'error');
            }
        }

        importCommands() {
            const input = h('input', {
                type: 'file',
                accept: '.json',
                style: { display: 'none' }
            });

            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = JSON.parse(event.target.result);
                            if (CommandStorage.import(data)) {
                                this.updateCommandButtons();
                                Toast.show(`成功导入 ${data.length} 个指令`);
                            } else {
                                Toast.show('导入失败，请检查文件格式', 'error');
                            }
                        } catch (error) {
                            console.error('导入失败:', error);
                            Toast.show('导入失败，文件格式错误', 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            });

            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        }

        exportCommands() {
            const commands = CommandStorage.export();
            if (commands.length === 0) {
                Toast.show('没有可导出的指令', 'warning');
                return;
            }

            const dataStr = JSON.stringify(commands, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = h('a', {
                href: url,
                download: `custom_commands_${new Date().toISOString().slice(0, 10)}.json`,
                style: { display: 'none' }
            });

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Toast.show(`成功导出 ${commands.length} 个指令`);
        }

        manageCommands() {
            const commands = CommandStorage.getAll();
            if (commands.length === 0) {
                Toast.show('没有可管理的指令', 'warning');
                return;
            }

            // 创建指令管理弹窗
            this.createManageDialog(commands);
        }

        createManageDialog(commands) {
            // 创建指令管理弹窗遮罩
            const sortOverlay = h('div', {
                className: 'tmx-command-manage-dialog',
                style: {
                    position: 'fixed',
                    inset: '0',
                    zIndex: 2147483646,
                    display: 'flex',
                    background: 'rgba(0,0,0,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            });

            // 创建排序弹窗面板
            const sortPanel = h('div', {
                style: {
                    width: '500px',
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    fontFamily: 'Arial, sans-serif',
                    display: 'flex',
                    flexDirection: 'column'
                }
            });

            // 标题栏
            const header = h('div', {
                style: {
                    padding: '15px 20px',
                    borderBottom: '1px solid #eee',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            });

            const title = h('span', {}, '指令管理');
            const closeBtn = h('button', {
                style: {
                    background: 'none',
                    border: 'none',
                    color: 'var(--tmx-fg)',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                onclick: () => {
                    document.body.removeChild(sortOverlay);
                }
            }, '×');

            header.appendChild(title);
            header.appendChild(closeBtn);

            // 说明文字
            const instruction = h('div', {
                style: {
                    padding: '15px 20px 10px',
                    color: '#666',
                    fontSize: '14px',
                    borderBottom: '1px solid #f0f0f0',
                    lineHeight: '1.5',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word'
                }
            }, '拖拽下方指令项目可调整执行顺序，点击红色删除按钮可删除指令，操作后点击"保存排序"生效');

            // 可排序列表容器
            const listContainer = h('div', {
                className: 'tmx-command-list-container',
                style: {
                    flex: '1',
                    overflow: 'auto',
                    padding: '10px'
                }
            });

            // 创建可拖拽的指令列表
            const sortableList = this.createSortableList(commands.slice());
            listContainer.appendChild(sortableList);

            // 按钮区域
            const buttonArea = h('div', {
                style: {
                    padding: '15px 20px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px'
                }
            });

            const cancelBtn = h('button', {
                style: {
                    padding: '8px 16px',
                    background: '#f8f9fa',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                },
                onclick: () => {
                    document.body.removeChild(sortOverlay);
                }
            }, '取消');

            const saveBtn = h('button', {
                style: {
                    padding: '8px 16px',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                },
                onclick: () => {
                    this.saveSortedCommands(sortableList);
                    document.body.removeChild(sortOverlay);
                }
            }, '保存排序');

            buttonArea.appendChild(cancelBtn);
            buttonArea.appendChild(saveBtn);

            // 组装弹窗
            sortPanel.appendChild(header);
            sortPanel.appendChild(instruction);
            sortPanel.appendChild(listContainer);
            sortPanel.appendChild(buttonArea);
            sortOverlay.appendChild(sortPanel);

            // 点击遮罩关闭
            sortOverlay.addEventListener('click', (e) => {
                if (e.target === sortOverlay) {
                    document.body.removeChild(sortOverlay);
                }
            });

            document.body.appendChild(sortOverlay);
        }

        refreshManageDialog() {
            // FIXME: 编辑指令保存后仍会创建重复的指令管理弹窗，需要进一步调试弹窗查找逻辑
            // 查找现有的指令管理弹窗
            const existingOverlay = document.querySelector('.tmx-command-manage-dialog');
            if (!existingOverlay) {
                // 如果没有现有弹窗，创建新的
                this.createManageDialog(CommandStorage.getAll());
                return;
            }

            // 找到列表容器并更新内容
            const listContainer = existingOverlay.querySelector('.tmx-command-list-container');
            if (listContainer) {
                // 清空现有内容
                listContainer.innerHTML = '';
                // 重新创建指令列表
                const newList = this.createSortableList(CommandStorage.getAll());
                listContainer.appendChild(newList);
            }
        }

        createSortableList(commands) {
            const list = h('div', {
                className: 'sortable-list',
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }
            });

            commands.forEach((command, index) => {
                const item = this.createSortableItem(command, index);
                list.appendChild(item);
            });

            // 添加拖拽功能
            this.makeSortable(list);

            return list;
        }

        createSortableItem(command, index) {
            const isRemote = command.isRemote;
            
            const item = h('div', {
                draggable: !isRemote, // 远程指令不可拖拽
                'data-command-id': command.id,
                'data-index': index,
                'data-is-remote': isRemote,
                style: {
                    padding: '12px 15px',
                    background: isRemote ? '#e8f4fd' : '#f8f9fa', // 远程指令使用不同背景色
                    border: isRemote ? '1px solid #bee5eb' : '1px solid #e9ecef',
                    borderRadius: '6px',
                    cursor: isRemote ? 'default' : 'move', // 远程指令不显示移动光标
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    userSelect: 'none',
                    opacity: isRemote ? '0.8' : '1' // 远程指令稍微透明
                }
            });

            // 远程标识或拖拽图标
            const iconElement = h('span', {
                style: {
                    color: isRemote ? '#0066cc' : '#6c757d',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    fontWeight: isRemote ? 'bold' : 'normal'
                }
            }, isRemote ? '🌐' : '⋮⋮');

            // 序号
            const orderNumber = h('span', {
                style: {
                    minWidth: '24px',
                    height: '24px',
                    background: isRemote ? '#0066cc' : 'var(--tmx-bg)',
                    color: isRemote ? '#fff' : 'var(--tmx-fg)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }
            }, (index + 1).toString());

            // 指令名称
            const commandName = h('span', {
                style: {
                    flex: '1',
                    fontWeight: '500',
                    color: isRemote ? '#0066cc' : '#333'
                }
            }, isRemote ? `${command.name} (远程)` : command.name);

            // 指令描述（如果有）
            const commandDesc = h('span', {
                style: {
                    color: '#6c757d',
                    fontSize: '12px',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }
            }, command.description || '无描述');

            // 编辑按钮（远程指令禁用）
            const editBtn = h('button', {
                title: isRemote ? '远程指令不可编辑' : '编辑指令',
                style: {
                    background: isRemote ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    cursor: isRemote ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    marginRight: '5px',
                    opacity: isRemote ? '0.5' : '1'
                },
                onclick: async (e) => {
                    console.log('编辑按钮被点击', command.name, 'isRemote:', isRemote);
                    e.stopPropagation();
                    if (isRemote) {
                        Toast.show('远程指令不可编辑', 'warning');
                        return;
                    }
                    const commandSelector = window.commandSelector || this;
                    console.log('commandSelector:', commandSelector);
                    try {
                        await commandSelector.editCommand(command);
                    } catch (error) {
                        console.error('编辑指令失败:', error);
                        Toast.show('编辑指令失败: ' + error.message, 'error');
                    }
                }
            }, '✎');

            // 删除按钮（远程指令禁用）
            const deleteBtn = h('button', {
                title: isRemote ? '远程指令不可删除' : '删除指令',
                style: {
                    background: isRemote ? '#6c757d' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    cursor: isRemote ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: isRemote ? '0.5' : '1'
                },
                onclick: async (e) => {
                    console.log('删除按钮被点击', command.name, 'isRemote:', isRemote);
                    e.stopPropagation();
                    if (isRemote) {
                        Toast.show('远程指令不可删除', 'warning');
                        return;
                    }
                    const commandSelector = window.commandSelector || this;
                    console.log('commandSelector:', commandSelector);
                    try {
                        await commandSelector.deleteCommand(command, item);
                    } catch (error) {
                        console.error('删除指令失败:', error);
                        Toast.show('删除指令失败: ' + error.message, 'error');
                    }
                }
            }, '×');

            // 编辑按钮悬停效果（仅本地指令）
            if (!isRemote) {
                editBtn.addEventListener('mouseenter', () => {
                    editBtn.style.background = '#0056b3';
                    editBtn.style.transform = 'scale(1.1)';
                });
                editBtn.addEventListener('mouseleave', () => {
                    editBtn.style.background = '#007bff';
                    editBtn.style.transform = 'scale(1)';
                });

                // 删除按钮悬停效果（仅本地指令）
                deleteBtn.addEventListener('mouseenter', () => {
                    deleteBtn.style.background = '#c82333';
                    deleteBtn.style.transform = 'scale(1.1)';
                });
                deleteBtn.addEventListener('mouseleave', () => {
                    deleteBtn.style.background = '#dc3545';
                    deleteBtn.style.transform = 'scale(1)';
                });
            }

            item.appendChild(iconElement);
            item.appendChild(orderNumber);
            item.appendChild(commandName);
            item.appendChild(commandDesc);
            item.appendChild(editBtn);
            item.appendChild(deleteBtn);

            // 添加悬停效果（远程指令使用不同样式）
            item.addEventListener('mouseenter', () => {
                const hoverBg = isRemote ? '#d1ecf1' : '#e9ecef';
                item.style.background = hoverBg;
                if (!isRemote) {
                    item.style.transform = 'translateY(-1px)';
                    item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }
            });

            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('dragging')) {
                    const normalBg = isRemote ? '#e8f4fd' : '#f8f9fa';
                    item.style.background = normalBg;
                    if (!isRemote) {
                        item.style.transform = 'translateY(0)';
                        item.style.boxShadow = 'none';
                    }
                }
            });

            return item;
        }

        async editCommand(command) {
            this.createEditDialog(command);
        }

        createEditDialog(command) {
            // 确保指令对象有必要的字段
            if (!command.id) {
                command.id = Date.now().toString();
                console.warn('指令缺少ID，已自动生成:', command.id);
            }
            if (!command.code) {
                command.code = '';
                console.warn('指令缺少代码字段，已初始化为空字符串');
            }
            if (!command.name) {
                command.name = '未命名指令';
                console.warn('指令缺少名称字段，已设置默认名称');
            }
            
            // 创建编辑弹窗遮罩
            const editOverlay = h('div', {
                className: 'tmx-command-edit-dialog',
                style: {
                    position: 'fixed',
                    inset: '0',
                    zIndex: 2147483647, // 最高层级，确保在指令管理界面之上
                    display: 'flex',
                    background: 'rgba(0,0,0,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            });

            // 创建编辑弹窗面板
            const editPanel = h('div', {
                style: {
                    width: '600px',
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    fontFamily: 'Arial, sans-serif',
                    display: 'flex',
                    flexDirection: 'column'
                }
            });

            // 标题栏
            const header = h('div', {
                style: {
                    padding: '15px 20px',
                    borderBottom: '1px solid #eee',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            });

            const title = h('span', {}, '编辑指令');
            const closeBtn = h('button', {
                style: {
                    background: 'none',
                    border: 'none',
                    color: 'var(--tmx-fg)',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                onclick: () => {
                    document.body.removeChild(editOverlay);
                }
            }, '×');

            header.appendChild(title);
            header.appendChild(closeBtn);

            // 内容区域
            const content = h('div', {
                style: {
                    flex: '1',
                    padding: '20px',
                    overflow: 'auto'
                }
            });

            // 创建表单容器
            const formContainer = h('div', {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }
            });

            // 指令名称字段
            const nameField = h('div', {
                style: {
                    display: 'flex',
                    flexDirection: 'column'
                }
            });

            const nameLabel = h('label', {
                style: {
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '8px'
                }
            }, '指令名称');

            const nameInput = h('input', {
                type: 'text',
                value: command.name || '',
                style: {
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                },
                placeholder: '输入指令名称',
                onfocus: function() {
                    this.style.borderColor = '#007bff';
                },
                onblur: function() {
                    this.style.borderColor = '#e1e5e9';
                }
            });

            nameField.appendChild(nameLabel);
            nameField.appendChild(nameInput);

            // 指令描述字段
            const descField = h('div', {
                style: {
                    display: 'flex',
                    flexDirection: 'column'
                }
            });

            const descLabel = h('label', {
                style: {
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '8px'
                }
            }, '指令描述');

            const descInput = h('input', {
                type: 'text',
                value: command.description || '',
                style: {
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                },
                placeholder: '输入指令描述（可选）',
                onfocus: function() {
                    this.style.borderColor = '#007bff';
                },
                onblur: function() {
                    this.style.borderColor = '#e1e5e9';
                }
            });

            descField.appendChild(descLabel);
            descField.appendChild(descInput);

            // 指令代码字段
            const codeField = h('div', {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1'
                }
            });

            const codeLabel = h('label', {
                style: {
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '8px'
                }
            }, '指令代码');

            const codeTextarea = h('textarea', {
                style: {
                    width: '100%',
                    minHeight: '200px',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                    outline: 'none',
                    lineHeight: '1.5'
                },
                placeholder: '输入指令代码',
                onfocus: function() {
                    this.style.borderColor = '#007bff';
                },
                onblur: function() {
                    this.style.borderColor = '#e1e5e9';
                }
            });
            
            // 设置textarea的值
            codeTextarea.value = command.code || '';
            codeTextarea.textContent = command.code || '';

            codeField.appendChild(codeLabel);
            codeField.appendChild(codeTextarea);

            formContainer.appendChild(nameField);
            formContainer.appendChild(descField);
            formContainer.appendChild(codeField);
            content.appendChild(formContainer);

            // 按钮区域
            const buttonArea = h('div', {
                style: {
                    padding: '15px 20px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px'
                }
            });

            const cancelBtn = h('button', {
                style: {
                    padding: '8px 16px',
                    background: '#f8f9fa',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                },
                onclick: () => {
                    document.body.removeChild(editOverlay);
                }
            }, '取消');

            const saveBtn = h('button', {
                style: {
                    padding: '8px 16px',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                },
                onclick: async () => {
                    await this.saveEditedCommand(command, nameInput.value.trim(), descInput.value.trim(), codeTextarea.value.trim(), editOverlay);
                }
            }, '保存');

            buttonArea.appendChild(cancelBtn);
            buttonArea.appendChild(saveBtn);

            editPanel.appendChild(header);
            editPanel.appendChild(content);
            editPanel.appendChild(buttonArea);
            editOverlay.appendChild(editPanel);

            document.body.appendChild(editOverlay);

            // 聚焦到名称输入框
            setTimeout(() => {
                nameInput.focus();
                nameInput.select();
            }, 100);
        }

        async saveEditedCommand(originalCommand, newName, newDescription, newCode, overlay) {
            // 验证输入
            if (!newName) {
                Toast.show('指令名称不能为空', 'error');
                return;
            }

            if (!newCode) {
                Toast.show('指令代码不能为空', 'error');
                return;
            }

            try {
                // 检查名称是否与其他指令冲突
                const commands = CommandStorage.getAll();
                const nameConflict = commands.find(cmd => cmd.id !== originalCommand.id && cmd.name === newName);
                
                if (nameConflict) {
                    const confirmed = await Dialog.confirm(
                        `指令名称 "${newName}" 已存在，是否覆盖现有指令？`,
                        '名称冲突'
                    );
                    if (!confirmed) {
                        return;
                    }
                    // 删除冲突的指令
                    CommandStorage.remove(nameConflict.id);
                }

                // 更新指令
                let updatedCommands = commands.map(cmd => {
                    if (cmd.id === originalCommand.id) {
                        return {
                            ...cmd,
                            name: newName,
                            description: newDescription || '',
                            code: newCode,
                            updateTime: new Date().toISOString()
                        };
                    }
                    return cmd;
                });

                // 如果有名称冲突，过滤掉冲突的指令
                if (nameConflict) {
                    updatedCommands = updatedCommands.filter(cmd => cmd.id !== nameConflict.id);
                }

                // 保存到存储
                CommandStorage.save(updatedCommands);

                // 关闭编辑弹窗
                document.body.removeChild(overlay);

                // 刷新界面
                this.updateCommandButtons();
                
                // 刷新现有的指令管理弹窗内容，而不是重新创建
                this.refreshManageDialog();

                Toast.show(`指令 "${newName}" 已更新`, 'success');
            } catch (error) {
                console.error('保存指令失败:', error);
                Toast.show('保存指令失败', 'error');
            }
        }

        async deleteCommand(command, itemElement) {
            // 显示确认对话框
            const confirmed = await Dialog.confirm(
                `确定要删除指令"${command.name}"吗？\n\n此操作不可撤销。`,
                '确认删除'
            );
            if (confirmed) {
                try {
                    // 从全局存储中删除指令
                    const commands = CommandStorage.getAll();
                    const updatedCommands = commands.filter(cmd => cmd.id !== command.id);
                    CommandStorage.save(updatedCommands);

                    // 从界面中移除元素
                    itemElement.style.transition = 'all 0.3s ease';
                    itemElement.style.opacity = '0';
                    itemElement.style.transform = 'translateX(-100%)';

                    setTimeout(() => {
                        itemElement.remove();
                        // 更新序号
                        this.updateItemNumbers(itemElement.parentElement);
                        // 刷新指令按钮显示
                        this.updateCommandButtons();
                    }, 300);

                    Toast.show(`指令"${command.name}"已删除`, 'success');
                } catch (error) {
                    console.error('删除指令失败:', error);
                    Toast.show('删除指令失败', 'error');
                }
            }
        }

        makeSortable(list) {
            let draggedElement = null;
            let placeholder = null;

            list.addEventListener('dragstart', (e) => {
                // 检查是否为远程指令，如果是则阻止拖拽
                if (e.target.getAttribute('data-is-remote') === 'true') {
                    e.preventDefault();
                    Toast.show('远程指令不可排序', 'warning');
                    return;
                }

                draggedElement = e.target;
                draggedElement.classList.add('dragging');
                draggedElement.style.opacity = '0.5';

                // 创建占位符
                placeholder = h('div', {
                    style: {
                        height: draggedElement.offsetHeight + 'px',
                        background: 'linear-gradient(90deg, #007bff, #0056b3)',
                        borderRadius: '6px',
                        margin: '4px 0',
                        opacity: '0.3',
                        border: '2px dashed #007bff'
                    }
                });
            });

            list.addEventListener('dragend', (e) => {
                if (draggedElement) {
                    draggedElement.classList.remove('dragging');
                    draggedElement.style.opacity = '1';
                    draggedElement.style.background = '#f8f9fa';
                    draggedElement.style.transform = 'translateY(0)';
                    draggedElement.style.boxShadow = 'none';
                }

                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }

                draggedElement = null;
                placeholder = null;

                // 更新序号
                this.updateItemNumbers(list);
            });

            list.addEventListener('dragover', (e) => {
                e.preventDefault();

                if (!draggedElement || !placeholder) return;

                const afterElement = this.getDragAfterElement(list, e.clientY);

                if (afterElement == null) {
                    list.appendChild(placeholder);
                } else {
                    list.insertBefore(placeholder, afterElement);
                }
            });

            list.addEventListener('drop', (e) => {
                e.preventDefault();

                if (!draggedElement || !placeholder) return;

                // 将拖拽元素插入到占位符位置
                list.insertBefore(draggedElement, placeholder);
            });
        }

        getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];

            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;

                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        updateItemNumbers(list) {
            if (!list) return;
            const items = list.querySelectorAll('[data-command-id]');
            items.forEach((item, index) => {
                const numberSpan = item.children[1]; // 序号元素是第二个子元素
                if (numberSpan) {
                    numberSpan.textContent = (index + 1).toString();
                }
                item.setAttribute('data-index', index);
            });
        }

        saveSortedCommands(sortableList) {
            // 只获取本地指令的ID（排除远程指令）
            const items = sortableList.querySelectorAll('[data-command-id]:not([data-is-remote="true"])');
            const sortedIds = Array.from(items).map(item => item.getAttribute('data-command-id'));

            // 获取本地指令
            const localCommands = CommandStorage.getLocalOnly();

            // 创建ID到指令的映射
            const commandMap = new Map();
            localCommands.forEach(command => {
                commandMap.set(command.id, command);
            });

            // 按新顺序重新排列本地指令
            const sortedLocalCommands = sortedIds.map(id => commandMap.get(id)).filter(Boolean);

            // 保存到localStorage（只保存本地指令）
            try {
                CommandStorage.save(sortedLocalCommands);
                Toast.show('指令排序已保存', 'success');

                // 刷新指令按钮显示
                this.updateCommandButtons();
            } catch (error) {
                console.error('保存指令管理失败:', error);
                Toast.show('保存失败，请重试', 'error');
            }
        }

        show() {
            this.updateCommandButtons();
            super.show();
        }
    }

    class ScheduleManager {
        constructor() {
            this.title = '定时任务管理';
            this.tasks = ScheduledTaskStorage.getAll();
            this.commands = CommandStorage.getAll();
            this.editingTask = null;
            this.visible = false;
            this.createDialog();
            this.setupContent();
        }

        createDialog() {
            // 创建遮罩层
            this.overlay = h('div', {
                style: {
                    position: 'fixed',
                    inset: '0',
                    zIndex: 2147483645,
                    display: 'none',
                    background: 'rgba(0,0,0,0.5)'
                }
            });

            // 点击遮罩层关闭
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.hide();
            });

            // 创建对话框面板
            this.panel = h('div', {
                style: {
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 'min(550px, 92vw)',
                    height: 'min(500px, 85vh)',
                    maxWidth: '92vw',
                    maxHeight: '85vh',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    boxShadow: '0 2px 15px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'Arial, sans-serif',
                    overflow: 'hidden'
                }
            });

            // 创建标题栏
            const titleBar = h('div', {
                style: {
                    padding: '10px 15px',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    borderBottom: '1px solid #ddd',
                    borderRadius: '6px 6px 0 0',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            }, this.title);

            // 创建关闭按钮
            const closeBtn = h('button', {
                style: {
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            }, '×');
            closeBtn.addEventListener('click', () => this.hide());
            titleBar.appendChild(closeBtn);

            // 创建内容区域
            this.contentEl = h('div', {
                style: {
                    flex: '1',
                    padding: '12px',
                    overflow: 'hidden',
                    background: 'var(--tmx-bg)',
                    color: 'var(--tmx-fg)'
                }
            });

            this.panel.append(titleBar, this.contentEl);
            this.overlay.appendChild(this.panel);
            document.body.appendChild(this.overlay);
        }

        setupContent() {
            this.contentEl.innerHTML = `
            <div style="display: flex; height: 100%; gap: 12px; flex-direction: row;">
                <div style="flex: 0 0 40%; border-right: 1px solid #ddd; padding-right: 10px; min-width: 180px;">
                    <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 10px;">
                        <div style="display: flex; gap: 6px;">
                            <button id="import-tasks-btn" style="padding: 4px 8px; background: var(--tmx-bg); color: var(--tmx-fg); border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 11px;">导入</button>
                            <button id="export-tasks-btn" style="padding: 4px 8px; background: var(--tmx-bg); color: var(--tmx-fg); border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 11px;">导出</button>
                            <button id="add-task-btn" style="padding: 5px 10px; background: var(--tmx-bg); color: var(--tmx-fg); border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 12px;">新增任务</button>
                        </div>
                    </div>
                    <div id="task-list" style="height: calc(100% - 45px); overflow-y: auto; border: 1px solid #ddd; padding: 8px; background: var(--tmx-bg);"></div>
                </div>
                <div style="flex: 1; padding-left: 10px; display: flex; flex-direction: column;">
                    <h3 style="margin: 0 0 10px 0; color: var(--tmx-fg); font-size: 14px; flex-shrink: 0;">任务配置</h3>
                    <div id="task-form" style="height: calc(100% - 35px); overflow-y: auto; padding: 8px; border: 1px solid #ddd; border-radius: 3px; background: var(--tmx-bg); flex: 1;">
                        <div style="text-align: center; color: var(--tmx-fg); margin-top: 30px; opacity: 0.7; font-size: 13px;">请选择或新增一个任务进行配置</div>
                    </div>
                </div>
            </div>
            
            <style>
                @media (max-width: 768px) {
                    .schedule-content {
                        flex-direction: column !important;
                    }
                    .schedule-content > div:first-child {
                        flex: none !important;
                        border-right: none !important;
                        border-bottom: 1px solid #ddd !important;
                        padding-right: 0 !important;
                        padding-bottom: 10px !important;
                        margin-bottom: 10px !important;
                    }
                    .schedule-content > div:last-child {
                        padding-left: 0 !important;
                        flex: 1 !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .schedule-content #task-form {
                        height: auto !important;
                        min-height: 300px !important;
                        max-height: 60vh !important;
                        flex: 1 !important;
                        overflow-y: auto !important;
                    }
                }
            </style>
        `;

            // 添加响应式类名
            this.contentEl.querySelector('div').classList.add('schedule-content');

            this.setupEventListeners();
            this.updateTaskList();
        }

        setupEventListeners() {
            const addBtn = this.contentEl.querySelector('#add-task-btn');
            addBtn.addEventListener('click', () => this.addNewTask());

            const importBtn = this.contentEl.querySelector('#import-tasks-btn');
            importBtn.addEventListener('click', () => this.importTasks());

            const exportBtn = this.contentEl.querySelector('#export-tasks-btn');
            exportBtn.addEventListener('click', () => this.exportTasks());
        }

        updateTaskList() {
            const listEl = this.contentEl.querySelector('#task-list');
            this.tasks = ScheduledTaskStorage.getAll();

            if (this.tasks.length === 0) {
                listEl.innerHTML = '<div style="text-align: center; color: var(--tmx-fg); margin-top: 15px; opacity: 0.7; font-size: 12px;">暂无定时任务</div>';
                return;
            }

            listEl.innerHTML = this.tasks.map(task => {
                const command = this.commands.find(cmd => cmd.id === task.commandId);
                const commandName = command ? command.name : '未知指令';
                const nextRun = task.nextRun ? new Date(task.nextRun).toLocaleString() : '未设置';

                const isSelected = this.editingTask && this.editingTask.id === task.id;

                return `
                <div class="task-item" data-id="${task.id}" style="
                    border: 1px solid #ddd; 
                    margin-bottom: 6px; 
                    padding: 8px; 
                    border-radius: 3px; 
                    cursor: pointer;
                    background: ${isSelected ? 'rgba(0,123,255,0.1)' : 'var(--tmx-bg)'};
                    color: var(--tmx-fg);
                    transition: all 0.2s ease;
                    position: relative;
                ">
                    <div style="font-weight: bold; margin-bottom: 4px; font-size: 12px; line-height: 1.3; padding-right: 60px;">${task.name}</div>
                    <div style="font-size: 10px; color: var(--tmx-fg); opacity: 0.8; margin-bottom: 2px; line-height: 1.2;">指令: ${commandName}</div>
                    <div style="font-size: 10px; color: var(--tmx-fg); opacity: 0.8; margin-bottom: 2px; line-height: 1.2;">时间: ${task.schedule}</div>
                    <div style="font-size: 10px; color: var(--tmx-fg); opacity: 0.8; margin-bottom: 2px; line-height: 1.2;">下次执行: ${nextRun}</div>
                    <div style="font-size: 10px; color: ${task.enabled ? '#28a745' : '#dc3545'}; font-weight: bold; line-height: 1.2;">状态: ${task.enabled ? '启用' : '禁用'}</div>
                    <button class="toggle-status-btn" data-task-id="${task.id}" style="
                        position: absolute;
                        top: 6px;
                        right: 6px;
                        padding: 2px 6px;
                        font-size: 9px;
                        border: 1px solid ${task.enabled ? '#dc3545' : '#28a745'};
                        background: ${task.enabled ? '#dc3545' : '#28a745'};
                        color: white;
                        border-radius: 2px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: bold;
                    ">${task.enabled ? '禁用' : '启用'}</button>
                </div>
            `;
            }).join('');

            // 添加点击事件
            listEl.querySelectorAll('.task-item').forEach(item => {
                item.addEventListener('click', () => {
                    const taskId = item.dataset.id;
                    const task = this.tasks.find(t => t.id === taskId);
                    this.editTask(task);
                });

                // 添加悬停效果
                item.addEventListener('mouseenter', () => {
                    if (!item.dataset.id || (this.editingTask && this.editingTask.id !== item.dataset.id)) {
                        item.style.background = 'rgba(0,123,255,0.05)';
                    }
                });
                item.addEventListener('mouseleave', () => {
                    if (!item.dataset.id || (this.editingTask && this.editingTask.id !== item.dataset.id)) {
                        item.style.background = 'var(--tmx-bg)';
                    }
                });
            });

            // 添加状态切换按钮事件
            listEl.querySelectorAll('.toggle-status-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const taskId = btn.dataset.taskId;
                    this.toggleTaskStatus(taskId);
                });
            });
        }

        addNewTask() {
            const newTask = {
                id: Date.now().toString(),
                name: '新任务',
                commandId: '',
                schedule: 'every-minute',
                enabled: true,
                createTime: Date.now(),
                nextRun: null
            };
            this.editTask(newTask, true);
        }

        editTask(task, isNew = false) {
            this.editingTask = task;
            this.isNewTask = isNew;
            this.updateTaskList();

            const formEl = this.contentEl.querySelector('#task-form');
            formEl.innerHTML = `
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: var(--tmx-fg); font-size: 12px;">任务名称:</label>
                <input type="text" id="task-name" value="${task.name}" style="width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px; background: var(--tmx-bg); color: var(--tmx-fg); font-size: 12px; box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: var(--tmx-fg); font-size: 12px;">执行指令:</label>
                <select id="task-command" style="width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px; background: var(--tmx-bg); color: var(--tmx-fg); font-size: 12px; box-sizing: border-box;">
                    <option value="">请选择指令</option>
                    ${this.commands.map(cmd =>
            `<option value="${cmd.id}" ${cmd.id === task.commandId ? 'selected' : ''}>${cmd.name}</option>`
        ).join('')}
                </select>
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: var(--tmx-fg); font-size: 12px;">执行时间:</label>
                <select id="task-schedule" style="width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px; background: var(--tmx-bg); color: var(--tmx-fg); font-size: 12px; box-sizing: border-box;">
                    <option value="every-minute" ${task.schedule === 'every-minute' ? 'selected' : ''}>每分钟</option>
                    <option value="every-hour" ${task.schedule === 'every-hour' ? 'selected' : ''}>每小时</option>
                    <option value="daily" ${task.schedule === 'daily' ? 'selected' : ''}>每天</option>
                    <option value="weekly" ${task.schedule === 'weekly' ? 'selected' : ''}>每周</option>
                    <option value="monthly" ${task.schedule === 'monthly' ? 'selected' : ''}>每月</option>
                    <option value="custom" ${task.schedule.startsWith('custom:') ? 'selected' : ''}>自定义</option>
                </select>
            </div>
            
            <div id="custom-schedule" style="margin-bottom: 12px; ${task.schedule.startsWith('custom:') ? '' : 'display: none;'}">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: var(--tmx-fg); font-size: 12px;">自定义时间配置:</label>
                <input type="text" id="custom-schedule-input" value="${task.schedule.startsWith('custom:') ? task.schedule.substring(7) : ''}" 
                       placeholder="例如: 0 8 * * * (每天8点), 0 8 * * 3 (每周三8点)" 
                       style="width: 100%; padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px; background: var(--tmx-bg); color: var(--tmx-fg); font-size: 12px; box-sizing: border-box;">
                <div style="font-size: 10px; color: var(--tmx-fg); opacity: 0.7; margin-top: 4px; line-height: 1.3;">
                    格式: 分 时 日 月 周<br>
                    例如: 0 8 * * * (每天8点), 0 8 * * 3 (每周三8点), 0 8 1,L * * (每月1号和最后一天8点)
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center;">
                    <input type="checkbox" id="task-enabled" ${task.enabled ? 'checked' : ''} style="margin-right: 8px; transform: scale(1.1);">
                    <span style="font-weight: bold; color: var(--tmx-fg); font-size: 12px;">启用任务</span>
                </label>
            </div>
            
            <div style="display: flex; gap: 8px; margin-top: 15px;">
                <button id="save-task-btn" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: bold;">保存</button>
                ${!isNew ? '<button id="delete-task-btn" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: bold;">删除</button>' : ''}
                <button id="cancel-task-btn" style="flex: 1; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: bold;">取消</button>
            </div>
        `;

            this.setupFormEventListeners();
        }

        setupFormEventListeners() {
            const formEl = this.contentEl.querySelector('#task-form');

            // 移除之前的事件监听器（通过克隆节点）
            const newFormEl = formEl.cloneNode(true);
            formEl.parentNode.replaceChild(newFormEl, formEl);

            // 重新获取表单元素
            const scheduleSelect = newFormEl.querySelector('#task-schedule');
            const customDiv = newFormEl.querySelector('#custom-schedule');
            const saveBtn = newFormEl.querySelector('#save-task-btn');
            const deleteBtn = newFormEl.querySelector('#delete-task-btn');
            const cancelBtn = newFormEl.querySelector('#cancel-task-btn');

            // 自定义时间配置显示/隐藏
            scheduleSelect.addEventListener('change', () => {
                customDiv.style.display = scheduleSelect.value === 'custom' ? 'block' : 'none';
            });

            // 保存按钮（添加防重复提交机制）
            saveBtn.addEventListener('click', () => {
                if (saveBtn.disabled) return;
                this.saveTask();
            });

            // 删除按钮
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteTask());
            }

            // 取消按钮
            cancelBtn.addEventListener('click', () => this.cancelEdit());
        }

        saveTask() {
            const formEl = this.contentEl.querySelector('#task-form');
            const saveBtn = formEl.querySelector('#save-task-btn');

            // 防重复提交
            if (saveBtn.disabled) {
                return;
            }

            // 禁用保存按钮
            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';
            saveBtn.style.opacity = '0.6';

            try {
                const name = formEl.querySelector('#task-name').value.trim();
                const commandId = formEl.querySelector('#task-command').value;
                const schedule = formEl.querySelector('#task-schedule').value;
                const customSchedule = formEl.querySelector('#custom-schedule-input').value.trim();
                const enabled = formEl.querySelector('#task-enabled').checked;

                if (!name) {
                    Toast.show('请输入任务名称', 'error');
                    saveBtn.disabled = false;
                    saveBtn.textContent = '保存';
                    saveBtn.style.opacity = '1';
                    return;
                }

                if (!commandId) {
                    Toast.show('请选择执行指令', 'error');
                    saveBtn.disabled = false;
                    saveBtn.textContent = '保存';
                    saveBtn.style.opacity = '1';
                    return;
                }

                let finalSchedule = schedule;
                if (schedule === 'custom') {
                    if (!customSchedule) {
                        Toast.show('请输入自定义时间配置', 'error');
                        saveBtn.disabled = false;
                        saveBtn.textContent = '保存';
                        saveBtn.style.opacity = '1';
                        return;
                    }
                    finalSchedule = 'custom:' + customSchedule;
                }

                this.editingTask.name = name;
                this.editingTask.commandId = commandId;
                this.editingTask.schedule = finalSchedule;
                this.editingTask.enabled = enabled;

                if (this.isNewTask) {
                    ScheduledTaskStorage.add(this.editingTask);
                    Toast.show('任务创建成功', 'success');
                } else {
                    ScheduledTaskStorage.update(this.editingTask.id, {
                        name: this.editingTask.name,
                        commandId: this.editingTask.commandId,
                        schedule: this.editingTask.schedule,
                        enabled: this.editingTask.enabled
                    });
                    Toast.show('任务更新成功', 'success');
                }

                // 重新启动调度器以应用更改
                if (window.scheduler) {
                    window.scheduler.loadTasks();
                }

                // 先更新任务列表再取消编辑
                this.updateTaskList();
                this.cancelEdit();

                // 标记保存成功，避免在finally中重复恢复按钮状态
                return true;
            } catch (error) {
                // 保存失败时恢复按钮状态
                saveBtn.disabled = false;
                saveBtn.textContent = '保存';
                saveBtn.style.opacity = '1';
                console.error('保存任务失败:', error);
            }
        }

        deleteTask() {
            if (confirm('确定要删除这个定时任务吗？')) {
                const taskId = this.editingTask.id;
                ScheduledTaskStorage.remove(taskId);
                Toast.show('任务删除成功', 'success');

                // 重新启动调度器以应用更改
                if (window.scheduler) {
                    window.scheduler.loadTasks();
                }

                // 清除编辑状态
                this.editingTask = null;
                this.isNewTask = false;

                // 立即更新任务列表
                this.updateTaskList();

                // 重置表单区域
                const formEl = this.contentEl.querySelector('#task-form');
                formEl.innerHTML = '<div style="text-align: center; color: var(--tmx-fg); opacity: 0.7; margin-top: 50px;">请选择或新增一个任务进行配置</div>';
            }
        }

        toggleTaskStatus(taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            const newEnabled = !task.enabled;

            // 更新存储
            ScheduledTaskStorage.update(taskId, { enabled: newEnabled });

            // 更新本地任务数据
            task.enabled = newEnabled;

            // 更新调度器
            if (window.scheduler) {
                if (newEnabled) {
                    window.scheduler.addScheduledTask(task);
                } else {
                    window.scheduler.removeScheduledTask(taskId);
                }
            }

            // 重新获取任务数据并更新界面
            this.tasks = ScheduledTaskStorage.getAll();
            this.updateTaskList();

            // 如果当前正在编辑这个任务，也要更新编辑表单
            if (this.editingTask && this.editingTask.id === taskId) {
                this.editingTask.enabled = newEnabled;
                const enabledCheckbox = this.contentEl.querySelector('#task-enabled');
                if (enabledCheckbox) {
                    enabledCheckbox.checked = newEnabled;
                }
            }

            Toast.show(`任务已${newEnabled ? '启用' : '禁用'}`, 'success');
        }

        cancelEdit() {
            this.editingTask = null;
            this.isNewTask = false;
            this.updateTaskList();

            const formEl = this.contentEl.querySelector('#task-form');
            formEl.innerHTML = '<div style="text-align: center; color: var(--tmx-fg); opacity: 0.7; margin-top: 30px; font-size: 12px;">请选择或新增一个任务进行配置</div>';
        }

        show() {
            this.commands = CommandStorage.getAll();
            this.updateTaskList();
            this.overlay.style.display = 'block';
            this.visible = true;
        }

        hide() {
            this.overlay.style.display = 'none';
            this.visible = false;
        }

        toggle() {
            if (this.visible) {
                this.hide();
            } else {
                this.show();
            }
        }

        exportTasks() {
            try {
                const tasks = ScheduledTaskStorage.getAll();
                if (tasks.length === 0) {
                    Toast.show('暂无任务可导出', 'warning');
                    return;
                }

                // 创建导出数据，包含任务和相关指令信息
                const exportData = {
                    version: '1.0',
                    exportTime: new Date().toISOString(),
                    tasks: tasks,
                    commands: this.commands.filter(cmd =>
                        tasks.some(task => task.commandId === cmd.id)
                    )
                };

                const jsonStr = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `scheduled_tasks_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                Toast.show(`成功导出 ${tasks.length} 个任务`, 'success');
            } catch (error) {
                console.error('导出任务失败:', error);
                Toast.show('导出失败: ' + error.message, 'error');
            }
        }

        importTasks() {
            try {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.style.display = 'none';

                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const importData = JSON.parse(event.target.result);
                            this.processImportData(importData);
                        } catch (error) {
                            console.error('解析JSON文件失败:', error);
                            Toast.show('文件格式错误: ' + error.message, 'error');
                        }
                    };
                    reader.readAsText(file);
                };

                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
            } catch (error) {
                console.error('导入任务失败:', error);
                Toast.show('导入失败: ' + error.message, 'error');
            }
        }

        processImportData(importData) {
            try {
                // 验证导入数据格式
                if (!importData.tasks || !Array.isArray(importData.tasks)) {
                    throw new Error('无效的任务数据格式');
                }

                const existingTasks = ScheduledTaskStorage.getAll();
                const existingCommands = CommandStorage.getAll();
                let importedTaskCount = 0;
                let importedCommandCount = 0;
                let skippedCount = 0;

                // 导入指令（如果有）
                if (importData.commands && Array.isArray(importData.commands)) {
                    for (const command of importData.commands) {
                        const existingCommand = existingCommands.find(cmd => cmd.id === command.id);
                        if (!existingCommand) {
                            // 生成新的ID避免冲突
                            const newCommand = {
                                ...command,
                                id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
                            };
                            CommandStorage.add(newCommand.name, newCommand.code, newCommand.description || '');
                            importedCommandCount++;

                            // 更新任务中的指令ID引用
                            importData.tasks.forEach(task => {
                                if (task.commandId === command.id) {
                                    task.commandId = newCommand.id;
                                }
                            });
                        }
                    }
                }

                // 导入任务
                for (const task of importData.tasks) {
                    // 检查是否已存在相同名称的任务
                    const existingTask = existingTasks.find(t => t.name === task.name);
                    if (existingTask) {
                        skippedCount++;
                        continue;
                    }

                    // 生成新的任务ID
                    const newTask = {
                        ...task,
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        createTime: Date.now(),
                        lastRun: null,
                        nextRun: ScheduledTaskStorage.calculateNextRun(task.schedule)
                    };

                    ScheduledTaskStorage.add(newTask);
                    importedTaskCount++;
                }

                // 刷新界面
                this.tasks = ScheduledTaskStorage.getAll();
                this.commands = CommandStorage.getAll();
                this.updateTaskList();

                // 重新启动调度器
                if (window.scheduler) {
                    window.scheduler.loadTasks();
                }

                // 显示导入结果
                let message = `导入完成: ${importedTaskCount} 个任务`;
                if (importedCommandCount > 0) {
                    message += `, ${importedCommandCount} 个指令`;
                }
                if (skippedCount > 0) {
                    message += ` (跳过 ${skippedCount} 个重复任务)`;
                }
                Toast.show(message, 'success');

            } catch (error) {
                console.error('处理导入数据失败:', error);
                Toast.show('导入失败: ' + error.message, 'error');
            }
        }
    }

    // 便捷点击函数 - 通过按钮名称点击
    function clickbtn(buttonText) {
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]'));
        const targetButton = buttons.find(btn => {
            const text = btn.textContent || btn.value || btn.getAttribute('aria-label') || '';
            return text.trim().includes(buttonText);
        });

        if (targetButton) {
            targetButton.click();
            console.log(`点击按钮: ${buttonText}`);
            return targetButton;
        } else {
            console.warn(`未找到包含文本 "${buttonText}" 的按钮`);
            return null;
        }
    }

    // 便捷点击函数 - 通过链接名称点击
    function clickhref(linkText) {
        const links = Array.from(document.querySelectorAll('a'));
        const targetLink = links.find(link => {
            const text = link.textContent || link.getAttribute('title') || link.getAttribute('aria-label') || '';
            return text.trim().includes(linkText);
        });

        if (targetLink) {
            targetLink.click();
            console.log(`点击链接: ${linkText}`);
            return targetLink;
        } else {
            console.warn(`未找到包含文本 "${linkText}" 的链接`);
            return null;
        }
    }

    // 便捷点击函数 - 通过CSS选择器点击
    function clickgo(selector) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                element.click();
                console.log(`点击元素: ${selector}`);
                return element;
            } else {
                console.warn(`未找到选择器 "${selector}" 对应的元素`);
                return null;
            }
        } catch (error) {
            console.error(`选择器 "${selector}" 无效: ${error.message}`);
            return null;
        }
    }

    function copyWithGreasemonkey(text) {
        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(text);
            console.log('内容已通过油猴脚本复制到剪贴板');
            return true;
        }
        return false;
    }

    const CoordinatePicker = (() => {
        let active = false;
        let overlay = null;

        function start() {
            if (active) return;
            active = true;
            
            // 创建透明覆盖层
            overlay = h('div', {
                'data-tmx-ui': 'true',
                style: {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100vw',
                    height: '100vh',
                    zIndex: '2147483647',
                    cursor: 'crosshair',
                    background: 'rgba(0, 0, 0, 0.1)'
                }
            });
            
            // 阻止右键菜单，用作取消
            overlay.addEventListener('contextmenu', cancel);
            
            // 监听点击
            overlay.addEventListener('mousedown', handleClick);
            
            document.body.appendChild(overlay);
            Toast.show('提示', '请点击屏幕任意位置获取坐标\n右键取消');
        }

        function stop() {
            if (!active) return;
            active = false;
            if (overlay) {
                overlay.remove();
                overlay = null;
            }
        }
        
        function cancel(e) {
            e.preventDefault();
            stop();
            Toast.show('提示', '已取消坐标拾取');
        }

        function handleClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const x = e.clientX;
            const y = e.clientY;
            
            const code = `await click(${x}, ${y});`;
            
            // 尝试复制到剪切板
            const copied = copyWithGreasemonkey(code);
            if (!copied) {
                // 如果GM_setClipboard不可用，尝试使用navigator.clipboard
                navigator.clipboard.writeText(code).catch(err => {
                    console.warn('复制失败:', err);
                });
            }
            
            Toast.show('拾取成功', `坐标: ${x}, ${y}\n已复制代码: ${code}`);
            console.log(`[CoordinatePicker] Picked: ${x}, ${y}`);
            
            stop();
        }

        return { start, stop };
    })();

    /**
     * CSS 选择器生成工具
     * 提供简易模式和全路径模式
     */

    /**
     * 检查选择器在文档中是否唯一
     * @param {string} selector 
     * @returns {boolean}
     */
    function isUnique(selector) {
        try {
            return document.querySelectorAll(selector).length === 1;
        } catch (e) {
            return false;
        }
    }

    /**
     * 转义 CSS 特殊字符
     * @param {string} str 
     * @returns {string}
     */
    function escape(str) {
        if (typeof CSS !== 'undefined' && CSS.escape) {
            return CSS.escape(str);
        }
        return str.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
    }

    /**
     * 生成全路径选择器 (原有逻辑优化)
     * 倾向于使用层级结构: div > div:nth-of-type(2) > span
     * @param {HTMLElement} el 
     * @returns {string}
     */
    function generateFullPathSelector(el) {
        if (el.id) return `#${escape(el.id)}`;
        
        const path = [];
        let current = el;
        
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let selector = current.nodeName.toLowerCase();
            
            if (current.id) {
                selector = '#' + escape(current.id);
                path.unshift(selector);
                break;
            } else {
                let sib = current, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() == selector)
                       nth++;
                }
                if (nth != 1)
                    selector += ":nth-of-type("+nth+")";
            }
            path.unshift(selector);
            current = current.parentNode;
        }
        return path.join(" > ");
    }

    /**
     * 生成简易选择器
     * 优先使用 ID > 唯一Class > 唯一Tag > Tag+Class > 组合Class > 属性 > 短路径
     * @param {HTMLElement} el 
     * @returns {string}
     */
    function generateSimpleSelector(el) {
        const tagName = el.tagName.toLowerCase();

        // 1. ID
        if (el.id) {
            const selector = `#${escape(el.id)}`;
            if (isUnique(selector)) return selector;
        }

        // 2. Class handling (improved for SVG support and combinations)
        const classAttr = el.getAttribute('class');
        if (classAttr) {
            const classes = classAttr.split(/\s+/).filter(c => c.trim());
            
            // 2.1 Single Class
            for (const cls of classes) {
                const selector = `.${escape(cls)}`;
                if (isUnique(selector)) return selector;
                
                // Tag + Single Class
                const tagSelector = `${tagName}${selector}`;
                if (isUnique(tagSelector)) return tagSelector;
            }

            // 2.2 Two Classes Combination
            if (classes.length >= 2) {
                 for (let i = 0; i < classes.length; i++) {
                    for (let j = i + 1; j < classes.length; j++) {
                        const selector = `.${escape(classes[i])}.${escape(classes[j])}`;
                        if (isUnique(selector)) return selector;
                        
                        const tagSelector = `${tagName}${selector}`;
                        if (isUnique(tagSelector)) return tagSelector;
                    }
                 }
            }
            
            // 2.3 All Classes (if more than 2)
            if (classes.length > 2) {
                const comboSelector = `.${classes.map(escape).join('.')}`;
                if (isUnique(comboSelector)) return comboSelector;
                const tagComboSelector = `${tagName}${comboSelector}`;
                if (isUnique(tagComboSelector)) return tagComboSelector;
            }
        }

        // 3. 唯一 Tag
        if (isUnique(tagName)) return tagName;

        // 4. 常见属性 (name, type, alt, title, aria-label)
        const attrs = ['name', 'type', 'alt', 'title', 'aria-label', 'placeholder', 'data-id', 'data-test-id'];
        for (const attr of attrs) {
            const val = el.getAttribute(attr);
            if (val) {
                const selector = `${tagName}[${attr}="${escape(val)}"]`;
                if (isUnique(selector)) return selector;
            }
        }
        
        // 5. 如果是链接，尝试 href
        if (tagName === 'a' && el.href) {
            const href = el.getAttribute('href');
            if (href) {
                 const selector = `a[href="${escape(href)}"]`;
                 if (isUnique(selector)) return selector;
            }
        }

        // 6. 降级到全路径
        return generateFullPathSelector(el);
    }

    const ElementPicker = (() => {
        let active = false;
        let overlay = null;
        let highlightedElement = null;

        function start() {
            if (active) return;
            active = true;
            
            // 创建透明覆盖层，用于捕获鼠标事件
            overlay = h('div', {
                'data-tmx-ui': 'true',
                style: {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100vw',
                    height: '100vh',
                    zIndex: '2147483647',
                    cursor: 'crosshair',
                    background: 'rgba(0, 0, 0, 0.05)' // 极淡的背景，表明正在操作
                }
            });
            
            // 阻止右键菜单，用作取消
            overlay.addEventListener('contextmenu', cancel);
            
            // 监听点击
            overlay.addEventListener('click', handleClick);
            
            // 监听鼠标移动，高亮显示元素
            overlay.addEventListener('mousemove', handleMouseMove);
            
            document.body.appendChild(overlay);
            Toast.show('提示', '请点击选择输入框或其他元素\n移动鼠标预览，右键取消');
        }

        function stop() {
            if (!active) return;
            active = false;
            
            if (highlightedElement) {
                highlightedElement.style.outline = '';
                highlightedElement = null;
            }

            if (overlay) {
                overlay.remove();
                overlay = null;
            }
        }
        
        function cancel(e) {
            e.preventDefault();
            stop();
            Toast.show('提示', '已取消元素拾取');
        }

        function handleMouseMove(e) {
            if (!active) return;
            
            // 暂时隐藏 overlay 以便获取下方的元素
            overlay.style.pointerEvents = 'none';
            const el = document.elementFromPoint(e.clientX, e.clientY);
            overlay.style.pointerEvents = 'auto';

            if (el && el !== highlightedElement) {
                // 清除旧的高亮
                if (highlightedElement) {
                    highlightedElement.style.outline = '';
                }
                
                // 忽略脚本自身的UI
                if (el.closest('[data-tmx-ui="true"]')) {
                    highlightedElement = null;
                    return;
                }

                highlightedElement = el;
                highlightedElement.style.outline = '2px solid red';
            }
        }

        function handleClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!highlightedElement) {
                // 尝试再次获取
                 handleMouseMove(e);
            }

            if (highlightedElement) {
                const selector = generateSelector(highlightedElement);
                let code;
                
                // 智能生成代码
                if (highlightedElement.tagName === 'INPUT' || highlightedElement.tagName === 'TEXTAREA') {
                    code = `await inputText('内容', '${selector}');`;
                } else {
                    code = `await clickgo('${selector}');`;
                }
                
                const success = copyWithGreasemonkey(code);
                
                if (success) {
                    Toast.show('拾取成功', `已拾取元素: ${selector}\n代码已复制: ${code}`);
                } else {
                    Toast.show('拾取成功', `拾取成功: ${selector}\n复制失败，请手动复制控制台输出`);
                }
                
                console.log(`[ElementPicker] Picked:`, highlightedElement);
                console.log(`[ElementPicker] Selector: ${selector}`);
                console.log(`[ElementPicker] Code: ${code}`);
            } else {
                 Toast.show('提示', '未选中任何元素');
            }
            
            stop();
        }

        // 生成唯一的 CSS 选择器
        function generateSelector(el) {
            // 0: simple (default), 1: full
            const mode = store.get('element_picker_mode', 0);
            if (mode === 0) {
                return generateSimpleSelector(el);
            } else {
                return generateFullPathSelector(el);
            }
        }

        return { start, stop };
    })();

    /**
     * 切换页面灰度模式 (默哀模式)
     * @param {boolean} enable - 是否开启
     */
    function setGrayMode(enable) {
        const html = document.documentElement;
        if (enable) {
            html.style.filter = 'grayscale(100%)';
            html.style.webkitFilter = 'grayscale(100%)';
        } else {
            html.style.filter = '';
            html.style.webkitFilter = '';
        }
    }

    /**
     * 初始化灰度模式
     * 在脚本启动时调用，检查存储状态并应用
     */
    function initGrayMode() {
        const enabled = store.get('gray_mode_enabled', 0) === 1;
        setGrayMode(enabled);
    }

    let styleEl = null;

    // 针对特定事件的处理器，确保允许默认行为
    const allowHandler = (e) => {
        e.stopImmediatePropagation(); // 阻止其他监听器执行
        return true;
    };

    function setUnlockCopy(enable) {
        // 定义需要拦截的事件列表
        const events = ['copy', 'cut', 'paste', 'selectstart', 'contextmenu', 'dragstart', 'mousedown', 'mouseup', 'keydown', 'keyup'];

        if (enable) {
            // 1. 注入 CSS
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.innerHTML = `
                * {
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    user-select: text !important;
                }
            `;
                document.head.appendChild(styleEl);
            }

            // 2. 拦截事件
            // 使用捕获阶段，阻止事件向下一级传播，防止网页JS拦截
            events.forEach(evt => {
                window.addEventListener(evt, allowHandler, true);
                document.addEventListener(evt, allowHandler, true);
            });

            // 3. 定时清理内联属性 (暴力清除)
            window._unlockTimer = setInterval(() => {
                try {
                    const targets = [document, document.body];
                    const props = ['oncopy', 'oncut', 'onpaste', 'onselectstart', 'oncontextmenu'];
                    targets.forEach(t => {
                        if(!t) return;
                        props.forEach(p => {
                            t[p] = null;
                        });
                    });
                } catch(e) {}
            }, 1000);
            
            Toast.show('提示', '已开启解除复制限制\n现在可以尝试选择文本并复制');
        } else {
            // 1. 移除 CSS
            if (styleEl) {
                styleEl.remove();
                styleEl = null;
            }

            // 2. 移除事件监听
            events.forEach(evt => {
                window.removeEventListener(evt, allowHandler, true);
                document.removeEventListener(evt, allowHandler, true);
            });
            
            // 3. 清除定时器
            if (window._unlockTimer) {
                clearInterval(window._unlockTimer);
                window._unlockTimer = null;
            }

            Toast.show('提示', '已关闭解除复制限制');
        }
    }



    // 强制复制选中文本
    async function forceCopySelection() {
        const selection = window.getSelection();
        const text = selection.toString();
        
        if (!text) {
            Toast.show('提示', '请先选择要复制的文本');
            return;
        }

        // 优先使用 GM_setClipboard (它不依赖页面事件，也不受拦截器影响)
        if (typeof GM_setClipboard !== 'undefined') {
            try {
                GM_setClipboard(text, 'text');
                Toast.show('成功', '已强制复制选中内容到剪切板');
                return;
            } catch (e) {
                console.error('GM_setClipboard 失败，降级尝试:', e);
            }
        }

        // 如果必须使用 navigator.clipboard.writeText
        // 临时禁用拦截器，确保复制操作能通过
        const wasEnabled = styleEl !== null; // 通过 styleEl 判断是否开启
        const events = ['copy', 'cut', 'paste', 'selectstart', 'contextmenu', 'dragstart', 'mousedown', 'mouseup', 'keydown', 'keyup'];

        try {
            if (wasEnabled) {
                events.forEach(evt => {
                    window.removeEventListener(evt, allowHandler, true);
                    document.removeEventListener(evt, allowHandler, true);
                });
            }

            await navigator.clipboard.writeText(text);
            Toast.show('成功', '已复制选中内容');

        } catch (err) {
            console.error('复制失败:', err);
            Toast.show('错误', '复制失败: ' + err.message);
        } finally {
            // 恢复拦截器 (放在 finally 块中确保总是执行)
            // 重新检查 styleEl 状态，因为在此期间可能被关闭
            if (styleEl !== null) {
                events.forEach(evt => {
                    window.addEventListener(evt, allowHandler, true);
                    document.addEventListener(evt, allowHandler, true);
                });
            }
        }
    }

    function toggleLog() {
        // 使用store中的状态作为主要判断依据，DOM状态作为备用
        const storedHidden = store.get('logger.hidden', 0) === 1;
        const domHidden = document.getElementById('tmx-logger')?.style.display === 'none';
        const isCurrentlyHidden = storedHidden || domHidden;

        if (isCurrentlyHidden) {
            Logger.show();
            store.set('logger.hidden', 0);
            const btn = buttonMap.get('toggle-log');
            if (btn) {
                btn.textContent = '隐藏日志';
                btn.style.borderStyle = 'inset';
            }
        } else {
            Logger.hide();
            store.set('logger.hidden', 1);
            const btn = buttonMap.get('toggle-log');
            if (btn) {
                btn.textContent = '显示日志';
                btn.style.borderStyle = 'outset';
            }
        }
    }

    function toggleButtons() {
        const btn = buttonMap.get('toggle-buttons');
        const nowHidden = Array.from(buttonMap.values()).some(b => b.style.visibility === 'hidden');
        for (const [id, el] of buttonMap) {
            if (id === 'toggle-buttons') continue;
            el.style.visibility = nowHidden ? 'visible' : 'hidden';
        }
        store.set('buttons.hidden', nowHidden ? 0 : 1);
        const hidden = store.get('buttons.hidden', 0) === 1;
        
        const columnsInstance = getColumns();
        if (!columnsInstance) return;
        const boxes = columnsInstance.columns;
        
        const btnBox = btn ? btn.parentElement : null;
        if (hidden) {
            for (const [, box] of boxes) {
                if (box !== btnBox) {
                    box.style.display = 'none';
                }
            }
            if (btnBox) {
                btnBox.style.position = 'fixed';
                btnBox.style.top = CONFIG.buttonTop + 'px';
                btnBox.style.left = '0px';
                btnBox.style.width = '18px';
                btnBox.style.zIndex = ZIndexManager.getNextZIndex();
            }
            if (btn) {
                btn.textContent = '<<';
                btn.style.borderStyle = 'inset';
                btn.style.width = '18px';
                btn.style.minWidth = '18px';
                btn.style.padding = '0';
                btn.style.visibility = 'visible';
            }
        } else {
            for (const [, box] of boxes) {
                box.style.display = '';
            }
            if (btnBox) {
                let colIndex = 1;
                for (const [idx, b] of boxes) {
                    if (b === btnBox) {
                        colIndex = idx;
                        break;
                    }
                }
                const offset = getLayoutOffset();
                const left = CONFIG.baseLeft + offset + (colIndex - 1) * CONFIG.columnGap;
                
                btnBox.style.position = 'fixed';
                btnBox.style.left = left + 'px';
                btnBox.style.top = CONFIG.buttonTop + 'px';
                btnBox.style.width = CONFIG.columnWidth + 'px';
                btnBox.style.zIndex = 2147483646;
            }
            if (btn) {
                btn.textContent = '隐按钮';
                btn.style.borderStyle = 'inset';
                btn.style.width = '100%';
                btn.style.minWidth = '';
                btn.style.padding = '';
            }
        }
    }

    function switchTheme() {
        Theme.next();
        Theme.apply();
        Logger.applyTheme();
        Toast.applyTheme();
        Dialog.applyTheme();
        // 同步按钮颜色
        for (const [, el] of buttonMap) {
            el.style.color = 'var(--tmx-fg)';
            el.style.background = 'var(--tmx-bg)';
        }
        for (const [, gp] of groupMap) {
            Array.from(gp.btnWrap.children).forEach(b => {
                b.style.color = 'var(--tmx-fg)';
                b.style.background = 'var(--tmx-bg)';
            });
        }
        console.log(`当前皮肤为 -- ${Theme.current.name}`);
    }

    // 创建全局皮肤选择器实例
    let skinSelector = null;

    function toggleSkinSelector(btnEl) {
        if (!skinSelector) {
            skinSelector = new SkinSelector();
        }
        skinSelector.toggle();
        if (btnEl) {
            btnEl.style.borderStyle = skinSelector.visible ? 'inset' : 'outset';
        }
    }

    // 创建全局指令选择器实例
    let commandSelector = null;

    function toggleCommandSelector(btnEl) {
        if (!commandSelector) {
            commandSelector = new CommandSelector();
            window.commandSelector = commandSelector;
        }
        commandSelector.toggle();
        if (commandSelector.visible) {
            commandSelector.updateCommandButtons();
        }
        if (btnEl) {
            btnEl.style.borderStyle = commandSelector.visible ? 'inset' : 'outset';
        }
    }

    // 创建全局定时任务管理器实例
    let scheduleManager = null;

    function toggleScheduleManager(btnEl) {
        if (!scheduleManager) {
            scheduleManager = new ScheduleManager();
        }
        scheduleManager.toggle();
        if (btnEl) {
            btnEl.style.borderStyle = scheduleManager.visible ? 'inset' : 'outset';
        }
    }

    function toggleToast() {
        const flag = store.get('toast.enabled', 0) ? 0 : 1;
        store.set('toast.enabled', flag);
        const btn = buttonMap.get('toast');
        if (btn) {
            btn.style.borderStyle = flag ? 'inset' : 'outset';
            btn.textContent = flag ? '关闭弹窗' : '弹窗提示';
        }
        
        if (flag) {
            // 开启弹窗提示时显示弹窗
            Toast.show('提示', '你好');
        } else {
            // 关闭弹窗提示时，如果右下角有弹窗则自动关闭
            Toast.hide();
        }
        
        // 通知调试窗口更新最小化容器位置，避免与弹窗重叠
        if (window.DebugWindow && window.DebugWindow.updateMinimizedContainerPosition) {
            window.DebugWindow.updateMinimizedContainerPosition();
        }
    }

    function toggleGroup(name) {
        return (btnEl) => {
            const gp = groupMap.get(name);
            if (!gp) return;
            gp.toggle();
            // 可选：当弹窗显示时，让主按钮有一个视觉效果
            if (btnEl) btnEl.style.borderStyle = gp.visible ? 'inset' : 'outset';
        };
    }

    /**
     * 创建通用切换开关处理器
     * @param {string} id - 按钮ID
     * @param {string} openLabel - 开启时的标签
     * @param {string} closeLabel - 关闭时的标签
     * @param {string} storeKey - 存储键名
     * @param {Function} [onChange] - 状态改变时的回调函数 (newValue) => void
     * @returns {Function} 处理器函数
     */
    function makeToggle(id, openLabel, closeLabel, storeKey, onChange) {
        return (activeOrBtn, maybeBtn) => {
            let btn = null;
            let isActive = false;
            
            if (typeof activeOrBtn === 'boolean') {
                isActive = activeOrBtn;
                btn = maybeBtn;
            } else {
                btn = activeOrBtn;
                // 修正：这里不再反转状态！
                // 因为 GroupPopup 的 click handler 并没有改变 store，
                // 它只是把 btn 传给了我们。
                // 我们的职责是：读取当前 store -> 取反 -> 保存 -> 更新 UI。
                
                // 但是！如果我们在 GroupPopup 初始化时，已经根据 store 设置了 active 样式，
                // 此时点击，我们确实应该取反。
                
                const current = store.get(storeKey, 0) === 1;
                isActive = !current;
            }
            
            // 保存新状态
            store.set(storeKey, isActive ? 1 : 0);
            
            // 更新按钮 UI
            if (btn) {
                btn.innerText = isActive ? closeLabel : openLabel;
                btn.style.borderStyle = isActive ? 'inset' : 'outset';
            }
            
            // 触发回调
            if (onChange) {
                onChange(isActive);
            } else {
                console.log(`[${openLabel}] 状态：${isActive ? '已开启' : '已关闭'}`);
            }
        };
    }

    function noop(name) {
        return () => console.log(`[${name}] 点击`);
    }

    async function configClipboardApi() {
        try {
            const key = 'clipboard_api';
            const current = store.get(key, '');
            console.log('Dialog: 准备显示prompt对话框');
            const value = await Dialog.prompt('请输入剪切板API:', current || '', '配置剪切板API');
            console.log('Dialog: prompt对话框返回值:', value);
            if (value !== null) {
                store.set(key, value);
                console.log('[配置集] 已保存剪切板API:', value);
            }
        } catch (err) {
            console.error('Dialog错误:', err);
        }
    }

    async function configRemoteCommandUrl() {
        try {
            const key = 'remote_command_url';
            const current = store.get(key, '');
            const value = await Dialog.prompt('请输入远程指令集URL:', current || '', '配置远程指令集');
            if (value !== null) {
                store.set(key, value);
                console.log('[配置集] 已保存远程指令集URL:', value);
                // 如果启用了远程指令，立即尝试同步
                if (store.get('remote_commands_enabled', 0) === 1) {
                    await syncRemoteCommands(true);
                }
            }
        } catch (err) {
            console.error('配置远程指令URL错误:', err);
        }
    }

    function executeDebugCode() {
        // 创建新的调试代码窗口
        const defaultCode = '// 示例代码\nconsole.log("Hello World!");\nalert("测试弹窗");\n\n// 获取页面元素\nconst elements = document.querySelectorAll("div");\nconsole.log("页面div元素数量:", elements.length);\n\n// 便捷点击函数示例\n// clickbtn("百度一下");  // 点击包含"百度一下"文本的按钮\n// clickhref("百度一下"); // 点击包含"百度一下"文本的链接\n// clickgo("#su");       // 点击id为su的元素\n// clickgo("input[type=\"submit\"]"); // 点击提交按钮\n// await click(100, 200); // 点击坐标(100, 200)';

        const windowId = DebugWindowManager.createWindow(defaultCode);
        console.log(`[调试执行器] 创建调试窗口: ${windowId}`);
        Logger.append(`[调试执行器] 创建新调试窗口: ${windowId}`);
    }

    function pickCoordinate() {
        CoordinatePicker.start();
    }

    function pickElement() {
        ElementPicker.start();
    }

    function toggleGrayMode(enable) {
        setGrayMode(enable);
        const label = enable ? '开灰度' : '关灰度';
        Logger.append(`[开关集] ${label}`);
    }

    function toggleUnlockCopy(enable) {
        setUnlockCopy(enable);
        const label = enable ? '开复制' : '关复制';
        Logger.append(`[开关集] ${label}`);
    }

    function copySelection() {
        forceCopySelection();
        Logger.append(`[工具] 强制复制选中文本`);
    }

    async function configSafeCode() {
        const key = 'clipboard_safecode';
        const current = store.get(key, '');
        const value = await Dialog.prompt('请输入剪切板安全码:', current || '', '配置安全码');
        if (value !== null) {
            store.set(key, value);
            console.log('[配置集] 已保存剪切板安全码:', value);
        }
    }

    // 检查文本是否包含可疑模式
    function containsSuspiciousPatterns(text) {
        const suspiciousPatterns = [
            /\x4D\x5A/, // MZ (可执行文件头)
            /\x7F\x45\x4C\x46/, // ELF (Linux可执行文件)
            /\x23\x21/, // Shebang (#!)
            /<\?php/i, // PHP代码
            /<script\b[^>]*>/i, // Script标签
            /eval\(/i, // eval函数
            /javascript:/i, // javascript协议
            /vbscript:/i, // vbscript协议
        ];
        return suspiciousPatterns.some(pattern => pattern.test(text));
    }

    async function pushClipboardText() {
        const api = store.get('clipboard_api', '');
        const token = store.get('clipboard_safecode', '');
        if (!api || !token) {
            await Dialog.alert('请先配置剪切板API和安全码', '推送失败');
            return;
        }
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                await Dialog.alert('剪切板为空，无法推送', '推送失败');
                return;
            }

            // 检查是否包含可疑内容
            if (containsSuspiciousPatterns(text)) {
                const confirmed = await Dialog.confirm(
                    '检测到剪切板内容包含可疑模式（如脚本代码、可执行文件等），可能存在安全风险。\n\n是否仍要继续推送？',
                    '安全警告'
                );
                if (!confirmed) {
                    Logger.append('[推送文本] 用户取消：内容包含可疑模式');
                    return;
                }
            }
            GM_xmlhttpRequest({
                method: 'POST',
                url: api,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                data: JSON.stringify({ text }),
                onload: function (res) {
                    console.log("✅ 请求成功！");
                    console.log("状态码:", res.status);
                    console.log("响应文本:", res.responseText);
                    console.log("响应头:", res.responseHeaders);
                    if (res.status >= 200 && res.status < 300) {
                        console.log('[推送文本] 成功:', text);
                        Logger.append(`[推送文本] 成功：${text}`);
                    } else {
                        console.error('[推送文本] 失败:', res.status, res.responseText);
                        Logger.append(`[推送文本] 失败: ${res.status} ${res.responseText}`);

                        // 特殊处理可疑内容错误
                        if (res.status === 400 && res.responseText.includes('suspicious patterns')) {
                            Dialog.alert('服务器检测到内容包含可疑模式，推送被拒绝。\n\n请检查剪切板内容是否包含脚本代码、可执行文件等敏感内容。', '推送失败');
                        }
                    }
                },
                onerror: function (err) {
                    console.error('[推送文本] 网络错误:', err);
                    Logger.append('[推送文本] 网络错误');
                }
            });
        } catch (err) {
            console.error('[推送文本] 剪切板读取失败:', err);
            Logger.append('[推送文本] 剪切板读取失败: ' + err.message);
            await Dialog.alert(`剪切板读取失败: ${err.message}`, '推送失败');
        }
    }

    /**
     * 模拟鼠标点击指定坐标
     * 针对H5游戏优化，同时触发PointerEvent和MouseEvent
     * @param {number} x - 视口X坐标
     * @param {number} y - 视口Y坐标
     */
    async function simulateClick(x, y) {
        // 获取该位置的所有元素
        const elements = document.elementsFromPoint(x, y);
        
        // 找到第一个不是脚本UI的元素
        let el = null;
        for (const element of elements) {
            // 检查元素本身或其祖先是否有 data-tmx-ui 属性
            if (!element.closest('[data-tmx-ui="true"]')) {
                el = element;
                break;
            }
        }

        // 如果没找到（可能点击位置完全被UI覆盖且没有下层元素？），或者是脚本UI，则回退到 canvas 或 body
        if (!el) {
            el = document.querySelector('canvas') || document.body;
        }
        
        console.log(`[Mouse] Simulating click at (${x}, ${y}) on`, el);

        // 在油猴环境中，window对象可能被包装，导致PointerEvent构造函数报错
        // 优先使用 unsafeWindow，如果不存在则使用 window
        const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

        const commonOpts = {
            bubbles: true,
            cancelable: true,
            view: win,
            clientX: x,
            clientY: y,
            screenX: x + (win.screenX || 0),
            screenY: y + (win.screenY || 0),
            button: 0,
            buttons: 1,
            width: 1,
            height: 1,
            pressure: 0.5,
            isPrimary: true,
            pointerId: 1,
            pointerType: 'mouse'
        };

        // 许多H5游戏引擎(如Cocos, Laya, Egret)依赖PointerEvent
        // 顺序通常是: pointerdown -> mousedown -> pointerup -> mouseup -> click
        
        // 1. pointerdown
        el.dispatchEvent(new PointerEvent('pointerdown', commonOpts));
        
        // 2. mousedown
        el.dispatchEvent(new MouseEvent('mousedown', commonOpts));
        
        // 模拟按下和抬起之间的微小延迟
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 3. pointerup
        el.dispatchEvent(new PointerEvent('pointerup', commonOpts));
        
        // 4. mouseup
        el.dispatchEvent(new MouseEvent('mouseup', commonOpts));
        
        // 5. click
        el.dispatchEvent(new MouseEvent('click', commonOpts));
    }

    /**
     * 睡眠指定的毫秒数
     * @param {number} ms - 毫秒数
     * @returns {Promise<void>}
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 模拟输入文本
     * 尝试向当前聚焦的元素或指定元素输入文本
     * @param {string} text - 要输入的文本
     * @param {HTMLElement|string} [target] - 目标元素或选择器，如果不传则默认为当前聚焦元素
     */
    async function inputText(text, target = null) {
        let el = null;
        
        if (target) {
            if (typeof target === 'string') {
                el = document.querySelector(target);
            } else if (target instanceof HTMLElement) {
                el = target;
            }
        }
        
        // 如果没有指定目标，尝试获取当前聚焦元素
        if (!el) {
            el = document.activeElement;
        }

        if (!el || el === document.body) {
            console.warn('[Input] 未找到输入目标，请先点击输入框或指定目标');
            return false;
        }

        console.log(`[Input] 输入文本 "${text}" 到`, el);

        // 聚焦元素
        el.focus();

        // 尝试修改值
        // 1. 对于 input/textarea
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            
            // React/Vue 等框架可能重写了 value 属性的 setter，需要特殊处理
            // 获取原始的 setter
            let nativeSetter;
            if (el.tagName === 'INPUT') {
                nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            } else {
                nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            }

            if (nativeSetter) {
                nativeSetter.call(el, text);
            } else {
                el.value = text;
            }

            // 触发 input 事件 (模拟用户输入)
            el.dispatchEvent(new Event('input', { bubbles: true }));
            // 触发 change 事件
            el.dispatchEvent(new Event('change', { bubbles: true }));
        } 
        // 2. 对于 contenteditable 元素
        else if (el.isContentEditable) {
            el.textContent = text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        // 3. 其他情况，尝试发送键盘事件（兼容性较差，仅作尝试）
        else {
            // 这里只是简单模拟，对于复杂的 canvas 游戏可能无效
            // 真正的键盘模拟需要更底层的 API，浏览器 JS 受限
            console.warn('[Input] 目标元素不是标准输入框，尝试发送键盘事件可能无效');
            
            // 模拟逐字输入
            for (const char of text) {
                const opts = {
                    key: char,
                    code: `Key${char.toUpperCase()}`,
                    bubbles: true,
                    cancelable: true
                };
                el.dispatchEvent(new KeyboardEvent('keydown', opts));
                el.dispatchEvent(new KeyboardEvent('keypress', opts));
                el.dispatchEvent(new KeyboardEvent('keyup', opts));
                await new Promise(r => setTimeout(r, 10));
            }
        }

        return true;
    }

    /**
     * UI Protector
     * 监控脚本UI元素，防止被网页本身的操作（如 document.body.innerHTML 重写）清除。
     * 如果发现 UI 被清除，尝试重新初始化。
     */
    const UIProtector = (() => {
        let checkInterval = null;
        let initFunction = null;

        /**
         * 启动保护
         * @param {Function} initFn - 初始化函数，当检测到 UI 丢失时调用此函数重建 UI
         */
        function start(initFn) {
            if (checkInterval) clearInterval(checkInterval);
            initFunction = initFn;

            // 每 2 秒检查一次核心 UI 元素是否存在
            checkInterval = setInterval(check, 2000);
            console.log('[UIProtector] UI 保护已启动');
        }

        function check() {
            // 检查第1列容器是否存在
            // 我们的 UI 列是通过 Columns 类创建的，通常直接挂载在 body 下
            // 我们可以检查是否存在包含 data-tmx-ui 属性的元素，或者特定的列容器
            
            // 简单策略：检查是否还有我们的列容器
            // Columns 类创建的 div 通常没有特定的 ID，但我们可以检查是否有任何脚本创建的 UI
            // 注意：某些情况下，可能所有 UI 都被移除了，但也可能只是部分被移除
            // 这里我们检查最基础的列容器（Columns创建的div也有 data-tmx-ui 属性）
            const uiExists = document.querySelector('[data-tmx-ui="true"]');

            if (!uiExists) {
                console.warn('[UIProtector] 检测到 UI 丢失，正在尝试重新加载...');
                
                // 尝试重新执行初始化
                if (typeof initFunction === 'function') {
                    try {
                        initFunction();
                        // 重新挂载 Logger，因为 Logger 的 DOM 也可能丢失了
                        Logger.hook(); 
                        Logger.append('[UIProtector] UI 丢失，已尝试恢复');
                    } catch (e) {
                        console.error('[UIProtector] 重新加载失败:', e);
                    }
                }
            }
        }

        function stop() {
            if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
            }
        }

        return { start, stop };
    })();

    /**
     * 滚动页面
     * @param {number} x - 水平滚动距离或坐标
     * @param {number} y - 垂直滚动距离或坐标
     * @param {Object} [options] - 选项
     * @param {boolean} [options.absolute=false] - 是否为绝对坐标，false 为相对滚动
     * @param {string} [options.behavior='smooth'] - 滚动行为: 'auto' | 'instant' | 'smooth'
     * @param {string|HTMLElement} [options.target=window] - 滚动目标，默认 window，可选元素选择器或对象
     */
    async function scroll(x, y, options = {}) {
        const { absolute = false, behavior = 'smooth', target = window } = options;
        
        let el = target;
        if (typeof target === 'string') {
            el = document.querySelector(target);
        }
        
        if (!el) {
            console.warn('[Scroll] 未找到滚动目标:', target);
            return;
        }

        const scrollOptions = {
            behavior: behavior
        };

        if (absolute) {
            scrollOptions.left = x;
            scrollOptions.top = y;
            el.scrollTo(scrollOptions);
        } else {
            scrollOptions.left = x;
            scrollOptions.top = y;
            el.scrollBy(scrollOptions);
        }
        
        // 如果是平滑滚动，等待一段时间
        if (behavior === 'smooth') {
            // 估算滚动时间，或者固定等待
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    /**
     * 滚动到底部
     * @param {Object} options - 选项，同 scroll
     */
    async function scrollToBottom(options = {}) {
        const { target = window, behavior = 'smooth' } = options;
        let el = target;
        if (typeof target === 'string') {
            el = document.querySelector(target);
        }

        if (!el) return;

        if (el === window) {
            const y = document.body.scrollHeight;
            await scroll(0, y, { ...options, absolute: true });
        } else {
            const y = el.scrollHeight;
            await scroll(0, y, { ...options, absolute: true });
        }
    }

    /**
     * 滚动到顶部
     * @param {Object} options - 选项，同 scroll
     */
    async function scrollToTop(options = {}) {
        await scroll(0, 0, { ...options, absolute: true });
    }

    /**
     * 滚动元素到可视区域
     * @param {string|HTMLElement} selector - 元素选择器或对象
     * @param {string} [behavior='smooth'] - 滚动行为
     * @param {string} [block='center'] - 垂直对齐方式: 'start', 'center', 'end', 'nearest'
     */
    async function scrollIntoView(selector, behavior = 'smooth', block = 'center') {
        let el = selector;
        if (typeof selector === 'string') {
            el = document.querySelector(selector);
        }
        
        if (el) {
            el.scrollIntoView({ behavior, block });
            if (behavior === 'smooth') {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } else {
            console.warn('[Scroll] 未找到目标元素:', selector);
        }
    }

    // Define Actions
    const ACTIONS = [
        // 第1列：隐藏日志、显按钮
        { id: 'toggle-log', label: '隐藏日志', column: 1, handler: toggleLog },
        { id: 'toggle-buttons', label: '显按钮', column: 1, handler: toggleButtons },
        
        // 第2列：皮肤集、换皮肤
        { id: 'skin-open', label: '皮肤集', column: 2, handler: toggleSkinSelector },
        { id: 'theme', label: '换皮肤', column: 2, handler: switchTheme },
        
        // 第3列：弹出提示、调试执行
        { id: 'toast', label: '弹出提示', column: 3, handler: toggleToast },
        { id: 'debug', label: '调试执行', column: 3, handler: executeDebugCode },
        { id: 'pick-coord', label: '坐标拾取', column: 3, handler: pickCoordinate },
        { id: 'pick-elem', label: '元素拾取', column: 3, handler: pickElement },
        
        // 第4列：定时任务、推送文本
        { id: 'schedule-open', label: '定时任务', column: 4, handler: toggleScheduleManager },
        { id: 'force-copy', label: '复制选中', column: 4, handler: copySelection },
        
        // 第5列：配置集、开关集、指令集
        { id: 'cfg-open', label: '配置集', column: 5, handler: toggleGroup('配置集') },
        { id: 'kgj-open', label: '开关集', column: 5, handler: toggleGroup('开关集') },
        { id: 'command-open', label: '指令集', column: 5, handler: toggleCommandSelector },
        // 组内按钮，带 isToggle + storeKey 的会显示凹陷效果
        {
            id: 'tf',
            label: '开逃犯',
            group: '开关集',
            isToggle: true,
            storeKey: 'tf_killset',
            handler: makeToggle('tf', '开逃犯', '关逃犯', 'tf_killset')
        },
        { id: 'tj', label: '开天剑', group: '开关集', handler: noop('开天剑') },
        { id: 'bc', label: '开镖车', group: '开关集', handler: noop('开镖车') },
        { id: 'bz', label: '开帮战', group: '开关集', handler: noop('开帮战') },
        { id: 'hb', label: '开红包', group: '开关集', handler: noop('开红包') },
        { id: 'qc', label: '开抢菜', group: '开关集', handler: noop('开抢菜') },
        { id: 'dm', label: '开灯谜', group: '开关集', handler: noop('开灯谜') },
        { id: 'js', label: '开救赎', group: '开关集', handler: noop('开救赎') },
        { id: 'zx', label: '开智悬', group: '开关集', handler: noop('开智悬') },
        { id: 'zxs', label: '设智悬', group: '开关集', handler: noop('设智悬') },
        {
            id: 'gray-mode',
            label: '开灰度',
            group: '开关集',
            isToggle: true,
            storeKey: 'gray_mode_enabled',
            handler: makeToggle('gray-mode', '开灰度', '关灰度', 'gray_mode_enabled', (enabled) => toggleGrayMode(enabled))
        },
        {
            id: 'unlock-copy',
            label: '开复制',
            group: '开关集',
            isToggle: true,
            storeKey: 'unlock_copy_enabled',
            handler: makeToggle('unlock-copy', '开复制', '关复制', 'unlock_copy_enabled', (enabled) => toggleUnlockCopy(enabled))
        },

        // 分组：配置集
        {
            id: 'cfg-api',
            label: '剪切板API',
            group: '配置集',
            handler: configClipboardApi
        },
        {
            id: 'cfg-code',
            label: '安全码',
            group: '配置集',
            handler: configSafeCode
        },
        {
            id: 'cfg-remote-url',
            label: '远程指令URL',
            group: '配置集',
            handler: configRemoteCommandUrl
        },
        {
            id: 'cfg-remote-enable',
            label: '启用远程指令',
            group: '配置集',
            isToggle: true,
            storeKey: 'remote_commands_enabled',
            handler: makeToggle('cfg-remote-enable', '启用远程指令', '禁用远程指令', 'remote_commands_enabled')
        },
        {
            id: 'cfg-picker-mode',
            label: '模式: 简易',
            group: '配置集',
            isToggle: true,
            storeKey: 'element_picker_mode',
            handler: makeToggle('cfg-picker-mode', '模式: 简易', '模式: 全路径', 'element_picker_mode')
        },
        // 组内按钮：推送文本
        {
            id: 'cfg-push',
            label: '推送文本',
            column: 4,
            handler: pushClipboardText
        },
    ];

    // Initialize UI
    function render() {
        // Create columns instance
        const columns = new Columns();
        setColumns(columns); // Save to global state

        // 按列渲染（独立按钮）
        for (const act of ACTIONS.filter(a => a.column)) {
            const btn = columns.addButton(act.column, act.label, () => act.handler());
            buttonMap.set(act.id, btn);
        }

        // 分组渲染：先采集组
        const groups = ACTIONS.filter(a => a.group).reduce((acc, a) => {
            (acc[a.group] = acc[a.group] || []).push(a);
            return acc;
        }, {});
        
        for (const [name, acts] of Object.entries(groups)) {
            const gp = new GroupPopup(name);
            groupMap.set(name, gp);
            for (const a of acts) {
                // 把 isToggle / storeKey 转交给 gp.addButton
                gp.addButton(a.label, a.handler, { isToggle: !!a.isToggle, storeKey: a.storeKey });
            }
        }
    }

    // Data migration function
    function migrateLocalStorageToGM() {
        try {
            // 迁移标记，避免重复迁移
            const migrated = store.get('data_migrated', false);
            if (migrated) return;

            console.log('开始迁移localStorage数据到GM全局存储...');

            // 迁移本地指令集
            const localCommands = localStorage.getItem('custom_commands');
            if (localCommands && !store.get('custom_commands', null)) {
                try {
                    const commands = JSON.parse(localCommands);
                    store.set('custom_commands', commands);
                    console.log('已迁移本地指令集:', commands.length, '条');
                } catch (e) {
                    console.error('迁移本地指令集失败:', e);
                }
            }

            // 迁移定时任务
            const scheduledTasks = localStorage.getItem('scheduled_tasks');
            if (scheduledTasks && !store.get('scheduled_tasks', null)) {
                try {
                    const tasks = JSON.parse(scheduledTasks);
                    store.set('scheduled_tasks', tasks);
                    console.log('已迁移定时任务:', tasks.length, '条');
                } catch (e) {
                    console.error('迁移定时任务失败:', e);
                }
            }

            // 迁移远程指令缓存
            const remoteCommands = localStorage.getItem('remote_commands_cache');
            if (remoteCommands && !store.get('remote_commands_cache', null)) {
                try {
                    const commands = JSON.parse(remoteCommands);
                    store.set('remote_commands_cache', commands);
                    console.log('已迁移远程指令缓存:', commands.length, '条');
                } catch (e) {
                    console.error('迁移远程指令缓存失败:', e);
                }
            }

            // 迁移远程指令同步时间
            const lastSyncTime = localStorage.getItem('remote_commands_last_sync');
            if (lastSyncTime && !store.get('remote_commands_last_sync', null)) {
                try {
                    const time = parseInt(lastSyncTime);
                    store.set('remote_commands_last_sync', time);
                    console.log('已迁移远程指令同步时间:', new Date(time).toLocaleString());
                } catch (e) {
                    console.error('迁移远程指令同步时间失败:', e);
                }
            }

            // 标记迁移完成
            store.set('data_migrated', true);
            console.log('数据迁移完成！');

        } catch (error) {
            console.error('数据迁移过程中发生错误:', error);
        }
    }

    // Main initialization function
    function init() {
        // 挂载便捷函数到全局
        window.clickbtn = clickbtn;
        window.clickhref = clickhref;
        window.clickgo = clickgo;
        window.click = simulateClick;
        window.sleep = sleep;
        window.inputText = inputText;
        window.scroll = scroll;
        window.scrollToBottom = scrollToBottom;
        window.scrollToTop = scrollToTop;
        window.scrollIntoView = scrollIntoView;
        window.copyWithGreasemonkey = copyWithGreasemonkey;
        console.log('[便捷函数] clickbtn、clickhref、clickgo、click、sleep、inputText、scroll、copyWithGreasemonkey 已挂载到全局，可在控制台直接使用');

        Theme.apply();
        Logger.hook();
        Logger.append(`${META.name}: v${META.version}`);
        Logger.append(`布局偏移：${getLayoutOffset()}`);
        
        // 显示存储模式信息
        const storageInfo = store.getStorageInfo();
        Logger.append(`存储模式：${storageInfo.mode}${storageInfo.crossDomain ? ' (支持跨域共享)' : ' (仅当前域名)'}`);
        console.log('脚本存储信息:', storageInfo);

        render();
        Dialog.initialize();
        Dialog.applyTheme();
        initGrayMode(); // 初始化灰度模式
        
        // 启动 UI 保护，传入 render 函数作为重建方法
        UIProtector.start(() => {
            // 清理旧的引用（如果需要的话，Columns 等类可能需要 reset 方法，这里暂且假设重新 render 即可覆盖或添加）
            // 但更稳妥的方式是确保 render 是幂等的，或者在 render 前清理
            // 简单起见，这里直接调用 render，因为它会检查 ensure(index) 是否已存在
            // 但如果 DOM 被清除了，Columns 中的 map 引用可能还在，导致不会重新创建
            
            // 我们需要重置核心状态以便重新渲染
            setColumns(new Columns());
            render();
            Theme.apply(); // 重新应用主题
            Logger.show(); // 确保日志重新显示（如果之前是显示的）
        });
        
        // 将DebugWindowManager和Toast暴露到全局，供相互调用
        window.DebugWindow = DebugWindowManager;
        window.Toast = Toast;

        // 初始：同步 toast 按钮状态（如果存在）
        const toastOn = store.get('toast.enabled', 0) === 1;
        const toastBtn = buttonMap.get('toast');
        if (toastBtn) {
            toastBtn.textContent = toastOn ? '关闭弹窗' : '弹窗提示';
            toastBtn.style.borderStyle = toastOn ? 'inset' : 'outset';
        }
        if (toastOn) {
            Toast.show('提示', '你好');
        } else {
            // 如果弹窗提示是关闭状态，确保关闭可能存在的弹窗
            Toast.hide();
        }

        // 初始：同步日志显示状态
        const loggerHidden = store.get('logger.hidden', 0) === 1;
        if (loggerHidden) {
            Logger.hide();
            const logBtn = buttonMap.get('toggle-log');
            if (logBtn) {
                logBtn.textContent = '显示日志';
                logBtn.style.borderStyle = 'outset';
            }
        } else {
            Logger.show();
            const logBtn = buttonMap.get('toggle-log');
            if (logBtn) {
                logBtn.textContent = '隐藏日志';
                logBtn.style.borderStyle = 'inset';
            }
        }

        // 初始：同步按钮显示状态
        const buttonsHidden = store.get('buttons.hidden', 0) === 1;
        if (buttonsHidden) {
            for (const [id, el] of buttonMap) {
                if (id === 'toggle-buttons') continue;
                el.style.visibility = 'hidden';
            }
            
            const btn = buttonMap.get('toggle-buttons');
            const btnBox = btn ? btn.parentElement : null;
            
            const columnsInstance = getColumns();
            if (columnsInstance) {
                for (const [, box] of columnsInstance.columns) {
                    if (box !== btnBox) {
                        box.style.display = 'none';
                    }
                }
            }
            
            if (btnBox) {
                btnBox.style.position = 'fixed';
                btnBox.style.top = CONFIG.buttonTop + 'px';
                btnBox.style.left = '0px';
                btnBox.style.width = '18px';
                btnBox.style.zIndex = ZIndexManager.getNextZIndex();
            }
            if (btn) {
                btn.textContent = '<<';
                btn.style.borderStyle = 'inset';
                btn.style.width = '18px';
                btn.style.minWidth = '18px';
                btn.style.padding = '0';
                btn.style.visibility = 'visible';
            }
        } else {
            const btnToggle = buttonMap.get('toggle-buttons');
            if (btnToggle) {
                btnToggle.textContent = '隐按钮';
                btnToggle.style.borderStyle = 'inset';
            }
        }
        
        // 给组内的 toggle 按钮同步初始样式
        const kgjBtn = buttonMap.get('kgj-open');
        const gp = groupMap.get('开关集');
        if (kgjBtn && gp) {
            kgjBtn.style.borderStyle = gp.visible ? 'inset' : 'outset';
        }

        // 启动调度器并加载定时任务
        Scheduler.start();

        // 创建全局调度器实例供管理界面使用
        window.scheduler = Scheduler;

        // 数据迁移
        migrateLocalStorageToGM();

        // 页面加载时自动同步远程指令集
        try {
            const remoteUrl = store.get('remote_command_url', '');
            const remoteEnabled = store.get('remote_commands_enabled', 0) === 1;
            if (remoteEnabled && remoteUrl) {
                console.log('页面加载时自动同步远程指令集:', remoteUrl);
                syncRemoteCommands(false).catch(error => {
                    console.error('自动同步远程指令集失败:', error);
                });
            }
        } catch (error) {
            console.error('检查远程指令集配置失败:', error);
        }

        const now = new Date().toLocaleString();
        console.log(`上次网页刷新时间：${now}`);
    }

    // Start
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
