import React from 'react';
import { Sparkles, ShieldCheck, Maximize2, Zap } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasImage: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasImage }) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand" onClick={onReset} style={{ cursor: hasImage ? 'pointer' : 'default' }}>
          <div className="logo-icon">
            <Sparkles className="icon-sparkle" size={24} />
          </div>
          <div className="brand-text">
            <h1 className="title">HD Background Remover <span className="badge-pro">PRO</span></h1>
            <p className="subtitle">无损高画质抠图 · 零像素压缩 · 100% 本地 AI 运算</p>
          </div>
        </div>

        <div className="header-badges">
          <div className="badge-item" title="导出分辨率与原图完全一致（支持 4K/8K/数码相机原图）">
            <Maximize2 size={15} />
            <span>100% 原图分辨率</span>
          </div>
          <div className="badge-item" title="代码完全在浏览器端运行，图片不上传任何服务器">
            <ShieldCheck size={15} />
            <span>本地 AI 隐私无忧</span>
          </div>
          <div className="badge-item" title="无水印、无导出限制、完全免费">
            <Zap size={15} />
            <span>零水印 / 零压缩</span>
          </div>

          {hasImage && (
            <button className="btn-new-image" onClick={onReset}>
              上传新图片
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
