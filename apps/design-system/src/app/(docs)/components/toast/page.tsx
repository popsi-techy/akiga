'use client';

import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import { Button, useToast } from '@ds/components';

export default function ToastDocs() {
  const toast = useToast();
  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="Toast"
        description="Transient feedback for the result of an action. A white card with a solid intent icon, the message, a dismiss button, and a bottom progress bar that depletes over the auto-dismiss duration. Triggered imperatively with useToast()."
      />

      <Section title="Intents" description="Click to fire a toast (top-right). Errors are announced assertively.">
        <Example label="success · error · warning · info">
          <Button variant="secondary" onClick={() => toast.success('Request submitted')}>Success</Button>
          <Button variant="secondary" onClick={() => toast.error('Invalid email or password.')}>Error</Button>
          <Button variant="secondary" onClick={() => toast.warning('Certification due in 2 days')}>Warning</Button>
          <Button variant="secondary" onClick={() => toast.info('Sync started')}>Info</Button>
        </Example>
      </Section>

      <Section title="With title & custom duration">
        <Example label="title + body · persistent">
          <Button
            variant="secondary"
            onClick={() => toast.error('Reviewer unavailable — try another approver.', { title: 'Approval failed' })}
          >
            Title + body
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.info('Provisioning in progress…', { duration: 0 })}
          >
            Persistent (duration 0)
          </Button>
          <Button variant="secondary" onClick={() => toast.success('Saved', { duration: 10000 })}>
            10s
          </Button>
        </Example>
      </Section>

      <Section title="Setup" description="Wrap the app once; call the hook anywhere below it.">
        <div className="rounded-lg border border-border bg-sunken p-4 font-mono text-caption leading-6 text-text-primary">
          <div>{`// app root`}</div>
          <div>{`<ToastProvider><App /></ToastProvider>`}</div>
          <div className="mt-2">{`// anywhere in a component`}</div>
          <div>{`const toast = useToast();`}</div>
          <div>{`toast.error('Invalid email or password.');`}</div>
          <div>{`toast.success('3 items certified');`}</div>
        </div>
      </Section>

      <Section title="Props (useToast / ToastOptions)">
        <PropsTable
          rows={[
            { name: 'toast.success/error/warning/info', type: '(message, opts?) => void', description: 'Shortcut per intent.' },
            { name: 'toast.show', type: '(ToastOptions) => void', description: 'Full control.' },
            { name: 'message', type: 'string', description: 'Primary text.' },
            { name: 'title', type: 'string', description: 'Optional bold heading above the message.' },
            { name: 'intent', type: "'success'|'error'|'warning'|'info'", default: "'info'", description: 'Icon + progress color.' },
            { name: 'duration', type: 'number (ms)', default: '5000', description: '0 = persistent (no timer/bar).' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'State the result: “Request submitted”, “3 items certified”.',
            'Use error for failures, with what to do next.',
            'Keep it to one short line where possible.',
            'Pair a durable state change with the toast (don’t rely on it alone).',
          ]}
          donts={[
            'Don’t use toasts for critical decisions — use a Dialog.',
            'Don’t stack many at once for one action.',
            'Don’t put actions the user must take inside a 5s toast.',
            'Don’t rely on color alone — the icon + text carry meaning.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { ToastProvider, useToast } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
