import fs from 'fs';
import { doodles } from './doodle-image.js';

let existingData = { pngUrls: [] };
if (fs.existsSync('doodle-png.json')) {
  const raw = fs.readFileSync('doodle-png.json');
  existingData = JSON.parse(raw);
}

const newPngUrls = doodles.nfts.map(nft => nft.image?.pngUrl || null);

const allPngUrls = Array.from(new Set([...existingData.pngUrls, ...newPngUrls]));

fs.writeFileSync('doodle-png.json', JSON.stringify({ pngUrls: allPngUrls }, null, 2));

console.log('✅ doodle-png.json updated (appended and deduplicated).');