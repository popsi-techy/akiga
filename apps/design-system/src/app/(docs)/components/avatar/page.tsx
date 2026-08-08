import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import Person from '@mui/icons-material/Person';
import WorkOutline from '@mui/icons-material/WorkOutline';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Avatar, AvatarGroup, Card, InfoRow, InfoRowGroup } from '@ds/components';

export default function AvatarDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Avatar"
        description="Identity mark for people and entities. Default soft shape is a rounded-square for lists and tables. Circle shape is the profile-card treatment — fully round with a brand-tint ring. Shows an image when available, otherwise a single letter in brand orange (#EB5424) on the brand tint (#FFF4EE) — one letter, one colour pair, every avatar. That pairing is 3.33:1, a deliberate sub-AA exception recorded as a waiver in check-contrast.ts; the aria-label carries the full name, so nothing depends on reading the letter."
      />

      <Section title="Sizes">
        <Example label="xs · sm · md · lg">
          <Avatar name="Amelia Ford" size="xs" />
          <Avatar name="Amelia Ford" size="sm" />
          <Avatar name="Amelia Ford" size="md" />
          <Avatar name="Amelia Ford" size="lg" />
        </Example>
      </Section>

      <Section
        title="Shapes"
        description="Use soft in dense lists. Use circle on profile / “Violated by” cards."
      >
        <Example label="soft (default) vs circle (profile)">
          <Avatar name="Aman Kumar" size="md" shape="soft" />
          <Avatar name="Aman Kumar" size="md" shape="circle" />
          <Avatar name="Amelia Ford" size="lg" shape="circle" />
        </Example>
      </Section>

      <Section title="Initials" description="Two letters for people (first + last); override for apps/entities.">
        <Example label="derived vs overridden">
          <Avatar name="Scott William" size="md" />
          <Avatar name="Jessica Liu" size="md" />
          <Avatar name="Bitbucket Production Env" initials="B" size="md" />
          <Avatar name="GitHub Staging" initials="G" size="md" />
        </Example>
      </Section>

      <Section title="Group" description="Overlapping avatars with a +N overflow.">
        <Example label="AvatarGroup (max 4)">
          <AvatarGroup
            names={['Bob Smith', 'Grace Lee', 'Emily Davis', 'Daniel White', 'Catherine Brown', 'Henry Taylor']}
            max={4}
            size="md"
          />
        </Example>
      </Section>

      <Section title="In a profile card">
        <Example label="framed Card + circle Avatar">
          <div className="w-full max-w-sm">
            <Card
              title="Profile Overview"
              icon={<Person />}
              padding="none"
            >
              <div className="flex items-center gap-3 border-b border-border py-3">
                <Avatar name="Aman Kumar" size="md" shape="circle" />
                <div className="min-w-0">
                  <div className="text-body-strong text-text-primary">aman kumar</div>
                  <div className="truncate text-caption text-text-secondary">
                    aman.kumar@example.com
                  </div>
                </div>
              </div>
              <InfoRowGroup>
                <InfoRow
                  icon={<ApartmentOutlined sx={{ fontSize: 18 }} />}
                  label="Department"
                  value="Engineering"
                />
                <InfoRow
                  icon={<WorkOutline sx={{ fontSize: 18 }} />}
                  label="Job title"
                  value="SDE 1"
                />
              </InfoRowGroup>
            </Card>
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'name', type: 'string', description: 'Used to derive initials and the aria-label.' },
            { name: 'src', type: 'string', description: 'Image URL; falls back to initials if absent.' },
            { name: 'initials', type: 'string', description: 'Override the derived initials (apps/entities).' },
            { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'sm'", description: '24 / 32 / 40 / 48px.' },
            {
              name: 'shape',
              type: "'soft' | 'circle'",
              default: "'soft'",
              description: 'soft = rounded-square; circle = grey outline with a 2px surface gap.',
            },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Pass name so the avatar has an accessible label.',
            'Use shape="circle" on profile / identity cards.',
            'Use soft (default) in tables, groups, and dense lists.',
            'Use size sm in tables, md in profile headers, lg on detail pages.',
          ]}
          donts={[
            'Don’t put white text on a solid brand fill at this size (fails AA).',
            'Don’t use images without a name/alt.',
            'Don’t hand-roll avatar circles — use shape="circle".',
            'Don’t pass more than one character to initials — it is truncated anyway.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Avatar, AvatarGroup } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
