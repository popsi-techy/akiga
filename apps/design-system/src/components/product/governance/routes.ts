import { governanceGroups } from '@/data/seed';
import type { GovEntity } from '@/data/governance-types';

/**
 * Where a governance entity is *administered*, as opposed to where it is
 * understood. The Governance Model is a read surface: every fix it recommends
 * happens in the module that owns the object, so a finding links there rather than
 * growing a second place to edit ownership.
 *
 * Returns `null` for entities with no configuration screen yet (departments,
 * locations, delegations). Callers render the recommended action as guidance in
 * that case — never a button that does nothing.
 */
export function entityRoute(entity: GovEntity): string | null {
  switch (entity.kind) {
    case 'application':
      return `/iga/directory/applications/${entity.id}`;
    case 'entitlement':
      return `/iga/directory/entitlements/${entity.id}`;
    case 'business-role':
      return `/iga/directory/business-roles/${entity.id}`;
    case 'technical-role':
      return `/iga/directory/technical-roles/${entity.id}`;
    case 'person':
      return `/iga/directory/user-identities/${entity.id}`;
    case 'approval-policy':
      return `/iga/automation/approval-policies/${entity.id}/builder`;
    case 'approval-workflow':
      return '/iga/automation/workflows';
    case 'sod-policy':
      return '/iga/sod-policies';
    case 'birthright-policy':
      return '/iga/birthright';
    case 'governance-role': {
      const group = governanceGroups.find((g) => g.name === entity.metrics.find((m) => m.label === 'Governance group')?.value);
      return group ? `/iga/directory/governance-groups/${group.id}` : null;
    }
    default:
      return null;
  }
}

/** Verb for the link to that screen — "Open in Directory" is wrong for a policy. */
export function entityRouteLabel(entity: GovEntity): string {
  switch (entity.kind) {
    case 'application':
    case 'entitlement':
    case 'business-role':
    case 'technical-role':
    case 'person':
    case 'governance-role':
      return 'Open in Directory';
    case 'approval-policy':
      return 'Open in builder';
    case 'approval-workflow':
      return 'Open Automation';
    case 'sod-policy':
      return 'Open SoD Policies';
    case 'birthright-policy':
      return 'Open Birthright Policies';
    default:
      return 'Open';
  }
}
