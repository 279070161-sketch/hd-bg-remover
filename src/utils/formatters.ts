export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatResolution(width: number, height: number): string {
  return `${width} × ${height} px`;
}

export function calculateMegapixels(width: number, height: number): string {
  const mp = (width * height) / 1000000;
  return `${mp.toFixed(1)} MP`;
}
