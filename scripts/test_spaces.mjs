import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

function checkSpace(host) {
  return new Promise((resolve) => {
    https
      .get(`https://${host}/info`, { agent }, (res) => {
        console.log(`Space ${host} Status: ${res.statusCode}`);
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          console.log(`Space ${host} Info length: ${data.length}`);
          resolve(res.statusCode);
        });
      })
      .on('error', (err) => {
        console.error(`Space ${host} Error: ${err.message}`);
        resolve(500);
      });
  });
}

async function main() {
  await checkSpace('briaai-rmbg-2-0.hf.space');
  await checkSpace('zhengpeng7-birefnet.hf.space');
  await checkSpace('briaai-rmbg-1-4.hf.space');
}

main();
