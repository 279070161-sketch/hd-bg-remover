import React from 'react';
import { Shield, Cpu, Flame } from 'lucide-react';

export const FeaturesFooter: React.FC = () => {
  return (
    <footer className="features-footer">
      <div className="footer-container">
        <h3 className="section-title">
          <Flame size={20} className="text-orange" />
          为什么选择本无损抠图工具？
        </h3>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>特性 / 功能对比</th>
                <th className="highlight-column">本工具 (HD Background Remover)</th>
                <th>传统付费平台 (PhotoRoom / Remove.bg)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>导出分辨率</td>
                <td className="highlight-column text-green font-bold">100% 保持原图 (4K / 8K / 12MP+)</td>
                <td className="text-red">免费版压缩至 500x500 (0.25 MP)</td>
              </tr>
              <tr>
                <td>高画质导出费用</td>
                <td className="highlight-column text-green font-bold">完全免费 / 无次数限制</td>
                <td>需购买月度 / 年度会员订阅</td>
              </tr>
              <tr>
                <td>数据隐私与安全</td>
                <td className="highlight-column text-green font-bold">100% 浏览器本地运算 (零上传)</td>
                <td>必须上传至第三方服务器</td>
              </tr>
              <tr>
                <td>导出水印</td>
                <td className="highlight-column text-green font-bold">零水印 (No Watermark)</td>
                <td>部分免费导出带品牌水印</td>
              </tr>
              <tr>
                <td>精细边缘修整画笔</td>
                <td className="highlight-column text-green font-bold">支持手动擦除 / 恢复细节</td>
                <td>仅限高级版用户</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="tech-notes">
          <div className="note-card">
            <Cpu className="note-icon" size={22} />
            <div>
              <h4>WebAssembly / WebGPU ONNX 加速</h4>
              <p>采用端侧 AI 抠图模型，直接利用您的显卡/CPU 在浏览器内计算，速度更快且无需等待网络传输。</p>
            </div>
          </div>
          <div className="note-card">
            <Shield className="note-icon" size={22} />
            <div>
              <h4>离线亦可流畅运行</h4>
              <p>首次加载后模型将被浏览器自动缓存，即使断网或在局域网环境中也能正常完成无损抠图。</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
