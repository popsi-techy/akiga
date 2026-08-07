/**
 * Access request types — reviewer-facing access requests (entitlement,
 * application, role) awaiting approval.
 */
export type AccessRequestType = 'entitlement' | 'application' | 'role';
export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';
export type AccessDurationKind = 'permanent' | 'temporary';
export type ReviewRecommendation = 'approve' | 'reject' | 'review';
export type AccessRequestRiskSeverity = 'low' | 'medium' | 'high' | 'critical';

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
  recommendation: ReviewRecommendation;
  recommendationSummary: string;
  decision?: AccessRequestDecision;
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
