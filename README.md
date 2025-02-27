# AkashGen2API 

<div align="center">

[简体中文](https://github.com/006lp/AkashGen2API/blob/main/README_CN.md) | [English](https://github.com/006lp/AkashGen2API)

</div>

This is an API proxy service for AkashGen's image generation capabilities. It allows you to easily integrate AkashGen's image generation into your applications through a simple API interface.

## Features

- Generate images using AkashGen AI
- REST API compatible with OpenAI-like interface
- Authentication via Bearer token
- Image retrieval through dedicated endpoints
- Deployable to Vercel, Cloudflare Workers, or Docker

## Setup

### Environment Variables

Create a `.env` file based on the `.env.example` and set the following variables:

- `API_KEY`: Your secret API key for authentication
- `SESSION_TOKEN`: Your AkashGen session token
- `API_PREFIX`: API route prefix (default: `/`)
- `PORT`: Server port (default: 3000)

### Deployment Options

#### Vercel

1. Clone this repository
2. Set up the environment variables in Vercel
3. Deploy to Vercel

#### Cloudflare Workers

1. Set your account details in `wrangler.toml`
2. Run `wrangler publish`

#### Docker

```bash
# Using docker-compose
docker-compose up -d

# Or build and run manually
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

Request body:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Generate a beautiful landscape with mountains"
    }
  ],
  "model": "AkashGen"
}
```

Response:

```json
{
  "id": "job-id",
  "model": "AkashGen",
  "response": "<image_generation> jobId='job-id' prompt='...' negative='...'</image_generation>\n[job-id](https://your-domain.com/images?id=job-id)"
}
```

#### Get Image

```
GET /images?id=job-id
```

Returns the generated image as a WebP image.

#### Service Status

```
GET /
```

Returns "API service is running"

```
GET /ping
```

Returns "pong"