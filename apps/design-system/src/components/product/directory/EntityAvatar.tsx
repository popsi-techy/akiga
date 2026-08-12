'use client';

import * as React from 'react';
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

/**
 * One consistent visual per Directory entity.
 *
 * Everything gets a **letter avatar** — the entity's initial, brand on brand-tint
 * — with one exception: an application shows its real logo (falling back to the
 * same letter treatment when there isn't one), because a recognisable product
 * mark identifies an app faster than any letter can.
 *
 * Entitlements, accounts, roles and groups used to get a per-kind icon tile: a
 * key, a badge, a hard hat. That looked considered and wasn't — the kind is
 * already stated by the page you are on and the label beside the mark, so the
 * icon repeated it, while the *name* — the one thing that distinguishes two
 * entitlements from each other — went unrepresented. A letter carries the name.
 */
export function EntityAvatar({ kind, name, size = 'sm' }: { kind: EntityKind; name: string; size?: 'sm' | 'md' }) {
  const px = size === 'md' ? 40 : 28;
  if (kind === 'application') return <AppBadge app={name} size={px} />;
  return <Avatar name={name} size={size} />;
}

export default EntityAvatar;
