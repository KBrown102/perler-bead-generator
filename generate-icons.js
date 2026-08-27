// 生成拼豆图纸生成器的 App 图标（无第三方依赖，纯 Node + zlib）
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---- PNG 编码 ---- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* ---- 绘制：珊瑚底 + 白色拼豆爱心 ---- */
const BG = [0xE0, 0x61, 0x3F]; // #e0613f

function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = BG[0]; buf[i * 4 + 1] = BG[1]; buf[i * 4 + 2] = BG[2]; buf[i * 4 + 3] = 255;
  }
  const pattern = [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0]
  ];
  const rows = pattern.length, cols = pattern[0].length;
  const area = size * 0.78;
  const gap = Math.max(1, Math.round(size * 0.012));
  const bead = Math.min(
    Math.floor((area - gap * (cols - 1)) / cols),
    Math.floor((area - gap * (rows - 1)) / rows)
  );
  const totalW = bead * cols + gap * (cols - 1);
  const totalH = bead * rows + gap * (rows - 1);
  const ox = Math.round((size - totalW) / 2);
  const oy = Math.round((size - totalH) / 2);
  const holeR = bead * 0.22;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!pattern[r][c]) continue;
      const x0 = ox + c * (bead + gap);
      const y0 = oy + r * (bead + gap);
      const cx = x0 + bead / 2, cy = y0 + bead / 2;
      for (let y = y0; y < y0 + bead; y++) {
        for (let x = x0; x < x0 + bead; x++) {
          const i = (y * size + x) * 4;
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy <= holeR * holeR) {
            buf[i] = BG[0]; buf[i + 1] = BG[1]; buf[i + 2] = BG[2]; buf[i + 3] = 255;
          } else {
            buf[i] = 255; buf[i + 1] = 255; buf[i + 2] = 255; buf[i + 3] = 255;
          }
        }
      }
    }
  }
  return buf;
}

const outDir = path.join(__dirname, 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const s of [192, 180, 512]) {
  const png = encodePNG(s, s, drawIcon(s));
  const file = path.join(outDir, 'icon-' + s + '.png');
  fs.writeFileSync(file, png);
  console.log('wrote', file, png.length, 'bytes');
}
