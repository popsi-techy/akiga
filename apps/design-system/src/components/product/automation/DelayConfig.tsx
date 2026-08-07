'use client';

import * as React from 'react';
import { Input } from '@ds/components';
import type { DelayConfig as DConfig } from '@/data/automation-types';
import { ConfigSection } from './config-kit';

/**
 * Delay (Flow Control) configuration — a Days / Hours / Minutes duration, mirroring
 * the SLA Configuration layout used by Approval Levels.
 */
export function DelayConfig({ config, onChange }: { config: DConfig; onChange: (next: DConfig) => void }) {
  const set = (patch: Partial<DConfig>) => onChange({ ...config, ...patch });
  return (
    <ConfigSection label="Delay Duration" first>
      <div className="grid grid-cols-3 gap-2.5">
        {(['days', 'hours', 'minutes'] as const).map((unit) => (
          <Input
            key={unit}
            label={unit[0].toUpperCase() + unit.slice(1)}
            type="number"
            size="sm"
            value={String(config[unit])}
            onChange={(e) => set({ [unit]: Math.max(0, Number(e.target.value) || 0) } as Partial<DConfig>)}
          />
        ))}
      </div>
      <p className="mt-3 text-caption leading-5 text-text-secondary">
        The workflow pauses for this duration before continuing to the next step.
      </p>
    </ConfigSection>
  );
}

export default DelayConfig;
