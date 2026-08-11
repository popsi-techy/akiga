import * as React from 'react';

/**
 * Avatar — identity mark. Default `soft` is a rounded-square for lists/tables.
 * `circle` is the profile-card treatment: fully round with a grey outline
 * separated from the fill by a 2px surface gap.
 *
 * Shows an image when available, else a SINGLE letter on the brand tint —
 * `brand.primary` (#EB5424) on `brand.subtle` (#FFF4EE), every avatar, every shape,
 * every size.
 *
 * ACCESSIBILITY EXCEPTION, chosen by the product owner: that pairing is 3.33:1, which
 * fails WCAG AA for normal text (4.5:1), and avatar letters run 12–24px so the
 * large-text allowance does not apply. The previous value, `brand.primaryActive`
 * (#9E3416), was 6.57:1. It is recorded as a waiver in `check-contrast.ts` so the
 * deviation is reported on every run rather than quietly regressing the guardrail.
 * The letter is decorative in practice — `aria-label` carries the full name — but it
 * is still visible text, so this is a real, deliberate trade.
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';
export type AvatarShape = 'soft' | 'circle';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  /**
   * `soft` — rounded-square (lists, tables, groups).
   * `circle` — round with grey outline + 2px surface gap (profile cards).
   */
  shape?: AvatarShape;
  className?: string;
  /** Override the derived initials (e.g. a single letter for an app/entity). */
  initials?: string;
}

/**
 * Box + letter. Soft avatars use `radius.avatar` (6px). The letter is half the
 * box at md/lg so a single glyph reads as the mark rather than a caption inside
 * a tile; smaller sizes stay slightly under half so 24/32 boxes don't feel cramped.
 */
const sizePx: Record<AvatarSize, { box: number; font: number }> = {
  xs: { box: 24, font: 12 },
  sm: { box: 32, font: 16 },
  md: { box: 40, font: 20 },
  lg: { box: 48, font: 24 },
};

/** First letter of the name — avatars carry one character, never two. */
export function initialsOf(name?: string): string {
  return name?.trim().charAt(0).toUpperCase() || '?';
}

/**
 * Whatever a caller passes for `initials` is reduced to one character here rather
 * than trusted. Several call sites still pass two (a reference number, say), and the
 * rule is meant to hold everywhere without auditing every consumer.
 */
const oneLetter = (s: string) => s.trim().charAt(0).toUpperCase() || '?';

export function Avatar({
  name,
  src,
  size = 'sm',
  shape = 'soft',
  className = '',
  initials,
}: AvatarProps) {
  const { box, font } = sizePx[size];
  const radius = shape === 'circle' ? 'var(--ds-radius-pill)' : 'var(--ds-radius-avatar)';
  const style: React.CSSProperties = { width: box, height: box, borderRadius: radius };
  // Grey outline with a 2px surface gap between fill and ring.
  const shapeClass =
    shape === 'circle' ? 'ring-1 ring-border ring-offset-2 ring-offset-surface' : '';

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name} avatar` : 'avatar'}
        className={['shrink-0 object-cover', shapeClass, className].filter(Boolean).join(' ')}
        style={style}
      />
    );
  }

  return (
    <span
      className={[
        // `text-brand` is brand.primary #EB5424 — see the accessibility note above.
        'inline-flex shrink-0 items-center justify-center bg-brand-subtle font-emphasis text-brand',
        shapeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...style, fontSize: font }}
      aria-label={name ? `${name} avatar` : undefined}
      role={name ? 'img' : undefined}
    >
      {initials != null ? oneLetter(initials) : initialsOf(name)}
    </span>
  );
}

/**
 * AvatarGroup — overlapping avatars with an optional "+N" overflow chip.
 */
export interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ names, max = 4, size = 'sm' }: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const overflow = names.length - shown.length;
  const { box, font } = sizePx[size];
  return (
    <div className="flex items-center">
      {shown.map((n, i) => (
        <div key={i} className="rounded-avatar ring-2 ring-surface" style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar name={n} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-avatar bg-subtle font-emphasis text-text-secondary ring-2 ring-surface"
          style={{ width: box, height: box, fontSize: font, marginLeft: -8 }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

export default Avatar;
