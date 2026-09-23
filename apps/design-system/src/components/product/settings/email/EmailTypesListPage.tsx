'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import LayersOutlined from '@mui/icons-material/LayersOutlined';
import {
  Avatar,
  BlockEditor,
  Button,
  Input,
  Modal,
  StatusChip,
} from '@ds/components';
import { BaseEmailTemplatePreview, BaseEmailTemplateShell } from '@/components/product/email-templates';
import {
  listEmailTemplates,
  getEmailTemplate,
  groupEmailTemplatesByCategory,
  EMAIL_TEMPLATE_CATEGORY_LABELS,
  type EmailTemplate,
} from '@/data/email-templates';
import { getInUseVariant, listVariants } from '@/data/email-types';
import { getSystemSettingsSection } from '@/data/system-settings-catalog';
import { SettingsDenied, useAdminSettings, useSettingsCrumbs } from '../SettingsChrome';

const SECTION = getSystemSettingsSection('email')!;

/** The greeting/sign-off/footer every email carries, from the `base` template. */
const BASE_CONTENT = getEmailTemplate('base')!.content;

/** Applied version name (null = Default) and version count for one email. */
type Meta = { applied?: string; count: number };

function EmailCard({
  template,
  meta,
  onPreview,
  onViewAll,
}: {
  template: EmailTemplate;
  meta: Meta;
  onPreview: () => void;
  onViewAll: () => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-border-strong hover:shadow-sm">
      <Avatar name={template.name} kind="entity" size="sm" />
      <h3 className="mt-2 truncate text-body-strong text-text-primary">{template.name}</h3>
      <p className="mt-0.5 line-clamp-2 text-body-sm text-text-secondary">{template.description}</p>

      {/* Footer like the automation template cards: a meta item, then a text Preview and a
          filled Add version. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
        <button
          type="button"
          onClick={onViewAll}
          aria-label={`View all ${meta.count} versions of ${template.name}`}
          className="flex min-w-0 items-center gap-1 rounded-sm text-caption text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <LayersOutlined sx={{ fontSize: 16 }} className="shrink-0 text-icon-subtle" aria-hidden />
          <span>
            {meta.count} {meta.count === 1 ? 'version' : 'versions'}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onPreview}
            className="whitespace-nowrap text-caption-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Preview active version
          </button>
          <button
            type="button"
            onClick={onViewAll}
            className="rounded-sm bg-surface-inverse px-2.5 py-1 text-caption-medium text-text-inverse transition-colors hover:bg-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
          >
            Manage versions
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Email — every notification the product sends, as a catalogue of cards.
 *
 * Grouped by area, each card a glance at one email: name, what it is for, the version applied
 * right now, and how many versions exist. The card acts in place — preview the active version,
 * jump to all versions, or add one — so the reader rarely has to leave the catalogue to see
 * what an email says or to start a new wording.
 */
export function EmailTypesListPage() {
  useSettingsCrumbs(SECTION.title);
  const allowed = useAdminSettings();
  const router = useRouter();

  const [query, setQuery] = React.useState('');
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  const base = React.useMemo(
    () => listEmailTemplates().filter((t) => t.category !== 'foundation'),
    [],
  );

  // Versions live in localStorage; read after mount and merge, so the server and first client
  // render agree that everything is on its Default with one version (no hydration flash).
  const [metaById, setMetaById] = React.useState<Record<string, Meta>>({});
  const refreshMeta = React.useCallback(() => {
    const next: Record<string, Meta> = {};
    for (const t of base) {
      const variants = listVariants(t.id);
      next[t.id] = { applied: variants.find((v) => v.inUse)?.name, count: variants.length + 1 };
    }
    setMetaById(next);
  }, [base]);
  React.useEffect(() => refreshMeta(), [refreshMeta]);

  if (!allowed) return <SettingsDenied />;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? base.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          EMAIL_TEMPLATE_CATEGORY_LABELS[t.category].toLowerCase().includes(q),
      )
    : base;
  const grouped = groupEmailTemplatesByCategory(filtered);
  const metaFor = (id: string): Meta => metaById[id] ?? { count: 1 };

  const viewAll = (t: EmailTemplate) => router.push(`/iga/configurations/email/${t.id}`);

  // Preview the active version of the previewed email.
  const previewTemplate = previewId ? getEmailTemplate(previewId) : null;
  const previewVariant = previewId ? getInUseVariant(previewId) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">{SECTION.title}</h1>
        <p className="mt-1 text-body text-text-secondary">
          Every email the product sends, and the version applied to each. Preview the active
          version, browse all versions, or add a new one.
        </p>
      </div>

      <div className="w-full max-w-sm shrink-0">
        <Input
          size="sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emails"
          aria-label="Search emails"
          startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
        />
      </div>

      <div className="ds-scroll mt-4 min-h-0 flex-1 overflow-y-auto pr-0.5">
        {grouped.length === 0 ? (
          <p className="py-10 text-center text-body-sm text-text-secondary">
            No emails match “{query.trim()}”.
          </p>
        ) : (
          grouped.map((group, index) => (
            <section
              key={group.category}
              aria-labelledby={`email-group-${group.category}`}
              className={index > 0 ? 'mt-6' : undefined}
            >
              <h2
                id={`email-group-${group.category}`}
                className="mb-2 text-overline uppercase text-text-tertiary"
              >
                {group.label}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.templates.map((template) => (
                  <EmailCard
                    key={template.id}
                    template={template}
                    meta={metaFor(template.id)}
                    onPreview={() => setPreviewId(template.id)}
                    onViewAll={() => viewAll(template)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Preview the active version — the actual email, at the real width. */}
      <Modal
        open={previewTemplate !== null}
        onClose={() => setPreviewId(null)}
        title={previewTemplate?.name ?? 'Email'}
        subtitle={
          previewTemplate ? (
            <span className="inline-flex items-center gap-2">
              Active version
              <StatusChip
                intent={previewVariant ? 'success' : 'neutral'}
                dot={Boolean(previewVariant)}
                label={previewVariant?.name ?? 'Default'}
              />
            </span>
          ) : undefined
        }
        width={640}
        footer={
          previewTemplate && (
            <Button variant="secondary" onClick={() => viewAll(previewTemplate)}>
              View all versions
            </Button>
          )
        }
      >
        {previewTemplate && (
          <div className="overflow-hidden rounded-xl border border-border">
            {previewVariant ? (
              <BaseEmailTemplateShell
                greetingName={BASE_CONTENT.greetingName}
                greetingLine={BASE_CONTENT.greetingLine}
                signOff={BASE_CONTENT.signOff}
                teamName={BASE_CONTENT.teamName}
                ariaLabel={`${previewVariant.name} preview`}
              >
                <BlockEditor
                  value={previewVariant.bodyHtml}
                  onChange={() => {}}
                  editable={false}
                  ariaLabel={`Body of ${previewVariant.name}`}
                />
              </BaseEmailTemplateShell>
            ) : (
              <BaseEmailTemplatePreview content={previewTemplate.content} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
