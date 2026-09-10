'use client';

import * as React from 'react';
import { SettingsNested, SettingsNestedRow, SettingsRow, SettingsStack, Switch } from '@ds/components';

/**
 * The three use-case switches from the onboard drawer.
 *
 * Automated lifecycle is locked after onboard — turning it on later would
 * invent a Configure surface the application never chose, and turning it off
 * would hide one that already has authorizations.
 */
export function ApplicationUseCasesFields({
  enableProvisioning,
  onEnableProvisioning,
  provisioningLocked = false,
  identitySource,
  onIdentitySource,
  requestable,
  onRequestable,
  allEntitlements,
  onAllEntitlements,
}: {
  enableProvisioning: boolean;
  onEnableProvisioning?: (v: boolean) => void;
  provisioningLocked?: boolean;
  identitySource: boolean;
  onIdentitySource: (v: boolean) => void;
  requestable: boolean;
  onRequestable: (v: boolean) => void;
  allEntitlements: boolean;
  onAllEntitlements: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="mb-3 text-h5 text-text-primary">Select application use case</h2>
      <SettingsStack>
        <SettingsRow
          surface="subtle"
          title="Automated Lifecycle Provisioning"
          hint={
            provisioningLocked
              ? 'Chosen when this application was onboarded. It cannot be changed here.'
              : 'Enable automated user creation, updates, and deprovisioning via API.'
          }
        >
          <Switch
            checked={enableProvisioning}
            disabled={provisioningLocked}
            onChange={(e) => onEnableProvisioning?.(e.target.checked)}
            inputProps={{ 'aria-label': 'Automated Lifecycle Provisioning' }}
          />
        </SettingsRow>
        <SettingsRow
          surface="subtle"
          title="Authoritative Identity Source"
          hint="Use this app to discover new primary identities (e.g., HR/Contractor DB)."
        >
          <Switch
            checked={identitySource}
            onChange={(e) => onIdentitySource(e.target.checked)}
            inputProps={{ 'aria-label': 'Authoritative Identity Source' }}
          />
        </SettingsRow>
        <SettingsRow
          surface="subtle"
          title="Self-Service Access Catalog"
          hint="Allow end-users to request access to this app via self-service workflows."
          nested={
            requestable ? (
              <SettingsNested>
                <SettingsNestedRow
                  title="Make all imported entitlements requestable by default"
                  hint="Every imported entitlement is requestable at once, instead of opening them one by one."
                >
                  <Switch
                    checked={allEntitlements}
                    onChange={(e) => onAllEntitlements(e.target.checked)}
                    inputProps={{ 'aria-label': 'Make all imported entitlements requestable by default' }}
                  />
                </SettingsNestedRow>
              </SettingsNested>
            ) : null
          }
        >
          <Switch
            checked={requestable}
            onChange={(e) => onRequestable(e.target.checked)}
            inputProps={{ 'aria-label': 'Self-Service Access Catalog' }}
          />
        </SettingsRow>
      </SettingsStack>
    </div>
  );
}
