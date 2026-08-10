import * as React from 'react';

/**
 * Card — the product's content container.
 *
 * A card **with a header** renders the "framed" treatment (default): a soft grey
 * frame with a transparent header row (icon + title + actions) above a white,
 * rounded inner panel that holds the content. Pass `variant="flat"` for the older
 * header-band look. A card **without** a header is a plain bordered white card.
 */
export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /**
   * Leading icon shown before the title. **Must be a filled MUI icon — never an
   * `Outlined`/`Outline` one.** The header forces it to 15px, and at that size an
   * outlined glyph is a ~1px grey stroke that reads as a smudge beside a 15px
   * title, where its filled twin reads as a mark. The two are near-identical in an
   * icon picker at 24px, so the mistake is invisible until it ships — which is why
   * `npm run check:icons` fails the build on it.
   *
   * Colour comes from the `text-icon` wrapper — pass an uncoloured icon. Override
   * only when a status/brand accent is intentional.
   *
   * @example icon={<Person />}    // ✓ filled
   * @example icon={<PersonOutline />}  // ✗ blocked by check:icons
   */
  icon?: React.ReactNode;
  /** Right-aligned header content (e.g. a Button, menu, or filter). */
  action?: React.ReactNode;
  /** Content rendered under a divider at the bottom of the panel. */
  footer?: React.ReactNode;
  /** Opt-in faint elevation at rest (for cards on a flat/white page). @default false */
  raised?: boolean;
  /** No shadow at rest; elevates on hover. Good for dashboard cards. @default false */
  hoverElevate?: boolean;
  /** Body padding. @default 'md' */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Header treatment for header-cards. 'framed' = grey frame + white panel (default);
      'flat' = the legacy header band on a bordered card. @default 'framed' */
  variant?: 'framed' | 'flat';
  /** (flat only) Header band style: subtle grey (default) or plain white. @default 'subtle' */
  headerTone?: 'subtle' | 'plain';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Body padding — legacy (flat) cards.
 * `none` still keeps a horizontal content gutter so row dividers never kiss the
 * panel border (see ADR-0009).
 */
const bodyPad: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'px-5',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};
/**
 * Body padding — framed inner panel (a touch tighter, matching the framed look).
 * `none` keeps the horizontal gutter for flush lists / profile rows.
 */
const framedPad: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'px-4',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

const HEADER_ICON_PX = 15;

/** Force MUI SvgIcons to the Card header size (overrides default 24px fontSize). */
function CardHeaderIcon({ icon }: { icon: React.ReactNode }) {
  const sized =
    React.isValidElement<{ sx?: object; style?: React.CSSProperties }>(icon)
      ? React.cloneElement(icon, {
          sx: { fontSize: HEADER_ICON_PX, ...(icon.props.sx ?? {}) },
          style: { ...icon.props.style, fontSize: HEADER_ICON_PX, width: HEADER_ICON_PX, height: HEADER_ICON_PX },
        })
      : icon;
  return (
    <span className="inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center overflow-hidden text-icon">
      {sized}
    </span>
  );
}

export function Card({
  title,
  subtitle,
  icon,
  action,
  footer,
  raised = false,
  hoverElevate = false,
  padding = 'md',
  variant = 'framed',
  headerTone = 'subtle',
  className = '',
  children,
}: CardProps) {
  const hasHeader = title != null || action != null || icon != null;
  const elevation = hoverElevate
    ? 'transition-shadow duration-200 hover:shadow-md'
    : raised
      ? 'shadow-xs'
      : '';

  const titleEl =
    title != null ? (
      <h3 className="truncate text-card-title text-text-primary">{title}</h3>
    ) : null;
  const subtitleEl =
    subtitle != null ? (
      <p className="mt-0.5 truncate text-caption text-text-secondary">{subtitle}</p>
    ) : null;

  // Framed treatment: grey frame + transparent header + white rounded inner panel.
  if (hasHeader && variant === 'framed') {
    return (
      <div className={`flex flex-col gap-2 rounded-xl bg-subtle p-2 ${elevation} ${className}`}>
        <header className="flex items-center justify-between gap-4 px-1 py-0.5">
          <div className="flex min-w-0 items-center gap-2">
            {icon != null && <CardHeaderIcon icon={icon} />}
            <div className="min-w-0">
              {titleEl}
              {subtitleEl}
            </div>
          </div>
          {action != null && <div className="shrink-0">{action}</div>}
        </header>
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface">
          {children != null && <div className={framedPad[padding]}>{children}</div>}
          {footer != null && (
            <footer className="mt-auto border-t border-border-subtle px-4 py-3 text-body-sm text-text-secondary">
              {footer}
            </footer>
          )}
        </div>
      </div>
    );
  }

  // Legacy flat card (also used for header-less cards): bordered white with an optional header band.
  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-surface ${elevation} ${className}`}>
      {hasHeader && (
        <header
          className={`flex items-center justify-between gap-4 border-b border-border px-5 py-3 ${
            headerTone === 'subtle' ? 'bg-subtle' : ''
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {icon != null && <CardHeaderIcon icon={icon} />}
            <div className="min-w-0">
              {titleEl}
              {subtitleEl}
            </div>
          </div>
          {action != null && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children != null && <div className={bodyPad[padding]}>{children}</div>}
      {footer != null && (
        <footer className="border-t border-border px-5 py-3 text-body-sm text-text-secondary">
          {footer}
        </footer>
      )}
    </div>
  );
}

export default Card;
