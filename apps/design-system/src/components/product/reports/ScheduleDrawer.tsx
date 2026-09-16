'use client';

import * as React from 'react';
import { Button, Drawer, Input, Select, Switch, useToast } from '@ds/components';
import {
  CADENCE_OPTIONS,
  COMPLIANCE_FRAMEWORKS,
  COVERS_OPTIONS,
  TIMEZONE_OPTIONS,
  type ReportSchedule,
} from '@/data/reports';

/**
 * New or edited subscription.
 *
 * The window is chosen as a **rule** ("previous calendar quarter"), never as two dates.
 * A subscription that fires every quarter with a fixed date range would send the same
 * quarter forever; storing the rule is what makes the same subscription produce the right
 * window every time it fires, and saying so on the field is cheaper than the support
 * ticket that follows from getting it wrong.
 */
export function ScheduleDrawer({
  open,
  schedule,
  onClose,
}: {
  open: boolean;
  /** Present when editing; absent creates. */
  schedule?: ReportSchedule | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const editing = Boolean(schedule);
  const live = COMPLIANCE_FRAMEWORKS.filter((f) => f.href);

  const [name, setName] = React.useState('');
  const [frameworkId, setFrameworkId] = React.useState(live[0]?.id ?? '');
  const [cadence, setCadence] = React.useState<string>('Quarterly');
  const [covers, setCovers] = React.useState(COVERS_OPTIONS[0]);
  const [timezone, setTimezone] = React.useState(TIMEZONE_OPTIONS[0]);
  const [recipients, setRecipients] = React.useState('');
  const [enabled, setEnabled] = React.useState(true);
  const [touched, setTouched] = React.useState(false);

  // Re-seed each time the drawer opens, so editing one subscription never shows the last
  // one's values and creating never shows the one edited before it.
  React.useEffect(() => {
    if (!open) return;
    setName(schedule?.name ?? '');
    setFrameworkId(schedule?.frameworkId ?? live[0]?.id ?? '');
    setCadence(schedule?.cadence ?? 'Quarterly');
    setCovers(schedule?.covers ?? COVERS_OPTIONS[0]);
    setTimezone(schedule?.timezone ?? TIMEZONE_OPTIONS[0]);
    setRecipients((schedule?.recipients ?? []).join(', '));
    setEnabled(schedule?.enabled ?? true);
    setTouched(false);
    // `live` is derived from a module constant and never changes identity in a way that
    // should re-seed a form the reader is already typing in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, schedule]);

  const required = (v: string) => (touched && !v.trim() ? 'Required.' : undefined);

  const save = () => {
    setTouched(true);
    if (!name.trim() || !frameworkId || !recipients.trim()) {
      toast.error('Some required fields are still empty.');
      return;
    }
    toast.success(editing ? 'Subscription updated.' : 'Subscription created. It fires on the next window.');
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? 'Edit subscription' : 'New subscription'}
      subtitle="Generates a sealed package on a cadence and mails a download link."
      width={480}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? 'Save' : 'Create'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Input
          label="Name"
          required
          placeholder="Quarterly SAMA evidence"
          hint="Appears on the download link and in the mail that carries it."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={required(name)}
        />

        <Select
          label="Package template"
          required
          options={live.map((f) => ({ value: f.id, label: `${f.name} (${f.version})` }))}
          value={frameworkId}
          onChange={setFrameworkId}
          placeholder="Select a framework"
          error={touched && !frameworkId ? 'Required.' : undefined}
        />

        <Select
          label="How often it fires"
          required
          options={CADENCE_OPTIONS.map((c) => ({ value: c, label: c }))}
          value={cadence}
          onChange={setCadence}
        />

        <Select
          label="What each run covers"
          required
          helperText="Stored as a rule, not as dates — so every firing produces its own window."
          options={COVERS_OPTIONS.map((c) => ({ value: c, label: c }))}
          value={covers}
          onChange={setCovers}
        />

        <Select
          label="Timezone"
          required
          helperText="Decides when a calendar period starts and ends, not just when the mail arrives."
          options={TIMEZONE_OPTIONS.map((t) => ({ value: t, label: t }))}
          value={timezone}
          onChange={setTimezone}
        />

        <Input
          label="Recipients"
          required
          placeholder="compliance@example.com, ciso@example.com"
          helperText="Comma separated. Each gets the download link, not the package itself."
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          error={required(recipients)}
        />

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-subtle px-4 py-3">
          <div className="min-w-0">
            <p className="text-body-sm-strong text-text-primary">Enabled</p>
            <p className="mt-0.5 text-caption text-text-secondary">
              A disabled subscription keeps its settings and stops firing.
            </p>
          </div>
          <Switch
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            inputProps={{ 'aria-label': 'Enabled' }}
          />
        </div>
      </div>
    </Drawer>
  );
}
