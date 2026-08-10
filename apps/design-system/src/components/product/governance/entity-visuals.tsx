'use client';

import * as React from 'react';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import PublicOutlined from '@mui/icons-material/PublicOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import EngineeringOutlined from '@mui/icons-material/EngineeringOutlined';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import SwapHorizOutlined from '@mui/icons-material/SwapHorizOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import { Avatar, AppIcon, StatusChip } from '@ds/components';
import { KIND_LABEL, type GovEntity, type GovEntityKind } from '@/data/governance-types';

/**
 * The visual grammar of a governance entity — one icon per kind, used identically
 * on a canvas node, an explorer row, and a details panel header, so the same thing
 * is recognisable wherever it appears.
 *
 * Tiles are **greyscale by default and that is deliberate**: fourteen entity kinds
 * in fourteen colours is not a taxonomy, it is noise, and it would spend the whole
 * colour budget before risk had said anything. Colour on this surface means risk or
 * selection. The two exceptions are identity, not decoration: an application shows
 * its own brand mark through `AppIcon`, and a person shows their avatar.
 */
const ICON: Record<GovEntityKind, React.ComponentType<{ sx?: object }>> = {
  department: BusinessOutlined,
  location: PublicOutlined,
  'business-role': BadgeOutlined,
  'technical-role': EngineeringOutlined,
  application: AppsOutlined,
  entitlement: VpnKeyOutlined,
  'birthright-policy': VerifiedOutlined,
  'approval-policy': RuleOutlined,
  'approval-workflow': AccountTreeOutlined,
  'sod-policy': AccountBalanceOutlined,
  delegation: SwapHorizOutlined,
  'escalation-rule': TimerOutlined,
  'governance-role': ShieldOutlined,
  person: PersonOutline,
};

export const kindIcon = (kind: GovEntityKind) => ICON[kind];

export function GovEntityIcon({
  entity,
  size = 28,
  /** Brand-tint the tile — reserved for the node the user has selected. */
  accent = false,
}: {
  entity: GovEntity;
  size?: number;
  accent?: boolean;
}) {
  if (entity.kind === 'person') {
    return <Avatar name={entity.name} size={size >= 40 ? 'md' : size >= 32 ? 'sm' : 'xs'} />;
  }
  if (entity.kind === 'application') {
    return <AppIcon app={entity.name} size={size} />;
  }
  const Icon = ICON[entity.kind];
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-md',
        accent ? 'bg-brand-subtle text-brand' : 'bg-subtle text-icon',
      ].join(' ')}
      style={{ width: size, height: size }}
    >
      <Icon sx={{ fontSize: Math.round(size * 0.58) }} />
    </span>
  );
}

/**
 * A taxonomy tag naming what kind of thing this is. Grey, not blue: every surface
 * that shows one also shows a risk chip, and blue must mean exactly one thing to
 * the reader at a time (visual-language §5.2).
 */
export function GovKindChip({ kind }: { kind: GovEntityKind }) {
  return <StatusChip intent="neutral" dot={false} label={KIND_LABEL[kind].one} />;
}

/** Status of a policy, workflow, or delegation. `active` is unremarkable — no chip. */
export function GovStatusChip({ entity }: { entity: GovEntity }) {
  if (entity.status === 'active') return null;
  const intent = entity.status === 'expired' ? 'danger' : entity.status === 'draft' ? 'warning' : 'neutral';
  const label = entity.status === 'expired' ? 'Expired' : entity.status === 'draft' ? 'Draft' : 'Inactive';
  return <StatusChip intent={intent} label={label} />;
}
