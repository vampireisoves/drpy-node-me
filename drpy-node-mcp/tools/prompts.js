export const prompts = [
  {
    name: "create_spider_source",
    description: "根据网站创建 drpy DS 爬虫源",
    argsSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "目标网站地址" },
        source_name: { type: "string", description: "可选，源名称" },
      },
      required: ["url"],
    },
  },
  {
    name: "analyze_website",
    description: "分析网站结构，为写源提供参考",
    argsSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "目标网站地址" },
      },
      required: ["url"],
    },
  },
  {
    name: "debug_selector",
    description: "调试 CSS 选择器/规则",
    argsSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "目标页面地址" },
        rule: { type: "string", description: "测试规则" },
        mode: { type: "string", description: "pdfa/pdfh/pd" },
      },
      required: ["url", "rule"],
    },
  },
  {
    name: "debug_play_link",
    description: "调试播放页链接提取逻辑",
    argsSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "播放页 URL" },
      },
      required: ["url"],
    },
  },
  {
    name: "extract_filter",
    description: "提取分类页筛选条件为 drpy filter 配置",
    argsSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "分类页 URL" },
      },
      required: ["url"],
    },
  },
  {
    name: "test_interface",
    description: "测试爬虫源单个接口",
    argsSchema: {
      type: "object",
      properties: {
        source_name: { type: "string", description: "源名称" },
        interface: { type: "string", description: "home/category/detail/search/play" },
        keyword: { type: "string", description: "搜索关键词" },
        ids: { type: "string", description: "详情 ID" },
        play_url: { type: "string", description: "播放 URL" },
      },
      required: ["source_name", "interface"],
    },
  },
  {
    name: "evaluate_source",
    description: "全流程评估爬虫源有效性",
    argsSchema: {
      type: "object",
      properties: {
        source_name: { type: "string", description: "源名称" },
        keyword: { type: "string", description: "搜索关键词" },
      },
      required: ["source_name"],
    },
  },
  {
    name: "debug_spider_source",
    description: "调试爬虫源问题",
    argsSchema: {
      type: "object",
      properties: {
        source_name: { type: "string", description: "源名称" },
        issue: { type: "string", description: "问题描述" },
      },
      required: ["source_name"],
    },
  },
  {
    name: "fetch_url",
    description: "测试 URL 连通性和响应内容",
    argsSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "目标 URL" },
      },
      required: ["url"],
    },
  },
  {
    name: "list_all_sources",
    description: "列出所有爬虫源文件",
    argsSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "write_ds_guide",
    description: "获取 DS 源编写完整指南",
    argsSchema: {
      type: "object",
      properties: {
        lang: { type: "string", description: "语言，zh/en" },
      },
    },
  },
  {
    name: "get_drpy_api_docs",
    description: "获取 drpy-node API 文档和开发参考",
    argsSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "system_health_check",
    description: "检查 drpy-node 系统运行状态",
    argsSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "manage_service",
    description: "管理 drpy-node 服务",
    argsSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "config/restart/logs" },
      },
      required: ["action"],
    },
  },
];

export const promptHandlers = {
  create_spider_source: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请帮我为以下网站创建 drpy DS 爬虫源：`,
            ``,
            `网站地址：${args.url}${args.source_name ? `\n源名称：${args.source_name}` : ''}`,
            ``,
            `⚠️ 优先级规则：如果当前环境已安装本地 drpy-node 专项 Skill（如 drpy-node-source-create / drpy-node-source-workflow / drpy-node-play-debug），必须优先遵循 Skill 的工作流、约束与命名习惯；本通用 MCP prompt 仅作为未安装 Skill 时的基础兜底流程，不得覆盖或降级 Skill。`,
            `⚠️ 如果用户只提供网址、未提供文件名，应优先按本地 Skill 的约定自行分析站点并推导合适的源名，而不是机械套用通用流程。`,
            ``,
            `请严格按照以下分步流程操作，每一步都要用工具验证后再进入下一步：`,
            ``,
            `**第 1 步：获取编写规范**`,
            `用 get_claw_ds_skill 获取 DS 源自动生成的完整编写规范和避坑指南`,
            ``,
            `**第 2 步：分析网站结构**`,
            `用 analyze_website_structure 分析网站 HTML DOM 结构`,
            `用 guess_spider_template 检测是否匹配内置模板（mx/mxpro/首图/首图2等）`,
            `⚠️ 如果网站使用了现代前端框架（React/Vue/Tailwind），绝对不要继承内置模板`,
            ``,
            `**第 3 步：模板站先做继承核查**`,
            `如果命中模板，先用 get_resolved_rule 查看模板继承后的最终关键字段（class_parse、double、url、searchUrl、一级、搜索）`,
            `⚠️ 不要在没看最终继承结果前就急着手写 一级/搜索/推荐/二级`,
            `优先判断：`,
            `- class_name/class_url 是否被残留 class_parse 覆盖`,
            `- double 是否导致首页推荐为空`,
            `- url/searchUrl 是否与真实网页和翻页结构一致`,
            `- 模板内置规则是否已经够用`,
            ``,
            `**第 4 步：测试分类选择器**`,
            `用 debug_spider_rule 的 pdfa 模式测试列表选择器（如 '.module-items .module-item'）`,
            `⚠️ pdfa 只接受纯 CSS 选择器，不能包含分号 ; 分隔的多段规则`,
            `再用 pdfh 模式测试标题、图片、链接等属性提取（如 'a&&title'）`,
            ``,
            `**第 5 步：提取筛选配置（如有）**`,
            `如果网站分类页有筛选条件，用 extract_website_filter 提取，设置 gzip: true 获取压缩格式`,
            ``,
            `**第 6 步：编写并保存源文件**`,
            `用 get_spider_template 获取标准代码模板`,
            `根据前面分析结果编写完整 rule 对象`,
            `⚠️ 命中模板时，优先最小覆盖，不要一上来手写大量字段`,
            `用 write_file 保存新文件到 spider/js/ 目录。如需修改已有文件，优先用 edit_file（operation: replace_text，按文本搜索替换，无需行号）`,
            `✅ 操作爬虫源、规则、JS 代码文件时，必须优先使用 MCP 的 write_file/edit_file 而非 IDE 内置工具（因为支持 DS 解密、语法校验等专属能力）`,
            `⚠️ write_file/edit_file 仅限操作 drpy-node 项目内的代码文件（.js/.json 等），禁止写入 .md/.txt 等文档文件！文档请使用 IDE 内置工具！`,
            ``,
            `**第 7 步：验证和测试**`,
            `用 check_syntax 检查 JS 语法`,
            `用 validate_spider 检查 rule 结构`,
            `用 get_resolved_rule 再次确认最终继承结果是否符合预期`,
            `用 evaluate_spider_source 全流程自动化评估`,
          ].join('\n'),
        },
      },
    ],
  }),
  analyze_website: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请分析以下网站的结构，为编写爬虫源提供全面的参考信息：`,
            ``,
            `网站地址：${args.url}`,
            ``,
            `⚠️ 优先级规则：如果当前环境已安装本地 drpy-node 写源相关 Skill，应优先按 Skill 的分析流程执行；本通用分析 prompt 仅作无 Skill 时的兜底，不得替代本地 Skill。`,
            ``,
            `请依次执行以下操作：`,
            ``,
            `1. 用 analyze_website_structure 获取精简 DOM 结构`,
            `2. 用 guess_spider_template 检测是否匹配内置模板（返回模板名称和置信度）`,
            `3. 如果命中模板，再用 get_resolved_rule（针对已有源时）或结合模板定义判断最终继承风险点`,
            `4. 用 fetch_spider_url 检查网站响应头（关注编码、反爬机制）`,
            `5. 如果 URL 是分类页，用 extract_website_filter 尝试提取筛选配置`,
            ``,
            `综合分析后请给出：`,
            `- 网站使用的 CMS/框架类型`,
            `- 推荐的写源方案（使用内置模板 or 全量手写）`,
            `- 关键 DOM 选择器（分类列表、影片卡片、标题、图片、链接）`,
            `- 是否存在筛选条件`,
            `- 如果命中模板，应优先检查哪些字段（class_parse / double / url / searchUrl）`,
          ].join('\n'),
        },
      },
    ],
  }),
  debug_selector: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请帮我调试以下选择器规则：`,
            ``,
            `目标页面：${args.url}`,
            `测试规则：${args.rule}`,
            `解析模式：${args.mode || 'pdfh（请根据实际情况选择 pdfa/pdfh/pd）'}`,
            ``,
            `请按以下步骤操作：`,
            ``,
            `1. 先用 debug_spider_rule 测试当前规则，查看返回结果`,
            `2. 如果结果不正确，用 analyze_website_structure 查看页面 DOM 结构`,
            `3. 根据实际 DOM 调整选择器，再次用 debug_spider_rule 验证`,
            `4. 重复直到提取结果正确`,
            ``,
            `⚠️ 重要提示：`,
            `- pdfa 模式：只能用纯 CSS 选择器（如 '.module-items .module-item'），不能用分号`,
            `- pdfh 模式：可以用 && 语法（如 'a&&title'、'img&&data-src'）`,
            `- pd 模式：用于提取 URL 链接，会自动补全为完整 URL`,
            `- 支持 || 备选语法和 :eq(n) 索引选择`,
          ].join('\n'),
        },
      },
    ],
  }),
  debug_play_link: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请帮我调试播放页的链接提取逻辑：`,
            ``,
            `播放页 URL：${args.url}`,
            ``,
            `请按以下步骤操作：`,
            ``,
            `1. 用 analyze_website_structure 分析播放页的 DOM 结构，找到播放器区域`,
            `2. 用 extract_iframe_src 提取播放页中的 iframe 地址`,
            `3. 用 fetch_spider_url 测试 iframe 地址的连通性和响应内容`,
            `4. 如果 iframe 中包含 .m3u8/.mp4 直链，可以用 debug_spider_rule 的 pd 模式验证`,
            ``,
            `根据分析结果，给出 lazy 函数的编写建议：`,
            `- 如果能直接获取直链 → lazy 返回 { parse: 0, url: '直链' }`,
            `- 如果需要二次解析 → lazy 返回 { parse: 1, url: '解析页' }`,
            `- 如果需要 js 代码执行 → 使用 js: 字符串形式（切记要包含 return input;）`,
            `- 注意区分直链 / 站外解析链接 / 网站播放页本身，不要把 parse:1 一概判错`,
          ].join('\n'),
        },
      },
    ],
  }),
  extract_filter: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请从以下网站分类页提取筛选条件，生成 drpy 规则格式的 filter 配置：`,
            ``,
            `分类页 URL：${args.url}`,
            ``,
            `请按以下步骤操作：`,
            ``,
            `1. 用 extract_website_filter 提取筛选配置（设置 gzip: true 获取压缩格式）`,
            `2. 如果有多个分类页的筛选需要聚合，使用 urls 数组参数批量提取`,
            `3. 展示提取到的筛选结构（分类、地区、年份等维度）`,
            `4. 给出 filter_url 的拼接规则（如 '{{fl.class}}-{{fl.area}}-{{fl.year}}'）`,
            `5. 如果所有分类的筛选完全一致，用 '*' 作为 key 简化代码`,
            ``,
            `⚠️ 筛选配置必须使用工具提取，不要主观捏造！`,
          ].join('\n'),
        },
      },
    ],
  }),
  test_interface: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请帮我测试爬虫源「${args.source_name}」的 ${args.interface} 接口：`,
            ``,
            `接口类型：${args.interface}${args.keyword ? `\n搜索关键词：${args.keyword}` : ''}${args.ids ? `\n影片 ID：${args.ids}` : ''}${args.play_url ? `\n播放 URL：${args.play_url}` : ''}`,
            ``,
            `请用 test_spider_interface 工具进行测试，参数说明：`,
            `- home：测试首页分类和推荐数据`,
            `- category：测试一级分类列表（需要 class_id，默认 '1'）`,
            `- detail：测试二级详情页（需要 ids，多个用逗号分隔）`,
            `- search：测试搜索功能（需要 keyword）`,
            `- play：测试播放链接（需要 play_url）`,
            ``,
            `如果测试失败：`,
            `1. 读取源文件检查相关代码`,
            `2. 用 read_logs 查看错误日志`,
            `3. 模板站先用 get_resolved_rule 查看最终继承结果`,
            `4. 用 debug_spider_rule 验证选择器是否正确`,
            `5. 给出修复建议`,
          ].join('\n'),
        },
      },
    ],
  }),
  evaluate_source: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请全流程评估爬虫源「${args.source_name}」的有效性。${args.keyword ? `\n搜索关键词：${args.keyword}` : ''}`,
            ``,
            `请使用 evaluate_spider_source 工具进行自动化评估。`,
            `评估流程：首页(20分) → 一级(20分) → 二级(25分) → 播放(25分) → 搜索(10分)，总分 100 分。`,
            `一级 + 二级 + 播放全部通过 = 源有效。`,
            ``,
            `评估完成后：`,
            `- 列出各接口的通过/失败状态和得分`,
            `- 如果有失败的接口，用 read_file 读取源码分析原因`,
            `- 模板站失败时，优先用 get_resolved_rule 检查最终继承字段，不要立刻乱手写`,
            `- 给出具体的修复建议和修改后的代码`,
          ].join('\n'),
        },
      },
    ],
  }),
  debug_spider_source: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请帮我调试爬虫源「${args.source_name}」的问题。${args.issue ? `\n问题描述：${args.issue}` : ''}`,
            ``,
            `⚠️ 优先级规则：如果当前环境已安装本地 drpy-node 调试相关 Skill（如 drpy-node-source-workflow / drpy-node-play-debug），必须优先按 Skill 排障；本通用 MCP 调试 prompt 仅作无 Skill 时的兜底。`,
            ``,
            `请按以下步骤排查：`,
            ``,
            `1. 用 read_file 读取源文件查看当前代码（自动解密 DS 格式）`,
            `2. 用 read_logs 查看最近日志，搜索与该源相关的错误`,
            `3. 用 check_syntax 检查 JS 语法是否正确`,
            `4. 用 validate_spider 检查 rule 对象结构是否完整`,
            `5. 如果是模板站，先用 get_resolved_rule 查看最终继承结果（class_parse、double、url、searchUrl、一级、搜索）`,
            `6. 按顺序排查模板继承问题：`,
            `   - 先查 class_parse 是否覆盖静态分类`,
            `   - 再查 double 是否导致推荐为空`,
            `   - 再查真实 url/searchUrl 是否写对`,
            `   - 再决定是否删掉手写 一级/搜索 回到模板内置`,
            `7. 用 test_spider_interface 逐个测试接口，定位具体失败的环节：`,
            `   - home → category → detail → search → play`,
            `8. 对失败的接口，用 debug_spider_rule 验证选择器`,
            `9. 修复代码后保存（edit_file/write_file 仅限 drpy-node 项目内代码文件，禁止操作 .md/.txt 等文档）：`,
            `   - 小改动：用 edit_file（operation: replace_text，搜索旧文本并替换）`,
            `   - 搜索文本应尽量长且精确，确保在文件中唯一匹配`,
            `   - 需要按行号精确修改：先用 find_in_file 搜索关键词获取行号，再用 edit_file（operation: replace_lines/delete_lines）`,
            `   - 行号操作单次最多影响200行，超过请用 write_file`,
            `   - 大改动：用 write_file 覆写整个文件`,
            `10. 再次测试确认修复成功`,
            ``,
            `⚠️ 关键纪律：`,
            `- 不要把模板问题、入口问题、评估器串联问题误判成选择器问题`,
            `- 不要在没验证模板内置规则前，就大面积手写覆盖`,
            `- 自动评估失败时，先拆接口，不要直接判源死`,
          ].join('\n'),
        },
      },
    ],
  }),
  fetch_url: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请帮我测试以下 URL 的连通性和响应内容：`,
            ``,
            `目标 URL：${args.url}`,
            ``,
            `请按以下步骤操作：`,
            ``,
            `1. 用 fetch_spider_url 测试默认 GET 请求，查看：`,
            `   - HTTP 状态码`,
            `   - 响应头（Content-Type、编码、Set-Cookie 等）`,
            `   - 响应内容是否正常返回`,
            `2. 如果返回 403/反爬，尝试添加 User-Agent 或 Referer 头`,
            `3. 如果编码乱码，分析是否需要特殊处理`,
            `4. 用 analyze_website_structure 查看精简后的 DOM 结构`,
          ].join('\n'),
        },
      },
    ],
  }),
  list_all_sources: () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请帮我查看当前项目中所有的爬虫源文件：`,
            ``,
            `1. 用 list_sources 列出 spider/js 和 spider/catvod 目录下的所有源文件`,
            `2. 用 list_directory 查看 spider/js 目录结构`,
            `3. 如果需要查看某个源的内容，用 read_file 读取（自动解密 DS 格式）`,
          ].join('\n'),
        },
      },
    ],
  }),
  write_ds_guide: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请获取 DS 源编写的完整指南和规范：`,
            ``,
            `语言：${args.lang || 'zh'}`,
            ``,
            `⚠️ 优先级规则：如果当前环境已安装本地 drpy-node 专项 Skill，本通用指南必须服从本地 Skill 约束；本 prompt 的主要用途是为未安装 Skill 的环境提供基础说明。`,
            ``,
            `请依次获取以下参考资料：`,
            ``,
            `1. 用 get_claw_ds_skill 获取 DS 源自动生成的完整提示词和分步流程指南`,
            `2. 用 get_spider_template 获取标准爬虫源代码模板`,
            `3. 用 get_drpy_libs_info 获取可用的全局辅助函数列表（request、log、setItem 等）`,
            `4. 用 get_resolved_rule 理解模板继承后最终 rule 的关键字段查看方式`,
            ``,
            `获取后请整理为清晰的参考文档，包含：`,
            `- 分步开发流程（6 步拟人化流程）`,
            `- 规则语法说明（选择器、属性、特殊语法）`,
            `- 模板继承使用场景`,
            `- 模板站排障顺序（class_parse → double → url/searchUrl → 模板内置优先）`,
            `- async function 编写注意事项（this 上下文解构）`,
            `- lazy 函数的 parse/jx 参数含义`,
            `- 常见避坑指南`,
          ].join('\n'),
        },
      },
    ],
  }),
  get_drpy_api_docs: () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请获取 drpy-node 的完整 API 文档和开发参考：`,
            ``,
            `1. 用 get_drpy_api_list 获取所有 API 接口列表（含参数和返回示例）`,
            `2. 用 get_drpy_libs_info 获取爬虫源中可用的全局辅助函数和库`,
            `3. 用 get_routes_info 查看当前注册的路由和控制器信息`,
            `4. 用 get_resolved_rule 了解模板继承处理后的最终 rule 摘要能力`,
            ``,
            `请整理为结构化的参考文档。`,
          ].join('\n'),
        },
      },
    ],
  }),
  system_health_check: () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请全面检查 drpy-node 系统的运行状态：`,
            ``,
            `1. 用 read_logs 查看最近的应用日志，重点关注 ERROR 和 WARN 级别信息`,
            `2. 用 get_routes_info 检查路由注册情况，确认 API 端点正常`,
            `3. 用 manage_config 查看当前配置（超时、端口等）`,
            `4. 用 sql_query 检查数据库状态（如 SELECT count(*) FROM source_caches）`,
            ``,
            `如果发现异常，请给出具体的诊断建议和修复方案。`,
          ].join('\n'),
        },
      },
    ],
  }),
  manage_service: (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `请帮我管理 drpy-node 服务：`,
            ``,
            `操作类型：${args.action}`,
            ``,
            `根据操作类型执行：`,
            ``,
            `- **config**：用 manage_config 查看当前配置，如需修改某个配置项，先获取再设置`,
            `- **restart**：用 restart_service 重启 drpy-node 服务（通过 pm2），重启后用 read_logs 确认启动成功`,
            `- **logs**：用 read_logs 查看最近 50 行日志，分析是否有错误`,
            ``,
            `⚠️ 修改配置后需要重启服务才能生效。`,
          ].join('\n'),
        },
      },
    ],
  }),
};
