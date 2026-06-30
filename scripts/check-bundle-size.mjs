#!/usr/bin/env node
// Fails CI if the initial JS bundle exceeds LIMIT_KB gzipped.
// Only inspects files whose names match index-*.js (the main entrypoint chunk).

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { gzipSync } from "zlib";

const DIST_DIR = "dist/assets";
const LIMIT_KB = 250;
const LIMIT_BYTES = LIMIT_KB * 1024;

let largest = 0;
let largestFile = "";

for (const name of readdirSync(DIST_DIR)) {
  if (!name.match(/^index-.*\.js$/)) continue;
  const content = readFileSync(join(DIST_DIR, name));
  const gz = gzipSync(content);
  if (gz.length > largest) {
    largest = gz.length;
    largestFile = name;
  }
}

const largestKB = (largest / 1024).toFixed(1);
console.log(`Initial bundle: ${largestKB} KB gzipped (${largestFile})`);
console.log(`Limit: ${LIMIT_KB} KB`);

if (largest > LIMIT_BYTES) {
  console.error(
    `\n❌ Bundle too large: ${largestKB} KB > ${LIMIT_KB} KB limit.\n` +
      `   Run \`npm run build\` and open dist/stats.html to find what's heavy.`,
  );
  process.exit(1);
} else {
  console.log(`✅ Within budget (${largestKB} / ${LIMIT_KB} KB)`);
}
