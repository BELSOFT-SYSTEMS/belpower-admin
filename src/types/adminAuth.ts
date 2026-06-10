export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'support'
  | 'content_manager'
  | 'finance';

export type AdminProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  allAccess: boolean;
  permissions: string[];
};

export type LoginSuccessData = {
  token: string;
  user?: AdminProfile;
  admin?: AdminProfile;
};

export type OtpPendingData = {
  email: string;
  expiresAt: string;
  adminId?: string;
};

export type LoginResult =
  | { step: 'done'; token: string; profile: AdminProfile }
  | { step: 'otp'; email: string; expiresAt: string; adminId?: string };

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  error?: string | ApiErrorPayload;
  details?: {
    requiresSetup?: boolean;
    email?: string;
  };
  attempts?: number;
};
