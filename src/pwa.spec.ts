import { describe, expect, it } from 'vitest';
import { canUseServiceWorker, shouldRequestFullscreen } from './pwa';

describe('shouldRequestFullscreen', () => {
  it.each([
    { label: 'a browser tab that supports it', supported: true, alreadyFullscreen: false, installed: false, expected: true },
    { label: 'a browser without the Fullscreen API (iPhone)', supported: false, alreadyFullscreen: false, installed: false, expected: false },
    { label: 'a page already in full screen', supported: true, alreadyFullscreen: true, installed: false, expected: false },
    { label: 'the installed app', supported: true, alreadyFullscreen: false, installed: true, expected: false },
  ])('returns $expected for $label', ({ supported, alreadyFullscreen, installed, expected }) => {
    expect(shouldRequestFullscreen({ supported, alreadyFullscreen, installed })).toBe(expected);
  });
});

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
