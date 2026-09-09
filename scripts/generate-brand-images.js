// Gera os PNGs de marca (favicons, ícone iOS, imagem Open Graph) sem depender
// de bibliotecas externas: rasterizador simples + encoder PNG em Node puro.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ─── Encoder PNG ────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtro "none"
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ─── Canvas ─────────────────────────────────────────────────────────────
const SS = 4; // amostras por eixo (antisserrilhado)

function createCanvas(width, height) {
  return { width, height, data: Buffer.alloc(width * height * 4) };
}

function fillBackground(canvas, colorAt) {
  const { width, height, data } = canvas;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = colorAt(x / width, y / height);
      const i = (y * width + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
}

// Desenha uma forma definida por um teste "está dentro?", com antisserrilhado.
function drawShape(canvas, bbox, inside, [r, g, b], alpha = 1) {
  const { width, height, data } = canvas;
  const x0 = Math.max(0, Math.floor(bbox[0]));
  const y0 = Math.max(0, Math.floor(bbox[1]));
  const x1 = Math.min(width, Math.ceil(bbox[2]));
  const y1 = Math.min(height, Math.ceil(bbox[3]));

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          if (inside(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS)) hits++;
        }
      }
      if (hits === 0) continue;
      const a = (hits / (SS * SS)) * alpha;
      const i = (y * width + x) * 4;
      data[i] = Math.round(data[i] * (1 - a) + r * a);
      data[i + 1] = Math.round(data[i + 1] * (1 - a) + g * a);
      data[i + 2] = Math.round(data[i + 2] * (1 - a) + b * a);
      data[i + 3] = Math.max(data[i + 3], Math.round(255 * a));
    }
  }
}

const roundedRect = (x, y, w, h, r) => ({
  bbox: [x, y, x + w, y + h],
  inside: (px, py) => {
    if (px < x || px > x + w || py < y || py > y + h) return false;
    const cx = Math.min(Math.max(px, x + r), x + w - r);
    const cy = Math.min(Math.max(py, y + r), y + h - r);
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= r * r;
  },
});

const circle = (cx, cy, r) => ({
  bbox: [cx - r, cy - r, cx + r, cy + r],
  inside: (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r,
});

const polygon = (points) => {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return {
    bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    inside: (px, py) => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    },
  };
};

const draw = (canvas, shape, color, alpha) =>
  drawShape(canvas, shape.bbox, shape.inside, color, alpha);

// ─── Marca: silhueta de carro ───────────────────────────────────────────
const INK = [0x14, 0x18, 0x1f];
const ACCENT = [0xff, 0xc2, 0x3d];

// Desenha o carro dentro de um quadrado (ox, oy, size), em unidades 0-100.
function drawCar(canvas, ox, oy, size, color, wheelColor) {
  const u = (v) => (v / 100) * size;
  const X = (v) => ox + u(v);
  const Y = (v) => oy + u(v);

  // Cabine (trapézio com o teto arredondado)
  draw(canvas, polygon([
    [X(30), Y(52)], [X(40), Y(26)], [X(64), Y(26)], [X(78), Y(52)],
  ]), color);
  draw(canvas, roundedRect(X(38), Y(24), u(28), u(12), u(6)), color);

  // Carroceria
  draw(canvas, roundedRect(X(8), Y(48), u(84), u(24), u(9)), color);

  // Vidros (recorte na cor de fundo)
  draw(canvas, polygon([
    [X(37), Y(48)], [X(43), Y(32)], [X(50), Y(32)], [X(50), Y(48)],
  ]), wheelColor);
  draw(canvas, polygon([
    [X(54), Y(48)], [X(54), Y(32)], [X(62), Y(32)], [X(72), Y(48)],
  ]), wheelColor);

  // Rodas
  for (const cx of [28, 72]) {
    draw(canvas, circle(X(cx), Y(74), u(14)), color);
    draw(canvas, circle(X(cx), Y(74), u(6)), wheelColor);
  }
}

// ─── Ícone quadrado ─────────────────────────────────────────────────────
function makeIcon(size) {
  const canvas = createCanvas(size, size);
  fillBackground(canvas, () => [0, 0, 0]);
  // fundo transparente antes do quadrado arredondado
  canvas.data.fill(0);
  draw(canvas, roundedRect(0, 0, size, size, size * 0.22), INK);
  const inner = size * 0.76;
  drawCar(canvas, (size - inner) / 2, (size - inner) / 2 + size * 0.02, inner, ACCENT, INK);
  return encodePng(size, size, canvas.data);
}

// ─── Imagem Open Graph ──────────────────────────────────────────────────
function makeOgImage(width = 1200, height = 630) {
  const canvas = createCanvas(width, height);

  const glowR = height * 0.85;
  fillBackground(canvas, (fx, fy) => {
    const t = Math.min(1, Math.max(0, fx * 0.55 + fy * 0.65));
    const from = [0x0b, 0x0e, 0x13];
    const to = [0x2a, 0x33, 0x46];
    const base = from.map((c, i) => c + (to[i] - c) * t);

    // Brilho radial suave atrás do carro (sem faixas: calculado por pixel).
    const dx = (fx - 0.5) * width;
    const dy = (fy - 0.46) * height;
    const d = Math.sqrt(dx * dx + dy * dy) / glowR;
    const glow = Math.max(0, 1 - d) ** 2 * 0.16;

    return base.map((c, i) => Math.round(Math.min(255, c + (ACCENT[i] - c) * glow)));
  });

  // Carro central
  const carSize = height * 0.72;
  drawCar(canvas, (width - carSize) / 2, height * 0.14, carSize, ACCENT, [0x0f, 0x13, 0x1a]);

  // Faixa inferior de destaque
  draw(canvas, roundedRect(width * 0.38, height * 0.88, width * 0.24, 14, 7), ACCENT);
  draw(canvas, roundedRect(0, height - 10, width, 10, 0), ACCENT, 0.9);

  return encodePng(width, height, canvas.data);
}

// ─── Saída ──────────────────────────────────────────────────────────────
const root = process.argv[2] || require("path").join(__dirname, "..");
const out = (rel, buf) => {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log(rel, (buf.length / 1024).toFixed(1) + " KB");
};

out("app/apple-icon.png", makeIcon(180));
out("public/icon-192.png", makeIcon(192));
out("public/icon-512.png", makeIcon(512));
out("app/opengraph-image.png", makeOgImage());
