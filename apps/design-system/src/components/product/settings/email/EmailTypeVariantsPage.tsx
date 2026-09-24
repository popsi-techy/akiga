'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import PublicOutlined from '@mui/icons-material/PublicOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import {
  Avatar,
  BlockEditor,
  Button,
  Dialog,
  Input,
  Menu,
  Modal,
  useToast,
} from '@ds/components';
import { BaseEmailTemplatePreview, BaseEmailTemplateShell } from '@/components/product/email-templates';
import {
  createVariant,
  deleteEmailType,
  listVariants,
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

const DEFAULT_ID = 'default';

/** A version as the cards render it — the shipped Default, or a tenant-written variant. */
type Version = {
  id: string;
  name: string;
  /** The subject line — shown on the card as the content differentiator. */
  subject: string;
  inUse: boolean;
  isDefault: boolean;
  /** The custom row, for edit/delete/preview. Absent on the Default. */
  variant?: EmailType;
};

/** One version card — name, note, and its actions. */
function VersionCard({
  version,
  featured,
  onPreview,
  onEdit,
  onUse,
  onDelete,
}: {
  version: Version;
  featured?: boolean;
  onPreview: () => void;
  onEdit?: () => void;
  onUse?: () => void;
  onDelete?: () => void;
}) {
  // Edit and Delete live in the overflow. On the Default there is nothing to delete and Edit
  // forks a new version, so only Edit appears.
  const menuItems = [
    ...(onEdit ? [{ label: 'Edit', onClick: onEdit }] : []),
    ...(onDelete ? [{ label: 'Delete', danger: true, onClick: onDelete }] : []),
  ];
  // Without a Use action (the in-use card) Preview is the card's primary button.
  const previewIsPrimary = !onUse;
  const primaryClass =
    'rounded-sm bg-surface-inverse px-2.5 py-1 text-caption-medium text-text-inverse transition-colors hover:bg-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle';
  const textClass =
    'text-caption-medium text-text-secondary transition-colors hover:text-text-primary';
  return (
    <article
      className={[
        'flex h-full flex-col rounded-xl border bg-surface p-4 transition-all duration-200',
        featured ? 'border-brand shadow-sm' : 'border-border hover:border-border-strong hover:shadow-sm',
      ].join(' ')}
    >
      <Avatar name={version.name} kind="entity" size="sm" />
      <span className="mt-2 block truncate text-body-sm-strong text-text-primary">{version.name}</span>
      <p className="mt-0.5 truncate text-caption text-text-secondary">
        {version.subject || 'No subject'}
      </p>

      {/* Footer: a Global/Custom tag on the left (like the automation template cards), the
          primary Use/Preview and the overflow grouped on the right. */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="flex min-w-0 items-center gap-1 text-caption text-text-secondary">
          {version.isDefault ? (
            <PublicOutlined sx={{ fontSize: 16 }} className="shrink-0 text-icon-subtle" aria-hidden />
          ) : (
            <PersonOutlineOutlined sx={{ fontSize: 16 }} className="shrink-0 text-icon-subtle" aria-hidden />
          )}
          {version.isDefault ? 'Global' : 'Custom'}
        </span>
        <div className="flex shrink-0 items-center gap-3">
          {!previewIsPrimary && (
            <button type="button" onClick={onPreview} className={textClass}>
              Preview
            </button>
          )}
          {onUse ? (
            <button type="button" onClick={onUse} className={primaryClass}>
              {version.isDefault ? 'Use default' : 'Use this template'}
            </button>
          ) : (
            <button type="button" onClick={onPreview} className={primaryClass}>
              Preview
            </button>
          )}
          {menuItems.length > 0 && <Menu items={menuItems} />}
        </div>
      </div>
    </article>
  );
}

/**
 * One email's versions, as cards — the one in use on top, the rest below.
 *
 * The card grid answers "which wording is live, and what else could be" at a glance: the active
 * version is featured at the top, every other version (the shipped Default plus any the tenant
 * wrote) follows in the grid. Previewing opens over the grid; composing opens the full editor.
 * The breadcrumb names the email, so the page needs no heading of its own.
 */
export function EmailTypeVariantsPage({ id }: { id: string }) {
  const allowed = useAdminSettings();
  const router = useRouter();
  const toast = useToast();

  const template = getEmailTemplate(id);
  const backHref = SECTION.href;

  const [variants, setVariants] = React.useState<EmailType[]>([]);
  const [query, setQuery] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<EmailType | null>(null);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => setVariants(listVariants(id)), [id]);
  const editorHref = (variantId: string) => `/iga/configurations/email/${id}/${variantId}`;
  React.useEffect(() => {
    setVariants(listVariants(id));
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

  const defaultVersion: Version = {
    id: DEFAULT_ID,
    name: 'Default',
    subject: template.subjectLine,
    inUse: defaultInUse,
    isDefault: true,
  };
  const variantVersions: Version[] = variants.map((v) => ({
    id: v.id,
    name: v.name,
    subject: v.subjectLine,
    inUse: v.inUse,
    isDefault: false,
    variant: v,
  }));
  const allVersions = [defaultVersion, ...variantVersions];

  const q = query.trim().toLowerCase();
  const matches = (v: Version) => !q || v.name.toLowerCase().includes(q);
  const active = allVersions.find((v) => v.inUse)!;
  const others = allVersions.filter((v) => !v.inUse && matches(v));
  const activeMatches = matches(active);
  // When the empty state shows its own New template button, the toolbar one is redundant.
  const emptyStateCreate = others.length === 0 && !q;

  // ---- actions ---------------------------------------------------------
  const useVersion = (v: Version) => {
    setInUseVariant(id, v.isDefault ? null : v.id);
    refresh();
    toast.success(
      v.isDefault
        ? `“${template.name}” now sends the default.`
        : `“${template.name}” now sends “${v.name}”.`,
    );
  };

  // Editing and creating open the full editor page — not a popup.
  const openEdit = (row: EmailType) => router.push(editorHref(row.id));
  const create = () => {
    // A new version starts blank — a white canvas to write from scratch, not the Default's copy.
    const v = createVariant(id, `Template ${variants.length + 1}`);
    updateEmailType(v.id, { bodyHtml: '<p></p>' });
    router.push(editorHref(v.id));
  };
  // Editing the Default forks a new version seeded from its wording, so it can be tweaked.
  const forkDefault = () => {
    const v = createVariant(id, `Template ${variants.length + 1}`);
    router.push(editorHref(v.id));
  };

  // The version being previewed, resolved from its id.
  const previewVersion =
    previewId === null ? null : allVersions.find((v) => v.id === previewId) ?? null;

  const renderPreview = (v: Version) =>
    v.isDefault || !v.variant ? (
      <BaseEmailTemplatePreview content={template.content} />
    ) : (
      <BaseEmailTemplateShell
        greetingName={BASE_CONTENT.greetingName}
        greetingLine={BASE_CONTENT.greetingLine}
        signOff={BASE_CONTENT.signOff}
        teamName={BASE_CONTENT.teamName}
        ariaLabel={`${v.name} preview`}
      >
        <BlockEditor value={v.variant.bodyHtml} onChange={() => {}} editable={false} ariaLabel={`Body of ${v.name}`} />
      </BaseEmailTemplateShell>
    );

  return (
    <div className="flex h-full flex-col">
      {/* Search + create. */}
      <div className="mb-5 flex shrink-0 flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            size="sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            aria-label="Search templates"
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>
        {!emptyStateCreate && (
          <Button variant="primary" size="sm" startIcon={<AddOutlined />} onClick={create} className="ml-auto">
            New template
          </Button>
        )}
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto pr-0.5">
        {/* Active version, featured on top. */}
        {activeMatches && (
          <section aria-label="Active template">
            <h2 className="mb-2 text-overline uppercase text-text-tertiary">Active template</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <VersionCard
                version={active}
                featured
                onPreview={() => setPreviewId(active.id)}
                onEdit={active.variant ? () => openEdit(active.variant!) : () => forkDefault()}
                onDelete={active.variant ? () => setDeleteTarget(active.variant!) : undefined}
              />
            </div>
          </section>
        )}

        {/* Every other version. */}
        <section aria-label="Other templates" className="mt-6">
          <h2 className="mb-2 text-overline uppercase text-text-tertiary">Other templates</h2>
          {others.length === 0 ? (
            q ? (
              <p className="rounded-xl border border-dashed border-border py-8 text-center text-body-sm text-text-secondary">
                No other templates match “{query.trim()}”.
              </p>
            ) : (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-subtle text-icon">
                  <DescriptionOutlined sx={{ fontSize: 22 }} />
                </span>
                <p className="mt-3 text-body-sm-strong text-text-primary">No other templates yet</p>
                <p className="mt-1 max-w-sm text-body-sm text-text-secondary">
                  Create a template to offer alternative wording. The Default keeps sending until you
                  switch to it.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  startIcon={<AddOutlined />}
                  onClick={create}
                  className="mt-4"
                >
                  New template
                </Button>
              </div>
            )
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((v) => (
                <VersionCard
                  key={v.id}
                  version={v}
                  onUse={() => useVersion(v)}
                  onPreview={() => setPreviewId(v.id)}
                  onEdit={v.variant ? () => openEdit(v.variant!) : () => forkDefault()}
                  onDelete={v.variant ? () => setDeleteTarget(v.variant!) : undefined}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Preview — the version rendered at the real width. */}
      <Modal
        open={previewVersion !== null}
        onClose={() => setPreviewId(null)}
        title={previewVersion?.name ?? 'Preview'}
        subtitle={
          previewVersion ? (previewVersion.inUse ? 'In use — this is what sends' : 'Preview') : undefined
        }
        width={640}
        footer={
          previewVersion &&
          !previewVersion.inUse && (
            <Button
              variant="secondary"
              onClick={() => {
                useVersion(previewVersion);
                setPreviewId(null);
              }}
            >
              {previewVersion.isDefault ? 'Use default' : 'Use this template'}
            </Button>
          )
        }
      >
        {previewVersion && (
          <div className="overflow-hidden rounded-xl border border-border">{renderPreview(previewVersion)}</div>
        )}
      </Modal>

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
