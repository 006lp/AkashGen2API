# AkashGen2API 

<div align="center">

[简体中文](https://github.com/006lp/AkashGen2API/blob/main/README_CN.md) | [English](https://github.com/006lp/AkashGen2API)
</div>

This is an API proxy service for the image generation functionality of AkashGen. It allows you to easily integrate AkashGen's image generation into your application through a simple API interface.

## Features

- Generate images using AkashGen AI
- Compatible with OpenAI-style REST API interface
- Authenticate via Bearer token
- Retrieve images through dedicated endpoints
- Deployable to Vercel, Cloudflare Workers, or Docker
- Supports polling for image generation status, including handling failures and timeouts
- Detailed error handling and logging

## Setup

### Environment Variables

Create a `.env` file based on `.env.example` and set the following variables:

- `API_KEY`: The key used for authentication (e.g., `your-secret-key`)
- `SESSION_TOKEN`: Your AkashGen session token (obtained from the AkashGen website)
- `API_PREFIX`: API route prefix (default: `/`)
- `PORT`: Server port (default: `3000`)

### Deployment Options

#### Vercel (Recommended)

1. **Clone this repository**:
   ```bash
   git clone https://github.com/your-repo/AkashGen2API.git
   ```
2. **Set environment variables in Vercel**: Add the above environment variables in the Vercel control panel.
3. **Deploy to Vercel**: Click the "Import Project" button in Vercel, select your Git repository, and follow the prompts to deploy.

#### Cloudflare Workers (Untested)

1. **Configure `wrangler.toml`**: Set your Cloudflare Workers account details in the `wrangler.toml` file.
2. **Publish the application**:
   ```bash
   wrangler publish
   ```

#### Docker (Untested)

```bash
# Using docker-compose
docker-compose up -d

# Or manually build and run
docker build -t akashgen-proxy .
docker run -p 3000:3000 --env-file .env akashgen-proxy
```

## API Usage

### Authentication

All API requests must include an `Authorization` header with a bearer token:

```
Authorization: Bearer your-api-key
```

### Endpoints

#### Generate Image

```
POST /v1/chat/completions
```

**Request Body**:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Generate a beautiful landscape"
    }
  ],
  "model": "AkashGen",
  "waitForImage": true
}
```

- `waitForImage`: If set to `true`, the API will wait for the image generation to complete before returning a response. The default value is `true` and can be omitted.

**Response**:

On success:

```json
{
  "id": "job-id",
  "model": "AkashGen",
  "response": "<image_generation> jobId='job-id' prompt='...' negative='...'</image_generation>\n![Generated Image](https://your-domain.com/images?id=job-id)",
  "status": "completed",
  "imageUrl": "https://your-domain.com/images?id=job-id"
}
```

On failure (solution unclear):

```json
{
  "error": "Image generation failed",
  "details": "Failed to parse worker response: error decoding response body"
}
```

- When `details` is `Failed to parse worker response: error decoding response body`, the request will automatically terminate.

> During local testing, Akash also encounters this error. The reason is unclear, possibly an issue with Akash itself?

On timeout:

```json
{
  "error": "Failed to wait for image generation",
  "details": "Image generation timed out"
}
```

#### Retrieve Image

```
GET /images?id=job-id
```

- Returns the generated image in WebP format.
- If the image is not ready or not found, it will return an HTTP 404 error.

#### Service Status

```
GET /
```

- Returns "API service is running" to check if the service is online.

```
GET /ping
```

- Returns "pong" for a simple health check.

## Error Handling

- **Image Generation Failure**: If the AkashGen API returns `status: "failed"`, the service will immediately return a response with error information.
- **Image Generation Timeout**: If polling times out (default 20 attempts, 1-second interval each), the service will return a timeout error.
- **Unable to Extract jobId**: If `jobId` cannot be extracted from the AkashGen response, detailed error information and the original response content will be returned for debugging.

## Notes

- Ensure your `SESSION_TOKEN` is valid and not expired, otherwise API calls will fail.
- For production environments, it's recommended to use HTTPS to secure data transmission.
- Be aware of API usage limits and costs, ensuring compliance with AkashGen's terms of service.

## Contributions

Pull Requests or issue reports are welcome. If you have any suggestions for improvement, please feel free to contact us.