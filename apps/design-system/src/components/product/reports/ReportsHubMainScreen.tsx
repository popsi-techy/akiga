'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@ds/components';
import { OperationalReportsTab } from './OperationalReportsTab';
import { CompliancePackagesTab } from './CompliancePackagesTab';
import { CustomAnalyticsTab } from './CustomAnalyticsTab';
import { SchedulesTab } from './SchedulesTab';

type HubTab = 'operational' | 'compliance' | 'custom' | 'schedules';

const TAB_IDS: HubTab[] = ['operational', 'compliance', 'custom', 'schedules'];
const isTab = (v: string | null): v is HubTab => TAB_IDS.includes(v as HubTab);

/**
 * Reports — a catalogue, not a dashboard.
 *
 * It had a KPI strip: the next scheduled run, and how many clauses were evidenced. Both
 * facts were true and neither belonged here. A summary at the top of a hub is only worth
 * its height if it is about the hub, and those two were about *one tab each* — so a reader
 * on the Operational tab spent a sixth of the page on a compliance number they had not
 * asked for, and a reader who wanted the number had it in the one place it could not be
 * acted on. Each has moved to the tab that owns it, where it sits next to the rows it
 * summarises and the controls that change it.
 *
 * What is left is the shape of the thing: a title, four peers, and one of them open.
 *
 * The four are peers. The registers, the packages those registers seal into, the custom
 * reports for questions nobody pre-built, and the cadences that produce the packages
 * unattended — nesting any under another is what produced the old sidebar, where
 * Governance Analytics sat beside Reports as though it were a separate product.
 *
 * Each tab owns its own toolbar, because a filter that belongs to the register grid means
 * nothing over the schedule table and a shared one would be greyed out three quarters of
 * the time.
 *
 * The active tab lives in the URL, so a link to the schedules tab is a link to the
 * schedules tab and Back does what it looks like it does.
 */
export function ReportsHubMainScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = params.get('tab');
  const tab: HubTab = isTab(fromUrl) ? fromUrl : 'operational';

  const setTab = (next: string) => {
    const q = new URLSearchParams(Array.from(params.entries()));
    if (next === 'operational') q.delete('tab');
    else q.set('tab', next);
    const qs = q.toString();
    router.replace(qs ? `/iga/reports?${qs}` : '/iga/reports', { scroll: false });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">Reports</h1>
        <p className="mt-1 text-body text-text-secondary">
          Operational registers, compliance evidence and the schedules that produce it — from one catalogue.
        </p>
      </div>

      <div className="shrink-0">
        <Tabs
          aria-label="Reports sections"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'operational', label: 'Operational' },
            { value: 'compliance', label: 'Compliance' },
            { value: 'custom', label: 'Custom Analytics' },
            { value: 'schedules', label: 'Schedules' },
          ]}
        />
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto pr-0.5 pt-5">
        {tab === 'operational' && <OperationalReportsTab />}
        {tab === 'compliance' && <CompliancePackagesTab />}
        {tab === 'custom' && <CustomAnalyticsTab />}
        {tab === 'schedules' && <SchedulesTab />}
      </div>
    </div>
  );
}
