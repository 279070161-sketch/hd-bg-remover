import http from 'http';

const apiKey = 'sk-Gdev4olPowZLJhgQNQNwqCUSF2umD3kxBMPuN5CkVHTVGSOe';

function testModel(modelId, messages) {
  return new Promise((resolve) => {
    console.log(`Testing model: ${modelId}`);
    const payload = JSON.stringify({
      model: modelId,
      messages,
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
        console.log(`Model ${modelId} Status: ${res.statusCode}`);
        let data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(data).toString('utf8');
          console.log(`Model ${modelId} Response:`, body.slice(0, 400));
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
  await testModel('deepseek-v4-pro', [{ role: 'user', content: 'Hello, analyze image capabilities.' }]);
  await testModel('deepseek-v4-flash', [{ role: 'user', content: 'Hello!' }]);
  await testModel('qwen3.7-max', [{ role: 'user', content: 'Hello!' }]);
}

main();
