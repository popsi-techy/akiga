'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BlockEditor, Button, Input, Menu, StatusChip, useToast, type StatusIntent } from '@ds/components';
import { BaseEmailTemplateShell } from '@/components/product/email-templates';
import {
  getEmailType,
  updateEmailType,
  EMAIL_TYPE_STATUS_LABEL,
  type EmailType,
  type EmailTypeStatus,
} from '@/data/email-types';
import { getEmailTemplate } from '@/data/email-templates';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { SettingsDenied, SettingsLoading, useAdminSettings } from '../SettingsChrome';

const SECTION = getSystemSettingsSection('email')!;

/**
 * The greeting and sign-off every email carries, read from the `base` template rather
 * than retyped — so the words a tenant cannot edit have exactly one source.
 */
const BASE_CONTENT = getEmailTemplate('base')!.content;

const STATUS_INTENT: Record<EmailTypeStatus, StatusIntent> = {
  draft: 'caution',
  active: 'success',
  inactive: 'neutral',
};

function transitionsFor(status: EmailTypeStatus): { to: EmailTypeStatus; label: string }[] {
  switch (status) {
    case 'draft':
      return [{ to: 'active', label: 'Activate' }];
    case 'active':
      return [{ to: 'inactive', label: 'Deactivate' }];
    case 'inactive':
      return [
        { to: 'active', label: 'Activate' },
        { to: 'draft', label: 'Move back to draft' },
      ];
  }
}

/**
 * Compose one email type.
 *
 * ## The shell is the base template; only the middle is yours
 *
 * The greeting, the logo, the sign-off and the legal footer are rendered here exactly as
 * `BaseEmailTemplatePreview` renders them, and they are not editable. That is the point of
 * having a base layout: every email this tenant sends is recognisably the same email, and
 * the disclaimer is not something an admin should be able to delete by selecting it.
 *
 * What is editable is the block between the heading and the sign-off — the part that
 * differs between a welcome and a break-glass alert. Editing in place, inside the real
 * frame at the real width, means there is no separate "preview" to disagree with: the
 * reader is typing into the email.
 *
 * ## Saving
 *
 * Explicit, not autosaved. A draft is cheap to leave open and the reader may well be
 * trying wording out; committing every keystroke to the store would make "close without
 * keeping this" impossible. Save stays disabled until an edit actually happens.
 */
export function EmailTypeEditor({ id }: { id: string }) {
  const allowed = useAdminSettings();
  const router = useRouter();
  const toast = useToast();

  const [row, setRow] = React.useState<EmailType | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  /**
   * Whether the reader has changed anything, tracked rather than inferred.
   *
   * Comparing the editor's current HTML against the stored HTML looks equivalent and is
   * not: the editor re-serialises what it parsed, so a stored `<h1>x</h1>` can come back
   * with different attribute order or whitespace and read as an edit nobody made. That
   * left Save lit on a document the reader had only opened. What Save should reflect is
   * whether a change happened, which is a fact we can observe directly.
   */
  const [dirty, setDirty] = React.useState(false);

  // Session store, read after mount — see the list page for why.
  React.useEffect(() => {
    const found = getEmailType(id);
    setRow(found);
    setSubject(found?.subjectLine ?? '');
    setBody(found?.bodyHtml ?? '');
    setDirty(false);
    setLoaded(true);
  }, [id]);

  useSetBreadcrumbs([
    { label: 'System Settings', href: '/iga/configurations' },
    { label: SECTION.title, href: SECTION.href },
    { label: row?.name ?? 'Email type' },
  ]);

  if (!allowed) return <SettingsDenied />;
  if (!loaded) return <SettingsLoading />;

  if (!row) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-h4 text-text-primary">Email type not found</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          It may have been deleted. Everything else is still in the list.
        </p>
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => router.push(SECTION.href)}>
            Back to Email
          </Button>
        </div>
      </div>
    );
  }

  const save = () => {
    const next = updateEmailType(row.id, { subjectLine: subject, bodyHtml: body });
    if (!next) return;
    setRow(next);
    setDirty(false);
    toast.success('Saved');
  };

  const setStatus = (to: EmailTypeStatus) => {
    const next = updateEmailType(row.id, { status: to });
    if (next) setRow(next);
    toast.success(`“${row.name}” is now ${EMAIL_TYPE_STATUS_LABEL[to].toLowerCase()}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 -mx-8 -mt-6 border-b border-border bg-canvas px-8 pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-h4 text-text-primary">{row.name}</h1>
              <StatusChip intent={STATUS_INTENT[row.status]} label={EMAIL_TYPE_STATUS_LABEL[row.status]} />
            </div>
            {row.description && (
              <p className="mt-px truncate text-body-sm text-text-secondary">{row.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" onClick={() => router.push(SECTION.href)}>
              Close
            </Button>
            <Button disabled={!dirty} onClick={save}>
              Save
            </Button>
            <Menu
              items={[
                ...transitionsFor(row.status).map((t) => ({
                  label: t.label,
                  onClick: () => setStatus(t.to),
                })),
              ]}
            />
          </div>
        </div>
      </header>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-1 py-5">
          <div className="mb-4">
            <Input
              label="Subject line"
              placeholder="What the recipient sees before opening"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setDirty(true);
              }}
            />
          </div>

          {/* The real envelope, from the base template itself rather than a copy of it —
              greeting, logo, sign-off and legal footer all come from `BaseEmailTemplateShell`,
              and the fixed copy inside it from the `base` template's own content. A second
              copy here is what let the footer's help line and a sentence of the disclaimer
              drift away from the email this actually sends. */}
          <BaseEmailTemplateShell
            greetingName={BASE_CONTENT.greetingName}
            greetingLine={BASE_CONTENT.greetingLine}
            signOff={BASE_CONTENT.signOff}
            teamName={BASE_CONTENT.teamName}
            ariaLabel={`${row.name} body`}
          >
            <BlockEditor
              value={body}
              onChange={(html) => {
                setBody(html);
                setDirty(true);
              }}
              ariaLabel={`Body of ${row.name}`}
              placeholder="Write the message, or press '/' for headings, lists and more"
            />
          </BaseEmailTemplateShell>

          <p className="mt-3 text-caption text-text-tertiary">
            The greeting, sign-off and footer come from the base template and are the same on every
            email this tenant sends.
          </p>
        </div>
      </div>
    </div>
  );
}
