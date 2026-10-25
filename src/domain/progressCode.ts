import { type } from 'arktype';
import type { GameState } from './save';

const VERSION = 1;
const CODE_PATTERN = /^GT(\d+)-([0-9a-f]{8})-([A-Za-z0-9_-]+)$/;

const payloadSchema = type({
  n: 'string',
  d: 'number',
  b: { '[string]': '1 <= number.integer <= 5' },
  s: 'number.integer[]',
  c: { '[string]': 'number.integer >= 1' },
  'g?': 'string[]',
});

export interface Progress {
  nickname: string;
  sharedAt: number;
  boxes: Record<string, number>;
  seen: number[];
  caught: Record<string, number>;
  badges: string[];
}

export type DecodeResult = { ok: true; progress: Progress } | { ok: false; error: 'not-a-code' | 'typo' | 'newer-version' | 'corrupt' };

const fnv1a = (text: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};

// A failed write also errors the readable side, so the read below reports it.
const transform = async (bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> => {
  const writer = stream.writable.getWriter();
  writer.write(bytes).catch(() => undefined);
  writer.close().catch(() => undefined);
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
};

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (text: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), character => character.charCodeAt(0));

export const encodeProgress = async (game: GameState, nickname: string, now: number): Promise<string> => {
  const payload = {
    n: nickname,
    d: now,
    b: Object.fromEntries(Object.entries(game.cards).flatMap(([id, card]) => (card ? [[id, card.box]] : []))),
    s: game.seen,
    c: game.caught,
    g: game.badges ?? [],
  };
  const compressed = await transform(new TextEncoder().encode(JSON.stringify(payload)), new CompressionStream('deflate-raw'));
  const body = toBase64Url(compressed);
  return `GT${VERSION}-${fnv1a(body)}-${body}`;
};

export const decodeProgress = async (pasted: string): Promise<DecodeResult> => {
  const match = CODE_PATTERN.exec(pasted.replace(/\s+/g, ''));
  if (!match) return { ok: false, error: 'not-a-code' };
  const [, version, checksum, body] = match as unknown as [string, string, string, string];
  if (Number(version) > VERSION) return { ok: false, error: 'newer-version' };
  if (fnv1a(body) !== checksum) return { ok: false, error: 'typo' };

  try {
    const json = new TextDecoder().decode(await transform(fromBase64Url(body), new DecompressionStream('deflate-raw')));
    const payload = payloadSchema(JSON.parse(json));
    if (payload instanceof type.errors) return { ok: false, error: 'corrupt' };
    return { ok: true, progress: { nickname: payload.n, sharedAt: payload.d, boxes: payload.b, seen: payload.s, caught: payload.c, badges: payload.g ?? [] } };
  } catch {
    return { ok: false, error: 'corrupt' };
  }
};

const CODE_START = /GT\d+-[0-9a-f]{8}-[A-Za-z0-9_-]*/;
const CODE_CONTINUATION = /^[A-Za-z0-9_-]+$/;

// A messaging app may wrap a long code over several lines: a following line made only of code characters continues it.
export const findCodes = (text: string): string[] => {
  const lines = text.split(/\r?\n/);
  const codes: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const start = CODE_START.exec(line);
    if (!start) continue;
    let code = start[0];
    if (line.slice(start.index + code.length).trim() === '') {
      while (CODE_CONTINUATION.test(lines[i + 1]?.trim() ?? '')) {
        code += (lines[i + 1] ?? '').trim();
        i++;
      }
    }
    codes.push(code);
  }
  return codes;
};

export const restoreGame =(progress: Progress, now: number): GameState => ({
  version: 1,
  nickname: progress.nickname,
  cards: Object.fromEntries(Object.entries(progress.boxes).map(([id, box]) => [id, { box, dueAt: now }])),
  seen: progress.seen,
  caught: progress.caught,
  badges: progress.badges,
  streak: 0,
});
