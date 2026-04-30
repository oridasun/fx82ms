// Generate PWA icons from public/icon.svg using sharp.
// Outputs to public/ so vite-plugin-pwa includes them in build.
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src  = resolve(root, 'public/icon.svg');
const out  = resolve(root, 'public');
mkdirSync(out, { recursive: true });

const svg = readFileSync(src);

const targets = [
  // any: full-bleed icon (use as-is)
  { name: 'pwa-192x192.png',  size: 192, fit: 'any' },
  { name: 'pwa-512x512.png',  size: 512, fit: 'any' },
  // maskable: 80% safe area, padded with shell color so home-screen mask doesn't clip
  { name: 'pwa-maskable-512.png', size: 512, fit: 'maskable' },
  // apple-touch (no transparency, recommended 180x180)
  { name: 'apple-touch-icon.png', size: 180, fit: 'any' },
  // favicons PNG
  { name: 'favicon-32.png', size: 32, fit: 'any' },
  { name: 'favicon-16.png', size: 16, fit: 'any' }
];

for (const t of targets) {
  let pipeline;
  if (t.fit === 'maskable') {
    // Render the SVG at 80% of canvas, centered, on the shell background.
    const inner = Math.round(t.size * 0.8);
    const inset = Math.round((t.size - inner) / 2);
    const innerPng = await sharp(svg).resize(inner, inner).png().toBuffer();
    pipeline = sharp({
      create: { width: t.size, height: t.size, channels: 4, background: '#1f2937' }
    }).composite([{ input: innerPng, top: inset, left: inset }]).png();
  } else {
    pipeline = sharp(svg).resize(t.size, t.size).png();
  }
  await pipeline.toFile(resolve(out, t.name));
  process.stdout.write(`  ✓ ${t.name} (${t.size}×${t.size})\n`);
}

process.stdout.write('PWA icons generated.\n');
