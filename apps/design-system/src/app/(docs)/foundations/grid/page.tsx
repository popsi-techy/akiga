import { PageHeader, Section, Card, Code, TokenTable } from '@/components/docs/primitives';
import { breakpoints, layout } from '@ds/tokens/tokens';

export default function GridPage() {
  return (
    <>
      <PageHeader
        eyebrow="Foundations"
        title="Grid & Layout"
        description="The app shell and responsive breakpoints. Desktop-first (a knowledge worker at a desk), but nothing breaks on smaller viewports."
      />

      <Section title="App shell" description="A fixed sidebar + top bar + scrollable content — the frame every product screen sits in.">
        <Card className="p-4">
          <div className="flex h-48 overflow-hidden rounded-md border border-border">
            <div className="flex w-32 flex-col bg-sidebar p-3">
              <div className="mb-3 h-4 w-16 rounded-xs bg-white/30" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mb-1.5 h-3 w-full rounded-xs bg-white/10" />
              ))}
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex h-10 items-center border-b border-border px-3">
                <div className="h-3 w-24 rounded-xs bg-border-strong" />
              </div>
              <div className="flex-1 bg-subtle p-3">
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-md border border-border bg-surface" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-body-sm">
          {[
            ['Sidebar', layout.sidebarWidth],
            ['Top bar height', layout.topbarHeight],
            ['Content max-width', layout.contentMaxWidth],
          ].map(([l, v]) => (
            <Card key={l} className="flex items-center justify-between p-3">
              <span className="text-text-secondary">{l}</span>
              <Code>{v}</Code>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Breakpoints">
        <TokenTable
          head={['Token', 'Min width', 'Typical use']}
          rows={[
            [<Code key="1">sm</Code>, `${breakpoints.sm}px`, 'Large phones — stack cards'],
            [<Code key="2">md</Code>, `${breakpoints.md}px`, 'Tablets — 2-column grids'],
            [<Code key="3">lg</Code>, `${breakpoints.lg}px`, 'Laptops — sidebar + content'],
            [<Code key="4">xl</Code>, `${breakpoints.xl}px`, 'Desktops — full data density'],
            [<Code key="5">2xl</Code>, `${breakpoints['2xl']}px`, 'Wide — capped at content max-width'],
          ]}
        />
      </Section>

      <Section title="Grid rules">
        <Card className="p-5 text-body-sm leading-6 text-text-secondary">
          Content uses a 12-column mental model with a 24px gutter. Cards flow in responsive grids
          (1 → 2 → 3 columns). Detail pages use a two-column split (main + info sidebar), collapsing
          to a single column below <Code>lg</Code>. Keep the content column within{' '}
          <Code>{layout.contentMaxWidth}</Code> so line lengths stay readable on wide screens.
        </Card>
      </Section>
    </>
  );
}
