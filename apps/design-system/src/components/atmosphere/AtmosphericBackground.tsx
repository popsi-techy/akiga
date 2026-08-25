'use client';

/**
 * Illustration — not a token surface.
 * White field with a few light sky-blue circular patches and a light grain.
 */
export function AtmosphericBackground() {
  return (
    <div className="atmospheric-background" aria-hidden>
      <div className="atmospheric-background__patches" />
      <div className="atmospheric-background__grain" />
    </div>
  );
}
