'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import { Button, Dialog, Menu, useToast } from '@ds/components';
import {
  REPORT_TEMPLATES,
  SCOPE_TYPE_LABEL,
  blankReport,
  describeFilters,
  describeProvenance,
  divergesFromTemplate,
  reportBlockers,
  reportFromTemplate,
  reportKindLabel,
  saveReport,
  templateById,
  type Report,
} from '@/data/governance-analytics';
import { assembleReport, buildScopeContext } from '@/data/governance-analytics-derive';
import { formatDate, formatDateTime } from '@/lib/datetime';
import { ReportBody } from './ReportBody';
import { ConfigPanel } from './ConfigPanel';

/**
 * The report workspace — view and configure, one screen.
 *
 * Opening a template lands here with the report *already rendered*. There is no
 * intermediate form, because a template whose promise is "this is what you get"
 * has to show what you get; a form in between would make the reader configure
 * something they have not seen.
 *
 * The configuration panel docks to the **left** and the report reflows into the
 * remaining width, so the thing being edited is never covered by the thing
 * editing it. Row detail opens on the right instead — see `ReportBody`. Two
 * surfaces, two edges, and which one you are looking at is answerable without
 * reading it.
 */
export function ReportWorkspace({
  initial,
  openConfigInitially = false,
}: {
  initial: Report;
  /** Row-menu "Edit" lands with the panel open; "View" does not. */
  openConfigInitially?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [report, setReport] = React.useState<Report>(initial);
  const [configOpen, setConfigOpen] = React.useState(openConfigInitially);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [blockers, setBlockers] = React.useState<string[]>([]);

  const context = React.useMemo(() => buildScopeContext(report), [report]);
  const blocks = React.useMemo(() => assembleReport(report, context), [report, context]);
  const provenance = describeProvenance(report.scope, report.filters);

  /**
   * Save, which is also generate.
   *
   * The staged progress is not decoration: the three phases name what is
   * happening to a reader who is about to rely on the output — the record is
   * written, the governance data is read, the report is produced. A single
   * spinner would make "generated" indistinguishable from "saved", which is the
   * one distinction this feature is built on.
   */
  const save = () => {
    const problems = reportBlockers(report);
    setBlockers(problems);
    if (problems.length > 0) {
      // Re-open the panel if it is closed: the fix is in there, and an alert about
      // a field the reader cannot see is a dead end.
      setConfigOpen(true);
      return;
    }
    setConfigOpen(false);
    setSaving('Saving report…');
    window.setTimeout(() => setSaving('Preparing governance data…'), 320);
    window.setTimeout(() => setSaving('Generating report…'), 720);
    window.setTimeout(() => {
      const saved = saveReport(report);
      setReport(saved);
      setSaving(null);
      toast.success('Report generated.');
      // Replace so Back does not return to a URL for a report that had no id.
      router.replace(`/iga/governance-analytics/report/${saved.id}`);
    }, 1150);
  };

  const changeTemplate = (templateId: string | null) => {
    const next = templateId
      ? reportFromTemplate(templateById(templateId)!, report.createdBy)
      : blankReport(report.createdBy);
    // Keep identity and authorship; replace the definition. A template change is
    // a change to what the report asks, not to which record it is.
    setReport({ ...next, id: report.id, createdAt: report.createdAt, status: report.status });
    setBlockers([]);
    toast.success(templateId ? `${templateById(templateId)!.name} applied` : 'Started from scratch');
  };

  return (
    <div className="flex h-full min-h-0">
      {configOpen && (
        <ConfigPanel
          report={report}
          context={context}
          blockers={blockers}
          onCancel={() => {
            setConfigOpen(false);
            setBlockers([]);
          }}
          onApply={(next) => setReport(next)}
          onSave={(next) => {
            setReport(next);
            // Validate the incoming draft rather than state that has not committed
            // yet — `setReport` is async and `save()` would read the old report.
            const problems = reportBlockers(next);
            setBlockers(problems);
            if (problems.length > 0) return;
            setConfigOpen(false);
            setSaving('Saving report…');
            window.setTimeout(() => setSaving('Preparing governance data…'), 320);
            window.setTimeout(() => setSaving('Generating report…'), 720);
            window.setTimeout(() => {
              const saved = saveReport(next);
              setReport(saved);
              setSaving(null);
              toast.success('Report generated.');
              router.replace(`/iga/governance-analytics/report/${saved.id}`);
            }, 1150);
          }}
        />
      )}

      <div className="ds-scroll min-w-0 flex-1 overflow-y-auto">
        <WorkspaceHeader
          report={report}
          onConfigure={() => setConfigOpen(true)}
          onChangeTemplate={changeTemplate}
          onSave={save}
          onDownload={(what) => toast.info(`${what} export is mocked in this prototype.`)}
        />

        {saving ? (
          <SavingPanel stage={saving} />
        ) : blocks.length === 0 ? (
          <EmptyWorkspace onOpenConfig={() => setConfigOpen(true)} />
        ) : (
          <div className="px-6 pb-10">
            <ReportBody blocks={blocks} provenance={provenance} />
          </div>
        )}
      </div>
    </div>
  );
}

function WorkspaceHeader({
  report,
  onConfigure,
  onChangeTemplate,
  onSave,
  onDownload,
}: {
  report: Report;
  onConfigure: () => void;
  onChangeTemplate: (templateId: string | null) => void;
  onSave: () => void;
  onDownload: (what: string) => void;
}) {
  const [confirmTemplate, setConfirmTemplate] = React.useState<string | null | undefined>(undefined);

  const pick = (templateId: string | null) => {
    // Silent for an untouched report; confirm once there is work to lose.
    if (report.status === 'ready' || divergesFromTemplate(report)) setConfirmTemplate(templateId);
    else onChangeTemplate(templateId);
  };

  const filters = describeFilters(report.filters);

  return (
    <div className="ds-print-hide border-b border-border px-6 pb-5 pt-1">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-overline text-text-tertiary">{reportKindLabel(report).toUpperCase()}</span>
            {/* Low emphasis on purpose: it is available, but it replaces the
                report, so it must not read as the next thing to do. */}
            <Menu
              ariaLabel="Change template"
              trigger={
                <button
                  type="button"
                  className="rounded-sm text-caption-strong text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                >
                  Change template
                </button>
              }
              items={[
                ...REPORT_TEMPLATES.map((t) => ({ label: t.name, onClick: () => pick(t.id) })),
                { label: 'Start from scratch', onClick: () => pick(null) },
              ]}
            />
          </div>
          <h1 className="mt-1 text-h2 text-text-primary">{report.name || 'Untitled report'}</h1>
          {report.description && (
            <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">{report.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" startIcon={<TuneOutlined />} onClick={onConfigure}>
            Configure
          </Button>
          <Menu
            ariaLabel="Download this report"
            trigger={
              <span>
                <Button variant="secondary" startIcon={<DownloadOutlined />}>
                  Download
                </Button>
              </span>
            }
            items={[
              { label: 'PDF — full report', onClick: () => onDownload('PDF') },
              { label: 'Excel — detailed tables', onClick: () => onDownload('Excel') },
              { label: 'CSV — raw report data', onClick: () => onDownload('CSV') },
            ]}
          />
          {/* The only primary action. There is no Generate button, because saving
              is what generates — see `saveReport`. */}
          <Button onClick={onSave}>Save report</Button>
        </div>
      </div>

      {/* The metadata grid is audit evidence, not ornament: scope and filters say
          what population the numbers describe, and the two timestamps separate
          "when was this produced" from "how fresh was the data". */}
      <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        <Meta label="Scope">
          {report.scope.value
            ? `${SCOPE_TYPE_LABEL[report.scope.type]} = ${report.scope.value}`
            : 'Not scoped yet'}
        </Meta>
        <Meta label="Filters">{filters || 'None'}</Meta>
        <Meta label="Sections">
          {report.sections.filter((s) => s.enabled).length} sections ·{' '}
          {report.plots.filter((p) => p.enabled).length} plots
        </Meta>
        <Meta label="Generated">
          {report.lastGeneratedAt ? formatDate(report.lastGeneratedAt) : 'Not generated yet'}
        </Meta>
        <Meta label="Data as of">{report.dataAsOf ? formatDateTime(report.dataAsOf) : '—'}</Meta>
        <Meta label="Generated by">{report.createdBy}</Meta>
      </dl>

      {/* Only for a report with work to lose — an untouched one switches silently. */}
      <Dialog
        open={confirmTemplate !== undefined}
        onClose={() => setConfirmTemplate(undefined)}
        title="Change template?"
        confirmLabel="Change template"
        onConfirm={() => {
          if (confirmTemplate !== undefined) onChangeTemplate(confirmTemplate);
          setConfirmTemplate(undefined);
        }}
      >
        <p className="text-body-sm text-text-secondary">
          Changing the template replaces this report&rsquo;s sections, plots, scope and filters with the new
          template&rsquo;s defaults. The report&rsquo;s name and history are kept.
        </p>
      </Dialog>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-24 shrink-0 text-caption text-text-tertiary">{label}</dt>
      <dd className="min-w-0 text-body-sm text-text-primary">{children}</dd>
    </div>
  );
}

function SavingPanel({ stage }: { stage: string }) {
  return (
    <div className="px-6 py-16">
      <div
        className="mx-auto max-w-md rounded-xl border border-border bg-surface p-6 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="text-body-strong text-text-primary">{stage}</div>
        <p className="mt-1 text-body-sm text-text-secondary">
          Reading the governance data this report is built from.
        </p>
      </div>
    </div>
  );
}

function EmptyWorkspace({ onOpenConfig }: { onOpenConfig: () => void }) {
  return (
    <div className="px-6 py-12">
      {/* Dashed, because it is a slot waiting to be filled rather than a card with
          content in it. The panel does not auto-open: the reader chose "from
          scratch", and answering that with a wall of configuration takes the
          decision back off them. */}
      <div className="rounded-xl border border-dashed border-border-strong bg-subtle px-6 py-12 text-center">
        <div className="text-h5 text-text-primary">No report sections yet</div>
        <p className="mx-auto mt-1 max-w-md text-body-sm text-text-secondary">
          Choose what this report is about, then add the plots and tables that answer it.
        </p>
        <div className="mt-4">
          <Button variant="secondary" startIcon={<TuneOutlined />} onClick={onOpenConfig}>
            Open configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
