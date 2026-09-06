'use client';

import * as React from 'react';
import Add from '@mui/icons-material/Add';
import AttachFile from '@mui/icons-material/AttachFile';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import { Avatar } from '../Avatar/Avatar';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import { Tooltip } from '../Tooltip/Tooltip';
import {
  FILE_ATTACHMENT_ACCEPT,
  FILE_ATTACHMENT_MAX_BYTES,
  blobUrlFromDataUrl,
  downloadFileAttachment,
  fileAttachmentCanPreview,
  fileAttachmentIsReady,
  fileAttachmentKind,
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
   * Fill leftover height in a flex column and scroll the file list inside.
   * Use on a rail with a pinned footer so cards never slip behind it.
   */
  fill?: boolean;
  helperText?: React.ReactNode;
  error?: string;
  onReject?: (errors: FileAttachmentReject[]) => void;
}

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

  const uploading = shown.some((f) => fileAttachmentStatus(f) === 'uploading');
  const grow = fill && shown.length > 0;

  return (
    <div className={grow ? 'flex min-h-0 min-w-0 flex-1 flex-col' : 'w-full'}>
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
          {shown.length > 0 && (
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
            'flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-surface',
            grow ? 'flex-1' : '',
            dragging ? 'border-border-strong ring-2 ring-inset ring-brand-subtle' : '',
          ].join(' ')}
        >
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

          {shown.length === 0 ? (
            <button
              type="button"
              onClick={openPicker}
              disabled={!canAdd}
              aria-describedby={helperText || error ? `${inputId}-help` : undefined}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-subtle disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Avatar name="Drag and drop or browse files" size="sm" icon={<AttachFile />} />
              <span className="min-w-0">
                <span className="block text-body-sm-medium text-text-primary">
                  Drag and drop or <span className="text-text-link">browse</span> files
                </span>
                <span className="block text-caption text-text-tertiary">PDF, Word, or image</span>
              </span>
            </button>
          ) : (
            <>
              <ul className="ds-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.5">
                {shown.map((file) => (
                  <li key={file.id} className="rounded-md bg-subtle">
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
        width={preview?.kind === 'pdf' ? 800 : 640}
        height={preview?.kind === 'pdf' ? '80vh' : undefined}
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
  const action = fileAttachmentCanPreview(file.kind) ? 'Preview' : 'Download';
  const errorId = `${file.id}-error`;
  const percent = Math.max(0, Math.min(100, file.progress ?? 0));
  const showThumb = file.kind === 'image' && Boolean(file.dataUrl);

  const copy = (
    <>
      <FileMark file={file} showThumb={showThumb} Icon={Icon} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm-medium text-text-primary">{file.name}</span>
        <span className="tabular-nums text-caption text-text-tertiary">
          {formatFileSize(file.size)}
          <span aria-hidden> • </span>
          {status === 'uploading' && `${percent}%`}
          {status === 'success' && <span className="text-success">Uploaded</span>}
          {status === 'failed' && <span className="text-danger">Failed</span>}
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
      className="flex items-center gap-1.5 px-2 py-2"
      aria-busy={status === 'uploading'}
      aria-invalid={status === 'failed'}
      aria-describedby={status === 'failed' ? errorId : undefined}
    >
      {ready ? (
        <button
          type="button"
          onClick={onOpen}
          title={file.name}
          className="flex min-w-0 flex-1 items-start gap-2.5 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          aria-label={`${action} ${file.name}`}
        >
          {copy}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-2.5">{copy}</div>
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

function FileMark({
  file,
  showThumb,
  Icon,
}: {
  file: FileAttachment;
  showThumb: boolean;
  Icon: typeof PictureAsPdfOutlined;
}) {
  return (
    <Avatar
      name={file.name}
      size="sm"
      src={showThumb ? file.dataUrl : undefined}
      icon={showThumb ? undefined : <Icon />}
    />
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
