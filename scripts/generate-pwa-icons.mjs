import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = resolve(__dirname, '..');
const inputPath = resolve(root, 'public', 'logo.webp');
const outputDir = resolve(root, 'public');
const background = '#f5f8f2';

const outputs = [
  { size: 192, name: 'pwa-192.png' },
  { size: 512, name: 'pwa-512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

await mkdir(outputDir, { recursive: true });

const base = sharp(inputPath).ensureAlpha();

for (const { size, name } of outputs) {
  const outPath = resolve(outputDir, name);
  await base
    .clone()
    .resize(size, size, { fit: 'contain', background })
    .png()
    .toFile(outPath);
  console.log(`generated ${outPath}`);
}
