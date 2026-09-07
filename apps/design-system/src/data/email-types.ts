/**
 * Email types — the notification emails a tenant has composed for itself.
 *
 * Distinct from `email-templates`, which is the read-only catalog miniOrange ships. A
 * template is the starting point; a type is the tenant's own copy of one, with its own
 * name, subject, body and lifecycle. Editing a type never touches the catalog, which is
 * why the two are separate stores rather than one list with an `isCustom` flag.
 */
import { getEmailTemplate, type EmailTemplate } from './email-templates';

export type EmailTypeStatus = 'draft' | 'active' | 'inactive';

export const EMAIL_TYPE_STATUS_LABEL: Record<EmailTypeStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  inactive: 'Inactive',
};

export interface EmailType {
  id: string;
  name: string;
  description: string;
  status: EmailTypeStatus;
  /** The catalog template it started from, or `null` when written from scratch. */
  sourceTemplateId: string | null;
  subjectLine: string;
  /** The editable middle of the email, as HTML. The shell around it is the base layout. */
  bodyHtml: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The five catalog templates offered as starting points.
 *
 * Chosen to span the lifecycle rather than to be the five most common: one welcome, one
 * request, one review, one security and one break-glass. A tenant starting from any of
 * them lands somewhere different in the product, which is what makes the gallery worth
 * browsing instead of a dropdown.
 */
export const STARTER_TEMPLATE_IDS = [
  'welcome-organization',
  'access-request-submitted',
  'review-request-new',
  'password-reset',
  'emergency-access-assigned',
] as const;

export function listStarterTemplates(): EmailTemplate[] {
  return STARTER_TEMPLATE_IDS.map((id) => getEmailTemplate(id)).filter(
    (t): t is EmailTemplate => Boolean(t),
  );
}

const STORE_KEY = 'iga.emailTypes.v1';

const hasWindow = () => typeof window !== 'undefined';

function readStore(): EmailType[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as EmailType[]) : [];
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

/** Newest first — the one you just made is the one you are looking for. */
export function listEmailTypes(): EmailType[] {
  return readStore().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getEmailType(id: string): EmailType | null {
  return readStore().find((t) => t.id === id) ?? null;
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
 * The starting body for a new type.
 *
 * A template contributes its heading and whatever prose its body variant carries. The
 * structured variants (tables of requested items, OTP blocks) are deliberately not
 * reproduced as HTML: they are rendered by `EmailTemplateBodySlot` from typed data, and
 * flattening them into editable markup would quietly fork one into two. What the reader
 * gets instead is the heading and an invitation to write the body, which is the honest
 * version of "start from this template".
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

export function createEmailType(input: {
  name: string;
  description: string;
  sourceTemplateId: string | null;
  status?: EmailTypeStatus;
}): EmailType {
  const template = input.sourceTemplateId ? getEmailTemplate(input.sourceTemplateId) ?? null : null;
  const now = new Date().toISOString();
  const row: EmailType = {
    id: makeId(),
    name: input.name.trim(),
    description: input.description.trim(),
    // A new type is a draft: it exists, but nothing is sending it yet.
    status: input.status ?? 'draft',
    sourceTemplateId: input.sourceTemplateId,
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
  patch: Partial<Pick<EmailType, 'name' | 'description' | 'status' | 'subjectLine' | 'bodyHtml'>>,
): EmailType | null {
  const rows = readStore();
  const i = rows.findIndex((t) => t.id === id);
  if (i === -1) return null;
  const next: EmailType = { ...rows[i], ...patch, updatedAt: new Date().toISOString() };
  rows[i] = next;
  writeStore(rows);
  return next;
}

export function deleteEmailType(id: string): void {
  writeStore(readStore().filter((t) => t.id !== id));
}
