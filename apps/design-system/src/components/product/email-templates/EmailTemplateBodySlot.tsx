'use client';

import EventOutlined from '@mui/icons-material/EventOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import AssignmentLateOutlined from '@mui/icons-material/AssignmentLateOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import LabelOutlined from '@mui/icons-material/LabelOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import MailOutlineOutlined from '@mui/icons-material/MailOutlineOutlined';
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import TagOutlined from '@mui/icons-material/TagOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { Button } from '@ds/components';
import type {
  AccessRequestSubmittedBody,
  CsvExportFailedBody,
  CsvProcessingCompletedBody,
  CsvProcessingFailedBody,
  EmailTemplateContent,
  EmergencyAccessAssignedBody,
  ReviewDueApproachingBody,
  PasswordResetBody,
  ReviewRequestNewBody,
  VerificationOtpBody,
} from '@/data/email-templates';
import {
  AccessDeprovisionedBody as AccessDeprovisionedBodyView,
  CampaignReviewNewBody as CampaignReviewNewBodyView,
  ProvisioningActionRequiredBody as ProvisioningActionRequiredBodyView,
  ProvisioningOutcomeBody as ProvisioningOutcomeBodyView,
  ReviewDurationExtendedBody as ReviewDurationExtendedBodyView,
  ReviewInactivityReminderBody as ReviewInactivityReminderBodyView,
  ReviewOverdueBody as ReviewOverdueBodyView,
  ReviewerAttentionRequiredBody as ReviewerAttentionRequiredBodyView,
  RoleMiningResultsBody as RoleMiningResultsBodyView,
  WelcomeApplicationBody as WelcomeApplicationBodyView,
  WelcomeOrganizationBody as WelcomeOrganizationBodyView,
} from './additionalEmailBodies';
import {
  CtaWithFallback,
  DetailField,
  EmailDetailCard,
  ErrorMessageAlert,
  ExpiryNote,
  FallbackLinkBlock,
} from './emailTemplateParts';

function formatOtpDisplay(code: string): string {
  return code.replace(/\s/g, '').split('').join(' ');
}

/**
 * The heading every "here are the request's particulars" card carries.
 *
 * Two templates render that card — a new review request and a submitted access request —
 * and they had drifted to "Request details" with a clipboard and "Request reference" with
 * a hash. Same card, same job, so one definition: a reader who sees both emails should
 * recognise the second block from the first.
 */
const REQUEST_DETAILS_CARD = {
  title: 'Request details',
  icon: <AssignmentOutlined sx={{ fontSize: 18 }} />,
  ariaLabel: 'Request details',
} as const;

function RequestDetailsCard({ details }: { details: ReviewRequestNewBody }) {
  return (
    <EmailDetailCard {...REQUEST_DETAILS_CARD}>
      <DetailField icon={<TagOutlined sx={{ fontSize: 16 }} />} label="Request ID" value={details.requestNumber} />
      <DetailField icon={<VpnKeyOutlined sx={{ fontSize: 16 }} />} label="Item" value={details.itemName} />
      <DetailField icon={<LabelOutlined sx={{ fontSize: 16 }} />} label="Type" value={details.itemTypeLabel} />
      <DetailField
        icon={<MailOutlineOutlined sx={{ fontSize: 16 }} />}
        label="Requester"
        value={details.requesterEmail}
        valueClassName="break-all text-brand"
      />
      <DetailField
        icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
        label="Due"
        value={details.dueDate}
        valueClassName="tabular-nums"
      />
    </EmailDetailCard>
  );
}

function AccessRequestReferenceCard({ details }: { details: AccessRequestSubmittedBody }) {
  return (
    <EmailDetailCard {...REQUEST_DETAILS_CARD}>
      <DetailField icon={<TagOutlined sx={{ fontSize: 16 }} />} label="Request ID" value={details.requestNumber} />
      <DetailField
        icon={<MailOutlineOutlined sx={{ fontSize: 16 }} />}
        label="Requested by"
        value={details.requesterEmail}
        valueClassName="break-all text-brand"
      />
      <DetailField
        icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
        label="Submitted"
        value={details.submittedAt}
        valueClassName="break-words tabular-nums"
      />
    </EmailDetailCard>
  );
}

function PlaceholderBody({ label }: { label: string }) {
  return (
    <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-border sm:min-h-[410px]">
      <div className="mx-3 max-w-full rounded-lg border border-border bg-subtle px-4 py-3">
        <span className="text-body-strong text-text-primary">{label}</span>
      </div>
    </div>
  );
}

function PasswordResetBody({ details }: { details: PasswordResetBody }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="text-body text-text-primary">
        We received a request to reset the password for your account. Click the button below to set a new password.
      </p>
      <ExpiryNote label={`Link expires in ${details.expiresInLabel}`} />
      <CtaWithFallback buttonLabel="Reset Now" url={details.resetUrl} />
      <p className="text-body text-text-primary">
        If you didn&apos;t request a password reset, you can safely ignore this email. Your password will remain
        unchanged.
      </p>
    </div>
  );
}

function AccessRequestSubmittedBody({ details }: { details: AccessRequestSubmittedBody }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="text-body text-text-secondary">
        Your access request is in. We&apos;ve sent it to the review team — keep the reference below if you need to
        follow up in IGA or with your manager.
      </p>

      <AccessRequestReferenceCard details={details} />

      <div
        className="rounded-lg px-3 py-3 ring-1 ring-[var(--ds-color-status-info-border)] sm:px-4"
        style={{ backgroundColor: 'var(--ds-color-status-info-subtle)' }}
      >
        <p className="text-body-sm-strong text-text-primary">What happens next</p>
        <p className="mt-1.5 text-body-sm text-text-secondary">
          Approvers will review your request in miniOrange IGA. We&apos;ll email you when it&apos;s approved, denied, or
          needs more information — no action is required from you right now.
        </p>
      </div>
    </div>
  );
}

function NewReviewRequestBody({ details }: { details: ReviewRequestNewBody }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="text-body text-text-secondary">
        A request has been submitted for access to{' '}
        <span className="font-emphasis text-text-primary">{details.itemName}</span>. Please review it and submit your
        decision before the due date.
      </p>

      <RequestDetailsCard details={details} />

      <p className="text-body-sm text-text-secondary">
        Timely reviews keep access requests from stalling — open the request in IGA to approve, deny, or ask for more
        information.
      </p>

      <div className="w-full sm:w-fit">
        <Button
          variant="primary"
          size="md"
          className="!w-full sm:!w-auto"
          tabIndex={-1}
          onClick={(e) => e.preventDefault()}
        >
          Review Now
        </Button>
      </div>

      <FallbackLinkBlock url={details.reviewUrl} />
    </div>
  );
}

function ProcessingMetricTile({
  label,
  value,
  intent,
}: {
  label: string;
  value: string;
  intent: 'success' | 'danger' | 'info';
}) {
  const ring =
    intent === 'success'
      ? 'ring-[var(--ds-color-status-success-border)]'
      : intent === 'danger'
        ? 'ring-[var(--ds-color-status-danger-border)]'
        : 'ring-[var(--ds-color-status-info-border)]';
  const bg =
    intent === 'success'
      ? 'var(--ds-color-status-success-subtle)'
      : intent === 'danger'
        ? 'var(--ds-color-status-danger-subtle)'
        : 'var(--ds-color-status-info-subtle)';

  return (
    <div className={['rounded-lg px-3 py-3 ring-1', ring].join(' ')} style={{ backgroundColor: bg }}>
      <p className="tabular-nums text-h5 text-text-primary">{value}</p>
      <p className="mt-0.5 text-caption text-text-secondary">{label}</p>
    </div>
  );
}

function CsvProcessingSummaryCard({ details }: { details: CsvProcessingCompletedBody }) {
  return (
    <EmailDetailCard
      title="Processing summary"
      icon={<BarChartOutlined sx={{ fontSize: 18 }} />}
      status={{ intent: 'success', label: 'Completed' }}
      ariaLabel="CSV processing summary"
      footer={
        <div className="grid grid-cols-1 gap-3 border-t border-border-subtle bg-surface px-4 py-4 sm:grid-cols-3 sm:px-5">
          <ProcessingMetricTile label="Success" value={String(details.successCount)} intent="success" />
          <ProcessingMetricTile label="Failed" value={String(details.failedCount)} intent="danger" />
          <ProcessingMetricTile label="Success rate" value={details.successRate} intent="info" />
        </div>
      }
    >
      <DetailField
        icon={<InsertDriveFileOutlined sx={{ fontSize: 16 }} />}
        label="File name"
        value={details.fileName}
        valueClassName="break-all"
      />
      <DetailField icon={<LabelOutlined sx={{ fontSize: 16 }} />} label="CSV type" value={details.csvType} />
      <DetailField
        icon={<TagOutlined sx={{ fontSize: 16 }} />}
        label="Total records"
        value={String(details.totalRecords)}
        valueClassName="tabular-nums"
      />
      <DetailField
        icon={<WarningAmberOutlined sx={{ fontSize: 16, color: 'var(--ds-color-status-warning-fg)' }} />}
        label="Entitlement warnings"
        value={String(details.entitlementWarnings)}
        valueClassName="tabular-nums text-[var(--ds-color-status-warning-fg)]"
      />
      <DetailField
        icon={<PersonOffOutlined sx={{ fontSize: 16 }} />}
        label="Users disabled"
        value={String(details.usersDisabled)}
        valueClassName="tabular-nums"
      />
      <DetailField
        icon={<LockOutlined sx={{ fontSize: 16 }} />}
        label="Entitlements revoked"
        value={String(details.entitlementsRevoked)}
        valueClassName="tabular-nums"
      />
    </EmailDetailCard>
  );
}

function CsvProcessingFailedSummaryCard({ details }: { details: CsvProcessingFailedBody }) {
  return (
    <EmailDetailCard
      title="Processing summary"
      icon={<BarChartOutlined sx={{ fontSize: 18 }} />}
      status={{ intent: 'danger', label: 'Failed' }}
      ariaLabel="CSV processing summary"
    >
      <DetailField
        icon={<InsertDriveFileOutlined sx={{ fontSize: 16 }} />}
        label="File name"
        value={details.fileName}
        valueClassName="break-all"
      />
      <DetailField icon={<LabelOutlined sx={{ fontSize: 16 }} />} label="CSV type" value={details.csvType} />
    </EmailDetailCard>
  );
}

function CsvProcessingFailedBody({ details }: { details: CsvProcessingFailedBody }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="text-body text-text-secondary">
        Your CSV upload could not be processed — no records were applied. Review the details below, fix the file, and
        try again.
      </p>

      <CsvProcessingFailedSummaryCard details={details} />
      <ErrorMessageAlert message={details.errorMessage} />

      <p className="text-body-sm text-text-secondary">
        Correct the issue above and re-upload the file. If the problem persists,{' '}
        <span className="font-emphasis text-brand">contact support</span> and include the file name.
      </p>

      {details.retryUrl ? (
        <div className="w-full sm:w-fit">
          <Button
            variant="primary"
            size="md"
            className="!w-full sm:!w-auto"
            tabIndex={-1}
            onClick={(e) => e.preventDefault()}
          >
            Upload Again
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function CsvProcessingCompletedBody({ details }: { details: CsvProcessingCompletedBody }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="text-body text-text-secondary">
        Your CSV upload has finished processing. Review the summary below — a detailed report is attached with row-level
        results.
      </p>

      <CsvProcessingSummaryCard details={details} />

      <p className="text-body-sm text-text-secondary">
        The attached report includes specifics on{' '}
        <span className="font-emphasis text-text-primary">
          {details.failedCount} failed record{details.failedCount === 1 ? '' : 's'}
        </span>
        {details.entitlementWarnings > 0 ? (
          <>
            {' '}
            and{' '}
            <span className="font-emphasis text-text-primary">
              {details.entitlementWarnings} entitlement{details.entitlementWarnings === 1 ? '' : 's'}
            </span>{' '}
            that could not be matched and were skipped
          </>
        ) : null}
        .
      </p>
    </div>
  );
}

function ReviewDueApproachingBody({ details }: { details: ReviewDueApproachingBody }) {
  const dayWord = details.daysRemaining === 1 ? 'day' : 'days';
  const reviewWord = details.pendingCount === 1 ? 'review' : 'reviews';

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="text-body text-text-secondary">
        You have pending reviews due soon. Completing them before the deadline keeps access requests moving and helps
        your team stay compliant.
      </p>

      <EmailDetailCard
        title="Review deadline"
        icon={<AccessTimeOutlined sx={{ fontSize: 18 }} />}
        ariaLabel="Review deadline"
      >
        <DetailField
          icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
          label="Time remaining"
          value={`${details.daysRemaining} ${dayWord} left`}
          valueClassName="tabular-nums"
        />
        <DetailField
          icon={<AssignmentLateOutlined sx={{ fontSize: 16 }} />}
          label="Pending"
          value={`${details.pendingCount} ${reviewWord} in your queue`}
          valueClassName="tabular-nums"
        />
        <DetailField
          icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
          label="Due"
          value={details.dueDate}
          valueClassName="tabular-nums"
        />
      </EmailDetailCard>

      <div className="w-full sm:w-fit">
        <Button
          variant="primary"
          size="md"
          className="!w-full sm:!w-auto"
          tabIndex={-1}
          onClick={(e) => e.preventDefault()}
        >
          Open Review Dashboard
        </Button>
      </div>

      <FallbackLinkBlock url={details.dashboardUrl} />
    </div>
  );
}

function EmergencyAccessAssignedCard({ details }: { details: EmergencyAccessAssignedBody }) {
  return (
    <EmailDetailCard
      title="Emergency access"
      icon={<SecurityOutlined sx={{ fontSize: 18 }} />}
      ariaLabel="Emergency access assignment"
    >
      <DetailField
        icon={<PersonOutlineOutlined sx={{ fontSize: 16 }} />}
        label="Subject user"
        value={details.subjectUserName}
      />
      <DetailField
        icon={<MailOutlineOutlined sx={{ fontSize: 16 }} />}
        label="Email"
        value={details.subjectUserEmail}
        valueClassName="break-all text-brand"
      />
      <DetailField
        icon={<VpnKeyOutlined sx={{ fontSize: 16 }} />}
        label="Emergency profile"
        value={details.emergencyProfileName}
      />
      <DetailField
        icon={<EventOutlined sx={{ fontSize: 16 }} />}
        label="Valid until"
        value={details.validUntil}
        valueClassName="tabular-nums"
      />
    </EmailDetailCard>
  );
}

function EmergencyAccessAssignedBody({ details }: { details: EmergencyAccessAssignedBody }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="text-body text-text-secondary">
        Emergency access has been granted. The assignment is time-bound — review the details below and confirm the
        session is expected for your environment.
      </p>

      <EmergencyAccessAssignedCard details={details} />

      <p className="text-body-sm text-text-secondary">
        If this assignment looks unexpected, revoke the session in miniOrange IGA and contact your security team
        immediately.
      </p>
    </div>
  );
}

function VerificationOtpBody({ details }: { details: VerificationOtpBody }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="text-body text-text-secondary">
        Use this one-time code to verify MFA and finish signing in. Enter it in the prompt where you started your
        session — do not share it with anyone.
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex justify-center">
          <div
            className="w-fit rounded-lg bg-subtle px-4 py-3 ring-1 ring-border-subtle"
            aria-label={`Verification code ${details.otpCode.replace(/\s/g, '').split('').join(' ')}`}
          >
            <p className="text-h5 tabular-nums tracking-[0.25em] text-text-primary">
              {formatOtpDisplay(details.otpCode)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-body-sm text-warning">
          <AccessTimeOutlined sx={{ fontSize: 16 }} aria-hidden />
          <span>OTP expires in {details.expiresInLabel}</span>
        </div>
      </div>

      <p className="text-body-sm text-text-secondary">
        If you didn&apos;t request this code, you can safely ignore this email. miniOrange will never ask you to share
        this OTP over email or phone.
      </p>
    </div>
  );
}

function CsvExportFailedBody({ details }: { details: CsvExportFailedBody }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <p className="text-body text-text-secondary">
        We couldn&apos;t finish your CSV export — nothing was downloaded. You can retry from IGA or contact support if
        this keeps happening.
      </p>

      <EmailDetailCard
        title="Export summary"
        icon={<BarChartOutlined sx={{ fontSize: 18 }} />}
        status={{ intent: 'danger', label: 'Failed' }}
        ariaLabel="Export summary"
      >
        <DetailField
          icon={<LabelOutlined sx={{ fontSize: 16 }} />}
          label="Export type"
          value={details.exportType}
          valueClassName="break-words"
        />
      </EmailDetailCard>

      <ErrorMessageAlert message={details.errorMessage} />

      <p className="text-body-sm text-text-secondary">
        Try again with a smaller date range or fewer filters. If the problem persists,{' '}
        <span className="font-emphasis text-brand">contact support</span> and include the export type above.
      </p>

      {details.retryUrl ? (
        <div className="w-full sm:w-fit">
          <Button
            variant="primary"
            size="md"
            className="!w-full sm:!w-auto"
            tabIndex={-1}
            onClick={(e) => e.preventDefault()}
          >
            Try Again
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function EmailTemplateBodySlot({ content }: { content: EmailTemplateContent }) {
  const { bodyVariant, bodyPlaceholder } = content;

  if (bodyVariant === 'password-reset' && content.passwordReset) {
    return <PasswordResetBody details={content.passwordReset} />;
  }
  if (bodyVariant === 'access-request-submitted' && content.accessRequest) {
    return <AccessRequestSubmittedBody details={content.accessRequest} />;
  }
  if (bodyVariant === 'review-request-new' && content.reviewRequest) {
    return <NewReviewRequestBody details={content.reviewRequest} />;
  }
  if (bodyVariant === 'review-due-approaching' && content.reviewDueApproaching) {
    return <ReviewDueApproachingBody details={content.reviewDueApproaching} />;
  }
  if (bodyVariant === 'review-inactivity-reminder' && content.reviewInactivityReminder) {
    return <ReviewInactivityReminderBodyView details={content.reviewInactivityReminder} />;
  }
  if (bodyVariant === 'welcome-organization' && content.welcomeOrganization) {
    return <WelcomeOrganizationBodyView details={content.welcomeOrganization} />;
  }
  if (bodyVariant === 'access-deprovisioned' && content.accessDeprovisioned) {
    return <AccessDeprovisionedBodyView details={content.accessDeprovisioned} />;
  }
  if (bodyVariant === 'provisioning-action-required' && content.provisioningActionRequired) {
    return <ProvisioningActionRequiredBodyView details={content.provisioningActionRequired} />;
  }
  if (bodyVariant === 'reviewer-attention-required' && content.reviewerAttentionRequired) {
    return <ReviewerAttentionRequiredBodyView details={content.reviewerAttentionRequired} />;
  }
  if (bodyVariant === 'review-overdue' && content.reviewOverdue) {
    return <ReviewOverdueBodyView details={content.reviewOverdue} />;
  }
  if (bodyVariant === 'provisioning-outcome' && content.provisioningOutcome) {
    return <ProvisioningOutcomeBodyView details={content.provisioningOutcome} />;
  }
  if (bodyVariant === 'review-duration-extended' && content.reviewDurationExtended) {
    return <ReviewDurationExtendedBodyView details={content.reviewDurationExtended} />;
  }
  if (bodyVariant === 'campaign-review-new' && content.campaignReviewNew) {
    return <CampaignReviewNewBodyView details={content.campaignReviewNew} />;
  }
  if (bodyVariant === 'role-mining-results' && content.roleMiningResults) {
    return <RoleMiningResultsBodyView details={content.roleMiningResults} />;
  }
  if (bodyVariant === 'welcome-application' && content.welcomeApplication) {
    return <WelcomeApplicationBodyView details={content.welcomeApplication} />;
  }
  if (bodyVariant === 'csv-export-failed' && content.csvExportFailed) {
    return <CsvExportFailedBody details={content.csvExportFailed} />;
  }
  if (bodyVariant === 'csv-processing-completed' && content.csvProcessingCompleted) {
    return <CsvProcessingCompletedBody details={content.csvProcessingCompleted} />;
  }
  if (bodyVariant === 'csv-processing-failed' && content.csvProcessingFailed) {
    return <CsvProcessingFailedBody details={content.csvProcessingFailed} />;
  }
  if (bodyVariant === 'verification-otp' && content.verificationOtp) {
    return <VerificationOtpBody details={content.verificationOtp} />;
  }
  if (bodyVariant === 'emergency-access-assigned' && content.emergencyAccessAssigned) {
    return <EmergencyAccessAssignedBody details={content.emergencyAccessAssigned} />;
  }
  return <PlaceholderBody label={bodyPlaceholder ?? 'Place content here'} />;
}
