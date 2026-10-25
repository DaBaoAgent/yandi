// 将 ImageGen 输出的 rgb24 PNG 转为 RGBA 透明底（纯色背景抠除 + 硬边保持）
const fs = require('fs');
const zlib = require('zlib');

function decodePNG(file) {
  const b = fs.readFileSync(file);
  let off = 8, w = 0, h = 0, bitDepth = 8, colorType = 2;
  const idat = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') {
      w = b.readUInt32BE(off + 8); h = b.readUInt32BE(off + 12);
      bitDepth = b[off + 16]; colorType = b[off + 17];
    } else if (type === 'IDAT') idat.push(b.slice(off + 8, off + 8 + len));
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) throw new Error('unsupported ' + bitDepth + '/' + colorType);
  if (colorType === 6) throw new Error('ALREADY RGBA — 禁止二次转换（会损坏像素）');
  const ch = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const out = Buffer.alloc(w * h * ch);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.slice(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0, bb = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (ft === 1) v = (v + a) & 255;
      else if (ft === 2) v = (v + bb) & 255;
      else if (ft === 3) v = (v + ((a + bb) >> 1)) & 255;
      else if (ft === 4) { const p = a + bb - c, pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? bb : c)) & 255; }
      cur[x] = v;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { w, h, ch, data: out };
}

function encodePNG(img) {
  const { w, h, ch, data } = img;
  const stride = w * ch;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw);
  const crcTable = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c; }
  function crc(buf) { let c = ~0; for (const byte of buf) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8); return ~c >>> 0; }
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type, 'ascii');
    const crcb = Buffer.alloc(4); crcb.writeUInt32BE(crc(Buffer.concat([t, data]))); // PNG CRC 为大端序
    return Buffer.concat([len, t, data, crcb]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

for (const f of process.argv.slice(2)) {
  const img = decodePNG(f);
  const { w, h, data } = img;
  // 采样四角+四边中点确定背景色
  const samples = [];
  const pts = [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3], [w >> 1, 2], [w >> 1, h - 3], [2, h >> 1], [w - 3, h >> 1]];
  for (const [x, y] of pts) { const i = (y * w + x) * 3; samples.push([data[i], data[i + 1], data[i + 2]]); }
  const bg = samples[0];
  // 棋盘格背景有两色（浅灰/白）——按亮度分类：接近任一样本即透明
  let cleared = 0;
  const rgba = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    const r = data[p * 3], g = data[p * 3 + 1], bl = data[p * 3 + 2];
    let isBg = false;
    for (const s of samples) {
      if (Math.abs(r - s[0]) <= 10 && Math.abs(g - s[1]) <= 10 && Math.abs(bl - s[2]) <= 10) { isBg = true; break; }
    }
    rgba[p * 4] = r; rgba[p * 4 + 1] = g; rgba[p * 4 + 2] = bl; rgba[p * 4 + 3] = isBg ? 0 : 255;
    if (isBg) cleared++;
  }
  const out = { w, h, ch: 4, data: rgba };
  fs.writeFileSync(f, encodePNG(out));
  console.log(f, 'bg=' + bg.join(','), 'cleared', (cleared / (w * h) * 100).toFixed(1) + '%', '-> RGBA');
}
