import https from 'https';

async function testModelScopeInference() {
  console.log('Testing ModelScope Free SOTA Image Matting API...');

  const dummyBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  const req = https.request(
    'https://api-inference.modelscope.cn/api-inference/v1/models/damo/cv_unet_image-matting',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': dummyBuffer.length,
      },
    },
    (res) => {
      console.log(`ModelScope Inference Status Code: ${res.statusCode}`);
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        console.log(`Response length: ${body.length} bytes`);
        console.log(`Body excerpt:`, body.toString('utf8').slice(0, 200));
      });
    }
  );

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.write(dummyBuffer);
  req.end();
}

testModelScopeInference();
