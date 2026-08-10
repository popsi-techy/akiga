'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { TimePicker, formatTime12 } from '@ds/components';

export default function TimePickerDocs() {
  const [value, setValue] = React.useState('09:30');
  const [fine, setFine] = React.useState('14:05');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Time Picker"
        description="One field showing a 12-hour time, opening a three-column picker — hour, minute, AM/PM. The value stays 24-hour HH:MM, so what is stored never depends on how it is displayed."
      />

      <Section
        title="Three short columns beat one long list"
        description="A single Select would have to enumerate every slot, which is a long scroll. Splitting hour, minute and period inside one popover keeps the field compact and every list short enough to scan."
      >
        <Example label="Default — 10-minute steps">
          <div className="w-[200px]">
            <TimePicker ariaLabel="Start time" value={value} onChange={setValue} />
          </div>
          <span className="text-body-sm text-text-secondary">
            value: <Code>{value}</Code> · display: {formatTime12(value)}
          </span>
        </Example>
        <Example label="minuteStep=5">
          <div className="w-[200px]">
            <TimePicker ariaLabel="Fine-grained time" value={fine} onChange={setFine} minuteStep={5} />
          </div>
        </Example>
        <Example label="Sizes and disabled">
          <div className="w-[190px]">
            <TimePicker ariaLabel="Small" size="sm" value={value} onChange={setValue} />
          </div>
          <div className="w-[190px]">
            <TimePicker ariaLabel="Medium" size="md" value={value} onChange={setValue} />
          </div>
          <div className="w-[190px]">
            <TimePicker ariaLabel="Disabled" value={value} onChange={setValue} disabled />
          </div>
        </Example>
      </Section>

      <Section
        title="Why not the native time input"
        description="input type=time renders 12- or 24-hour purely from the browser locale, with no way to force the format. A governance product that says “9:30 AM” in its copy cannot have a field that says 09:30 on someone else's machine. formatTime12 is exported so a stored time is labelled the same way wherever it appears."
      >
        <PropsTable
          rows={[
            { name: 'value', type: 'string', description: '24-hour HH:MM. Display is 12-hour; storage is not.' },
            { name: 'onChange', type: '(value: string) => void', description: 'Fires with the new 24-hour HH:MM.' },
            { name: 'minuteStep', type: 'number', default: '10', description: 'Minutes offered in the minute column.' },
            { name: 'size', type: "'sm' | 'md'", default: "'sm'", description: 'Matches the Input/Select control-height scale.' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Non-interactive field.' },
            { name: 'ariaLabel', type: 'string', description: 'Accessible name — required when there is no visible label.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Keep minuteStep coarse (10 or 15) unless the task genuinely needs precision.',
            'Use formatTime12 anywhere a stored time is displayed read-only.',
            'Pair with DatePicker at the same size when a form asks for both.',
            'Give it an ariaLabel whenever the visible label lives outside the component.',
          ]}
          donts={[
            'Don’t fall back to <input type="time"> — its format follows the browser locale.',
            'Don’t store the 12-hour display string; the contract is 24-hour HH:MM.',
            'Don’t set minuteStep to 1 in a scheduling form — 60 rows is not a picker.',
            'Don’t use it for durations; a duration is a number with a unit, not a time.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { TimePicker, formatTime12 } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
