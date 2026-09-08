'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Button, Checkbox, Input, Select, Tooltip } from '@ds/components';
import { listApplications, listGovernanceTeamRows } from '@/data/directory';
import { listDepartments } from '@/data/governance';
import { dynamicFilterValues } from '@/data/governance-analytics-v2-derive';
import {
  ORGANIZATION_LABEL,
  OVERVIEW_SECTION_ID,
  SECTION_CATALOGUE,
  TIMELINE_OPTIONS,
  type OrganizationScope,
  type ReportOrganization,
  type ReportSectionV2,
} from '@/data/governance-analytics-v2';

/**
 * The four things a report is, as fields.
 *
 * Shared by the create screen and the edit dock, so the two can never drift into offering
 * different options for the same report — the dock is the same configuration, re-opened.
 * Layout is the caller's; this owns the controls and what they are allowed to say.
 */

/** Which values an organisation scope can take, read from the tenant rather than typed. */
export function organizationValues(scope: OrganizationScope): string[] {
  if (scope === 'department') return listDepartments().map((d) => d.name);
  if (scope === 'application') return listApplications().map((a) => a.name);
  if (scope === 'governanceTeam') return listGovernanceTeamRows().map((t) => t.name);
  return [];
}

export function NameAndDescriptionFields({
  name,
  description,
  onName,
  onDescription,
}: {
  name: string;
  description: string;
  onName: (v: string) => void;
  onDescription: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Report name"
        required
        placeholder="e.g. Access Posture — Engineering"
        value={name}
        onChange={(e) => onName(e.target.value)}
      />
      <Input
        label="Description"
        placeholder="What this report is for, and who reads it."
        value={description}
        onChange={(e) => onDescription(e.target.value)}
        multiline
        minRows={3}
      />
    </div>
  );
}

/**
 * Organisation and period — the only two settings that apply to the whole document.
 *
 * Two controls for organisation rather than one long list: "which axis" and "which one"
 * are different questions, and flattening them into `Department: Finance / Department:
 * Sales / Application: Okta / …` produces a menu that grows with the tenant.
 */
export function ScopeFields({
  organization,
  timelineId,
  onOrganization,
  onTimeline,
  stacked = false,
}: {
  organization: ReportOrganization;
  timelineId: string;
  onOrganization: (v: ReportOrganization) => void;
  onTimeline: (v: string) => void;
  /** Dock is 400px — a two-column grid there squeezes labels. Create stays side-by-side. */
  stacked?: boolean;
}) {
  const values = organizationValues(organization.scope);
  return (
    <div className={stacked ? 'flex flex-col gap-4' : 'grid gap-4 sm:grid-cols-2'}>
      <Select
        label="Organisation"
        value={organization.scope}
        onChange={(v) =>
          // Changing the axis clears the value: "Finance" is not a meaningful answer to
          // "which application", and carrying it over would let a report claim a scope
          // that does not exist.
          onOrganization({ scope: v as OrganizationScope, value: '' })
        }
        options={(Object.keys(ORGANIZATION_LABEL) as OrganizationScope[]).map((k) => ({
          value: k,
          label: ORGANIZATION_LABEL[k],
        }))}
      />
      {organization.scope === 'entire' ? (
        <Select label="Which one" value="" onChange={() => undefined} options={[]} disabled placeholder="Not needed" />
      ) : (
        <Select
          label="Which one"
          required
          placeholder="Choose…"
          value={organization.value}
          onChange={(v) => onOrganization({ ...organization, value: v })}
          options={values.map((v) => ({ value: v, label: v }))}
        />
      )}
      <Select
        label="Timeline"
        value={timelineId}
        onChange={onTimeline}
        options={TIMELINE_OPTIONS.map((t) => ({ value: t.id, label: t.label }))}
      />
      <p className={stacked ? 'text-caption text-text-tertiary' : 'self-end pb-2 text-caption text-text-tertiary'}>
        {TIMELINE_OPTIONS.find((t) => t.id === timelineId)?.covers}
      </p>
    </div>
  );
}

/**
 * Which sections the report contains, and what each one is narrowed to.
 *
 * The filters sit *inside* the section they belong to rather than in a global bar, which
 * is the whole point of V2: a reader can see that "Risk score above 75" applies to All
 * Permissions and to nothing else. A switched-off section keeps its filters — turning a
 * block off to see the report without it should not cost the configuration you set.
 */
export function SectionFields({
  sections,
  onChange,
}: {
  sections: ReportSectionV2[];
  onChange: (next: ReportSectionV2[]) => void;
}) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const update = (id: string, patch: Partial<ReportSectionV2>) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const groups: { category: string; items: typeof sections }[] = [];
  for (const cfg of sections) {
    const def = SECTION_CATALOGUE.find((d) => d.id === cfg.id);
    if (!def) continue;
    const last = groups[groups.length - 1];
    if (last && last.category === def.category) last.items.push(cfg);
    else groups.push({ category: def.category, items: [cfg] });
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.category}>
          <h4 className="text-overline uppercase text-text-tertiary">{group.category}</h4>
          <div className="mt-3 flex flex-col gap-3">
            {group.items.map((cfg) => {
              const def = SECTION_CATALOGUE.find((d) => d.id === cfg.id);
              if (!def) return null;
              const canConfigure = cfg.enabled && def.filters.length > 0;
              const open = canConfigure && openId === cfg.id;
              const configId = `${cfg.id}-config`;
              return (
                <div key={cfg.id} className="rounded-lg border border-border-subtle bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={cfg.enabled}
                      onChange={(checked) => {
                        update(cfg.id, { enabled: checked });
                        if (!checked && openId === cfg.id) setOpenId(null);
                      }}
                      ariaLabel={`Include ${def.title}`}
                    />
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      <span className="truncate text-body-sm-strong text-text-primary">{def.title}</span>
                      <Tooltip title={def.description} describeChild>
                        <Button
                          variant="tertiary"
                          size="xs"
                          iconOnly
                          aria-label={`About ${def.title}`}
                        >
                          <InfoOutlined sx={{ fontSize: 16 }} />
                        </Button>
                      </Tooltip>
                    </div>
                    {canConfigure ? (
                      <Button
                        variant="tertiary"
                        size="sm"
                        aria-expanded={open}
                        aria-controls={configId}
                        onClick={() => setOpenId(open ? null : cfg.id)}
                      >
                        Configure
                      </Button>
                    ) : null}
                  </div>

                  {open ? (
                    <div
                      id={configId}
                      role="region"
                      aria-label={`Configure ${def.title}`}
                      className="mt-4 grid gap-3 border-t border-border-subtle pt-4 sm:grid-cols-2"
                    >
                      {def.filters.map((f) => {
                        const options = f.dynamic ? dynamicFilterValues(f.dynamic) : f.values;
                        return (
                          <Select
                            key={f.id}
                            label={f.label}
                            value={cfg.filters[f.id] ?? options[0]}
                            onChange={(v) => update(cfg.id, { filters: { ...cfg.filters, [f.id]: v } })}
                            options={options.map((v) => ({ value: v, label: v }))}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The edit dock's section list.
 *
 * Different from {@link SectionFields} on purpose. Before the report exists every
 * catalogue entry is a *candidate* and the question is "include this?", so it is a
 * checkbox list. Once the report exists the sections in it are the document, and the
 * questions become "narrow this", "move this", "drop this" — a checkbox that silently
 * unpicks a block a reader has already read is the wrong control for that.
 *
 * Reorder is not here: it belongs on the sections themselves, where a reader can see what
 * they are moving. This list mirrors that order so the dock never disagrees with the page.
 */
export function SectionEditList({
  sections,
  onChange,
}: {
  sections: ReportSectionV2[];
  onChange: (next: ReportSectionV2[]) => void;
}) {
  const update = (id: string, patch: Partial<ReportSectionV2>) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  if (sections.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-subtle p-4 text-body-sm text-text-secondary">
        This report has no sections. Add one below to give it something to say.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map((cfg, index) => {
        const def = SECTION_CATALOGUE.find((d) => d.id === cfg.id);
        if (!def) return null;
        return (
          <div key={cfg.id} className="rounded-lg border border-border-subtle bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-caption tabular-nums text-text-tertiary">{index + 1}</span>
                  <span className="truncate text-body-sm-strong text-text-primary">{def.title}</span>
                </div>
                <p className="mt-0.5 text-caption text-text-secondary">{def.category}</p>
              </div>
              <button
                type="button"
                className="shrink-0 text-caption-medium text-text-link hover:underline"
                onClick={() => onChange(sections.filter((s) => s.id !== cfg.id))}
              >
                Remove
              </button>
            </div>

            {def.filters.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4">
                {def.filters.map((f) => {
                  const options = f.dynamic ? dynamicFilterValues(f.dynamic) : f.values;
                  return (
                    <Select
                      key={f.id}
                      label={f.label}
                      value={cfg.filters[f.id] ?? options[0]}
                      onChange={(v) => update(cfg.id, { filters: { ...cfg.filters, [f.id]: v } })}
                      options={options.map((v) => ({ value: v, label: v }))}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Catalogue sections this report does not already contain, in catalogue order. */
export function availableSections(sections: ReportSectionV2[]) {
  return SECTION_CATALOGUE.filter((d) => !sections.some((s) => s.id === d.id));
}

/** A section, as a report configures it the first time it is added. */
export function newSection(id: string): ReportSectionV2 {
  return { id, enabled: true, filters: {}, hiddenCharts: [] };
}

/**
 * The create-page checklist, with this report's included sections already ticked
 * and their filters carried over. Catalogue order — same as New report.
 */
export function dockSectionCandidates(inReport: ReportSectionV2[]): ReportSectionV2[] {
  return SECTION_CATALOGUE.map((def) => {
    const existing = inReport.find((s) => s.id === def.id);
    return existing
      ? { ...existing, enabled: true }
      : { id: def.id, enabled: false, filters: {}, hiddenCharts: [] };
  });
}

/**
 * Write the checklist back: keep the document's order for sections that stay,
 * append newly included ones at the end. Overview stays first if it is included.
 */
export function commitDockSections(previous: ReportSectionV2[], next: ReportSectionV2[]): ReportSectionV2[] {
  const enabled = next.filter((s) => s.enabled);
  const kept = previous
    .map((s) => enabled.find((e) => e.id === s.id))
    .filter((s): s is ReportSectionV2 => Boolean(s));
  const added = enabled.filter((e) => !previous.some((s) => s.id === e.id));
  const merged = [...kept, ...added];
  const overview = merged.find((s) => s.id === OVERVIEW_SECTION_ID);
  if (!overview) return merged;
  return [overview, ...merged.filter((s) => s.id !== OVERVIEW_SECTION_ID)];
}
