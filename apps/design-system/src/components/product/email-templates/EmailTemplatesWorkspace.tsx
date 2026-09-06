'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Input } from '@ds/components';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { BaseEmailTemplatePreview } from '@/components/product/email-templates';
import { listEmailTemplates, groupEmailTemplatesByCategory, EMAIL_TEMPLATE_CATEGORY_LABELS, type EmailTemplate } from '@/data/email-templates';

function TemplateCard({
  template,
  active,
  onSelect,
}: {
  template: EmailTemplate;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      className={[
        'flex w-full rounded-lg px-3 py-3 text-left transition-colors',
        active
          ? 'border border-brand bg-surface shadow-sm'
          : 'border border-border bg-surface hover:border-border-strong hover:bg-surface-hover',
        'outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={[
            'grid h-9 w-9 shrink-0 place-items-center rounded-md',
            active ? 'bg-brand-subtle text-brand' : 'bg-subtle text-icon',
          ].join(' ')}
        >
          <EmailOutlined sx={{ fontSize: 20 }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body-sm-strong text-text-primary">{template.name}</span>
          <span className="mt-0.5 line-clamp-2 text-caption leading-4 text-text-secondary">{template.description}</span>
        </span>
      </div>
    </button>
  );
}

export function EmailTemplatesWorkspace({ initialSelectedId }: { initialSelectedId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState('');
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [subjects, setSubjects] = React.useState<Record<string, string>>({});

  useSetBreadcrumbs([{ label: 'Email Templates' }]);

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setTemplates(listEmailTemplates());
      setLoaded(true);
    }, 120);
    return () => window.clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    setSubjects((prev) => {
      const next = { ...prev };
      for (const t of templates) {
        if (next[t.id] === undefined) next[t.id] = t.subjectLine;
      }
      return next;
    });
  }, [loaded, templates]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => {
      const categoryLabel = EMAIL_TEMPLATE_CATEGORY_LABELS[t.category].toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.kind.toLowerCase().includes(q) ||
        categoryLabel.includes(q)
      );
    });
  }, [templates, query]);

  const grouped = React.useMemo(() => groupEmailTemplatesByCategory(filtered), [filtered]);

  const requestedId = initialSelectedId ?? searchParams.get('template') ?? undefined;
  const selectedId = React.useMemo(() => {
    if (requestedId && templates.some((t) => t.id === requestedId)) return requestedId;
    return templates[0]?.id ?? null;
  }, [requestedId, templates]);

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const selectTemplate = React.useCallback(
    (id: string) => {
      router.replace(`/iga/email-templates?template=${id}`, { scroll: false });
    },
    [router],
  );

  React.useEffect(() => {
    if (!selectedId || requestedId === selectedId) return;
    router.replace(`/iga/email-templates?template=${selectedId}`, { scroll: false });
  }, [requestedId, router, selectedId]);

  return (
    <div className="-mx-8 -mt-6 -mb-6 flex h-[calc(100%+var(--ds-space-12))] min-h-0 flex-col">
      <div className="flex min-h-0 flex-1">
        <aside
          className="flex w-[280px] shrink-0 flex-col border-r border-border bg-surface"
          aria-label="Email templates"
        >
          <div className="shrink-0 space-y-3 border-b border-border px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-body-sm-strong text-text-primary">Templates</span>
              <span className="text-caption tabular-nums text-text-tertiary">{templates.length} total</span>
            </div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              startAdornment={<SearchOutlined sx={{ fontSize: 18, color: 'var(--ds-color-icon-subtle)' }} />}
              aria-label="Search templates"
            />
          </div>
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto p-3">
            {!loaded ? null : filtered.length === 0 ? (
              <p className="px-1 py-6 text-center text-body-sm text-text-secondary">
                {query.trim() ? 'No templates match your search.' : 'No email templates yet.'}
              </p>
            ) : (
              grouped.map((group, groupIndex) => (
                <section
                  key={group.category}
                  aria-labelledby={`email-template-category-${group.category}`}
                  className={groupIndex > 0 ? 'mt-4' : undefined}
                >
                  <h3
                    id={`email-template-category-${group.category}`}
                    className="sticky top-0 z-[1] bg-surface px-1 pb-2 pt-1 text-overline uppercase text-text-tertiary"
                  >
                    {group.label}
                  </h3>
                  <div className="space-y-2">
                    {group.templates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        active={template.id === selectedId}
                        onSelect={() => selectTemplate(template.id)}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
          {selected ? (
            <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-h5 text-text-primary">{selected.name}</h2>
                <div className="mt-3 max-w-xl">
                  <Input
                    label="Subject line"
                    value={subjects[selected.id] ?? selected.subjectLine}
                    onChange={(e) =>
                      setSubjects((prev) => ({ ...prev, [selected.id]: e.target.value }))
                    }
                    placeholder="Enter the subject recipients will see in their inbox"
                  />
                </div>
              </div>
              <BaseEmailTemplatePreview content={selected.content} />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-subtle text-icon">
                <EmailOutlined sx={{ fontSize: 22 }} />
              </span>
              <p className="text-body-sm-strong text-text-primary">Select a template</p>
              <p className="max-w-xs text-body-sm text-text-secondary">
                Choose a template from the list to preview how it will look in recipients&apos; inboxes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
