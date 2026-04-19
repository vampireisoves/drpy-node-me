# drpy-node MCP Skills & Prompts

## Skill 1: Develop DS Source (Create/Debug)
**Description:** Create, debug, and validate `drpy` JS spiders. Handles new sources, fixes, and advanced logic (encryption/lazy).

**Prompt Template:**
```markdown
Task: [Create/Debug/Analyze] DS Source for [URL/File]
Steps:
1. **Analyze/Fetch**: Use `fetch_spider_url` to inspect HTML/Headers or `read_file` to load existing code (auto-decrypted).
2. **Develop/Refine**:
    - Use `get_spider_template` for new files.
    - Implement `rule` object (see KB below).
    - For dynamic content, use `async` parsing or `lazy` loading.
    - For novels, `lazy` returns `novel://` + JSON.
3. **Validate**:
    - Save via `write_file` (new file) or `edit_file` (modify existing, prefer `replace_text` operation) to `spider/js/[Name].js`.
    - Check syntax (`check_syntax`) and structure (`validate_spider`).
    - Inspect final merged rule (`get_resolved_rule`) when template inheritance is involved.
    - Test rules (`debug_spider_rule`) against real content.
```

## Skill 2: System Maintenance
**Description:** Monitor health, logs, DB, and config.

**Prompt Template:**
```markdown
Task: System Health & Config Check
Steps:
1. **Diagnose**: `read_logs` for errors, `get_routes_info` for APIs, `sql_query` for DB stats.
2. **Configure**: `manage_config` (get/set) to adjust settings (e.g., timeout).
3. **Apply**: `restart_service` if config changed.
```

---

## DS Source Auto-Generation Guide (claw-ds)

### Core Workflow (6-Step Incremental Process)
To avoid context overflow and fragile DOM parsing, you **must** follow this step-by-step workflow:

1. **Template Analysis**: Analyze the target website's DOM structure first.
   - **Warning (Template Inheritance Trap)**: If the site uses modern frameworks (React/Vue) or Tailwind CSS (class names like `bg-[#409EFF]`, `flex`, `grid`), or data comes from JSON APIs, **do NOT inherit any built-in template** (do not use `模板: 'xxx'`). Built-in templates come with tightly coupled DOM selectors that will conflict. Write a clean standalone source instead.
2. **Categories & List (一级)**: Prioritize `class_name`, `class_url` (or `class_parse`), then write `一级` rules and test selectors with `debug_spider_rule`.
   - **Warning (debug_spider_rule usage)**: When using `pdfa` mode to test list rules, **never pass a full drpy rule with semicolons `;`**. `pdfa` only accepts pure CSS selectors. Test the list selector first, then test inner attribute extraction with `pdfh` mode.
3. **Search Rules (搜索)**: Write and debug `搜索` rules. If the search page structure matches the list page, use `搜索: '*'` for simple reuse. If regular search is blocked by anti-crawl, look for an open JSON suggestion API and use `async function` to parse JSON.
4. **Detail Page (二级)**: Write and debug `二级` rules. If the detail page is extremely complex but contains complete JSON data, prefer `二级: async function() { ... }` to build the `VOD` object directly.
   - **Warning (async function `this` context)**: When rewriting rules as `async function() { ... }`, the engine binds context via `apply`. You **must** destructure at the top: `let { input, pdfa, pdfh, pd } = this;` — never use `input` directly as a global variable.
5. **Play Links (lazy)**: Write `lazy` parsing. Determine if you can extract direct links (`parse: 0`) or need webview sniffing (`parse: 1`). If using `js:` string form, always include `return input;`.
6. **Filter Config (filter)**: For category filters, **always use `extract_website_filter` tool** — never fabricate manually. If filters are spread across multiple category pages, use the `urls` array parameter. Set `gzip: true` to get a Base64-encoded compressed string.

---

## Critical Addition: Template Sites Are Not a Black Box

If a source inherits a built-in template, **inspect the final merged rule first** before deciding whether to override anything.

Use:
- `get_resolved_rule`

Pay special attention to the final values of:
- `class_parse`
- `double`
- `url`
- `searchUrl`
- `推荐`
- `一级`
- `搜索`

### Why this matters
Template issues often look like selector problems, but are actually caused by:
- residual `class_parse` overriding `class_name/class_url`
- inherited `double: true` making home recommendation empty
- incorrect inherited `url/searchUrl`
- handwritten `一级/搜索` disrupting the built-in template chain

---

## Template-Site Troubleshooting Order (Best Practice)

When a site clearly matches a built-in template but evaluation still fails, use this order:

1. Inspect final merged rule with `get_resolved_rule`
2. Check whether residual `class_parse` overrides static categories
3. Check whether `double` causes home recommendation to be empty
4. Validate real category `url` against page-1/page-2 structure
5. Validate real `searchUrl`
6. Remove handwritten `一级/搜索` first and test template built-in behavior
7. Split-test `home/category/detail/search/play` before declaring the source dead

### Important discipline
Do **not** immediately handwrite:
- `推荐`
- `一级`
- `搜索`
- `二级`

before checking inherited template behavior.

---

## Engine Behavior You Should Know

### Static categories are now protected from empty dynamic category results
If `class_name/class_url` exist, and template/dynamic `class_parse` returns an empty array, the engine now falls back to static categories during `homeParseAfter`.

This means:
- static categories will not be silently wiped out by an empty `class_parse`
- "static exists but final class becomes empty" should no longer happen in normal DS template inheritance flow

---

## Rule Template

drpy supports template inheritance. Common built-in templates: `mx`, `mxpro`, `mxone5`, `首图`.
(Only use when the site is a traditional CMS; otherwise write everything from scratch.)

**Example 1: Template Inheritance (traditional CMS only)**
```javascript
var rule = {
    title: 'Example',
    host: 'https://www.example.com',
    模板: '首图',
    class_parse: '.navbar-items li;a&&Text;a&&href;/(\\d+)',
    searchUrl: '/search.php#searchword=**;post',
    lazy: 'js: return input;'
}
```

**Example 2: Full Manual (for unique site structures)**
```javascript
var rule = {
    title: 'Site Name',
    host: 'https://www.example.com',
    url: '/vod/show/id/fyclass/page/fypage.html',
    searchUrl: '/vod/search/page/fypage/wd/**.html',
    searchable: 2,
    quickSearch: 0,
    headers: { 'User-Agent': 'MOBILE_UA' },
    class_name: 'Movies&TV&Variety&Anime',
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

### Writing Requirements
1. **Analysis & Template Selection**:
   - Call `analyze_website_structure` to inspect DOM.
   - Contains `.stui-vodlist` or `.myui-vodlist` -> try `模板: '首图'`.
   - Contains `.module-item` -> try `模板: 'mxpro'`.
   - Modern sites (Tailwind/React/JSON data) -> **do NOT inherit templates**.
2. **Selectors**: Use cheerio syntax (`.class`, `#id`, `tag`).
3. **Attribute Extraction**:
   - `&&Text` extracts text
   - `&&href` extracts links
   - `&&src` or `&&data-src` extracts images
4. **Hierarchy**: List items separated by `;` (e.g., `list_selector;title;image;desc;link`).
5. **Category Scraping (`class_parse`)**:
   - When sensitive categories exist, **never hardcode** `class_name`/`class_url` — use `class_parse` dynamically.
   - Syntax: `node_selector;name_selector;link_selector;regex_to_extract_id`.
6. **Filter Config**:
   - Enable with `filterable: 1`, add `?xxx=fyfilter` in `url`.
   - Use `filter_url` for joining rules.
   - If all categories share identical filters, use `'*'` as key.
7. **Lazy Parsing Rules (Critical)**:
   - `parse: 0`: returned `url` is a **direct video link**.
   - `parse: 1`: returned `url` is still a **webpage/non-direct link**, needs sniffing.
   - `jx: 0`: **no parser needed**.
   - `jx: 1`: **external parser needed**.
   - Do not assume `parse:1` is always wrong.
   - Distinguish direct media links from parser URLs.
   - **Important fallback rule**: `||` should be used for attribute fallback on the SAME selector, e.g. `img&&data-original||src` or `a&&data-original||src`.
   - **Do NOT write** full-rule fallback like `img&&data-original||img&&src` unless parser support is explicitly confirmed.

### Spider Source Testing
**Test single interface (`test_spider_interface`)** and **Automated full-flow evaluation (`evaluate_spider_source`)** remain the preferred validation methods.

### Additional Best Practice
If `evaluate_spider_source` fails badly, do **not** immediately conclude the whole source is broken. Split-test:
- `home`
- `category`
- `detail`
- `search`
- `play`

and distinguish:
- rule truly broken
- evaluation chain not connected properly

---

## Knowledge Base (KB)

### 1. Source Structure (`rule` Object)
```javascript
var rule = {
    title: 'Site', host: 'https://site.com', url: '/cat/fyclass/p/fypage',
    searchUrl: '/s?k=**&p=fypage', searchable: 2, quickSearch: 0,
    headers: { 'User-Agent': 'MOBILE_UA' },
    class_name: 'Mov&TV', class_url: 'mov&tv',
    play_parse: true,
    lazy: async function() { let { input } = this; return { parse: 1, url: input } },
    一级: '.list li;a&&title;img&&src;.desc&&Text;a&&href',
    二级: '*',
    搜索: '*',
}
```

### 2. Selectors (Cheerio-based)
Format: `selector;attr` or `selector;attr1;attr2`
| Func | Returns | Description |
| :--- | :--- | :--- |
| `pdfa` | Array | Parse List. |
| `pdfh` | String | Parse Node. |
| `pd` | String | Parse URL (auto-resolve). |

### 3. Advanced Patterns
- `js:` string form: `input`, `HOST`, `MY_URL` are globals
- `async function` form: `input`, `HOST`, `MY_URL` are on `this`, must destructure first

### 4. Global Helpers
Use `get_drpy_libs_info` for the full current runtime reference.
