'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import {
  BlockEditor,
  Button,
  Dialog,
  Input,
  Menu,
  StatusChip,
  useToast,
} from '@ds/components';
import { BaseEmailTemplatePreview, BaseEmailTemplateShell } from '@/components/product/email-templates';
import {
  createVariant,
  deleteEmailType,
  listVariants,
  setInUseVariant,
  type EmailType,
} from '@/data/email-types';
import { getEmailTemplate, EMAIL_TEMPLATE_CATEGORY_LABELS } from '@/data/email-templates';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { formatDateTime } from '@/lib/datetime';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { SettingsDenied, useAdminSettings } from '../SettingsChrome';

const SECTION = getSystemSettingsSection('email')!;

/** The greeting/sign-off/footer every email carries, from the `base` template. */
const BASE_CONTENT = getEmailTemplate('base')!.content;

/** 'default' selects the shipped wording; any other value is a custom version's id. */
const DEFAULT_ID = 'default';

/** One entry in the left rail — icon, name, note, a dot when it is the one that sends. */
function RailRow({
  icon,
  title,
  subtitle,
  inUse,
  selected,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  inUse: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={[
        'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-brand bg-surface shadow-sm'
          : 'border-border bg-surface hover:border-border-strong hover:bg-surface-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
      ].join(' ')}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-subtle text-icon [&>svg]:h-[18px] [&>svg]:w-[18px]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm-strong text-text-primary">{title}</span>
        <span className="mt-0.5 block truncate text-caption text-text-secondary">{subtitle}</span>
      </span>
      {inUse && (
        <span
          className="mt-1 h-1.5 w-1.5 shrink-0 rounded-pill"
          style={{ background: 'var(--ds-color-status-success-fg)' }}
          aria-label="In use"
          title="In use"
        />
      )}
    </button>
  );
}

/**
 * One email, its versions on the left, the selected one previewed on the right.
 *
 * A master–detail rather than a flat list: the shipped **Default** and every version the
 * tenant has written stack in the rail, the one in use marked with a dot, and selecting any
 * of them renders it — the actual email, at the real width — beside the list. Choosing which
 * one sends, editing a custom, or writing another all happen from the preview's toolbar, so
 * the reader is always looking at what they are deciding about.
 */
export function EmailTypeVariantsPage({ id }: { id: string }) {
  const allowed = useAdminSettings();
  const router = useRouter();
  const toast = useToast();

  const template = getEmailTemplate(id);
  const backHref = SECTION.href;

  const [variants, setVariants] = React.useState<EmailType[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>(DEFAULT_ID);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<EmailType | null>(null);

  const refresh = React.useCallback(() => setVariants(listVariants(id)), [id]);

  // Read after mount (localStorage), and open on whichever version currently sends.
  React.useEffect(() => {
    const list = listVariants(id);
    setVariants(list);
    const inUse = list.find((v) => v.inUse);
    setSelectedId(inUse ? inUse.id : DEFAULT_ID);
  }, [id]);

  useSetBreadcrumbs([
    { label: 'System Settings', href: '/iga/configurations' },
    { label: SECTION.title, href: SECTION.href },
    { label: template?.name ?? 'Email' },
  ]);

  if (!allowed) return <SettingsDenied />;

  if (!template) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-h4 text-text-primary">Email not found</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          It is not one of the emails this product sends. Everything else is still in the list.
        </p>
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => router.push(backHref)}>
            Back to Email
          </Button>
        </div>
      </div>
    );
  }

  const inUseCustom = variants.find((v) => v.inUse) ?? null;
  const defaultInUse = !inUseCustom;
  const selected = selectedId === DEFAULT_ID ? null : variants.find((v) => v.id === selectedId) ?? null;
  // A selection that pointed at a now-deleted version falls back to the default.
  const showingDefault = selectedId === DEFAULT_ID || selected === null;

  const useDefault = () => {
    setInUseVariant(id, null);
    refresh();
    toast.success(`“${template.name}” now sends the default.`);
  };
  const useVariant = (v: EmailType) => {
    setInUseVariant(id, v.id);
    refresh();
    toast.success(`“${template.name}” now sends “${v.name}”.`);
  };
  const create = () => {
    const v = createVariant(id, newName);
    setCreateOpen(false);
    setNewName('');
    router.push(`/iga/configurations/email/${id}/${v.id}`);
  };

  return (
    <div className="-mx-8 -mt-6 -mb-6 flex h-[calc(100%+2*var(--ds-space-6))] min-h-0 flex-col">
      {/* Identity + the one always-available action. */}
      <header className="shrink-0 border-b border-border bg-canvas px-8 pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-h4 text-text-primary">{template.name}</h1>
              <StatusChip intent="neutral" label={EMAIL_TEMPLATE_CATEGORY_LABELS[template.category]} />
            </div>
            <p className="mt-px truncate text-body-sm text-text-secondary">{template.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" onClick={() => router.push(backHref)}>
              Back
            </Button>
            <Button startIcon={<AddOutlined />} onClick={() => setCreateOpen(true)}>
              Create new version
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left rail — the versions, the one that sends marked with a dot. */}
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-surface" aria-label="Versions">
          <div className="flex shrink-0 items-baseline justify-between border-b border-border px-4 py-3">
            <span className="text-body-sm-strong text-text-primary">Versions</span>
            <span className="tabular-nums text-caption text-text-tertiary">{variants.length + 1}</span>
          </div>
          <div className="ds-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            <RailRow
              icon={<VerifiedOutlined />}
              title="Default"
              subtitle="Shipped wording"
              inUse={defaultInUse}
              selected={showingDefault}
              onSelect={() => setSelectedId(DEFAULT_ID)}
            />
            {variants.map((v) => (
              <RailRow
                key={v.id}
                icon={<DescriptionOutlined />}
                title={v.name}
                subtitle={`Edited ${formatDateTime(v.updatedAt)}`}
                inUse={v.inUse}
                selected={selected?.id === v.id}
                onSelect={() => setSelectedId(v.id)}
              />
            ))}
          </div>
        </aside>

        {/* Right pane — the selected version, previewed at the real width. */}
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto bg-subtle">
          <div className="mx-auto w-full max-w-2xl px-6 py-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-h5 text-text-primary">
                    {showingDefault ? 'Default' : selected!.name}
                  </h2>
                  {(showingDefault ? defaultInUse : selected!.inUse) && (
                    <StatusChip intent="success" label="In use" />
                  )}
                </div>
                <p className="mt-0.5 text-caption text-text-secondary">
                  {showingDefault
                    ? 'Provided by miniOrange — the shipped wording'
                    : `Edited ${formatDateTime(selected!.updatedAt)}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {showingDefault ? (
                  !defaultInUse && (
                    <Button size="sm" variant="secondary" onClick={useDefault}>
                      Use default
                    </Button>
                  )
                ) : (
                  <>
                    {!selected!.inUse && (
                      <Button size="sm" variant="secondary" onClick={() => useVariant(selected!)}>
                        Use this version
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="tertiary"
                      onClick={() => router.push(`/iga/configurations/email/${id}/${selected!.id}`)}
                    >
                      Edit
                    </Button>
                    <Menu
                      items={[
                        { label: 'Delete', danger: true, onClick: () => setDeleteTarget(selected!) },
                      ]}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-caption-strong uppercase tracking-wide text-text-tertiary">Subject</p>
              <p className="mt-1 text-body-sm text-text-primary">
                {showingDefault ? template.subjectLine : selected!.subjectLine || '—'}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              {showingDefault ? (
                <BaseEmailTemplatePreview content={template.content} />
              ) : (
                <BaseEmailTemplateShell
                  greetingName={BASE_CONTENT.greetingName}
                  greetingLine={BASE_CONTENT.greetingLine}
                  signOff={BASE_CONTENT.signOff}
                  teamName={BASE_CONTENT.teamName}
                  ariaLabel={`${selected!.name} preview`}
                >
                  <BlockEditor
                    value={selected!.bodyHtml}
                    onChange={() => {}}
                    editable={false}
                    ariaLabel={`Body of ${selected!.name}`}
                  />
                </BaseEmailTemplateShell>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New version"
        confirmLabel="Create & edit"
        onConfirm={create}
      >
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-text-secondary">
            Name this version so you can tell it apart from the others. It starts from the default wording.
          </p>
          <Input
            label="Version name"
            placeholder="e.g. Concise, Formal, Post-merger"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        tone="danger"
        title={`Delete “${deleteTarget?.name ?? ''}”?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          const name = deleteTarget.name;
          const wasInUse = deleteTarget.inUse;
          deleteEmailType(deleteTarget.id);
          setDeleteTarget(null);
          setSelectedId(DEFAULT_ID);
          refresh();
          toast.success(
            wasInUse ? `“${name}” deleted — this email is back to the default.` : `“${name}” deleted.`,
          );
        }}
      >
        <p className="text-body-sm text-text-secondary">
          The wording is removed for good. {deleteTarget?.inUse ? 'This email will send the default again.' : ''}
        </p>
      </Dialog>
    </div>
  );
}
