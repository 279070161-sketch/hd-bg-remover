import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { BackgroundConfig, EdgeRefineOptions } from '../utils/canvasHelper';
import {
  renderCompositedCanvas,
  applyBrushToMask,
  processMaskRefinement,
  keepMainSubjectComponent,
  applyPointGuidedIsolation,
} from '../utils/canvasHelper';
import { callDeepSeekVisionAnalysis } from '../utils/deepseekVisionApi';
import {
  Eraser,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Paintbrush,
  Sliders,
  Crop,
  Bot,
  Check,
  ShieldCheck,
  MousePointerClick,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

interface CanvasEditorProps {
  originalImg: HTMLImageElement;
  maskCanvas: HTMLCanvasElement;
  bgConfig: BackgroundConfig;
  onUpdateMask: () => void;
  onCanvasRendered: (canvas: HTMLCanvasElement) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  originalImg,
  maskCanvas,
  bgConfig,
  onUpdateMask,
  onCanvasRendered,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Refined Mask Canvas (post-processed)
  const [activeMaskCanvas, setActiveMaskCanvas] = useState<HTMLCanvasElement>(maskCanvas);

  // Real-time Refine controls
  const [showRefinePanel, setShowRefinePanel] = useState(true);
  const [refineOptions, setRefineOptions] = useState<EdgeRefineOptions>({
    alphaCutoff: 15,
    edgeContrast: 1.2,
  });

  // DeepSeek V4 Pro AI Vision Loading State
  const [isDeepSeekAnalyzing, setIsDeepSeekAnalyzing] = useState(false);

  // Bounding Box Crop-Selection tool mode
  const [boxSelectActive, setBoxSelectActive] = useState(false);
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [boxCurrent, setBoxCurrent] = useState<{ x: number; y: number } | null>(null);

  // SAM 2 Point-Guided Prompting mode
  const [pointModeActive, setPointModeActive] = useState(false);
  const [pointPromptType, setPointPromptType] = useState<'include' | 'exclude'>('exclude');
  const [userPoints, setUserPoints] = useState<Array<{ x: number; y: number; type: 'include' | 'exclude' }>>([]);

  // Brush settings
  const [brushActive, setBrushActive] = useState(false);
  const [brushMode, setBrushMode] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState(40);
  const [isDrawing, setIsDrawing] = useState(false);

  // Mouse cursor circle for brush preview
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Canvas zoom & pan
  const [scale, setScale] = useState(1);

  const width = originalImg.naturalWidth;
  const height = originalImg.naturalHeight;

  // Whenever refineOptions or maskCanvas change, update activeMaskCanvas
  useEffect(() => {
    const processed = processMaskRefinement(maskCanvas, refineOptions);
    setActiveMaskCanvas(processed);
  }, [maskCanvas, refineOptions]);

  // Re-render target canvas whenever dependencies change
  const render = useCallback(() => {
    if (canvasRef.current) {
      renderCompositedCanvas(canvasRef.current, originalImg, activeMaskCanvas, bgConfig);
      onCanvasRendered(canvasRef.current);
    }
  }, [originalImg, activeMaskCanvas, bgConfig, onCanvasRendered]);

  useEffect(() => {
    render();
  }, [render]);

  // Retain largest connected component (Rider + Bike), purging floating speed line fragments safely
  const handleKeepMainSubject = () => {
    keepMainSubjectComponent(maskCanvas);
    const processed = processMaskRefinement(maskCanvas, refineOptions);
    setActiveMaskCanvas(processed);
    render();
    onUpdateMask();
  };

  // DeepSeek V4 Pro AI Vision Intelligent Crop (Company Proxy http://192.168.1.190/)
  const handleDeepSeekVisionAutoClean = async () => {
    setIsDeepSeekAnalyzing(true);
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d');
      ctx?.drawImage(originalImg, 0, 0);

      const blob: Blob = await new Promise((res) => tempCanvas.toBlob((b) => res(b!), 'image/png'));
      const result = await callDeepSeekVisionAnalysis(blob);

      if (result) {
        const minX = (result.minX / 100) * width;
        const maxX = (result.maxX / 100) * width;
        const minY = (result.minY / 100) * height;
        const maxY = (result.maxY / 100) * height;

        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          const imgData = maskCtx.getImageData(0, 0, width, height);
          const data = imgData.data;

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              if (x < minX || x > maxX || y < minY || y > maxY) {
                const idx = (y * width + x) * 4;
                data[idx + 3] = 0; // Erase outside box
              }
            }
          }

          maskCtx.putImageData(imgData, 0, 0);
          const processed = processMaskRefinement(maskCanvas, refineOptions);
          setActiveMaskCanvas(processed);
          render();
          onUpdateMask();
        }
      }
    } catch (err) {
      console.error('DeepSeek Vision auto-clean error:', err);
    } finally {
      setIsDeepSeekAnalyzing(false);
    }
  };

  // Bounding Box Selection Handler (Clear everything outside selected box)
  const applyBoxSelection = () => {
    if (!boxStart || !boxCurrent) return;

    const minX = Math.min(boxStart.x, boxCurrent.x);
    const maxX = Math.max(boxStart.x, boxCurrent.x);
    const minY = Math.min(boxStart.y, boxCurrent.y);
    const maxY = Math.max(boxStart.y, boxCurrent.y);

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x < minX || x > maxX || y < minY || y > maxY) {
          const idx = (y * width + x) * 4;
          data[idx + 3] = 0; // Erase outside box
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const processed = processMaskRefinement(maskCanvas, refineOptions);
    setActiveMaskCanvas(processed);
    render();
    onUpdateMask();

    setBoxSelectActive(false);
    setBoxStart(null);
    setBoxCurrent(null);
  };

  // Handle Canvas Pointer Events (Brush, SAM2 Point & Box Selection)
  const handleCanvasPointer = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const maskX = Math.max(0, Math.min(width, clientX * scaleX));
    const maskY = Math.max(0, Math.min(height, clientY * scaleY));

    if (boxSelectActive && isDrawing && boxStart) {
      setBoxCurrent({ x: maskX, y: maskY });
      return;
    }

    if (brushActive) {
      setCursorPos({ x: e.clientX, y: e.clientY });

      if (isDrawing || e.buttons === 1) {
        applyBrushToMask(maskCanvas, maskX, maskY, {
          mode: brushMode,
          size: brushSize,
          hardness: 0.8,
        });
        const processed = processMaskRefinement(maskCanvas, refineOptions);
        setActiveMaskCanvas(processed);
        render();
        onUpdateMask();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const maskX = Math.max(0, Math.min(width, clientX * scaleX));
    const maskY = Math.max(0, Math.min(height, clientY * scaleY));

    setIsDrawing(true);

    if (pointModeActive) {
      // SAM2 Point-Guided Click Isolation
      applyPointGuidedIsolation(maskCanvas, maskX, maskY, pointPromptType);
      setUserPoints((prev) => [...prev, { x: maskX, y: maskY, type: pointPromptType }]);

      const processed = processMaskRefinement(maskCanvas, refineOptions);
      setActiveMaskCanvas(processed);
      render();
      onUpdateMask();
    } else if (boxSelectActive) {
      setBoxStart({ x: maskX, y: maskY });
      setBoxCurrent({ x: maskX, y: maskY });
    } else if (brushActive) {
      handleCanvasPointer(e);
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handlePointerLeave = () => {
    setIsDrawing(false);
    setCursorPos(null);
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(0.2, prev + delta), 4.0));
  };

  const resetView = () => {
    setScale(1);
  };

  return (
    <div className="canvas-editor-container">
      {/* Tool Bar: SAM 2 Point Prompting & Clean Tools */}
      <div className="editor-toolbar">
        <div className="tool-group">
          {/* SAM 2 Point Prompting Toggle */}
          <button
            className={`tool-btn btn-photoroom-clean ${pointModeActive ? 'active' : ''}`}
            onClick={() => {
              setPointModeActive(!pointModeActive);
              setBrushActive(false);
              setBoxSelectActive(false);
            }}
            title="SAM 2 智能点选交互（点击保留主体，或点击消除任意速度线/杂影）"
          >
            <MousePointerClick size={16} className="text-yellow" />
            <span>{pointModeActive ? '退出点选模式' : '🎯 SAM 2 智能点选隔离'}</span>
          </button>

          {pointModeActive && (
            <>
              <button
                className={`mode-btn ${pointPromptType === 'exclude' ? 'active-erase' : ''}`}
                onClick={() => setPointPromptType('exclude')}
                title="点选速度线或地面阴影（瞬间消除该笔触）"
              >
                <MinusCircle size={14} className="text-red" /> 🔴 点消速度线
              </button>
              <button
                className={`mode-btn ${pointPromptType === 'include' ? 'active-restore' : ''}`}
                onClick={() => setPointPromptType('include')}
                title="点选骑手或车架（强力锁定保留主体）"
              >
                <PlusCircle size={14} className="text-green" /> 🟢 点保骑手主体
              </button>
            </>
          )}

          {/* Main Subject Component Filter (BFS Connected Component) */}
          <button
            className="tool-btn"
            onClick={handleKeepMainSubject}
            title="保留完整骑手+自行车主体，自动清理悬浮速度线片段"
          >
            <ShieldCheck size={16} />
            <span>智能保留主主体</span>
          </button>

          {/* DeepSeek V4 Pro AI Vision Auto-Clean */}
          <button
            className="tool-btn"
            onClick={handleDeepSeekVisionAutoClean}
            disabled={isDeepSeekAnalyzing}
            title="DeepSeek V4 Pro 视觉大脑智能识别主体"
          >
            <Bot size={16} />
            <span>
              {isDeepSeekAnalyzing ? 'DeepSeek 正在分析...' : '🧠 DeepSeek 视觉定位'}
            </span>
          </button>

          {/* Smart Box Selection Tool */}
          <button
            className={`tool-btn ${boxSelectActive ? 'active' : ''}`}
            onClick={() => {
              setBoxSelectActive(!boxSelectActive);
              setBrushActive(false);
              setPointModeActive(false);
            }}
            title="一键框选主体"
          >
            <Crop size={16} />
            <span>{boxSelectActive ? '拖动框选...' : '框选范围'}</span>
          </button>

          {boxSelectActive && boxStart && boxCurrent && (
            <button
              className="tool-btn btn-photoroom-clean"
              onClick={applyBoxSelection}
              title="确认保留框内主体"
            >
              <Check size={16} />
              <span>确认保留</span>
            </button>
          )}

          {/* Fine-Tuning Eraser & Restoration Brush */}
          <button
            className={`tool-btn ${brushActive ? 'active' : ''}`}
            onClick={() => {
              setBrushActive(!brushActive);
              setBoxSelectActive(false);
              setPointModeActive(false);
            }}
            title="精细画笔修边"
          >
            <Paintbrush size={16} />
            <span>{brushActive ? '退出画笔' : '画笔修边'}</span>
          </button>

          {brushActive && (
            <>
              <button
                className={`mode-btn ${brushMode === 'erase' ? 'active-erase' : ''}`}
                onClick={() => setBrushMode('erase')}
                title="擦除"
              >
                <Eraser size={14} /> 擦除
              </button>
              <button
                className={`mode-btn ${brushMode === 'restore' ? 'active-restore' : ''}`}
                onClick={() => setBrushMode('restore')}
                title="恢复"
              >
                <RotateCcw size={14} /> 恢复
              </button>

              <div className="brush-slider-group">
                <span>画笔大小: {brushSize}px</span>
                <input
                  type="range"
                  min="10"
                  max="150"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
              </div>
            </>
          )}

          <div className="toolbar-divider" />

          {/* Edge Refine Toggle */}
          <button
            className={`tool-btn ${showRefinePanel ? 'active' : ''}`}
            onClick={() => setShowRefinePanel(!showRefinePanel)}
            title="微调边缘 Alpha 阀值"
          >
            <Sliders size={16} />
            <span>实时边缘调校</span>
          </button>
        </div>

        <div className="tool-group">
          <button className="tool-btn-icon" onClick={() => handleZoom(-0.15)} title="缩小">
            <ZoomOut size={16} />
          </button>
          <span className="zoom-text">{Math.round(scale * 100)}%</span>
          <button className="tool-btn-icon" onClick={() => handleZoom(0.15)} title="放大">
            <ZoomIn size={16} />
          </button>
          <button className="tool-btn-icon" onClick={resetView} title="适应屏幕 / 100% 原始尺寸">
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* Real-time Edge Refine Sliders Bar */}
      {showRefinePanel && (
        <div className="refine-controls-bar">
          <div className="refine-slider">
            <label>
              淡色速度线/杂质擦除 (Alpha Cutoff): <strong>{refineOptions.alphaCutoff}</strong>
            </label>
            <input
              type="range"
              min="0"
              max="120"
              value={refineOptions.alphaCutoff}
              onChange={(e) =>
                setRefineOptions({ ...refineOptions, alphaCutoff: Number(e.target.value) })
              }
            />
          </div>

          <div className="refine-slider">
            <label>
              轮廓对比度 (Sharpening): <strong>{refineOptions.edgeContrast}</strong>
            </label>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={refineOptions.edgeContrast}
              onChange={(e) =>
                setRefineOptions({ ...refineOptions, edgeContrast: Number(e.target.value) })
              }
            />
          </div>
          <span className="refine-hint">💡 向右拖动【Alpha Cutoff】可瞬间切除浅灰色速度线与噪点</span>
        </div>
      )}

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        className={`canvas-viewport ${bgConfig.type === 'transparent' ? 'checkerboard-bg' : ''}`}
        onPointerMove={handleCanvasPointer}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{
          cursor: pointModeActive ? 'crosshair' : boxSelectActive ? 'crosshair' : brushActive ? 'none' : 'default',
        }}
      >
        <div
          className="canvas-stage"
          style={{
            transform: `scale(${scale})`,
            position: 'relative',
          }}
        >
          <canvas ref={canvasRef} className="main-canvas" />

          {/* SAM2 Point Markers */}
          {userPoints.map((pt, idx) => (
            <div
              key={idx}
              className={`sam-point-marker ${pt.type}`}
              style={{
                left: `${(pt.x / width) * 100}%`,
                top: `${(pt.y / height) * 100}%`,
              }}
            />
          ))}

          {/* Bounding Box Selection Overlay */}
          {boxSelectActive && boxStart && boxCurrent && (
            <div
              className="box-select-overlay"
              style={{
                left: `${(Math.min(boxStart.x, boxCurrent.x) / width) * 100}%`,
                top: `${(Math.min(boxStart.y, boxCurrent.y) / height) * 100}%`,
                width: `${(Math.abs(boxCurrent.x - boxStart.x) / width) * 100}%`,
                height: `${(Math.abs(boxCurrent.y - boxStart.y) / height) * 100}%`,
              }}
            >
              <span className="box-tag">保留此框内主体</span>
            </div>
          )}
        </div>

        {/* Brush Cursor Circle Overlay */}
        {brushActive && cursorPos && (
          <div
            className={`brush-cursor ${brushMode}`}
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              width: `${brushSize * scale}px`,
              height: `${brushSize * scale}px`,
            }}
          />
        )}
      </div>
    </div>
  );
};
