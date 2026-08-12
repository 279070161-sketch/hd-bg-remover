import http from 'http';

const apiKey = 'sk-Gdev4olPowZLJhgQNQNwqCUSF2umD3kxBMPuN5CkVHTVGSOe';

function listAllModels() {
  return new Promise((resolve) => {
    const req = http.request(
      'http://192.168.1.190/v1/models',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          const body = JSON.parse(Buffer.concat(data).toString('utf8'));
          const modelIds = body.data ? body.data.map((m) => m.id) : [];
          console.log('Total available models:', modelIds.length);
          console.log('Model List:', modelIds);
          resolve(modelIds);
        });
      }
    );

    req.on('error', (err) => {
      console.error('Proxy Error:', err.message);
      resolve([]);
    });

    req.end();
  });
}

listAllModels();
