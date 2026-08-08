'use client';

import * as React from 'react';
import Popover from '@mui/material/Popover';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';

/**
 * TimePicker — one field showing a 12-hour time, opening a three-column picker
 * (hour · minute · AM/PM).
 *
 * Why not `<input type="time">`: it renders 12- or 24-hour purely from the browser
 * locale, with no way to force the format. Why not a single `Select`: it would have
 * to enumerate every slot, which is a long scroll. Splitting the columns inside one
 * popover keeps the field compact and every list short.
 *
 * `value` is always 24h `HH:MM`, so callers store an unambiguous time regardless of
 * how it is displayed.
 */
export interface TimePickerProps {
  /** 24-hour `HH:MM`. */
  value: string;
  onChange: (value: string) => void;
  /** Minutes offered, in minutes. @default 10 */
  minuteStep?: number;
  /** Matches the Input/Select control-height scale. @default 'sm' */
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** Accessible name for the field — required when there is no visible label. */
  ariaLabel?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const PERIODS = ['AM', 'PM'] as const;
type Period = (typeof PERIODS)[number];

/** 24h `HH:MM` → display parts. Hour 0 is 12 AM, hour 12 is 12 PM. */
function toParts(value: string): { hour: number; minute: number; period: Period } {
  const [h, m] = (value || '00:00').split(':');
  const hour24 = Number(h) || 0;
  return {
    hour: hour24 % 12 || 12,
    minute: Number((m ?? '0').slice(0, 2)) || 0,
    period: hour24 >= 12 ? 'PM' : 'AM',
  };
}
/** Display parts → 24h `HH:MM`. */
function toValue(hour: number, minute: number, period: Period): string {
  const hour24 = period === 'PM' ? (hour % 12) + 12 : hour % 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
/** 24h `HH:MM` → "9:30 AM". Exported so callers can label a stored time the same way. */
export function formatTime12(value: string): string {
  const { hour, minute, period } = toParts(value);
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
}

function Column({
  label,
  options,
  selected,
  onPick,
  format,
}: {
  label: string;
  options: readonly (number | string)[];
  selected: number | string;
  onPick: (option: never) => void;
  format?: (option: number | string) => string;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);

  // Bring the current value into view when the picker opens, so a late hour or
  // minute isn't hidden below the fold.
  React.useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <div className="flex min-w-0 flex-col">
      <div className="px-2 pb-1 text-micro uppercase tracking-[0.07em] text-text-tertiary">
        {label}
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        className="ds-scroll max-h-[184px] overflow-y-auto px-1"
      >
        {options.map((o) => {
          const on = o === selected;
          return (
            <button
              key={String(o)}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => onPick(o as never)}
              className={[
                'mb-0.5 block w-full rounded-md px-3 py-1.5 text-left text-body-sm tabular-nums transition-colors',
                on
                  ? 'bg-brand font-emphasis text-brand-on'
                  : 'text-text-primary hover:bg-surface-hover',
              ].join(' ')}
            >
              {format ? format(o) : o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TimePicker({
  value,
  onChange,
  minuteStep = 10,
  size = 'sm',
  disabled = false,
  ariaLabel,
}: TimePickerProps) {
  const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchor);
  const parts = toParts(value);

  // Derived from a prop, so memoise rather than rebuild each render — an unstable
  // options array is what makes MUI re-derive children on every pass.
  const minutes = React.useMemo(
    () => Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep),
    [minuteStep],
  );
  /** An off-step stored minute snaps to the nearest offered one, so the column
   *  always has a selection instead of appearing empty. */
  const selectedMinute = React.useMemo(
    () =>
      minutes.reduce((best, m) =>
        Math.abs(m - parts.minute) < Math.abs(best - parts.minute) ? m : best,
      ),
    [minutes, parts.minute],
  );

  const set = (next: { hour?: number; minute?: number; period?: Period }) =>
    onChange(
      toValue(
        next.hour ?? parts.hour,
        next.minute ?? selectedMinute,
        next.period ?? parts.period,
      ),
    );

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
          'flex w-full items-center gap-2 rounded-md border bg-surface text-left text-body-sm text-text-primary transition-colors',
          size === 'sm' ? 'h-9 px-3' : 'h-10 px-3.5',
          open ? 'border-brand' : 'border-border hover:border-border-strong',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
          'disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-text-disabled',
        ].join(' ')}
      >
        <span className="min-w-0 flex-1 truncate tabular-nums">{formatTime12(value)}</span>
        <ScheduleOutlined sx={{ fontSize: 17 }} className="shrink-0 text-icon" aria-hidden />
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
        {/* Three columns, one decision each — the field stays a single control. */}
        <div className="flex gap-1 p-2" role="group" aria-label={ariaLabel ?? 'Select time'}>
          <Column
            label="Hour"
            options={HOURS}
            selected={parts.hour}
            onPick={(h: number) => set({ hour: h })}
          />
          <Column
            label="Min"
            options={minutes}
            selected={selectedMinute}
            onPick={(m: number) => set({ minute: m })}
            format={(m) => String(m).padStart(2, '0')}
          />
          <Column
            label="AM/PM"
            options={PERIODS}
            selected={parts.period}
            onPick={(p: Period) => set({ period: p })}
          />
        </div>
      </Popover>
    </>
  );
}

export default TimePicker;
