'use client';

import * as React from 'react';

/**
 * Click-to-edit text. The visible line is the only thing in flow, so the
 * Draft chip and description do not move. The field is an overlay on that
 * same box — it does not replace it.
 *
 * Why MUI was insufficient: Input and TextField occupy their own box and
 * would reflow the header the moment editing starts. This keeps the sizer
 * in flow and paints the field on top of it.
 */
export interface ClickToEditTextProps {
  value: string;
  onCommit: (next: string) => void;
  as?: 'h1' | 'p';
  className: string;
  ariaLabel: string;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function ClickToEditText({
  value,
  onCommit,
  as = 'p',
  className,
  ariaLabel,
  multiline = false,
  required = false,
  placeholder,
}: ClickToEditTextProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const fieldRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const isTitle = as === 'h1';

  React.useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  React.useEffect(() => {
    if (!editing) return;
    const el = fieldRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  /* Long descriptions must grow past the truncated line. inset-0 would pin
     height to 18px and hide the rest. Measure scrollHeight so the overlay
     shows every character without moving the sizer. */
  React.useLayoutEffect(() => {
    if (!editing || !multiline) return;
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.max(el.scrollHeight, el.parentElement?.clientHeight ?? 0)}px`;
  }, [editing, draft, multiline]);

  const commit = () => {
    const next = draft.trim();
    if (required && next === '') {
      setDraft(value);
      setEditing(false);
      return;
    }
    if (next !== value.trim()) onCommit(next);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const typeReset =
    '[font-family:inherit] [font-size:inherit] [font-weight:inherit] [letter-spacing:inherit] [line-height:inherit] text-inherit border-0 [outline:none] focus:[outline:none] focus-visible:[outline:none]';

  /* Name hugs the text. Description starts on that line then grows down over
     the tabs — never inset-0, which would lock it to one truncated row. */
  const fieldClass = multiline
    ? [
        'absolute left-0 top-0 z-20 m-0 w-full min-h-full min-w-0',
        'box-border appearance-none resize-none overflow-hidden bg-canvas p-0',
        'whitespace-pre-wrap [overflow-wrap:anywhere]',
        'ring-1 ring-inset ring-border-focus',
        typeReset,
      ].join(' ')
    : [
        'absolute inset-0 z-20 m-0 h-full w-full min-w-0',
        'box-border appearance-none bg-canvas p-0',
        'ring-1 ring-inset ring-border-focus',
        typeReset,
      ].join(' ');

  const Tag = as;

  return (
    <Tag
      className={[
        'relative m-0 max-w-full p-0',
        isTitle ? 'inline-flex w-max items-center' : 'block w-full overflow-visible',
        editing ? '' : 'hover:bg-surface-hover',
        className,
      ].join(' ')}
    >
      <span
        className={`${isTitle ? 'min-w-0 max-w-full' : 'block w-full min-w-0'} truncate ${editing ? 'invisible' : ''}`}
        aria-hidden={editing || undefined}
      >
        {value.trim() ? value : <span className="text-text-tertiary">{placeholder ?? 'Add text'}</span>}
      </span>
      {!editing && (
        <button
          type="button"
          title={value.trim() || undefined}
          aria-label={`Edit ${ariaLabel}`}
          onClick={() => setEditing(true)}
          className="absolute inset-0 z-10 cursor-text border-0 bg-transparent p-0 [outline:none] focus-visible:[outline:none] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-focus"
        />
      )}
      {editing &&
        (multiline ? (
          <textarea
            ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
            aria-label={ariaLabel}
            value={draft}
            rows={1}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commit();
              }
            }}
            className={fieldClass}
          />
        ) : (
          <input
            ref={fieldRef as React.RefObject<HTMLInputElement>}
            aria-label={ariaLabel}
            value={draft}
            size={1}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
            className={fieldClass}
          />
        ))}
    </Tag>
  );
}
