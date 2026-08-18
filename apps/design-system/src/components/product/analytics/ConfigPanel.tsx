'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackOutlined from '@mui/icons-material/ArrowBack';
import ArrowUpwardOutlined from '@mui/icons-material/ArrowUpward';
import ArrowDownwardOutlined from '@mui/icons-material/ArrowDownward';
import CloseOutlined from '@mui/icons-material/Close';
import WarningAmberOutlined from '@mui/icons-material/WarningAmber';
import { Button, Input, Select, Switch, useToast } from '@ds/components';
import {
  FILTER_FIELDS,
  SCOPE_TYPE_LABEL,
  filterFieldById,
  type Report,
  type ScopeType,
} from '@/data/governance-analytics';
import {
  plotCatalogue,
  scopeValues,
  sectionCatalogue,
  type ScopeContext,
} from '@/data/governance-analytics-derive';
import { templateById } from '@/data/governance-analytics';

type View = 'config' | 'add-plot' | 'add-section';

/**
 * The configuration panel.
 *
 * ## Why it docks left
 *
 * The report is the thing being configured, so covering it with the configuration
 * is the one layout that cannot work: the reader changes a filter and has to close
 * the panel to see what it did. Docked left, the report reflows into the remaining
 * width and stays visible for every change. The right edge is kept for row detail,
 * which is *about the report's content* — two jobs, two edges.
 *
 * ## Why it edits a clone
 *
 * Every control writes to a deep clone held here; Cancel throws it away and only
 * Save commits. Configuration is a set of related choices — a scope, then filters
 * that only make sense against it, then sections that only make sense against
 * those — and applying each keystroke live would regenerate the report against
 * half-made decisions, then leave no way back to the version that worked.
 *
 * ## Section order is the mental model
 *
 * Report → Scope → Filters → Plots → Sections. What it is, what it is about, which
 * subset, what to notice, what the evidence is. Reordering these would break the
 * one thing that makes a long panel navigable.
 */
export function ConfigPanel({
  report,
  context,
  blockers,
  onCancel,
  onApply,
  onSave,
}: {
  report: Report;
  context: ScopeContext;
  blockers: string[];
  onCancel: () => void;
  /** Live-preview escape hatch — currently unused, kept for a future "apply". */
  onApply?: (next: Report) => void;
  onSave: (next: Report) => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = React.useState<Report>(() => structuredClone(report));
  const [view, setView] = React.useState<View>('config');
  const [query, setQuery] = React.useState('');
  const [openConfigFor, setOpenConfigFor] = React.useState<string | null>(null);

  const patch = (next: Partial<Report>) => setDraft((d) => ({ ...d, ...next }));

  /**
   * Changing the scope renames an unsaved report.
   *
   * "Finance Governance Overview" scoped to Legal is mislabelled evidence, and the
   * name is the first thing anyone reads. Only while unsaved: once someone has
   * named a report, renaming it underneath them is worse than a stale default.
   */
  const setScopeValue = (value: string) => {
    const t = templateById(draft.templateId);
    const untouched = draft.status !== 'ready' && t !== null;
    setDraft((d) => ({
      ...d,
      scope: { ...d.scope, value },
      name: untouched && value ? t!.nameFor(value) : d.name,
      description: untouched && value ? t!.descFor(value) : d.description,
    }));
  };

  const setScopeType = (type: ScopeType) =>
    // The value cannot survive a type change — "Finance" is not an application.
    setDraft((d) => ({ ...d, scope: { type, value: '' } }));

  if (view !== 'config') {
    return (
      <PanelShell>
        <PickerView
          view={view}
          draft={draft}
          context={context}
          query={query}
          setQuery={setQuery}
          onBack={() => {
            setView('config');
            setQuery('');
          }}
          onAdd={(id) => {
            if (view === 'add-plot') {
              if (draft.plots.some((p) => p.id === id)) return toast.error('That plot is already in this report.');
              setDraft((d) => ({
                ...d,
                plots: [
                  ...d.plots,
                  { id, enabled: true, order: d.plots.length, configuration: { chartType: null, hidden: [], limit: 'all' } },
                ],
              }));
              toast.success('Plot added');
            } else {
              if (draft.sections.some((s) => s.id === id))
                return toast.error('That section is already in this report.');
              setDraft((d) => ({
                ...d,
                sections: [
                  ...d.sections,
                  { id, enabled: true, order: d.sections.length, configuration: { rowLimit: 'all', showChart: true } },
                ],
              }));
              toast.success('Section added');
            }
          }}
        />
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {blockers.length > 0 && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-status-warning-border bg-status-warning-subtle p-3"
          >
            <div className="flex gap-2">
              <WarningAmberOutlined sx={{ fontSize: 18 }} className="mt-0.5 shrink-0 text-status-warning-fg" />
              <div className="min-w-0">
                <div className="text-body-sm-strong text-status-warning-fg">This report cannot be saved yet</div>
                <ul className="mt-1 space-y-0.5">
                  {blockers.map((b) => (
                    <li key={b} className="text-caption text-status-warning-fg">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <Group title="Report">
          <Input
            label="Name"
            size="sm"
            value={draft.name}
            placeholder="Untitled report"
            onChange={(e) => patch({ name: e.target.value })}
          />
          <Input
            label="Description"
            size="sm"
            multiline
            minRows={2}
            hint="Read by whoever receives the export — say what question it answers."
            value={draft.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </Group>

        <Group title="Scope" hint="What the report is about. Not a filter — this is the subject.">
          <Select
            label="Analyze by"
            value={draft.scope.type}
            onChange={(v) => setScopeType(v as ScopeType)}
            options={(Object.keys(SCOPE_TYPE_LABEL) as ScopeType[]).map((t) => ({
              value: t,
              label: SCOPE_TYPE_LABEL[t],
            }))}
          />
          <ScopeCombobox
            type={draft.scope.type}
            value={draft.scope.value}
            onChange={setScopeValue}
          />
        </Group>

        <Group title="Filters" hint="Which subset of that scope. Optional.">
          {draft.filters.length === 0 && (
            <p className="text-caption text-text-tertiary">No filters — the report covers the whole scope.</p>
          )}
          {draft.filters.map((f) => {
            const field = filterFieldById(f.field);
            return (
              <div key={f.field} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Select
                    label={field?.label ?? f.field}
                    value={f.value}
                    onChange={(v) =>
                      patch({
                        filters: draft.filters.map((x) => (x.field === f.field ? { ...x, value: v } : x)),
                      })
                    }
                    options={(field?.values ?? ['All']).map((v) => ({ value: v, label: v }))}
                  />
                </div>
                <IconAction
                  label={`Remove ${field?.label ?? f.field} filter`}
                  onClick={() => patch({ filters: draft.filters.filter((x) => x.field !== f.field) })}
                >
                  <CloseOutlined sx={{ fontSize: 16 }} />
                </IconAction>
              </div>
            );
          })}
          <AddFilterSelect
            existing={draft.filters.map((f) => f.field)}
            onAdd={(field) => {
              const def = filterFieldById(field);
              patch({ filters: [...draft.filters, { field, value: def?.values[1] ?? 'All' }] });
            }}
            onDuplicate={() => toast.error('That filter is already applied.')}
          />
        </Group>

        <Group title="Plots" hint="What to notice. Rendered as one band above the evidence.">
          <ItemList
            items={draft.plots.map((p) => ({ id: p.id, enabled: p.enabled, label: plotTitle(p.id, context) }))}
            openConfigFor={openConfigFor}
            onToggleConfig={(id) => setOpenConfigFor((cur) => (cur === id ? null : id))}
            onToggle={(id, on) =>
              patch({ plots: draft.plots.map((p) => (p.id === id ? { ...p, enabled: on } : p)) })
            }
            onMove={(id, dir) => patch({ plots: move(draft.plots, id, dir) })}
            onRemove={(id) => patch({ plots: reindex(draft.plots.filter((p) => p.id !== id)) })}
            renderConfig={(id) => {
              const ref = draft.plots.find((p) => p.id === id)!;
              return (
                <div className="space-y-2">
                  <Select
                    label="Chart type"
                    value={ref.configuration.chartType ?? 'auto'}
                    onChange={(v) =>
                      patch({
                        plots: draft.plots.map((p) =>
                          p.id === id
                            ? {
                                ...p,
                                configuration: {
                                  ...p.configuration,
                                  chartType: v === 'auto' ? null : (v as 'donut' | 'bar'),
                                },
                              }
                            : p,
                        ),
                      })
                    }
                    options={[
                      { value: 'auto', label: "The plot's own shape" },
                      { value: 'donut', label: 'Donut' },
                      { value: 'bar', label: 'Bar' },
                    ]}
                  />
                  <Select
                    label="Bars shown"
                    value={String(ref.configuration.limit)}
                    onChange={(v) =>
                      patch({
                        plots: draft.plots.map((p) =>
                          p.id === id
                            ? {
                                ...p,
                                configuration: {
                                  ...p.configuration,
                                  limit: v === 'all' ? 'all' : Number(v),
                                },
                              }
                            : p,
                        ),
                      })
                    }
                    options={[
                      { value: 'all', label: 'All' },
                      { value: '3', label: 'Top 3' },
                      { value: '5', label: 'Top 5' },
                    ]}
                  />
                </div>
              );
            }}
          />
          <AddButton label="Add plot" onClick={() => setView('add-plot')} />
        </Group>

        <Group title="Sections" hint="The evidence. Tables, in the order they appear.">
          <ItemList
            items={draft.sections.map((s) => ({
              id: s.id,
              enabled: s.enabled,
              label: sectionTitle(s.id, context),
              // Governance Summary is the posture read, and a report without it is
              // a set of tables with nothing to frame them.
              locked: s.id === 'governance-summary',
            }))}
            openConfigFor={openConfigFor}
            onToggleConfig={(id) => setOpenConfigFor((cur) => (cur === id ? null : id))}
            onToggle={(id, on) =>
              patch({ sections: draft.sections.map((s) => (s.id === id ? { ...s, enabled: on } : s)) })
            }
            onMove={(id, dir) => patch({ sections: move(draft.sections, id, dir) })}
            onRemove={(id) => patch({ sections: reindex(draft.sections.filter((s) => s.id !== id)) })}
            renderConfig={(id) => {
              const ref = draft.sections.find((s) => s.id === id)!;
              return (
                <div className="space-y-2">
                  <Select
                    label="Rows shown"
                    value={String(ref.configuration.rowLimit)}
                    onChange={(v) =>
                      patch({
                        sections: draft.sections.map((s) =>
                          s.id === id
                            ? {
                                ...s,
                                configuration: {
                                  ...s.configuration,
                                  rowLimit: v === 'all' ? 'all' : Number(v),
                                },
                              }
                            : s,
                        ),
                      })
                    }
                    options={[
                      { value: 'all', label: 'All' },
                      { value: '3', label: '3' },
                      { value: '5', label: '5' },
                      { value: '10', label: '10' },
                    ]}
                  />
                  <label className="flex items-center justify-between gap-3">
                    <span className="text-body-sm text-text-secondary">Show chart</span>
                    <Switch
                      checked={ref.configuration.showChart}
                      onChange={(_, on) =>
                        patch({
                          sections: draft.sections.map((s) =>
                            s.id === id ? { ...s, configuration: { ...s.configuration, showChart: on } } : s,
                          ),
                        })
                      }
                    />
                  </label>
                </div>
              );
            }}
          />
          <AddButton label="Add section" onClick={() => setView('add-section')} />
        </Group>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(draft)}>Save report</Button>
      </div>
    </PanelShell>
  );
}

/**
 * The dock itself: fixed 400px, full height, its own scroller.
 *
 * Fixed rather than flexible because the report next to it must not reflow as the
 * panel's contents change width — a report that jumps sideways when a filter is
 * added is a report the reader has to re-find.
 */
function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <aside
      role="region"
      aria-label="Report configuration"
      className="ds-print-hide flex h-full w-[400px] shrink-0 flex-col border-r border-border bg-surface"
    >
      {children}
    </aside>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="text-overline text-text-tertiary">{title}</h3>
      {hint && <p className="mt-1 text-caption text-text-tertiary">{hint}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
    >
      {children}
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="tertiary" size="sm" startIcon={<AddIcon />} onClick={onClick}>
      {label}
    </Button>
  );
}

/**
 * A searchable combobox for the scope value.
 *
 * A `Select` would do for eight departments and fall over at eighty applications.
 * The values come from the data (`scopeValues`), so this can never offer a
 * department that does not exist.
 */
function ScopeCombobox({
  type,
  value,
  onChange,
}: {
  type: ScopeType;
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const all = React.useMemo(() => scopeValues(type), [type]);
  const shown = all.filter((v) => v.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="relative">
      <Input
        label={SCOPE_TYPE_LABEL[type]}
        size="sm"
        required
        placeholder={`Search ${SCOPE_TYPE_LABEL[type].toLowerCase()}s`}
        value={open ? query : value}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(e) => setQuery(e.target.value)}
      />
      {open && (
        <ul
          role="listbox"
          aria-label={SCOPE_TYPE_LABEL[type]}
          className="ds-scroll absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-md"
        >
          {shown.length === 0 && <li className="px-3 py-2 text-caption text-text-tertiary">No matches</li>}
          {shown.map((v) => (
            <li key={v}>
              <button
                type="button"
                role="option"
                aria-selected={v === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(v);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-body-sm transition-colors hover:bg-surface-hover ${
                  v === value ? 'text-text-brand' : 'text-text-primary'
                }`}
              >
                {v}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "Add filter" as a select that empties itself — the catalogue is never all shown at once. */
function AddFilterSelect({
  existing,
  onAdd,
  onDuplicate,
}: {
  existing: string[];
  onAdd: (field: string) => void;
  onDuplicate: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const cats = [...new Set(FILTER_FIELDS.map((f) => f.category))];

  if (!open) return <AddButton label="Add filter" onClick={() => setOpen(true)} />;

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-body-sm-strong text-text-primary">Add a filter</span>
        <IconAction label="Close filter picker" onClick={() => setOpen(false)}>
          <CloseOutlined sx={{ fontSize: 16 }} />
        </IconAction>
      </div>
      <div className="space-y-3">
        {cats.map((cat) => (
          <div key={cat}>
            <div className="text-overline text-text-tertiary">{cat}</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {FILTER_FIELDS.filter((f) => f.category === cat).map((f) => {
                const added = existing.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={added}
                    onClick={() => {
                      if (added) return onDuplicate();
                      onAdd(f.id);
                      setOpen(false);
                    }}
                    className="rounded-pill border border-border px-2.5 py-1 text-caption-medium text-text-primary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                  >
                    {f.label}
                    {added && ' · added'}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One row per plot/section: enable, reorder, configure, remove. */
function ItemList({
  items,
  openConfigFor,
  onToggleConfig,
  onToggle,
  onMove,
  onRemove,
  renderConfig,
}: {
  items: { id: string; enabled: boolean; label: string; locked?: boolean }[];
  openConfigFor: string | null;
  onToggleConfig: (id: string) => void;
  onToggle: (id: string, on: boolean) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  renderConfig: (id: string) => React.ReactNode;
}) {
  if (items.length === 0) {
    return <p className="text-caption text-text-tertiary">Nothing added yet.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={it.id} className="rounded-lg border border-border">
          <div className="flex items-center gap-1 px-2 py-1.5">
            <Switch
              checked={it.enabled}
              disabled={it.locked}
              onChange={(_, on) => onToggle(it.id, on)}
              aria-label={`Include ${it.label}`}
            />
            <span className="min-w-0 flex-1 truncate text-body-sm text-text-primary" title={it.label}>
              {it.label}
            </span>
            {/* Move up/down is the only reordering mechanism. Drag-and-drop in a
                400px panel needs a scroll-while-dragging affordance that costs
                more than it returns for a list of six. */}
            <IconAction label={`Move ${it.label} up`} disabled={i === 0} onClick={() => onMove(it.id, -1)}>
              <ArrowUpwardOutlined sx={{ fontSize: 15 }} />
            </IconAction>
            <IconAction
              label={`Move ${it.label} down`}
              disabled={i === items.length - 1}
              onClick={() => onMove(it.id, 1)}
            >
              <ArrowDownwardOutlined sx={{ fontSize: 15 }} />
            </IconAction>
            <button
              type="button"
              onClick={() => onToggleConfig(it.id)}
              className="rounded-sm px-1.5 text-caption-strong text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              {openConfigFor === it.id ? 'Done' : 'Configure'}
            </button>
            <IconAction label={`Remove ${it.label}`} disabled={it.locked} onClick={() => onRemove(it.id)}>
              <CloseOutlined sx={{ fontSize: 16 }} />
            </IconAction>
          </div>
          {openConfigFor === it.id && (
            <div className="border-t border-border px-3 py-3">{renderConfig(it.id)}</div>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Add plot / Add section — a second-level view *inside* the panel, not an overlay.
 *
 * An overlay on top of a docked panel would cover the panel that is deliberately
 * not covering the report, which is the same mistake one level down. The Back
 * control is the only way out, so the reader always knows where they are.
 */
function PickerView({
  view,
  draft,
  context,
  query,
  setQuery,
  onBack,
  onAdd,
}: {
  view: View;
  draft: Report;
  context: ScopeContext;
  query: string;
  setQuery: (v: string) => void;
  onBack: () => void;
  onAdd: (id: string) => void;
}) {
  const isPlot = view === 'add-plot';
  const groups = isPlot
    ? plotCatalogue(context).map((g) => ({
        category: g.category,
        items: g.plots.map((p) => ({ id: p.id, title: p.title, description: p.description })),
      }))
    : sectionCatalogue(context).map((g) => ({
        category: g.category,
        items: g.sections.map((s) => ({ id: s.id, title: s.title, description: s.description })),
      }));

  const taken = new Set((isPlot ? draft.plots : draft.sections).map((x) => x.id));
  const q = query.trim().toLowerCase();
  const shown = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !q || i.title.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <div className="shrink-0 border-b border-border px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-sm text-caption-strong text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <ArrowBackOutlined sx={{ fontSize: 15 }} />
          Back to configuration
        </button>
        <h3 className="mt-2 text-h5 text-text-primary">{isPlot ? 'Add a plot' : 'Add a section'}</h3>
        <p className="mt-0.5 text-caption text-text-secondary">
          {isPlot
            ? 'Plots answer “what should I notice”. They respect this report’s scope and filters.'
            : 'Sections are the evidence — tables backed by the governance data.'}
        </p>
        <div className="mt-3">
          <Input
            size="sm"
            placeholder={isPlot ? 'Search plots' : 'Search sections'}
            aria-label={isPlot ? 'Search plots' : 'Search sections'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {shown.length === 0 && <p className="text-body-sm text-text-tertiary">No matches.</p>}
        {shown.map((g) => (
          <div key={g.category} className="mb-5 last:mb-0">
            <div className="text-overline text-text-tertiary">{g.category}</div>
            <ul className="mt-2 space-y-1.5">
              {g.items.map((i) => {
                const added = taken.has(i.id);
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => onAdd(i.id)}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                    >
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-body-sm-strong text-text-primary">
                          {i.title}
                        </span>
                        {added && <span className="shrink-0 text-caption text-text-tertiary">Added</span>}
                      </div>
                      <p className="mt-0.5 text-caption leading-4 text-text-secondary">{i.description}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

// ---- helpers -----------------------------------------------------------

/** Titles come from the library so the panel and the report cannot disagree. */
function plotTitle(id: string, c: ScopeContext): string {
  for (const g of plotCatalogue(c)) {
    const hit = g.plots.find((p) => p.id === id);
    if (hit) return hit.title;
  }
  return id;
}

function sectionTitle(id: string, c: ScopeContext): string {
  for (const g of sectionCatalogue(c)) {
    const hit = g.sections.find((s) => s.id === id);
    if (hit) return hit.title;
  }
  return id;
}

/** Reordering keeps `order` contiguous, so assembly never sees a gap. */
function move<T extends { id: string; order: number }>(items: T[], id: string, dir: -1 | 1): T[] {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const i = sorted.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= sorted.length) return items;
  [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  return reindex(sorted);
}

function reindex<T extends { order: number }>(items: T[]): T[] {
  return items.map((x, i) => ({ ...x, order: i }));
}
