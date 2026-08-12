import { AutoModel, AutoProcessor, RawImage, env } from '@xenova/transformers';

// Dynamically compute the exact local models path for both dev server and GitHub Pages subpath
const getLocalModelsPath = () => {
  if (typeof window === 'undefined') return '/models/';
  const path = window.location.pathname;
  const base = path.endsWith('/') ? path : path.substring(0, path.lastIndexOf('/') + 1);
  return base + 'models/';
};

env.allowLocalModels = true;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.remoteHost = 'https://hf-mirror.com/';
env.localModelPath = getLocalModelsPath();

let modelPromise: Promise<any> | null = null;
let processorPromise: Promise<any> | null = null;

const LOCAL_MODEL_ID = 'briaai-rmbg-1.4';
const REMOTE_MODEL_ID = 'Xenova/briaai-rmbg-1.4';

/**
 * Pre-loads or fetches the SOTA AI matting model with local ONNX and fast CDN mirror fallback.
 */
export async function getRMBGModel(onProgress?: (progress: number, text: string) => void) {
  try {
    if (!modelPromise) {
      modelPromise = AutoModel.from_pretrained(LOCAL_MODEL_ID, {
        local_files_only: true,
        quantized: true,
        progress_callback: (p: any) => {
          if (p.status === 'progress' && onProgress) {
            const pct = Math.round(10 + (p.progress || 0) * 0.7);
            onProgress(pct, `正在极速加载 SOTA 抠图大模型... ${Math.round(p.progress || 0)}%`);
          }
        },
      }).catch(async (localErr) => {
        console.warn('Local ONNX model not found, falling back to hf-mirror CDN:', localErr);
        return await AutoModel.from_pretrained(REMOTE_MODEL_ID, {
          local_files_only: false,
          quantized: true,
          progress_callback: (p: any) => {
            if (p.status === 'progress' && onProgress) {
              const pct = Math.round(10 + (p.progress || 0) * 0.7);
              onProgress(pct, `正在从镜像极速加载 SOTA 抠图大模型... ${Math.round((p.loaded || 0) / 1024 / 1024)}MB`);
            }
          },
        });
      });
    }
    if (!processorPromise) {
      processorPromise = AutoProcessor.from_pretrained(LOCAL_MODEL_ID, {
        local_files_only: true,
      }).catch(async () => {
        return await AutoProcessor.from_pretrained(REMOTE_MODEL_ID, {
          local_files_only: false,
        });
      });
    }

    const model = await modelPromise;
    const processor = await processorPromise;
    return { model, processor };
  } catch (err) {
    console.error('Failed to load RMBG model from CDN mirror:', err);
    modelPromise = null;
    processorPromise = null;
    throw err;
  }
}

/**
 * Executes high-precision background removal using SOTA AI model with dynamic range alpha matting.
 */
export async function removeBackgroundRMBG(
  file: File | Blob,
  onProgress?: (progress: number, text: string) => void
): Promise<Blob> {
  if (onProgress) onProgress(10, '正在初始化 SOTA 旗舰 AI 抠图引擎...');

  const { model, processor } = await getRMBGModel(onProgress);

  if (onProgress) onProgress(75, 'SOTA AI 神经网络正在推理发丝与微米级轮廓...');

  // Convert File/Blob to HTMLImageElement for 100% accurate original resolution
  const imgUrl = URL.createObjectURL(file);
  const origImg = new Image();
  origImg.src = imgUrl;
  await new Promise((res) => (origImg.onload = res));

  const origWidth = origImg.naturalWidth;
  const origHeight = origImg.naturalHeight;

  // Convert File/Blob to RawImage for Transformers.js input
  const image = await RawImage.fromURL(imgUrl);

  // Preprocess input pixels
  const processed = await processor(image);

  // Run model inference
  let outputResult: any;
  if (processed.pixel_values) {
    try {
      outputResult = await model({ input: processed.pixel_values });
    } catch (e) {
      outputResult = await model(processed);
    }
  } else {
    outputResult = await model(processed);
  }

  if (onProgress) onProgress(90, '正在合成精准无损 Alpha 透明通道...');

  // Extract raw logit tensor
  const tensor =
    outputResult.output ||
    outputResult.output_0 ||
    outputResult[0] ||
    Object.values(outputResult)[0];

  const tensorData = tensor.data; // Float32Array
  const dims = tensor.dims;
  const tensorHeight = dims[dims.length - 2];
  const tensorWidth = dims[dims.length - 1];

  // 1. Build intermediate canvas for raw model output
  const tensorCanvas = document.createElement('canvas');
  tensorCanvas.width = tensorWidth;
  tensorCanvas.height = tensorHeight;
  const tensorCtx = tensorCanvas.getContext('2d')!;
  const tensorImageData = tensorCtx.createImageData(tensorWidth, tensorHeight);

  for (let i = 0; i < tensorData.length; i++) {
    const val = tensorData[i];
    
    // Always compute accurate Sigmoid probability: 1 / (1 + exp(-val))
    const normAlpha = 1 / (1 + Math.exp(-val));
    const alphaByte = Math.round(Math.max(0, Math.min(1, normAlpha)) * 255);

    const idx = i * 4;
    tensorImageData.data[idx] = 255;
    tensorImageData.data[idx + 1] = 255;
    tensorImageData.data[idx + 2] = 255;
    tensorImageData.data[idx + 3] = alphaByte;
  }
  tensorCtx.putImageData(tensorImageData, 0, 0);

  // 2. High-quality smooth scaling to exact 1:1 original image dimensions
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = origWidth;
  maskCanvas.height = origHeight;
  const maskCtx = maskCanvas.getContext('2d')!;
  maskCtx.imageSmoothingEnabled = true;
  maskCtx.imageSmoothingQuality = 'high';
  maskCtx.drawImage(tensorCanvas, 0, 0, origWidth, origHeight);

  // 3. Composite original image with high-precision Sigmoid alpha mask
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = origWidth;
  outputCanvas.height = origHeight;
  const outCtx = outputCanvas.getContext('2d')!;

  outCtx.drawImage(origImg, 0, 0, origWidth, origHeight);
  outCtx.globalCompositeOperation = 'destination-in';
  outCtx.drawImage(maskCanvas, 0, 0, origWidth, origHeight);

  setTimeout(() => URL.revokeObjectURL(imgUrl), 2000);

  return new Promise((resolve) => {
    outputCanvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/png');
  });
}
