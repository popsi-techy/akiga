'use client';

import * as React from 'react';

/**
 * Sidebar collapse state, shared between the navigation rail and the content
 * frame (whose left margin must track the rail's width). Persisted to
 * localStorage so the choice survives reloads.
 */
const STORAGE_KEY = 'iga.sidebarCollapsed';

interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

const Ctx = React.createContext<SidebarCtx>({ collapsed: false, toggle: () => {}, setCollapsed: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored != null) setCollapsed(stored === '1');
  }, []);

  const persist = React.useCallback((v: boolean) => {
    setCollapsed(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
    } catch {
      /* ignore private-mode write failures */
    }
  }, []);

  const toggle = React.useCallback(() => persist(!collapsed), [persist, collapsed]);

  return <Ctx.Provider value={{ collapsed, toggle, setCollapsed: persist }}>{children}</Ctx.Provider>;
}

export const useSidebar = () => React.useContext(Ctx);
