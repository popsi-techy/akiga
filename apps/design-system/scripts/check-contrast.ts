/**
 * WCAG contrast guardrail.
 *
 * Validates every semantic color pairing in the design tokens against WCAG 2.1.
 * Text pairings must meet AA (>= 4.5:1); graphical/UI pairings (1.4.11) must meet
 * >= 3:1. Exits non-zero on any failure so it can gate a build / DoD.
 *
 * Run: `npm run check:contrast`
 *
 * This exists because "AA is the floor" as prose was not enough — a low-contrast
 * token shipped unnoticed once. Now it's mechanical: a failing token can't pass.
 */
import { color } from '../src/design-system/tokens/tokens';

const AA_TEXT = 4.5; // normal text
const AA_UI = 3.0; // large text & UI component / graphical contrast (WCAG 1.4.11)

type Check = {
  label: string;
  fg: string;
  bg: string;
  min: number;
  /** WCAG-exempt (e.g. disabled/placeholder text, 1.4.3) — reported, not enforced. */
  exempt?: boolean;
  /** A deliberate, documented sub-threshold exception. Requires a justification.
   *  Reported loudly as WAIVED; does not fail the build. See ADR-0005. */
  waiver?: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: string, b: string): number {
  const L1 = relLuminance(hexToRgb(a));
  const L2 = relLuminance(hexToRgb(b));
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

const checks: Check[] = [];

// --- Text on backgrounds (AA) ---
const backgrounds: Record<string, string> = {
  canvas: color.background.canvas,
  surface: color.surface.default,
  subtle: color.background.subtle,
};
for (const [bn, bg] of Object.entries(backgrounds)) {
  checks.push({ label: `text.primary on ${bn}`, fg: color.text.primary, bg, min: AA_TEXT });
  checks.push({ label: `text.secondary on ${bn}`, fg: color.text.secondary, bg, min: AA_TEXT });
}
// Tertiary on all three too, for the same reason as `link` below: muted captions
// sit inside tinted panels constantly, and checking only white left the tinted case
// unguarded.
for (const [bn, bg] of Object.entries(backgrounds)) {
  checks.push({ label: `text.tertiary on ${bn}`, fg: color.text.tertiary, bg, min: AA_TEXT });
}
// Link text on all three grounds, not just white: a text-only control is the
// standard way to offer a secondary action here, so it lands in tinted panels and
// on the canvas as often as it does on a card.
for (const [bn, bg] of Object.entries(backgrounds)) {
  checks.push({ label: `text.link on ${bn}`, fg: color.text.link, bg, min: AA_TEXT });
}
checks.push({ label: 'text.brand on surface', fg: color.text.brand, bg: color.surface.default, min: AA_TEXT });
// Brand-colored text on the brand tint (active nav, brand labels) uses the darkest orange.
checks.push({ label: 'brand.primaryActive on brand.subtle', fg: color.brand.primaryActive, bg: color.brand.subtle, min: AA_TEXT });
// Avatar initials, however, are brand.primary by owner's decision — see the waiver.
checks.push({
  label: 'brand.primary on brand.subtle (avatar initials)',
  fg: color.brand.primary,
  bg: color.brand.subtle,
  min: AA_TEXT,
  waiver:
    "Owner's decision: every avatar renders its letter as brand.primary #EB5424 on " +
    'brand.subtle #FFF4EE = 3.33:1, below AA for normal text, and avatar letters are ' +
    '12-24px so the large-text allowance does not apply. Accepted knowingly for visual ' +
    'consistency. Mitigation: the avatar carries an aria-label with the full name, so no ' +
    'information depends on reading the letter. brand.primaryActive #9E3416 (6.57:1) is ' +
    'the compliant value if this is ever revisited.',
});
// Selected tab labels are brand.primary on the page surface, also by owner's decision.
checks.push({
  label: 'brand.primary on surface (selected tab label)',
  fg: color.brand.primary,
  bg: color.surface.default,
  min: AA_TEXT,
  waiver:
    "Owner's decision: the selected Tab label matches the underline at brand.primary " +
    '#EB5424 = 3.60:1 on white, below AA for its 14px regular type. This is the case ' +
    'text.brand #C9441E (4.85:1) was introduced for. Mitigation: the 1px indicator and ' +
    'aria-selected both mark the active tab, so selection never depends on the colour.',
});
checks.push({ label: 'text.inverse on sidebar', fg: color.text.inverse, bg: color.background.sidebar, min: AA_TEXT });
// The selected segment of a SegmentedControl, and anything else that puts label text on
// the inverse surface (ink 800).
checks.push({
  label: 'text.inverse on surface.inverse',
  fg: color.text.inverse,
  bg: color.surface.inverse,
  min: AA_TEXT,
});
checks.push({
  label: 'brand.onPrimary on brand.primary',
  fg: color.brand.onPrimary,
  bg: color.brand.primary,
  min: AA_TEXT,
  // DELIBERATE BRAND EXCEPTION — approved by the product owner (ADR-0005).
  // White on brand orange #EB5424 = 3.60:1: below AA (4.5) for normal text, but meets the
  // 3:1 bar for large text / UI. Kept to match the live product's primary CTA exactly.
  // Compliance guidance: use brand orange with white ONLY at >=24px, or >=18.66px bold.
  waiver:
    'Approved brand exception (ADR-0005): brand orange #EB5424 + white = 3.60:1 on the primary ' +
    'CTA. Meets 3:1 (large text/UI), below AA for normal text. Use brand-orange+white only at ' +
    '>=24px or >=18.66px bold to stay compliant.',
});
// Disabled/placeholder text is WCAG-exempt (1.4.3) — reported, not enforced.
checks.push({ label: 'text.disabled on surface', fg: color.text.disabled, bg: color.surface.default, min: AA_TEXT, exempt: true });

// --- Status: fg on subtle, onSolid on solid (AA) ---
for (const [k, s] of Object.entries(color.status)) {
  checks.push({ label: `status.${k}.fg on subtle`, fg: s.fg, bg: s.subtle, min: AA_TEXT });
  checks.push({ label: `status.${k}.onSolid on solid`, fg: s.onSolid, bg: s.solid, min: AA_TEXT });
}
// `fill` is the graphical-block role, and where a block carries a numeral — the
// StepTracker's done marker — the same white sits on it as on `solid`. Enforced
// only for success, the one fill currently used that way; add the others here if
// a component starts printing text on them.
checks.push({
  label: 'status.success.onSolid on fill',
  fg: color.status.success.onSolid,
  bg: color.status.success.fill,
  min: AA_TEXT,
});
// The StepTracker's skipped marker: white on the amber `warning.fill`. It cannot use
// `warning.onSolid`, which is near-black because it is paired with the far brighter
// `warning.solid` — so the pairing this component actually ships gets its own check.
checks.push({
  label: 'text.inverse on status.warning.fill',
  fg: color.text.inverse,
  bg: color.status.warning.fill,
  min: AA_TEXT,
});

// --- Graphical / UI contrast (1.4.11, >= 3:1) ---
checks.push({ label: 'icon.default on surface', fg: color.icon.default, bg: color.surface.default, min: AA_UI });
// icon.subtle is not decorative: it carries de-emphasised but meaningful glyphs —
// stage-card markers, hint affordances, stepper connectors. It sits on cards
// (surface) and on bare rows (canvas), so both must clear 3:1.
checks.push({ label: 'icon.subtle on surface', fg: color.icon.subtle, bg: color.surface.default, min: AA_UI });
checks.push({ label: 'icon.subtle on canvas', fg: color.icon.subtle, bg: color.background.canvas, min: AA_UI });
checks.push({ label: 'border.focus on canvas', fg: color.border.focus, bg: color.background.canvas, min: AA_UI });
// An unchecked control outlines against whichever surface it sits on — plain
// rows (surface) and striped/selected ones (subtle) — so both must clear 3:1.
checks.push({ label: 'border.control on surface', fg: color.border.control, bg: color.surface.default, min: AA_UI });
checks.push({ label: 'border.control on subtle', fg: color.border.control, bg: color.background.subtle, min: AA_UI });
// Graphical fills (bars, chart segments, legend dots) carry meaning, so each must
// clear 3:1 against the card it sits on and against the subtle track behind it.
for (const [k, s] of Object.entries(color.status)) {
  checks.push({ label: `status.${k}.fill on surface`, fg: s.fill, bg: color.surface.default, min: AA_UI });
  checks.push({ label: `status.${k}.fill on subtle`, fg: s.fill, bg: color.background.subtle, min: AA_UI });
}

/* --- Tinted-surface outlines (design floor, not WCAG) ---
 * A chip/callout border is decorative — the label inside carries the meaning at AA,
 * so 1.4.11's 3:1 does not apply and hitting it would make the outline shout over
 * the text. But it still has to be SEEN, and that had no guardrail: blue and yellow
 * borders shipped at 1.07:1 on their own tint, i.e. invisible, while red sat at
 * 1.60:1 and looked correct. VISIBLE_MIN is the floor that failure implies; the
 * upper bound stays a judgement call (currently the band tops out at 1.80:1).
 *
 * The floor is 1.3 rather than 1.4 because this ratio is LUMINANCE only, and that
 * understates a border whose hue differs sharply from its fill: a saturated yellow
 * reads as an edge at a ratio where a pale blue would not. So the number is a
 * regression guard against the invisible cases, not a claim that everything at 1.3
 * looks identical; picking the step within the band is still done by eye. */
const VISIBLE_MIN = 1.3;
/** Intents the owner has deliberately taken below the floor. Reported as WAIVED. */
const BORDER_WAIVERS: Record<string, string> = {
  warning: // yellow[300] = 1.18:1
    "Owner's choice: warning keeps yellow[300] (1.18:1 on its own tint), below the 1.3 " +
    'visibility floor, because [400] and [500] both read too loud beside the other three ' +
    'tiers. Yellow’s high chroma carries the edge further than the luminance ratio implies, ' +
    'and nothing here depends on the border — the label meets AA on its own (5.30:1). Step ' +
    'back to yellow[400] (1.33:1) if a Medium chip ever needs a clearly bounded edge.',
};
for (const [k, s] of Object.entries(color.status)) {
  checks.push({
    label: `status.${k}.border on its subtle`,
    fg: s.border,
    bg: s.subtle,
    min: VISIBLE_MIN,
    waiver: BORDER_WAIVERS[k],
  });
}

// --- Evaluate ---
type Status = 'PASS' | 'FAIL' | 'EXEMPT' | 'WAIVED';
let failed = 0;
let waived = 0;
const rows = checks.map((c) => {
  const ratio = contrast(c.fg, c.bg);
  const meets = ratio >= c.min;
  let status: Status;
  if (meets) status = 'PASS';
  else if (c.exempt) status = 'EXEMPT';
  else if (c.waiver) {
    status = 'WAIVED';
    waived++;
  } else {
    status = 'FAIL';
    failed++;
  }
  return { ...c, ratio, status };
});

console.log('\n  WCAG contrast check — semantic token pairings\n');
for (const r of rows) {
  const mark =
    r.status === 'FAIL' ? '✗' : r.status === 'PASS' ? '✓' : r.status === 'WAIVED' ? '⚠' : '·';
  console.log(
    `  ${mark} ${r.status.padEnd(6)} ${`${r.ratio.toFixed(2)}:1`.padStart(8)}  (min ${r.min})  ${r.label}`,
  );
  if (r.status === 'WAIVED') console.log(`      ↳ ${r.waiver}`);
}
console.log('');

const passed = rows.filter((r) => r.status === 'PASS').length;
if (failed > 0) {
  console.error(`  ✗ ${failed} pairing(s) FAIL WCAG. Darken the token(s) before shipping.\n`);
  process.exit(1);
} else {
  // Each waiver states its own justification above; don't attribute them all to one
  // ADR — only the brand-CTA exception is ADR-0005.
  const note = waived
    ? ` ${waived} documented exception${waived > 1 ? 's' : ''} (WAIVED) — justification printed above.`
    : '';
  console.log(`  ✓ ${passed} enforced pairings meet WCAG.${note}\n`);
}
