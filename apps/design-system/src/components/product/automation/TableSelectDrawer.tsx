'use client';

import * as React from 'react';
import {
  TableSelectDrawer as DsTableSelectDrawer,
  type TableSelectDrawerProps,
  type TableSelectRow,
} from '@ds/components';
import { RiskScoreChip } from '@/components/product/directory/RiskScoreChip';

export type { TableSelectRow };

/** Product wrapper: paints risk with `RiskScoreChip`. The DS drawer stays domain-free. */
export function TableSelectDrawer(props: Omit<TableSelectDrawerProps, 'renderRisk'>) {
  return <DsTableSelectDrawer {...props} renderRisk={(score) => <RiskScoreChip score={score} />} />;
}

export default TableSelectDrawer;
