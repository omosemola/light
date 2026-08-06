const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height, bgColorHex, circleColorHex) {
  // Simple uncompressed/deflated raw PNG generator
  const r1 = parseInt(bgColorHex.slice(1, 3), 16);
  const g1 = parseInt(bgColorHex.slice(3, 5), 16);
  const b1 = parseInt(bgColorHex.slice(5, 7), 16);

  const r2 = parseInt(circleColorHex.slice(1, 3), 16);
  const g2 = parseInt(circleColorHex.slice(3, 5), 16);
  const b2 = parseInt(circleColorHex.slice(5, 7), 16);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.35;

  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= radius) {
        rawData[offset++] = r2;
        rawData[offset++] = g2;
        rawData[offset++] = b2;
        rawData[offset++] = 255;
      } else {
        rawData[offset++] = r1;
        rawData[offset++] = g1;
        rawData[offset++] = b1;
        rawData[offset++] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // color type RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = chunk('IHDR', header);
  const idat = chunk('IDAT', deflated);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ -1) >>> 0;
}

fs.writeFileSync('public/icon-192x192.png', createPng(192, 192, '#1E1B4B', '#FBBF24'));
fs.writeFileSync('public/icon-512x512.png', createPng(512, 512, '#1E1B4B', '#FBBF24'));
console.log('PWA PNG icons generated successfully!');
