/**
 * SoD Resolution domain types — shared by the Admin (Risk) and Reviewer
 * (SoD Resolution) consoles. A "rule" is a conflicting access combination the
 * user holds; resolving = removing any one access in the combination, or
 * accepting the risk. Decisions are staged on the review until submission.
 */
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type AccessType = 'entitlement' | 'technicalRole' | 'businessRole';

export interface SodAccess {
  id: string;
  name: string; // e.g. "Read Access"
  appId: string;
  appName: string; // e.g. "Google Workspace"
  type: AccessType;
  detail?: string; // e.g. "GL · GL.Journal_Post"
  description?: string; // canonical display: what the access grants
  risk?: number; // canonical 0–100 Risk Score
}

export interface SodPolicy {
  id: string;
  name: string; // "Finance SoD Policy"
  severity: Severity;
  description: string;
}

/** A conflicting access combination (per-user rule instance). */
export interface SodRule {
  id: string; // instance id, unique within a review
  code: string; // "SOD-XAPP-004"
  label: string; // "Read Access + Account Edit"
  policyId: string;
  accessIds: string[]; // the conflicting accesses (≥2)
}

export type ReviewStatus = 'unassigned' | 'assigned' | 'inProgress' | 'completed' | 'overdue';
/**
 * Reviewer-facing status (derived from the same record).
 *
 * `revising` is transient and never returned by `reviewerStatusOf` — it is a
 * view-level state for a submitted resolution being amended, so the header can
 * distinguish "Completed" from "Completed, currently being changed".
 */
export type ReviewerStatus = 'notStarted' | 'inProgress' | 'completed' | 'revising';

export interface AcceptedRisk {
  justification: string;
  duration: 30 | 90 | 180 | 'permanent';
  approverId: string;
  approverName: string;
  at: string;
  /**
   * Exact expiry the reviewer chose, as a local wall-clock `YYYY-MM-DDTHH:MM`
   * (no zone). `duration` is only a coarse 30/90/180 bucket and cannot express a
   * time of day. Not a UTC instant on purpose — the date formatters read UTC for
   * hydration determinism, so an instant would display at a shifted hour.
   * Optional: seeded and legacy acceptances carry only a duration.
   */
  untilAt?: string;
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  detail: string;
  /** Structured resolution data — used for rich audit cards from Resolution started onward. */
  payload?: AuditEntryPayload;
}

export type AuditEntryPayload =
  | {
      type: 'access-revoked';
      accessIds: string[];
      justification: string;
    }
  | {
      type: 'risk-accepted';
      ruleId: string;
      ruleCode: string;
      ruleLabel: string;
      accessIds: string[];
      justification: string;
      duration: AcceptedRisk['duration'];
      approverName: string;
    }
  | {
      type: 'submitted';
      reference: string;
      userName: string;
      policyName: string;
      removedAccessIds: string[];
      removeJustification: string;
      removedRules: Array<{
        ruleId: string;
        ruleCode: string;
        accessIds: string[];
        revokedAccessIds: string[];
      }>;
      acceptedRules: Array<{
        ruleId: string;
        ruleCode: string;
        ruleLabel: string;
        accessIds: string[];
        justification: string;
        duration: AcceptedRisk['duration'];
        approverName: string;
      }>;
    };

export interface SodReview {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  riskScore: number;
  severity: Severity;
  // --- profile (shown in the user-details drawer) ---
  employeeId?: string;
  userTitle?: string;
  userDepartment?: string;
  managerName?: string;
  policyIds: string[];
  policyNames: string[];
  accessHeldIds: string[];
  rules: SodRule[];
  status: ReviewStatus;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  assignedAt?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  // --- staged reviewer decisions ---
  removedAccessIds: string[];
  /** V3 remove-access step justification (persisted on submit). */
  removeJustification?: string;
  /** V2 (access-centric) resolution: access the reviewer decided to keep. */
  keptAccessIds?: string[];
  acceptedRules: Record<string, AcceptedRisk>;
  overallJustification: string;
  submission?: { reference: string; at: string };
  audit: AuditEntry[];
}

/** Reviewer "My Reviews" row projection. */
export interface MyReviewRow {
  id: string;
  userName: string;
  userEmail: string;
  riskScore: number;
  severity: Severity;
  policyNames: string[];
  ruleCount: number;
  dueDate?: string;
  /** When the review was assigned to the reviewer. */
  assignedAt?: string;
  /** When the violation was first detected (from audit). */
  detectedAt: string;
  /** Present when the review was submitted (history). */
  submittedAt?: string;
  submissionReference?: string;
  reviewerStatus: ReviewerStatus;
  /** Rules where the reviewer accepted residual risk (submitted reviews only). */
  acceptedRiskCount: number;
  /** Access combinations still awaiting a decision. */
  pendingCount: number;
}

export interface Person {
  id: string;
  name: string;
  title?: string;
  email?: string;
}
