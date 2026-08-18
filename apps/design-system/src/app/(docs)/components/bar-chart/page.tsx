'use client';

import * as React from 'react';
import { PageHeader, Section, PropsTable, DoDont } from '@/components/docs/primitives';
import { BarChart, DonutChart } from '@ds/components';

const USAGE = [
  { label: 'Salesforce', value: 182, color: 'var(--ds-color-status-info-fill)' },
  { label: 'Workday', value: 161, color: 'var(--ds-color-status-info-fill)' },
  { label: 'SAP S/4HANA Finance', value: 98, color: 'var(--ds-color-status-info-fill)' },
  { label: 'ServiceNow', value: 74, color: 'var(--ds-color-status-info-fill)' },
  { label: 'Snowflake', value: 0, color: 'var(--ds-color-status-info-fill)' },
];

const RISK = [
  { label: 'Critical', value: 4, color: 'var(--ds-color-status-danger-fill)' },
  { label: 'High', value: 17, color: 'var(--ds-color-status-caution-fill)' },
  { label: 'Medium', value: 31, color: 'var(--ds-color-status-warning-fill)' },
  { label: 'Low', value: 52, color: 'var(--ds-color-status-info-fill)' },
];

export default function BarChartDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Bar Chart"
        description="A horizontal, ranked comparison. The sibling of Donut Chart — and not interchangeable with it."
      />

      <Section
        title="Which of these is biggest"
        description="Reach for it whenever the categories are named things rather than parts of one quantity — applications, departments, policies. Horizontal, not vertical, because the labels are names: a vertical chart has to rotate or truncate them, and a name the reader cannot read makes the bar above it meaningless."
      >
        <div className="max-w-md rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 text-body-sm-strong text-text-secondary">Accounts held by Finance</div>
          <BarChart bars={USAGE} ariaLabel="Accounts held by Finance, by application" />
        </div>
        <p className="mt-3 max-w-2xl text-body-sm text-text-secondary">
          One colour for a single-series ranking. These are all the same kind of thing, differing only in
          count — giving each its own hue implies the hues mean something. Note Snowflake at zero: it keeps
          its row and draws no bar, because inventing a stub for it would be a lie.
        </p>
      </Section>

      <Section
        title="Donut or bar?"
        description="They answer different questions, and picking the wrong one is the most common charting mistake here. A donut answers “how does this whole split up”; a bar answers “which of these is biggest”. The same four risk tiers work either way — but five application names as a donut would be five near-identical wedges nobody can tell apart without consulting a legend."
      >
        <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 text-body-sm-strong text-text-secondary">Parts of a whole → donut</div>
            <DonutChart segments={RISK} size={150} thickness={20} centerValue={104} centerLabel="entitlements" />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 text-body-sm-strong text-text-secondary">A ranking → bar</div>
            <BarChart bars={RISK} ariaLabel="Entitlements by risk tier" />
          </div>
        </div>
      </Section>

      <Section title="Guidance">
        <DoDont
          dos={[
            'Sort descending before passing the bars in — the component keeps your order, and a ranking that is not ranked is just a list.',
            'Use one colour for a single series. Reserve per-bar colour for bars that genuinely differ in kind, like risk tiers.',
            'Pass `max` when two charts sit side by side, so they share a scale.',
            'Keep it to about eight bars. Beyond that the labels win and the comparison stops being readable.',
          ]}
          donts={[
            'Don’t colour a single-series ranking off the status ramp. The biggest bar comes out red and the reader concludes it is the dangerous one, when the chart is only counting.',
            'Don’t use it for parts of a whole where the total matters — that is Donut Chart, which can show the total in its centre.',
            'Don’t reach for it to show one proportion. That is `Meter`.',
            'Don’t hide the track. Without it a short bar reads as a small thing rather than a small share of the same scale.',
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'bars', type: '{ label, value, color }[]', description: 'Order is respected — sort before passing. `color` takes a token.' },
            { name: 'max', type: 'number', default: 'largest value', description: 'The value the longest bar represents. Pass it to put two charts on one scale.' },
            { name: 'suffix', type: 'string', default: "''", description: 'Rendered after each value, e.g. ‘%’.' },
            { name: 'ariaLabel', type: 'string', default: '—', description: 'Accessible name for the group. The labels and values are real text, so no aria description of the dataset is needed.' },
          ]}
        />
      </Section>
    </>
  );
}
