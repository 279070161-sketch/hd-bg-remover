import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { agent: httpsAgent }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        checkUrl(res.headers.location).then(resolve);
      } else {
        resolve({ url, status: res.statusCode });
      }
    }).on('error', (err) => resolve({ url, status: 500, error: err.message }));
  });
}

async function testRepos() {
  const files = [
    'https://hf-mirror.com/briaai/RMBG-1.4/raw/main/config.json',
    'https://hf-mirror.com/briaai/RMBG-1.4/resolve/main/onnx/model.onnx',
    'https://hf-mirror.com/Xenova/modnet/raw/main/config.json',
    'https://hf-mirror.com/Xenova/modnet/resolve/main/onnx/model_quantized.onnx',
    'https://hf-mirror.com/briaai/RMBG-2.0/raw/main/config.json',
  ];

  for (const f of files) {
    const res = await checkUrl(f);
    console.log(`URL: ${f}\n -> Final: ${res.url} | Status: ${res.status}`);
  }
}

testRepos();
