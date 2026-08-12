import React, { useState } from 'react';
import type { ExportFormat } from '../utils/canvasHelper';
import { exportHighResImage } from '../utils/canvasHelper';
import { formatResolution, calculateMegapixels } from '../utils/formatters';
import { Download, ShieldCheck, FileCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExportPanelProps {
  canvas: HTMLCanvasElement | null;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  fileName: string;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  canvas,
  originalWidth,
  originalHeight,
  fileName,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('png');

  const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'image';
  const targetExtension = format === 'jpg' ? '.jpg' : format === 'webp' ? '.webp' : '.png';
  const previewFilename = `${baseName}_HD_no_bg${targetExtension}`;

  const handleDownload = async () => {
    if (!canvas) return;
    setDownloading(true);

    try {
      await exportHighResImage(canvas, baseName, format);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="export-panel-card">
      <div className="export-stats">
        <div className="stat-box">
          <span className="stat-label">导出分辨率 (100% 原画)</span>
          <span className="stat-value text-green">
            {formatResolution(originalWidth, originalHeight)}
          </span>
          <span className="stat-sub">({calculateMegapixels(originalWidth, originalHeight)})</span>
        </div>

        <div className="stat-box">
          <span className="stat-label">文件导出格式</span>
          <div className="format-selector-buttons">
            <button
              className={`format-btn ${format === 'png' ? 'active' : ''}`}
              onClick={() => setFormat('png')}
              title="支持 32-bit 透明背景与无损画质"
            >
              PNG (透明/无损)
            </button>
            <button
              className={`format-btn ${format === 'jpg' ? 'active' : ''}`}
              onClick={() => setFormat('jpg')}
              title="体积更小，适合有背景颜色的图片"
            >
              JPG (高清)
            </button>
            <button
              className={`format-btn ${format === 'webp' ? 'active' : ''}`}
              onClick={() => setFormat('webp')}
              title="现代高效图片格式"
            >
              WEBP
            </button>
          </div>
          <span className="stat-sub">
            {format === 'png'
              ? '包含Alpha透明通道 (推荐透明背景使用)'
              : format === 'jpg'
              ? '不包含透明通道 (自动填充当前背景)'
              : '高压缩率现代 Web 格式'}
          </span>
        </div>

        <div className="stat-box">
          <span className="stat-label">生成文件名</span>
          <span className="stat-value filename-preview" title={previewFilename}>
            <FileCheck size={16} className="text-purple" />
            {previewFilename}
          </span>
          <span className="stat-sub">零压缩 · 保持 1:1 像素精度</span>
        </div>
      </div>

      <div className="export-action">
        <button
          className="btn-download-hd"
          onClick={handleDownload}
          disabled={!canvas || downloading}
        >
          <Download size={20} className={downloading ? 'animate-bounce' : ''} />
          <span>
            {downloading
              ? '正在打包...'
              : `免费导出 HD 原画质 ${format.toUpperCase()} 文件`}
          </span>
        </button>

        <div className="guarantee-text">
          <ShieldCheck size={14} className="text-green" />
          <span>100% 确保导出后缀为 <strong>.{format}</strong> · 保留完整 {originalWidth}×{originalHeight} 像素</span>
        </div>
      </div>
    </div>
  );
};
