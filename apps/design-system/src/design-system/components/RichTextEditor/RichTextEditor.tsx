'use client';

import * as React from 'react';
import AttachFileOutlined from '@mui/icons-material/AttachFileOutlined';
import LinkOutlined from '@mui/icons-material/Link';
import FormatBold from '@mui/icons-material/FormatBold';
import FormatItalic from '@mui/icons-material/FormatItalic';
import FormatUnderlined from '@mui/icons-material/FormatUnderlined';
import StrikethroughS from '@mui/icons-material/StrikethroughS';
import FormatColorText from '@mui/icons-material/FormatColorText';
import FormatQuote from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';

/**
 * RichTextEditor — a lightweight formatted-text field (justifications, notes).
 * Uncontrolled contentEditable (avoids caret jumps); emits HTML via onChange.
 * Use `plainText(html)` for length/emptiness validation.
 */
export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  ariaLabel?: string;
}

export function plainText(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent ?? '').replace(/ /g, ' ');
}

export function RichTextEditor({ value = '', onChange, placeholder = 'Write here…', minHeight = 160, ariaLabel }: RichTextEditorProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = React.useState(plainText(value).trim().length === 0);

  React.useEffect(() => {
    // set initial content once; keep uncontrolled thereafter
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
    setEmpty(plainText(ref.current?.innerHTML ?? '').trim().length === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => {
    const html = ref.current?.innerHTML ?? '';
    setEmpty(plainText(html).trim().length === 0);
    onChange?.(html);
  };
  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const Btn = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary"
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface focus-within:border-brand-border">
      <div className="relative flex-1">
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          className="ds-scroll h-full overflow-y-auto px-3.5 py-3 text-body leading-6 text-text-primary outline-none [&_a]:text-text-link [&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary"
          style={{ minHeight }}
        />
        {empty && (
          <span className="pointer-events-none absolute left-3.5 top-3 text-body leading-6 text-text-tertiary">
            {placeholder}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5 border-t border-border px-2 py-1.5">
        <Btn label="Attach file" onClick={() => {}}>
          <AttachFileOutlined sx={{ fontSize: 17 }} />
        </Btn>
        <div className="mx-1 h-4 w-px bg-border" />
        <Btn label="Add link" onClick={() => { const u = window.prompt('Link URL'); if (u) exec('createLink', u); }}>
          <LinkOutlined sx={{ fontSize: 17 }} />
        </Btn>
        <Btn label="Bold" onClick={() => exec('bold')}>
          <FormatBold sx={{ fontSize: 18 }} />
        </Btn>
        <Btn label="Italic" onClick={() => exec('italic')}>
          <FormatItalic sx={{ fontSize: 18 }} />
        </Btn>
        <Btn label="Underline" onClick={() => exec('underline')}>
          <FormatUnderlined sx={{ fontSize: 18 }} />
        </Btn>
        <Btn label="Strikethrough" onClick={() => exec('strikeThrough')}>
          <StrikethroughS sx={{ fontSize: 18 }} />
        </Btn>
        <Btn label="Text color" onClick={() => exec('foreColor', 'var(--ds-color-brand-primaryActive)')}>
          <FormatColorText sx={{ fontSize: 18 }} />
        </Btn>
        <Btn label="Quote" onClick={() => exec('formatBlock', 'blockquote')}>
          <FormatQuote sx={{ fontSize: 18 }} />
        </Btn>
        <Btn label="Code" onClick={() => exec('formatBlock', 'pre')}>
          <CodeIcon sx={{ fontSize: 18 }} />
        </Btn>
      </div>
    </div>
  );
}

export default RichTextEditor;
