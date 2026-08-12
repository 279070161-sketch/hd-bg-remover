import { useState, useCallback } from 'react';
import { removeBackground } from '@imgly/background-removal';
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
import { SlidersHorizontal, Layers } from 'lucide-react';
import './App.css';

type AppState = 'idle' | 'processing' | 'ready';
type ViewMode = 'editor' | 'compare';

export function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [viewMode, setViewMode] = useState<ViewMode>('editor');

  // File info
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);

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

  const handleReset = () => {
    setAppState('idle');
    setOriginalImage(null);
    setOriginalUrl('');
    setMaskCanvas(null);
    setRenderedCanvas(null);
    setRenderedCanvasUrl('');
    setProgressPercent(0);
    setViewMode('editor');
  };

  const processImageFile = async (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    setAppState('processing');
    setProgressPercent(10);

    try {
      const origUrl = URL.createObjectURL(file);
      setOriginalUrl(origUrl);

      const origImg = new Image();
      origImg.src = origUrl;
      await new Promise((res) => (origImg.onload = res));
      setOriginalImage(origImg);

      setProgressPercent(25);
      setProgressKey('正在通过高精 AI 模型进行无损抠图...');

      let blob: Blob | null = null;

      // CDN Node 1: Fast jsDelivr CDN (国内访问极快)
      try {
        blob = await removeBackground(file, {
          publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1.4.5/dist/',
          output: { format: 'image/png', quality: 1.0 },
          progress: (_key: string, current: number, total: number) => {
            if (total > 0) {
              const pct = Math.min(90, Math.round(25 + (current / total) * 65));
              setProgressPercent(pct);
            }
          },
        });
      } catch (e1) {
        console.warn('jsDelivr CDN node unavailable, trying unpkg CDN node:', e1);
      }

      // CDN Node 2: Backup unpkg CDN
      if (!blob) {
        try {
          blob = await removeBackground(file, {
            publicPath: 'https://unpkg.com/@imgly/background-removal-data@1.4.5/dist/',
            output: { format: 'image/png', quality: 1.0 },
            progress: (_key: string, current: number, total: number) => {
              if (total > 0) {
                const pct = Math.min(90, Math.round(25 + (current / total) * 65));
                setProgressPercent(pct);
              }
            },
          });
        } catch (e2) {
          console.warn('unpkg CDN node unavailable, trying default node:', e2);
        }
      }

      // CDN Node 3: Default img.ly fallback
      if (!blob) {
        blob = await removeBackground(file, {
          output: { format: 'image/png', quality: 1.0 },
        });
      }

      setProgressPercent(95);
      setProgressKey('正在生成 1:1 无损蒙版...');

      const cutoutUrl = URL.createObjectURL(blob);
      const cutImg = new Image();
      cutImg.src = cutoutUrl;
      await new Promise((res) => (cutImg.onload = res));

      const mask = createMaskCanvas(origImg, cutImg);
      setMaskCanvas(mask);

      setProgressPercent(100);
      setAppState('ready');
    } catch (err) {
      console.error('Background removal error:', err);
      alert('抠图推理失败，请检查网络或重新选择图片。');
      setAppState('idle');
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
      processImageFile(file);
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
            <div className="workspace-toolbar">
              <div className="file-info-badge">
                <span className="file-name">{fileName}</span>
                <span className="res-tag">
                  {originalImage.naturalWidth} × {originalImage.naturalHeight} px (1:1 原画)
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

            <BackgroundSelector config={bgConfig} onChange={setBgConfig} />

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
