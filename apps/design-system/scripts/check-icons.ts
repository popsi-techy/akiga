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
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
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

/**
 * The same failure, caught mechanically instead of by name.
 *
 * For a genuinely filled icon MUI ships two different glyphs — `Person` has mass,
 * `PersonOutlined` is a stroke. For a stroke-shaped one it ships the *same* path
 * under both names, because there was never a filled drawing to begin with:
 * `Sync` and `SyncOutlined` are byte-identical, as are `Schedule` and
 * `ScheduleOutlined`. So comparing the two path sets answers "is this actually
 * filled?" without anyone having to notice the smudge on screen first.
 *
 * This is what `OUTLINE_SHAPED` above was doing by hand. That list stays for the
 * cases this cannot see — an icon whose sibling is named differently, or one
 * with no Outlined sibling at all.
 */
const ICONS_DIR = join(__dirname, '..', 'node_modules', '@mui', 'icons-material');

function glyph(name: string): string | null {
  const file = join(ICONS_DIR, `${name}.js`);
  if (!existsSync(file)) return null;
  const paths = readFileSync(file, 'utf8').match(/d:\s*"[^"]*"/g);
  return paths ? paths.join('|') : null;
}

const strokeShapedCache = new Map<string, boolean>();
function isStrokeShaped(name: string): boolean {
  const cached = strokeShapedCache.get(name);
  if (cached !== undefined) return cached;
  const filled = glyph(name);
  const outlined = glyph(`${name}Outlined`);
  const same = filled !== null && outlined !== null && filled === outlined;
  strokeShapedCache.set(name, same);
  return same;
}

type Hit = { file: string; line: number; icon: string; reason: 'suffix' | 'named' | 'identical' };
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
      const reason: Hit['reason'] | null = isOutlined(icon)
        ? 'suffix'
        : icon in OUTLINE_SHAPED
          ? 'named'
          : isStrokeShaped(icon)
            ? 'identical'
            : null;
      if (!reason) continue;
      errors.push({ file: rel, line: source.slice(0, match.index).split('\n').length, icon, reason });
    }
  }
}

walk(join(__dirname, '..', 'src'));

console.log('\n  Icon check — a Card header icon is filled, never outlined\n');

if (errors.length > 0) {
  console.error(`  ✗ ${errors.length} outlined icon(s) passed to a Card. At 15px an outlined glyph reads as a smudge.\n`);
  for (const e of errors) {
    const filled = OUTLINE_SHAPED[e.icon] ?? e.icon.replace(/Outlined$|Outline$/, '');
    const why =
      e.reason === 'named'
        ? ' (drawn as a stroke despite the unsuffixed name)'
        : e.reason === 'identical'
          ? ` (identical path to ${e.icon}Outlined — MUI has no filled drawing for it)`
          : '';
    const fix = e.reason === 'identical' ? 'pick a genuinely filled icon' : `use <${filled} />`;
    console.error(`      ${e.file}:${e.line}  <Card icon={<${e.icon} />}${why}  →  ${fix}`);
  }
  console.error('');
  process.exit(1);
}

console.log(`  ✓ All ${checked} Card header icons are filled.\n`);
