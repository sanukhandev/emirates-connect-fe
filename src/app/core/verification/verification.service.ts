import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  BusinessVerificationSubmission,
  UserVerificationSubmission,
  VerificationRequestSummary,
  VerificationStatusResponse,
  VerificationUpload,
} from './verification.models';

interface StatusEnvelope {
  data: VerificationStatusResponse;
}

@Injectable({ providedIn: 'root' })
export class VerificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/verification`;

  getUserVerificationStatus(): Observable<VerificationStatusResponse> {
    return this.http.get<StatusEnvelope>(`${this.baseUrl}/user`).pipe(map((response) => response.data));
  }

  submitUserVerification(payload: UserVerificationSubmission): Observable<VerificationRequestSummary> {
    return this.http.post<VerificationRequestSummary>(`${this.baseUrl}/user`, this.formData({
      legal_name: payload.legal_name,
      documents: payload.documents,
    }));
  }

  getBusinessVerificationStatus(slug: string): Observable<VerificationStatusResponse> {
    return this.http.get<StatusEnvelope>(`${this.baseUrl}/business/${encodeURIComponent(slug)}`).pipe(map((response) => response.data));
  }

  submitBusinessVerification(slug: string, payload: BusinessVerificationSubmission): Observable<VerificationRequestSummary> {
    return this.http.post<VerificationRequestSummary>(`${this.baseUrl}/business/${encodeURIComponent(slug)}`, this.formData({
      legal_business_name: payload.legal_business_name,
      registration_number: payload.registration_number,
      licence_number: payload.licence_number,
      issuing_authority: payload.issuing_authority,
      documents: payload.documents,
    }));
  }

  private formData(fields: Record<string, string | VerificationUpload[]>): FormData {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (typeof value === 'string') {
        form.append(key, value);
        return;
      }
      value.forEach((upload) => {
        form.append('document_types[]', upload.documentType);
        form.append('documents[]', upload.file, upload.file.name);
      });
    });
    return form;
  }
}
