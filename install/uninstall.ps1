<#
.SYNOPSIS
    drpys 一键卸载脚本（与安装脚本完全对应版）
.DESCRIPTION
    1) 删除任务计划  
    2) 停止并删除 PM2 进程  
    3) 结束残余 Node 进程  
    4) 删除源码目录  
    5) 可选：卸载运行环境（Node / Python / Git / nvm / yarn / pm2）
.PARAMETER SkipConfirm
    静默模式
.PARAMETER IncludeEnv
    强制连环境一起删
.PARAMETER UseProxy
    下载时使用代理
.PARAMETER ProxyHost
    代理地址，默认 127.0.0.1:7890
#>
param(
    [switch]$UseProxy,
    [string]$ProxyHost = "127.0.0.1:7890",
    [switch]$SkipConfirm,
    [switch]$IncludeEnv
)
$ErrorActionPreference = "Continue"   # 全局容错

# ---------- 1. 自动提权 ----------
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "当前非管理员权限，正在尝试以管理员身份重新启动..." -ForegroundColor Yellow
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`""
    if ($UseProxy)    { $arguments += " -UseProxy -ProxyHost `"$ProxyHost`"" }
    if ($SkipConfirm) { $arguments += " -SkipConfirm" }
    if ($IncludeEnv)  { $arguments += " -IncludeEnv" }
    Start-Process powershell -ArgumentList $arguments -Verb RunAs
    exit
}
Set-Location -LiteralPath $PSScriptRoot

# ---------- 2. 代理 ----------
function Use-ProxyIfNeeded {
    param([scriptblock]$Script)
    if ($UseProxy) {
        $oldHttp  = [Environment]::GetEnvironmentVariable("HTTP_PROXY")
        $oldHttps = [Environment]::GetEnvironmentVariable("HTTPS_PROXY")
        [Environment]::SetEnvironmentVariable("HTTP_PROXY",  "http://$ProxyHost", "Process")
        [Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://$ProxyHost", "Process")
        try { & $Script } finally {
            [Environment]::SetEnvironmentVariable("HTTP_PROXY",  $oldHttp,  "Process")
            [Environment]::SetEnvironmentVariable("HTTPS_PROXY", $oldHttps, "Process")
        }
    } else { & $Script }
}

# ---------- 3. 用户确认 ----------
if (-not $SkipConfirm) {
    Write-Host "========== drpys 卸载脚本 ==========" -ForegroundColor Cyan
    Write-Host "请选择卸载方式：" -ForegroundColor Yellow
    Write-Host "  1) 仅删除项目（保留环境）"
    Write-Host "  2) 删除项目 + 卸载运行环境"
    $choice = Read-Host "请输入对应数字（1/2）默认(1)"
    $IncludeEnv = ($choice -eq "2")
}

# ---------- 4. 任务计划 ----------
"drpyS_PM2_Startup","drpyS_Update" | ForEach-Object {
    try {
        if (Get-ScheduledTask -TaskName $_ -ErrorAction SilentlyContinue) {
            Write-Host "删除任务计划 $_ ..." -ForegroundColor Green
            Unregister-ScheduledTask -TaskName $_ -Confirm:$false -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Warning "删除任务计划 $_ 失败，跳过..."
    }
}

# ---------- 5. PM2 & Node 进程 ----------
try {
    if (Get-Command pm2 -ErrorAction SilentlyContinue) {
        Write-Host "停止并删除 PM2 进程 drpyS ..." -ForegroundColor Green
        pm2 stop drpyS   *>$null
        pm2 delete drpyS *>$null
        pm2 save         *>$null
    }
} catch {
    Write-Warning "PM2 进程操作失败，跳过..."
}

Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Write-Host "结束残余 Node 进程 PID $($_.Id) ..." -ForegroundColor Green
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Warning "结束 Node 进程 $($_.Id) 失败，跳过..."
    }
}

# ---------- 6. 删除源码 ----------
$repoDir = Read-Host "请输入项目存放目录（留空则使用当前目录）"
if ([string]::IsNullOrWhiteSpace($repoDir)) { $repoDir = (Get-Location).Path }
$projectPath = Join-Path $repoDir "drpy-node"
try {
    if (Test-Path $projectPath) {
        Write-Host "删除源码目录 $projectPath ..." -ForegroundColor Green
        Remove-Item -Recurse -Force $projectPath -ErrorAction SilentlyContinue
    } else {
        Write-Host "未检测到源码目录，跳过删除" -ForegroundColor Yellow
    }
} catch {
    Write-Warning "删除源码目录失败，跳过..."
}

# ---------- 7. 卸载运行环境（与安装脚本 100% 对应，注册表定位卸载） ----------
if ($IncludeEnv) {
    Write-Host "开始卸载运行环境（与安装脚本完全对应）..." -ForegroundColor Yellow

    # 1) 卸载全局 npm 包
    try {
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            Write-Host "卸载全局 npm 包 (yarn, pm2)..." -ForegroundColor Green
            npm uninstall -g yarn pm2 *>$null
        }
    } catch { Write-Warning "npm 卸载全局包失败: $($_.Exception.Message)" }

    # 2) 卸载 NVM for Windows（NSIS） + Node
    try {
        $nvmReg = Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" |
                  ForEach-Object { Get-ItemProperty $_.PSPath } |
                  Where-Object { $_.DisplayName -match "NVM for Windows" } |
                  Select-Object -First 1
        if ($nvmReg -and $nvmReg.UninstallString) {
            Write-Host "卸载 NVM for Windows ..." -ForegroundColor Green
            Write-Host "如果弹出卸载窗口请手动确认操作 ..." -ForegroundColor Yellow
            Start-Process -FilePath $nvmReg.UninstallString -ArgumentList "/S" -Wait
        }
        # 强制删目录
        $nvmDir = "${env:ProgramFiles}\nvm"
        if (Test-Path $nvmDir) { Remove-Item -Recurse -Force $nvmDir -ErrorAction SilentlyContinue }
        $envPaths = [Environment]::GetEnvironmentVariable("PATH", "Machine") -split ';'
        $clean = $envPaths | Where-Object { $_ -notmatch '\\nvm\\?' -and $_ -notmatch '\\nodejs\\?' }
        [Environment]::SetEnvironmentVariable("PATH", ($clean -join ';'), "Machine")
    } catch { Write-Warning "NVM 卸载失败: $($_.Exception.Message)" }

    # ---------- 卸载 Python 3.11.9 ----------
    try {
        # 1) 先杀可能占用的进程（去掉 idle）
        'python', 'pythonw', 'pip', 'code' | ForEach-Object {
            Get-Process $_ -ErrorAction SilentlyContinue |
                Where-Object { $_.ProcessName -ne 'Idle' } |
                Stop-Process -Force -ErrorAction SilentlyContinue
        }

        # 2) 找卸载命令
        $pyReg = Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" |
                 ForEach-Object { Get-ItemProperty $_.PSPath } |
                 Where-Object { $_.DisplayName -match "Python 3\.11\.9" } |
                 Select-Object -First 1

        if (-not $pyReg) {
            Write-Host "未检测到 Python 3.11.9，跳过卸载" -ForegroundColor Green
            return
        }

        # 3) 判断卸载方式
        if ($pyReg.UninstallString -match '\.exe$') {
            $exePath = $pyReg.UninstallString -replace '"', ''
            $argList = '/passive', '/norestart'          # ← 这里改 /passive
            $proc = Start-Process -FilePath $exePath -ArgumentList $argList -Wait -PassThru
        } else {
            $argList = '/X', $pyReg.PSChildName, '/passive', '/norestart'  # ← 这里改 /passive
            $proc = Start-Process -FilePath 'msiexec.exe' -ArgumentList $argList -Wait -PassThru
        }

        # 4) 检查退出码
        if ($proc.ExitCode -ne 0) {
            Write-Warning "卸载返回码 $($proc.ExitCode)，建议重启后再继续"
            exit $proc.ExitCode
        }

        # 5) 清理残留目录 & PATH
        $pyDir = "C:\Python311"
        if (Test-Path $pyDir) { Remove-Item -Recurse -Force $pyDir -ErrorAction SilentlyContinue }
        $envPaths = [Environment]::GetEnvironmentVariable("PATH", "Machine") -split ';'
        $clean = $envPaths | Where-Object { $_ -notmatch '\\Python311\\?' }
        [Environment]::SetEnvironmentVariable("PATH", ($clean -join ';'), "Machine")

        Write-Host "Python 3.11.9 卸载完成，可继续安装" -ForegroundColor Green
    }
    catch {
         Write-Warning "卸载异常: $($_.Exception.Message)"
    }

    # 4) 卸载 Git（EXE/MSI）
    try {
        $gitReg = Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall" |
                  ForEach-Object { Get-ItemProperty $_.PSPath } |
                  Where-Object { $_.DisplayName -match "Git" } |
                  Select-Object -First 1
        if ($gitReg -and $gitReg.UninstallString) {
            Write-Host "卸载 Git ..." -ForegroundColor Green
            Start-Process -FilePath $gitReg.UninstallString -ArgumentList "/VERYSILENT", "/NORESTART" -Wait
        }
        # 清理 PATH
        $envPaths = [Environment]::GetEnvironmentVariable("PATH", "Machine") -split ';'
        $clean = $envPaths | Where-Object { $_ -notmatch '\\Git\\cmd' -and $_ -notmatch '\\Git\\mingw64' -and $_ -notmatch '\\Git\\usr\\bin' }
        [Environment]::SetEnvironmentVariable("PATH", ($clean -join ';'), "Machine")
    } catch { Write-Warning "Git 卸载失败: $($_.Exception.Message)" }

    Write-Host "运行环境卸载完成！建议重启计算机完成彻底清理。" -ForegroundColor Green
}

# ---------- 8. 清理 PM2 数据 ----------
try {
    $pm2Home = "C:\$env:USERNAME\.pm2"
    if (Test-Path $pm2Home) {
        Write-Host "清理 PM2 数据目录 ..." -ForegroundColor Green
        Remove-Item -Recurse -Force $pm2Home -ErrorAction SilentlyContinue
    }
} catch {
    Write-Warning "清理 PM2 数据失败: $($_.Exception.Message)"
}

# ---------- 9. 删除配置文件（当前目录） ----------
Write-Host "删除配置文件..." -ForegroundColor Green
$confFile  = Join-Path $PSScriptRoot "drpys-update.conf"
$pathFile  = Join-Path $PSScriptRoot "drpys-path.txt"
Remove-Item -Path $confFile,$pathFile -Force -ErrorAction SilentlyContinue

# ---------- 10. 完成 ----------
Write-Host "drpys 卸载完成！" -ForegroundColor Green
if ($IncludeEnv) {
    Write-Host "已卸载所有运行环境，建议重启计算机。" -ForegroundColor Yellow
}
Write-Host "按任意键退出..." -ForegroundColor Green
Read-Host
