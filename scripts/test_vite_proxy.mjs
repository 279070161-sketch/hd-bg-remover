import https from 'https';
import fs from 'fs';

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

async function testHuggingFaceInference(modelId) {
  return new Promise((resolve, reject) => {
    console.log(`Testing Hugging Face Free SOTA Model: ${modelId}`);

    // Create a 1x1 test image
    const dummyBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );

    const postData = dummyBuffer;

    const req = https.request(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        method: 'POST',
        agent,
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': postData.length,
          // Optional free token or anonymous request
        },
      },
      (res) => {
        console.log(`Response Status Code for ${modelId}: ${res.statusCode}`);
        let chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          console.log(`Received ${body.length} bytes`);
          resolve(res.statusCode);
        });
      }
    );

    req.on('error', (e) => {
      console.error(`Error testing ${modelId}:`, e.message);
      resolve(500);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  await testHuggingFaceInference('briaai/RMBG-2.0');
  await testHuggingFaceInference('ZhengPeng7/BiRefNet');
  await testHuggingFaceInference('briaai/RMBG-1.4');
}

main();
