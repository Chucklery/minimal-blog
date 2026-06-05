# Nginx for Windows 部署指南

## 1. 安装 Nginx

从 http://nginx.org/en/download.html 下载 Windows 版本的 zip 包。

解压到 `C:\tools\nginx`。

验证：

```powershell
cd C:\tools\nginx
.\nginx.exe -v
```

## 2. 配置

将项目配置复制到 Nginx：

```powershell
Copy-Item .\nginx\minimal-blog.conf C:\tools\nginx\conf\conf.d\minimal-blog.conf
```

确保 `nginx.conf` 中包含 conf.d：

```nginx
http {
    # ...
    include conf.d/*.conf;
}
```

## 3. 启动/停止

```powershell
# 启动
cd C:\tools\nginx
start .\nginx.exe

# 停止
.\nginx.exe -s stop

# 重载配置
.\nginx.exe -s reload
```

## 4. 部署更新

```bash
pnpm build
pnpm deploy:local
```

或手动：

```powershell
pnpm build
cd C:\tools\nginx
.\nginx.exe -t
.\nginx.exe -s reload
```

## 5. 访问

```
http://localhost:8088
```

## 6. 日志

```powershell
# 查看日志
Get-Content C:\tools\nginx\logs\access.log -Tail 20
Get-Content C:\tools\nginx\logs\error.log -Tail 20
```
