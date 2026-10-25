import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { encodePng, renderIcon, type IconStyle } from './icons';

const TRANSPARENT: IconStyle = { padding: 0, background: [0, 0, 0, 0] };
// Maskable icons are cropped to a circle or squircle: keep the ball inside the 80% safe zone.
const MASKABLE: IconStyle = { padding: 0.1, background: [236, 239, 243, 255] };
// iOS fills transparent pixels with black.
const APPLE: IconStyle = { padding: 0.04, background: [236, 239, 243, 255] };

const icons: [string, number, IconStyle][] = [
  ['icon-192.png', 192, TRANSPARENT],
  ['icon-512.png', 512, TRANSPARENT],
  ['icon-maskable-512.png', 512, MASKABLE],
  ['apple-touch-icon.png', 180, APPLE],
];

const dir = join(import.meta.dirname, '..', 'public', 'icons');
mkdirSync(dir, { recursive: true });
for (const [file, size, style] of icons) {
  writeFileSync(join(dir, file), encodePng(size, renderIcon(size, style)));
  console.log(`${file} (${size}px)`);
}
