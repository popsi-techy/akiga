/**
 * Attribute vocabulary service — derived from the registry (source of truth).
 * Powers condition builders (Conditional Branch, User Filter, Assignment
 * Criteria) and Multisplit split-attributes.
 */
import data from '@registries/attributes.json';

export type AttrType = 'string' | 'number' | 'enum';
export interface AttrDef {
  id: string;
  label: string;
  type: AttrType;
  options?: string[];
}

const doc = data as { attributes: AttrDef[]; splitAttributes: string[] };

export function listAttributes(): AttrDef[] {
  return doc.attributes;
}
export function getAttribute(id: string): AttrDef | undefined {
  return doc.attributes.find((a) => a.id === id);
}
export function attributeLabel(id: string | undefined): string {
  return (id && getAttribute(id)?.label) || '';
}
/** Attributes offered as Multisplit split keys. */
export function listSplitAttributes(): AttrDef[] {
  return doc.splitAttributes.map((id) => getAttribute(id)).filter((a): a is AttrDef => Boolean(a));
}
