export interface DeepSeekBoxResult {
  minX: number; // percentage 0..100
  minY: number; // percentage 0..100
  maxX: number; // percentage 0..100
  maxY: number; // percentage 0..100
}

/**
 * Calls company Proxy /api/deepseek-vision to get primary subject bounding box.
 */
export async function callDeepSeekVisionAnalysis(file: File | Blob): Promise<DeepSeekBoxResult | null> {
  try {
    const response = await fetch('/api/deepseek-vision', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'image/png',
      },
      body: file,
    });

    if (!response.ok) {
      console.warn('DeepSeek Vision response not ok:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON box from model response string
    const jsonMatch = content.match(/\{[\s\S]*"box"\s*:\s*\[([\d\s,.]+)\][\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.box) && parsed.box.length === 4) {
        let [x1, y1, x2, y2] = parsed.box.map((v: number) => Number(v));

        // Normalize if values are decimals (0..1)
        if (x1 <= 1 && y1 <= 1 && x2 <= 1 && y2 <= 1 && (x2 > x1 || y2 > y1)) {
          x1 *= 100;
          y1 *= 100;
          x2 *= 100;
          y2 *= 100;
        }

        return {
          minX: Math.max(0, Math.min(100, x1)),
          minY: Math.max(0, Math.min(100, y1)),
          maxX: Math.max(0, Math.min(100, x2)),
          maxY: Math.max(0, Math.min(100, y2)),
        };
      }
    }

    return null;
  } catch (err) {
    console.error('Failed to call DeepSeek Vision API:', err);
    return null;
  }
}
