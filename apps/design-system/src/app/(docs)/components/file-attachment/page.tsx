'use client';

import * as React from 'react';
import { PageHeader, Section, Example, PropsTable, DoDont, Code } from '@/components/docs/primitives';
import {
  FileAttachmentField,
  type FileAttachment,
} from '@ds/components';

const SAMPLE: FileAttachment[] = [
  {
    id: 'att-docs-1',
    name: 'manager-approval.pdf',
    size: 84211,
    mimeType: 'application/pdf',
    kind: 'pdf',
    dataUrl: 'data:application/pdf;base64,JVBERi0xLjEKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PmVuZG9iagoyIDAgb2JqCjw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCAzMDAgMTQ0XT4+ZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxNzYKJSVFT0Y=',
    addedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'att-docs-2',
    name: 'role-change-note.docx',
    size: 22140,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    kind: 'word',
    dataUrl: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
    addedAt: '2026-09-01T10:01:00.000Z',
    status: 'success',
  },
];

const STATES: FileAttachment[] = [
  {
    id: 'att-docs-uploading',
    name: 'org-chart.png',
    size: 173015,
    mimeType: 'image/png',
    kind: 'image',
    dataUrl: '',
    addedAt: '2026-09-03T10:00:00.000Z',
    status: 'uploading',
    progress: 64,
  },
  {
    ...SAMPLE[0],
    id: 'att-docs-ok',
    status: 'success',
  },
  {
    id: 'att-docs-failed',
    name: 'scan.heic',
    size: 2400112,
    mimeType: 'image/heic',
    kind: 'pdf',
    dataUrl: '',
    addedAt: '2026-09-03T10:01:00.000Z',
    status: 'failed',
    error: 'scan.heic isn’t a PDF, Word document, or image.',
  },
];

export default function FileAttachmentDocs() {
  const [files, setFiles] = React.useState<FileAttachment[]>([]);
  const [error, setError] = React.useState<string | undefined>();

  return (
    <>
      <PageHeader
        eyebrow="Components"
        title="File Attachment"
        description="Optional supporting files on a form — PDF, Word, or image. One field: empty is a quiet add row, filled is hairline-divided files. Evidence, not a stack of cards."
      />

      <Section title="Empty">
        <Example label="the compact drop target">
          <div className="w-80">
            <FileAttachmentField
              files={files}
              onChange={(next) => {
                setError(undefined);
                setFiles(next);
              }}
              onReject={(rejects) => setError(rejects[0]?.message)}
              error={error}
              hint="Reviewers see these with the justification. Optional."
            />
          </div>
        </Example>
      </Section>

      <Section title="Filled">
        <Example label="rows + add more">
          <div className="w-80">
            <FileAttachmentField files={SAMPLE} onChange={() => undefined} />
          </div>
        </Example>
      </Section>

      <Section title="States">
        <Example label="uploading, success, failed">
          <div className="w-80">
            <FileAttachmentField files={STATES} onChange={() => undefined} />
          </div>
        </Example>
      </Section>

      <Section title="Read-only">
        <Example label="after submit — open, don’t edit">
          <div className="w-80">
            <FileAttachmentField files={SAMPLE} readOnly />
          </div>
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable
          rows={[
            { name: 'files', type: 'FileAttachment[]', description: 'Attached files. Controlled. Each file may carry uploading, success, or failed.' },
            { name: 'onChange', type: '(files) => boolean | void', description: 'Ready files after add, or the list after remove. Return false when persist failed.' },
            { name: 'onReject', type: '(errors) => void', description: 'Wrong type, over size, or over the file limit.' },
            { name: 'label', type: 'string', default: "'Supporting files'", description: 'Visible field label.' },
            { name: 'hint', type: 'ReactNode', description: 'First-read explanation on the label’s info icon.' },
            { name: 'maxFiles', type: 'number', description: 'Optional count cap. Omit so the user can attach as many files as they need.' },
            { name: 'maxBytes', type: 'number', default: '1.5 MB', description: 'Per-file size limit.' },
            { name: 'fill', type: 'boolean', description: 'Fill leftover height in a flex column and scroll the list inside — for a rail with a pinned footer.' },
            { name: 'readOnly', type: 'boolean', description: 'List only — no add or remove. Used on submitted requests.' },
            { name: 'disabled', type: 'boolean', description: 'Blocks interaction while still showing the current files.' },
            { name: 'error', type: 'string', description: 'Error message under the field.' },
          ]}
        />
      </Section>

      <Section title="Guidelines">
        <DoDont
          dos={[
            'Use it as supporting evidence under a justification or decision, not as the primary field.',
            'Keep files as hairline rows inside one well — a card per file boxes a list.',
            'Let the row carry uploading, success, and failed — don’t toast the same story a second time.',
            'Pass readOnly on submitted or reviewer surfaces so the list is evidence, not an editor.',
          ]}
          donts={[
            'Don’t make attachments required unless a policy actually requires evidence.',
            'Don’t accept arbitrary file types — the component is PDF, Word, and image on purpose.',
            'Don’t restyle the dashed row into a card inside a card.',
            'Don’t invent a second attachment list on the same request.',
          ]}
        />
        <p className="mt-3 text-body-sm text-text-tertiary">
          <Code>{`import { FileAttachmentField } from '@ds/components';`}</Code>
        </p>
      </Section>
    </>
  );
}
