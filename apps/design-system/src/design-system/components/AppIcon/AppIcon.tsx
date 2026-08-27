'use client';

import * as React from 'react';

/**
 * AppIcon — compact application mark.
 *
 * Brand logos are the vendor’s current site icon, fetched live (Google’s public
 * favicon service crawls the domain). Unknown names fall back to a first-letter
 * tile so a list stays scannable without every app needing an asset.
 */

export interface AppLogo {
  title: string;
  domain: string;
}

export interface AppIconProps {
  /** Application display name (e.g. "SAP S/4HANA Finance"). */
  app?: string;
  /**
   * Extra catalog key when `app` is a custom instance name — typically the
   * app type ("SAP", "Adobe"). Tried before `app`.
   */
  logoFrom?: string;
  size?: number;
  /** Tile fill: `subtle` on canvas/surface, `surface` inside tinted chips. */
  variant?: 'subtle' | 'surface';
}

/**
 * Matched in order, so a longer product name wins over a looser pattern.
 * `domain` is the vendor site whose live icon we load.
 */
const CATALOG: { match: RegExp; logo: AppLogo }[] = [
  { match: /google\s*workspace/i, logo: { title: 'Google Workspace', domain: 'workspace.google.com' } },
  { match: /microsoft\s*entra|\bentra\b/i, logo: { title: 'Microsoft Entra', domain: 'entra.microsoft.com' } },
  { match: /active\s*directory/i, logo: { title: 'Active Directory', domain: 'microsoft.com' } },
  { match: /hashicorp/i, logo: { title: 'HashiCorp', domain: 'hashicorp.com' } },
  { match: /cyberark/i, logo: { title: 'CyberArk', domain: 'cyberark.com' } },
  { match: /servicenow/i, logo: { title: 'ServiceNow', domain: 'servicenow.com' } },
  { match: /adobe/i, logo: { title: 'Adobe', domain: 'adobe.com' } },
  { match: /salesforce/i, logo: { title: 'Salesforce', domain: 'salesforce.com' } },
  { match: /\baws\b|amazon\s*web\s*services/i, logo: { title: 'AWS', domain: 'aws.amazon.com' } },
  { match: /github/i, logo: { title: 'GitHub', domain: 'github.com' } },
  { match: /slack/i, logo: { title: 'Slack', domain: 'slack.com' } },
  { match: /okta/i, logo: { title: 'Okta', domain: 'okta.com' } },
  { match: /jira|atlassian/i, logo: { title: 'Jira', domain: 'atlassian.com' } },
  { match: /snowflake/i, logo: { title: 'Snowflake', domain: 'snowflake.com' } },
  { match: /workday/i, logo: { title: 'Workday', domain: 'workday.com' } },
  { match: /netsuite/i, logo: { title: 'NetSuite', domain: 'netsuite.com' } },
  { match: /freshdesk/i, logo: { title: 'Freshdesk', domain: 'freshdesk.com' } },
  { match: /sap/i, logo: { title: 'SAP', domain: 'sap.com' } },
  { match: /google/i, logo: { title: 'Google', domain: 'google.com' } },
];

/** Live vendor icon — 128px so a 40px tile stays sharp. */
export function liveAppLogoUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function resolveAppIcon(...candidates: Array<string | null | undefined>): AppLogo | null {
  for (const app of candidates) {
    const name = app?.trim();
    if (!name) continue;
    for (const entry of CATALOG) {
      if (entry.match.test(name)) return entry.logo;
    }
  }
  return null;
}

export function AppIcon({ app, logoFrom, size = 24, variant = 'subtle' }: AppIconProps) {
  const logo = resolveAppIcon(logoFrom, app);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [logo?.domain]);

  const tile = [
    'inline-flex shrink-0 items-center justify-center rounded-md',
    variant === 'surface' ? 'bg-surface' : 'bg-subtle',
  ].join(' ');
  const letter = app?.trim().charAt(0).toUpperCase() || '?';

  if (!logo || failed) {
    return (
      <span className={`${tile} text-caption-strong text-text-secondary`} style={{ width: size, height: size }} title={app}>
        {letter}
      </span>
    );
  }

  const mark = Math.round(size * 0.72);
  return (
    <span className={tile} style={{ width: size, height: size }} title={app}>
      {/* eslint-disable-next-line @next/next/no-img-element -- live vendor icon; not a layout image */}
      <img
        src={liveAppLogoUrl(logo.domain)}
        alt=""
        width={mark}
        height={mark}
        draggable={false}
        referrerPolicy="no-referrer"
        className="object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export default AppIcon;
