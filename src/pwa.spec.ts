import { describe, expect, it } from 'vitest';
import { canUseServiceWorker } from './pwa';

describe('canUseServiceWorker', () => {
  it.each([
    { label: 'the hosted HTTPS page', protocol: 'https:', supported: true, framed: false, expected: true },
    { label: 'a local HTTP dev server', protocol: 'http:', supported: true, framed: false, expected: true },
    { label: 'a downloaded file', protocol: 'file:', supported: true, framed: false, expected: false },
    { label: 'a browser without service workers', protocol: 'https:', supported: false, framed: false, expected: false },
    { label: 'a page inside a frame', protocol: 'https:', supported: true, framed: true, expected: false },
  ])('returns $expected for $label', ({ protocol, supported, framed, expected }) => {
    expect(canUseServiceWorker({ protocol, supported, framed })).toBe(expected);
  });
});
