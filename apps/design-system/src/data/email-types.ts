/**
 * Email versions — the tenant's own wordings for the emails the product sends.
 *
 * `email-templates` is the read-only catalogue miniOrange ships: one **Default** per email,
 * always available. A tenant never edits the catalogue. Instead they compose their own
 * **versions** of an email here — as many as they like — and mark one as **in use**. When a
 * type has no version in use, its shipped Default is what sends. There is no on/off: every
 * email the product sends is always sent; the only choice is whose wording.
 */
import { getEmailTemplate, type EmailTemplate } from './email-templates';

export interface EmailType {
  id: string;
  /** The version's own name, e.g. "Concise" — distinguishes it from other versions. */
  name: string;
  description: string;
  /** The catalogue email this version belongs to. */
  sourceTemplateId: string;
  /** Whether this version is the one currently sent for its type (at most one per type). */
  inUse: boolean;
  subjectLine: string;
  /** The editable middle of the email, as HTML. The shell around it is the base layout. */
  bodyHtml: string;
  createdAt: string;
  updatedAt: string;
}

const STORE_KEY = 'iga.emailTypes.v1';

const hasWindow = () => typeof window !== 'undefined';

/**
 * Rows written before this model carried `status`/`mode` and could be from-scratch (no
 * template). Normalise them forward: a row's `inUse` comes from the old `active` status, and
 * a row with no `sourceTemplateId` no longer has a home, so it is dropped.
 */
function readStore(): EmailType[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as (EmailType & { status?: string })[])
      .filter((r) => Boolean(r.sourceTemplateId))
      .map((r) => ({ ...r, inUse: r.inUse ?? r.status === 'active' }));
  } catch {
    return [];
  }
}

function writeStore(rows: EmailType[]): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(rows));
}

function makeId(): string {
  return `et-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function getEmailType(id: string): EmailType | null {
  return readStore().find((t) => t.id === id) ?? null;
}

/** Every version of one email, newest first. */
export function listVariants(templateId: string): EmailType[] {
  return readStore()
    .filter((t) => t.sourceTemplateId === templateId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** The version currently sent for a type, or `null` when the Default is in use. */
export function getInUseVariant(templateId: string): EmailType | null {
  return readStore().find((t) => t.sourceTemplateId === templateId && t.inUse) ?? null;
}

/** Every version, grouped by the email it belongs to — for the landing summary. */
export function variantsByTemplate(): Map<string, EmailType[]> {
  const map = new Map<string, EmailType[]>();
  for (const row of readStore()) {
    const list = map.get(row.sourceTemplateId) ?? [];
    list.push(row);
    map.set(row.sourceTemplateId, list);
  }
  return map;
}

/**
 * Escape before interpolating catalog copy into HTML.
 *
 * The catalog is authored in this repo, not by a user, so this is not a live XSS path —
 * but the output is fed to an editor that renders HTML, and a seed function that builds
 * markup from strings should not be the one place where that assumption is left implicit.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The starting body for a new version.
 *
 * A template contributes its heading and whatever prose its body variant carries. The
 * structured variants (tables of requested items, OTP blocks) are deliberately not
 * reproduced as HTML: they are rendered by `EmailTemplateBodySlot` from typed data, and
 * flattening them into editable markup would quietly fork one into two. What the reader
 * gets instead is the heading and an invitation to write the body.
 */
export function seedBodyHtml(template: EmailTemplate | null): string {
  if (!template) {
    return '<p></p>';
  }
  const parts: string[] = [`<h1>${escapeHtml(template.content.heading)}</h1>`];
  const placeholder = template.content.bodyPlaceholder;
  if (placeholder) {
    parts.push(`<p>${escapeHtml(placeholder)}</p>`);
  } else {
    parts.push(`<p>${escapeHtml(template.description)}</p>`);
  }
  return parts.join('');
}

/**
 * Add a version to a type, seeded from its shipped Default. Not in use until chosen — a new
 * version is a draft you can shape before it ever sends.
 */
export function createVariant(templateId: string, name: string): EmailType {
  const template = getEmailTemplate(templateId) ?? null;
  const now = new Date().toISOString();
  const row: EmailType = {
    id: makeId(),
    name: name.trim() || 'Untitled version',
    description: '',
    sourceTemplateId: templateId,
    inUse: false,
    subjectLine: template?.subjectLine ?? '',
    bodyHtml: seedBodyHtml(template),
    createdAt: now,
    updatedAt: now,
  };
  writeStore([...readStore(), row]);
  return row;
}

export function updateEmailType(
  id: string,
  patch: Partial<Pick<EmailType, 'name' | 'description' | 'subjectLine' | 'bodyHtml'>>,
): EmailType | null {
  const rows = readStore();
  const i = rows.findIndex((t) => t.id === id);
  if (i === -1) return null;
  const next: EmailType = { ...rows[i], ...patch, updatedAt: new Date().toISOString() };
  rows[i] = next;
  writeStore(rows);
  return next;
}

/**
 * Choose which version sends for a type. Passing `null` puts the shipped Default back in
 * use. At most one version of a type is ever in use, so the siblings are cleared here rather
 * than trusted to be already false.
 */
export function setInUseVariant(templateId: string, variantId: string | null): void {
  const rows = readStore().map((r) =>
    r.sourceTemplateId === templateId ? { ...r, inUse: r.id === variantId } : r,
  );
  writeStore(rows);
}

export function deleteEmailType(id: string): void {
  writeStore(readStore().filter((t) => t.id !== id));
}
