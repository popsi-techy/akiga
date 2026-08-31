'use client';

export type AtmosphericTone = 'sky' | 'mint';

/**
 * Illustration — not a token surface.
 * Cool paper, circular auras at fixed anchors, a modest blur on the patches
 * only, and a light grain. Do not blur the whole field.
 *
 * `sky` is the default catalog weather. `mint` is the application-type catalog,
 * so that banner does not read as the same screen as workflows or analytics.
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
