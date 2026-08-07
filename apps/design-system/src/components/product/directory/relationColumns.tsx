'use client';

import * as React from 'react';
import { StatusChip, type Column } from '@ds/components';
import { AppBadge } from '@/components/product/sod/labels';
import type { EntitlementRow, RoleRow, AppAccountRow, UserIdentityRow, ApplicationRow } from '@/data/directory';
import { EntityAvatar, type EntityKind } from './EntityAvatar';
import { RiskScoreChip } from './RiskScoreChip';

/** Reusable relationship-table column sets, so every detail tab lists related
    entities identically (and each is row-clickable for cross-navigation). */

export const entitlementColumns: Column<EntitlementRow>[] = [
  {
    id: 'name',
    header: 'Entitlement',
    sortable: true,
    value: (r) => r.name,
    render: (r) => (
      <div className="flex items-center gap-3">
        <EntityAvatar kind="entitlement" name={r.name} />
        <span className="font-medium text-text-primary">{r.name}</span>
      </div>
    ),
  },
  { id: 'application', header: 'Application', sortable: true, value: (r) => r.applicationName, render: (r) => <span className="text-text-secondary">{r.applicationName}</span> },
  { id: 'risk', header: 'Risk Score', sortable: true, align: 'right', value: (r) => r.risk, render: (r) => <RiskScoreChip score={r.risk} /> },
];

export const applicationColumns: Column<ApplicationRow>[] = [
  {
    id: 'name',
    header: 'Application',
    sortable: true,
    value: (r) => r.name,
    render: (r) => (
      <div className="flex items-center gap-3">
        <EntityAvatar kind="application" name={r.name} />
        <span className="font-medium text-text-primary">{r.name}</span>
      </div>
    ),
  },
  { id: 'description', header: 'Description', value: (r) => r.description, render: (r) => <span className="text-text-secondary">{r.description}</span> },
];

export const accountColumns: Column<AppAccountRow>[] = [
  {
    id: 'name',
    header: 'Account',
    sortable: true,
    value: (r) => r.accountName,
    render: (r) => (
      <div className="flex items-center gap-3">
        <EntityAvatar kind="account" name={r.accountName} />
        <span className="font-medium text-text-primary">{r.accountName}</span>
        {r.orphan && <StatusChip intent="warning" label="Orphan" />}
      </div>
    ),
  },
  { id: 'email', header: 'Email', sortable: true, value: (r) => r.email, render: (r) => <span className="text-text-secondary">{r.email || '—'}</span> },
  {
    id: 'application',
    header: 'Application',
    sortable: true,
    value: (r) => r.applicationName,
    render: (r) => (
      <span className="flex items-center gap-2 text-text-secondary">
        <AppBadge app={r.applicationName} size={20} />
        {r.applicationName}
      </span>
    ),
  },
];

export const peopleColumns: Column<UserIdentityRow>[] = [
  {
    id: 'name',
    header: 'User Identity',
    sortable: true,
    value: (r) => r.name,
    render: (r) => (
      <div className="flex items-center gap-3">
        <EntityAvatar kind="user" name={r.name} />
        <div className="min-w-0">
          <div className="truncate font-medium text-text-primary">{r.name}</div>
          <div className="truncate text-caption text-text-secondary">{r.jobTitle}</div>
        </div>
      </div>
    ),
  },
  { id: 'email', header: 'Email', sortable: true, value: (r) => r.email, render: (r) => <span className="text-text-secondary">{r.email}</span> },
  { id: 'department', header: 'Department', sortable: true, value: (r) => r.department, render: (r) => <span className="text-text-secondary">{r.department}</span> },
];

export function roleColumns(kind: Extract<EntityKind, 'technical-role' | 'business-role'>, header: string): Column<RoleRow>[] {
  return [
    {
      id: 'name',
      header,
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <EntityAvatar kind={kind} name={r.name} />
          <span className="font-medium text-text-primary">{r.name}</span>
        </div>
      ),
    },
    { id: 'description', header: 'Description', value: (r) => r.description, render: (r) => <span className="text-text-secondary">{r.description}</span> },
    { id: 'risk', header: 'Risk Score', sortable: true, align: 'right', value: (r) => r.risk, render: (r) => <RiskScoreChip score={r.risk} /> },
  ];
}
