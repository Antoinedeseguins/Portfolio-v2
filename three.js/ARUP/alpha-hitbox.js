// Ignore transparent padding and faint antialiasing/shadows in the logo artwork.
export function createAlphaMask(image) {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const solid = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < solid.length; i++) solid[i] = pixels[i * 4 + 3] >= 64 ? 1 : 0;
  return { width: canvas.width, height: canvas.height, solid };
}

export function overlapsAlphaMask(mask, image, obstacle) {
  if (image.width <= 0 || image.height <= 0) return false;
  const left = Math.max(image.left, obstacle.left);
  const top = Math.max(image.top, obstacle.top);
  const right = Math.min(image.left + image.width, obstacle.right);
  const bottom = Math.min(image.top + image.height, obstacle.bottom);
  if (right <= left || bottom <= top) return false;
  const x0 = Math.max(0, Math.floor((left - image.left) / image.width * mask.width));
  const y0 = Math.max(0, Math.floor((top - image.top) / image.height * mask.height));
  const x1 = Math.min(mask.width, Math.ceil((right - image.left) / image.width * mask.width));
  const y1 = Math.min(mask.height, Math.ceil((bottom - image.top) / image.height * mask.height));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (mask.solid[y * mask.width + x]) return true;
    }
  }
  return false;
}
