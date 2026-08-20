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
import { Button, Drawer, Input, Modal, NavList, StatusChip, useToast } from '@ds/components';
import { createWorkflow, listWorkflows } from '@/data/workflows';
import {
  WORKFLOW_TEMPLATES,
  templateAsWorkflow,
  type WorkflowTemplate,
} from '@/data/workflow-templates';
import type { WorkflowEventType } from '@/data/automation-types';
import { EVENT_ICONS, EVENT_TYPES } from './workflow-visuals';
import { WorkflowFlowPreview } from './WorkflowFlowPreview';

const EVENT_LABEL: Record<WorkflowEventType, string> = {
  joiner: 'Joiner',
  mover: 'Mover',
  leaver: 'Leaver',
};

/** One-line support under the section name — short enough to sit beside it. */
const EVENT_LINE: Record<WorkflowEventType, string> = {
  joiner: 'When a new identity joins',
  mover: 'When role, department, or location changes',
  leaver: 'When an identity leaves',
};

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
 * The workflow template catalog.
 *
 * Same frame as the application-type catalog: a lifecycle rail that jumps, a
 * dashed "from scratch" option in that rail, then a grid of template cards.
 * Clicking a card opens a modal so the flow can be read before it is named
 * and opened in the builder.
 */
export function WorkflowTemplateGallery() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState<WorkflowEventType>('joiner');
  const [preview, setPreview] = React.useState<WorkflowTemplate | null>(null);
  const [draftOpen, setDraftOpen] = React.useState(false);
  const [draftSource, setDraftSource] = React.useState<WorkflowTemplate | 'scratch' | null>(null);
  const [draftName, setDraftName] = React.useState('');
  const [draftDescription, setDraftDescription] = React.useState('');

  const scroller = React.useRef<HTMLDivElement>(null);
  const sections = React.useRef(new Map<WorkflowEventType, HTMLElement>());

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
  const byEvent = (event: WorkflowEventType) => matches.filter((t) => t.event === event);
  const visibleEvents = EVENT_TYPES.filter((event) => byEvent(event).length > 0);

  const jumpTo = (event: WorkflowEventType) => {
    setActive(event);
    const el = sections.current.get(event);
    const box = scroller.current;
    if (!el || !box) return;
    box.scrollTo({ top: el.offsetTop - box.offsetTop, behavior: 'smooth' });
  };

  /**
   * Whichever section header has passed the top most recently — except at the
   * very bottom, where the last section is selected outright. Without that
   * clamp the trailing sections are unreachable whenever the catalog only just
   * overflows.
   */
  const onScroll = () => {
    const box = scroller.current;
    if (!box) return;
    const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 2;
    let current = visibleEvents[0];
    if (atBottom) {
      current = visibleEvents[visibleEvents.length - 1];
    } else {
      for (const event of visibleEvents) {
        const el = sections.current.get(event);
        if (el && el.offsetTop - box.offsetTop <= box.scrollTop + 24) current = event;
      }
    }
    if (current && current !== active) setActive(current);
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

  const usePreview = () => {
    if (!preview) return;
    const template = preview;
    setPreview(null);
    openDraft(template);
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

  const PreviewIcon = preview ? EVENT_ICONS[preview.event] : DrawOutlined;

  return (
    <>
      <div className="flex h-full min-h-0">
        <aside className="flex w-[264px] shrink-0 flex-col gap-5 border-r border-border bg-surface px-4 py-5">
          <h1 className="px-1 text-h4 text-text-primary">Explore templates</h1>
          <div className="flex flex-col gap-3">
            <ScratchCard onSelect={() => openDraft('scratch')} />
            <NavList
              ariaLabel="Lifecycle"
              value={active}
              onChange={(id) => jumpTo(id as WorkflowEventType)}
              items={EVENT_TYPES.map((event) => ({
                id: event,
                label: EVENT_LABEL[event],
                count: byEvent(event).length,
              }))}
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 px-6 pt-5">
            <div className="w-full max-w-md">
              <Input
                placeholder="Search by name, audience, or system…"
                aria-label="Search templates"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
              />
            </div>
          </div>

          <div ref={scroller} onScroll={onScroll} className="ds-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
            {matches.length === 0 && q ? (
              <p className="text-body-sm text-text-secondary">
                Nothing matches “{query.trim()}”. Start from scratch, or clear the search.
              </p>
            ) : (
              <div className="flex flex-col gap-8">
                {visibleEvents.map((event) => (
                    <section
                      key={event}
                      ref={(el) => {
                        if (el) sections.current.set(event, el);
                        else sections.current.delete(event);
                      }}
                    >
                      <div className="flex min-w-0 items-baseline gap-2">
                        <h2 className="shrink-0 text-h5 text-text-primary">{EVENT_LABEL[event]}</h2>
                        <p className="min-w-0 truncate text-caption text-text-tertiary">
                          {EVENT_LINE[event]}
                        </p>
                      </div>
                      <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {byEvent(event).map((t) => (
                          <TemplateCard key={t.id} template={t} onSelect={() => setPreview(t)} />
                        ))}
                      </div>
                    </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ''}
        subtitle={preview?.summary}
        icon={<PreviewIcon sx={{ fontSize: 22 }} />}
        width={1040}
        height="90vh"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setPreview(null)}>
              Close
            </Button>
            <Button endIcon={<ArrowForwardOutlined />} onClick={usePreview}>
              Use this template
            </Button>
          </>
        }
      >
        {preview && <TemplatePreview template={preview} />}
      </Modal>

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

/**
 * The empty-canvas option, in the same rail as the lifecycle list.
 *
 * Dashed so it reads as "not a template" — the same treatment it had when this
 * gallery was a picker. Clicking names a draft; there is no flow to preview.
 */
function ScratchCard({ onSelect }: { onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2.5 rounded-md border border-dashed border-border px-3 py-2.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-subtle text-icon">
        <DrawOutlined sx={{ fontSize: 18 }} />
      </span>
      <span className="min-w-0">
        <span className="block text-body-sm-strong text-text-primary">From scratch</span>
        <span className="block text-caption text-text-secondary">Empty canvas</span>
      </span>
    </button>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: WorkflowTemplate;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col rounded-lg border border-border p-1.5 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
    >
      <span className="relative block rounded-md bg-subtle px-3 pb-4 pt-6">
        <span className="absolute right-2 top-2">
          <StatusChip intent="info" label={template.audience} dot={false} />
        </span>
        <TemplateIllustration template={template} />
      </span>
      <span className="block px-2 py-2.5">
        <span className="block text-body-sm-medium text-text-primary">{template.name}</span>
        <span className="mt-0.5 block text-caption text-text-secondary">{template.summary}</span>
      </span>
    </button>
  );
}

/**
 * Connector strip: source system → lifecycle event → destination system.
 * Circles on a dashed line — a gallery of processes, not a list of paragraphs.
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
      <Icon
        sx={{ fontSize: size === 'md' ? 18 : 14, color: 'inherit' }}
      />
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

function TemplatePreview({ template }: { template: WorkflowTemplate }) {
  const workflow = React.useMemo(() => templateAsWorkflow(template), [template]);

  return (
    <div className="h-full overflow-hidden rounded-xl border border-border">
      <WorkflowFlowPreview workflow={workflow} />
    </div>
  );
}
