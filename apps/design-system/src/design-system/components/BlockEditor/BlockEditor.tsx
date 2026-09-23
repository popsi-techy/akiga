'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, BubbleMenu, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import FormatBoldOutlined from '@mui/icons-material/FormatBoldOutlined';
import FormatItalicOutlined from '@mui/icons-material/FormatItalicOutlined';
import FormatUnderlinedOutlined from '@mui/icons-material/FormatUnderlinedOutlined';
import StrikethroughSOutlined from '@mui/icons-material/StrikethroughSOutlined';
import CodeOutlined from '@mui/icons-material/CodeOutlined';
import TitleOutlined from '@mui/icons-material/TitleOutlined';
import FormatListBulletedOutlined from '@mui/icons-material/FormatListBulletedOutlined';
import FormatListNumberedOutlined from '@mui/icons-material/FormatListNumberedOutlined';
import ChecklistOutlined from '@mui/icons-material/ChecklistOutlined';
import FormatQuoteOutlined from '@mui/icons-material/FormatQuoteOutlined';
import HorizontalRuleOutlined from '@mui/icons-material/HorizontalRuleOutlined';
import DataObjectOutlined from '@mui/icons-material/DataObjectOutlined';
import UndoOutlined from '@mui/icons-material/UndoOutlined';
import RedoOutlined from '@mui/icons-material/RedoOutlined';
import LinkOutlined from '@mui/icons-material/LinkOutlined';

/**
 * A block command offered by the slash menu.
 *
 * `keywords` are matched alongside the label so "todo" finds the checklist and "h1" the
 * large heading — the words people reach for are rarely the words on the button.
 */
interface SlashCommand {
  id: string;
  label: string;
  hint: string;
  keywords: string[];
  icon: React.ReactNode;
  run: (editor: Editor) => void;
}

const ICON = { fontSize: 18 } as const;

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'h1',
    label: 'Heading 1',
    hint: 'Section title',
    keywords: ['h1', 'title', 'large', 'heading'],
    icon: <TitleOutlined sx={ICON} />,
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    hint: 'Subsection title',
    keywords: ['h2', 'subtitle', 'medium', 'heading'],
    icon: <TitleOutlined sx={{ fontSize: 15 }} />,
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    hint: 'Small title',
    keywords: ['h3', 'small', 'heading'],
    icon: <TitleOutlined sx={{ fontSize: 13 }} />,
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bullet',
    label: 'Bulleted list',
    hint: 'An unordered list',
    keywords: ['bullet', 'list', 'ul', 'unordered'],
    icon: <FormatListBulletedOutlined sx={ICON} />,
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'ordered',
    label: 'Numbered list',
    hint: 'A list with order',
    keywords: ['number', 'ordered', 'ol', 'list', 'steps'],
    icon: <FormatListNumberedOutlined sx={ICON} />,
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'task',
    label: 'To-do list',
    hint: 'Track things to tick off',
    keywords: ['task', 'todo', 'check', 'checkbox', 'tick'],
    icon: <ChecklistOutlined sx={ICON} />,
    run: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'quote',
    label: 'Quote',
    hint: 'Set text apart',
    keywords: ['quote', 'blockquote', 'callout', 'cite'],
    icon: <FormatQuoteOutlined sx={ICON} />,
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'code',
    label: 'Code block',
    hint: 'Monospaced, unformatted',
    keywords: ['code', 'snippet', 'pre', 'mono'],
    icon: <DataObjectOutlined sx={ICON} />,
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'divider',
    label: 'Divider',
    hint: 'A horizontal rule',
    keywords: ['divider', 'rule', 'hr', 'separator', 'line'],
    icon: <HorizontalRuleOutlined sx={ICON} />,
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
];

function matchCommands(query: string): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (c) => c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.startsWith(q)),
  );
}

/** A dynamic value the editor can insert as `{{…}}` — a merge field / placeholder. */
export interface BlockEditorToken {
  /** The literal inserted into the document, e.g. `{{fullName}}`. */
  value: string;
  /** What it resolves to, shown beside the token in the picker. */
  label?: string;
}

/** Imperative handle for driving the editor from outside — e.g. a token/placeholder panel. */
export interface BlockEditorApi {
  /** Insert text (or an HTML fragment) at the current caret, focusing the editor first. */
  insert: (content: string) => void;
  /** Put the caret back in the document. */
  focus: () => void;
}

export interface BlockEditorProps {
  /** HTML. Read once on mount — see the note on why this is uncontrolled. */
  value: string;
  onChange: (html: string) => void;
  /** Shown in the first empty block. */
  placeholder?: string;
  editable?: boolean;
  /** Names the editing region, since a bare contenteditable announces nothing. */
  ariaLabel: string;
  className?: string;
  /**
   * Imperative access for inserting content at the caret — the escape hatch for a
   * side panel that drops dynamic values in. The editor is uncontrolled, so this is
   * how outside UI writes into it without remounting and losing the selection.
   */
  apiRef?: React.Ref<BlockEditorApi>;
  /**
   * Show a persistent formatting toolbar above the document. The slash menu and
   * selection bar are always available; this adds the always-visible controls a
   * form-style editor is expected to have. @default false
   */
  toolbar?: boolean;
  /**
   * Render the toolbar into this element instead of inline above the content — for
   * docking it at the top of an outer container (e.g. above a preview frame) rather
   * than inside the scrolling document. Requires `toolbar`.
   */
  toolbarContainer?: React.RefObject<HTMLElement | null>;
  /**
   * Dynamic values the reader can drop into the document as `{{…}}`. When set, a
   * searchable picker opens at the caret on typing `{{` (or from the toolbar), so
   * insertion happens where the reader is looking rather than from a side panel.
   */
  tokens?: BlockEditorToken[];
}

/**
 * BlockEditor — a block-style rich-text editor: type `/` for a command menu, select text
 * for a formatting bar.
 *
 * ## Why a second editor
 *
 * `RichTextEditor` stays for what it is good at: a short, bounded run of formatted text in
 * a form field — a description, a justification, a policy note. It is a `contentEditable`
 * with a fixed toolbar, and it has no document model, so it cannot know it is inside a
 * to-do item or turn one block into another.
 *
 * This one is for composing a document, where the unit is the block rather than the field:
 * headings, lists, quotes, code and dividers, chosen inline without leaving the keyboard.
 * That needs a schema and a transaction model, which is Tiptap/ProseMirror's job (ADR-0019).
 * Reach for `RichTextEditor` first; reach for this when the answer is a document.
 *
 * ## Uncontrolled by design
 *
 * `value` seeds the document and is not written back on every keystroke. Feeding the HTML
 * back in as it is typed re-parses the document and drops the selection — the same reason
 * `RichTextEditor` is uncontrolled. `onChange` reports HTML out; to replace the content
 * from outside, remount with a `key`.
 *
 * Everything here is the MIT distribution of Tiptap. No Pro extension is used, and none
 * should be added without an ADR — the paid ones (drag handles, comments, AI) would put a
 * licence behind a component the design system tells people to reuse freely.
 */
export function BlockEditor({
  value,
  onChange,
  placeholder = "Write something, or press '/' for commands",
  editable = true,
  ariaLabel,
  className,
  apiRef,
  toolbar = false,
  toolbarContainer,
  tokens,
}: BlockEditorProps) {
  // Portaling the toolbar needs the container committed to the DOM; this flips true after
  // the first paint, by which point the caller's ref is populated.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Token picker (merge fields) — opens at the caret on `{{`.
  const [tokenMenu, setTokenMenu] = React.useState<{ query: string; top: number; left: number } | null>(
    null,
  );
  const [tokenHighlight, setTokenHighlight] = React.useState(0);
  const hasTokens = Boolean(tokens && tokens.length > 0);
  const [slash, setSlash] = React.useState<{ query: string; top: number; left: number } | null>(
    null,
  );
  const [highlight, setHighlight] = React.useState(0);

  const wrapper = React.useRef<HTMLDivElement>(null);
  /**
   * The editor, reachable from callbacks that outlive a single render.
   *
   * `editorProps.handleKeyDown` is registered once, so it closes over the first render —
   * where `useEditor` has returned `null`, because `immediatelyRender: false` defers
   * construction past it. Reading the `editor` binding from inside that handler therefore
   * always sees `null`, and every keyboard-run command silently did nothing while the
   * same command run by mouse worked. The ref is written on each render, so the handler
   * reads the live instance.
   */
  const editorRef = React.useRef<Editor | null>(null);
  /** The last HTML handed to `onChange`, so a re-serialisation is not reported as an edit. */
  const lastEmitted = React.useRef(value);

  const editor = useEditor({
    // Next.js renders this on the server first; letting Tiptap paint immediately there
    // makes the client's first pass disagree with it and React throws a hydration error.
    immediatelyRender: false,
    editable,
    content: value,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'ds-editor-code' } },
      }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'ds-editor-link' } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder,
        // Only the block the caret is in, so a long document is not covered in grey hints.
        showOnlyCurrent: true,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'ds-editor-content focus:outline-none',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': ariaLabel,
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      // Only report a change that changed something.
      //
      // ProseMirror parses `value` into its own document and can emit an update for that
      // parse alone — normalising attribute order, dropping a stray wrapper. The reader
      // has typed nothing, but a consumer counting `onChange` calls sees an edit, so
      // "unsaved changes" lights up on a document that was only opened. Comparing the
      // serialisation is what makes `onChange` mean "the document is now different".
      if (html === lastEmitted.current) return;
      lastEmitted.current = html;
      onChange(html);
      if (syncToken(e)) setSlash(null);
      else syncSlash(e);
    },
    onSelectionUpdate: ({ editor: e }) => {
      if (syncToken(e)) setSlash(null);
      else syncSlash(e);
    },
  });

  /**
   * Open the menu while the caret sits in a `/query` run at the start of an empty-ish
   * block, and close it otherwise — including when the selection moves away, which is
   * what stops a stale menu hanging over a different paragraph.
   */
  const syncSlash = (e: Editor) => {
    const { from, empty } = e.state.selection;
    if (!empty) {
      setSlash(null);
      return;
    }
    const start = e.state.doc.resolve(from).start();
    const before = e.state.doc.textBetween(start, from, '\n', '\n');
    const match = /(?:^|\s)\/([A-Za-z0-9]*)$/.exec(before);
    if (!match) {
      setSlash(null);
      return;
    }
    const coords = e.view.coordsAtPos(from);
    const box = wrapper.current?.getBoundingClientRect();
    setSlash({
      query: match[1],
      top: coords.bottom - (box?.top ?? 0) + 6,
      left: coords.left - (box?.left ?? 0),
    });
    setHighlight(0);
  };

  /**
   * Open the token picker while the caret sits just after an unclosed `{{query` run. The
   * closing `}}` on an existing token means the caret is past it, so a finished token never
   * re-triggers the menu. Returns whether the menu is showing, so the caller can suppress slash.
   */
  const syncToken = (e: Editor): boolean => {
    if (!hasTokens) return false;
    const { from, empty } = e.state.selection;
    if (!empty) {
      setTokenMenu(null);
      return false;
    }
    const start = e.state.doc.resolve(from).start();
    const before = e.state.doc.textBetween(start, from, '\n', '\n');
    const match = /\{\{([A-Za-z0-9]*)$/.exec(before);
    if (!match) {
      setTokenMenu(null);
      return false;
    }
    const coords = e.view.coordsAtPos(from);
    const box = wrapper.current?.getBoundingClientRect();
    setTokenMenu({
      query: match[1],
      top: coords.bottom - (box?.top ?? 0) + 6,
      left: coords.left - (box?.left ?? 0),
    });
    setTokenHighlight(0);
    return true;
  };

  const runToken = (token: BlockEditorToken, instance?: Editor) => {
    const e = instance ?? editorRef.current;
    if (!e) return;
    const { from } = e.state.selection;
    const start = e.state.doc.resolve(from).start();
    const before = e.state.doc.textBetween(start, from, '\n', '\n');
    const match = /\{\{([A-Za-z0-9]*)$/.exec(before);
    // Replace the `{{query` the reader typed with the full token, so no stray braces remain.
    const chain = e.chain().focus();
    if (match) chain.deleteRange({ from: from - match[0].length, to: from });
    chain.insertContent(token.value).run();
    setTokenMenu(null);
  };

  const runCommand = (command: SlashCommand, instance?: Editor) => {
    const e = instance ?? editorRef.current;
    if (!e) return;
    const { from } = e.state.selection;
    const start = e.state.doc.resolve(from).start();
    const before = e.state.doc.textBetween(start, from, '\n', '\n');
    const match = /\/([A-Za-z0-9]*)$/.exec(before);
    // Delete the "/query" the reader typed before running the command, so the trigger
    // never survives into the block it created.
    if (match) {
      e.chain().focus().deleteRange({ from: from - match[0].length, to: from }).run();
    }
    setSlash(null);
    command.run(e);
  };

  editorRef.current = editor;

  React.useImperativeHandle(
    apiRef,
    () => ({
      insert: (content: string) => {
        editorRef.current?.chain().focus().insertContent(content).run();
      },
      focus: () => {
        editorRef.current?.chain().focus().run();
      },
    }),
    [editor],
  );

  React.useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Placeholders are offered in the slash menu too, so `/` is a single entry point for both
  // blocks and dynamic values.
  const tokenCommands: SlashCommand[] = (tokens ?? []).map((t) => ({
    id: `token:${t.value}`,
    label: t.value,
    hint: t.label ? `Placeholder · ${t.label}` : 'Placeholder',
    keywords: ['placeholder', 'token', 'variable', t.value.replace(/[{}]/g, ''), ...(t.label ? [t.label] : [])],
    icon: <DataObjectOutlined sx={ICON} />,
    run: (e) => e.chain().focus().insertContent(t.value).run(),
  }));
  const matchTokens = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return tokenCommands;
    return tokenCommands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.startsWith(q)),
    );
  };
  const results = slash ? [...matchCommands(slash.query), ...matchTokens(slash.query)] : [];

  /**
   * Menu keys, bound to the editor's own DOM rather than through `editorProps`.
   *
   * ProseMirror registers `editorProps` once, at construction, so a handler declared
   * there closes over the first render — and with `immediatelyRender: false` that render
   * has no editor yet, so every command run by keyboard silently did nothing while the
   * same command run by mouse worked. This effect re-binds whenever the menu or the
   * highlight changes, so the closure always sees the current one.
   *
   * Capture phase, because ProseMirror's own keydown handler is on this same element and
   * would otherwise split the paragraph before the menu ever saw Enter.
   */
  React.useEffect(() => {
    if (!editor || !slash) return;
    const instance = editor;
    const dom = instance.view.dom;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSlash(null);
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlight((h) => (results.length ? (h + 1) % results.length : 0));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlight((h) => (results.length ? (h - 1 + results.length) % results.length : 0));
        return;
      }
      if (event.key === 'Enter' && results.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        runCommand(results[Math.min(highlight, results.length - 1)], instance);
      }
    };
    dom.addEventListener('keydown', onKeyDown, true);
    return () => dom.removeEventListener('keydown', onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, slash, highlight, results.length]);

  const tokenResults =
    tokenMenu && tokens
      ? tokens
          .filter((t) => {
            const q = tokenMenu.query.toLowerCase();
            return !q || t.value.toLowerCase().includes(q) || (t.label ?? '').toLowerCase().includes(q);
          })
          .slice(0, 8)
      : [];

  // Same keyboard model as the slash menu, for the token picker.
  React.useEffect(() => {
    if (!editor || !tokenMenu) return;
    const instance = editor;
    const dom = instance.view.dom;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setTokenMenu(null);
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setTokenHighlight((h) => (tokenResults.length ? (h + 1) % tokenResults.length : 0));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setTokenHighlight((h) =>
          tokenResults.length ? (h - 1 + tokenResults.length) % tokenResults.length : 0,
        );
        return;
      }
      if (event.key === 'Enter' && tokenResults.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        runToken(tokenResults[Math.min(tokenHighlight, tokenResults.length - 1)], instance);
      }
    };
    dom.addEventListener('keydown', onKeyDown, true);
    return () => dom.removeEventListener('keydown', onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, tokenMenu, tokenHighlight, tokenResults.length]);

  const toolbarNode =
    editor && editable && toolbar ? (
      <Toolbar
        editor={editor}
        onInsertPlaceholder={
          hasTokens ? () => editorRef.current?.chain().focus().insertContent('{{').run() : undefined
        }
      />
    ) : null;

  return (
    <div ref={wrapper} className={`relative ${className ?? ''}`}>
      {toolbarNode &&
        (toolbarContainer
          ? mounted && toolbarContainer.current
            ? createPortal(toolbarNode, toolbarContainer.current)
            : null
          : toolbarNode)}

      {editor && editable && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 120 }}
          // A code block formats nothing, so the bar would offer only dead buttons.
          shouldShow={({ editor: e, from, to }) => from !== to && !e.isActive('codeBlock')}
        >
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface p-1 shadow-md">
            <MarkButton
              label="Bold"
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              icon={<FormatBoldOutlined sx={ICON} />}
            />
            <MarkButton
              label="Italic"
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              icon={<FormatItalicOutlined sx={ICON} />}
            />
            <MarkButton
              label="Underline"
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              icon={<FormatUnderlinedOutlined sx={ICON} />}
            />
            <MarkButton
              label="Strikethrough"
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              icon={<StrikethroughSOutlined sx={ICON} />}
            />
            <span className="mx-0.5 h-5 w-px bg-border" role="separator" />
            <MarkButton
              label="Inline code"
              active={editor.isActive('code')}
              onClick={() => editor.chain().focus().toggleCode().run()}
              icon={<CodeOutlined sx={ICON} />}
            />
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />

      {slash && editable && (
        <div
          role="listbox"
          aria-label="Insert block"
          style={{ top: slash.top, left: slash.left }}
          className="ds-scroll absolute z-10 max-h-64 w-64 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-2 py-3 text-caption text-text-secondary">
              No block matches “{slash.query}”.
            </p>
          ) : (
            results.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={i === highlight}
                // `mousedown` rather than `click`: the editor loses focus on mouse-down,
                // which closes the menu before a click would ever land.
                onMouseDown={(e) => {
                  e.preventDefault();
                  runCommand(c);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={[
                  'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors',
                  i === highlight ? 'bg-brand-subtle' : 'hover:bg-surface-hover',
                ].join(' ')}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-surface text-icon">
                  {c.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-sm-medium text-text-primary">
                    {c.label}
                  </span>
                  <span className="block truncate text-caption text-text-secondary">{c.hint}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {tokenMenu && editable && (
        <div
          role="listbox"
          aria-label="Insert placeholder"
          style={{ top: tokenMenu.top, left: tokenMenu.left }}
          className="ds-scroll absolute z-10 max-h-64 w-72 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg"
        >
          <p className="px-2 pb-1 pt-1.5 text-caption-strong uppercase tracking-wider text-text-tertiary">
            Placeholders
          </p>
          {tokenResults.length === 0 ? (
            <p className="px-2 py-3 text-caption text-text-secondary">
              No placeholder matches “{tokenMenu.query}”.
            </p>
          ) : (
            tokenResults.map((t, i) => (
              <button
                key={t.value}
                type="button"
                role="option"
                aria-selected={i === tokenHighlight}
                onMouseDown={(e) => {
                  e.preventDefault();
                  runToken(t);
                }}
                onMouseEnter={() => setTokenHighlight(i)}
                className={[
                  'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors',
                  i === tokenHighlight ? 'bg-brand-subtle' : 'hover:bg-surface-hover',
                ].join(' ')}
              >
                <span className="shrink-0 rounded border border-border bg-subtle px-1.5 py-0.5 font-mono text-caption text-text-secondary">
                  {t.value}
                </span>
                {t.label && (
                  <span className="min-w-0 flex-1 truncate text-caption text-text-secondary">
                    {t.label}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const TOOLBAR_SEP = <span className="mx-0.5 h-5 w-px shrink-0 bg-border" role="separator" />;

/**
 * A persistent formatting bar. Mirrors the selection and slash controls as always-visible
 * buttons, for a form-style editor. Re-renders with its parent on every transaction, so the
 * active states and the block-type value track the caret.
 */
function Toolbar({
  editor,
  onInsertPlaceholder,
}: {
  editor: Editor;
  onInsertPlaceholder?: () => void;
}) {
  const blockValue = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'p';

  const setBlock = (value: string) => {
    const chain = editor.chain().focus();
    if (value === 'p') chain.setParagraph().run();
    else chain.setHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run();
  };

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 bg-surface px-3 py-1.5">
      <MarkButton
        label="Undo"
        active={false}
        onClick={() => editor.chain().focus().undo().run()}
        icon={<UndoOutlined sx={ICON} />}
      />
      <MarkButton
        label="Redo"
        active={false}
        onClick={() => editor.chain().focus().redo().run()}
        icon={<RedoOutlined sx={ICON} />}
      />
      {TOOLBAR_SEP}
      <select
        aria-label="Text style"
        value={blockValue}
        onChange={(e) => setBlock(e.target.value)}
        className="h-7 rounded-md border border-border bg-surface px-2 text-caption text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      {TOOLBAR_SEP}
      <MarkButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={<FormatBoldOutlined sx={ICON} />}
      />
      <MarkButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={<FormatItalicOutlined sx={ICON} />}
      />
      <MarkButton
        label="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        icon={<FormatUnderlinedOutlined sx={ICON} />}
      />
      {TOOLBAR_SEP}
      <MarkButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon={<FormatListBulletedOutlined sx={ICON} />}
      />
      <MarkButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        icon={<FormatListNumberedOutlined sx={ICON} />}
      />
      <MarkButton
        label="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        icon={<FormatQuoteOutlined sx={ICON} />}
      />
      {TOOLBAR_SEP}
      <MarkButton
        label="Link"
        active={editor.isActive('link')}
        onClick={setLink}
        icon={<LinkOutlined sx={ICON} />}
      />
      <MarkButton
        label="Code block"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        icon={<CodeOutlined sx={ICON} />}
      />
      {onInsertPlaceholder && (
        <>
          {TOOLBAR_SEP}
          <MarkButton
            label="Insert placeholder"
            active={false}
            onClick={onInsertPlaceholder}
            icon={<DataObjectOutlined sx={ICON} />}
          />
        </>
      )}
    </div>
  );
}

function MarkButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        'grid h-7 w-7 place-items-center rounded-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        active ? 'bg-brand-subtle text-text-brand' : 'text-icon hover:bg-surface-hover',
      ].join(' ')}
    >
      {icon}
    </button>
  );
}

export default BlockEditor;
