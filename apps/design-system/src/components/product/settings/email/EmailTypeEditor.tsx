'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import CodeOutlined from '@mui/icons-material/CodeOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { Avatar, BlockEditor, Button, Input, StatusChip, Tooltip, useToast, type BlockEditorApi } from '@ds/components';
import {
  getEmailType,
  seedBodyHtml,
  setInUseVariant,
  updateEmailType,
  type EmailType,
} from '@/data/email-types';
import { getEmailTemplate } from '@/data/email-templates';
import { getEmailPlaceholders } from '@/data/email-placeholders';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { SettingsDenied, useAdminSettings } from '../SettingsChrome';

const SECTION = getSystemSettingsSection('email')!;

/**
 * Compose one version of an email.
 *
 * The greeting, logo, sign-off and legal footer come from the base template and are not
 * editable — every email this tenant sends is recognisably the same email. What is yours is
 * the name (so you can tell versions apart), the subject line, and the body between the
 * heading and the sign-off.
 *
 * Saving is explicit. "Use this template" is separate: a version can be edited for a while
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

  const editorApi = React.useRef<BlockEditorApi>(null);

  // HTML source mode — paste custom HTML/CSS to style the mail. `editorKey` remounts the
  // uncontrolled rich editor with the edited HTML when switching back.
  const [sourceMode, setSourceMode] = React.useState(false);
  const [editorKey, setEditorKey] = React.useState(0);
  const sourceRef = React.useRef<HTMLTextAreaElement>(null);
  // The docked toolbar renders into this bar at the top of the outer box, above the envelope.
  const toolbarSlot = React.useRef<HTMLDivElement>(null);

  const toggleSource = () => {
    // Leaving source view re-seeds the rich editor with whatever HTML was typed.
    if (sourceMode) setEditorKey((k) => k + 1);
    setSourceMode((s) => !s);
  };

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
    { label: row?.name ?? 'Template' },
  ]);

  if (!allowed) return <SettingsDenied />;

  // `template` is static, so a bad templateId is missing on both server and client — decide
  // it right away. `row` is localStorage-backed, so "missing" can only be trusted once the
  // client has read it (`loaded`); until then the page renders its shell, no loading screen.
  const missing = !template || (loaded && (!row || row.sourceTemplateId !== templateId));
  if (missing) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-h4 text-text-primary">Template not found</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          It may have been deleted. The other templates are still here.
        </p>
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => router.push(backHref)}>
            Back to templates
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
      name: name.trim() || 'Untitled template',
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

  // Save the edits and make this version the one that sends, in one step.
  const saveAndUse = () => {
    if (!row) return;
    const next = updateEmailType(row.id, {
      name: name.trim() || 'Untitled template',
      subjectLine: subject,
      bodyHtml: body,
    });
    if (!next) return;
    setInUseVariant(templateId, next.id);
    setRow({ ...next, inUse: true });
    setName(next.name);
    setDirty(false);
    toast.success(`Saved — “${template.name}” now sends “${next.name}”.`);
  };

  // Empty the body. Bump the key so the uncontrolled rich editor reloads the blank content.
  const clearBody = () => {
    setBody('<p></p>');
    setEditorKey((k) => k + 1);
    setDirty(true);
  };
  // Restore the shipped Default wording (subject + body) for this email.
  const resetToDefault = () => {
    setSubject(template.subjectLine);
    setBody(seedBodyHtml(template));
    setEditorKey((k) => k + 1);
    setDirty(true);
    toast.info('Reset to the default wording. Save to keep it.');
  };

  // Placeholders this email offers, for the in-editor `{{` picker.
  const tokens = getEmailPlaceholders(template.category).map((p) => ({
    value: p.token,
    label: p.label,
  }));

  return (
    <div className="-mb-6 flex h-[calc(100%+var(--ds-space-6))] min-h-0 flex-col">
      <header className="shrink-0 -mx-8 -mt-6 border-b border-border bg-canvas px-8 pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Tooltip title="Back to templates">
              <Button
                variant="tertiary"
                size="sm"
                iconOnly
                aria-label="Back to templates"
                onClick={() => router.push(backHref)}
              >
                <ArrowBack sx={{ fontSize: 20 }} />
              </Button>
            </Tooltip>
            <Avatar name={template.name} kind="entity" size="sm" />
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h1 className="truncate text-h4 text-text-primary">{template.name}</h1>
              {row?.inUse && <StatusChip intent="success" label="In use" />}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {row && !row.inUse && (
              <Button variant="secondary" onClick={useThis}>
                Use this template
              </Button>
            )}
            <Button variant="secondary" disabled={!dirty || !row} onClick={save}>
              Save
            </Button>
            <Button disabled={!row || (!dirty && !!row?.inUse)} onClick={saveAndUse}>
              Save &amp; Use
            </Button>
          </div>
        </div>
      </header>

      {!row ? (
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
          {/* Reading the version from the store; the shell above is already in place, so this
              is a quiet inline placeholder rather than a full-page loading screen. */}
          <div className="mx-auto w-full max-w-3xl animate-pulse space-y-4 px-1 py-5" aria-hidden>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-16 rounded-lg bg-subtle" />
              <div className="h-16 rounded-lg bg-subtle" />
            </div>
            <div className="h-64 rounded-xl bg-subtle" />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* The composer. Only the preview canvas scrolls; the fields stay put. */}
          <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-1 py-5">
              <div className="shrink-0">
                <div className="mb-4 space-y-4">
                  <Input
                    label="Template name"
                    hint="Optional — helps tell your own drafts apart."
                    placeholder="e.g. Concise, Formal"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setDirty(true);
                    }}
                  />
                  <Input
                    label="Subject line"
                    required
                    placeholder="What the recipient sees before opening"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setDirty(true);
                    }}
                  />
                </div>

                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-body-sm-strong text-text-primary">Body</span>
                  <div className="flex shrink-0 items-center gap-4">
                    <button
                      type="button"
                      onClick={toggleSource}
                      aria-pressed={sourceMode}
                      className="inline-flex items-center gap-1 text-caption-strong text-text-link transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                    >
                      <CodeOutlined sx={{ fontSize: 16 }} />
                      {sourceMode ? 'Rich text' : 'Edit HTML'}
                    </button>
                    <button
                      type="button"
                      onClick={resetToDefault}
                      className="inline-flex items-center gap-1 text-caption-strong text-text-link transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                    >
                      <RestartAltOutlined sx={{ fontSize: 16 }} />
                      Reset to default
                    </button>
                    <button
                      type="button"
                      onClick={clearBody}
                      className="text-caption-strong text-text-link transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                    >
                      Clear body
                    </button>
                  </div>
                </div>
              </div>

              {/* Plain white editing surface. The branded envelope (greeting, logo, footer) is
                  applied when the email sends and shown in Preview; here the reader edits just the
                  body. Source mode swaps in a raw HTML box so custom styling can be pasted in. */}
              {sourceMode ? (
                <textarea
                  ref={sourceRef}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setDirty(true);
                  }}
                  spellCheck={false}
                  aria-label={`HTML source of ${row.name}`}
                  placeholder="<p>Paste or write HTML, with inline styles for custom looks…</p>"
                  className="ds-scroll min-h-0 flex-1 resize-none overflow-y-auto rounded-xl border border-border bg-surface p-4 font-mono text-caption leading-relaxed text-text-primary focus:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand-subtle"
                />
              ) : (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
                  {/* Docked toolbar at the top of the plain white canvas. */}
                  <div ref={toolbarSlot} className="shrink-0 border-b border-border bg-surface" />
                  <div className="ds-scroll min-h-0 flex-1 overflow-y-auto py-4 [&_.ds-editor-content]:min-h-[46vh] [&_.ds-editor-content]:px-6">
                    <BlockEditor
                      key={editorKey}
                      apiRef={editorApi}
                      toolbar
                      toolbarContainer={toolbarSlot}
                      tokens={tokens}
                      value={body}
                      onChange={(html) => {
                        setBody(html);
                        setDirty(true);
                      }}
                      ariaLabel={`Body of ${row.name}`}
                      placeholder="Write the message, or type “/” for headings, lists and placeholders"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  );
}
