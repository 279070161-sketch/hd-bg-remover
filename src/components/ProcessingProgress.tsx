import React from 'react';
import { Cpu, Sparkles, CheckCircle2, Layers } from 'lucide-react';

interface ProcessingProgressProps {
  progressKey: string;
  progressPercent: number;
  fileName: string;
  resolutionInfo?: string;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  progressPercent,
  fileName,
  resolutionInfo,
}) => {
  const getStageMessage = () => {
    if (progressPercent < 30) {
      return '正在初始化神经网络模型与加速引擎...';
    } else if (progressPercent < 75) {
      return 'AI 正在智能识别主体边缘与发丝细节...';
    } else if (progressPercent < 95) {
      return '正在合成高分辨率透明通道 (Alpha Channel)...';
    }
    return '正在准备原图尺寸 1:1 无损 Canvas 画布...';
  };

  return (
    <div className="processing-overlay">
      <div className="processing-card">
        <div className="processing-header">
          <div className="ai-badge">
            <Cpu size={18} className="animate-spin-slow" />
            <span>WebAssembly AI 引擎运行中</span>
          </div>
          <h3>正在进行高画质无损抠图...</h3>
          <p className="file-meta">
            文件: <span className="text-white">{fileName}</span>
            {resolutionInfo && <> · 原图尺寸: <span className="text-white">{resolutionInfo}</span></>}
          </p>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar-background">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.max(8, progressPercent)}%` }}
            />
          </div>
          <div className="progress-percent-label">{Math.round(progressPercent)}%</div>
        </div>

        <div className="status-message">
          <Sparkles size={16} className="text-purple animate-pulse" />
          <span>{getStageMessage()}</span>
        </div>

        <div className="processing-steps">
          <div className={`step-item ${progressPercent >= 20 ? 'completed' : 'active'}`}>
            <CheckCircle2 size={14} />
            <span>模型加载</span>
          </div>
          <div className={`step-item ${progressPercent >= 70 ? 'completed' : progressPercent >= 20 ? 'active' : ''}`}>
            <Layers size={14} />
            <span>智能抠图 segmentation</span>
          </div>
          <div className={`step-item ${progressPercent >= 100 ? 'completed' : progressPercent >= 70 ? 'active' : ''}`}>
            <Sparkles size={14} />
            <span>1:1 无损画质导出准备</span>
          </div>
        </div>
      </div>
    </div>
  );
};
