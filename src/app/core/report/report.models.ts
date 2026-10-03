export type ReportTargetType = 'user' | 'business' | 'post' | 'comment' | 'reel';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_or_abuse'
  | 'misinformation'
  | 'impersonation'
  | 'inappropriate_content'
  | 'fraud_or_scam'
  | 'privacy_violation'
  | 'other';

export interface CreateReportPayload {
  target_type: ReportTargetType;
  target_id: number;
  reason: ReportReason;
  details?: string;
}

export interface ReportResponse {
  data: {
    id: number;
    target_type: ReportTargetType;
    target_id: number;
    reason: ReportReason;
    details: string | null;
    status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
    created_at: string;
    updated_at: string;
  };
}

export const REPORT_REASONS: readonly { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_or_abuse', label: 'Hate or abusive content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'fraud_or_scam', label: 'Fraud or scam' },
  { value: 'privacy_violation', label: 'Privacy violation' },
  { value: 'other', label: 'Other' },
];
