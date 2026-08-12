import https from 'https';

function testIPv4(host, path = '/') {
  return new Promise((resolve) => {
    console.log(`Testing IPv4 connection to ${host}...`);
    const req = https.request(
      {
        hostname: host,
        path: path,
        method: 'GET',
        family: 4, // Force IPv4 to bypass Windows IPv6 TLS socket disconnect bug!
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      },
      (res) => {
        console.log(`Success! ${host} Status Code: ${res.statusCode}`);
        resolve(res.statusCode);
      }
    );

    req.on('error', (e) => {
      console.error(`Failed ${host}:`, e.message);
      resolve(500);
    });

    req.end();
  });
}

async function main() {
  await testIPv4('hf-mirror.com');
  await testIPv4('huggingface.co');
  await testIPv4('api-inference.huggingface.co');
  await testIPv4('modelscope.cn');
}

main();
