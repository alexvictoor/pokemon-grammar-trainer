import { crc32, deflateSync } from 'node:zlib';

type Rgba = number[];

const RED: Rgba = [214, 58, 47, 255];
const WHITE: Rgba = [255, 255, 255, 255];
const OUTLINE: Rgba = [34, 34, 34, 255];

export interface IconStyle {
  padding: number;
  background: Rgba;
}

// Coordinates are fractions of the icon side, (0, 0) top left.
export const pokeBallColor = (x: number, y: number, { padding, background }: IconStyle): Rgba => {
  const radius = 0.47 - padding;
  const scale = radius / 0.47;
  const distance = Math.hypot(x - 0.5, y - 0.5);
  if (distance > radius) return background;
  if (distance > radius - 0.035 * scale) return OUTLINE;
  if (distance < 0.1 * scale) return WHITE;
  if (distance < 0.15 * scale) return OUTLINE;
  if (Math.abs(y - 0.5) < 0.035 * scale) return OUTLINE;
  return y < 0.5 ? RED : WHITE;
};

const SUPERSAMPLING = 4;

export const renderIcon = (size: number, style: IconStyle): Uint8Array => {
  const pixels = new Uint8Array(size * size * 4);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const sum = [0, 0, 0, 0];
      for (let sy = 0; sy < SUPERSAMPLING; sy++) {
        for (let sx = 0; sx < SUPERSAMPLING; sx++) {
          const color = pokeBallColor((column + (sx + 0.5) / SUPERSAMPLING) / size, (row + (sy + 0.5) / SUPERSAMPLING) / size, style);
          color.forEach((channel, index) => (sum[index] = (sum[index] ?? 0) + channel));
        }
      }
      sum.forEach((total, index) => (pixels[(row * size + column) * 4 + index] = Math.round(total / SUPERSAMPLING ** 2)));
    }
  }
  return pixels;
};

const chunk = (type: string, data: Buffer): Buffer => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
};

export const encodePng = (size: number, pixels: Uint8Array): Buffer => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const rows = Buffer.alloc(size * (1 + size * 4));
  for (let row = 0; row < size; row++) {
    rows.set(pixels.subarray(row * size * 4, (row + 1) * size * 4), row * (1 + size * 4) + 1);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};
