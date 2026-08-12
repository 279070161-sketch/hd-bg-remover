import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false, family: 4 });

function checkHfModelInference(modelId) {
  return new Promise((resolve) => {
    console.log(`Checking HF Serverless Model: ${modelId}`);
    const dummyBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );

    const req = https.request(
      `https://api-inference.huggingface.co/models/${modelId}`,
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
        console.log(`Model ${modelId} Status: ${res.statusCode}`);
        let data = [];
        res.on('data', (c) => data.push(c));
        res.on('end', () => {
          const body = Buffer.concat(data);
          console.log(`Model ${modelId} Body preview (${body.length} bytes):`, body.toString('utf8').slice(0, 150));
          resolve({ status: res.statusCode, length: body.length });
        });
      }
    );

    req.on('error', (e) => {
      console.error(`Error ${modelId}:`, e.message);
      resolve({ status: 500, length: 0 });
    });

    req.write(dummyBuffer);
    req.end();
  });
}

async function main() {
  await checkHfModelInference('briaai/RMBG-2.0');
  await checkHfModelInference('briaai/RMBG-1.4');
  await checkHfModelInference('ZhengPeng7/BiRefNet');
  await checkHfModelInference('danielgatis/rembg');
}

main();
