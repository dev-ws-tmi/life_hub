/**
 * ticketPreprocessing.ts
 *
 * Prepara una imatge per a OCR:
 *  1. Llegeix la rotació EXIF del JPEG (problema crític amb fotos de mòbil)
 *  2. Crea un canvas amb l'orientació correcta
 *  3. Redimensiona a un màxim de 2000px (Tesseract treballa pitjor amb imatges molt grans)
 *  4. Converteix a escala de grisos
 *  5. Millora de contrast adaptatiu si la imatge és fosca
 *  6. Exporta com a PNG
 */

// ── EXIF Orientation ──────────────────────────────────────────────────────────

/**
 * Llegeix l'orientació EXIF d'un JPEG llegint directament els bytes.
 * Retorna un valor 1-8 (1 = normal, 6 = 90° CW, 3 = 180°, 8 = 90° CCW).
 */
async function readExifOrientation(file: File): Promise<number> {
  try {
    const buffer = await file.slice(0, 131072).arrayBuffer(); // llegim 128KB
    const view = new DataView(buffer);

    // Comprova que és un JPEG vàlid
    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xFFD8) return 1;

    let offset = 2;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset, false);
      const segLen = view.getUint16(offset + 2, false);

      if (marker === 0xFFE1) {
        // APP1 — pot ser EXIF
        if (offset + 10 < view.byteLength) {
          const exifHeader = view.getUint32(offset + 4, false);
          if (exifHeader === 0x45786966) {
            // "Exif"
            const tiffOffset = offset + 10; // skip "Exif\0\0"
            const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;

            const ifdStart = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
            if (ifdStart + 2 > view.byteLength) break;

            const numEntries = view.getUint16(ifdStart, littleEndian);
            for (let i = 0; i < numEntries && i < 64; i++) {
              const entryOffset = ifdStart + 2 + i * 12;
              if (entryOffset + 12 > view.byteLength) break;
              const tag = view.getUint16(entryOffset, littleEndian);
              if (tag === 0x0112) {
                // Orientation tag
                return view.getUint16(entryOffset + 8, littleEndian);
              }
            }
          }
        }
      }

      // Si és FF D9 (EOI) o segment invàlid, parem
      if (marker === 0xFFD9 || segLen < 2) break;
      offset += 2 + segLen;
    }
  } catch {
    // Si falla, assumim orientació normal
  }
  return 1;
}

// ── Aplicar transformació d'orientació al canvas ──────────────────────────────

function getRotatedDimensions(orientation: number, w: number, h: number): { cw: number; ch: number } {
  // Orientacions 5-8 impliquen rotació de 90° o 270° → intercanviem w/h
  if (orientation >= 5 && orientation <= 8) return { cw: h, ch: w };
  return { cw: w, ch: h };
}

function applyExifTransform(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  w: number,
  h: number
): void {
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, w, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, w, h); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, h); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, h, 0); break;
    case 7: ctx.transform(0, -1, -1, 0, h, w); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, w); break;
    // case 1: no transform needed
  }
}

// ── Processament de pixel (escala de grisos + contrast) ───────────────────────

function applyGrayscaleAndContrast(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Primera passada: escala de grisos + calcular luminositat mitja
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = data[i + 1] = data[i + 2] = lum;
    sum += lum;
  }

  const meanLum = sum / (data.length / 4);

  // Si la imatge és massa fosca o massa clara, ajustar contrast
  // Fotos de tiquet haurien de tenir luminositat ~180 (paper blanc)
  if (meanLum < 160 || meanLum > 230) {
    const target = 200; // target brightness for receipt paper
    const factor = target / Math.max(meanLum, 1);
    const clampFactor = Math.min(Math.max(factor, 0.5), 2.5);

    for (let i = 0; i < data.length; i += 4) {
      const v = Math.min(255, Math.max(0, Math.round(data[i] * clampFactor)));
      data[i] = data[i + 1] = data[i + 2] = v;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ── Funció principal ───────────────────────────────────────────────────────────

const MAX_SIDE = 2000; // Tesseract treballa millor fins a ~2000px
const MIN_SIDE = 1000; // Si la imatge és massa petita, escalar amunt

export async function preprocessImage(
  file: File
): Promise<{ blob: Blob; applied: string[] }> {
  const applied: string[] = [];

  // 1. Llegir orientació EXIF (crucial per fotos de mòbil)
  const orientation = await readExifOrientation(file);
  if (orientation !== 1) applied.push(`exif-fix-orientation-${orientation}`);

  // 2. Carregar la imatge
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
  URL.revokeObjectURL(url);

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  // 3. Calcular dimensions de sortida tenint en compte rotació EXIF
  const { cw: rotW, ch: rotH } = getRotatedDimensions(orientation, srcW, srcH);

  // 4. Escalar per respectar MAX_SIDE i MIN_SIDE
  let scale = 1;
  const maxSide = Math.max(rotW, rotH);
  const minSide = Math.min(rotW, rotH);
  if (maxSide > MAX_SIDE) {
    scale = MAX_SIDE / maxSide;
    applied.push('downscale');
  } else if (minSide < MIN_SIDE && minSide > 0) {
    scale = MIN_SIDE / minSide;
    applied.push('upscale');
  }

  const outW = Math.round(rotW * scale);
  const outH = Math.round(rotH * scale);

  // 5. Dibuixar al canvas amb la rotació correcta
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  // Fons blanc (útil quan hi ha zones transparents)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  ctx.save();
  ctx.scale(scale, scale);
  applyExifTransform(ctx, orientation, srcW, srcH);
  ctx.drawImage(img, 0, 0);
  ctx.restore();

  // 6. Escala de grisos + millora de contrast
  applyGrayscaleAndContrast(canvas);
  applied.push('grayscale', 'contrast-adjust');

  // 7. Exportar com a PNG
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => {
      if (b) resolve(b);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });

  return { blob, applied };
}
