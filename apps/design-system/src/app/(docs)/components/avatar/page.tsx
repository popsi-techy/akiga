import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import Person from '@mui/icons-material/Person';
import WorkOutline from '@mui/icons-material/WorkOutline';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import EventBusy from '@mui/icons-material/EventBusy';
import LinkOff from '@mui/icons-material/LinkOff';
import Policy from '@mui/icons-material/Policy';
import { Avatar, AvatarGroup, Card, InfoRow, InfoRowGroup } from '@ds/components';

export default function AvatarDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Avatar"
        description="Identity mark for people and entities. Default soft shape is a rounded-square for lists and tables. Circle shape is the profile-card treatment — fully round with a brand-tint ring. Shows an image when available, otherwise a single letter in brand orange (#EB5424) on the brand tint (#FFF4EE) — one letter, one colour pair, every avatar. That pairing is 3.33:1, a deliberate sub-AA exception recorded as a waiver in check-contrast.ts; the aria-label carries the full name, so nothing depends on reading the letter."
      />

      <Section title="Sizes" description="Box · letter — xs 24/12 · sm 32/16 · md 40/20 · lg 48/24. Entity corners use radius.avatar (6px).">
        <Example label="xs · sm · md · lg">
          <Avatar name="Amelia Ford" size="xs" />
          <Avatar name="Amelia Ford" size="sm" />
          <Avatar name="Amelia Ford" size="md" />
          <Avatar name="Amelia Ford" size="lg" />
        </Example>
      </Section>

      <Section
        title="Shape carries meaning: a circle is a person"
        description="Almost every list in an IGA product mixes people with things — an owners table, an application, a policy, a governance team all arrive as a letter on a tint. The shape says which one you are looking at before you read the name, and it is the convention every reader brings in from Slack, Google and GitHub. The prop asks what the subject IS, not what it should look like: a caller always knows whether it is rendering a person, and should not also have to know that people are round."
      >
        <Example label="person (round) vs entity (rounded square, default)">
          <Avatar name="Aman Kumar" size="md" kind="person" />
          <Avatar name="Amelia Ford" size="md" kind="person" />
          <Avatar name="SAP S/4HANA Finance" initials="S" size="md" />
          <Avatar name="Finance SoD Policy" initials="F" size="md" />
        </Example>
        <p className="mt-3 max-w-2xl text-body-sm text-text-secondary">
          The grey outline appears on every person avatar except <code>xs</code>. It was once limited to{' '}
          <code>md</code> and <code>lg</code> on the reasoning that a dense row does not need the weight,
          but the ring is what separates a person&rsquo;s tint from the surface behind it, and a screen
          where the 32px avatars had no ring and the 40px ones did read as two components. At{' '}
          <code>xs</code> it stays off: a 1px ring with a 2px offset is a third of a 24px box&rsquo;s
          visual radius and reads as a smudge. It is drawn <em>outside</em> the avatar&rsquo;s own box, so a
          container that clips its overflow will shave it — in a <code>DataTable</code>, give that column{' '}
          <code>wrap</code>.
        </p>
        <Example label="xs — no ring; sm · md · lg — ring">
          <Avatar name="Amelia Ford" size="xs" kind="person" />
          <Avatar name="Amelia Ford" size="sm" kind="person" />
          <Avatar name="Amelia Ford" size="md" kind="person" />
          <Avatar name="Amelia Ford" size="lg" kind="person" />
        </Example>
      </Section>

      <Section title="Initials" description="One letter, always — derived from the name, or overridden for an entity whose first character is not its mark.">
        <Example label="derived vs overridden">
          <Avatar name="Scott William" size="md" />
          <Avatar name="Jessica Liu" size="md" />
          <Avatar name="Bitbucket Production Env" initials="B" size="md" />
          <Avatar name="GitHub Staging" initials="G" size="md" />
        </Example>
      </Section>

      <Section
        title="Group"
        description="Overlapping avatars with a +N overflow. The group takes the same kind as a single avatar, so people stack as circles and things stack as rounded squares — and the separating ring follows the shape. Overlap is a quarter of the box: these avatars carry one letter, and past a quarter the glyph disappears under its neighbour."
      >
        <Example label="people (kind=person, max 4)">
          <AvatarGroup
            names={['Bob Smith', 'Grace Lee', 'Emily Davis', 'Daniel White', 'Catherine Brown', 'Henry Taylor']}
            max={4}
            size="md"
            kind="person"
          />
        </Example>
        <Example label="things (kind=entity — accounts, roles, teams)">
          <AvatarGroup
            names={['svc-okta-provisioning', 'Salesforce', 'legacy-admin', 'AWS']}
            max={3}
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
                <Avatar name="Aman Kumar" size="md" kind="person" />
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
            'Use kind="person" on profile / identity cards.',
            'Use soft (default) in tables, groups, and dense lists.',
            'Use size sm in tables, md in profile headers, lg on detail pages.',
          ]}
          donts={[
            'Don’t put white text on a solid brand fill at this size (fails AA).',
            'Don’t use images without a name/alt.',
            'Don’t hand-roll avatar circles — use kind="person".',
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
