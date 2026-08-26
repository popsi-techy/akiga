'use client';

/**
 * Illustration — not a token surface.
 * Cool paper, sky orbs at fixed anchors, a modest aura blur on the patches
 * only, and a light grain. Do not blur the whole field.
 */
export function AtmosphericBackground() {
  return (
    <div className="atmospheric-background" aria-hidden>
      <div className="atmospheric-background__patches" />
      <div className="atmospheric-background__grain" />
    </div>
  );
}
