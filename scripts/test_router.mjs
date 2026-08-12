import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false, family: 4 });

function checkRouterModel(modelId) {
  return new Promise((resolve) => {
    console.log(`Checking HF Router Endpoint for: ${modelId}`);
    const dummyBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );

    const req = https.request(
      `https://router.huggingface.co/models/${modelId}`,
      {
        method: 'POST',
        agent,
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': dummyBuffer.length,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      },
      (res) => {
        console.log(`Router Model ${modelId} Status: ${res.statusCode}`);
        let data = [];
        res.on('data', (c) => data.push(c));
        res.on('end', () => {
          const body = Buffer.concat(data);
          console.log(`Router Model ${modelId} Body:`, body.toString('utf8').slice(0, 200));
          resolve(res.statusCode);
        });
      }
    );

    req.on('error', (e) => {
      console.error(`Router Error ${modelId}:`, e.message);
      resolve(500);
    });

    req.write(dummyBuffer);
    req.end();
  });
}

async function main() {
  await checkRouterModel('briaai/RMBG-2.0');
  await checkRouterModel('briaai/RMBG-1.4');
  await checkRouterModel('ZhengPeng7/BiRefNet');
}

main();
