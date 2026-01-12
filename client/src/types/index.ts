export type DocumentType = 'WRITTEN' | 'UPLOADED';
export type DocumentStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VOIDED';
export type RecipientStatus = 'PENDING' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED';
export type FieldType = 'SIGNATURE' | 'INITIALS' | 'DATE' | 'TEXT' | 'CHECKBOX';
export type UserRole = 'USER' | 'MANAGER' | 'SUPER_ADMIN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  managerId?: string;
  manager?: User;
  createdAt?: string;
  _count?: { documents: number };
}

export interface Document {
  id: string;
  title: string;
  documentType: DocumentType;
  htmlContent?: string;
  originalFilename?: string;
  pdfPath?: string;
  pdfData?: string;
  completedPdfPath?: string;
  pageCount: number;
  status: DocumentStatus;
  approvalStatus?: ApprovalStatus;
  managerFeedback?: string;
  reviewedById?: string;
  reviewedBy?: User;
  reviewedAt?: string;
  expiresAt?: string;
  completedAt?: string;
  userId: string;
  user?: User;
  recipients: Recipient[];
  fields: SignatureField[];
  createdAt: string;
  updatedAt: string;
  _count?: { fields: number };
}

export interface Recipient {
  id: string;
  documentId: string;
  name: string;
  email: string;
  signingOrder: number;
  accessToken: string;
  status: RecipientStatus;
  viewedAt?: string;
  signedAt?: string;
  fields?: SignatureField[];
}

export interface SignatureField {
  id: string;
  documentId: string;
  recipientId: string;
  fieldType: FieldType;
  pageNumber: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  isRequired: boolean;
  value?: string;
  completedAt?: string;
}

export interface AuditLog {
  id: string;
  documentId: string;
  action: string;
  actorEmail?: string;
  actorName?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
