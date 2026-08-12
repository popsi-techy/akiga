/**
 * Card header icon guardrail.
 *
 * The rule: **a `Card`'s `icon` prop takes a FILLED MUI icon, never an Outlined one.**
 *
 * This is not a taste preference. `CardHeaderIcon` forces the glyph to 15px, and at
 * 15px an outlined icon is a ~1px stroke in `--ds-color-icon-default` grey — it
 * reads as a smudge next to a 15px title, while its filled twin reads as a mark.
 * The two look almost identical in an icon picker at 24px, which is exactly why
 * this keeps happening: the mistake is invisible until it is on screen at the size
 * that matters.
 *
 * MUI names the variants by suffix — `Person` is filled, `PersonOutline` and
 * `PersonOutlined` are not — so the check is a suffix test on the identifier
 * passed to `icon`.
 *
 * Scope is deliberately narrow: **only the `Card` `icon` prop**. Outlined icons are
 * correct nearly everywhere else in the product — inside buttons, list rows, canvas
 * nodes, timelines — because those render at 16–20px where the stroke holds up.
 *
 * Run: `npm run check:icons`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Matches a `<Card …>` opening tag that passes `icon={<Something`. Dot-matches-all
 * so a multi-line `<Card>` (the common formatting) is still one match, and lazy so
 * the tag does not swallow the next component.
 */
const CARD_ICON = /<Card\b[^>]*?\bicon=\{\s*<\s*([A-Za-z0-9_]+)/gs;

/** MUI's outlined variants. `Outline` (no d) covers the legacy names. */
const isOutlined = (name: string) => /Outlined$|Outline$/.test(name);

/**
 * The suffix test is necessary but not sufficient: a handful of MUI icons carry no
 * `Outlined` suffix and are still drawn as a stroke. `Schedule` is the one that got
 * through — its glyph is a ring (an outer circle with an inner circle subtracted)
 * plus two hands, i.e. visually identical to `ScheduleOutlined`, so it fails the
 * 15px legibility test the suffix rule exists to enforce.
 *
 * These cannot be detected from the identifier, so they are named. Each maps to the
 * genuinely-filled icon to use instead. Add to this list whenever a Card icon turns
 * out to be a stroke on screen despite an unsuffixed name.
 */
const OUTLINE_SHAPED: Record<string, string> = {
  Schedule: 'WatchLater',
  AccessTime: 'WatchLater',
  QueryBuilder: 'WatchLater',
  AccessTimeFilled: 'WatchLater', // identical paths to AccessTimeOutlined
  RadioButtonUnchecked: 'Circle',
  PanoramaFishEye: 'Circle',
  Timer: 'AvTimer',
};

type Hit = { file: string; line: number; icon: string };
const errors: Hit[] = [];
let checked = 0;

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
    const source = readFileSync(full, 'utf8');
    let match: RegExpExecArray | null;
    CARD_ICON.lastIndex = 0;
    while ((match = CARD_ICON.exec(source))) {
      checked += 1;
      const icon = match[1];
      if (!isOutlined(icon) && !(icon in OUTLINE_SHAPED)) continue;
      errors.push({ file: rel, line: source.slice(0, match.index).split('\n').length, icon });
    }
  }
}

walk(join(__dirname, '..', 'src'));

console.log('\n  Icon check — a Card header icon is filled, never outlined\n');

if (errors.length > 0) {
  console.error(`  ✗ ${errors.length} outlined icon(s) passed to a Card. At 15px an outlined glyph reads as a smudge.\n`);
  for (const e of errors) {
    const filled = OUTLINE_SHAPED[e.icon] ?? e.icon.replace(/Outlined$|Outline$/, '');
    const why = OUTLINE_SHAPED[e.icon] ? ' (drawn as a stroke despite the unsuffixed name)' : '';
    console.error(`      ${e.file}:${e.line}  <Card icon={<${e.icon} />}${why}  →  use <${filled} />`);
  }
  console.error('');
  process.exit(1);
}

console.log(`  ✓ All ${checked} Card header icons are filled.\n`);
