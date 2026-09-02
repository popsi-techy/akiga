'use client';

import * as React from 'react';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import { Menu } from '../Menu/Menu';
import { typography } from '../../tokens/tokens';

/**
 * Tabs — section navigation matching the product: a 1px brand underline with the
 * active label in the same vibrant brand orange. 14px regular throughout; the
 * selected tab is marked by colour and the indicator, not by weight, so labels
 * never shift width as the selection moves.
 *
 * A tab is **32px** tall, so the band a page devotes to section switching stays a
 * thin strip rather than a second header.
 *
 * Too many tabs for the width **collapse into a More menu**, not a scrolling
 * strip. Scroll arrows hide the fact that there is anything to scroll to — the
 * sections past the fold are invisible and uncounted, and reaching one is a
 * drag rather than a click. A More button states how many are hidden and lists
 * them, so the page's full shape is legible at any width.
 *
 * ACCESSIBILITY EXCEPTION, chosen by the product owner: `brand.primary` (#EB5424) on
 * a white surface is 3.60:1, below WCAG AA for 14px regular text — that is exactly
 * why `text.brand` (#C9441E, 4.85:1) exists and was used here before. Recorded as a
 * waiver in `check-contrast.ts`. The underline is a non-colour cue and `aria-selected`
 * carries the state, so selection is not conveyed by colour alone.
 */
export interface TabItem {
  value: string;
  label: string;
  /** Optional count shown after the label (e.g. Owners (4)). */
  count?: number;
  /**
   * Setup hint before the label. Same filled CheckCircle the checklist uses —
   * green when complete, `border.strong` when still open. Colour is its own, so a
   * selected tab's orange does not recolour it. Omit on pages that are not
   * walking setup, and on a step that is satisfied without anyone deciding
   * (Advanced's factory defaults).
   */
  status?: 'pending' | 'complete';
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  'aria-label'?: string;
  /** Omit the bottom border (e.g. when a parent provides a full-width line). */
  noBorder?: boolean;
}

/** Space after a tab, and so the space between two of them. */
const GAP = 24;

/**
 * Every rule that decides how wide a tab is, in one object.
 *
 * It is applied to the visible strip *and* to the hidden ruler that decides how
 * many tabs fit, so the two cannot drift: a style that widened a real tab but
 * not its measured twin would make the strip overflow by exactly that much.
 */
const tabSx = {
  minHeight: 32,
  // MUI floors a tab at 90px. That makes the space after a short label like
  // "Owners" visibly wider than the 24px after a long one, and it means a tab's
  // width is no longer its label's width — which is the number the fit below
  // counts in.
  minWidth: 0,
  // 32px exactly. MUI's default 12px block padding around a 17.5px label made
  // the tab 41.5px tall and overrode any minHeight below that, so the padding
  // is zeroed and the height comes from minHeight alone — the label is centred
  // by the Tab's own flex, which keeps the number on the 4px grid instead of
  // needing a 7px padding to hit 32.
  paddingBlock: 0,
  paddingInline: 0,
  marginRight: `${GAP}px`,
  textTransform: 'none',
  // MUI's button typography adds 0.02857em of tracking on top of the scale.
  letterSpacing: 'normal',
  // From the scale, not literals: a tab label is `body` (14/400). Selection is
  // marked by colour and the indicator, never by weight, so labels never shift
  // width as the selection moves.
  fontSize: typography.body.fontSize,
  fontWeight: typography.body.fontWeight,
  color: 'var(--ds-color-text-secondary)',
  '&:hover': { color: 'var(--ds-color-text-primary)' },
  // Same orange as the indicator — see the accessibility note above.
  '&.Mui-selected': { color: 'var(--ds-color-brand-primary)' },
} as const;

function tabLabel(t: TabItem) {
  const title = t.count != null ? `${t.label} (${t.count})` : t.label;
  if (!t.status) return title;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="grid h-4 w-4 shrink-0 place-items-center"
        style={{
          color:
            t.status === 'complete'
              ? 'var(--ds-color-status-success-fg)'
              : 'var(--ds-color-border-strong)',
        }}
      >
        <CheckCircle sx={{ fontSize: 16, color: 'inherit' }} aria-hidden />
        <span className="sr-only">{t.status === 'complete' ? 'Completed' : 'Pending'}</span>
      </span>
      <span>{title}</span>
    </span>
  );
}

/**
 * The overflow trigger, dressed as a tab.
 *
 * It carries the selected underline when the current section is inside it,
 * because a strip that shows no selection at all reads as a page with no
 * section open. The count is on the face rather than in the menu: "how much am
 * I not seeing" is the question a truncated strip provokes, and answering it
 * costs six pixels.
 */
type MoreTabProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  count: number;
  selected: boolean;
};

const MoreTab = React.forwardRef<HTMLButtonElement, MoreTabProps>(
  function MoreTab({ count, selected, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={`${count} more ${count === 1 ? 'section' : 'sections'}`}
        className={[
          'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap border-b text-body',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
          selected
            ? 'border-b-brand text-brand'
            : 'border-b-transparent text-text-secondary hover:text-text-primary',
        ].join(' ')}
        {...rest}
      >
        More
        <span className="rounded-xs bg-subtle px-1 text-caption tabular-nums text-text-secondary">
          {count}
        </span>
        <ExpandMore sx={{ fontSize: 16 }} aria-hidden />
      </button>
    );
  },
);

export function Tabs({ items, value, onChange, 'aria-label': ariaLabel, noBorder = false }: TabsProps) {
  const stripRef = React.useRef<HTMLDivElement>(null);
  const rulerRef = React.useRef<HTMLDivElement>(null);
  const [fit, setFit] = React.useState(items.length);

  // What the strip is made of, rather than which array it arrived in. Callers
  // build `items` inline, so its identity changes on every render and keying
  // the effect on it would tear down and rebuild the observer each time.
  const signature = items.map((t) => `${t.value}\u0000${t.label}\u0000${t.count}\u0000${t.status}`).join('\u0001');

  /**
   * How many tabs fit, measured off the hidden ruler.
   *
   * Layout effect, not effect: the fit has to be settled before paint, or every
   * resize shows one frame of the full strip spilling out of its container.
   */
  React.useLayoutEffect(() => {
    const strip = stripRef.current;
    const ruler = rulerRef.current;
    if (!strip || !ruler) return;

    const measure = () => {
      // Read off the ruler, not off `items`: the two are in step by then, and
      // this keeps the effect free of a dependency that changes every render.
      const cells = Array.from(ruler.children) as HTMLElement[];
      const count = cells.length - 1;
      if (count < 1) return;
      // `offsetWidth` is the border box and stops short of the margin, so the
      // gap after each tab has to be added back by hand. Left out, the strip
      // under-counts itself by 24px a tab and confidently overflows.
      const widths = cells.slice(0, -1).map((c) => c.offsetWidth);
      const moreWidth = cells[cells.length - 1].offsetWidth;
      const room = strip.clientWidth;

      // All of them, with no More button to pay for, and no gap after the last
      // one. Checked first so the strip does not hold a tab back in order to
      // advertise a menu holding that one tab.
      const total = widths.reduce((a, b) => a + b, 0) + GAP * (widths.length - 1);
      if (total <= room) {
        setFit(count);
        return;
      }

      let used = 0;
      let n = 0;
      while (n < widths.length && used + widths[n] + GAP + moreWidth <= room) {
        used += widths[n] + GAP;
        n += 1;
      }
      setFit(n);
    };

    measure();
    // The strip's width comes from its parent, never from its own content, so
    // observing it cannot feed back into what we just decided.
    const ro = new ResizeObserver(measure);
    ro.observe(strip);
    return () => ro.disconnect();
  }, [signature]);

  const shown = items.slice(0, fit);
  const hidden = items.slice(fit);
  const shownValue = shown.some((t) => t.value === value) ? value : false;
  // Not simply `shownValue === false`: a `value` matching no tab at all is a
  // caller's mistake, and lighting up More for it would answer "where am I?"
  // with a menu that does not contain the answer either.
  const selectionHidden = hidden.some((t) => t.value === value);

  return (
    <div
      ref={stripRef}
      className={`relative flex w-full items-end ${noBorder ? '' : 'border-b border-border'}`}
    >
      {/* Only when there is something in it: an empty tablist is a promise of
          tabs to anyone navigating by landmark, and there are none. */}
      {shown.length > 0 && (
        <MuiTabs
          value={shownValue}
          onChange={(_, v) => onChange(v)}
          aria-label={ariaLabel}
          sx={{
            minHeight: 32,
            flex: '0 0 auto',
            minWidth: 0,
            // MUI hides the scrollable strip's native scrollbar two ways: a CSS
            // rule (`scrollbar-width: none` + `::-webkit-scrollbar`) AND, as a
            // fallback for engines that ignore it, a negative `margin-bottom` on
            // the scroller equal to the measured scrollbar height, clipped by
            // `overflow: hidden` on the root. On classic-scrollbar platforms
            // (e.g. the Windows webview Cursor embeds) that margin is ~-10px,
            // which drags the 1px indicator — pinned to the scroller's bottom —
            // into the clipped zone, so the active underline vanishes. The CSS
            // rule already hides the scrollbar, so we can zero the fallback
            // margin and keep the indicator on the baseline everywhere.
            '& .MuiTabs-scroller': { marginBottom: '0 !important' },
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--ds-color-brand-primary)',
              height: '1px',
            },
          }}
        >
          {shown.map((t) => (
            <MuiTab
              key={t.value}
              value={t.value}
              disabled={t.disabled}
              label={tabLabel(t)}
              sx={tabSx}
            />
          ))}
        </MuiTabs>
      )}

      {hidden.length > 0 && (
        <Menu
          ariaLabel="More sections"
          items={hidden.map((t) => ({
            label: t.count != null ? `${t.label} (${t.count})` : t.label,
            selected: t.value === value,
            disabled: t.disabled,
            onClick: () => onChange(t.value),
          }))}
          trigger={<MoreTab count={hidden.length} selected={selectionHidden} />}
        />
      )}

      {/*
        The ruler: every tab at its natural width, plus a More button sized for
        the worst case, laid out where nothing can see it. Measuring the real
        strip is no use — by the time a tab is dropped it is not in the DOM to
        be measured, and the fit could never grow back.

        Real `MuiTab`s with the same `sx`, rendered as spans so they are neither
        focusable nor a second tablist. A hand-built stand-in would have to
        re-state every width rule and would silently disagree the day one of
        them changed.
      */}
      <div
        ref={rulerRef}
        aria-hidden
        // `w-max`, or the ruler inherits the strip's width as its shrink-to-fit
        // cap and its tabs compress to fit — measuring exactly the squeeze we
        // are trying to avoid, and reporting that everything fits.
        className="pointer-events-none invisible absolute left-0 top-0 flex w-max flex-nowrap"
      >
        {items.map((t) => (
          <MuiTab
            key={t.value}
            component="span"
            // Spans, out of the tab order, and stripped of the tab role MUI
            // would otherwise give them: `aria-hidden` on the container is
            // enough for a screen reader, but a second set of tabs sitting
            // outside any tablist is a lie told to anything else that reads
            // the DOM.
            role="presentation"
            tabIndex={-1}
            label={tabLabel(t)}
            sx={tabSx}
          />
        ))}
        <MoreTab count={items.length} selected={false} role="presentation" tabIndex={-1} />
      </div>
    </div>
  );
}

export default Tabs;
