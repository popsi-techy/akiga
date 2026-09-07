'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import DrawOutlined from '@mui/icons-material/DrawOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Button, Drawer, Input, Modal, useToast } from '@ds/components';
import { BaseEmailTemplatePreview } from '@/components/product/email-templates';
import {
  EMAIL_TEMPLATE_CATEGORY_LABELS,
  type EmailTemplate,
} from '@/data/email-templates';
import { createEmailType, listEmailTypes, listStarterTemplates } from '@/data/email-types';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { AtmosphericBackground } from '@/components/atmosphere/AtmosphericBackground';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { SettingsDenied, useAdminSettings } from '../SettingsChrome';

const SECTION = getSystemSettingsSection('email')!;

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: EmailTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
          <EmailOutlined sx={{ fontSize: 20 }} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-body-strong text-text-primary">{template.name}</h3>
          <p className="mt-0.5 text-caption text-text-tertiary">
            {EMAIL_TEMPLATE_CATEGORY_LABELS[template.category]}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 flex-1 text-body-sm text-text-secondary">
        {template.description}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={onUse}>
          Use template
        </Button>
        <Button size="sm" variant="tertiary" onClick={onPreview}>
          Preview
        </Button>
      </div>
    </div>
  );
}

/**
 * The catalog a new email type starts from.
 *
 * Same shape as the workflow template gallery — a still banner with search and a
 * start-from-scratch escape, a scrolling grid below it, and a name-and-description drawer
 * before anything is created. Two galleries that behave differently would be two things to
 * learn for one idea.
 *
 * What differs is the preview: a workflow previews as a flow diagram, an email as the
 * email. `BaseEmailTemplatePreview` renders the real thing, so what the reader approves in
 * the modal is what the recipient gets.
 */
export function EmailTypeTemplateGallery() {
  useSetBreadcrumbs([
    { label: 'System Settings', href: '/iga/configurations' },
    { label: SECTION.title, href: SECTION.href },
    { label: 'Templates' },
  ]);
  const allowed = useAdminSettings();
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = React.useState('');
  const [preview, setPreview] = React.useState<EmailTemplate | null>(null);
  const [draftOpen, setDraftOpen] = React.useState(false);
  const [draftSource, setDraftSource] = React.useState<EmailTemplate | 'scratch' | null>(null);
  const [draftName, setDraftName] = React.useState('');
  const [draftDescription, setDraftDescription] = React.useState('');

  if (!allowed) return <SettingsDenied />;

  const templates = listStarterTemplates();
  const q = query.trim().toLowerCase();
  const matches = q
    ? templates.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      )
    : templates;

  const openDraft = (source: EmailTemplate | 'scratch') => {
    setDraftSource(source);
    // The template's name is a starting point, not the answer — a tenant renames it to
    // whatever they call this email internally.
    setDraftName(source === 'scratch' ? nextScratchName() : source.name);
    setDraftDescription(source === 'scratch' ? '' : source.description);
    setDraftOpen(true);
  };

  const closeDraft = () => {
    setDraftOpen(false);
    setDraftSource(null);
    setDraftName('');
    setDraftDescription('');
  };

  const confirmDraft = () => {
    const name = draftName.trim();
    if (!name || draftSource === null) return;
    const row = createEmailType({
      name,
      description: draftDescription.trim(),
      sourceTemplateId: draftSource === 'scratch' ? null : draftSource.id,
    });
    closeDraft();
    toast.success(`“${row.name}” created as a draft`);
    router.push(`/iga/configurations/email/${row.id}`);
  };

  return (
    <>
      <div className="-mx-8 -mt-6 -mb-6 flex h-[calc(100%+3rem)] min-h-0 flex-col">
        <header className="relative shrink-0 overflow-hidden border-b border-border px-6 py-7">
          <AtmosphericBackground />
          <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center text-center">
            <h1 className="text-balance text-h3 text-text-primary">
              Start from a template, or write your own
            </h1>
            <div className="mt-3 w-full max-w-xl">
              <Input
                placeholder="Search email templates…"
                aria-label="Search email templates"
                size="md"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
              />
            </div>
            <p className="mt-2.5 text-body-sm text-text-secondary">
              Want a blank page?{' '}
              <button
                type="button"
                className="text-body-sm-medium text-text-link hover:underline"
                onClick={() => openDraft('scratch')}
              >
                Start from scratch
              </button>
            </p>
          </div>
        </header>

        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {matches.length === 0 ? (
            <p className="text-body-sm text-text-secondary">
              Nothing matches “{query.trim()}”. Clear the search, or start from scratch above.
            </p>
          ) : (
            <div className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onPreview={() => setPreview(t)}
                  onUse={() => openDraft(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ''}
        subtitle={preview?.description}
        icon={<EmailOutlined sx={{ fontSize: 22 }} />}
        width={780}
        height="90vh"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setPreview(null)}>
              Close
            </Button>
            <Button
              endIcon={<ArrowForwardOutlined />}
              onClick={() => {
                const t = preview;
                setPreview(null);
                if (t) openDraft(t);
              }}
            >
              Use this template
            </Button>
          </>
        }
      >
        {preview && <BaseEmailTemplatePreview content={preview.content} />}
      </Modal>

      <Drawer
        open={draftOpen}
        onClose={closeDraft}
        title="Name this email type"
        subtitle="You can change this later. It is created as a draft — nothing sends until you activate it."
        icon={<DrawOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        footer={
          <>
            <Button variant="secondary" onClick={closeDraft}>
              Cancel
            </Button>
            <Button disabled={draftName.trim() === ''} onClick={confirmDraft}>
              Create draft
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            required
            placeholder="e.g. Access request submitted"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="What this email is for, and when it goes out."
            helperText="Shown in the list so the next admin knows which email this is."
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
          />
        </div>
      </Drawer>
    </>
  );
}

/** A unique draft name, so two blank types made the same day do not read alike. */
function nextScratchName(): string {
  const n = listEmailTypes().filter((t) => /^New email type/i.test(t.name)).length + 1;
  return `New email type ${n}`;
}
