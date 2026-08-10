'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { NavList } from '@ds/components';

export default function NavListDocs() {
  const [value, setValue] = React.useState('owners');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Nav List"
        description="A vertical single-select list of sections, each with an optional leading icon and a trailing count. For in-panel switchers: owner and group toggles, settings sections, entity sub-views."
      />

      <Section
        title="Active is outlined, not filled"
        description="The active item takes a brand outline, brand icon and a filled count pill; inactive items stay quiet with a hover fill. It reports role=tablist, so it is a view switcher to assistive technology, not a menu."
      >
        <Example label="In a panel">
          <div className="w-[280px] rounded-lg border border-border bg-surface p-3">
            <NavList
              ariaLabel="Ownership sections"
              value={value}
              onChange={setValue}
              items={[
                { id: 'owners', label: 'Owners', icon: <PersonOutline sx={{ fontSize: 18 }} />, count: 4 },
                { id: 'groups', label: 'Governance groups', icon: <GroupsOutlined sx={{ fontSize: 18 }} />, count: 2 },
                { id: 'reviewers', label: 'Reviewers', icon: <ShieldOutlined sx={{ fontSize: 18 }} />, count: 0 },
                { id: 'audit', label: 'Audit trail' },
              ]}
            />
          </div>
          <span className="text-body-sm text-text-secondary">
            selected: <Code>{value}</Code>
          </span>
        </Example>
      </Section>

      <Section
        title="Not Tabs, not a sidebar"
        description="Tabs sit above the content they switch and belong to a page. NavList sits beside its content, inside a panel, and is the right choice when the labels are long, the set may grow, or each item carries a count. The product sidebar is neither — it is the app frame's own navigation."
      >
        <PropsTable
          rows={[
            { name: 'items', type: 'NavListItem[]', description: 'id, label, optional icon, optional count.' },
            { name: 'value', type: 'string', description: 'The active item id. Controlled — the parent owns it.' },
            { name: 'onChange', type: '(id: string) => void', description: 'Fires with the chosen id.' },
            { name: 'ariaLabel', type: 'string', description: 'Names the tablist. Required — the items only label themselves.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Show counts when the number is what the user is choosing between.',
            'Render count={0} rather than omitting it, so an empty section is visibly empty.',
            'Keep icons optional and consistent — either every item has one or none does.',
            'Use it inside a bordered panel; it supplies no chrome of its own.',
          ]}
          donts={[
            'Don’t use it for actions — items express which view is showing, not what happens.',
            'Don’t use it for multi-select; it is single-choice by contract.',
            'Don’t nest NavLists; two levels of section switching means the panel is doing too much.',
            'Don’t use it where a horizontal Tabs bar already switches the same content.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { NavList } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
