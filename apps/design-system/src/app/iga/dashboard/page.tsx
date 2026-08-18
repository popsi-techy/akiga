'use client';

import * as React from 'react';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import PolicyOutlined from '@mui/icons-material/PolicyOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import Campaign from '@mui/icons-material/Campaign';
import CampaignOutlined from '@mui/icons-material/CampaignOutlined';
import WatchLater from '@mui/icons-material/WatchLater';
import Bolt from '@mui/icons-material/Bolt';
import GppGood from '@mui/icons-material/GppGood';
import GppMaybe from '@mui/icons-material/GppMaybe';
import Groups from '@mui/icons-material/Groups';
import {
  StatTile,
  DonutChart,
  Card,
  StatusChip,
  Avatar,
  Button,
  Drawer,
  Input,
  useToast,
} from '@ds/components';
import { getDashboardData } from '@/data/dashboard';
import type { Tone } from '@/data/seed';

/* Presentation maps (data comes from the dashboard service). */
const KPI_ICONS: Record<string, React.ReactNode> = {
  applications: <AppsOutlined sx={{ fontSize: 22 }} />,
  identities: <PeopleOutlined sx={{ fontSize: 22 }} />,
  entitlements: <VerifiedUserOutlined sx={{ fontSize: 22 }} />,
  orphans: <PersonOffOutlined sx={{ fontSize: 22 }} />,
};

const DONUT_COLOR: Record<Tone, string> = {
  brand: 'var(--ds-color-brand-primary)',
  info: 'var(--ds-color-status-info-solid)',
  success: 'var(--ds-color-status-success-solid)',
  warning: 'var(--ds-color-status-warning-solid)',
  danger: 'var(--ds-color-status-danger-solid)',
  neutral: 'var(--ds-color-border-strong)',
};

const QUICK_ACTIONS = [
  { id: 'onboard', label: 'Onboard Application', icon: <AppsOutlined sx={{ fontSize: 20 }} /> },
  { id: 'sod', label: 'Create SoD Policy', icon: <PolicyOutlined sx={{ fontSize: 20 }} /> },
  { id: 'cert', label: 'Create Access Certification', icon: <CampaignOutlined sx={{ fontSize: 20 }} /> },
  { id: 'config', label: 'Configuration', icon: <SettingsOutlined sx={{ fontSize: 20 }} /> },
];

function CardActions({ onFilter, onOpen }: { onFilter?: () => void; onOpen?: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onFilter} aria-label="Filter" className="rounded-md p-1.5 text-icon hover:bg-surface-hover">
        <FilterListOutlined sx={{ fontSize: 18 }} />
      </button>
      <button onClick={onOpen} aria-label="Open" className="rounded-md p-1.5 text-icon hover:bg-surface-hover">
        <ArrowForwardOutlined sx={{ fontSize: 18 }} />
      </button>
    </div>
  );
}

function ListRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 border-b border-border-subtle py-3 last:border-0">{children}</div>;
}

export default function DashboardPage() {
  const toast = useToast();
  const [onboardOpen, setOnboardOpen] = React.useState(false);
  const data = getDashboardData();

  const certSegments = data.certification.segments.map((s) => ({
    label: s.label,
    value: s.value,
    color: DONUT_COLOR[s.tone],
  }));
  const sodSegments = data.sod.segments.map((s) => ({
    label: s.label,
    value: s.value,
    color: DONUT_COLOR[s.tone],
  }));

  const runQuickAction = (id: string) => {
    if (id === 'onboard') return setOnboardOpen(true);
    toast.info('This flow isn’t built yet — coming soon.');
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-h2 text-text-primary">
          Welcome Amelia,{' '}
          <span className="font-normal text-text-secondary">
            Configure and Govern Access across the Organization
          </span>
        </h1>
        <Button variant="secondary" size="sm" onClick={() => toast.success('Dashboard layout saved')}>
          Customize
        </Button>
      </div>

      {/* KPI tiles */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((k) => (
          <StatTile key={k.key} label={k.label} value={k.value} icon={KPI_ICONS[k.key]} tone={k.tone} hoverElevate />
        ))}
      </div>

      {/* Row 1 */}
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card
          hoverElevate
          title="Access Certification"
          icon={<Campaign />}
          action={<CardActions onOpen={() => toast.info('Open certifications')} />}
        >
          <div className="py-2">
            <DonutChart
              segments={certSegments}
              centerValue={String(data.certification.total)}
              centerLabel="Total"
              ariaLabel="Access certification status breakdown"
            />
          </div>
        </Card>

        <Card
          hoverElevate
          title="Certifications Approaching Deadline"
          icon={<WatchLater />}
          action={<CardActions />}
          padding="none"
        >
          <div>
            {data.deadlines.map((d) => (
              <ListRow key={d.id}>
                <Avatar name={d.name} initials={d.name[0]} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-strong text-text-primary">{d.name}</div>
                  <div className="truncate text-caption text-text-secondary">{d.scope}</div>
                </div>
                {'tone' in d.due ? (
                  <StatusChip intent={d.due.tone} dot={false} label={d.due.label} />
                ) : (
                  <span className="text-body-sm text-text-secondary">{d.due.date}</span>
                )}
              </ListRow>
            ))}
          </div>
        </Card>

        <Card
          hoverElevate
          title="Quick Actions"
          icon={<Bolt />}
          padding="none"
        >
          <div>
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => runQuickAction(a.id)}
                className="flex w-full items-center gap-3 border-b border-border-subtle py-3.5 text-left last:border-0 hover:bg-surface-hover"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand">
                  {a.icon}
                </span>
                <span className="flex-1 text-body-strong text-text-primary">{a.label}</span>
                <ChevronRightOutlined sx={{ fontSize: 20, color: 'var(--ds-color-icon-default)' }} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          hoverElevate
          title="SoD Policies"
          icon={<GppGood />}
          action={<CardActions />}
        >
          <div className="py-2">
            <DonutChart
              segments={sodSegments}
              centerValue={String(data.sod.total)}
              centerLabel="Policies"
              ariaLabel="SoD policy status breakdown"
            />
          </div>
        </Card>

        <Card
          hoverElevate
          title="High-Risk SoD Policies"
          icon={<GppMaybe />}
          action={<CardActions />}
          padding="none"
        >
          <div>
            {data.sod.highRisk.map((p) => (
              <ListRow key={p.id}>
                <Avatar name={p.name} initials={p.name[0]} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-strong text-text-primary">{p.name}</div>
                  <div className="truncate text-caption text-text-secondary">{p.area}</div>
                </div>
                <StatusChip intent="danger" dot={false} label={`Critical (${p.count})`} />
              </ListRow>
            ))}
          </div>
        </Card>

        <Card
          hoverElevate
          title="High Risk Users"
          icon={<Groups />}
          action={<CardActions />}
          padding="none"
        >
          <div>
            {data.highRiskUsers.map((u) => (
              <ListRow key={u.id}>
                <Avatar name={u.name} size="sm" kind="person" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-strong text-text-primary">{u.name}</div>
                  <div className="truncate text-caption text-text-secondary">
                    {u.title} · {u.app}
                  </div>
                </div>
                <StatusChip intent="danger" dot={false} label={`Critical (${u.riskScore})`} />
              </ListRow>
            ))}
          </div>
        </Card>
      </div>

      {/* Onboard Application drawer */}
      <Drawer
        open={onboardOpen}
        onClose={() => setOnboardOpen(false)}
        title="Onboard Application"
        subtitle="Register an application to govern its access."
        icon={<AppsOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOnboardOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOnboardOpen(false);
                toast.success('Application onboarding started');
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Application name" required placeholder="e.g. Salesforce" size="sm" />
          <Input label="Owner" required placeholder="owner@acme.com" size="sm" />
          <Input label="Description" placeholder="What is this application used for?" size="sm" multiline minRows={3} />
        </div>
      </Drawer>
    </div>
  );
}
