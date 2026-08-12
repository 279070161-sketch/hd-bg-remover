import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';
import http from 'http';
import dns from 'dns';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  lookup: (hostname, _options, callback) => {
    dns.lookup(hostname, { family: 4 }, (err, address, family) => {
      callback(err, address, family);
    });
  },
});

const COMPANY_API_KEY = 'sk-Gdev4olPowZLJhgQNQNwqCUSF2umD3kxBMPuN5CkVHTVGSOe';
const COMPANY_PROXY_URL = 'http://192.168.1.190/v1/chat/completions';

function deepseekVisionPlugin(): Plugin {
  return {
    name: 'deepseek-vision-proxy',
    configureServer(server) {
      server.middlewares.use('/api/deepseek-vision', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', async () => {
          const bodyBuffer = Buffer.concat(chunks);
          const base64Image = bodyBuffer.toString('base64');
          const mimeType = req.headers['content-type'] || 'image/png';

          console.log(`Sending image (${bodyBuffer.length} bytes) to DeepSeek V4 Pro Vision Proxy...`);

          const payload = JSON.stringify({
            model: 'glm-5.2',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: '请框选图片中骑行者与自行车的主体，忽略背部速写线条和地面阴影擦痕。请仅返回 JSON 格式: {"box": [minX_percent, minY_percent, maxX_percent, maxY_percent]}。',
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            temperature: 0.1,
          });

          const dsReq = http.request(
            COMPANY_PROXY_URL,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${COMPANY_API_KEY}`,
                'Content-Length': Buffer.byteLength(payload),
              },
            },
            (dsRes) => {
              console.log(`DeepSeek V4 Pro Proxy Status: ${dsRes.statusCode}`);
              res.statusCode = dsRes.statusCode || 200;
              res.setHeader('Content-Type', 'application/json');
              dsRes.pipe(res);
            }
          );

          dsReq.on('error', (err) => {
            console.error('DeepSeek V4 Pro Proxy Error:', err.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          });

          dsReq.write(payload);
          dsReq.end();
        });
      });
    },
  };
}

function sotaApiPlugin(): Plugin {
  return {
    name: 'sota-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/sota-bg-remove', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', async () => {
          const bodyBuffer = Buffer.concat(chunks);
          const modelId = (req.headers['x-model-id'] as string) || 'briaai/RMBG-2.0';
          const authHeader = req.headers['authorization'] || '';

          console.log(`Forwarding image (${bodyBuffer.length} bytes) to HF Router SOTA Model: ${modelId}`);

          const headers: Record<string, string | number> = {
            'Content-Type': req.headers['content-type'] || 'image/png',
            'Content-Length': bodyBuffer.length,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          };

          if (authHeader) {
            headers['Authorization'] = authHeader;
          }

          const hfReq = https.request(
            `https://router.huggingface.co/models/${modelId}`,
            {
              method: 'POST',
              agent: httpsAgent,
              headers,
            },
            (hfRes) => {
              console.log(`Cloud Router SOTA API Status: ${hfRes.statusCode}`);
              res.statusCode = hfRes.statusCode || 200;
              if (hfRes.headers['content-type']) {
                res.setHeader('Content-Type', hfRes.headers['content-type']);
              }
              hfRes.pipe(res);
            }
          );

          hfReq.on('error', (err) => {
            console.error('SOTA Cloud API Proxy Error:', err.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          });

          hfReq.write(bodyBuffer);
          hfReq.end();
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), sotaApiPlugin(), deepseekVisionPlugin()],
  server: {
    proxy: {
      '/hf-mirror': {
        target: 'https://hf-mirror.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hf-mirror/, ''),
      },
      '/hf': {
        target: 'https://huggingface.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hf/, ''),
      },
    },
  },
});
