import React, { useRef } from 'react';
import type { BackgroundConfig, BackgroundType } from '../utils/canvasHelper';
import { Check, Upload, Image as ImageIcon, Sliders, Palette } from 'lucide-react';

interface BackgroundSelectorProps {
  config: BackgroundConfig;
  onChange: (config: BackgroundConfig) => void;
}

const COLOR_PRESETS = [
  { name: '纯白', value: '#FFFFFF' },
  { name: '暗夜黑', value: '#121214' },
  { name: '摄影棚灰', value: '#F3F4F6' },
  { name: '绿幕 Chroma', value: '#00FF00' },
  { name: '温暖米黄', value: '#FDFBF7' },
  { name: '商务深蓝', value: '#1E293B' },
  { name: '马卡龙粉', value: '#FDE8E8' },
  { name: '薄荷淡绿', value: '#E6F4EA' },
];

const GRADIENT_PRESETS = [
  { name: '日光黄桃', color1: '#ff9a9e', color2: '#fecfef', angle: 45 },
  { name: '极光青蓝', color1: '#a1c4fd', color2: '#c2e9fb', angle: 135 },
  { name: '赛博霓虹', color1: '#8EC5FC', color2: '#E0C3FC', angle: 90 },
  { name: '暗黑金调', color1: '#232526', color2: '#414345', angle: 60 },
  { name: '深海湛蓝', color1: '#0f2027', color2: '#203a43', angle: 180 },
];

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ config, onChange }) => {
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const setType = (type: BackgroundType) => {
    onChange({ ...config, type });
  };

  const setColor = (color: string) => {
    onChange({ ...config, type: 'color', color });
  };

  const setGradient = (grad: { color1: string; color2: string; angle: number }) => {
    onChange({ ...config, type: 'gradient', gradient: grad });
  };

  const setBlurAmount = (blurAmount: number) => {
    onChange({ ...config, type: 'blur', blurAmount });
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        onChange({
          ...config,
          type: 'custom',
          customImage: img,
        });
      };
    }
  };

  return (
    <div className="bg-selector-panel">
      <div className="bg-tabs">
        <button
          className={`tab-btn ${config.type === 'transparent' ? 'active' : ''}`}
          onClick={() => setType('transparent')}
        >
          <span className="checker-icon" />
          <span>透明底</span>
        </button>
        <button
          className={`tab-btn ${config.type === 'color' ? 'active' : ''}`}
          onClick={() => setType('color')}
        >
          <Palette size={16} />
          <span>纯色背景</span>
        </button>
        <button
          className={`tab-btn ${config.type === 'gradient' ? 'active' : ''}`}
          onClick={() => setType('gradient')}
        >
          <div className="grad-icon" />
          <span>渐变背景</span>
        </button>
        <button
          className={`tab-btn ${config.type === 'blur' ? 'active' : ''}`}
          onClick={() => setType('blur')}
        >
          <Sliders size={16} />
          <span>毛玻璃虚化</span>
        </button>
        <button
          className={`tab-btn ${config.type === 'custom' ? 'active' : ''}`}
          onClick={() => {
            setType('custom');
            if (!config.customImage) {
              bgFileInputRef.current?.click();
            }
          }}
        >
          <ImageIcon size={16} />
          <span>自定义背景图</span>
        </button>
      </div>

      {/* Solid Color Options */}
      {config.type === 'color' && (
        <div className="color-options-grid">
          {COLOR_PRESETS.map((item, idx) => (
            <button
              key={idx}
              className={`color-swatch ${config.color === item.value ? 'selected' : ''}`}
              style={{ backgroundColor: item.value }}
              onClick={() => setColor(item.value)}
              title={item.name}
            >
              {config.color === item.value && (
                <Check size={14} className={item.value === '#FFFFFF' || item.value === '#F3F4F6' ? 'text-black' : 'text-white'} />
              )}
            </button>
          ))}
          <label className="color-picker-custom" title="自定义颜色">
            <input
              type="color"
              value={config.color}
              onChange={(e) => setColor(e.target.value)}
            />
            <span>+ 调色盘</span>
          </label>
        </div>
      )}

      {/* Gradient Options */}
      {config.type === 'gradient' && (
        <div className="gradient-options-grid">
          {GRADIENT_PRESETS.map((item, idx) => {
            const gradStyle = `linear-gradient(${item.angle}deg, ${item.color1}, ${item.color2})`;
            const isSelected =
              config.gradient.color1 === item.color1 && config.gradient.color2 === item.color2;
            return (
              <button
                key={idx}
                className={`gradient-swatch ${isSelected ? 'selected' : ''}`}
                style={{ background: gradStyle }}
                onClick={() => setGradient(item)}
              >
                <span>{item.name}</span>
                {isSelected && <Check size={14} className="check-mark" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Blur options */}
      {config.type === 'blur' && (
        <div className="blur-slider-control">
          <label>虚化程度: {config.blurAmount}px</label>
          <input
            type="range"
            min="2"
            max="40"
            value={config.blurAmount}
            onChange={(e) => setBlurAmount(Number(e.target.value))}
          />
        </div>
      )}

      {/* Custom Background Image */}
      <input
        type="file"
        ref={bgFileInputRef}
        onChange={handleCustomBgUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      {config.type === 'custom' && (
        <div className="custom-bg-control">
          {config.customImage ? (
            <div className="custom-bg-preview">
              <img src={config.customImage.src} alt="Custom Background" />
              <button className="btn-change-bg" onClick={() => bgFileInputRef.current?.click()}>
                <Upload size={14} /> 更换背景图
              </button>
            </div>
          ) : (
            <button className="btn-upload-bg-large" onClick={() => bgFileInputRef.current?.click()}>
              <Upload size={18} /> 选择背景图片文件
            </button>
          )}
        </div>
      )}
    </div>
  );
};
