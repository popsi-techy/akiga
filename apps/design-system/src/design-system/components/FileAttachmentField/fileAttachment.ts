export type FileAttachmentKind = 'pdf' | 'word' | 'image';

/** Per-file upload lifecycle. Omit `status` on persisted evidence — it reads as success. */
export type FileAttachmentStatus = 'uploading' | 'success' | 'failed';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  kind: FileAttachmentKind;
  dataUrl: string;
  addedAt: string;
  status?: FileAttachmentStatus;
  /** 0–100 while `status` is uploading. Display-only; do not persist. */
  progress?: number;
  /** Why this file failed. Shown on the row. */
  error?: string;
}

export function fileAttachmentStatus(file: FileAttachment): FileAttachmentStatus {
  return file.status ?? 'success';
}

export function fileAttachmentIsReady(file: FileAttachment): boolean {
  return fileAttachmentStatus(file) === 'success' && Boolean(file.dataUrl);
}

export type FileAttachmentRejectReason = 'type' | 'size' | 'limit' | 'read';

export interface FileAttachmentReject {
  name: string;
  reason: FileAttachmentRejectReason;
  message: string;
}

export const FILE_ATTACHMENT_MAX_BYTES = Math.round(1.5 * 1024 * 1024);

export const FILE_ATTACHMENT_ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
].join(',');

const WORD_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function fileAttachmentKind(file: { name: string; type: string }): FileAttachmentKind | null {
  if (file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(file.name)) return 'image';
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf';
  if (WORD_TYPES.has(file.type) || /\.docx?$/i.test(file.name)) return 'word';
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileAttachmentKindLabel(kind: FileAttachmentKind): string {
  if (kind === 'pdf') return 'PDF';
  if (kind === 'word') return 'Word';
  return 'Image';
}

/**
 * Every kind can be previewed in place.
 *
 * Images and PDFs the browser renders itself. Word goes through `docxToHtml`, which
 * converts the package to semantic HTML in the tab — see ADR-0020 for why that route and
 * not an Office/Google embed.
 */
export function fileAttachmentCanPreview(_kind: FileAttachmentKind): boolean {
  return true;
}

/**
 * A `.docx` data URL as readable HTML.
 *
 * `mammoth` is imported here and only here, dynamically, so ~150KB of OOXML parsing stays
 * out of every bundle that merely renders an attachment list. Throws for a package it
 * cannot read; the caller falls back to a download rather than showing an empty frame.
 */
export async function docxToHtml(dataUrl: string): Promise<string> {
  const [{ convertToHtml }, buffer] = await Promise.all([
    import('mammoth'),
    Promise.resolve(arrayBufferFromDataUrl(dataUrl)),
  ]);
  const { value } = await convertToHtml({ arrayBuffer: buffer });
  const html = value.trim();
  if (!html) throw new Error('empty document');
  return html;
}

/** The bytes behind a data URL. */
export function arrayBufferFromDataUrl(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(',');
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Object URL for an iframe/embed. Revoke it when the preview closes. */
export function blobUrlFromDataUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  const meta = comma >= 0 ? dataUrl.slice(0, comma) : '';
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const mime = /data:([^;,]+)/.exec(meta)?.[1] ?? 'application/octet-stream';
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export function downloadFileAttachment(file: FileAttachment): void {
  const a = document.createElement('a');
  a.href = file.dataUrl;
  a.download = file.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function readFileAsAttachment(
  file: File,
  maxBytes = FILE_ATTACHMENT_MAX_BYTES,
  onProgress?: (percent: number) => void,
): Promise<FileAttachment | FileAttachmentReject> {
  const kind = fileAttachmentKind(file);
  if (!kind) {
    return Promise.resolve({
      name: file.name,
      reason: 'type',
      message: `${file.name} isn’t a PDF, Word document, or image.`,
    });
  }
  if (file.size > maxBytes) {
    return Promise.resolve({
      name: file.name,
      reason: 'size',
      message: `${file.name} is larger than ${formatFileSize(maxBytes)}.`,
    });
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress?.(Math.round((event.loaded / event.total) * 80));
    };
    reader.onerror = () =>
      resolve({ name: file.name, reason: 'read', message: `Couldn’t read ${file.name}.` });
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        resolve({ name: file.name, reason: 'read', message: `Couldn’t read ${file.name}.` });
        return;
      }
      onProgress?.(80);
      resolve({
        id: `att-${crypto.randomUUID()}`,
        name: file.name,
        size: file.size,
        mimeType: file.type || mimeForKind(kind),
        kind,
        dataUrl,
        addedAt: new Date().toISOString(),
        status: 'success',
      });
    };
    reader.readAsDataURL(file);
  });
}

function mimeForKind(kind: FileAttachmentKind): string {
  if (kind === 'pdf') return 'application/pdf';
  if (kind === 'word') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'image/png';
}
