'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Input, NavList } from '@ds/components';
import {
  COMPLIANCE_FRAMEWORKS,
  OPERATIONAL_REPORTS,
  REPORT_CATEGORY_LABEL,
  type ComplianceFramework,
  type OperationalReport,
} from '@/data/reports';
import { listReportsV2, type ReportV2 } from '@/data/governance-analytics-v2';
import { ReportsActivityBand } from './ReportsActivityBand';
import { OperationalReportsTab } from './OperationalReportsTab';
import { CompliancePackagesTab } from './CompliancePackagesTab';
import { CustomAnalyticsTab } from './CustomAnalyticsTab';

type HubSection = 'operational' | 'compliance' | 'custom';

const SECTIONS: { id: HubSection; label: string }[] = [
  { id: 'operational', label: 'Operational' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'custom', label: 'Custom reports' },
];

const isSection = (v: string | null): v is HubSection =>
  SECTIONS.some((s) => s.id === v);

const matches = (q: string, ...fields: (string | undefined)[]) =>
  !q || fields.some((f) => (f ?? '').toLowerCase().includes(q));

/**
 * Reports — a catalogue with a pulse.
 *
 * Two things were wrong with the four-tab version. The row read as four peers when only
 * three of them were: the registers, the packages and the custom reports are things you
 * *get*, and Schedules is the machine that produces them — a mechanism filed beside its
 * own output. And the page had no sense of time at all, so the fact that a live quarterly
 * subscription skipped its last run — true in the data, and the single most important
 * sentence on this screen — was three clicks away.
 *
 * So: an activity band on top for what happens next and what is wrong, and a **rail**
 * instead of tabs for what you can open.
 *
 * **Why a rail.** It carries each section's size before you click it, which a tab cannot;
 * it grows downward, so a fifth kind of report is a new line rather than a tab row that
 * overflows; and it stays put while the content scrolls, so the reader never loses where
 * they are in the catalogue. Every report is still one click from here — the alternative
 * on the table, a Reports → Operational → register hop, bought nothing and charged a click
 * on every visit forever.
 *
 * **One search over everything.** The field is above the split, not inside a section,
 * because the reader's question is "do we have a report about orphan accounts", not "do we
 * have one in this tab". Typing narrows all three sections at once and the rail counts
 * become match counts, so a term with nothing here reads as three zeros rather than as an
 * empty grid that might be the wrong tab. Results stay in their own section and their own
 * shape — cards for registers, readiness cards for frameworks, a table for custom reports.
 * One merged result table would have had to flatten three things that share a name and
 * nothing else.
 *
 * **Schedules is not here.** It lives at `/iga/reports/schedules`, reached from the Next
 * download tile and from a framework card. You go there to change a cadence, which is
 * administration, not reading a report.
 *
 * The section lives in the URL — still as `tab`, because links into `?tab=custom` and
 * `?tab=compliance` are already out there in breadcrumbs — so a link to a section is a
 * link to a section and Back does what it looks like it does.
 */
export function ReportsHubMainScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = params.get('tab');
  const section: HubSection = isSection(fromUrl) ? fromUrl : 'operational';

  const [query, setQuery] = React.useState('');
  // localStorage-backed, so read after mount. `null` is "not known yet", which keeps the
  // rail's count pill off and the table in its skeleton rather than asserting a zero the
  // store is about to contradict.
  const [custom, setCustom] = React.useState<ReportV2[] | null>(null);

  React.useEffect(() => setCustom(listReportsV2()), []);

  const setSection = (next: string) => {
    const q = new URLSearchParams(Array.from(params.entries()));
    if (next === 'operational') q.delete('tab');
    else q.set('tab', next);
    const qs = q.toString();
    router.replace(qs ? `/iga/reports?${qs}` : '/iga/reports', { scroll: false });
  };

  const q = query.trim().toLowerCase();

  /*
    Filtered once, here, rather than in each section — the rail has to count the same rows
    the section shows, and two copies of "does this match" is how a count starts disagreeing
    with the list under it.

    A register matches on its category label as well as its text, so "governance" finds the
    three governance registers even though none of them says the word.
  */
  const operational: OperationalReport[] = OPERATIONAL_REPORTS.filter((r) =>
    matches(q, r.name, r.description, REPORT_CATEGORY_LABEL[r.category]),
  );
  const frameworks: ComplianceFramework[] = COMPLIANCE_FRAMEWORKS.filter((f) =>
    matches(q, f.name, f.version, f.description),
  );
  const customReports: ReportV2[] | null =
    custom === null ? null : custom.filter((r) => matches(q, r.name, r.description));

  const counts: Record<HubSection, number | undefined> = {
    operational: operational.length,
    compliance: frameworks.length,
    custom: customReports?.length,
  };

  const active = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const elsewhere = SECTIONS.filter((s) => s.id !== section && (counts[s.id] ?? 0) > 0);
  const noMatchesHere = q.length > 0 && counts[section] === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h2 text-text-primary">Reports</h1>
          <p className="mt-1 text-body text-text-secondary">
            Operational registers, compliance evidence and the schedules that produce it — from one catalogue.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            aria-label="Search all reports"
            placeholder="Search reports"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            startAdornment={<SearchOutlined sx={{ fontSize: 18 }} className="text-icon-subtle" />}
          />
        </div>
      </div>

      <div className="shrink-0">
        <ReportsActivityBand />
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-5 md:flex-row md:gap-6">
        <div className="md:w-52 md:shrink-0">
          <NavList
            ariaLabel="Reports sections"
            value={section}
            onChange={setSection}
            items={SECTIONS.map((s) => ({ id: s.id, label: s.label, count: counts[s.id] }))}
          />
        </div>

        <div
          role="tabpanel"
          aria-label={active.label}
          className="ds-scroll min-h-0 flex-1 overflow-y-auto pr-0.5"
        >
          {noMatchesHere ? (
            <NoMatches
              query={query.trim()}
              section={active.label}
              elsewhere={elsewhere.map((s) => ({ ...s, count: counts[s.id] ?? 0 }))}
              onGo={setSection}
            />
          ) : (
            <>
              {section === 'operational' && <OperationalReportsTab reports={operational} filtered={q.length > 0} />}
              {section === 'compliance' && <CompliancePackagesTab frameworks={frameworks} />}
              {section === 'custom' && <CustomAnalyticsTab reports={customReports} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Nothing matched in the section being looked at — but something matched next door.
 *
 * A search that finds a register while the reader is on Compliance has to say so, or the
 * reader concludes the product has no such report. The other sections are offered by name
 * and count, so the next click is the answer rather than a guess.
 */
function NoMatches({
  query,
  section,
  elsewhere,
  onGo,
}: {
  query: string;
  section: string;
  elsewhere: { id: string; label: string; count: number }[];
  onGo: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
      <p className="text-body-strong text-text-primary">
        No {section.toLowerCase()} match “{query}”
      </p>
      {elsewhere.length > 0 ? (
        <>
          <p className="mx-auto mt-1 max-w-md text-body-sm text-text-secondary">
            There {elsewhere.length === 1 ? 'is a match' : 'are matches'} in another section.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {elsewhere.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onGo(s.id)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-body-sm-medium text-text-primary transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
              >
                {s.label} <span className="tabular-nums text-text-secondary">{s.count}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="mx-auto mt-1 max-w-md text-body-sm text-text-secondary">
          Nothing in the catalogue matches, in any section. Custom Analytics is where a question
          nobody pre-built gets answered.
        </p>
      )}
    </div>
  );
}
