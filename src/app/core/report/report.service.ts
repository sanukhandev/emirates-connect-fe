import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateReportPayload, ReportResponse } from './report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);

  createReport(payload: CreateReportPayload): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${environment.apiBaseUrl}/reports`, payload);
  }
}
