'use client';

import * as React from 'react';
import { notFound, useParams } from 'next/navigation';
import { ComplianceFrameworkDetailView } from '@/components/product/reports';
import { frameworkById } from '@/data/reports';

/**
 * `/iga/reports/compliance/[id]` — one framework's clause matrix and package history.
 *
 * A framework that is catalogued but not built has no `href`, so nothing links here for it;
 * reaching it by typing the URL is a 404 rather than an empty matrix, because an empty
 * matrix looks like "no clauses are evidenced" rather than "this framework does not exist
 * yet" — and those two readings could not be further apart for someone preparing an audit.
 */
export default function ComplianceFrameworkPage() {
  const params = useParams<{ id: string }>();
  const framework = frameworkById(params.id);
  if (!framework || !framework.href) notFound();
  return <ComplianceFrameworkDetailView framework={framework} />;
}
