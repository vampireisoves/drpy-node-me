# 构建器阶段
# 使用node:22-slim作为基础镜像(17 < version < 23)
FROM node:22-slim AS builder

# 安装必要的系统依赖和 Puppeteer 依赖
RUN apt-get update && apt-get install -y \
    make python3 python3-pip build-essential \
    tar unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# 创建一个工作目录
WORKDIR /app

# 克隆GitHub仓库到工作目录
COPY . /app
RUN sed -i 's|const shell = os.platform() === '"'"'win32'"'"' ? '"'"'powershell.exe'"'"' : '"'"'bash'"'"'|const shell = os.platform() === '"'"'win32'"'"' ? '"'"'powershell.exe'"'"' : '"'"'sh'"'"'|g' /app/index.js || true
RUN rm -rf drpy-node-admin drpy-node-bundle drpy-node-mcp drpy2-quickjs

# 安装项目依赖项和puppeteer
RUN yarn && yarn add puppeteer

# 复制工作目录中的所有文件到一个临时目录中
# 以便在运行器阶段中使用
RUN mkdir -p /tmp/drpys && \
    cp -r /app/. /tmp/drpys/


# 运行器阶段
# 使用debian:bookworm-slim作为基础镜像来创建一个较小的镜像
FROM debian:bookworm-slim AS runner

# 创建一个工作目录
WORKDIR /app

# 复制构建器阶段中准备好的文件和依赖项到运行器阶段的工作目录中
COPY --from=builder /tmp/drpys/. /app

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    nodejs \
    python3 python3-venv \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 配置环境和应用
RUN cp /app/.env.development /app/.env && \
    rm -f /app/.env.development && \
    sed -i 's|^VIRTUAL_ENV[[:space:]]*=[[:space:]]*$|VIRTUAL_ENV=/app/.venv|' /app/.env && \
    sed -i 's|^ENABLE_TERMINAL=0|ENABLE_TERMINAL=1|' /app/.env && \
    sed -i 's|^enable_php=.*|enable_php=2|' /app/.env && \
    echo '{"ali_token":"","ali_refresh_token":"","quark_cookie":"","uc_cookie":"","bili_cookie":"","thread":"10","enable_dr2":"1","enable_py":"2"}' > /app/config/env.json

# 激活python3虚拟环境并安装requirements依赖
RUN python3 -m venv /app/.venv && \
    . /app/.venv/bin/activate && \
    pip3 install -r /app/spider/py/base/requirements.txt

# 暴露应用程序端口（根据您的项目需求调整）
EXPOSE 5757

# 指定容器启动时执行的命令
CMD ["node", "index.js"]
