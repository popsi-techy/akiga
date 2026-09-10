import type { AccessRequestType } from '@/data/access-request-types';
import type { EntityKind } from '@/components/product/directory';

/** Nouns and empty-state copy for the three request types — one place so the
 *  wizard chrome, items step, and preview cannot drift. */
export function requestTypeCopy(type: AccessRequestType) {
  if (type === 'application') {
    return {
      singular: 'application',
      plural: 'applications',
      selectLabel: 'Select applications',
      addLabel: 'Add applications',
      emptyTitle: 'No applications selected',
      emptyMessage: 'Choose applications you need access to.',
      continueEmpty: 'Add at least one application to continue.',
      submitEmpty: 'Add at least one application to submit this request.',
      submitBlocked: 'Add applications and a justification before submitting.',
      searchPlaceholder: 'Search applications',
      nameHeader: 'Application',
      drawerTitle: 'Add applications',
      drawerSubtitle: 'Choose applications to include in this request.',
      entity: 'application',
      avatarKind: 'application' as EntityKind,
    };
  }
  if (type === 'role') {
    return {
      singular: 'technical role',
      plural: 'technical roles',
      selectLabel: 'Select technical roles',
      addLabel: 'Add technical roles',
      emptyTitle: 'No technical roles selected',
      emptyMessage: 'Choose technical roles you need access to.',
      continueEmpty: 'Add at least one technical role to continue.',
      submitEmpty: 'Add at least one technical role to submit this request.',
      submitBlocked: 'Add technical roles and a justification before submitting.',
      searchPlaceholder: 'Search technical roles',
      nameHeader: 'Technical role',
      drawerTitle: 'Add technical roles',
      drawerSubtitle: 'Choose technical roles to include in this request.',
      entity: 'technical role',
      avatarKind: 'technical-role' as EntityKind,
    };
  }
  return {
    singular: 'entitlement',
    plural: 'entitlements',
    selectLabel: 'Select entitlements',
    addLabel: 'Add entitlements',
    emptyTitle: 'No entitlements selected',
    emptyMessage: 'Add entitlements from an application to include them in the request.',
    continueEmpty: 'Add at least one entitlement to continue.',
    submitEmpty: 'Add at least one entitlement to submit this request.',
    submitBlocked: 'Add entitlements and a justification before submitting.',
    searchPlaceholder: 'Search entitlements',
    nameHeader: 'Entitlement',
    drawerTitle: 'Add entitlements',
    drawerSubtitle: 'Choose permissions.',
    entity: 'entitlement',
    avatarKind: 'entitlement' as EntityKind,
  };
}
