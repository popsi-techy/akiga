'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Card, StatusChip, Switch, useToast } from '@ds/components';
import { ConnectionEventDrawer } from './ConnectionEventDrawer';
import {
  EVENT_KINDS,
  listConnectionEvents,
  saveConnectionEvent,
  type ConnectionEvent,
  type EventKind,
} from '@/data/connection-events';
import type { AppAuthorization } from '@/data/provisioning-auth';

/**
 * Connection Configuration — the calls IGA makes once it can sign in.
 *
 * The catalog is fixed: one inbound/outbound slot per event type. Turning a
 * slot on opens the same event drawer as before, pre-filled for that type.
 * Turning it off keeps the configuration but stops the call.
 */
export function ConnectionConfiguration({
  applicationId,
  applicationName: _applicationName,
  authorizations,
  onChanged,
}: {
  applicationId: string;
  applicationName: string;
  authorizations: AppAuthorization[];
  onChanged?: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = React.useState<ConnectionEvent[]>([]);
  const [editing, setEditing] = React.useState<ConnectionEvent | null>(null);
  const [drawerKind, setDrawerKind] = React.useState<EventKind | null>(null);

  const refresh = React.useCallback(() => setRows(listConnectionEvents(applicationId)), [applicationId]);
  React.useEffect(() => refresh(), [refresh]);

  const eventFor = (kind: EventKind) => rows.find((r) => r.kind === kind);

  const openSlot = (kind: EventKind) => {
    setEditing(eventFor(kind) ?? null);
    setDrawerKind(kind);
  };

  const toggleSlot = (kind: EventKind, on: boolean) => {
    const existing = eventFor(kind);
    if (on) {
      openSlot(kind);
      return;
    }
    if (!existing) return;
    saveConnectionEvent({ ...existing, enabled: false });
    refresh();
    onChanged?.();
    toast.info('Event disabled. It will not run.');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex shrink-0 items-start gap-2.5 rounded-lg border border-[var(--ds-color-status-info-border)] bg-[var(--ds-color-status-info-subtle)] p-4">
        <InfoOutlined
          sx={{ fontSize: 18, color: 'var(--ds-color-status-info-fg)' }}
          className="mt-0.5 shrink-0"
          aria-hidden
        />
        <p className="text-body-sm text-text-secondary">
          <span className="text-body-sm-strong text-text-primary">These settings are retroactive.</span> The next sync
          applies them to accounts and entitlements already imported from this application, not only to new ones —
          existing records are rewritten to match.
        </p>
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto">
        <Card padding="none">
          <div className="divide-y divide-border">
            {EVENT_KINDS.map((slot) => {
              const event = eventFor(slot.value);
              const on = Boolean(event?.enabled);
              return (
                <div key={slot.value} className="flex items-center justify-between gap-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => openSlot(slot.value)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
                  >
                    <span className="truncate text-body-sm-medium text-text-primary">{slot.label}</span>
                    <StatusChip
                      intent={slot.direction === 'inbound' ? 'info' : 'success'}
                      label={slot.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                    />
                  </button>
                  <Switch
                    checked={on}
                    onChange={(e) => toggleSlot(slot.value, e.target.checked)}
                    inputProps={{ 'aria-label': `${on ? 'Disable' : 'Enable'} ${slot.label}` }}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <ConnectionEventDrawer
        open={drawerKind !== null}
        applicationId={applicationId}
        authorizations={authorizations}
        existing={editing}
        initialKind={drawerKind ?? undefined}
        onClose={() => {
          setDrawerKind(null);
          setEditing(null);
        }}
        onSaved={() => {
          setDrawerKind(null);
          setEditing(null);
          refresh();
          onChanged?.();
        }}
      />
    </div>
  );
}
