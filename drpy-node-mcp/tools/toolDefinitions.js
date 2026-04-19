import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import * as fsTools from "./fsTools.js";
import * as spiderTools from "./spiderTools.js";
import * as dbTools from "./dbTools.js";
import * as systemTools from "./systemTools.js";
import * as apiTools from "./apiTools.js";
import * as spiderTestTools from "./spiderTestTools.js";
import * as houseTools from "./houseTools.js";

export const toolHandlers = {
    list_directory: fsTools.list_directory,
    read_file: fsTools.read_file,
    write_file: fsTools.write_file,
    delete_file: fsTools.delete_file,
    edit_file: fsTools.edit_file,
    find_in_file: fsTools.find_in_file,

    list_sources: spiderTools.list_sources,
    get_routes_info: spiderTools.get_routes_info,
    fetch_spider_url: spiderTools.fetch_spider_url,
    analyze_website_structure: spiderTools.analyze_website_structure,
    get_claw_ds_skill: spiderTools.get_claw_ds_skill,
    guess_spider_template: spiderTools.guess_spider_template,
    debug_spider_rule: spiderTools.debug_spider_rule,
    get_spider_template: spiderTools.get_spider_template,
    get_drpy_libs_info: spiderTools.get_drpy_libs_info,
    validate_spider: spiderTools.validate_spider,
    extract_website_filter: spiderTools.extract_website_filter,
    check_syntax: spiderTools.check_syntax,
    get_resolved_rule: spiderTools.get_resolved_rule,
    extract_iframe_src: spiderTools.extract_iframe_src,

    get_drpy_api_list: apiTools.get_drpy_api_list,

    sql_query: dbTools.sql_query,

    read_logs: systemTools.read_logs,
    manage_config: systemTools.manage_config,
    restart_service: systemTools.restart_service,

    test_spider_interface: spiderTestTools.test_spider_interface,
    evaluate_spider_source: spiderTestTools.evaluate_spider_source,

    house_verify: houseTools.house_verify,
    house_file: houseTools.house_file,
};

export const tools = [
  {
    name: "list_directory",
    description: "【drpy-node 专用】列出 drpy-node 项目中的文件和目录，用于探索项目结构。⚠️ 此工具仅限浏览 drpy-node 项目目录，不要用于其他项目的目录操作。",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "相对于 drpy-node 项目根目录的目录路径（默认: '.'，即根目录）。",
        },
      },
    },
  },
  {
    name: "read_file",
    description: "【drpy-node 专用】读取 drpy-node 项目中指定文件的内容。对 DS 格式加密的 JS 源文件会自动解密。✅ 读取爬虫源（spider/js/）、规则文件、配置文件等 drpy-node 项目代码文件时，必须优先使用此工具而非 IDE 内置的 Read 工具，因为本工具支持 DS 源自动解密等专属能力。⚠️ 此工具仅限读取 drpy-node 项目文件，读取其他项目的文件请使用 IDE 内置的 Read 工具。",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "相对于 drpy-node 项目根目录的文件路径（例如: 'spider/js/test.js'）。必须是 drpy-node 项目内的路径。",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "【drpy-node 专用】写入内容到 drpy-node 项目中的指定文件，常用于保存爬虫源（spider/js/）和修改配置。⚠️ 此工具仅限写入 drpy-node 项目内的代码文件（.js/.json/.css/.html 等）！禁止用于创建 .md/.txt 等文档文件！创建 README、文档、笔记等非项目代码文件请使用 IDE 内置的 Write 工具，绝对不要使用此工具！",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "相对于 drpy-node 项目根目录的文件路径。仅限写入 drpy-node 项目内的代码文件，禁止写入 .md 等文档文件。",
        },
        content: {
          type: "string",
          description: "需要写入的完整文件内容。",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "delete_file",
    description: "【drpy-node 专用】删除 drpy-node 项目中指定的文件或目录。⚠️ 此工具仅限操作 drpy-node 项目内的文件，禁止用于删除其他项目的文件。",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "相对于 drpy-node 项目根目录的路径。仅限 drpy-node 项目内的路径。",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "edit_file",
    description: "【drpy-node 专用】修改 drpy-node 项目中已有的代码文件。通过搜索文本并替换来编辑文件，每次调用执行一个编辑操作。返回变更的 diff 信息。✅ 编辑爬虫源、规则文件、JS 代码等 drpy-node 项目代码文件时，必须优先使用此工具而非 IDE 内置的 Edit 工具，因为本工具支持 JS 语法校验、自动回滚等专属能力。【安全机制】1. JS文件编辑后会自动校验语法，若语法错误则拒绝写入并回滚；2. replace_text 若搜索文本在文件中出现多次则拒绝替换（需用更精确的搜索文本）；3. 行号操作单次最多影响200行。⚠️ 此工具仅限编辑 drpy-node 项目内的代码文件！禁止用于编辑 .md/.txt 等文档文件！编辑文档、README 等请使用 IDE 内置的编辑工具。",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "相对于 drpy-node 项目根目录的文件路径。仅限 drpy-node 项目内的代码文件。",
        },
        operation: {
          type: "string",
          enum: ["replace_text", "replace_lines", "delete_lines", "insert_lines"],
          description: "编辑操作类型。推荐优先使用 replace_text（按文本搜索替换，无需行号）。replace_lines=替换指定行范围，delete_lines=删除指定行范围，insert_lines=在指定行后插入内容。",
        },
        search: {
          type: "string",
          description: "【replace_text 专用】要搜索的文本内容（精确匹配，支持多行）。找到文件中第一个匹配项进行替换。这是最推荐的方式，因为不需要计算行号。",
        },
        replacement: {
          type: "string",
          description: "【replace_text 专用】替换后的新文本。留空或不传则表示删除匹配的文本。",
        },
        start_line: {
          type: "number",
          description: "【行号操作专用】起始行号（从 1 开始）。insert_lines 时 0=文件开头插入，N=第 N 行后插入。",
        },
        end_line: {
          type: "number",
          description: "【行号操作专用】结束行号（含）。省略时默认等于 start_line，即只操作一行。",
        },
        content: {
          type: "string",
          description: "【行号操作专用】要插入或替换为的新内容（支持多行，用 \\n 分隔）。",
        },
      },
      required: ["path", "operation"],
    },
  },
  {
    name: "find_in_file",
    description: "【drpy-node 专用】在 drpy-node 项目文件中搜索指定文本或正则表达式，返回匹配行的行号、内容及上下文。用于定位要编辑的代码位置，获取精确行号后配合 edit_file 的行号操作（replace_lines/delete_lines）进行精确编辑。⚠️ 此工具仅限搜索 drpy-node 项目内的文件。",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "相对于 drpy-node 项目根目录的文件路径。仅限 drpy-node 项目内的文件。",
        },
        keyword: {
          type: "string",
          description: "要搜索的文本或正则表达式。",
        },
        regex: {
          type: "boolean",
          description: "是否将 keyword 作为正则表达式搜索。默认 false（纯文本搜索）。",
        },
        surrounding_lines: {
          type: "number",
          description: "匹配行前后显示的上下文行数。默认 2。",
        },
        max_matches: {
          type: "number",
          description: "最多返回的匹配数。默认 20。",
        },
      },
      required: ["path", "keyword"],
    },
  },
  {
    name: "list_sources",
    description: "列出所有的爬虫源文件（包括 spider/js 和 spider/catvod 目录下的文件）。无参数。",
    inputSchema: {
        type: "object",
        properties: {}
    },
  },
  {
    name: "get_routes_info",
    description: "获取已注册的路由和控制器信息，帮助了解项目 API 入口。无参数。",
    inputSchema: {
        type: "object",
        properties: {}
    },
  },
  {
    name: "get_drpy_api_list",
    description: "获取 drpy-node 完整的 API 接口列表，包含参数和返回示例。无参数。",
    inputSchema: {
        type: "object",
        properties: {}
    },
  },
  {
    name: "analyze_website_structure",
    description: "抓取目标网址的 HTML，并移除无用的 script、style、meta 等标签，返回精简后的 DOM 结构。这能极大降低 token 消耗，帮助 AI 快速分析出正确的 CSS 选择器以编写 ds 源。",
    inputSchema: zodToJsonSchema(
      z.object({
        url: z.string().describe("需要抓取分析的目标网址（必须完整包含 http/https）。"),
        options: z.object({
          method: z.string().optional().describe("HTTP 请求方法，如 'GET' 或 'POST'。"),
          headers: z.record(z.string()).optional().describe("HTTP 请求头键值对，用于模拟浏览器、携带 Cookie 或绕过反爬机制。"),
        }).optional().describe("请求选项（可选）。"),
      })
    ),
  },
  {
    name: "extract_website_filter",
    description: "提取目标网站分类页的筛选条件(filter)字典，自动转换为drpy规则格式。当编写需要筛选的爬虫源时，传入该网站某个包含筛选的分类URL，工具会自动解析其 DOM 并输出符合规范的 filter 配置字典。",
    inputSchema: {
        type: "object",
        properties: {
            url: {
                type: "string",
                description: "包含筛选条件的分类页面URL（如 https://dyrsok.com/dianying.html）",
            },
            urls: {
                type: "array",
                items: { type: "string" },
                description: "批量传入多个分类页面的URL，工具会自动聚合提取所有分类的筛选（如优先于 url 参数生效）。"
            },
            gzip: {
                type: "boolean",
                description: "是否返回经过 gzip 压缩并转 base64 后的字符串，以减少长筛选字典带来的 Token 消耗。默认为 false。"
            },
            options: {
                type: "object",
                description: "请求选项（包含 headers）。同时支持解析常见 CMS（如 MacCMS/苹果CMS）风格的筛选结构。",
                properties: {
                    headers: { type: "object" },
                }
            }
        }
    },
  },
  {
    name: "get_claw_ds_skill",
    description: "获取自动化生成 ds 源的 AI 提示词（Prompt）和代码模板。在为用户编写新的 drpy 源时，请先调用此工具获取编写规范和格式。支持 lang 参数指定语言（en/zh），默认英文。",
    inputSchema: {
      type: "object",
      properties: {
        lang: {
          type: "string",
          description: "语言选择：'en' 返回英文版 skills.md，'zh' 返回中文版 skills-zh.md。默认 'en'。",
          enum: ["en", "zh"],
        },
      },
    },
  },
  {
    name: "guess_spider_template",
    description: "快速判断目标网站的源码是否符合 drpy 的内置模板（如 mx, mxpro, 首图, 首图2 等）。这能极大节省写源的代码量。",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "要抓取并分析的目标网址。",
        },
        options: {
          type: "object",
          description: "抓取 URL 时的请求选项（包含 headers）。",
          properties: {
            headers: { type: "object" },
          }
        }
      },
      required: ["url"],
    },
  },
  {
    name: "extract_iframe_src",
    description: "专门用于提取播放页中的 iframe src，辅助 AI 编写 lazy 函数中的直链抓取逻辑。",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "要抓取并分析的播放页网址（如 /play/1-1-1.html）。",
        },
        options: {
          type: "object",
          description: "抓取 URL 时的请求选项（包含 headers）。",
          properties: {
            headers: { type: "object" },
          }
        }
      },
      required: ["url"],
    },
  },
  {
    name: "fetch_spider_url",
    description: "使用 drpy-node 内置的请求库获取指定 URL 的内容。主要用于调试网站连通性、测试请求头、User-Agent 等反爬机制。",
    inputSchema: zodToJsonSchema(
      z.object({
        url: z.string().describe("要抓取的目标网址。"),
        options: z.object({
          method: z.string().optional().describe("HTTP 请求方法（GET, POST 等）。"),
          headers: z.record(z.string()).optional().describe("HTTP 请求头对象（User-Agent, Cookie, Referer 等）。"),
          data: z.any().optional().describe("POST/PUT 请求的 Body 数据。"),
        }).optional().describe("请求选项。"),
      })
    ),
  },
  {
    name: "debug_spider_rule",
    description: "调试 drpy 的爬虫规则（Rule）。可以通过提供 HTML 或 URL，并应用指定的 cheerio 提取规则进行测试。",
    inputSchema: zodToJsonSchema(
      z.object({
        html: z.string().optional().describe("要解析的 HTML 字符串内容（如果提供了 url，则可省略此项）。"),
        url: z.string().optional().describe("要抓取并解析的目标网址（如果提供了 html，则优先使用 html）。"),
        rule: z.string().describe("drpy 规则语法字符串（例如 '.list li', 'a&&href', 'img&&data-src'）。"),
        mode: z.enum(["pdfa", "pdfh", "pd"]).describe("解析模式：'pdfa' (获取列表数组), 'pdfh' (获取 HTML/节点文本), 'pd' (获取并处理 URL 链接)。"),
        baseUrl: z.string().optional().describe("用于解析相对链接的 Base URL（通常与目标网址一致）。"),
        options: z.object({
          method: z.string().optional(),
          headers: z.record(z.string()).optional(),
          data: z.any().optional(),
        }).optional().describe("抓取 URL 时的请求选项（包含 method, headers, data）。"),
      })
    ),
  },
  {
    name: "get_spider_template",
    description: "获取创建新的 drpy JS 源文件的标准代码模板。无参数。",
    inputSchema: {
        type: "object",
        properties: {}
    },
  },
  {
    name: "get_drpy_libs_info",
    description: "获取 drpy 环境中可用的全局辅助函数和库的信息（例如 req, pd, pdfh, jsp 等的使用说明）。无参数。",
    inputSchema: {
        type: "object",
        properties: {}
    },
  },
  {
    name: "read_logs",
    description: "读取应用最近的运行日志。用于排查报错或系统运行状态。",
    inputSchema: {
      type: "object",
      properties: {
        lines: { type: "number", description: "要读取的日志行数（默认 50 行）。" }
      }
    }
  },
  {
    name: "sql_query",
    description: "在项目的数据库上执行只读 SQL 查询。用于诊断数据库数据。",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "要执行的 SQL 语句（如 'SELECT * FROM users LIMIT 10'）。" }
      },
      required: ["query"]
    }
  },
  {
    name: "manage_config",
    description: "读取或更新项目的配置信息（通常位于 config/env.json 中）。",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["get", "set"], description: "操作类型：'get' (读取) 或 'set' (更新)。" },
        key: { type: "string", description: "配置键名，支持点语法读取嵌套属性（例如 'system.timeout'）。执行 'get' 时若不传则返回全部配置。" },
        value: { type: "string", description: "要设置的值（当 action 为 'set' 时必填，支持 JSON 字符串形式）。" }
      },
      required: ["action"]
    }
  },
  {
    name: "validate_spider",
    description: "验证 drpy 爬虫源文件的正确性，包括语法检查和 Rule 对象结构验证。",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "相对于项目根目录的爬虫文件路径（例如 'spider/js/test.js'）。",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "check_syntax",
    description: "检查指定 JavaScript 文件的语法是否正确。",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "相对于项目根目录的 JS 文件路径。",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "get_resolved_rule",
    description: "获取 drpy 源在模板继承处理后的最终 rule 摘要，便于查看 class_parse、double、url、searchUrl 等关键字段的最终值。",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "相对于项目根目录的爬虫文件路径（例如 'spider/js/test.js'）。",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "restart_service",
    description: "重启 drpy-node 服务。通常在修改了核心配置后调用（假定使用 pm2 且进程名为 'drpys'）。无参数。",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "test_spider_interface",
    description: "测试指定源的某个接口（首页/一级/二级/搜索/播放）。通过 localDsCore 引擎调用 getEngine 来验证接口返回数据是否正确。支持 home、category、detail、search、play 五个接口的单独测试。",
    inputSchema: {
      type: "object",
      properties: {
        source_name: {
          type: "string",
          description: "源名称，对应 spider/js 目录下的文件名（不含 .js 后缀），例如 '360影视[官]'。",
        },
        interface: {
          type: "string",
          enum: ["home", "category", "detail", "search", "play"],
          description: "要测试的接口类型：home=首页(分类+推荐)，category=一级(分类列表)，detail=二级(详情)，search=搜索，play=播放。",
        },
        class_id: {
          type: "string",
          description: "一级测试时的分类ID（interface=category时使用）。默认 '1'。",
        },
        ext: {
          type: "string",
          description: "一级测试时的筛选参数（base64编码），可选。",
        },
        ids: {
          type: "string",
          description: "二级测试时的影片ID（interface=detail时使用）。多个ID用逗号分隔。",
        },
        keyword: {
          type: "string",
          description: "搜索测试的关键词（interface=search时使用）。默认 '斗罗大陆'。",
        },
        play_url: {
          type: "string",
          description: "播放测试的URL（interface=play时必填）。",
        },
        flag: {
          type: "string",
          description: "播放测试的来源标识（interface=play时可选）。",
        },
      },
      required: ["source_name", "interface"],
    },
  },
  {
    name: "evaluate_spider_source",
    description: "自动化全流程评估源的有效性。自动依次测试首页→一级→二级→搜索→播放，并自动从上级结果中提取下级所需参数（分类ID、影片ID、播放URL）。一级+二级+播放均通过即判定源有效，总分100分（首页20+一级20+二级25+播放25+搜索10）。",
    inputSchema: {
      type: "object",
      properties: {
        source_name: {
          type: "string",
          description: "源名称，对应 spider/js 目录下的文件名（不含 .js 后缀），例如 '360影视[官]'。",
        },
        class_id: {
          type: "string",
          description: "手动指定一级测试的分类ID（可选，默认从首页自动提取第一个分类）。",
        },
        keyword: {
          type: "string",
          description: "搜索测试的关键词（可选，默认 '斗罗大陆'。设为空字符串则跳过搜索测试）。",
        },
        timeout_seconds: {
          type: "number",
          description: "整体超时时间（秒），默认120秒。",
        },
      },
      required: ["source_name"],
    },
  },
  {
    name: "house_verify",
    description: "【仓库专用】验证仓库连接和 TOKEN 可用性。检查 config/env.json 中的 HOUSER_URL 和 HOUSE_TOKEN 配置，测试与仓库的连通性和 Token 有效性。在使用其他仓库工具前，建议先调用此工具确认配置正确。",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "house_file",
    description: "【仓库专用】DS源仓库文件管理工具，支持对仓库中的文件进行增删查改操作。通过 action 参数指定操作类型。配置要求：需在 config/env.json 中设置 HOUSE_TOKEN（必填）和 HOUSER_URL（可选，默认 http://183.87.133.60:5678/）。上传时会自动检测同名文件并走替换逻辑。",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "upload", "replace", "delete", "info", "toggle_visibility", "update_tags"],
          description: "操作类型：list=文件列表, upload=上传文件(自动检测同名替换), replace=按ID替换文件, delete=删除文件, info=获取文件元数据, toggle_visibility=切换公开/私密, update_tags=更新标签。",
        },
        path: {
          type: "string",
          description: "【upload/replace】要上传的文件路径（相对于 drpy-node 项目根目录，如 spider/js/测试.js）。",
        },
        file_id: {
          type: "number",
          description: "【replace/delete/toggle_visibility/update_tags】仓库中的文件记录 ID。",
        },
        cid: {
          type: "string",
          description: "【info】文件的 IPFS CID，用于查询元数据。",
        },
        search: {
          type: "string",
          description: "【list】按文件名搜索关键词。",
        },
        page: {
          type: "number",
          description: "【list】页码，默认 1。",
        },
        limit: {
          type: "number",
          description: "【list】每页数量，默认 20。",
        },
        tag: {
          type: "string",
          description: "【list】按标签筛选，逗号分隔。",
        },
        tags: {
          type: "string",
          description: "【upload/update_tags】标签，逗号分隔（如 'js,dr2'）或字符串数组。",
        },
        is_public: {
          type: "boolean",
          description: "【upload】是否公开，默认 true。",
        },
        auto_replace: {
          type: "boolean",
          description: "【upload】是否自动检测同名文件并替换（默认 true）。设为 false 则始终新建上传。",
        },
        uploader: {
          type: "string",
          description: "【list】按上传者 ID 筛选，逗号分隔。",
        },
      },
      required: ["action"],
    },
  },
];
