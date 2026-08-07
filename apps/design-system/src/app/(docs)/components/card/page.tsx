import Campaign from '@mui/icons-material/Campaign';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Card, Button } from '@ds/components';

export default function CardDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Card"
        description="The product's content container. A card with a header renders the framed treatment — a soft grey frame with a compact transparent header (15px filled icon + 15px regular title + action) above a white rounded inner panel. A card without a header is a plain bordered white card. Pass variant='flat' for the legacy header-band look."
      />

      <Section title="Basic" description="A plain container with body padding.">
        <Example label="body only">
          <div className="w-full max-w-md">
            <Card>
              <p className="text-body text-text-secondary">
                Track and manage access from one central place.
              </p>
            </Card>
          </div>
        </Example>
      </Section>

      <Section title="With header (framed)" description="A leading filled icon, title, and a right-aligned action sit in a compact transparent header above a white inner panel, all wrapped in a soft grey frame — the default for header-cards (dashboard, detail overviews).">
        <Example label="icon + title + action + footer">
          <div className="w-full max-w-md">
            <Card
              raised
              icon={<Campaign />}
              title="Access Certification"
              action={<Button size="sm" variant="secondary">View all</Button>}
              footer={<span>Updated 2 hours ago</span>}
            >
              <p className="text-body text-text-secondary">Body content goes here.</p>
            </Card>
          </div>
        </Example>
      </Section>

      <Section
        title="Variations"
        description="Framed flush-list body keeps a horizontal content gutter so row dividers never merge into the panel border. Use variant='flat' for the legacy header-band."
      >
        <Example label="framed flush list (inset dividers)">
          <div className="w-full max-w-md">
            <Card title="Flush list" padding="none">
              <div className="divide-y divide-border-subtle text-body-sm">
                <div className="py-3 text-text-primary">Row one</div>
                <div className="py-3 text-text-primary">Row two</div>
              </div>
            </Card>
          </div>
        </Example>
        <Example label="variant='flat' (legacy header band)">
          <div className="w-full max-w-md">
            <Card variant="flat" raised title="Flat header" action={<Button size="sm" variant="tertiary">Edit</Button>}>
              <p className="text-body-sm text-text-secondary">The legacy grey header band on a bordered card.</p>
            </Card>
          </div>
        </Example>
      </Section>

      <Section title="Elevation" description="Border-first by default; opt into a faint shadow only for genuinely raised cards.">
        <Example label="default (flat) vs raised">
          <div className="w-48">
            <Card title="Flat">
              <p className="text-body-sm text-text-secondary">Border only.</p>
            </Card>
          </div>
          <div className="w-48">
            <Card title="Raised" raised>
              <p className="text-body-sm text-text-secondary">shadow-xs.</p>
            </Card>
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'title / subtitle', type: 'ReactNode', description: 'Header content (renders the header + divider).' },
            {
              name: 'icon',
              type: 'ReactNode',
              description:
                'Leading filled icon before the title (prefer MUI filled, not Outlined). Card sizes it to 15px and colors it text-icon unless you pass a status/brand accent.',
            },
            { name: 'action', type: 'ReactNode', description: 'Right-aligned header slot (button, menu, filter).' },
            { name: 'footer', type: 'ReactNode', description: 'Footer content under a top divider.' },
            { name: 'raised', type: 'boolean', default: 'false', description: 'Opt-in faint elevation (use on white/flat pages).' },
            { name: 'variant', type: "'framed' | 'flat'", default: "'framed'", description: 'Header-cards: framed (grey frame + white panel) or legacy flat band.' },
            { name: 'headerTone', type: "'subtle' | 'plain'", default: "'subtle'", description: 'Flat variant only — grey header band or plain white.' },
            {
              name: 'padding',
              type: "'none' | 'sm' | 'md' | 'lg'",
              default: "'md'",
              description:
                'Body padding. none still keeps a horizontal content gutter so flush-list dividers stay inset from the panel edge.',
            },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use border-first (flat) as the default.',
            'Reserve raised for cards that must pop (e.g. a hovered/selected card).',
            'Use the header slot for a title + one action.',
            'Use padding="none" for flush lists — omit horizontal padding on rows; Card supplies the gutter.',
            'Use filled MUI icons in the header (Card sizes them to 15px).',
            'Leave header icons uncolored so they inherit the Design System icon color.',
          ]}
          donts={[
            'Don’t add shadows to resting cards for decoration.',
            'Don’t nest multiple raised cards.',
            'Don’t hardcode borders/radius — the card owns them.',
            'Don’t put more than one primary action in the header.',
            'Don’t use Outlined icons or set a custom fontSize on Card header icons.',
            'Don’t brand-tint every card header icon — reserve color for status meaning.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Card } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
