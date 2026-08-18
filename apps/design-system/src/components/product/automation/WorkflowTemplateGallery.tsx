'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import DrawOutlined from '@mui/icons-material/DrawOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import { Button, Input, useToast } from '@ds/components';
import { createWorkflow } from '@/data/workflows';
import {
  WORKFLOW_TEMPLATES,
  templateAsWorkflow,
  templateStepCount,
  type WorkflowTemplate,
} from '@/data/workflow-templates';
import type { WorkflowEventType } from '@/data/automation-types';
import { isBlockComplete } from '@/lib/workflow-tree';
import { EVENT_ICONS } from './workflow-visuals';
import { WorkflowFlowPreview } from './WorkflowFlowPreview';

const EVENT_ORDER: WorkflowEventType[] = ['joiner', 'mover', 'leaver'];
const EVENT_LABEL: Record<WorkflowEventType, string> = {
  joiner: 'Joiner',
  mover: 'Mover',
  leaver: 'Leaver',
};

/** `null` is the scratch option, which lives in the same list as the templates. */
type Selection = string | null;

/**
 * The workflow template gallery.
 *
 * ## Why selection is the preview
 *
 * Eleven templates is exactly the number where a card grid stops working: the
 * reader cannot choose without looking inside, and looking inside costs a
 * navigation each time — eleven round trips to answer one question. So the list
 * and the preview sit side by side and **selecting a template previews it**. There
 * is no Preview button, because previewing is not a separate act; the affordance
 * disappears and browsing costs an arrow key.
 *
 * ## Why the preview is the real renderer
 *
 * `WorkflowFlowPreview` is the same component the workflow detail page uses, fed a
 * template rendered as an `AutomationWorkflow`. A template *is* a node tree, so
 * what the gallery shows and what the builder opens cannot diverge. A hand-drawn
 * illustration of the flow would be prettier for a week and wrong forever after
 * the first template edit.
 *
 * ## Why "before you switch this on" is not hidden
 *
 * Every template declares what an administrator must still confirm — connections,
 * naming standards, licence SKUs, retention windows. Putting that list *beside the
 * Use button rather than after it* is the difference between a template and a
 * surprise, and it is what makes the one-click commit safe to offer. A template
 * that claimed to be complete would be discovered as incomplete at the worst
 * moment, which is halfway through someone's first day.
 */
export function WorkflowTemplateGallery() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = React.useState('');
  // The first template is selected on arrival: an empty right-hand pane asking the
  // reader to pick something before it shows anything is a wasted first screen.
  const [selected, setSelected] = React.useState<Selection>(WORKFLOW_TEMPLATES[0].id);

  const q = query.trim().toLowerCase();
  const matches = React.useMemo(
    () =>
      WORKFLOW_TEMPLATES.filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.audience.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.systems.some((s) => s.toLowerCase().includes(q)),
      ),
    [q],
  );

  // Keep the selection valid while filtering, so the preview never shows a
  // template the reader can no longer see in the list.
  React.useEffect(() => {
    if (selected !== null && !matches.some((t) => t.id === selected)) {
      setSelected(matches[0]?.id ?? null);
    }
  }, [matches, selected]);

  const template = selected ? WORKFLOW_TEMPLATES.find((t) => t.id === selected) ?? null : null;

  const use = (t: WorkflowTemplate) => {
    const wf = createWorkflow({
      name: t.name,
      description: t.summary,
      eventType: t.event,
      root: t.root,
    });
    toast.success(`“${t.name}” created from template`);
    router.push(`/iga/automation/workflows/${wf.id}/builder`);
  };

  const startBlank = () => {
    const wf = createWorkflow({});
    router.push(`/iga/automation/workflows/${wf.id}/builder`);
  };

  /** ↑/↓ moves through the list, including the scratch row at the end. */
  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const order: Selection[] = [...matches.map((t) => t.id), null];
    const i = order.indexOf(selected);
    const next = order[Math.min(order.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    setSelected(next);
  };

  return (
    <div className="flex h-full min-h-0 gap-6">
      {/* ---- the list ---- */}
      <div className="flex w-[340px] shrink-0 flex-col">
        <div className="shrink-0">
          <Input
            placeholder="Search templates"
            aria-label="Search templates"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
        </div>

        <div
          className="ds-scroll mt-3 min-h-0 flex-1 overflow-y-auto pr-1"
          role="listbox"
          aria-label="Workflow templates"
          tabIndex={0}
          onKeyDown={onListKeyDown}
        >
          {EVENT_ORDER.map((event) => {
            const group = matches.filter((t) => t.event === event);
            if (group.length === 0) return null;
            const Icon = EVENT_ICONS[event];
            return (
              <div key={event} className="mb-5 last:mb-0">
                <div className="mb-2 flex items-center gap-2">
                  <Icon sx={{ fontSize: 15 }} />
                  <span className="text-overline text-text-tertiary">
                    {EVENT_LABEL[event]} · {group.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {group.map((t) => (
                    <li key={t.id}>
                      <TemplateRow
                        template={t}
                        selected={selected === t.id}
                        onSelect={() => setSelected(t.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {matches.length === 0 && (
            <p className="px-1 py-3 text-body-sm text-text-tertiary">
              No template matches “{query.trim()}”. Clear the search, or start from scratch.
            </p>
          )}

          {/* In the same list, not off to one side: "none of these" is one of the
              options, and making it a separate surface implies it is a lesser one. */}
          <button
            type="button"
            role="option"
            aria-selected={selected === null}
            onClick={() => setSelected(null)}
            className={[
              'mt-2 flex w-full items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
              selected === null
                ? 'border-brand bg-brand-subtle'
                : 'border-border-strong hover:bg-surface-hover',
            ].join(' ')}
          >
            <DrawOutlined sx={{ fontSize: 18 }} className="shrink-0 text-icon" />
            <span className="min-w-0">
              <span className="block text-body-sm-strong text-text-primary">Start from scratch</span>
              <span className="block text-caption text-text-secondary">An empty canvas</span>
            </span>
          </button>
        </div>
      </div>

      {/* ---- the preview ---- */}
      <div className="ds-scroll min-w-0 flex-1 overflow-y-auto">
        {template ? (
          <TemplatePreview template={template} onUse={() => use(template)} />
        ) : (
          <ScratchPreview onStart={startBlank} />
        )}
      </div>
    </div>
  );
}

function TemplateRow({
  template,
  selected,
  onSelect,
}: {
  template: WorkflowTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={[
        'w-full rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        selected ? 'border-brand bg-brand-subtle' : 'border-border hover:bg-surface-hover',
      ].join(' ')}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-body-sm-strong text-text-primary">{template.name}</span>
        <span className="shrink-0 text-caption tabular-nums text-text-tertiary">
          {templateStepCount(template)} steps
        </span>
      </div>
      <span className="mt-0.5 block text-caption text-text-secondary">
        {template.audience} · {template.systems.length} systems
      </span>
    </button>
  );
}

/**
 * The preview pane.
 *
 * Reading order is the order the questions arrive in: what is this, when does it
 * run, what does it touch, what does it actually do, and what will I still have to
 * do myself. The Use button repeats at the top and the bottom, because the flow can
 * be long enough to scroll and a reader who has just finished reading the caveats
 * should not have to scroll back to act on them.
 */
function TemplatePreview({ template, onUse }: { template: WorkflowTemplate; onUse: () => void }) {
  const workflow = React.useMemo(() => templateAsWorkflow(template), [template]);
  const Icon = EVENT_ICONS[template.event];

  /**
   * How many steps arrive ready, and how many are waiting on the administrator.
   *
   * The flow below shows some steps reading "Not configured", which without this
   * count looks like a broken template rather than a deliberate blank. Stating the
   * split up front turns those into the expected shape of the work: this template
   * hands you six steps, four of them done.
   */
  const total = template.root.length;
  const ready = template.root.filter(isBlockComplete).length;

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon sx={{ fontSize: 15 }} />
            <span className="text-overline text-text-tertiary">
              {EVENT_LABEL[template.event]} · {template.audience}
            </span>
          </div>
          <h2 className="mt-1 text-h3 text-text-primary">{template.name}</h2>
          <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">{template.summary}</p>
        </div>
        <Button endIcon={<ArrowForwardOutlined />} onClick={onUse}>
          Use this template
        </Button>
      </div>

      <p className="mt-3 text-body-sm text-text-secondary">
        <span className="text-body-sm-strong text-text-primary">
          {total} steps · {ready} ready
        </span>
        {ready < total && (
          <> · {total - ready} waiting on details only you can fill in — listed below the flow.</>
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {template.systems.map((s) => (
          <span
            key={s}
            className="rounded-pill border border-border bg-surface px-2.5 py-0.5 text-caption-medium text-text-secondary"
          >
            {s}
          </span>
        ))}
      </div>

      <section className="mt-6">
        <h3 className="text-overline text-text-tertiary">The flow</h3>
        {/* The real renderer, fed the real tree — see the note on this file. */}
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-subtle">
          <WorkflowFlowPreview workflow={workflow} />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h3 className="text-body-strong text-text-primary">Before you switch this on</h3>
        <p className="mt-0.5 text-body-sm text-text-secondary">
          The template brings sensible defaults. These are the parts only you can confirm — you will land
          in the builder with everything editable.
        </p>
        <ul className="mt-3 space-y-2">
          {template.needsAttention.map((n) => (
            <li key={n} className="flex gap-2.5">
              <TaskAltOutlined sx={{ fontSize: 16 }} className="mt-0.5 shrink-0 text-icon-subtle" />
              <span className="text-body-sm text-text-primary">{n}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button endIcon={<ArrowForwardOutlined />} onClick={onUse}>
            Use this template
          </Button>
          <span className="text-caption text-text-tertiary">
            Creates a draft. Nothing runs until you activate it.
          </span>
        </div>
      </section>
    </div>
  );
}

function ScratchPreview({ onStart }: { onStart: () => void }) {
  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-overline text-text-tertiary">No template</span>
          <h2 className="mt-1 text-h3 text-text-primary">Start from scratch</h2>
          <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">
            An empty canvas. Choose the lifecycle event first — it decides which operations the palette
            offers, since a joiner never revokes access and a leaver never provisions an account.
          </p>
        </div>
        <Button endIcon={<ArrowForwardOutlined />} onClick={onStart}>
          Open empty builder
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border-strong bg-subtle px-6 py-14 text-center">
        <div className="text-h5 text-text-primary">Nothing to preview yet</div>
        <p className="mx-auto mt-1 max-w-sm text-body-sm text-text-secondary">
          Pick a template on the left to see exactly what it builds, or open the empty builder and
          assemble your own.
        </p>
      </div>

      <p className="mt-4 text-caption text-text-tertiary">
        A template is only a starting point — everything it creates is editable, and you can strip it back
        to nothing. Starting from one is usually faster than starting from zero, even when you keep little
        of it.
      </p>
    </div>
  );
}
