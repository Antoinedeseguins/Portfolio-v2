// Sample the actual loaded font so the toy follows the site's typography.
export function sampleText(text, fontFamily, fontWeight) {
  const canvas = document.createElement("canvas");
  let context = canvas.getContext("2d", { willReadFrequently: true });
  const font = `${fontWeight} 128px ${fontFamily}`;
  context.font = font;
  const metrics = context.measureText(text);
  canvas.width = Math.ceil(metrics.width) + 16;
  canvas.height = 176;
  context = canvas.getContext("2d", { willReadFrequently: true });
  context.font = font;
  context.fillStyle = "white";
  context.fillText(text, 8, 132);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const points = [];
  const step = 4;
  for (let y = 2; y < canvas.height; y += step) for (let x = 2; x < canvas.width; x += step) {
    if (data[(y * canvas.width + x) * 4 + 3] >= 128) points.push({ x, y });
  }
  if (!points.length) throw new Error("The title could not be sampled");
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const scale = 6 / metrics.width;
  return {
    positions: points.map((point) => ({ x: (point.x - 8 - metrics.width / 2) * scale, y: (132 - point.y) * scale, z: 0 })),
    size: step * scale,
    scale,
    advanceWidth: metrics.width,
    width: 6,
    height: (maxY - minY + step) * scale,
  };
}
