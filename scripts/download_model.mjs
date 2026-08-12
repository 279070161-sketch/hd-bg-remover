import fs from 'fs';
import path from 'path';
import https from 'https';

const TARGET_DIR = path.resolve('public/models/rmbg-1.4');
const ONNX_DIR = path.join(TARGET_DIR, 'onnx');

if (!fs.existsSync(TARGET_DIR)) fs.mkdirSync(TARGET_DIR, { recursive: true });
if (!fs.existsSync(ONNX_DIR)) fs.mkdirSync(ONNX_DIR, { recursive: true });

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} -> ${dest}`);
    const file = fs.createWriteStream(dest);

    const get = (currentUrl) => {
      https
        .get(currentUrl, { agent: httpsAgent }, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            console.log(`Redirecting to ${response.headers.location}`);
            get(response.headers.location);
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download ${currentUrl}: Status Code ${response.statusCode}`));
            return;
          }

          const total = parseInt(response.headers['content-length'] || '0', 10);
          let downloaded = 0;

          response.on('data', (chunk) => {
            downloaded += chunk.length;
            if (total > 0) {
              const pct = ((downloaded / total) * 100).toFixed(1);
              process.stdout.write(`Progress: ${pct}%\r`);
            }
          });

          response.pipe(file);

          file.on('finish', () => {
            file.close(() => {
              console.log(`\nSuccessfully saved ${dest}`);
              resolve();
            });
          });
        })
        .on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
    };

    get(url);
  });
}

async function main() {
  const baseUrl = 'https://hf-mirror.com/Xenova/rmbg-1.4/raw/main';
  const lfsUrl = 'https://hf-mirror.com/Xenova/rmbg-1.4/resolve/main';

  try {
    await downloadFile(`${baseUrl}/config.json`, path.join(TARGET_DIR, 'config.json'));
    await downloadFile(`${baseUrl}/preprocessor_config.json`, path.join(TARGET_DIR, 'preprocessor_config.json'));
    await downloadFile(`${lfsUrl}/onnx/model_quantized.onnx`, path.join(ONNX_DIR, 'model_quantized.onnx'));
    console.log('🎉 ALL RMBG-1.4 MODEL FILES DOWNLOADED LOCALLY!');
  } catch (err) {
    console.error('Download failed:', err);
  }
}

main();
