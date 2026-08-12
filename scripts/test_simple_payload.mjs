import http from 'http';

const apiKey = 'sk-Gdev4olPowZLJhgQNQNwqCUSF2umD3kxBMPuN5CkVHTVGSOe';

function testModelSimple(modelId) {
  return new Promise((resolve) => {
    console.log(`Testing simple prompt for: ${modelId}`);

    const payload = JSON.stringify({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: '你是图像主体识别助手。请问如果你收到一张骑行者插画，要框选主体并过滤速度笔触与地面碎影，你返回的 Bounding Box JSON 应该是什么格式？',
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
          console.log(`[${modelId}] Status: ${res.statusCode}`);
          try {
            const parsed = JSON.parse(body);
            console.log(`[${modelId}] Response:`, parsed.choices?.[0]?.message?.content?.slice(0, 300));
          } catch {
            console.log(`[${modelId}] Raw:`, body.slice(0, 200));
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
  await testModelSimple('deepseek-v4-pro');
  await testModelSimple('glm-5.2');
  await testModelSimple('MiniMax-M2.5');
}

main();
