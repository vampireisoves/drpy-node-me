# drpy-node MCP 技能与提示词

## 技能 1: 开发 DS 源（创建/调试）
**描述：** 创建、调试和验证 `drpy` JS 爬虫源。支持新建源、修复和高级逻辑（加密/lazy）。

**提示词模板：**
```markdown
任务: [创建/调试/分析] DS 源，目标 [URL/文件]
步骤:
1. **分析/抓取**: 使用 `fetch_spider_url` 检查 HTML/Headers，或使用 `read_file` 加载已有代码（自动解密）。
2. **开发/完善**:
    - 使用 `get_spider_template` 获取新文件模板。
    - 实现 `rule` 对象（参见下方知识库）。
    - 动态内容使用 `async` 解析或 `lazy` 加载。
    - 小说类型，`lazy` 返回 `novel://` + JSON。
3. **验证**:
    - 通过 `write_file`（新建文件）或 `edit_file`（修改已有文件）保存到 `spider/js/[Name].js`。
    - 检查语法 (`check_syntax`) 和结构 (`validate_spider`)。
    - 涉及模板继承时，用 `get_resolved_rule` 查看最终继承结果。
    - 使用真实内容测试规则 (`debug_spider_rule`)。
```

## 技能 2: 系统维护
**描述：** 监控健康状况、日志、数据库和配置。

**提示词模板：**
```markdown
任务: 系统健康与配置检查
步骤:
1. **诊断**: `read_logs` 查看错误，`get_routes_info` 查看 API，`sql_query` 查看数据库统计。
2. **配置**: `manage_config`（读取/设置）调整设置（如超时时间）。
3. **应用**: 修改配置后调用 `restart_service`。
```

---

## DS 源自动生成指南 (claw-ds)

### 核心工作流（必须严格遵循的 6 步拟人化流程）
为了避免上下文爆炸、DOM 解析脆弱和频频报错，你**必须**按照以下流程编写 drpy 源：

1. **模板分析**: 首先分析目标网站的整体 DOM 结构。
   - **避坑指南（模板继承陷阱）**：如果网站使用了现代前端框架（如 React/Vue）或 Tailwind CSS，或者其数据主要由 JSON API 下发，**绝对不要继承任何内置模板**（不要写 `模板: 'xxx'`），应从头编写独立源。
2. **分类与列表（一级）**: 优先分析和编写 `class_name`、`class_url`（或 `class_parse`），接着编写 `一级` 规则，并利用 `debug_spider_rule` 测试选择器。
   - **避坑指南（debug_spider_rule 工具使用）**：使用 `pdfa` 测试列表规则时，**绝不能传入包含分号 `;` 的完整 drpy 规则**。`pdfa` 只能接受纯 CSS 选择器。
3. **搜索规则（搜索）**: 编写并调试 `搜索` 规则。如果搜索页和列表页结构一致，可直接使用 `搜索: '*'` 复用。如果常规搜索页被反爬拦截，尝试寻找开放的 JSON 联想接口。
4. **详情页（二级）**: 编写并调试 `二级` 规则。如果详情页结构复杂但源码中包含完整 JSON 数据，应优先使用 `二级: async function() { ... }` 直接构建 `VOD`。
   - **避坑指南（async function 的 this 上下文）**：使用 `async function() { ... }` 时，必须先解构：`let { input, pdfa, pdfh, pd } = this;`，绝不能直接把 `input` 当全局变量使用。
5. **播放链接（lazy）**: 编写 `lazy` 解析。判断是直链（`parse: 0`）还是需要 webview 嗅探（`parse: 1`）。如果使用 `js:` 字符串形式，务必包含 `return input;`。
6. **筛选配置（filter）**: 针对分类筛选条件，**必须使用 `extract_website_filter` 工具**，绝不可主观捏造。

---

## 关键补充：模板站不是黑箱

如果一个源继承了内置模板，**在决定是否手写覆盖之前，必须先看最终继承后的 rule**。

使用：
- `get_resolved_rule`

重点查看最终字段：
- `class_parse`
- `double`
- `url`
- `searchUrl`
- `推荐`
- `一级`
- `搜索`

### 为什么这一步很重要
很多看似像“选择器写错”的问题，实际根因是：
- 模板残留 `class_parse` 覆盖了 `class_name/class_url`
- 模板继承的 `double: true` 导致首页推荐为空
- 模板默认 `url/searchUrl` 与站点真实翻页结构不一致
- 手写 `一级/搜索` 反而打乱模板内置链路

---

## 模板站排障顺序（最佳实践）

当网站明显命中模板，但自动评估仍然不顺时，应按以下顺序处理：

1. 先用 `get_resolved_rule` 看最终继承结果
2. 先查 `class_parse` 是否覆盖静态分类
3. 再查 `double` 是否导致首页推荐为空
4. 再核对真实分类 `url` 与翻页结构是否一致
5. 再核对真实 `searchUrl`
6. 优先删除手写 `一级/搜索`，回测模板内置规则
7. 最后才考虑最小覆盖

### 关键纪律
在没有完成上面检查前，**不要一上来就大面积手写：**
- `推荐`
- `一级`
- `搜索`
- `二级`

---

## 引擎行为补充说明

### 静态分类现在不会再被空动态分类冲掉
如果规则里存在：
- `class_name`
- `class_url`

而模板/动态 `class_parse` 最终返回空数组，那么引擎在 `homeParseAfter` 阶段会回退到静态分类。

这意味着：
- 静态分类不会再因为空的 `class_parse` 结果而被冲成 `class: []`
- “静态分类明明有，最终没分类”的情况已不应再是正常行为

---

## 规则模板

drpy 支持模板继承，常见模板有：`mx`、`mxpro`、`mxone5`、`首图`。
（仅当网站确实是传统 CMS 结构时才使用）

**示例 1：使用模板继承（仅限传统 CMS）**
```javascript
var rule = {
    title: '某某影视',
    host: 'https://www.example.com',
    模板: '首图',
    class_parse: '.navbar-items li;a&&Text;a&&href;/(\\d+)',
    searchUrl: '/search.php#searchword=**;post',
    lazy: 'js: return input;'
}
```

**示例 2：全量手写（网站结构非常特殊时）**
```javascript
var rule = {
    title: '网站名称',
    host: 'https://www.example.com',
    url: '/vod/show/id/fyclass/page/fypage.html',
    searchUrl: '/vod/search/page/fypage/wd/**.html',
    searchable: 2,
    quickSearch: 0,
    headers: { 'User-Agent': 'MOBILE_UA' },
    class_name: '电影&电视剧&综艺&动漫',
    class_url: '1&2&3&4',
    play_parse: true,
    lazy: 'js: return input;',
    limit: 6,
    推荐: '.list-item;a&&title;img&&data-src;.remarks&&Text;a&&href',
    一级: '.list-item;a&&title;img&&data-src;.remarks&&Text;a&&href',
    二级: {
        title: 'h1&&Text;.desc&&Text',
        img: '.lazyload&&data-src',
        desc: '.info&&Text',
        content: '.content&&Text',
        tabs: '.nav-tabs a',
        lists: '.playlist li'
    },
    搜索: '*'
}
```

### 编写要求
1. **分析与模板选择**：
   - 调用 `analyze_website_structure` 查看 DOM。
   - 包含 `.stui-vodlist` 或 `.myui-vodlist` -> 尝试 `模板: '首图'`。
   - 包含 `.module-item` -> 尝试 `模板: 'mxpro'`。
   - 现代网站（Tailwind/React/JSON 数据） -> **不要继承模板**。
2. **选择器**：使用 cheerio 语法，如 `.class`、`#id`、`tag`。
3. **属性提取**：
   - `&&Text` 提取文本
   - `&&href` 提取链接
   - `&&src` 或 `&&data-src` 提取图片
4. **层级结构**：列表项使用 `;` 分隔。
5. **分类抓取（`class_parse`）**：
   - 当网站存在敏感分类时，优先使用 `class_parse` 动态抓取。
   - 语法：`节点选择器;分类名选择器;链接选择器;正则提取分类ID`
6. **筛选配置**：
   - 开启 `filterable: 1`，并配置 `filter_url`
   - 所有分类筛选一致时，优先使用 `'*'` 作为 key
7. **lazy 解析规则（关键）**：
   - `parse: 0`：返回真实直链
   - `parse: 1`：返回网页/非直链，仍需嗅探
   - `jx: 0`：不需要解析
   - `jx: 1`：需要外部解析
   - 不要把 `parse:1` 一概判成错
   - 要区分直链和站外解析链接
   - **重要 fallback 约束**：`||` 应优先用于同一 selector 下的属性备选，例如 `img&&data-original||src` 或 `a&&data-original||src`
   - **不要写** `img&&data-original||img&&src` 这种完整双规则 fallback，除非已确认 parser 明确支持

### 爬虫源测试
- 优先使用 `test_spider_interface` 做单接口测试
- 优先使用 `evaluate_spider_source` 做全流程评估

### 额外原则
如果 `evaluate_spider_source` 分数很低，不要立刻判整份源不可用。
应先拆开测试：
- `home`
- `category`
- `detail`
- `search`
- `play`

先区分：
- 规则本身不通
- 还是自动评估串联没接上

---

## 知识库（KB）

### 1. 源结构（`rule` 对象）
```javascript
var rule = {
    title: '站点', host: 'https://site.com', url: '/cat/fyclass/p/fypage',
    searchUrl: '/s?k=**&p=fypage', searchable: 2, quickSearch: 0,
    headers: { 'User-Agent': 'MOBILE_UA' },
    class_name: '电影&电视剧', class_url: 'mov&tv',
    play_parse: true,
    lazy: async function() { let { input } = this; return { parse: 1, url: input } },
    一级: '.list li;a&&title;img&&src;.desc&&Text;a&&href',
    二级: '*',
    搜索: '*',
}
```

### 2. 选择器（基于 Cheerio）
格式：`selector;attr` 或 `selector;attr1;attr2`
| 函数 | 返回值 | 描述 |
| :--- | :--- | :--- |
| `pdfa` | 数组 | 解析列表。 |
| `pdfh` | 字符串 | 解析节点。 |
| `pd` | 字符串 | 解析 URL（自动补全）。 |

### 3. 高级模式
- `js:` 字符串形式：`input`、`HOST`、`MY_URL` 是全局变量
- `async function` 形式：`input`、`HOST`、`MY_URL` 在 `this` 上，必须解构

### 4. 全局辅助函数
完整当前运行时说明请使用：
- `get_drpy_libs_info`
