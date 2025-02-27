# AkashGen2API 

<div align="center">

[简体中文](https://github.com/006lp/AkashGen2API/blob/main/README_CN.md) | [English](https://github.com/006lp/AkashGen2API)  || [Python Version](https://github.com/006lp/AkashGen2API-Python)

</div>

这是一个用于 AkashGen 图像生成功能的 API 代理服务。它允许您通过简单的 API 接口轻松将 AkashGen 的图像生成集成到您的应用程序中。

## 功能

- 使用 AkashGen AI 生成图像
- 兼容 OpenAI 风格的 REST API 接口
- 通过 Bearer 令牌进行身份验证
- 通过专用端点检索图像
- 可部署到 Vercel、Cloudflare Workers 或 Docker

## 设置

### 环境变量

根据 `.env.example` 创建一个 `.env` 文件，并设置以下变量：

- `API_KEY`：用于身份验证的密钥
- `SESSION_TOKEN`：您的 AkashGen 会话令牌
- `API_PREFIX`：API 路由前缀（默认：`/`）
- `PORT`：服务器端口（默认：3000）

### 部署选项

#### Vercel

1. 克隆此存储库
2. 在 Vercel 中设置环境变量
3. 部署到 Vercel

#### Cloudflare Workers

1. 在 `wrangler.toml` 中设置您的账户详细信息
2. 运行 `wrangler publish`

#### Docker

```bash
# 使用 docker-compose
docker-compose up -d

# 或手动构建和运行
docker build -t akashgen-proxy .
docker run -p 3000:3000 --env-file .env akashgen-proxy
```

## API 使用

### 身份验证

所有 API 请求都必须包含带有 bearer 令牌的 `Authorization` 头：

```
Authorization: Bearer your-api-key
```

### 端点

#### 生成图像

```
POST /v1/chat/completions
```

请求体：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "生成一个美丽的山水风景"
    }
  ],
  "model": "AkashGen"
}
```

响应：

```json
{
  "id": "job-id",
  "model": "AkashGen",
  "response": "<image_generation> jobId='job-id' prompt='...' negative='...'</image_generation>\n[job-id](https://your-domain.com/images?id=job-id)"
}
```

#### 获取图像

```
GET /images?id=job-id
```

返回生成的图像（WebP 格式）。

#### 服务状态

```
GET /
```

返回 "API service is running"

```
GET /ping
```

返回 "pong"