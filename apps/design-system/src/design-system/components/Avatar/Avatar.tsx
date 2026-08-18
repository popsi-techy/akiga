import * as React from 'react';

/**
 * Avatar — identity mark.
 *
 * ## Shape carries meaning: a circle is a person
 *
 * `kind="person"` is round; `kind="entity"` (the default) is a rounded square.
 * That is not decoration — in an IGA product almost every list mixes people with
 * things, and an owners table, an application, a policy and a governance team all
 * arrive as a letter on a tint. The shape is what says which one you are looking
 * at before you read the name, and it is the convention every reader already
 * carries in from Slack, Google and GitHub.
 *
 * The prop asks what the subject **is**, not what it should look like. A caller
 * always knows whether it is rendering a person; it should not also have to know
 * that people are round. An earlier `shape="soft" | "circle"` left that to memory,
 * and memory produced an audit log where the actor was round, the owners table
 * where the same people were square, and a governance team that looked like a
 * person.
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
/** What the avatar stands for. Drives the shape — see the note above. */
export type AvatarKind = 'person' | 'entity';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  /**
   * A person is round; anything else is a rounded square. @default 'entity'
   *
   * `'entity'` covers applications, policies, workflows, roles, governance teams,
   * emergency-access profiles — everything an identity is not.
   */
  kind?: AvatarKind;
  className?: string;
  /** Override the derived initials (e.g. a single letter for an app/entity). */
  initials?: string;
  /**
   * An icon in place of the letter, for a tile that stands for a *kind* of thing
   * rather than a named one — a category of finding, an action, a node type.
   *
   * It supersedes `initials`/`name`, exactly as `StatusChip`'s icon supersedes its
   * dot: two marks in one box means neither is the mark. Pass a filled icon; a
   * stroke glyph loses its outline at these sizes. `name` is still worth passing —
   * it becomes the accessible label the icon cannot supply.
   */
  icon?: React.ReactNode;
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
  kind = 'entity',
  className = '',
  initials,
  icon,
}: AvatarProps) {
  const { box, font } = sizePx[size];
  const person = kind === 'person';
  const radius = person ? 'var(--ds-radius-pill)' : 'var(--ds-radius-avatar)';
  const style: React.CSSProperties = { width: box, height: box, borderRadius: radius };
  /**
   * The grey outline now appears on every person avatar except `xs`.
   *
   * It was restricted to md/lg on the reasoning that a dense row does not need the
   * weight — but in practice it is what separates a person's tint from the surface
   * behind it, and a list where the 32px avatars had no ring and the 40px ones did
   * looked like two components. `xs` stays bare: at 24px a 1px ring with a 2px
   * offset is a third of the box's visual radius and reads as a smudge.
   *
   * It is drawn *outside* the avatar's own box, so a container that clips its
   * overflow will shave it — in a `DataTable`, that column needs `wrap`.
   */
  const ringClass =
    person && size !== 'xs' ? 'ring-1 ring-border ring-offset-2 ring-offset-surface' : '';

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name} avatar` : 'avatar'}
        className={['shrink-0 object-cover', ringClass, className].filter(Boolean).join(' ')}
        style={style}
      />
    );
  }

  return (
    <span
      className={[
        // `text-brand` is brand.primary #EB5424 — see the accessibility note above.
        'inline-flex shrink-0 items-center justify-center bg-brand-subtle font-emphasis text-brand',
        ringClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...style, fontSize: font }}
      aria-label={name ? `${name} avatar` : undefined}
      role={name ? 'img' : undefined}
    >
      {/* `1em` resolves against the box's own font size, so one rule covers every
          avatar size instead of a hardcoded px per size. MUI icons ship a fixed
          1.5rem that has to be overridden to get there. */}
      {icon != null ? (
        <span aria-hidden="true" className="grid place-items-center [&>svg]:!text-[1em]" style={{ fontSize: Math.round(box * 0.5) }}>
          {icon}
        </span>
      ) : initials != null ? (
        oneLetter(initials)
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

/**
 * AvatarGroup — overlapping avatars with an optional "+N" overflow chip.
 *
 * Takes the same `kind` as a single avatar and forwards it, so a group of people
 * is a row of circles and a group of things is a row of rounded squares. The
 * separating ring follows the shape too: a round avatar inside a square ring
 * reads as a rendering fault, which is what this did before it took a `kind`.
 *
 * The overflow chip is set below the avatar letters rather than at their size —
 * "+3" is two glyphs where an initial is one, and matching the letter size makes
 * the count the loudest thing in a group whose point is the faces.
 */
export interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: AvatarSize;
  /** Person (round) or entity (rounded square). @default 'entity' */
  kind?: AvatarKind;
}

export function AvatarGroup({ names, max = 4, size = 'sm', kind = 'entity' }: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const overflow = names.length - shown.length;
  const { box, font } = sizePx[size];
  const radius = kind === 'person' ? 'var(--ds-radius-pill)' : 'var(--ds-radius-avatar)';
  /**
   * Overlap is a share of the box, not a fixed 8px, so the group reads as a stack
   * at every size rather than only at `sm`.
   *
   * A quarter, and not the third a photo facepile would use: these avatars carry
   * a single letter, and the letter is the only thing identifying the person in
   * them. Past about a quarter the glyph starts disappearing under its neighbour,
   * which trades the group's whole purpose for a tighter silhouette.
   */
  const overlapPx = -Math.round(box / 4);
  return (
    <div className="flex items-center" title={names.join(', ')}>
      {shown.map((n, i) => (
        <div
          key={i}
          className="ring-2 ring-surface"
          style={{ borderRadius: radius, marginLeft: i === 0 ? 0 : overlapPx }}
        >
          <Avatar name={n} size={size} kind={kind} />
        </div>
      ))}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center bg-subtle font-emphasis tabular-nums text-text-secondary ring-2 ring-surface"
          style={{
            width: box,
            height: box,
            borderRadius: radius,
            fontSize: Math.round(font * 0.75),
            marginLeft: overlapPx,
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

export default Avatar;
