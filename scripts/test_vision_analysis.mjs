import http from 'http';
import fs from 'fs';
import path from 'path';

const apiKey = 'sk-Gdev4olPowZLJhgQNQNwqCUSF2umD3kxBMPuN5CkVHTVGSOe';

function testVisionAnalysis() {
  return new Promise((resolve) => {
    console.log('Testing Vision analysis on company proxy http://192.168.1.190/v1/chat/completions...');

    // Small 1x1 test PNG base64
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const payload = JSON.stringify({
      model: 'qwen3.7-max',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: '分析图片主体位置，并返回以像素%为单位的主体Bounding Box坐标格式 JSON: {"box": [minX, minY, maxX, maxY]}' },
            { type: 'image_url', image_url: { url: base64Image } },
          ],
        },
      ],
      temperature: 0.1,
    });

    const req = http.request(
      'http://192.168.1.190/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        console.log('Vision Chat Status:', res.statusCode);
        let data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(data).toString('utf8');
          console.log('Vision Response:', body.slice(0, 600));
          resolve(body);
        });
      }
    );

    req.on('error', (err) => {
      console.error('Vision Request Error:', err.message);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

testVisionAnalysis();
