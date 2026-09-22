'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BlockEditor, Button, Input, StatusChip, useToast } from '@ds/components';
import { BaseEmailTemplateShell } from '@/components/product/email-templates';
import {
  getEmailType,
  setInUseVariant,
  updateEmailType,
  type EmailType,
} from '@/data/email-types';
import { getEmailTemplate } from '@/data/email-templates';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { SettingsDenied, useAdminSettings } from '../SettingsChrome';

const SECTION = getSystemSettingsSection('email')!;

/** The greeting/sign-off/footer every email carries, from the `base` template. */
const BASE_CONTENT = getEmailTemplate('base')!.content;

/**
 * Compose one version of an email.
 *
 * The greeting, logo, sign-off and legal footer come from the base template and are not
 * editable — every email this tenant sends is recognisably the same email. What is yours is
 * the name (so you can tell versions apart), the subject line, and the body between the
 * heading and the sign-off.
 *
 * Saving is explicit. "Use this version" is separate: a version can be edited for a while
 * before it is the one that sends, and marking it in use is a decision, not a side effect of
 * typing.
 */
export function EmailTypeEditor({ templateId, variantId }: { templateId: string; variantId: string }) {
  const allowed = useAdminSettings();
  const router = useRouter();
  const toast = useToast();

  const template = getEmailTemplate(templateId);
  const backHref = `/iga/configurations/email/${templateId}`;

  const [loaded, setLoaded] = React.useState(false);
  const [row, setRow] = React.useState<EmailType | null>(null);
  const [name, setName] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [dirty, setDirty] = React.useState(false);

  // Session store, read after mount — see the list page for why.
  React.useEffect(() => {
    const found = getEmailType(variantId);
    setRow(found);
    setName(found?.name ?? '');
    setSubject(found?.subjectLine ?? '');
    setBody(found?.bodyHtml ?? '');
    setDirty(false);
    setLoaded(true);
  }, [variantId]);

  useSetBreadcrumbs([
    { label: 'System Settings', href: '/iga/configurations' },
    { label: SECTION.title, href: SECTION.href },
    { label: template?.name ?? 'Email', href: backHref },
    { label: row?.name ?? 'Version' },
  ]);

  if (!allowed) return <SettingsDenied />;

  // `template` is static, so a bad templateId is missing on both server and client — decide
  // it right away. `row` is localStorage-backed, so "missing" can only be trusted once the
  // client has read it (`loaded`); until then the page renders its shell, no loading screen.
  const missing = !template || (loaded && (!row || row.sourceTemplateId !== templateId));
  if (missing) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-h4 text-text-primary">Version not found</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          It may have been deleted. The other versions are still here.
        </p>
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => router.push(backHref)}>
            Back to versions
          </Button>
        </div>
      </div>
    );
  }

  // Past the `missing` guard `template` is defined; this narrows it for TypeScript.
  if (!template) return null;

  const save = () => {
    if (!row) return;
    const next = updateEmailType(row.id, {
      name: name.trim() || 'Untitled version',
      subjectLine: subject,
      bodyHtml: body,
    });
    if (!next) return;
    setRow(next);
    setName(next.name);
    setDirty(false);
    toast.success('Saved');
  };

  const useThis = () => {
    if (!row) return;
    setInUseVariant(templateId, row.id);
    setRow({ ...row, inUse: true });
    toast.success(`“${template.name}” now sends “${row.name}”.`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 -mx-8 -mt-6 border-b border-border bg-canvas px-8 pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-h4 text-text-primary">{template.name}</h1>
              {row?.inUse && <StatusChip intent="success" label="In use" />}
            </div>
            <p className="mt-px truncate text-body-sm text-text-secondary">Editing a version of this email</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {row && !row.inUse && (
              <Button variant="secondary" onClick={useThis}>
                Use this version
              </Button>
            )}
            <Button variant="tertiary" onClick={() => router.push(backHref)}>
              Close
            </Button>
            <Button disabled={!dirty || !row} onClick={save}>
              Save
            </Button>
          </div>
        </div>
      </header>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-1 py-5">
          {!row ? (
            // Reading the version from the store; the shell above is already in place, so this
            // is a quiet inline placeholder rather than a full-page loading screen.
            <div className="animate-pulse space-y-4" aria-hidden>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-16 rounded-lg bg-subtle" />
                <div className="h-16 rounded-lg bg-subtle" />
              </div>
              <div className="h-64 rounded-xl bg-subtle" />
            </div>
          ) : (
            <>
              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Version name"
                  placeholder="e.g. Concise, Formal"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setDirty(true);
                  }}
                />
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

              {/* The real envelope, from the base template — greeting, logo, sign-off and legal
                  footer come from `BaseEmailTemplateShell`; only the middle is editable. */}
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

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-caption text-text-tertiary">
                  The greeting, sign-off and footer come from the base template and are the same on every email this
                  tenant sends.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBody('<p></p>');
                    setDirty(true);
                  }}
                  className="shrink-0 text-caption-strong text-text-link transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                >
                  Start from a blank body
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
