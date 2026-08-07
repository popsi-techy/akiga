'use client';

import * as React from 'react';
import MuiSwitch, { type SwitchProps as MuiSwitchProps } from '@mui/material/Switch';
import { elevation, motion, radius } from '../../tokens/tokens';

/**
 * Switch — binary on/off control. Extends MUI Switch with a contained-thumb
 * treatment: the knob sits inside a pill track (not overlapping it), so off/on
 * reads clearly. Brand fill when on; muted track when off.
 *
 * Prefer this over raw `@mui/material/Switch` so every product surface shares
 * the same affordance.
 */
export type SwitchSize = 'sm' | 'md';

export interface SwitchProps extends Omit<MuiSwitchProps, 'size' | 'color'> {
  /** @default 'sm' */
  size?: SwitchSize;
}

/** Track / thumb geometry — thumb always inset by 2px within the track. */
const SIZE: Record<SwitchSize, { width: number; height: number; thumb: number }> = {
  sm: { width: 36, height: 20, thumb: 16 },
  md: { width: 44, height: 24, thumb: 20 },
};

export function Switch({ size = 'sm', sx, disableRipple = true, ...rest }: SwitchProps) {
  const s = SIZE[size];
  const pad = (s.height - s.thumb) / 2;
  const travel = s.width - s.thumb - pad * 2;

  return (
    <MuiSwitch
      disableRipple={disableRipple}
      focusVisibleClassName="Mui-focusVisible"
      sx={{
        width: s.width,
        height: s.height,
        padding: 0,
        overflow: 'visible',
        '& .MuiSwitch-switchBase': {
          padding: `${pad}px`,
          color: 'transparent',
          transition: `transform ${motion.duration.fast} ${motion.easing.standard}`,
          '&.Mui-checked': {
            transform: `translateX(${travel}px)`,
            color: 'var(--ds-color-surface-default)',
            '& + .MuiSwitch-track': {
              backgroundColor: 'var(--ds-color-brand-primary)',
              borderColor: 'var(--ds-color-brand-primary)',
              opacity: 1,
            },
            '& .MuiSwitch-thumb': {
              backgroundColor: 'var(--ds-color-brand-onPrimary)',
              borderColor: 'transparent',
              boxShadow: elevation.xs,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
              backgroundColor: 'var(--ds-color-brand-primary)',
              opacity: 0.4,
            },
          },
          '&.Mui-focusVisible .MuiSwitch-thumb': {
            outline: '2px solid var(--ds-color-border-focus)',
            outlineOffset: 2,
          },
          '&.Mui-disabled': {
            '& .MuiSwitch-thumb': {
              backgroundColor: 'var(--ds-color-surface-default)',
              borderColor: 'var(--ds-color-border-default)',
            },
            '& + .MuiSwitch-track': { opacity: 0.4 },
          },
        },
        '& .MuiSwitch-thumb': {
          width: s.thumb,
          height: s.thumb,
          boxSizing: 'border-box',
          backgroundColor: 'var(--ds-color-surface-default)',
          border: '1px solid var(--ds-color-border-default)',
          boxShadow: elevation.xs,
        },
        '& .MuiSwitch-track': {
          borderRadius: radius.pill,
          backgroundColor: 'var(--ds-color-border-strong)',
          border: '1px solid var(--ds-color-border-strong)',
          opacity: 1,
          transition: `background-color ${motion.duration.fast} ${motion.easing.standard}, border-color ${motion.duration.fast} ${motion.easing.standard}`,
        },
        ...sx,
      }}
      {...rest}
    />
  );
}

export default Switch;
