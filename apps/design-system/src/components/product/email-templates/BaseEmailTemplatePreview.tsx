import HeadsetMicOutlined from '@mui/icons-material/HeadsetMicOutlined';
import { color } from '@ds/tokens/tokens';
import type { EmailTemplateContent } from '@/data/email-templates';
import { EmailTemplateBodySlot } from './EmailTemplateBodySlot';

/** Served from `public/brand/miniorange-logo.png`. */
export const MINIORANGE_LOGO_SRC = '/brand/miniorange-logo.png';

function MiniorangeLogo({ className }: { className?: string }) {
  return (
    <img
      src={MINIORANGE_LOGO_SRC}
      alt="miniOrange"
      className={className ?? 'h-6 w-auto shrink-0 sm:h-7'}
    />
  );
}

export function BaseEmailTemplatePreview({ content }: { content: EmailTemplateContent }) {
  return (
    <div
      className="flex min-h-full w-full flex-col items-center px-3 py-4 sm:px-4 sm:py-10"
      style={{ backgroundColor: color.background.emailPreview }}
    >
      {/* On phones the frosted frame drops away — real mail clients render edge-to-edge. */}
      <div className="w-full max-w-[650px] sm:rounded-[17px] sm:border-2 sm:border-white/80 sm:bg-white/30 sm:p-3 sm:backdrop-blur-sm">
        <article
          className="flex w-full min-w-0 flex-col overflow-hidden rounded-lg bg-surface shadow-md sm:rounded-xl"
          aria-label="Email template preview"
        >
          <header className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-h5 text-text-primary">{content.greetingName}</span>
                <span className="text-body-lg leading-none" aria-hidden>
                  👋
                </span>
              </div>
              <p className="mt-0.5 text-body-sm text-text-secondary">{content.greetingLine}</p>
            </div>
            <MiniorangeLogo className="self-center" />
          </header>

          <div className="flex flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6">
            <h1 className="break-words text-h5 text-text-primary sm:text-h4">{content.heading}</h1>

            <EmailTemplateBodySlot content={content} />

            <div className="flex flex-col gap-1">
              <p className="text-h5 text-text-secondary">{content.signOff}</p>
              <p className="text-body-strong text-text-primary">{content.teamName}</p>
            </div>
          </div>

          <footer className="border-t border-border px-4 py-4 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-3 rounded-xl bg-subtle p-3 sm:p-4">
              <div className="flex flex-col gap-2">
                <p className="text-body-sm text-text-primary">
                  <span className="font-emphasis">Disclaimer:</span> This email and any attachments are confidential
                  and intended only for the designated recipient. If you are not the intended recipient, please do not
                  read, copy or distribute this message.
                </p>
                <p className="text-body-sm text-text-primary">
                  This is an automated email. Please do not reply to this message
                </p>
              </div>
              <div className="h-px bg-border" role="separator" />
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-center sm:text-left">
                <HeadsetMicOutlined sx={{ fontSize: 16, color: 'var(--ds-color-icon-default)' }} aria-hidden />
                <p className="text-body-sm text-text-primary">
                  <span className="font-emphasis">For assistance,</span>{' '}
                  <span className="text-brand">contact support</span>
                </p>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
