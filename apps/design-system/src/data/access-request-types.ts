/**
 * Access request types — reviewer-facing access requests (entitlement,
 * application, role) awaiting approval, plus the end-user draft that
 * becomes a reviewer queue item on submit.
 */
export type AccessRequestType = 'entitlement' | 'application' | 'role';
export type AccessRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type AccessDurationKind = 'permanent' | 'temporary';
export type ReviewRecommendation = 'approve' | 'reject' | 'review';
export type AccessRequestRiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BeneficiaryKind = 'self' | 'other';
/** End-user table projection — expired is derived, completed maps from approved. */
export type EndUserRequestStatus = 'draft' | 'pending' | 'completed' | 'expired' | 'rejected';

export interface AccessRequestItem {
  entitlementId: string;
  entitlementName: string;
  applicationId: string;
  applicationName: string;
  description?: string;
  risk?: number;
  accessDurationKind: AccessDurationKind;
  accessDurationUntil?: string;
}

export type AccessRequestAttachmentKind = 'pdf' | 'word' | 'image';

export interface AccessRequestAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  kind: AccessRequestAttachmentKind;
  dataUrl: string;
  addedAt: string;
  status?: 'uploading' | 'success' | 'failed';
  error?: string;
}

export interface AccessRequestDecision {
  action: 'approved' | 'rejected';
  justification: string;
  decidedAt: string;
  decidedBy: string;
}

export interface AccessRequest {
  id: string;
  reference: string;
  type: AccessRequestType;
  status: AccessRequestStatus;
  itemName: string;
  itemDescription?: string;
  appId?: string;
  appName?: string;
  entitlementCode?: string;
  roleCode?: string;
  /** Entitlement context — e.g. the page or module the access applies to. */
  resourceContext?: string;
  requestedForId: string;
  requestedForName: string;
  requestedForEmail: string;
  requestedForTitle?: string;
  requestedById: string;
  requestedByName: string;
  requestedByEmail: string;
  requestedByTitle?: string;
  /** Current approval stage shown in the detail header. */
  approvalStage?: string;
  itemRiskScore?: number;
  itemRiskSeverity?: AccessRequestRiskSeverity;
  /** SoD violations detected for this request (feeds the recommendation copy). */
  sodViolationCount?: number;
  submittedAt: string;
  dueAt: string;
  accessDurationKind: AccessDurationKind;
  accessDurationUntil?: string;
  businessJustification: string;
  /** Optional catalog reason chosen on preview (alongside free-text justification). */
  justificationReason?: string;
  /** Supporting files attached with the justification (PDF, Word, image). */
  attachments?: AccessRequestAttachment[];
  recommendation: ReviewRecommendation;
  recommendationSummary: string;
  decision?: AccessRequestDecision;
  /** Cart of entitlements — populated by the end-user create flow. */
  items?: AccessRequestItem[];
  /** Applications chosen on the items step, even before an entitlement is added. */
  applicationIds?: string[];
  /** When the request itself lapses if it is still pending. */
  expiresAt?: string;
  beneficiaryKind?: BeneficiaryKind;
}

/** List projection for the reviewer queue table. */
export interface ReviewRequestRow {
  id: string;
  reference: string;
  type: AccessRequestType;
  itemName: string;
  accessDurationLabel: string;
  requestedForName: string;
  requestedForEmail: string;
  requestedByName: string;
  submittedAt: string;
  dueAt: string;
  status: AccessRequestStatus;
}

/** List projection for the end-user "All Requests" table. */
export interface EndUserRequestRow {
  id: string;
  reference: string;
  type: AccessRequestType;
  requestedForName: string;
  requestedForEmail: string;
  items: AccessRequestItem[];
  submittedAt: string;
  expiresAt: string;
  status: EndUserRequestStatus;
}
