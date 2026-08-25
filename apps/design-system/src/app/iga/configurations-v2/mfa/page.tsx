'use client';

import { MfaSettingsPage } from '@/components/product/settings/MfaSettingsPage';

/**
 * MFA from System Settings v2. Same form as v1; breadcrumb returns to the v2 hub.
 */
export default function Page() {
  return (
    <MfaSettingsPage hub={{ label: 'System Settings v2', href: '/iga/configurations-v2' }} />
  );
}
