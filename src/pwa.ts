export const canUseServiceWorker = ({ protocol, supported, framed }: { protocol: string; supported: boolean; framed: boolean }): boolean =>
  supported && !framed && (protocol === 'https:' || protocol === 'http:');

export const shouldRequestFullscreen = ({ supported, alreadyFullscreen, installed }: { supported: boolean; alreadyFullscreen: boolean; installed: boolean }): boolean =>
  supported && !alreadyFullscreen && !installed;

// Browsers only grant full screen from a tap, so the intro's start button calls this.
export const enterFullscreen = (): void => {
  const root = document.documentElement;
  const installed = window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  if (!shouldRequestFullscreen({ supported: typeof root.requestFullscreen === 'function', alreadyFullscreen: document.fullscreenElement !== null, installed })) return;
  root.requestFullscreen({ navigationUI: 'hide' }).catch(() => undefined);
};

// The service worker and the manifest only exist next to the hosted page; a downloaded copy works without them.
export const registerServiceWorker = (): void => {
  const framed = window.self !== window.top;
  if (!canUseServiceWorker({ protocol: window.location.protocol, supported: 'serviceWorker' in navigator, framed })) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
};
