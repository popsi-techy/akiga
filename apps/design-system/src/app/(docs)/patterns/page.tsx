import { PageHeader, Card } from '@/components/docs/primitives';

export default function PatternsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Patterns"
        title="Patterns"
        description="Composed, reusable solutions to recurring problems — data tables with bulk actions, task inboxes, detail layouts, wizards, and IGA-specific patterns. Coming after components."
      />
      <Card className="p-6 text-body leading-6 text-text-secondary">
        Patterns assemble components into proven solutions: the list/table pattern, the
        approval/certification inbox, the two-column detail layout, multi-step request wizards, and
        governance-specific patterns like SoD conflict display and emergency-access countdowns.
      </Card>
    </>
  );
}
