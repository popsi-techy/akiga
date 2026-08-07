'use client';

import * as React from 'react';
import AccountBoxOutlined from '@mui/icons-material/AccountBoxOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import EngineeringOutlined from '@mui/icons-material/EngineeringOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import { Avatar } from '@ds/components';
import { AppBadge } from '@/components/product/sod/labels';

export type EntityKind =
  | 'user'
  | 'account'
  | 'application'
  | 'entitlement'
  | 'technical-role'
  | 'business-role'
  | 'governance-group';

const ICON: Partial<Record<EntityKind, React.ComponentType<{ sx?: object }>>> = {
  account: AccountBoxOutlined,
  entitlement: VpnKeyOutlined,
  'technical-role': EngineeringOutlined,
  'business-role': BadgeOutlined,
  'governance-group': GroupsOutlined,
};

function IconTile({ Icon, size }: { Icon: React.ComponentType<{ sx?: object }>; size: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand"
      style={{ width: size, height: size }}
    >
      <Icon sx={{ fontSize: Math.round(size * 0.55) }} />
    </span>
  );
}

/** One consistent visual per Directory entity: Avatar for people, AppBadge for
    applications, a brand icon tile for accounts/entitlements/roles/groups. */
export function EntityAvatar({ kind, name, size = 'sm' }: { kind: EntityKind; name: string; size?: 'sm' | 'md' }) {
  const px = size === 'md' ? 40 : 28;
  if (kind === 'user') return <Avatar name={name} size={size} />;
  if (kind === 'application') return <AppBadge app={name} size={px} />;
  const Icon = ICON[kind];
  return Icon ? <IconTile Icon={Icon} size={px} /> : <Avatar name={name} size={size} />;
}

export default EntityAvatar;
