export const canUseServiceWorker = ({ protocol, supported, framed }: { protocol: string; supported: boolean; framed: boolean }): boolean =>
  supported && !framed && (protocol === 'https:' || protocol === 'http:');

// The service worker and the manifest only exist next to the hosted page; a downloaded copy works without them.
export const registerServiceWorker = (): void => {
  const framed = window.self !== window.top;
  if (!canUseServiceWorker({ protocol: window.location.protocol, supported: 'serviceWorker' in navigator, framed })) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
};
