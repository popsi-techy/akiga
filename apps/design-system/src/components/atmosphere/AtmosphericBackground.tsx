'use client';

export type AtmosphericTone = 'sky' | 'mint';

/**
 * Illustration — not a token surface.
 * Cool paper, circular auras at fixed anchors, a modest blur on the patches
 * only, and a light grain. Do not blur the whole field.
 *
 * `sky` is the catalog weather, and every catalog uses it — the banners are
 * the same kind of screen, so telling them apart by hue only makes the product
 * look like it changes theme as you move through it. `mint` is kept for a
 * banner that genuinely is a different kind of thing.
 */
export function AtmosphericBackground({ tone = 'sky' }: { tone?: AtmosphericTone }) {
  return (
    <div
      className={tone === 'mint' ? 'atmospheric-background atmospheric-background--mint' : 'atmospheric-background'}
      aria-hidden
    >
      <div className="atmospheric-background__patches" />
      <div className="atmospheric-background__grain" />
    </div>
  );
}
