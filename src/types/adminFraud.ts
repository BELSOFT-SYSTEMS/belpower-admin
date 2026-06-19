export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FraudActionTaken =
  | 'blocked'
  | 'blocked_and_suspended'
  | 'flagged_only'
  | 'detected';

export type FraudReviewStatus = 'open' | 'reviewed' | 'dismissed';

export type FraudEvent = {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  eventType: string;
  code: string;
  severity: FraudSeverity;
  message: string;
  amount: number | null;
  paymentFor: string | null;
  paymentMethod: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestPath: string | null;
  payload: Record<string, unknown> | null;
  actionTaken: FraudActionTaken;
  isInternalTestAccount: boolean;
  reviewStatus: FraudReviewStatus;
  reviewedAt: string | null;
  reviewedByAdminId: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FraudEventStats = {
  openCount: number;
  criticalOpen: number;
  last24h: number;
  autoSuspended24h: number;
  recent: FraudEvent[];
};

export type FraudEventsListData = {
  items: FraudEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FraudEventsListParams = {
  page?: number;
  limit?: number;
  severity?: FraudSeverity;
  reviewStatus?: FraudReviewStatus;
  userId?: string;
  code?: string;
  internalTest?: 'true' | 'false';
};

export type ReviewFraudEventPayload = {
  reviewStatus: 'reviewed' | 'dismissed';
  reviewNotes?: string;
};

export type FraudScanResult = {
  startedAt: string;
  finishedAt: string;
  created: number;
  skipped: number;
  errors: Array<{ check: string; message: string }>;
};
