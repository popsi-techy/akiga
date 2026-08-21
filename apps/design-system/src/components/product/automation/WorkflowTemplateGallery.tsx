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
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import HubOutlined from '@mui/icons-material/HubOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import type { SvgIconComponent } from '@mui/icons-material';
import { Button, Drawer, Input, Modal, NavList, StatusChip, useToast, type StatusIntent } from '@ds/components';
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

/** Section titles — a little more than the one-word lifecycle name. */
const EVENT_HEADING: Record<WorkflowEventType, string> = {
  joiner: 'Joiner templates',
  mover: 'Mover templates',
  leaver: 'Leaver templates',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Audience is a classification, not a state — icon, not a status dot. */
const AUDIENCE_CHIP: Record<
  WorkflowTemplate['audience'],
  { intent: StatusIntent; icon: React.ReactNode }
> = {
  Employee: { intent: 'info', icon: <PersonOutline /> },
  Student: { intent: 'info', icon: <SchoolOutlined /> },
  Contractor: { intent: 'caution', icon: <BadgeOutlined /> },
};

/** A unique draft name so two empties created the same day do not collide in the list. */
function scratchDraft() {
  const n = listWorkflows().filter((w) => /^New workflow/i.test(w.name)).length + 1;
  const d = new Date();
  return `New workflow ${n} · ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * The workflow template catalog.
 *
 * A search banner (with start-from-scratch below it) sits still. Under that, a
 * lifecycle rail and a two-up card grid; only the grid scrolls. From scratch has
 * no flow to preview, so it names a draft directly.
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
      setDraftName(scratchDraft());
      setDraftDescription('');
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
      <div className="flex h-full min-h-0 flex-col">
        <header className="relative shrink-0 overflow-hidden border-b border-border bg-subtle px-6 py-5">
          <BannerAtmosphere />
          <div className="relative mx-auto flex w-full max-w-lg flex-col items-center">
            <h1 className="text-center text-h4 text-text-primary">
              Start automations faster with{' '}
              <span className="text-text-brand">ready-to-use workflows</span>
            </h1>
            <div className="mt-3 w-full">
              <Input
                placeholder="Search workflow templates…"
                aria-label="Search templates"
                size="md"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                endAdornment={<SearchOutlined sx={{ fontSize: 20 }} />}
              />
            </div>
            <div className="mt-3 flex w-full items-center gap-3">
              <span className="h-px min-w-0 flex-1 bg-border" />
              <span className="text-caption text-text-tertiary">or</span>
              <span className="h-px min-w-0 flex-1 bg-border" />
            </div>
            <button
              type="button"
              className="mt-2 text-body-sm-medium text-text-link hover:underline"
              onClick={() => openDraft('scratch')}
            >
              Start from scratch
            </button>
          </div>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1 gap-5 px-6 py-5">
            <aside className="flex w-56 shrink-0 flex-col rounded-xl border border-border bg-surface px-3 py-4">
              <h2 className="mb-3 px-1 text-overline uppercase text-text-tertiary">Categories</h2>
              <NavList
                ariaLabel="Categories"
                value={active}
                onChange={(id) => jumpTo(id as WorkflowEventType)}
                items={EVENT_TYPES.map((event) => ({
                  id: event,
                  label: EVENT_LABEL[event],
                  count: byEvent(event).length,
                }))}
              />
            </aside>

            <div
              ref={scroller}
              onScroll={onScroll}
              className="ds-scroll min-h-0 min-w-0 flex-1 overflow-y-auto"
            >
              {matches.length === 0 && q ? (
                <p className="text-body-sm text-text-secondary">
                  Nothing matches “{query.trim()}”. Clear the search, or start from scratch above.
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
                      <h2 className="text-h5 text-text-primary">{EVENT_HEADING[event]}</h2>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {byEvent(event).map((t) => (
                          <TemplateCard
                            key={t.id}
                            template={t}
                            onPreview={() => setPreview(t)}
                            onUse={() => openDraft(t)}
                          />
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
            hint="Shown on the workflow list. Say what this process does, and when it should run."
            placeholder="What this workflow automates (optional)"
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
 * Soft mesh + film grain on the search banner. Colour comes from brand and
 * info tints — the same tokens as chips and avatars — so the field can glow
 * without inventing a palette. Grain is turbulence, not a bitmap.
 */
function BannerAtmosphere() {
  const grain = `tpl-grain-${React.useId().replace(/:/g, '')}`;
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 90% 130% at 6% -20%, var(--ds-color-brand-subtle) 0%, transparent 58%)',
            'radial-gradient(ellipse 80% 110% at 98% 120%, var(--ds-color-status-info-subtle) 0%, transparent 55%)',
            'radial-gradient(ellipse 55% 80% at 72% -30%, var(--ds-color-brand-border) 0%, transparent 52%)',
            'radial-gradient(ellipse 50% 70% at 24% 130%, var(--ds-color-brand-subtleHover) 0%, transparent 50%)',
          ].join(', '),
        }}
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-50 mix-blend-overlay"
        aria-hidden
      >
        <filter id={grain}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grain})`} />
      </svg>
    </>
  );
}

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: WorkflowTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-border-strong hover:shadow-sm">
      <div className="self-start">
        <StatusChip
          intent={AUDIENCE_CHIP[template.audience].intent}
          label={template.audience}
          icon={AUDIENCE_CHIP[template.audience].icon}
        />
      </div>
      <h3 className="mt-2 truncate text-body-strong text-text-primary">{template.name}</h3>
      <p className="mt-0.5 line-clamp-2 text-body-sm text-text-secondary">{template.summary}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {template.systems.map((name) => (
            <SystemMark key={name} name={name} />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="text-caption-medium text-text-secondary hover:text-text-primary hover:underline"
            onClick={onPreview}
          >
            Preview
          </button>
          <button
            type="button"
            className="rounded-sm bg-surface-inverse px-2.5 py-1 text-caption-medium text-text-inverse hover:bg-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            onClick={onUse}
          >
            Use template
          </button>
        </div>
      </div>
    </article>
  );
}

function systemGlyph(name: string): SvgIconComponent {
  const n = name.toLowerCase();
  if (n.includes('sis') || n.includes('student')) return SchoolOutlined;
  if (n.includes('peoplesoft') || n.includes('hrms')) return StorageOutlined;
  if (n.includes('entra') || n.includes('azure')) return BadgeOutlined;
  if (n.includes('office') || n.includes('365')) return MailOutline;
  if (n.includes('active directory')) return AccountTreeOutlined;
  if (n.includes('blackboard') || n.includes('lms')) return MenuBookOutlined;
  return HubOutlined;
}

/** Outlined square, quiet icon — same weight as overview-card header marks. */
function SystemMark({ name }: { name: string }) {
  const Icon = systemGlyph(name);
  return (
    <span
      title={name}
      className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border text-icon-subtle"
    >
      <Icon sx={{ fontSize: 14, color: 'inherit' }} />
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
