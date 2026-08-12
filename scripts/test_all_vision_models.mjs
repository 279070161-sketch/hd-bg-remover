import http from 'http';

const apiKey = 'sk-Gdev4olPowZLJhgQNQNwqCUSF2umD3kxBMPuN5CkVHTVGSOe';

const modelsToTest = [
  'qwen3.7-max',
  'qwen3.7-plus',
  'qwen3.6-plus',
  'qwen3.8-max',
  'glm-5.2',
  'MiniMax-M2.5',
];

function testModelDetection(modelId) {
  return new Promise((resolve) => {
    console.log(`Testing Bounding Box Detection for model: ${modelId}`);

    // Small 1x1 base64 PNG
    const base64Data = 'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const payload = JSON.stringify({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: '请框选主体并只返回JSON: {"box": [minX_percent, minY_percent, maxX_percent, maxY_percent]}' },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Data}` } },
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
        let data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(data).toString('utf8');
          console.log(`Model [${modelId}] Status: ${res.statusCode}`);
          try {
            const parsed = JSON.parse(body);
            const content = parsed.choices?.[0]?.message?.content || '';
            console.log(`Model [${modelId}] Content:`, content.slice(0, 250));
          } catch {
            console.log(`Model [${modelId}] Raw:`, body.slice(0, 200));
          }
          resolve(res.statusCode);
        });
      }
    );

    req.on('error', (err) => {
      console.error(`Error ${modelId}:`, err.message);
      resolve(500);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  for (const m of modelsToTest) {
    await testModelDetection(m);
  }
}

main();
