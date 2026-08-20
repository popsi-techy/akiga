'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForward';
import DrawOutlined from '@mui/icons-material/DrawOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import StorageOutlined from '@mui/icons-material/StorageOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import MailOutline from '@mui/icons-material/MailOutline';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import HubOutlined from '@mui/icons-material/HubOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { Button, Drawer, Input, SegmentedControl, StatusChip, useToast } from '@ds/components';
import { createWorkflow, listWorkflows } from '@/data/workflows';
import {
  WORKFLOW_TEMPLATES,
  templateAsWorkflow,
  type WorkflowTemplate,
} from '@/data/workflow-templates';
import type { WorkflowEventType } from '@/data/automation-types';
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A unique draft name so two empties created the same day do not collide in the list. */
function scratchDraft() {
  const n = listWorkflows().filter((w) => /^New workflow/i.test(w.name)).length + 1;
  const d = new Date();
  return {
    name: `New workflow ${n} · ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
    description: 'An empty canvas. Add a lifecycle event, then the steps this process needs.',
  };
}

/**
 * The workflow template gallery.
 *
 * A landing/choice page: the pick is the protagonist. The list is a quiet index;
 * the flow on the right is what you are choosing. Selecting previews — there is
 * no Preview button. One Use action, in brand, in the identity band.
 *
 * `WorkflowFlowPreview` is the same renderer the builder uses, so what you saw
 * is what you get.
 */
export function WorkflowTemplateGallery() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = React.useState('');
  const [lifecycle, setLifecycle] = React.useState<WorkflowEventType>('joiner');
  const [selected, setSelected] = React.useState<Selection>(null);
  const [draftOpen, setDraftOpen] = React.useState(false);
  const [draftSource, setDraftSource] = React.useState<WorkflowTemplate | 'scratch' | null>(null);
  const [draftName, setDraftName] = React.useState('');
  const [draftDescription, setDraftDescription] = React.useState('');

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
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
  const visible = React.useMemo(
    () => (searching ? matches : matches.filter((t) => t.event === lifecycle)),
    [searching, matches, lifecycle],
  );

  React.useEffect(() => {
    if (selected !== null && !visible.some((t) => t.id === selected)) {
      setSelected(visible[0]?.id ?? null);
    }
  }, [visible, selected]);

  const template = selected ? WORKFLOW_TEMPLATES.find((t) => t.id === selected) ?? null : null;

  const pickLifecycle = (event: WorkflowEventType) => {
    setLifecycle(event);
    const first = WORKFLOW_TEMPLATES.find((t) => t.event === event);
    if (first) setSelected(first.id);
  };

  const openDraft = (source: WorkflowTemplate | 'scratch') => {
    if (source === 'scratch') {
      const draft = scratchDraft();
      setDraftName(draft.name);
      setDraftDescription(draft.description);
    } else {
      setDraftName(source.name);
      setDraftDescription(source.summary);
    }
    setDraftSource(source);
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
    const wf =
      draftSource === 'scratch'
        ? createWorkflow({ name, description: draftDescription.trim() })
        : createWorkflow({
            name,
            description: draftDescription.trim(),
            eventType: draftSource.event,
            root: draftSource.root,
          });
    const fromTemplate = draftSource !== 'scratch';
    closeDraft();
    toast.success(fromTemplate ? `“${wf.name}” created from template` : `“${wf.name}” created`);
    router.push(`/iga/automation/workflows/${wf.id}/builder?from=templates`);
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const order: Selection[] = [null, ...visible.map((t) => t.id)];
    const i = order.indexOf(selected);
    const next = order[Math.min(order.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    setSelected(next);
  };

  return (
    <>
    <div className="flex h-full min-h-0 flex-1">
      <div className="flex w-[320px] shrink-0 flex-col border-r border-border bg-surface">
        <div className="shrink-0 space-y-3 px-3 pb-3 pt-4">
          <h1 className="text-h4 text-text-primary">Explore templates</h1>
          <Input
            placeholder="Search"
            aria-label="Search templates"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
          />
          <button
            type="button"
            aria-pressed={selected === null}
            onClick={() => setSelected(null)}
            className={[
              'flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
              selected === null
                ? 'border-solid border-brand bg-surface text-text-primary'
                : 'border-dashed border-border hover:bg-surface-hover',
            ].join(' ')}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-subtle text-icon">
              <DrawOutlined sx={{ fontSize: 18 }} />
            </span>
            <span className="min-w-0">
              <span className="block text-body-sm-strong text-text-primary">From scratch</span>
              <span className="block text-caption text-text-secondary">Empty canvas</span>
            </span>
          </button>
          {!searching && (
            <SegmentedControl
              size="sm"
              fullWidth
              ariaLabel="Lifecycle"
              value={lifecycle}
              onChange={pickLifecycle}
              options={EVENT_ORDER.map((event) => ({
                value: event,
                label: EVENT_LABEL[event],
                count: WORKFLOW_TEMPLATES.filter((t) => t.event === event).length,
              }))}
            />
          )}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="ds-scroll ds-scroll-gutter h-full overflow-y-auto pb-4"
            role="listbox"
            aria-label="Workflow templates"
            tabIndex={0}
            onKeyDown={onListKeyDown}
          >
            {visible.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {visible.map((t) => (
                  <li key={t.id}>
                    <TemplateRow
                      template={t}
                      selected={selected === t.id}
                      showEvent={searching}
                      onSelect={() => {
                        setSelected(t.id);
                        setLifecycle(t.event);
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 py-3 text-body-sm text-text-secondary">
                Nothing matches “{query.trim()}”. Start from scratch, or clear the search.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        {template ? (
          <TemplatePreview template={template} onUse={() => openDraft(template)} />
        ) : (
          <ScratchPreview onStart={() => openDraft('scratch')} />
        )}
      </div>
    </div>
      <Drawer
        open={draftOpen}
        onClose={closeDraft}
        title="Name this workflow"
        subtitle="You can change this later. Nothing is created until you open the builder."
        icon={<DrawOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        footer={
          <>
            <Button variant="secondary" onClick={closeDraft}>
              Cancel
            </Button>
            <Button
              endIcon={<ArrowForwardOutlined />}
              onClick={confirmDraft}
              disabled={!draftName.trim()}
            >
              {draftSource === 'scratch' ? 'Open builder' : 'Use this template'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Name"
            size="sm"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmDraft()}
          />
          <Input
            label="Description"
            size="sm"
            multiline
            minRows={3}
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
          />
        </div>
      </Drawer>
    </>
  );
}

function TemplateRow({
  template,
  selected,
  showEvent,
  onSelect,
}: {
  template: WorkflowTemplate;
  selected: boolean;
  showEvent?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={[
        'flex w-full flex-col rounded-lg border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle',
        selected ? 'border-brand bg-surface' : 'border-border hover:border-border-strong',
      ].join(' ')}
    >
      <span className="relative block rounded-md bg-subtle px-3 pb-4 pt-6">
        <span className="absolute right-2 top-2">
          <StatusChip intent="info" label={template.audience} dot={false} />
        </span>
        <TemplateIllustration template={template} />
      </span>
      <span className="block px-2 py-2.5">
        {showEvent && (
          <span className="mb-0.5 block text-overline uppercase text-text-tertiary">
            {EVENT_LABEL[template.event]}
          </span>
        )}
        <span className="block text-body-sm-strong text-text-primary">{template.name}</span>
        <span className="mt-0.5 block text-caption text-text-secondary">{template.summary}</span>
      </span>
    </button>
  );
}

/**
 * Connector strip: source system → lifecycle event → destination system.
 * Same shape as a product-card hero — circles on a dashed line — so the rail
 * scans as a gallery of processes, not a list of paragraphs.
 */
function systemGlyph(name: string): SvgIconComponent {
  const n = name.toLowerCase();
  if (n.includes('peoplesoft') || n.includes('hrms') || n.includes('sis')) return StorageOutlined;
  if (n.includes('entra') || n.includes('azure')) return BadgeOutlined;
  if (n.includes('office') || n.includes('365')) return MailOutline;
  if (n.includes('active directory')) return AccountTreeOutlined;
  if (n.includes('blackboard') || n.includes('lms')) return MenuBookOutlined;
  return HubOutlined;
}

function Node({
  icon: Icon,
  size,
  emphasis,
  title,
}: {
  icon: React.ComponentType<{ sx?: object }>;
  size: 'sm' | 'md';
  emphasis?: boolean;
  title: string;
}) {
  return (
    <span
      title={title}
      className={[
        'grid shrink-0 place-items-center rounded-pill border bg-surface shadow-xs',
        size === 'md' ? 'h-9 w-9' : 'h-7 w-7',
        emphasis ? 'border-brand-subtle text-text-primary' : 'border-border text-icon',
      ].join(' ')}
    >
      <Icon sx={{ fontSize: size === 'md' ? 18 : 14 }} />
    </span>
  );
}

function TemplateIllustration({ template }: { template: WorkflowTemplate }) {
  const EventIcon = EVENT_ICONS[template.event];
  const source = template.systems[0];
  const dest = template.systems.find((s) => s !== source) ?? template.systems[1];
  const showDest = Boolean(dest && dest !== source);

  return (
    <span className="mx-auto flex h-11 w-max items-center" aria-hidden>
      {source && <Node icon={systemGlyph(source)} size="sm" title={source} />}
      {source && <span className="w-5 shrink-0 border-t border-dashed border-border" />}
      <Node icon={EventIcon} size="md" emphasis title={EVENT_LABEL[template.event]} />
      {showDest && <span className="w-5 shrink-0 border-t border-dashed border-border" />}
      {showDest && dest && <Node icon={systemGlyph(dest)} size="sm" title={dest} />}
    </span>
  );
}

/**
 * Identity band + the flow. The flow is the evidence; everything else recedes.
 */
function TemplatePreview({ template, onUse }: { template: WorkflowTemplate; onUse: () => void }) {
  const workflow = React.useMemo(() => templateAsWorkflow(template), [template]);
  const EventIcon = EVENT_ICONS[template.event];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h4 text-text-primary">{template.name}</h2>
              <StatusChip intent="neutral" label={EVENT_LABEL[template.event]} icon={<EventIcon />} />
            </div>
            <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">{template.summary}</p>
          </div>
          <Button endIcon={<ArrowForwardOutlined />} onClick={onUse}>
            Use this template
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6">
        <div className="h-full min-h-0 overflow-hidden rounded-xl border border-border">
          <WorkflowFlowPreview workflow={workflow} />
        </div>
      </div>
    </div>
  );
}

function ScratchPreview({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-h4 text-text-primary">From scratch</h2>
            <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">
              An empty canvas. Pick a lifecycle event in the builder, then add the steps this process needs.
            </p>
          </div>
          <Button endIcon={<ArrowForwardOutlined />} onClick={onStart}>
            Open builder
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6">
        <div className="grid h-full min-h-0 place-items-center overflow-hidden rounded-xl border border-border bg-subtle px-6">
          <p className="max-w-sm text-center text-body-sm text-text-secondary">
            Pick a template to see the flow it builds, or open the builder and assemble your own.
          </p>
        </div>
      </div>
    </div>
  );
}
