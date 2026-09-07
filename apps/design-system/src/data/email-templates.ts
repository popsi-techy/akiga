/**
 * Email template definitions — seed data for the Email Template console.
 */

export type EmailTemplateCategory =
  | 'foundation'
  | 'account-security'
  | 'access-requests'
  | 'reviews-certification'
  | 'provisioning-lifecycle'
  | 'onboarding'
  | 'imports-exports';

export const EMAIL_TEMPLATE_CATEGORY_ORDER: EmailTemplateCategory[] = [
  'foundation',
  'account-security',
  'access-requests',
  'reviews-certification',
  'provisioning-lifecycle',
  'onboarding',
  'imports-exports',
];

export const EMAIL_TEMPLATE_CATEGORY_LABELS: Record<EmailTemplateCategory, string> = {
  foundation: 'Foundation',
  'account-security': 'Account & security',
  'access-requests': 'Access requests',
  'reviews-certification': 'Reviews & certification',
  'provisioning-lifecycle': 'Provisioning & lifecycle',
  onboarding: 'Onboarding',
  'imports-exports': 'Imports & exports',
};

export type EmailTemplateKind =
  | 'base'
  | 'password-reset'
  | 'access-request'
  | 'review-request'
  | 'export'
  | 'security'
  | 'emergency'
  | 'onboarding'
  | 'provisioning'
  | 'offboarding';

export type EmailTemplateBodyVariant =
  | 'placeholder'
  | 'password-reset'
  | 'access-request-submitted'
  | 'review-request-new'
  | 'csv-export-failed'
  | 'csv-processing-completed'
  | 'csv-processing-failed'
  | 'review-due-approaching'
  | 'verification-otp'
  | 'emergency-access-assigned'
  | 'review-inactivity-reminder'
  | 'welcome-organization'
  | 'access-deprovisioned'
  | 'provisioning-action-required'
  | 'reviewer-attention-required'
  | 'review-overdue'
  | 'provisioning-outcome'
  | 'review-duration-extended'
  | 'campaign-review-new'
  | 'role-mining-results'
  | 'welcome-application';

export interface AccessRequestSubmittedBody {
  requestNumber: string;
  requesterEmail: string;
  submittedAt: string;
}

export interface ReviewRequestNewBody {
  requestNumber: string;
  itemName: string;
  itemTypeLabel: string;
  requesterEmail: string;
  dueDate: string;
  reviewUrl: string;
}

export interface ReviewDueApproachingBody {
  daysRemaining: number;
  pendingCount: number;
  dueDate: string;
  dashboardUrl: string;
}

export interface CsvExportFailedBody {
  exportType: string;
  errorMessage: string;
  retryUrl?: string;
}

export interface CsvProcessingCompletedBody {
  fileName: string;
  csvType: string;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  successRate: string;
  entitlementWarnings: number;
  usersDisabled: number;
  entitlementsRevoked: number;
}

export interface CsvProcessingFailedBody {
  fileName: string;
  csvType: string;
  errorMessage: string;
  retryUrl?: string;
}

export interface VerificationOtpBody {
  otpCode: string;
  expiresInLabel: string;
}

export interface EmergencyAccessAssignedBody {
  subjectUserName: string;
  subjectUserEmail: string;
  emergencyProfileName: string;
  validUntil: string;
}

export interface ReviewInactivityReminderBody {
  daysInactive: number;
  dashboardUrl: string;
}

export interface WelcomeOrganizationBody {
  fullName: string;
  resourceNames: string[];
  portalUrl: string;
  setPasswordUrl: string;
  linkExpiresInLabel: string;
}

export interface AccessDeprovisionedBody {
  employeeName: string;
  employeeEmail: string;
  deprovisionedResources: string[];
}

export interface ProvisioningTaskDetailsBody {
  operation: string;
  accountEmail: string;
  entitlementName: string;
  sourceName: string;
  requestType: string;
}

export interface ProvisioningActionRequiredBody extends ProvisioningTaskDetailsBody {
  actionUrl: string;
}

export interface ProvisioningOutcomeBody extends ProvisioningTaskDetailsBody {
  reviewerAction: 'approved' | 'rejected';
}

export interface ReviewerAttentionRequiredBody {
  campaignName: string;
  reviewUrl: string;
}

export interface ReviewOverdueBody {
  daysOverdue: number;
}

export interface ReviewDurationExtendedBody {
  extendedByDays: number;
  reviewUrl: string;
}

export interface CampaignReviewNewBody {
  campaignName: string;
  dueDate: string;
  reviewUrl: string;
}

export interface RoleMiningResultsBody {
  sourceName: string;
  minedRolesCount: number;
  outlierAccountsCount: number;
  reviewUrl: string;
}

export interface WelcomeApplicationBody {
  firstName: string;
  lastName: string;
  applicationName: string;
  tempPassword: string;
}

export interface EmailTemplateContent {
  greetingName: string;
  greetingLine: string;
  heading: string;
  bodyVariant: EmailTemplateBodyVariant;
  bodyPlaceholder?: string;
  accessRequest?: AccessRequestSubmittedBody;
  reviewRequest?: ReviewRequestNewBody;
  reviewDueApproaching?: ReviewDueApproachingBody;
  csvExportFailed?: CsvExportFailedBody;
  csvProcessingCompleted?: CsvProcessingCompletedBody;
  csvProcessingFailed?: CsvProcessingFailedBody;
  verificationOtp?: VerificationOtpBody;
  emergencyAccessAssigned?: EmergencyAccessAssignedBody;
  reviewInactivityReminder?: ReviewInactivityReminderBody;
  welcomeOrganization?: WelcomeOrganizationBody;
  accessDeprovisioned?: AccessDeprovisionedBody;
  provisioningActionRequired?: ProvisioningActionRequiredBody;
  reviewerAttentionRequired?: ReviewerAttentionRequiredBody;
  reviewOverdue?: ReviewOverdueBody;
  provisioningOutcome?: ProvisioningOutcomeBody;
  reviewDurationExtended?: ReviewDurationExtendedBody;
  campaignReviewNew?: CampaignReviewNewBody;
  roleMiningResults?: RoleMiningResultsBody;
  welcomeApplication?: WelcomeApplicationBody;
  signOff: string;
  teamName: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: EmailTemplateCategory;
  kind: EmailTemplateKind;
  subjectLine: string;
  updatedAt: string;
  content: EmailTemplateContent;
}

const SHARED_SHELL: Pick<EmailTemplateContent, 'greetingName' | 'greetingLine' | 'signOff' | 'teamName'> = {
  greetingName: 'Hello User',
  greetingLine: 'Hope you are having a good day!',
  signOff: 'Thank You,',
  teamName: 'miniOrange IGA Team',
};

const BASE_TEMPLATE: EmailTemplate = {
  id: 'base',
  name: 'Base Template',
  description: 'Default layout for IGA notification emails — greeting, content slot, sign-off, and footer.',
  category: 'foundation',
  kind: 'base',
  subjectLine: 'A message from miniOrange IGA',
  updatedAt: '2026-03-03T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Heading describing your email purpose in short!',
    bodyVariant: 'placeholder',
    bodyPlaceholder: 'Place content here',
  },
};

const PASSWORD_RESET_TEMPLATE: EmailTemplate = {
  id: 'password-reset',
  name: 'Password Reset',
  description: 'Notifies a user that a password reset was requested and links them to set a new password.',
  category: 'account-security',
  kind: 'password-reset',
  subjectLine: 'Reset your password — this link expires in 5 minutes',
  updatedAt: '2026-03-03T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Password Reset Request!',
    bodyVariant: 'password-reset',
  },
};

const VERIFICATION_OTP_TEMPLATE: EmailTemplate = {
  id: 'verification-otp',
  name: 'Verification OTP',
  description: 'Delivers a one-time code for MFA verification during sign-in.',
  category: 'account-security',
  kind: 'security',
  subjectLine: 'Enter this code to finish signing in',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Verification OTP',
    bodyVariant: 'verification-otp',
    verificationOtp: {
      otpCode: '123456',
      expiresInLabel: '5 minutes',
    },
  },
};

const ACCESS_REQUEST_TEMPLATE: EmailTemplate = {
  id: 'access-request-submitted',
  name: 'Access Request Submitted',
  description: 'Confirms an access request was filed and summarizes the key request details.',
  category: 'access-requests',
  kind: 'access-request',
  subjectLine: "We've received your access request — REQ-2026-0042",
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Access Request Submitted',
    bodyVariant: 'access-request-submitted',
    accessRequest: {
      requestNumber: 'REQ-2026-0042',
      requesterEmail: 'user@example.com',
      submittedAt: 'Mar 4, 2026 · 10:15 AM',
    },
  },
};

const REVIEW_REQUEST_TEMPLATE: EmailTemplate = {
  id: 'review-request-new',
  name: 'New Review Request',
  description: 'Alerts an approver that a request is waiting for their review with key details and a direct link.',
  category: 'reviews-certification',
  kind: 'review-request',
  subjectLine: 'Please review access to Finance Approver',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'You have a new review request!',
    bodyVariant: 'review-request-new',
    reviewRequest: {
      requestNumber: 'AR-001',
      itemName: 'Finance Approver',
      itemTypeLabel: 'Role',
      requesterEmail: 'mohammed.ali@acme.com',
      dueDate: 'Mar 11, 2026 · 5:00 PM',
      reviewUrl: 'https://iga.example.com/reviewer/review-requests/ar-001',
    },
  },
};

const CSV_EXPORT_FAILED_TEMPLATE: EmailTemplate = {
  id: 'csv-export-failed',
  name: 'CSV Export Failed',
  description: 'Notifies a user that a scheduled or on-demand CSV export could not be completed.',
  category: 'imports-exports',
  kind: 'export',
  subjectLine: "We couldn't finish your CSV export",
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'CSV Export Failed',
    bodyVariant: 'csv-export-failed',
    csvExportFailed: {
      exportType: 'Certification campaign results',
      errorMessage:
        'The export timed out after 10 minutes. Try narrowing the date range or selecting fewer campaigns, then run the export again.',
      retryUrl: 'https://iga.example.com/reports/exports',
    },
  },
};

const CSV_PROCESSING_COMPLETED_TEMPLATE: EmailTemplate = {
  id: 'csv-processing-completed',
  name: 'CSV Processing Completed',
  description: 'Summarizes the outcome of a CSV upload — success counts, failures, and warnings.',
  category: 'imports-exports',
  kind: 'export',
  subjectLine: 'Your CSV upload finished processing',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'CSV Processing Completed!',
    bodyVariant: 'csv-processing-completed',
    csvProcessingCompleted: {
      fileName: 'entitlements-import-mar2026.csv',
      csvType: 'Entitlement provisioning',
      totalRecords: 47,
      successCount: 42,
      failedCount: 5,
      successRate: '89.4%',
      entitlementWarnings: 5,
      usersDisabled: 3,
      entitlementsRevoked: 2,
    },
  },
};

const CSV_PROCESSING_FAILED_TEMPLATE: EmailTemplate = {
  id: 'csv-processing-failed',
  name: 'CSV Processing Failed',
  description: 'Notifies a user that a CSV upload could not be processed, with file context and the error details.',
  category: 'imports-exports',
  kind: 'export',
  subjectLine: "We couldn't process your CSV upload",
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'CSV Processing Failed',
    bodyVariant: 'csv-processing-failed',
    csvProcessingFailed: {
      fileName: 'entitlements-import-mar2026.csv',
      csvType: 'Entitlement provisioning',
      errorMessage:
        "Row 14 is missing the required column 'entitlement_code'. Fix the file format and upload again.",
      retryUrl: 'https://iga.example.com/directory/imports',
    },
  },
};

const REVIEW_DUE_APPROACHING_TEMPLATE: EmailTemplate = {
  id: 'review-due-approaching',
  name: 'Review Due Date Approaching',
  description: 'Reminds an approver that pending reviews are due soon and links them to their review dashboard.',
  category: 'reviews-certification',
  kind: 'review-request',
  subjectLine: '4 reviews due in 3 days',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Review Due Date Approaching',
    bodyVariant: 'review-due-approaching',
    reviewDueApproaching: {
      daysRemaining: 3,
      pendingCount: 4,
      dueDate: 'Mar 11, 2026 · 5:00 PM',
      dashboardUrl: 'https://iga.example.com/reviewer/review-requests',
    },
  },
};

const EMERGENCY_ACCESS_ASSIGNED_TEMPLATE: EmailTemplate = {
  id: 'emergency-access-assigned',
  name: 'Emergency Access Assigned',
  description: 'Notifies stakeholders that break-glass emergency access was granted to a user.',
  category: 'provisioning-lifecycle',
  kind: 'emergency',
  subjectLine: 'Emergency access granted to Scott William',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Emergency Access Assigned',
    bodyVariant: 'emergency-access-assigned',
    emergencyAccessAssigned: {
      subjectUserName: 'Scott William',
      subjectUserEmail: 'scott.william@acme.com',
      emergencyProfileName: 'GitHub Staging Env',
      validUntil: 'Mar 12, 2026 · 4:00 PM',
    },
  },
};

const REVIEW_INACTIVITY_TEMPLATE: EmailTemplate = {
  id: 'review-inactivity-reminder',
  name: 'Review Inactivity Reminder',
  description: 'Nudges a reviewer who has not updated assigned review items for several days.',
  category: 'reviews-certification',
  kind: 'review-request',
  subjectLine: 'Your reviews have been idle for 3 days',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Review Inactivity Reminder',
    bodyVariant: 'review-inactivity-reminder',
    reviewInactivityReminder: {
      daysInactive: 3,
      dashboardUrl: 'https://iga.example.com/reviewer/review-requests',
    },
  },
};

const WELCOME_ORGANIZATION_TEMPLATE: EmailTemplate = {
  id: 'welcome-organization',
  name: 'Welcome to the Organization',
  description: 'Welcomes a new employee, lists granted resources, and links them to set a password.',
  category: 'onboarding',
  kind: 'onboarding',
  subjectLine: 'Welcome, Jessica — set up your account',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Welcome to the Organization',
    bodyVariant: 'welcome-organization',
    welcomeOrganization: {
      fullName: 'Jessica Liu',
      resourceNames: ['Google Workspace', 'Jira Software'],
      portalUrl: 'https://iga.example.com',
      setPasswordUrl: 'https://iga.example.com/set-password/welcome-001',
      linkExpiresInLabel: '72 hours',
    },
  },
};

const ACCESS_DEPROVISIONED_TEMPLATE: EmailTemplate = {
  id: 'access-deprovisioned',
  name: 'Access Deprovisioned',
  description: 'Confirms offboarding access revocation for an employee and summarizes what was removed.',
  category: 'provisioning-lifecycle',
  kind: 'offboarding',
  subjectLine: 'Access revoked for Alex Morgan',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Access Deprovisioned',
    bodyVariant: 'access-deprovisioned',
    accessDeprovisioned: {
      employeeName: 'Alex Morgan',
      employeeEmail: 'alex.morgan@acme.com',
      deprovisionedResources: ['Salesforce CRM', 'AWS Production Account'],
    },
  },
};

const PROVISIONING_ACTION_TEMPLATE: EmailTemplate = {
  id: 'provisioning-action-required',
  name: 'Provisioning Action Required',
  description: 'Alerts an approver that a provisioning task needs their review.',
  category: 'provisioning-lifecycle',
  kind: 'provisioning',
  subjectLine: 'Review a Workday entitlement grant',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Action Required: Grant Entitlement',
    bodyVariant: 'provisioning-action-required',
    provisioningActionRequired: {
      operation: 'Grant Entitlement',
      accountEmail: 'user@example.com',
      entitlementName: 'Finance Approver',
      sourceName: 'Workday',
      requestType: 'Manual request',
      actionUrl: 'https://iga.example.com/provisioning/tasks/pt-0042',
    },
  },
};

const REVIEWER_ATTENTION_TEMPLATE: EmailTemplate = {
  id: 'reviewer-attention-required',
  name: 'Reviewer Attention Required',
  description: 'Asks a campaign owner to follow up with reviewers who still have open items.',
  category: 'reviews-certification',
  kind: 'review-request',
  subjectLine: 'Reviewers still have open items on Q1 2026',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Reviewer attention required',
    bodyVariant: 'reviewer-attention-required',
    reviewerAttentionRequired: {
      campaignName: 'Q1 2026 Access Certification',
      reviewUrl: 'https://iga.example.com/reviewer/certifications/q1-2026',
    },
  },
};

const REVIEW_OVERDUE_TEMPLATE: EmailTemplate = {
  id: 'review-overdue',
  name: 'Overdue Review Notification',
  description: 'Informs a reviewer they missed a campaign review deadline.',
  category: 'reviews-certification',
  kind: 'review-request',
  subjectLine: 'Your review is 3 days past due',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Overdue Review Notification',
    bodyVariant: 'review-overdue',
    reviewOverdue: { daysOverdue: 3 },
  },
};

const PROVISIONING_OUTCOME_TEMPLATE: EmailTemplate = {
  id: 'provisioning-outcome',
  name: 'Provisioning Request Outcome',
  description: 'Notifies the requester when a provisioning task was approved or rejected.',
  category: 'provisioning-lifecycle',
  kind: 'provisioning',
  subjectLine: 'Your request for Finance Approver was approved',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Grant Entitlement Approved',
    bodyVariant: 'provisioning-outcome',
    provisioningOutcome: {
      operation: 'Grant Entitlement',
      accountEmail: 'user@example.com',
      entitlementName: 'Finance Approver',
      sourceName: 'Workday',
      requestType: 'Manual request',
      reviewerAction: 'approved',
    },
  },
};

const REVIEW_DURATION_EXTENDED_TEMPLATE: EmailTemplate = {
  id: 'review-duration-extended',
  name: 'Review Duration Extended',
  description: 'Tells a reviewer their campaign deadline was extended.',
  category: 'reviews-certification',
  kind: 'review-request',
  subjectLine: 'You have 3 more days to finish your reviews',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Review Duration Extended',
    bodyVariant: 'review-duration-extended',
    reviewDurationExtended: {
      extendedByDays: 3,
      reviewUrl: 'https://iga.example.com/reviewer/certifications/q1-2026',
    },
  },
};

const CAMPAIGN_REVIEW_NEW_TEMPLATE: EmailTemplate = {
  id: 'campaign-review-new',
  name: 'Campaign Review Request',
  description: 'Alerts a reviewer to a new certification campaign review with due date.',
  category: 'reviews-certification',
  kind: 'review-request',
  subjectLine: 'Q1 2026 Access Certification needs your review',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'You have a new review request!',
    bodyVariant: 'campaign-review-new',
    campaignReviewNew: {
      campaignName: 'Q1 2026 Access Certification',
      dueDate: 'Sep 5, 2026',
      reviewUrl: 'https://iga.example.com/reviewer/certifications/q1-2026',
    },
  },
};

const ROLE_MINING_RESULTS_TEMPLATE: EmailTemplate = {
  id: 'role-mining-results',
  name: 'Role Mining Results Ready',
  description: 'Summarizes completed role mining results for reviewer acceptance.',
  category: 'reviews-certification',
  kind: 'review-request',
  subjectLine: 'Active Directory role mining is ready to review',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Role Mining Results Ready for Review',
    bodyVariant: 'role-mining-results',
    roleMiningResults: {
      sourceName: 'Active Directory',
      minedRolesCount: 7,
      outlierAccountsCount: 7,
      reviewUrl: 'https://iga.example.com/role-mining/rm-2026-03',
    },
  },
};

const WELCOME_APPLICATION_TEMPLATE: EmailTemplate = {
  id: 'welcome-application',
  name: 'Welcome to Application',
  description: 'Delivers first-time application credentials to a newly provisioned user.',
  category: 'onboarding',
  kind: 'onboarding',
  subjectLine: 'Your Salesforce account is ready',
  updatedAt: '2026-03-04T00:00:00.000Z',
  content: {
    ...SHARED_SHELL,
    heading: 'Welcome to the Salesforce system',
    bodyVariant: 'welcome-application',
    welcomeApplication: {
      firstName: 'Jessica',
      lastName: 'Liu',
      applicationName: 'Salesforce',
      tempPassword: 'Sample@123',
    },
  },
};

const TEMPLATES: EmailTemplate[] = [
  BASE_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
  VERIFICATION_OTP_TEMPLATE,
  ACCESS_REQUEST_TEMPLATE,
  REVIEW_REQUEST_TEMPLATE,
  REVIEW_DUE_APPROACHING_TEMPLATE,
  REVIEW_INACTIVITY_TEMPLATE,
  REVIEW_OVERDUE_TEMPLATE,
  REVIEW_DURATION_EXTENDED_TEMPLATE,
  REVIEWER_ATTENTION_TEMPLATE,
  CAMPAIGN_REVIEW_NEW_TEMPLATE,
  ROLE_MINING_RESULTS_TEMPLATE,
  EMERGENCY_ACCESS_ASSIGNED_TEMPLATE,
  WELCOME_ORGANIZATION_TEMPLATE,
  WELCOME_APPLICATION_TEMPLATE,
  ACCESS_DEPROVISIONED_TEMPLATE,
  PROVISIONING_ACTION_TEMPLATE,
  PROVISIONING_OUTCOME_TEMPLATE,
  CSV_EXPORT_FAILED_TEMPLATE,
  CSV_PROCESSING_COMPLETED_TEMPLATE,
  CSV_PROCESSING_FAILED_TEMPLATE,
];

export function listEmailTemplates(): EmailTemplate[] {
  return [...TEMPLATES];
}

export function groupEmailTemplatesByCategory(
  templates: EmailTemplate[],
): { category: EmailTemplateCategory; label: string; templates: EmailTemplate[] }[] {
  const byCategory = new Map<EmailTemplateCategory, EmailTemplate[]>();
  for (const template of templates) {
    const list = byCategory.get(template.category) ?? [];
    list.push(template);
    byCategory.set(template.category, list);
  }
  return EMAIL_TEMPLATE_CATEGORY_ORDER.flatMap((category) => {
    const group = byCategory.get(category);
    if (!group?.length) return [];
    return [{ category, label: EMAIL_TEMPLATE_CATEGORY_LABELS[category], templates: group }];
  });
}

export function getEmailTemplate(id: string): EmailTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
