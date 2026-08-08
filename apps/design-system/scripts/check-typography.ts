/**
 * Typography guardrail.
 *
 * The rule: **a `text-*` class IS the complete type style.** Every entry in the
 * Tailwind `fontSize` map carries its own `fontWeight`, so emphasis is chosen by
 * switching to the `-strong` partner — never by bolting a `font-*` utility onto a
 * size class.
 *
 * This exists because the scale was previously size-only: `tokens.ts` defined a
 * weight per style, Tailwind dropped it, and every call site picked its own. The
 * result was 20 distinct size+weight pairings in the wild — including `text-h5
 * font-medium`, `text-h5 font-bold` and `text-caption font-bold`, combinations that
 * exist in no scale. Prose could not have caught that; this does.
 *
 * Run: `npm run check:type`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SIZES = [
  'display', 'h1', 'h2', 'h3', 'h4', 'h5',
  'card-title', 'body-lg', 'body-strong', 'body-medium', 'body-sm-strong', 'body-sm-medium', 'body-sm', 'body',
  'caption-strong', 'caption-medium', 'caption', 'overline', 'micro', 'stat',
];
const WEIGHTS = ['thin', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'];

/** A size class and a weight utility in the same className — the banned pattern. */
const PAIRED = new RegExp(
  `\\btext-(?:${SIZES.join('|')})\\b[^"'\`]{0,120}?\\bfont-(?:${WEIGHTS.join('|')})\\b` +
    `|\\bfont-(?:${WEIGHTS.join('|')})\\b[^"'\`]{0,120}?\\btext-(?:${SIZES.join('|')})\\b`,
  'g',
);
/**
 * A raw weight utility anywhere. Legitimate emphasis has exactly two names:
 * `font-emphasis` (600, for text whose size is inherited or set dynamically) and
 * `font-normal` (400, to de-emphasise a run inside a stronger parent — a count
 * beside a heading, say). Anything else lets a call site invent its own step.
 */
const BARE = new RegExp(`\\bfont-(?:${WEIGHTS.filter((w) => w !== 'normal').join('|')})\\b`, 'g');

type Hit = { file: string; line: number; text: string };
const errors: Hit[] = [];
const warnings: Hit[] = [];

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue;
      walk(full);
      continue;
    }
    if (!entry.endsWith('.tsx')) continue;
    const rel = full.replace(/\\/g, '/').replace(/.*?\/src\//, 'src/');
    readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
      const hit: Hit = { file: rel, line: i + 1, text: line.trim().slice(0, 110) };
      if (PAIRED.test(line)) errors.push(hit);
      else if (BARE.test(line)) warnings.push(hit);
      PAIRED.lastIndex = 0;
      BARE.lastIndex = 0;
    });
  }
}

walk(join(__dirname, '..', 'src'));

console.log('\n  Typography check — a text-* class is the whole type style\n');

if (warnings.length > 0) {
  console.error(`  ✗ ${warnings.length} raw weight utility(ies). Use a -strong type class, or font-emphasis.`);
  for (const w of warnings) console.error(`      ${w.file}:${w.line}  ${w.text}`);
  console.error('');
  process.exit(1);
}

if (errors.length > 0) {
  console.error(`  ✗ ${errors.length} size class paired with a weight utility. Use the -strong partner instead.\n`);
  for (const e of errors) console.error(`      ${e.file}:${e.line}  ${e.text}`);
  console.error('');
  process.exit(1);
}

console.log('  ✓ No size class is paired with a weight utility.\n');
