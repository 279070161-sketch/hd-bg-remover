import https from 'https';

function checkModelScope() {
  return new Promise((resolve) => {
    https
      .get('https://modelscope.cn/api/v1/models', (res) => {
        console.log(`ModelScope Status: ${res.statusCode}`);
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          console.log(`ModelScope Response Received! (${data.length} bytes)`);
          resolve(res.statusCode);
        });
      })
      .on('error', (err) => {
        console.error(`ModelScope Connection Error: ${err.message}`);
        resolve(500);
      });
  });
}

checkModelScope();
