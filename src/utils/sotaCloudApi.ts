export type SotaModelType =
  | 'briaai/RMBG-2.0'
  | 'ZhengPeng7/BiRefNet'
  | 'ZhengPeng7/BiRefNet-anime'
  | 'briaai/RMBG-1.4'
  | 'fusion-dual';

/**
 * Removes background using 100% FREE Cloud SOTA Models (RMBG-2.0 / BiRefNet-anime) via Vite proxy.
 */
export async function removeBackgroundSotaCloud(
  file: File | Blob,
  modelId: SotaModelType = 'ZhengPeng7/BiRefNet-anime',
  token?: string,
  onProgress?: (text: string) => void
): Promise<Blob> {
  if (modelId === 'fusion-dual') {
    if (onProgress) onProgress('正在启动【双大模型融合驱动】 (RMBG-2.0 + BiRefNet-anime 强力双核推理)...');

    // Run both models in parallel
    const [blob1, blob2] = await Promise.all([
      removeBackgroundSotaCloud(file, 'briaai/RMBG-2.0', token).catch(() => null),
      removeBackgroundSotaCloud(file, 'ZhengPeng7/BiRefNet-anime', token).catch(() => null),
    ]);

    if (blob1 && blob2) {
      if (onProgress) onProgress('正在融合双 SOTA 大模型 Alpha 蒙版...');
      return await fuseTwoAlphaBlobs(blob1, blob2);
    } else if (blob1) {
      return blob1;
    } else if (blob2) {
      return blob2;
    } else {
      throw new Error('Dual fusion cloud endpoints busy');
    }
  }

  if (onProgress) onProgress(`正在调用云端 A100 GPU 运行 ${modelId} 插画/速写专属 SOTA 大模型...`);

  const headers: Record<string, string> = {
    'Content-Type': file.type || 'image/png',
    'X-Model-ID': modelId,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const response = await fetch('/api/sota-bg-remove', {
    method: 'POST',
    headers,
    body: file,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`SOTA Cloud API Error (${response.status}): ${errText}`);
  }

  return await response.blob();
}

/**
 * Fuses two cutout PNG blobs by taking the maximum confidence alpha for every pixel.
 */
async function fuseTwoAlphaBlobs(blob1: Blob, blob2: Blob): Promise<Blob> {
  const img1 = new Image();
  const img2 = new Image();

  img1.src = URL.createObjectURL(blob1);
  img2.src = URL.createObjectURL(blob2);

  await Promise.all([
    new Promise((res) => (img1.onload = res)),
    new Promise((res) => (img2.onload = res)),
  ]);

  const width = img1.naturalWidth;
  const height = img1.naturalHeight;

  const canvas1 = document.createElement('canvas');
  canvas1.width = width;
  canvas1.height = height;
  const ctx1 = canvas1.getContext('2d')!;
  ctx1.drawImage(img1, 0, 0, width, height);
  const data1 = ctx1.getImageData(0, 0, width, height);

  const canvas2 = document.createElement('canvas');
  canvas2.width = width;
  canvas2.height = height;
  const ctx2 = canvas2.getContext('2d')!;
  ctx2.drawImage(img2, 0, 0, width, height);
  const data2 = ctx2.getImageData(0, 0, width, height).data;

  const d1 = data1.data;
  for (let i = 0; i < d1.length; i += 4) {
    // Take max alpha confidence from both models
    d1[i + 3] = Math.max(d1[i + 3], data2[i + 3]);
  }

  ctx1.putImageData(data1, 0, 0);

  return new Promise((resolve) => {
    canvas1.toBlob((b) => resolve(b || blob1), 'image/png', 1.0);
  });
}
