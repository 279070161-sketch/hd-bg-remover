import http from 'http';

const apiKey = 'sk-Gdev4olPowZLJhgQNQNwqCUSF2umD3kxBMPuN5CkVHTVGSOe';

function checkModels() {
  return new Promise((resolve) => {
    console.log('Testing company proxy endpoint http://192.168.1.190/v1/models...');

    const req = http.request(
      'http://192.168.1.190/v1/models',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        console.log('Proxy /v1/models status:', res.statusCode);
        let data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(data).toString('utf8');
          console.log('Available models response:', body.slice(0, 500));
          resolve(body);
        });
      }
    );

    req.on('error', (err) => {
      console.error('Proxy Error:', err.message);
      resolve(null);
    });

    req.end();
  });
}

checkModels();
