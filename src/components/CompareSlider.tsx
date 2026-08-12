import React, { useState, useRef, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface CompareSliderProps {
  originalSrc: string;
  processedCanvasUrl: string;
  width: number;
  height: number;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  originalSrc,
  processedCanvasUrl,
  width,
  height,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let pos = (x / rect.width) * 100;
      if (pos < 0) pos = 0;
      if (pos > 100) pos = 100;
      setSliderPosition(pos);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      className="compare-slider-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Background layer: Processed Image */}
      <div className="compare-layer processed-layer">
        <img src={processedCanvasUrl} alt="抠图效果" />
        <div className="layer-tag after-tag">抠图无损效果</div>
      </div>

      {/* Top layer: Original Image (clipped) */}
      <div
        className="compare-layer original-layer"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img src={originalSrc} alt="原图" />
        <div className="layer-tag before-tag">原图 ({width} × {height})</div>
      </div>

      {/* Vertical Slider Bar Handle */}
      <div
        className="slider-bar"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="slider-handle">
          <SlidersHorizontal size={18} />
        </div>
      </div>
    </div>
  );
};
