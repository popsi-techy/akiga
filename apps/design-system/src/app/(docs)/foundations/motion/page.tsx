'use client';

import { PageHeader, Section, Card, Code } from '@/components/docs/primitives';
import { motion } from '@ds/tokens/tokens';

export default function MotionPage() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Motion"
        description="Movement is calm and purposeful — fast enough to feel responsive, never decorative. Motion communicates state change; it doesn't entertain."
      />

      <Section title="Durations">
        <Card className="divide-y divide-border">
          {Object.entries(motion.duration).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4 px-5 py-3">
              <div className="w-24 shrink-0 font-mono text-caption text-text-secondary">{key}</div>
              <div className="w-16 shrink-0 font-mono text-caption text-text-tertiary">{value}</div>
              <div className="group flex-1">
                <div
                  className="h-2 w-8 rounded-pill bg-brand transition-transform ease-out group-hover:translate-x-[calc(100%-2rem)]"
                  style={{ transitionDuration: value }}
                />
              </div>
              <span className="text-caption text-text-disabled">hover the row</span>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Easing">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(motion.easing).map(([key, value]) => (
            <Card key={key} className="p-4">
              <div className="text-body-sm-strong capitalize text-text-primary">{key}</div>
              <div className="mt-0.5 font-mono text-caption text-text-tertiary">{value}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Rules">
        <Card className="p-5 text-body-sm leading-6 text-text-secondary">
          Use <Code>fast</Code> for hovers and small state changes, <Code>base</Code> for most
          transitions (drawers, expands), <Code>slow</Code> for large surfaces. Always pair with{' '}
          <Code>easing.standard</Code> unless entering (<Code>decelerate</Code>) or exiting (
          <Code>accelerate</Code>). Respect <Code>prefers-reduced-motion</Code> — disable non-essential
          animation.
        </Card>
      </Section>
    </>
  );
}
