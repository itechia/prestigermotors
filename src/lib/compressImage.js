// Compressão de imagens no navegador, antes do upload.
// Fotos de celular chegam com 4–12 MB e 4000px de largura; o site nunca exibe
// mais que ~1920px. Reduzir aqui deixa o catálogo mais leve, economiza banda do
// visitante e evita o erro de "arquivo muito grande" no envio.

const MAX_DIMENSION = 1920;
const QUALITY = 0.82;
// GIF (pode ser animado) e SVG passam sem alteração.
const COMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp"]);

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file, { maxDimension = MAX_DIMENSION, quality = QUALITY } = {}) {
  if (typeof document === "undefined") return file;
  if (!file || !COMPRESSIBLE.has(file.type)) return file;

  try {
    const img = await loadImage(file);
    const largestSide = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;

    // Já é pequena e leve: não vale a pena reprocessar.
    if (scale === 1 && file.size <= 600 * 1024) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // PNG pode ter transparência — WebP preserva; JPEG não.
    const keepsAlpha = file.type === "image/png" || file.type === "image/webp";
    const targetType = keepsAlpha ? "image/webp" : "image/jpeg";

    let blob = await canvasToBlob(canvas, targetType, quality);
    // Navegador sem encoder WebP devolve PNG; nesse caso mantemos o original
    // quando não houver ganho de tamanho.
    if (!blob) return file;

    if (blob.size >= file.size) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    return new File([blob], `${baseName}.${ext}`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch {
    // Qualquer falha (imagem corrompida, canvas bloqueado): envia o original.
    return file;
  }
}
