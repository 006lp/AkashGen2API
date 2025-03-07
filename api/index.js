const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/';
const API_KEY = process.env.API_KEY || 'default-secret-key';
const SESSION_TOKEN = process.env.SESSION_TOKEN || '';

app.use(cors());
app.use(bodyParser.json());

// 验证 API 密钥
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Missing authentication token' });
    if (token !== API_KEY) return res.status(401).json({ error: 'Invalid authentication token' });

    next();
};

// 主页路由
app.get(API_PREFIX, (req, res) => {
    res.send('API service is running');
});

// Ping 路由
app.get(`${API_PREFIX}ping`, (req, res) => {
    res.send('pong');
});

// 图片获取路由
app.get(`${API_PREFIX}images`, async (req, res) => {
    const jobId = req.query.id;

    if (!jobId) {
        return res.status(400).json({ error: 'Missing job ID' });
    }

    try {
        // 使用轮询等待图像生成完成
        const status = await pollImageStatus(jobId);

        if (status.status !== 'completed') {
            return res.status(404).json({ error: 'Image not ready or not found' });
        }

        // 从 base64 数据中提取图像
        const imageData = status.result.split(',')[1];
        const buffer = Buffer.from(imageData, 'base64');

        res.setHeader('Content-Type', 'image/webp');
        res.send(buffer);
    } catch (error) {
        console.error('Error getting image:', error);
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
});

// Chat completions API 路由
app.post(`${API_PREFIX}v1/chat/completions`, authenticateToken, async (req, res) => {
    const { messages, model, stream, waitForImage = false } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
    }

    const userMessage = messages.find(msg => msg.role === 'user');
    if (!userMessage) {
        return res.status(400).json({ error: 'No user message found' });
    }

    try {
        const chatResponse = await callAkashAPI(userMessage.content);

        // 提取 jobId 和 prompt
        const regex = /<image_generation> jobId='([^']+)' prompt='([^']+)' negative='([^']+)'<\/image_generation>/;
        const match = chatResponse.match(regex);

        if (match) {
            const jobId = match[1];
            const prompt = match[2];
            const negative = match[3];
            const imageUrl = `${req.protocol}://${req.get('host')}${API_PREFIX}images?id=${jobId}`;

            if (waitForImage) {
                // 等待图像生成完成
                try {
                    await pollImageStatus(jobId);
                    const markdownResponse = `<image_generation> jobId='${jobId}' prompt='${prompt}' negative='${negative}'</image_generation>\n![Generated Image](${imageUrl})`;

                    res.json({
                        id: jobId,
                        model: model || 'AkashGen',
                        response: markdownResponse,
                        status: 'completed',
                        imageUrl
                    });
                } catch (error) {
                    res.json({
                        id: jobId,
                        model: model || 'AkashGen',
                        response: `Image generation in progress. You can check status at ${imageUrl}`,
                        status: 'pending',
                        imageUrl
                    });
                }
            } else {
                // 不等待，立即返回 jobId 和 URL
                const markdownResponse = `<image_generation> jobId='${jobId}' prompt='${prompt}' negative='${negative}'</image_generation>\n![Generated Image](${imageUrl})`;

                res.json({
                    id: jobId,
                    model: model || 'AkashGen',
                    response: markdownResponse,
                    status: 'pending',
                    imageUrl
                });
            }
        }
    } catch (error) {
        console.error('Error calling Akash API:', error);
        res.status(500).json({ error: 'Failed to process request', details: error.message });
    }
});

async function callAkashAPI(content) {
    const requestBody = {
        id: generateRequestId(),
        messages: [{ role: 'user', content }],
        model: 'AkashGen',
        system: '',
        temperature: 0.85,
        topP: 1
    };

    const headers = {
        'authority': 'chat.akash.network',
        'method': 'POST',
        'path': '/api/chat',
        'scheme': 'https',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'cookie': `session_token=${SESSION_TOKEN};`,
        'dnt': '1',
        'origin': 'https://chat.akash.network',
        'pragma': 'no-cache',
        'referer': 'https://chat.akash.network/',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0'
    };

    try {
        const response = await axios.post('https://chat.akash.network/api/chat', requestBody, { headers });

        // 处理响应
        const responseLines = response.data.split('\n');
        let content = '';

        for (const line of responseLines) {
            if (line.startsWith('0:')) {
                content = line.substring(2);
                break;
            }
        }

        return content;
    } catch (error) {
        console.error('Error calling Akash API:', error);
        throw error;
    }
}

async function checkImageStatus(jobId) {
    const headers = {
        'authority': 'chat.akash.network',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'cache-control': 'no-cache',
        'cookie': `session_token=${SESSION_TOKEN};`,
        'dnt': '1',
        'origin': 'https://chat.akash.network',
        'pragma': 'no-cache',
        'referer': 'https://chat.akash.network/',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0'
    };

    try {
        const response = await axios.get(`https://chat.akash.network/api/image-status?ids=${jobId}`, { headers });
        return response.data[0];
    } catch (error) {
        console.error('Error checking image status:', error);
        throw error;
    }
}

function generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 轮询检查图像状态直到完成
async function pollImageStatus(jobId, maxAttempts = 30, interval = 1000) {
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const status = await checkImageStatus(jobId);

            if (status.status === 'completed') {
                return status;
            }

            // 等待指定时间间隔
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
        } catch (error) {
            console.error('Error polling image status:', error);
            throw error;
        }
    }

    throw new Error('Image generation timed out');
}

// 对于 Vercel
if (process.env.VERCEL) {
    module.exports = app;
} else {
    // 对于本地开发和 Docker
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
