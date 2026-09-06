'use client';

import EventOutlined from '@mui/icons-material/EventOutlined';
import FolderOutlined from '@mui/icons-material/FolderOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import LabelOutlined from '@mui/icons-material/LabelOutlined';
import MailOutlineOutlined from '@mui/icons-material/MailOutlineOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import VpnKeyOutlined from '@mui/icons-material/VpnKeyOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import type {
  AccessDeprovisionedBody,
  CampaignReviewNewBody,
  ProvisioningActionRequiredBody,
  ProvisioningOutcomeBody,
  ReviewDurationExtendedBody,
  ReviewInactivityReminderBody,
  ReviewOverdueBody,
  ReviewerAttentionRequiredBody,
  RoleMiningResultsBody,
  WelcomeApplicationBody,
  WelcomeOrganizationBody,
} from '@/data/email-templates';
import {
  CtaWithFallback,
  DetailField,
  DualMetricCard,
  EmailBodyStack,
  EmailDetailCard,
  ExpiryNote,
  FallbackLinkBlock,
  InfoCallout,
  ResourceListCard,
  TempPasswordCard,
} from './emailTemplateParts';

function ProvisioningTaskCard({
  details,
  ariaLabel,
}: {
  details: ProvisioningActionRequiredBody | ProvisioningOutcomeBody;
  ariaLabel: string;
}) {
  return (
    <EmailDetailCard title="Operation" hero={details.operation} ariaLabel={ariaLabel}>
      <DetailField
        icon={<PersonOutlineOutlined sx={{ fontSize: 16 }} />}
        label="Account"
        value={details.accountEmail}
        valueClassName="break-all text-brand"
      />
      <DetailField
        icon={<VpnKeyOutlined sx={{ fontSize: 16 }} />}
        label="Entitlement"
        value={details.entitlementName}
      />
      <DetailField icon={<FolderOutlined sx={{ fontSize: 16 }} />} label="Source" value={details.sourceName} />
      <DetailField icon={<LabelOutlined sx={{ fontSize: 16 }} />} label="Request type" value={details.requestType} />
    </EmailDetailCard>
  );
}

export function ReviewInactivityReminderBody({ details }: { details: ReviewInactivityReminderBody }) {
  const dayWord = details.daysInactive === 1 ? 'day' : 'days';
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        We noticed you haven&apos;t started or updated your assigned review items. Please take a moment to complete
        your reviews to stay on track.
      </p>
      <EmailDetailCard
        title="Inactivity period"
        hero={`${details.daysInactive} ${dayWord}`}
        ariaLabel="Review inactivity"
      >
        <DetailField
          icon={<HourglassEmptyOutlined sx={{ fontSize: 16 }} />}
          label="Status"
          value={`No activity on assigned review items for ${details.daysInactive} ${dayWord}`}
        />
      </EmailDetailCard>
      <CtaWithFallback buttonLabel="Open Review Dashboard" url={details.dashboardUrl} />
    </EmailBodyStack>
  );
}

export function WelcomeOrganizationBody({ details }: { details: WelcomeOrganizationBody }) {
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        Hi <span className="font-semibold text-text-primary">{details.fullName}</span>, your account has been
        provisioned. You now have access to the resources below.
      </p>
      <ResourceListCard
        title="Access granted"
        hero={`${details.resourceNames.length} resources`}
        items={details.resourceNames}
        ariaLabel="Granted resources"
      />
      <InfoCallout
        title="miniOrange IGA dashboard"
        body={`Sign in at ${details.portalUrl} to view your access, track requests, and manage your profile.`}
      />
      <p className="text-body-sm text-text-secondary">
        To get started, set your password using the button below.
      </p>
      <ExpiryNote label={`Link expires in ${details.linkExpiresInLabel}`} />
      <CtaWithFallback buttonLabel="Set Your Password" url={details.setPasswordUrl} />
      <p className="text-body-sm text-text-secondary">
        If you have questions, contact your IT team for assistance.
      </p>
    </EmailBodyStack>
  );
}

export function AccessDeprovisionedBody({ details }: { details: AccessDeprovisionedBody }) {
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        The following employee has been offboarded and their access has been revoked in the identity governance
        system.
      </p>
      <EmailDetailCard title="Offboarded employee" hero={details.employeeName} ariaLabel="Offboarded employee">
        <DetailField
          icon={<MailOutlineOutlined sx={{ fontSize: 16 }} />}
          label="Email"
          value={details.employeeEmail}
          valueClassName="break-all text-brand"
        />
      </EmailDetailCard>
      <ResourceListCard
        title="What was deprovisioned"
        hero="Summary"
        items={details.deprovisionedResources}
        ariaLabel="Deprovisioned resources"
      />
      <p className="text-body-sm text-text-secondary">
        This action was performed as part of the standard offboarding process. All access has been revoked per your
        organization&apos;s security policies. If you believe this was done in error, contact the IT team immediately.
      </p>
    </EmailBodyStack>
  );
}

export function ProvisioningActionRequiredBody({ details }: { details: ProvisioningActionRequiredBody }) {
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        A provisioning request related to{' '}
        <span className="font-semibold text-text-primary">{details.sourceName}</span> requires your action. Please
        review and take the appropriate next step.
      </p>
      <ProvisioningTaskCard details={details} ariaLabel="Provisioning request details" />
      <CtaWithFallback buttonLabel="Review Request" url={details.actionUrl} />
      <p className="text-body-sm text-text-secondary">Please review this request at your earliest convenience.</p>
    </EmailBodyStack>
  );
}

export function ReviewerAttentionRequiredBody({ details }: { details: ReviewerAttentionRequiredBody }) {
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        One or more reviewers on your team have unreviewed items in the campaign{' '}
        <span className="font-semibold text-text-primary">{details.campaignName}</span>. Please follow up so the
        campaign can stay on schedule.
      </p>
      <CtaWithFallback buttonLabel="View Campaign Review" url={details.reviewUrl} />
    </EmailBodyStack>
  );
}

export function ReviewOverdueBody({ details }: { details: ReviewOverdueBody }) {
  const dayWord = details.daysOverdue === 1 ? 'day' : 'days';
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        You have missed the deadline for completing your assigned review items in the campaign.
      </p>
      <EmailDetailCard title="Overdue" hero={`${details.daysOverdue} ${dayWord}`} ariaLabel="Review overdue status">
        <DetailField
          icon={<WarningAmberOutlined sx={{ fontSize: 16, color: 'var(--ds-color-status-warning-fg)' }} />}
          label="Status"
          value={`Your review is overdue by ${details.daysOverdue} ${dayWord}`}
          valueClassName="text-[var(--ds-color-status-warning-fg)]"
        />
      </EmailDetailCard>
      <p className="text-body-sm text-text-secondary">
        While the review period has ended, contact your manager or an administrator if you need assistance or have
        questions.
      </p>
    </EmailBodyStack>
  );
}

export function ProvisioningOutcomeBody({ details }: { details: ProvisioningOutcomeBody }) {
  const actionLabel = details.reviewerAction === 'approved' ? 'Approved' : 'Rejected';
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        Your request related to <span className="font-semibold text-text-primary">{details.sourceName}</span> has been{' '}
        <span className="font-semibold text-text-primary">{actionLabel.toLowerCase()}</span>.
      </p>
      <ProvisioningTaskCard details={details} ariaLabel="Provisioning request outcome" />
      <p className="text-body-sm text-text-secondary">
        If you have any questions, please contact your administrator.
      </p>
    </EmailBodyStack>
  );
}

export function ReviewDurationExtendedBody({ details }: { details: ReviewDurationExtendedBody }) {
  const dayWord = details.extendedByDays === 1 ? 'day' : 'days';
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        The review duration for your assigned campaign has been extended. You can continue working through your
        assigned items.
      </p>
      <EmailDetailCard
        title="Extended by"
        hero={`${details.extendedByDays} ${dayWord}`}
        ariaLabel="Review extension"
      />
      <p className="text-body-sm text-text-secondary">You can continue the review using the button below.</p>
      <CtaWithFallback buttonLabel="Continue Review" url={details.reviewUrl} />
    </EmailBodyStack>
  );
}

export function CampaignReviewNewBody({ details }: { details: CampaignReviewNewBody }) {
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        A new review request has been generated for your campaign. Your approval is required to move forward with the
        next steps.
      </p>
      <EmailDetailCard title="Campaign" hero={details.campaignName} ariaLabel="Campaign review details">
        <DetailField
          icon={<EventOutlined sx={{ fontSize: 16 }} />}
          label="Due date"
          value={details.dueDate}
          valueClassName="tabular-nums"
        />
      </EmailDetailCard>
      <p className="text-body-sm text-text-secondary">
        Please review and submit your decision before the due date to help keep the process on track.
      </p>
      <CtaWithFallback buttonLabel="Review Now" url={details.reviewUrl} />
    </EmailBodyStack>
  );
}

export function RoleMiningResultsBody({ details }: { details: RoleMiningResultsBody }) {
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        A role mining session has completed for{' '}
        <span className="font-semibold text-text-primary">{details.sourceName}</span>. The results are ready for your
        review — you can accept or reject the proposed roles.
      </p>
      <DualMetricCard
        ariaLabel="Role mining summary"
        metrics={[
          { label: 'Mined roles discovered', value: String(details.minedRolesCount) },
          {
            label: 'Outlier accounts',
            value: String(details.outlierAccountsCount),
            intent: details.outlierAccountsCount > 0 ? 'warning' : 'default',
          },
        ]}
      />
      <p className="text-body-sm text-text-secondary">
        Review the discovered roles and outlier accounts. Accepted roles can be added to your organization&apos;s role
        inventory.
      </p>
      <CtaWithFallback buttonLabel="View Results" url={details.reviewUrl} />
    </EmailBodyStack>
  );
}

export function WelcomeApplicationBody({ details }: { details: WelcomeApplicationBody }) {
  const fullName = `${details.firstName} ${details.lastName}`.trim();
  return (
    <EmailBodyStack>
      <p className="text-body text-text-secondary">
        Hi <span className="font-semibold text-text-primary">{fullName}</span>, your account has been created and you
        have been granted access to <span className="font-semibold text-text-primary">{details.applicationName}</span>.
        Use the credentials below to sign in for the first time.
      </p>
      <TempPasswordCard password={details.tempPassword} hero={details.applicationName} />
      <div
        className="rounded-lg px-3 py-3 ring-1 ring-[var(--ds-color-status-warning-border)] sm:px-4"
        style={{ backgroundColor: 'var(--ds-color-status-warning-subtle)' }}
      >
        <p className="text-body-sm text-text-primary">
          <span className="font-semibold">Important:</span> This is a one-time generated password. Change it
          immediately after your first login to keep your account secure.
        </p>
      </div>
    </EmailBodyStack>
  );
}
