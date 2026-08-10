'use client';

import * as React from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { Input } from '@ds/components';
import { GovEntityIcon } from './entity-visuals';
import { RiskDot } from '@/components/product/directory/RiskScoreChip';
import { KIND_LABEL } from '@/data/governance-types';
import { searchGov } from '@/data/governance';

/**
 * Governance search — categorised, and it *selects* rather than navigates.
 *
 * Results are grouped by domain because "Finance" legitimately means a department,
 * a business role, a birthright policy and an SoD policy at once, and which one the
 * administrator meant is not guessable. Choosing a result re-roots the map and opens
 * the entity, which is the same thing every other entry point on this page does.
 */
export function GovernanceSearch({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const groups = React.useMemo(() => searchGov(query), [query]);
  const flat = React.useMemo(() => groups.flatMap((g) => g.results), [groups]);
  const [cursor, setCursor] = React.useState(0);
  React.useEffect(() => setCursor(0), [query]);

  React.useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  const choose = (id: string) => {
    onSelect(id);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && flat[cursor]) {
      e.preventDefault();
      choose(flat[cursor].id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-[240px] shrink-0 xl:w-[320px]">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search applications, policies, people…"
        aria-label="Search the governance model"
        role="combobox"
        aria-expanded={open && query.trim().length > 0}
        startAdornment={<SearchOutlined sx={{ fontSize: 18 }} />}
        endAdornment={
          query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setOpen(false);
              }}
              aria-label="Clear search"
              className="grid h-5 w-5 place-items-center rounded text-icon transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle"
            >
              <CloseIcon sx={{ fontSize: 15 }} />
            </button>
          ) : undefined
        }
      />

      {open && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-[420px] overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-md">
          {flat.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <div className="text-body-sm-strong text-text-primary">No governance match</div>
              <p className="mt-1 text-caption text-text-secondary">
                Nothing in the model is named “{query}”. Try an application, a department, a policy, or a person.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.domain}>
                <div className="px-3 pb-1 pt-2 text-overline uppercase text-text-tertiary">{group.label}</div>
                <ul role="listbox" aria-label={group.label}>
                  {group.results.map((e) => {
                    const index = flat.findIndex((x) => x.id === e.id);
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={index === cursor}
                          onMouseEnter={() => setCursor(index)}
                          onClick={() => choose(e.id)}
                          className={[
                            'flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors',
                            index === cursor ? 'bg-surface-hover' : '',
                          ].join(' ')}
                        >
                          <GovEntityIcon entity={e} size={24} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body-sm text-text-primary">{e.name}</span>
                            <span className="block truncate text-caption text-text-tertiary">{KIND_LABEL[e.kind].one}</span>
                          </span>
                          {e.risk > 0 && <RiskDot score={e.risk} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
