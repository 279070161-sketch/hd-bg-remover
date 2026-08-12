import { AutoModel, AutoProcessor, RawImage, env } from '@xenova/transformers';

// Configure Transformers.js with国内极速镜像 (hf-mirror.com) and browser cache
env.allowLocalModels = true;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.remoteHost = 'https://hf-mirror.com/';
const baseUrl = import.meta.env.BASE_URL || '/';
env.localModelPath = baseUrl.endsWith('/') ? baseUrl + 'models/' : baseUrl + '/models/';

let modelPromise: Promise<any> | null = null;
let processorPromise: Promise<any> | null = null;

const MODEL_ID = 'briaai/RMBG-1.4';

/**
 * Pre-loads or fetches the SOTA AI matting model with fast CDN mirror.
 */
export async function getRMBGModel(onProgress?: (progress: number, text: string) => void) {
  try {
    if (!modelPromise) {
      modelPromise = AutoModel.from_pretrained(MODEL_ID, {
        local_files_only: false,
        quantized: true,
        progress_callback: (p: any) => {
          if (p.status === 'progress' && onProgress) {
            const pct = Math.round(10 + (p.progress || 0) * 0.7);
            onProgress(pct, `正在极速加载 SOTA 抠图大模型... ${Math.round((p.loaded || 0) / 1024 / 1024)}MB`);
          }
        },
      });
    }
    if (!processorPromise) {
      processorPromise = AutoProcessor.from_pretrained(MODEL_ID, {
        local_files_only: false,
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

  // Convert File/Blob to RawImage
  const imgUrl = URL.createObjectURL(file);
  const image = await RawImage.fromURL(imgUrl);

  // Preprocess input pixels
  const processed = await processor(image);

  // Run model inference with correct ONNX input parameter name
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

  // Detect output tensor dynamic range (0..1 matte vs raw logits)
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < tensorData.length; i++) {
    const v = tensorData[i];
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
  }

  const isPreActivated = minVal >= -0.05 && maxVal <= 1.05;

  // 1. Build intermediate canvas for raw model output
  const tensorCanvas = document.createElement('canvas');
  tensorCanvas.width = tensorWidth;
  tensorCanvas.height = tensorHeight;
  const tensorCtx = tensorCanvas.getContext('2d')!;
  const tensorImageData = tensorCtx.createImageData(tensorWidth, tensorHeight);

  for (let i = 0; i < tensorData.length; i++) {
    const val = tensorData[i];
    let normAlpha: number;

    if (isPreActivated) {
      // Already 0.0 .. 1.0 probability matte
      normAlpha = Math.max(0, Math.min(1, val));
    } else {
      // Raw logits: apply Sigmoid 1 / (1 + exp(-val))
      normAlpha = 1 / (1 + Math.exp(-val));
    }

    const alphaByte = Math.round(normAlpha * 255);

    const idx = i * 4;
    tensorImageData.data[idx] = 255;
    tensorImageData.data[idx + 1] = 255;
    tensorImageData.data[idx + 2] = 255;
    tensorImageData.data[idx + 3] = alphaByte;
  }
  tensorCtx.putImageData(tensorImageData, 0, 0);

  // 2. High-quality smooth scaling to 1:1 original image dimensions
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = image.width;
  maskCanvas.height = image.height;
  const maskCtx = maskCanvas.getContext('2d')!;
  maskCtx.imageSmoothingEnabled = true;
  maskCtx.imageSmoothingQuality = 'high';
  maskCtx.drawImage(tensorCanvas, 0, 0, image.width, image.height);

  // 3. Composite original image with high-precision Sigmoid alpha mask
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = image.width;
  outputCanvas.height = image.height;
  const outCtx = outputCanvas.getContext('2d')!;

  const origImg = new Image();
  origImg.src = imgUrl;
  await new Promise((res) => (origImg.onload = res));
  outCtx.drawImage(origImg, 0, 0);

  outCtx.globalCompositeOperation = 'destination-in';
  outCtx.drawImage(maskCanvas, 0, 0);

  setTimeout(() => URL.revokeObjectURL(imgUrl), 2000);

  return new Promise((resolve) => {
    outputCanvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/png');
  });
}
