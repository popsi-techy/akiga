'use client';

export type AtmosphericTone = 'sky' | 'mint';

/**
 * Illustration — not a token surface.
 *
 * `sky` is the catalog weather (circular auras). Every catalog uses it so the
 * product does not change theme as you move between catalogs. `mint` is for a
 * banner that is a different kind of thing.
 */
export function AtmosphericBackground({ tone = 'sky' }: { tone?: AtmosphericTone }) {
  return (
    <div
      className={
        tone === 'mint'
          ? 'atmospheric-background atmospheric-background--mint'
          : 'atmospheric-background'
      }
      aria-hidden
    >
      <div className="atmospheric-background__patches" />
      <div className="atmospheric-background__grain" />
    </div>
  );
}
