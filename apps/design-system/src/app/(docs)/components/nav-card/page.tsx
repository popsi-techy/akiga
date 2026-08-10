'use client';

import * as React from 'react';
import AppsOutlined from '@mui/icons-material/AppsOutlined';
import PolicyOutlined from '@mui/icons-material/PolicyOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import { PageHeader, Section, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { NavCard, useToast } from '@ds/components';

export default function NavCardDocs() {
  const toast = useToast();
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Nav Card"
        description="A launcher card for landing pages that route into a section: a title with a trailing arrow, a short description, an optional count, and tag chips. The whole card is the target."
      />

      <Section
        title="A grid of destinations"
        description="The caller owns the grid; the card owns its own layout and hover. Use it on a module landing page where the job is choosing where to go, not reading data."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NavCard
            title="Applications"
            description="Every governed system, its entitlements and its owners."
            count={143}
            icon={<AppsOutlined sx={{ fontSize: 20 }} />}
            tags={['Administrator', 'Auditor']}
            onClick={() => toast.info('Would navigate to Applications')}
          />
          <NavCard
            title="Policies"
            description="Birthright, approval and separation-of-duties rules."
            count={92}
            icon={<PolicyOutlined sx={{ fontSize: 20 }} />}
            tags={['Administrator']}
            onClick={() => toast.info('Would navigate to Policies')}
          />
          <NavCard
            title="Governance teams"
            description="The groups that own, review and approve access."
            icon={<GroupsOutlined sx={{ fontSize: 20 }} />}
            onClick={() => toast.info('Would navigate to Governance teams')}
          />
        </div>
        <p className="mt-3 text-body-sm text-text-secondary">
          Counts format with a fixed locale, so the server and the client render the same string and hydration does not
          mismatch.
        </p>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'title', type: 'string', description: 'The destination name, rendered at h5.' },
            { name: 'description', type: 'string', description: 'One line on what lives there.' },
            { name: 'count', type: 'number', description: 'How many records the view holds — an info-tinted chip.' },
            { name: 'tags', type: 'string[]', description: 'Small pills at the bottom, e.g. personas or categories.' },
            { name: 'icon', type: 'ReactNode', description: 'Leading icon in a brand-tint tile.' },
            { name: 'onClick', type: '() => void', description: 'Navigate. The whole card is the target.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Keep descriptions to one line — this is a signpost, not a summary.',
            'Show count when the number helps someone choose which card to open.',
            'Use consistent icon presence across a grid; a mixed grid looks broken.',
            'Wrap in a Link, or route inside onClick — do not put a button inside the card.',
          ]}
          donts={[
            'Don’t use it for actions that do something; a card that navigates should navigate.',
            'Don’t put more than one line of tags; past that it is a filter, not a label.',
            'Don’t use it as a stat tile — if the number is the point, that is StatTile.',
            'Don’t nest interactive elements inside; the card is already one target.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { NavCard } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
