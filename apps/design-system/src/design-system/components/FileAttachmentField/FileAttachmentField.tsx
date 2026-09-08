'use client';

import * as React from 'react';
import Add from '@mui/icons-material/Add';
import AttachFile from '@mui/icons-material/AttachFile';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import MoreVert from '@mui/icons-material/MoreVert';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { Avatar } from '../Avatar/Avatar';
import { Button } from '../Button/Button';
import { Menu } from '../Menu/Menu';
import { Modal } from '../Modal/Modal';
import { Tooltip } from '../Tooltip/Tooltip';
import {
  FILE_ATTACHMENT_ACCEPT,
  FILE_ATTACHMENT_MAX_BYTES,
  blobUrlFromDataUrl,
  downloadFileAttachment,
  fileAttachmentCanPreview,
  fileAttachmentIsReady,
  docxToHtml,
  fileAttachmentKind,
  fileAttachmentKindLabel,
  fileAttachmentStatus,
  formatFileSize,
  readFileAsAttachment,
  type FileAttachment,
  type FileAttachmentKind,
  type FileAttachmentReject,
} from './fileAttachment';

export type {
  FileAttachment,
  FileAttachmentKind,
  FileAttachmentReject,
  FileAttachmentRejectReason,
  FileAttachmentStatus,
} from './fileAttachment';

export {
  FILE_ATTACHMENT_ACCEPT,
  FILE_ATTACHMENT_MAX_BYTES,
  blobUrlFromDataUrl,
  downloadFileAttachment,
  fileAttachmentCanPreview,
  fileAttachmentIsReady,
  fileAttachmentKind,
  fileAttachmentKindLabel,
  fileAttachmentStatus,
  formatFileSize,
  readFileAsAttachment,
} from './fileAttachment';

/**
 * FileAttachmentField — optional supporting files on a form (PDF, Word, image).
 *
 * Why MUI was insufficient: there is no file-drop or attachment-list primitive.
 * Empty is a quiet add row. Filled is grey file cards in one well, with a
 * gutter. Each row shows uploading, success, or failed. Pass `fill` in a flex
 * column so the well takes leftover height and the list scrolls — it must not
 * grow behind a pinned footer.
 *
 * ## `readOnly` is a different shape, not a disabled copy
 *
 * Editing needs a well: a frame to drop onto, a gutter so cards do not touch the drop
 * edge, one card per row wide enough to carry a progress bar and a status. Reading needs
 * none of that. There is nothing to drop, every file is by definition uploaded, and the
 * question is "what is attached" — a list of five things, not five rows of one thing.
 *
 * So `readOnly` drops the frame and the gutter, lays the files out as a wrapping grid up
 * to five across, and says only the name and the size. "Uploaded" on every row of a
 * reviewer's screen is a column of the same word. Preview and download live on the kebab;
 * double-click still opens the file, so a reader who already knows the card does not have
 * to hunt for a control.
 */
export interface FileAttachmentFieldProps {
  label?: string;
  /** First-read explanation on the label’s info icon. */
  hint?: React.ReactNode;
  files: FileAttachment[];
  /**
   * Called with ready files after a successful add, or the remaining list after
   * remove. Return `false` when persist failed so the row can show as failed.
   */
  onChange?: (files: FileAttachment[]) => boolean | void;
  accept?: string;
  /** When set, further adds are rejected. Omit for no count cap. */
  maxFiles?: number;
  maxBytes?: number;
  disabled?: boolean;
  readOnly?: boolean;
  /**
   * Cap the field at the leftover height of a flex column, scrolling the file list once it
   * runs out. Use on a rail with a pinned footer so cards never slip behind it.
   *
   * A *ceiling*, not a height: the well grows with the files in it and stops when the
   * column does. It used to take the whole leftover space the moment a first file landed,
   * so one attachment sat at the top of a box four times its height with nothing under it.
   */
  fill?: boolean;
  helperText?: React.ReactNode;
  error?: string;
  onReject?: (errors: FileAttachmentReject[]) => void;
}

/**
 * A 1px dashed rounded outline with a 6px dash and a 2px gap.
 *
 * `border-style: dashed` cannot say how long a dash is — the browser picks, and it varies
 * by engine and by border width. The exact pattern comes from an SVG rect used as a
 * **mask**, not as a background image: a background would have to carry the colour inside
 * the data URI, where a CSS variable cannot reach, so the outline would be the one thing
 * on the surface not drawn from a token. Masking leaves the colour to `background-color`.
 *
 * `stroke-width` is 2 for a 1px line: the rect is drawn flush to the edges, so the outer
 * half of its stroke falls outside the box and is clipped.
 */
const DASHED_OUTLINE_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' rx='6' ry='6' fill='none' stroke='%23000' stroke-width='2' stroke-dasharray='6 2'/%3E%3C/svg%3E\")";

const KIND_ICON: Record<FileAttachmentKind, typeof PictureAsPdfOutlined> = {
  pdf: PictureAsPdfOutlined,
  word: DescriptionOutlined,
  image: ImageOutlined,
};

export function FileAttachmentField({
  label = 'Supporting files',
  hint,
  files,
  onChange,
  accept = FILE_ATTACHMENT_ACCEPT,
  maxFiles,
  maxBytes = FILE_ATTACHMENT_MAX_BYTES,
  disabled = false,
  readOnly = false,
  fill = false,
  helperText,
  error,
  onReject,
}: FileAttachmentFieldProps) {
  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragDepth = React.useRef(0);
  const filesRef = React.useRef(files);
  const unpublishedRef = React.useRef<FileAttachment[]>([]);
  const retryRef = React.useRef(new Map<string, File>());
  const [dragging, setDragging] = React.useState(false);
  const [drafts, setDrafts] = React.useState<FileAttachment[]>([]);
  const [progressById, setProgressById] = React.useState<Record<string, number>>({});
  const [preview, setPreview] = React.useState<FileAttachment | null>(null);
  const [pdfSrc, setPdfSrc] = React.useState<string | null>(null);

  filesRef.current = files;

  React.useEffect(() => {
    unpublishedRef.current = unpublishedRef.current.filter((u) => !files.some((f) => f.id === u.id));
    setDrafts((prev) => prev.filter((d) => !files.some((f) => f.id === d.id)));
  }, [files]);

  const shown = React.useMemo(() => {
    const ready = files.map((f) => ({ ...f, status: fileAttachmentStatus(f) }));
    const extras = drafts
      .filter((d) => !ready.some((f) => f.id === d.id))
      .map((d) => ({ ...d, progress: progressById[d.id] ?? d.progress }));
    return readOnly ? ready.filter(fileAttachmentIsReady) : [...ready, ...extras];
  }, [drafts, files, progressById, readOnly]);

  const locked = disabled || readOnly;
  const atLimit = maxFiles != null && shown.length >= maxFiles;
  const canAdd = !locked && !atLimit && Boolean(onChange);

  const setProgress = (id: string, percent: number) => {
    setProgressById((prev) => ({ ...prev, [id]: Math.max(0, Math.min(100, Math.round(percent))) }));
  };

  const patchDraft = (id: string, patch: Partial<FileAttachment>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const commitReady = (file: FileAttachment): boolean => {
    unpublishedRef.current = [...unpublishedRef.current.filter((f) => f.id !== file.id), file];
    const next = [...filesRef.current, ...unpublishedRef.current];
    const ok = onChange?.(next) !== false;
    if (!ok) {
      unpublishedRef.current = unpublishedRef.current.filter((f) => f.id !== file.id);
    }
    return ok;
  };

  const ingestOne = async (file: File, reuseId?: string) => {
    const kind = fileAttachmentKind(file);
    const id = reuseId ?? `att-${crypto.randomUUID()}`;
    const base: FileAttachment = {
      id,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      kind: kind ?? 'pdf',
      dataUrl: '',
      addedAt: new Date().toISOString(),
      status: 'uploading',
      progress: 8,
    };

    if (!kind || file.size > maxBytes) {
      const reject: FileAttachmentReject = !kind
        ? { name: file.name, reason: 'type', message: `${file.name} isn’t a PDF, Word document, or image.` }
        : { name: file.name, reason: 'size', message: `${file.name} is larger than ${formatFileSize(maxBytes)}.` };
      retryRef.current.set(id, file);
      setDrafts((prev) => [
        ...prev.filter((d) => d.id !== id),
        { ...base, status: 'failed', error: reject.message, progress: 0 },
      ]);
      onReject?.([reject]);
      return;
    }

    retryRef.current.set(id, file);
    setDrafts((prev) => [...prev.filter((d) => d.id !== id), base]);
    setProgress(id, 8);

    const result = await readFileAsAttachment(file, maxBytes, (pct) => setProgress(id, Math.max(8, pct)));
    if ('reason' in result) {
      patchDraft(id, { status: 'failed', error: result.message, progress: 0 });
      onReject?.([result]);
      return;
    }

    await animateProgress(id, 80, 100, setProgress);
    const ready: FileAttachment = { ...result, id, status: 'success' };
    delete ready.progress;
    if (!commitReady(ready)) {
      patchDraft(id, {
        status: 'failed',
        error: 'Couldn’t save this file. Try a smaller file.',
        progress: 0,
      });
      return;
    }
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setProgressById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const ingest = async (list: File[]) => {
    if (!canAdd || list.length === 0) return;
    const remaining = maxFiles != null ? maxFiles - shown.length : list.length;
    const incoming = list.slice(0, remaining);
    if (maxFiles != null && list.length > remaining) {
      onReject?.([
        {
          name: list[remaining]?.name ?? 'file',
          reason: 'limit',
          message: `You can attach up to ${maxFiles} files.`,
        },
      ]);
    }
    await Promise.all(incoming.map((file) => ingestOne(file)));
    if (inputRef.current) inputRef.current.value = '';
  };

  const openPicker = () => {
    if (!canAdd) return;
    inputRef.current?.click();
  };

  const remove = (id: string) => {
    if (readOnly || disabled) return;
    retryRef.current.delete(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    unpublishedRef.current = unpublishedRef.current.filter((f) => f.id !== id);
    if (files.some((f) => f.id === id)) {
      onChange?.(files.filter((f) => f.id !== id));
    }
  };

  const retry = (id: string) => {
    if (locked) return;
    const file = retryRef.current.get(id);
    if (file) {
      void ingestOne(file, id);
      return;
    }
    openPicker();
  };

  const openFile = (file: FileAttachment) => {
    if (!fileAttachmentIsReady(file)) return;
    if (fileAttachmentCanPreview(file.kind)) {
      setPreview(file);
      return;
    }
    downloadFileAttachment(file);
  };

  React.useEffect(() => {
    if (!preview || preview.kind !== 'pdf') {
      setPdfSrc(null);
      return;
    }
    const url = blobUrlFromDataUrl(preview.dataUrl);
    setPdfSrc(url);
    return () => {
      URL.revokeObjectURL(url);
      setPdfSrc(null);
    };
  }, [preview]);

  /*
    Word is converted rather than embedded. `docx` is `pending` until mammoth has parsed
    the package, and `failed` if it cannot — a document written by a tool we do not
    understand should offer the download it always did, not an empty frame that looks
    like the file is blank.
  */
  const [docx, setDocx] = React.useState<
    { state: 'pending' } | { state: 'ready'; html: string } | { state: 'failed' }
  >({ state: 'pending' });

  React.useEffect(() => {
    if (!preview || preview.kind !== 'word') return;
    let live = true;
    setDocx({ state: 'pending' });
    docxToHtml(preview.dataUrl)
      .then((html) => live && setDocx({ state: 'ready', html }))
      .catch(() => live && setDocx({ state: 'failed' }));
    return () => {
      live = false;
    };
  }, [preview]);

  const uploading = shown.some((f) => fileAttachmentStatus(f) === 'uploading');
  /*
    `fill` behaves differently either side of the first file, because the two states want
    opposite things from the leftover height.

    Empty, the well *is* the drop target, and a target should be as big as the column can
    spare — so it takes `flex-1` and centres its prompt. Once files are in it, the well is
    a list, and a list that claims the whole column leaves one card sitting at the top of a
    box four times its height. So it switches to `flex-initial` (0 1 auto): the height its
    files need, shrinking only when the column runs out, at which point the `min-h-0` chain
    down to the list's `overflow-y-auto` turns the overflow into a scroll.
  */
  const empty = shown.length === 0;
  const dropzone = fill && empty && !readOnly;
  const grow = fill && !empty;

  return (
    <div
      className={
        dropzone
          ? 'flex min-h-0 min-w-0 flex-1 flex-col'
          : grow
            ? 'flex min-h-0 min-w-0 flex-initial flex-col'
            : 'w-full'
      }
    >
      {label && (
        <div className="mb-1.5 flex shrink-0 items-baseline justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-caption-strong text-text-secondary">{label}</span>
            {hint && (
              <Tooltip title={hint}>
                <span
                  tabIndex={0}
                  aria-label={typeof hint === 'string' ? hint : undefined}
                  className="inline-flex shrink-0 text-icon-subtle"
                >
                  <InfoOutlined sx={{ fontSize: 14 }} />
                </span>
              </Tooltip>
            )}
          </div>
          {/*
            The count earns its place only while the well can hide rows. Given `fill` the
            editable list scrolls inside a fixed height, so the number says how many exist
            past the fold. The read-only grid sizes to its content — every card is on
            screen, and a "2" floated to the far right of a list of two is a number for
            something the reader has already counted.
          */}
          {shown.length > 0 && !readOnly && (
            <span className="tabular-nums text-caption text-text-tertiary">{shown.length}</span>
          )}
        </div>
      )}

      {shown.length === 0 && readOnly ? null : (
        <div
          onDragEnter={(e) => {
            if (!canAdd) return;
            e.preventDefault();
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(e) => {
            if (!canAdd) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={() => {
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) {
              dragDepth.current = 0;
              setDragging(false);
            }
          }}
          onDrop={(e) => {
            if (!canAdd) return;
            e.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            void ingest(Array.from(e.dataTransfer.files));
          }}
          className={[
            'relative flex min-h-0 flex-col overflow-hidden transition-colors',
            // The well is the drop target's affordance. With nothing to drop it is a box
            // around a list, and this list already sits inside a panel of its own.
            readOnly ? '' : 'rounded-md bg-surface',
            // A solid hairline everywhere except the dropzone, which draws its own dashed
            // one below — two outlines on one edge would read as a double border.
            readOnly || dropzone ? '' : 'border border-border',
            // Empty and filling: the well takes the field's whole height, so the prompt
            // has a target to be centred in.
            dropzone ? 'flex-1' : '',
            /*
              Blue while a file is over it, the convention every file UI shares. It is a
              transient interaction state rather than a status — it exists only for the
              second a drag is held over the target, when nothing else on the panel is
              being read — so it does not spend the `info` blue that a chip would.
            */
            dragging ? 'ring-1 ring-inset ring-[var(--ds-color-status-info-fill)]' : '',
          ].join(' ')}
          /*
            The border colour is set here rather than as a `border-[…]` utility: both it and
            `border-border` are border-colour utilities, so which one wins is decided by
            their order in Tailwind's output, not by the order in this array — and the grey
            was winning, leaving a blue ring inside a grey outline.
          */
          style={dragging && !dropzone ? { borderColor: 'var(--ds-color-status-info-fill)' } : undefined}
        >
          {/* The dropzone's outline. Blue while a file is over it, the same signal the
              solid-bordered well gives. */}
          {dropzone && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{
                backgroundColor: dragging
                  ? 'var(--ds-color-status-info-fill)'
                  : 'var(--ds-color-border-default)',
                maskImage: DASHED_OUTLINE_MASK,
                WebkitMaskImage: DASHED_OUTLINE_MASK,
              }}
            />
          )}
          {/*
            A wash over the well's own content rather than a background swap, so the drop
            target reads as one lit surface whether it holds a prompt or nine file cards —
            swapping the background would leave the cards sitting on it unchanged, and the
            reader could not tell which region would take the drop.

            `color-mix` against the token, not a hand-mixed hex: the wash has to stay
            translucent so the files underneath still show through, which is what says
            "these will be added to" rather than "these will be replaced".

            `pointer-events-none` is load-bearing — the overlay appears under the cursor
            mid-drag, and without it the dragenter/dragleave counting on the parent would
            see the overlay itself and flicker.
          */}
          {dragging && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[1] grid place-items-center rounded-md"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--ds-color-status-info-fill) 12%, transparent)',
              }}
            >
              {/* Only over a list. The empty well's own prompt already reads "Drag and
                  drop or browse files", and a pill repeating it two lines below is the
                  same sentence twice. */}
              {shown.length > 0 && (
                <span
                  className="inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-body-sm-medium shadow-sm"
                  style={{
                    backgroundColor: 'var(--ds-color-surface-default)',
                    color: 'var(--ds-color-status-info-fg)',
                  }}
                >
                  <FileDownloadOutlined sx={{ fontSize: 18 }} />
                  Drop to attach
                </span>
              )}
            </div>
          )}
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            multiple
            hidden
            disabled={!canAdd}
            onChange={(e) => void ingest(Array.from(e.target.files ?? []))}
          />

          {empty ? (
            <button
              type="button"
              onClick={openPicker}
              disabled={!canAdd}
              aria-describedby={helperText || error ? `${inputId}-help` : undefined}
              className={[
                'w-full transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle disabled:cursor-not-allowed disabled:opacity-50',
                /*
                  Two layouts for one prompt. Filling a column it is a dropzone — mark
                  above the words, both centred, so the whole area reads as the place to
                  let go. Sized to its content it is a row in a form, where a stacked and
                  centred prompt would be three lines of chrome for one control.
                */
                dropzone
                  ? 'flex h-full flex-col items-center justify-center gap-3 px-4 py-8 text-center'
                  : 'flex items-center gap-2.5 px-3 py-2.5 text-left',
              ].join(' ')}
            >
              <Avatar
                name="Drag and drop or browse files"
                size={dropzone ? 'md' : 'sm'}
                icon={<AttachFile />}
              />
              <span className={dropzone ? '' : 'min-w-0'}>
                <span className="block text-body-sm-medium text-text-primary">
                  Drag and drop or <span className="text-text-link">browse</span> files
                </span>
                <span className="block text-caption text-text-tertiary">PDF, Word, or image</span>
              </span>
            </button>
          ) : (
            <>
              <ul
                className={
                  readOnly
                    ? /*
                         `auto-fill` against a 140px floor, not `sm:`/`xl:` column counts.
                         What has to fit is this container, and it is far narrower than the
                         viewport wherever the field sits beside a rail — on the review
                         page a 1142px window leaves it 380px, where three columns cut
                         "marketing-signoff.pdf" down to "marketi…". Five sit side by side
                         from ~740px of container, and below that the count drops instead
                         of the names.
                      */
                      'ds-scroll grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 overflow-y-auto'
                    : 'ds-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.5'
                }
              >
                {shown.map((file) => (
                  <li key={file.id} className="min-w-0 rounded-md bg-subtle">
                    <FileRow
                      file={file}
                      readOnly={readOnly || disabled}
                      canRetry={!readOnly}
                      onOpen={() => openFile(file)}
                      onRemove={() => remove(file.id)}
                      onRetry={() => retry(file.id)}
                    />
                  </li>
                ))}
              </ul>
              {canAdd && (
                <button
                  type="button"
                  onClick={openPicker}
                  className="flex w-full shrink-0 items-center gap-2 border-t border-border px-3 py-2 text-left text-body-sm-medium text-text-link transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle"
                >
                  <Add sx={{ fontSize: 18 }} />
                  {uploading ? 'Add another file' : 'Add more files'}
                </button>
              )}
              {atLimit && !readOnly && (
                <p className="shrink-0 border-t border-border px-3 py-2 text-caption text-text-tertiary">
                  {maxFiles} files max
                </p>
              )}
            </>
          )}
        </div>
      )}

      {(error || helperText) && (
        <p
          id={`${inputId}-help`}
          className={`mt-1.5 text-caption ${error ? 'text-danger' : 'text-text-secondary'}`}
        >
          {error || helperText}
        </p>
      )}

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.name ?? 'Preview'}
        subtitle={preview ? formatFileSize(preview.size) : undefined}
        width={preview?.kind === 'image' ? 640 : 800}
        height={preview?.kind === 'image' ? undefined : '80vh'}
        footer={
          preview ? (
            <>
              <Button variant="secondary" onClick={() => setPreview(null)}>
                Close
              </Button>
              <Button onClick={() => preview && downloadFileAttachment(preview)}>Download</Button>
            </>
          ) : undefined
        }
      >
        {preview?.kind === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.dataUrl}
            alt={preview.name}
            className="mx-auto max-h-[60vh] max-w-full rounded-md"
          />
        )}
        {preview?.kind === 'pdf' && pdfSrc && (
          <iframe
            title={preview.name}
            src={pdfSrc}
            className="h-full w-full rounded-md bg-subtle"
          />
        )}
        {preview?.kind === 'word' && (
          <div className="ds-scroll h-full overflow-y-auto rounded-md border border-border-subtle bg-surface">
            {docx.state === 'pending' && (
              <p className="p-6 text-body-sm text-text-secondary">Reading the document…</p>
            )}
            {docx.state === 'failed' && (
              <div className="p-6">
                <p className="text-body-sm-strong text-text-primary">This document cannot be shown here</p>
                <p className="mt-1 text-body-sm text-text-secondary">
                  It may use features the in-browser reader does not support. Download it to open in
                  Word.
                </p>
              </div>
            )}
            {docx.state === 'ready' && (
              /*
                The converted markup is the document's own, so it is styled by a stylesheet
                rather than by classes we cannot put on it — `.ds-docx-preview` in
                globals.css maps its h1/p/ul/table to our type scale.

                `dangerouslySetInnerHTML` with mammoth's output: it emits a fixed, small set
                of semantic elements from the OOXML and carries no script or style through,
                so the surface is a document's own headings and paragraphs. It never renders
                anything the uploader did not put in a .docx that a reviewer chose to open.
              */
              <div
                className="ds-docx-preview p-6"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: docx.html }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function FileRow({
  file,
  readOnly,
  canRetry,
  onOpen,
  onRemove,
  onRetry,
}: {
  file: FileAttachment;
  readOnly: boolean;
  canRetry: boolean;
  onOpen: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const Icon = KIND_ICON[file.kind];
  const status = fileAttachmentStatus(file);
  const ready = fileAttachmentIsReady(file);
  const canPreview = fileAttachmentCanPreview(file.kind);
  const errorId = `${file.id}-error`;
  const percent = Math.max(0, Math.min(100, file.progress ?? 0));
  const showThumb = file.kind === 'image' && Boolean(file.dataUrl);

  const copy = (
    <>
      <FileMark file={file} showThumb={showThumb} Icon={Icon} compact={readOnly} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm-medium text-text-primary">{file.name}</span>
        <span className="block truncate tabular-nums text-caption text-text-tertiary">
          {formatFileSize(file.size)}
          {/* Nothing follows the size on a read-only list: every file there is uploaded,
              so the word is a column of "Uploaded" down the side of a reviewer's screen.
              A failure still speaks — it is the one status that is not the default. */}
          {!readOnly && status !== 'failed' && <span aria-hidden> • </span>}
          {!readOnly && status === 'uploading' && `${percent}%`}
          {!readOnly && status === 'success' && <span className="text-success">Uploaded</span>}
          {status === 'failed' && (
            <>
              <span aria-hidden> • </span>
              <span className="text-danger">Failed</span>
            </>
          )}
        </span>
        {status === 'uploading' && (
          <span
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={`Uploading ${file.name}`}
            className="mt-1 block h-1 overflow-hidden rounded-pill bg-border"
          >
            <span
              className="block h-full bg-success transition-[width] duration-200"
              style={{ width: `${percent}%` }}
            />
          </span>
        )}
        {status === 'failed' && file.error && (
          <span id={errorId} className="mt-0.5 block text-caption text-danger">
            {file.error}
          </span>
        )}
        {status === 'failed' && canRetry && !readOnly && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-0.5 text-caption text-text-link hover:underline"
          >
            Try again
          </button>
        )}
      </span>
    </>
  );

  return (
    <div
      className={[
        'flex items-center gap-1.5 select-none',
        readOnly ? 'px-2 py-1.5' : 'px-2 py-2',
      ].join(' ')}
      title={ready ? `${file.name} — double-click to preview` : file.name}
      onDoubleClick={ready ? onOpen : undefined}
      aria-busy={status === 'uploading'}
      aria-invalid={status === 'failed'}
      aria-describedby={status === 'failed' ? errorId : undefined}
    >
      <div
        className={[
          'flex min-w-0 flex-1 items-center',
          readOnly ? 'gap-2' : 'items-start gap-2.5',
        ].join(' ')}
      >
        {copy}
      </div>
      {ready && (
        <span className="shrink-0" onDoubleClick={(e) => e.stopPropagation()}>
          <Menu
            ariaLabel={`Actions for ${file.name}`}
            items={[
              {
                label: 'Preview',
                icon: <VisibilityOutlined sx={{ fontSize: 16 }} />,
                onClick: onOpen,
                disabled: !canPreview,
              },
              {
                label: 'Download',
                icon: <FileDownloadOutlined sx={{ fontSize: 16 }} />,
                onClick: () => downloadFileAttachment(file),
              },
            ]}
            trigger={
              <button
                type="button"
                aria-label={`Actions for ${file.name}`}
                className="grid h-7 w-7 place-items-center rounded-sm text-icon-subtle transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              >
                <MoreVert sx={{ fontSize: 16 }} />
              </button>
            }
          />
        </span>
      )}
      {!readOnly && (
        <Tooltip title={status === 'uploading' ? `Cancel ${file.name}` : `Remove ${file.name}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={status === 'uploading' ? `Cancel ${file.name}` : `Remove ${file.name}`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-sm text-icon-subtle transition-colors hover:bg-surface-hover hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            <DeleteOutline sx={{ fontSize: 16 }} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

/**
 * The tile in front of a file: its thumbnail if it has one, otherwise a glyph tinted by
 * format.
 *
 * Not `Avatar`. An avatar is a person's or an entity's initial on a brand tint, and every
 * file was getting the same orange tile with a different glyph inside it — so the mark
 * said "attachment" and nothing more, and the DOM read `aria-label="report.pdf avatar"`
 * for something that has no initials and is not an identity.
 *
 * Red for PDF, blue for Word, green for an image: a filing convention the reader already
 * has, which is worth more here than a vendor logo would be. A logo would also be a
 * misattribution — PDF is an ISO format, not Adobe's, so stamping every PDF with Adobe's
 * mark tells the reader something untrue about where the file came from. The tints are
 * their own `color.file` token group for the same reason they are not `status`: a format
 * is a kind, not a state.
 */
function FileMark({
  file,
  showThumb,
  Icon,
  compact = false,
}: {
  file: FileAttachment;
  showThumb: boolean;
  Icon: typeof PictureAsPdfOutlined;
  /** 24px on a read-only card, where five sit side by side and 32px of mark is most of one. */
  compact?: boolean;
}) {
  const box = compact ? 24 : 32;
  if (showThumb) {
    return (
      <img
        src={file.dataUrl}
        alt=""
        className="shrink-0 object-cover"
        style={{ width: box, height: box, borderRadius: 'var(--ds-radius-avatar)' }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={`${fileAttachmentKindLabel(file.kind)} file`}
      className="inline-flex shrink-0 items-center justify-center"
      style={{
        width: box,
        height: box,
        borderRadius: 'var(--ds-radius-avatar)',
        backgroundColor: `var(--ds-color-file-${file.kind}-subtle)`,
        color: `var(--ds-color-file-${file.kind}-fg)`,
      }}
    >
      <Icon sx={{ fontSize: compact ? 14 : 18 }} />
    </span>
  );
}

function animateProgress(
  id: string,
  from: number,
  to: number,
  setProgress: (id: string, percent: number) => void,
): Promise<void> {
  const start = performance.now();
  const duration = 420;
  return new Promise((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(id, from + (to - from) * t);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}
