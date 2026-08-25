'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import LaptopOutlined from '@mui/icons-material/LaptopOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import { Drawer, Tabs, Avatar, type TabItem } from '@ds/components';
import { getAccess, getSodApp } from '@/data/sod';
import type { SodReview, SodAccess } from '@/data/sod-types';
import { RiskScoreChip } from '@/components/product/directory';
import { AppBadge } from './labels';

/** Label / value row inside the Overview card. */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 border-b border-border px-5 py-3.5 last:border-0">
      <span className="w-40 shrink-0 text-body-sm text-text-secondary">{label}</span>
      <span className="min-w-0 flex-1 text-body-sm-strong text-text-primary">{value}</span>
    </div>
  );
}

/** A single access line (entitlement / role / application) in an access tab. Shows the
    canonical name + description, with an optional right slot (Risk Score / count). */
function AccessRow({ icon, title, subtitle, right }: { icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-subtle text-icon">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-body-sm-strong text-text-primary">{title}</div>
        {subtitle && <div className="truncate text-caption text-text-secondary">{subtitle}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

function ListCard({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-border">{children}</div>;
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border py-14 text-center">
      <div className="text-body-sm text-text-secondary">No {label} held by this user.</div>
    </div>
  );
}

const accessDetail = (a: SodAccess) => [a.appName, a.detail].filter(Boolean).join(' · ');

/**
 * User-details drawer for the SoD workspace: the reviewed user's profile (Overview)
 * plus their held access split into Applications / Entitlements / Technical Roles /
 * Business Roles tabs. Read-only — derived from the review's `accessHeldIds`.
 */
export function UserDetailsDrawer({ open, onClose, review }: { open: boolean; onClose: () => void; review: SodReview | null }) {
  const [tab, setTab] = React.useState('overview');
  React.useEffect(() => {
    if (open) setTab('overview');
  }, [open]);

  if (!review) return null;

  const access = review.accessHeldIds.map(getAccess).filter(Boolean) as SodAccess[];
  const entitlements = access.filter((a) => a.type === 'entitlement');
  const technicalRoles = access.filter((a) => a.type === 'technicalRole');
  const businessRoles = access.filter((a) => a.type === 'businessRole');
  const apps = Array.from(
    access
      .reduce(
        (m, a) => m.set(a.appId, { id: a.appId, name: a.appName, description: getSodApp(a.appId)?.description ?? '', count: (m.get(a.appId)?.count ?? 0) + 1 }),
        new Map<string, { id: string; name: string; description: string; count: number }>(),
      )
      .values(),
  );

  const tabs: TabItem[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'applications', label: 'Applications', count: apps.length },
    { value: 'entitlements', label: 'Entitlements', count: entitlements.length },
    { value: 'technical-roles', label: 'Technical Roles', count: technicalRoles.length },
    { value: 'business-roles', label: 'Business Roles', count: businessRoles.length },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`${review.userName}'s Details`}
      subtitle="View already available user's access"
      icon={<PersonOutline sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      width={720}
      disablePadding
    >
      <div className="flex h-full flex-col">
        <div className="shrink-0 px-6 pt-3">
          <Tabs items={tabs} value={tab} onChange={setTab} aria-label="User details" />
        </div>
        <div className="ds-scroll min-h-0 flex-1 overflow-y-auto p-6">
          {tab === 'overview' && (
            <ListCard>
              <Row label="Employee ID" value={review.employeeId ?? '—'} />
              <Row label="User Email" value={review.userEmail} />
              <Row label="Designation" value={review.userTitle ?? '—'} />
              <Row label="Department" value={review.userDepartment ?? '—'} />
              <Row
                label="Manager"
                value={
                  review.managerName ? (
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={review.managerName} size="sm" kind="person" />
                      <span>{review.managerName}</span>
                      <InfoOutlined sx={{ fontSize: 15, color: 'var(--ds-color-status-info-solid)' }} titleAccess="Manager details" />
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
            </ListCard>
          )}

          {tab === 'applications' &&
            (apps.length ? (
              <ListCard>
                {apps.map((a) => (
                  <AccessRow
                    key={a.id}
                    icon={<AppBadge app={a.name} size={20} />}
                    title={a.name}
                    subtitle={a.description}
                    right={<span className="text-caption text-text-tertiary">{a.count} access item{a.count === 1 ? '' : 's'}</span>}
                  />
                ))}
              </ListCard>
            ) : (
              <EmptyTab label="applications" />
            ))}

          {tab === 'entitlements' &&
            (entitlements.length ? (
              <ListCard>
                {entitlements.map((a) => (
                  <AccessRow key={a.id} icon={<ShieldOutlined sx={{ fontSize: 17 }} />} title={a.name} subtitle={a.description ?? accessDetail(a)} right={a.risk != null ? <RiskScoreChip score={a.risk} /> : undefined} />
                ))}
              </ListCard>
            ) : (
              <EmptyTab label="entitlements" />
            ))}

          {tab === 'technical-roles' &&
            (technicalRoles.length ? (
              <ListCard>
                {technicalRoles.map((a) => (
                  <AccessRow key={a.id} icon={<LaptopOutlined sx={{ fontSize: 17 }} />} title={a.name} subtitle={a.description ?? accessDetail(a)} right={a.risk != null ? <RiskScoreChip score={a.risk} /> : undefined} />
                ))}
              </ListCard>
            ) : (
              <EmptyTab label="technical roles" />
            ))}

          {tab === 'business-roles' &&
            (businessRoles.length ? (
              <ListCard>
                {businessRoles.map((a) => (
                  <AccessRow key={a.id} icon={<BadgeOutlined sx={{ fontSize: 17 }} />} title={a.name} subtitle={a.description ?? accessDetail(a)} right={a.risk != null ? <RiskScoreChip score={a.risk} /> : undefined} />
                ))}
              </ListCard>
            ) : (
              <EmptyTab label="business roles" />
            ))}
        </div>
      </div>
    </Drawer>
  );
}

export default UserDetailsDrawer;
