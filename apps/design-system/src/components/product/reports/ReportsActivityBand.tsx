'use client';

import * as React from 'react';
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import InventoryOutlined from '@mui/icons-material/InventoryOutlined';
import { StatTile } from '@ds/components';
import {
  REPORT_STATE,
  frameworkById,
  latestSealedPackage,
  nextScheduledRun,
  reportsAttention,
} from '@/data/reports';
import { formatDate } from '@/lib/datetime';

/**
 * What this catalogue has done lately, and what it is about to do.
 *
 * The hub used to open with a KPI strip and the strip was taken off, for a reason that
 * still holds: those tiles counted catalogued things — how many registers exist, how many
 * clauses a framework has — and a count of a list you are looking at is not information.
 * Worse, each belonged to one tab, so most readers paid a sixth of the page for a number
 * about somewhere they were not going.
 *
 * These three are a different kind of thing. Every one is an **event with a destination**:
 * a run that will happen, a thing that is wrong, an artefact that exists. None of them can
 * be read off the catalogue below, none of them belongs to a single section, and each is a
 * link to the one row it is about — which is the test the old tiles failed. A date with
 * nowhere to go sent the reader off to find the subscription that produced it by hand.
 *
 * Three, and not four: the fourth candidate was always a total, and a total is the thing
 * the rail already says.
 */
export function ReportsActivityBand() {
  const next = nextScheduledRun();
  const attention = reportsAttention();
  const latest = latestSealedPackage();
  const latestFramework = latest ? frameworkById(latest.frameworkId) : null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/*
        The next firing, in the tenant's terms: the date it lands, then which subscription
        and how often. The schedules table is one click away rather than a tab, because
        this tile is the only reason most readers ever need it.
      */}
      {next ? (
        <StatTile
          label="Next download"
          value={formatDate(next.nextRunAt)}
          hint={`${next.name} · ${next.cadence}`}
          icon={<EventRepeatOutlined />}
          tone="info"
          href="/iga/reports/schedules"
        />
      ) : (
        /* Nothing enabled is a finding, not an empty state: every package would have to be
           sealed by hand, by someone who remembered to. */
        <StatTile
          label="Next download"
          value="None"
          hint="No subscription is enabled — every package would be sealed by hand."
          icon={<EventRepeatOutlined />}
          tone="warning"
          href="/iga/reports/schedules"
        />
      )}

      {/*
        The count is the number of findings; the line under it is the worst one, by name,
        and the link goes there. A tile that says "2" and links to a list of everything
        makes the reader do the triage this already did.
      */}
      {attention.length > 0 ? (
        <StatTile
          label="Needs attention"
          value={attention.length}
          hint={
            attention.length === 1
              ? attention[0].label
              : `${attention[0].label} · +${attention.length - 1} more`
          }
          icon={<WarningAmberOutlined />}
          tone="warning"
          href={attention[0].href}
        />
      ) : (
        /* No link: there is no list of things that are fine, and a tile that navigates to
           an empty one teaches the reader that tiles lie. */
        <StatTile
          label="Needs attention"
          value={0}
          hint="Every enabled subscription ran, and every clause in scope has evidence."
          icon={<CheckCircleOutlined />}
          tone="success"
        />
      )}

      {/* Sealed artefacts live in a framework's package history, so that is where this
          goes — the reference and the seal it carries are quoted here so the reader knows
          which one they are about to open. */}
      {latest ? (
        <StatTile
          label="Last delivered"
          value={formatDate(latest.sealedAt)}
          hint={`${latest.id} · ${REPORT_STATE[latest.state].label} seal`}
          icon={<InventoryOutlined />}
          tone="neutral"
          href={latestFramework?.href}
        />
      ) : (
        <StatTile
          label="Last delivered"
          value="None yet"
          hint="Nothing has been sealed. Open a framework to seal its first package."
          icon={<InventoryOutlined />}
          tone="neutral"
        />
      )}
    </div>
  );
}
