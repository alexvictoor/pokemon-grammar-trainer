import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PAYLOAD_BYTES = 4_500_000;

const here = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(here, 'probe.template.html'), 'utf8');
const payload = randomBytes(PAYLOAD_BYTES).toString('base64');
const fragment = template.replace('__PAYLOAD__', payload);

// The artifact host adds its own document skeleton; the standalone file needs one.
const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${fragment}
</html>
`;

mkdirSync(join(here, 'dist'), { recursive: true });
for (const [name, html] of [['artifact.html', fragment], ['index.html', standalone]]) {
  const out = join(here, 'dist', name);
  writeFileSync(out, html);
  console.log(`${out}: ${(Buffer.byteLength(html) / 1e6).toFixed(1)} MB`);
}
