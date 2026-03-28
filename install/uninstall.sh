#!/bin/bash

echo "开始卸载 drpy-node 及相关组件..."

# ---------- 停止并删除 PM2 进程 ----------
if command -v pm2 &> /dev/null; then
    echo "停止并删除 PM2 进程..."
    pm2 stop drpyS 2>/dev/null
    pm2 delete drpyS 2>/dev/null
    pm2 save 2>/dev/null
fi

# ---------- 删除项目目录 ----------
read -p "请输入项目存放目录（留空则使用当前目录）: " repoDir
repoDir=${repoDir:-$(pwd)}
projectPath="$repoDir/drpy-node"

if [ -d "$projectPath" ]; then
    echo "删除项目目录: $projectPath"
    rm -rf "$projectPath"
fi

# ---------- 卸载全局 npm 包 ----------
if command -v npm &> /dev/null; then
    echo "卸载全局 npm 包..."
    npm uninstall -g yarn pm2 2>/dev/null
fi

# ---------- 禁用并删除 PM2 系统服务 ----------
if [ -f "/etc/systemd/system/pm2-root.service" ]; then
    echo "禁用并删除 PM2 系统服务..."
    systemctl stop pm2-root 2>/dev/null
    systemctl disable pm2-root 2>/dev/null
    rm -f /etc/systemd/system/pm2-root.service
    systemctl daemon-reload
fi

# ---------- 删除 PM2 相关文件 ----------
if [ -d "$HOME/.pm2" ]; then
    echo "删除 PM2 配置和日志文件..."
    rm -rf "$HOME/.pm2"
fi

# ---------- 卸载 Node.js (可选) ----------
read -p "是否要卸载 Node.js？(y/n) 默认(n): " uninstallNode
uninstallNode=${uninstallNode:-n}

if [ "$uninstallNode" = "y" ]; then
    echo "卸载 Node.js..."
    
    # 如果使用 NodeSource 安装
    if [ -f "/etc/apt/sources.list.d/nodesource.list" ]; then
        apt-get remove -y nodejs
        rm -f /etc/apt/sources.list.d/nodesource.list
        rm -f /etc/apt/sources.list.d/nodesource.list.save
    fi
    
    # 如果使用 nvm 安装
    if [ -d "$HOME/.nvm" ]; then
        rm -rf "$HOME/.nvm"
        # 从 shell 配置文件中移除 nvm 相关行
        sed -i '/NVM_DIR/d' ~/.bashrc 2>/dev/null
        sed -i '/nvm.sh/d' ~/.bashrc 2>/dev/null
    fi
    
    # 清除残留包
    apt-get autoremove -y
fi

# ---------- 新增：卸载 Python (可选) ----------
read -p "是否要卸载 Python？(y/n) 默认(n) (注意：系统可能依赖 Python，误删会导致功能异常！): " uninstallPython
uninstallPython=${uninstallPython:-n}

if [ "$uninstallPython" = "y" ]; then
    echo "=== 开始卸载 Python ==="
    
    # 1. 卸载全局 pip 包（避免残留依赖）
    if command -v pip3 &> /dev/null; then
        echo "卸载所有全局 pip3 包..."
        pip3 freeze | xargs pip3 uninstall -y 2>/dev/null
    fi
    if command -v pip2 &> /dev/null; then
        echo "卸载所有全局 pip2 包..."
        pip2 freeze | xargs pip2 uninstall -y 2>/dev/null
    fi

    # 2. 卸载 apt 安装的 Python（适用于通过 apt-get 安装的 Python 2/3）
    echo "卸载 apt 安装的 Python 组件..."
    # 卸载 Python 3 相关（保留系统核心依赖的最小集，避免直接删 python3 导致系统崩溃）
    apt-get remove -y python3-pip python3-dev python3-setuptools 2>/dev/null
    # 卸载 Python 2 相关（Python 2 已停止维护，通常无系统依赖）
    apt-get remove -y python2 python2-pip python2-dev 2>/dev/null

    # 3. 删除源码编译安装的 Python（默认安装路径 /usr/local/bin/pythonX.Y）
    read -p "是否删除源码编译安装的 Python？(y/n) 默认(n): " uninstallSrcPython
    uninstallSrcPython=${uninstallSrcPython:-n}
    if [ "$uninstallSrcPython" = "y" ]; then
        # 提示用户输入源码安装的 Python 版本（如 3.9、2.7）
        read -p "请输入源码安装的 Python 主版本号（如 3.9、2.7）: " pyVersion
        if [ -n "$pyVersion" ]; then
            pyBinPath="/usr/local/bin/python$pyVersion"
            pyLibPath="/usr/local/lib/python$pyVersion"
            # 删除可执行文件
            if [ -f "$pyBinPath" ]; then
                rm -f "$pyBinPath" "$pyBinPath"-config 2>/dev/null
                rm -f "/usr/local/bin/pip$pyVersion" 2>/dev/null
                echo "删除源码 Python 可执行文件: $pyBinPath"
            fi
            # 删除库文件目录
            if [ -d "$pyLibPath" ]; then
                rm -rf "$pyLibPath" 2>/dev/null
                echo "删除源码 Python 库目录: $pyLibPath"
            fi
        else
            echo "未输入版本号，跳过源码 Python 删除"
        fi
    fi

    # 4. 清除 Python 缓存和配置残留
    echo "清理 Python 缓存和残留文件..."
    rm -rf "$HOME/.cache/pip" 2>/dev/null  # pip 缓存
    rm -rf "$HOME/.local/lib/python"* 2>/dev/null  # 用户级 Python 包
    rm -f /usr/local/bin/python /usr/local/bin/python2 /usr/local/bin/python3 2>/dev/null  # 软链接

    # 5. 自动清理无用依赖
    apt-get autoremove -y 2>/dev/null
    echo "Python 卸载流程完成"
fi

echo "卸载完成！"
