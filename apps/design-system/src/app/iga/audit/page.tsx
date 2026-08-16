'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { NavCard } from '@ds/components';
import { AUDIT_CATEGORIES } from '@/data/audit-logs';

/**
 * Audit Logs — the landing page.
 *
 * One card per category, live ones first. The categories still to come keep their
 * place rather than being hidden: an auditor deciding whether IGA can answer a
 * question needs to know what it will be able to answer, and a card marked
 * "Coming soon" says that more honestly than an absence does.
 */
export default function AuditLogsPage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-h2 text-text-primary">Audit Logs</h1>
        <p className="mt-1 text-body text-text-secondary">
          Every change, who made it, and when — searchable, filterable and exportable for audit.
        </p>
      </div>

      <div className="ds-scroll min-h-0 flex-1 overflow-y-auto pr-0.5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AUDIT_CATEGORIES.map((c) => (
            <NavCard
              key={c.id}
              title={c.title}
              description={c.description}
              tags={c.route ? (c.tag ? [c.tag] : undefined) : ['Coming soon']}
              disabled={!c.route}
              onClick={c.route ? () => router.push(c.route as string) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
