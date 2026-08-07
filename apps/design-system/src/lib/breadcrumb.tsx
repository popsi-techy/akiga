'use client';

import * as React from 'react';

export type BreadcrumbCrumb = { label: string; href?: string };

type BreadcrumbCtx = {
  override: BreadcrumbCrumb[] | null;
  setOverride: (crumbs: BreadcrumbCrumb[] | null) => void;
};

const Ctx = React.createContext<BreadcrumbCtx | null>(null);

function sameCrumbs(a: BreadcrumbCrumb[] | null, b: BreadcrumbCrumb[] | null) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((c, i) => c.label === b[i]?.label && c.href === b[i]?.href);
}

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverrideState] = React.useState<BreadcrumbCrumb[] | null>(null);
  const setOverride = React.useCallback((crumbs: BreadcrumbCrumb[] | null) => {
    setOverrideState((prev) => (sameCrumbs(prev, crumbs) ? prev : crumbs));
  }, []);
  const value = React.useMemo(() => ({ override, setOverride }), [override, setOverride]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Read the active page override (if any). Used by the product top bar. */
export function useBreadcrumbOverride(): BreadcrumbCrumb[] | null {
  return React.useContext(Ctx)?.override ?? null;
}

/**
 * Let a page replace the default path-derived breadcrumbs.
 * Clears on unmount. Pass `null` to fall back to the default trail.
 */
export function useSetBreadcrumbs(crumbs: BreadcrumbCrumb[] | null) {
  const setOverride = React.useContext(Ctx)?.setOverride;
  const serialized = crumbs ? JSON.stringify(crumbs) : '';

  React.useEffect(() => {
    if (!setOverride) return;
    setOverride(serialized ? (JSON.parse(serialized) as BreadcrumbCrumb[]) : null);
  }, [setOverride, serialized]);

  React.useEffect(() => {
    if (!setOverride) return;
    return () => setOverride(null);
  }, [setOverride]);
}
