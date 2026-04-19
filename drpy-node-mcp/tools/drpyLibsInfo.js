export const get_drpy_libs_info = async () => {
    const info = {
        "1. Core Request Functions": [
            "request(url, options?) — Main async HTTP request function. Returns response body as string. options: { headers, method, data/body, timeout, encoding }",
            "post(url, options?) — POST request shortcut",
            "fetch(url, options?) — fetch-compatible async request function",
            "req(url, options?) — Lower-level request wrapper, usually returns { content, headers, code, ... }",
            "reqs(urls, options?) — Batch request utility",
            "getHtml(url, options?) — Fetch HTML helper",
            "getCode(url, options?) — Fetch source code/text helper",
            "checkHtml(html) — Validate/normalize HTML helper",
            "reqCookie(url, options?) — Request with cookie extraction helper"
        ],

        "2. Parsing Functions (HTML / JSON / URL)": [
            "pdfh(htmlOrNode, rule) — Parse node text/attribute from HTML or node. rule examples: 'a&&Text', 'img&&src', '.title&&Text'",
            "pd(htmlOrNode, rule, baseUrl?) — Parse and normalize URL/link. Auto-resolves relative URLs with baseUrl",
            "pdfa(htmlOrNode, selector) — Parse array/list nodes using CSS selector",
            "jsp(baseUrl?) — Create jsoup/html parser instance bound to base URL. Returns parser with pdfh/pd/pdfa methods",
            "pdfl(htmlOrNode, rule) — Low-level parse list helper",
            "pq(html, selector) — Query helper",
            "pjfh / pj / pjfa — JSON parsing variants used when source is JSON rather than HTML",
            "jsonpath.query(obj, path) — JSONPath query"
        ],

        "3. Async Context Rules": [
            "When using async function for 一级/二级/搜索/lazy/推荐/预处理/class_parse/hostJs, engine calls it with thisProxy",
            "You MUST destructure from this at function top: let { input, HOST, MY_URL, pdfa, pdfh, pd } = this;",
            "NEVER assume input/HOST are bare globals — they are on this, not free identifiers",
            "this first reads injectVars, then falls back to rule object",
            "this.xxx = value writes back to BOTH injectVars and rule object"
        ],

        "4. Rule String Syntax": [
            "Selector rule format: 列表;标题;图片;描述;链接;详情",
            "Use && for nested extraction: 'a&&title', '.lazyload&&data-original'",
            "Use || for fallback on the SAME selector's attributes: 'img&&data-original||src' or 'a&&data-original||src'",
            "Do NOT write full-rule fallback like 'img&&data-original||img&&src' unless engine/parser explicitly supports it",
            "Use :eq(n) for index selection",
            "pdfa mode only accepts pure CSS selector, not semicolon-separated multi-part rule"
        ],

        "5. URL / Query Utilities": [
            "urljoin(base, path) — Join/resolve relative URL against base",
            "urljoin2(base, path) — Alternative URL join helper",
            "joinUrl(base, path) — URL join helper",
            "buildUrl(url, obj) — Build URL with query parameters",
            "getQuery(url) — Parse query string from URL",
            "parseQueryString(query) — Parse query string to object",
            "buildQueryString(params) — Build query string from object",
            "objectToQueryString(params) — Convert object to URL query string",
            "encodeIfContainsSpecialChars(str) — Encode URL if needed",
            "urlDeal(url) — URL processing helper",
            "tellIsJx(url) — Check whether URL is a parser/jx URL"
        ],

        "6. User-Agent Constants": [
            "MOBILE_UA — Mobile User-Agent string (Android Chrome)",
            "PC_UA — Desktop User-Agent string (Windows Chrome)",
            "UA — Default User-Agent string",
            "UC_UA — UC Browser User-Agent string",
            "IOS_UA — iOS User-Agent string",
            "randomUa.generateUa(count?, options?) — Generate random UA"
        ],

        "7. JSON / Crypto / Compression": [
            "JSON5 — Relaxed JSON parser",
            "JSONbig / JsonBig — Big-number-safe JSON parser",
            "base64Encode / base64Decode — Base64 helpers",
            "md5 / md5X — Hash helpers",
            "aes / aesX / des / desX / rsa / rsaX — Crypto helpers",
            "rc4Encrypt / rc4Decrypt / rc4 / rc4_decode — RC4 helpers",
            "gzip / ungzip — Compression helpers",
            "CryptoJS / getCryptoJS / JSEncrypt / NODERSA / forge — Crypto libraries"
        ],

        "8. Data / Result Helpers": [
            "setResult(d) — Format detail page result",
            "setHomeResult(d) — Format home page result",
            "setResult2(d) — Alternative detail formatter",
            "fixAdM3u8Ai(m3u8Url, m3u8Content, headers?) — Fix ad-injected m3u8",
            "forceOrder(list, key?, flags?) — Force array order",
            "keysToLowerCase(obj) — Convert object keys to lowercase recursively",
            "getOriginalJs(jsCode) — Get original JS from encoded/minified code",
            "vodDeal — Video data processing utility",
            "processImage — Image processing utility",
            "jsEncoder / jsDecoder — JS encode/decode helpers"
        ],

        "9. Template Engine & Template Inheritance": [
            "jinja — Jinja2-like template engine",
            "template — Template rendering engine",
            "Template inheritance is NOT a black box in drpy-node runtime: final rule is produced after template merge",
            "For template sites, key inherited fields often include: class_parse, double, url, searchUrl, 推荐, 一级, 搜索",
            "Use get_resolved_rule tool in MCP to inspect final inherited summary before deciding whether to handwrite overrides",
            "Practical rule: for template sites, first inspect final class_parse / double / url / searchUrl, then decide whether to remove handwritten 一级/搜索 and fall back to built-in template chain"
        ],

        "10. Rule Object Properties (rule.*)": [
            "rule.title — Source title",
            "rule.host — Source base URL",
            "rule.url — Category/page URL pattern (supports fyclass, fypage, fyfilter placeholders)",
            "rule.searchUrl — Search URL pattern (supports ** keyword placeholder, fypage)",
            "rule.headers — Default HTTP headers for all requests",
            "rule.class_name — Category names (&-separated)",
            "rule.class_url — Category IDs (&-separated)",
            "rule.class_parse — Category parse rule (auto-extract categories from HTML)",
            "rule.一级 — Category listing parse rule string or async function",
            "rule.二级 — Detail page parse rule string ('*' for default) or object or async function",
            "rule.搜索 — Search parse rule string ('*' for default) or async function",
            "rule.lazy — Lazy load/play URL resolver. async function returning {parse:0/1, url:'...'}",
            "rule.推荐 — Home recommendation parse rule (optional)",
            "rule.预处理 — Pre-processing async function (runs before everything)",
            "rule.play_parse — Whether to auto-parse play URLs (boolean)",
            "rule.searchable — Search capability: 0=disabled, 1=enabled, 2=quick search",
            "rule.quickSearch — Quick search mode",
            "rule.filterable — Whether filter support is enabled",
            "rule.encoding — Source page encoding (default: 'utf-8')",
            "rule.timeout — Request timeout in milliseconds",
            "rule.double — Whether home recommendation parsing uses double-layer location",
            "rule.type / rule.类型 — Source type: video / 小说 / 漫画"
        ],

        "11. Template-Site Troubleshooting Order (Best Practice)": [
            "Step 1: Inspect final inherited rule (get_resolved_rule)",
            "Step 2: Check whether residual class_parse overrides static class_name/class_url",
            "Step 3: Check whether double causes home recommendation list to be empty",
            "Step 4: Validate real category url and searchUrl against actual page/next-page structure",
            "Step 5: Prefer template built-in 一级/搜索 before large handwritten override",
            "Step 6: If evaluate_spider_source fails, split-test home/category/detail/search/play before declaring source dead"
        ],

        "12. Lazy / Play Parsing Mental Model": [
            "There are three common lazy styles in drpy-node ecosystem:",
            "common_lazy style — parse play page HTML, extract player_* JSON, decode encrypt/url, return direct media or parser link",
            "def_lazy style — return { parse: 1, url: input } and let parser/front-end handle play page",
            "cj_lazy style — collector-site style, may use parse_url or json: parse endpoint",
            "Do NOT assume parse:1 is always wrong — for some sites it is the intended default strategy",
            "Do NOT assume any http URL is a direct media link — distinguish direct media (m3u8/mp4/m4a/mp3) from external parser URL",
            "If player_* JSON contains encrypt field, decode url before deciding parse/jx strategy"
        ],

        "13. Misc Utility Functions": [
            "log(msg) / print(msg) — Console output",
            "randStr(len, withNum?) — Generate random string",
            "toBeijingTime(timestamp?) — Convert timestamp to Beijing time",
            "computeHash(data) — Compute hash",
            "deepCopy(obj) — Deep clone object",
            "sleep(ms) / sleepSync(ms) — Delay helpers",
            "createBasicAuthHeaders(user, pass) — HTTP Basic Auth headers",
            "get_size(url) — Get remote file size",
            "getContentType(path) / getMimeType(path) — MIME helpers",
            "getParsesDict() — Get available parser dictionary",
            "getFirstLetter(str) — Chinese pinyin first-letter helper",
            "simplecc — Simplified/Traditional Chinese conversion library",
            "DataBase / database — DB helpers",
            "OcrApi — OCR API client",
            "RSA — RSA utility object",
            "jsonToCookie / cookieToJson — Cookie conversion helpers",
            "ENV / _ENV — Runtime environment config"
        ],

        "14. Node.js Built-in (injected to sandbox)": [
            "require(moduleName) — Restricted Node.js require",
            "Buffer — Node.js Buffer class",
            "console — Console object",
            "WebAssembly — WebAssembly API",
            "setTimeout / setInterval / clearTimeout / clearInterval — Timer functions",
            "TextEncoder / TextDecoder — Encoding/decoding",
            "performance — High-resolution timer",
            "WebSocket / WebSocketServer — ws library classes",
            "minizlib — Compression library"
        ]
    };
    return {
        content: [{
            type: "text",
            text: JSON.stringify(info, null, 2)
        }]
    }
};
