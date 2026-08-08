'use client';

import * as React from 'react';
import AccessTime from '@mui/icons-material/AccessTime';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Button, Input, Select, StatusChip, Tooltip, useToast } from '@ds/components';
import {
  getAdvancedConfig,
  riskChipFromScore,
  setAdvancedConfig,
  type EAAdvancedConfig,
  type EAWeekday,
} from '@/data/emergency-access';

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata IST' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York EST' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles PST' },
  { value: 'Europe/London', label: 'Europe/London GMT' },
];

const DAY_PRESETS: { value: string; label: string; days: EAWeekday[] }[] = [
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  { value: 'weekends', label: 'Weekends (Sat–Sun)', days: ['sat', 'sun'] },
  {
    value: 'every-day',
    label: 'Every day',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  },
];

function dayPresetValue(days: EAWeekday[]): string {
  const key = [...days].sort().join(',');
  return DAY_PRESETS.find((preset) => [...preset.days].sort().join(',') === key)?.value ?? 'custom';
}

function dailyWindowDuration(start: string, end: string): string {
  const parse = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
  };
  const startMinutes = parse(start);
  const endMinutes = parse(end);
  if (startMinutes == null || endMinutes == null) return 'Duration unavailable';

  const minutes = (endMinutes - startMinutes + 24 * 60) % (24 * 60) || 24 * 60;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} hr${hours === 1 ? '' : 's'}`;
  if (hours === 0) return `${remainingMinutes} mins`;
  return `${hours} hr${hours === 1 ? '' : 's'} ${remainingMinutes} mins`;
}

function ConfigRow({
  label,
  required,
  tip,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  tip: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'flex min-h-[52px] items-center justify-between gap-4 rounded-lg bg-subtle px-4 py-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="text-body-sm-strong text-text-primary">
          {label}
          {required ? <span className="text-danger">*</span> : null}
        </span>
        <Tooltip title={tip} placement="top">
          <span
            className="inline-flex shrink-0 text-icon"
            tabIndex={0}
            aria-label={`${label} information`}
          >
            <InfoOutlined sx={{ fontSize: 16 }} />
          </span>
        </Tooltip>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

function CompactNumber({
  value,
  onChange,
  min = 0,
  max = 999,
  ariaLabel,
  widthClass = 'w-[72px]',
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  ariaLabel: string;
  widthClass?: string;
}) {
  return (
    <div className={widthClass}>
      <Input
        type="number"
        size="sm"
        fullWidth
        inputProps={{ min, max, 'aria-label': ariaLabel }}
        value={String(value)}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isNaN(n)) return;
          onChange(Math.min(max, Math.max(min, n)));
        }}
      />
    </div>
  );
}

function DurationField({
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  showMinutes = false,
  ariaLabel,
}: {
  hours: number;
  minutes?: number;
  onHoursChange: (n: number) => void;
  onMinutesChange?: (n: number) => void;
  showMinutes?: boolean;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <CompactNumber
        value={hours}
        onChange={onHoursChange}
        min={0}
        max={168}
        ariaLabel={`${ariaLabel} hours`}
        widthClass="w-[64px]"
      />
      <span className="text-caption text-text-secondary">hrs</span>
      {showMinutes && onMinutesChange != null && minutes != null && (
        <>
          <span className="text-caption text-text-tertiary">:</span>
          <CompactNumber
            value={minutes}
            onChange={onMinutesChange}
            min={0}
            max={59}
            ariaLabel={`${ariaLabel} minutes`}
            widthClass="w-[64px]"
          />
          <span className="text-caption text-text-secondary">mins</span>
        </>
      )}
      <AccessTime sx={{ fontSize: 18, color: 'var(--ds-color-icon-default)' }} aria-hidden />
    </div>
  );
}

export function AdvancedConfigurationTab({ eaId }: { eaId: string }) {
  const toast = useToast();
  const [config, setConfig] = React.useState<EAAdvancedConfig>(() => getAdvancedConfig(eaId));
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    setConfig(getAdvancedConfig(eaId));
    setDirty(false);
  }, [eaId]);

  const update = <K extends keyof EAAdvancedConfig>(key: K, value: EAAdvancedConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const risk = riskChipFromScore(config.riskScore);

  const save = () => {
    setAdvancedConfig(eaId, config);
    setDirty(false);
    toast.success('Advanced configuration saved');
  };

  return (
    <div className="ds-scroll h-full overflow-y-auto pr-0.5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-h5 text-text-primary">Advanced Configuration</h2>
        <Button onClick={save} disabled={!dirty}>
          Save
        </Button>
      </div>

      <section className="mb-8">
        <h3 className="mb-3 text-body-strong text-text-primary">General</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <ConfigRow
            label="Risk Score"
            required
            tip="Numeric risk rating for this emergency access profile. The severity badge updates from the score."
          >
            <StatusChip intent={risk.intent} label={risk.label} dot={false} />
            <CompactNumber
              value={config.riskScore}
              onChange={(n) => update('riskScore', n)}
              min={0}
              max={100}
              ariaLabel="Risk score"
            />
          </ConfigRow>

          <ConfigRow
            label="Maximum Duration Hours"
            required
            tip="Longest session length a requester can ask for when activating this access."
          >
            <DurationField
              hours={config.maxDurationHrs}
              onHoursChange={(n) => update('maxDurationHrs', n)}
              ariaLabel="Maximum duration"
            />
          </ConfigRow>

          <ConfigRow
            label="Maximum Concurrent Users"
            tip="How many people may hold an active session for this access at the same time."
          >
            <CompactNumber
              value={config.maxConcurrent}
              onChange={(n) => update('maxConcurrent', n)}
              min={1}
              max={500}
              ariaLabel="Maximum concurrent users"
            />
          </ConfigRow>

          <ConfigRow
            label="Cooldown Period"
            tip="Waiting period after a session ends before the same user can request this access again."
          >
            <DurationField
              hours={config.cooldownHrs}
              minutes={config.cooldownMins}
              onHoursChange={(n) => update('cooldownHrs', n)}
              onMinutesChange={(n) => update('cooldownMins', n)}
              showMinutes
              ariaLabel="Cooldown period"
            />
          </ConfigRow>

          <ConfigRow
            label="Maximum Requests Per Day"
            tip="Daily cap on how many times this emergency access can be requested."
          >
            <CompactNumber
              value={config.maxRequestsPerDay}
              onChange={(n) => update('maxRequestsPerDay', n)}
              min={1}
              max={100}
              ariaLabel="Maximum requests per day"
            />
          </ConfigRow>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-body-strong text-text-primary">Time</h3>
        <div className="rounded-lg bg-subtle p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-body-sm-strong text-text-primary">Access schedule</h4>
                <Tooltip
                  title="Timezone, days, and daily window when this emergency access may be requested."
                  placement="top"
                >
                  <span
                    className="inline-flex text-icon"
                    tabIndex={0}
                    aria-label="Access schedule information"
                  >
                    <InfoOutlined sx={{ fontSize: 16 }} />
                  </span>
                </Tooltip>
              </div>
              <p className="mt-0.5 text-caption text-text-secondary">
                The displayed duration updates automatically from the start and end times.
              </p>
            </div>
            <StatusChip
              intent="info"
              dot={false}
              label={`${dailyWindowDuration(config.windowStart, config.windowEnd)} daily`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px_minmax(280px,1fr)_200px]">
            <Select
              label="Timezone"
              options={TIMEZONES}
              value={config.timezone}
              onChange={(v) => update('timezone', v)}
              size="sm"
              fullWidth
            />

            <div>
              <p className="mb-1.5 text-body-sm-strong text-text-primary">
                Daily access window
              </p>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    type="time"
                    size="sm"
                    fullWidth
                    value={config.windowStart}
                    onChange={(e) => update('windowStart', e.target.value)}
                    inputProps={{ 'aria-label': 'Window start time' }}
                  />
                </div>
                <span className="shrink-0 text-caption text-text-secondary">to</span>
                <div className="min-w-0 flex-1">
                  <Input
                    type="time"
                    size="sm"
                    fullWidth
                    value={config.windowEnd}
                    onChange={(e) => update('windowEnd', e.target.value)}
                    inputProps={{ 'aria-label': 'Window end time' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <Select
                label="Allowed days"
                options={[
                  ...DAY_PRESETS.map(({ value, label }) => ({ value, label })),
                  ...(dayPresetValue(config.days) === 'custom'
                    ? [{ value: 'custom', label: 'Custom days', disabled: true }]
                    : []),
                ]}
                value={dayPresetValue(config.days)}
                onChange={(value) => {
                  const preset = DAY_PRESETS.find((item) => item.value === value);
                  if (preset) update('days', [...preset.days]);
                }}
                size="sm"
                fullWidth
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdvancedConfigurationTab;
