export type VerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export type UserVerificationDocumentType = 'identity_document' | 'proof_of_professional_identity' | 'other_supporting_document';
export type BusinessVerificationDocumentType = 'trade_licence' | 'certificate_of_incorporation' | 'proof_of_business' | 'other_supporting_document';

export interface VerificationDocumentMetadata {
  id: number;
  document_type: string;
  original_filename: string | null;
  mime_type: string;
  size: number;
  uploaded_at: string | null;
}

export interface VerificationRequestSummary {
  id: number;
  status: VerificationStatus;
  data: Record<string, string | null> | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  documents: VerificationDocumentMetadata[];
}

export interface VerificationStatusResponse {
  status: VerificationStatus;
  request: VerificationRequestSummary | null;
}

export interface VerificationUpload {
  file: File;
  documentType: UserVerificationDocumentType | BusinessVerificationDocumentType;
}

export interface UserVerificationSubmission {
  legal_name: string;
  documents: VerificationUpload[];
}

export interface BusinessVerificationSubmission {
  legal_business_name: string;
  registration_number: string;
  licence_number: string;
  issuing_authority: string;
  documents: VerificationUpload[];
}
