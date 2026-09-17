'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import ViewAgendaOutlined from '@mui/icons-material/ViewAgendaOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import ScheduleSendOutlined from '@mui/icons-material/ScheduleSendOutlined';
import FullscreenOutlined from '@mui/icons-material/FullscreenOutlined';
import FullscreenExitOutlined from '@mui/icons-material/FullscreenExitOutlined';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import GridOnOutlined from '@mui/icons-material/GridOnOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { Button, Dialog, FormSection, Menu, Select, Input, Tooltip, useToast } from '@ds/components';
import {
  NameAndDescriptionFields,
  ScopeFields,
  SectionFields,
  commitDockSections,
  dockSectionCandidates,
} from './ReportConfigFields';
import { ReportSectionBlock } from './ReportSectionBlock';
import { deriveSection, type DerivedSection } from '@/data/governance-analytics-v2-derive';
import {
  OVERVIEW_SECTION_ID,
  createReportV2,
  deleteReportV2,
  describeOrganization,
  draftReport,
  getReportV2,
  timelineById,
  updateReportV2,
  SECTION_CATALOGUE,
  type ReportOrganization,
  type ReportSectionV2,
} from '@/data/governance-analytics-v2';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';
import { CUSTOM_ANALYTICS_CRUMBS } from '@/data/reports';

/** The stages a new report moves through; an existing one opens straight into 'ready'. */
type Phase = 'config' | 'generating' | 'ready';
const GENERATE_MS = 2200;
const TEMPLATES_HREF = '/iga/governance-analytics-v2/templates';
const HOME_HREF = '/iga/governance-analytics-v2';

/** What the canvas says while it builds — plain, because a report is evidence, not theatre. */
const BUILD_STEPS = [
  'Gathering the data…',
  'Assembling the sections…',
  'Crunching the numbers…',
  'Laying out the report…',
];

/** A new report's starting sections: every catalogue default, in catalogue order. */
const defaultSections = (): ReportSectionV2[] =>
  SECTION_CATALOGUE.filter((s) => s.defaultOn).map((s) => ({
    id: s.id,
    enabled: true,
    filters: {},
    hiddenCharts: [],
  }));

/**
 * One report editor for every way in.
 *
 * From scratch it starts as a full-width form, and Generate slides it to a column with the
 * report building beside it. From a template or a saved report it opens straight into that
 * split, loaded from the store. Either way the form is on the left, the report is the
 * document on the right, and edits are unsaved changes until Save commits them — the same
 * disabled-until-dirty pattern a settings screen uses. The report is derived live from the
 * form with the same code the reader would see, so what shows is what saves.
 */
export function ReportEditor({ reportId: existingId }: { reportId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !existingId;

  const seed = React.useMemo(draftReport, []);
  const [name, setName] = React.useState(isNew ? seed.name : '');
  const [description, setDescription] = React.useState(isNew ? seed.description : '');
  const [organization, setOrganization] = React.useState<ReportOrganization>(seed.organization);
  const [timelineId, setTimelineId] = React.useState(seed.timelineId);
  const [sections, setSections] = React.useState<ReportSectionV2[]>(() => (isNew ? defaultSections() : []));

  const [phase, setPhase] = React.useState<Phase>(isNew ? 'config' : 'ready');
  const [step, setStep] = React.useState(0);
  const [reportId, setReportId] = React.useState<string | null>(existingId ?? null);
  const [dirty, setDirty] = React.useState(false);
  // New reports render on the server the same as the client; existing ones read the
  // localStorage-backed store, so they resolve only after mount.
  const [loaded, setLoaded] = React.useState(isNew);
  const [notFound, setNotFound] = React.useState(false);

  // Document-level view + delivery state — the report on the right, not the form.
  const [formCollapsed, setFormCollapsed] = React.useState(false);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [frequency, setFrequency] = React.useState('weekly');
  const [scheduleFormat, setScheduleFormat] = React.useState('pdf');
  const [recipients, setRecipients] = React.useState('');

  const markDirty = () => reportId && setDirty(true);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => () => clearTimeout(timer.current), []);

  React.useEffect(() => {
    if (isNew || !existingId) return;
    const r = getReportV2(existingId);
    if (!r) {
      setNotFound(true);
      setLoaded(true);
      return;
    }
    setName(r.name);
    setDescription(r.description);
    setOrganization(r.organization);
    setTimelineId(r.timelineId);
    setSections(r.sections);
    setReportId(r.id);
    setDirty(false);
    setPhase('ready');
    setLoaded(true);
  }, [existingId, isNew]);

  React.useEffect(() => {
    if (phase !== 'generating') return;
    const t = setInterval(() => setStep((s) => (s + 1) % BUILD_STEPS.length), 650);
    return () => clearInterval(t);
  }, [phase]);

  useSetBreadcrumbs(
    React.useMemo(
      () =>
        isNew
          ? [
              ...CUSTOM_ANALYTICS_CRUMBS,
              { label: 'Create report', href: TEMPLATES_HREF },
              { label: 'From scratch' },
            ]
          : [...CUSTOM_ANALYTICS_CRUMBS, { label: name || 'Report' }],
      [isNew, name],
    ),
  );

  const scopeIncomplete = organization.scope !== 'entire' && !organization.value;
  const problem = !name.trim()
    ? 'Give the report a name.'
    : scopeIncomplete
      ? 'Choose which one this report is about.'
      : sections.length === 0
        ? 'Include at least one section.'
        : null;

  const split = phase !== 'config';

  const generate = () => {
    if (problem) return;
    const report = createReportV2({
      ...seed,
      name: name.trim(),
      description: description.trim(),
      organization,
      timelineId,
      sections,
      status: 'ready',
    });
    setReportId(report.id);
    setDirty(false);
    setStep(0);
    setPhase('generating');
    timer.current = setTimeout(() => setPhase('ready'), GENERATE_MS);
  };

  const save = () => {
    if (!reportId || problem || !dirty) return;
    updateReportV2(reportId, {
      name: name.trim(),
      description: description.trim(),
      organization,
      timelineId,
      sections,
    });
    setDirty(false);
    toast.success('Changes saved.');
  };

  const cancel = () => {
    // The report is created on Generate; leaving a new one without keeping it removes it.
    if (isNew && reportId) deleteReportV2(reportId);
    router.push(TEMPLATES_HREF);
  };

  const editSections = (next: ReportSectionV2[]) => {
    setSections(commitDockSections(sections, next));
    markDirty();
  };

  const download = (format: 'PDF' | 'CSV') => {
    toast.success(`Preparing “${name.trim() || 'report'}” as ${format}. It will download shortly.`);
  };

  const scheduleDelivery = () => {
    const to = recipients.trim();
    toast.success(
      `Scheduled ${frequency} delivery as ${scheduleFormat.toUpperCase()}${to ? ` to ${to}` : ''}.`,
    );
    setScheduleOpen(false);
  };

  // The report, derived live from the form — the same derive the reader would see.
  const preview: DerivedSection[] = split
    ? sections
        .map((cfg) => deriveSection(cfg, organization, sections))
        .filter((s): s is DerivedSection => s !== null)
    : [];
  const timeline = timelineById(timelineId);

  if (!loaded) {
    return <div className="p-6 text-body-sm text-text-tertiary">Loading report…</div>;
  }

  if (notFound) {
    return (
      <div className="px-6 py-12">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-6 text-center">
          <div className="text-h5 text-text-primary">That report no longer exists</div>
          <p className="mt-1 text-body-sm text-text-secondary">
            It may have been deleted from another tab. The reports list has everything that is still
            saved.
          </p>
          <div className="mt-4">
            <Link href={HOME_HREF}>
              <Button variant="secondary">Back to reports</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-8 -my-6 flex h-[calc(100%+var(--ds-space-12))] min-h-0">
      {/* The form — the whole page to start (new, from scratch), then a column on the left.
          Its header rides with it, so the report gets the full height beside it. */}
      <div
        className={[
          'flex shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-out',
          !split ? 'w-full' : formCollapsed ? 'w-0' : 'w-[380px] border-r border-border',
        ].join(' ')}
      >
        <div
          className={[
            'flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-canvas py-3',
            split ? 'px-6' : 'px-8',
          ].join(' ')}
        >
          <h1 className="truncate text-h4 text-text-primary">
            {isNew ? 'New report' : 'Modify Report'}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            {phase === 'ready' ? (
              // Disabled until an edit — the report is already saved, so there is
              // nothing to commit until something changes.
              <Button disabled={!dirty || problem !== null} onClick={save}>
                Save changes
              </Button>
            ) : (
              <>
                <Button variant="tertiary" onClick={cancel}>
                  Cancel
                </Button>
                <Button
                  endIcon={phase === 'generating' ? undefined : <ArrowForwardOutlined />}
                  loading={phase === 'generating'}
                  disabled={problem !== null || phase === 'generating'}
                  onClick={generate}
                >
                  {phase === 'generating' ? 'Generating…' : 'Generate report'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
          <div
            className={[
              'flex w-full flex-col gap-8',
              split ? 'px-6 py-6' : 'mx-auto max-w-[820px] px-8 pt-6 pb-8',
            ].join(' ')}
          >
            <FormSection title="What this report is" icon={<DescriptionOutlined sx={{ fontSize: 18 }} />}>
              <NameAndDescriptionFields
                name={name}
                description={description}
                onName={(v) => {
                  setName(v);
                  markDirty();
                }}
                onDescription={(v) => {
                  setDescription(v);
                  markDirty();
                }}
              />
            </FormSection>

            <FormSection title="What it covers" icon={<TuneOutlined sx={{ fontSize: 18 }} />}>
              <ScopeFields
                stacked={split}
                organization={organization}
                timelineId={timelineId}
                onOrganization={(v) => {
                  setOrganization(v);
                  markDirty();
                }}
                onTimeline={(v) => {
                  setTimelineId(v);
                  markDirty();
                }}
              />
            </FormSection>

            <FormSection title="Sections to include" icon={<ViewAgendaOutlined sx={{ fontSize: 18 }} />}>
              <SectionFields sections={dockSectionCandidates(sections)} onChange={editSections} />
            </FormSection>
          </div>
        </div>
      </div>

      {/* The canvas — full height, a subtle backdrop with the report floating on it. */}
      {split && (
        <div className="min-w-0 flex-1 overflow-hidden bg-subtle">
          <div className="h-full p-3">
            <div className="mx-auto flex h-full w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
              {phase === 'generating' ? (
                <div className="grid flex-1 place-items-center px-8 py-16">
                  <div className="flex flex-col items-center text-center">
                    <CircularProgress size={30} thickness={4} sx={{ color: 'var(--ds-color-brand-primary)' }} />
                    <p className="mt-5 text-body-sm-strong text-text-primary" aria-live="polite">
                      {BUILD_STEPS[step]}
                    </p>
                    <p className="mt-1 text-caption text-text-tertiary">
                      Building “{name.trim() || 'Untitled report'}”
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Document toolbar — pinned: what you do to the report, not the form. */}
                  <div className="flex shrink-0 items-center justify-end gap-0.5 border-b border-border px-2 py-1">
                    <Menu
                      ariaLabel="Download report"
                      items={[
                        {
                          label: 'Download as PDF',
                          icon: <PictureAsPdfOutlined sx={{ fontSize: 18 }} />,
                          onClick: () => download('PDF'),
                        },
                        {
                          label: 'Download as CSV',
                          icon: <GridOnOutlined sx={{ fontSize: 18 }} />,
                          onClick: () => download('CSV'),
                        },
                      ]}
                      trigger={
                        <Button variant="tertiary" size="xs" iconOnly aria-label="Download report">
                          <FileDownloadOutlined sx={{ fontSize: 18 }} />
                        </Button>
                      }
                    />
                    <Tooltip title="Schedule delivery">
                      <Button
                        variant="tertiary"
                        size="xs"
                        iconOnly
                        aria-label="Schedule delivery"
                        onClick={() => setScheduleOpen(true)}
                      >
                        <ScheduleSendOutlined sx={{ fontSize: 18 }} />
                      </Button>
                    </Tooltip>
                    <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
                    <Tooltip title={formCollapsed ? 'Show editor' : 'Expand to full width'}>
                      <Button
                        variant="tertiary"
                        size="xs"
                        iconOnly
                        aria-label={formCollapsed ? 'Show editor' : 'Expand report to full width'}
                        onClick={() => setFormCollapsed((c) => !c)}
                      >
                        {formCollapsed ? (
                          <FullscreenExitOutlined sx={{ fontSize: 18 }} />
                        ) : (
                          <FullscreenOutlined sx={{ fontSize: 18 }} />
                        )}
                      </Button>
                    </Tooltip>
                  </div>

                  <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-8 py-7">
                    <div className="flex flex-col gap-5">
                      <div className="min-w-0">
                        <h2 className="truncate text-h3 text-text-primary" title={name.trim()}>
                          {name.trim() || 'Untitled report'}
                        </h2>
                        {description.trim() && (
                          <p className="mt-2 max-w-3xl text-body-sm text-text-secondary">{description.trim()}</p>
                        )}
                        <p className="mt-2 text-body-sm text-text-secondary">
                          {[
                            describeOrganization(organization),
                            timeline ? `${timeline.label} (${timeline.covers})` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>

                      {preview.map((section, index) => (
                        <ReportSectionBlock
                          key={section.def.id}
                          section={section}
                          editing={false}
                          isFirst={
                            index === 0 ||
                            preview.slice(0, index).every((s) => s.def.id === OVERVIEW_SECTION_ID)
                          }
                          isLast={index === preview.length - 1}
                          onMove={() => {}}
                        />
                      ))}

                      {preview.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border bg-subtle p-8 text-center">
                          <p className="text-body-strong text-text-primary">This report has no sections</p>
                          <p className="mt-1 text-body-sm text-text-secondary">
                            Turn one on under “Sections to include” to give it something to say.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule delivery"
        confirmLabel="Schedule"
        onConfirm={scheduleDelivery}
      >
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-text-secondary">
            Send this report on a schedule. It runs with whatever is saved at each send.
          </p>
          <Select
            label="Frequency"
            value={frequency}
            onChange={setFrequency}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
          />
          <Select
            label="Format"
            value={scheduleFormat}
            onChange={setScheduleFormat}
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'csv', label: 'CSV' },
            ]}
          />
          <Input
            label="Recipients"
            placeholder="name@company.com, …"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            hint="Comma-separated email addresses."
          />
        </div>
      </Dialog>
    </div>
  );
}

export default ReportEditor;
