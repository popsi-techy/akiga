'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import ViewAgendaOutlined from '@mui/icons-material/ViewAgendaOutlined';
import { Button, FormSection, useToast } from '@ds/components';
import {
  NameAndDescriptionFields,
  ScopeFields,
  SectionFields,
} from '@/components/product/analytics/v2/ReportConfigFields';
import {
  createReportV2,
  draftReport,
  SECTION_CATALOGUE,
  type ReportOrganization,
  type ReportSectionV2,
} from '@/data/governance-analytics-v2';
import { useSetBreadcrumbs } from '@/lib/breadcrumb';

/**
 * Configure a report — one screen, not a wizard.
 *
 * A report is four global answers and a list of sections. That fits on one page, and a
 * four-step wizard over it would hide the sections behind the scope while the sections are
 * the part a reader actually deliberates about.
 *
 * Every section carries its own filters *here*, before the report exists — the point of V2.
 * A section switched off keeps the filters it was given, so toggling one to see the report
 * without it does not cost the configuration.
 */
export default function GovernanceAnalyticsV2CreatePage() {
  const router = useRouter();
  const toast = useToast();
  useSetBreadcrumbs([
    { label: 'Governance Analytics V2', href: '/iga/governance-analytics-v2' },
    { label: 'Create report', href: '/iga/governance-analytics-v2/templates' },
    { label: 'From scratch' },
  ]);

  const seed = React.useMemo(draftReport, []);
  const [name, setName] = React.useState(seed.name);
  const [description, setDescription] = React.useState(seed.description);
  const [organization, setOrganization] = React.useState<ReportOrganization>(seed.organization);
  const [timelineId, setTimelineId] = React.useState(seed.timelineId);
  // Every catalogue section is a candidate, pre-ticked when it is `defaultOn` — the same
  // list the store seeds a draft with, plus the ones a reader can opt into.
  const [sections, setSections] = React.useState<ReportSectionV2[]>(() =>
    SECTION_CATALOGUE.map((s) => ({
      id: s.id,
      enabled: s.defaultOn,
      filters: {},
      hiddenCharts: [],
    })),
  );

  const chosen = sections.filter((s) => s.enabled);
  const scopeIncomplete = organization.scope !== 'entire' && !organization.value;
  const problem = !name.trim()
    ? 'Give the report a name.'
    : scopeIncomplete
      ? 'Choose which one this report is about.'
      : chosen.length === 0
        ? 'Include at least one section.'
        : null;

  const generate = () => {
    if (problem) return;
    const report = createReportV2({
      ...seed,
      name: name.trim(),
      description: description.trim(),
      organization,
      timelineId,
      // Only what was ticked, in catalogue order — the array *is* the section order, and a
      // switched-off section stored alongside the rest would reappear as a gap in the dock.
      sections: chosen,
      status: 'ready',
    });
    toast.success(`“${report.name}” is ready`);
    router.push(`/iga/governance-analytics-v2/report/${report.id}`);
  };

  return (
    <div className="-mx-8 -mt-6 flex h-[calc(100%+var(--ds-space-6))] min-h-0 flex-col">
      {/* Same docked identity band as RequestWizardChrome: title left, commit right,
          pinned under the topbar so Generate does not live below a long form. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-canvas px-8 py-3">
        <h1 className="truncate text-h4 text-text-primary">New report</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="tertiary" onClick={() => router.push('/iga/governance-analytics-v2/templates')}>
            Cancel
          </Button>
          <Button endIcon={<ArrowForwardOutlined />} disabled={problem !== null} onClick={generate}>
            Generate report
          </Button>
        </div>
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <div className="flex w-full min-w-0 max-w-[900px] flex-col gap-8">
          <FormSection title="What this report is" icon={<DescriptionOutlined sx={{ fontSize: 18 }} />}>
            <NameAndDescriptionFields
              name={name}
              description={description}
              onName={setName}
              onDescription={setDescription}
            />
          </FormSection>

          <FormSection title="What it covers" icon={<TuneOutlined sx={{ fontSize: 18 }} />}>
            <ScopeFields
              organization={organization}
              timelineId={timelineId}
              onOrganization={setOrganization}
              onTimeline={setTimelineId}
            />
          </FormSection>

          <FormSection title="Sections to include" icon={<ViewAgendaOutlined sx={{ fontSize: 18 }} />}>
            <SectionFields sections={sections} onChange={setSections} />
          </FormSection>
        </div>
      </div>
    </div>
  );
}
