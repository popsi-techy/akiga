/**
 * Generates the CSS custom properties (`--ds-*`) from the token source of truth.
 * Injected once at the root so both Tailwind utilities and raw CSS can reference tokens.
 * Single source: tokens.ts → CSS vars → Tailwind (see tailwind.config.ts).
 */
import { color, spacing, radius, elevation, motion, layout, fontFamily, typography } from '../tokens/tokens';

type Dict = Record<string, string>;

function flatten(prefix: string, obj: Record<string, unknown>, out: Dict) {
  for (const [key, value] of Object.entries(obj)) {
    // CSS custom-property names can't contain '.', so 0.5 -> 0_5
    const safeKey = key.replace(/\./g, '_');
    const name = `${prefix}-${safeKey}`;
    if (value && typeof value === 'object') {
      flatten(name, value as Record<string, unknown>, out);
    } else {
      out[name] = String(value);
    }
  }
}

export function tokenVars(): Dict {
  const out: Dict = {};
  flatten('--ds-color', color as unknown as Record<string, unknown>, out);
  flatten('--ds-space', spacing as unknown as Record<string, unknown>, out);
  flatten('--ds-radius', radius as unknown as Record<string, unknown>, out);
  flatten('--ds-elevation', elevation as unknown as Record<string, unknown>, out);
  flatten('--ds-motion', motion as unknown as Record<string, unknown>, out);
  flatten('--ds-layout', layout as unknown as Record<string, unknown>, out);
  flatten('--ds-font', fontFamily as unknown as Record<string, unknown>, out);
  out['--ds-type-bodyMedium-letterSpacing'] = typography.bodyMedium.letterSpacing;
  return out;
}

/** Returns a `:root { ... }` CSS string for injection in the document head. */
export function rootCssVariables(): string {
  const vars = tokenVars();
  const body = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `:root {\n${body}\n}`;
}
