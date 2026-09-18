'use client';

import * as React from 'react';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import { StatusChip } from '@ds/components';
import type { ExternalType } from '@/data/seed';

/**
 * External type, for now: Vendor.
 *
 * The catalogue still has contractor / partner / auditor in the seed, but the
 * product is only shipping Vendor. The chip is `info` (blue) so it reads as a
 * category, not as a lifecycle state — those stay on the Status column.
 */
export function ExternalTypeChip(_props: { type?: ExternalType }) {
  return <StatusChip intent="info" label="Vendor" icon={<StorefrontOutlined />} />;
}

/** Just the label, for places that want the word without the chip. */
export function externalTypeLabel(_type?: ExternalType): string {
  return 'Vendor';
}

export default ExternalTypeChip;
