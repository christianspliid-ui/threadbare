/**
 * Resizes 1024px hex tile PNGs from Assets/biomes/ to 256px web-optimized
 * versions in public/hex-tiles/.
 *
 * Usage: npx tsx scripts/resize-hex-tiles.ts
 */
import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, basename } from 'path';

const SOURCE_DIR = join(__dirname, '..', 'Assets', 'biomes');
const OUTPUT_DIR = join(__dirname, '..', 'public', 'hex-tiles');
const TARGET_SIZE = 256;

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = readdirSync(SOURCE_DIR)
    .filter(f => f.endsWith('.png') && !f.includes('-raw'));

  console.log(`Resizing ${files.length} hex tiles to ${TARGET_SIZE}px...`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const inputPath = join(SOURCE_DIR, file);
    const outputPath = join(OUTPUT_DIR, file);

    try {
      await sharp(inputPath)
        .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'fill' })
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(outputPath);

      const size = statSync(outputPath).size;
      console.log(`  OK ${file} → ${TARGET_SIZE}px (${Math.round(size / 1024)}KB)`);
      success++;
    } catch (err) {
      console.error(`  FAIL ${file}: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} resized, ${failed} failed`);
}

main().catch(console.error);
