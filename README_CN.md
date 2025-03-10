# AkashGen2API 

<div align="center">
<img src="https://socialify.git.ci/006lp/AkashGen2API/image?font=KoHo&forks=1&issues=1&language=1&logo=https%3A%2F%2Fakash.network%2F_astro%2F2.Dr8ojBlO_1SRa25.webp&name=1&owner=1&pattern=Circuit+Board&pulls=1&stargazers=1&theme=Light" alt="AkashGen2API" width="640" height="320" />

[简体中文](https://github.com/006lp/AkashGen2API/blob/main/README_CN.md) | [English](https://github.com/006lp/AkashGen2API)
</div>

这是一个用于 AkashGen 图像生成功能的 API 代理服务。它允许您通过简单的 API 接口轻松将 AkashGen 的图像生成集成到您的应用程序中。

## 功能

- 使用 AkashGen AI 生成图像
- 兼容 OpenAI 风格的 REST API 接口
- 通过 Bearer 令牌进行身份验证
- 通过专用端点检索图像
- 可部署到 Vercel、Cloudflare Workers 或 Docker
- 支持轮询图像生成状态，包括处理失败和超时情况
- 详细的错误处理和日志记录

## 设置

### 环境变量

根据 `.env.example` 创建一个 `.env` 文件，并设置以下变量：

- `API_KEY`：用于身份验证的密钥（例如 `your-secret-key`）
- `SESSION_TOKEN`：您的 AkashGen 会话令牌（从 AkashGen 网站获取）
- `API_PREFIX`：API 路由前缀（默认：`/`）
- `PORT`：服务器端口（默认：3000）

### 部署选项

#### Vercel（推荐）

1. **克隆此存储库**：
   ```bash
   git clone https://github.com/your-repo/AkashGen2API.git
   ```
2. **在 Vercel 中设置环境变量**：在 Vercel 控制面板中添加上述环境变量。
3. **部署到 Vercel**：点击 Vercel 的“Import Project”按钮，选择您的 Git 仓库，然后按照提示部署。

#### Cloudflare Workers（未经测试）

1. **配置 `wrangler.toml`**：在 `wrangler.toml` 文件中设置您的 Cloudflare Workers 账户详细信息。
2. **发布应用**：
   ```bash
   wrangler publish
   ```

#### Docker（未经测试）

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

**请求体**：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "生成一个美丽的山水风景"
    }
  ],
  "model": "AkashGen",
  "waitForImage": true
}
```

- `waitForImage`：如果设置为 `true`，API 将等待图像生成完成再返回响应。默认值为 `true`，可不填此项。

**响应**：

成功时：

```json
{
  "id": "job-id",
  "model": "AkashGen",
  "response": "<image_generation> jobId='job-id' prompt='...' negative='...'</image_generation>\n![Generated Image](https://your-domain.com/images?id=job-id)",
  "status": "completed",
  "imageUrl": "https://your-domain.com/images?id=job-id"
}
```

失败时（暂时不清楚解决方法）：

```json
{
  "error": "Image generation failed",
  "details": "Failed to parse worker response: error decoding response body"
}
```

- 当`details` 为 `Failed to parse worker response: error decoding response body` 时，会自动结束此次请求。

> 在本地测试时，Akash也会出现这个报错，暂不明确为什么会产生这个问题，可能是Akash自身问题？

超时时：

```json
{
  "error": "Failed to wait for image generation",
  "details": "Image generation timed out"
}
```

#### 获取图像

```
GET /images?id=job-id
```

- 返回生成的图像（WebP 格式）。
- 如果图像尚未准备好或找不到，将返回 HTTP 404 错误。

#### 服务状态

```
GET /
```

- 返回 "API service is running"，用于检查服务是否在线。

```
GET /ping
```

- 返回 "pong"，用于简单的健康检查。

## 错误处理

- **图像生成失败**：如果 AkashGen API 返回 `status: "failed"`，服务会立即返回一个包含错误信息的响应。
- **图像生成超时**：如果轮询超时（默认20次尝试，每次间隔1秒），服务会返回超时错误。
- **无法提取 jobId**：如果无法从 AkashGen 的响应中提取 `jobId`，会返回详细的错误信息和原始响应内容，方便调试。

## 注意事项

- 确保您的 `SESSION_TOKEN` 有效且未过期，否则 API 调用会失败。
- 对于生产环境，建议使用 HTTPS 以确保数据传输的安全性。
- 请注意 API 使用的限制和费用，确保符合 AkashGen 的使用条款。

## 贡献

欢迎提交 Pull Requests 或报告问题。如果您有任何改进建议，请随时联系我们。