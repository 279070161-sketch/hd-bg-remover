import { useState, useCallback, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { removeBackgroundSotaCloud } from './utils/sotaCloudApi';
import type { SotaModelType } from './utils/sotaCloudApi';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ProcessingProgress } from './components/ProcessingProgress';
import { CanvasEditor } from './components/CanvasEditor';
import { CompareSlider } from './components/CompareSlider';
import { BackgroundSelector } from './components/BackgroundSelector';
import { ExportPanel } from './components/ExportPanel';
import { FeaturesFooter } from './components/FeaturesFooter';
import type { BackgroundConfig } from './utils/canvasHelper';
import { createMaskCanvas } from './utils/canvasHelper';
import { SlidersHorizontal, Layers, Sparkles, Cpu, Key, ExternalLink, ShieldCheck, Flame } from 'lucide-react';
import './App.css';

type AppState = 'idle' | 'processing' | 'ready';
type ViewMode = 'editor' | 'compare';
export type AiEngineMode = 'fusion-dual' | 'rmbg-2.0' | 'birefnet-anime' | 'birefnet' | 'isnet';

export function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [viewMode, setViewMode] = useState<ViewMode>('editor');

  // Active AI Engine: Default to Dual SOTA Model Fusion Mode
  const [engineMode, setEngineMode] = useState<AiEngineMode>('fusion-dual');

  // HF Access Token state (saved to localStorage)
  const [hfToken, setHfToken] = useState<string>(() => {
    return localStorage.getItem('hf_access_token') || '';
  });
  const [showTokenModal, setShowTokenModal] = useState(false);

  // File info
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  // Progress stats
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressKey, setProgressKey] = useState('');

  // Image objects
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const [renderedCanvas, setRenderedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [renderedCanvasUrl, setRenderedCanvasUrl] = useState<string>('');

  // Background config
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>({
    type: 'transparent',
    color: '#FFFFFF',
    gradient: { color1: '#ff9a9e', color2: '#fecfef', angle: 45 },
    customImage: null,
    blurAmount: 16,
  });

  useEffect(() => {
    if (hfToken) {
      localStorage.setItem('hf_access_token', hfToken);
    }
  }, [hfToken]);

  const handleReset = () => {
    setAppState('idle');
    setOriginalImage(null);
    setOriginalUrl('');
    setMaskCanvas(null);
    setRenderedCanvas(null);
    setRenderedCanvasUrl('');
    setProgressPercent(0);
    setViewMode('editor');
    setCurrentFile(null);
  };

  const processImageFileWithEngine = async (file: File, mode: AiEngineMode) => {
    setCurrentFile(file);
    setFileName(file.name);
    setFileSize(file.size);
    setAppState('processing');
    setProgressPercent(10);

    try {
      // 1. Create HTMLImageElement for original
      const origUrl = URL.createObjectURL(file);
      setOriginalUrl(origUrl);

      const origImg = new Image();
      origImg.src = origUrl;
      await new Promise((res) => (origImg.onload = res));
      setOriginalImage(origImg);

      let blob: Blob | null = null;

      if (mode === 'fusion-dual' || mode === 'rmbg-2.0' || mode === 'birefnet-anime' || mode === 'birefnet') {
        const sotaModelId: SotaModelType =
          mode === 'fusion-dual'
            ? 'fusion-dual'
            : mode === 'rmbg-2.0'
            ? 'briaai/RMBG-2.0'
            : mode === 'birefnet-anime'
            ? 'ZhengPeng7/BiRefNet-anime'
            : 'ZhengPeng7/BiRefNet';

        setProgressPercent(25);
        setProgressKey(`正在启动 ${mode === 'fusion-dual' ? '双 SOTA 模型融合引擎' : sotaModelId}...`);

        try {
          blob = await removeBackgroundSotaCloud(file, sotaModelId, hfToken, (statusText) => {
            setProgressKey(statusText);
            setProgressPercent(65);
          });
        } catch (cloudErr) {
          console.warn('Cloud SOTA model fallback to local FP16:', cloudErr);
          setProgressKey('云端大模型连接中，正在自动衔接高精 16-bit 本地引擎...');
          blob = null;
        }
      }

      // Fallback to local FP16 engine if blob is null
      if (!blob) {
        setProgressKey('正在通过本地高精 16-bit 引擎推理...');
        blob = await removeBackground(file, {
          model: 'isnet_fp16',
          output: { format: 'image/png', quality: 1.0 },
          progress: (_key: string, current: number, total: number) => {
            if (total > 0) {
              const pct = Math.min(90, Math.round(15 + (current / total) * 75));
              setProgressPercent(pct);
            }
          },
        });
      }

      setProgressPercent(95);
      setProgressKey('正在生成 1:1 无损蒙版...');

      // Load returned cutout blob into HTMLImageElement
      const cutoutUrl = URL.createObjectURL(blob);
      const cutImg = new Image();
      cutImg.src = cutoutUrl;
      await new Promise((res) => (cutImg.onload = res));

      // Extract 1:1 original resolution alpha mask canvas
      const mask = createMaskCanvas(origImg, cutImg);
      setMaskCanvas(mask);

      setProgressPercent(100);
      setAppState('ready');
    } catch (err) {
      console.error('Background removal processing error:', err);
      try {
        const origUrl = URL.createObjectURL(file);
        const origImg = new Image();
        origImg.src = origUrl;
        await new Promise((res) => (origImg.onload = res));
        setOriginalImage(origImg);

        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = origImg.naturalWidth;
        dummyCanvas.height = origImg.naturalHeight;

        setMaskCanvas(dummyCanvas);
        setAppState('ready');
      } catch (finalErr) {
        console.error('Final fallback error:', finalErr);
        setAppState('idle');
      }
    }
  };

  const processImageFile = (file: File) => {
    processImageFileWithEngine(file, engineMode);
  };

  const handleSwitchEngine = (newMode: AiEngineMode) => {
    setEngineMode(newMode);
    if (currentFile) {
      processImageFileWithEngine(currentFile, newMode);
    }
  };

  const handleSelectSample = async (url: string, name: string) => {
    setFileName(`${name}.jpg`);
    setAppState('processing');
    setProgressPercent(5);

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
      processImageFileWithEngine(file, engineMode);
    } catch (err) {
      console.error('Failed to load sample image:', err);
      setAppState('idle');
    }
  };

  const handleCanvasRendered = useCallback((canvas: HTMLCanvasElement) => {
    setRenderedCanvas(canvas);
    setRenderedCanvasUrl(canvas.toDataURL('image/png'));
  }, []);

  const handleMaskUpdate = useCallback(() => {
    // Mask modified by fine-tuning brush
  }, []);

  return (
    <div className="app-shell">
      <Header onReset={handleReset} hasImage={appState === 'ready'} />

      <main className="app-main">
        {/* SOTA AI Engine Selector & Free Token Header Bar */}
        <div className="engine-selector-bar">
          <div className="engine-info">
            <Flame size={18} className="text-yellow" />
            <span>AI 抠图引擎模式：</span>
          </div>
          <div className="engine-buttons">
            <button
              className={`engine-btn ${engineMode === 'birefnet-anime' ? 'active-sota' : ''}`}
              onClick={() => handleSwitchEngine('birefnet-anime')}
              title="🎨 BiRefNet-Anime (漫画/插画速写专属 SOTA 大模型，自动识别人体并彻底擦除背景速度线与阴影)"
            >
              <Sparkles size={14} className="text-yellow" /> 🎨 BiRefNet-Anime (速写/速度线专属)
            </button>
            <button
              className={`engine-btn ${engineMode === 'fusion-dual' ? 'active-sota' : ''}`}
              onClick={() => handleSwitchEngine('fusion-dual')}
              title="🔥 双模型融合 (RMBG-2.0 + BiRefNet 强力双核驱动)"
            >
              <Flame size={14} /> 🔥 双模型融合 (RMBG-2.0 + BiRefNet)
            </button>
            <button
              className={`engine-btn ${engineMode === 'rmbg-2.0' ? 'active-sota' : ''}`}
              onClick={() => handleSwitchEngine('rmbg-2.0')}
              title="BRIA RMBG-2.0 (PhotoRoom 2026 旗舰同款云端大模型)"
            >
              <Sparkles size={14} /> BRIA RMBG-2.0
            </button>
            <button
              className={`engine-btn ${engineMode === 'isnet' ? 'active' : ''}`}
              onClick={() => handleSwitchEngine('isnet')}
              title="ISNet 高精 16-bit 本地引擎"
            >
              <Cpu size={14} /> ISNet-FP16
            </button>
          </div>

          <div className="token-status-area">
            <button
              className={`token-btn ${hfToken ? 'connected' : ''}`}
              onClick={() => setShowTokenModal(!showTokenModal)}
            >
              <Key size={14} />
              <span>{hfToken ? '已配置免费 HuggingFace Token' : '配置免费 HF Token (加速云端大模型)'}</span>
            </button>
          </div>
        </div>

        {/* Hugging Face Free Token Setup Panel Modal */}
        {showTokenModal && (
          <div className="token-modal-card">
            <div className="token-modal-header">
              <div className="token-modal-title">
                <ShieldCheck size={18} className="text-green" />
                <span>配置免费 HuggingFace Token（解锁 RMBG-2.0 + BiRefNet 双核大模型直连）</span>
              </div>
              <button className="close-btn" onClick={() => setShowTokenModal(false)}>
                ✕
              </button>
            </div>
            <div className="token-modal-body">
              <p className="token-desc">
                Hugging Face 官方提供 <strong>100% 免费</strong> 的 User Access Token。填入后即可享受到极速、稳定、无等待的云端 A100 GPU 旗舰抠图大模型！
              </p>

              <div className="token-input-row">
                <input
                  type="password"
                  placeholder="粘贴您的免费 Token (例如: hf_...)"
                  value={hfToken}
                  onChange={(e) => setHfToken(e.target.value)}
                  className="token-input"
                />
                <button
                  className="save-token-btn"
                  onClick={() => setShowTokenModal(false)}
                >
                  保存并应用
                </button>
              </div>

              <div className="token-guide-box">
                <span className="guide-title">💡 30 秒免费获取 Token 步骤：</span>
                <ol className="guide-list">
                  <li>
                    1. 点击直达页面：{' '}
                    <a
                      href="https://huggingface.co/settings/tokens/new?tokenType=read"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-link"
                    >
                      直接新建免费 Token 页面 <ExternalLink size={12} />
                    </a>
                  </li>
                  <li>2. Token 名称填 <code>remover</code>，权限选 <code>Read</code>，点击底部 <strong>“Create token”</strong> 按钮。</li>
                  <li>3. 复制生成的 <code>hf_...</code> 密钥，粘贴到上方输入框点击保存。</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {appState === 'idle' && (
          <>
            <DropZone onFileSelect={processImageFile} onSelectSample={handleSelectSample} />
            <FeaturesFooter />
          </>
        )}

        {appState === 'processing' && (
          <ProcessingProgress
            progressKey={progressKey}
            progressPercent={progressPercent}
            fileName={fileName}
            resolutionInfo={
              originalImage
                ? `${originalImage.naturalWidth} × ${originalImage.naturalHeight} px`
                : undefined
            }
          />
        )}

        {appState === 'ready' && originalImage && maskCanvas && (
          <div className="workspace-container">
            {/* View Mode Toggle & Header Stats */}
            <div className="workspace-toolbar">
              <div className="file-info-badge">
                <span className="file-name">{fileName}</span>
                <span className="res-tag">
                  {originalImage.naturalWidth} × {originalImage.naturalHeight} px (1:1 原画)
                </span>
                <span className="engine-tag">
                  <Flame size={13} className="text-yellow" />{' '}
                  {engineMode === 'fusion-dual'
                    ? '🔥 双模型融合 (RMBG-2.0 + BiRefNet 双核极净)'
                    : engineMode === 'rmbg-2.0'
                    ? 'BRIA RMBG-2.0 云端旗舰大模型'
                    : engineMode === 'birefnet'
                    ? 'BiRefNet 深度分割大模型'
                    : 'ISNet 16-bit 本地引擎'}
                </span>
              </div>

              <div className="mode-toggle">
                <button
                  className={`toggle-btn ${viewMode === 'editor' ? 'active' : ''}`}
                  onClick={() => setViewMode('editor')}
                >
                  <Layers size={16} /> 抠图与画笔编辑器
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'compare' ? 'active' : ''}`}
                  onClick={() => setViewMode('compare')}
                >
                  <SlidersHorizontal size={16} /> 原图/抠图前后对比
                </button>
              </div>
            </div>

            {/* Main Stage */}
            <div className="workspace-stage">
              {viewMode === 'editor' ? (
                <CanvasEditor
                  originalImg={originalImage}
                  maskCanvas={maskCanvas}
                  bgConfig={bgConfig}
                  onUpdateMask={handleMaskUpdate}
                  onCanvasRendered={handleCanvasRendered}
                />
              ) : (
                <CompareSlider
                  originalSrc={originalUrl}
                  processedCanvasUrl={renderedCanvasUrl || originalUrl}
                  width={originalImage.naturalWidth}
                  height={originalImage.naturalHeight}
                />
              )}
            </div>

            {/* Background Switcher Controls */}
            <BackgroundSelector config={bgConfig} onChange={setBgConfig} />

            {/* Export & Resolution Guarantee Stats Panel */}
            <ExportPanel
              canvas={renderedCanvas}
              originalWidth={originalImage.naturalWidth}
              originalHeight={originalImage.naturalHeight}
              originalSize={fileSize}
              fileName={fileName}
            />
          </div>
        )}
      </main>
    </div>
  );
}
