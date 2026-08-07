'use client';

import * as React from 'react';
import { siAmazonwebservices, siGoogle, siSap, siSalesforce, type SimpleIcon } from 'simple-icons/icons';

/**
 * AppIcon — compact application mark. Renders a real brand logo when the app
 * name matches a known catalog entry; otherwise falls back to the first letter
 * (same visual language as the product AppBadge initial tile).
 *
 * Logos are Simple Icons (CC0). Unknown / uncatalogued apps stay letter-only.
 */
export interface AppIconProps {
  /** Application display name (e.g. "SAP S/4HANA Finance"). */
  app: string;
  size?: number;
  /** Tile fill: `subtle` on canvas/surface, `surface` inside tinted chips. */
  variant?: 'subtle' | 'surface';
}

const CATALOG: { match: RegExp; icon: SimpleIcon }[] = [
  { match: /sap/i, icon: siSap },
  { match: /salesforce/i, icon: siSalesforce },
  { match: /\baws\b|amazon\s*web\s*services/i, icon: siAmazonwebservices },
  { match: /google/i, icon: siGoogle },
];

export function resolveAppIcon(app: string): SimpleIcon | null {
  const name = app.trim();
  if (!name) return null;
  for (const entry of CATALOG) {
    if (entry.match.test(name)) return entry.icon;
  }
  return null;
}

export function AppIcon({ app, size = 24, variant = 'subtle' }: AppIconProps) {
  const icon = resolveAppIcon(app);
  const tile = [
    'inline-flex shrink-0 items-center justify-center rounded-md',
    variant === 'surface' ? 'bg-surface' : 'bg-subtle',
  ].join(' ');

  if (!icon) {
    return (
      <span className={`${tile} text-caption font-semibold text-text-secondary`} style={{ width: size, height: size }} title={app}>
        {app.trim().charAt(0).toUpperCase() || '?'}
      </span>
    );
  }

  const mark = Math.round(size * 0.58);
  return (
    <span className={tile} style={{ width: size, height: size }} title={app}>
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={mark}
        height={mark}
        aria-label={icon.title}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={icon.path} fill={`#${icon.hex}`} />
      </svg>
    </span>
  );
}

export default AppIcon;
