import fs from 'fs';
import https from 'https';

async function testFreeApi() {
  console.log('Testing HuggingFace Free Serverless SOTA AI API...');

  // Create a 1x1 red PNG blob for testing
  const dummyBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  const options = {
    hostname: 'api-inference.huggingface.co',
    path: '/models/briaai/RMBG-2.0',
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': dummyBuffer.length,
    },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log(`HF Free Serverless API Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        console.log(`Response length: ${buffer.length} bytes`);
        resolve(res.statusCode);
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      resolve(500);
    });

    req.write(dummyBuffer);
    req.end();
  });
}

testFreeApi();
