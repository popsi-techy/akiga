'use client';

import * as React from 'react';
import Popover from '@mui/material/Popover';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';

/**
 * DatePicker — one field showing a readable date, opening a month grid.
 *
 * Replaces `<input type="date">`, whose field text, calendar icon and popup are all
 * browser chrome: the format follows the OS locale and none of it can be themed, so
 * it never matches the rest of the system.
 *
 * `value` is `YYYY-MM-DD`, the same shape a native date input produces, so callers
 * and stored data are unaffected.
 */
export interface DatePickerProps {
  /** `YYYY-MM-DD`, or empty for no selection. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable date, `YYYY-MM-DD`. Earlier days render disabled. */
  min?: string;
  /** Latest selectable date, `YYYY-MM-DD`. */
  max?: string;
  /** Matches the Input/Select control-height scale. @default 'sm' */
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** Accessible name for the field — required when there is no visible label. */
  ariaLabel?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Parsed from the string, never through `Date` — that would shift by timezone. */
function parts(iso: string): { y: number; m: number; d: number } | null {
  const [y, m, d] = (iso ?? '').split('-').map(Number);
  return y && m && d ? { y, m, d } : null;
}
function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
/** `YYYY-MM-DD` → "Nov 4, 2026". Sorts and compares as a string, so no Date needed. */
export function formatDateShort(value: string): string {
  const p = parts(value);
  return p ? `${MONTHS_SHORT[p.m - 1]} ${p.d}, ${p.y}` : '';
}

function Calendar({
  value,
  min,
  max,
  onPick,
}: {
  value: string;
  min?: string;
  max?: string;
  onPick: (next: string) => void;
}) {
  const selected = parts(value);
  const start = selected ?? parts(min ?? '') ?? { y: new Date().getFullYear(), m: new Date().getMonth() + 1, d: 1 };
  const [view, setView] = React.useState({ y: start.y, m: start.m });

  // Only ever evaluated inside the popover, which mounts on click — so this is
  // client-only and cannot cause a hydration mismatch.
  const today = React.useMemo(() => {
    const n = new Date();
    return iso(n.getFullYear(), n.getMonth() + 1, n.getDate());
  }, []);

  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const leading = new Date(view.y, view.m - 1, 1).getDay();
  const step = (delta: number) => {
    const m = view.m + delta;
    if (m < 1) return setView({ y: view.y - 1, m: 12 });
    if (m > 12) return setView({ y: view.y + 1, m: 1 });
    setView({ y: view.y, m });
  };

  return (
    <div className="w-[268px] p-2">
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <span className="text-body-sm-strong text-text-primary">
          {MONTHS[view.m - 1]} {view.y}
        </span>
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="grid h-7 w-7 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <ChevronLeft sx={{ fontSize: 18 }} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="grid h-7 w-7 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <ChevronRight sx={{ fontSize: 18 }} />
          </button>
        </span>
      </div>

      <div className="grid grid-cols-7 gap-0.5" role="grid">
        {WEEKDAYS.map((w, i) => (
          <div
            key={`${w}-${i}`}
            aria-hidden
            className="grid h-7 place-items-center text-micro uppercase text-text-tertiary"
          >
            {w}
          </div>
        ))}
        {Array.from({ length: leading }, (_, i) => <span key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const cell = iso(view.y, view.m, d);
          // String compare is safe and timezone-free for YYYY-MM-DD.
          const blocked = (min && cell < min) || (max && cell > max);
          const on = cell === value;
          return (
            <button
              key={cell}
              type="button"
              role="gridcell"
              aria-selected={on}
              aria-current={cell === today ? 'date' : undefined}
              disabled={Boolean(blocked)}
              onClick={() => onPick(cell)}
              className={[
                'grid h-8 place-items-center rounded-md text-body-sm tabular-nums transition-colors',
                on
                  ? 'bg-brand font-emphasis text-brand-on'
                  : cell === today
                    ? 'font-emphasis text-text-brand hover:bg-surface-hover'
                    : 'text-text-primary hover:bg-surface-hover',
                'disabled:pointer-events-none disabled:text-text-disabled',
              ].join(' ')}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  size = 'sm',
  disabled = false,
  ariaLabel,
}: DatePickerProps) {
  const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchor);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => setAnchor(e.currentTarget)}
        className={[
          'flex w-full items-center gap-2 rounded-md border bg-surface text-left text-body-sm transition-colors',
          size === 'sm' ? 'h-9 px-3' : 'h-10 px-3.5',
          open ? 'border-brand' : 'border-border hover:border-border-strong',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
          'disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-text-disabled',
        ].join(' ')}
      >
        <span
          className={[
            'min-w-0 flex-1 truncate',
            value ? 'text-text-primary' : 'text-text-disabled',
          ].join(' ')}
        >
          {value ? formatDateShort(value) : 'Select date'}
        </span>
        <CalendarTodayOutlined sx={{ fontSize: 15 }} className="shrink-0 text-icon" aria-hidden />
      </button>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              marginTop: '4px',
              borderRadius: 'var(--ds-radius-md)',
              border: '1px solid var(--ds-color-border-default)',
              boxShadow: 'var(--ds-elevation-md)',
            },
          },
        }}
      >
        <Calendar
          value={value}
          min={min}
          max={max}
          onPick={(next) => {
            onChange(next);
            setAnchor(null);
          }}
        />
      </Popover>
    </>
  );
}

export default DatePicker;
