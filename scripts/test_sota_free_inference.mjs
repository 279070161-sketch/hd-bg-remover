import https from 'https';
import fs from 'fs';

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true, family: 4 });

async function testHuggingFaceInference(modelId) {
  return new Promise((resolve) => {
    console.log(`Testing HF Free SOTA Inference API with IPv4: ${modelId}`);

    // Create a 1x1 test image
    const dummyBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );

    const postData = dummyBuffer;

    const req = https.request(
      `https://huggingface.co/api/models/${modelId}`,
      {
        method: 'GET',
        agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      },
      (res) => {
        console.log(`Response Status Code for ${modelId}: ${res.statusCode}`);
        let chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          console.log(`Received ${body.length} bytes for ${modelId}`);
          resolve(res.statusCode);
        });
      }
    );

    req.on('error', (e) => {
      console.error(`Error testing ${modelId}:`, e.message);
      resolve(500);
    });

    req.end();
  });
}

async function main() {
  await testHuggingFaceInference('briaai/RMBG-2.0');
  await testHuggingFaceInference('ZhengPeng7/BiRefNet');
  await testHuggingFaceInference('briaai/RMBG-1.4');
}

main();
