import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Upload, Sparkles, CheckCircle2 } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onSelectSample: (sampleUrl: string, name: string) => void;
}

const SAMPLE_IMAGES = [
  {
    name: '人像摄影',
    category: 'Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: '电商产品',
    category: 'Product',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: '萌宠动物',
    category: 'Pet',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: '汽车摄影',
    category: 'Vehicle',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=300&q=80',
  },
];

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, onSelectSample }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const extractImageFile = (e: DragEvent | React.DragEvent): File | null => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|avif|bmp|tiff?)$/i.test(file.name)) {
        return file;
      }
    }
    const items = e.dataTransfer?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && (item.type.startsWith('image/') || item.type === '')) {
          const file = item.getAsFile();
          if (file) return file;
        }
      }
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent | DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragActive(true);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent | DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent | DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving target or window
    if (e.target === document.documentElement || e.target === document.body || (e as React.DragEvent).currentTarget === e.target) {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent | DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = extractImageFile(e);
    if (file) {
      onFileSelect(file);
    } else {
      alert('请拖拽有效的图片文件 (JPG, PNG, WEBP, AVIF)。');
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  // Global window drag & drop listener to capture drop anywhere on the page
  useEffect(() => {
    const onWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
      setIsDragActive(true);
    };

    const onWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDragActive(false);
      }
    };

    const onWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const file = extractImageFile(e);
      if (file) {
        onFileSelect(file);
      }
    };

    window.addEventListener('dragover', onWindowDragOver);
    window.addEventListener('dragleave', onWindowDragLeave);
    window.addEventListener('drop', onWindowDrop);

    return () => {
      window.removeEventListener('dragover', onWindowDragOver);
      window.removeEventListener('dragleave', onWindowDragLeave);
      window.removeEventListener('drop', onWindowDrop);
    };
  }, [onFileSelect]);

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              onFileSelect(file);
              break;
            }
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFileSelect]);

  return (
    <div className="dropzone-container">
      {/* Global Full-Screen Drag & Drop Overlay */}
      {isDragActive && (
        <div
          className="fullscreen-drag-overlay"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="drag-overlay-card">
            <Upload size={64} className="animate-bounce text-purple" />
            <h2>松开鼠标，立即开始无损抠图</h2>
            <p>100% 保留原始分辨率 · 本地 AI 加速</p>
          </div>
        </div>
      )}

      <div
        className={`dropzone-card ${isDragActive ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp, image/avif, image/bmp, image/tiff"
          style={{ display: 'none' }}
        />

        <div className="dropzone-icon-wrapper">
          <Upload className="dropzone-icon" size={48} />
          <div className="pulse-ring" />
        </div>

        <div className="dropzone-text">
          <h2>拖拽图片到窗口任意位置，或 <span className="highlight-text">点击上传</span></h2>
          <p className="support-info">
            支持 JPG, PNG, WEBP, AVIF, BMP 等格式 · 支持文件拖拽 / 剪贴板直接粘贴 (Ctrl+V)
          </p>
        </div>

        <div className="feature-pills">
          <div className="pill"><CheckCircle2 size={14} /> 100% 原始尺寸输出</div>
          <div className="pill"><CheckCircle2 size={14} /> 自动识别人像/商品/动物</div>
          <div className="pill"><CheckCircle2 size={14} /> 支持高清无损导出</div>
        </div>
      </div>

      <div className="samples-section">
        <div className="samples-header">
          <Sparkles size={16} className="text-purple" />
          <span>没有图片？尝试示例图片快速体验：</span>
        </div>
        <div className="samples-grid">
          {SAMPLE_IMAGES.map((sample, idx) => (
            <div
              key={idx}
              className="sample-card"
              onClick={() => onSelectSample(sample.url, sample.name)}
            >
              <img src={sample.thumb} alt={sample.name} loading="lazy" />
              <div className="sample-overlay">
                <span>{sample.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
