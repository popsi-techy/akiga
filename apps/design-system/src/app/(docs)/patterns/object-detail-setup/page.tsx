import Link from 'next/link';
import { PageHeader, Section, DoDont } from '@/components/docs/primitives';

export default function ObjectDetailSetupPattern() {
  return (
    <>
      <PageHeader
        eyebrow="Patterns"
        title="Object-detail setup"
        description="A draft object is edited on its real tabs. The header stays put; a right-hand checklist names what still gates Activate or Connect. Emergency Access and Application onboarding are the reference."
      />

      <Section
        title="Anatomy"
        description="Setup happens on the page, not in a second wizard and not in a floating bar."
      >
        <ol className="list-decimal space-y-2 pl-5 text-body text-text-secondary">
          <li>
            Header: <span className="text-body-medium text-text-primary">ClickToEditText</span>{' '}
            for the name (required) and description (multiline). Status chip sits
            beside the name and does not move when editing starts.
          </li>
          <li>
            Tabs (or a 240px NavList) are the navigator. They name the editors.
          </li>
          <li>
            <span className="text-body-medium text-text-primary">SetupChecklistDock</span>{' '}
            on the right while the object is a draft. Close it from the dock or
            the setup-guide control.
          </li>
          <li>
            <span className="text-body-medium text-text-primary">SetupProgress</span> /
            <span className="text-body-medium text-text-primary"> SegmentedDonut</span> on
            the guide control, counting only the steps that gate the header
            action.
          </li>
          <li>
            Existence-only steps pass <code className="text-caption">seedDone</code>.
            Factory defaults pass <code className="text-caption">doneLabel</code>.
            Neither unlocks the Next prompt.
          </li>
        </ol>
        <p className="mt-4 text-body-sm text-text-secondary">
          Live building blocks:{' '}
          <Link href="/components/click-to-edit" className="text-text-brand hover:underline">
            Click to Edit
          </Link>
          {' · '}
          <Link href="/components/setup-checklist-dock" className="text-text-brand hover:underline">
            Setup Checklist Dock
          </Link>
          {' · '}
          <Link href="/components/setup-progress" className="text-text-brand hover:underline">
            Setup Progress
          </Link>
          . Decision in{' '}
          <code className="text-caption">docs/architecture/decisions/0015-promote-object-setup-compositions.md</code>.
        </p>
      </Section>

      <Section title="When to use">
        <DoDont
          dos={[
            'A draft whose remaining work is edited on the object itself.',
            'Applications onboarding (`gateVerb="connect"`) and Emergency Access (`activate`).',
          ]}
          donts={[
            'SetupBar. Parked — no product caller. Do not restyle it into the dock.',
            'A left setup rail that duplicates the tabs.',
            'A create wizard that previews upcoming steps. Create the object, then open the dock.',
          ]}
        />
      </Section>
    </>
  );
}
