#!/bin/bash

# 定义颜色
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
PH='\033[35m'
QS='\033[36m'
NC='\033[0m' # No Color

# 检查当前用户是否为root用户
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}错误：此脚本需要以root用户身份运行。${NC}"
    exit 1
fi

# 确认提示
echo -e "${PH}======================================================================${NC}"
echo -e "${PH}  警告：此脚本只适用于群晖、Debian系列系统（包含Ubuntu、Fnos）。${NC}"
echo -e "${YELLOW}  警告：群晖NAS自行安装node套件后使用！！！${NC}"
echo -e "${GREEN}  警告：脚本自动更新需要自行添加任务计划设定运行时间！！！${NC}"
echo -e "${PH}======================================================================${NC}"
echo -ne "${PH}您是否理解并同意继续？(y/n) 默认10秒后确认(y): ${NC}"
read -t 10 confirm
confirm=${confirm:-"y"}
if [[ "$confirm" != "y" ]]; then
    echo -e "${RED}用户取消操作。${NC}"
    exit 1
fi
echo

# 检查是否为群晖系统
is_syno_system() {
    # 群晖系统通常会有 /etc.defaults/VERSION 文件
    if [ -f /etc.defaults/VERSION ]; then
        return 0
    else
        return 1
    fi
}

# 检查是否为群晖系统
if is_syno_system; then
    echo -e "${QS}检测到群晖系统，跳过apt检查。${NC}"
else
    # 检查系统是否支持apt
    if ! command -v apt >/dev/null 2>&1; then
        echo -e "${GREEN}错误：不支持的系统。${NC}"
        exit 1
    fi
fi

# 检查Node.js版本
check_node_version() {
    local node_version=$(node -v)
    if [[ "$node_version" < "v20.0.0" ]]; then
        echo -e "${YELLOW}Node.js版本低于20.0.0，正在安装Node.js v20以上版本...${NC}"
        install_node_v20
        npm config set registry https://registry.npmmirror.com
    else
        echo -e "${GREEN}Node.js版本符合要求（v20以上），跳过安装。${NC}"
    fi
}

# 安装Node.js v20以上版本
install_node_v20() {
    echo -e "${YELLOW}正在安装NVM...${NC}"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh  | bash

    # 启用NVM
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    # 安装Node.js 20.18.1
    echo -e "${YELLOW}正在安装Node.js 20.18.1...${NC}"
    nvm install 20.18.1

    # 设置默认Node.js版本
    nvm alias default 20.18.1

    echo -e "${GREEN}Node.js 20.18.1安装完成。${NC}"
}

# 检查NVM是否存在，如果不存在则安装
if command -v nvm >/dev/null 2>&1; then
    echo -e "${GREEN}NVM已安装，跳过NVM安装。${NC}"
else
    echo -e "${YELLOW}NVM未安装，正在安装NVM...${NC}"
    curl -o- https://gitee.com/RubyMetric/nvm-cn/raw/main/install.sh | bash
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
    echo -e "${GREEN}NVM安装完成。${NC}"
fi

# 安装Yarn和PM2
install_yarn_and_pm2() {
    if command -v yarn >/dev/null 2>&1; then
        echo -e "${GREEN}Yarn已安装，跳过Yarn安装。${NC}"
        yarn config set registry https://registry.yarnpkg.com
    else
        echo -e "${YELLOW}Yarn未安装，正在安装Yarn...${NC}"
        nvm install-node # 安装最新版本的Node.js，自动选择大于v20的版本
        nvm use default
        npm install -g yarn
        yarn config set registry https://registry.yarnpkg.com
        if [ $? -ne 0 ]; then
            echo -e "${RED}Yarn安装失败，请手动安装Yarn后重试。${NC}"
            exit 1
        fi
        echo -e "${GREEN}Yarn安装成功。${NC}"
    fi

    if command -v pm2 >/dev/null 2>&1; then
        echo -e "${GREEN}PM2已安装，跳过PM2安装。${NC}"
    else
        echo -e "${YELLOW}PM2未安装，正在安装PM2...${NC}"
        npm install -g pm2
        if [ $? -ne 0 ]; then
            echo -e "${RED}PM2安装失败，请手动安装PM2后重试。${NC}"
            exit 1
        fi
        echo -e "${GREEN}PM2安装成功。${NC}"
    fi
}

# 执行Node.js版本检查
check_node_version

# 安装Yarn和PM2
install_yarn_and_pm2

# 提示用户输入需要创建的目录，30秒后自动使用当前目录
echo -ne "${PH}请输入需要创建的目录路径（30秒内无输入则使用当前目录）:${NC}"
read -t 30 dir_path
echo
# 根据用户输入设置目录
if [[ -n $dir_path ]]; then
    mkdir -p "$dir_path" && cd "$dir_path"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}目录 '$dir_path' 创建并进入成功。${NC}"
        REPO_DIR="$dir_path"
    else
        echo -e "${RED}目录 '$dir_path' 创建失败，使用当前目录。${NC}"
        REPO_DIR=$(pwd)
    fi
else
    echo -e "${YELLOW}已超时，使用当前目录：$(pwd)"
    REPO_DIR=$(pwd)
fi

# 远程仓库地址
REMOTE_REPO="https://github.com/hjdhnx/drpy-node.git"

# 代理远程仓库地址
echo -e "${YELLOW}如果拉取不顺利，请在脚本中找到$REMOTE_REPO自行注释修改为kk代理地址${NC}"
#REMOTE_REPO="https://kkgithub.com/hjdhnx/drpy-node.git"

# 项目名称
PROJECT_NAME="drpy-node"

# 获取设备IP地址
get_device_ip() {
    # 使用curl获取公网IP地址
    # 这里使用的是ipinfo.io服务，你也可以使用其他服务
    IP=$(curl -s https://ipinfo.io/ip)
    if [ $? -eq 0 ]; then
        echo -e "${QS}=        设备IP地址：$IP${NC}"
        echo -e "${QS}=           公网IP自行打码${NC}"
        return 0
    else
        echo -e "${RED}无法获取设备IP地址。${NC}"
        return 1
    fi
}

# 获取设备局域网IP地址
get_local_ip() {
    # 使用ip命令获取局域网IP地址
    local ip=$(ip addr show scope global | grep inet | grep -v inet6 | grep -v '127.0.0.1' | awk '{print $2}' | cut -d/ -f1 | head -n1)
    if [ -n "$ip" ]; then
        echo -e "$ip"
    else
        echo -e "${RED}无法获取局域网IP地址。${NC}"
        exit 1
    fi
}

# 获取局域网IP地址
LOCAL_IP=$(get_local_ip)

# 定义创建env.json文件的函数
create_env_json() {
    local env_json_path="$1/config/env.json"
    
    # 检查env.json文件是否存在
    if [ ! -f "$env_json_path" ]; then
        echo -e "${YELLOW}env.json文件不存在，正在创建...${NC}"
        # 创建env.json文件并填充默认内容
        cat > "$env_json_path" <<EOF
{
  "ali_token": "",
  "ali_refresh_token": "",
  "quark_cookie": "",
  "uc_cookie": "",
  "bili_cookie": "",
  "thread": "10",
  "enable_dr2": "1",
  "enable_py": "2"
}
EOF
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}env.json文件创建成功。${NC}"
        else
            echo -e "${RED}env.json文件创建失败。${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}env.json文件已存在，无需创建。${NC}"
    fi
}

# 定义创建.env文件的函数
create_default_env() {
    local env_path="$1/.env"
    local env_development_path="$1/.env.development"
    
    # 检查.env文件是否存在
    if [ ! -f "$env_path" ]; then
        echo -e "${YELLOW}.env文件不存在，正在使用.env.development作为模板创建...${NC}"
        # 使用.env.development作为模板创建.env文件
        cp "$env_development_path" "$env_path"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}.env文件创建成功。${NC}"
        else
            echo -e "${RED}.env文件创建失败。${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}.env文件已存在，无需创建。${NC}"
    fi
}

# 定义初始化.env文件的函数
initialize_default_env() {
    local env_path="$1/.env"
    local env_development_path="$1/.env.development"
    
    # 检查.env文件是否存在
    if [ ! -f "$env_path" ]; then
        echo -e "${YELLOW}.env文件不存在，正在使用.env.development作为模板创建...${NC}"
        # 提示用户输入自定义值，并设置30秒超时
        echo -ne "${YELLOW}请输入网盘入库密码（30秒内无输入则使用默认值'drpys'直接回车可跳过）：${NC}"
        read -t 30 cookie_auth_code
        echo
        if [ -z "$cookie_auth_code" ]; then
            cookie_auth_code="drpys"
        fi

        echo -ne "${YELLOW}请输入登录用户名（30秒内无输入则使用默认值'admin'直接回车可跳过）：${NC}"
        read -t 30 api_auth_name
        echo
        if [ -z "$api_auth_name" ]; then
            api_auth_name="admin"
        fi

        echo -ne "${YELLOW}请输入登录密码（30秒内无输入则使用默认值'drpys'直接回车可跳过）：${NC}"
        read -t 30 api_auth_code
        echo
        if [ -z "$api_auth_code" ]; then
            api_auth_code="drpys"
        fi

        echo -ne "${YELLOW}请输入订阅PWD值（30秒内无输入则使用默认值'dzyyds'直接回车可跳过）：${NC}"
        read -t 30 api_pwd
        echo
        if [ -z "$api_pwd" ]; then
            api_pwd="dzyyds"
        fi

        # 使用.env.development作为模板创建.env文件，并替换自定义值
        cp "$env_development_path" "$env_path"
        if [ $? -eq 0 ]; then
            sed -i "s|COOKIE_AUTH_CODE = .*|COOKIE_AUTH_CODE = $cookie_auth_code|g" "$env_path"
            sed -i "s|API_AUTH_NAME = .*|API_AUTH_NAME = $api_auth_name|g" "$env_path"
            sed -i "s|API_AUTH_CODE = .*|API_AUTH_CODE = $api_auth_code|g" "$env_path"
            sed -i "s|API_PWD = .*|API_PWD = $api_pwd|g" "$env_path"
            echo -e "${GREEN}.env文件创建成功。"
        else
            echo -e "${RED}.env文件创建失败。${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}.env文件已存在，无需创建。${NC}"
    fi
}

# 定义读取.env文件参数的函数
read_env_params() {
    # 读取.env文件中的参数值，考虑等号前后的空格
    COOKIE_AUTH_CODE=$(grep '^COOKIE_AUTH_CODE' .env | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | cut -d'=' -f2)
    API_AUTH_NAME=$(grep '^API_AUTH_NAME' .env | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | cut -d'=' -f2)
    API_AUTH_CODE=$(grep '^API_AUTH_CODE' .env | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | cut -d'=' -f2)
    API_PWD=$(grep '^API_PWD' .env | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | cut -d'=' -f2)

    # 输出参数值
    echo -e "${QS}=         当前登录账户$API_AUTH_NAME${NC}                 "
    echo -e "${QS}=         当前登录密码$API_AUTH_CODE${NC}                  "
    echo -e "${QS}=         当前入库密码$COOKIE_AUTH_CODE${NC}                 "
    echo -e "${QS}=         当前订阅pwd值$API_PWD${NC}                 "
}


# IP显示标识
has_displayed_ip=""
# 显示内网和公网访问地址
display_ip_addresses() {
    echo -e "${QS}==================================================${NC}"
    echo -e "${QS}=         项目主页及相关默认值提示${NC}            "
    echo -e "${QS}= 内网访问地址：http://$LOCAL_IP:5757${NC}     "
    # 调用read_env_params函数来显示.env中的值
    read_env_params
    echo -e "${QS}= ${YELLOW}如需修改以上密码值则自行修改源码根目录.env文件${NC}                 "
    get_device_ip
    if [ $? -eq 0 ]; then
        echo -e "${QS}= 公网主页地址：http://$IP:5757${NC}"
        echo -e "${QS}==================================================${NC}"
    else
        echo -e "${RED}无法获取公网IP地址。${NC}"
    fi
}

# 检查项目drpy-node是否存在
if [ -d "$REPO_DIR/$PROJECT_NAME" ]; then
    echo -e "${YELLOW}项目drpy-node存在，跳过克隆步骤，直接执行更新脚本。${NC}"
    cd "$REPO_DIR/$PROJECT_NAME"
else
    echo -e "${YELLOW}项目drpy-node不存在，正在从GitHub克隆项目...${NC}"
    git clone $REMOTE_REPO "$REPO_DIR/$PROJECT_NAME"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}项目drpy-node克隆成功。${NC}"
        cd "$REPO_DIR/$PROJECT_NAME"
        # 克隆后创建env.json和.env文件
        create_env_json "$REPO_DIR/$PROJECT_NAME"
        initialize_default_env "$REPO_DIR/$PROJECT_NAME" # 调用初始化.env文件的函数
        echo -e "${YELLOW}正在执行yarn..."
        yarn config set registry https://registry.npmmirror.com/
        yarn
        echo -e "${GREEN}yarn执行成功，开始安装python环境...${NC}"
        python3 -m venv $REPO_DIR/$PROJECT_NAME/.venv
        source $REPO_DIR/$PROJECT_NAME/.venv/bin/activate
        VIRTUAL_ENV=$REPO_DIR/$PROJECT_NAME/.venv
        pip install -r spider/py/base/requirements.txt -i https://mirrors.cloud.tencent.com/pypi/simple
        echo -e "${GREEN}python执行成功，开始启动项目...${NC}"
        pm2 start index.js --name drpyS
        pm2 save
        pm2 startup
        echo -e "${PH}尝试设置开机自动启动pm2项目，不一定成功，如果以下提示有命令请自行手动输入以确保正常开机启动${NC}"
        if [ -z "$has_displayed_ip" ]; then # 检查是否已经显示过IP地址
        display_ip_addresses
            has_displayed_ip=1 # 设置一个标志，表示已经显示过IP地址
        fi
        exit 1
    else
        echo -e "${RED}项目drpy-node克隆失败，请检查网络连接或仓库地址是否正确。${NC}"
        exit 1
    fi
fi

# 定义备份函数
backup_files() {
    # 备份前先检查文件是否存在，不存在则自动创建
        create_env_json "$REPO_DIR/$PROJECT_NAME"
        create_default_env "$REPO_DIR/$PROJECT_NAME"
    # 备份env.json文件
    local env_json_backup_file="env.json.backup_$(date +%Y%m%d).json"
    echo -e "${YELLOW}正在备份env.json文件...${NC}"
    cp "config/env.json" "./$env_json_backup_file"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}env.json文件已备份为 $env_json_backup_file${NC}"
    else
        echo -e "${RED}备份env.json文件失败。${NC}"
        exit 1
    fi

    # 备份.env文件
    local env_backup_file=".env.backup_$(date +%Y%m%d)"
    echo -e "${YELLOW}正在备份.env文件...${NC}"
    cp ".env" "./$env_backup_file"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}.env文件已备份为 $env_backup_file${NC}"
    else
        echo -e "${RED}备份.env文件失败。${NC}"
        exit 1
    fi
    
    # 备份map.txt文件
    local map_txt_path="$REPO_DIR/$PROJECT_NAME/config/map.txt"
    local map_txt_backup_file="map.txt.backup_$(date +%Y%m%d)"
    echo -e "${YELLOW}正在备份map.txt文件...${NC}"
    cp "$map_txt_path" "./$map_txt_backup_file"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}map.txt文件已备份为 $map_txt_backup_file${NC}"
    else
        echo -e "${RED}备份map.txt文件失败。${NC}"
        exit 1
    fi
    
    # 备份parses.conf文件
    local parses_conf_path="$REPO_DIR/$PROJECT_NAME/config/parses.conf"
    local parses_conf_backup_file="parses.conf.backup_$(date +%Y%m%d)"
    echo -e "${YELLOW}正在备份parses.conf文件...${NC}"
    cp "$parses_conf_path" "./$parses_conf_backup_file"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}parses.conf文件已备份为 $parses_conf_backup_file${NC}"
    else
        echo -e "${RED}备份parses.conf文件失败。${NC}"
        exit 1
    fi
    
    # 备份order_common.example.html文件
    local order_common_example_path="$REPO_DIR/$PROJECT_NAME/public/sub/order_common.example.html"
    local order_common_example_backup_file="order_common.example.html.backup_$(date +%Y%m%d)"
    echo -e "${YELLOW}正在备份order_common.example.html文件...${NC}"
    cp "$order_common_example_path" "./$order_common_example_backup_file"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}order_common.example.html文件已备份为 $order_common_example_backup_file${NC}"
    else
        echo -e "${RED}备份order_common.example.html文件失败。${NC}"
        exit 1
    fi   
}

# 定义恢复函数
restore_file() {
    # 恢复env.json文件
    local env_json_backup_file="env.json.backup_$(date +%Y%m%d).json"
    if [ -f "./$env_json_backup_file" ]; then
        echo -e "${YELLOW}正在恢复env.json文件...${NC}"
        cp "./$env_json_backup_file" "config/env.json"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}env.json文件已恢复。${NC}"
            rm "./$env_json_backup_file"  # 删除备份文件
        else
            echo -e "${RED}恢复env.json文件失败。${NC}"
            exit 1
        fi
    else
        echo -e "${RED}备份文件 $env_json_backup_file 不存在，无法恢复env.json文件。${NC}"
        exit 1
    fi

    # 恢复.env文件
    local env_backup_file=".env.backup_$(date +%Y%m%d)"
    if [ -f "./$env_backup_file" ]; then
        echo -e "${YELLOW}正在恢复.env文件...${NC}"
        cp "./$env_backup_file" ".env"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}.env文件已恢复。${NC}"
            rm "./$env_backup_file"  # 删除备份文件
        else
            echo -e "${RED}恢复.env文件失败。${NC}"
            exit 1
        fi
    else
        echo -e "${RED}备份文件 $env_backup_file 不存在，无法恢复.env文件。${NC}"
        exit 1
    fi

    # 恢复map.txt文件
    local map_txt_backup_file="map.txt.backup_$(date +%Y%m%d)"
    if [ -f "./$map_txt_backup_file" ]; then
        echo -e "${YELLOW}正在恢复map.txt文件...${NC}"
        cp "./$map_txt_backup_file" "$REPO_DIR/$PROJECT_NAME/config/map.txt"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}map.txt文件已恢复。${NC}"
            rm "./$map_txt_backup_file"  # 删除备份文件
        else
            echo -e "${RED}恢复map.txt文件失败。${NC}"
            exit 1
        fi
    else
        echo -e "${RED}备份文件 $map_txt_backup_file 不存在，无法恢复map.txt文件。${NC}"
        exit 1
    fi
    
    # 恢复parses.conf文件
    local parses_conf_backup_file="parses.conf.backup_$(date +%Y%m%d)"
    if [ -f "./$parses_conf_backup_file" ]; then
        echo -e "${YELLOW}正在恢复parses.conf文件...${NC}"
        cp "./$parses_conf_backup_file" "$REPO_DIR/$PROJECT_NAME/config/parses.conf"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}parses.conf文件已恢复。${NC}"
            rm "./$parses_conf_backup_file"  # 删除备份文件
        else
            echo -e "${RED}恢复parses.conf文件失败。${NC}"
            exit 1
        fi
    else
        echo -e "${RED}备份文件 $parses_conf_backup_file 不存在，无法恢复parses.conf文件。${NC}"
        exit 1
    fi 
        
    # 恢复order_common.example.html文件
        local order_common_example_backup_file="order_common.example.html.backup_$(date +%Y%m%d)"
    if [ -f "./$order_common_example_backup_file" ]; then
        echo -e "${YELLOW}正在恢复order_common.example.html文件...${NC}"
        cp "./$order_common_example_backup_file" "$REPO_DIR/$PROJECT_NAME/public/sub/order_common.example.html"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}order_common.example.html文件已恢复。${NC}"
            rm "./$order_common_example_backup_file"  # 删除备份文件
        else
            echo -e "${RED}恢复order_common.example.html文件失败。${NC}"
            exit 1
        fi
    else
        echo -e "${RED}备份文件 $order_common_example_backup_file 不存在，无法恢复order_common.example.html文件。${NC}"
        exit 1
    fi
}

# 尝试次数限制，避免无限循环
MAX_ATTEMPTS=5
# 尝试计数器
ATTEMPT_COUNT=0

# 定义git fetch最大尝试次数
MAX_FETCH_ATTEMPTS=5
# 尝试计数器
FETCH_ATTEMPT_COUNT=0

# 函数：执行git pull并检查是否成功
pull_repo() {
    if git pull origin main; then
        echo -e "${GREEN}Git pull 成功。${NC}"
        # 执行yarn
        echo -e "${YELLOW}正在还原备份的文件和入库密码值${NC}"
        # Git pull成功后执行pm2 restart drpyS之前，还原配置文件和COOKIE_AUTH_CODE值
        restore_file
        echo -e "${YELLOW}正在执行yarn...${NC}"
        if yarn; then
            echo -e "${GREEN}yarn执行成功。${NC}"
            # yarn成功后执行pm2 restart drpyS
            echo -e "${YELLOW}正在重启drpyS进程...${NC}"
            pm2 restart drpyS
            # 启动成功后提示项目主页访问地址
            if [ $? -eq 0 ]; then
                if [ -z "$has_displayed_ip" ]; then # 检查是否已经显示过IP地址
                    display_ip_addresses
                    has_displayed_ip=1 # 设置一个标志，表示已经显示过IP地址
                fi
            else
                echo -e "${RED}yarn执行失败。${NC}"
                return 1
            fi
        else
            echo -e "${RED}yarn执行失败。${NC}"
            return 1
        fi
        return 0
    else
        echo -e "Git pull 失败。"
        # 捕获git pull错误信息
        local error_output=$(git pull origin main 2>&1)
        
        # 检查是否有冲突发生
        if echo -e "$error_output" | grep -q 'Your local changes to the following files would be overwritten by merge:'; then
        echo -e "${YELLOW}检查到冲突，正在强制覆盖本地文件...${NC}"
        git fetch --all
        git reset --hard origin/main
        echo -e "${YELLOW}本地文件已被强制覆盖。${NC}"
        echo -e "${YELLOW}正在还原备份的文件和入库密码值${NC}"
        # Git pull成功后执行pm2 restart drpyS之前，还原配置文件和COOKIE_AUTH_CODE值
        restore_file
        if yarn; then
            echo -e "${GREEN}yarn执行成功。${NC}"
            pm2 restart drpyS
            if [ $? -eq 0 ]; then
                if [ -z "$has_displayed_ip" ]; then # 检查是否已经显示过IP地址
                    display_ip_addresses
                    has_displayed_ip=1 # 设置一个标志，表示已经显示过IP地址
                fi
            else
                echo -e "${RED}PM2重启失败。${NC}"
                return 1
            fi
        else
            echo -e "${RED}yarn执行失败。${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}没有找到冲突文件。${NC}"
        echo -e "${YELLOW}$error_output${NC}"
        return 1
    fi
fi
}

# 函数：尝试执行git fetch直到成功
fetch_until_success() {
    local max_attempts=$MAX_FETCH_ATTEMPTS
    local attempt_count=0

    while [ $attempt_count -lt $max_attempts ]; do
        if git fetch origin; then
            echo -e "${GREEN}Git fetch 成功。${NC}"
            return 0
        else
            echo -e "${RED}Git fetch 失败，尝试次数：$attempt_count${NC}"
            ((attempt_count++))
        fi
        sleep 5 # 等待5秒后重试
    done

    echo -e "${YELLOW}已达到最大尝试次数，停止更新。${NC}"
    return 1 # 返回1表示失败，这样调用函数的地方可以据此判断是否需要退出循环
}

# 循环检查并尝试更新仓库
while true; do
    FETCH_ATTEMPT_COUNT=0 # 重置尝试计数器
    ATTEMPT_COUNT=0 # 重置尝试计数器

    # 调用 fetch_until_success 函数，并根据返回值判断是否继续
    if ! fetch_until_success; then
        echo -e "${YELLOW}已达到最大尝试次数，停止更新。${NC}"
        exit 1
    fi

    # 如果git fetch成功，检查是否有更新
    if git status | grep -q "Your branch is behind"; then
        echo -e "${YELLOW}检测到有更新，执行备份文件${NC}"
        backup_files # 调用备份函数
        while [ $ATTEMPT_COUNT -lt $MAX_ATTEMPTS ]; do
            if pull_repo; then
                echo -e "${GREEN}更新仓库完成"
                # 成功更新后不输出访问地址，直接退出循环
                break
            else
                # 如果git pull失败，增加尝试计数器
                ((ATTEMPT_COUNT++))
                echo -e "${RED}git pull 失败，将在 10 秒后重试（剩余尝试次数：$((MAX_ATTEMPTS - ATTEMPT_COUNT))）。${NC}"
                sleep 10
            fi
        done
        if [ $ATTEMPT_COUNT -ge $MAX_ATTEMPTS ]; then
            echo -e "${YELLOW}已达到最大尝试次数，停止更新。${NC}"
            exit 1
        fi
    else
        # 如果没有更新，输出访问地址
        if [ -z "$has_displayed_ip" ]; then # 检查是否已经显示过IP地址
        echo -e "${GREEN}当前仓库已经是最新的，无需更新。${NC}"
        display_ip_addresses
            has_displayed_ip=1 # 设置一个标志，表示已经显示过IP地址
        fi
        break # 退出循环
    fi
done
