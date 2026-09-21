'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ArrowBack from '@mui/icons-material/ArrowBack';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import QueryStatsOutlined from '@mui/icons-material/QueryStatsOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import { Button, NavCard } from '@ds/components';
import { COMPLIANCE_FRAMEWORKS, OPERATIONAL_REPORTS } from '@/data/reports';
import { listReportsV2 } from '@/data/governance-analytics-v2';
import { OperationalReportsTab } from './OperationalReportsTab';
import { CompliancePackagesTab } from './CompliancePackagesTab';
import { CustomAnalyticsTab } from './CustomAnalyticsTab';
import { ReportsSchedulesRail } from './ReportsSchedulesRail';

type HubSection = 'operational' | 'compliance' | 'custom';

const CATALOGUE: {
  value: HubSection;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'operational',
    label: 'Registers',
    description: 'Standing reports an administrator runs.',
    icon: <AssignmentOutlined sx={{ fontSize: 20 }} />,
  },
  {
    value: 'compliance',
    label: 'Evidence packages',
    description: 'What an assessor seals, clause by clause.',
    icon: <VerifiedUserOutlined sx={{ fontSize: 20 }} />,
  },
  {
    value: 'custom',
    label: 'Custom reports',
    description: 'Questions the registers do not answer.',
    icon: <QueryStatsOutlined sx={{ fontSize: 20 }} />,
  },
];

const isSection = (v: string | null): v is HubSection => CATALOGUE.some((t) => t.value === v);

/**
 * Reports — a catalogue on the left, the machine that produces packages on the right.
 *
 * The left column is larger because it is the job: pick a report type, then open a
 * report. Clicking a type replaces the chooser with that collection, so the types
 * and the reports are never competing for the same scan. A back control returns
 * to the types.
 *
 * Schedules stay out of that hierarchy. They live in the narrow column on the
 * landing view only — next run first — and the full table remains a page behind
 * View all. Once a type is open, that collection takes the full width and the
 * rail steps aside.
 */
export function ReportsHubMainScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = params.get('tab');

  const [custom, setCustom] = React.useState<ReturnType<typeof listReportsV2> | null>(null);
  React.useEffect(() => setCustom(listReportsV2()), []);

  React.useEffect(() => {
    if (fromUrl === 'schedules') router.replace('/iga/reports/schedules');
  }, [fromUrl, router]);

  if (fromUrl === 'schedules') return null;

  const section: HubSection | null = isSection(fromUrl) ? fromUrl : null;
  const current = CATALOGUE.find((c) => c.value === section);

  const setSection = (next: HubSection | null) => {
    const q = new URLSearchParams(Array.from(params.entries()));
    if (!next) q.delete('tab');
    else q.set('tab', next);
    const qs = q.toString();
    router.replace(qs ? `/iga/reports?${qs}` : '/iga/reports', { scroll: false });
  };

  const counts: Record<HubSection, number | undefined> = {
    operational: OPERATIONAL_REPORTS.length,
    compliance: COMPLIANCE_FRAMEWORKS.length,
    custom: custom?.length,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">Reports</h1>
        <p className="mt-1 max-w-2xl text-body text-text-secondary">
          Open a register, seal an evidence package, or build a report the catalogue does not cover.
        </p>
      </div>

      {section && current ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="mb-4 shrink-0">
            <Button
              variant="tertiary"
              size="sm"
              startIcon={<ArrowBack />}
              onClick={() => setSection(null)}
            >
              Report types
            </Button>
            <h2 className="mt-3 text-h3 text-text-primary">{current.label}</h2>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            {section === 'operational' && <OperationalReportsTab />}
            {section === 'compliance' && <CompliancePackagesTab />}
            {section === 'custom' && <CustomAnalyticsTab reports={custom} />}
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
            <div className="grid max-w-2xl gap-4">
              {CATALOGUE.map((item) => (
                <NavCard
                  key={item.value}
                  title={item.label}
                  description={item.description}
                  count={counts[item.value]}
                  icon={item.icon}
                  onClick={() => setSection(item.value)}
                />
              ))}
            </div>
          </div>

          <div className="min-h-0 lg:h-full">
            <ReportsSchedulesRail />
          </div>
        </div>
      )}
    </div>
  );
}
