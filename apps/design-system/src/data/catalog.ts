/**
 * Entity catalog service — apps/entitlements and roles selectable in Assign
 * Entities. Reads the seed (source of truth for prototype reference data).
 */
import { catalogApps, technicalRoles, businessRoles } from './seed';

export interface CatalogEntitlement {
  id: string;
  name: string;
  description: string;
  risk: number;
}
export interface CatalogApp {
  id: string;
  name: string;
  description: string;
  entitlements: CatalogEntitlement[];
}
export interface RoleDef {
  id: string;
  name: string;
  description: string;
  risk: number;
}

export function listApps(): CatalogApp[] {
  return catalogApps;
}
export function listEntitlements(appId: string): CatalogEntitlement[] {
  return catalogApps.find((a) => a.id === appId)?.entitlements ?? [];
}
export function listTechnicalRoles(): RoleDef[] {
  return technicalRoles;
}
export function listBusinessRoles(): RoleDef[] {
  return businessRoles;
}
