'use client';

import * as React from 'react';
import { notFound, useParams } from 'next/navigation';
import { RegisterView } from '@/components/product/reports';
import { OPERATIONAL_REPORTS } from '@/data/reports';

/**
 * `/iga/reports/view/[id]` — one operational register.
 *
 * A register with no `href` is catalogued but not built, and nothing links here for it, so
 * arriving by URL is a 404 rather than an empty table. An empty table reads as "this
 * register found nothing", which is a very different claim from "this register does not
 * exist yet" — and on a compliance surface the difference is the whole point.
 */
export default function RegisterPage() {
  const params = useParams<{ id: string }>();
  const register = OPERATIONAL_REPORTS.find((r) => r.id === params.id);
  if (!register || !register.href) notFound();
  return <RegisterView register={register} />;
}
