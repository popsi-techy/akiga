'use client';

import * as React from 'react';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import EngineeringOutlined from '@mui/icons-material/EngineeringOutlined';
import HandshakeOutlined from '@mui/icons-material/HandshakeOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import { StatusChip } from '@ds/components';
import type { ExternalType } from '@/data/seed';

/**
 * What kind of outsider an external identity is — vendor, contractor, partner or
 * auditor. A category, not a state, so the icon carries the meaning and the tint
 * stays neutral (the same reasoning as {@link IdentityKindChip}). The four glyphs
 * are separable at a glance in a column, which is the whole reason Type earns a
 * mark rather than plain text.
 */
const META: Record<ExternalType, { label: string; icon: React.ReactNode }> = {
  vendor: { label: 'Vendor', icon: <StorefrontOutlined /> },
  contractor: { label: 'Contractor', icon: <EngineeringOutlined /> },
  partner: { label: 'Partner', icon: <HandshakeOutlined /> },
  auditor: { label: 'Auditor', icon: <FactCheckOutlined /> },
};

export function ExternalTypeChip({ type }: { type?: ExternalType }) {
  if (!type) return <StatusChip intent="neutral" label="External" />;
  const m = META[type];
  return <StatusChip intent="neutral" label={m.label} icon={m.icon} />;
}

/** Just the label, for places that want the word without the chip. */
export function externalTypeLabel(type?: ExternalType): string {
  return type ? META[type].label : 'External';
}

export default ExternalTypeChip;
