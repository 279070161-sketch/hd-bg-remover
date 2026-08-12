import https from 'https';
import http from 'http';
import fs from 'fs';

const agent = new https.Agent({ rejectUnauthorized: false, family: 4 });

// Test public Gradio Spaces API endpoints (Gradio v3/v4 /api/predict)
function testGradioSpace(spaceHost) {
  return new Promise((resolve) => {
    console.log(`Testing Gradio Space: https://${spaceHost}/config...`);
    https
      .get(`https://${spaceHost}/config`, { agent }, (res) => {
        console.log(`Space ${spaceHost} Config Status: ${res.statusCode}`);
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          console.log(`Space ${spaceHost} Data length: ${data.length}`);
          resolve(res.statusCode === 200);
        });
      })
      .on('error', (e) => {
        console.error(`Space ${spaceHost} error:`, e.message);
        resolve(false);
      });
  });
}

async function main() {
  await testGradioSpace('briaai-rmbg-1-4.hf.space');
  await testGradioSpace('zhengpeng7-birefnet.hf.space');
  await testGradioSpace('briaai-rmbg-2-0.hf.space');
  await testGradioSpace('not-ai-rmbg.hf.space');
}

main();
