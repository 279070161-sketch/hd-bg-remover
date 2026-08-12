import http from 'http';

const apiKey = 'sk-Gdev4olPowZLJhgQNQNwqCUSF2umD3kxBMPuN5CkVHTVGSOe';

function testDeepSeekVision() {
  return new Promise((resolve) => {
    console.log('Sending Base64 Image to deepseek-v4-pro on company proxy...');

    // Small 1x1 PNG base64
    const base64Data = 'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const payload = JSON.stringify({
      model: 'deepseek-v4-pro',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: '请分析这张图片的主体，并返回 JSON 格式的主体 Bounding Box 范围: {"box": [0,0,100,100]}' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Data}`,
              },
            },
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
        console.log('DeepSeek Vision Status:', res.statusCode);
        let data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(data).toString('utf8');
          console.log('DeepSeek Vision Response:', body);
          resolve(body);
        });
      }
    );

    req.on('error', (err) => {
      console.error('DeepSeek Vision Request Error:', err.message);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

testDeepSeekVision();
