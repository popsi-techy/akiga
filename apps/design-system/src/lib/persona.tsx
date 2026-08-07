'use client';

import * as React from 'react';

/**
 * Persona context — which console experience is active (Admin / Reviewer / End
 * user). Driven by the top-bar apps switcher; swaps the sidebar nav and the
 * dashboard. Persisted to localStorage so it survives reloads.
 */
export type Persona = 'admin' | 'reviewer' | 'endUser';

const KEY = 'iga.persona';
const isPersona = (v: unknown): v is Persona => v === 'admin' || v === 'reviewer' || v === 'endUser';

interface PersonaCtx {
  persona: Persona;
  setPersona: (p: Persona) => void;
}
const Ctx = React.createContext<PersonaCtx>({ persona: 'admin', setPersona: () => {} });

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  // Start as 'admin' on both server and first client render (avoids hydration
  // mismatch); adopt the stored persona after mount.
  const [persona, setState] = React.useState<Persona>('admin');
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (isPersona(stored)) setState(stored);
    } catch {
      /* ignore */
    }
  }, []);
  const setPersona = React.useCallback((p: Persona) => {
    setState(p);
    try {
      window.localStorage.setItem(KEY, p);
    } catch {
      /* ignore */
    }
  }, []);
  return <Ctx.Provider value={{ persona, setPersona }}>{children}</Ctx.Provider>;
}

export const usePersona = () => React.useContext(Ctx);
