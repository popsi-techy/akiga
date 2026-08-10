'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { DatePicker, formatDateShort } from '@ds/components';

export default function DatePickerDocs() {
  const [value, setValue] = React.useState('2026-08-20');
  const [bounded, setBounded] = React.useState('');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Date Picker"
        description="One field showing a readable date, opening a month grid. Replaces the native date input, whose field text, calendar icon and popup are all browser chrome — the format follows the OS locale and none of it can be themed, so it never matches the rest of the system."
      />

      <Section
        title="Field and grid"
        description="The value is YYYY-MM-DD — the same shape a native date input produces, so callers and stored data are unaffected by the swap."
      >
        <Example label="Selected">
          <div className="w-[240px]">
            <DatePicker ariaLabel="Valid until" value={value} onChange={setValue} />
          </div>
          <span className="text-body-sm text-text-secondary">
            value: <Code>{value}</Code> · display: {formatDateShort(value)}
          </span>
        </Example>
        <Example label="Empty, with a min bound — earlier days render disabled">
          <div className="w-[240px]">
            <DatePicker ariaLabel="Start date" value={bounded} onChange={setBounded} min="2026-08-09" />
          </div>
        </Example>
        <Example label="Sizes and disabled">
          <div className="w-[220px]">
            <DatePicker ariaLabel="Small" size="sm" value={value} onChange={setValue} />
          </div>
          <div className="w-[220px]">
            <DatePicker ariaLabel="Medium" size="md" value={value} onChange={setValue} />
          </div>
          <div className="w-[220px]">
            <DatePicker ariaLabel="Disabled" value={value} onChange={setValue} disabled />
          </div>
        </Example>
      </Section>

      <Section
        title="Dates are parsed as strings, never through Date"
        description="Constructing a Date from YYYY-MM-DD interprets it as UTC midnight, which lands on the previous day for anyone west of Greenwich. The component parses and formats the string directly, so a date means the same day in every timezone. formatDateShort is exported so a stored date can be labelled identically elsewhere."
      >
        <PropsTable
          rows={[
            { name: 'value', type: 'string', description: 'YYYY-MM-DD, or empty for no selection.' },
            { name: 'onChange', type: '(value: string) => void', description: 'Fires with the new YYYY-MM-DD.' },
            { name: 'min', type: 'string', description: 'Earliest selectable date. Earlier days render disabled.' },
            { name: 'max', type: 'string', description: 'Latest selectable date.' },
            { name: 'size', type: "'sm' | 'md'", default: "'sm'", description: 'Matches the Input/Select control-height scale.' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Non-interactive field.' },
            { name: 'ariaLabel', type: 'string', description: 'Accessible name — required when there is no visible label.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Set min on anything forward-looking — an expiry, a start date — so the past is unreachable.',
            'Use formatDateShort to label a stored date so the field and the read-only view agree.',
            'Match size to the surrounding controls: sm in toolbars, md in standalone forms.',
            'Give it an ariaLabel whenever the visible label lives outside the component.',
          ]}
          donts={[
            'Don’t fall back to <input type="date"> — it cannot be themed and its format follows the OS.',
            'Don’t pass a Date or an ISO datetime; the contract is a YYYY-MM-DD string.',
            'Don’t use it for a date range — render two fields and bound the second with min.',
            'Don’t construct a Date from the value to compare it; string comparison sorts correctly.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { DatePicker, formatDateShort } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
