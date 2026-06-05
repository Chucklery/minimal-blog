# scripts/deploy-local.ps1
# 本机 Nginx for Windows 部署脚本

Write-Host "🚀 Deploying to local Nginx..." -ForegroundColor Cyan

# 1. 构建
Write-Host "`n📦 Building..." -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# 2. 检查 Nginx 是否存在
$nginxPath = "C:\tools\nginx"
if (-not (Test-Path "$nginxPath\nginx.exe")) {
    Write-Host "❌ Nginx not found at $nginxPath" -ForegroundColor Red
    Write-Host "   Download from: https://nginx.org/en/download.html" -ForegroundColor Yellow
    exit 1
}

# 3. 复制配置文件
$confDir = "$nginxPath\conf\conf.d"
if (-not (Test-Path $confDir)) {
    New-Item -ItemType Directory -Force $confDir | Out-Null
}
Copy-Item -Force ".\nginx\minimal-blog.conf" "$confDir\minimal-blog.conf"
Write-Host "✅ Config copied to $confDir" -ForegroundColor Green

# 4. 测试 Nginx 配置
Write-Host "`n🧪 Testing Nginx config..." -ForegroundColor Yellow
Push-Location $nginxPath
$testResult = & .\nginx.exe -t 2>&1
Pop-Location
if ($testResult -match "test is successful") {
    Write-Host "✅ Config test passed" -ForegroundColor Green
} else {
    Write-Host "❌ Config test failed:" -ForegroundColor Red
    Write-Host $testResult
    exit 1
}

# 5. Reload / Start Nginx
Write-Host "`n🔄 Reloading Nginx..." -ForegroundColor Yellow
Push-Location $nginxPath
$running = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
if ($running) {
    & .\nginx.exe -s reload 2>&1
    Write-Host "✅ Nginx reloaded" -ForegroundColor Green
} else {
    Start-Process -FilePath ".\nginx.exe" -WindowStyle Hidden
    Write-Host "✅ Nginx started" -ForegroundColor Green
}
Pop-Location

# 6. 验证
Start-Sleep -Milliseconds 500
Write-Host "`n🔍 Verifying..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8088" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ http://localhost:8088 → $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Could not reach http://localhost:8088" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n🌐 Open: http://localhost:8088" -ForegroundColor Cyan
