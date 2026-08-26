'use client';

import * as React from 'react';
import { PageHeader, Section, PropsTable, DoDont } from '@/components/docs/primitives';
import { InfoRow, InfoRowGroup, OverflowChips } from '@ds/components';

const APPS = [
  { id: 'okta', name: 'Okta' },
  { id: 'sf', name: 'Salesforce' },
  { id: 'gh', name: 'GitHub' },
  { id: 'aws', name: 'AWS' },
  { id: 'sap', name: 'SAP S/4HANA Finance' },
];

export default function OverflowChipsDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Overflow Chips"
        description="A few named things plus a +n that reveals the rest. For rows whose height must not change with their contents."
      />

      <Section
        title="One value, not several"
        description="With an overflow the whole set sits in one tinted pill: the named chip and the +n are two halves of a single answer, and as loose chips they read as two separate values. When everything fits there is nothing to group, so a lone chip stays a lone chip."
      >
        <div className="flex flex-col items-start gap-4">
          <OverflowChips items={APPS} />
          <OverflowChips items={APPS} max={2} />
          <OverflowChips items={APPS.slice(0, 1)} />
          <OverflowChips items={[]} emptyLabel="No applications" />
        </div>
      </Section>

      <Section
        title="In a row that must keep its height"
        description="The reason it exists: a label/value row or a table cell where wrapping to a second line would make one row taller than its neighbours, and an ellipsis would hide the count entirely. Hover or focus the +n to see what did not fit."
      >
        <div className="max-w-md rounded-xl border border-border">
          <InfoRowGroup>
            <InfoRow icon={<span />} label="Applications" valueWrap value={<OverflowChips items={APPS} />} />
            <InfoRow icon={<span />} label="Entitlements" valueWrap value={<OverflowChips items={APPS.slice(0, 2)} />} />
          </InfoRowGroup>
        </div>
      </Section>

      <Section title="Guidance">
        <DoDont
          dos={[
            'Name one or two items — that is what makes the set concrete rather than a number.',
            'Use it wherever a row must keep a fixed height: table cells, label/value rows, a summary beside a button.',
            'Leave the +n reachable by keyboard; it is the only way to see the rest.',
          ]}
          donts={[
            'Raise `max` until the row can wrap — a wrap is the thing this component exists to prevent.',
            'Give the +n the same outline as a named chip: it is a remainder, not an item.',
            'Use it where the full list is the point. A list of twenty users belongs in a table, not behind a +19.',
          ]}
        />
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'items', type: '{ id: string; name: string }[]', description: 'The full set. Order is respected — the first `max` are named.' },
            { name: 'max', type: 'number', default: '1', description: 'How many to name before collapsing the rest into +n.' },
            { name: 'emptyLabel', type: 'string', default: "'None'", description: 'Shown when there is nothing to name.' },
            { name: 'renderItem', type: '(item) => ReactNode', default: '—', description: 'Custom chip. Use when the chip already has its own chrome (app mark + name). Those stay ungrouped so two pills are not nested.' },
            { name: 'tone', type: "'default' | 'onSubtle'", default: "'default'", description: 'onSubtle inverts the grouped chrome for a grey well: a white capsule, grey named pills. Use it on SettingsRow surface="subtle".' },
          ]}
        />
      </Section>
    </>
  );
}
