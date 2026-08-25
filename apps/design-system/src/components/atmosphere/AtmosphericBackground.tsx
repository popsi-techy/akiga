'use client';

/**
 * Illustration — not a token surface.
 * Cool paper, a few sky orbs, and a light grain. Extra blur is not applied —
 * it flattens into a wash.
 */
export function AtmosphericBackground() {
  return (
    <div className="atmospheric-background" aria-hidden>
      <div className="atmospheric-background__patches" />
      <div className="atmospheric-background__grain" />
    </div>
  );
}
