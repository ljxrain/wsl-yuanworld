# Get the directory of the script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
# Change to the script's directory
Set-Location -Path $ScriptDir

Write-Host "========================================"
Write-Host "          源世界项目启动脚本 (PowerShell)"
Write-Host "========================================"
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 依赖包不存在，开始安装..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败"
        Read-Host "请按 Enter 键退出"
        exit 1
    }
    Write-Host "✅ 依赖安装完成"
    Write-Host ""
}

Write-Host "🚀 启动源世界服务器..."
Write-Host "📍 前端地址: http://localhost:8080"
Write-Host "📍 API地址: http://localhost:8080/api"
Write-Host ""

# Start the server
node server/index.js

Write-Host "⚠️  服务器已停止"
Read-Host "请按 Enter 键退出"
