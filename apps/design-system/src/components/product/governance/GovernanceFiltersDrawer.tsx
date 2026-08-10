'use client';

import * as React from 'react';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import { Button, Checkbox, Drawer } from '@ds/components';
import { RISK_TIER_LABEL, type RiskTier } from '@/lib/risk';
import {
  DOMAIN_KINDS,
  DOMAIN_LABEL,
  FINDING_LABEL,
  KIND_LABEL,
  RELATION_META,
  type GovEntityKind,
  type GovFindingKind,
  type GovRelationType,
} from '@/data/governance-types';
import { listDepartments, listLocations, type GovFilterState } from '@/data/governance';

const RISK_TIERS: RiskTier[] = ['critical', 'high', 'medium', 'low'];
const FINDING_KINDS = Object.keys(FINDING_LABEL) as GovFindingKind[];
const RELATION_TYPES = Object.keys(RELATION_META) as GovRelationType[];

/** A titled block of checkboxes. Two columns when the list is long enough to need it. */
function Group({ title, columns = 1, children }: { title: string; columns?: 1 | 2; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-4 first:pt-0 last:border-b-0">
      <h3 className="mb-2 text-body-sm-strong text-text-primary">{title}</h3>
      <div className={columns === 2 ? 'grid grid-cols-2 gap-x-4 gap-y-0.5' : 'space-y-0.5'}>{children}</div>
    </section>
  );
}

/**
 * The advanced filter set. It lives in a drawer rather than in the header because
 * it is a *sometimes* control on a surface whose header already carries search, the
 * view switch, and export — and the active-count chip on the trigger keeps its
 * state visible without spending header width on it.
 */
export function GovernanceFiltersDrawer({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: GovFilterState;
  onChange: (next: GovFilterState) => void;
}) {
  const departments = listDepartments();
  const locations = listLocations();

  /** Toggles one id in one array-valued facet. */
  function toggle<K extends keyof GovFilterState>(key: K, item: GovFilterState[K][number]) {
    const list = value[key] as unknown[];
    const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
    onChange({ ...value, [key]: next } as GovFilterState);
  }

  const clear = () =>
    onChange({ kinds: [], departmentIds: [], locationIds: [], riskTiers: [], findingKinds: [], relationTypes: [] });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filters"
      subtitle="Narrow the governance model to the entities and relationships you are investigating."
      icon={<FilterListOutlined sx={{ fontSize: 22, color: 'var(--ds-color-brand-primary)' }} />}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={clear}>
            Clear all
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      {(Object.keys(DOMAIN_KINDS) as (keyof typeof DOMAIN_KINDS)[]).map((domain) => (
        <Group key={domain} title={`Entity type · ${DOMAIN_LABEL[domain]}`} columns={2}>
          {DOMAIN_KINDS[domain].map((kind: GovEntityKind) => (
            <Checkbox
              key={kind}
              label={KIND_LABEL[kind].many}
              checked={value.kinds.includes(kind)}
              onChange={() => toggle('kinds', kind)}
            />
          ))}
        </Group>
      ))}

      <Group title="Department" columns={2}>
        {departments.map((d) => (
          <Checkbox key={d.id} label={d.name} checked={value.departmentIds.includes(d.id)} onChange={() => toggle('departmentIds', d.id)} />
        ))}
      </Group>

      <Group title="Location" columns={2}>
        {locations.map((l) => (
          <Checkbox key={l.id} label={l.name} checked={value.locationIds.includes(l.id)} onChange={() => toggle('locationIds', l.id)} />
        ))}
      </Group>

      <Group title="Risk level" columns={2}>
        {RISK_TIERS.map((t) => (
          <Checkbox key={t} label={RISK_TIER_LABEL[t]} checked={value.riskTiers.includes(t)} onChange={() => toggle('riskTiers', t)} />
        ))}
      </Group>

      <Group title="Governance gap" columns={2}>
        {FINDING_KINDS.map((k) => (
          <Checkbox key={k} label={FINDING_LABEL[k]} checked={value.findingKinds.includes(k)} onChange={() => toggle('findingKinds', k)} />
        ))}
      </Group>

      <Group title="Relationship type" columns={2}>
        {RELATION_TYPES.map((t) => (
          <Checkbox key={t} label={RELATION_META[t].label} checked={value.relationTypes.includes(t)} onChange={() => toggle('relationTypes', t)} />
        ))}
      </Group>
    </Drawer>
  );
}
