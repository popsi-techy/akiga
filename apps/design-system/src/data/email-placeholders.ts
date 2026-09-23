/**
 * Placeholders (dynamic values) available to an email while composing it.
 *
 * A version's body can reference `{{token}}` values the product fills in at send time —
 * the recipient's name, a request number, a link. Which tokens are available depends on
 * what the email is *about*, so the set is keyed by the catalogue email's category, with a
 * few per-email extras, on top of a common set every email can use.
 *
 * Demo data: enough to make the Placeholders panel real and specific without wiring a
 * template engine. The panel inserts the raw `{{token}}`; nothing renders it yet.
 */
import type { EmailTemplateCategory } from './email-templates';

export interface EmailPlaceholder {
  /** The token as written in the body, e.g. `{{fullName}}`. */
  token: string;
  /** What it resolves to, for the panel's tooltip/label. */
  label: string;
}

const ph = (token: string, label: string): EmailPlaceholder => ({ token: `{{${token}}}`, label });

/** Available on every email — who it is going to and where it comes from. */
const COMMON: EmailPlaceholder[] = [
  ph('fullName', 'Recipient full name'),
  ph('firstName', 'Recipient first name'),
  ph('email', 'Recipient email'),
  ph('orgName', 'Organization name'),
  ph('actionUrl', 'Primary button link'),
  ph('date', 'Current date'),
  ph('supportEmail', 'Support inbox'),
];

/** Extra tokens per area, layered on top of the common set. */
const BY_CATEGORY: Record<EmailTemplateCategory, EmailPlaceholder[]> = {
  foundation: [],
  'account-security': [
    ph('otpCode', 'One-time passcode'),
    ph('resetUrl', 'Password reset link'),
    ph('expiresIn', 'Link/code expiry'),
    ph('deviceName', 'Device or browser'),
    ph('ipAddress', 'Sign-in IP address'),
  ],
  'access-requests': [
    ph('requestNumber', 'Request reference'),
    ph('itemName', 'Requested item'),
    ph('itemTypeLower', 'Item type (lowercase)'),
    ph('sourceName', 'Application or source'),
    ph('approvedItems', 'List of approved items'),
    ph('hasApprovedItems', 'Whether anything was approved'),
    ph('accessUrl', 'Link to the granted access'),
    ph('approverName', 'Who approved or rejected'),
  ],
  'reviews-certification': [
    ph('campaignName', 'Certification campaign'),
    ph('dueDate', 'Review deadline'),
    ph('itemsPending', 'Items still to review'),
    ph('reviewUrl', 'Link to the review'),
    ph('reviewerName', 'Assigned reviewer'),
  ],
  'provisioning-lifecycle': [
    ph('taskName', 'Provisioning task'),
    ph('applicationName', 'Target application'),
    ph('accountName', 'Account affected'),
    ph('status', 'Task status'),
    ph('effectiveDate', 'When it takes effect'),
  ],
  onboarding: [
    ph('managerName', 'Reporting manager'),
    ph('startDate', 'Start date'),
    ph('department', 'Department'),
    ph('accountName', 'New account name'),
    ph('tempPassword', 'Temporary password'),
  ],
  'imports-exports': [
    ph('jobName', 'Import/export job'),
    ph('recordCount', 'Rows processed'),
    ph('errorCount', 'Rows that failed'),
    ph('downloadUrl', 'Link to the file'),
    ph('finishedAt', 'When it completed'),
  ],
};

/** The placeholders available to an email of this category — common set plus its extras. */
export function getEmailPlaceholders(category: EmailTemplateCategory): EmailPlaceholder[] {
  return [...(BY_CATEGORY[category] ?? []), ...COMMON];
}
