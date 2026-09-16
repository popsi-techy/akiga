'use client';

import * as React from 'react';
import { SchedulesScreen } from '@/components/product/reports';

/**
 * `/iga/reports/schedules` — the cadences that produce sealed packages.
 *
 * A route rather than a tab on the hub: a subscription is administration, and the hub's
 * rail is for things you read. The hub's Next download tile links here, which is how most
 * readers will arrive.
 */
export default function ReportSchedulesPage() {
  return <SchedulesScreen />;
}
