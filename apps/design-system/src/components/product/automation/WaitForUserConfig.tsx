'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import ChevronRight from '@mui/icons-material/ChevronRight';
import HubOutlined from '@mui/icons-material/HubOutlined';
import { Input, Switch } from '@ds/components';
import type { WaitForUserConfig as WFUConfig } from '@/data/automation-types';
import { listApplications } from '@/data/directory';
import { ConfigSection } from './config-kit';
import { TableSelectDrawer } from './TableSelectDrawer';

/**
 * Wait for user (Flow Control) — poll selected IAM connections on an interval
 * until the identity appears, or until retries are exhausted.
 */
export function WaitForUserConfig({
  config,
  onChange,
}: {
  config: WFUConfig;
  onChange: (next: WFUConfig) => void;
}) {
  const set = (patch: Partial<WFUConfig>) => onChange({ ...config, ...patch });
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const apps = React.useMemo(() => listApplications(), []);
  const selectedApps = apps.filter((a) => config.connectionIds.includes(a.id));
  const summary =
    selectedApps.length > 0
      ? `${selectedApps.length} connection${selectedApps.length === 1 ? '' : 's'} selected`
      : undefined;

  return (
    <div>
      <ConfigSection label="Retries" first>
        {!config.unlimitedRetries && (
          <div className="mb-3">
            <Input
              label="Max retries"
              type="number"
              size="sm"
              value={String(config.maxRetries)}
              onChange={(e) => set({ maxRetries: Math.max(1, Number(e.target.value) || 0) })}
            />
            <p className="mt-2 text-caption leading-5 text-text-secondary">
              Maximum number of checks before the step fails.
            </p>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-body-sm font-medium text-text-primary">Unlimited retries</span>
          <Switch
            size="sm"
            checked={config.unlimitedRetries}
            onChange={(e) => set({ unlimitedRetries: e.target.checked })}
            inputProps={{ 'aria-label': 'Unlimited retries' }}
          />
        </div>
      </ConfigSection>

      <ConfigSection label="Retry Interval">
        <div className="grid grid-cols-3 gap-2.5">
          {(['days', 'hours', 'minutes'] as const).map((unit) => (
            <Input
              key={unit}
              label={unit[0].toUpperCase() + unit.slice(1)}
              type="number"
              size="sm"
              value={String(config[unit])}
              onChange={(e) => set({ [unit]: Math.max(0, Number(e.target.value) || 0) } as Partial<WFUConfig>)}
            />
          ))}
        </div>
        <p className="mt-3 text-caption leading-5 text-text-secondary">
          The workflow waits this long, then checks whether the user exists in every selected
          connection before continuing.
        </p>
      </ConfigSection>

      <ConfigSection label="IAM connections">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setDrawerOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setDrawerOpen(true);
            }
          }}
          className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-canvas transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
        >
          <div className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-dashed border-border text-icon transition-colors group-hover:border-brand group-hover:text-brand">
              <AddIcon sx={{ fontSize: 18 }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body-sm font-medium text-text-primary">
                {selectedApps.length ? 'Edit IAM connections' : 'Select IAM connections'}
              </span>
              {summary && <span className="block truncate text-caption text-text-secondary">{summary}</span>}
            </span>
            <ChevronRight sx={{ fontSize: 18 }} className="shrink-0 text-icon" />
          </div>
          {selectedApps.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2.5">
              {selectedApps.slice(0, 2).map((a) => (
                <span
                  key={a.id}
                  className="inline-flex max-w-[140px] items-center rounded-md border border-border bg-subtle px-2 py-1 text-caption font-medium text-text-primary"
                >
                  <span className="truncate">{a.name}</span>
                </span>
              ))}
              {selectedApps.length > 2 && (
                <span className="inline-flex shrink-0 items-center rounded-md border border-border bg-subtle px-1.5 py-1 text-caption font-semibold text-text-secondary">
                  +{selectedApps.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        {config.connectionIds.length === 0 && (
          <p className="mt-2 text-caption leading-5 text-[var(--ds-color-status-danger-fg)]">
            Select at least one IAM connection.
          </p>
        )}
      </ConfigSection>

      <TableSelectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Select IAM connections"
        subtitle="Choose the systems where the user must exist before the workflow continues."
        icon={<HubOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        nameHeader="Connection"
        entity="connection"
        showRisk={false}
        rows={apps.map((a) => ({ id: a.id, name: a.name, description: a.description }))}
        selectedIds={config.connectionIds}
        onApply={(ids) => set({ connectionIds: ids })}
      />
    </div>
  );
}

export default WaitForUserConfig;
