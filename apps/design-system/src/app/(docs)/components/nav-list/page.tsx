'use client';

import * as React from 'react';
import PersonOutline from '@mui/icons-material/PersonOutline';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Menu, NavList, StatusChip } from '@ds/components';

export default function NavListDocs() {
  const [value, setValue] = React.useState('owners');
  const [call, setCall] = React.useState('fetch');

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Nav List"
        description="A vertical single-select list of sections, each with an optional leading icon and a trailing count. For in-panel switchers: owner and group toggles, settings sections, entity sub-views."
      />

      <Section
        title="Active is outlined, not filled"
        description="The active item takes a brand outline and a filled count pill; inactive items stay quiet with a hover fill. Icons keep the default icon colour in both states. It reports role=tablist, so it is a view switcher to assistive technology, not a menu."
      >
        <Example label="In a panel">
          <div className="w-[280px] rounded-lg border border-border bg-surface p-3">
            <NavList
              ariaLabel="Ownership sections"
              value={value}
              onChange={setValue}
              items={[
                { id: 'owners', label: 'Owners', icon: <PersonOutline sx={{ fontSize: 18 }} />, count: 4 },
                { id: 'groups', label: 'Governance teams', icon: <GroupsOutlined sx={{ fontSize: 18 }} />, count: 2 },
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
        title="A chip instead of a count, and a control of its own"
        description="`trailing` replaces the count pill with anything else a row needs to report — a status chip, a short reading. `action` puts a second control on the row: it renders outside the tab button, because a button inside a button is invalid HTML that React will not hydrate. Selecting and acting on a row stay two separate targets with two separate names."
      >
        <Example label="Switcher with row actions">
          <div className="w-[280px] rounded-lg border border-border bg-surface p-3">
            <NavList
              ariaLabel="Calls"
              value={call}
              onChange={setCall}
              /* Every row carries the action, not just the one that needs demonstrating: a
                 kebab shifts everything on its row inward, so a list where only some rows
                 have one has two right edges. */
              items={[
                { id: 'fetch', label: 'Accounts Fetch', status: 'success' as const, statusLabel: 'Ready' },
                { id: 'update', label: 'Account Update', status: 'warning' as const, statusLabel: 'Incomplete' },
                { id: 'revoke', label: 'Account Entitlement Revocation', status: 'info' as const, statusLabel: 'Draft' },
              ].map((c) => ({
                id: c.id,
                label: c.label,
                trailing: <StatusChip intent={c.status} label={c.statusLabel} />,
                action: (
                  <Menu
                    ariaLabel={`Actions for ${c.label}`}
                    items={[
                      { label: 'Delete', icon: <DeleteOutline sx={{ fontSize: 18 }} />, danger: true, onClick: () => undefined },
                    ]}
                  />
                ),
              }))}
            />
          </div>
          <span className="text-body-sm text-text-secondary">
            selected: <Code>{call}</Code>
          </span>
        </Example>
      </Section>

      <Section
        title="Not Tabs, not a sidebar"
        description="Tabs sit above the content they switch and belong to a page. NavList sits beside its content, inside a panel, and is the right choice when the labels are long, the set may grow, or each item carries a count. The product sidebar is neither — it is the app frame's own navigation."
      >
        <PropsTable
          rows={[
            { name: 'items', type: 'NavListItem[]', description: 'id, label, optional icon, and one of count / trailing, plus an optional action.' },
            { name: 'items[].count', type: 'number', description: 'Shorthand for the usual trailing thing — rendered as a pill, filled when active.' },
            { name: 'items[].trailing', type: 'ReactNode', description: 'Anything else on the trailing edge. Replaces count; a row has one trailing slot.' },
            { name: 'items[].action', type: 'ReactNode', description: 'A control that acts on the row rather than selecting it — a Menu kebab. Rendered outside the tab button.' },
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
            'Put row actions in `action`, so the kebab keeps its own target and its own name.',
          ]}
          donts={[
            'Don’t use it for actions — items express which view is showing, not what happens.',
            'Don’t use it for multi-select; it is single-choice by contract.',
            'Don’t nest NavLists; two levels of section switching means the panel is doing too much.',
            'Don’t use it where a horizontal Tabs bar already switches the same content.',
            'Don’t give one row both `count` and `trailing` — the trailing edge holds one thing.',
            'Don’t put an action on some rows only; a kebab shifts its row inward and the list gets two right edges.',
            'Don’t rebuild it locally to add a slot. A fork of a switcher drifts on every state it owns.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { NavList } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
