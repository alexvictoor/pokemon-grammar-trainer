import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { encodePng, pokeBallColor, renderIcon } from './icons';

const RED = [214, 58, 47, 255];
const WHITE = [255, 255, 255, 255];
const OUTLINE = [34, 34, 34, 255];
const CLEAR = [0, 0, 0, 0];

describe('pokeBallColor', () => {
  it.each([
    { label: 'the top half', x: 0.5, y: 0.25, color: RED },
    { label: 'the bottom half', x: 0.5, y: 0.75, color: WHITE },
    { label: 'the middle band', x: 0.2, y: 0.5, color: OUTLINE },
    { label: 'the button centre', x: 0.5, y: 0.5, color: WHITE },
    { label: 'a corner outside the ball', x: 0.02, y: 0.02, color: CLEAR },
  ])('paints $label', ({ x, y, color }) => {
    expect(pokeBallColor(x, y, { padding: 0, background: CLEAR })).toEqual(color);
  });

  it('fills the corners with the background of a maskable icon', () => {
    const background = [236, 239, 243, 255];

    expect(pokeBallColor(0.02, 0.02, { padding: 0.1, background })).toEqual(background);
  });
});

describe('renderIcon', () => {
  it('returns one RGBA pixel per square of the requested size', () => {
    const pixels = renderIcon(8, { padding: 0, background: CLEAR });

    expect(pixels).toHaveLength(8 * 8 * 4);
  });
});

describe('encodePng', () => {
  it('writes a PNG whose header and pixels read back', () => {
    const pixels = renderIcon(4, { padding: 0, background: CLEAR });

    const png = encodePng(4, pixels);

    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(png.readUInt32BE(16)).toBe(4);
    expect(png.readUInt32BE(20)).toBe(4);
    const idatLength = png.readUInt32BE(33);
    const raw = inflateSync(png.subarray(41, 41 + idatLength));
    expect(raw).toHaveLength(4 * (1 + 4 * 4));
  });
});
