const RASTER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_SVG_BYTES = 200 * 1024;
const MAX_DIMENSION = 1400;
const LOGO_MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.82;

const UNSAFE_SVG = [
  "<script",
  "onload=",
  "onerror=",
  "onclick=",
  "onmouseover=",
  "javascript:",
  "<foreignobject",
];

export function isAcceptedImage(file: File, allowSvg = false): boolean {
  if (RASTER_TYPES.has(file.type)) return true;
  return allowSvg && (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg"));
}

export async function readAndCompressImage(file: File): Promise<string> {
  return compressRaster(file, MAX_DIMENSION);
}

export async function readProjectLogo(file: File): Promise<string> {
  if (!isAcceptedImage(file, true)) {
    throw new Error("Please choose a JPG, PNG, WEBP, GIF, or SVG image.");
  }
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return readSafeSvg(file);
  }
  return compressRaster(file, LOGO_MAX_DIMENSION);
}

async function compressRaster(file: File, maxDimension: number): Promise<string> {
  if (!RASTER_TYPES.has(file.type)) {
    throw new Error("Please choose a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Image is too large. Please choose a file under 8 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not process this image.");
    }
    context.drawImage(image, 0, 0, width, height);

    const keepPng = file.type === "image/png" || file.type === "image/gif";
    const dataUrl = keepPng
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function compressProjectLogo(
  file: File,
  maxDimension = LOGO_MAX_DIMENSION,
): Promise<{ blob: Blob; contentType: string }> {
  if (!isAcceptedImage(file, true)) {
    throw new Error("Please choose a JPG, PNG, WEBP, GIF, or SVG image.");
  }
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    if (file.size > MAX_SVG_BYTES) {
      throw new Error("SVG is too large. Please choose a file under 200 KB.");
    }
    const text = await file.text();
    const lower = text.toLowerCase();
    if (UNSAFE_SVG.some((token) => lower.includes(token))) {
      throw new Error("This SVG contains unsupported content.");
    }
    return { blob: new Blob([text], { type: "image/svg+xml" }), contentType: "image/svg+xml" };
  }

  const dataUrl = await compressRaster(file, maxDimension);
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  const contentType = match?.[1] ?? "image/png";
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return { blob, contentType };
}

async function readSafeSvg(file: File): Promise<string> {
  if (file.size > MAX_SVG_BYTES) {
    throw new Error("SVG is too large. Please choose a file under 200 KB.");
  }
  const text = await file.text();
  const lower = text.toLowerCase();
  if (UNSAFE_SVG.some((token) => lower.includes(token))) {
    throw new Error("This SVG contains unsupported content.");
  }
  return `data:image/svg+xml;base64,${utf8ToBase64(text)}`;
}

function utf8ToBase64(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read this image."));
    image.src = src;
  });
}
