'use client';

import * as React from 'react';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Tooltip, Button, StatusChip } from '@ds/components';

export default function TooltipDocs() {
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Tooltip"
        description="A small contextual label on hover and focus. Extends MUI Tooltip for overlay, positioning and focus handling, and themes it with our tokens — the dark sidebar surface with white text, matching the product's inverse surfaces."
      />

      <Section
        title="Label — the default"
        description="A few words naming what a control does. This is the variant you almost always want, and it is what makes an icon-only button acceptable."
      >
        <Example label="On an icon-only control">
          <Tooltip title="Fit to view">
            <button
              type="button"
              aria-label="Fit to view"
              className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-icon hover:bg-surface-hover"
            >
              <InfoOutlined sx={{ fontSize: 18 }} />
            </button>
          </Tooltip>
          <Tooltip title="Placed to the right" placement="right">
            <Button variant="secondary">Hover me</Button>
          </Tooltip>
          <Tooltip title="No arrow" arrow={false}>
            <Button variant="tertiary">Arrowless</Button>
          </Tooltip>
        </Example>
      </Section>

      <Section
        title="Card — for rich content"
        description="A light surface panel when the explanation needs headings, dividers or chips. The tooltip contributes only the surface, border and elevation; the content supplies its own padding and type. No arrow by default — a bordered arrow cannot meet a bordered panel cleanly."
      >
        <Example label="variant=card">
          <Tooltip
            variant="card"
            placement="right"
            title={
              <div className="w-[260px] p-3">
                <div className="text-body-sm-strong text-text-primary">Risk score 82</div>
                <p className="mt-1 text-caption text-text-secondary">
                  Derived from entitlement privilege, account age and SoD exposure.
                </p>
                <div className="mt-2 border-t border-border pt-2">
                  <StatusChip intent="danger" label="Critical" />
                </div>
              </div>
            }
          >
            <Button variant="secondary">Show the breakdown</Button>
          </Tooltip>
        </Example>
      </Section>

      <Section
        title="The child must forward a ref"
        description="The single child anchors the overlay, so it has to be a DOM element or a component using forwardRef. Wrapping a plain function component will silently fail to position."
      >
        <PropsTable
          rows={[
            { name: 'title', type: 'ReactNode', description: 'The tooltip content. A short string for label; a node for card.' },
            { name: 'children', type: 'ReactElement', description: 'The single anchor element. Must forward a ref.' },
            { name: 'placement', type: 'MuiTooltipProps["placement"]', default: "'top'", description: 'Any MUI placement — top, right, bottom-start, and so on.' },
            { name: 'arrow', type: 'boolean', description: 'Pointer arrow. Defaults true for label, false for card.' },
            { name: 'variant', type: "'label' | 'card'", default: "'label'", description: 'Dark contextual label, or light surface panel for rich content.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Give every icon-only control a tooltip AND an aria-label — the tooltip is not an accessible name.',
            'Keep label tooltips to a few words; if it needs a sentence, it may belong on the page.',
            'Use card when the explanation has structure worth keeping.',
            'Explain what a disabled primary action needs in order to become enabled.',
          ]}
          donts={[
            'Don’t put interactive content in a label tooltip — it disappears on blur.',
            'Don’t hide information a user needs to complete the task behind hover.',
            'Don’t restate a visible label; a tooltip that repeats the button text is noise.',
            'Don’t wrap a component that does not forward a ref.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { Tooltip } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
